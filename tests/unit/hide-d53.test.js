'use strict';
// D53: lo que la dueña oculta viaja aparte (conceal) y se vuelve a juntar en sus dispositivos (reveal).
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../js/core/sections.js');

test('conceal/reveal de un día: los campos ocultos salen de lo compartido y vuelven enteros', () => {
  const day = { date: '2026-10-05', notes: 'secreto', intention: 'cuidarme', morning: { feelings: ['bien'] }, stickers: [{ id: 's', sticker: 'rana' }], hide: { fields: ['notes', 'stickers', 'inventado'] }, updatedAt: 'x' };
  const { open, hidden, all } = S.conceal('days', day);
  assert.equal(all, false);
  assert.ok(!('notes' in open) && !('stickers' in open) && !('hide' in open));
  assert.equal(open.intention, 'cuidarme');
  assert.deepEqual(hidden.hide, { all: false, fields: ['notes', 'stickers'], blocks: [] });
  assert.deepEqual(S.reveal('days', open, hidden), Object.assign({}, day, { hide: hidden.hide }));
  // Lo compartido nunca lleva lo oculto en ningún pedazo.
  assert.ok(!JSON.stringify(S.splitAll('days', open)).includes('secreto'));
});

test('conceal/reveal de una hoja: bloques ocultos salen con su contenido y vuelven a su lugar', () => {
  const page = { id: 'p', title: 'Ideas', paper: 'cuadriculado', blocks: [{ id: 'a', type: 'text' }, { id: 'b', type: 'list' }, { id: 'c', type: 'text' }], values: { a: 'uno', b: [{ text: 'dos' }], c: 'tres' }, hide: { blocks: ['b'], fields: ['paper'] } };
  const { open, hidden } = S.conceal('pages', page);
  assert.deepEqual(open.blocks.map((b) => b.id), ['a', 'c']);
  assert.deepEqual(Object.keys(open.values), ['a', 'c']);
  assert.ok(!('paper' in open));
  const back = S.reveal('pages', open, hidden);
  assert.deepEqual(back.blocks.map((b) => b.id), ['a', 'b', 'c']);
  assert.deepEqual(back.values.b, [{ text: 'dos' }]);
  assert.equal(back.paper, 'cuadriculado');
});

test('todo oculto, nada oculto y lo que no se puede ocultar', () => {
  assert.equal(S.conceal('days', { date: 'd', notes: 'x', hide: { all: true } }).all, true);
  const none = S.conceal('days', { date: 'd', notes: 'x', hide: { fields: [] } });
  assert.equal(none.hidden, null);
  assert.ok(!('hide' in none.open));
  assert.equal(S.sanitizeHide({ all: true }, 'routines'), null, 'las repeticiones no se ocultan por partes');
  assert.equal(S.canHide('pages'), true);
});
