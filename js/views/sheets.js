/* MIS HOJAS (A5, D27, D29) — el índice de hojas y lo que se repite, en un solo cuadro.
   Reemplaza los marcadores Páginas y Rutinas: los datos son los mismos (pages, routines). Desde A7 suma
   plantillas y hojas que se repiten. Ver SPEC §7.5. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, RC = MC.recurrence, c = MC.c;

  function render(main, params) {
    var destroyed = false;
    var today = D.today();
    var focusId = params && params.focus || null; // llegó desde “Ver lo que se repite”: mostrarla resaltada
    var left = h('section.page.page--margin.index-page');
    var right = h('section.page.page--margin.routines-page');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    function load() {
      return Promise.all([M.getPages(), M.getRoutines(), M.getTemplates()]).then(function (r) {
        if (destroyed) return;
        paintIndex(r[0]);
        paintTemplates(r[2]);
        paintRepeats(r[1]);
        showFocus();
      });
    }

    /* ---------- índice de hojas ---------- */
    function paintIndex(pages) {
      MC.clear(left);
      var add = h('button.label-btn', { type: 'button' }, MC.icon('plus'), 'Nueva hoja');
      add.addEventListener('click', function () { MC.views.pages.newPage(); });
      left.appendChild(h('header.page-head', h('h1.t-display', 'Mis hojas'), add));
      if (!pages.length) {
        left.appendChild(c.empty('Todavía no hay hojas. Una lista, una carta, lo que quieras: esta parte del cuaderno es libre.', 'libro'));
        return;
      }
      var ol = h('ol.toc', { 'aria-label': 'Índice' });
      pages.forEach(function (p, i) {
        var n = M.sheetCount(p), text = M.sheetText(p, true);
        var only = M.sheetBlocks(p).blocks;
        var preview = only.length === 1 && only[0].type !== 'text' && only[0].type !== 'columns' ? n + (n === 1 ? ' cosa' : ' cosas') : (text ? text.split('\n')[0].slice(0, 70) : 'en blanco');
        preview += ' · ' + D.shortLabel(M.pageDate(p));
        ol.appendChild(h('li.toc__item',
          h('a.toc__link', { href: R.page(p.id) },
            p.pinned ? h('span.toc__pin', { 'aria-label': 'fijada' }, MC.icon('pin')) : null,
            h('span.toc__title', M.pageTitle(p)),
            h('span.toc__dots', { 'aria-hidden': 'true' }),
            h('span.toc__num', String(i + 1))),
          h('p.toc__preview', preview)));
      });
      left.appendChild(ol);
    }

    /* ---------- mis plantillas (A7): debajo del índice; se crean desde “Guardar” de una hoja o acá ---------- */
    function paintTemplates(list) {
      var add = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Nueva plantilla');
      add.addEventListener('click', function () {
        M.saveTemplate({ title: 'Mi plantilla', blocks: [{ type: 'text' }] }).then(function (t) { location.hash = R.template(t.id); });
      });
      var sec = h('section.templates-mine', { 'aria-labelledby': 'mine-title' },
        h('header.page-head', h('h2.t-display', { id: 'mine-title' }, 'Mis plantillas'), add));
      if (!list.length) {
        sec.appendChild(h('p.page-intro.t-text', 'Cualquier hoja se puede guardar como plantilla desde su botón Guardar. Las tuyas aparecen acá y al empezar una hoja nueva.'));
      } else {
        var ul = h('ul.template-list');
        list.forEach(function (t) {
          ul.appendChild(h('li', h('a.text-btn', { href: R.template(t.id) }, MC.icon('paginas'), t.title, h('span.t-meta', ' · ' + MC.views.pages.kindOf(t.blocks)))));
        });
        sec.appendChild(ul);
      }
      left.appendChild(sec);
    }

    /* ---------- lo que se repite (rutinas, también las pausadas) ---------- */
    function paintRepeats(list) {
      MC.clear(right);
      var add = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('plus'), 'Nueva repetición');
      add.addEventListener('click', function () { MC.repeat.editor(null, load); });
      right.appendChild(h('header.page-head', h('h2.t-display', 'Lo que se repite'), add));
      right.appendChild(h('p.page-intro.t-text', 'Aparece sola en los días que toca, sin presión: si un día no sale, no pasa nada. También podés pedirlo desde el menú de cualquier actividad.'));
      if (!list.length) {
        right.appendChild(c.empty('Todavía no se repite nada. Cuando quieras, armá lo primero.', 'ramita'));
        return;
      }
      var groups = {};
      list.forEach(function (r) { var k = r.archived ? 'pausa' : (r.moment || ''); (groups[k] = groups[k] || []).push(r); });
      ['manana', 'tarde', 'noche', '', 'pausa'].forEach(function (k) {
        if (!groups[k]) return;
        var ul = h('ul.routine-list');
        groups[k].forEach(function (r) {
          var next = r.archived ? null : RC.nextOccurrence(r, today, 400);
          var isSheet = r.kind === 'sheet';
          var editBtn = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Editar ' + r.title }, MC.icon('edit'));
          editBtn.addEventListener('click', function () { MC.repeat.editor(r, load); });
          // Sus días en el calendario: el mes de la próxima vez (o este, si está en pausa).
          var onCal = h('a.icon-btn.icon-btn--sm', { href: R.month(D.monthKey(next || today), { routine: r.id }), 'aria-label': 'Ver los días de «' + r.title + '» en el calendario', title: 'Ver sus días en el calendario' }, MC.icon('calendario'));
          var pause = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': (r.archived ? 'Retomar ' : 'Pausar ') + r.title }, MC.icon(r.archived ? 'play' : 'pause'));
          pause.addEventListener('click', function () {
            M.saveRoutine(Object.assign({}, r, { archived: !r.archived })).then(function () {
              c.toast(r.archived ? 'Retomaste «' + r.title + '».' : '«' + r.title + '» quedó en pausa.');
              load();
            });
          });
          ul.appendChild(h('li.routine', { class: r.archived ? 'is-paused' : null, dataset: { id: r.id } },
            h('div.routine__text',
              h('p.routine__title', isSheet ? h('span.routine__kind', MC.icon('paginas'), h('span.sr-only', 'Hoja: ')) : null, r.title),
              h('p.routine__rule', RC.describe(r)),
              // La próxima vez es un enlace a ese día.
              // Una hoja que se repite lleva directo a la hoja de ese día.
              next ? h('p.routine__next', h('a', { href: isSheet ? R.page(M.sheetOccurrenceId(r.id, next)) : R.day(next) }, (next === today ? 'hoy' : 'próxima: ' + D.longLabel(next)) + (isSheet ? ' (la hoja)' : ''))) : (r.archived ? h('p.routine__next', 'en pausa') : null)),
            isSheet ? null : onCal, pause, editBtn));
        });
        right.appendChild(h('section.routine-group', h('h3.routine-group__title', k === 'pausa' ? 'En pausa' : M.MOMENT_LABEL[k]), ul));
      });
    }

    function showFocus() {
      if (!focusId) return;
      var li = MC.$$('.routine', right).filter(function (x) { return x.dataset.id === focusId; })[0];
      focusId = null; // solo la primera vez: después la lista se comporta como siempre
      if (!li) return;
      li.classList.add('is-focus');
      li.setAttribute('aria-current', 'true');
      li.tabIndex = -1;
      setTimeout(function () {
        if (destroyed || !li.isConnected) return;
        li.focus({ preventScroll: true });
        li.scrollIntoView({ block: 'center' });
      }, 30);
    }

    load();
    return { destroy: function () { destroyed = true; }, refresh: load };
  }

  MC.views = MC.views || {};
  MC.views.sheets = { render: render };
})(window);
