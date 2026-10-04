/* Almacenamiento local: IndexedDB con respaldo en memoria.
   Si IndexedDB no está disponible (modo privado estricto, file:// en algún navegador,
   cuota llena), la app sigue funcionando en memoria y avisa para descargar una copia. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  var DB_NAME = 'mi-cuaderno';
  // v2: images (stickers propios y dibujos) y files (adjuntos).
  // v3 (esquema v5, D34): weeks (semana-planner), templates (plantillas de hojas), marks (referencias, victorias),
  // índice pages.date; files.updatedAt completado. Puramente aditiva.
  var DB_VERSION = 3;
  // Con cuentas (js/cloud.js, etapa B) cada persona tiene su base: `mi-cuaderno@<id>`. Sin cuentas, la de siempre.
  function dbName() { return DB_NAME + ((MC.cloud && MC.cloud.suffix) || ''); }
  var STORES = {
    meta: { keyPath: 'key' },
    days: { keyPath: 'date' },
    activities: { keyPath: 'id', indexes: [['date', 'date'], ['routineId', 'routineId']] },
    routines: { keyPath: 'id' },
    pages: { keyPath: 'id', indexes: [['updatedAt', 'updatedAt'], ['date', 'date']] },
    images: { keyPath: 'id' },
    files: { keyPath: 'id', indexes: [['owner', 'owner']] },
    weeks: { keyPath: 'week' },
    templates: { keyPath: 'id' },
    marks: { keyPath: 'id', indexes: [['sourceId', 'sourceId']] }
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
      var blocked = false;
      try { open = root.indexedDB.open(dbName(), DB_VERSION); } catch (e) { reject(e); return; }
      open.onupgradeneeded = function (e) {
        var db = open.result;
        var hadFiles = db.objectStoreNames.contains('files');
        STORE_NAMES.forEach(function (name) {
          var def = STORES[name];
          var os = db.objectStoreNames.contains(name)
            ? open.transaction.objectStore(name)
            : db.createObjectStore(name, { keyPath: def.keyPath });
          (def.indexes || []).forEach(function (ix) {
            if (!os.indexNames.contains(ix[0])) os.createIndex(ix[0], ix[1], { unique: false });
          });
        });
        // v3: los adjuntos viejos no tenían updatedAt (lo necesita “gana el más nuevo” de la etapa B).
        // Todo pasa dentro de esta misma transacción: si algo falla, la base queda como estaba.
        if (e.oldVersion < 3 && hadFiles) {
          open.transaction.objectStore('files').openCursor().onsuccess = function (ev) {
            var cur = ev.target.result;
            if (!cur) return;
            var f = cur.value;
            if (f && !f.updatedAt && f.createdAt) { f.updatedAt = f.createdAt; cur.update(f); }
            cur.continue();
          };
        }
      };
      open.onsuccess = function () {
        if (blocked) MC.emit('store:unblocked');
        resolve(open.result);
      };
      open.onerror = function () { reject(open.error); };
      // Otra pestaña con una versión anterior todavía tiene la base abierta. No se cae a memoria
      // (se escribiría en el aire): se espera a que la suelte y mientras tanto se avisa.
      open.onblocked = function () { blocked = true; MC.emit('store:blocked'); };
    });
  }

  function idbBackend(db) {
    var pending = [];     // operaciones en curso (un guardado lee y después escribe)
    var lastOp = 0;
    var closed = false;

    function track(p) {
      lastOp = Date.now();
      pending.push(p);
      var done = function () { pending = pending.filter(function (x) { return x !== p; }); };
      p.then(done, done);
      return p;
    }
    function closedError() { return Promise.reject(new Error('El cuaderno se está actualizando en otra pestaña.')); }
    /** Espera a que no haya operaciones en curso ni recién empezadas (mín. 200 ms, máx. 2 s). */
    function settle() {
      return new Promise(function (resolve) {
        var t0 = Date.now();
        (function check() {
          var now = Date.now();
          if ((now - t0 > 200 && !pending.length && now - lastOp > 120) || now - t0 > 2000) { resolve(); return; }
          setTimeout(check, 40);
        })();
      });
    }

    // Otra pestaña necesita actualizar la base: primero se guarda lo pendiente (el app hace flush
    // al enterarse) y recién después se cierra. Al cerrarse, el app recarga.
    db.onversionchange = function () {
      if (closed) return;
      MC.emit('store:versionchange');
      setTimeout(function () {
        settle().then(function () {
          closed = true;
          db.close();
          MC.emit('store:closed');
        });
      }, 0);
    };
    function os(s, mode) { return db.transaction(s, mode || 'readonly').objectStore(s); }
    return {
      kind: 'indexeddb',
      get: function (s, k) { return closed ? closedError() : track(req(os(s).get(k))); },
      getAll: function (s) { return closed ? closedError() : track(req(os(s).getAll())); },
      getAllByIndex: function (s, index, value) { return closed ? closedError() : track(req(os(s).index(index).getAll(value))); },
      getRange: function (s, index, lo, hi) {
        if (closed) return closedError();
        var range = root.IDBKeyRange.bound(lo, hi);
        var store = os(s);
        return track(req(index ? store.index(index).getAll(range) : store.getAll(range)));
      },
      put: function (s, v) {
        if (closed) return closedError();
        var tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).put(v);
        return track(txDone(tx).then(function () { return v; }));
      },
      del: function (s, k) {
        if (closed) return closedError();
        var tx = db.transaction(s, 'readwrite');
        tx.objectStore(s).delete(k);
        return track(txDone(tx));
      },
      replaceAll: function (payload) {
        if (closed) return closedError();
        var tx = db.transaction(STORE_NAMES, 'readwrite');
        STORE_NAMES.forEach(function (s) {
          var store = tx.objectStore(s);
          store.clear();
          (payload[s] || []).forEach(function (v) { store.put(v); });
        });
        return track(txDone(tx));
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
    // Stores que no van en la copia de seguridad (p. ej. la cola de sincronización de la etapa B). Hoy: ninguno.
    INTERNAL_STORES: [],
    init: function (opts) {
      opts = opts || {};
      if (root.BroadcastChannel && root.document && !channel) {
        try {
          channel = new root.BroadcastChannel(dbName());
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
        // La base es de una versión más nueva del cuaderno (otra pestaña ya se actualizó): este código
        // no la puede leer. Nunca memoria acá: se perdería lo que se escriba. El app pide recargar.
        if (err && err.name === 'VersionError') throw err;
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
