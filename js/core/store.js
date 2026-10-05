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
  // v4 (esquema v6, A13, D34 contraer): días sin `mood`, hojas sin `kind/body/items`, ajustes sin nombres de ánimo.
  // Antes de reescribir se guarda una instantánea de lo que cambia (`meta.preV6`) para “Descargar la copia de antes”.
  // v5 (NB2): store interno `outbox`, la cola de cambios para subir a la nube, escrita en la MISMA transacción
  // que el cambio (si el navegador se cierra en el medio, o quedan los dos o ninguno). Aditiva.
  var DB_VERSION = 5;
  var PREV_VERSION = 3;   // si el contrato falla, se abre la base como estaba (v5 se sigue leyendo entera)
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
    marks: { keyPath: 'id', indexes: [['sourceId', 'sourceId']] },
    outbox: { keyPath: 'id' }   // interno (NB2): no va en la copia ni en la papelera
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
      put: function (s, v, q) { data[s].set(keyOf(s, v), MC.clone(v)); if (q) data.outbox.set(q.id, MC.clone(q)); return Promise.resolve(v); },
      del: function (s, k, q) { data[s].delete(k); if (q) data.outbox.set(q.id, MC.clone(q)); return Promise.resolve(); },
      hasStore: function (s) { return !!data[s]; },
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

  /**
   * Contrato v6 dentro de la transacción de actualización (atómico y exclusivo entre pestañas): lee los ajustes
   * (para los nombres de ánimo), guarda la instantánea y reescribe días, hojas y ajustes. Cualquier error aborta
   * la transacción entera y la base queda como estaba.
   */
  function contractV6(tx) {
    var B = MC.backup;
    if (!B || !B.contractRecord) throw new Error('Falta el contrato v6');
    var meta = tx.objectStore('meta');
    var snapshot = { at: new Date().toISOString(), days: [], pages: [], settings: null };
    var guard = function (fn) { return function (ev) { try { fn(ev); } catch (err) { try { tx.abort(); } catch (e) { /* noop */ } } }; };
    meta.get('settings').onsuccess = guard(function (ev) {
      var row = ev.target.result;
      var words = B.moodWords(row && row.value);
      if (row) {
        snapshot.settings = row.value;
        var next = B.contractRecord('meta', row, words);
        if (next) meta.put(next);
      }
      var left = 2;
      function done() { if (--left === 0) meta.put({ key: 'preV6', value: snapshot }); }
      ['days', 'pages'].forEach(function (name) {
        tx.objectStore(name).openCursor().onsuccess = guard(function (e2) {
          var cur = e2.target.result;
          if (!cur) { done(); return; }
          var next = B.contractRecord(name, cur.value, words);
          if (next) { snapshot[name].push(cur.value); cur.update(next); }
          cur.continue();
        });
      });
    });
  }

  function openIDB(version) {
    version = version || DB_VERSION;
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
      var open;
      var blocked = false;
      try { open = root.indexedDB.open(dbName(), version); } catch (e) { reject(e); return; }
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
        // v4: contraer a la forma v6 (solo si había datos de antes; una base nueva ya nace así).
        if (e.oldVersion >= 1 && e.oldVersion < 4 && version >= 4) {
          // Un error acá aborta la transacción (sin excepción suelta): la base queda en la versión anterior.
          try {
            if (root.__mcFailContract) throw new Error('contrato v6 simulado como fallido'); // solo para la prueba de vuelta atrás
            contractV6(open.transaction);
          } catch (err) { open.transaction.abort(); }
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
      // `q` (opcional, NB2): una entrada de la cola de salida que se escribe en la misma transacción.
      put: function (s, v, q) {
        if (closed) return closedError();
        var queued = q && s !== 'outbox' && db.objectStoreNames.contains('outbox');
        var tx = db.transaction(queued ? [s, 'outbox'] : s, 'readwrite');
        tx.objectStore(s).put(v);
        if (queued) tx.objectStore('outbox').put(q);
        return track(txDone(tx).then(function () { return v; }));
      },
      del: function (s, k, q) {
        if (closed) return closedError();
        var queued = q && s !== 'outbox' && db.objectStoreNames.contains('outbox');
        var tx = db.transaction(queued ? [s, 'outbox'] : s, 'readwrite');
        tx.objectStore(s).delete(k);
        if (queued) tx.objectStore('outbox').put(q);
        return track(txDone(tx));
      },
      hasStore: function (s) { return db.objectStoreNames.contains(s); },
      replaceAll: function (payload) {
        if (closed) return closedError();
        var tx = db.transaction(STORE_NAMES.filter(function (s) { return db.objectStoreNames.contains(s); }), 'readwrite');
        STORE_NAMES.forEach(function (s) {
          if (!db.objectStoreNames.contains(s)) return;
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
    STORE_NAMES: STORE_NAMES, DB_VERSION: DB_VERSION,
    // Stores que no van en la copia de seguridad: la cola de salida a la nube (NB2).
    INTERNAL_STORES: ['outbox'],
    init: function (opts) {
      opts = opts || {};
      if (root.BroadcastChannel && root.document && !channel) {
        try {
          channel = new root.BroadcastChannel(dbName());
          channel.onmessage = function (e) { MC.emit('store:remote', e.data); };
        } catch (e) { channel = null; }
      }
      if (opts.memory) { backend = memoryBackend(); return Promise.resolve(backend.kind); }
      return openIDB().catch(function (err) {
        // El contrato v6 no pudo terminar (la transacción se abortó y la base quedó como estaba): se abre la
        // versión anterior, que este código sigue leyendo entera, y se avisa. Se vuelve a intentar la próxima vez.
        if (err && (err.name === 'AbortError' || /contrato/.test(String(err.message)))) {
          MC.emit('store:contract-failed', err);
          return openIDB(PREV_VERSION);
        }
        throw err;
      }).then(function (db) {
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
    put: function (s, v, q) { return wrapWrite(backend.put(s, v, q), { store: s }); },
    del: function (s, k, q) { return wrapWrite(backend.del(s, k, q), { store: s }); },
    /* Cola de salida (NB2): leer y sacar entradas sin avisar al resto del cuaderno (no son cambios de la persona). */
    queueAll: function () { return backend.hasStore('outbox') ? backend.getAll('outbox') : Promise.resolve([]); },
    queuePut: function (q) { return backend.put('outbox', q); },
    /** Saca la entrada solo si sigue siendo la misma que se subió (si el registro cambió de nuevo, queda). */
    queueDone: function (q) {
      return backend.get('outbox', q.id).then(function (cur) { return cur && cur.at === q.at ? backend.del('outbox', q.id) : null; });
    },
    /** ¿Existe este store? (la cola de salida no existe si la base quedó en una versión anterior). */
    hasStore: function (s) { return !!backend && backend.hasStore(s); },
    replaceAll: function (payload) { return wrapWrite(backend.replaceAll(payload), { store: '*' }); },
    dumpAll: function () {
      var out = {};
      return Promise.all(STORE_NAMES.filter(function (s) { return backend.hasStore(s); }).map(function (s) {
        return backend.getAll(s).then(function (rows) { out[s] = rows; });
      })).then(function () { return out; });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
