/* MI AÑO — bastidor de punto cruz, lo que fui notando y lo que guardé. Ver SPEC §7.6. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  function render(main, params) {
    var year = params.year;
    var today = D.today();
    var destroyed = false;
    var left = h('section.page.year-page');
    var right = h('section.page.page--margin.year-notes');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    M.activeEverything().then(function (all) {
      if (destroyed) return;
      // Misma cuenta que el calendario, sobre lo ya cargado. Sin rutinas: el año solo borda lo registrado.
      var sum = M.summarize(all.days, all.activities, { from: year + '-01-01', to: year + '-12-31' });
      var palette = M.emotionPalette(all.days.filter(function (d) { return d.date.slice(0, 4) === year; }), all.meta.settings);

      // Encabezado
      var y = +year;
      left.appendChild(h('header.cal-head',
        h('div.cal-head__title',
          h('a.icon-btn', { href: R.year(y - 1), 'aria-label': 'Año anterior' }, MC.icon('arrow-left')),
          h('h1.t-display', 'Mi año ', h('span.cal-head__year', year)),
          h('a.icon-btn', { href: R.year(y + 1), 'aria-label': 'Año siguiente' }, MC.icon('arrow-right')))));

      var filled = Object.keys(sum).filter(function (k) { return sum[k].feelings.length; }).length;
      left.appendChild(h('p.year-intro.t-text', filled
        ? 'Cada punto cruz es un día con una emoción anotada. ' + (filled === 1 ? 'Ya hay uno bordado.' : 'Ya hay ' + filled + ' bordados.')
        : 'Un bastidor listo para bordar: cada día que anotes una emoción aparece un punto cruz.'));

      // Bastidor
      var hoop = h('div.hoop', { role: 'grid', 'aria-label': 'Emociones de cada día de ' + year, style: { '--cols': 12 } });
      var head = h('div.hoop__row.hoop__row--head', { role: 'row' }, h('span.hoop__corner', { role: 'columnheader', 'aria-label': 'Día' }));
      // Cada inicial de mes lleva a ese mes en el calendario.
      D.MONTHS_SHORT.forEach(function (m, i) {
        head.appendChild(h('span.hoop__month', { role: 'columnheader', 'aria-label': D.MONTHS[i] },
          h('a', { href: R.month(year + '-' + D.pad(i + 1)), 'aria-label': 'Ver ' + D.MONTHS[i] + ' en el calendario', title: D.capitalize(D.MONTHS[i]) }, m.charAt(0).toUpperCase())));
      });
      hoop.appendChild(head);
      var cells = [];
      for (var d = 1; d <= 31; d++) {
        var row = h('div.hoop__row', { role: 'row' }, h('span.hoop__daynum', { role: 'rowheader' }, d % 5 === 0 || d === 1 ? String(d) : ''));
        for (var m = 1; m <= 12; m++) {
          if (d > D.daysInMonth(y, m)) { row.appendChild(h('span.hoop__gap', { role: 'gridcell', 'aria-hidden': 'true' })); continue; }
          var key = D.make(y, m, d);
          var info = sum[key];
          var feelings = info ? info.feelings : [];
          var label = d + ' de ' + D.MONTHS[m - 1] + (feelings.length ? ': ' + feelings.join(', ') : info && (info.wrote || info.total) ? ': sin emoción registrada' : '');
          var cell = h('button.stitch-cell', {
            type: 'button', role: 'gridcell', tabindex: '-1', 'aria-label': label,
            dataset: { date: key, feeling: feelings.length ? feelings[0] : null, row: String(d), col: String(m) },
            style: { '--c': feelings.length ? palette.color(feelings[0]) : null },
            class: [key === today ? 'is-today' : null, !feelings.length && info && (info.wrote || info.total) ? 'is-half' : null, key > today ? 'is-future' : null].filter(Boolean).join(' ')
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
        palette.labels.map(function (value) { return h('li', h('span.stitch-cell.stitch-cell--key', { dataset: { feeling: value }, style: { '--c': palette.color(value) }, 'aria-hidden': 'true' }), value); }),
        palette.otherCount ? h('li', 'Otras emociones, con su nombre') : null,
        h('li', h('span.stitch-cell.stitch-cell--key.is-half', { 'aria-hidden': 'true' }), 'algo anotado, sin emoción')));

      function go(e) { location.hash = R.day(e.currentTarget.dataset.date); }
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
      right.appendChild(h('ul.noticed', insights.map(insightItem)));
      right.appendChild(h('p.noticed__foot.t-meta', 'Son solo cuentas de lo que registraste, no conclusiones.'));

      // Lo que guardé es un repaso y un recuerdo: no muestra días marcados para quedar afuera (PV1) ni lo borrado.
      var memories = all.days.filter(function (dd) {
        return dd.date.slice(0, 4) === year && dd.reflection.keep.trim() &&
          !M.isPrivate(dd, 'noReviews') && !M.isPrivate(dd, 'noMemory') && !M.isDeleted(dd);
      }).reverse();
      right.appendChild(h('h2.t-display.notes-title', 'Lo que guardé'));
      if (!memories.length) {
        right.appendChild(h('p.section__hint', 'Todavía no guardaste ningún recuerdo este año. Aparecen acá cuando completás “Qué quiero guardar” al cerrar un día.'));
      } else {
        var list = h('ul.memories');
        var SHOWN = 6;
        memories.forEach(function (dd, i) {
          list.appendChild(h('li.memory', { style: { '--tilt': ((MC.hash(dd.date) % 5) - 2) * 0.5 + 'deg' } },
            h('a.memory__link', { href: R.day(dd.date) },
              h('span.memory__date', D.shortLabel(dd.date)),
              h('span.memory__text', dd.reflection.keep.trim()))));
          if (i >= SHOWN) list.lastChild.hidden = true;
        });
        right.appendChild(list);
        if (memories.length > SHOWN) {
          var more = h('button.text-btn', { type: 'button', 'aria-expanded': 'false' }, 'Ver los ' + memories.length + ' recuerdos');
          more.addEventListener('click', function () {
            MC.$$('.memory', list).forEach(function (li) { li.hidden = false; });
            more.remove();
            list.children[SHOWN].querySelector('a').focus();
          });
          right.appendChild(more);
        }
      }
    });

    return { destroy: function () { destroyed = true; } };
  }

  /** Una observación con el camino a los días de los que habla (ver MC.insights). */
  function insightItem(i) {
    var li = h('li', h('p', i.text));
    var go = function (href, text) { return h('div.noticed__actions', h('a.text-btn', { href: href }, text)); };
    if (i.routineId && i.month) { li.appendChild(go(R.month(i.month, { routine: i.routineId }), 'Ver en el calendario')); return li; }
    var days = i.day ? [i.day] : (i.days || []);
    if (days.length === 1) { li.appendChild(go(R.day(days[0]), 'Ir a ese día')); return li; }
    if (!days.length) return li;
    var thisYear = D.today().slice(0, 4);
    var list = h('p.noticed__days', { id: MC.uid('days'), hidden: true });
    days.forEach(function (k, n) {
      if (n) list.appendChild(document.createTextNode(' · '));
      list.appendChild(h('a', { href: R.day(k) }, D.shortLabel(k) + (k.slice(0, 4) === thisYear ? '' : ' ' + k.slice(0, 4))));
    });
    var btn = h('button.text-btn', { type: 'button', 'aria-expanded': 'false', 'aria-controls': list.id }, 'Ver los días');
    btn.addEventListener('click', function () {
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Ocultar los días' : 'Ver los días';
    });
    li.appendChild(h('div.noticed__actions', btn));
    li.appendChild(list);
    return li;
  }

  MC.views = MC.views || {};
  MC.views.year = { render: render };
})(window);
