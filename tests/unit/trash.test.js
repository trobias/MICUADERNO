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

test('papelera: editar un día conserva su texto y privacidad en guardados sucesivos', async () => {
  await fresh();
  const date = '2026-10-02';
  const original = M.emptyDay(date);
  original.notes = 'Lo que ya había escrito';
  original.reflection.keep = 'Una memoria';
  original.privacy = { noMemory: true, noInsights: true, noReviews: true };
  await M.saveDay(original);
  await M.sendToTrash('days', date);
  await M.saveDay(M.emptyDay(date));
  assert.ok((await MC.store.get('days', date)).deletedAt);
  assert.equal((await M.getDay(date)).notes, '', 'las lecturas normales excluyen la papelera');
  const opened = await M.getDay(date, { includeDeleted: true });
  assert.equal(opened.notes, original.notes);
  assert.ok(opened.deletedAt);
  opened.intention = 'Una intención nueva';
  const restored = await M.saveDay(opened);
  assert.equal(restored.deletedAt, null);
  restored.intention = 'Otra intención';
  await M.saveDay(restored);
  const saved = await M.getDay(date);
  assert.equal(saved.notes, original.notes);
  assert.equal(saved.reflection.keep, original.reflection.keep);
  assert.deepEqual(saved.privacy, original.privacy);
  assert.equal(saved.intention, 'Otra intención');
});

test('papelera: un borrador anterior al borrado no sobrescribe el día recuperable', async () => {
  await fresh();
  const date = '2026-10-02';
  const draft = M.emptyDay(date); draft.notes = 'Contenido anterior';
  await M.saveDay(draft);
  await M.sendToTrash('days', date);
  draft.notes = 'Borrador desactualizado';
  await assert.rejects(M.saveDay(draft), /papelera/);
  const kept = await MC.store.get('days', date);
  assert.equal(kept.notes, 'Contenido anterior');
  assert.ok(kept.deletedAt);
});

test('papelera: los adjuntos de una página vuelven con ella y se van solo cuando la página se borra del todo', async () => {
  await fresh();
  const data = 'data:text/plain;base64,aG9sYQ==';
  const make = async (title) => {
    const p = await M.savePage({ title });
    const f = await M.addFile({ owner: 'page:' + p.id, name: 'entrada.txt', data });
    return { p, f };
  };
  const kept = await make('Vuelve');
  await M.deletePage(kept.p.id);
  await M.restoreTrash('pages', kept.p.id);
  assert.equal((await M.filesFor('page:' + kept.p.id))[0].id, kept.f.id);

  const one = await make('Una');
  const due = await make('Vencida');
  const all = await make('Todas');
  await M.deletePage(one.p.id);
  await M.sendToTrash('pages', due.p.id, '2026-08-01T00:00:00.000Z');
  assert.equal(await M.deleteForever('pages', one.p.id), true);
  assert.equal(await MC.store.get('files', one.f.id), undefined);
  assert.equal(await M.purgeTrash('2026-10-02T00:00:00.000Z', 30), 1);
  assert.equal(await MC.store.get('files', due.f.id), undefined);
  await M.deletePage(all.p.id);
  await M.emptyTrash();
  assert.equal(await MC.store.get('files', all.f.id), undefined);
  assert.ok(await MC.store.get('files', kept.f.id));
});

test('retención: cuenta solo lo que vencería con un plazo más corto (Ajustes avisa antes de acortarlo)', () => {
  const at = '2026-10-02T00:00:00.000Z';
  const items = [
    { row: { deletedAt: '2026-09-01T00:00:00.000Z' } },
    { row: { deletedAt: '2026-09-30T00:00:00.000Z' } }
  ];
  assert.equal(MC.model.countDueTrash(items, 7, at), 1);
  assert.equal(MC.model.countDueTrash(items, 0, at), 0);
});
