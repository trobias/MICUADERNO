'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

test('día vacío no se guarda; día con ánimo sí', async () => {
  await fresh();
  const d = await M.getDay('2026-09-30');
  await M.saveDay(d);
  assert.equal(await MC.store.get('days', '2026-09-30'), undefined);
  d.morning.mood = 4;
  await M.saveDay(d);
  const back = await M.getDay('2026-09-30');
  assert.equal(back.morning.mood, 4);
  back.morning.mood = null;
  await M.saveDay(back);
  assert.equal(await MC.store.get('days', '2026-09-30'), undefined);
});

test('rutinas aparecen como virtuales y se materializan una sola vez', async () => {
  await fresh();
  const rut = await M.saveRoutine({ title: 'Caminar', rule: { type: 'weekdays', days: [3] }, startDate: '2026-09-01', moment: 'manana' });
  await M.addActivity('2026-09-30', 'estudiar un rato');
  let items = await M.itemsForDay('2026-09-30');
  assert.equal(items.length, 2);
  assert.equal(items[0].virtual, true);
  assert.equal(items[0].title, 'Caminar');
  await M.setStatus(items[0], 'done');
  items = await M.itemsForDay('2026-09-30');
  assert.equal(items.length, 2);
  assert.equal(items[0].virtual, undefined);
  assert.equal(items[0].status, 'done');
  await M.setStatus(items[0], 'partial');
  const all = await MC.store.getAll('activities');
  assert.equal(all.filter((a) => a.routineId === rut.id).length, 1);
  // otro día que no toca
  assert.equal((await M.itemsForDay('2026-10-01')).length, 0);
});

test('borrar una rutina conserva el historial marcado', async () => {
  await fresh();
  const rut = await M.saveRoutine({ title: 'Leer', rule: { type: 'daily' }, startDate: '2026-09-01' });
  const [item] = await M.itemsForDay('2026-09-29');
  await M.setStatus(item, 'done');
  await M.deleteRoutine(rut.id);
  const past = await M.itemsForDay('2026-09-29');
  assert.equal(past.length, 1);
  assert.equal(past[0].routineGone, true);
  assert.equal((await M.itemsForDay('2026-09-30')).length, 0);
});

test('pasar a mañana', async () => {
  await fresh();
  const a = await M.addActivity('2026-12-31', 'ordenar mi pieza');
  await M.moveToTomorrow(a);
  const today = await M.itemsForDay('2026-12-31');
  const tomorrow = await M.itemsForDay('2027-01-01');
  assert.equal(today[0].status, 'postponed');
  assert.equal(tomorrow[0].title, 'ordenar mi pieza');
  assert.equal(tomorrow[0].movedFrom, '2026-12-31');
});

test('settings viejos o raros se mezclan con defaults', () => {
  const s = M.mergeSettings({ cover: 'violeta', motion: 'ninguna', moodLabels: ['a', '', 'c'], notify: { morning: { time: '25h' } } });
  assert.equal(s.cover, 'salvia');
  assert.equal(s.motion, 'ninguna');
  assert.equal(s.moodLabels.length, 5);
  assert.equal(s.notify.morning.time, '08:30');
});

test('backup: exportar → borrar → restaurar deja todo igual', async () => {
  await fresh();
  await M.saveSettings({ name: 'Sofi', cover: 'lavanda', onboarded: true });
  const day = M.emptyDay('2026-09-30');
  day.morning.mood = 2; day.notes = 'hoy llovió, "tranquilo"'; day.reflection.keep = 'el té de la tarde';
  day.stickers = [{ id: 's1', sticker: 'mariposa', x: 0.9, y: 0.1, rot: 8, scale: 1 }];
  await M.saveDay(day);
  await M.addActivity('2026-09-30', 'caminar');
  await M.saveRoutine({ title: 'Leer', rule: { type: 'monthlyNth', nth: 1, weekday: 6 }, startDate: '2026-01-01' });
  await M.savePage({ title: 'Lugares que amo', kind: 'list', items: [{ text: 'la plaza' }] });

  const before = await M.everything();
  const json = JSON.stringify(MC.backup.build(before));
  await MC.backup.wipe();
  assert.equal((await M.everything()).days.length, 0);

  const v = MC.backup.validate(json);
  assert.equal(v.ok, true, v.error);
  assert.equal(v.summary.days, 1);
  assert.equal(v.summary.name, 'Sofi');
  await MC.backup.restore(v.payload);
  const after = await M.everything();
  assert.deepEqual(after.days, before.days);
  assert.deepEqual(after.activities, before.activities);
  assert.deepEqual(after.routines, before.routines);
  assert.deepEqual(after.pages, before.pages);
  assert.equal(M.settings().cover, 'lavanda');

  // Importar dos veces no duplica (reemplaza)
  await MC.backup.restore(MC.backup.validate(json).payload);
  assert.equal((await M.everything()).activities.length, 1);
});

test('backup inválido: mensajes claros', () => {
  assert.match(MC.backup.validate('{no json').error, /no es JSON/);
  assert.match(MC.backup.validate({ app: 'otra' }).error, /no parece una copia/);
  assert.match(MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 99, data: {} }).error, /más nueva/);
  assert.match(MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 1, data: { days: 'x' } }).error, /dañada/);
  const ok = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 1, data: {
    days: [{ date: '2026-02-30', notes: 'x' }, { date: '2026-03-01', notes: 'hola' }, { date: '2026-03-01', notes: 'dup' }],
    activities: [{ date: '2026-03-01', title: '', status: 'done' }, { date: '2026-03-01', title: 'ok', status: 'raro' }]
  } });
  assert.equal(ok.ok, true);
  assert.equal(ok.payload.days.length, 1);
  assert.equal(ok.payload.activities.length, 1);
  assert.equal(ok.payload.activities[0].status, 'pending');
});

test('el resumen del calendario incluye rutinas sin marcar y páginas', async () => {
  await fresh();
  // Miércoles 30/09 y 07/10 (weekdays 3).
  const rut = await M.saveRoutine({ title: 'Regar', rule: { type: 'weekdays', days: [3] }, startDate: '2026-09-01' });
  await M.addActivity('2026-10-07', 'llamar a la abuela');
  const items = await M.itemsForDay('2026-09-30');
  await M.setStatus(items.find((i) => i.routineId === rut.id), 'done');
  await M.savePage({ title: 'Ideas', createdAt: new Date(2026, 9, 2, 23, 30).toISOString() });

  const sum = await M.summaryRange('2026-09-28', '2026-10-11');
  // Marcada: no se cuenta dos veces.
  assert.equal(sum['2026-09-30'].total, 1);
  assert.equal(sum['2026-09-30'].done, 1);
  assert.equal(sum['2026-09-30'].pending, 0);
  // Futura: la rutina virtual + la propia, ambas pendientes; solo la rutina es “planned”.
  assert.equal(sum['2026-10-07'].pending, 2);
  assert.equal(sum['2026-10-07'].planned, 1);
  assert.equal(sum['2026-10-07'].routines, 1);
  // Página en su fecha local de creación.
  assert.deepEqual(sum['2026-10-02'].pages.map((p) => p.title), ['Ideas']);
  assert.equal((await M.pagesOn('2026-10-02')).length, 1);
  // Días sin nada no aparecen.
  assert.equal(sum['2026-10-01'], undefined);
});

test('summarize sin extra conserva la forma anterior', () => {
  const sum = M.summarize([], [{ date: '2026-09-01', status: 'skipped', routineId: null }]);
  assert.equal(sum['2026-09-01'].total, 1);
  assert.equal(sum['2026-09-01'].done, 0);
  assert.deepEqual(sum['2026-09-01'].pages, []);
});
