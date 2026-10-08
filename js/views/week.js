/* MI SEMANA — la semana-planner, vista por defecto del calendario (A6, D27). Ver SPEC §7.3.
   Grilla como un planner de papel: Importante · Lunes · Martes / Miércoles · Jueves · Viernes / Sábado ·
   Domingo · Notas (tres columnas en pantallas anchas, dos en tablet, una en el celular).
   Se edita en el fondo: cada día tiene sus actividades (la misma fila de siempre) y un renglón para anotar;
   Importante y Notas son de la semana (`weeks`, con borrador D13). Contrato de vista base:
   { ready, destroy, flush, busy } — mientras se escribe acá, el calendario en vivo espera (D21). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  // Orden de lectura del planner: Importante, los siete días y Notas.
  function render(main, params) {
    var date = D.isValid(params.date) ? params.date : D.today();
    var start = D.startOfWeek(date);
    var end = D.addDays(start, 6);
    var today = D.today();
    var destroyed = false;
    var week = null;
    var plan = null, progressBox = null, progressSeq = 0;
    var dailyCounts = {};
    var saved = c.savedNote();
    var page = h('section.page.cal-page.planner-page', { 'aria-label': 'Mi semana' });
    main.appendChild(h('div.spread.spread--single', page));

    /* ---------- Importante y Notas: se guardan con borrador ---------- */
    var draftKey = 'draft.week.' + start;
    var rev = 0, savedRev = 0;
    var save = MC.debounce(function () {
      var r = rev;
      saved.track(M.saveWeek(week).then(function (w) {
        week.createdAt = w.createdAt; week.updatedAt = w.updatedAt;
        savedRev = Math.max(savedRev, r);
        if (r === rev && c.durable()) MC.ui.set(draftKey, null);
      }), function () { return r === rev; });
    }, 500);
    function persist() { rev++; MC.ui.set(draftKey, { at: Date.now(), week: week }); saved.saving(); save(); }

    function recoverDraft(stored) {
      var draft = MC.ui.get(draftKey, null);
      if (!draft || !draft.week) return stored;
      var storedAt = stored.updatedAt ? Date.parse(stored.updatedAt) : 0;
      if (draft.at <= storedAt) { MC.ui.set(draftKey, null); return stored; }
      var recovered = M.normalizeWeek(draft.week) || stored;
      setTimeout(function () { saved.track(M.saveWeek(recovered).then(function () { if (c.durable()) MC.ui.set(draftKey, null); })); }, 0);
      return recovered;
    }

    var ready = Promise.all([M.getRoutines(), M.daysInRange(start, end), M.getPages(), M.getWeek(start)]).then(function (r) {
      var routines = r[0];
      var byDay = {};
      r[1].forEach(function (d) { byDay[d.date] = d; });
      var pagesByDay = M.summarize([], [], { from: start, to: end, pages: r[2] });
      return M.ensureActivityPlan(start, routines).then(function (captured) {
        plan = captured;
        return Promise.all(D.range(start, end).map(function (k) { return M.itemsForDay(k, routines, plan); }));
      }).then(function (lists) {
        if (destroyed) return;
        week = recoverDraft(r[3]);
        var palette = M.emotionPalette(r[1], M.settings());
        page.appendChild(head());
        progressBox = progressSection();
        page.appendChild(progressBox);
        var grid = h('div.planner', { role: 'list', 'aria-label': 'Semana del ' + D.longLabel(start) + ' al ' + D.longLabel(end) });
        grid.appendChild(importantCell());
        D.range(start, end).forEach(function (k, i) {
          grid.appendChild(dayCell(k, byDay[k], lists[i], pagesByDay[k] ? pagesByDay[k].pages : [], palette));
        });
        grid.appendChild(notesCell());
        page.appendChild(grid);
        page.appendChild(MC.views.calendar.parts.legend(null, palette, { week: true }));
        page.appendChild(h('div.planner__foot', saved));
        // La barra y el comienzo de la semana quedan visibles también en el celular.
        return refreshProgress();
      });
    });

    function progressSection() {
      var add = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Programar actividad');
      add.addEventListener('click', function () {
        MC.repeat.editor(null, null, { date: today >= start && today <= end ? today : start, rule: { type: 'weekdays', days: [1, 2, 3, 4, 5] } });
      });
      return h('section.week-progress', { 'aria-labelledby': 'week-progress-title' },
        h('div.week-progress__head', h('h2.planner__title', { id: 'week-progress-title' }, 'Progreso semanal'), h('span.week-progress__percent')),
        h('progress.week-progress__bar', { max: 100, value: 0, 'aria-label': 'Progreso semanal' }),
        h('p.week-progress__count.t-meta', { 'aria-live': 'polite', 'aria-atomic': 'true' }),
        h('details.week-progress__details', { dataset: { focus: 'goals' } },
          h('summary', 'Ver objetivos y organizar'), h('ul.week-progress__goals'),
          h('p.t-meta', 'Las metas flexibles se cuentan por semana; cada día que marcás cuenta una vez.'), add));
    }

    function refreshProgress() {
      var seq = ++progressSeq;
      return M.getWeeklyProgress(start, plan).then(function (p) {
        if (destroyed || !progressBox || seq !== progressSeq) return;
        progressBox.querySelector('.week-progress__percent').textContent = p.total ? p.percent + '%' : '—';
        var bar = progressBox.querySelector('progress');
        bar.value = p.percent;
        bar.setAttribute('aria-valuetext', p.total ? p.done + ' de ' + p.total + ' actividades completadas' : 'Sin actividades programadas');
        progressBox.querySelector('.week-progress__count').textContent = p.total ? p.done + ' de ' + p.total + ' actividades completadas' : 'Todavía no hay actividades programadas para esta semana.';
        var ul = progressBox.querySelector('.week-progress__goals');
        MC.clear(ul);
        p.goals.forEach(function (g) {
          ul.appendChild(h('li.week-progress__goal',
            h('span', g.routineId ? h('a', { href: R.routine(g.routineId) }, g.title) : g.title,
              g.targetNote ? h('span.t-meta', ' · ' + g.targetNote) : null),
            h('span.t-meta', g.done + ' de ' + g.total + (g.done === g.total ? ' · completo' : '') + (g.flexible ? ' · días a elección' : ''))));
        });
        Object.keys(dailyCounts).forEach(function (k) {
          var day = p.daily[k];
          dailyCounts[k].textContent = day.total ? day.done + ' de ' + day.total + ' completadas' : 'Sin actividades con día fijo';
        });
      });
    }

    // Actualiza las cuentas sin reemplazar casillas, campos, menús ni el foco.
    var offProgress = MC.on('store:changed', function (change) {
      if (change.store === 'activities' || change.store === 'days' || change.store === '*') refreshProgress();
    });
    var offRemote = MC.on('store:remote', function () { refreshProgress(); });

    function head() {
      var sp = D.parse(start), ep = D.parse(end);
      var range = sp.m === ep.m ? sp.d + ' al ' + ep.d + ' de ' + D.MONTHS[ep.m - 1] : sp.d + ' de ' + D.MONTHS[sp.m - 1] + ' al ' + ep.d + ' de ' + D.MONTHS[ep.m - 1];
      var parts = MC.views.calendar.parts;
      return h('header.cal-head',
        h('div.cal-head__title',
          h('a.icon-btn', { href: R.week(D.addDays(start, -7)), 'aria-label': 'Semana anterior' }, MC.icon('arrow-left')),
          h('h1.t-display.week-title', 'Mi semana', h('span.week-title__range', range)),
          h('a.icon-btn', { href: R.week(D.addDays(start, 7)), 'aria-label': 'Semana siguiente' }, MC.icon('arrow-right'))),
        h('div.cal-head__tools', (today < start || today > end) ? h('a.text-btn', { href: R.week(today) }, 'Esta semana') : null,
          parts.modeSwitch('semana', D.monthKey(date), date)),
        parts.monthsStrip(D.monthKey(start)));
    }

    /* ---------- Importante: casillas de la semana ---------- */
    function importantCell() {
      var ul = h('ul.planner__checks');
      function row(it) {
        var box = c.stitchBox(it.done ? 'done' : 'pending', it.text || 'algo importante');
        box.addEventListener('click', function () {
          it.done = !it.done;
          c.setStitch(box, it.done ? 'done' : 'pending', it.text || 'algo importante', true);
          persist(); save.flush();
        });
        var input = h('input.write.planner__line', { type: 'text', value: it.text, maxlength: 200, 'aria-label': 'Importante', placeholder: 'algo importante…', enterkeyhint: 'next' });
        input.addEventListener('input', function () { it.text = input.value; MC.emit('typing'); persist(); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            var nu = { id: MC.uid('imp'), text: '', done: false };
            week.important.splice(week.important.indexOf(it) + 1, 0, nu);
            var r = row(nu);
            li.after(r);
            r.querySelector('input').focus();
          } else if (e.key === 'Backspace' && !input.value && week.important.length > 1) {
            e.preventDefault();
            week.important.splice(week.important.indexOf(it), 1);
            var prev = li.previousElementSibling || li.nextElementSibling;
            li.remove();
            if (prev) prev.querySelector('input').focus();
            persist();
          }
        });
        var li = h('li.planner__check', { dataset: { focus: 'imp:' + it.id } }, box, input);
        return li;
      }
      if (!week.important.length || week.important[week.important.length - 1].text.trim()) week.important.push({ id: MC.uid('imp'), text: '', done: false });
      week.important.forEach(function (it) { ul.appendChild(row(it)); });
      return h('section.planner__cell.planner__cell--important', { role: 'listitem', 'aria-labelledby': 'pl-important' },
        h('h2.planner__title', { id: 'pl-important' }, 'Importante'), ul);
    }

    /* ---------- Notas de la semana ---------- */
    function notesCell() {
      var ta = c.writeArea({ id: 'week-notes', value: week.notes, rows: 6, ariaLabel: 'Notas de la semana', placeholder: 'lo que quieras anotar esta semana…', onInput: function (v) { week.notes = v; persist(); } });
      return h('section.planner__cell.planner__cell--notes', { role: 'listitem', 'aria-labelledby': 'pl-notes', dataset: { focus: 'notes' } },
        h('h2.planner__title', { id: 'pl-notes' }, 'Notas'), ta);
    }

    /* ---------- Un día ---------- */
    function dayCell(k, day, list, pages, palette) {
      var past = k < today;
      var feelings = day && (M.feelingsOf(day.evening).length ? M.feelingsOf(day.evening) : M.feelingsOf(day.morning));
      var p = D.parse(k);
      var cell = h('article.week-day.planner__cell', { role: 'listitem', class: k === today ? 'is-today' : null, dataset: { date: k } });
      var headLink = h('a.week-day__head', { href: R.day(k), dataset: { date: k, focus: 'head:' + k }, 'aria-label': D.capitalize(D.DAYS[D.weekday(k)]) + ' ' + p.d + ' de ' + D.MONTHS[p.m - 1] + (k === today ? ' (hoy)' : '') },
        h('span.week-day__name', D.capitalize(D.DAYS[D.weekday(k)])),
        h('span.week-day__num.t-display', String(p.d)));
      // Las mismas marcas que el mes (D49): escribiste, recuerdo, hecho, planeado, hoja.
      var done = list.filter(function (it) { return M.countsAsDone(it.status); }).length;
      var planned = k >= today ? list.filter(function (it) { return it.status === 'pending'; }).length : 0;
      var marks = MC.views.calendar.parts.dayMarks({ wrote: day && M.hasWriting(day), memory: day && day.reflection && day.reflection.keep.trim(), done: done, planned: planned, pages: pages.length });
      marks.classList.add('week-day__marks');
      cell.appendChild(h('div.week-day__top', headLink,
        feelings && feelings.length ? h('span.week-day__feelings', feelings.map(function (word) { return c.feelingMark(word, palette); })) : null,
        marks.childNodes.length ? marks : null));

      var ul = h('ul.activity-list.activity-list--compact');
      function paint(items) {
        MC.clear(ul);
        // D55: en la semana se puede completar una casilla de un día anterior.
        items.forEach(function (it) {
          var row = MC.activityRow(it, { saved: saved, onRestored: refreshDay, onRemoved: function () { refreshDay(); } });
          row.dataset.focus = 'act:' + (it.id || it.routineId + ':' + k);
          ul.appendChild(row);
        });
      }
      function refreshDay() { return M.itemsForDay(k, null, plan).then(function (items) { if (!destroyed) paint(items); return refreshProgress(); }); }
      paint(list);
      cell.appendChild(ul);
      dailyCounts[k] = h('p.week-day__progress.t-meta');
      cell.appendChild(dailyCounts[k]);

      var add = h('input', { type: 'text', placeholder: past ? 'anotar algo que hiciste…' : 'anotar…', 'aria-label': 'Anotar algo para el ' + D.longLabel(k), maxlength: 200, enterkeyhint: 'done' });
      add.addEventListener('input', function () { MC.emit('typing'); });
      add.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { add.value = ''; add.blur(); return; }
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        var title = add.value.trim();
        if (!title) return;
        add.value = '';
        // Lo que se anota en un día pasado nace hecho (se cambia con un toque).
        saved.track(M.addActivity(k, title).then(function (a) { return past && a ? M.setStatus(a, 'done') : a; }).then(refreshDay));
      });
      cell.appendChild(h('label.add-activity.add-activity--compact', { dataset: { focus: 'add:' + k } }, MC.icon('plus'), add));

      if (pages.length) cell.appendChild(c.pageLinks(pages, 'day-pages--week'));
      return cell;
    }

    function busy() {
      var a = document.activeElement;
      var typing = a && main.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName);
      var menu = !!document.querySelector('.menu') && main.contains(document.activeElement);
      return !!(typing || menu || savedRev < rev);
    }

    return {
      ready: ready,
      busy: busy,
      flush: function () { save.flush(); },
      destroy: function () { destroyed = true; offProgress(); offRemote(); save.flush(); }
    };
  }

  MC.views = MC.views || {};
  MC.views.week = { render: render };
})(window);
