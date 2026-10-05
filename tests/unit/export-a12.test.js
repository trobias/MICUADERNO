'use strict';
// A12: la exportación de texto incluye lo nuevo (semanas, hojas en bloques, hojas que se repiten) con el vocabulario de hoy.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const M = MC.model;

test('TXT: semanas, hojas en bloques y lo que se repite', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  await M.saveWeek(Object.assign(await M.getWeek('2026-10-05'), { important: [{ id: 'i', text: 'Pagar la luz', done: true }], notes: 'Semana de Nicole.' }));
  await M.savePage({ id: 'p', title: 'Pros y contras', date: '2026-10-05', blocks: [{ id: 'b', type: 'checks', title: '' }], values: { b: [{ id: 'x', text: 'llamar', done: false }] } });
  await M.saveRoutine({ title: 'Diario', rule: { type: 'daily' }, kind: 'sheet', templateId: 'tpl_x' });
  const txt = MC.exporters.toTXT(await M.everything());
  assert.match(txt, /MIS SEMANAS/);
  assert.match(txt, /\[x\] Pagar la luz/);
  assert.match(txt, /Semana de Nicole\./);
  assert.match(txt, /MIS HOJAS[\s\S]*☐ llamar/);
  assert.match(txt, /LO QUE SE REPITE[\s\S]*\(hoja\) Diario/);
  assert.doesNotMatch(txt, /MIS RUTINAS|MIS PÁGINAS/);
});
