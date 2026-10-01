/* Operaciones de dominio del cuaderno. Todas asíncronas, sobre MC.store. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;
  var R = MC.recurrence;
  var S = function () { return MC.store; };

  var STATUSES = ['pending', 'done', 'partial', 'postponed', 'skipped'];
  var STATUS_LABEL = {
    pending: 'Sin marcar', done: 'Lo hice', partial: 'Hice un poquito',
    postponed: 'Lo dejo para otro día', skipped: 'Hoy no salió'
  };
  var MOMENTS = ['manana', 'tarde', 'noche'];
  var MOMENT_LABEL = { manana: 'A la mañana', tarde: 'A la tarde', noche: 'A la noche', '': 'Cuando sea' };
  var COVERS = ['salvia', 'rosa', 'lavanda', 'manteca'];
  var MOTION = ['completas', 'suaves', 'reducidas', 'ninguna'];
  var MAX_TEXT = 20000;

  function defaultSettings() {
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      name: '',
      cover: 'salvia',
      moodLabels: ['pesado', 'bajito', 'normal', 'bien', 'muy bien'],
      track: { morning: true, evening: true, activities: true, reflection: true, energy: false, sleep: false },
      motion: reduce ? 'reducidas' : 'suaves',
      scenes: true,
      showCover: true,
      onboarded: false,
      backupEveryDays: 14,
      notify: {
        enabled: false,
        morning: { on: true, time: '08:30' },
        evening: { on: true, time: '21:30' },
        routines: false,
        comeback: false,
        mode: 'tranquilo'
      },
      notifyAsked: false
    };
  }

  /** Mezcla profunda de settings guardados sobre los defaults (tolera settings viejos/incompletos). */
  function mergeSettings(saved) {
    var def = defaultSettings();
    if (!saved || typeof saved !== 'object') return def;
    var out = MC.clone(def);
    if (typeof saved.name === 'string') out.name = saved.name.slice(0, 40);
    if (COVERS.indexOf(saved.cover) !== -1) out.cover = saved.cover;
    if (Array.isArray(saved.moodLabels) && saved.moodLabels.length === 5) {
      out.moodLabels = saved.moodLabels.map(function (l, i) {
        l = typeof l === 'string' ? l.trim().slice(0, 24) : '';
        return l || def.moodLabels[i];
      });
    }
    if (saved.track && typeof saved.track === 'object') {
      Object.keys(out.track).forEach(function (k) { if (typeof saved.track[k] === 'boolean') out.track[k] = saved.track[k]; });
    }
    if (MOTION.indexOf(saved.motion) !== -1) out.motion = saved.motion;
    ['scenes', 'showCover', 'onboarded', 'notifyAsked'].forEach(function (k) {
      if (typeof saved[k] === 'boolean') out[k] = saved[k];
    });
    if ([0, 7, 14, 30].indexOf(saved.backupEveryDays) !== -1) out.backupEveryDays = saved.backupEveryDays;
    if (saved.notify && typeof saved.notify === 'object') {
      var n = saved.notify;
      if (typeof n.enabled === 'boolean') out.notify.enabled = n.enabled;
      ['morning', 'evening'].forEach(function (k) {
        if (n[k] && typeof n[k] === 'object') {
          if (typeof n[k].on === 'boolean') out.notify[k].on = n[k].on;
          if (/^\d{2}:\d{2}$/.test(n[k].time)) out.notify[k].time = n[k].time;
        }
      });
      if (typeof n.routines === 'boolean') out.notify.routines = n.routines;
      if (typeof n.comeback === 'boolean') out.notify.comeback = n.comeback;
      if (['normal', 'tranquilo', 'silencioso'].indexOf(n.mode) !== -1) out.notify.mode = n.mode;
    }
    return out;
  }

  /* ---------- meta ---------- */
  var settingsCache = null;

  function getMeta(key, fallback) {
    return S().get('meta', key).then(function (row) { return row ? row.value : fallback; });
  }
  function setMeta(key, value) { return S().put('meta', { key: key, value: value }); }

  function loadSettings() {
    return getMeta('settings', null).then(function (s) {
      settingsCache = mergeSettings(s);
      return settingsCache;
    });
  }
  function settings() { return settingsCache || defaultSettings(); }
  function saveSettings(patch) {
    var next = mergeSettings(Object.assign({}, settings(), patch));
    settingsCache = next;
    return setMeta('settings', next).then(function () { MC.emit('settings', next); return next; });
  }

  /* ---------- días ---------- */
  function emptyDay(date) {
    return {
      date: date,
      morning: { mood: null, at: null },
      intention: '',
      notes: '',
      energy: null,
      sleep: null,
      evening: { mood: null, at: null },
      reflection: { good: '', hard: '', lovely: '', keep: '', free: '' },
      stickers: [],
      createdAt: null,
      updatedAt: null
    };
  }

  function normalizeDay(raw, date) {
    var d = emptyDay(date || (raw && raw.date));
    if (!raw) return d;
    ['morning', 'evening'].forEach(function (k) {
      var m = raw[k] || {};
      var mood = Number(m.mood);
      d[k] = { mood: mood >= 1 && mood <= 5 ? mood : null, at: typeof m.at === 'string' ? m.at : null };
    });
    d.intention = str(raw.intention);
    d.notes = str(raw.notes);
    var e = Number(raw.energy); d.energy = e >= 1 && e <= 3 ? e : null;
    var sl = Number(raw.sleep); d.sleep = raw.sleep != null && sl >= 0 && sl <= 24 ? Math.round(sl * 2) / 2 : null;
    var r = raw.reflection || {};
    Object.keys(d.reflection).forEach(function (k) { d.reflection[k] = str(r[k]); });
    d.stickers = sanitizeStickers(raw.stickers);
    d.createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : null;
    d.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
    return d;
  }

  function str(v) { return typeof v === 'string' ? v.slice(0, MAX_TEXT) : ''; }

  function sanitizeStickers(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (s) { return s && typeof s.sticker === 'string'; }).slice(0, 80).map(function (s) {
      return {
        id: typeof s.id === 'string' ? s.id : MC.uid('stk'),
        sticker: s.sticker.slice(0, 40),
        x: MC.clamp(Number(s.x) || 0, 0, 1),
        y: MC.clamp(Number(s.y) || 0, 0, 1),
        rot: MC.clamp(Number(s.rot) || 0, -45, 45),
        scale: MC.clamp(Number(s.scale) || 1, 0.5, 2)
      };
    });
  }

  function isEmptyDay(d) {
    if (!d) return true;
    if (d.morning.mood || d.evening.mood || d.energy || d.sleep != null) return false;
    if (d.intention.trim() || d.notes.trim()) return false;
    if (d.stickers.length) return false;
    return !Object.keys(d.reflection).some(function (k) { return d.reflection[k].trim(); });
  }

  function getDay(date) {
    return S().get('days', date).then(function (raw) { return normalizeDay(raw, date); });
  }

  function saveDay(day) {
    var d = normalizeDay(day, day.date);
    if (isEmptyDay(d)) return S().del('days', d.date).then(function () { return d; });
    var now = MC.nowISO();
    d.createdAt = d.createdAt || now;
    d.updatedAt = now;
    return S().put('days', d);
  }

  function daysInRange(from, to) {
    return S().getRange('days', null, from, to).then(function (rows) {
      return rows.map(function (r) { return normalizeDay(r, r.date); });
    });
  }

  /* ---------- actividades ---------- */
  function normalizeActivity(a) {
    return {
      id: typeof a.id === 'string' ? a.id : MC.uid('act'),
      date: a.date,
      title: str(a.title).slice(0, 200),
      status: STATUSES.indexOf(a.status) !== -1 ? a.status : 'pending',
      routineId: typeof a.routineId === 'string' ? a.routineId : null,
      order: Number.isFinite(a.order) ? a.order : Date.now(),
      movedFrom: D.isValid(a.movedFrom) ? a.movedFrom : null,
      createdAt: a.createdAt || MC.nowISO(),
      updatedAt: a.updatedAt || MC.nowISO()
    };
  }

  function momentRank(m) { var i = MOMENTS.indexOf(m); return i === -1 ? 3 : i; }

  /**
   * Lista del día: actividades guardadas + ocurrencias de rutinas todavía no marcadas (virtuales).
   * Orden: rutinas (mañana → noche → cuando sea), después las propias por `order`.
   */
  function itemsForDay(date, routines) {
    var routinesP = routines ? Promise.resolve(routines) : getRoutines();
    return Promise.all([S().getAllByIndex('activities', 'date', date), routinesP]).then(function (res) {
      var stored = res[0].map(normalizeActivity);
      var rs = res[1];
      var byRoutine = {};
      stored.forEach(function (a) { if (a.routineId) byRoutine[a.routineId] = a; });
      var routineMap = {};
      rs.forEach(function (r) { routineMap[r.id] = r; });
      var fromRoutines = [];
      rs.forEach(function (r) {
        if (byRoutine[r.id]) return;
        if (R.occursOn(r, date)) {
          fromRoutines.push({
            id: 'v:' + r.id + ':' + date, virtual: true, date: date, title: r.title, status: 'pending',
            routineId: r.id, order: 0, movedFrom: null
          });
        }
      });
      var routineItems = fromRoutines.concat(stored.filter(function (a) { return a.routineId; }));
      routineItems.sort(function (a, b) {
        var ra = routineMap[a.routineId], rb = routineMap[b.routineId];
        var d = momentRank(ra && ra.moment) - momentRank(rb && rb.moment);
        return d || a.title.localeCompare(b.title, 'es');
      });
      routineItems.forEach(function (a) {
        var r = routineMap[a.routineId];
        a.moment = r ? r.moment : null;
        a.routineGone = !r;
      });
      var own = stored.filter(function (a) { return !a.routineId; }).sort(function (a, b) { return a.order - b.order; });
      return routineItems.concat(own);
    });
  }

  function addActivity(date, title) {
    var t = String(title || '').trim();
    if (!t) return Promise.resolve(null);
    var a = normalizeActivity({ date: date, title: t, order: Date.now() });
    return S().put('activities', a);
  }

  /** Materializa un ítem virtual (ocurrencia de rutina) si hace falta y guarda cambios. */
  function saveItem(item, patch) {
    var base = item.virtual
      ? { id: MC.uid('act'), date: item.date, title: item.title, routineId: item.routineId, order: 0, createdAt: MC.nowISO() }
      : item;
    var next = normalizeActivity(Object.assign({}, base, patch, { updatedAt: MC.nowISO() }));
    return S().put('activities', next);
  }

  function setStatus(item, status) { return saveItem(item, { status: status }); }

  function renameActivity(item, title) {
    var t = String(title || '').trim();
    if (!t) return Promise.resolve(item);
    return saveItem(item, { title: t });
  }

  function deleteActivity(item) {
    if (item.virtual) return Promise.resolve();
    return S().del('activities', item.id);
  }

  /** “Pasar a mañana”: marca postponed hoy y crea una copia (sin rutina) al día siguiente. */
  function moveToTomorrow(item) {
    var next = D.addDays(item.date, 1);
    return setStatus(item, 'postponed').then(function () {
      var copy = normalizeActivity({ date: next, title: item.title, order: Date.now(), movedFrom: item.date });
      return S().put('activities', copy);
    });
  }

  /**
   * Mover a otro día. Una actividad propia cambia de fecha (y recuerda de dónde viene);
   * una de rutina queda “lo dejé para otro día” en su fecha y se copia suelta al día nuevo.
   */
  function moveActivity(item, date) {
    if (!D.isValid(date) || date === item.date) return Promise.resolve(null);
    if (item.routineId || item.virtual) {
      return setStatus(item, 'postponed').then(function () {
        return S().put('activities', normalizeActivity({ date: date, title: item.title, order: Date.now(), movedFrom: item.date }));
      });
    }
    return saveItem(item, { date: date, movedFrom: item.movedFrom || item.date, order: Date.now() });
  }

  /** Lo que viene: actividades propias desde `from` (rutinas no: aparecen solas en sus días). */
  function upcoming(from, days) {
    return activitiesInRange(from, D.addDays(from, days || 365)).then(function (list) {
      return list.filter(function (a) { return !a.routineId; }).sort(function (a, b) { return byDate(a, b) || a.order - b.order; });
    });
  }

  function activitiesInRange(from, to) {
    return S().getRange('activities', 'date', from, to).then(function (rows) { return rows.map(normalizeActivity); });
  }

  /* ---------- rutinas ---------- */
  function normalizeRoutine(r) {
    var rule = R.sanitizeRule(r.rule);
    if (!rule) return null;
    return {
      id: typeof r.id === 'string' ? r.id : MC.uid('rut'),
      title: str(r.title).trim().slice(0, 120),
      rule: rule,
      startDate: D.isValid(r.startDate) ? r.startDate : D.today(),
      endDate: D.isValid(r.endDate) ? r.endDate : null,
      moment: MOMENTS.indexOf(r.moment) !== -1 ? r.moment : null,
      archived: !!r.archived,
      createdAt: r.createdAt || MC.nowISO(),
      updatedAt: r.updatedAt || MC.nowISO()
    };
  }

  function getRoutines() {
    return S().getAll('routines').then(function (rows) {
      return rows.map(normalizeRoutine)
        .filter(Boolean)
        .sort(function (a, b) { return momentRank(a.moment) - momentRank(b.moment) || a.title.localeCompare(b.title, 'es'); });
    });
  }

  function saveRoutine(r) {
    var n = normalizeRoutine(r);
    if (!n || !n.title) return Promise.reject(new Error('La rutina necesita un nombre y una frecuencia.'));
    n.updatedAt = MC.nowISO();
    if (n.rule.type === 'once') { n.startDate = n.rule.date < n.startDate ? n.rule.date : n.startDate; }
    return S().put('routines', n);
  }

  function deleteRoutine(id) {
    // El historial ya marcado queda como actividades sueltas (routineId se conserva; se muestra aunque la rutina no exista).
    return S().del('routines', id);
  }

  /* ---------- páginas ---------- */
  var PAPERS = ['rayado', 'cuadriculado', 'punteado', 'liso'];

  function normalizePage(p) {
    return {
      id: typeof p.id === 'string' ? p.id : MC.uid('pag'),
      title: str(p.title).slice(0, 120),
      template: typeof p.template === 'string' ? p.template.slice(0, 40) : 'blank',
      kind: p.kind === 'list' ? 'list' : 'text',
      paper: PAPERS.indexOf(p.paper) !== -1 ? p.paper : 'rayado',
      body: str(p.body),
      items: (Array.isArray(p.items) ? p.items : []).slice(0, 500).map(function (it) {
        return { id: typeof it.id === 'string' ? it.id : MC.uid('itm'), text: str(it.text).slice(0, 500) };
      }),
      pinned: !!p.pinned,
      // Día en el calendario (elegible). Si no hay, el día en que se empezó.
      date: D.isValid(p.date) ? p.date : (D.fromISO(p.createdAt) || D.today()),
      stickers: sanitizeStickers(p.stickers),
      createdAt: p.createdAt || MC.nowISO(),
      updatedAt: p.updatedAt || MC.nowISO()
    };
  }

  function getPages() {
    return S().getAll('pages').then(function (rows) {
      return rows.map(normalizePage).sort(function (a, b) {
        return (b.pinned - a.pinned) || (a.createdAt < b.createdAt ? -1 : 1);
      });
    });
  }
  function getPage(id) { return S().get('pages', id).then(function (p) { return p ? normalizePage(p) : null; }); }
  function savePage(p) {
    var n = normalizePage(p);
    n.updatedAt = MC.nowISO();
    return S().put('pages', n);
  }
  function deletePage(id) { return S().del('pages', id); }

  /* ---------- lectura compartida (calendario, año, impresión, insights) ---------- */
  /** ¿Escribió algo ese día? (notas, intención o alguna reflexión) */
  function hasWriting(d) {
    return !!(d && (d.notes.trim() || d.intention.trim() || Object.keys(d.reflection).some(function (k) { return d.reflection[k].trim(); })));
  }

  /** En calendario, impresión e insights, “hecho” incluye “un poquito”. Las exportaciones guardan el estado exacto. */
  function countsAsDone(status) { return status === 'done' || status === 'partial'; }

  function moodLabel(n, labels) {
    var l = labels || settings().moodLabels;
    return n ? l[n - 1] : null;
  }

  function pageTitle(p) { return (p && p.title && p.title.trim()) || 'Sin título'; }

  /** Día de una página en el calendario: el elegido o, si no hay, el día en que se empezó. */
  function pageDate(p) { return p ? (D.isValid(p.date) ? p.date : D.fromISO(p.createdAt)) : null; }

  /* ---------- resúmenes para calendario, año e impresión ---------- */
  function blankSummary(date) {
    return { date: date, morning: null, evening: null, mood: null, wrote: false, memory: '', done: 0, total: 0, pending: 0, planned: 0, routines: 0, byRoutine: {}, pages: [] };
  }

  /**
   * Resumen por fecha: la única cuenta de “qué hubo ese día” (calendario, semana, año, impresión).
   * `extra` (opcional): { from, to, routines, pages }. Con from/to solo cuenta ese rango; con routines suma
   * las ocurrencias todavía sin marcar (pendientes, `planned`); con pages, las ubica en el día en que se empezaron.
   */
  function summarize(days, activities, extra) {
    extra = extra || {};
    var from = D.isValid(extra.from) ? extra.from : null;
    var to = D.isValid(extra.to) ? extra.to : null;
    function inRange(k) { return (!from || k >= from) && (!to || k <= to); }
    var map = {};
    function at(date) { return map[date] || (map[date] = blankSummary(date)); }
    days.forEach(function (d) {
      if (!inRange(d.date)) return;
      var s = at(d.date);
      s.morning = d.morning.mood;
      s.evening = d.evening.mood;
      s.mood = d.evening.mood || d.morning.mood;
      s.wrote = hasWriting(d);
      s.memory = d.reflection.keep.trim();
    });
    var marked = {};
    activities.forEach(function (a) {
      if (!inRange(a.date)) return;
      var s = at(a.date);
      s.total++;
      if (countsAsDone(a.status)) s.done++;
      if (a.status === 'pending') s.pending++;
      if (a.routineId) { s.routines++; s.byRoutine[a.routineId] = a.status; marked[a.routineId + '|' + a.date] = true; }
    });
    if (extra.routines && extra.routines.length && from && to) {
      D.range(from, to).forEach(function (k) {
        extra.routines.forEach(function (r) {
          if (marked[r.id + '|' + k] || !R.occursOn(r, k)) return;
          var s = at(k);
          s.total++; s.pending++; s.planned++; s.routines++;
          s.byRoutine[r.id] = 'pending';
        });
      });
    }
    (extra.pages || []).forEach(function (p) {
      var k = pageDate(p);
      if (!k || !inRange(k)) return;
      at(k).pages.push({ id: p.id, title: p.title });
    });
    return map;
  }

  function summaryRange(from, to) {
    return Promise.all([daysInRange(from, to), activitiesInRange(from, to), getRoutines(), getPages()]).then(function (r) {
      return summarize(r[0], r[1], { from: from, to: to, routines: r[2], pages: r[3] });
    });
  }

  /** Páginas empezadas en una fecha local. */
  function pagesOn(date) {
    return getPages().then(function (ps) { return ps.filter(function (p) { return pageDate(p) === date; }); });
  }

  /** Todo lo necesario para exportar/insights. */
  function everything() {
    return MC.store.dumpAll().then(function (all) {
      var metaMap = {};
      all.meta.forEach(function (m) { metaMap[m.key] = m.value; });
      return {
        meta: { createdAt: metaMap.createdAt || null, settings: mergeSettings(metaMap.settings), lastBackupAt: metaMap.lastBackupAt || null },
        days: all.days.map(function (d) { return normalizeDay(d, d.date); }).sort(byDate),
        activities: all.activities.map(normalizeActivity).sort(function (a, b) { return byDate(a, b) || a.order - b.order; }),
        routines: all.routines.map(normalizeRoutine).filter(Boolean),
        pages: all.pages.map(normalizePage)
      };
    });
  }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

  /** Primer arranque: registra createdAt y cuenta días distintos de apertura. */
  function touchOpen() {
    var today = D.today();
    return Promise.all([getMeta('createdAt', null), getMeta('lastOpenedDay', null), getMeta('openedDays', 0)]).then(function (r) {
      var jobs = [];
      if (!r[0]) jobs.push(setMeta('createdAt', MC.nowISO()));
      if (r[1] !== today) {
        jobs.push(setMeta('lastOpenedDay', today));
        jobs.push(setMeta('openedDays', (r[2] || 0) + 1));
      }
      return Promise.all(jobs).then(function () { return { previousDay: r[1], openedDays: r[1] !== today ? (r[2] || 0) + 1 : r[2] }; });
    });
  }

  MC.model = {
    STATUSES: STATUSES, STATUS_LABEL: STATUS_LABEL, MOMENTS: MOMENTS, MOMENT_LABEL: MOMENT_LABEL,
    COVERS: COVERS, MOTION: MOTION, PAPERS: PAPERS,
    defaultSettings: defaultSettings, mergeSettings: mergeSettings,
    getMeta: getMeta, setMeta: setMeta, loadSettings: loadSettings, settings: settings, saveSettings: saveSettings,
    emptyDay: emptyDay, normalizeDay: normalizeDay, isEmptyDay: isEmptyDay, getDay: getDay, saveDay: saveDay, daysInRange: daysInRange,
    normalizeActivity: normalizeActivity, itemsForDay: itemsForDay, addActivity: addActivity, saveItem: saveItem,
    setStatus: setStatus, renameActivity: renameActivity, deleteActivity: deleteActivity, moveToTomorrow: moveToTomorrow,
    moveActivity: moveActivity, upcoming: upcoming,
    activitiesInRange: activitiesInRange,
    normalizeRoutine: normalizeRoutine, getRoutines: getRoutines, saveRoutine: saveRoutine, deleteRoutine: deleteRoutine,
    normalizePage: normalizePage, getPages: getPages, getPage: getPage, savePage: savePage, deletePage: deletePage,
    sanitizeStickers: sanitizeStickers, summarize: summarize, summaryRange: summaryRange, pagesOn: pagesOn, everything: everything,
    hasWriting: hasWriting, countsAsDone: countsAsDone, moodLabel: moodLabel, pageTitle: pageTitle, pageDate: pageDate,
    touchOpen: touchOpen
  };
})(typeof window !== 'undefined' ? window : globalThis);
