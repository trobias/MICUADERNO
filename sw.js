/* MI CUADERNO — service worker. Solo corre cuando la app se sirve por http(s).
   Guarda en caché el “cuaderno vacío” (HTML, CSS, JS, fuentes, íconos). Los datos personales
   NO pasan por acá: viven en IndexedDB. Al cambiar cualquier archivo de SHELL, subir CACHE_VERSION. */
'use strict';

var CACHE_VERSION = 'mi-cuaderno-v5';
var SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/fonts.css', 'css/tokens.css', 'css/base.css', 'css/notebook.css', 'css/components.css', 'css/views.css', 'css/print.css',
  'js/core/ns.js', 'js/core/dates.js', 'js/core/routes.js', 'js/core/recurrence.js', 'js/core/store.js', 'js/core/model.js', 'js/core/backup.js',
  'js/core/zip.js', 'js/core/exporters.js', 'js/core/insights.js',
  'js/ui/icons.js', 'js/ui/stickers.js', 'js/ui/motion.js', 'js/ui/components.js', 'js/ui/scrapbook.js', 'js/ui/scenes.js',
  'js/views/cover.js', 'js/views/onboarding.js', 'js/views/today.js', 'js/views/calendar.js', 'js/views/routines.js',
  'js/views/pages.js', 'js/views/year.js', 'js/views/settings.js', 'js/views/print.js',
  'js/notify.js', 'js/pwa.js', 'js/app.js',
  'assets/icons/favicon.ico', 'assets/icons/favicon.svg', 'assets/icons/favicon-16x16.png', 'assets/icons/favicon-32x32.png',
  'assets/icons/apple-touch-icon.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png', 'assets/icons/icon-maskable-512.png',
  'assets/icons/notification-icon.png', 'assets/icons/notification-badge.png', 'assets/icons/shortcut-hoy.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) { return cache.addAll(SHELL); }));
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

// Cache-first para el shell; navegación → index.html (funciona sin conexión).
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('index.html').then(function (hit) {
      return hit || fetch(req);
    }).catch(function () { return caches.match('index.html'); }));
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
    open.onerror = function () { resolve(null); };
    open.onsuccess = function () {
      var db = open.result;
      if (!db.objectStoreNames.contains('meta')) { resolve(null); return; }
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
      tx.onerror = function () { resolve(null); };
    };
  });
}

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
  event.waitUntil(readMeta().then(function (m) {
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
    if (!kind && n.morning.on && log.morning !== m.todayKey && mins >= toMin(n.morning.time) && mins < toMin(n.morning.time) + 180 && !(m.today && m.today.morning && m.today.morning.mood)) kind = 'morning';
    if (!kind && n.evening.on && log.evening !== m.todayKey && mins >= toMin(n.evening.time) && mins < toMin(n.evening.time) + 180 && !(m.today && m.today.evening && m.today.evening.mood)) kind = 'evening';
    if (!kind) return;
    log[kind] = m.todayKey;
    return self.registration.showNotification(SW_MESSAGES[kind][0], {
      body: SW_MESSAGES[kind][1], icon: 'assets/icons/notification-icon.png', badge: 'assets/icons/notification-badge.png',
      tag: 'mc-' + kind, silent: n.mode !== 'normal', data: { url: './#/hoy' }, lang: 'es-AR'
    }).then(function () { return saveLog(m.db, log); });
  }));
});
