/* Copia de seguridad: construir, validar, migrar y restaurar. Ver DATA_MODEL.md. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;
  var M = function () { return MC.model; };

  var SCHEMA_VERSION = 7;
  var APP_ID = 'mi-cuaderno';

  /* ---------- contrato v6 (A13, D34): retirar las formas viejas sin perder nada ---------- */
  var DEFAULT_MOOD_WORDS = ['pesado', 'bajito', 'normal', 'bien', 'muy bien'];

  /** Los nombres con los que se leían los ánimos 1–5 de esta persona (los congelados, los elegidos o los de fábrica). */
  function moodWords(settings) {
    var ok = function (l) { return Array.isArray(l) && l.length === 5 && l.every(function (x) { return typeof x === 'string' && x.trim(); }); };
    if (settings && ok(settings.legacyMoodLabels)) return settings.legacyMoodLabels.map(function (x) { return x.trim(); });
    if (settings && ok(settings.moodLabels)) return settings.moodLabels.map(function (x) { return x.trim(); });
    return DEFAULT_MOOD_WORDS.slice();
  }

  /**
   * Un registro con la forma v6. Devuelve el registro nuevo o null si no había nada que cambiar.
   * - días: `mood` 1–5 pasa a ser una emoción escrita (si ese momento no tenía emociones) y se va;
   * - hojas: `kind/body/items` pasan a ser bloques (si no tenía) y se van;
   * - ajustes: se van `moodLabels` y `legacyMoodLabels` (ya convertidos). `cover` queda (D39).
   * Nunca toca `updatedAt`.
   */
  function contractRecord(store, rec, words) {
    if (!rec || typeof rec !== 'object') return null;
    var out = null;
    function copy() { if (!out) out = JSON.parse(JSON.stringify(rec)); return out; }
    if (store === 'days') {
      ['morning', 'evening'].forEach(function (k) {
        var m = rec[k];
        if (!m || typeof m !== 'object' || !('mood' in m)) return;
        var c = copy()[k];
        var n = Number(m.mood);
        if (!Array.isArray(m.feelings) && n >= 1 && n <= 5) c.feelings = [words[n - 1]];
        delete c.mood;
      });
    } else if (store === 'pages') {
      if (!('kind' in rec) && !('body' in rec) && !('items' in rec)) return null;
      var c = copy();
      if (!Array.isArray(rec.blocks) || !rec.blocks.length) {
        if (rec.kind === 'list') {
          c.blocks = [{ id: 'blk_items', type: 'list', title: '' }];
          c.values = { blk_items: (Array.isArray(rec.items) ? rec.items : []).filter(function (it) { return it && typeof it.text === 'string'; }).map(function (it, i) { return { id: typeof it.id === 'string' ? it.id : 'itm_' + i, text: it.text }; }) };
        } else {
          c.blocks = [{ id: 'blk_body', type: 'text', title: '' }];
          c.values = { blk_body: typeof rec.body === 'string' ? rec.body : '' };
        }
      }
      delete c.kind; delete c.body; delete c.items;
    } else if (store === 'meta' && rec.key === 'settings' && rec.value && typeof rec.value === 'object') {
      if (!('moodLabels' in rec.value) && !('legacyMoodLabels' in rec.value)) return null;
      var v = copy().value;
      delete v.moodLabels; delete v.legacyMoodLabels;
    }
    return out;
  }

  /** Migraciones: MIGRATIONS[v] transforma `data` de la versión v-1 a v. */
  var MIGRATIONS = {
    1: function (data) { return data; },
    // v2: cada página tiene su día en el calendario (antes: el día en que se empezó).
    2: function (data) {
      (data.pages || []).forEach(function (p) {
        if (p && typeof p === 'object' && !D.isValid(p.date)) p.date = D.fromISO(p.createdAt) || null;
      });
      return data;
    },
    // v3: imágenes propias (stickers subidos y dibujos) y adjuntos.
    3: function (data) {
      if (data.images == null) data.images = [];
      if (data.files == null) data.files = [];
      return data;
    },
    // v4: campos opcionales `privacy` (días y páginas, PV1) y `deletedAt` (papelera, DA1). Puramente aditiva:
    // los registros no se reescriben (los normalizadores completan null); solo los ajustes ganan la retención.
    4: function (data) {
      var settings = data.meta && data.meta.settings;
      if (settings && typeof settings === 'object' && settings.trashRetentionDays == null) settings.trashRetentionDays = 30;
      return data;
    },
    // v5 (D34, expandir): semanas del planner, plantillas y marcas. Aditiva: los registros viejos conservan su forma
    // (ánimo 1–5, páginas con kind/body/items) y los normalizadores aceptan las dos. Nada toca updatedAt.
    5: function (data) {
      if (data.weeks == null) data.weeks = [];
      if (data.templates == null) data.templates = [];
      if (data.marks == null) data.marks = [];
      return data;
    },
    // v6 (A13, D34, contraer): ánimos 1–5 → emociones escritas, páginas → bloques, fuera los nombres de ánimo.
    6: function (data) {
      var settings = data.meta && data.meta.settings;
      var words = moodWords(settings);
      // Una sección dañada (no lista) se deja como está: la validación de abajo la rechaza con su mensaje.
      if (Array.isArray(data.days)) data.days = data.days.map(function (d) { return contractRecord('days', d, words) || d; });
      if (Array.isArray(data.pages)) data.pages = data.pages.map(function (p) { return contractRecord('pages', p, words) || p; });
      if (settings && typeof settings === 'object') { delete settings.moodLabels; delete settings.legacyMoodLabels; }
      return data;
    },
    // v7 (D45, aditiva): las plantillas pueden ser de día (`kind: 'day'` + `day`). Las de antes son de hoja.
    7: function (data) { return data; }
  };

  function build(everything) {
    return {
      app: APP_ID,
      kind: 'backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        meta: { createdAt: everything.meta.createdAt, settings: everything.meta.settings },
        days: everything.days,
        activities: everything.activities,
        routines: everything.routines,
        pages: everything.pages,
        images: everything.images || [],
        files: everything.files || [],
        weeks: everything.weeks || [],
        templates: everything.templates || [],
        marks: everything.marks || []
      }
    };
  }

  function fail(message) { return { ok: false, error: message }; }

  /**
   * Valida un objeto (ya parseado) o un string JSON.
   * Devuelve { ok, error?, payload?, summary? } donde payload está listo para store.replaceAll.
   */
  function validate(input) {
    var obj = input;
    if (typeof input === 'string') {
      try { obj = JSON.parse(input); } catch (e) { return fail('El archivo no es una copia válida: no se pudo leer (no es JSON).'); }
    }
    if (!obj || typeof obj !== 'object') return fail('El archivo está vacío o no tiene el formato esperado.');
    if (obj.app !== APP_ID || obj.kind !== 'backup') return fail('Este archivo no parece una copia de MI CUADERNO.');
    var v = obj.schemaVersion;
    if (!Number.isInteger(v) || v < 1) return fail('La copia no dice de qué versión es, así que no la puedo abrir con seguridad.');
    if (v > SCHEMA_VERSION) return fail('Esta copia es de una versión más nueva del cuaderno. Actualizá la app y probá de nuevo.');
    var data = obj.data;
    if (!data || typeof data !== 'object') return fail('La copia no tiene contenido.');
    for (var step = v + 1; step <= SCHEMA_VERSION; step++) {
      if (!MIGRATIONS[step]) return fail('No sé cómo actualizar esta copia (falta la migración ' + step + ').');
      data = MIGRATIONS[step](data);
    }
    var arrays = ['days', 'activities', 'routines', 'pages', 'images', 'files', 'weeks', 'templates', 'marks'];
    for (var i = 0; i < arrays.length; i++) {
      if (data[arrays[i]] != null && !Array.isArray(data[arrays[i]])) return fail('La sección “' + arrays[i] + '” de la copia está dañada.');
    }

    var model = M();
    var seenDays = {};
    var days = (data.days || []).filter(function (d) {
      if (!d || !D.isValid(d.date) || seenDays[d.date]) return false;
      seenDays[d.date] = true;
      return true;
    }).map(function (d) { return model.normalizeDay(d, d.date); }).filter(function (d) { return !model.isEmptyDay(d); });

    var seenIds = {};
    var activities = (data.activities || []).filter(function (a) {
      if (!a || !D.isValid(a.date) || typeof a.title !== 'string' || !a.title.trim()) return false;
      if (typeof a.id === 'string') { if (seenIds[a.id]) return false; seenIds[a.id] = true; }
      return true;
    }).map(model.normalizeActivity);

    var routines = (data.routines || []).map(function (r) { return r && typeof r.title === 'string' ? model.normalizeRoutine(r) : null; })
      .filter(function (r) { return r && r.title; });

    var pages = (data.pages || []).filter(function (p) { return p && typeof p === 'object'; }).map(model.normalizePage);
    var images = (data.images || []).map(model.normalizeImage).filter(Boolean);
    var files = (data.files || []).map(model.normalizeFile).filter(Boolean);
    var seenWeeks = {};
    var weeks = (data.weeks || []).map(model.normalizeWeek).filter(function (w) {
      if (!w || seenWeeks[w.week]) return false;
      seenWeeks[w.week] = true;
      return true;
    });
    var templates = (data.templates || []).map(model.normalizeTemplate).filter(Boolean);
    var marks = (data.marks || []).map(model.normalizeMark).filter(Boolean);

    var meta = data.meta || {};
    var settings = model.mergeSettings(meta.settings);
    settings.onboarded = true;
    var metaRows = [
      { key: 'schemaVersion', value: SCHEMA_VERSION },
      { key: 'settings', value: settings },
      { key: 'createdAt', value: typeof meta.createdAt === 'string' ? meta.createdAt : (days[0] ? days[0].createdAt : new Date().toISOString()) }
    ];

    var dates = days.map(function (d) { return d.date; }).concat(activities.map(function (a) { return a.date; })).sort();
    return {
      ok: true,
      payload: { meta: metaRows, days: days, activities: activities, routines: routines, pages: pages, images: images, files: files, weeks: weeks, templates: templates, marks: marks },
      summary: {
        exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : null,
        days: days.length, activities: activities.length, routines: routines.length, pages: pages.length, images: images.length, files: files.length,
        weeks: weeks.length, templates: templates.length, marks: marks.length,
        from: dates[0] || null, to: dates[dates.length - 1] || null,
        name: settings.name
      }
    };
  }

  function filename(prefix, ext) {
    return (prefix || 'mi-cuaderno') + '-' + D.today() + '.' + ext;
  }

  /** Descarga la copia completa y registra la fecha. */
  function download() {
    return M().everything().then(function (all) {
      var json = JSON.stringify(build(all), null, 2);
      MC.download(filename('mi-cuaderno-copia', 'json'), json, 'application/json');
      return M().setMeta('lastBackupAt', new Date().toISOString());
    });
  }

  /**
   * “Descargar la copia de antes” (A13): el cuaderno de hoy con los días, hojas y ajustes como eran antes del
   * contrato v6 (lo que guardó la instantánea `meta.preV6`). Es una copia v5 válida: se puede volver a abrir.
   */
  function buildPreV6(everything, snap) {
    var out = build(everything);
    out.schemaVersion = 5;
    var swap = function (list, old, key) {
      var byKey = {};
      (old || []).forEach(function (r) { byKey[r[key]] = r; });
      return list.map(function (r) { return byKey[r[key]] || r; });
    };
    out.data.days = swap(out.data.days, snap.days, 'date');
    out.data.pages = swap(out.data.pages, snap.pages, 'id');
    if (snap.settings) out.data.meta.settings = snap.settings;
    return out;
  }
  function downloadPreV6() {
    return Promise.all([M().everything(), M().getMeta('preV6', null)]).then(function (r) {
      if (!r[1]) return false;
      MC.download(filename('mi-cuaderno-copia-de-antes', 'json'), JSON.stringify(buildPreV6(r[0], r[1]), null, 2), 'application/json');
      return true;
    });
  }

  /** Reemplaza todo el cuaderno con el payload validado. */
  function restore(payload) {
    return MC.store.replaceAll(payload).then(function () {
      return M().loadImages();
    }).then(function () {
      return M().setMeta('lastBackupAt', new Date().toISOString());
    }).then(function () { return M().loadSettings(); });
  }

  /** Borra todo (mantiene el cuaderno usable, vuelve al onboarding). */
  function wipe() {
    var empty = {};
    MC.store.STORE_NAMES.forEach(function (s) { empty[s] = []; });
    return MC.store.replaceAll(empty).then(function () {
      return M().loadSettings();
    });
  }

  MC.backup = {
    SCHEMA_VERSION: SCHEMA_VERSION, APP_ID: APP_ID, MIGRATIONS: MIGRATIONS, contractRecord: contractRecord, moodWords: moodWords, DEFAULT_MOOD_WORDS: DEFAULT_MOOD_WORDS,
    build: build, validate: validate, download: download, restore: restore, wipe: wipe, filename: filename,
    buildPreV6: buildPreV6, downloadPreV6: downloadPreV6
  };
})(typeof window !== 'undefined' ? window : globalThis);
