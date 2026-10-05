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

test('pasar a mañana: una actividad propia se muda entera y anota el paso (D34)', async () => {
  await fresh();
  const a = await M.addActivity('2026-12-31', 'ordenar mi pieza');
  await M.moveToTomorrow(a);
  assert.equal((await M.itemsForDay('2026-12-31')).length, 0);
  const tomorrow = await M.itemsForDay('2027-01-01');
  assert.equal(tomorrow[0].id, a.id);
  assert.equal(tomorrow[0].title, 'ordenar mi pieza');
  assert.equal(tomorrow[0].movedFrom, '2026-12-31');
  assert.deepEqual(tomorrow[0].moves.map((m) => [m.from, m.to]), [['2026-12-31', '2027-01-01']]);
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
  await M.saveSettings({ name: 'Nicole', cover: 'lavanda', onboarded: true });
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
  assert.equal(v.summary.name, 'Nicole');
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
  // Estado de cada rutina por día: marcada (su estado) o planeada (pending).
  assert.equal(sum['2026-09-30'].byRoutine[rut.id], 'done');
  assert.equal(sum['2026-10-07'].byRoutine[rut.id], 'pending');
  assert.deepEqual(sum['2026-10-07'].items.map((i) => [i.kind, i.title]).sort(), [['own', 'llamar a la abuela'], ['routine', 'Regar']]);
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

test('summarize con rango ignora lo de afuera; “hecho” incluye un poquito', () => {
  const day = (date, extra) => M.normalizeDay(Object.assign({ date }, extra), date);
  const sum = M.summarize(
    [day('2026-09-30', { notes: 'hola' }), day('2026-10-01', { evening: { mood: 4 } })],
    [
      { date: '2026-09-30', status: 'done', routineId: null },
      { date: '2026-10-01', status: 'partial', routineId: null },
      { date: '2026-10-01', status: 'skipped', routineId: null }
    ],
    { from: '2026-10-01', to: '2026-10-31' }
  );
  assert.deepEqual(Object.keys(sum), ['2026-10-01']);
  assert.equal(sum['2026-10-01'].done, 1);
  assert.equal(sum['2026-10-01'].total, 2);
  assert.deepEqual(sum['2026-10-01'].feelings, ['bien']);
  assert.equal(M.countsAsDone('partial'), true);
  assert.equal(M.countsAsDone('skipped'), false);
});

test('lecturas compartidas: escritura, nombre de ánimo, título y fecha de página', () => {
  assert.equal(M.hasWriting(M.normalizeDay({ reflection: { lovely: 'el mate' } }, '2026-10-01')), true);
  assert.equal(M.hasWriting(M.normalizeDay({ morning: { mood: 3 } }, '2026-10-01')), false);
  assert.equal(M.hasWriting(null), false);
  assert.equal(M.moodLabel(5, ['a', 'b', 'c', 'd', 'e']), 'e');
  assert.equal(M.moodLabel(null), null);
  assert.equal(M.pageTitle({ title: '   ' }), 'Sin título');
  assert.equal(M.pageTitle({ title: 'Ideas' }), 'Ideas');
  assert.equal(M.pageDate({ createdAt: new Date(2026, 9, 2, 23, 30).toISOString() }), '2026-10-02');
  assert.equal(M.pageDate({}), null);
});

test('mover a otro día: propia cambia de fecha; de rutina queda para otro día y se copia', async () => {
  await fresh();
  const own = await M.addActivity('2026-10-05', 'turno con la dentista');
  await M.moveActivity(own, '2026-10-09');
  assert.equal((await M.itemsForDay('2026-10-05')).length, 0);
  const moved = (await M.itemsForDay('2026-10-09'))[0];
  assert.equal(moved.id, own.id, 'es la misma, no una copia');
  assert.equal(moved.movedFrom, '2026-10-05');
  const rut = await M.saveRoutine({ title: 'Regar', rule: { type: 'daily' }, startDate: '2026-10-01' });
  const occ = (await M.itemsForDay('2026-10-06')).find((i) => i.routineId === rut.id);
  await M.moveActivity(occ, '2026-10-08');
  assert.equal((await M.itemsForDay('2026-10-06')).find((i) => i.routineId === rut.id).status, 'postponed');
  const copy = (await M.itemsForDay('2026-10-08')).find((i) => !i.routineId && i.title === 'Regar');
  assert.equal(copy.movedFrom, '2026-10-06');
  assert.equal(await M.moveActivity(moved, '2026-10-09'), null, 'mismo día: no hace nada');
});

test('páginas: tienen día en el calendario (elegible) y la copia v1 se migra', async () => {
  await fresh();
  const p = await M.savePage({ title: 'Lista del viaje', date: '2026-12-20' });
  assert.equal(M.pageDate(p), '2026-12-20');
  const sum = await M.summaryRange('2026-12-01', '2026-12-31');
  assert.deepEqual(sum['2026-12-20'].pages.map((x) => x.title), ['Lista del viaje']);
  assert.equal((await M.pagesOn('2026-12-20')).length, 1);
  const old = M.normalizePage({ title: 'vieja', createdAt: new Date(2026, 2, 4, 10).toISOString() });
  assert.equal(old.date, '2026-03-04', 'sin día: el día en que se empezó');
  const v = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 1, data: {
    days: [], activities: [], routines: [], pages: [{ id: 'p1', title: 'x', createdAt: new Date(2026, 4, 1, 12).toISOString() }]
  } });
  assert.equal(v.ok, true);
  assert.equal(v.payload.pages[0].date, '2026-05-01');
  assert.ok(MC.backup.SCHEMA_VERSION >= 2);
});

test('motion: “Completas” por defecto; el valor de fábrica viejo no se respeta, una elección sí', () => {
  assert.equal(M.defaultSettings().motion, 'completas');
  assert.equal(M.mergeSettings({ motion: 'suaves' }).motion, 'completas');
  assert.equal(M.mergeSettings({ motion: 'reducidas' }).motion, 'completas');
  assert.equal(M.mergeSettings({ motion: 'ninguna' }).motion, 'ninguna', '“Ninguna” siempre fue una elección');
  assert.equal(M.mergeSettings({ motion: 'reducidas', motionChosen: true }).motion, 'reducidas');
  assert.equal(M.mergeSettings({ motion: 'cualquiera', motionChosen: true }).motion, 'completas');
});

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('imágenes propias: se guardan, quedan en memoria para los stickers y se borran', async () => {
  await fresh();
  const img = await M.saveImage({ kind: 'upload', name: 'mi gato', src: PNG, w: 1, h: 1 });
  assert.equal(M.imageById(img.id).name, 'mi gato');
  const drawn = await M.saveImage({ kind: 'drawing', src: PNG, drawing: { strokes: [{ color: '#584488', width: 6, points: [[1, 2], [3, 4]] }], texts: [{ text: 'hola', x: 10, y: 10, font: 'hand' }] } });
  assert.equal(drawn.drawing.strokes[0].points.length, 2);
  assert.equal((await M.loadImages()).length, 2);
  await M.deleteImage(img.id);
  assert.equal(M.imageById(img.id), null);
  // Solo imágenes rasterizadas por la app (nada de SVG ni HTML).
  assert.equal(M.normalizeImage({ src: 'data:image/svg+xml;base64,PHN2Zz4=' }), null);
  assert.equal(M.normalizeImage({ src: 'javascript:alert(1)' }), null);
  assert.equal(M.sanitizeStickers([{ sticker: 'img:' + drawn.id, scale: 2.8 }])[0].scale, 2.8);
});

test('adjuntos: cualquier archivo, guardado en un día o una página', async () => {
  await fresh();
  const data = 'data:application/pdf;base64,JVBERi0xLjQK';
  await M.addFile({ owner: 'day:2026-10-01', name: 'entrada.pdf', type: 'application/pdf', size: 9, data });
  await M.addFile({ owner: 'page:pag_1', name: 'nota.txt', type: 'text/plain', size: 4, data: 'data:text/plain;base64,aG9sYQ==' });
  const list = await M.filesFor('day:2026-10-01');
  assert.deepEqual(list.map((f) => f.name), ['entrada.pdf']);
  await M.deleteFile(list[0].id);
  assert.equal((await M.filesFor('day:2026-10-01')).length, 0);
  await assert.rejects(M.addFile({ owner: 'cualquier-cosa', name: 'x', data }));
});

test('backup v3: imágenes y adjuntos van y vuelven; una copia v2 se migra', async () => {
  await fresh();
  await M.saveSettings({ name: 'Nicole', onboarded: true });
  await M.saveImage({ kind: 'upload', name: 'flor', src: PNG, w: 1, h: 1 });
  await M.addFile({ owner: 'day:2026-10-01', name: 'a.txt', type: 'text/plain', size: 4, data: 'data:text/plain;base64,aG9sYQ==' });
  const json = MC.backup.build(await M.everything());
  assert.equal(json.schemaVersion, MC.backup.SCHEMA_VERSION);
  assert.equal(json.data.images.length, 1);
  await MC.backup.wipe();
  assert.equal((await M.loadImages()).length, 0);
  const v = MC.backup.validate(JSON.parse(JSON.stringify(json)));
  assert.equal(v.ok, true);
  assert.equal(v.summary.images, 1);
  await MC.backup.restore(v.payload);
  assert.equal(M.images()[0].name, 'flor');
  assert.equal((await M.filesFor('day:2026-10-01')).length, 1);
  const old = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 2, data: { days: [], activities: [], routines: [], pages: [] } });
  assert.equal(old.ok, true);
  assert.deepEqual([old.payload.images, old.payload.files], [[], []]);
});

test('semana del planner: Importante y Notas por lunes; vacía no se guarda (A6)', async () => {
  await fresh();
  const w = await M.getWeek('2026-10-08');
  assert.equal(w.week, '2026-10-05', 'la clave es el lunes');
  assert.deepEqual(w.important, []);
  w.important.push({ id: 'imp_1', text: 'llamar a la abuela', done: false });
  w.notes = 'semana tranquila';
  const saved = await M.saveWeek(w);
  assert.ok(saved.updatedAt);
  const again = await M.getWeek('2026-10-11');
  assert.equal(again.notes, 'semana tranquila');
  assert.equal(again.important[0].text, 'llamar a la abuela');
  again.important = [{ id: 'imp_1', text: '  ', done: false }];
  again.notes = '';
  await M.saveWeek(again);
  assert.equal(await MC.store.get('weeks', '2026-10-05'), undefined, 'vacía se borra');
  const all = await M.everything();
  assert.ok(Array.isArray(all.weeks));
});
