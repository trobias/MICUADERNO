'use strict';
// Nombre de ejemplo en todo el repo (tests, docs, capturas): siempre Nicole. Pedido de la dueña del proyecto.
// El nombre que no va se arma con códigos para que tampoco aparezca escrito acá.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./_load');

const NOT_THIS = new RegExp('\\b' + String.fromCharCode(83, 111, 102, 105) + '\\b', 'i');
const TEXT = /\.(js|mjs|cjs|md|json|html|css|webmanifest|txt|csv|svg|xml|xsd|py|sh|ya?ml)$/i;
const SKIP = new Set(['.git', 'node_modules', 'dist', '.next', 'public', '.vercel']); // public/ y .next/ son copias generadas

function walk(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (TEXT.test(f.name)) out.push(p);
  }
  return out;
}

test('el nombre de ejemplo es Nicole en todo el repo', () => {
  const hits = walk(ROOT, []).filter((p) => NOT_THIS.test(fs.readFileSync(p, 'utf8')));
  assert.deepEqual(hits.map((p) => path.relative(ROOT, p)), []);
  assert.match(fs.readFileSync(path.join(ROOT, 'tests/e2e/run.mjs'), 'utf8'), /onboard\(page, name = 'Nicole'(?:,|\))/);
});
