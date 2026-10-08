'use strict';
// Esquema v4 (D26): privacidad de día y página (PV1) y `deletedAt` (DA1) opcionales; migración v3 → v4.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/** Una copia tal como la escribía la versión 3: sin `privacy`, sin `deletedAt`, sin retención de papelera. */
function v3Backup() {
  return {
    app: 'mi-cuaderno',
    kind: 'backup',
    schemaVersion: 3,
    exportedAt: '2026-10-01T22:00:00.000Z',
    data: {
      meta: {
        createdAt: '2026-09-01T10:00:00.000Z',
        settings: { name: 'Nicole', cover: 'rosa', onboarded: true, backupEveryDays: 14, motion: 'completas', motionChosen: true }
      },
      days: [
        {
          date: '2026-09-30', morning: { mood: 2, at: '2026-09-30T11:00:00.000Z' }, intention: 'ir despacio', notes: 'hoy llovió',
          energy: 2, sleep: 7.5, evening: { mood: 4, at: '2026-09-30T23:00:00.000Z' },
          reflection: { good: 'el té', hard: '', lovely: 'la lluvia', keep: 'la tarde con libros', free: '' },
          stickers: [{ id: 'stk_1', sticker: 'mariposa', x: 0.9, y: 0.1, rot: 8, scale: 1 }],
          createdAt: '2026-09-30T11:00:00.000Z', updatedAt: '2026-09-30T23:00:00.000Z'
        },
        {
          date: '2026-10-01', morning: { mood: null, at: null }, intention: '', notes: 'arranqué el cuaderno de nuevo', energy: null, sleep: null,
          evening: { mood: null, at: null }, reflection: { good: '', hard: '', lovely: '', keep: '', free: '' }, stickers: [],
          createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z'
        }
      ],
      activities: [
        { id: 'act_1', date: '2026-09-30', title: 'caminar', status: 'done', routineId: 'rut_1', order: 0, movedFrom: null, createdAt: '2026-09-30T12:00:00.000Z', updatedAt: '2026-09-30T12:00:00.000Z' },
        { id: 'act_2', date: '2026-10-01', title: 'llamar a la abuela', status: 'pending', routineId: null, order: 5, movedFrom: '2026-09-30', createdAt: '2026-09-30T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z' }
      ],
      routines: [
        { id: 'rut_1', title: 'Caminar', rule: { type: 'weekdays', days: [1, 3, 5] }, startDate: '2026-09-01', endDate: null, moment: 'manana', archived: false, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' }
      ],
      pages: [
        { id: 'pag_1', title: 'Lugares que amo', template: 'places', kind: 'list', paper: 'punteado', body: '', items: [{ id: 'itm_1', text: 'la plaza' }], pinned: true, date: '2026-09-30', stickers: [], createdAt: '2026-09-30T12:00:00.000Z', updatedAt: '2026-09-30T12:00:00.000Z' },
        { id: 'pag_2', title: 'Carta para mi yo futuro', template: 'letter', kind: 'text', paper: 'rayado', body: 'Querida persona del futuro:', items: [], pinned: false, date: '2026-10-01', stickers: [], createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z' }
      ],
      images: [{ id: 'img_1', kind: 'upload', name: 'flor', src: PNG, w: 1, h: 1, drawing: null, createdAt: '2026-09-30T12:00:00.000Z', updatedAt: '2026-09-30T12:00:00.000Z' }],
      files: [{ id: 'fil_1', owner: 'day:2026-09-30', name: 'a.txt', type: 'text/plain', size: 4, data: 'data:text/plain;base64,aG9sYQ==', createdAt: '2026-09-30T12:00:00.000Z' }]
    }
  };
}

test('esquema: v10 conserva el contrato v6 y las migraciones anteriores', () => {
  assert.equal(MC.backup.SCHEMA_VERSION, 10);
  [4, 5, 6, 7, 8, 9, 10].forEach((n) => assert.equal(typeof MC.backup.MIGRATIONS[n], 'function', 'migración ' + n));
});

test('migración v3 → … → v6: una copia v3 real abre igual y sale con la versión actual', async () => {
  await fresh();
  const original = v3Backup();
  const v = MC.backup.validate(JSON.stringify(original));
  assert.equal(v.ok, true, v.error);
  assert.deepEqual(
    [v.summary.days, v.summary.activities, v.summary.routines, v.summary.pages, v.summary.images, v.summary.files],
    [2, 2, 1, 2, 1, 1]);
  assert.equal(v.summary.name, 'Nicole');
  await MC.backup.restore(v.payload);

  const all = await M.everything();
  const src = original.data;
  // El contenido no cambia: solo se suman los campos opcionales, vacíos.
  const day = all.days.find((d) => d.date === '2026-09-30');
  assert.equal(day.notes, 'hoy llovió');
  assert.equal(day.reflection.keep, 'la tarde con libros');
  // v6: los ánimos 1–5 llegan como sus palabras (los nombres de fábrica: la copia no traía otros).
  assert.deepEqual([day.morning.feelings, day.evening.feelings, day.energy, day.sleep], [['bajito'], ['bien'], 2, 7.5]);
  assert.equal('mood' in day.morning, false);
  assert.deepEqual(day.stickers, src.days[0].stickers);
  assert.equal(day.createdAt, src.days[0].createdAt);
  assert.equal(day.updatedAt, src.days[0].updatedAt);
  assert.equal(day.privacy, null);
  assert.equal(day.deletedAt, null);
  for (const a of src.activities) {
    const back = all.activities.find((x) => x.id === a.id);
    assert.deepEqual(
      [back.date, back.title, back.status, back.routineId, back.order, back.movedFrom, back.createdAt, back.updatedAt, back.deletedAt],
      [a.date, a.title, a.status, a.routineId, a.order, a.movedFrom, a.createdAt, a.updatedAt, null]);
  }
  assert.deepEqual(all.routines[0].rule, src.routines[0].rule);
  assert.equal(all.routines[0].deletedAt, null);
  const list = all.pages.find((p) => p.id === 'pag_1');
  // v6: las páginas de texto o lista llegan como un bloque, con el mismo contenido.
  assert.deepEqual([list.title, list.pinned, list.date, list.blocks[0].type, list.values.blk_items[0].text, list.privacy, list.deletedAt], ['Lugares que amo', true, '2026-09-30', 'list', 'la plaza', null, null]);
  assert.equal(M.sheetText(all.pages.find((p) => p.id === 'pag_2')), 'Querida persona del futuro:');
  assert.ok(!('kind' in list) && !('items' in list) && !('body' in list));
  assert.deepEqual([all.images[0].name, all.images[0].deletedAt], ['flor', null]);
  assert.deepEqual([all.files[0].name, all.files[0].deletedAt], ['a.txt', null]);
  // Los ajustes ganan la retención de la papelera y conservan lo elegido.
  assert.equal(M.settings().trashRetentionDays, 30);
  assert.equal(M.settings().cover, 'rosa');
  assert.equal(await M.getMeta('schemaVersion'), MC.backup.SCHEMA_VERSION);

  const out = MC.backup.build(all);
  assert.equal(out.schemaVersion, MC.backup.SCHEMA_VERSION);
  assert.equal(out.data.meta.settings.trashRetentionDays, 30);
  assert.equal(out.data.days.length, 2);
  assert.equal(out.data.pages.length, 2);
});

test('migración v3 → v4 no reescribe registros ni pisa una retención elegida', () => {
  const data = v3Backup().data;
  const before = JSON.stringify([data.days, data.activities, data.routines, data.pages, data.images, data.files]);
  MC.backup.MIGRATIONS[4](data);
  assert.equal(JSON.stringify([data.days, data.activities, data.routines, data.pages, data.images, data.files]), before);
  assert.equal(data.meta.settings.trashRetentionDays, 30);
  const chosen = { meta: { settings: { trashRetentionDays: 7 } } };
  assert.equal(MC.backup.MIGRATIONS[4](chosen).meta.settings.trashRetentionDays, 7);
  // Sin meta (copias muy viejas o incompletas): no rompe.
  assert.deepEqual(MC.backup.MIGRATIONS[4]({ days: [] }), { days: [] });
});

test('copias v1 y v2 siguen abriendo en cadena hasta la versión actual', () => {
  for (const schemaVersion of [1, 2]) {
    const v = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion, data: {
      days: [{ date: '2026-03-01', notes: 'hola' }],
      pages: [{ id: 'pag_1', title: 'Ideas', createdAt: '2026-03-02T12:00:00.000Z' }]
    } });
    assert.equal(v.ok, true, v.error);
    assert.equal(v.payload.days[0].privacy, null);
    assert.equal(v.payload.pages[0].date, '2026-03-02');
    assert.equal(v.payload.meta.find((m) => m.key === 'schemaVersion').value, MC.backup.SCHEMA_VERSION);
  }
});

test('una copia de una versión más nueva se rechaza con el mensaje amable', () => {
  const v = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: MC.backup.SCHEMA_VERSION + 1, data: {} });
  assert.equal(v.ok, false);
  assert.match(v.error, /versión más nueva del cuaderno/);
});

test('sanitize: privacy válida se conserva, lo inválido se descarta', () => {
  assert.deepEqual(M.sanitizePrivacy({ noMemory: true }), { noMemory: true, noInsights: false, noReviews: false });
  assert.deepEqual(M.sanitizePrivacy({ noInsights: true, noReviews: true, otra: true }), { noMemory: false, noInsights: true, noReviews: true });
  // Solo `true` cuenta; si no queda ninguna prendida, es como si no estuviera.
  assert.equal(M.sanitizePrivacy({ noMemory: 'true', noInsights: 1, noReviews: null }), null);
  assert.equal(M.sanitizePrivacy({ noMemory: false, noInsights: false, noReviews: false }), null);
  for (const bad of [undefined, null, 'privado', 1, true, [true, true, true]]) assert.equal(M.sanitizePrivacy(bad), null, String(bad));

  const day = M.normalizeDay({ date: '2026-10-02', notes: 'algo difícil', privacy: { noInsights: true, x: 1 } }, '2026-10-02');
  assert.deepEqual(day.privacy, { noMemory: false, noInsights: true, noReviews: false });
  const page = M.normalizePage({ title: 'Para mí', privacy: { noMemory: true, noReviews: true } });
  assert.deepEqual(page.privacy, { noMemory: true, noInsights: false, noReviews: true });
  assert.equal(M.normalizePage({ title: 'x', privacy: 'sí' }).privacy, null);
  assert.equal(M.isPrivate(day, 'noInsights'), true);
  assert.equal(M.isPrivate(day, 'noMemory'), false);
  assert.equal(M.isPrivate(M.emptyDay('2026-10-02'), 'noInsights'), false);
});

test('sanitize: deletedAt válido se conserva en todas las entidades, lo inválido queda null', () => {
  const at = '2026-10-02T10:00:00.000Z';
  assert.equal(M.sanitizeDeletedAt(at), at);
  assert.equal(M.sanitizeDeletedAt('2026-10-02T10:00:00-03:00'), '2026-10-02T10:00:00-03:00');
  for (const bad of [undefined, null, '', 'ayer', '2026-10-02', '2026-13-40T99:00:00Z', 12345, {}]) assert.equal(M.sanitizeDeletedAt(bad), null, String(bad));

  assert.equal(M.normalizeDay({ date: '2026-10-02', notes: 'x', deletedAt: at }, '2026-10-02').deletedAt, at);
  assert.equal(M.normalizeActivity({ date: '2026-10-02', title: 'x', deletedAt: at }).deletedAt, at);
  assert.equal(M.normalizeRoutine({ title: 'x', rule: { type: 'daily' }, deletedAt: at }).deletedAt, at);
  assert.equal(M.normalizePage({ title: 'x', deletedAt: at }).deletedAt, at);
  assert.equal(M.normalizeImage({ src: PNG, deletedAt: at }).deletedAt, at);
  assert.equal(M.normalizeFile({ owner: 'page:pag_1', data: 'data:text/plain;base64,aG9sYQ==', deletedAt: at }).deletedAt, at);
  assert.equal(M.normalizePage({ title: 'x', deletedAt: 'mañana' }).deletedAt, null);
  assert.equal(M.isDeleted({ deletedAt: at }), true);
  assert.equal(M.isDeleted({ deletedAt: null }), false);
});

test('sanitize: un registro sin privacy ni deletedAt no falla ni cambia el original', () => {
  const raw = { date: '2026-10-02', notes: 'hola' };
  const copy = JSON.parse(JSON.stringify(raw));
  const d = M.normalizeDay(raw, raw.date);
  assert.deepEqual(raw, copy);
  assert.equal(d.privacy, null);
  assert.equal(d.deletedAt, null);
});

test('privacidad sola no hace que un día vacío se guarde (un día vacío no se interpreta)', async () => {
  await fresh();
  const d = M.emptyDay('2026-10-02');
  d.privacy = { noMemory: true, noInsights: true, noReviews: true };
  assert.equal(M.isEmptyDay(d), true);
  await M.saveDay(d);
  assert.equal(await MC.store.get('days', '2026-10-02'), undefined);
  // Con algo escrito, la privacidad viaja con el día.
  d.notes = 'algo difícil';
  await M.saveDay(d);
  assert.deepEqual((await M.getDay('2026-10-02')).privacy, { noMemory: true, noInsights: true, noReviews: true });
});

test('backup v4: privacy y deletedAt van y vuelven tal cual', async () => {
  await fresh();
  await M.saveSettings({ name: 'Nicole', onboarded: true, trashRetentionDays: 60 });
  const day = M.emptyDay('2026-10-02');
  day.notes = 'algo difícil';
  day.privacy = { noMemory: true, noInsights: true, noReviews: false };
  await M.saveDay(day);
  await M.savePage({ title: 'Para mí', privacy: { noReviews: true } });
  await M.savePage({ title: 'En la papelera', deletedAt: '2026-10-01T09:00:00.000Z' });
  const before = await M.everything();
  const json = JSON.stringify(MC.backup.build(before));
  await MC.backup.wipe();
  const v = MC.backup.validate(json);
  assert.equal(v.ok, true, v.error);
  await MC.backup.restore(v.payload);
  const after = await M.everything();
  assert.deepEqual(after.days, before.days);
  assert.deepEqual(after.pages.slice().sort((a, b) => a.title.localeCompare(b.title)), before.pages.slice().sort((a, b) => a.title.localeCompare(b.title)));
  assert.deepEqual(after.days[0].privacy, { noMemory: true, noInsights: true, noReviews: false });
  assert.equal(after.pages.find((p) => p.title === 'En la papelera').deletedAt, '2026-10-01T09:00:00.000Z');
  assert.equal(M.settings().trashRetentionDays, 60);
});

test('ajustes: la retención de la papelera solo acepta los plazos conocidos', () => {
  assert.equal(M.defaultSettings().trashRetentionDays, 30);
  assert.equal(M.mergeSettings({ trashRetentionDays: 0 }).trashRetentionDays, 0);
  assert.equal(M.mergeSettings({ trashRetentionDays: 15 }).trashRetentionDays, 15);
  assert.equal(M.mergeSettings({ trashRetentionDays: 3 }).trashRetentionDays, 30);
  assert.equal(M.mergeSettings({ trashRetentionDays: '60' }).trashRetentionDays, 30);
});

/* ---------- “Lo que fui notando” respeta noInsights ---------- */

function sample() {
  const settings = M.mergeSettings({ name: 'Nicole' });
  const days = [];
  const activities = [];
  const routines = [{ id: 'r1', title: 'Caminar', rule: { type: 'daily' }, startDate: '2026-09-01', endDate: null, moment: null, archived: false }];
  for (let i = 1; i <= 20; i++) {
    const date = '2026-09-' + String(i).padStart(2, '0');
    const d = M.emptyDay(date);
    d.morning.mood = (i % 5) + 1;
    d.evening.mood = i % 3 === 0 ? 2 : 4;
    d.notes = 'nota ' + i;
    days.push(d);
    activities.push(M.normalizeActivity({ id: 'a' + i, date, title: 'Caminar', routineId: 'r1', status: 'done', order: 0 }));
  }
  return { meta: { createdAt: '2026-09-01T10:00:00.000Z', settings }, days, activities, routines, pages: [] };
}

function mentioned(list) {
  const out = new Set();
  for (const i of list) {
    if (i.day) out.add(i.day);
    for (const k of i.days || []) out.add(k);
  }
  return out;
}

test('insights: un día con noInsights no entra en ninguna cuenta ni en ningún camino', () => {
  const plain = MC.insights.compute(sample(), '2026-09-20');
  const byPlain = Object.fromEntries(plain.map((i) => [i.id, i]));
  assert.ok(mentioned(plain).has('2026-09-16'));

  const s = sample();
  const hidden = ['2026-09-16', '2026-09-18'];
  s.days.forEach((d) => { if (hidden.includes(d.date)) d.privacy = { noMemory: false, noInsights: true, noReviews: false }; });
  const list = MC.insights.compute(s, '2026-09-20');
  const by = Object.fromEntries(list.map((i) => [i.id, i]));
  for (const k of hidden) assert.equal(mentioned(list).has(k), false, k + ' no aparece');
  // La semana del 14 al 20 tiene 7 días escritos; sin los dos privados quedan 5.
  assert.match(byPlain['week-writing'].text, /7 veces/);
  assert.match(by['week-writing'].text, /5 veces/);
  // Sus actividades tampoco cuentan: la rutina pasa de 20 a 18 días.
  assert.match(byPlain['routine-month'].text, /20 días/);
  assert.match(by['routine-month'].text, /18 días/);
  // Y la comparación de cómo empieza y termina el día mira dos días menos.
  assert.match(byPlain['start-end'].text, / de 20 veces/);
  assert.match(by['start-end'].text, / de 18 veces/);
});

test('insights: noMemory y noReviews no sacan un día de las observaciones; lo que está en la papelera, sí', () => {
  const s = sample();
  s.days[15].privacy = { noMemory: true, noInsights: false, noReviews: true };
  assert.ok(mentioned(MC.insights.compute(s, '2026-09-20')).has('2026-09-16'));
  s.days[15].deletedAt = '2026-09-21T10:00:00.000Z';
  s.activities[15].deletedAt = '2026-09-21T10:00:00.000Z';
  const by = Object.fromEntries(MC.insights.compute(s, '2026-09-20').map((i) => [i.id, i]));
  assert.equal(mentioned(Object.values(by)).has('2026-09-16'), false);
  assert.match(by['routine-month'].text, /19 días/);
});

test('insights: no cambia el objeto que recibe', () => {
  const s = sample();
  s.days[0].privacy = { noMemory: false, noInsights: true, noReviews: false };
  MC.insights.compute(s, '2026-09-20');
  assert.equal(s.days.length, 20);
  assert.equal(s.activities.length, 20);
});

test('insights: las actividades de un día en papelera tampoco cuentan', () => {
  const s = sample();
  s.days[15].deletedAt = '2026-09-21T10:00:00.000Z';
  const list = MC.insights.compute(s, '2026-09-20');
  assert.equal(mentioned(list).has('2026-09-16'), false);
  assert.match(list.find((i) => i.id === 'routine-month').text, /19 días/);
});
