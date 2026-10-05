/* Editor de repetición (A5, D27): qué se repite y cuándo. Lo usan Mis hojas, el menú de una actividad y,
   desde A7, “Guardar” de una hoja. Las repeticiones son las rutinas de siempre (js/core/recurrence.js). */
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
    ['yearly', 'Todos los años'],
    ['once', 'Una sola vez']
  ];

  /**
   * existing: la repetición a editar, o null para crear una.
   * opts: { date: día desde el que se abre (semilla de días, mes y fecha; por defecto hoy), title, rule }.
   */
  function editor(existing, onSaved, opts) {
    opts = opts || {};
    var today = D.isValid(opts.date) ? opts.date : D.today();
    onSaved = onSaved || function () {};
    var r = existing ? MC.clone(existing) : { title: opts.title || '', rule: opts.rule || { type: 'weekdays', days: [D.weekday(today)] }, startDate: today, endDate: null, moment: null };
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
    // Errores junto al campo que los causa, enlazados con aria-describedby.
    var titleErr = h('p.form-error', { id: 'rt-title-err', role: 'alert' });
    var endErr = h('p.form-error', { id: 'rt-end-err', role: 'alert' });
    var error = h('p.form-error', { role: 'alert' });
    title.setAttribute('aria-describedby', 'rt-title-err');
    end.setAttribute('aria-describedby', 'rt-end-err');
    title.addEventListener('input', function () { titleErr.textContent = ''; title.removeAttribute('aria-invalid'); });
    end.addEventListener('change', function () { endErr.textContent = ''; end.removeAttribute('aria-invalid'); });

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
      } else if (t === 'yearly') {
        var p0 = D.parse(today);
        rule.month = rule.month || p0.m;
        rule.day = rule.day || p0.d;
        var mo = h('select.select', { id: 'rt-month', 'aria-label': 'Mes' }, D.MONTHS.map(function (name, i) { return h('option', { value: i + 1, selected: rule.month === i + 1 }, name); }));
        var dy = h('input.input.input--num', { id: 'rt-yday', type: 'number', min: 1, max: 31, value: rule.day, inputmode: 'numeric', 'aria-label': 'Día' });
        mo.addEventListener('change', function () { rule.month = +mo.value; paintPreview(); });
        dy.addEventListener('input', function () { rule.day = +dy.value || 1; paintPreview(); });
        extra.appendChild(h('div.field.field--inline', h('span', 'El'), dy, h('span', 'de'), mo, h('span', '(el 29 de febrero cae el 28 en los años comunes)')));
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
        return c.confirm({ title: '¿Mandar «' + existing.title + '» a la papelera?', text: 'Lo que ya marcaste queda en tus días. Podés recuperarla desde Ajustes.', confirm: 'Mandar a la papelera' })
          .then(function (ok) { if (!ok) return false; return M.deleteRoutine(existing.id).then(function () {
            onSaved(); setTimeout(function () { c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('routines', existing.id).then(onSaved); } }); }, 0);
          }); });
      } });
      actions.push({ spacer: true });
    }
    actions.push({ label: 'Cancelar', kind: 'text' });
    actions.push({ label: existing ? 'Guardar' : 'Que se repita', onClick: function () {
      var cur = currentRoutine();
      if (!cur.title) { titleErr.textContent = 'Poné un nombre, por ejemplo “caminar”.'; title.setAttribute('aria-invalid', 'true'); title.focus(); return false; }
      if (!cur.rule) { error.textContent = 'Elegí al menos un día de la semana.'; return false; }
      if (cur.endDate && cur.endDate < cur.startDate) { endErr.textContent = 'La fecha final quedó antes del inicio: movela un poco más adelante.'; end.setAttribute('aria-invalid', 'true'); end.focus(); return false; }
      return M.saveRoutine(cur).then(function (saved) { onSaved(saved); c.toast(existing ? 'Guardado.' : 'Listo: va a aparecer sola en los días que toca.'); });
    } });

    c.dialog({
      title: existing ? 'Editar lo que se repite' : 'Que se repita',
      content: [
        h('div.field', h('label', { for: 'rt-title' }, 'Nombre'), title, titleErr),
        h('div.field', h('label', { for: 'rt-freq' }, 'Frecuencia'), freq),
        extra,
        preview,
        h('div.field', h('span', 'Momento del día'), moment),
        h('div.rt-dates',
          h('div.field', h('label', { for: 'rt-start' }, 'Desde'), start),
          h('div.field', h('label.check', { for: 'rt-hasend' }, hasEnd, h('span', 'Hasta una fecha')), end, endErr)),
        error
      ],
      actions: actions
    });
    setTimeout(function () { if (!existing) title.focus(); }, 30);
  }

  MC.repeat = { editor: editor, FREQ: FREQ };
})(window);
