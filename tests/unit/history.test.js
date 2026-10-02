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
