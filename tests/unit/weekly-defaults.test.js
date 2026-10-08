'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model, D = MC.dates;
async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  await M.saveSettings({ onboarded: true, name: 'Nicole' });
}

test('cinco actividades iniciales editables: 5 + 3 + 5 + 1 + 1; no crea registros de cumplimiento', async () => {
  await fresh();
  await Promise.all([M.ensureWeeklyDefaults(), M.ensureWeeklyDefaults()]);
  const rs = await M.getRoutines();
  assert.equal(rs.length, 5);
  const plan = M.activityPlan(D.today(), rs);
  assert.equal(M.weeklyProgress(D.today(), plan, []).total, 15);
  assert.equal(rs.find(r => r.title === 'Practica Diseño').targetNote, '1 hora por día');
  assert.equal(rs.find(r => r.title === 'Salir con una amiga').rule.count, 1);
  assert.equal(rs.find(r => r.title === 'Bici').rule.count, 1);
  assert.ok(rs.every(r => r.startDate === D.startOfWeek(D.today())));
  assert.deepEqual(await MC.store.getAll('activities'), []);
  await M.ensureWeeklyDefaults();
  assert.equal((await M.getRoutines()).length, 5);
});

test('adopta nombres existentes sin cambiar frecuencia, respeta pausa y papelera', async () => {
  await fresh();
  const old = [
    { id: 'custom-design', title: 'Practicar diseño', rule: { type: 'weeklyTarget', count: 2 } },
    { id: 'custom-walk', title: 'CAMINAR', rule: { type: 'daily' }, archived: true },
    { id: 'custom-bike', title: 'Bici', rule: { type: 'daily' }, deletedAt: '2026-10-01T12:00:00Z' }
  ].map(M.normalizeRoutine);
  for (const r of old) await MC.store.put('routines', r);
  await M.ensureWeeklyDefaults();
  const all = await MC.store.getAll('routines');
  assert.equal(all.length, 5);
  for (const r of old) assert.deepEqual(all.find(x => x.id === r.id), r);
  assert.equal(all.filter(r => /diseño/i.test(r.title)).length, 1);
});

test('renombrar, cambiar frecuencia, borrar y purgar no reinstala los valores de fábrica; la copia lo conserva', async () => {
  await fresh(); await M.ensureWeeklyDefaults();
  const work = (await M.getRoutines()).find(r => r.title === 'Trabajar');
  await M.saveRoutine({ ...work, title: 'Proyecto propio', rule: { type: 'weeklyTarget', count: 2 } });
  const bike = (await M.getRoutines()).find(r => r.title === 'Bici');
  await M.deleteRoutine(bike.id); await MC.store.del('routines', bike.id);
  await M.loadSettings(); await M.ensureWeeklyDefaults();
  assert.equal((await M.getRoutines()).length, 4);
  assert.equal((await M.getRoutines()).find(r => r.id === work.id).rule.count, 2);
  const copy = MC.backup.validate(MC.backup.build(await M.everything()));
  assert.equal(copy.ok, true, copy.error);
  await fresh(); await MC.backup.restore(copy.payload);
  await M.loadSettings(); await M.ensureWeeklyDefaults();
  assert.equal((await M.getRoutines()).length, 4);
  assert.equal(M.settings().weeklyDefaultsInstalled, true);
});

test('instalación interrumpida se reintenta sin duplicar ni pisar lo ya editado', async () => {
  await fresh();
  const put = MC.store.put;
  let writes = 0;
  MC.store.put = (s, r) => s === 'routines' && ++writes === 3 ? Promise.reject(new Error('sin espacio')) : put(s, r);
  try { await assert.rejects(M.ensureWeeklyDefaults(), /sin espacio/); }
  finally { MC.store.put = put; }
  assert.equal(M.settings().weeklyDefaultsInstalled, false);
  const work = (await M.getRoutines()).find(r => r.title === 'Trabajar');
  await M.saveRoutine({ ...work, title: 'Mi trabajo', rule: { type: 'weeklyTarget', count: 4 } });
  await M.ensureWeeklyDefaults();
  assert.equal((await M.getRoutines()).length, 5);
  assert.equal((await M.getRoutines()).find(r => r.id === work.id).title, 'Mi trabajo');
});

test('no agrega actividades en la bienvenida, al mirar como invitada, ni en semanas anteriores', async () => {
  await fresh(); await M.saveSettings({ onboarded: false });
  await M.ensureWeeklyDefaults(); assert.equal((await M.getRoutines()).length, 0);
  await M.saveSettings({ onboarded: true });
  const cloud = MC.cloud; MC.cloud = { mode: 'guest' };
  try { await M.ensureWeeklyDefaults(); assert.equal((await M.getRoutines()).length, 0); }
  finally { MC.cloud = cloud; }
  const previous = D.addDays(D.startOfWeek(D.today()), -7);
  await M.saveWeek({ week: previous, notes: 'Nicole', important: [] });
  await M.ensureWeeklyDefaults();
  assert.deepEqual(await M.ensureActivityPlan(previous), []);
  assert.equal((await M.getWeek(previous)).notes, 'Nicole');
});

test('migrar v10 no fabrica rutinas ni activa el indicador; valores inválidos no se aceptan', () => {
  const copy = { app: 'mi-cuaderno', kind: 'backup', schemaVersion: 10, data: { meta: { settings: { name: 'Nicole', weeklyDefaultsInstalled: 'true' } }, routines: [] } };
  const v = MC.backup.validate(copy);
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(v.payload.routines, []);
  assert.equal(v.payload.meta.find(m => m.key === 'settings').value.weeklyDefaultsInstalled, false);
});
