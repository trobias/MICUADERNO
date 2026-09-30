// Genera los PNG/ICO de la app a partir de los SVG maestros de assets/icons/src.
// Uso: npm run icons   (requiere playwright-core y Chromium; solo para desarrollo)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = (f) => fs.readFileSync(path.join(root, 'assets/icons/src', f), 'utf8');
const out = (f) => path.join(root, 'assets/icons', f);

const jobs = [
  ['icon.svg', 'favicon-16x16.png', 16],
  ['icon.svg', 'favicon-32x32.png', 32],
  ['icon.svg', 'favicon-48x48.png', 48],
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-192.png', 192],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
  ['icon-dark.svg', 'icon-dark-512.png', 512],
  ['icon-mono.svg', 'icon-mono-512.png', 512],
  ['notification.svg', 'notification-icon.png', 192],
  ['badge.svg', 'notification-badge.png', 96],
  ['icon.svg', 'shortcut-hoy.png', 96]
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [file, name, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  const svg = src(file).replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: out(name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('ok', name);
}
await browser.close();

// favicon.ico con PNG embebidos (16, 32, 48): formato soportado por todos los navegadores actuales.
const sizes = [16, 32, 48];
const pngs = sizes.map((s) => fs.readFileSync(out(`favicon-${s}x${s}.png`)));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(sizes[i] % 256, e);
  header.writeUInt8(sizes[i] % 256, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(png.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
fs.writeFileSync(out('favicon.ico'), Buffer.concat([header, ...pngs]));
console.log('ok favicon.ico');
