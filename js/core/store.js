/* Almacenamiento local: IndexedDB con respaldo en memoria.
   Si IndexedDB no está disponible (modo privado estricto, file:// en algún navegador,
   cuota llena), la app sigue funcionando en memoria y avisa para descargar una copia. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  var DB_NAME = 'mi-cuaderno';
  var DB_VERSION = 2; // v2: images (stickers propios y dibujos) y files (adjuntos)
  var STORES = {
    meta: { keyPath: 'key' },
    days: { keyPath: 'date' },
    activities: { keyPath: 'id', indexes: [['date', 'date'], ['routineId', 'routineId']] },
    routines: { keyPath: 'id' },
    pages: { keyPath: 'id', indexes: [['updatedAt', 'updatedAt']] },
    images: { keyPath: 'id' },
    files: { keyPath: 'id', indexes: [['owner', 'owner']] }
  };
  var STORE_NAMES = Object.keys(STORES);

  /* ---------- backend en memoria ---------- */
  function memoryBackend() {
    var data = {};
    STORE_NAMES.forEach(function (s) { data[s] = new Map(); });
    function keyOf(store, value) { return value[STORES[store].keyPath]; }
    return {
      kind: 'memory',
      get: function (s, k) { return Promise.resolve(MC.clone(data[s].get(k))); },
      getAll: function (s) { return Promise.resolve(MC.clone(Array.from(data[s].values()))); },
      getAllByIndex: function (s, index, value) {
        return Promise.resolve(MC.clone(Array.from(data[s].values()).filter(function (v) { return v[index] === value; })));
      },
      getRange: function (s, index, lo, hi) {
        return Promise.resolve(MC.clone(Array.from(data[s].values()).filter(function (v) {
          var x = index ? v[index] : keyOf(s, v);
          return x >= lo && x <= hi;
        })));
      },
      put: function (s, v) { data[s].set(keyOf(s, v), MC.clone(v)); return Promise.resolve(v); },
      del: function (s, k) { data[s].delete(k); return Promise.resolve(); },
      replaceAll: function (payload) {
        STORE_NAMES.forEach(function (s) {
          data[s].clear();
          (payload[s] || []).forEach(function (v) { data[s].set(keyOf(s, v), MC.clone(v)); });
        });
        return Promise.resolve();
      }
    };
  }

  /* ---------- backend IndexedDB ---------- */
  function req(r) {
    return new Promise(function (resolve, reject) {
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }

  function txDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error || new Error('Transacción abortada')); };
    });
  }

  function openIDB() {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
      var open;
      try { open = root.indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
      open.onupgradeneeded = function () {
        var db = open.result;
        STORE_NAMES.forEach(function (name) {
          var def = STORES[name];
          var os = db.objectStoreNames.contains(name)
            ? open.transaction.objectStore(name)
            : db.createObjectStore(name, { keyPath: def.keyPath });
          (def.indexes || []).forEach(function (ix) {
            if (!os.indexNames.contains(ix[0])) os.createIndex(ix[0], ix[1], { unique: false });
          });
        });
      };
      open.onsuccess = function () { resolve(open.result); };
      open.onerror = function () { reject(open.error); };
      open.onblocked = function () { reject(new Error('La base está bloqueada por otra pestaña')); };
    });
  }

  function idbBackend(db) {
    db.onversionchange = function () { db.close(); MC.emit('store:versionchange'); };
    function os(s, mode) { return db.transaction(s, mode || 'readonly').objectStore(s); }
    return {
      kind: 'indexeddb',
      get: function (s, k) { return req(os(s).get(k)); },
      getAll: function (s) { return req(os(s).getAll()); },
      getAllByIndex: function (s, index, value) { return req(os(s).index(index).getAll(value)); },
      getRange: function (s, index, lo, hi) {
        var range = root.IDBKeyRange.bound(lo, hi);
        var store = os(s);
        return req(index ? store.index(index).getAll(range) : store.getAll(range));
      },
      put: function (s, v) {
        var tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).put(v);
        return txDone(tx).then(function () { return v; });
      },
      del: function (s, k) {
        var tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).delete(k);
        return txDone(tx);
      },
      replaceAll: function (payload) {
        var tx = db.transaction(STORE_NAMES, 'readwrite');
        STORE_NAMES.forEach(function (s) {
          var store = tx.objectStore(s);
          store.clear();
          (payload[s] || []).forEach(function (v) { store.put(v); });
        });
        return txDone(tx);
      }
    };
  }

  /* ---------- API pública ---------- */
  var backend = null;
  var channel = null;

  function broadcast(what) {
    MC.emit('store:changed', what);
    if (channel) { try { channel.postMessage(what); } catch (e) { /* noop */ } }
  }

  function wrapWrite(p, what) {
    return p.then(function (v) { broadcast(what); return v; }, function (err) {
      MC.emit('store:error', err);
      throw err;
    });
  }

  MC.store = {
    STORE_NAMES: STORE_NAMES,
    init: function (opts) {
      opts = opts || {};
      if (root.BroadcastChannel && root.document && !channel) {
        try {
          channel = new root.BroadcastChannel('mi-cuaderno');
          channel.onmessage = function (e) { MC.emit('store:remote', e.data); };
        } catch (e) { channel = null; }
      }
      if (opts.memory) { backend = memoryBackend(); return Promise.resolve(backend.kind); }
      return openIDB().then(function (db) {
        backend = idbBackend(db);
        // Pedimos almacenamiento persistente (el navegador puede decir que no; está bien).
        if (root.navigator && navigator.storage && navigator.storage.persist) {
          navigator.storage.persisted().then(function (p) { if (!p) navigator.storage.persist().catch(function () {}); }).catch(function () {});
        }
        return backend.kind;
      }).catch(function (err) {
        console.warn('[MI CUADERNO] IndexedDB no disponible, uso memoria:', err);
        backend = memoryBackend();
        MC.emit('store:fallback', err);
        return backend.kind;
      });
    },
    kind: function () { return backend ? backend.kind : null; },
    get: function (s, k) { return backend.get(s, k); },
    getAll: function (s) { return backend.getAll(s); },
    getAllByIndex: function (s, i, v) { return backend.getAllByIndex(s, i, v); },
    getRange: function (s, i, lo, hi) { return backend.getRange(s, i, lo, hi); },
    put: function (s, v) { return wrapWrite(backend.put(s, v), { store: s }); },
    del: function (s, k) { return wrapWrite(backend.del(s, k), { store: s }); },
    replaceAll: function (payload) { return wrapWrite(backend.replaceAll(payload), { store: '*' }); },
    dumpAll: function () {
      var out = {};
      return Promise.all(STORE_NAMES.map(function (s) {
        return backend.getAll(s).then(function (rows) { out[s] = rows; });
      })).then(function () { return out; });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
