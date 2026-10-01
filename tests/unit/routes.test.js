'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, ROOT } = require('./_load');
const MC = load();
const R = MC.routes;
const ctx = { today: '2026-10-01', calMonth: '2026-08' };

test('cada ruta armada se lee como la vista que corresponde', () => {
  const cases = [
    [R.calendar(), 'base', 'calendar', { mode: 'mes', month: '2026-08' }],
    [R.month('2026-03'), 'base', 'calendar', { mode: 'mes', month: '2026-03' }],
    [R.week('2026-10-05'), 'base', 'calendar', { mode: 'semana', date: '2026-10-05' }],
    [R.today(), 'panel', 'today', { date: '2026-10-01', isToday: true }],
    [R.day('2026-09-12'), 'panel', 'today', { date: '2026-09-12' }],
    [R.agenda(), 'panel', 'agenda', {}],
    [R.routines(), 'panel', 'routines', {}],
    [R.pages(), 'panel', 'pages', {}],
    [R.page('pag_x1'), 'panel', 'page', { id: 'pag_x1' }],
    [R.year('2025'), 'panel', 'year', { year: '2025' }],
    [R.year(), 'panel', 'year', { year: '2026' }],
    [R.settings(), 'panel', 'settings', { section: null }],
    [R.print(), 'panel', 'print', {}],
    [R.welcome(), 'onboarding', 'onboarding', {}]
  ];
  for (const [hash, kind, name, params] of cases) {
    const r = R.parse(hash, ctx);
    assert.ok(r, hash);
    assert.equal(r.kind, kind, hash);
    assert.equal(r.name, name, hash);
    assert.deepEqual(r.params, params, hash);
  }
});

test('el botoncito que se ilumina: hoy sí, otro día no', () => {
  assert.equal(R.parse(R.day('2026-10-01'), ctx).opt, 'hoy');
  assert.equal(R.parse(R.day('2026-09-30'), ctx).opt, null);
  assert.equal(R.parse(R.page('a'), ctx).opt, 'paginas');
  assert.equal(R.parse(R.print(), ctx).opt, 'ajustes');
});

test('rutas raras o rotas no rompen nada', () => {
  assert.equal(R.parse('#/dia/2026-02-30', ctx), null);
  assert.equal(R.parse('#/pagina', ctx), null);
  assert.equal(R.parse('#/pagina/%E0%A4%A', ctx), null, '%XX mal formado');
  assert.equal(R.parse('#/cualquiera', ctx), null);
  assert.equal(R.parse('', ctx).name, 'calendar');
  assert.equal(R.parse('#/calendario/mes/2026-1', ctx).params.month, '2026-08', 'mes inválido vuelve al último mirado');
  assert.equal(R.parse('#/calendario', { today: '2026-10-01' }).params.month, '2026-10', 'sin mes guardado: el de hoy');
  assert.equal(R.parse('#/anio/20x6', ctx).params.year, '2026');
});

test('los ids de página con caracteres especiales van y vuelven', () => {
  const id = 'pag a/b?c';
  assert.equal(R.parse(R.page(id), ctx).params.id, id);
});

test('las direcciones escritas en sw.js (que no carga MC.routes) siguen existiendo', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const hashes = sw.match(/#\/[a-z/0-9-]*/g) || [];
  assert.ok(hashes.length > 0);
  for (const hsh of hashes) assert.ok(R.parse(hsh, ctx), hsh);
  assert.ok(hashes.every((x) => x === R.today()), 'las notificaciones abren Hoy');
});

test('rutina: abrirla en su cuadro y ver sus días en el calendario', () => {
  const r1 = R.parse(R.routine('rut_9'), ctx);
  assert.equal(r1.name, 'routines');
  assert.deepEqual(r1.params, { focus: 'rut_9' });
  assert.deepEqual(R.parse(R.routines(), ctx).params, {});
  const r2 = R.parse(R.month('2026-11', { routine: 'rut_9' }), ctx);
  assert.equal(r2.kind, 'base');
  assert.deepEqual(r2.params, { mode: 'mes', month: '2026-11', routine: 'rut_9' });
  assert.equal(R.month('2026-11', {}), R.month('2026-11'));
  assert.equal(R.parse('#/calendario/mes/2026-11/rutina', ctx).params.routine, undefined);
});
