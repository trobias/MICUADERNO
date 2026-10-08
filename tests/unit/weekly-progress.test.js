'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model, D = MC.dates;
const START = '2026-09-28';
const routine = (id, rule, extra = {}) => M.normalizeRoutine({ id, title: id, rule, startDate: START, ...extra });
const record = (r, date, status = 'done', extra = {}) => ({ id: M.occurrenceId(r, date), routineId: r, date, title: r, status, ...extra });
const setup = () => [routine('trabajar', { type: 'weekdays', days: [1, 2, 3, 4, 5] }),
  routine('diseño', { type: 'weekdays', days: [1, 2, 3, 4, 5] }, { targetNote: '1 hora por día' }),
  routine('caminar', { type: 'weeklyTarget', count: 3 })];

test('5 + 5 + 3 oportunidades; flexible no suma siete; solo done completa', () => {
  const plan = M.activityPlan(START, setup());
  const acts = [record('trabajar', START), record('diseño', START, 'partial'),
    ...[0, 2, 6].map((n) => record('caminar', D.addDays(START, n)))];
  const p = M.weeklyProgress(START, plan, acts);
  assert.deepEqual([p.done, p.total, p.percent], [4, 13, 31]);
  assert.deepEqual([p.goals[2].done, p.goals[2].total], [3, 3]);
  assert.deepEqual(p.daily[D.addDays(START, 5)], { done: 0, total: 0 }, 'sábado sin caminar ni días fijos no es deuda');
  assert.deepEqual(p.daily[D.addDays(START, 6)], { done: 1, total: 1 });
});

test('no supera 100%, deduplica por rutina y día, respeta semana y papelera', () => {
  const plan = M.activityPlan(START, [routine('caminar', { type: 'weeklyTarget', count: 3 })]);
  const acts = D.range(START, D.addDays(START, 6)).map((k) => record('caminar', k));
  acts.push(record('caminar', START, 'done', { id: 'viejo' }));
  acts.push(record('caminar', D.addDays(START, 7)));
  acts.push({ id: 'borrada', date: START, title: 'suelta', status: 'done', deletedAt: '2026-10-01T00:00:00Z' });
  const p = M.weeklyProgress(START, plan, acts);
  assert.deepEqual([p.done, p.total, p.percent], [3, 3, 100]);
  assert.equal(p.goals[0].recorded, 7, 'conserva las marcas extra, sin inflar el porcentaje');
});

test('vigencia parcial, hojas y pausa no inventan oportunidades; semana vacía y propias', () => {
  const plan = M.activityPlan(START, [routine('caminar', { type: 'weeklyTarget', count: 3 }, { startDate: '2026-10-03' }),
    routine('pausa', { type: 'daily' }, { archived: true }), routine('hoja', { type: 'daily' }, { kind: 'sheet' })]);
  assert.equal(plan.length, 1);
  assert.deepEqual([plan[0].target, plan[0].dates.length], [2, 2]);
  const p = M.weeklyProgress(START, [], [{ id: 'suelta', title: 'leer', date: START, status: 'done' }]);
  assert.deepEqual([p.done, p.total, p.percent], [1, 1, 100]);
  assert.deepEqual([M.weeklyProgress(START, [], []).percent, M.weeklyProgress(START, [], []).total], [0, 0]);
});

test('privacidad y días borrados se excluyen de los objetivos y las marcas', () => {
  const plan = M.activityPlan(START, [routine('trabajar', { type: 'daily' })]);
  const p = M.weeklyProgress(START, plan, [record('trabajar', START)], [{ date: START, privacy: { noInsights: true } }, { date: '2026-09-29', deletedAt: '2026-09-29T20:00:00Z' }]);
  assert.deepEqual([p.done, p.total], [0, 5]);
});

test('la lectura para progreso excluye las actividades de un día en papelera', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  await MC.store.put('days', { date: START, notes: 'Nicole', deletedAt: '2026-09-28T23:00:00Z' });
  await MC.store.put('activities', record('trabajar', START));
  const plan = M.activityPlan(START, [routine('trabajar', { type: 'daily' })]);
  assert.deepEqual(await M.daysInRange(START, '2026-10-04'), [], 'la consulta del calendario oculta ese día');
  const p = await M.getWeeklyProgress(START, plan);
  assert.deepEqual([p.done, p.total], [0, 6]);
});

test('flexible aparece para elegir día, pero no agrega siete pendientes al resumen del mes', () => {
  const rs = [routine('caminar', { type: 'weeklyTarget', count: 3 })];
  assert.equal(M.routineOccurrences(rs, START, () => false).length, 0);
  assert.equal(M.routineOccurrences(rs, START, () => false, true).length, 1);
});

test('historial sobrevive a editar, borrar y purgar la rutina; casillas históricas y notas intactas', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  const r = await M.saveRoutine(routine('caminar', { type: 'weeklyTarget', count: 3 }));
  await M.setStatus((await M.itemsForDay(START))[0], 'done');
  const captured = (await M.getWeek(START)).activityPlan;
  await M.saveRoutine({ ...r, rule: { type: 'weeklyTarget', count: 5 } });
  assert.equal((await M.ensureActivityPlan(START))[0].target, 3);
  await M.deleteRoutine(r.id);
  await MC.store.del('routines', r.id);
  assert.deepEqual((await M.ensureActivityPlan(START)), captured);
  assert.equal((await M.itemsForDay('2026-09-29', null, captured))[0].virtual, true, 'el planner conserva sus oportunidades históricas');
  const oldDraft = { week: START, notes: 'Nicole anotó su semana', important: [] };
  await M.saveWeek(oldDraft);
  assert.deepEqual((await M.getWeek(START)).activityPlan, captured, 'un borrador anterior no borra el plan');
  const p = M.weeklyProgress(START, captured, await M.activitiesInRange(START, '2026-10-04'));
  assert.deepEqual([p.done, p.total], [1, 3]);
  const next = D.startOfWeek(D.addDays(D.today(), 7));
  assert.equal((await M.ensureActivityPlan(next)).length, 0, 'se renueva sin llevar marcas al futuro');
});

test('copia v10 conserva planificación y duración; v9 migra sin fabricar historia', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  await M.saveRoutine(setup()[1]);
  await M.ensureActivityPlan(START);
  const backup = MC.backup.build(await M.everything());
  assert.match(MC.exporters.toTXT(await M.everything()), /1 hora por día/);
  const table = MC.exporters.routinesTable(await M.everything());
  assert.equal(table[0].at(-1), 'duracion_meta');
  assert.equal(table[1].at(-1), '1 hora por día');
  assert.equal(backup.schemaVersion, MC.backup.SCHEMA_VERSION);
  const v = MC.backup.validate(JSON.stringify(backup));
  assert.equal(v.ok, true, v.error);
  assert.equal(v.payload.routines[0].targetNote, '1 hora por día');
  assert.equal(v.payload.weeks[0].activityPlan[0].targetNote, '1 hora por día');
  const old = MC.backup.validate({ ...backup, schemaVersion: 9, data: { ...backup.data, weeks: [] } });
  assert.equal(old.ok, true);
  assert.deepEqual(old.payload.weeks, []);
  assert.equal(MC.backup.validate({ ...backup, schemaVersion: MC.backup.SCHEMA_VERSION + 1 }).ok, false);
});

test('mirar como invitada no crea ni actualiza planes, ni siquiera con permiso de editar actividades', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  const next = D.startOfWeek(D.addDays(D.today(), 7));
  const cloud = MC.cloud;
  MC.cloud = { mode: 'guest' };
  try {
    const plan = await M.ensureActivityPlan(next, setup());
    assert.equal(plan.length, 3);
    assert.equal(await MC.store.get('weeks', next), undefined);
    const captured = M.normalizeWeek({ week: next, notes: 'Nicole', activityPlan: M.activityPlan(next, setup().slice(0, 1)) });
    await MC.store.put('weeks', captured);
    await M.ensureActivityPlan(next, setup());
    assert.deepEqual(await MC.store.get('weeks', next), captured);
  } finally { MC.cloud = cloud; }
});

test('el plan compartido usa el permiso de repeticiones y no filtra títulos al permiso de semana', () => {
  const S = require('../../js/core/sections.js');
  const w = M.normalizeWeek({ week: START, notes: 'notas', activityPlan: M.activityPlan(START, setup()) });
  const parts = S.split('weeks', w);
  assert.equal(parts.find((p) => p.section === 'semana').data.activityPlan, undefined);
  assert.equal(parts.find((p) => p.section === 'repeticiones').data.activityPlan.length, 3);
  assert.deepEqual(S.merge(parts), w);
});

test('tres Trabajar con ids distintos comparten una barra 0/3; marcar uno actualiza a 1/3', () => {
  const acts = ['Trabajar', ' TRABAJAR ', 'trabajar'].map((title, n) => ({ id: 'work-' + n, title, date: D.addDays(START, n), status: 'pending' }));
  let p = M.weeklyProgress(START, [], acts);
  assert.equal(p.goals.length, 1);
  assert.deepEqual([p.goals[0].done, p.goals[0].total, p.total], [0, 3, 3]);
  acts[0].status = 'done'; p = M.weeklyProgress(START, [], acts);
  assert.deepEqual([p.goals[0].done, p.goals[0].total, p.percent], [1, 3, 33]);
});

test('agrupa rutinas y actividades sueltas por nombre, conservando todas las reglas y sus límites', () => {
  const rs = [routine('walk-a', { type: 'weeklyTarget', count: 3 }, { title: 'Caminar' }),
    routine('walk-b', { type: 'once', date: START }, { title: 'CAMINAR' })];
  const plan = M.activityPlan(START, rs);
  const acts = D.range(START, D.addDays(START, 6)).map(k => record('walk-a', k, 'done', { title: 'Caminar' }));
  acts.push(record('walk-b', START, 'skipped', { title: 'Caminar' }));
  acts.push({ id: 'extra-walk', date: START, title: 'Caminar', status: 'postponed' });
  const p = M.weeklyProgress(START, plan, acts);
  assert.equal(p.goals.length, 1);
  assert.deepEqual([p.goals[0].done, p.goals[0].total], [3, 5]);
  assert.deepEqual(p.goals[0].routineIds, ['walk-a', 'walk-b']);
  assert.equal(plan.length, 2, 'agrupar no modifica ni borra reglas');
});

test('el calendario oculta solo pending: conserva los otros cuatro estados y las hojas', async () => {
  await MC.store.init({ memory: true }); await M.loadSettings();
  const rs = [routine('routine-calendar', { type: 'daily' }, { startDate: D.addDays(START, -7) })];
  const acts = M.STATUSES.map((status, n) => ({ id: 'status-' + n, date: START, title: status, status }));
  assert.deepEqual(acts.filter(M.calendarVisible).map(a => a.status), ['done', 'partial', 'postponed', 'skipped']);
  const p = M.summarize([], acts, { from: START, to: D.addDays(START, 6), routines: rs, recordedOnly: true, pages: [{ id: 'page-cal', date: START, title: 'Nicole' }] });
  assert.deepEqual(p[START].items.map(a => a.status), ['done', 'partial', 'postponed', 'skipped']);
  assert.equal(p[START].total, 4);
  assert.equal(p[START].pending, 0);
  assert.equal(p[START].pages.length, 1);
  assert.equal(p[D.addDays(START, 1)], undefined, 'no inventa pendientes virtuales en el calendario');
  assert.equal(M.summarize([], acts, { from: START, to: START, routines: rs })[START].pending, 2, 'la lectura general conserva las casillas para la página del día');
});
