/* Arranque y router por hash (funciona igual en file:// y en https://).
   Una sola pantalla: el calendario queda siempre de fondo; Hoy, un día, Rutinas, Páginas,
   Mi año y Ajustes se abren como cuadros desplegables encima (DECISIONS D17). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;
  var D = MC.dates;
  var R = MC.routes;

  // Marcadores (como las pestañas de un cuaderno): cada uno abre su cuadro sobre el calendario (DECISIONS D22).
  var TABS = [
    { id: 'hoy', label: 'Hoy', icon: 'hoy', href: R.today() },
    { id: 'agenda', label: 'Agenda', icon: 'calendario', href: R.agenda() },
    { id: 'rutinas', label: 'Rutinas', icon: 'rutinas', href: R.routines() },
    { id: 'paginas', label: 'Páginas', icon: 'paginas', href: R.pages() },
    { id: 'anio', label: 'Mi año', icon: 'anio', href: R.year() },
    { id: 'ajustes', label: 'Ajustes', icon: 'ajustes', href: R.settings() }
  ];
  var PANEL_LABEL = { today: 'Página del día', agenda: 'Agenda', routines: 'Mis rutinas', pages: 'Mis páginas', page: 'Página', year: 'Mi año', settings: 'Ajustes', print: 'Imprimir mi cuaderno' };

  var main = document.getElementById('main');
  var book = document.getElementById('book');
  var tabsEl = document.getElementById('tabs');
  var panelTabs = document.getElementById('panel-tabs');
  var panelEl = document.getElementById('panel');
  var panelBody = document.getElementById('panel-body');

  var base = null;          // { key, params, instance } — el calendario de fondo (o la bienvenida)
  var panel = null;         // { route, instance } — el cuadro abierto
  var lastHash = null;
  var lastBaseHash = R.calendar();
  var trail = [];           // rutas visitadas en esta sesión (para cerrar con “atrás” de verdad)
  var booted = false;

  MC.views = MC.views || {};

  /** Lee una ruta (ver js/core/routes.js); “#/calendario” vuelve al mes que se estaba mirando. */
  function parse(hash) { return R.parse(hash, { calMonth: MC.ui.get('calMonth', null) }); }

  /* ---------- Marcadores ---------- */
  function buildTabs() {
    MC.clear(tabsEl);
    TABS.forEach(function (t) {
      tabsEl.appendChild(h('a.tab', { href: t.href, dataset: { tab: t.id }, title: t.label }, MC.icon(t.icon), h('span', t.label)));
    });
  }

  /** El marcador “Mi año” abre el año que se está mirando en el calendario. */
  function followYear(params) {
    var y = String(params.mode === 'semana' ? params.date : params.month).slice(0, 4);
    var a = tabsEl.querySelector('[data-tab="anio"]');
    if (a) a.setAttribute('href', R.year(y === D.today().slice(0, 4) ? null : y));
  }

  function markOpt(id) {
    MC.$$('.tab', tabsEl).forEach(function (a) {
      if (a.dataset.tab === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /** Con un cuadro abierto los marcadores se mudan a su costado (el resto de la página queda inerte). */
  function placeTabs(inPanel) {
    var target = inPanel ? panelTabs : book;
    if (tabsEl.parentNode !== target) target.appendChild(tabsEl);
  }

  /* ---------- Fondo: calendario ---------- */
  function destroy(entry) {
    if (entry && entry.instance && typeof entry.instance.destroy === 'function') {
      try { entry.instance.destroy(); } catch (e) { console.error(e); }
    }
  }

  function baseKey(params) {
    return 'cal:' + params.mode + ':' + (params.mode === 'semana' ? params.date : params.month + ':' + (params.routine || ''));
  }

  var shownBase = null;     // el calendario que está en pantalla (puede ir un paso atrás de `base` mientras se dibuja el nuevo)

  /** Pone en pantalla un calendario ya dibujado aparte. */
  function showBase(entry, holder) {
    var focused = main.contains(document.activeElement);
    if (shownBase && shownBase !== entry) destroy(shownBase);
    MC.clear(main);
    while (holder.firstChild) main.appendChild(holder.firstChild);
    shownBase = entry;
    if (focused) focusMarkedDay();
  }

  /**
   * Dibuja el calendario de fondo si cambió de mes/semana. Devuelve true si dibujó uno nuevo.
   * El nuevo se arma aparte y entra con su animación cuando está listo (sin parpadeo, D23).
   */
  function renderBase(params) {
    var key = baseKey(params);
    if (base && base.key === key) return false;
    var prev = shownBase && shownBase.params ? shownBase : null;
    tabsEl.hidden = false;
    refreshSoon.cancel();
    baseDirty = false;
    if (params.mode === 'mes') MC.ui.set('calMonth', params.month);
    followYear(params);
    if (!prev) {
      // Primera vez (o se viene de la bienvenida): directo, sin animación.
      if (shownBase) destroy(shownBase);
      MC.clear(main);
      base = shownBase = { key: key, params: params, day: D.today(), instance: MC.views.calendar.render(main, params) };
      return true;
    }
    var holder = document.createElement('div');
    var entry = { key: key, params: params, day: D.today(), instance: null };
    entry.instance = MC.views.calendar.render(holder, params);
    base = entry;
    Promise.resolve(entry.instance && entry.instance.ready).then(function () {
      if (base !== entry) { destroy(entry); return; } // mientras tanto se fue a otro lado
      showBase(entry, holder);
      if (!panelEl.open) animateBase(prev.params, params);
    }).catch(function (err) { console.error(err); });
    return true;
  }

  /** Cambiar de mes desliza la hoja hacia ese lado; pasar de mes a semana (o al revés) la acomoda con una escala. */
  function animateBase(from, to) {
    var el = main.firstElementChild;
    if (!el || !el.animate || !MC.motion.allows('fade')) return;
    var move = MC.motion.allows('move');
    var start;
    if (from.mode !== to.mode) start = move ? 'scale(0.97)' : 'none';
    else {
      var a = from.mode === 'mes' ? from.month : from.date;
      var b = to.mode === 'mes' ? to.month : to.date;
      var dir = b > a ? 1 : b < a ? -1 : 0;
      start = move && dir ? 'translateX(' + (28 * dir) + 'px)' : 'none';
    }
    el.animate([{ opacity: 0, transform: start }, { opacity: 1, transform: 'none' }],
      { duration: Math.min(300, MC.motion.duration('page') || 300), easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  }

  /* ---------- Calendario en vivo (DECISIONS D21) ----------
     Cada cambio guardado (en el cuadro abierto o en otra pestaña) marca el calendario de fondo.
     Se redibuja aparte y se cambia entero cuando está listo: sin parpadeo, sin tocar el cuadro
     abierto ni lo que se está escribiendo. */
  var baseDirty = false;
  var refreshSoon = MC.debounce(function () { refreshBase(); }, 600);

  function markBaseDirty() {
    if (!base || !base.params) return;
    baseDirty = true;
    refreshSoon();
  }

  function refreshBase() {
    refreshSoon.cancel();
    if (!base || !base.params) return Promise.resolve();
    baseDirty = false;
    var entry = base;
    var holder = document.createElement('div');
    var inst = MC.views.calendar.render(holder, entry.params);
    return Promise.resolve(inst && inst.ready).then(function () {
      if (base !== entry) { destroy({ instance: inst }); return; } // mientras tanto se fue a otro mes
      var focused = main.contains(document.activeElement) ? document.activeElement : null;
      var focusDate = focused && focused.dataset ? focused.dataset.date : null;
      destroy(entry);
      MC.clear(main);
      while (holder.firstChild) main.appendChild(holder.firstChild);
      entry.instance = inst;
      entry.day = D.today();
      shownBase = entry;
      if (!focused) return;
      // Si la persona estaba recorriendo el mes con el teclado, sigue en el mismo día.
      var again = focusDate && main.querySelector('.day-cell[data-date="' + focusDate + '"]');
      if (again) {
        MC.$$('.day-cell', main).forEach(function (cell) { cell.tabIndex = cell === again ? 0 : -1; });
        again.focus({ preventScroll: true });
      } else focusMarkedDay();
    }).catch(function (err) { console.error(err); });
  }

  /** Al volver al calendario, el foco va al día marcado (salvo que ya esté en otro lado, p. ej. el botoncito que abrió el cuadro). */
  function focusMarkedDay() {
    var a = document.activeElement;
    if (a && a !== document.body && a.isConnected && !panelEl.contains(a)) return;
    var cell = main.querySelector('.day-cell[tabindex="0"]') || main.querySelector('.week-day__head');
    if (cell) cell.focus({ preventScroll: true });
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
    return parse(R.calendar()).params;
  }

  function renderOnboarding() {
    closePanel();
    destroy(base);
    if (shownBase && shownBase !== base) destroy(shownBase);
    MC.clear(main);
    tabsEl.hidden = true;
    base = shownBase = { key: 'onboarding', params: null, instance: MC.views.onboarding.render(main, {}) };
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
      placeTabs(true);
      panelEl.showModal();
      panelEl.scrollTop = 0;
      if (MC.motion.allows('fade') && panelEl.animate) {
        // Sale desde el lado de los marcadores (abajo en el celular), como una hoja que se despliega.
        var move = MC.motion.allows('move');
        var narrow = window.matchMedia && window.matchMedia('(max-width: 699px)').matches;
        var from = !move ? 'none' : narrow ? 'translateY(14px)' : 'translateX(18px)';
        panelEl.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }],
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
    placeTabs(false);
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
    var hash = location.hash || R.calendar();
    if (hash === lastHash) return;
    var prev = lastHash ? parse(lastHash) : null;
    lastHash = hash;
    if (trail.length >= 2 && trail[trail.length - 2] === hash) trail.pop(); else trail.push(hash);
    var route = parse(hash);
    if (!route) { location.replace(R.calendar()); return; }
    var s = MC.model.settings();
    if (!s.onboarded && route.kind !== 'onboarding') { location.replace(R.welcome()); return; }
    MC.ui.set('lastRoute', hash);

    if (route.kind === 'onboarding') { renderOnboarding(); MC.emit('route', route); return; }
    if (route.kind === 'base') {
      var hadPanel = !!panel;
      closePanel();
      var fresh = renderBase(route.params);
      lastBaseHash = hash;
      if (!fresh && hadPanel) {
        // Volver del cuadro: si algo cambió (o pasó la medianoche) se redibuja sin parpadeo; el foco vuelve al día.
        if (baseDirty || base.day !== D.today()) refreshBase().then(focusMarkedDay);
        else focusMarkedDay();
      }
      MC.emit('route', route);
      return;
    }
    // La cinta del calendario marca el último día abierto (SPEC §7.3), también al pasar de día en el cuadro.
    var moved = route.name === 'today' && MC.ui.get('calSelected', null) !== route.params.date;
    if (moved) MC.ui.set('calSelected', route.params.date);
    if (!renderBase(baseParamsFor(route)) && moved) markBaseDirty();
    var dir = prev && prev.name === 'today' && route.name === 'today' ? (route.params.date > prev.params.date ? 1 : -1) : 0;
    openPanel(route, dir);
  }

  function refreshPanel() {
    if (!panel) return;
    if (panel.instance && typeof panel.instance.refresh === 'function') panel.instance.refresh();
    else openPanel(panel.route, 0);
  }

  /** Re-renderiza lo que está a la vista (p. ej. después de abrir una copia). */
  function refresh() {
    refreshPanel();
    refreshBase();
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
    var map = { hoy: R.today(), nota: R.today(), animo: R.today(), calendario: R.calendar() };
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
    buildTabs();
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
      // Las imágenes propias se cargan antes: los stickers se dibujan sin esperar.
      return MC.model.loadSettings().then(function (s) {
        return MC.model.purgeTrash().then(function () { return MC.model.loadImages(); }).then(function () { return s; });
      });
    }).then(function (s) {
      applySettings(s);
      if (fellBack) storageWarning();
      return MC.model.touchOpen();
    }).then(function (openInfo) {
      MC.on('settings', applySettings);
      MC.on('store:changed', markBaseDirty);
      MC.on('store:remote', function () {
        Promise.all([MC.model.loadSettings(), MC.model.loadImages()]).then(function (r) {
          var s = r[0];
          applySettings(s);
          markBaseDirty(); // el fondo se puede redibujar siempre: no pisa el cuadro
          var active = document.activeElement;
          if (active && /TEXTAREA|INPUT/.test(active.tagName)) return; // no pisar lo que se está escribiendo
          refreshPanel();
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
        if (!s.onboarded) { history.replaceState(null, '', location.pathname + location.search + R.welcome()); renderOnboarding(); }
        else { var r = parse(location.hash); renderBase(r && r.kind === 'base' ? r.params : baseParamsFor(r || parse(R.calendar()))); }
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
    setupKeyboard();
  }

  /* ---------- Teclado virtual en móvil (T6) ----------
     Oculta la barra de marcadores inferior mientras el teclado está abierto
     con un campo editable enfocado para no tapar lo que se escribe, y la
     reaparece al cerrar o perder el foco. */
  function setupKeyboard() {
    function isNarrow() {
      return window.matchMedia ? window.matchMedia('(max-width: 699px)').matches : window.innerWidth <= 699;
    }
    function isEditable(el) {
      if (!el) return false;
      var tag = el.tagName;
      if (tag === 'TEXTAREA') return true;
      if (tag === 'INPUT') {
        var t = (el.type || 'text').toLowerCase();
        return !/^(button|submit|reset|checkbox|radio|file|range|color|image)$/.test(t);
      }
      return !!el.isContentEditable;
    }
    function scrollFieldIntoView(el) {
      if (!el || typeof el.scrollIntoView !== 'function') return;
      try {
        var smooth = MC.motion && MC.motion.allows('move');
        el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
      } catch (e) {
        el.scrollIntoView(false);
      }
    }

    if (window.visualViewport) {
      var vv = window.visualViewport;
      var baseH = vv.height;
      var lastW = vv.width;

      var onVisualResize = function () {
        if (!isNarrow()) {
          document.body.classList.remove('keyboard-open');
          baseH = vv.height;
          lastW = vv.width;
          return;
        }
        if (Math.abs(vv.width - lastW) > 10) {
          lastW = vv.width;
          baseH = vv.height;
        } else if (!isEditable(document.activeElement)) {
          baseH = Math.max(baseH, vv.height);
        }
        var open = (baseH - vv.height > 150) && isEditable(document.activeElement);
        document.body.classList.toggle('keyboard-open', open);
        if (open) {
          scrollFieldIntoView(document.activeElement);
        }
      };

      vv.addEventListener('resize', onVisualResize);
      window.addEventListener('resize', onVisualResize);

      document.addEventListener('focusin', function (e) {
        if (isNarrow() && isEditable(e.target)) {
          if (baseH - vv.height > 150) {
            document.body.classList.add('keyboard-open');
            scrollFieldIntoView(e.target);
          }
        }
      });

      document.addEventListener('focusout', function () {
        setTimeout(function () {
          var active = document.activeElement;
          if (!isEditable(active)) {
            document.body.classList.remove('keyboard-open');
          }
        }, 50);
        setTimeout(function () {
          var active = document.activeElement;
          if (!isEditable(active)) {
            baseH = Math.max(baseH, vv.height);
          }
        }, 350);
      });
    } else {
      // Fallback sin visualViewport
      var baseWinH = window.innerHeight;
      var lastWinW = window.innerWidth;

      var onWinResize = function () {
        if (!isNarrow()) {
          document.body.classList.remove('keyboard-open');
          baseWinH = window.innerHeight;
          lastWinW = window.innerWidth;
          return;
        }
        if (Math.abs(window.innerWidth - lastWinW) > 10) {
          lastWinW = window.innerWidth;
          baseWinH = window.innerHeight;
        } else if (!isEditable(document.activeElement)) {
          baseWinH = Math.max(baseWinH, window.innerHeight);
        }
        var open = (baseWinH - window.innerHeight > 150) && isEditable(document.activeElement);
        document.body.classList.toggle('keyboard-open', open);
        if (open) {
          scrollFieldIntoView(document.activeElement);
        }
      };

      window.addEventListener('resize', onWinResize);

      document.addEventListener('focusin', function (e) {
        if (isNarrow() && isEditable(e.target)) {
          document.body.classList.add('keyboard-open');
          scrollFieldIntoView(e.target);
        }
      });

      document.addEventListener('focusout', function () {
        setTimeout(function () {
          if (!isEditable(document.activeElement)) {
            document.body.classList.remove('keyboard-open');
          }
        }, 50);
        setTimeout(function () {
          if (!isEditable(document.activeElement)) {
            baseWinH = Math.max(baseWinH, window.innerHeight);
          }
        }, 350);
      });
    }
  }

  MC.app = {
    refresh: refresh, go: function (hash) { location.hash = hash; }, applySettings: applySettings, parse: parse,
    panelOpen: function () { return !!panel; }, closePanel: requestClose, booted: function () { return booted; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
