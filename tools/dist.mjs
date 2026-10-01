// Arma dist/MI-CUADERNO/ con solo los archivos de la app (sin skills/, tests ni herramientas) y un .zip.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'dist', 'MI-CUADERNO');
const include = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets', 'README.md', 'SPEC.md', 'DESIGN.md', 'AGENTS.md', 'DATA_MODEL.md', 'DECISIONS.md', 'ROADMAP.md', 'BACKLOG.md', 'VISION.md', 'HANDOFF.md', 'CHANGELOG.md'];

fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of include) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true, filter: (src) => !src.includes(`${path.sep}src${path.sep}`) && !src.endsWith(`${path.sep}src`) });
}
try {
  execFileSync('zip', ['-rq', 'MI-CUADERNO.zip', 'MI-CUADERNO'], { cwd: path.join(root, 'dist') });
  console.log('dist/MI-CUADERNO/ y dist/MI-CUADERNO.zip listos');
} catch {
  console.log('dist/MI-CUADERNO/ listo (no encontré “zip” para comprimir; podés comprimir la carpeta a mano)');
}
