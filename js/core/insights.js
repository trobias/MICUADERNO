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
   * all: resultado de MC.model.everything(); today: 'AAAA-MM-DD'.
   * Devuelve [{ id, text, day?, days?, routineId?, month? }] (máx. 6). Los campos opcionales dicen de qué días
   * habla cada observación, para poder ir a verlos: `day` (uno), `days` (varios, en orden), o
   * `routineId` + `month` (los días de esa rutina en ese mes, en el calendario).
   */
  function compute(all, today) {
    today = today || D.today();
    var s = all.meta.settings;
    var good = s.moodLabels[3] + ' o ' + s.moodLabels[4];
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

    // 4. Día de la semana que más veces arranca bien
    var mornings = all.days.filter(function (d) { return d.morning.mood; });
    if (mornings.length >= 10) {
      var perWd = {};
      mornings.forEach(function (d) {
        var wd = D.weekday(d.date);
        var st = perWd[wd] || (perWd[wd] = { n: 0, good: 0, goodDays: [] });
        st.n++;
        if (d.morning.mood >= 4) { st.good++; st.goodDays.push(d.date); }
      });
      var best = null;
      Object.keys(perWd).forEach(function (wd) {
        var st = perWd[wd];
        if (st.n < 3 || st.good === 0) return;
        if (!best || st.good / st.n > best.ratio || (st.good / st.n === best.ratio && st.n > best.n)) {
          best = { wd: +wd, ratio: st.good / st.n, good: st.good, n: st.n, days: st.goodDays };
        }
      });
      if (best && best.ratio >= 0.5) {
        out.push({ id: 'weekday', text: 'Los ' + plural(best.wd) + ' arrancaste ' + good + ' ' + best.good + ' de ' + best.n + ' veces.', days: best.days.slice().sort() });
      }
    }

    // 5. Cómo empieza vs. cómo termina
    var both = all.days.filter(function (d) { return d.morning.mood && d.evening.mood; });
    if (both.length >= MIN_SAMPLE) {
      var sameDays = both.filter(function (d) { return d.evening.mood >= d.morning.mood; }).map(function (d) { return d.date; }).sort();
      out.push({ id: 'start-end', text: 'Terminaste el día igual o mejor de lo que empezaste ' + sameDays.length + ' de ' + both.length + ' veces.', days: sameDays });
    }

    // 6. Co-ocurrencia actividad → cierre del día (descriptivo)
    var perTitle = {};
    all.activities.forEach(function (a) {
      if (a.status !== 'done') return;
      var d = byDay[a.date];
      if (!d || !d.evening.mood) return;
      var key = a.routineId && routineTitle[a.routineId] ? 'r:' + a.routineId : 't:' + norm(a.title);
      var st = perTitle[key] || (perTitle[key] = { title: a.routineId && routineTitle[a.routineId] ? routineTitle[a.routineId] : a.title.trim(), dates: {}, good: 0, n: 0, goodDays: [] });
      if (st.dates[a.date]) return;
      st.dates[a.date] = true;
      st.n++;
      if (d.evening.mood >= 4) { st.good++; st.goodDays.push(a.date); }
    });
    var bestPair = null;
    Object.keys(perTitle).forEach(function (k) {
      var st = perTitle[k];
      if (st.n < MIN_SAMPLE || st.good / st.n < 0.6) return;
      if (!bestPair || st.n > bestPair.n) bestPair = st;
    });
    if (bestPair) {
      out.push({ id: 'activity-mood', text: 'Los días que hiciste «' + bestPair.title + '» terminaste ' + good + ' ' + bestPair.good + ' de ' + bestPair.n + ' veces.', days: bestPair.goodDays.slice().sort() });
    }

    // 7. Recuerdos del año
    var year = today.slice(0, 4);
    var memories = all.days.filter(function (d) { return d.date.slice(0, 4) === year && d.reflection.keep.trim(); }).length;
    if (memories >= 2) out.push({ id: 'memories', text: 'Este año guardaste ' + memories + ' recuerdos.' });

    return out.slice(0, MAX_INSIGHTS);
  }

  MC.insights = { compute: compute, MIN_SAMPLE: MIN_SAMPLE };
})(typeof window !== 'undefined' ? window : globalThis);
