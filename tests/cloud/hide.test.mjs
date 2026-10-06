// D53: el servidor manda lo oculto a un pedazo privado aparte; quien edita un cuaderno ajeno nunca lo toca.
// Corre con --conditions=react-server (lib/sync.ts es solo del servidor).
import test from 'node:test';
import assert from 'node:assert';
import { toRows } from '../../lib/sync.ts';

const NICOLE = '11111111-1111-4111-8111-111111111111', PSI = '22222222-2222-4222-8222-222222222222';
const all = () => true;

test('la dueña oculta notas: el pedazo compartido no las lleva y el oculto es privado', () => {
  const { rows } = toRows(NICOLE, NICOLE, [{ store: 'days', key: '2026-10-05', record: { date: '2026-10-05', notes: 'secreto', intention: 'ir despacio', hide: { fields: ['notes'] } } }], all, 0);
  const open = rows.filter((r) => r.record_id === '2026-10-05');
  assert.ok(open.every((r) => r.private === false));
  assert.ok(!JSON.stringify(open).includes('secreto') && !JSON.stringify(open).includes('"hide"'));
  const hidden = rows.find((r) => r.record_id === '2026-10-05~oculto');
  assert.strictEqual(hidden.private, true);
  assert.strictEqual(hidden.section, 'escritura');
  assert.deepStrictEqual(hidden.data.fields, { notes: 'secreto' });
  assert.strictEqual(hidden.deleted_at, null);
});

test('todo el día oculto: todos sus pedazos privados; sin nada oculto, el pedazo oculto se borra', () => {
  const a = toRows(NICOLE, NICOLE, [{ store: 'days', key: 'd', record: { date: 'd', notes: 'x', hide: { all: true } } }], all, 0).rows;
  assert.ok(a.every((r) => r.private === true));
  const b = toRows(NICOLE, NICOLE, [{ store: 'days', key: 'd', record: { date: 'd', notes: 'x' } }], all, 0).rows;
  assert.ok(b.filter((r) => r.record_id === 'd').every((r) => !r.private));
  assert.ok(b.find((r) => r.record_id === 'd~oculto').deleted_at, 'sin nada oculto, el pedazo aparte queda borrado');
});

test('quien edita el cuaderno de otra persona no escribe pedazos ocultos ni privados', () => {
  const { rows } = toRows(NICOLE, PSI, [{ store: 'days', key: 'd', record: { date: 'd', morning: { feelings: ['bien'] }, hide: { all: true } } }], (s) => s === 'emociones', 0);
  assert.ok(rows.length > 0 && rows.every((r) => r.private === false && !r.record_id.endsWith('~oculto')));
  assert.ok(!JSON.stringify(rows).includes('"hide"'));
});

test('D54: gana el más nuevo por pedazo; lo borrado y lo sin hora pasan', async () => {
  const { dropStale } = await import('../../lib/sync.ts');
  const { rows } = toRows(NICOLE, NICOLE, [
    { store: 'days', key: 'd1', record: { date: 'd1', notes: 'vieja', updatedAt: '2026-10-05T10:00:00.000Z' } },
    { store: 'days', key: 'd2', record: { date: 'd2', notes: 'nueva', updatedAt: '2026-10-05T12:00:00.000Z' } },
    { store: 'days', key: 'd3', record: null }
  ], all, 0);
  const have = [
    { store: 'days', record_id: 'd1', section: 'escritura', stamp: '2026-10-05T11:00:00.000Z', deleted_at: null },
    { store: 'days', record_id: 'd2', section: 'escritura', stamp: '2026-10-05T11:00:00.000Z', deleted_at: null },
    { store: 'days', record_id: 'd3', section: 'escritura', stamp: '2026-10-05T11:00:00.000Z', deleted_at: null }
  ];
  const kept = dropStale(rows, have);
  assert.ok(!kept.some((r) => r.record_id === 'd1' && r.section === 'escritura'), 'la versión vieja no pisa');
  assert.ok(kept.some((r) => r.record_id === 'd2' && r.section === 'escritura'), 'la nueva sí');
  assert.ok(kept.some((r) => r.record_id === 'd3' && r.deleted_at), 'borrar pasa');
  assert.ok(kept.some((r) => r.record_id === 'd1~oculto'), 'el pedazo oculto (sin hora) pasa');
});
