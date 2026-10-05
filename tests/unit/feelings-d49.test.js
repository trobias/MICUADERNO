'use strict';
// D49: emociones de base como sugerencia y el dibujito de cada parche.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

test('feelingGlyph: las cinco de base tienen su dibujito; las demás, estrellita', () => {
  assert.deepEqual(M.BASE_FEELINGS, ['pesado', 'bajito', 'normal', 'bien', 'muy bien']);
  assert.equal(M.feelingGlyph('pesado'), 1);
  assert.equal(M.feelingGlyph('  Muy Bien '), 5);
  assert.equal(M.feelingGlyph('calma'), 0);
  assert.equal(M.feelingGlyph(''), 0);
});

test('emotionSuggestions: primero las que ya usó; las de base completan sin repetirse', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  assert.deepEqual(await M.emotionSuggestions(), ['pesado', 'bajito', 'normal', 'bien', 'muy bien'], 'sin nada anotado: las de base');
  const d = M.emptyDay('2026-10-05');
  d.morning.feelings = ['calma', 'Bien'];
  await M.saveDay(d);
  const s = await M.emotionSuggestions();
  assert.equal(s.length, 6);
  assert.deepEqual(s.slice(0, 2).sort(), ['Bien', 'calma']);
  assert.ok(!s.includes('bien'), 'la de base que ya usó no se repite');
  assert.ok(s.includes('pesado'));
});
