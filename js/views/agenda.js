/* AGENDA — poner cosas en el calendario (cualquier día) y ver lo que viene. Ver SPEC §7.8. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  /** “hoy”, “mañana”, “en 5 días”, “en 3 semanas”… (sin “faltan”: la agenda no apura). */
  function distance(k, today) {
    var rel = D.relativeLabel(k, today);
    if (rel) return rel;
    var n = D.diffDays(today, k);
    if (n < 14) return 'en ' + n + ' días';
    if (n < 60) return 'en ' + Math.round(n / 7) + ' semanas';
    return 'en ' + Math.round(n / 30) + ' meses';
  }

  function render(main) {
    var destroyed = false;
    var today = D.today();
    var lastAdded = null;
    var left = h('section.page.page--margin.agenda-page', { 'aria-label': 'Poner algo en el calendario' });
    var right = h('section.page.page--margin.agenda-list', { 'aria-label': 'Lo que viene' });
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    // Día propuesto: el marcado en el calendario si es de hoy en adelante; si no, hoy.
    var marked = MC.ui.get('calSelected', null);
    var start = D.isValid(marked) && marked >= today ? marked : today;

    /* ---------- Hoja izquierda: anotar ---------- */
    var what = h('input.input', { id: 'ag-what', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: 'el cumple de Nicole, turno con la dentista…', 'aria-describedby': 'ag-what-err' });
    var whatErr = h('p.form-error', { id: 'ag-what-err', role: 'alert' });
    var when = h('input.input', { id: 'ag-when', type: 'date', value: start, 'aria-describedby': 'ag-when-err' });
    var whenErr = h('p.form-error', { id: 'ag-when-err', role: 'alert' });
    what.addEventListener('input', function () { whatErr.textContent = ''; what.removeAttribute('aria-invalid'); MC.emit('typing'); });
    when.addEventListener('change', function () { whenErr.textContent = ''; when.removeAttribute('aria-invalid'); paintQuick(); });

    // Atajos de día: tocar uno pone esa fecha.
    var QUICK = [['Hoy', 0], ['Mañana', 1], ['En una semana', 7]];
    var quick = h('div.choice-row.agenda-quick', { role: 'group', 'aria-label': 'Atajos de día' });
    var quickBtns = QUICK.map(function (q) {
      var b = h('button.choice', { type: 'button', 'aria-pressed': 'false' }, q[0]);
      b.addEventListener('click', function () { when.value = D.addDays(today, q[1]); whenErr.textContent = ''; paintQuick(); });
      quick.appendChild(b);
      return b;
    });
    function paintQuick() {
      QUICK.forEach(function (q, i) { quickBtns[i].setAttribute('aria-pressed', String(when.value === D.addDays(today, q[1]))); });
    }
    paintQuick();

    var form = h('form.agenda-form', { novalidate: true },
      h('div.field', h('label', { for: 'ag-what' }, 'Qué'), what, whatErr),
      h('div.field', h('label', { for: 'ag-when' }, 'Qué día'), when, quick, whenErr),
      h('div.agenda-form__actions', h('button.label-btn', { type: 'submit' }, MC.icon('plus'), 'Poner en el calendario')));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = what.value.trim();
      if (!t) { whatErr.textContent = 'Escribí qué querés anotar, por ejemplo “llamar a la abuela”.'; what.setAttribute('aria-invalid', 'true'); what.focus(); return; }
      if (!D.isValid(when.value)) { whenErr.textContent = 'Elegí un día del calendario.'; when.setAttribute('aria-invalid', 'true'); when.focus(); return; }
      var date = when.value;
      M.addActivity(date, t).then(function (a) {
        what.value = '';
        what.focus();
        lastAdded = a && a.id;
        c.toast('Quedó en el calendario: ' + D.longLabel(date) + '.', { action: 'Ver ese día', onAction: function () { location.hash = R.day(date); } });
        load();
      });
    });

    function another(icon, label, hint, fn) {
      var b = h('button.agenda-more__btn', { type: 'button' }, MC.icon(icon), h('span', h('strong', label), h('span.agenda-more__hint', hint)));
      b.addEventListener('click', fn);
      return h('li', b);
    }

    left.appendChild(h('header.page-head', h('h1.t-display', 'Agenda')));
    left.appendChild(h('p.page-intro.t-text', 'Poné cosas en cualquier día del calendario. Aparecen en ese día y en su página.'));
    left.appendChild(form);
    left.appendChild(h('h2.agenda-more__title', 'También podés poner'));
    left.appendChild(h('ul.agenda-more',
      another('rutinas', 'Algo que se repite', 'una rutina: aparece sola en los días que toca', function () { MC.views.routines.editor(null, load); }),
      another('paginas', 'Una página para ese día', 'una lista, una carta, lo que quieras', function () {
        MC.views.pages.newPage(D.isValid(when.value) ? when.value : today);
      })));

    /* ---------- Hoja derecha: lo que viene ---------- */
    function load() {
      Promise.all([M.upcoming(today, 365), M.getPages()]).then(function (r) {
        if (destroyed) return;
        paintList(r[0], r[1].filter(function (p) { var k = M.pageDate(p); return k && k >= today; }));
      });
    }

    function paintList(acts, pages) {
      MC.clear(right);
      right.appendChild(h('h2.t-display.agenda-list__title', 'Lo que viene'));
      if (!acts.length && !pages.length) {
        right.appendChild(c.empty('Todavía no anotaste nada para los próximos días. Lo que pongas acá aparece en el calendario.', 'sobre'));
        return;
      }
      var byDay = {};
      acts.forEach(function (a) { (byDay[a.date] = byDay[a.date] || { acts: [], pages: [] }).acts.push(a); });
      pages.forEach(function (p) { var k = M.pageDate(p); (byDay[k] = byDay[k] || { acts: [], pages: [] }).pages.push(p); });
      Object.keys(byDay).sort().forEach(function (k) {
        var g = byDay[k];
        var p = D.parse(k);
        var ul = h('ul.activities', { 'aria-label': 'Lo del ' + D.longLabel(k) });
        g.acts.forEach(function (a) {
          ul.appendChild(MC.activityRow(a, { onRemoved: load, onRestored: load, onMoved: load }));
        });
        right.appendChild(h('section.agenda-day', { dataset: { date: k } },
          h('h3.agenda-day__head',
            h('a', { href: R.day(k) }, D.capitalize(D.DAYS[D.weekday(k)]) + ' ' + p.d + ' de ' + D.MONTHS[p.m - 1] + (p.y !== +today.slice(0, 4) ? ' de ' + p.y : '')),
            h('span.agenda-day__when', distance(k, today))),
          g.acts.length ? ul : null,
          g.pages.length ? c.pageLinks(g.pages) : null));
      });
      right.appendChild(h('p.section__hint.agenda-list__hint', 'Las rutinas no se listan acá: aparecen solas en sus días.'));
      appear();
    }

    // Lo recién anotado aparece suave en su lugar (sin moverse si el motion está apagado).
    function appear() {
      if (!lastAdded) return;
      var li = right.querySelector('.activity[data-id="' + lastAdded + '"]');
      lastAdded = null;
      if (!li) return;
      li.scrollIntoView({ block: 'nearest' });
      if (MC.motion.allows('fade') && li.animate) {
        li.animate([{ opacity: 0, transform: 'translateY(' + (MC.motion.allows('move') ? 6 : 0) + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      }
    }

    load();
    return { destroy: function () { destroyed = true; }, refresh: load };
  }

  MC.views = MC.views || {};
  MC.views.agenda = { render: render };
})(window);
