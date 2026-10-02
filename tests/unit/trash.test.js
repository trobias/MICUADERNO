'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

test('papelera: página y rutina conservan identidad, desaparecen y se restauran', async () => {
  await fresh();
  const page = await M.savePage({ title: 'Para volver', date: '2026-10-02' });
  const routine = await M.saveRoutine({ title: 'Caminar', rule: { type: 'daily' }, startDate: '2026-10-01' });
  await M.deletePage(page.id);
  await M.deleteRoutine(routine.id);
  assert.equal((await M.getPages()).length, 0);
  assert.equal((await M.getRoutines()).length, 0);
  assert.equal((await M.trashItems()).length, 2);
  assert.ok((await MC.store.get('pages', page.id)).deletedAt);
  await M.restoreTrash('pages', page.id);
  await M.restoreTrash('routines', routine.id);
  assert.equal((await M.getPage(page.id)).id, page.id);
  assert.equal((await M.getRoutines())[0].id, routine.id);
  assert.equal((await M.trashItems()).length, 0);
});

test('papelera: imagen no se dibuja hasta restaurarla y adjunto deja de verse', async () => {
  await fresh();
  const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const image = await M.saveImage({ name: 'Flor', src });
  const file = await M.addFile({ owner: 'day:2026-10-02', name: 'nota.txt', data: 'data:text/plain;base64,aG9sYQ==' });
  await M.deleteImage(image.id);
  await M.deleteFile(file.id);
  assert.equal(M.imageById(image.id), null);
  assert.equal((await M.filesFor(file.owner)).length, 0);
  await M.restoreTrash('images', image.id);
  await M.restoreTrash('files', file.id);
  assert.equal(M.imageById(image.id).id, image.id);
  assert.equal((await M.filesFor(file.owner))[0].id, file.id);
});

test('papelera: purga solo vencidos, fecha inyectada, y 0 conserva siempre', async () => {
  await fresh();
  const old = await M.savePage({ title: 'Vieja' });
  const recent = await M.savePage({ title: 'Reciente' });
  await M.sendToTrash('pages', old.id, '2026-08-01T00:00:00.000Z');
  await M.sendToTrash('pages', recent.id, '2026-09-20T00:00:00.000Z');
  assert.equal(await M.purgeTrash('2026-10-02T00:00:00.000Z', 0), 0);
  assert.equal(await M.purgeTrash('2026-10-02T00:00:00.000Z', 30), 1);
  assert.equal(await MC.store.get('pages', old.id), undefined);
  assert.ok(await MC.store.get('pages', recent.id));
  assert.equal(await M.emptyTrash(), 1);
  assert.equal((await M.trashItems()).length, 0);
});

test('papelera: summarize y exportaciones legibles ignoran borrados; JSON los conserva', async () => {
  await fresh();
  const d = M.emptyDay('2026-10-02'); d.notes = 'Texto reservado';
  await M.saveDay(d);
  const page = await M.savePage({ title: 'Página reservada', date: d.date });
  const activity = await M.addActivity(d.date, 'Actividad reservada');
  await M.sendToTrash('days', d.date);
  await M.sendToTrash('pages', page.id);
  await M.sendToTrash('activities', activity.id);
  const all = await M.everything();
  assert.equal(all.days.length, 1);
  assert.equal(all.days[0].deletedAt != null, true);
  assert.equal(M.summarize(all.days, all.activities, { pages: all.pages })[d.date], undefined);
  assert.equal((await M.activeEverything()).days.length, 0);
  const txt = MC.exporters.toTXT(all);
  assert.doesNotMatch(txt, /Texto reservado|Página reservada|Actividad reservada/);
  assert.equal(MC.exporters.daysTable(all).length, 1);
  assert.equal(MC.exporters.activitiesTable(all).length, 1);
  const backup = MC.backup.build(all);
  assert.equal(backup.data.days[0].deletedAt, all.days[0].deletedAt);
  assert.equal(MC.backup.validate(backup).payload.days[0].deletedAt, all.days[0].deletedAt);
});
