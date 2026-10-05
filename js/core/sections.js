/* Secciones del cuaderno para compartir con permisos (etapa B, D37). Parte cada registro de IndexedDB en
 * pedazos por sección y los vuelve a juntar. Es la única fuente de qué campo va a qué sección: la nube guarda
 * un pedazo por sección (`notebook_parts`) y la RLS decide quién lee cuál. La lista de ids tiene que coincidir
 * con `public.sections` de supabase/migrations (lo vigila tests/unit/sections.test.js). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { var MC = root.MC || (root.MC = {}); MC.sections = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var LIST = [
    { id: 'semana', label: 'Semana' },
    { id: 'actividades', label: 'Actividades' },
    { id: 'emociones', label: 'Emociones' },
    { id: 'escritura', label: 'Escritura' },
    { id: 'hojas', label: 'Hojas' },
    { id: 'repeticiones', label: 'Repeticiones' },
    { id: 'fotos', label: 'Fotos y adjuntos' },
    { id: 'anio', label: 'Mi año' },
    { id: 'ajustes', label: 'Ajustes' }
  ];

  // Campos que viajan en todos los pedazos de un registro (identidad, fechas, papelera, privacidad).
  var SHARED = ['date', 'week', 'id', 'key', 'privacy', 'deletedAt', 'createdAt', 'updatedAt'];

  // Por store: sección por defecto y campos que van a otra sección.
  var MAP = {
    meta: { base: 'ajustes' },
    days: { base: 'escritura', fields: { morning: 'emociones', evening: 'emociones', energy: 'emociones', sleep: 'emociones' } },
    activities: { base: 'actividades', fields: { feel: 'emociones' } },
    routines: { base: 'repeticiones' },
    pages: { base: 'hojas' },
    templates: { base: 'hojas' },
    images: { base: 'fotos' },
    files: { base: 'fotos' },
    weeks: { base: 'semana' },
    marks: { base: 'anio' }
  };

  function ids() { return LIST.map(function (s) { return s.id; }); }

  /** Todas las secciones en las que puede caer un registro de este store (la base y las de sus campos). */
  function sectionsOf(store) {
    var m = MAP[store];
    if (!m) return [];
    var out = [m.base];
    Object.keys(m.fields || {}).forEach(function (f) { if (out.indexOf(m.fields[f]) === -1) out.push(m.fields[f]); });
    return out;
  }

  /** Clave del registro según el store (la misma keyPath que IndexedDB). */
  var KEYS = { meta: 'key', days: 'date', weeks: 'week' };
  function keyOf(store, record) { return record ? record[KEYS[store] || 'id'] : undefined; }

  /** Como split, pero con un pedazo por cada sección posible del store, aunque quede solo con los campos
   *  compartidos: al sincronizar, así un campo borrado no sobrevive en el pedazo viejo de la nube. */
  function splitAll(store, record) {
    var parts = split(store, record);
    var have = parts.map(function (p) { return p.section; });
    var shared = {};
    SHARED.forEach(function (k) { if (record && k in record) shared[k] = record[k]; });
    sectionsOf(store).forEach(function (s) { if (have.indexOf(s) === -1) parts.push({ section: s, data: MCclone(shared) }); });
    return parts;
  }
  function MCclone(o) { return JSON.parse(JSON.stringify(o)); }

  /** Aplica pedazos sobre un registro existente: cada pedazo reemplaza los campos propios de su sección. */
  function overlay(store, record, parts) {
    var out = record ? MCclone(record) : {};
    (parts || []).forEach(function (p) {
      Object.keys(out).forEach(function (k) {
        if (SHARED.indexOf(k) === -1 && sectionOf(store, k) === p.section) delete out[k];
      });
      Object.keys(p.data || {}).forEach(function (k) {
        if (k === 'updatedAt' && out.updatedAt && out.updatedAt > p.data.updatedAt) return;
        out[k] = p.data[k];
      });
    });
    return out;
  }

  function sectionOf(store, field) {
    var m = MAP[store];
    if (!m) return null;
    return (m.fields && m.fields[field]) || m.base;
  }

  /** Un registro → [{ section, data }]. Cada pedazo lleva los campos compartidos; ninguno queda vacío de datos propios. */
  function split(store, record) {
    if (!MAP[store]) throw new Error('store desconocido: ' + store);
    var shared = {}, by = {};
    Object.keys(record || {}).forEach(function (k) {
      if (SHARED.indexOf(k) !== -1) { shared[k] = record[k]; return; }
      var s = sectionOf(store, k);
      (by[s] || (by[s] = {}))[k] = record[k];
    });
    var secs = Object.keys(by);
    if (!secs.length) secs = [MAP[store].base];
    return secs.map(function (s) {
      var data = {};
      Object.keys(shared).forEach(function (k) { data[k] = shared[k]; });
      Object.keys(by[s] || {}).forEach(function (k) { data[k] = by[s][k]; });
      return { section: s, data: data };
    });
  }

  /** Pedazos (los que se puedan leer) → registro. Lo que falta por permisos simplemente no está. */
  function merge(parts) {
    var out = {};
    (parts || []).forEach(function (p) {
      Object.keys(p.data || {}).forEach(function (k) {
        if (k === 'updatedAt' && out.updatedAt && out.updatedAt > p.data.updatedAt) return; // queda la más nueva
        out[k] = p.data[k];
      });
    });
    return out;
  }

  return { LIST: LIST, ids: ids, STORES: Object.keys(MAP), sectionOf: sectionOf, sectionsOf: sectionsOf, keyOf: keyOf,
    split: split, splitAll: splitAll, merge: merge, overlay: overlay };
});
