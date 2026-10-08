/* CALENDARIO — el mes ilustrado; la semana-planner vive en week.js (A6). Ver SPEC §7.3. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;
  var lastMode = null, pointerModeChange = false;

  function modeSwitch(mode, month, date, keep) {
    var sw = h('div.choice-row.cal-mode', { role: 'group', 'aria-label': 'Cómo ver el calendario' });
    var marker = h('span.cal-mode__marker', { 'aria-hidden': 'true', style: { transform: mode === 'semana' ? 'translateX(100%)' : 'none' } });
    sw.appendChild(marker);
    [['mes', 'Mes', 'grid'], ['semana', 'Semana', 'week']].forEach(function (m) {
      var b = h('button.choice', { type: 'button', 'aria-pressed': String(mode === m[0]) }, MC.icon(m[2]), m[1]);
      b.addEventListener('click', function (e) {
        pointerModeChange = e.detail > 0;
        location.hash = m[0] === 'mes' ? R.month(month || D.monthKey(date), keep) : R.week(date || (month === D.monthKey(D.today()) ? D.today() : month + '-01'));
      });
      sw.appendChild(b);
    });
    if (lastMode && lastMode !== mode && pointerModeChange && MC.motion.allows('move') && !MC.motion.systemReduced() && marker.animate) {
      marker.animate([{ transform: lastMode === 'semana' ? 'translateX(100%)' : 'none' }, { transform: mode === 'semana' ? 'translateX(100%)' : 'none' }],
        { duration: MC.motion.duration('ui'), easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() });
    }
    lastMode = mode; pointerModeChange = false;
    return sw;
  }

  /* ---------- MES (el centro de la app) ---------- */
  /** keep: { routine } para que cambiar de mes no apague los días marcados de una rutina. */
  function monthsStrip(month, keep) {
    var y = +month.slice(0, 4);
    var todayMonth = D.monthKey(D.today());
    var strip = h('nav.months', { 'aria-label': 'Meses de ' + y },
      h('a.icon-btn.icon-btn--sm.months__year-btn', { href: R.month((y - 1) + month.slice(4), keep), 'aria-label': 'Año anterior' }, MC.icon('arrow-left')),
      // El año lleva a Mi año: del mes al bastidor con un toque.
      h('a.months__year', { href: R.year(y), 'aria-label': 'Mi año ' + y, title: 'Ver Mi año ' + y }, String(y)),
      h('a.icon-btn.icon-btn--sm.months__year-btn', { href: R.month((y + 1) + month.slice(4), keep), 'aria-label': 'Año siguiente' }, MC.icon('arrow-right')));
    var list = h('ol.months__list');
    D.MONTHS_SHORT.forEach(function (m, i) {
      var key = y + '-' + D.pad(i + 1);
      list.appendChild(h('li', h('a.month-chip', {
        href: R.month(key, keep),
        'aria-label': D.MONTHS[i] + ' ' + y + (key === todayMonth ? ' (este mes)' : ''),
        'aria-current': key === month ? 'date' : null,
        class: key === todayMonth ? 'is-now' : null
      }, m)));
    });
    strip.appendChild(list);
    return strip;
  }

  /** Aviso arriba de la grilla cuando se muestran los días de una rutina. */
  function routineFilter(routine, month) {
    var off = h('a.text-btn', { href: R.month(month) }, MC.icon('close'), 'Dejar de mostrar');
    if (!routine) return h('div.routine-filter', h('p.routine-filter__text', 'Esa rutina ya no está en el cuaderno.'), off);
    return h('div.routine-filter',
      h('span.mark-routine', { 'aria-hidden': 'true' }, MC.icon('rutinas')),
      h('p.routine-filter__text', 'Días de ', h('strong', '«' + routine.title + '»'), ': los que tienen un estado registrado.'),
      h('a.text-btn', { href: R.routine(routine.id) }, 'Ver lo que se repite'),
      off);
  }

  function renderMonth(main, month, routineId) {
    var today = D.today();
    var keep = routineId ? { routine: routineId } : null;
    var grid = D.monthGrid(month);
    var marked = MC.ui.get('calSelected', null);
    if (!marked || D.monthKey(marked) !== month) marked = D.monthKey(today) === month ? today : null;
    var page = h('section.page.cal-page');
    main.appendChild(h('div.spread.spread--single', page));
    var destroyed = false;

    // `ready` avisa cuando el mes está dibujado (app.js lo usa para cambiarlo sin parpadeo).
    var ready = Promise.all([M.summaryRange(grid[0], grid[grid.length - 1], { recordedOnly: true }), routineId ? M.getRoutines() : null]).then(function (res) {
      if (destroyed) return;
      var sum = res[0];
      var palette = M.emotionPalette(Object.keys(sum).map(function (k) { return sum[k]; }), M.settings());
      var routine = routineId ? (res[1] || []).filter(function (x) { return x.id === routineId; })[0] || null : null;
      var label = D.monthLabel(month);
      page.appendChild(h('header.cal-head',
        h('h1.t-display.cal-head__month', D.capitalize(label.split(' ')[0]), h('span.cal-head__year', ' ' + label.split(' ')[1])),
        h('div.cal-head__tools', modeSwitch('mes', month, marked, keep))));
      page.appendChild(monthsStrip(month, keep));
      if (routineId) page.appendChild(routineFilter(routine, month));

      var table = h('div.month', { role: 'grid', 'aria-label': D.capitalize(label) + (routine ? ', con los días de «' + routine.title + '»' : '') + '. Tocá un día para abrir su página.' });
      var headRow = h('div.month__row.month__row--head', { role: 'row' });
      [1, 2, 3, 4, 5, 6, 0].forEach(function (wd) { headRow.appendChild(h('div.month__wd', { role: 'columnheader', 'aria-label': D.DAYS[wd] }, D.DAYS_SHORT[wd])); });
      table.appendChild(headRow);
      var cells = [];
      for (var w = 0; w < grid.length / 7; w++) {
        var r = h('div.month__row', { role: 'row' });
        grid.slice(w * 7, w * 7 + 7).forEach(function (key) {
          var info = sum[key];
          var inMonth = D.monthKey(key) === month;
          var parts = [D.parse(key).d + ' de ' + D.MONTHS[D.parse(key).m - 1]];
          if (key === today) parts.push('hoy');
          if (info && info.feelings.length) parts.push('te sentiste ' + info.feelings.join(', '));
          // D57: se muestran todos los estados salvo Sin marcar, tanto antes como hoy y después.
          var pages = info ? info.pages : [];
          if (info && info.done) parts.push(info.done === 1 ? 'una cosa hecha' : info.done + ' cosas hechas');
          if (info && info.wrote) parts.push('escribiste');
          if (info && info.memory) parts.push('guardaste un recuerdo');
          if (pages.length) parts.push((pages.length === 1 ? 'una página: ' : pages.length + ' páginas: ') + pages.map(function (pg) { return '«' + M.pageTitle(pg) + '»'; }).join(', '));
          // Lo que se lee en la celda: hilitos del color de su marcador (Agenda rubor, Rutinas salvia, Páginas lavanda).
          var shown = info ? info.items.filter(M.calendarVisible) : [];
          shown.sort(function (a, b) { return (a.kind === 'own' ? 0 : 1) - (b.kind === 'own' ? 0 : 1); });
          if (shown.length) parts.push('actividades: ' + shown.slice(0, 4).map(function (it) { return it.title + ' (' + M.STATUS_LABEL[it.status] + ')'; }).join(', ') + (shown.length > 4 ? ' y más' : ''));
          var lineItems = shown.map(function (it) { return { kind: it.kind, title: it.title, status: it.status }; })
            .concat(pages.map(function (pg) { return { kind: 'page', title: M.pageTitle(pg) }; }));
          // Con una rutina elegida, también los estados Hoy no salió y Lo dejo para otro día.
          var rStatus = routine && info ? info.byRoutine[routine.id] : null;
          var rMark = !rStatus || rStatus === 'pending' ? null : M.countsAsDone(rStatus) ? 'done' : rStatus;
          if (rMark === 'done') parts.push((rStatus === 'partial' ? 'hiciste un poquito de «' : 'hiciste «') + routine.title + '»');
          if (rMark === 'postponed' || rMark === 'skipped') parts.push('«' + routine.title + '»: ' + M.STATUS_LABEL[rStatus]);
          var btn = h('button.day-cell', {
            type: 'button', role: 'gridcell', tabindex: '-1',
            'aria-label': parts.join(', '), 'aria-selected': String(key === marked),
            dataset: { date: key, feeling: info && info.feelings.length ? info.feelings[0] : null, routine: rMark },
            class: [inMonth ? null : 'is-out', key === today ? 'is-today' : null, key > today ? 'is-future' : null, rMark ? 'is-routine' : null].filter(Boolean).join(' ')
          },
            h('span.day-cell__num', String(D.parse(key).d)),
            info && info.feelings.length ? h('span.day-cell__feelings', info.feelings.slice(0, 2).map(function (f) { return c.feelingMark(f, palette); }),
              info.feelings.length > 2 ? h('span.t-meta', '+' + (info.feelings.length - 2)) : null) : null,
            lineItems.length ? h('span.day-cell__lines', { 'aria-hidden': 'true' },
              lineItems.slice(0, 3).map(function (l) { return h('span.cell-line', { dataset: { kind: l.kind } }, l.status ? c.statusMark(l.status) : null, l.title); }),
              lineItems.length > 3 ? h('span.cell-line.cell-line--more', '+' + (lineItems.length - 3) + ' más') : null) : null,
            dayMarks({ wrote: info && info.wrote, memory: info && info.memory, done: info ? info.done : 0,
              postponed: shown.filter(function (it) { return it.status === 'postponed'; }).length,
              skipped: shown.filter(function (it) { return it.status === 'skipped'; }).length, pages: pages.length, routine: !!rMark }),
            key === marked ? h('span.day-cell__ribbon', { 'aria-hidden': 'true' }) : null);
          // Tocar un día abre su página en el cuadro desplegable.
          btn.addEventListener('click', function () { MC.ui.set('calSelected', key); location.hash = R.day(key); });
          btn.addEventListener('keydown', onKey);
          cells.push(btn);
          r.appendChild(btn);
        });
        table.appendChild(r);
      }
      page.appendChild(table);
      page.appendChild(legend(routine, palette));

      var focusKey = marked || month + '-01';
      cells.forEach(function (b) { if (b.dataset.date === focusKey) b.tabIndex = 0; });

      function onKey(e) {
        var i = cells.indexOf(e.currentTarget);
        var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (map[e.key] == null) return;
        e.preventDefault();
        var j = i + map[e.key];
        if (j < 0 || j >= cells.length) {
          var target = D.addDays(cells[i].dataset.date, map[e.key]);
          MC.ui.set('calSelected', target);
          location.hash = R.month(D.monthKey(target), keep);
          return;
        }
        cells[i].tabIndex = -1;
        cells[j].tabIndex = 0;
        cells[j].focus();
      }
    });

    return { destroy: function () { destroyed = true; }, ready: ready };
  }

  /* ---------- Marcas de un día (D49): botoncitos bordados, iguales en el mes y en la semana ----------
     Cada uno es un círculo con puntadas y su dibujito; el número va al lado. Nunca solo color: dibujito + texto
     en la leyenda y en el nombre del día. */
  var MARK_ART = {
    wrote: '<path d="M12 4.2c2.7 3.6 5 6.3 5 9.1a5 5 0 0 1-10 0c0-2.8 2.3-5.5 5-9.1z"/><path class="mark__shine" d="M10 13.6a2.2 2.2 0 0 0 1.6 2.3"/>',
    memory: '<path class="mark__fill" d="M12 3.6l2.5 5.1 5.6.8-4 3.9 1 5.6L12 16.4l-5.1 2.6 1-5.6-4-3.9 5.6-.8z"/>',
    done: '<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/>',
    planned: '<rect x="5" y="5" width="14" height="14" rx="3"/><path class="mark__dash" d="M8.5 12h7"/>',
    postponed: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    skipped: '<circle cx="12" cy="12" r="2.5"/>',
    page: '<path d="M7 3.8h7.2L18 7.6v12.6H7z"/><path d="M14 3.8v4h4M9.6 12h5.6M9.6 15.4h4"/>',
    routine: '<path d="M18.5 9.5A7 7 0 0 0 6 8M5.5 14.5A7 7 0 0 0 18 16"/><path d="M6 4.5V8h3.5M18 19.5V16h-3.5"/>'
  };
  function markBadge(kind, n) {
    return h('span.mark.mark--' + kind, { 'aria-hidden': 'true' },
      h('span.mark__badge', { html: '<svg viewBox="0 0 24 24" focusable="false">' + MARK_ART[kind] + '</svg>' }),
      n ? h('span.mark__n', String(n)) : null);
  }
  /** Las marcas de un día: { wrote, memory, done, planned, postponed, skipped, pages, routine }. */
  function dayMarks(o) {
    return h('span.day-cell__marks',
      o.wrote ? markBadge('wrote') : null,
      o.memory ? markBadge('memory') : null,
      o.done ? markBadge('done', o.done) : null,
      o.planned ? markBadge('planned', o.planned) : null,
      o.postponed ? markBadge('postponed', o.postponed) : null,
      o.skipped ? markBadge('skipped', o.skipped) : null,
      o.pages ? markBadge('page', o.pages > 1 ? o.pages : 0) : null,
      o.routine ? markBadge('routine') : null);
  }

  /** Referencias: las emociones con su parche, las marcas y (en el mes) los hilitos. */
  function legend(routine, palette, opts) {
    opts = opts || {};
    return h('ul.mood-legend', { 'aria-label': 'Referencias' },
      palette.labels.map(function (label) { return h('li', c.feelingMark(label, palette)); }),
      palette.otherCount ? h('li', 'Otras emociones, con su nombre') : null,
      h('li', markBadge('wrote'), 'escribiste'),
      h('li', markBadge('memory'), 'recuerdo'),
      h('li', markBadge('done'), 'hecho'),
      h('li', markBadge('postponed'), 'lo dejo para otro día'),
      h('li', markBadge('skipped'), 'hoy no salió'),
      h('li', markBadge('page'), 'hoja'),
      opts.week ? null : h('li.legend-line', h('span.cell-line', { dataset: { kind: 'own' } }), 'algo anotado'),
      opts.week ? null : h('li.legend-line', h('span.cell-line', { dataset: { kind: 'routine' } }), 'lo que se repite'),
      opts.week ? null : h('li.legend-line', h('span.cell-line', { dataset: { kind: 'page' } }), 'título de una hoja'),
      routine ? h('li', markBadge('routine'), '«' + routine.title + '»') : null);
  }

  /* ---------- SEMANA ---------- */
  function render(main, params) {
    if (params.mode === 'semana') return MC.views.week.render(main, params); // la semana-planner (A6, week.js)
    return renderMonth(main, params.month || D.monthKey(D.today()), params.routine || null);
  }

  MC.views = MC.views || {};
  MC.views.calendar = { render: render, parts: { modeSwitch: modeSwitch, monthsStrip: monthsStrip, dayMarks: dayMarks, legend: legend } };
})(window);
