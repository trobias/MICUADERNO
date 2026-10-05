'use strict';
// A7 (D29): hojas en bloques, plantillas de fábrica y propias, “Guardar” y hojas que se repiten.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;
const T = MC.templates;
const D = MC.dates;

async function fresh() {
  await MC.store.init({ memory: true });
  await M.loadSettings();
}

test('plantillas de fábrica: ids únicos, todas con bloques válidos; instanciar da ids nuevos', () => {
  const ids = T.FACTORY.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  T.FACTORY.forEach((t) => {
    assert.ok(t.label && t.blocks.length, t.id);
    t.blocks.forEach((b) => assert.ok(M.BLOCK_TYPES.includes(b.type), t.id + ' ' + b.type));
  });
  const a = T.instantiate('meals'), b = T.instantiate('meals');
  assert.equal(a.blocks[0].type, 'columns');
  assert.deepEqual(a.blocks[0].columns.map((c) => c.title), ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']);
  assert.notEqual(a.blocks[0].id, b.blocks[0].id);
  assert.equal(a.stickers.length, 1);
  const letter = T.instantiate('letter');
  assert.match(letter.values[letter.blocks[0].id], /^Querida persona del futuro/);
  assert.equal(T.instantiate('drawing').draw, true);
  assert.equal(T.instantiate('month').monthly, true);
  assert.equal(T.instantiate('no-existe').template, 'blank');
  // Lo instanciado pasa por el saneado sin perder nada.
  assert.deepEqual(M.sanitizeBlocks(a.blocks), a.blocks);
});

test('cloneStructure: ids nuevos, contenido mapeado a las columnas nuevas o vacío', () => {
  const blocks = [{ id: 'b1', type: 'columns', title: 'x', columns: [{ id: 'c1', title: 'A' }, { id: 'c2', title: 'B' }] }, { id: 'b2', type: 'checks', title: '' }];
  const values = { b1: { c1: 'uno', c2: 'dos' }, b2: [{ id: 'i1', text: 'algo', done: true }] };
  const full = T.cloneStructure(blocks, values, true);
  assert.notEqual(full.blocks[0].id, 'b1');
  assert.equal(full.blocks[0]._colMap, undefined);
  const [c1, c2] = full.blocks[0].columns.map((c) => c.id);
  assert.deepEqual(full.values[full.blocks[0].id], { [c1]: 'uno', [c2]: 'dos' });
  assert.equal(full.values[full.blocks[1].id][0].text, 'algo');
  assert.equal(full.values[full.blocks[1].id][0].done, true);
  assert.notEqual(full.values[full.blocks[1].id][0].id, 'i1');
  assert.deepEqual(T.cloneStructure(blocks, values, false).values, {});
});

test('sheetBlocks/sheetText/sheetCount: hojas viejas (texto o lista) y hojas en bloques', () => {
  const oldText = M.normalizePage({ id: 'p1', body: 'hola\nchau' });
  assert.equal(M.sheetBlocks(oldText).blocks[0].type, 'text');
  assert.equal(M.sheetText(oldText), 'hola\nchau');
  const oldList = M.normalizePage({ id: 'p2', kind: 'list', items: [{ id: 'a', text: 'pan' }, { id: 'b', text: ' ' }] });
  assert.equal(M.sheetText(oldList), '• pan');
  assert.equal(M.sheetCount(oldList), 1);
  const p = M.normalizePage({
    id: 'p3',
    blocks: [{ id: 'b1', type: 'text', title: '¿Qué pienso?' }, { id: 'b2', type: 'checks', title: '' }, { id: 'b3', type: 'columns', title: '', columns: [{ id: 'c1', title: 'A favor' }, { id: 'c2', title: 'En contra' }] }],
    values: { b1: 'mucho', b2: [{ id: 'i', text: 'llamar', done: true }, { id: 'j', text: 'leer', done: false }], b3: { c1: 'sí', c2: '' } }
  });
  assert.equal(M.sheetText(p), '¿Qué pienso?\nmucho\n\n☑ llamar\n☐ leer\n\nA favor: sí');
  assert.equal(M.sheetCount(p), 2);
});

test('savePage con bloques escribe kind/body/items derivados (conviven hasta v6)', async () => {
  await fresh();
  await M.savePage({ id: 'pg1', blocks: [{ id: 'b1', type: 'list', title: '' }], values: { b1: [{ id: 'x', text: 'mate' }] } });
  let p = await M.getPage('pg1');
  assert.equal(p.kind, 'list');
  assert.deepEqual(p.items, [{ id: 'x', text: 'mate' }]);
  await M.savePage({ id: 'pg2', blocks: [{ id: 'b1', type: 'text', title: 'Hoy' }, { id: 'b2', type: 'list', title: '' }], values: { b1: 'sol', b2: [{ id: 'y', text: 'pan' }] } });
  p = await M.getPage('pg2');
  assert.equal(p.kind, 'text');
  assert.equal(p.body, 'Hoy\nsol\n\n• pan');
});

test('plantillas propias: se guardan, se listan sin las congeladas y van a la papelera', async () => {
  await fresh();
  const src = M.normalizePage({ id: 'pg', title: 'Comidas', paper: 'cuadriculado', blocks: [{ id: 'b1', type: 'list', title: '' }], values: { b1: [{ id: 'x', text: 'fideos' }] } });
  const mine = await M.templateFrom(src, { withContent: false });
  assert.equal(mine.title, 'Comidas');
  assert.equal(mine.paper, 'cuadriculado');
  assert.deepEqual(mine.values, {});
  const withText = await M.templateFrom(src, { title: 'Con lo escrito' });
  assert.equal(Object.values(withText.values)[0][0].text, 'fideos');
  await M.templateFrom(src, { frozen: true });
  let list = await M.getTemplates();
  assert.deepEqual(list.map((t) => t.title), ['Comidas', 'Con lo escrito']);
  assert.equal((await M.saveTemplate({ blocks: [] })).title, 'Mi plantilla');
  await M.deleteTemplate(mine.id);
  list = await M.getTemplates();
  assert.ok(!list.some((t) => t.id === mine.id));
  assert.equal(await M.getTemplate(mine.id), null);
});

test('hojas que se repiten: virtuales de hoy en adelante, nunca como actividad, y se materializan con id fijo', async () => {
  await fresh();
  const today = D.today();
  const src = M.normalizePage({ id: 'pg', title: 'Diario de sueños', blocks: [{ id: 'b1', type: 'text', title: 'Lo que soñé' }], values: { b1: 'algo' } });
  const r = await M.repeatSheet(src, { title: 'Diario de sueños', rule: { type: 'daily' }, startDate: D.addDays(today, -3) }, false);
  assert.equal(r.kind, 'sheet');
  assert.ok(r.templateId);
  // No aparece como actividad del día.
  assert.ok(!(await M.itemsForDay(today)).some((it) => it.routineId === r.id));
  // Hoy sí aparece como hoja; en un día pasado sin escribir, no (D18).
  const on = await M.pagesOn(today);
  assert.equal(on.length, 1);
  assert.equal(on[0].id, M.sheetOccurrenceId(r.id, today));
  assert.equal(on[0].virtual, true);
  assert.equal((await M.pagesOn(D.addDays(today, -1))).length, 0);
  // El calendario la ve de hoy en adelante.
  const sum = M.summarize([], [], { from: D.addDays(today, -1), to: D.addDays(today, 1), routines: [r], pages: [] });
  assert.ok(!sum[D.addDays(today, -1)] || !sum[D.addDays(today, -1)].pages.length);
  assert.equal(sum[today].pages[0].virtual, true);
  // Abrirla arma la hoja desde la plantilla congelada (en blanco: se pidió sin contenido).
  const v = await M.getPage(on[0].id);
  assert.equal(v.virtual, true);
  assert.equal(v.date, today);
  assert.equal(v.blocks[0].title, 'Lo que soñé');
  assert.deepEqual(v.values, {});
  // Escribirla la guarda con el mismo id y deja de ser virtual.
  v.values[v.blocks[0].id] = 'volaba';
  await M.savePage(v);
  const again = await M.pagesOn(today);
  assert.equal(again.length, 1);
  assert.ok(!again[0].virtual);
  // Borrada, no vuelve a aparecer ni a armarse.
  await M.deletePage(on[0].id);
  assert.equal((await M.pagesOn(today)).length, 0);
  assert.equal(await M.getPage(on[0].id), null);
  // Un id con forma de ocurrencia pero sin repetición no inventa nada.
  assert.equal(await M.getPage('pag_nada_' + today), null);
});
