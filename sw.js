/* MI CUADERNO — service worker. Solo corre cuando la app se sirve por http(s).
   Guarda en caché el “cuaderno vacío” (HTML, CSS, JS, fuentes, íconos). Los datos personales
   NO pasan por acá: viven en IndexedDB. Al cambiar cualquier archivo de SHELL, subir CACHE_VERSION. */
'use strict';

var CACHE_VERSION = 'mi-cuaderno-v54';
var SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/fonts.css', 'css/tokens.css', 'css/base.css', 'css/notebook.css', 'css/components.css', 'css/views.css', 'css/print.css',
  'js/core/ns.js', 'js/cloud.js', 'js/core/sections.js', 'js/core/media.js', 'js/core/history.js', 'js/core/dates.js', 'js/core/routes.js', 'js/core/recurrence.js', 'js/core/store.js', 'js/sync.js', 'js/core/theme.js', 'js/core/brush.js', 'js/core/templates.js', 'js/core/model.js', 'js/core/backup.js',
  'js/core/zip.js', 'js/core/exporters.js', 'js/core/insights.js',
  'js/ui/icons.js', 'js/ui/stickers.js', 'js/ui/motion.js', 'js/ui/theme.js', 'js/ui/components.js', 'js/ui/access.js', 'js/ui/memories.js', 'js/ui/privacy.js', 'js/ui/repeat.js', 'js/ui/sheet.js', 'js/ui/activity.js', 'js/ui/images.js', 'js/ui/draw.js', 'js/ui/scrapbook.js', 'js/ui/scenes.js',
  'js/views/cover.js', 'js/views/onboarding.js', 'js/views/today.js', 'js/views/calendar.js', 'js/views/week.js', 
  'js/views/pages.js', 'js/views/sheets.js', 'js/views/year.js', 'js/views/settings.js', 'js/views/print.js',
  'js/notify.js', 'js/pwa.js', 'js/app.js',
  'assets/icons/favicon.ico', 'assets/icons/favicon.svg', 'assets/icons/favicon-16x16.png', 'assets/icons/favicon-32x32.png',
  'assets/icons/apple-touch-icon.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png', 'assets/icons/icon-maskable-512.png',
  'assets/icons/notification-icon.png', 'assets/icons/notification-badge.png', 'assets/icons/shortcut-hoy.png'
];

// El HTML del cuaderno se guarda solo si llegó tal cual: en la nube, sin sesión, el servidor lo redirige a
// /entrar (el service worker se registra también desde ahí) y una respuesta redirigida no sirve para navegar.
var PAGES = ['./', 'index.html'];
function usable(res) { return !!res && res.ok && !res.redirected && res.type !== 'opaqueredirect'; }

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    return Promise.all([
      cache.addAll(SHELL.filter(function (f) { return PAGES.indexOf(f) === -1; })),
      Promise.all(PAGES.map(function (f) {
        return fetch(f, { cache: 'reload', redirect: 'manual' }).then(function (res) { if (usable(res)) return cache.put(f, res); }, function () {});
      }))
    ]);
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('mi-cuaderno-') === 0 && k !== CACHE_VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'skipWaiting') self.skipWaiting();
});

// Cache-first para el shell; navegación al cuaderno → index.html (funciona sin conexión).
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Solo el cuaderno (raíz del alcance o index.html). En la nube, /entrar y /cuenta van siempre a la red.
    var scopePath = new URL(self.registration.scope).pathname;
    if (url.pathname !== scopePath && url.pathname !== scopePath + 'index.html') return;
    event.respondWith(caches.match('index.html').then(function (hit) {
      if (usable(hit)) return hit;
      // Sin copia buena: la red decide (en la nube, sin sesión, lleva a /entrar). Si trae el cuaderno, queda guardado.
      return fetch(req).then(function (res) {
        if (usable(res)) { var copy = res.clone(); caches.open(CACHE_VERSION).then(function (c) { c.put('index.html', copy); }); }
        return res;
      });
    }).catch(function () { return caches.match('index.html').then(function (hit) { return usable(hit) ? hit : Response.error(); }); }));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      // Solo guardamos archivos propios del shell que falten (nunca respuestas con datos).
      if (res.ok && /\.(css|js|png|svg|ico|woff2|webmanifest)$/.test(url.pathname)) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
      }
      return res;
    });
  }));
});

/* Avisos Web Push de la nube (etapa B, D37). El servidor manda solo textos genéricos, nunca contenido escrito
   por la persona; si el aviso llega sin datos, se muestra uno neutro. */
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  event.waitUntil(self.registration.showNotification(data.title || 'MI CUADERNO', {
    body: data.body || 'Tu cuaderno está acá.',
    icon: 'assets/icons/notification-icon.png',
    badge: 'assets/icons/notification-badge.png',
    tag: data.tag || 'mi-cuaderno',
    data: { url: typeof data.url === 'string' && data.url.charAt(0) === '/' ? '.' + data.url : './#/hoy' }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = new URL((event.notification.data && event.notification.data.url) || './#/hoy', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) {
        list[i].navigate && list[i].navigate(target).catch(function () {});
        return list[i].focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});

/* Recordatorios con el cuaderno cerrado (solo Chromium instalado, Periodic Background Sync).
   Lee la configuración desde IndexedDB; nunca incluye contenido escrito por la persona. */
function readMeta() {
  return new Promise(function (resolve) {
    var open = indexedDB.open('mi-cuaderno');
    // Si el cuaderno todavía no existe, no se crea una base vacía desde acá.
    open.onupgradeneeded = function () { open.transaction.abort(); };
    open.onerror = function () { resolve(null); };
    open.onsuccess = function () {
      var db = open.result;
      // Nunca retener la base: si el cuaderno se actualiza, la conexión se suelta enseguida.
      db.onversionchange = function () { db.close(); };
      if (!db.objectStoreNames.contains('meta')) { db.close(); resolve(null); return; }
      var out = {};
      var tx = db.transaction(['meta', 'days'], 'readonly');
      var meta = tx.objectStore('meta');
      ['settings', 'notifyLog', 'lastOpenedDay'].forEach(function (k) {
        meta.get(k).onsuccess = function (e) { out[k] = e.target.result ? e.target.result.value : null; };
      });
      var d = new Date();
      var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      tx.objectStore('days').get(today).onsuccess = function (e) { out.today = e.target.result || null; };
      tx.oncomplete = function () { out.todayKey = today; out.db = db; resolve(out); };
      tx.onerror = function () { db.close(); resolve(null); };
    };
  });
}

function closeDb(m) { try { if (m && m.db) m.db.close(); } catch (e) { /* ya cerrada */ } }

/** ¿Ya anotó cómo se sintió? Lee la forma vieja (ánimo 1–5) y la nueva (emociones escritas). */
function felt(part) { return !!(part && (Array.isArray(part.feelings) ? part.feelings.length : part.mood)); }

function saveLog(db, log) {
  return new Promise(function (resolve) {
    var tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'notifyLog', value: log });
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}

var SW_MESSAGES = {
  morning: ['☀ Buenos días', 'Tu cuaderno tiene una página nueva esperando. ¿Cómo empezaste hoy?'],
  evening: ['☾ Antes de terminar el día…', '¿Cómo terminó tu día? Guardá una pequeña línea.'],
  comeback: ['Tu cuaderno sigue acá', 'Cuando quieras, podés volver.']
};

self.addEventListener('periodicsync', function (event) {
  if (event.tag !== 'mc-reminders') return;
  var meta = null;
  event.waitUntil(readMeta().then(function (m) {
    meta = m;
    if (!m || !m.settings || !m.settings.notify || !m.settings.notify.enabled || m.settings.notify.mode === 'silencioso') return;
    var n = m.settings.notify;
    var log = m.notifyLog || {};
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var toMin = function (t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); };
    var kind = null;
    if (n.comeback && m.lastOpenedDay && log.comeback !== m.todayKey) {
      var last = new Date(m.lastOpenedDay + 'T12:00:00');
      if ((now - last) / 864e5 >= 4) kind = 'comeback';
    }
    if (!kind && n.morning.on && log.morning !== m.todayKey && mins >= toMin(n.morning.time) && mins < toMin(n.morning.time) + 180 && !felt(m.today && m.today.morning)) kind = 'morning';
    if (!kind && n.evening.on && log.evening !== m.todayKey && mins >= toMin(n.evening.time) && mins < toMin(n.evening.time) + 180 && !felt(m.today && m.today.evening)) kind = 'evening';
    if (!kind) return;
    log[kind] = m.todayKey;
    return self.registration.showNotification(SW_MESSAGES[kind][0], {
      body: SW_MESSAGES[kind][1], icon: 'assets/icons/notification-icon.png', badge: 'assets/icons/notification-badge.png',
      tag: 'mc-' + kind, silent: n.mode !== 'normal', data: { url: './#/hoy' }, lang: 'es-AR'
    }).then(function () { return saveLog(m.db, log); });
  }).then(function () { closeDb(meta); }, function () { closeDb(meta); }));
});
