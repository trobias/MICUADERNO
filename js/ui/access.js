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
    ['.memory-btn', ['anio']],
    ['#q-morning, .closing__content > .feelings, #q-body', ['emociones']],
    ['.intention, #q-notes, .reflections, .day-head__tools .privacy-btn', ['escritura']],
    ['#q-list', ['actividades']],
    ['.closing', ['emociones', 'escritura']],
    ['.day-head__tools .keep-btn', ['actividades', 'repeticiones']],
    ['#q-pages', ['hojas']],
    ['.section--attachments, .sticker-tools', ['fotos']],
    ['.index-page', ['hojas']],
    ['.routines-page', ['repeticiones']],
    ['.free-page, .template-page', ['hojas']],
    ['.planner__cell--important', ['semana', 'actividades', 'repeticiones']],
    ['.planner__important-notes, .planner__cell--notes', ['semana']],
    ['.week-progress', ['actividades', 'repeticiones']],
    ['.week-progress__details, .week-progress__actions', ['repeticiones']],
    ['.week-day__progress', ['actividades']],
    ['.week-day .activity-list, .week-day .add-activity', ['actividades']],
    ['.settings-page', ['ajustes']]
  ];
  var CONTROLS = 'input, textarea, select, button, [contenteditable="true"]';

  // Lo de la propia cuenta (Mi cuenta, cerrar sesión) siempre se puede usar.
  var KEEP = '#st-account';

  /** Deja una parte solo para mirar. Se puede llamar varias veces: lo que la parte dibuja después también se apaga. */
  function lookOnly(el) {
    el.classList.add('is-lookonly');
    var title = el.querySelector(':scope > .section__title, :scope > label, :scope > h2');
    if (title && !title.querySelector('.lookonly-tag') && !el.matches('.settings-page')) title.appendChild(h('span.lookonly-tag', ' · solo para mirar'));
    MC.$$(CONTROLS, el).concat(el.matches(CONTROLS) ? [el] : []).forEach(function (c) {
      if (c.closest(KEEP) || c.dataset.lookonly) return;
      c.dataset.lookonly = '1';
      if (c.tagName === 'INPUT' || c.tagName === 'TEXTAREA') {
        if (c.type === 'checkbox' || c.type === 'radio' || c.type === 'file' || c.type === 'color' || c.type === 'date') c.disabled = true;
        else c.readOnly = true;
      } else if (c.isContentEditable) c.contentEditable = 'false';
      else c.disabled = true;
      // Un campo vacío de solo lectura no invita a escribir: sin texto de ayuda y, si es un renglón suelto, oculto.
      if ((c.tagName === 'INPUT' || c.tagName === 'TEXTAREA') && c.readOnly) {
        c.removeAttribute('placeholder');
        var field = c.closest('.reflection, .field, .emotion-colors__add');
        if (field && !c.value.trim() && !field.matches('.section, .intention')) field.hidden = true;
        else if (!c.value.trim() && c.tagName === 'INPUT' && c.type === 'text') c.hidden = true;
      }
    });
    // El cierre del día plegado (antes de las 17 h) se muestra: no hay nada que “abrir” para escribir.
    var folded = el.querySelector('.closing__content[hidden]');
    if (folded) { folded.hidden = false; MC.$$('.section__hint', el).forEach(function (x) { x.hidden = true; }); }
    // Lo que no quedó con nada para mirar dice “nada anotado” en vez de quedar como un formulario vacío.
    var empties = el.matches('.section, .intention, .closing') ? [el] : [];
    // Dentro de una hoja entera solo para mirar (Ajustes), cada sección que quedó sin nada visible también lo dice.
    MC.$$('.section', el).forEach(function (sec) {
      var shown = [].slice.call(sec.children).filter(function (x) { return !x.hidden && !x.matches('.section__title, .section__hint, .lookonly-empty'); });
      if (!shown.length) empties.push(sec);
    });
    empties.forEach(function (x) {
      if (!x.querySelector('.lookonly-empty') && (x !== el || !hasContent(x))) x.appendChild(h('p.lookonly-empty.t-soft', 'Nada anotado.'));
    });
  }
  function hasContent(el) {
    if (MC.$$('textarea, input', el).some(function (c) { return c.value && c.value.trim(); })) return true;
    return !!el.querySelector('.feeling-chip, .activity, .page-link, .attachment, [aria-pressed="true"], .toc__item, .routine');
  }

  /** Aplica los permisos a lo que hay dentro de `rootEl` (se vuelve a llamar cuando el cuadro dibuja más). */
  function apply(rootEl) {
    if (!guest()) return;
    applyYear(rootEl);
    PARTS.forEach(function (p) {
      var l = level(p[1]);
      MC.$$(p[0], rootEl).forEach(function (el) {
        // Los ids de las secciones están en su título: se aplica a la sección entera.
        if (el.classList.contains('section__title') && el.parentElement) el = el.parentElement;
        el.dataset.access = l || 'nada'; // qué permiso rige esta parte (lo revisa la matriz de permisos del E2E)
        if (l === 'editar') return;
        if (l === 'ver') { lookOnly(el); return; }
        el.hidden = true; // no compartido: ni se muestra
      });
    });
  }

  /** Partes de Mi año que la dueña no muestra (D53, llegan con su apariencia). */
  function applyYear(rootEl) {
    var hide = (MC.sync && MC.sync.look && MC.sync.look.yearHide) || [];
    MC.$$('[data-year-part]', rootEl).forEach(function (el) { el.hidden = hide.indexOf(el.dataset.yearPart) !== -1; });
    MC.$$('[data-year-title]', rootEl).forEach(function (el) {
      el.hidden = el.dataset.yearTitle.split(' ').every(function (k) { return hide.indexOf(k) !== -1; });
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
