'use strict';
// A9 (D30): motor de temas. Todo preset y cualquier combinación quedan legibles (AA); de fábrica no hay tema.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const T = MC.theme;
const M = MC.model;

test('contraste: utilidades WCAG', () => {
  assert.equal(Math.round(T.contrast('#000000', '#FFFFFF')), 21); // color-ok: test
  assert.equal(T.contrast('#777777', '#777777'), 1); // color-ok: test
  assert.ok(T.contrast(T.ensure('#BBBBBB', '#FFFFFF', 4.5), '#FFFFFF') >= 4.5); // color-ok: test
});

test('cada preset: tinta ≥ 7:1, tinta suave y tinta sobre la tela ≥ 4.5:1', () => {
  assert.ok(T.PRESETS.length >= 8);
  assert.ok(T.byId('cosmos'), 'el preset pedido por la dueña');
  assert.deepEqual(T.byId('cosmos').accents.concat(T.byId('cosmos').cloth2).map((x) => x.toUpperCase()).sort(),
    ['#D1D171', '#D6E6E5', '#F2CFD7', '#F2CFD7', '#FEE088'].sort()); // color-ok: test
  T.PRESETS.forEach((p) => {
    const r = T.report(T.fromPreset(p.id));
    assert.ok(r.ink >= 7, p.id + ' tinta ' + r.ink);
    assert.ok(r.inkSoft >= 4.5, p.id + ' tinta suave ' + r.inkSoft);
    assert.ok(r.clothInk >= 4.5, p.id + ' sobre la tela ' + r.clothInk);
  });
});

test('una combinación ilegible se corrige y se avisa con palabras', () => {
  const t = { cloth: '#FFFF00', paper: '#FFFFFF', ink: '#EEEEEE', accents: [] }; // color-ok: test
  const d = T.derive(t);
  assert.ok(T.contrast(d.vars['--ink'], d.vars['--paper']) >= 7);
  assert.equal(d.fixes.length, 1);
  assert.match(d.fixes[0], /tinta/);
  // Faltan acentos: se completan; no hay degradado ni brillo si no se pidieron.
  assert.ok(d.vars['--rose'] && d.vars['--sage']);
  assert.equal(d.vars['--cloth-image'], 'none');
  assert.equal(d.vars['--cloth-sheen'], 'none');
});

test('degradado y acabado solo si se eligen; hojas oscuras aclaran los hilos de estado', () => {
  const d = T.derive(T.fromPreset('neon'));
  assert.match(d.vars['--cloth-image'], /^linear-gradient\(160deg/);
  assert.notEqual(d.vars['--cloth-sheen'], 'none');
  const n = T.derive(T.fromPreset('noche'));
  assert.equal(n.dark, true);
  assert.ok(T.contrast(n.vars['--thread-done-text'], n.vars['--paper']) >= 4.5);
  // Lo que no sigue al tema nunca aparece: stickers, impresión, hilos de emociones.
  Object.keys(n.vars).forEach((k) => assert.ok(!/^--(st-|print-|emotion-|elastic|wood|hoop)/.test(k), k));
});

test('settings.theme: null de fábrica; un preset va y vuelve en la copia', async () => {
  await MC.store.init({ memory: true });
  await M.loadSettings();
  assert.equal(M.settings().theme, null);
  assert.equal(T.derive(null), null);
  await M.saveSettings({ theme: T.fromPreset('cosmos') });
  assert.equal(M.settings().theme.preset, 'cosmos');
  assert.equal(M.settings().theme.cloth2, '#F2CFD7'); // color-ok: test
  const v = MC.backup.validate(JSON.stringify(MC.backup.build(await M.everything())));
  assert.equal(v.ok, true, v.error);
  const meta = v.payload.meta.find((r) => r.key === 'settings');
  assert.equal(meta.value.theme.preset, 'cosmos');
  await M.saveSettings({ theme: null });
  assert.equal(M.settings().theme, null);
});
