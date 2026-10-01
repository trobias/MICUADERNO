/* Copia de seguridad: construir, validar, migrar y restaurar. Ver DATA_MODEL.md. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;
  var M = function () { return MC.model; };

  var SCHEMA_VERSION = 3;
  var APP_ID = 'mi-cuaderno';

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
    }
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
        files: everything.files || []
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
    var arrays = ['days', 'activities', 'routines', 'pages', 'images', 'files'];
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
      payload: { meta: metaRows, days: days, activities: activities, routines: routines, pages: pages, images: images, files: files },
      summary: {
        exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : null,
        days: days.length, activities: activities.length, routines: routines.length, pages: pages.length, images: images.length, files: files.length,
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
    return MC.store.replaceAll({ meta: [], days: [], activities: [], routines: [], pages: [], images: [], files: [] }).then(function () {
      return M().loadSettings();
    });
  }

  MC.backup = {
    SCHEMA_VERSION: SCHEMA_VERSION, APP_ID: APP_ID, MIGRATIONS: MIGRATIONS,
    build: build, validate: validate, download: download, restore: restore, wipe: wipe, filename: filename
  };
})(typeof window !== 'undefined' ? window : globalThis);
