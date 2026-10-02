'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MC = { };
const context = vm.createContext({ MC });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/core/history.js'), 'utf8'), context);

test('push, undo, redo y descarte de rama', async () => {
  let value = 0;
  const h = MC.history.create();
  const add = (n) => { value += n; h.push({ label: 'sumar', undo: () => { value -= n; }, redo: () => { value += n; } }); };
  assert.equal(h.canUndo(), false);
  add(1); add(2);
  assert.equal(h.canUndo(), true);
  await h.undo(); assert.equal(value, 1);
  assert.equal(h.canRedo(), true);
  await h.redo(); assert.equal(value, 3);
  await h.undo(); add(4);
  assert.equal(value, 5);
  assert.equal(h.canRedo(), false);
  h.clear(); assert.equal(h.canUndo(), false);
});

test('límite descarta el comando más viejo', async () => {
  const seen = [];
  const h = MC.history.create({ limit: 2 });
  [1, 2, 3].forEach((n) => h.push({ label: String(n), undo: () => seen.push(n), redo: () => {} }));
  await h.undo(); await h.undo();
  assert.deepEqual(seen, [3, 2]);
  assert.equal(h.canUndo(), false);
});

test('espera promesas, bloquea operaciones simultáneas y notifica cambios', async () => {
  const h = MC.history.create();
  const states = [];
  const off = h.onChange(() => states.push([h.canUndo(), h.canRedo()]));
  let release;
  h.push({ label: 'lento', undo: () => new Promise((r) => { release = r; }), redo: async () => {} });
  const pending = h.undo();
  await Promise.resolve();
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), false);
  release(); await pending;
  assert.equal(h.canRedo(), true);
  await h.redo();
  off(); h.clear();
  assert.deepEqual(states, [[false, false], [true, false], [false, false], [false, true], [false, false], [true, false]]);
});

test('etiquetas del paso disponible siguen el cursor', async () => {
  const h = MC.history.create();
  h.push({ label: 'Mover sticker', undo: () => {}, redo: () => {} });
  h.push({ label: 'Girar sticker', undo: () => {}, redo: () => {} });
  assert.equal(h.undoLabel(), 'Girar sticker');
  await h.undo();
  assert.equal(h.undoLabel(), 'Mover sticker');
  assert.equal(h.redoLabel(), 'Girar sticker');
  h.clear();
  assert.equal(h.undoLabel(), '');
});

test('atajo ignora superficie desmontada y diálogo por encima', async () => {
  let keydown;
  const dialogs = [];
  const document = { addEventListener: (name, fn) => { if (name === 'keydown') keydown = fn; }, querySelectorAll: () => dialogs };
  const scoped = { MC: {}, document, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../js/core/history.js'), 'utf8'), scoped);
  const surface = { isConnected: true, getClientRects: () => [1] };
  const h = scoped.MC.history.create();
  let value = 1, prevented = 0;
  h.setSurface(surface);
  h.push({ label: 'Cambio', undo: () => { value = 0; }, redo: () => { value = 1; } });
  scoped.MC.history.activate(h);
  const press = () => keydown({ ctrlKey: true, metaKey: false, altKey: false, shiftKey: false, key: 'z', target: {}, preventDefault: () => { prevented++; } });
  dialogs.push({ contains: () => false });
  press(); assert.equal(value, 1); assert.equal(prevented, 0);
  dialogs[0].contains = (el) => el === surface;
  surface.isConnected = false;
  press(); assert.equal(value, 1); assert.equal(prevented, 0);
  surface.isConnected = true;
  press(); await Promise.resolve(); await Promise.resolve();
  assert.equal(value, 0); assert.equal(prevented, 1);
});

test('limpiar durante un deshacer asincrónico vacía la pila al terminar', async () => {
  const h = MC.history.create();
  let release;
  h.push({ label: 'Antes de salir', undo: () => new Promise((resolve) => { release = resolve; }), redo: () => {} });
  const pending = h.undo();
  await Promise.resolve();
  h.clear();
  release();
  await pending;
  assert.equal(h.canUndo(), false);
  assert.equal(h.canRedo(), false);
});
