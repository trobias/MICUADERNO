/* Sincronización con la nube (etapa B5, D38). Solo con cuentas (js/cloud.js); en file:// no hace nada.
   - Dueña (`mode: 'owner'`): su cuaderno sigue en IndexedDB y cada cambio guardado se sube a la nube, partido
     por sección (js/core/sections.js). Lo que cambian otras personas con permiso de editar se trae y se aplica.
   - Invitada (`mode: 'guest'`): abre el cuaderno de quien le dio permiso, en memoria (sin copia local, D36).
     Ve solo las secciones permitidas; si intenta cambiar algo que no puede, se le dice con amabilidad.
   Fotos, dibujos y adjuntos (NB1, D43): viaja la ficha partida por sección y el contenido aparte, en pedazos,
   a Storage privado por el servidor (js/core/media.js). Se carga después de store.js. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var C = MC.cloud;
  if (!C || !C.mode || C.leaving || !MC.store) { MC.sync = { on: false }; return; }

  var S = MC.sections;
  var MD = MC.media;
  var store = MC.store;
  var guest = C.mode === 'guest';
  var owner = C.view;
  var SYNC = S.STORES.slice();
  var SEP = '\u0001';
  var K = { out: 'sync.outbox.' + owner, cursor: 'sync.cursor.' + owner, uploaded: 'sync.uploaded.' + owner,
    sent: 'sync.media.' + owner,        // { 'images/<id>': versión ya subida }
    wait: 'sync.mediaWait.' + owner };  // fichas que llegaron sin poder bajar su contenido (se reintentan)
  var applying = 0;
  var ready = false; // hasta que la base abre, no se sube ni se trae nada
  var flushTimer = null, flushing = false, retryMs = 2000;
  var status = MC.sync = { on: true, mode: C.mode, owner: owner, lastPush: null, lastPull: null, error: null };

  function syncs(s, key) { return SYNC.indexOf(s) !== -1 && (s !== 'meta' || key === 'settings'); }

  /* ---------- permisos de la invitada ---------- */
  var share = null; // { owner, name, sections: { emociones: 'ver' | 'editar' } }
  var shareReady = new Promise(function (resolve) {
    if (!guest) { resolve(); return; }
    if (C.share) { share = C.share; resolve(); return; }
    MC.on('cloud:me', function () { share = C.share; resolve(); });
    setTimeout(resolve, 6000); // sin red: se sigue sin permisos (solo mirar lo que haya)
  });
  function canEdit(s, key) {
    if (!guest) return true;
    if (s === 'meta' && key !== 'settings') return true; // lo del dispositivo (última apertura, avisos vistos) queda local
    var lv = (share && share.sections) || {};
    return S.sectionsOf(s).some(function (sec) { return lv[sec] === 'editar'; });
  }
  function readonlyError() {
    var e = new Error('Este cuaderno es de ' + ((share && share.name) || 'otra persona') + ': esta parte la podés mirar, pero no cambiar.');
    e.code = 'MC_READONLY';
    return e;
  }

  /* ---------- cola de salida (solo claves: el contenido se lee de la base al subir) ---------- */
  function outbox() { return MC.ui.get(K.out, []); }
  function enqueue(s, key) {
    if (!syncs(s, key)) return;
    if (s === 'meta' && guest && !canEdit('meta', 'settings')) return;
    var id = s + SEP + key, q = outbox();
    if (q.indexOf(id) === -1) { q.push(id); MC.ui.set(K.out, q); }
    schedule(1500);
  }
  function schedule(ms) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, ms);
  }

  /* ---------- envolver las escrituras del cuaderno ---------- */
  var put0 = store.put, del0 = store.del, replace0 = store.replaceAll, init0 = store.init;
  store.put = function (s, v) {
    var skip = applying > 0, key = S.keyOf(s, v);
    if (!skip && !canEdit(s, key)) { var e = readonlyError(); MC.emit('store:error', e); return Promise.reject(e); }
    return put0.call(store, s, v).then(function (r) { if (!skip) enqueue(s, key); return r; });
  };
  store.del = function (s, k) {
    var skip = applying > 0;
    if (!skip && !canEdit(s, k)) { var e = readonlyError(); MC.emit('store:error', e); return Promise.reject(e); }
    return del0.call(store, s, k).then(function (r) { if (!skip) enqueue(s, k); return r; });
  };
  store.replaceAll = function (payload) {
    if (guest && !applying) { var e = readonlyError(); MC.emit('store:error', e); return Promise.reject(e); }
    return replace0.call(store, payload).then(function (r) { if (!applying) enqueueAll(); return r; });
  };
  function enqueueAll() {
    return Promise.all(SYNC.map(function (s) {
      return store.getAll(s).then(function (rows) {
        var q = outbox();
        rows.forEach(function (r) { var key = S.keyOf(s, r); if (syncs(s, key) && q.indexOf(s + SEP + key) === -1) q.push(s + SEP + key); });
        MC.ui.set(K.out, q);
      });
    })).then(function () { schedule(300); });
  }
  function quietly(fn) {
    applying++;
    var p;
    try { p = Promise.resolve(fn()); } catch (e) { p = Promise.reject(e); }
    return p.then(function (v) { applying--; return v; }, function (e) { applying--; throw e; });
  }

  /* ---------- subir ---------- */
  function api(url, opts) {
    return root.fetch(url, Object.assign({ credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, opts || {}))
      .then(function (res) {
        if (res.status === 401) { status.error = 'sesion'; throw new Error('sesión'); }
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'error ' + res.status);
          return data;
        });
      });
  }
  function flush() {
    if (!ready || flushing || !root.navigator.onLine) return Promise.resolve();
    var q = outbox();
    if (!q.length) return Promise.resolve();
    flushing = true;
    var batch = q.slice(0, 100);
    // De a uno: una foto primero sube su contenido y recién después su ficha (sin contenido) va en el lote.
    var changes = [];
    return batch.reduce(function (chain, id) {
      return chain.then(function () {
        var i = id.indexOf(SEP), s = id.slice(0, i), key = id.slice(i + 1);
        return store.get(s, key).then(function (rec) {
          if (!MD.isMedia(s) || !rec) { changes.push({ store: s, key: key, record: rec || null }); return; }
          return uploadMedia(s, key, rec).then(function () { changes.push({ store: s, key: key, record: MD.strip(s, rec) }); });
        });
      });
    }, Promise.resolve()).then(function () {
      var body = { changes: changes };
      if (guest) body.owner = owner;
      return api('/api/sync/push', { method: 'POST', body: JSON.stringify(body) });
    }).then(function (res) {
      var rest = outbox().filter(function (id) { return batch.indexOf(id) === -1; });
      MC.ui.set(K.out, rest);
      status.lastPush = new Date().toISOString();
      status.error = null;
      retryMs = 2000;
      if (!rest.length && !guest) MC.ui.set(K.uploaded, true);
      if (guest && res.skipped && res.skipped.length) {
        MC.c && MC.c.toast && MC.c.toast(readonlyError().message);
        pull(true); // vuelve a mostrar lo que de verdad quedó guardado
      }
      flushing = false;
      if (rest.length) schedule(200);
    }).catch(function (err) {
      flushing = false;
      status.error = String(err && err.message || err);
      if (status.error !== 'sesión') { schedule(retryMs); retryMs = Math.min(retryMs * 2, 120000); }
    });
  }

  /* ---------- contenido de fotos y adjuntos (NB1) ---------- */
  function mediaUrl(s, key, n) {
    return '/api/media?owner=' + encodeURIComponent(owner) + '&store=' + s + '&id=' + encodeURIComponent(key) + '&n=' + n;
  }
  /** Sube los pedazos si esa versión todavía no se subió desde este dispositivo. */
  function uploadMedia(s, key, rec) {
    var body = rec[MD.FIELD[s]];
    if (typeof body !== 'string' || !body) return Promise.resolve();
    var v = MD.version(rec, s), sent = MC.ui.get(K.sent, {});
    if (sent[s + '/' + key] === v) return Promise.resolve();
    var parts = MD.split(body);
    return parts.reduce(function (chain, text, n) {
      return chain.then(function () {
        return api('/api/media', { method: 'PUT', body: JSON.stringify({ owner: guest ? owner : undefined, store: s, id: key, n: n, text: text }) });
      });
    }, Promise.resolve()).then(function () {
      var now = MC.ui.get(K.sent, {});
      now[s + '/' + key] = v;
      MC.ui.set(K.sent, now);
    });
  }
  /** Baja y junta los pedazos de una ficha. Resuelve con el contenido o null si todavía no se puede. */
  function downloadMedia(s, key, meta) {
    if (!MD.validMeta(meta)) return Promise.resolve(null);
    var n = [];
    for (var i = 0; i < meta.chunks; i++) n.push(i);
    return Promise.all(n.map(function (i) { return api(mediaUrl(s, key, i)).then(function (r) { return r.text; }); }))
      .then(function (texts) { var body = texts.join(''); return body.length === meta.length ? body : null; }, function () { return null; });
  }
  function waitList() { return MC.ui.get(K.wait, []); }
  function setWait(id, on) {
    var w = waitList().filter(function (x) { return x !== id; });
    if (on) w.push(id);
    MC.ui.set(K.wait, w);
  }
  /** Una ficha que llegó: si el contenido local ya es esa versión, se conserva; si no, se baja. */
  function withMedia(s, key, rec, local) {
    var meta = rec.media;
    if (!meta) return Promise.resolve(rec);
    if (local && typeof local[MD.FIELD[s]] === 'string' && MD.version(local, s) === meta.v) {
      rec[MD.FIELD[s]] = local[MD.FIELD[s]];
      return Promise.resolve(rec);
    }
    return downloadMedia(s, key, meta).then(function (body) {
      if (body === null) return null;
      rec[MD.FIELD[s]] = body;
      return rec;
    });
  }
  /** Reintenta las fichas que quedaron sin contenido (la red se cortó, o el pedazo todavía no había subido). */
  function retryWaiting() {
    var w = waitList();
    if (!w.length) return Promise.resolve(0);
    var got = 0;
    return w.reduce(function (chain, id) {
      return chain.then(function () {
        var i = id.indexOf(SEP), s = id.slice(0, i), key = id.slice(i + 1);
        return api('/api/sync/pull?owner=' + encodeURIComponent(owner) + '&since=1970-01-01T00:00:00Z&store=' + s + '&id=' + encodeURIComponent(key))
          .then(function (res) {
            var mine = (res.parts || []).filter(function (p) { return p.store === s && p.record_id === key; });
            return apply(mine).then(function (n) { got += n; });
          }, function () { /* sin red: se vuelve a intentar */ });
      });
    }, Promise.resolve()).then(function () { return got; });
  }

  /* ---------- traer ---------- */
  var pulling = null;
  function pull(full, force) {
    if (!ready && !force) return Promise.resolve(0);
    if (pulling || !root.fetch) return pulling || Promise.resolve(0);
    var since = full ? '1970-01-01T00:00:00Z' : MC.ui.get(K.cursor, '1970-01-01T00:00:00Z');
    var applied = 0;
    function page(from) {
      return api('/api/sync/pull?owner=' + encodeURIComponent(owner) + '&since=' + encodeURIComponent(from)).then(function (res) {
        var parts = res.parts || [];
        // En el dispositivo de la dueña, lo propio ya está: solo se aplica lo que escribieron otras personas.
        var mine = parts.filter(function (p) { return guest || p.updated_by !== C.person; });
        return apply(mine).then(function (n) {
          applied += n;
          var last = parts.length ? parts[parts.length - 1].updated_at : from;
          if (!full || guest) MC.ui.set(K.cursor, last);
          return res.more ? page(last) : null;
        });
      });
    }
    pulling = page(since).then(function () { return retryWaiting().then(function (n) { applied += n; }); }).then(function () {
      status.lastPull = new Date().toISOString();
      pulling = null;
      if (applied) MC.emit('store:remote', { store: '*', from: 'cloud' });
      return applied;
    }, function (err) {
      pulling = null;
      status.error = String(err && err.message || err);
      return 0;
    });
    return pulling;
  }
  function apply(parts) {
    var groups = {}, order = [];
    parts.forEach(function (p) {
      if (!syncs(p.store, p.record_id)) return;
      var id = p.store + SEP + p.record_id;
      if (!groups[id]) { groups[id] = []; order.push(id); }
      groups[id].push(p);
    });
    var n = 0;
    return order.reduce(function (chain, id) {
      return chain.then(function () {
        var g = groups[id], s = g[0].store, key = g[0].record_id;
        var alive = g.filter(function (p) { return !p.deleted_at; });
        return store.get(s, key).then(function (local) {
          if (!alive.length) return quietly(function () { setWait(id, false); return local ? store.del(s, key) : null; }).then(function () { n++; });
          var rec = S.overlay(s, local, alive.map(function (p) { return { section: p.section, data: p.data }; }));
          if (S.keyOf(s, rec) === undefined) return null; // parte suelta sin su identidad (permiso parcial): no se inventa
          return (MD.isMedia(s) ? withMedia(s, key, rec, local) : Promise.resolve(rec)).then(function (full) {
            // Sin el contenido todavía: se guarda nada y se reintenta (nunca una foto rota).
            if (!full) { setWait(id, true); return; }
            if (MD.isMedia(s)) setWait(id, false);
            return quietly(function () { return store.put(s, full); }).then(function () { n++; });
          });
        });
      });
    }, Promise.resolve()).then(function () { return n; });
  }

  /* ---------- arranque ---------- */
  store.init = function (opts) {
    if (!guest) {
      return init0.call(store, opts).then(function (kind) {
        ready = true;
        var first = !MC.ui.get(K.uploaded, false);
        (first ? enqueueAll() : Promise.resolve()).then(function () { schedule(400); return pull(false); });
        return kind;
      });
    }
    // Invitada: memoria, con el cuaderno compartido traído de la nube antes de dibujar nada.
    return init0.call(store, { memory: true }).then(function (kind) {
      return shareReady.then(function () { return pull(true, true); }).then(function () {
        ready = true;
        return store.get('meta', 'settings');
      }).then(function (row) {
        var value = Object.assign({}, row ? row.value : {}, { onboarded: true, showCover: false });
        return quietly(function () { return put0.call(store, 'meta', { key: 'settings', value: value }); });
      }).then(function () { return kind; });
    });
  };

  /* ---------- aviso de la invitada: de quién es el cuaderno y qué puede hacer ---------- */
  function banner() {
    if (!guest || !root.document.body || root.document.querySelector('.guest-note')) return;
    var lv = (share && share.sections) || {};
    var edit = S.LIST.filter(function (x) { return lv[x.id] === 'editar'; }).map(function (x) { return x.label; });
    var el = root.document.createElement('p');
    el.className = 'guest-note';
    el.setAttribute('role', 'note');
    el.textContent = 'Cuaderno de ' + ((share && share.name) || 'otra persona') + ' · ' +
      (edit.length ? 'podés editar: ' + edit.join(', ').toLowerCase() : 'solo para mirar');
    root.document.body.appendChild(el);
  }
  if (guest) {
    shareReady.then(function () {
      if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', banner); else banner();
    });
  }

  // Mientras está abierto: traer cada tanto (cada 45 s si se ve; al volver a la pestaña o a la red).
  setInterval(function () { if (!root.document.hidden) { pull(false); flush(); } }, 45000);
  root.addEventListener('focus', function () { pull(false); flush(); });
  root.addEventListener('online', function () { flush(); pull(false); });
  root.document.addEventListener('visibilitychange', function () { if (root.document.hidden) flush(); });

  status.flush = flush;
  status.pull = pull;
  status.pending = function () { return outbox().length; };
})(typeof window !== 'undefined' ? window : globalThis);
