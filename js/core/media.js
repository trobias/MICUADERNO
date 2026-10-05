/* Fotos, dibujos y adjuntos en la nube (NB1, D43). Única fuente de cómo viajan, compartida por el cuaderno
 * (js/sync.js) y el servidor (lib/media.ts):
 * - El registro (`images` o `files`) viaja como siempre, partido por sección (`fotos`), pero SIN el contenido
 *   (`src` de una imagen, `data` de un adjunto): lleva en cambio `media = { v, chunks, length }`.
 * - El contenido (el data URL) viaja aparte, en pedazos de hasta CHUNK caracteres, a Storage privado por el
 *   servidor (Vercel no deja pasar más de ~4,5 MB por pedido). El navegador nunca habla con Supabase.
 * - `v` es la versión del contenido (su `updatedAt` y su largo): si no cambió, no se vuelve a subir ni a bajar. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { var MC = root.MC || (root.MC = {}); MC.media = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STORES = ['images', 'files'];
  var FIELD = { images: 'src', files: 'data' };
  var CHUNK = 3000000;          // caracteres por pedazo (el data URL es ASCII: 1 carácter = 1 byte)
  var MAX_CHUNKS = 5;           // 15 MB de data URL: alcanza para un adjunto de 10 MB (≈13,4 MB en base64)
  var ID = /^[\w-]{1,80}$/;

  function isMedia(store) { return STORES.indexOf(store) !== -1; }

  /** Versión del contenido: cambia solo si cambió lo que pesa. */
  function version(record, store) {
    var body = record && record[FIELD[store]];
    return String((record && record.updatedAt) || '') + ':' + (typeof body === 'string' ? body.length : 0);
  }

  /** El registro sin su contenido, con la ficha de cómo bajarlo. */
  function strip(store, record) {
    if (!record) return null;
    var body = record[FIELD[store]];
    var out = {};
    Object.keys(record).forEach(function (k) { if (k !== FIELD[store] && k !== 'media') out[k] = record[k]; });
    if (typeof body === 'string' && body) out.media = { v: version(record, store), chunks: Math.ceil(body.length / CHUNK), length: body.length };
    return out;
  }

  /** El contenido en pedazos. */
  function split(body) {
    var out = [];
    for (var i = 0; i < body.length; i += CHUNK) out.push(body.slice(i, i + CHUNK));
    return out;
  }

  /** ¿La ficha es razonable? (la usa el servidor antes de aceptar un pedazo). */
  function validMeta(m) {
    return !!m && typeof m === 'object' && typeof m.v === 'string' && m.v.length <= 80 &&
      Number.isInteger(m.chunks) && m.chunks >= 1 && m.chunks <= MAX_CHUNKS &&
      Number.isInteger(m.length) && m.length >= 1 && m.length <= CHUNK * MAX_CHUNKS;
  }

  /** Dónde vive un pedazo en Storage: `<dueña>/<store>/<id>/<n>`. */
  function path(owner, store, id, n) { return owner + '/' + store + '/' + id + '/' + n; }

  function validKey(store, id, n) {
    return isMedia(store) && ID.test(String(id)) && Number.isInteger(n) && n >= 0 && n < MAX_CHUNKS;
  }

  return { STORES: STORES, FIELD: FIELD, CHUNK: CHUNK, MAX_CHUNKS: MAX_CHUNKS, isMedia: isMedia, version: version, strip: strip, split: split, validMeta: validMeta, path: path, validKey: validKey };
});
