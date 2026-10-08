/* Índice efímero: texto explícito, fechas locales y permisos. */
(function (root) {
  'use strict';
  var MC = root.MC, M = MC.model, D = MC.dates, R = MC.routes;
  function privateSource(r) { return !r || M.isDeleted(r) || M.isPrivate(r, 'noMemory') || M.isPrivate(r, 'noReviews'); }
  function build(raw, opts) {
    opts = opts || {}; var index = [], days = Object.create(null);
    var allowed = opts.allowed || MC.sections.ids();
    function can(section) { return allowed.indexOf(section) !== -1; }
    function visible(store, r) { if (privateSource(r)) return null; if (!opts.guest) return r; var p = MC.sections.conceal(store, r); return p.all ? null : p.open; }
    function blocked(date) { return days[date] && !visible('days', days[date]); }
    function add(type, title, text, date, href) {
      if (!String(text || '').trim() || !D.isValid(date)) return;
      index.push({ type: type, title: title, text: String(text).slice(0, 20000), date: date, href: href, key: M.emotionKey(title + ' ' + text + ' ' + date) });
    }
    (raw.days || []).forEach(function (d) { days[d.date] = d; var v = visible('days', d); if (!v) return;
      var text = [];
      if (can('escritura')) text.push(v.intention, v.notes, Object.values(v.reflection || {}).join(' '));
      if (can('emociones')) text.push(M.feelingsOf(v.morning).join(' '), M.feelingsOf(v.evening).join(' '));
      add('day', D.longLabel(d.date), text.filter(Boolean).join('\n'), d.date, R.day(d.date));
    });
    (raw.pages || []).forEach(function (p) { var v = can('hojas') && visible('pages', p); if (!v) return; var date = M.pageDate(v);
      if (blocked(date)) return;
      add('page', M.pageTitle(v), M.pageTitle(v) + '\n' + M.sheetText(v, true), date, R.page(v.id));
    });
    (raw.activities || []).forEach(function (a) { if (privateSource(a) || blocked(a.date)) return;
      var text = can('actividades') ? a.title : '';
      if (can('emociones')) text += ' ' + M.feelingsOf({ feelings: a.feel && a.feel.before }).join(' ') + ' ' + M.feelingsOf({ feelings: a.feel && a.feel.after }).join(' ');
      add('activity', can('actividades') ? a.title : 'Emociones de una actividad', text, a.date, R.day(a.date));
    });
    (raw.routines || []).forEach(function (r) { if (!can('repeticiones') || privateSource(r)) return;
      add('routine', r.title, r.title + ' ' + (r.targetNote || '') + ' ' + MC.recurrence.describe(r), r.startDate, R.routine(r.id));
    });
    (raw.weeks || []).forEach(function (w) { if (!can('semana') || privateSource(w)) return;
      add('week', 'Semana del ' + D.shortLabel(w.week), w.notes + '\n' + (w.important || []).map(function (i) { return i.text; }).join('\n'), w.week, R.week(w.week));
    });
    // Los recuerdos derivados solo se indexan en el cuaderno propio: nunca recomponer partes privadas para una invitada.
    if (can('anio') && !opts.guest) {
      var years = Array.from(new Set((raw.days || []).map(function (d) { return d.date.slice(0, 4); }).concat((raw.pages || []).map(function (p) { return M.pageDate(p).slice(0, 4); }), (raw.activities || []).map(function (a) { return a.date.slice(0, 4); }))));
      years.forEach(function (year) { MC.insights.moments(raw, year).forEach(function (m) {
        add('memory', m.text, m.text + ' ' + (m.detail || ''), m.date, m.page ? R.page(m.page) : R.day(m.date));
      }); });
    }
    return index.sort(function (a, b) { return b.date.localeCompare(a.date); });
  }
  function query(index, term, opts) {
    opts = opts || {}; var words = M.emotionKey(term).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return index.filter(function (entry) { return (!opts.from || entry.date >= opts.from) && (!opts.to || entry.date <= opts.to) &&
      (!opts.type || entry.type === opts.type) && words.every(function (word) { return entry.key.indexOf(word) !== -1; }); }).slice(0, opts.limit || 60);
  }
  MC.search = { build: build, query: query };
})(typeof window !== 'undefined' ? window : globalThis);
