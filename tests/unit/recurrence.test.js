'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const R = MC.recurrence;
const D = MC.dates;

const r = (rule, extra = {}) => Object.assign({ id: 'r', title: 't', rule, startDate: '2026-01-01', endDate: null, archived: false }, extra);
const hits = (routine, from, to) => D.range(from, to).filter((k) => R.occursOn(routine, k));

test('daily y pausa', () => {
  assert.equal(R.occursOn(r({ type: 'daily' }), '2026-09-30'), true);
  assert.equal(R.occursOn(r({ type: 'daily' }, { archived: true }), '2026-09-30'), false);
});

test('respeta startDate y endDate (rutina temporal)', () => {
  const t = r({ type: 'daily' }, { startDate: '2026-09-10', endDate: '2026-09-12' });
  assert.deepEqual(hits(t, '2026-09-08', '2026-09-14'), ['2026-09-10', '2026-09-11', '2026-09-12']);
});

test('weekdays: lun, mié, vie', () => {
  const t = r({ type: 'weekdays', days: [1, 3, 5] });
  assert.deepEqual(hits(t, '2026-09-28', '2026-10-04'), ['2026-09-28', '2026-09-30', '2026-10-02']);
  assert.equal(R.describe(t), 'Lun · Mié · Vie');
});

test('interval: cada 3 días anclado a startDate', () => {
  const t = r({ type: 'interval', every: 3 }, { startDate: '2026-09-29' });
  assert.deepEqual(hits(t, '2026-09-27', '2026-10-06'), ['2026-09-29', '2026-10-02', '2026-10-05']);
  assert.equal(R.describe(t), 'Cada 3 días');
});

test('monthlyDay 31 cae en el último día de meses cortos', () => {
  const t = r({ type: 'monthlyDay', day: 31 });
  assert.equal(R.occursOn(t, '2026-02-28'), true);
  assert.equal(R.occursOn(t, '2028-02-29'), true);
  assert.equal(R.occursOn(t, '2028-02-28'), false);
  assert.equal(R.occursOn(t, '2026-04-30'), true);
  assert.equal(R.occursOn(t, '2026-05-31'), true);
  assert.equal(R.occursOn(t, '2026-05-30'), false);
});

test('monthlyNth: primer sábado y último domingo', () => {
  const first = r({ type: 'monthlyNth', nth: 1, weekday: 6 });
  assert.deepEqual(hits(first, '2026-10-01', '2026-10-31'), ['2026-10-03']);
  assert.equal(R.describe(first), 'Primer sábado del mes');
  const last = r({ type: 'monthlyNth', nth: -1, weekday: 0 });
  assert.deepEqual(hits(last, '2026-09-01', '2026-09-30'), ['2026-09-27']);
  assert.deepEqual(hits(last, '2026-11-01', '2026-11-30'), ['2026-11-29']);
});

test('once: una sola fecha', () => {
  const t = r({ type: 'once', date: '2026-10-12' });
  assert.deepEqual(hits(t, '2026-10-01', '2026-10-31'), ['2026-10-12']);
});

test('nextOccurrence y cambio de año', () => {
  const t = r({ type: 'monthlyDay', day: 1 });
  assert.equal(R.nextOccurrence(t, '2026-12-15'), '2027-01-01');
  assert.equal(R.nextOccurrence(r({ type: 'daily' }, { endDate: '2026-01-02' }), '2026-02-01'), null);
});

test('sanitizeRule descarta reglas inválidas', () => {
  assert.equal(R.sanitizeRule({ type: 'weekdays', days: [] }), null);
  assert.equal(R.sanitizeRule({ type: 'nope' }), null);
  assert.equal(R.sanitizeRule({ type: 'once', date: '2026-02-30' }), null);
  assert.deepEqual(R.sanitizeRule({ type: 'interval', every: '0' }), { type: 'interval', every: 1 });
  assert.deepEqual(R.sanitizeRule({ type: 'weekdays', days: [1, 1, 9, '3'] }), { type: 'weekdays', days: [1, 3] });
});

test('descripciones humanas', () => {
  assert.equal(R.describe(r({ type: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] })), 'Todos los días');
  assert.equal(R.describe(r({ type: 'weekdays', days: [1, 2, 3, 4, 5] })), 'De lunes a viernes');
  assert.equal(R.describe(r({ type: 'weekdays', days: [6] })), 'Todos los sábados');
  assert.equal(R.describe(r({ type: 'daily' }, { endDate: '2026-10-31' })), 'Todos los días · hasta el 31 oct');
});

test('meta flexible: cualquier día es elegible, la cantidad no genera días fijos', () => {
  const t = r({ type: 'weeklyTarget', count: 3 });
  assert.equal(hits(t, '2026-09-28', '2026-10-04').length, 7);
  assert.equal(R.describe(t), '3 veces por semana, en los días que elijas');
  assert.deepEqual(R.sanitizeRule({ type: 'weeklyTarget', count: '3' }), { type: 'weeklyTarget', count: 3 });
  for (const count of [0, 8, 2.5, '', null, 'tres']) assert.equal(R.sanitizeRule({ type: 'weeklyTarget', count }), null);
});
