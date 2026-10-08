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
      else if (m.sourceType === 'page') { var p = pages[m.sourceId]; if (!p || M.isDeleted(p) || M.isPrivate(p, 'noReviews') || M.isPrivate(p, 'noMemory')) return; date = M.pageDate(p); text = M.pageTitle(p); page = p.id; }
      else if (m.sourceType === 'day') { if (!days[m.sourceId]) return; date = m.sourceId; text = 'Este día'; }
      if (!date || date.slice(0, 4) !== year) return;
      var d = days[date];
      if (d && M.isDeleted(d)) return;
      if (d && (M.isPrivate(d, 'noReviews') || M.isPrivate(d, 'noMemory'))) return;
      out.push({ id: m.id, date: date, text: m.note || (m.category && m.category !== 'personal' ? M.MEMORY_CATEGORIES[m.category] : text), detail: text, sourceType: m.sourceType, sourceId: m.sourceId, page: page, manual: true });
    });
    // D58: metas semanales alcanzadas, incluidas las hechas Un poquito. Lectura derivada, sin marcas nuevas.
    var weeks = {};
    (all.activities || []).forEach(function (a) {
      var d = days[a.date];
      if (M.isDeleted(a) || !D.isValid(a.date)) return;
      var start = D.startOfWeek(a.date);
      var hidden = d && (M.isPrivate(d, 'noReviews') || M.isPrivate(d, 'noMemory'));
      (weeks[start] || (weeks[start] = [])).push(hidden ? Object.assign({}, a, { status: 'pending' }) : a);
    });
    Object.keys(weeks).forEach(function (start) {
      var rows = weeks[start];
      var stored = (all.weeks || []).filter(function (w) { return w.week === start && !M.isDeleted(w); })[0];
      var plan = stored && stored.activityPlan !== null && stored.activityPlan !== undefined ? stored.activityPlan : M.activityPlan(start, all.routines || []);
      var progress = M.weeklyProgress(start, plan, rows, all.days);
      progress.goals.forEach(function (goal) {
        if (goal.checked !== goal.total) return;
        // Sin la regla/plan de una rutina no se puede afirmar que su meta semanal se alcanzó (p. ej. permisos parciales).
        if (rows.some(function (a) { return a.routineId && M.weeklyActivityKey(a.title) === goal.key && !plan.some(function (g) { return g.routineId === a.routineId; }); })) return;
        var dates = rows.filter(function (a) { return M.countsAsDone(a.status); }).map(function (a) { return a.date; }).sort();
        var date = dates.filter(function (k, i) { return !i || k !== dates[i - 1]; }).find(function (k) {
          var atDate = M.weeklyProgress(start, plan, rows.map(function (a) { return a.date > k ? Object.assign({}, a, { status: 'pending' }) : a; }), all.days);
          var g = atDate.goals.filter(function (g) { return g.key === goal.key; })[0];
          return g && g.checked === g.total;
        });
        if (!date || date.slice(0, 4) !== year) return;
        // Una actividad de 1/1 ya elegida manualmente conserva su referencia y enlace originales.
        if (goal.total === 1 && out.some(function (w) { return w.sourceType === 'activity' && acts[w.sourceId] && M.weeklyActivityKey(acts[w.sourceId].title) === goal.key && w.date >= start && w.date <= D.addDays(start, 6); })) return;
        out.push({ id: 'week:' + start + ':' + goal.key, date: date, week: start, text: goal.title + ' · ' + goal.checked + '/' + goal.total, sourceType: 'week', page: null });
      });
    });
    moments(all, year).filter(function (m) { return m.victory; }).forEach(function (m) {
      if (!out.some(function (w) { return w.manual && w.sourceType === m.sourceType && w.sourceId === m.sourceId && w.date === m.date; })) out.push(m);
    });
    return out.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : a.id.localeCompare(b.id); });
  }

  /** D59: contenido elegido o hitos concretos. Nunca interpreta texto ni premia emociones. */
  function moments(all, year) {
    var days = {}, pages = {}, acts = {}, images = {};
    (all.days || []).forEach(function (d) { days[d.date] = d; });
    (all.pages || []).forEach(function (p) { pages[p.id] = p; });
    (all.activities || []).forEach(function (a) { acts[a.id] = a; });
    (all.images || []).forEach(function (img) { if (!M.isDeleted(img)) images[img.id] = img; });
    function hidden(src, auto) {
      return !src || M.isDeleted(src) || M.isPrivate(src, 'noMemory') || M.isPrivate(src, 'noReviews') || (auto && M.isPrivate(src, 'noInsights'));
    }
    function source(type, id, auto) {
      var src = type === 'day' ? days[id] : type === 'page' ? pages[id] : acts[id];
      if (hidden(src, auto)) return null;
      var date = type === 'page' ? M.pageDate(src) : src.date;
      if (!D.isValid(date) || (days[date] && hidden(days[date], auto))) return null;
      var placed = (src.stickers || []).map(function (s) { return typeof s.sticker === 'string' && s.sticker.slice(0, 4) === 'img:' ? images[s.sticker.slice(4)] : null; }).filter(Boolean);
      return { date: date, detail: type === 'page' ? M.pageTitle(src) : type === 'activity' ? src.title : 'Un día que quiero guardar', page: type === 'page' ? id : null,
        sourceType: type, sourceId: id, image: placed[0] || null, placed: placed };
    }
    var out = [];
    function add(id, ctx, text, victory, origin) {
      if (!ctx || ctx.date.slice(0, 4) !== year) return;
      out.push(Object.assign({}, ctx, { id: id, text: text, victory: victory, origin: origin }));
    }
    (all.marks || []).forEach(function (m) {
      if (M.isDeleted(m)) return;
      var ctx;
      if (m.kind === 'recuerdo' || m.kind === 'terminado') {
        if (m.sourceType === 'routine') return;
        ctx = source(m.sourceType, m.sourceId, m.kind === 'terminado');
        add(m.id, ctx, m.note || (m.kind === 'terminado' ? 'Terminaste una creación' : ctx && ctx.detail), m.kind === 'terminado', m.kind === 'terminado' ? 'Creación terminada' : 'Elegido por vos');
      } else if (m.kind === 'especial') {
        if (m.sourceType === 'routine' && !(all.routines || []).some(function (r) { return r.id === m.sourceId && !M.isDeleted(r); })) return;
        var rows = (all.activities || []).filter(function (a) { return !M.isDeleted(a) && M.countsAsDone(a.status) && (m.sourceType === 'routine' ? a.routineId === m.sourceId : m.sourceType === 'activity' && a.id === m.sourceId); })
          .sort(function (a, b) { return a.date.localeCompare(b.date) || a.id.localeCompare(b.id); });
        // Elegir la primera antes del filtro de privacidad evita atribuir una segunda primera vez.
        if (m.category === 'first') rows = rows.slice(0, 1);
        rows.forEach(function (a) {
          ctx = source('activity', a.id, true);
          add(m.id + ':' + a.id, ctx, m.note || M.MEMORY_CATEGORIES[m.category || 'personal'], true, a.status === 'partial' ? 'Un poquito también cuenta' : 'Momento especial');
        });
      }
    });
    // Las frases que ya eligió conservar siguen siendo recuerdos, con la imagen de su día si hay una.
    (all.days || []).forEach(function (d) {
      var text = d.reflection && typeof d.reflection.keep === 'string' ? d.reflection.keep.trim() : '';
      if (text && !out.some(function (m) { return m.sourceType === 'day' && m.sourceId === d.date && !m.victory; })) add('keep:' + d.date, source('day', d.date, false), text, false, 'Qué quiero guardar');
    });
    // Solo dibujos colocados: las imágenes sin fuente visible nunca reaparecen por sorpresa.
    var drawings = [];
    ['day', 'page'].forEach(function (type) {
      (type === 'day' ? all.days || [] : all.pages || []).forEach(function (src) {
        var id = type === 'day' ? src.date : src.id;
        var date = type === 'day' ? src.date : M.pageDate(src);
        if (M.isDeleted(src) || !D.isValid(date)) return;
        (src.stickers || []).forEach(function (s) {
          var img = typeof s.sticker === 'string' && s.sticker.slice(0, 4) === 'img:' ? images[s.sticker.slice(4)] : null;
          if (!img) return;
          var savedDate = D.fromISO(img.createdAt);
          if (img.kind === 'drawing' && savedDate && savedDate.slice(0, 4) === year && date.slice(0, 4) === year) drawings.push({ type: type, id: id, date: date, img: img });
        });
      });
    });
    drawings.sort(function (a, b) { return a.img.createdAt.localeCompare(b.img.createdAt) || a.date.localeCompare(b.date) || a.img.id.localeCompare(b.img.id); });
    if (drawings.length) {
      var first = drawings[0], ctx = source(first.type, first.id, true);
      if (ctx) add('drawing:' + year, Object.assign({}, ctx, { image: first.img }), 'Tu primer dibujo guardado este año', true, 'Primer dibujo del año');
    }
    return out.sort(function (a, b) { return b.date.localeCompare(a.date) || a.id.localeCompare(b.id); });
  }

  MC.insights = { compute: compute, period: period, periods: periods, byMonth: byMonth, victories: victories, moments: moments, MIN_SAMPLE: MIN_SAMPLE };
})(typeof window !== 'undefined' ? window : globalThis);
