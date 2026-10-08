'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model, I = MC.insights;
const date = '2026-10-08';
const day = (key = date) => M.emptyDay(key);
const data = (extra = {}) => ({ meta: { settings: M.defaultSettings() }, days: [day()], activities: [], pages: [], routines: [], images: [], marks: [], weeks: [], ...extra });
const mark = (sourceType, sourceId, kind, more = {}) => M.normalizeMark({ sourceType, sourceId, kind, id: M.markId(sourceType, sourceId, kind), ...more });

test('v12: elecciones por referencia conservan ID antiguo, fechas, copia y sección anio', async () => {
  await MC.store.init({ memory: true }); await M.loadSettings();
  await M.saveDay(day());
  assert.equal(M.markId('activity', 'x'.repeat(100)), 'mrk_activity_' + 'x'.repeat(72));
  const first = await M.setMemory('day', date, 'victoria', { category: 'rest', note: 'Nicole se dio tiempo' });
  await M.setMemory('day', date, 'victoria', { category: 'help', note: 'Pedí ayuda' });
  await M.setVictory('day', date, true);
  assert.equal((await M.getMarks())[0].note, 'Pedí ayuda', 'reafirmar la victoria no borra sus palabras');
  await M.setMemory('day', date, 'recuerdo', { note: 'Un día para guardar' });
  const all = await M.everything();
  assert.equal(all.marks.length, 2);
  assert.equal(all.marks.find(m => m.kind === 'victoria').createdAt, first.createdAt);
  const backup = MC.backup.build(all);
  assert.equal(backup.schemaVersion, 12);
  const validated = MC.backup.validate(JSON.stringify(backup));
  assert.equal(validated.ok, true, validated.error);
  assert.deepEqual(validated.payload.marks, all.marks);
  assert.equal(validated.payload.days.length, 1, 'conserva el día vacío elegido y su privacidad');
  assert.equal(MC.sections.split('marks', all.marks[0])[0].section, 'anio');
  const legacy = { ...backup, schemaVersion: 11 };
  assert.equal(MC.backup.validate(JSON.stringify(legacy)).ok, true);
  assert.equal(M.normalizeMark({ ...first, category: '__proto__' }).category, null);
  assert.equal(M.normalizeMark({ ...first, note: 'x'.repeat(400) }).note.length, 200);
  await assert.rejects(M.setMemory('day', date, 'otro', {}));
  const chosenDay = await M.getDay(date);
  chosenDay.privacy = { noMemory: true };
  await M.saveDay(chosenDay);
  assert.equal((await M.everything()).days.length, 1, 'vaciar el día no borra su referencia ni privacidad');
  assert.equal(I.victories(await M.everything(), '2026').length, 0);
  assert.equal(I.moments(await M.everything(), '2026').length, 0);
  assert.equal(MC.backup.validate(JSON.stringify(MC.backup.build(await M.everything()))).payload.days[0].privacy.noMemory, true);
  await M.setMemory('day', date, 'recuerdo', null);
  assert.equal((await M.getMarks()).length, 1);
});

test('recuerdos: días, hojas, frases e imágenes enlazan la fuente y respetan privacidad/papelera', () => {
  const d = day(); d.reflection.keep = 'Un momento lindo';
  const image = { id: 'foto', kind: 'upload', name: 'Foto de Nicole', src: 'data:image/png;base64,AAAA' };
  const p = M.normalizePage({ id: 'hoja', date, title: 'Algo para recordar', stickers: [{ id: 'pegada', sticker: 'img:foto', x: .5, y: .5 }] });
  const all = data({ days: [d], pages: [p], images: [image], marks: [mark('page', p.id, 'recuerdo', { note: 'Mis palabras' })] });
  const moments = I.moments(all, '2026');
  assert.equal(moments.length, 2);
  const saved = moments.find(m => m.page);
  assert.equal(saved.text, 'Mis palabras'); assert.equal(saved.image.id, 'foto');
  for (const flag of ['noMemory', 'noReviews']) {
    assert.equal(I.moments({ ...all, days: [{ ...d, privacy: { [flag]: true } }] }, '2026').length, 0);
    assert.equal(I.moments({ ...all, pages: [{ ...p, privacy: { [flag]: true } }] }, '2026').length, 1);
  }
  assert.equal(I.moments({ ...all, days: [{ ...d, deletedAt: '2026-10-08T12:00:00Z' }] }, '2026').length, 0);
  assert.equal(I.moments({ ...all, pages: [] }, '2026').length, 1, 'fuente no compartida no muestra la nota');
  assert.equal(I.moments({ ...all, images: [] }, '2026').find(m => m.page).image, null, 'sin permiso de fotos no hay miniatura');
  assert.equal(I.moments({ ...all, marks: [...all.marks, mark('day', date, 'recuerdo')] }, '2026').filter(m => m.sourceType === 'day').length, 1, 'no repite la reflexión del día');
});

test('actividades especiales: solo done/partial; primera vez se elige antes del año y de la privacidad', () => {
  const routine = { id: 'especial', title: 'Volver a dibujar' };
  const activities = ['pending', 'skipped', 'postponed', 'partial', 'done'].map((status, i) => ({ id: 'a' + i, title: routine.title, routineId: routine.id, date: '2026-10-' + String(4 + i).padStart(2, '0'), status }));
  const all = data({ activities, routines: [routine], marks: [mark('routine', routine.id, 'especial', { category: 'return' })] });
  assert.equal(I.moments(all, '2026').length, 2);
  assert.equal(I.moments(all, '2026')[1].origin, 'Un poquito también cuenta');
  const first = { ...all, marks: [mark('routine', routine.id, 'especial', { category: 'first' })] };
  assert.equal(I.moments(first, '2026').length, 1);
  assert.equal(I.moments({ ...first, days: [{ ...day('2026-10-07'), privacy: { noMemory: true } }] }, '2026').length, 0);
  assert.equal(I.moments({ ...first, activities: [{ ...activities[3], date: '2025-10-07' }, activities[4]] }, '2026').length, 0);
  assert.equal(I.moments({ ...all, routines: [] }, '2026').length, 0);
  assert.deepEqual(I.moments(all, '2026'), I.moments(all, '2026'));
});

test('creación terminada y primer dibujo: no basta con escribir una hoja; borrado/privacidad excluyen', () => {
  const img = { id: 'dibujo', kind: 'drawing', name: 'Dibujo de Nicole', createdAt: '2026-10-08T10:00:00Z', src: 'data:image/png;base64,AAAA' };
  const p = M.normalizePage({ id: 'obra', date, title: 'Mi dibujo', stickers: [{ id: 'pegada', sticker: 'img:dibujo', x: .5, y: .5 }] });
  const all = data({ pages: [p], images: [img] });
  assert.equal(I.moments({ ...all, images: [] }, '2026').length, 0);
  assert.equal(I.victories(all, '2026').filter(m => m.id === 'drawing:2026').length, 1);
  assert.equal(I.moments({ ...all, pages: [{ ...p, privacy: { noInsights: true } }] }, '2026').length, 0);
  assert.equal(I.moments({ ...all, images: [{ ...img, deletedAt: '2026-10-08T12:00:00Z' }] }, '2026').length, 0);
  const laterImg = { ...img, id: 'otro', createdAt: '2026-10-08T11:00:00Z' };
  const laterPage = { ...p, id: 'otra', stickers: [{ id: 'segundo', sticker: 'img:otro' }] };
  assert.equal(I.moments({ ...all, images: [img, laterImg], pages: [{ ...p, privacy: { noMemory: true } }, laterPage] }, '2026').length, 0, 'no llama primero al segundo dibujo si el primero queda privado');
  const finished = { ...all, marks: [mark('page', 'obra', 'terminado')] };
  assert.equal(I.moments(finished, '2026').some(m => m.origin === 'Creación terminada'), true);
  assert.equal(I.moments({ ...finished, pages: [{ ...p, privacy: { noReviews: true } }] }, '2026').length, 0);
  assert.equal(I.victories({ ...finished, marks: [mark('page', 'obra', 'victoria', { category: 'care' })] }, '2026').filter(m => m.page === 'obra').length, 1, 'misma fuente no duplica la victoria');
});

test('TXT conserva los momentos elegidos y excluye fuentes en papelera o privadas', () => {
  const d = day(); d.notes = 'Un día de Nicole';
  const all = data({ days: [d], marks: [mark('day', date, 'victoria', { category: 'help', note: 'Pedí ayuda para algo importante' }), mark('day', date, 'recuerdo', { note: 'Un recuerdo de Nicole' })] });
  const txt = MC.exporters.toTXT(all);
  assert.match(txt, /Pedí ayuda para algo importante/); assert.match(txt, /Un recuerdo de Nicole/);
  assert.doesNotMatch(MC.exporters.toTXT({ ...all, days: [{ ...d, privacy: { noMemory: true } }] }), /Pedí ayuda para algo importante|Un recuerdo de Nicole/);
  assert.doesNotMatch(MC.exporters.toTXT({ ...all, days: [{ ...d, deletedAt: '2026-10-08T12:00:00Z' }] }), /Pedí ayuda para algo importante|Un recuerdo de Nicole/);
});
