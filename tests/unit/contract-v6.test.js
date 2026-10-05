'use strict';
// A13 (D34, contraer): contrato v6 puro. Convierte sin perder nada, nunca toca updatedAt, es idempotente.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const B = MC.backup;
const M = MC.model;

const WORDS = ['mal', 'flojo', 'más o menos', 'lindo', 're lindo'];

test('días: ánimo → palabra solo si no había emociones; [] se respeta; updatedAt intacto; idempotente', () => {
  const day = { date: '2026-10-01', morning: { mood: 4, at: 'x' }, evening: { mood: 2, feelings: [] }, updatedAt: '2026-10-01T21:00:00.000Z' };
  const out = B.contractRecord('days', day, WORDS);
  assert.deepEqual(out.morning, { at: 'x', feelings: ['lindo'] });
  assert.deepEqual(out.evening, { feelings: [] });
  assert.equal(out.updatedAt, day.updatedAt);
  assert.equal(day.morning.mood, 4, 'no modifica el original');
  assert.equal(B.contractRecord('days', out, WORDS), null, 'idempotente');
  assert.equal(B.contractRecord('days', { date: '2026-10-02', morning: { feelings: ['calma'] } }, WORDS), null);
});

test('hojas: texto y lista → un bloque; con bloques solo se van los campos viejos', () => {
  const list = B.contractRecord('pages', { id: 'p1', kind: 'list', items: [{ id: 'a', text: 'pan' }, { text: 7 }], body: '' }, WORDS);
  assert.deepEqual([list.blocks, list.values], [[{ id: 'blk_items', type: 'list', title: '' }], { blk_items: [{ id: 'a', text: 'pan' }] }]);
  assert.ok(!('kind' in list) && !('items' in list) && !('body' in list));
  const text = B.contractRecord('pages', { id: 'p2', kind: 'text', body: 'hola', items: [] }, WORDS);
  assert.deepEqual(text.values, { blk_body: 'hola' });
  const both = B.contractRecord('pages', { id: 'p3', kind: 'text', body: 'derivado', blocks: [{ id: 'b', type: 'checks' }], values: { b: [] } }, WORDS);
  assert.deepEqual(both.blocks, [{ id: 'b', type: 'checks' }], 'los bloques mandan');
  assert.equal(B.contractRecord('pages', both, WORDS), null);
});

test('ajustes: se van los nombres de ánimo; cover queda (D39)', () => {
  const row = { key: 'settings', value: { cover: 'rosa', moodLabels: WORDS, legacyMoodLabels: WORDS } };
  const out = B.contractRecord('meta', row, WORDS);
  assert.deepEqual(out.value, { cover: 'rosa' });
  assert.equal(B.contractRecord('meta', { key: 'createdAt', value: 'x' }, WORDS), null);
});

test('copia de antes: v5 válida con lo que cambió como era; se vuelve a abrir', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  await M.saveDay(Object.assign(M.emptyDay('2026-10-01'), { notes: 'hola', morning: { feelings: ['lindo'], at: null } }));
  await M.savePage({ id: 'p1', title: 'Carta', blocks: [{ id: 'blk_body', type: 'text' }], values: { blk_body: 'Querida persona' } });
  const snap = { at: '2026-10-05T10:00:00.000Z', days: [{ date: '2026-10-01', morning: { mood: 4 }, notes: 'hola' }], pages: [{ id: 'p1', title: 'Carta', kind: 'text', body: 'Querida persona' }], settings: { name: 'Nicole', moodLabels: WORDS } };
  const copy = B.buildPreV6(await M.everything(), snap);
  assert.equal(copy.schemaVersion, 5);
  assert.equal(copy.data.days[0].morning.mood, 4);
  assert.equal(copy.data.pages[0].kind, 'text');
  const v = B.validate(JSON.stringify(copy));
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.payload.days[0].morning.feelings, ['lindo']);
  assert.equal(M.sheetText(v.payload.pages[0]), 'Querida persona');
});
