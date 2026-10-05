'use strict';
// El service worker nunca guarda ni sirve el HTML del cuaderno si llegó redirigido (en la nube, sin sesión,
// `/` lleva a /entrar): una respuesta redirigida rompe la navegación y el cuaderno no abría desde `/`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(fetchImpl) {
  const store = new Map();
  const cache = {
    addAll: (list) => { list.forEach((f) => store.set(f, { ok: true, redirected: false, type: 'basic', name: f })); return Promise.resolve(); },
    put: (k, v) => { store.set(k, v); return Promise.resolve(); }
  };
  const listeners = {};
  const self = {
    location: { origin: 'https://nube.example' },
    registration: { scope: 'https://nube.example/' },
    addEventListener: (t, fn) => { listeners[t] = fn; },
    clients: { claim: () => Promise.resolve() }
  };
  const caches = {
    open: () => Promise.resolve(cache),
    match: (k) => Promise.resolve(store.get(k)),
    keys: () => Promise.resolve([])
  };
  const ctx = { self, caches, fetch: fetchImpl, URL, Promise, Response: { error: () => ({ error: true }) }, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../sw.js'), 'utf8'), ctx);
  return { store, listeners };
}

function fire(fn, event) {
  let p = null;
  fn(Object.assign({ waitUntil: (x) => { p = x; }, respondWith: (x) => { p = x; } }, event));
  return p;
}

test('sw: sin sesión (HTML redirigido) no guarda el cuaderno; al navegar a / va a la red', async () => {
  const redirected = { ok: false, redirected: false, type: 'opaqueredirect' };
  const net = { ok: true, redirected: true, type: 'basic', clone() { return this; } };
  const { store, listeners } = load((req) => Promise.resolve(typeof req === 'string' ? redirected : net));
  await fire(listeners.install, {});
  assert.equal(store.get('index.html'), undefined);
  assert.equal(store.get('./'), undefined);
  assert.ok(store.get('js/app.js'), 'el resto del shell sí');
  const res = await fire(listeners.fetch, { request: { method: 'GET', mode: 'navigate', url: 'https://nube.example/' } });
  assert.equal(res, net, 'la red decide (lleva a /entrar)');
  assert.equal(store.get('index.html'), undefined, 'lo redirigido no queda guardado');
});

test('sw: con el cuaderno tal cual, se guarda y se sirve sin conexión', async () => {
  const page = { ok: true, redirected: false, type: 'basic', clone() { return this; } };
  const { store, listeners } = load(() => Promise.resolve(page));
  await fire(listeners.install, {});
  assert.equal(store.get('index.html'), page);
  const res = await fire(listeners.fetch, { request: { method: 'GET', mode: 'navigate', url: 'https://nube.example/' } });
  assert.equal(res, page);
});
