/* PWA: service worker (solo http/https), instalación y aviso de versión nueva. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, c = MC.c;

  var deferredPrompt = null;
  var isHttp = /^https?:$/.test(location.protocol);
  var standalone = (root.matchMedia && root.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  root.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    MC.emit('pwa:installable');
  });
  root.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    c.toast('Listo: tu cuaderno ya está en este dispositivo.');
  });

  function register() {
    if (!isHttp || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      function offer(worker) {
        c.toast('Hay una versión nueva del cuaderno.', { action: 'Actualizar', ms: 15000, onAction: function () { worker.postMessage({ type: 'skipWaiting' }); } });
      }
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', function () {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
        });
      });
      // Buscar actualizaciones al volver a la app
      document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
    }).catch(function (err) { console.warn('[MI CUADERNO] Service worker no registrado:', err); });
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }

  function installSection() {
    if (standalone) return null;
    var body = h('div.install');
    function paint() {
      MC.clear(body);
      if (!isHttp) {
        body.appendChild(h('p.section__hint', 'Así, abierto desde la carpeta, ya funciona sin internet. Si además lo publicás en una dirección web (por ejemplo GitHub Pages), lo podés instalar como app, con su ícono y recordatorios.'));
        return;
      }
      if (deferredPrompt) {
        var b = h('button.label-btn', { type: 'button' }, MC.icon('install'), 'Instalar en este dispositivo');
        b.addEventListener('click', function () {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(function () { deferredPrompt = null; paint(); });
        });
        body.appendChild(h('p.section__hint', 'Queda con su propio ícono, se abre sin la barra del navegador y funciona sin internet.'));
        body.appendChild(b);
        return;
      }
      var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      body.appendChild(h('p.section__hint', ios
        ? 'En iPhone o iPad: tocá Compartir y después “Agregar a inicio”.'
        : 'Si tu navegador lo permite, vas a ver la opción “Instalar” en el menú o en la barra de direcciones.'));
    }
    paint();
    MC.on('pwa:installable', paint);
    return c.section('Tenerlo como app', body, { id: 'st-install' });
  }

  MC.pwa = { register: register, installSection: installSection, isHttp: isHttp, standalone: standalone };
  register();
})(window);
