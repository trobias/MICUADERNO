/* IMPRIMIR MI CUADERNO — documento dedicado para papel o PDF (A4, A5, Carta). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, c = MC.c;

  var MARK = { pending: '', done: '<path d="M7 7l10 10M17 7 7 17"/>', partial: '<path d="M7 7l10 10"/>', postponed: '<path d="M6 12h10M13 8.5l3.5 3.5-3.5 3.5"/>', skipped: '<circle cx="12" cy="12" r="2.4" fill="currentColor"/>' };
  var REFL = [['good', 'Qué me hizo bien'], ['hard', 'Algo difícil'], ['lovely', 'Algo lindo'], ['keep', 'Qué quiero guardar'], ['free', 'Más']];

  function box(status) {
    return '<svg viewBox="0 0 24 24" class="p-box"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" fill="none" stroke="#9b8d89" stroke-dasharray="2 2"/><g fill="none" stroke="#493D3B" stroke-width="2.4" stroke-linecap="round">' + MARK[status] + '</g></svg>';
  }

  function moodPrint(n, labels) {
    return h('span.p-mood', h('span', { html: '<svg viewBox="0 0 24 24" class="p-glyph"><g fill="none" stroke="#493D3B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + MC.stickers.MOOD_GLYPHS[n].replace('class="fill"', 'fill="#493D3B"') + '</g></svg>' }), labels[n - 1]);
  }

  function build(all, opts) {
    var s = all.meta.settings;
    var labels = s.moodLabels;
    var inRange = function (k) { return k >= opts.from && k <= opts.to; };
    var days = all.days.filter(function (d) { return inRange(d.date); });
    var acts = all.activities.filter(function (a) { return inRange(a.date); });
    var byDate = {};
    days.forEach(function (d) { byDate[d.date] = { day: d, acts: [] }; });
    acts.forEach(function (a) { (byDate[a.date] = byDate[a.date] || { day: null, acts: [] }).acts.push(a); });
    var dates = Object.keys(byDate).sort();
    var doc = h('div.print-doc', { dataset: { size: opts.size } });

    if (opts.cover) {
      doc.appendChild(h('section.p-sheet.p-cover',
        h('div.p-cover__label',
          h('p.p-cover__title', 'MI CUADERNO'),
          h('p.p-cover__tag', 'un lugarcito para mí ♡'),
          s.name ? h('p.p-cover__name', s.name) : null,
          h('p.p-cover__range', 'del ' + D.shortLabel(opts.from) + ' ' + opts.from.slice(0, 4) + ' al ' + D.shortLabel(opts.to) + ' ' + opts.to.slice(0, 4))),
        h('div.p-cover__art', { html: MC.stickers.markup('mariposa') })));
    }

    if (opts.months) {
      var m = D.monthKey(opts.from);
      var last = D.monthKey(opts.to);
      while (m <= last) {
        var grid = D.monthGrid(m);
        var table = h('table.p-month');
        table.appendChild(h('thead', h('tr', [1, 2, 3, 4, 5, 6, 0].map(function (wd) { return h('th', D.DAYS_SHORT[wd]); }))));
        var tbody = h('tbody');
        for (var w = 0; w < grid.length / 7; w++) {
          var tr = h('tr');
          grid.slice(w * 7, w * 7 + 7).forEach(function (k) {
            var e = byDate[k];
            var mood = e && e.day && (e.day.evening.mood || e.day.morning.mood);
            var done = e ? e.acts.filter(function (a) { return a.status === 'done'; }).length : 0;
            tr.appendChild(h('td', { class: D.monthKey(k) === m ? null : 'is-out' },
              h('span.p-month__num', String(D.parse(k).d)),
              mood && D.monthKey(k) === m ? h('span', { html: '<svg viewBox="0 0 24 24" class="p-glyph"><g fill="none" stroke="#493D3B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + MC.stickers.MOOD_GLYPHS[mood].replace('class="fill"', 'fill="#493D3B"') + '</g></svg>' }) : null,
              done && D.monthKey(k) === m ? h('span.p-month__done', '×' + done) : null));
          });
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        doc.appendChild(h('section.p-sheet.p-month-sheet', h('h2.p-h', D.capitalize(D.monthLabel(m))), table,
          h('p.p-legend', [1, 2, 3, 4, 5].map(function (n) { return moodPrint(n, labels); }))));
        m = D.addMonths(m, 1);
      }
    }

    if (opts.days && dates.length) {
      var flow = h('section.p-flow');
      dates.forEach(function (k) {
        var e = byDate[k], d = e.day;
        var block = h('article.p-day',
          h('h3.p-day__date', D.capitalize(D.longLabel(k)) + ' de ' + k.slice(0, 4)));
        var moods = [];
        if (d && d.morning.mood) moods.push(h('span', 'Arranqué: ', moodPrint(d.morning.mood, labels)));
        if (d && d.evening.mood) moods.push(h('span', 'Terminé: ', moodPrint(d.evening.mood, labels)));
        if (moods.length) block.appendChild(h('p.p-day__moods', moods));
        if (d && d.intention.trim()) block.appendChild(h('p.p-day__intention', 'Algo que quería cuidar: ' + d.intention.trim()));
        if (e.acts.length) block.appendChild(h('ul.p-acts', e.acts.map(function (a) { return h('li', h('span', { html: box(a.status) }), a.title); })));
        if (d && d.notes.trim()) block.appendChild(h('p.p-day__notes', d.notes.trim()));
        if (d) REFL.forEach(function (r) { if (d.reflection[r[0]].trim()) block.appendChild(h('p.p-day__refl', h('em', r[1] + ': '), d.reflection[r[0]].trim())); });
        flow.appendChild(block);
      });
      doc.appendChild(flow);
    }

    if (opts.pages && all.pages.length) {
      all.pages.forEach(function (p) {
        doc.appendChild(h('section.p-sheet.p-page',
          h('h2.p-h', p.title || 'Sin título'),
          p.kind === 'list'
            ? h('ul.p-list', p.items.filter(function (it) { return it.text.trim(); }).map(function (it) { return h('li', it.text); }))
            : h('p.p-page__body', p.body)));
      });
    }

    if (opts.routines && all.routines.length) {
      doc.appendChild(h('section.p-sheet.p-routines', h('h2.p-h', 'Mis rutinas'),
        h('ul.p-list', all.routines.map(function (r) { return h('li', h('strong', r.title), ' — ' + MC.recurrence.describe(r) + (r.archived ? ' (en pausa)' : '')); }))));
    }
    return doc;
  }

  function printNow(all, opts) {
    var holder = document.getElementById('print-root');
    MC.clear(holder);
    var style = document.getElementById('print-page-style') || document.head.appendChild(h('style#print-page-style'));
    var sizes = { a4: 'A4', a5: 'A5', letter: 'letter' };
    style.textContent = '@page { size: ' + sizes[opts.size] + '; margin: ' + (opts.size === 'a5' ? '11mm 10mm' : '15mm 14mm') + '; }';
    holder.appendChild(build(all, opts));
    var cleanup = function () { MC.clear(holder); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(function () { window.print(); }, 60);
  }

  function render(main) {
    var today = D.today();
    var page = h('section.page.page--margin.print-page');
    main.appendChild(h('div.spread.spread--single', page));
    var state = { size: MC.ui.get('printSize', 'a4'), range: 'month', from: D.monthKey(today) + '-01', to: today, cover: true, months: true, days: true, pages: true, routines: true };

    page.appendChild(h('header.page-head', h('h1.t-display', 'Imprimir mi cuaderno'), h('a.text-btn', { href: '#/ajustes' }, MC.icon('arrow-left'), 'Ajustes')));
    page.appendChild(h('p.page-intro.t-text', 'Arma unas hojas lindas para imprimir o guardar como PDF (en el diálogo de impresión elegí “Guardar como PDF”).'));

    function radioRow(label, name, options, current, onPick) {
      var row = h('div.choice-row', { role: 'radiogroup', 'aria-label': label });
      options.forEach(function (o) {
        var b = h('button.choice', { type: 'button', role: 'radio', 'aria-checked': String(current === o[0]) }, o[1]);
        b.addEventListener('click', function () { MC.$$('.choice', row).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); onPick(o[0]); });
        row.appendChild(b);
      });
      return h('div.field', h('span', label), row);
    }

    var from = h('input.input', { type: 'date', id: 'pr-from', value: state.from });
    var to = h('input.input', { type: 'date', id: 'pr-to', value: state.to });
    var custom = h('div.rt-dates', h('div.field', h('label', { for: 'pr-from' }, 'Desde'), from), h('div.field', h('label', { for: 'pr-to' }, 'Hasta'), to));
    custom.hidden = true;
    from.addEventListener('change', function () { state.from = from.value; });
    to.addEventListener('change', function () { state.to = to.value; });

    function setRange(r) {
      state.range = r;
      custom.hidden = r !== 'custom';
      var y = today.slice(0, 4);
      if (r === 'month') { state.from = D.monthKey(today) + '-01'; state.to = today; }
      if (r === 'last') { var lm = D.addMonths(D.monthKey(today), -1); state.from = lm + '-01'; state.to = lm + '-' + D.pad(D.daysInMonth(+lm.slice(0, 4), +lm.slice(5, 7))); }
      if (r === 'year') { state.from = y + '-01-01'; state.to = y + '-12-31'; }
      if (r === 'all') { state.from = '1970-01-01'; state.to = '2999-12-31'; }
      if (r === 'custom') { state.from = from.value; state.to = to.value; }
    }

    page.appendChild(radioRow('Tamaño de hoja', 'size', [['a4', 'A4'], ['a5', 'A5'], ['letter', 'Carta']], state.size, function (v) { state.size = v; MC.ui.set('printSize', v); }));
    page.appendChild(radioRow('Qué parte', 'range', [['month', 'Este mes'], ['last', 'El mes pasado'], ['year', 'Este año'], ['all', 'Todo'], ['custom', 'Elegir fechas']], state.range, setRange));
    page.appendChild(custom);
    var inc = h('ul.check-list');
    [['cover', 'Portada'], ['months', 'Calendario de cada mes'], ['days', 'Los días'], ['pages', 'Mis páginas'], ['routines', 'Mis rutinas']].forEach(function (o) {
      var cb = h('input', { type: 'checkbox', id: 'pr-' + o[0], checked: state[o[0]] });
      cb.addEventListener('change', function () { state[o[0]] = cb.checked; });
      inc.appendChild(h('li', h('label.check', { for: 'pr-' + o[0] }, cb, h('span', o[1]))));
    });
    page.appendChild(h('div.field', h('span', 'Qué incluir'), inc));
    var go = h('button.label-btn', { type: 'button' }, MC.icon('print'), 'Preparar e imprimir');
    go.addEventListener('click', function () {
      if (!D.isValid(state.from) || !D.isValid(state.to) || state.from > state.to) { c.toast('Revisá las fechas: el inicio tiene que ser antes del final.'); return; }
      M.everything().then(function (all) {
        if (state.range === 'all') {
          var ds = all.days.map(function (d) { return d.date; }).concat(all.activities.map(function (a) { return a.date; })).sort();
          state.from = ds[0] || today; state.to = ds[ds.length - 1] || today;
        }
        printNow(all, state);
      });
    });
    page.appendChild(h('div.onboard__actions', go));
    return { destroy: function () {} };
  }

  MC.views = MC.views || {};
  MC.views.print = { render: render, build: build };
})(window);
