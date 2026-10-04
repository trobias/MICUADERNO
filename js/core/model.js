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
  var TRASH_RETENTION = [0, 7, 15, 30, 60];
  // Privacidad de un día o una página (PV1): banderas opcionales, todas en false si faltan.
  var PRIVACY_FLAGS = ['noMemory', 'noInsights', 'noReviews'];
  var ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

  function defaultSettings() {
    return {
      name: '',
      cover: 'salvia',
      moodLabels: ['pesado', 'bajito', 'normal', 'bien', 'muy bien'],
      track: { morning: true, evening: true, activities: true, reflection: true, energy: false, sleep: false },
      // Pedido de la dueña del proyecto (D23): todas las personas empiezan con “Completas”; se baja en Ajustes.
      motion: 'completas',
      motionChosen: false,
      scenes: true,
      showCover: true,
      onboarded: false,
      backupEveryDays: 14,
      trashRetentionDays: 30,     // v4 (DA1): días en la papelera antes de vaciarse solos; 0 = conservar siempre
      notify: {
        enabled: false,
        morning: { on: true, time: '08:30' },
        evening: { on: true, time: '21:30' },
        routines: false,
        comeback: false,
        mode: 'tranquilo'
      },
      notifyAsked: false,
      theme: null,                // v5 (D30): colores propios; null = la tela de la tapa (paso A9)
      emotionColors: {}           // v5 (D28): color elegido por emoción, { clave: '#RRGGBB' } (paso A4)
    };
  }

  var HEX6 = /^#[0-9a-fA-F]{6}$/;
  var THEME_COLORS = ['cloth', 'cloth2', 'paper', 'ink'];
  var THEME_FINISHES = ['mate', 'satinado', 'brillante'];

  /** Colores propios (v5): solo hex válidos; lo desconocido se descarta. El motor (A9) lo completa. */
  function sanitizeTheme(t) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
    var out = { preset: typeof t.preset === 'string' ? t.preset.slice(0, 40) : 'propio' };
    THEME_COLORS.forEach(function (k) { out[k] = HEX6.test(t[k]) ? t[k].toUpperCase() : null; });
    out.angle = Number.isFinite(Number(t.angle)) ? MC.clamp(Math.round(Number(t.angle)), 0, 360) : 135;
    out.accents = (Array.isArray(t.accents) ? t.accents : []).filter(function (c) { return HEX6.test(c); }).slice(0, 4).map(function (c) { return c.toUpperCase(); });
    out.finish = THEME_FINISHES.indexOf(t.finish) !== -1 ? t.finish : 'mate';
    return out.cloth ? out : null;
  }

  function sanitizeEmotionColors(m) {
    var out = {};
    if (!m || typeof m !== 'object' || Array.isArray(m)) return out;
    Object.keys(m).slice(0, 200).forEach(function (k) {
      var key = emotionKey(String(k).slice(0, 40));
      if (key && HEX6.test(m[k])) out[key] = m[k].toUpperCase();
    });
    return out;
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
    // Se respeta un nivel elegido. “Ninguna” nunca fue de fábrica: siempre fue una elección. Los viejos
    // valores de fábrica sin elección (“suaves”, o “reducidas” por el sistema) pasan a “completas” (D23).
    if (MOTION.indexOf(saved.motion) !== -1 && (saved.motionChosen === true || saved.motion === 'ninguna')) { out.motion = saved.motion; out.motionChosen = true; }
    ['scenes', 'showCover', 'onboarded', 'notifyAsked'].forEach(function (k) {
      if (typeof saved[k] === 'boolean') out[k] = saved[k];
    });
    if ([0, 7, 14, 30].indexOf(saved.backupEveryDays) !== -1) out.backupEveryDays = saved.backupEveryDays;
    if (TRASH_RETENTION.indexOf(saved.trashRetentionDays) !== -1) out.trashRetentionDays = saved.trashRetentionDays;
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
    out.theme = sanitizeTheme(saved.theme);
    out.emotionColors = sanitizeEmotionColors(saved.emotionColors);
    // Los 5 nombres de ánimo congelados al pasar a emociones escritas (D28): convierten `mood n` viejos.
    if (Array.isArray(saved.legacyMoodLabels) && saved.legacyMoodLabels.length === 5 && saved.legacyMoodLabels.every(function (l) { return typeof l === 'string' && l.trim(); })) {
      out.legacyMoodLabels = saved.legacyMoodLabels.map(function (l) { return l.trim().slice(0, 24); });
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
      // Congelamos los nombres elegidos antes de retirar el selector de cinco ánimos.
      // Las copias viejas siguen trayendo su propio settings.moodLabels.
      if (!settingsCache.legacyMoodLabels) settingsCache.legacyMoodLabels = settingsCache.moodLabels.slice();
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
      morning: { mood: null, feelings: null, at: null },
      intention: '',
      notes: '',
      energy: null,
      sleep: null,
      evening: { mood: null, feelings: null, at: null },
      reflection: { good: '', hard: '', lovely: '', keep: '', free: '' },
      stickers: [],
      privacy: null,
      deletedAt: null,
      createdAt: null,
      updatedAt: null
    };
  }

  /**
   * `privacy` de un día o una página (PV1): { noMemory, noInsights, noReviews } con booleanos, o null.
   * Solo cuenta `true`; cualquier otra cosa es false. Si ninguna está prendida queda null (= como siempre).
   */
  function sanitizePrivacy(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    var out = {}, any = false;
    PRIVACY_FLAGS.forEach(function (k) { out[k] = p[k] === true; if (out[k]) any = true; });
    return any ? out : null;
  }

  /** ¿Este día o página tiene prendida esa bandera de privacidad? (`noMemory` | `noInsights` | `noReviews`) */
  function isPrivate(r, flag) { return !!(r && r.privacy && r.privacy[flag] === true); }

  /** `deletedAt` (papelera, DA1): un instante ISO válido, o null (= activo). */
  function sanitizeDeletedAt(v) { return typeof v === 'string' && ISO_INSTANT.test(v) && !isNaN(Date.parse(v)) ? v : null; }
  function isDeleted(r) { return !!(r && r.deletedAt); }

  /**
   * Emociones escritas (v5, D28): textos cortos, sin repetir (sin importar mayúsculas ni tildes), máx. 12.
   * `null` = nunca se anotaron (distinto de `[]`: se anotaron y se sacaron todas).
   */
  function sanitizeFeelings(list) {
    if (!Array.isArray(list)) return null;
    var seen = {};
    return list.filter(function (f) { return typeof f === 'string'; }).map(function (f) { return f.replace(/\s+/g, ' ').trim().slice(0, 40); })
      .filter(function (f) {
        var k = f.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (!f || seen[k]) return false;
        seen[k] = true;
        return true;
      }).slice(0, 12);
  }

  function normalizeDay(raw, date) {
    var d = emptyDay(date || (raw && raw.date));
    if (!raw) return d;
    ['morning', 'evening'].forEach(function (k) {
      var m = raw[k] || {};
      var mood = Number(m.mood);
      d[k] = { mood: mood >= 1 && mood <= 5 ? mood : null, feelings: sanitizeFeelings(m.feelings), at: typeof m.at === 'string' ? m.at : null };
    });
    d.intention = str(raw.intention);
    d.notes = str(raw.notes);
    var e = Number(raw.energy); d.energy = e >= 1 && e <= 3 ? e : null;
    var sl = Number(raw.sleep); d.sleep = raw.sleep != null && sl >= 0 && sl <= 24 ? Math.round(sl * 2) / 2 : null;
    var r = raw.reflection || {};
    Object.keys(d.reflection).forEach(function (k) { d.reflection[k] = str(r[k]); });
    d.stickers = sanitizeStickers(raw.stickers);
    d.privacy = sanitizePrivacy(raw.privacy);
    d.deletedAt = sanitizeDeletedAt(raw.deletedAt);
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
        sticker: s.sticker.slice(0, 60), // nombre del arte, o 'img:<id>' para una imagen propia
        x: MC.clamp(Number(s.x) || 0, 0, 1),
        y: MC.clamp(Number(s.y) || 0, 0, 1),
        rot: MC.clamp(Number(s.rot) || 0, -45, 45),
        scale: MC.clamp(Number(s.scale) || 1, 0.4, 3)
      };
    });
  }

  function isEmptyDay(d) {
    if (!d) return true;
    if (d.morning.mood || d.evening.mood || d.energy || d.sleep != null) return false;
    // Un día con emociones anotadas (aunque no tenga nada más) existe: no se borra al guardar ni al restaurar.
    if ((d.morning.feelings && d.morning.feelings.length) || (d.evening.feelings && d.evening.feelings.length)) return false;
    if (d.intention.trim() || d.notes.trim()) return false;
    if (d.stickers.length) return false;
    return !Object.keys(d.reflection).some(function (k) { return d.reflection[k].trim(); });
  }

  function getDay(date, opts) {
    // Abrir una fecha permite revisar su hoja en papelera; las lecturas de listas siguen filtrándola.
    return S().get('days', date).then(function (raw) {
      return normalizeDay(isDeleted(raw) && !(opts && opts.includeDeleted) ? null : raw, date);
    });
  }

  function saveDay(day) {
    var d = normalizeDay(day, day.date);
    return S().get('days', d.date).then(function (stored) {
      // Un borrador vacío no elimina una hoja que todavía se puede recuperar.
      if (isDeleted(stored)) {
        if (isEmptyDay(d)) return d;
        if (d.deletedAt !== stored.deletedAt) throw new Error('Este día está en la papelera. Volvé a abrirlo antes de editarlo.');
        d.deletedAt = null;
      }
      if (isEmptyDay(d)) return S().del('days', d.date).then(function () { return d; });
      var now = MC.nowISO();
      d.createdAt = d.createdAt || now;
      d.updatedAt = now;
      return S().put('days', d);
    });
  }

  function daysInRange(from, to) {
    return S().getRange('days', null, from, to).then(function (rows) {
      return rows.filter(function (r) { return !isDeleted(r); }).map(function (r) { return normalizeDay(r, r.date); });
    });
  }

  /* ---------- actividades ---------- */
  /** Cómo se sintió antes y después de una actividad (v5): `{ before, after }` o null si nunca se anotó. */
  function sanitizeFeel(f) {
    if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
    var before = sanitizeFeelings(f.before) || [], after = sanitizeFeelings(f.after) || [];
    return before.length || after.length ? { before: before, after: after } : null;
  }

  /** Pasos “a otro día” de una actividad propia (v5): `[{ from, to, at }]`, los últimos 50. */
  function sanitizeMoves(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (m) { return m && D.isValid(m.from) && D.isValid(m.to); }).slice(-50).map(function (m) {
      return { from: m.from, to: m.to, at: sanitizeDeletedAt(m.at) };
    });
  }

  /** Fecha guardada: se respeta si es texto; leer nunca inventa una (D34: “gana el más nuevo” necesita fechas reales). */
  function stampOf(v) { return typeof v === 'string' && v ? v : null; }
  /** Al escribir: createdAt si falta y updatedAt ahora. */
  function stamp(n) { var now = MC.nowISO(); n.createdAt = n.createdAt || now; n.updatedAt = now; return n; }

  function normalizeActivity(a) {
    return {
      id: typeof a.id === 'string' ? a.id : MC.uid('act'),
      date: a.date,
      title: str(a.title).slice(0, 200),
      status: STATUSES.indexOf(a.status) !== -1 ? a.status : 'pending',
      routineId: typeof a.routineId === 'string' ? a.routineId : null,
      order: Number.isFinite(a.order) ? a.order : Date.now(),
      movedFrom: D.isValid(a.movedFrom) ? a.movedFrom : null,
      feel: sanitizeFeel(a.feel),
      moves: sanitizeMoves(a.moves),
      deletedAt: sanitizeDeletedAt(a.deletedAt),
      createdAt: stampOf(a.createdAt),
      updatedAt: stampOf(a.updatedAt)
    };
  }

  function momentRank(m) { var i = MOMENTS.indexOf(m); return i === -1 ? 3 : i; }

  /**
   * Ocurrencias de rutina en `date` que todavía no tienen actividad guardada (virtuales): el único lugar
   * que las calcula (lista del día, resumen del calendario, semana). `marked(r)` dice si ya está marcada.
   */
  function routineOccurrences(routines, date, marked) {
    var out = [];
    (routines || []).forEach(function (r) {
      if (isDeleted(r) || marked(r) || !R.occursOn(r, date)) return;
      out.push({ id: 'v:' + r.id + ':' + date, virtual: true, date: date, title: r.title, status: 'pending', routineId: r.id, order: 0, movedFrom: null });
    });
    return out;
  }

  /**
   * Lista del día: actividades guardadas + ocurrencias de rutinas todavía no marcadas (virtuales).
   * Orden: rutinas (mañana → noche → cuando sea), después las propias por `order`.
   */
  function itemsForDay(date, routines) {
    var routinesP = routines ? Promise.resolve(routines) : getRoutines();
    return Promise.all([S().getAllByIndex('activities', 'date', date), routinesP]).then(function (res) {
      var stored = dedupeOccurrences(res[0].filter(function (a) { return !isDeleted(a); }).map(normalizeActivity));
      var rs = res[1];
      var byRoutine = {};
      stored.forEach(function (a) { if (a.routineId) byRoutine[a.routineId] = a; });
      var routineMap = {};
      rs.forEach(function (r) { routineMap[r.id] = r; });
      var fromRoutines = routineOccurrences(rs, date, function (r) { return !!byRoutine[r.id]; });
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

  /**
   * Una ocurrencia de repetición por (rutina, fecha): si quedaron dos de antes de los ids deterministas,
   * se muestra la de id determinista o, si no hay, la más nueva.
   */
  function dedupeOccurrences(list) {
    var keep = {};
    list.forEach(function (a) {
      if (!a.routineId) return;
      var k = a.routineId + '|' + a.date, cur = keep[k];
      var better = !cur || (a.id === occurrenceId(a.routineId, a.date) && cur.id !== a.id) ||
        (cur.id !== occurrenceId(cur.routineId, cur.date) && String(a.updatedAt || '') > String(cur.updatedAt || ''));
      if (better) keep[k] = a;
    });
    return list.filter(function (a) { return !a.routineId || keep[a.routineId + '|' + a.date] === a; });
  }

  /** Id de una ocurrencia materializada (D34): el mismo en todas las pestañas y dispositivos. */
  function occurrenceId(routineId, date) { return 'act_' + routineId + '_' + date; }

  function addActivity(date, title) {
    var t = String(title || '').trim();
    if (!t) return Promise.resolve(null);
    var a = stamp(normalizeActivity({ date: date, title: t, order: Date.now() }));
    return S().put('activities', a);
  }

  /** Materializa un ítem virtual (ocurrencia de rutina) si hace falta y guarda cambios. */
  function saveItem(item, patch) {
    if (!item.virtual) return S().put('activities', stamp(normalizeActivity(Object.assign({}, item, patch))));
    // Si otra pestaña (o un doble toque) ya la materializó, se suma a esa en vez de pisarla.
    var id = occurrenceId(item.routineId, item.date);
    return S().get('activities', id).then(function (existing) {
      var base = existing && !isDeleted(existing) ? existing
        : { id: id, date: item.date, title: item.title, routineId: item.routineId, order: 0 };
      return S().put('activities', stamp(normalizeActivity(Object.assign({}, base, patch))));
    });
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

  /** “Pasar a mañana”: lo mismo que pasar a otro día, con el día siguiente. */
  function moveToTomorrow(item) { return moveActivity(item, D.addDays(item.date, 1)); }

  /**
   * Mover a otro día (una sola regla para “a mañana” y “a otro día”, D34). Una actividad propia se mueve en el
   * lugar: mismo id, nueva fecha, y anota el paso en `moves` (así “moviste N cosas” cuenta bien). Una de repetición
   * queda “lo dejo para otro día” en su fecha y se copia suelta al día nuevo (si no, la ocurrencia reaparecería).
   */
  function moveActivity(item, date) {
    if (!D.isValid(date) || date === item.date) return Promise.resolve(null);
    if (item.routineId || item.virtual) {
      return setStatus(item, 'postponed').then(function () {
        return S().put('activities', stamp(normalizeActivity({ date: date, title: item.title, order: Date.now(), movedFrom: item.date })));
      });
    }
    var moves = (item.moves || []).concat([{ from: item.date, to: date, at: MC.nowISO() }]);
    return saveItem(item, { date: date, movedFrom: item.movedFrom || item.date, order: Date.now(), moves: moves });
  }

  /** Lo que viene: actividades propias desde `from` (rutinas no: aparecen solas en sus días). */
  function upcoming(from, days) {
    return activitiesInRange(from, D.addDays(from, days || 365)).then(function (list) {
      return list.filter(function (a) { return !a.routineId; }).sort(function (a, b) { return byDate(a, b) || a.order - b.order; });
    });
  }

  function activitiesInRange(from, to) {
    return S().getRange('activities', 'date', from, to).then(function (rows) { return rows.filter(function (a) { return !isDeleted(a); }).map(normalizeActivity); });
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
      // v5 (D29): una repetición puede ser una actividad (de siempre) o una hoja que se repite con su plantilla congelada.
      kind: r.kind === 'sheet' ? 'sheet' : 'activity',
      templateId: typeof r.templateId === 'string' ? r.templateId.slice(0, 80) : null,
      deletedAt: sanitizeDeletedAt(r.deletedAt),
      createdAt: stampOf(r.createdAt),
      updatedAt: stampOf(r.updatedAt)
    };
  }

  function getRoutines() {
    return S().getAll('routines').then(function (rows) {
      return rows.filter(function (r) { return !isDeleted(r); }).map(normalizeRoutine)
        .filter(Boolean)
        .sort(function (a, b) { return momentRank(a.moment) - momentRank(b.moment) || a.title.localeCompare(b.title, 'es'); });
    });
  }

  function saveRoutine(r) {
    var n = normalizeRoutine(r);
    if (!n || !n.title) return Promise.reject(new Error('La rutina necesita un nombre y una frecuencia.'));
    stamp(n);
    if (n.rule.type === 'once') { n.startDate = n.rule.date < n.startDate ? n.rule.date : n.startDate; }
    return S().put('routines', n);
  }

  function deleteRoutine(id) {
    // El historial ya marcado queda como actividades sueltas (routineId se conserva; se muestra aunque la rutina no exista).
    return sendToTrash('routines', id);
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
      privacy: sanitizePrivacy(p.privacy),
      // v5 (D29): estructura de hoja. Mientras sea null, la hoja sigue con kind/body/items (conviven hasta v6).
      blocks: sanitizeBlocks(p.blocks),
      values: sanitizeValues(p.values),
      templateId: typeof p.templateId === 'string' ? p.templateId.slice(0, 80) : null,
      routineId: typeof p.routineId === 'string' ? p.routineId.slice(0, 80) : null,
      deletedAt: sanitizeDeletedAt(p.deletedAt),
      createdAt: stampOf(p.createdAt),
      updatedAt: stampOf(p.updatedAt)
    };
  }

  /* ---------- bloques de hojas y plantillas (v5, D29) ---------- */
  var BLOCK_TYPES = ['text', 'list', 'checks', 'columns'];

  /** Estructura de una hoja: hasta 24 bloques; columnas de 2 a 4. Devuelve null si no hay bloques. */
  function sanitizeBlocks(list) {
    if (!Array.isArray(list)) return null;
    var seen = {};
    var out = list.filter(function (b) { return b && BLOCK_TYPES.indexOf(b.type) !== -1; }).slice(0, 24).map(function (b) {
      var id = typeof b.id === 'string' && /^[\w-]{1,40}$/.test(b.id) && !seen[b.id] ? b.id : MC.uid('blk');
      seen[id] = true;
      var block = { id: id, type: b.type, title: str(b.title).slice(0, 80) };
      if (b.type === 'columns') {
        var cols = (Array.isArray(b.columns) ? b.columns : []).slice(0, 4).map(function (col) {
          return { id: typeof (col && col.id) === 'string' && /^[\w-]{1,40}$/.test(col.id) ? col.id : MC.uid('col'), title: str(col && col.title).slice(0, 60) };
        });
        while (cols.length < 2) cols.push({ id: MC.uid('col'), title: '' });
        block.columns = cols;
      }
      return block;
    });
    return out.length ? out : null;
  }

  /** Contenido por bloque: texto, lista [{id,text}], casillas [{id,text,done}] o columnas {colId: texto}. */
  function sanitizeValues(v) {
    var out = {};
    if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
    Object.keys(v).slice(0, 24).forEach(function (k) {
      if (!/^[\w-]{1,40}$/.test(k)) return;
      var x = v[k];
      if (typeof x === 'string') out[k] = str(x);
      else if (Array.isArray(x)) {
        out[k] = x.filter(function (it) { return it && typeof it.text === 'string'; }).slice(0, 500).map(function (it) {
          var item = { id: typeof it.id === 'string' ? it.id.slice(0, 40) : MC.uid('itm'), text: str(it.text).slice(0, 500) };
          if (typeof it.done === 'boolean') item.done = it.done;
          return item;
        });
      } else if (x && typeof x === 'object') {
        var cols = {};
        Object.keys(x).slice(0, 4).forEach(function (c) { if (/^[\w-]{1,40}$/.test(c) && typeof x[c] === 'string') cols[c] = str(x[c]); });
        out[k] = cols;
      }
    });
    return out;
  }

  function getPages() {
    return S().getAll('pages').then(function (rows) {
      return rows.filter(function (p) { return !isDeleted(p); }).map(normalizePage).sort(function (a, b) {
        return (b.pinned - a.pinned) || (a.createdAt < b.createdAt ? -1 : 1);
      });
    });
  }
  function getPage(id) { return S().get('pages', id).then(function (p) { return p && !isDeleted(p) ? normalizePage(p) : null; }); }
  function savePage(p) {
    return S().put('pages', stamp(normalizePage(p)));
  }
  function deletePage(id) { return sendToTrash('pages', id); }

  /* ---------- imágenes propias: subidas o dibujadas (se usan como stickers, D24) ---------- */
  var IMAGE_SRC = /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/;
  var MAX_IMAGE = 3 * 1024 * 1024;     // largo máximo del data URL (≈2,2 MB de imagen)
  var imageCache = {};

  function num(v, lo, hi, def) { var n = Number(v); return Number.isFinite(n) ? MC.clamp(n, lo, hi) : def; }

  var DRAW_TOOLS = ['technical', 'nib', 'highlighter', 'airbrush', 'graphite'];

  /** Trazos y textos de un dibujo, para poder volver a editarlo. Coordenadas 0..1000. */
  function sanitizeDrawing(d) {
    if (!d || typeof d !== 'object') return null;
    var color = function (c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#493D3B'; }; // color-ok: color guardado de un trazo
    return {
      // Trazos y pasos de relleno, en el orden en que se hicieron (v5, D32). Un trazo viejo es “técnico”.
      strokes: (Array.isArray(d.strokes) ? d.strokes : []).slice(0, 2000).map(function (s) {
        if (s && s.tool === 'fill') {
          return { tool: 'fill', x: num(s.x, 0, 1000, 0), y: num(s.y, 0, 1000, 0), color: color(s.color), tolerance: Math.round(num(s.tolerance, 0, 255, 32)) };
        }
        var points = (Array.isArray(s && s.points) ? s.points : []).slice(0, 4000).map(function (p) { return [num(p && p[0], 0, 1000, 0), num(p && p[1], 0, 1000, 0)]; });
        var out = {
          tool: DRAW_TOOLS.indexOf(s && s.tool) !== -1 ? s.tool : 'technical',
          color: s && s.erase ? null : color(s && s.color),
          erase: !!(s && s.erase),
          width: num(s && s.width, 1, 80, 6),
          points: points
        };
        if (Array.isArray(s && s.pressure) && s.pressure.length === points.length) out.pressure = s.pressure.map(function (p) { return Math.round(num(p, 0, 1, 0.5) * 1000) / 1000; });
        if (Number.isFinite(Number(s && s.seed))) out.seed = Math.abs(Math.round(Number(s.seed))) % 2147483647;
        return out;
      }).filter(function (s) { return s.tool === 'fill' || s.points.length; }),
      texts: (Array.isArray(d.texts) ? d.texts : []).slice(0, 200).map(function (t) {
        return {
          text: str(t && t.text).slice(0, 300),
          x: num(t && t.x, 0, 1000, 500), y: num(t && t.y, 0, 1000, 500),
          size: num(t && t.size, 10, 200, 48),
          font: ['display', 'text', 'ui', 'hand'].indexOf(t && t.font) !== -1 ? t.font : 'hand',
          color: color(t && t.color)
        };
      }).filter(function (t) { return t.text.trim(); })
    };
  }

  function normalizeImage(r) {
    if (!r || typeof r.src !== 'string' || r.src.length > MAX_IMAGE || !IMAGE_SRC.test(r.src)) return null;
    var kind = r.kind === 'drawing' ? 'drawing' : 'upload';
    return {
      id: typeof r.id === 'string' ? r.id : MC.uid('img'),
      kind: kind,
      name: str(r.name).trim().slice(0, 80) || (kind === 'drawing' ? 'Dibujo' : 'Imagen'),
      src: r.src,
      w: Math.round(num(r.w, 1, 4000, 400)), h: Math.round(num(r.h, 1, 4000, 400)),
      drawing: kind === 'drawing' ? sanitizeDrawing(r.drawing) : null,
      deletedAt: sanitizeDeletedAt(r.deletedAt),
      createdAt: stampOf(r.createdAt),
      updatedAt: stampOf(r.updatedAt)
    };
  }

  /** Carga todas las imágenes en memoria (los stickers se dibujan sin esperar). */
  function loadImages() {
    return S().getAll('images').then(function (rows) {
      imageCache = {};
      rows.filter(function (r) { return !isDeleted(r); }).map(normalizeImage).filter(Boolean).forEach(function (r) { imageCache[r.id] = r; });
      return getImagesSync();
    });
  }
  function getImagesSync() {
    return Object.keys(imageCache).map(function (k) { return imageCache[k]; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  }
  function imageById(id) { return imageCache[id] || null; }
  function saveImage(r) {
    var n = normalizeImage(r);
    if (!n) return Promise.reject(new Error('Esa imagen no se pudo guardar.'));
    stamp(n);
    return S().put('images', n).then(function (v) { imageCache[v.id] = v; MC.emit('images', v); return v; });
  }
  function deleteImage(id) {
    return sendToTrash('images', id).then(function (v) {
      if (v) { delete imageCache[id]; MC.emit('images', null); MC.emit('images:trashed', id); }
      return v;
    });
  }

  /* ---------- adjuntos: cualquier archivo, guardado en un día o una página ---------- */
  var MAX_FILE = 14 * 1024 * 1024;     // largo máximo del data URL (≈10 MB de archivo)
  function ownerOk(o) { return typeof o === 'string' && (/^day:\d{4}-\d{2}-\d{2}$/.test(o) ? D.isValid(o.slice(4)) : /^page:[\w-]{1,80}$/.test(o)); }
  function normalizeFile(f) {
    if (!f || !ownerOk(f.owner) || typeof f.data !== 'string' || f.data.length > MAX_FILE || !/^data:[\w.+\/-]*(;[\w=.+-]+)*;base64,/.test(f.data)) return null;
    return {
      id: typeof f.id === 'string' ? f.id : MC.uid('fil'),
      owner: f.owner,
      name: str(f.name).trim().slice(0, 160) || 'archivo',
      type: typeof f.type === 'string' ? f.type.slice(0, 100) : '',
      size: Math.round(num(f.size, 0, 1e9, 0)),
      data: f.data,
      deletedAt: sanitizeDeletedAt(f.deletedAt),
      createdAt: stampOf(f.createdAt),
      updatedAt: stampOf(f.updatedAt) || stampOf(f.createdAt)   // v5: los viejos no lo tenían
    };
  }
  function filesFor(owner) {
    return S().getAllByIndex('files', 'owner', owner).then(function (rows) {
      return rows.filter(function (f) { return !isDeleted(f); }).map(normalizeFile).filter(Boolean).sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; });
    });
  }
  function addFile(f) {
    var n = normalizeFile(f);
    if (!n) return Promise.reject(new Error('Ese archivo no se pudo guardar.'));
    return S().put('files', stamp(n));
  }
  function deleteFile(id) { return sendToTrash('files', id); }

  /* ---------- semanas, plantillas y marcas (v5, D27/D29/D31) ---------- */
  /** Una semana del planner: “Importante” (casillas) y “Notas”. La clave es el lunes. */
  function normalizeWeek(w) {
    if (!w || !D.isValid(w.week)) return null;
    return {
      week: D.startOfWeek(w.week),
      important: (Array.isArray(w.important) ? w.important : []).filter(function (it) { return it && typeof it.text === 'string'; }).slice(0, 40).map(function (it) {
        return { id: typeof it.id === 'string' ? it.id.slice(0, 40) : MC.uid('imp'), text: str(it.text).slice(0, 200), done: it.done === true };
      }),
      notes: str(w.notes),
      privacy: sanitizePrivacy(w.privacy),
      deletedAt: sanitizeDeletedAt(w.deletedAt),
      createdAt: stampOf(w.createdAt),
      updatedAt: stampOf(w.updatedAt)
    };
  }

  /** Plantilla de hoja: estructura (bloques), contenido inicial, papel y stickers. `frozen`: copia de una repetición. */
  function normalizeTemplate(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      id: typeof t.id === 'string' ? t.id.slice(0, 80) : MC.uid('tpl'),
      title: str(t.title).trim().slice(0, 120),
      paper: PAPERS.indexOf(t.paper) !== -1 ? t.paper : 'rayado',
      blocks: sanitizeBlocks(t.blocks) || [{ id: MC.uid('blk'), type: 'text', title: '' }],
      values: sanitizeValues(t.values),
      stickers: sanitizeStickers(t.stickers),
      frozen: t.frozen === true,
      deletedAt: sanitizeDeletedAt(t.deletedAt),
      createdAt: stampOf(t.createdAt),
      updatedAt: stampOf(t.updatedAt)
    };
  }

  var MARK_SOURCES = ['activity', 'day', 'page'];
  var MARK_KINDS = ['victoria'];
  /** Referencia a algo del cuaderno (D25.2): hoy, las victorias. Nunca copia el contenido. */
  function normalizeMark(m) {
    if (!m || MARK_SOURCES.indexOf(m.sourceType) === -1 || typeof m.sourceId !== 'string' || !m.sourceId) return null;
    return {
      id: typeof m.id === 'string' ? m.id.slice(0, 80) : MC.uid('mrk'),
      sourceType: m.sourceType,
      sourceId: m.sourceId.slice(0, 120),
      kind: MARK_KINDS.indexOf(m.kind) !== -1 ? m.kind : 'victoria',
      deletedAt: sanitizeDeletedAt(m.deletedAt),
      createdAt: stampOf(m.createdAt),
      updatedAt: stampOf(m.updatedAt)
    };
  }

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

  /** Lee ambas formas durante v5: [] significa que la persona quitó las emociones. */
  function feelingsOf(slot, setting) {
    if (!slot) return [];
    if (Array.isArray(slot)) return sanitizeFeelings(slot) || [];
    if (Array.isArray(slot.feelings)) return sanitizeFeelings(slot.feelings) || [];
    var labels = (setting || settings()).legacyMoodLabels || (setting || settings()).moodLabels;
    var old = slot.mood && labels && labels[slot.mood - 1];
    return old ? [old] : [];
  }

  function emotionKey(value) {
    return String(value || '').trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /** Ocho hilos fijos por frecuencia; el resto conserva su palabra y usa tinta neutra. */
  function emotionPalette(days, setting) {
    var counts = {}, labels = {}, chosen = (setting || settings()).emotionColors || {};
    (days || []).forEach(function (d) {
      [d.morning, d.evening].forEach(function (slot) {
        feelingsOf(slot, setting).forEach(function (value) {
          var key = emotionKey(value);
          counts[key] = (counts[key] || 0) + 1;
          if (!labels[key]) labels[key] = value;
        });
      });
    });
    var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'es'); });
    var colors = {};
    order.forEach(function (key, i) { colors[key] = chosen[key] || (i < 8 ? 'var(--emotion-' + (i + 1) + ')' : 'var(--ink-soft)'); });
    return { labels: order.slice(0, 8).map(function (key) { return labels[key]; }), otherCount: Math.max(0, order.length - 8),
      color: function (value) { var key = emotionKey(value); return colors[key] || chosen[key] || 'var(--ink-soft)'; },
      count: function (value) { return counts[emotionKey(value)] || 0; } };
  }

  function emotionSuggestions() {
    return Promise.all([S().getAll('days'), S().getAll('activities')]).then(function (rows) {
      var counts = {}, labels = {};
      function add(value) {
        var key = emotionKey(value);
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
        labels[key] = labels[key] || value;
      }
      rows[0].filter(function (d) { return !isDeleted(d); }).forEach(function (d) {
        feelingsOf(d.morning).concat(feelingsOf(d.evening)).forEach(add);
      });
      rows[1].filter(function (a) { return !isDeleted(a); }).forEach(function (a) {
        if (a.feel) (a.feel.before || []).concat(a.feel.after || []).forEach(add);
      });
      return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'es'); })
        .slice(0, 12).map(function (key) { return labels[key]; });
    });
  }

  function pageTitle(p) { return (p && p.title && p.title.trim()) || 'Sin título'; }

  /** Día de una página en el calendario: el elegido o, si no hay, el día en que se empezó. */
  function pageDate(p) { return p ? (D.isValid(p.date) ? p.date : D.fromISO(p.createdAt)) : null; }

  /* ---------- resúmenes para calendario, año e impresión ---------- */
  function blankSummary(date) {
    return { date: date, morning: [], evening: [], feelings: [], wrote: false, memory: '', done: 0, total: 0, pending: 0, planned: 0, routines: 0, byRoutine: {}, items: [], pages: [] };
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
      if (isDeleted(d) || !inRange(d.date)) return;
      var s = at(d.date);
      s.morning = feelingsOf(d.morning, extra.settings);
      s.evening = feelingsOf(d.evening, extra.settings);
      s.feelings = s.evening.length ? s.evening : s.morning;
      s.wrote = hasWriting(d);
      s.memory = d.reflection.keep.trim();
    });
    var marked = {};
    activities.forEach(function (a) {
      if (isDeleted(a) || !inRange(a.date)) return;
      var s = at(a.date);
      s.total++;
      if (countsAsDone(a.status)) s.done++;
      if (a.status === 'pending') s.pending++;
      if (a.routineId) { s.routines++; s.byRoutine[a.routineId] = a.status; marked[a.routineId + '|' + a.date] = true; }
      s.items.push({ title: a.title, kind: a.routineId ? 'routine' : 'own', status: a.status });
    });
    if (extra.routines && extra.routines.length && from && to) {
      D.range(from, to).forEach(function (k) {
        routineOccurrences(extra.routines, k, function (r) { return marked[r.id + '|' + k]; }).forEach(function (v) {
          var s = at(k);
          s.total++; s.pending++; s.planned++; s.routines++;
          s.byRoutine[v.routineId] = 'pending';
          s.items.push({ title: v.title, kind: 'routine', status: 'pending' });
        });
      });
    }
    (extra.pages || []).forEach(function (p) {
      if (isDeleted(p)) return;
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

  /**
   * Cuántos elementos de la papelera vencerían con una retención de `days` días (0 = conservar siempre).
   * `items`: lo que devuelve trashItems(). Ajustes lo usa para avisar antes de acortar el plazo.
   */
  function countDueTrash(items, days, now) {
    if (days === 0) return 0;
    var time = now == null ? Date.now() : (typeof now === 'number' ? now : Date.parse(now));
    return items.filter(function (item) { return time - Date.parse(item.row.deletedAt) > days * 86400000; }).length;
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
        pages: all.pages.map(normalizePage),
        images: (all.images || []).map(normalizeImage).filter(Boolean),
        files: (all.files || []).map(normalizeFile).filter(Boolean),
        weeks: (all.weeks || []).map(normalizeWeek).filter(Boolean),
        templates: (all.templates || []).map(normalizeTemplate).filter(Boolean),
        marks: (all.marks || []).map(normalizeMark).filter(Boolean)
      };
    });
  }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

  var TRASH_STORES = ['days', 'activities', 'routines', 'pages', 'images', 'files', 'weeks', 'templates', 'marks'];
  var TRASH_KEYS = { days: 'date', activities: 'id', routines: 'id', pages: 'id', images: 'id', files: 'id', weeks: 'week', templates: 'id', marks: 'id' };
  function trashStore(store) { if (!TRASH_KEYS[store]) throw new Error('Colección de papelera desconocida.'); }
  function sendToTrash(store, id, now) {
    trashStore(store);
    return S().get(store, id).then(function (row) {
      if (!row || isDeleted(row)) return null;
      row.deletedAt = now || MC.nowISO();
      row.updatedAt = row.deletedAt;
      return S().put(store, row);
    });
  }
  function restoreTrash(store, id) {
    trashStore(store);
    return S().get(store, id).then(function (row) {
      if (!row || !isDeleted(row)) return null;
      row.deletedAt = null;
      row.updatedAt = MC.nowISO();
      return S().put(store, row).then(function (saved) {
        if (store === 'images') return loadImages().then(function () { MC.emit('images', saved); return saved; });
        return saved;
      });
    });
  }
  /** Borra del todo un registro de la papelera. Una página se lleva sus adjuntos: sin ella no hay dónde verlos. */
  function dropForever(store, id) {
    return S().del(store, id).then(function () {
      if (store !== 'pages') return;
      return S().getAllByIndex('files', 'owner', 'page:' + id).then(function (fs) {
        return Promise.all(fs.map(function (f) { return S().del('files', f.id); }));
      });
    });
  }
  function trashItems() {
    return Promise.all(TRASH_STORES.map(function (store) {
      return S().getAll(store).then(function (rows) {
        return rows.filter(isDeleted).map(function (row) { return { store: store, id: row[TRASH_KEYS[store]], row: row }; });
      });
    })).then(function (groups) {
      return [].concat.apply([], groups).sort(function (a, b) { return Date.parse(b.row.deletedAt) - Date.parse(a.row.deletedAt); });
    });
  }
  function purgeTrash(now, retentionDays) {
    var time = now == null ? Date.now() : (typeof now === 'number' ? now : Date.parse(now));
    var days = retentionDays == null ? settings().trashRetentionDays : retentionDays;
    if (!Number.isFinite(time) || TRASH_RETENTION.indexOf(days) === -1) return Promise.reject(new Error('Plazo de papelera inválido.'));
    if (days === 0) return Promise.resolve(0);
    return trashItems().then(function (items) {
      var due = items.filter(function (item) { return time - Date.parse(item.row.deletedAt) > days * 86400000; });
      return Promise.all(due.map(function (item) { return dropForever(item.store, item.id); })).then(function () {
        if (due.some(function (item) { return item.store === 'images'; })) return loadImages().then(function () { return due.length; });
        return due.length;
      });
    });
  }
  function deleteForever(store, id) {
    trashStore(store);
    return S().get(store, id).then(function (row) {
      if (!row || !isDeleted(row)) return false;
      return dropForever(store, id).then(function () {
        if (store === 'images') { delete imageCache[id]; MC.emit('images', null); }
        return true;
      });
    });
  }
  function emptyTrash() {
    return trashItems().then(function (items) {
      return Promise.all(items.map(function (item) { return dropForever(item.store, item.id); })).then(function () {
        if (items.some(function (item) { return item.store === 'images'; })) return loadImages().then(function () { return items.length; });
        return items.length;
      });
    });
  }
  function activeOnly(all) {
    var out = Object.assign({}, all);
    TRASH_STORES.forEach(function (store) { out[store] = (all[store] || []).filter(function (row) { return !isDeleted(row); }); });
    return out;
  }
  function activeEverything() { return everything().then(activeOnly); }

  /** Primer arranque: registra createdAt y cuenta días distintos de apertura. */
  function touchOpen() {
    var today = D.today();
    return Promise.all([getMeta('createdAt', null), getMeta('lastOpenedDay', null), getMeta('openedDays', 0), getMeta('schemaVersion', null)]).then(function (r) {
      var jobs = [];
      if (!r[0]) jobs.push(setMeta('createdAt', MC.nowISO()));
      // Marca informativa de la forma de los datos (la autoridad es la versión de IndexedDB, D34).
      var schema = MC.backup && MC.backup.SCHEMA_VERSION;
      if (schema && r[3] !== schema) jobs.push(setMeta('schemaVersion', schema));
      if (r[1] !== today) {
        jobs.push(setMeta('lastOpenedDay', today));
        jobs.push(setMeta('openedDays', (r[2] || 0) + 1));
      }
      return Promise.all(jobs).then(function () { return { previousDay: r[1], openedDays: r[1] !== today ? (r[2] || 0) + 1 : r[2] }; });
    });
  }

  MC.model = {
    STATUSES: STATUSES, STATUS_LABEL: STATUS_LABEL, routineOccurrences: routineOccurrences, countDueTrash: countDueTrash, MOMENTS: MOMENTS, MOMENT_LABEL: MOMENT_LABEL,
    COVERS: COVERS, MOTION: MOTION, PAPERS: PAPERS, PRIVACY_FLAGS: PRIVACY_FLAGS, TRASH_RETENTION: TRASH_RETENTION,
    sanitizePrivacy: sanitizePrivacy, isPrivate: isPrivate, sanitizeDeletedAt: sanitizeDeletedAt, isDeleted: isDeleted,
    defaultSettings: defaultSettings, mergeSettings: mergeSettings,
    getMeta: getMeta, setMeta: setMeta, loadSettings: loadSettings, settings: settings, saveSettings: saveSettings,
    emptyDay: emptyDay, normalizeDay: normalizeDay, isEmptyDay: isEmptyDay, getDay: getDay, saveDay: saveDay, daysInRange: daysInRange,
    normalizeActivity: normalizeActivity, itemsForDay: itemsForDay, addActivity: addActivity, saveItem: saveItem,
    setStatus: setStatus, renameActivity: renameActivity, deleteActivity: deleteActivity, moveToTomorrow: moveToTomorrow,
    moveActivity: moveActivity, upcoming: upcoming,
    normalizeImage: normalizeImage, sanitizeDrawing: sanitizeDrawing, loadImages: loadImages, images: getImagesSync, imageById: imageById,
    saveImage: saveImage, deleteImage: deleteImage, MAX_IMAGE: MAX_IMAGE,
    normalizeFile: normalizeFile, filesFor: filesFor, addFile: addFile, deleteFile: deleteFile, MAX_FILE: MAX_FILE,
    activitiesInRange: activitiesInRange,
    normalizeRoutine: normalizeRoutine, getRoutines: getRoutines, saveRoutine: saveRoutine, deleteRoutine: deleteRoutine,
    normalizePage: normalizePage, getPages: getPages, getPage: getPage, savePage: savePage, deletePage: deletePage,
    sanitizeBlocks: sanitizeBlocks, sanitizeValues: sanitizeValues, BLOCK_TYPES: BLOCK_TYPES,
    normalizeWeek: normalizeWeek, normalizeTemplate: normalizeTemplate, normalizeMark: normalizeMark,
    sanitizeFeelings: sanitizeFeelings, sanitizeFeel: sanitizeFeel, sanitizeMoves: sanitizeMoves,
    feelingsOf: feelingsOf, emotionKey: emotionKey, emotionPalette: emotionPalette, emotionSuggestions: emotionSuggestions,
    sanitizeTheme: sanitizeTheme, sanitizeEmotionColors: sanitizeEmotionColors, occurrenceId: occurrenceId, DRAW_TOOLS: DRAW_TOOLS,
    sanitizeStickers: sanitizeStickers, summarize: summarize, summaryRange: summaryRange, pagesOn: pagesOn, everything: everything,
    hasWriting: hasWriting, countsAsDone: countsAsDone, moodLabel: moodLabel, pageTitle: pageTitle, pageDate: pageDate,
    TRASH_STORES: TRASH_STORES, sendToTrash: sendToTrash, restoreTrash: restoreTrash, trashItems: trashItems,
    purgeTrash: purgeTrash, deleteForever: deleteForever, emptyTrash: emptyTrash, activeOnly: activeOnly, activeEverything: activeEverything,
    touchOpen: touchOpen
  };
})(typeof window !== 'undefined' ? window : globalThis);
