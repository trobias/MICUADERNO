/* MIS RUTINAS — crear, editar, pausar. Ver SPEC §7.4 y §11. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.recurrence, c = MC.c;

  var FREQ = [
    ['daily', 'Todos los días'],
    ['weekdays', 'Algunos días de la semana'],
    ['interval', 'Cada tantos días'],
    ['monthlyDay', 'Un día del mes'],
    ['monthlyNth', 'Un día de la semana del mes'],
    ['once', 'Una sola vez']
  ];

  function editor(existing, onSaved) {
    var today = D.today();
    var r = existing ? MC.clone(existing) : { title: '', rule: { type: 'daily' }, startDate: today, endDate: null, moment: null };
    var rule = r.rule;
    var title = h('input.input', { id: 'rt-title', type: 'text', value: r.title, maxlength: 120, placeholder: 'caminar, leer un rato, regar las plantas…', required: true });
    var freq = h('select.select', { id: 'rt-freq' }, FREQ.map(function (f) { return h('option', { value: f[0], selected: rule.type === f[0] }, f[1]); }));
    var extra = h('div.rt-extra');
    var preview = h('p.rt-preview.t-hand', { 'aria-live': 'polite' });
    var moment = h('div.choice-row', { role: 'radiogroup', 'aria-label': 'Momento del día' });
    [['manana', 'Mañana'], ['tarde', 'Tarde'], ['noche', 'Noche'], ['', 'Cuando sea']].forEach(function (m) {
      var b = h('button.choice', { type: 'button', role: 'radio', 'aria-checked': String((r.moment || '') === m[0]) }, m[1]);
      b.addEventListener('click', function () {
        r.moment = m[0] || null;
        MC.$$('.choice', moment).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      });
      moment.appendChild(b);
    });
    var start = h('input.input', { id: 'rt-start', type: 'date', value: r.startDate });
    var hasEnd = h('input', { id: 'rt-hasend', type: 'checkbox', checked: !!r.endDate });
    var end = h('input.input', { id: 'rt-end', type: 'date', value: r.endDate || D.addDays(today, 30), disabled: !r.endDate });
    hasEnd.addEventListener('change', function () { end.disabled = !hasEnd.checked; });
    var error = h('p.form-error', { role: 'alert' });

    function paintExtra() {
      MC.clear(extra);
      var t = freq.value;
      if (t === 'weekdays') {
        rule.days = Array.isArray(rule.days) && rule.days.length ? rule.days : [D.weekday(today)];
        var row = h('div.choice-row', { role: 'group', 'aria-label': 'Días' });
        [1, 2, 3, 4, 5, 6, 0].forEach(function (wd) {
          var b = h('button.choice.choice--day', { type: 'button', 'aria-pressed': String(rule.days.indexOf(wd) !== -1), 'aria-label': D.DAYS[wd] }, D.DAYS_SHORT[wd]);
          b.addEventListener('click', function () {
            var i = rule.days.indexOf(wd);
            if (i === -1) rule.days.push(wd); else if (rule.days.length > 1) rule.days.splice(i, 1);
            b.setAttribute('aria-pressed', String(rule.days.indexOf(wd) !== -1));
            paintPreview();
          });
          row.appendChild(b);
        });
        extra.appendChild(row);
      } else if (t === 'interval') {
        var n = h('input.input.input--num', { id: 'rt-every', type: 'number', min: 2, max: 60, value: rule.every || 2, inputmode: 'numeric' });
        n.addEventListener('input', function () { rule.every = +n.value || 2; paintPreview(); });
        rule.every = rule.every || 2;
        extra.appendChild(h('div.field.field--inline', h('label', { for: 'rt-every' }, 'Cada'), n, h('span', 'días, empezando el día de inicio')));
      } else if (t === 'monthlyDay') {
        var dnum = h('input.input.input--num', { id: 'rt-day', type: 'number', min: 1, max: 31, value: rule.day || D.parse(today).d, inputmode: 'numeric' });
        rule.day = rule.day || D.parse(today).d;
        dnum.addEventListener('input', function () { rule.day = +dnum.value || 1; paintPreview(); });
        extra.appendChild(h('div.field.field--inline', h('label', { for: 'rt-day' }, 'El día'), dnum, h('span', 'de cada mes (si el mes es más corto, el último día)')));
      } else if (t === 'monthlyNth') {
        rule.nth = rule.nth || 1;
        rule.weekday = rule.weekday == null ? 6 : rule.weekday;
        var nth = h('select.select', { id: 'rt-nth', 'aria-label': 'Cuál' }, [[1, 'Primer'], [2, 'Segundo'], [3, 'Tercer'], [4, 'Cuarto'], [-1, 'Último']].map(function (o) { return h('option', { value: o[0], selected: rule.nth === o[0] }, o[1]); }));
        var wd = h('select.select', { id: 'rt-wd', 'aria-label': 'Día de la semana' }, [1, 2, 3, 4, 5, 6, 0].map(function (d) { return h('option', { value: d, selected: rule.weekday === d }, D.DAYS[d]); }));
        nth.addEventListener('change', function () { rule.nth = +nth.value; paintPreview(); });
        wd.addEventListener('change', function () { rule.weekday = +wd.value; paintPreview(); });
        extra.appendChild(h('div.field.field--inline', nth, wd, h('span', 'del mes')));
      } else if (t === 'once') {
        var dt = h('input.input', { id: 'rt-date', type: 'date', value: rule.date || today });
        rule.date = rule.date || today;
        dt.addEventListener('change', function () { rule.date = dt.value; paintPreview(); });
        extra.appendChild(h('div.field', h('label', { for: 'rt-date' }, 'Qué día'), dt));
      }
    }

    function currentRoutine() {
      var clean = R.sanitizeRule(Object.assign({}, rule, { type: freq.value }));
      return Object.assign({}, r, {
        title: title.value.trim(), rule: clean,
        startDate: D.isValid(start.value) ? start.value : today,
        endDate: hasEnd.checked && D.isValid(end.value) ? end.value : null
      });
    }

    function paintPreview() {
      var cur = currentRoutine();
      if (!cur.rule) { preview.textContent = ''; return; }
      var next = R.nextOccurrence(cur, today < cur.startDate ? cur.startDate : today, 400);
      preview.textContent = R.describe(cur) + (next ? ' · la próxima: ' + (next === today ? 'hoy' : D.longLabel(next)) : ' · ya no le quedan días');
    }

    freq.addEventListener('change', function () { rule.type = freq.value; paintExtra(); paintPreview(); });
    [start, end, hasEnd, title].forEach(function (el) { el.addEventListener('change', paintPreview); });
    paintExtra();
    paintPreview();

    var actions = [];
    if (existing) {
      actions.push({ label: 'Borrar', kind: 'text', icon: 'trash', onClick: function () {
        return c.confirm({ title: '¿Borrar «' + existing.title + '»?', text: 'Lo que ya marcaste queda en tus días. Solo deja de aparecer de acá en adelante.', confirm: 'Borrar la rutina', danger: true })
          .then(function (ok) { if (!ok) return false; return M.deleteRoutine(existing.id).then(function () { onSaved(); c.toast('Rutina borrada.'); }); });
      } });
      actions.push({ spacer: true });
    }
    actions.push({ label: 'Cancelar', kind: 'text' });
    actions.push({ label: existing ? 'Guardar' : 'Crear rutina', onClick: function () {
      var cur = currentRoutine();
      if (!cur.title) { error.textContent = 'Poné un nombre para la rutina.'; title.focus(); return false; }
      if (!cur.rule) { error.textContent = 'Elegí al menos un día.'; return false; }
      if (cur.endDate && cur.endDate < cur.startDate) { error.textContent = 'La fecha final es antes del inicio.'; end.focus(); return false; }
      return M.saveRoutine(cur).then(function () { onSaved(); c.toast(existing ? 'Rutina guardada.' : 'Rutina creada. Va a aparecer sola en tus días.'); });
    } });

    c.dialog({
      title: existing ? 'Editar rutina' : 'Nueva rutina',
      content: [
        h('div.field', h('label', { for: 'rt-title' }, 'Nombre'), title),
        h('div.field', h('label', { for: 'rt-freq' }, 'Frecuencia'), freq),
        extra,
        preview,
        h('div.field', h('span', 'Momento del día'), moment),
        h('div.rt-dates',
          h('div.field', h('label', { for: 'rt-start' }, 'Desde'), start),
          h('div.field', h('label.check', { for: 'rt-hasend' }, hasEnd, h('span', 'Hasta una fecha')), end)),
        error
      ],
      actions: actions
    });
    setTimeout(function () { if (!existing) title.focus(); }, 30);
  }

  function render(main) {
    var destroyed = false;
    var today = D.today();
    var left = h('section.page.page--margin.routines-page');
    var right = h('section.page.page--margin.routines-week');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    function load() {
      M.getRoutines().then(function (list) {
        if (destroyed) return;
        paintList(list);
        paintWeek(list);
      });
    }

    function paintList(list) {
      MC.clear(left);
      var add = h('button.label-btn', { type: 'button' }, MC.icon('plus'), 'Nueva rutina');
      add.addEventListener('click', function () { editor(null, load); });
      left.appendChild(h('header.page-head', h('h1.t-display', 'Mis rutinas'), add));
      left.appendChild(h('p.page-intro.t-text', 'Cosas que se repiten. Aparecen solas en el día que toca, sin presión: si un día no sale, no pasa nada.'));
      if (!list.length) {
        left.appendChild(c.empty('Todavía no hay rutinas. Cuando quieras, armá la primera.', 'ramita'));
        return;
      }
      var groups = {};
      list.forEach(function (r) { var k = r.archived ? 'pausa' : (r.moment || ''); (groups[k] = groups[k] || []).push(r); });
      ['manana', 'tarde', 'noche', '', 'pausa'].forEach(function (k) {
        if (!groups[k]) return;
        var ul = h('ul.routine-list');
        groups[k].forEach(function (r) {
          var next = r.archived ? null : R.nextOccurrence(r, today, 400);
          var editBtn = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Editar ' + r.title }, MC.icon('edit'));
          editBtn.addEventListener('click', function () { editor(r, load); });
          var pause = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': (r.archived ? 'Retomar ' : 'Pausar ') + r.title }, MC.icon(r.archived ? 'play' : 'pause'));
          pause.addEventListener('click', function () {
            M.saveRoutine(Object.assign({}, r, { archived: !r.archived })).then(function () {
              c.toast(r.archived ? 'Retomaste «' + r.title + '».' : '«' + r.title + '» quedó en pausa.');
              load();
            });
          });
          ul.appendChild(h('li.routine', { class: r.archived ? 'is-paused' : null },
            h('div.routine__text',
              h('p.routine__title', r.title),
              h('p.routine__rule', R.describe(r)),
              next ? h('p.routine__next', next === today ? 'hoy' : 'próxima: ' + D.longLabel(next)) : (r.archived ? h('p.routine__next', 'en pausa') : null)),
            pause, editBtn));
        });
        left.appendChild(h('section.routine-group', h('h2.routine-group__title', k === 'pausa' ? 'En pausa' : M.MOMENT_LABEL[k]), ul));
      });
    }

    function paintWeek(list) {
      MC.clear(right);
      var start = D.startOfWeek(today);
      right.appendChild(h('h2.t-display.week-mini__title', 'Así se ve tu semana'));
      var active = list.filter(function (r) { return !r.archived; });
      if (!active.length) {
        right.appendChild(h('p.section__hint', 'Cuando tengas rutinas, acá vas a ver en qué días caen.'));
        return;
      }
      var ul = h('ul.week-mini');
      D.range(start, D.addDays(start, 6)).forEach(function (k) {
        var hits = active.filter(function (r) { return R.occursOn(r, k); });
        ul.appendChild(h('li.week-mini__day', { class: k === today ? 'is-today' : null },
          h('a.week-mini__name', { href: '#/dia/' + k }, D.DAYS_SHORT[D.weekday(k)] + ' ' + D.parse(k).d),
          h('span.week-mini__items', hits.length ? hits.slice(0, 5).map(function (r) { return r.title; }).join(' · ') + (hits.length > 5 ? ' · y ' + (hits.length - 5) + ' más' : '') : '—')));
      });
      right.appendChild(ul);
      right.appendChild(h('p.section__hint.week-mini__hint', 'Tocá un día para abrir su página.'));
    }

    load();
    return { destroy: function () { destroyed = true; }, refresh: load };
  }

  MC.views = MC.views || {};
  MC.views.routines = { render: render, editor: editor };
})(window);
