'use strict';
// A8 (D31): cuentas descriptivas por período, mes a mes y pequeñas victorias (marks). Sin puntajes ni valoraciones.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;
const I = MC.insights;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

async function seed() {
  await fresh();
  const day = (date, morning, evening, notes) => {
    const d = M.emptyDay(date);
    d.morning.feelings = morning; d.evening.feelings = evening; d.notes = notes || '';
    return M.saveDay(d);
  };
  await day('2026-10-05', ['calma'], ['cansancio'], 'Nicole escribió');
  await day('2026-10-06', ['calma', 'Calma'], [], '');
  await day('2026-09-20', ['alegría'], [], 'algo');
  const priv = M.emptyDay('2026-10-07');
  priv.morning.feelings = ['secreto']; priv.notes = 'privado'; priv.privacy = { noInsights: true, noReviews: true };
  await M.saveDay(priv);
  const a = await M.addActivity('2026-10-05', 'caminar');
  await M.setStatus(a, 'done');
  const b = await M.addActivity('2026-10-06', 'leer');
  await M.saveItem(Object.assign({}, b, { status: 'done', feel: { before: ['cansancio'], after: ['calma'] }, moves: [{ from: '2026-10-04', to: '2026-10-06', at: '2026-10-04T10:00:00.000Z' }] }));
  const c = await M.addActivity('2026-10-07', 'oculta');
  await M.setStatus(c, 'done');
  await M.savePage({ id: 'pg1', date: '2026-10-06', title: 'Lista', body: 'x' });
  return { a, b, c };
}

test('period: cuenta días escritos, emociones, hechas, movidas, antes/después y hojas; respeta noInsights', async () => {
  await seed();
  const all = await M.activeEverything();
  const p = I.period(all, '2026-10-05', '2026-10-11');
  assert.equal(p.written, 1, 'solo emociones no es “escribir”');
  assert.equal(p.feelingDays, 2);
  assert.deepEqual(p.words.map((w) => [w.word, w.n]), [['calma', 2], ['cansancio', 1]], 'una palabra cuenta una vez por día; lo privado no entra');
  assert.equal(p.done, 2, 'la actividad de un día con noInsights no se cuenta');
  assert.equal(p.moved, 0, 'el paso salió del 4, fuera del período');
  assert.equal(I.period(all, '2026-10-01', '2026-10-11').moved, 1);
  assert.equal(p.beforeAfter, 1);
  assert.deepEqual(p.before.map((w) => w.word), ['cansancio']);
  assert.deepEqual(p.after.map((w) => w.word), ['calma']);
  assert.equal(p.sheets, 1);
  // Nada de puntajes: solo números y palabras.
  assert.ok(!('score' in p) && !('streak' in p));
});

test('periods: semana, mes y año hasta hoy', async () => {
  await seed();
  const all = await M.activeEverything();
  const ps = I.periods(all, '2026-10-06');
  assert.equal(ps.week.from, '2026-10-05');
  assert.equal(ps.month.from, '2026-10-01');
  assert.equal(ps.year.from, '2026-01-01');
  assert.equal(ps.year.to, '2026-10-06');
  assert.equal(ps.year.written, 2);
});

test('byMonth: doce filas con escritos, emociones y hechas', async () => {
  await seed();
  const rows = I.byMonth(await M.activeEverything(), '2026');
  assert.equal(rows.length, 12);
  assert.deepEqual(rows[8], { month: '2026-09', name: 'septiembre', written: 1, feelings: 1, done: 0 });
  assert.deepEqual([rows[9].written, rows[9].feelings, rows[9].done], [1, 2, 2]);
});

test('metas semanales: tres un poquito son una victoria derivada en el primer día de alcance, con privacidad e historial', () => {
  const start = '2026-09-28', D = MC.dates;
  const r = M.normalizeRoutine({ id: 'weekly-win', title: 'Caminar', rule: { type: 'weeklyTarget', count: 3 }, startDate: start });
  const plan = M.activityPlan(start, [r]);
  const activities = [0, 1, 2, 3].map(n => ({ id: M.occurrenceId(r.id, D.addDays(start, n)), routineId: r.id, title: r.title, date: D.addDays(start, n), status: 'partial' }));
  const all = { days: [], activities, pages: [], marks: [], weeks: [{ week: start, activityPlan: plan }], routines: [] };
  let v = I.victories(all, '2026');
  assert.equal(v.length, 1);
  assert.deepEqual([v[0].week, v[0].date, v[0].text], [start, '2026-09-30', 'Caminar · 3/3 · 3 un poquito']);
  assert.deepEqual(I.victories(all, '2026'), v, 'sin duplicados al volver a calcular');
  assert.equal(I.victories(all, '2025').length, 0);
  assert.equal(I.victories({ ...all, activities: activities.slice(0, 2) }, '2026').length, 0, '2/3 no es meta alcanzada');
  for (const privacy of [{ noReviews: true }, { noMemory: true }, { noInsights: true }]) {
    assert.equal(I.victories({ ...all, activities: activities.slice(0, 3), days: [{ date: start, privacy }] }, '2026').length, 0);
  }
  assert.equal(I.victories({ ...all, activities: activities.slice(0, 3), days: [{ date: start, deletedAt: '2026-10-01T00:00:00Z' }] }, '2026').length, 0);
  assert.equal(I.victories({ ...all, activities: activities.map((a, n) => n < 2 ? { ...a, deletedAt: '2026-10-01T00:00:00Z' } : a) }, '2026').length, 0);
  assert.equal(all.marks.length, 0, 'no escribe referencias nuevas');
  assert.equal(I.victories({ ...all, weeks: [] }, '2026').length, 0, 'sin reglas ni plan no inventa una meta de rutina de 1/1');
});

test('victorias: id fijo, sin duplicados; se resuelven a su día y respetan papelera y privacidad', async () => {
  const { a, c } = await seed();
  await M.setVictory('activity', a.id, true);
  await M.setVictory('activity', a.id, true);
  assert.equal((await M.getMarks()).length, 1);
  assert.equal(await M.isVictory('activity', a.id), true);
  await M.setVictory('page', 'pg1', true);
  await M.setVictory('day', '2026-09-20', true);
  await M.setVictory('activity', c.id, true); // día con noReviews: no se muestra en el repaso
  let v = I.victories(await M.activeEverything(), '2026');
  assert.deepEqual(v.filter(x => x.sourceType !== 'week').map((x) => [x.date, x.text]), [['2026-10-06', 'Lista'], ['2026-10-05', 'caminar'], ['2026-09-20', 'Este día']]);
  assert.deepEqual(v.filter(x => x.sourceType === 'week').map(x => x.text), ['leer · 1/1'], 'metas alcanzadas se suman sin duplicar la victoria manual de caminar');
  // La actividad cambió de nombre: la victoria dice el nombre nuevo (es una referencia, no una copia).
  await M.saveItem(Object.assign({}, await MC.store.get('activities', a.id), { title: 'caminar al sol' }));
  v = I.victories(await M.activeEverything(), '2026');
  assert.ok(v.some((x) => x.text === 'caminar al sol'));
  // Si la hoja se va a la papelera, su victoria no aparece.
  await M.deletePage('pg1');
  v = I.victories(await M.activeEverything(), '2026');
  assert.ok(!v.some((x) => x.sourceType === 'page'));
  // Desmarcar.
  await M.setVictory('activity', a.id, false);
  assert.equal(await M.isVictory('activity', a.id), false);
  // Va y vuelve en la copia.
  const back = MC.backup.validate(JSON.stringify(MC.backup.build(await M.everything())));
  assert.equal(back.ok, true, back.error);
  assert.ok(back.payload.marks.some((m) => m.sourceType === 'day'));
});
