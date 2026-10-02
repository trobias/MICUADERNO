// Puerta de calidad: sintaxis de todos los JS + unit + e2e.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p);
  }
})(path.join(root, 'js'));
files.push(path.join(root, 'sw.js'));
for (const f of files) execFileSync(process.execPath, ['--check', f], { stdio: 'inherit' });
console.log(`sintaxis ok (${files.length} archivos)`);
const run = (args) => execFileSync(process.execPath, args, { stdio: 'inherit', cwd: root });
run(['--test', ...fs.readdirSync(path.join(root, 'tests/unit')).filter((f) => f.endsWith('.test.js')).map((f) => path.join('tests/unit', f))]);
run([path.join('tests', 'e2e', 'run.mjs')]);
