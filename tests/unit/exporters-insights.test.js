'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const MC = require('./_load').load();
const M = MC.model;

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
    d.notes = i % 2 ? 'nota ' + i : '';
    if (i % 4 === 0) d.reflection.keep = 'recuerdo ' + i;
    days.push(d);
    activities.push(M.normalizeActivity({ id: 'a' + i, date, title: 'Caminar', routineId: 'r1', status: i % 3 === 0 ? 'skipped' : 'done', order: 0 }));
  }
  return { meta: { createdAt: '2026-09-01T10:00:00.000Z', settings }, days, activities, routines, pages: [] };
}

test('csv: comillas, saltos, BOM y fórmulas neutralizadas', () => {
  assert.equal(MC.exporters.csvCell('hola, mundo'), '"hola, mundo"');
  assert.equal(MC.exporters.csvCell('dijo "sí"'), '"dijo ""sí"""');
  assert.equal(MC.exporters.csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(MC.exporters.csvCell(3), '3');
  const csv = MC.exporters.toCSV([['a', 'b'], ['línea\nnueva', '']]);
  assert.ok(csv.startsWith('﻿a,b\r\n'));
  assert.ok(csv.includes('"línea\nnueva"'));
});

test('txt: incluye días, marcas y reflexiones', () => {
  const txt = MC.exporters.toTXT(sample());
  assert.match(txt, /MI CUADERNO · Nicole/);
  assert.match(txt, /\[x\] Caminar/);
  assert.match(txt, /\[·\] Caminar/);
  assert.match(txt, /Qué quiero guardar: recuerdo 4/);
});

test('xlsx: zip válido con 6 hojas', () => {
  const bytes = MC.exporters.workbook(sample());
  assert.equal(bytes[0], 0x50); assert.equal(bytes[1], 0x4b);
  const file = path.join(os.tmpdir(), 'mc-test.xlsx');
  fs.writeFileSync(file, bytes);
  let listing;
  try {
    listing = execFileSync('python3', ['-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print("\\n".join(z.namelist()))', file]).toString();
  } catch (e) {
    if (e.code === 'ENOENT') return; // sin python: la firma alcanza
    throw e;
  }
  assert.match(listing, /xl\/worksheets\/sheet6\.xml/);
  assert.match(listing, /\[Content_Types\]\.xml/);
});

test('crc32 conocido', () => {
  assert.equal(MC.zip.crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
});

test('colName', () => {
  assert.equal(MC.exporters.colName(0), 'A');
  assert.equal(MC.exporters.colName(25), 'Z');
  assert.equal(MC.exporters.colName(26), 'AA');
});

test('insights: descriptivos, con conteos, sin porcentajes ni causalidad', () => {
  const list = MC.insights.compute(sample(), '2026-09-20');
  assert.ok(list.length >= 3 && list.length <= 6);
  const text = list.map((i) => i.text).join(' ');
  assert.doesNotMatch(text, /%|mejora|causa|salud/i);
  assert.match(text, /Hace 19 días que empezaste este cuaderno/);
  assert.match(text, /de \d+ veces/);
});

test('insights: pocos datos → solo lo que corresponde', () => {
  const s = sample();
  s.days = s.days.slice(0, 2); s.activities = [];
  const list = MC.insights.compute(s, '2026-09-02');
  assert.ok(list.every((i) => ['since', 'week-writing'].includes(i.id)));
});
