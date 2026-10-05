const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../../js/core/sections.js');

test('las secciones coinciden con public.sections de la migración', () => {
  const dir = path.join(__dirname, '../../supabase/migrations');
  const sql = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const block = sql.match(/insert into public\.sections[^;]+;/)[0];
  const ids = [...block.matchAll(/\('([a-z]+)', '([^']+)', \d+\)/g)].map((m) => [m[1], m[2]]);
  assert.deepStrictEqual(ids, S.LIST.map((s) => [s.id, s.label]));
});

test('cada store del cuaderno tiene sección (salvo los internos, como la cola de salida)', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../js/core/store.js'), 'utf8');
  const internal = ['outbox'];
  const stores = Object.keys(eval('(' + src.match(/var STORES = (\{[\s\S]*?\n  \});/)[1] + ')')).filter((s) => !internal.includes(s));
  assert.deepStrictEqual(stores.slice().sort(), S.STORES.slice().sort());
  stores.forEach((s) => assert.ok(S.ids().includes(S.sectionOf(s, 'cualquiera')), s));
});

test('un día de Nicole se parte en escritura y emociones, y se vuelve a juntar', () => {
  const day = {
    date: '2026-10-04', intention: 'tomar mate con calma', notes: 'Nicole escribió', privacy: null,
    morning: { feelings: ['tranquila'], at: null }, energy: 2, updatedAt: '2026-10-04T10:00:00Z'
  };
  const parts = S.split('days', day);
  const by = Object.fromEntries(parts.map((p) => [p.section, p.data]));
  assert.deepStrictEqual(Object.keys(by).sort(), ['emociones', 'escritura']);
  assert.strictEqual(by.emociones.notes, undefined);
  assert.strictEqual(by.escritura.morning, undefined);
  assert.strictEqual(by.emociones.date, '2026-10-04');
  assert.deepStrictEqual(S.merge(parts), day);
  // Sin permiso de escritura, lo que llega es solo lo emocional.
  assert.strictEqual(S.merge(parts.filter((p) => p.section === 'emociones')).notes, undefined);
});

test('las emociones de una actividad van a emociones; un registro sin campos propios no queda sin pedazo', () => {
  const parts = S.split('activities', { id: 'act_1', date: '2026-10-04', title: 'caminar', feel: { before: ['cansada'], after: [] } });
  assert.deepStrictEqual(parts.map((p) => p.section).sort(), ['actividades', 'emociones']);
  assert.deepStrictEqual(S.split('marks', { id: 'mrk_1' }), [{ section: 'anio', data: { id: 'mrk_1' } }]);
  assert.throws(() => S.split('otro', {}));
});

test('al juntar queda el updatedAt más nuevo', () => {
  const r = S.merge([
    { section: 'escritura', data: { date: 'x', updatedAt: '2026-10-04T12:00:00Z' } },
    { section: 'emociones', data: { date: 'x', updatedAt: '2026-10-04T09:00:00Z' } }
  ]);
  assert.strictEqual(r.updatedAt, '2026-10-04T12:00:00Z');
});

test('splitAll deja un pedazo por cada sección posible; overlay reemplaza solo lo de cada sección', () => {
  const day = { date: '2026-10-05', notes: 'hola', updatedAt: '2026-10-05T10:00:00Z' };
  const parts = S.splitAll('days', day);
  assert.deepStrictEqual(parts.map((p) => p.section).sort(), ['emociones', 'escritura']);
  assert.deepStrictEqual(parts.find((p) => p.section === 'emociones').data, { date: '2026-10-05', updatedAt: '2026-10-05T10:00:00Z' });
  // La psicóloga edita emociones: a Nicole le llega solo ese pedazo y sus notas quedan intactas.
  const local = { date: '2026-10-05', notes: 'hola', morning: { feelings: ['cansada'] }, updatedAt: '2026-10-05T10:00:00Z' };
  const out = S.overlay('days', local, [{ section: 'emociones', data: { date: '2026-10-05', morning: { feelings: ['tranquila'] }, updatedAt: '2026-10-05T11:00:00Z' } }]);
  assert.deepStrictEqual(out, { date: '2026-10-05', notes: 'hola', morning: { feelings: ['tranquila'] }, updatedAt: '2026-10-05T11:00:00Z' });
  // Un pedazo vacío borra los campos de su sección.
  assert.strictEqual(S.overlay('days', local, [{ section: 'emociones', data: { date: '2026-10-05' } }]).morning, undefined);
  assert.strictEqual(S.keyOf('days', day), '2026-10-05');
  assert.strictEqual(S.keyOf('meta', { key: 'settings' }), 'settings');
  assert.strictEqual(S.keyOf('pages', { id: 'pag_1' }), 'pag_1');
  assert.deepStrictEqual(S.sectionsOf('activities'), ['actividades', 'emociones']);
});
