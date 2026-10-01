/* Arranque y router por hash (funciona igual en file:// y en https://).
   Una sola pantalla: el calendario queda siempre de fondo; Hoy, un día, Rutinas, Páginas,
   Mi año y Ajustes se abren como cuadros desplegables encima (DECISIONS D17). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;
  var D = MC.dates;

  var OPTS = [
    { id: 'hoy', label: 'Hoy', icon: 'hoy', href: '#/hoy' },
    { id: 'rutinas', label: 'Rutinas', icon: 'rutinas', href: '#/rutinas' },
    { id: 'paginas', label: 'Páginas', icon: 'paginas', href: '#/paginas' },
    { id: 'anio', label: 'Mi año', icon: 'anio', href: '#/anio' },
    { id: 'ajustes', label: 'Ajustes', icon: 'ajustes', href: '#/ajustes' }
  ];
  var PANEL_LABEL = { today: 'Página del día', routines: 'Mis rutinas', pages: 'Mis páginas', page: 'Página', year: 'Mi año', settings: 'Ajustes', print: 'Imprimir mi cuaderno' };

  var main = document.getElementById('main');
  var head = document.getElementById('home-head');
  var optsEl = document.getElementById('mini-opts');
  var panelEl = document.getElementById('panel');
  var panelBody = document.getElementById('panel-body');

  var base = null;          // { key, params, instance } — el calendario de fondo (o la bienvenida)
  var panel = null;         // { route, instance } — el cuadro abierto
  var lastHash = null;
  var lastBaseHash = '#/calendario';
  var trail = [];           // rutas visitadas en esta sesión (para cerrar con “atrás” de verdad)
  var booted = false;

  MC.views = MC.views || {};

  function parse(hash) {
    var parts = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    var p0 = parts[0] || 'calendario';
    switch (p0) {
      case 'calendario':
        if (parts[1] === 'semana' && D.isValid(parts[2])) return { kind: 'base', name: 'calendar', params: { mode: 'semana', date: parts[2] } };
        if (parts[1] === 'mes' && /^\d{4}-\d{2}$/.test(parts[2] || '')) return { kind: 'base', name: 'calendar', params: { mode: 'mes', month: parts[2] } };
        return { kind: 'base', name: 'calendar', params: { mode: 'mes', month: MC.ui.get('calMonth', D.monthKey(D.today())) } };
      case 'hoy': return { kind: 'panel', name: 'today', opt: 'hoy', params: { date: D.today(), isToday: true } };
      case 'dia': return D.isValid(parts[1]) ? { kind: 'panel', name: 'today', opt: parts[1] === D.today() ? 'hoy' : null, params: { date: parts[1] } } : null;
      case 'rutinas': return { kind: 'panel', name: 'routines', opt: 'rutinas', params: {} };
      case 'paginas': return { kind: 'panel', name: 'pages', opt: 'paginas', params: {} };
      case 'pagina': return parts[1] ? { kind: 'panel', name: 'page', opt: 'paginas', params: { id: parts[1] } } : null;
      case 'anio': return { kind: 'panel', name: 'year', opt: 'anio', params: { year: /^\d{4}$/.test(parts[1] || '') ? parts[1] : D.today().slice(0, 4) } };
      case 'ajustes': return { kind: 'panel', name: 'settings', opt: 'ajustes', params: { section: parts[1] || null } };
      case 'imprimir': return { kind: 'panel', name: 'print', opt: 'ajustes', params: {} };
      case 'bienvenida': return { kind: 'onboarding', name: 'onboarding', params: {} };
      default: return null;
    }
  }

  /* ---------- Botoncitos ---------- */
  function buildOpts() {
    MC.clear(optsEl);
    OPTS.forEach(function (o) {
      optsEl.appendChild(h('a.mini-opt', { href: o.href, dataset: { opt: o.id } }, MC.icon(o.icon), h('span', o.label)));
    });
  }

  function markOpt(id) {
    MC.$$('.mini-opt', optsEl).forEach(function (a) {
      if (a.dataset.opt === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- Fondo: calendario ---------- */
  function destroy(entry) {
    if (entry && entry.instance && typeof entry.instance.destroy === 'function') {
      try { entry.instance.destroy(); } catch (e) { console.error(e); }
    }
  }

  function renderBase(params, force) {
    var key = 'cal:' + params.mode + ':' + (params.mode === 'semana' ? params.date : params.month);
    if (base && base.key === key && !force) return;
    destroy(base);
    MC.clear(main);
    head.hidden = false;
    base = { key: key, params: params, instance: MC.views.calendar.render(main, params) };
    if (params.mode === 'mes') MC.ui.set('calMonth', params.month);
  }

  function baseParamsFor(route) {
    if (base && base.params) {
      // Un día de otro mes deja de fondo ese mes, así al cerrar el cuadro se ve dónde estaba.
      if (route.name === 'today' && base.params.mode === 'mes' && D.monthKey(route.params.date) !== base.params.month) {
        return { mode: 'mes', month: D.monthKey(route.params.date) };
      }
      return base.params;
    }
    if (route.name === 'today') return { mode: 'mes', month: D.monthKey(route.params.date) };
    return parse('#/calendario').params;
  }

  function renderOnboarding() {
    closePanel();
    destroy(base);
    MC.clear(main);
    head.hidden = true;
    base = { key: 'onboarding', params: null, instance: MC.views.onboarding.render(main, {}) };
  }

  /* ---------- Cuadro desplegable ---------- */
  function openPanel(route, dir) {
    var view = MC.views[route.name];
    var wasOpen = !!panel;
    destroy(panel);
    MC.c.closeMenu(false);
    var render = function () {
      MC.clear(panelBody);
      panel = { route: route, instance: view.render(panelBody, route.params) || null };
    };
    panelEl.setAttribute('aria-label', PANEL_LABEL[route.name] || 'Cuaderno');
    markOpt(route.opt);
    if (!panelEl.open) {
      render();
      panelEl.showModal();
      panelEl.scrollTop = 0;
      if (MC.motion.allows('fade') && panelEl.animate) {
        var dy = MC.motion.allows('move') ? -14 : 0;
        panelEl.animate([{ opacity: 0, transform: 'translateY(' + dy + 'px) scale(0.99)' }, { opacity: 1, transform: 'none' }],
          { duration: MC.motion.duration('panel'), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
    } else {
      MC.motion.swap(panelBody, render, dir || 0);
      panelEl.scrollTop = 0;
    }
    if (!wasOpen) MC.emit('panel', true);
    MC.emit('route', route);
  }

  function closePanel() {
    if (!panel && !panelEl.open) return;
    destroy(panel);
    panel = null;
    MC.c.closeMenu(false);
    if (panelEl.open) panelEl.close();
    MC.clear(panelBody);
    markOpt(null);
    MC.emit('panel', false);
  }

  /** Cerrar a pedido de la persona: vuelve al calendario usando el historial si se puede. */
  function requestClose() {
    for (var i = trail.length - 1; i >= 0; i--) {
      if (parse(trail[i]).kind === 'base') {
        var steps = trail.length - 1 - i;
        if (steps > 0) { history.go(-steps); return; }
        break;
      }
    }
    location.hash = lastBaseHash;
  }

  /* ---------- Router ---------- */
  function onHash() {
    var hash = location.hash || '#/calendario';
    if (hash === lastHash) return;
    var prev = lastHash ? parse(lastHash) : null;
    lastHash = hash;
    if (trail.length >= 2 && trail[trail.length - 2] === hash) trail.pop(); else trail.push(hash);
    var route = parse(hash);
    if (!route) { location.replace('#/calendario'); return; }
    var s = MC.model.settings();
    if (!s.onboarded && route.kind !== 'onboarding') { location.replace('#/bienvenida'); return; }
    MC.ui.set('lastRoute', hash);

    if (route.kind === 'onboarding') { renderOnboarding(); MC.emit('route', route); return; }
    if (route.kind === 'base') {
      var hadPanel = !!panel;
      closePanel();
      renderBase(route.params, hadPanel);
      lastBaseHash = hash;
      MC.emit('route', route);
      return;
    }
    renderBase(baseParamsFor(route));
    var dir = prev && prev.name === 'today' && route.name === 'today' ? (route.params.date > prev.params.date ? 1 : -1) : 0;
    openPanel(route, dir);
  }

  /** Re-renderiza lo que está a la vista (p. ej. otra pestaña del navegador cambió datos). */
  function refresh() {
    if (panel) {
      if (panel.instance && typeof panel.instance.refresh === 'function') panel.instance.refresh();
      else openPanel(panel.route, 0);
    }
    if (base && base.params) renderBase(base.params, true);
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

  function flush() {
    if (panel && panel.instance && panel.instance.flush) panel.instance.flush();
  }

  function boot() {
    MC.icons.injectSprite();
    buildOpts();
    document.getElementById('panel-close').appendChild(MC.icon('close'));
    document.getElementById('panel-close').addEventListener('click', requestClose);
    // Esc cierra el cuadro, pero por el router (así el historial queda coherente).
    panelEl.addEventListener('cancel', function (e) { e.preventDefault(); requestClose(); });
    // Tocar fuera del cuadro también lo cierra.
    panelEl.addEventListener('pointerdown', function (e) {
      if (e.target !== panelEl) return;
      var r = panelEl.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) requestClose();
    });

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
        lastHash = null;
        window.addEventListener('hashchange', onHash);
        onHash();
        if (MC.scenes) MC.scenes.start();
        if (MC.notify) MC.notify.start(openInfo);
      };
      // Primera vez: siempre la tapa. Después, según ajuste.
      if (!s.onboarded || s.showCover) {
        // Debajo de la tapa pintamos el fondo real (calendario o bienvenida); los cuadros se abren después.
        if (!s.onboarded) { history.replaceState(null, '', location.pathname + location.search + '#/bienvenida'); renderOnboarding(); }
        else { var r = parse(location.hash); renderBase(r && r.kind === 'base' ? r.params : baseParamsFor(r || parse('#/calendario'))); }
        MC.views.cover.show({ firstTime: !s.onboarded, onOpen: start });
      } else {
        start();
      }
    }).catch(function (err) {
      console.error(err);
      main.appendChild(h('div.page', h('p.t-text', 'Algo no salió bien al abrir el cuaderno. Probá recargar la página.')));
    });

    // Guardar lo pendiente antes de cerrar/ocultar.
    document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
    window.addEventListener('pagehide', flush);
  }

  MC.app = {
    refresh: refresh, go: function (hash) { location.hash = hash; }, applySettings: applySettings, parse: parse,
    panelOpen: function () { return !!panel; }, closePanel: requestClose, booted: function () { return booted; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
