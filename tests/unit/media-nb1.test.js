'use strict';
// NB1 (D43): cómo viajan fotos, dibujos y adjuntos. La ficha sin contenido; el contenido en pedazos.
const test = require('node:test');
const assert = require('node:assert/strict');
const MD = require('../../js/core/media.js');
const S = require('../../js/core/sections.js');

const IMG = 'data:image/png;base64,' + 'A'.repeat(100);

test('strip: la ficha no lleva el contenido y dice cómo bajarlo', () => {
  const rec = { id: 'img_1', kind: 'upload', name: 'flor', src: IMG, w: 10, h: 10, updatedAt: '2026-10-05T10:00:00.000Z', media: { viejo: true } };
  const meta = MD.strip('images', rec);
  assert.equal(meta.src, undefined);
  assert.deepEqual(meta.media, { v: '2026-10-05T10:00:00.000Z:' + IMG.length, chunks: 1, length: IMG.length });
  assert.equal(meta.name, 'flor');
  assert.equal(rec.src, IMG, 'no toca el original');
  assert.ok(MD.validMeta(meta.media));
  const file = MD.strip('files', { id: 'fil_1', data: 'data:text/plain;base64,aG9sYQ==', updatedAt: 'x' });
  assert.equal(file.data, undefined);
  assert.equal(MD.strip('images', null), null);
});

test('split: pedazos de CHUNK que juntos dan lo mismo; un adjunto de 10 MB entra', () => {
  const big = 'data:application/pdf;base64,' + 'B'.repeat(MD.CHUNK * 2 + 17);
  const parts = MD.split(big);
  assert.equal(parts.length, 3);
  assert.ok(parts.every((p) => p.length <= MD.CHUNK));
  assert.equal(parts.join(''), big);
  const tenMb = Math.ceil(10 * 1024 * 1024 * 4 / 3) + 40;
  assert.ok(Math.ceil(tenMb / MD.CHUNK) <= MD.MAX_CHUNKS, 'el límite de adjuntos (10 MB) entra en los pedazos permitidos');
  assert.equal(MD.validMeta({ v: 'x', chunks: MD.MAX_CHUNKS + 1, length: 5 }), false);
});

test('versión: solo cambia si cambió lo que pesa o su fecha; claves y rutas seguras', () => {
  const a = { updatedAt: 't1', src: IMG };
  assert.equal(MD.version(a, 'images'), MD.version({ ...a, name: 'otro' }, 'images'));
  assert.notEqual(MD.version(a, 'images'), MD.version({ ...a, src: IMG + 'C' }, 'images'));
  assert.equal(MD.path('own', 'images', 'img_1', 0), 'own/images/img_1/0');
  assert.equal(MD.validKey('images', 'img_1', 0), true);
  assert.equal(MD.validKey('images', '../x', 0), false);
  assert.equal(MD.validKey('days', 'img_1', 0), false);
  assert.equal(MD.validKey('files', 'fil_1', MD.MAX_CHUNKS), false);
});

test('las fichas de fotos y adjuntos caen en la sección fotos', () => {
  assert.deepEqual(S.sectionsOf('images'), ['fotos']);
  assert.deepEqual(S.sectionsOf('files'), ['fotos']);
});
