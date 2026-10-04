import test from 'node:test';
import assert from 'node:assert';
import { dueKind, localParts, TEXTS } from '../../lib/push-plan.ts';

const BA = 'America/Argentina/Buenos_Aires'; // UTC-3

test('hora local en la zona de la persona', () => {
  assert.deepStrictEqual(localParts(new Date('2026-10-04T11:35:00Z'), BA), { day: '2026-10-04', minutes: 8 * 60 + 35 });
  assert.deepStrictEqual(localParts(new Date('2026-10-05T01:00:00Z'), BA), { day: '2026-10-04', minutes: 22 * 60 });
  assert.strictEqual(localParts(new Date('2026-10-04T11:35:00Z'), 'Zona/Inventada').minutes, 8 * 60 + 35);
});

test('toca el aviso cuyo horario pasó dentro de la ventana', () => {
  const at = new Date('2026-10-04T11:45:00Z'); // 08:45 en Buenos Aires
  assert.deepStrictEqual(dueKind(at, BA, '08:30', '21:30'), { kind: 'manana', day: '2026-10-04' });
  assert.strictEqual(dueKind(at, BA, '09:00', '21:30'), null);
  assert.strictEqual(dueKind(at, BA, '07:00', '21:30'), null, 'fuera de la ventana de una hora');
  assert.strictEqual(dueKind(at, BA, null, null), null);
  assert.deepStrictEqual(dueKind(new Date('2026-10-05T00:40:00Z'), BA, '08:30', '21:30'), { kind: 'noche', day: '2026-10-04' });
  assert.deepStrictEqual(dueKind(at, BA, '06:00', null, 24 * 60), { kind: 'manana', day: '2026-10-04' });
});

test('los textos no llevan nada personal ni presión', () => {
  for (const t of Object.values(TEXTS)) {
    assert.ok(!/racha|fallaste|perdiste|!{2}|🎉/i.test(t.title + t.body));
    assert.ok(t.url.startsWith('/'));
  }
});
