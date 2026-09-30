/* MI AÑO — bastidor de punto cruz, lo que fui notando y lo que guardé. Ver SPEC §7.6. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, c = MC.c;

  function render(main, params) {
    var year = params.year;
    var today = D.today();
    var destroyed = false;
    var left = h('section.page.year-page');
    var right = h('section.page.page--margin.year-notes');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    Promise.all([M.summaryRange(year + '-01-01', year + '-12-31'), M.everything()]).then(function (r) {
      if (destroyed) return;
      var sum = r[0], all = r[1];
      var labels = M.settings().moodLabels;

      // Encabezado
      var y = +year;
      left.appendChild(h('header.cal-head',
        h('div.cal-head__title',
          h('a.icon-btn', { href: '#/anio/' + (y - 1), 'aria-label': 'Año anterior' }, MC.icon('arrow-left')),
          h('h1.t-display', 'Mi año ', h('span.cal-head__year', year)),
          h('a.icon-btn', { href: '#/anio/' + (y + 1), 'aria-label': 'Año siguiente' }, MC.icon('arrow-right')))));

      var filled = Object.keys(sum).filter(function (k) { return sum[k].mood; }).length;
      left.appendChild(h('p.year-intro.t-text', filled
        ? 'Cada punto cruz es un día con su ánimo. ' + (filled === 1 ? 'Ya hay uno bordado.' : 'Ya hay ' + filled + ' bordados.')
        : 'Un bastidor listo para bordar: cada día que registres cómo terminó, aparece un punto cruz del color de ese ánimo.'));

      // Bastidor
      var hoop = h('div.hoop', { role: 'grid', 'aria-label': 'Ánimo de cada día de ' + year, style: { '--cols': 12 } });
      var head = h('div.hoop__row.hoop__row--head', { role: 'row' }, h('span.hoop__corner', { role: 'columnheader', 'aria-label': 'Día' }));
      D.MONTHS_SHORT.forEach(function (m, i) { head.appendChild(h('span.hoop__month', { role: 'columnheader', 'aria-label': D.MONTHS[i] }, m.charAt(0).toUpperCase())); });
      hoop.appendChild(head);
      var cells = [];
      for (var d = 1; d <= 31; d++) {
        var row = h('div.hoop__row', { role: 'row' }, h('span.hoop__daynum', { role: 'rowheader' }, d % 5 === 0 || d === 1 ? String(d) : ''));
        for (var m = 1; m <= 12; m++) {
          if (d > D.daysInMonth(y, m)) { row.appendChild(h('span.hoop__gap', { role: 'gridcell', 'aria-hidden': 'true' })); continue; }
          var key = D.make(y, m, d);
          var info = sum[key];
          var mood = info && info.mood;
          var label = d + ' de ' + D.MONTHS[m - 1] + (mood ? ': ' + labels[mood - 1] : info && (info.wrote || info.total) ? ': sin ánimo registrado' : '');
          var cell = h('button.stitch-cell', {
            type: 'button', role: 'gridcell', tabindex: '-1', 'aria-label': label,
            dataset: { date: key, mood: mood ? String(mood) : null, row: String(d), col: String(m) },
            class: [key === today ? 'is-today' : null, !mood && info && (info.wrote || info.total) ? 'is-half' : null, key > today ? 'is-future' : null].filter(Boolean).join(' ')
          });
          cell.addEventListener('click', go);
          cell.addEventListener('keydown', onKey);
          cells.push(cell);
          row.appendChild(cell);
        }
        hoop.appendChild(row);
      }
      left.appendChild(h('div.hoop-frame', hoop));
      var focusKey = today.slice(0, 4) === year ? today : year + '-01-01';
      cells.forEach(function (x) { if (x.dataset.date === focusKey) x.tabIndex = 0; });

      left.appendChild(h('ul.mood-legend.year-legend', { 'aria-label': 'Referencias' },
        [1, 2, 3, 4, 5].map(function (mm) { return h('li', h('span.stitch-cell.stitch-cell--key', { dataset: { mood: String(mm) }, 'aria-hidden': 'true' }), h('span', { html: MC.stickers.miniPatchMarkup(mm) }), labels[mm - 1]); }),
        h('li', h('span.stitch-cell.stitch-cell--key.is-half', { 'aria-hidden': 'true' }), 'escribiste, sin ánimo')));

      function go(e) { location.hash = '#/dia/' + e.currentTarget.dataset.date; }
      function onKey(e) {
        var el = e.currentTarget;
        var r0 = +el.dataset.row, c0 = +el.dataset.col;
        var dr = { ArrowUp: -1, ArrowDown: 1 }[e.key] || 0;
        var dc = { ArrowLeft: -1, ArrowRight: 1 }[e.key] || 0;
        if (!dr && !dc) return;
        e.preventDefault();
        var target = null, rr = r0 + dr, cc = c0 + dc;
        // Salta los huecos (30 de febrero, etc.) siguiendo en la misma dirección.
        while (!target && rr >= 1 && rr <= 31 && cc >= 1 && cc <= 12) {
          target = hoop.querySelector('[data-row="' + rr + '"][data-col="' + cc + '"]');
          rr += dr; cc += dc;
        }
        if (target) { el.tabIndex = -1; target.tabIndex = 0; target.focus(); }
      }

      // Hoja derecha: lo que fui notando + lo que guardé
      var insights = MC.insights.compute(all, today.slice(0, 4) === year ? today : year + '-12-31');
      right.appendChild(h('h2.t-display.notes-title', 'Lo que fui notando'));
      if (insights.length <= 1) {
        right.appendChild(h('p.section__hint', 'Cuando llenes algunas páginas más, acá voy a ir anotando lo que noto.'));
      }
      right.appendChild(h('ul.noticed', insights.map(function (i) { return h('li', i.text); })));
      right.appendChild(h('p.noticed__foot.t-meta', 'Son solo cuentas de lo que registraste, no conclusiones.'));

      var memories = all.days.filter(function (dd) { return dd.date.slice(0, 4) === year && dd.reflection.keep.trim(); }).reverse();
      right.appendChild(h('h2.t-display.notes-title', 'Lo que guardé'));
      if (!memories.length) {
        right.appendChild(h('p.section__hint', 'Todavía no guardaste ningún recuerdo este año. Aparecen acá cuando completás “Qué quiero guardar” al cerrar un día.'));
      } else {
        var list = h('ul.memories');
        memories.slice(0, 60).forEach(function (dd) {
          list.appendChild(h('li.memory', { style: { '--tilt': ((MC.hash(dd.date) % 5) - 2) * 0.5 + 'deg' } },
            h('a.memory__link', { href: '#/dia/' + dd.date },
              h('span.memory__date', D.shortLabel(dd.date)),
              h('span.memory__text', dd.reflection.keep.trim()))));
        });
        right.appendChild(list);
      }
    });

    return { destroy: function () { destroyed = true; } };
  }

  MC.views = MC.views || {};
  MC.views.year = { render: render };
})(window);
