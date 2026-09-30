/* Arranque y router por hash (funciona igual en file:// y en https://). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;
  var D = MC.dates;

  var TABS = [
    { id: 'hoy', label: 'Hoy', icon: 'hoy', href: '#/hoy' },
    { id: 'calendario', label: 'Calendario', icon: 'calendario', href: '#/calendario' },
    { id: 'rutinas', label: 'Rutinas', icon: 'rutinas', href: '#/rutinas' },
    { id: 'paginas', label: 'Páginas', icon: 'paginas', href: '#/paginas' },
    { id: 'anio', label: 'Mi año', icon: 'anio', href: '#/anio' },
    { id: 'ajustes', label: 'Ajustes', icon: 'ajustes', href: '#/ajustes' }
  ];

  var main = document.getElementById('main');
  var tabsEl = document.getElementById('tabs');
  var mobileBar = document.getElementById('mobile-bar');
  var scrolls = {};         // posición de scroll por ruta, para volver atrás sin perder el lugar
  var fromTab = false;      // navegar desde una pestaña empieza arriba
  var current = null;      // { name, params, instance }
  var lastHash = null;
  var booted = false;

  MC.views = MC.views || {};

  function parse(hash) {
    var parts = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    var p0 = parts[0] || 'hoy';
    switch (p0) {
      case 'hoy': return { name: 'today', tab: 'hoy', params: { date: D.today(), isToday: true } };
      case 'dia': return D.isValid(parts[1]) ? { name: 'today', tab: 'hoy', params: { date: parts[1] } } : null;
      case 'calendario':
        if (parts[1] === 'semana' && D.isValid(parts[2])) return { name: 'calendar', tab: 'calendario', params: { mode: 'semana', date: parts[2] } };
        if (parts[1] === 'mes' && /^\d{4}-\d{2}$/.test(parts[2] || '')) return { name: 'calendar', tab: 'calendario', params: { mode: 'mes', month: parts[2] } };
        return { name: 'calendar', tab: 'calendario', params: { mode: MC.ui.get('calMode', 'mes'), month: D.monthKey(D.today()), date: D.today() } };
      case 'rutinas': return { name: 'routines', tab: 'rutinas', params: {} };
      case 'paginas': return { name: 'pages', tab: 'paginas', params: {} };
      case 'pagina': return parts[1] ? { name: 'page', tab: 'paginas', params: { id: parts[1] } } : null;
      case 'anio': return { name: 'year', tab: 'anio', params: { year: /^\d{4}$/.test(parts[1] || '') ? parts[1] : D.today().slice(0, 4) } };
      case 'ajustes': return { name: 'settings', tab: 'ajustes', params: { section: parts[1] || null } };
      case 'bienvenida': return { name: 'onboarding', tab: null, params: {} };
      case 'imprimir': return { name: 'print', tab: 'ajustes', params: {} };
      default: return null;
    }
  }

  function buildTabs() {
    MC.clear(tabsEl);
    TABS.forEach(function (t) {
      tabsEl.appendChild(h('a.tab', { href: t.href, dataset: { tab: t.id } }, MC.icon(t.icon), h('span', t.label)));
    });
    tabsEl.addEventListener('click', function (e) { if (e.target.closest('.tab')) fromTab = true; });
    var gear = document.getElementById('mobile-settings');
    gear.appendChild(MC.icon('ajustes'));
    gear.addEventListener('click', function () { fromTab = true; });
  }

  function markTab(tab) {
    MC.$$('.tab', tabsEl).forEach(function (a) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var gear = document.getElementById('mobile-settings');
    if (tab === 'ajustes') gear.setAttribute('aria-current', 'page'); else gear.removeAttribute('aria-current');
  }

  /** Vuelve a una posición cuando el contenido (que carga asíncrono) ya es lo bastante alto. */
  function restoreScroll(y) {
    var t0 = Date.now();
    (function tryIt() {
      if (document.documentElement.scrollHeight >= y + window.innerHeight || Date.now() - t0 > 800) { window.scrollTo(0, y); return; }
      requestAnimationFrame(tryIt);
    })();
  }

  function destroyCurrent() {
    if (current && current.instance && typeof current.instance.destroy === 'function') {
      try { current.instance.destroy(); } catch (e) { console.error(e); }
    }
  }

  function render(route, dir) {
    var view = MC.views[route.name];
    if (!view) { location.hash = '#/hoy'; return; }
    var sameView = current && current.name === route.name;
    destroyCurrent();
    MC.c.closeMenu(false);
    var go = function () {
      MC.clear(main);
      var instance = view.render(main, route.params) || null;
      current = { name: route.name, params: route.params, instance: instance, tab: route.tab };
    };
    var s = MC.model.settings();
    tabsEl.hidden = !s.onboarded || route.name === 'onboarding';
    mobileBar.hidden = tabsEl.hidden;
    markTab(route.tab);
    if (booted) MC.motion.swap(main, go, dir || 0); else go();
    var saved = scrolls[location.hash];
    if (!fromTab && !dir && saved) restoreScroll(saved);
    else if (!sameView || dir) window.scrollTo(0, 0);
    fromTab = false;
    if (booted) {
      var heading = main.querySelector('h1');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
    MC.emit('route', route);
  }

  function onHash() {
    var hash = location.hash || '#/hoy';
    if (hash === lastHash) return;
    if (lastHash) scrolls[lastHash] = window.scrollY;
    var prev = lastHash ? parse(lastHash) : null;
    lastHash = hash;
    var route = parse(hash);
    if (!route) { location.replace('#/hoy'); return; }
    var s = MC.model.settings();
    if (!s.onboarded && route.name !== 'onboarding') { location.replace('#/bienvenida'); return; }
    var dir = 0;
    if (prev && prev.name === 'today' && route.name === 'today') dir = route.params.date > prev.params.date ? 1 : -1;
    MC.ui.set('lastRoute', hash);
    render(route, dir);
  }

  /** Re-renderiza la vista actual (p. ej. otro tab cambió datos). */
  function refresh() {
    if (!current) return;
    if (current.instance && typeof current.instance.refresh === 'function') { current.instance.refresh(); return; }
    var route = parse(location.hash || '#/hoy');
    if (route) { destroyCurrent(); MC.clear(main); current.instance = MC.views[route.name].render(main, route.params); }
  }

  function applySettings(s) {
    document.body.dataset.cover = s.cover;
    MC.motion.apply(s.motion);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--cloth').trim() || '#6F8A6A');
  }

  function storageWarning() {
    var slip = h('div.slip.slip--rose.storage-warning', { role: 'alert' },
      h('p', 'No pude usar el almacenamiento de este navegador, así que lo que escribas ahora vive solo mientras esta ventana esté abierta.'),
      h('p.t-soft', 'Descargá una copia antes de cerrar, o abrí el cuaderno en otro navegador.'),
      h('div.slip__actions',
        h('button.label-btn', { type: 'button', on: { click: function () { MC.backup.download(); } } }, MC.icon('download'), 'Descargar una copia')));
    document.body.insertBefore(slip, document.body.firstChild);
  }

  function handleShortcut() {
    var params = new URLSearchParams(location.search);
    var go = params.get('go');
    if (!go) return false;
    var map = { hoy: '#/hoy', nota: '#/hoy', animo: '#/hoy', calendario: '#/calendario' };
    if (map[go]) {
      MC.ui.set('focusOnLoad', go === 'nota' ? 'notes' : go === 'animo' ? 'mood' : null);
      history.replaceState(null, '', location.pathname + map[go]);
      return true;
    }
    return false;
  }

  function boot() {
    MC.icons.injectSprite();
    buildTabs();
    var fellBack = false;
    MC.on('store:fallback', function () { fellBack = true; });
    MC.on('store:error', function (err) {
      console.error(err);
      MC.c.toast('No se pudo guardar el último cambio. Probá de nuevo o descargá una copia.', { action: 'Copia', onAction: function () { MC.backup.download(); } });
    });

    MC.store.init().then(function () {
      return MC.model.loadSettings();
    }).then(function (s) {
      applySettings(s);
      if (fellBack) storageWarning();
      return MC.model.touchOpen();
    }).then(function (openInfo) {
      MC.on('settings', applySettings);
      MC.on('store:remote', function () {
        MC.model.loadSettings().then(function (s) {
          applySettings(s);
          var active = document.activeElement;
          if (active && /TEXTAREA|INPUT/.test(active.tagName)) return; // no pisar lo que se está escribiendo
          refresh();
        });
      });
      MC.on('store:versionchange', function () { location.reload(); });
      handleShortcut();
      var s = MC.model.settings();
      var start = function () {
        booted = true;
        window.addEventListener('hashchange', onHash);
        onHash();
        if (MC.scenes) MC.scenes.start();
        if (MC.notify) MC.notify.start(openInfo);
      };
      // Primera vez: siempre la tapa. Después, según ajuste.
      if (!s.onboarded || s.showCover) {
        tabsEl.hidden = true;
        // Pintamos la vista debajo de la tapa para que la apertura revele contenido real.
        var initial = parse(location.hash || '#/hoy');
        if (!s.onboarded) { history.replaceState(null, '', location.pathname + location.search + '#/bienvenida'); initial = parse('#/bienvenida'); }
        if (initial) render(initial, 0);
        lastHash = location.hash;
        MC.views.cover.show({ firstTime: !s.onboarded, onOpen: function () { booted = true; start(); } });
      } else {
        start();
      }
    }).catch(function (err) {
      console.error(err);
      main.appendChild(h('div.page', h('p.t-text', 'Algo no salió bien al abrir el cuaderno. Probá recargar la página.')));
    });

    // Teclado virtual en móvil: ocultar pestañas para no tapar lo que se escribe.
    if (window.visualViewport) {
      var base = window.visualViewport.height;
      window.visualViewport.addEventListener('resize', function () {
        var vv = window.visualViewport;
        base = Math.max(base, vv.height);
        document.body.classList.toggle('keyboard-open', base - vv.height > 150);
      });
    }
    // Guardar lo pendiente antes de cerrar/ocultar.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && current && current.instance && current.instance.flush) current.instance.flush();
    });
    window.addEventListener('pagehide', function () {
      if (current && current.instance && current.instance.flush) current.instance.flush();
    });
  }

  MC.app = { refresh: refresh, go: function (hash) { location.hash = hash; }, applySettings: applySettings, parse: parse };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
