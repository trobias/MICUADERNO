/* CALENDARIO — mes ilustrado y semana como agenda. Ver SPEC §7.3. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  function modeSwitch(mode, month, date, keep) {
    var sw = h('div.choice-row.cal-mode', { role: 'group', 'aria-label': 'Cómo ver el calendario' });
    [['mes', 'Mes', 'grid'], ['semana', 'Semana', 'week']].forEach(function (m) {
      var b = h('button.choice', { type: 'button', 'aria-pressed': String(mode === m[0]) }, MC.icon(m[2]), m[1]);
      b.addEventListener('click', function () {
        location.hash = m[0] === 'mes' ? R.month(month || D.monthKey(date), keep) : R.week(date || (month === D.monthKey(D.today()) ? D.today() : month + '-01'));
      });
      sw.appendChild(b);
    });
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
      h('p.routine-filter__text', 'Días de ', h('strong', '«' + routine.title + '»'), ': los que tocan de hoy en adelante y los que ya hiciste.'),
      h('a.text-btn', { href: R.routine(routine.id) }, 'Ver la rutina'),
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
    var ready = Promise.all([M.summaryRange(grid[0], grid[grid.length - 1]), routineId ? M.getRoutines() : null]).then(function (res) {
      if (destroyed) return;
      var sum = res[0];
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
          if (info && info.mood) parts.push(M.moodLabel(info.mood));
          // Pasado: solo lo hecho (sin cuentas de lo que quedó). Hoy y adelante: lo planeado, rutinas incluidas.
          var ahead = key >= today;
          var planned = ahead && info ? info.pending : 0;
          var pages = info ? info.pages : [];
          if (info && info.done) parts.push(info.done === 1 ? 'una cosa hecha' : info.done + ' cosas hechas');
          if (planned) parts.push(planned === 1 ? 'una cosa planeada' : planned + ' cosas planeadas');
          if (info && info.wrote) parts.push('escribiste');
          if (info && info.memory) parts.push('guardaste un recuerdo');
          if (pages.length) parts.push(pages.length === 1 ? 'empezaste una página' : 'empezaste ' + pages.length + ' páginas');
          // Con una rutina elegida: lo que ya se hizo, y de hoy en adelante los días que toca (nunca lo que no se hizo, D18).
          var rStatus = routine && info ? info.byRoutine[routine.id] : null;
          var rMark = !rStatus ? null : M.countsAsDone(rStatus) ? 'done' : ahead ? 'due' : null;
          if (rMark === 'done') parts.push((rStatus === 'partial' ? 'hiciste un poquito de «' : 'hiciste «') + routine.title + '»');
          if (rMark === 'due') parts.push('toca «' + routine.title + '»');
          var btn = h('button.day-cell', {
            type: 'button', role: 'gridcell', tabindex: '-1',
            'aria-label': parts.join(', '), 'aria-selected': String(key === marked),
            dataset: { date: key, mood: info && info.mood ? String(info.mood) : null, routine: rMark },
            class: [inMonth ? null : 'is-out', key === today ? 'is-today' : null, key > today ? 'is-future' : null, rMark ? 'is-routine' : null].filter(Boolean).join(' ')
          },
            h('span.day-cell__num', String(D.parse(key).d)),
            info && info.mood ? h('span.day-cell__patch', { html: MC.stickers.miniPatchMarkup(info.mood) }) : null,
            h('span.day-cell__marks',
              info && info.wrote ? h('span.mark-ink', { title: 'escribiste' }) : null,
              info && info.memory ? h('span.mark-star', { html: '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>' }) : null,
              info && info.done ? h('span.mark-x', { 'aria-hidden': 'true' }, '×' + info.done) : null,
              planned ? h('span.mark-plan', { 'aria-hidden': 'true' }, MC.icon('box'), String(planned)) : null,
              pages.length ? h('span.mark-page', { 'aria-hidden': 'true' }, MC.icon('paginas')) : null,
              rMark ? h('span.mark-routine', { 'aria-hidden': 'true' }, MC.icon('rutinas')) : null),
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
      page.appendChild(legend(routine));

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

  function legend(routine) {
    var labels = M.settings().moodLabels;
    return h('ul.mood-legend', { 'aria-label': 'Referencias' },
      [1, 2, 3, 4, 5].map(function (m) { return h('li', c.moodMark(m), labels[m - 1]); }),
      h('li', h('span.mark-ink'), 'escribiste'),
      h('li', h('span.mark-star', { html: '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>' }), 'recuerdo'),
      h('li', h('span.mark-x', '×'), 'hecho'),
      h('li', h('span.mark-plan', MC.icon('box')), 'planeado (con rutinas)'),
      h('li', h('span.mark-page', MC.icon('paginas')), 'página empezada'),
      routine ? h('li', h('span.mark-routine', MC.icon('rutinas')), '«' + routine.title + '»') : null);
  }

  /* ---------- SEMANA ---------- */
  function renderWeek(main, date) {
    var start = D.startOfWeek(date);
    var end = D.addDays(start, 6);
    var today = D.today();
    var destroyed = false;
    var leftPage = h('section.page.week-page');
    var rightPage = h('section.page.week-page');
    main.appendChild(h('div.spread', leftPage, h('div.spine', { 'aria-hidden': 'true' }), rightPage));

    var ready = Promise.all([M.getRoutines(), M.daysInRange(start, end), M.getPages()]).then(function (r) {
      var routines = r[0];
      var byDay = {};
      r[1].forEach(function (d) { byDay[d.date] = d; });
      var pagesByDay = M.summarize([], [], { from: start, to: end, pages: r[2] });
      return Promise.all(D.range(start, end).map(function (k) { return M.itemsForDay(k, routines); })).then(function (lists) {
        if (destroyed) return;
        var sp = D.parse(start), ep = D.parse(end);
        var title = sp.m === ep.m ? sp.d + ' al ' + ep.d + ' de ' + D.MONTHS[ep.m - 1] : sp.d + ' de ' + D.MONTHS[sp.m - 1] + ' al ' + ep.d + ' de ' + D.MONTHS[ep.m - 1];
        leftPage.appendChild(h('header.cal-head',
          h('div.cal-head__title',
            h('a.icon-btn', { href: R.week(D.addDays(start, -7)), 'aria-label': 'Semana anterior' }, MC.icon('arrow-left')),
            h('h1.t-display.week-title', 'Semana', h('span.week-title__range', title)),
            h('a.icon-btn', { href: R.week(D.addDays(start, 7)), 'aria-label': 'Semana siguiente' }, MC.icon('arrow-right'))),
          h('div.cal-head__tools', (today < start || today > end) ? h('a.text-btn', { href: R.week(today) }, 'Esta semana') : null, modeSwitch('semana', D.monthKey(date), date))));
        D.range(start, end).forEach(function (k, i) {
          (i < 3 ? leftPage : rightPage).appendChild(dayBlock(k, byDay[k], lists[i], today, pagesByDay[k] ? pagesByDay[k].pages : []));
        });
        if (!r[1].length && !Object.keys(pagesByDay).length && lists.every(function (l) { return !l.length; })) {
          leftPage.appendChild(h('p.section__hint.week-empty', 'Tu semana recién empieza.'));
        }
      });
    });
    return { destroy: function () { destroyed = true; }, ready: ready };
  }

  function dayBlock(k, day, list, today, pages) {
    var mood = day && (day.evening.mood || day.morning.mood);
    var p = D.parse(k);
    var head = h('a.week-day__head', { href: R.day(k) },
      h('span.week-day__name', D.capitalize(D.DAYS[D.weekday(k)])),
      h('span.week-day__num.t-display', String(p.d)),
      mood ? c.moodMark(mood, M.moodLabel(mood)) : null);
    var ul = h('ul.week-day__list');
    list.slice(0, 7).forEach(function (it) {
      ul.appendChild(h('li', { dataset: { status: it.status } },
        c.statusMark(it.status),
        h('span', it.title),
        h('span.sr-only', ' — ' + (it.status === 'pending' ? 'sin marcar' : M.STATUS_LABEL[it.status].toLowerCase()))));
    });
    if (list.length > 7) ul.appendChild(h('li.t-soft', '+ ' + (list.length - 7) + ' más'));
    var firstLine = day && (day.notes.trim().split('\n')[0] || day.intention.trim());
    return h('article.week-day', { class: k === today ? 'is-today' : null },
      head,
      list.length ? ul : null,
      firstLine ? h('p.week-day__line', firstLine.length > 90 ? firstLine.slice(0, 88) + '…' : firstLine) : null,
      pages.length ? c.pageLinks(pages, 'day-pages--week') : null,
      !list.length && !firstLine && !pages.length ? h('p.week-day__blank', k < today ? 'en blanco' : '') : null);
  }

  function render(main, params) {
    if (params.mode === 'semana') return renderWeek(main, params.date || D.today());
    return renderMonth(main, params.month || D.monthKey(D.today()), params.routine || null);
  }

  MC.views = MC.views || {};
  MC.views.calendar = { render: render };
})(window);
