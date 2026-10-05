/* “Lo que fui notando”: observaciones descriptivas con conteos. Nunca causalidad. Ver SPEC §12. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;
  var M = MC.model;
  var MIN_SAMPLE = 5;
  var MAX_INSIGHTS = 6;

  function times(n) { return n === 1 ? 'una vez' : n + ' veces'; }
  function days(n) { return n === 1 ? 'un día' : n + ' días'; }
  function plural(weekday) { var n = D.DAYS[weekday]; return weekday === 0 || weekday === 6 ? n + 's' : n; }

  function norm(t) { return String(t || '').trim().toLowerCase().replace(/\s+/g, ' '); }

  /**
   * Lo que las observaciones pueden mirar (SPEC §12, PV1, DA1): sin días marcados “no incluir en observaciones”
   * —ni sus actividades— y sin nada que esté en la papelera.
   */
  function visible(all) {
    var hidden = {};
    var days = all.days.filter(function (d) {
      if (M.isPrivate(d, 'noInsights') || M.isDeleted(d)) { hidden[d.date] = true; return false; }
      return true;
    });
    return Object.assign({}, all, {
      days: days,
      activities: all.activities.filter(function (a) { return !hidden[a.date] && !M.isDeleted(a); }),
      routines: all.routines.filter(function (r) { return !M.isDeleted(r); })
    });
  }

  /**
   * all: resultado de MC.model.everything(); today: 'AAAA-MM-DD'.
   * Devuelve [{ id, text, day?, days?, routineId?, month? }] (máx. 6). Los campos opcionales dicen de qué días
   * habla cada observación, para poder ir a verlos: `day` (uno), `days` (varios, en orden), o
   * `routineId` + `month` (los días de esa rutina en ese mes, en el calendario).
   */
  function compute(all, today) {
    today = today || D.today();
    all = visible(all);
    var s = all.meta.settings;
    var out = [];
    var byDay = {};
    all.days.forEach(function (d) { byDay[d.date] = d; });

    // 1. Desde cuándo
    // El comienzo es lo primero que hay registrado (un backup puede traer días anteriores a esta instalación).
    var candidates = [];
    var installed = D.fromISO(all.meta.createdAt);
    if (installed) candidates.push(installed);
    if (all.days[0]) candidates.push(all.days[0].date);
    if (all.activities[0]) candidates.push(all.activities[0].date);
    var started = candidates.sort()[0];
    if (started && started <= today) {
      var n = D.diffDays(started, today);
      out.push({ id: 'since', text: n === 0 ? 'Hoy empezaste este cuaderno.' : 'Hace ' + days(n) + ' que empezaste este cuaderno.', day: n === 0 ? null : started });
    }

    // 2. Escritura de esta semana
    var weekStart = D.startOfWeek(today);
    var wroteDays = D.range(weekStart, today).filter(function (k) { return M.hasWriting(byDay[k]); });
    if (wroteDays.length > 0) out.push({ id: 'week-writing', text: 'Esta semana escribiste ' + times(wroteDays.length) + '.', days: wroteDays });

    // 3. Rutina más acompañada del mes
    var monthPrefix = today.slice(0, 7);
    var routineTitle = {};
    all.routines.forEach(function (r) { routineTitle[r.id] = r.title; });
    var perRoutine = {};
    all.activities.forEach(function (a) {
      if (a.routineId && routineTitle[a.routineId] && a.date.slice(0, 7) === monthPrefix && M.countsAsDone(a.status)) {
        perRoutine[a.routineId] = (perRoutine[a.routineId] || 0) + 1;
      }
    });
    var topRoutine = Object.keys(perRoutine).sort(function (a, b) { return perRoutine[b] - perRoutine[a]; })[0];
    if (topRoutine && perRoutine[topRoutine] >= 3) {
      out.push({ id: 'routine-month', text: '«' + routineTitle[topRoutine] + '» te acompañó ' + days(perRoutine[topRoutine]) + ' este mes.', routineId: topRoutine, month: monthPrefix });
    }

    // 4. Una palabra que volvió a aparecer esta semana, sin valorarla.
    var perWord = {};
    D.range(weekStart, today).forEach(function (date) {
      var d = byDay[date];
      if (!d) return;
      var seen = {};
      M.feelingsOf(d.morning, s).concat(M.feelingsOf(d.evening, s)).forEach(function (word) {
        var key = M.emotionKey(word);
        if (seen[key]) return;
        seen[key] = true;
        var entry = perWord[key] || (perWord[key] = { word: word, dates: [] });
        entry.dates.push(date);
      });
    });
    var repeated = Object.keys(perWord).map(function (key) { return perWord[key]; }).sort(function (a, b) {
      return b.dates.length - a.dates.length || a.word.localeCompare(b.word, 'es');
    })[0];
    if (repeated && repeated.dates.length >= 2) {
      out.push({ id: 'week-feeling', text: 'Esta semana anotaste «' + repeated.word + '» ' + times(repeated.dates.length) + '.', days: repeated.dates });
    }

    // 5. Palabras compartidas al empezar y terminar el día.
    var both = all.days.filter(function (d) { return M.feelingsOf(d.morning, s).length && M.feelingsOf(d.evening, s).length; });
    if (both.length >= MIN_SAMPLE) {
      var shared = both.filter(function (d) {
        var morning = M.feelingsOf(d.morning, s).map(M.emotionKey);
        return M.feelingsOf(d.evening, s).some(function (word) { return morning.indexOf(M.emotionKey(word)) !== -1; });
      }).map(function (d) { return d.date; }).sort();
      if (shared.length) out.push({ id: 'start-end', text: 'Anotaste alguna palabra tanto al empezar como al terminar el día ' + shared.length + ' de ' + both.length + ' veces.', days: shared });
    }

    // 6. Co-ocurrencia descriptiva entre una actividad y una palabra de cierre.
    var perTitle = {};
    all.activities.forEach(function (a) {
      if (a.status !== 'done') return;
      var d = byDay[a.date];
      if (!d || !M.feelingsOf(d.evening, s).length) return;
      var key = a.routineId && routineTitle[a.routineId] ? 'r:' + a.routineId : 't:' + norm(a.title);
      var st = perTitle[key] || (perTitle[key] = { title: a.routineId && routineTitle[a.routineId] ? routineTitle[a.routineId] : a.title.trim(), dates: {}, n: 0, words: {} });
      if (st.dates[a.date]) return;
      st.dates[a.date] = true;
      st.n++;
      M.feelingsOf(d.evening, s).forEach(function (word) {
        var wordKey = M.emotionKey(word);
        var entry = st.words[wordKey] || (st.words[wordKey] = { word: word, dates: [] });
        entry.dates.push(a.date);
      });
    });
    var bestPair = null;
    Object.keys(perTitle).forEach(function (k) {
      var st = perTitle[k];
      if (st.n < MIN_SAMPLE) return;
      Object.keys(st.words).forEach(function (wordKey) {
        var entry = st.words[wordKey];
        if (entry.dates.length < 2) return;
        if (!bestPair || entry.dates.length > bestPair.dates.length) bestPair = { title: st.title, word: entry.word, dates: entry.dates, n: st.n };
      });
    });
    if (bestPair) {
      out.push({ id: 'activity-feeling', text: 'En los días en que hiciste «' + bestPair.title + '», anotaste «' + bestPair.word + '» al terminar ' + bestPair.dates.length + ' de ' + bestPair.n + ' veces.', days: bestPair.dates.slice().sort() });
    }

    // 7. Recuerdos del año
    var year = today.slice(0, 4);
    var memories = all.days.filter(function (d) { return d.date.slice(0, 4) === year && d.reflection.keep.trim(); }).length;
    if (memories >= 2) out.push({ id: 'memories', text: 'Este año guardaste ' + memories + ' recuerdos.' });

    return out.slice(0, MAX_INSIGHTS);
  }

  /* ---------- A8: cuentas descriptivas por período, mes a mes y victorias ---------- */
  function topWords(map, n) {
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.n - a.n || a.word.localeCompare(b.word, 'es'); }).slice(0, n || 8);
  }
  function addWord(map, word) {
    var k = M.emotionKey(word);
    (map[k] || (map[k] = { word: word, n: 0 })).n++;
  }

  /**
   * Lo que pasó entre `from` y `to` (inclusive), solo como cuentas. Nunca dice si estuvo “bien” o “mal”.
   * Devuelve { from, to, written, writtenDays, feelingDays, words, done, moved, beforeAfter, before, after, sheets }.
   */
  function period(all, from, to) {
    all = visible(all);
    var s = all.meta.settings;
    var inRange = function (k) { return k && k >= from && k <= to; };
    var writtenDays = [], feelingDays = 0, words = {};
    all.days.forEach(function (d) {
      if (!inRange(d.date)) return;
      if (M.hasWriting(d)) writtenDays.push(d.date);
      var seen = {};
      var list = M.feelingsOf(d.morning, s).concat(M.feelingsOf(d.evening, s));
      if (list.length) feelingDays++;
      list.forEach(function (w) { var k = M.emotionKey(w); if (seen[k]) return; seen[k] = true; addWord(words, w); });
    });
    var done = 0, moved = 0, both = 0, before = {}, after = {};
    all.activities.forEach(function (a) {
      if (inRange(a.date) && M.countsAsDone(a.status)) done++;
      (a.moves || []).forEach(function (mv) { if (inRange(mv.from)) moved++; });
      // Una de repetición que se pasó a otro día queda como copia suelta con `movedFrom` (sin `moves`).
      if (!(a.moves && a.moves.length) && a.movedFrom && inRange(a.movedFrom)) moved++;
      if (!inRange(a.date) || !a.feel) return;
      var b = a.feel.before || [], f = a.feel.after || [];
      b.forEach(function (w) { addWord(before, w); });
      f.forEach(function (w) { addWord(after, w); });
      if (b.length && f.length) both++;
    });
    var sheets = (all.pages || []).filter(function (p) { return !M.isDeleted(p) && !M.isPrivate(p, 'noInsights') && inRange(M.pageDate(p)); }).length;
    return {
      from: from, to: to,
      written: writtenDays.length, writtenDays: writtenDays.sort(), feelingDays: feelingDays,
      words: topWords(words, 8), done: done, moved: moved,
      beforeAfter: both, before: topWords(before, 3), after: topWords(after, 3), sheets: sheets
    };
  }

  /** Semana, mes y año de `today` (el año, hasta hoy si es el actual). */
  function periods(all, today) {
    var y = today.slice(0, 4);
    return {
      week: period(all, D.startOfWeek(today), today),
      month: period(all, today.slice(0, 7) + '-01', today),
      year: period(all, y + '-01-01', today)
    };
  }

  /** Mes a mes de un año: días escritos, días con emoción y cosas hechas (para el gráfico y su tabla). */
  function byMonth(all, year) {
    all = visible(all);
    var s = all.meta.settings;
    var rows = D.MONTHS.map(function (name, i) { return { month: year + '-' + D.pad(i + 1), name: name, written: 0, feelings: 0, done: 0 }; });
    all.days.forEach(function (d) {
      if (d.date.slice(0, 4) !== year) return;
      var r = rows[+d.date.slice(5, 7) - 1];
      if (M.hasWriting(d)) r.written++;
      if (M.feelingsOf(d.morning, s).length || M.feelingsOf(d.evening, s).length) r.feelings++;
    });
    all.activities.forEach(function (a) {
      if (a.date.slice(0, 4) === year && M.countsAsDone(a.status)) rows[+a.date.slice(5, 7) - 1].done++;
    });
    return rows;
  }

  /**
   * Pequeñas victorias de un año: cada marca resuelta a su día y su texto (el de la cosa, que puede haber cambiado).
   * Respeta la papelera y los días que no van en repasos ni recuerdos (PV1). Más nuevas primero.
   */
  function victories(all, year) {
    var days = {}, acts = {}, pages = {};
    all.days.forEach(function (d) { days[d.date] = d; });
    all.activities.forEach(function (a) { acts[a.id] = a; });
    (all.pages || []).forEach(function (p) { pages[p.id] = p; });
    var out = [];
    (all.marks || []).forEach(function (m) {
      if (M.isDeleted(m) || m.kind !== 'victoria') return;
      var date = null, text = '', page = null;
      if (m.sourceType === 'activity') { var a = acts[m.sourceId]; if (!a || M.isDeleted(a)) return; date = a.date; text = a.title; }
      else if (m.sourceType === 'page') { var p = pages[m.sourceId]; if (!p || M.isDeleted(p)) return; date = M.pageDate(p); text = M.pageTitle(p); page = p.id; }
      else if (m.sourceType === 'day') { date = m.sourceId; text = 'Este día'; }
      if (!date || date.slice(0, 4) !== year) return;
      var d = days[date];
      if (d && (M.isDeleted(d) && m.sourceType === 'day')) return;
      if (d && (M.isPrivate(d, 'noReviews') || M.isPrivate(d, 'noMemory'))) return;
      out.push({ id: m.id, date: date, text: text, sourceType: m.sourceType, page: page });
    });
    return out.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }

  MC.insights = { compute: compute, period: period, periods: periods, byMonth: byMonth, victories: victories, MIN_SAMPLE: MIN_SAMPLE };
})(typeof window !== 'undefined' ? window : globalThis);
