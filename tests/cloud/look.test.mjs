// Apariencia compartida del cuaderno (lib/look.ts, D48).
import test from 'node:test';
import assert from 'node:assert';
import { lookOf } from '../../lib/look.ts';

test('apariencia compartida (D48): solo tela y colores, saneados', () => {
  const look = lookOf({ name: 'Nicole', cover: 'lavanda', theme: { preset: 'noche' }, notify: { enabled: true }, emotionColors: { calma: '#000000' } });
  assert.deepStrictEqual(look, { cover: 'lavanda', theme: { preset: 'noche' } });
  assert.deepStrictEqual(lookOf(null), { cover: null, theme: null });
  assert.deepStrictEqual(lookOf({ cover: '<script>', theme: [1] }), { cover: null, theme: null });
});
