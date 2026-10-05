'use strict';
// D45: plantillas de día y “que se repita este día” (sus actividades se repiten con el motor de siempre).
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

test('un día como plantilla: actividades propias sin estado, intención y notas; no aparece entre las de hojas', async () => {
  await fresh();
  const day = Object.assign(M.emptyDay('2026-10-06'), { intention: 'ir despacio', notes: 'Nicole anotó esto.' });
  await M.saveDay(day);
  const a = await M.addActivity('2026-10-06', 'Caminar');
  await M.setStatus(a, 'done');
  await M.addActivity('2026-10-06', 'Leer');
  await M.saveRoutine({ title: 'Estirar', rule: { type: 'daily' }, startDate: '2026-10-01' });
  const items = await M.itemsForDay('2026-10-06');
  const t = await M.dayTemplateFrom(await M.getDay('2026-10-06'), items, 'Mi lunes');
  assert.equal(t.kind, 'day');
  assert.deepEqual(t.day, { intention: 'ir despacio', notes: 'Nicole anotó esto.', activities: ['Caminar', 'Leer'] });
  assert.equal((await M.getTemplates()).length, 0, 'las de día no se mezclan con las de hojas');
  assert.deepEqual((await M.getDayTemplates()).map((x) => x.title), ['Mi lunes']);
  // Va y vuelve en la copia (v7).
  const v = MC.backup.validate(JSON.stringify(MC.backup.build(await M.everything())));
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.payload.templates[0].day.activities, ['Caminar', 'Leer']);
});

test('usar una plantilla de día: suma lo que falta y nunca pisa lo escrito', async () => {
  await fresh();
  const tpl = await M.saveTemplate({ kind: 'day', title: 'Mi día', day: { intention: 'respirar', notes: 'plantilla', activities: ['Caminar', 'Regar'] } });
  await M.saveDay(Object.assign(M.emptyDay('2026-10-07'), { notes: 'ya escribí' }));
  await M.addActivity('2026-10-07', 'caminar');
  const added = await M.applyDayTemplate('2026-10-07', tpl);
  assert.equal(added, 1, 'Caminar ya estaba (sin importar mayúsculas)');
  const day = await M.getDay('2026-10-07');
  assert.equal(day.notes, 'ya escribí');
  assert.equal(day.intention, 'respirar');
  assert.deepEqual((await M.itemsForDay('2026-10-07')).map((i) => i.title).sort(), ['Regar', 'caminar']);
});

test('que se repita este día: cada actividad propia pasa a repetirse; las que ya se repiten no se duplican', async () => {
  await fresh();
  await M.addActivity('2026-10-06', 'Caminar');
  await M.addActivity('2026-10-06', 'Leer');
  await M.saveRoutine({ title: 'leer', rule: { type: 'daily' }, startDate: '2026-10-01' });
  const made = await M.repeatDay(await M.itemsForDay('2026-10-06'), { rule: { type: 'weekdays', days: [1] }, startDate: '2026-10-06', endDate: null, moment: null });
  assert.deepEqual(made.map((r) => r.title), ['Caminar']);
  assert.deepEqual(made[0].rule, { type: 'weekdays', days: [1] });
  await assert.rejects(() => M.repeatDay([], { rule: { type: 'daily' } }), /no tiene actividades/);
});

test('que se repita este día: si la repetición cae ese mismo día, la actividad pasa a ser la ocurrencia (sin duplicar, con su estado)', async () => {
  await fresh();
  const a = await M.addActivity('2026-10-06', 'Estirar');
  await M.setStatus(a, 'done');
  await M.repeatDay(await M.itemsForDay('2026-10-06'), { rule: { type: 'daily' }, startDate: '2026-10-06', endDate: null, moment: null });
  const list = (await M.itemsForDay('2026-10-06')).filter((i) => i.title === 'Estirar');
  assert.equal(list.length, 1);
  assert.ok(list[0].routineId);
  assert.equal(list[0].status, 'done');
  assert.equal((await M.itemsForDay('2026-10-07')).filter((i) => i.title === 'Estirar').length, 1);
});
