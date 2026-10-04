'use strict';
// Guardianes de la casa: reglas que se rompen sin que nadie lo note.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, ROOT } = require('./_load');
const MC = load();

function files(dir, ext) {
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p); else if (p.endsWith(ext)) out.push(p);
    }
  })(dir);
  return out;
}

test('ningún color en hex fuera de css/tokens.css (si no, un tema no lo alcanza)', () => {
  const css = files(path.join(ROOT, 'css'), '.css').filter((p) => !/[\\/](tokens|fonts)\.css$/.test(p));
  const hits = [];
  for (const p of css) {
    const text = fs.readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    text.split('\n').forEach((line, i) => {
      // Solo valores de propiedades: `prop: … #abc …` (un selector #id no cuenta).
      if (/:[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(line)) hits.push(path.relative(ROOT, p) + ':' + (i + 1));
    });
  }
  const js = files(path.join(ROOT, 'js'), '.js');
  for (const p of js) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (/['"(\s,=]#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/.test(line) && !/color-ok/.test(line)) hits.push(path.relative(ROOT, p) + ':' + (i + 1));
    });
  }
  assert.deepEqual(hits, []);
});

test('la copia de seguridad lleva todos los stores (salvo los internos declarados)', async () => {
  await MC.store.init({ memory: true });
  await MC.model.loadSettings();
  const built = MC.backup.build(await MC.model.everything());
  const internal = MC.store.INTERNAL_STORES || [];
  const expected = MC.store.STORE_NAMES.filter((s) => internal.indexOf(s) === -1).sort();
  assert.deepEqual(Object.keys(built.data).sort(), expected);
});
