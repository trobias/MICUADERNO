/* Lo que puede abrir y cambiar quien mira el cuaderno de otra persona (nube, D51).
   - Una parte que no le compartieron no se abre: en el cuadro aparece un cartel que lo dice.
   - Una parte compartida “para ver” se abre sin controles para cambiar (campos de solo lectura, botones
     apagados) y con la marca “solo para mirar”. Las que puede editar quedan como siempre.
   Sin cuentas, o en el cuaderno propio, no hace nada. El servidor igual descarta lo que no se puede escribir. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;

  function guest() { return !!(MC.cloud && MC.cloud.mode === 'guest' && MC.sync && MC.sync.level); }
  /** El mejor permiso entre varias secciones: 'editar' > 'ver' > null. */
  function level(secs) {
    if (!guest()) return 'editar';
    var best = null;
    secs.forEach(function (s) {
      var l = MC.sync.level(s);
      if (l === 'editar') best = 'editar';
      else if (l === 'ver' && !best) best = 'ver';
    });
    return best;
  }

  // Qué secciones usa cada cuadro.
  var VIEWS = {
    today: ['actividades', 'emociones', 'escritura', 'fotos', 'hojas'],
    sheets: ['hojas', 'repeticiones'],
    page: ['hojas'],
    template: ['hojas'],
    year: ['anio', 'emociones', 'actividades', 'escritura'],
    settings: ['ajustes'],
    print: ['escritura', 'actividades', 'emociones', 'hojas']
  };
  // Partes de cada cuadro y su sección (para dejar solo para mirar lo que corresponde).
  var PARTS = [
    ['#q-morning, .closing__content > .feelings, #q-body', ['emociones']],
    ['.intention, #q-notes, .reflections, .day-head__tools .privacy-btn', ['escritura']],
    ['#q-list', ['actividades']],
    ['.day-head__tools .keep-btn', ['actividades', 'repeticiones']],
    ['#q-pages', ['hojas']],
    ['.section--attachments, .sticker-tools', ['fotos']],
    ['.index-page', ['hojas']],
    ['.routines-page', ['repeticiones']],
    ['.free-page, .template-page', ['hojas']],
    ['.planner__cell--important, .planner__cell--notes', ['semana']],
    ['.week-day .activity-list, .week-day .add-activity', ['actividades']]
  ];
  var CONTROLS = 'input, textarea, select, button, [contenteditable="true"]';

  function lookOnly(el) {
    if (el.classList.contains('is-lookonly')) return;
    el.classList.add('is-lookonly');
    var title = el.querySelector(':scope > .section__title, :scope > label');
    if (title && !title.querySelector('.lookonly-tag')) title.appendChild(h('span.lookonly-tag', ' · solo para mirar'));
    MC.$$(CONTROLS, el).concat(el.matches(CONTROLS) ? [el] : []).forEach(function (c) {
      if (c.tagName === 'INPUT' || c.tagName === 'TEXTAREA') {
        if (c.type === 'checkbox' || c.type === 'radio' || c.type === 'file' || c.type === 'color' || c.type === 'date') c.disabled = true;
        else c.readOnly = true;
      } else if (c.isContentEditable) c.contentEditable = 'false';
      else c.disabled = true;
    });
  }

  /** Aplica los permisos a lo que hay dentro de `rootEl` (se vuelve a llamar cuando el cuadro dibuja más). */
  function apply(rootEl) {
    if (!guest()) return;
    PARTS.forEach(function (p) {
      var l = level(p[1]);
      if (l === 'editar') return;
      MC.$$(p[0], rootEl).forEach(function (el) {
        // Los ids de las secciones están en su título: se aplica a la sección entera.
        if (el.classList.contains('section__title') && el.parentElement) el = el.parentElement;
        if (l === 'ver') { lookOnly(el); return; }
        el.hidden = true; // no compartido: ni se muestra
      });
    });
  }

  /** ¿Se puede abrir este cuadro? null si no (no le compartieron ninguna de sus partes). */
  function viewLevel(name) { return VIEWS[name] ? level(VIEWS[name]) : 'editar'; }

  /** El cartel en lugar del cuadro que no se puede abrir. */
  function blocked(main, name) {
    var owner = (MC.sync && MC.sync.share && MC.sync.share.name) || 'otra persona';
    var sheet = h('section.page.page--margin.access-blocked',
      h('h1.t-display', 'Esta parte no está compartida'),
      h('p.t-text', 'Es del cuaderno de ' + owner + ', y no te dio permiso para verla. Si te hace falta, pedíselo: lo cambia en Mi cuenta.'),
      h('p', h('a.label-btn.label-btn--soft', { href: MC.routes.calendar() }, MC.icon('calendario'), 'Volver al calendario')));
    if (name === 'settings' && MC.cloud && MC.cloud.logout) {
      var out = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('arrow-right'), 'Cerrar sesión en este dispositivo');
      out.addEventListener('click', function () { MC.cloud.logout(); });
      sheet.appendChild(h('p', out));
    }
    main.appendChild(h('div.spread.spread--single', sheet));
    return { destroy: function () {} };
  }

  /** Mira el cuadro mientras dibuja (las vistas cargan de a partes) y aplica los permisos. */
  function watch(rootEl) {
    if (!guest() || !root.MutationObserver) return function () {};
    var queued = false;
    var mo = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      Promise.resolve().then(function () { queued = false; apply(rootEl); });
    });
    mo.observe(rootEl, { childList: true, subtree: true });
    apply(rootEl);
    return function () { mo.disconnect(); };
  }

  MC.access = { guest: guest, level: level, viewLevel: viewLevel, apply: apply, blocked: blocked, watch: watch, VIEWS: VIEWS };
})(typeof window !== 'undefined' ? window : globalThis);
