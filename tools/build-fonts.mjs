// Genera css/fonts.css con las fuentes embebidas como data URI.
// Motivo: Chrome y Firefox bloquean @font-face desde archivos locales en file:// (CORS con origen "null").
// Uso: node tools/build-fonts.mjs  (volver a correr si cambian los .woff2 de assets/fonts)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const faces = [
  ['Young Serif', 'young-serif.woff2', '400', 'normal'],
  ['Castoro', 'castoro.woff2', '400', 'normal'],
  ['Castoro', 'castoro-italic.woff2', '400', 'italic'],
  ['Atkinson Hyperlegible Next', 'atkinson-hyperlegible-next.woff2', '200 800', 'normal'],
  ['Nanum Pen Script', 'nanum-pen-script.woff2', '400', 'normal']
];
let css = '/* Generado por tools/build-fonts.mjs — no editar a mano. Fuentes OFL-1.1 (ver assets/fonts/LICENSES.md).\n   Embebidas para que funcionen al abrir index.html con doble clic (file://). */\n';
for (const [family, file, weight, style] of faces) {
  const b64 = fs.readFileSync(path.join(root, 'assets', 'fonts', file)).toString('base64');
  css += `@font-face { font-family: '${family}'; src: url(data:font/woff2;base64,${b64}) format('woff2'); font-weight: ${weight}; font-style: ${style}; font-display: swap; }\n`;
}
fs.writeFileSync(path.join(root, 'css', 'fonts.css'), css);
console.log('css/fonts.css', (css.length / 1024).toFixed(0) + ' KB');
