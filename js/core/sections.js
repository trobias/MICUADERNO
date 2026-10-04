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

  return { LIST: LIST, ids: ids, STORES: Object.keys(MAP), sectionOf: sectionOf, split: split, merge: merge };
});
