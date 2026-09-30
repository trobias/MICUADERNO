// Captura rápida para QA visual: node tools/shot.mjs <url|archivo> <salida.png> [ancho] [alto] [--full]
import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [target, out, w = '1440', h = '900'] = process.argv.slice(2);
const full = process.argv.includes('--full');
const url = /^(https?|file):/.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url);
await page.waitForTimeout(Number(process.env.WAIT || 600));
await page.screenshot({ path: out, fullPage: full });
await browser.close();
console.log('ok', out);
