// Recorridos E2E en Chromium real, sobre file:// y http:// (PWA). Uso: npm run e2e
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { start as startServer } from '../../tools/serve.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const FILE_URL = pathToFileURL(path.join(root, 'index.html')).href;
const PORT = 4199;
const HTTP_URL = `http://127.0.0.1:${PORT}/index.html`;
const executablePath = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push([true, name, Date.now() - t0]); console.log(`  ✓ ${name}`); }
  catch (e) { results.push([false, name]); console.log(`  ✗ ${name}\n    ${String(e && e.stack || e).split('\n').slice(0, 4).join('\n    ')}`); }
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}

async function newPage(browser, opts = {}) {
  const context = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 860 }, reducedMotion: opts.reducedMotion || 'no-preference', acceptDownloads: true });
  const page = await context.newPage();
  const errors = watchErrors(page);
  return { context, page, errors };
}

async function openCover(page) {
  const cover = page.locator('.cover__board');
  await cover.waitFor({ timeout: 4000 });
  await cover.click();
  await cover.waitFor({ state: 'detached', timeout: 4000 });
}

async function onboard(page, name = 'Sofi') {
  await openCover(page);
  await page.fill('#ob-name', name);
  await page.click('button:has-text("Seguir")');
  await page.click('button:has-text("Seguir")');
  await page.click('[data-cover="lavanda"]');
  await page.click('button:has-text("Abrir mi cuaderno")');
  await page.waitForSelector('.day-head');
}

async function goto(page, hash) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(350);
}

const browser = await chromium.launch({ executablePath });
const server = await startServer(PORT);
console.log('MI CUADERNO · E2E');

await test('primera apertura (file://): tapa → onboarding → Hoy, sin errores', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  assert.equal(await page.getAttribute('body', 'data-cover'), 'lavanda');
  assert.match(await page.textContent('.day-head__greet'), /Sofi/);
  assert.equal(await page.locator('#tabs').isVisible(), true);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('registrar el día y que persista al recargar (file://)', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('.section--mood .mood-patch[data-mood="4"]');
  await page.fill('#intention', 'tomar agua');
  const add = page.locator('.add-activity input');
  for (const t of ['caminar', 'leer', 'ordenar']) { await add.fill(t); await add.press('Enter'); }
  await page.waitForFunction(() => document.querySelectorAll('.activity').length === 3);
  await page.locator('.activity .stitch-box').nth(0).click();
  await page.locator('.activity .icon-btn').nth(1).click();
  await page.click('.menu__item:has-text("Hice un poquito")');
  await page.locator('.activity .icon-btn').nth(2).click();
  await page.click('.menu__item:has-text("Hoy no salió")');
  await page.fill('#notes', 'Un día tranquilo.');
  await page.waitForTimeout(800);
  await page.reload();
  await openCover(page);
  await page.waitForSelector('.activity');
  const state = await page.evaluate(() => ({
    mood: document.querySelector('.section--mood .mood-patch[aria-pressed="true"]')?.dataset.mood,
    statuses: [...document.querySelectorAll('.activity')].map((li) => li.dataset.status),
    notes: document.querySelector('#notes').value,
    intention: document.querySelector('#intention').value
  }));
  assert.deepEqual(state, { mood: '4', statuses: ['done', 'partial', 'skipped'], notes: 'Un día tranquilo.', intention: 'tomar agua' }, JSON.stringify(state));
  assert.deepEqual(errors, []);
  await context.close();
});

await test('rutina: se crea y aparece sola en Hoy; marcarla la guarda', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/rutinas');
  await page.click('button:has-text("Nueva rutina")');
  await page.fill('#rt-title', 'Regar las plantas');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog button:has-text("Crear rutina")');
  await page.waitForSelector('.routine__title:has-text("Regar las plantas")');
  await goto(page, '#/hoy');
  await page.waitForSelector('.activity');
  assert.match(await page.textContent('.activity'), /Regar las plantas/);
  await page.locator('.activity .stitch-box').first().click();
  await page.waitForTimeout(300);
  await goto(page, '#/dia/' + TODAY.slice(0, 8) + '01');
  await goto(page, '#/hoy');
  await page.waitForSelector('.activity[data-status="done"]');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('backup: exportar → borrar todo → restaurar deja el cuaderno igual', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page, 'Lu');
  await page.fill('#notes', 'esto tiene que volver');
  await page.click('.section--mood .mood-patch[data-mood="2"]');
  await page.waitForTimeout(700);
  await goto(page, '#/ajustes');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Guardar una copia (.json)")')]);
  const file = path.join(os.tmpdir(), 'mc-e2e-backup.json');
  await download.saveAs(file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(json.app, 'mi-cuaderno');
  assert.equal(json.schemaVersion, 1);
  assert.equal(json.data.days[0].notes, 'esto tiene que volver');

  await page.click('button:has-text("Borrar todo el cuaderno")');
  await page.fill('#wipe-confirm', 'borrar');
  await page.click('dialog button:has-text("Borrar todo")');
  await page.waitForSelector('#ob-name');
  await page.click('button:has-text("Saltar")');
  await page.click('button:has-text("Seguir")');
  await page.click('button:has-text("Abrir mi cuaderno")');
  await page.waitForSelector('.day-head');
  assert.equal(await page.inputValue('#notes'), '');

  await goto(page, '#/ajustes');
  await page.setInputFiles('#st-restore', file);
  await page.waitForSelector('dialog:has-text("Abrir esta copia")');
  assert.match(await page.textContent('dialog'), /1 día/);
  await page.click('dialog button:has-text("Reemplazar mi cuaderno")');
  await page.waitForSelector('.day-head');
  await page.waitForTimeout(300);
  assert.equal(await page.inputValue('#notes'), 'esto tiene que volver');
  assert.match(await page.textContent('.day-head__greet'), /Lu/);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('backup inválido: aviso claro y nada cambia', async () => {
  const { page, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const bad = path.join(os.tmpdir(), 'mc-bad.json');
  fs.writeFileSync(bad, JSON.stringify({ app: 'otra-app', kind: 'backup' }));
  await goto(page, '#/ajustes');
  await page.setInputFiles('#st-restore', bad);
  await page.waitForSelector('dialog:has-text("no se puede abrir")');
  assert.match(await page.textContent('dialog'), /no parece una copia de MI CUADERNO/);
  await context.close();
});

await test('exportaciones: TXT, CSV y XLSX se descargan', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.fill('#notes', 'hola, "mundo"');
  await page.waitForTimeout(700);
  await goto(page, '#/ajustes');
  for (const [label, ext] of [['Texto (.txt)', 'txt'], ['Planilla (.xlsx)', 'xlsx'], ['Días (.csv)', 'csv'], ['Actividades (.csv)', 'csv']]) {
    const [d] = await Promise.all([page.waitForEvent('download'), page.click(`button:has-text("${label}")`)]);
    assert.ok(d.suggestedFilename().endsWith('.' + ext), d.suggestedFilename());
    const p = path.join(os.tmpdir(), 'mc-e2e.' + ext);
    await d.saveAs(p);
    const buf = fs.readFileSync(p);
    if (ext === 'xlsx') assert.equal(buf.slice(0, 2).toString(), 'PK');
    if (label.startsWith('Días')) assert.match(buf.toString('utf8'), /"hola, ""mundo"""/);
  }
  assert.deepEqual(errors, []);
  await context.close();
});

await test('páginas: plantilla, escribir, sticker, persistir', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva página")');
  await page.click('.template:has-text("Lugares que amo")');
  await page.waitForSelector('.free-list input');
  await page.locator('.free-list input').first().fill('la plaza');
  await page.locator('.free-list input').first().press('Enter');
  await page.locator('.free-list input').nth(1).fill('la casa de mi abuela');
  await page.click('.sticker-tools button:has-text("Decorar")');
  await page.click('.sticker-tools button:has-text("Sticker")');
  await page.click('.sticker-pick[aria-label="mariposa"]');
  await page.click('.sticker-tools button:has-text("Listo")');
  await page.waitForTimeout(700);
  const url = page.url();
  await page.reload();
  await openCover(page);
  await page.waitForSelector('.free-list input');
  assert.equal(page.url(), url);
  const vals = await page.$$eval('.free-list input', (els) => els.map((e) => e.value));
  assert.deepEqual(vals, ['la plaza', 'la casa de mi abuela']);
  assert.equal(await page.locator('.sticker').count(), 2); // el de la plantilla + la mariposa
  await goto(page, '#/paginas');
  assert.match(await page.textContent('.toc'), /Lugares que amo/);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('calendario, semana y año muestran lo registrado; teclado en el mes', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('.section--mood .mood-patch[data-mood="5"]');
  await page.waitForTimeout(400);
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  const cell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  assert.equal(await cell.getAttribute('data-mood'), '5');
  await cell.focus();
  await page.keyboard.press('ArrowRight');
  const focused = await page.evaluate(() => document.activeElement.dataset.date);
  assert.ok(focused && focused > TODAY || focused === undefined);
  await goto(page, '#/calendario/semana/' + TODAY);
  assert.equal(await page.locator('.week-day').count(), 7);
  await goto(page, '#/anio');
  assert.equal(await page.locator(`.stitch-cell[data-date="${TODAY}"]`).getAttribute('data-mood'), '5');
  assert.equal(await page.locator('.stitch-cell').count() >= 365, true);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('mobile 375px: una hoja, pestañas abajo, sin scroll horizontal', async () => {
  const { page, errors, context } = await newPage(browser, { viewport: { width: 375, height: 760 } });
  await page.goto(FILE_URL);
  await onboard(page);
  for (const h of ['#/hoy', '#/calendario', '#/rutinas', '#/paginas', '#/anio', '#/ajustes']) {
    await goto(page, h);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const culprit = over > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => e.className || e.tagName).join(' | ')) : '';
    assert.ok(over <= 0, `${h} desborda ${over}px: ${culprit}`);
  }
  const tabsBox = await page.locator('#tabs').boundingBox();
  assert.ok(tabsBox.y + tabsBox.height >= 750, 'pestañas abajo');
  const visibleTabs = await page.$$eval('#tabs .tab', (els) => els.filter((e) => e.offsetParent !== null).length);
  assert.ok(visibleTabs <= 5, `barra inferior con ${visibleTabs} destinos (máx. 5)`);
  assert.equal(await page.locator('#mobile-settings').isVisible(), true, 'Ajustes accesible arriba');
  await goto(page, '#/anio');
  const cell = await page.locator('.stitch-cell[data-date]').first().boundingBox();
  assert.ok(cell.width >= 22 && cell.height >= 22, `celda del año ${cell.width}x${cell.height} (mín. 22)`);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('320px y celular apaisado: sin scroll horizontal', async () => {
  for (const viewport of [{ width: 320, height: 640 }, { width: 844, height: 390 }]) {
    const { page, errors, context } = await newPage(browser, { viewport });
    await page.goto(FILE_URL);
    await onboard(page);
    for (const h of ['#/hoy', '#/calendario', '#/anio', '#/ajustes']) {
      await goto(page, h);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 0, `${viewport.width}px ${h} desborda ${over}px`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
});

await test('rutina sin nombre: el error aparece junto al campo', async () => {
  const { page, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/rutinas');
  await page.click('button:has-text("Nueva rutina")');
  await page.click('dialog button:has-text("Crear rutina")');
  assert.equal(await page.getAttribute('#rt-title', 'aria-invalid'), 'true');
  assert.match(await page.textContent('#rt-title-err'), /nombre/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'rt-title');
  await context.close();
});

await test('reduced motion: arranca en “Reducidas” y sin escenas', async () => {
  const { page, context } = await newPage(browser, { reducedMotion: 'reduce' });
  await page.goto(FILE_URL);
  await onboard(page);
  assert.equal(await page.getAttribute('html', 'data-motion'), 'reducidas');
  assert.equal(await page.evaluate(() => MC.motion.allows('scenes')), false);
  await context.close();
});

await test('imprimir: arma el documento con @page A5', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.fill('#notes', 'para imprimir');
  await page.waitForTimeout(600);
  await page.evaluate(() => { window.print = () => { window.__printed = document.getElementById('print-root').innerHTML.length; }; });
  await goto(page, '#/imprimir');
  await page.click('button[role="radio"]:has-text("A5")');
  await page.click('button:has-text("Preparar e imprimir")');
  await page.waitForFunction(() => window.__printed > 0);
  assert.match(await page.textContent('#print-page-style'), /size: A5/);
  assert.match(await page.textContent('#print-root'), /para imprimir/);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('PWA (http): manifest, service worker y funciona sin conexión', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(HTTP_URL);
  await onboard(page);
  assert.equal(await page.locator('link[rel="manifest"]').count(), 1);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 8000 }).catch(async () => { await page.reload(); });
  await page.fill('#notes', 'escrito online');
  await page.waitForTimeout(700);
  await context.setOffline(true);
  await page.reload();
  await openCover(page);
  await page.waitForSelector('.day-head');
  assert.equal(await page.inputValue('#notes'), 'escrito online');
  await context.setOffline(false);
  const manifest = await (await fetch(`http://127.0.0.1:${PORT}/manifest.webmanifest`)).json();
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  assert.deepEqual(errors.filter((e) => !/ERR_INTERNET_DISCONNECTED/.test(e)), []);
  await context.close();
});

await test('atajo ?go=nota lleva a escribir', async () => {
  const { page, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.goto(FILE_URL + '?go=nota');
  await openCover(page);
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'notes', null, { timeout: 3000 });
  await context.close();
});

await browser.close();
server.close();
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} recorridos ok`);
process.exit(failed.length ? 1 : 0);
