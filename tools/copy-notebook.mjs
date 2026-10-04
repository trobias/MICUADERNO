// Copia el cuaderno (el mismo que abre en file://) a public/ para que Next lo sirva en la nube (D37).
// Con Supabase configurado, agrega <meta name="mc-cloud"> al index.html copiado: así js/cloud.js sabe que hay cuentas. public/ es generado.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');
const items = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of items) {
  fs.cpSync(path.join(root, item), path.join(out, item), {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes('src') // fuentes originales de íconos/fuentes: no se publican
  });
}
const index = path.join(out, 'index.html');
const html = fs.readFileSync(index, 'utf8');
if (!html.includes('<meta name="viewport"')) throw new Error('index.html inesperado');
// Sin Supabase configurado (desarrollo sin nube), el cuaderno se sirve como siempre, sin cuentas.
const cloud = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
if (cloud) fs.writeFileSync(index, html.replace('<meta name="viewport"', '<meta name="mc-cloud" content="1">\n  <meta name="viewport"'));
console.log('cuaderno copiado a public/' + (cloud ? ' (con cuentas)' : ' (sin cuentas: falta NEXT_PUBLIC_SUPABASE_URL)'));
