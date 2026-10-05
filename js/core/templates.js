/* Plantillas de fábrica de las hojas (A7, D29): estructura en bloques (renglones, lista, casillas, columnas),
   papel, un sticker y, a veces, un texto inicial. Las plantillas propias viven en el store `templates`.
   Puro: sin DOM. Ver SPEC §7.5 y DATA_MODEL `templates`. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { var MC = root.MC || (root.MC = {}); MC.templates = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function text(title) { return { type: 'text', title: title || '' }; }
  function list(title) { return { type: 'list', title: title || '' }; }
  function checks(title) { return { type: 'checks', title: title || '' }; }
  function cols(title, names) { return { type: 'columns', title: title || '', columns: names.map(function (n) { return { title: n }; }) }; }

  // Las 12 de siempre (ahora en bloques) + Para dibujar + tres nuevas útiles.
  var FACTORY = [
    { id: 'blank', label: 'En blanco', title: '', paper: 'rayado', blocks: [text()] },
    { id: 'drawing', label: 'Para dibujar', title: 'Un dibujo', paper: 'liso', blocks: [text()], draw: true },
    { id: 'meals', label: 'Comidas del día', title: 'Comidas del día', paper: 'cuadriculado', sticker: 'margarita', blocks: [cols('', ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'])] },
    { id: 'prosCons', label: 'Pros y contras', title: 'Pros y contras', paper: 'cuadriculado', blocks: [text('¿Qué estoy pensando?'), cols('', ['A favor', 'En contra'])] },
    { id: 'doneNext', label: 'Lo hecho y lo que sigue', title: 'Lo hecho y lo que sigue', paper: 'punteado', sticker: 'estrella', blocks: [checks('Lo que hice'), list('Lo que sigue')] },
    { id: 'goodThings', label: 'Cosas que me hacen bien', title: 'Cosas que me hacen bien', paper: 'punteado', sticker: 'sol', blocks: [list()] },
    { id: 'places', label: 'Lugares que amo', title: 'Lugares que amo', paper: 'punteado', sticker: 'hoja', blocks: [list()] },
    { id: 'people', label: 'Personas importantes', title: 'Personas importantes', paper: 'punteado', sticker: 'corazon', blocks: [list()] },
    { id: 'songs', label: 'Canciones de este momento', title: 'Canciones de este momento', paper: 'punteado', sticker: 'auriculares', blocks: [list()] },
    { id: 'wins', label: 'Pequeñas victorias', title: 'Mis pequeñas victorias', paper: 'punteado', sticker: 'estrella', blocks: [list()] },
    { id: 'try', label: 'Cosas que quiero probar', title: 'Cosas que quiero probar', paper: 'punteado', sticker: 'brillito', blocks: [checks()] },
    { id: 'letter', label: 'Carta para mi yo futuro', title: 'Carta para mi yo futuro', paper: 'rayado', sticker: 'sobre', blocks: [text()], values: ['Querida persona del futuro:\n\n'] },
    { id: 'dump', label: 'Vaciar la cabeza', title: 'Vaciar la cabeza', paper: 'cuadriculado', sticker: 'nube', blocks: [text()] },
    { id: 'gratitude', label: 'Gratitud', title: 'Gracias', paper: 'punteado', sticker: 'margarita', blocks: [list()] },
    { id: 'dreams', label: 'Sueños', title: 'Sueños', paper: 'punteado', sticker: 'luna', blocks: [text()] },
    { id: 'wishes', label: 'Lista de deseos', title: 'Lista de deseos', paper: 'punteado', sticker: 'mono', blocks: [list()] },
    { id: 'month', label: 'Reflexión del mes', title: 'Reflexión del mes', paper: 'rayado', sticker: 'hoja', monthly: true,
      blocks: [text('Lo que más me gustó'), text('Lo que me costó'), text('Lo que quiero para el mes que viene')] }
  ];

  var n = 0;
  function uid(prefix) { n++; return prefix + '_' + Date.now().toString(36) + n.toString(36) + Math.random().toString(36).slice(2, 6); }

  function byId(id) { return FACTORY.filter(function (t) { return t.id === id; })[0] || null; }

  /**
   * Una copia nueva de una plantilla de fábrica, lista para ser hoja: ids propios para bloques y columnas,
   * contenido inicial (si tiene) y el sticker de la esquina.
   */
  function instantiate(id) {
    var t = byId(id) || FACTORY[0];
    var values = {};
    var blocks = t.blocks.map(function (b, i) {
      var block = { id: uid('blk'), type: b.type, title: b.title };
      if (b.type === 'columns') block.columns = b.columns.map(function (col) { return { id: uid('col'), title: col.title }; });
      var v = t.values && t.values[i];
      if (typeof v === 'string' && b.type === 'text') values[block.id] = v;
      return block;
    });
    return {
      template: t.id,
      title: t.title,
      paper: t.paper,
      blocks: blocks,
      values: values,
      stickers: t.sticker ? [{ id: uid('stk'), sticker: t.sticker, x: 0.86, y: 0.12, rot: 8, scale: 0.9 }] : [],
      draw: !!t.draw,
      monthly: !!t.monthly
    };
  }

  /** Copia de bloques y valores con ids nuevos (duplicar, congelar para una repetición, empezar desde una propia). */
  function cloneStructure(blocks, values, withValues) {
    var map = {};
    var out = (blocks || []).map(function (b) {
      var nb = { id: uid('blk'), type: b.type, title: b.title || '' };
      map[b.id] = nb.id;
      if (b.type === 'columns') {
        var colMap = {};
        nb.columns = (b.columns || []).map(function (col) { var id = uid('col'); colMap[col.id] = id; return { id: id, title: col.title || '' }; });
        nb._colMap = colMap;
      }
      return nb;
    });
    var vals = {};
    if (withValues && values) {
      out.forEach(function (nb, i) {
        var old = blocks[i], v = values[old.id];
        if (v == null) return;
        if (nb.type === 'columns' && v && typeof v === 'object') {
          var cv = {};
          Object.keys(v).forEach(function (k) { if (nb._colMap[k]) cv[nb._colMap[k]] = v[k]; });
          vals[nb.id] = cv;
        } else if (Array.isArray(v)) {
          vals[nb.id] = v.map(function (it) { return Object.assign({}, it, { id: uid('itm') }); });
        } else vals[nb.id] = v;
      });
    }
    out.forEach(function (nb) { delete nb._colMap; });
    return { blocks: out, values: vals };
  }

  return { FACTORY: FACTORY, byId: byId, instantiate: instantiate, cloneStructure: cloneStructure };
});
