'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const D = MC.dates;

test('addDays cruza meses, años y bisiestos', () => {
  assert.equal(D.addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(D.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(D.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(D.addDays('2027-02-28', 1), '2027-03-01');
  assert.equal(D.addDays('2026-03-01', -1), '2026-02-28');
});

test('weekday y startOfWeek (lunes)', () => {
  assert.equal(D.weekday('2026-09-30'), 3); // miércoles
  assert.equal(D.startOfWeek('2026-09-30'), '2026-09-28');
  assert.equal(D.startOfWeek('2026-10-04'), '2026-09-28'); // domingo
  assert.equal(D.startOfWeek('2026-09-28'), '2026-09-28');
});

test('isValid rechaza fechas imposibles', () => {
  assert.equal(D.isValid('2026-02-29'), false);
  assert.equal(D.isValid('2028-02-29'), true);
  assert.equal(D.isValid('2026-13-01'), false);
  assert.equal(D.isValid('2026-9-1'), false);
  assert.equal(D.isValid(null), false);
});

test('monthGrid arranca en lunes y cubre semanas completas', () => {
  const g = D.monthGrid('2026-09');
  assert.equal(g.length % 7, 0);
  assert.equal(D.weekday(g[0]), 1);
  assert.ok(g.includes('2026-09-01') && g.includes('2026-09-30'));
});

test('addMonths y etiquetas', () => {
  assert.equal(D.addMonths('2026-12', 1), '2027-01');
  assert.equal(D.addMonths('2026-01', -1), '2025-12');
  assert.equal(D.longLabel('2026-09-30'), 'miércoles 30 de septiembre');
  assert.equal(D.monthLabel('2026-02'), 'febrero 2026');
  assert.equal(D.relativeLabel('2026-09-29', '2026-09-30'), 'ayer');
});

test('fromISO: fecha local de un instante guardado', () => {
  assert.equal(D.fromISO(new Date(2026, 9, 2, 23, 30).toISOString()), '2026-10-02');
  assert.equal(D.fromISO(new Date(2026, 0, 1, 0, 5).toISOString()), '2026-01-01');
  assert.equal(D.fromISO(null), null);
  assert.equal(D.fromISO(''), null);
  assert.equal(D.fromISO('no es fecha'), null);
});
