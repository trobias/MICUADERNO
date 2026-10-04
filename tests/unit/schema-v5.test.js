'use strict';
// Contrato v5 (D34): stores y campos nuevos que conviven con los viejos; ids deterministas; mover en el lugar.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;
const R = MC.recurrence;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

test('días: emociones escritas conviven con el ánimo viejo; null (nunca) ≠ [] (sacadas)', () => {
  const d = M.normalizeDay({ date: '2026-10-04', morning: { mood: 4, feelings: [' calma ', 'Calma', 'cansancio', '', 7] }, evening: { feelings: [] } });
  assert.deepEqual(d.morning, { mood: 4, feelings: ['calma', 'cansancio'], at: null });
  assert.deepEqual(d.evening.feelings, []);
  assert.equal(M.normalizeDay({ date: '2026-10-04' }).morning.feelings, null);
  // Sin repetir aunque cambien tildes o mayúsculas.
  assert.deepEqual(M.sanitizeFeelings(['Alegría', 'alegria', 'ALEGRÍA']), ['Alegría']);
});

test('un día con solo emociones no está vacío: se guarda y vuelve en la copia', async () => {
  await fresh();
  const d = M.emptyDay('2026-10-04');
  d.morning.feelings = ['con energía'];
  assert.equal(M.isEmptyDay(d), false);
  await M.saveDay(d);
  assert.deepEqual((await M.getDay('2026-10-04')).morning.feelings, ['con energía']);
  const v = MC.backup.validate(JSON.stringify(MC.backup.build(await M.everything())));
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.payload.days[0].morning.feelings, ['con energía']);
});

test('actividades: antes/después y pasos a otro día se conservan; leer no inventa fechas', async () => {
  await fresh();
  const a = M.normalizeActivity({ id: 'act_x', date: '2026-10-04', title: 'caminar', feel: { before: ['cansancio'], after: ['calma'] }, moves: [{ from: '2026-10-03', to: '2026-10-04', at: '2026-10-03T10:00:00.000Z' }, { from: 'x' }] });
  assert.deepEqual(a.feel, { before: ['cansancio'], after: ['calma'] });
  assert.deepEqual(a.moves, [{ from: '2026-10-03', to: '2026-10-04', at: '2026-10-03T10:00:00.000Z' }]);
  assert.equal(M.sanitizeFeel({ before: [], after: [] }), null);
  assert.equal(a.createdAt, null);
  assert.equal(a.updatedAt, null);
  const saved = await M.addActivity('2026-10-04', 'leer');
  assert.ok(saved.createdAt && saved.updatedAt, 'al escribir sí se estampan');
});

test('ids deterministas: marcar dos veces una repetición escribe un solo registro, y la lista deduplica lo viejo', async () => {
  await fresh();
  const r = await M.saveRoutine({ title: 'Regar', rule: { type: 'daily' }, startDate: '2026-10-01' });
  const [item] = await M.itemsForDay('2026-10-04');
  assert.equal(item.virtual, true);
  await Promise.all([M.setStatus(item, 'done'), M.setStatus(item, 'partial')]);
  const stored = (await MC.store.getAll('activities')).filter((a) => a.routineId === r.id);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, M.occurrenceId(r.id, '2026-10-04'));
  // Un duplicado de antes (otro id, misma rutina y fecha) no aparece dos veces.
  await MC.store.put('activities', M.normalizeActivity({ id: 'act_viejo', date: '2026-10-04', title: 'Regar', routineId: r.id, status: 'skipped', updatedAt: '2026-10-04T08:00:00.000Z' }));
  const list = (await M.itemsForDay('2026-10-04')).filter((x) => x.routineId === r.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, M.occurrenceId(r.id, '2026-10-04'));
});

test('mover una repetición: queda pospuesta en su día y se copia suelta al día nuevo', async () => {
  await fresh();
  await M.saveRoutine({ title: 'Yoga', rule: { type: 'daily' }, startDate: '2026-10-01' });
  const [item] = await M.itemsForDay('2026-10-04');
  await M.moveActivity(item, '2026-10-06');
  const here = (await M.itemsForDay('2026-10-04')).find((x) => x.title === 'Yoga');
  assert.equal(here.status, 'postponed');
  const there = (await M.itemsForDay('2026-10-06')).filter((x) => x.title === 'Yoga' && !x.routineId);
  assert.equal(there.length, 1);
  assert.equal(there[0].movedFrom, '2026-10-04');
});

test('recurrencia anual: el 29/02 cae el 28/02 en los años comunes', () => {
  const r = { rule: R.sanitizeRule({ type: 'yearly', month: 2, day: 29 }), startDate: '2024-01-01', endDate: null, archived: false };
  assert.deepEqual(r.rule, { type: 'yearly', month: 2, day: 29 });
  assert.equal(R.occursOn(r, '2028-02-29'), true);
  assert.equal(R.occursOn(r, '2028-02-28'), false);
  assert.equal(R.occursOn(r, '2027-02-28'), true);
  assert.equal(R.occursOn(r, '2027-03-01'), false);
  assert.equal(R.describe({ rule: { type: 'yearly', month: 10, day: 4 } }), 'Todos los años, el 4 de octubre');
  assert.equal(R.nextOccurrence({ rule: { type: 'yearly', month: 10, day: 3 }, startDate: '2026-01-01' }, '2026-10-04'), '2027-10-03');
});

test('rutinas: pueden ser hojas que se repiten con su plantilla congelada', () => {
  const r = M.normalizeRoutine({ title: 'Comidas', rule: { type: 'daily' }, kind: 'sheet', templateId: 'tpl_1' });
  assert.deepEqual([r.kind, r.templateId], ['sheet', 'tpl_1']);
  assert.equal(M.normalizeRoutine({ title: 'Regar', rule: { type: 'daily' } }).kind, 'activity');
});

test('hojas: bloques y contenido se sanean; kind/body/items siguen intactos', () => {
  const p = M.normalizePage({
    id: 'pag_1', title: 'Comidas', kind: 'list', items: [{ id: 'i1', text: 'pan' }], body: 'algo',
    blocks: [{ id: 'b1', type: 'columns', title: 'Hoy', columns: [{ id: 'c1', title: 'Desayuno' }] }, { type: 'raro' }, { id: 'b2', type: 'checks' }],
    values: { b1: { c1: 'mate', 'mal id!': 'x' }, b2: [{ id: 'k1', text: 'agua', done: true }, { text: 7 }], '<x>': 'no' },
    templateId: 'tpl_9', routineId: null
  });
  assert.equal(p.blocks.length, 2);
  assert.equal(p.blocks[0].columns.length, 2, 'columnas: mínimo 2');
  assert.deepEqual(p.values.b1, { c1: 'mate' });
  assert.deepEqual(p.values.b2, [{ id: 'k1', text: 'agua', done: true }]);
  assert.equal(p.values['<x>'], undefined);
  assert.deepEqual([p.kind, p.items[0].text, p.body, p.templateId], ['list', 'pan', 'algo', 'tpl_9']);
  assert.equal(M.normalizePage({ title: 'vieja' }).blocks, null, 'una hoja vieja sigue con kind/body/items');
});

test('dibujos: pasos de relleno y herramientas nuevas; los trazos viejos son técnicos', () => {
  const d = M.sanitizeDrawing({ strokes: [
    { color: '#112233', width: 6, points: [[1, 2], [3, 4]] },
    { tool: 'nib', color: '#112233', width: 6, points: [[1, 2], [3, 4]], pressure: [0.2, 1.5], seed: 42 },
    { tool: 'fill', x: 500, y: 2000, color: '#AABBCC', tolerance: 999 },
    { tool: 'rarísima', points: [] }
  ], texts: [] });
  assert.equal(d.strokes.length, 3);
  assert.equal(d.strokes[0].tool, 'technical');
  assert.deepEqual([d.strokes[1].tool, d.strokes[1].pressure, d.strokes[1].seed], ['nib', [0.2, 1], 42]);
  assert.deepEqual(d.strokes[2], { tool: 'fill', x: 500, y: 1000, color: '#AABBCC', tolerance: 255 });
});

test('ajustes: tema y colores de emociones se sanean; los nombres de ánimo viejos se congelan solo si vienen', () => {
  const s = M.mergeSettings({
    theme: { preset: 'cosmos', cloth: '#d6e6e5', cloth2: 'rojo', paper: '#FFF9ED', ink: '#493D3B', accents: ['#F2CFD7', 'x', '#FEE088'], finish: 'neón', angle: 999 },
    emotionColors: { calma: '#9bc4c2', mal: 'rojo' },
    moodLabels: ['a', 'b', 'c', 'd', 'e']
  });
  assert.deepEqual(s.theme, { preset: 'cosmos', cloth: '#D6E6E5', cloth2: null, paper: '#FFF9ED', ink: '#493D3B', angle: 360, accents: ['#F2CFD7', '#FEE088'], finish: 'mate' });
  assert.deepEqual(s.emotionColors, { calma: '#9BC4C2' });
  assert.equal(s.legacyMoodLabels, undefined);
  assert.deepEqual(M.mergeSettings({ legacyMoodLabels: ['p', 'b', 'n', 'bi', 'mb'] }).legacyMoodLabels, ['p', 'b', 'n', 'bi', 'mb']);
  assert.equal(M.mergeSettings({ theme: { cloth: 'nada' } }).theme, null);
});

test('semanas, plantillas y marcas: van y vuelven en la copia y pasan por la papelera', async () => {
  await fresh();
  await MC.store.put('weeks', M.normalizeWeek({ week: '2026-10-01', important: [{ text: 'turno médico', done: false }], notes: 'semana tranqui' }));
  await MC.store.put('templates', M.normalizeTemplate({ id: 'tpl_1', title: 'Comidas', blocks: [{ id: 'b1', type: 'list', title: 'Hoy' }] }));
  await MC.store.put('marks', M.normalizeMark({ id: 'mrk_1', sourceType: 'activity', sourceId: 'act_1', kind: 'victoria' }));
  const all = await M.everything();
  assert.equal(all.weeks[0].week, '2026-09-28', 'la clave de la semana es su lunes');
  const v = MC.backup.validate(JSON.stringify(MC.backup.build(all)));
  assert.equal(v.ok, true, v.error);
  assert.deepEqual([v.summary.weeks, v.summary.templates, v.summary.marks], [1, 1, 1]);
  await MC.backup.restore(v.payload);
  assert.equal((await MC.store.get('templates', 'tpl_1')).title, 'Comidas');
  await M.sendToTrash('templates', 'tpl_1');
  assert.equal((await M.trashItems()).some((i) => i.store === 'templates' && i.id === 'tpl_1'), true);
  await M.restoreTrash('templates', 'tpl_1');
  assert.equal((await MC.store.get('templates', 'tpl_1')).deletedAt, null);
  assert.equal(M.normalizeMark({ sourceType: 'otra', sourceId: 'x' }), null);
});

test('una copia v4 real se migra a v5 sin tocar registros ni fechas', () => {
  const data = {
    meta: { createdAt: '2026-09-01T10:00:00.000Z', settings: { moodLabels: ['pesado', 'bajito', 'normal', 'bien', 'muy bien'], trashRetentionDays: 30 } },
    days: [{ date: '2026-10-01', morning: { mood: 4, at: '2026-10-01T09:00:00.000Z' }, notes: 'hola', createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T21:00:00.000Z' }],
    activities: [], routines: [], pages: [{ id: 'pag_1', title: 'Ideas', kind: 'text', body: 'x', createdAt: '2026-10-01T09:00:00.000Z', updatedAt: '2026-10-01T09:00:00.000Z' }],
    images: [], files: [{ id: 'fil_1', owner: 'day:2026-10-01', name: 'a.txt', data: 'data:text/plain;base64,aG9sYQ==', createdAt: '2026-10-01T09:00:00.000Z' }]
  };
  const before = JSON.stringify([data.days, data.pages]);
  const migrated = MC.backup.MIGRATIONS[5](data);
  assert.equal(JSON.stringify([migrated.days, migrated.pages]), before);
  assert.deepEqual([migrated.weeks, migrated.templates, migrated.marks], [[], [], []]);
  const v = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 4, data });
  assert.equal(v.ok, true, v.error);
  assert.deepEqual([v.payload.days[0].morning.mood, v.payload.days[0].updatedAt], [4, '2026-10-01T21:00:00.000Z']);
  assert.equal(v.payload.files[0].updatedAt, '2026-10-01T09:00:00.000Z', 'un adjunto viejo toma su createdAt');
});
