// Recorridos E2E en Chromium real, sobre file:// y http:// (PWA). Uso: npm run e2e
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { start as startServer } from '../../tools/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE_URL = pathToFileURL(path.join(root, 'index.html')).href;
const PORT = +(process.env.E2E_PORT || 4199); // otro puerto para correr en paralelo (p. ej. varios worktrees)
const HTTP_URL = `http://127.0.0.1:${PORT}/index.html`;
const executablePath = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

const results = [];
async function test(name, fn) {
  if (process.env.E2E_GREP && !name.toLowerCase().includes(process.env.E2E_GREP.toLowerCase())) return;
  const t0 = Date.now();
  try { await fn(); results.push([true, name, Date.now() - t0]); console.log(`  ✓ ${name}`); }
  catch (e) { results.push([false, name]); console.log(`  ✗ ${name}\n    ${String(e && e.stack || e).split('\n').slice(0, 8).join('\n    ')}`); }
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  return errors;
}

async function newPage(browser, opts = {}) {
  const context = await browser.newContext({ serviceWorkers: opts.serviceWorkers || 'allow', viewport: opts.viewport || { width: 1280, height: 860 }, reducedMotion: opts.reducedMotion || 'no-preference', hasTouch: opts.hasTouch === true, acceptDownloads: true });
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

async function onboard(page, name = 'Nicole', { weeklyDefaults = false } = {}) {
  // Las pruebas de datos manuales usan un cuaderno que ya resolvió su carga inicial.
  // D56 se prueba aparte con los cinco valores de fábrica reales y sin este ajuste.
  if (!weeklyDefaults) {
    await page.waitForFunction(() => window.MC && MC.store.kind());
    await page.evaluate(() => MC.model.saveSettings({ weeklyDefaultsInstalled: true }));
    await page.reload();
  }
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

async function addFeeling(page, word, scope = '.section--mood') {
  await page.fill(`${scope} .feelings__input`, word);
  await page.locator(`${scope} .feelings__input`).press('Enter');
  await page.waitForSelector(`${scope} .feeling-chip:has-text("${word}")`);
}

const browser = await chromium.launch({ executablePath });
const server = await startServer(PORT);
console.log('MI CUADERNO · E2E');

await test('primera apertura (file://): tapa → onboarding → Hoy, sin errores', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  assert.equal(await page.getAttribute('body', 'data-cover'), 'lavanda');
  assert.match(await page.textContent('.day-head__greet'), /Nicole/);
  assert.equal(await page.locator('#panel').evaluate((d) => d.open), true, 'Hoy se abre como cuadro sobre el calendario');
  assert.equal(await page.locator('#panel .tabs').isVisible(), true, 'los marcadores siguen a mano con el cuadro abierto');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('registrar el día y que persista al recargar (file://)', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await addFeeling(page, 'con energía');
  await page.fill('#intention', 'tomar agua');
  const add = page.locator('#panel .add-activity input');
  for (const t of ['caminar', 'leer', 'ordenar']) { await add.fill(t); await add.press('Enter'); }
  await page.waitForFunction(() => document.querySelectorAll('#panel .activity').length === 3);
  await page.locator('#panel .activity .stitch-box').nth(0).click();
  await page.locator('#panel .activity .icon-btn').nth(1).click();
  await page.click('.menu__item:has-text("Hice un poquito")');
  await page.locator('#panel .activity .icon-btn').nth(2).click();
  await page.click('.menu__item:has-text("Hoy no salió")');
  await page.fill('#notes', 'Un día tranquilo.');
  await page.waitForTimeout(800);
  await page.reload();
  await openCover(page);
  await page.waitForSelector('#panel .activity');
  const state = await page.evaluate(() => ({
    feelings: [...document.querySelectorAll('.section--mood .feeling-chip')].map((el) => el.dataset.feeling),
    statuses: [...document.querySelectorAll('#panel .activity')].map((li) => li.dataset.status),
    notes: document.querySelector('#notes').value,
    intention: document.querySelector('#intention').value
  }));
  assert.deepEqual(state, { feelings: ['con energía'], statuses: ['done', 'partial', 'skipped'], notes: 'Un día tranquilo.', intention: 'tomar agua' }, JSON.stringify(state));
  assert.deepEqual(errors, []);
  await context.close();
});

await test('emociones libres en una actividad y colores propios en Ajustes', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await addFeeling(page, 'con ansiedad');
  const input = page.locator('#panel .add-activity input');
  await input.fill('Caminar'); await input.press('Enter');
  await page.waitForSelector('.activity:has-text("Caminar")');
  await page.locator('.activity .icon-btn').first().click();
  await page.click('.menu__item:has-text("Cómo me sentí antes y después")');
  const feelInputs = page.locator('dialog.sheet .feelings__input');
  await feelInputs.nth(0).fill('sin energía'); await feelInputs.nth(0).press('Enter');
  await feelInputs.nth(1).fill('con energía'); await feelInputs.nth(1).press('Enter');
  await page.click('dialog.sheet button:has-text("Guardar")');
  await page.waitForSelector('.activity__feeling:has-text("Después: con energía")');
  await goto(page, '#/ajustes');
  await page.fill('.emotion-colors__add .input', 'con ansiedad');
  await page.locator('.emotion-colors__add input[type="color"]').fill('#865faf');
  await page.click('.emotion-colors__add button:has-text("Elegir color")');
  await page.waitForFunction(() => MC.model.settings().emotionColors['con ansiedad'] === '#865FAF');
  // Esperar a que quede guardado de verdad (no solo en memoria) antes de recargar.
  await page.waitForFunction(() => MC.store.get('meta', 'settings').then((r) => !!r && r.value.emotionColors['con ansiedad'] === '#865FAF'));
  await page.reload(); await openCover(page);
  await goto(page, '#/hoy');
  assert.equal(await page.locator('.section--mood .feeling-chip').evaluate((el) => el.style.getPropertyValue('--feeling-color')), '#865FAF');
  assert.match(await page.textContent('.activity__feeling'), /Antes: sin energía/);
  assert.match(await page.textContent('.activity'), /Después: con energía/);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('rutina: se crea y aparece sola en Hoy; marcarla la guarda', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/rutinas');
  await page.click('button:has-text("Nueva repetición")');
  await page.fill('#rt-title', 'Regar las plantas');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog.sheet button:has-text("Que se repita")');
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
  await onboard(page);
  await page.fill('#notes', 'esto tiene que volver');
  await addFeeling(page, 'cansancio');
  await page.waitForTimeout(700);
  await goto(page, '#/ajustes');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Guardar una copia (.json)")')]);
  const file = path.join(os.tmpdir(), 'mc-e2e-backup.json');
  await download.saveAs(file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(json.app, 'mi-cuaderno');
  assert.equal(json.schemaVersion, await page.evaluate(() => MC.backup.SCHEMA_VERSION));
  assert.equal(json.data.days[0].notes, 'esto tiene que volver');

  await page.click('button:has-text("Borrar todo el cuaderno")');
  await page.fill('#wipe-confirm', 'borrar');
  await page.click('dialog.sheet button:has-text("Borrar todo")');
  await page.waitForSelector('#ob-name');
  await page.click('button:has-text("Saltar")');
  await page.click('button:has-text("Seguir")');
  await page.click('button:has-text("Abrir mi cuaderno")');
  await page.waitForSelector('.day-head');
  assert.equal(await page.inputValue('#notes'), '');

  await goto(page, '#/ajustes');
  await page.setInputFiles('#st-restore', file);
  await page.waitForSelector('dialog.sheet:has-text("Abrir esta copia")');
  assert.match(await page.textContent('dialog.sheet'), /1 día/);
  await page.click('dialog.sheet button:has-text("Reemplazar mi cuaderno")');
  await page.waitForSelector('.day-head');
  await page.waitForTimeout(300);
  assert.equal(await page.inputValue('#notes'), 'esto tiene que volver');
  assert.match(await page.textContent('.day-head__greet'), /Nicole/);
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
  await page.waitForSelector('dialog.sheet:has-text("no se puede abrir")');
  assert.match(await page.textContent('dialog.sheet'), /no parece una copia de MI CUADERNO/);
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
  await page.click('button:has-text("Nueva hoja")');
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

await test('guardado visible (DA3): “guardando…” → “guardado” en el día y en una página, persiste al recargar, fallo amable', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  // Anota cada estado del indicador para ver el orden real (y qué se anuncia a lectores de pantalla).
  const watch = (sel) => page.evaluate((s) => {
    const note = document.querySelector(s);
    window.__states = [note.dataset.state];
    window.__said = [];
    const live = note.querySelector('[aria-live]');
    new MutationObserver(() => window.__states.push(note.dataset.state + ':' + note.querySelector('.saved-note__text').textContent)).observe(note, { attributes: true, attributeFilter: ['data-state'] });
    new MutationObserver(() => window.__said.push(live.textContent)).observe(live, { childList: true, characterData: true, subtree: true });
  }, sel);
  const states = () => page.evaluate(() => window.__states);

  // Día
  await watch('.day-head .saved-note');
  assert.equal(await page.getAttribute('.day-head .saved-note', 'data-state'), 'idle');
  await page.fill('#notes', 'Hoy Nicole escribió algo lindo.');
  assert.equal(await page.getAttribute('.day-head .saved-note', 'data-state'), 'saving', 'apenas se escribe: guardando…');
  assert.equal((await page.textContent('.day-head .saved-note__text')).trim(), 'guardando…');
  await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'saved', null, { timeout: 3000 });
  assert.match(await page.textContent('.day-head .saved-note__text'), /^guardado$/);
  assert.equal(await page.locator('.day-head .saved-note .saved-note__glyph .icon-check').count(), 1, 'guardado lleva su tilde');
  const stored = await page.evaluate((d) => MC.model.getDay(d).then((x) => x.notes), TODAY);
  assert.equal(stored, 'Hoy Nicole escribió algo lindo.', '“guardado” recién cuando IndexedDB tiene el texto');
  await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'idle', null, { timeout: 3000 });
  const daySeq = (await states()).map((s) => s.split(':')[0]);
  assert.deepEqual(daySeq.slice(0, 4), ['idle', 'saving', 'saved', 'idle'], JSON.stringify(daySeq));
  const said = await page.evaluate(() => window.__said);
  assert.ok(said.length >= 1 && said.every((t) => !/guardando/i.test(t)), 'solo se anuncia “guardado”, nunca “guardando…”: ' + JSON.stringify(said));

  // Si la escritura falla: aviso amable con glifo, el borrador queda, y vuelve a “guardado” cuando se puede.
  await page.evaluate(() => { window.__put = MC.store.put; MC.store.put = () => Promise.reject(new Error('cuota llena')); });
  await page.fill('#notes', 'Hoy Nicole escribió algo lindo. Y algo más.');
  await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'failed', null, { timeout: 3000 });
  assert.match(await page.textContent('.day-head .saved-note__text'), /todavía no se pudo guardar en el cuaderno; queda como borrador/i);
  assert.equal(await page.locator('.day-head .saved-note .saved-note__glyph svg').count(), 1, 'el fallo lleva glifo, no solo color');
  assert.equal(await page.locator('.day-head .saved-note__action').isVisible(), true, 'ofrece descargar una copia');
  assert.ok(await page.evaluate((d) => !!(JSON.parse(localStorage.getItem('mc.ui.draft.' + d)) || {}).day, TODAY), 'el borrador local sigue ahí');
  await page.evaluate(() => { MC.store.put = window.__put; });
  await page.type('#notes', '!');
  await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'saved', null, { timeout: 3000 });
  assert.equal(await page.locator('.day-head .saved-note__action').isVisible(), false);

  // Página
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva hoja")');
  await page.click('.template:has-text("Vaciar la cabeza")');
  await page.waitForSelector('#page-body');
  await watch('.free-head .saved-note');
  await page.fill('#page-body', 'Ideas sueltas de Nicole.');
  assert.equal(await page.getAttribute('.free-head .saved-note', 'data-state'), 'saving');
  assert.equal((await page.textContent('.free-head .saved-note__text')).trim(), 'guardando…');
  await page.waitForFunction(() => document.querySelector('.free-head .saved-note').dataset.state === 'saved', null, { timeout: 3000 });
  assert.match(await page.textContent('.free-head .saved-note__text'), /^guardado$/);
  const pageSeq = (await states()).map((s) => s.split(':')[0]);
  assert.deepEqual(pageSeq.slice(0, 3), ['idle', 'saving', 'saved'], JSON.stringify(pageSeq));

  // Recargar: los dos textos siguen ahí.
  const pageUrl = page.url();
  await page.reload();
  await openCover(page);
  await page.waitForSelector('#page-body');
  assert.equal(page.url(), pageUrl);
  assert.equal(await page.inputValue('#page-body'), 'Ideas sueltas de Nicole.');
  await goto(page, '#/hoy');
  await page.waitForSelector('#notes');
  assert.equal(await page.inputValue('#notes'), 'Hoy Nicole escribió algo lindo. Y algo más.!');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('DA3: fallo legible con sticker a 375px, sin toast duplicado, y baja de Mis stickers con indicador', async () => {
  const { page, context } = await newPage(browser, { viewport: { width: 375, height: 750 } });
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva hoja")');
  await page.click('.template:has-text("Vaciar la cabeza")');
  await page.waitForSelector('#page-body');
  await page.evaluate(() => MC.emit('store:error', new Error('cuota llena')));
  assert.equal(await page.locator('.toast:visible').count(), 1, 'el indicador en reposo no tapa errores de otras operaciones');
  await page.evaluate(() => { document.querySelector('.toast').hidden = true; });
  await page.evaluate(() => { window.__put = MC.store.put; MC.store.put = () => Promise.reject(new Error('cuota llena')); });
  await page.fill('#page-body', 'Nicole dejó una idea.');
  await page.waitForFunction(() => document.querySelector('.free-head .saved-note').dataset.state === 'failed');
  assert.equal(await page.locator('.free-head .saved-note__action').isVisible(), true);
  const layers = await page.evaluate(() => ({
    note: getComputedStyle(document.querySelector('.free-head .saved-note')).zIndex,
    sticker: getComputedStyle(document.querySelector('.sticker-layer')).zIndex,
    width: document.documentElement.scrollWidth - innerWidth
  }));
  assert.ok(+layers.note > +layers.sticker, 'el aviso queda sobre el sticker de la plantilla');
  assert.ok(layers.width <= 0, 'el aviso no desborda a 375px');
  await page.evaluate(() => MC.emit('store:error', new Error('cuota llena')));
  assert.equal(await page.locator('.toast:visible').count(), 0, 'la hoja ya avisa el fallo');
  await page.evaluate(() => { MC.store.put = window.__put; });
  await goto(page, '#/calendario');
  await page.evaluate(() => MC.emit('store:error', new Error('cuota llena')));
  assert.equal(await page.locator('.toast:visible').count(), 1, 'fuera de una hoja se conserva el aviso general');

  await page.evaluate(() => MC.model.saveImage({ name: 'Nicole', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1cAAAAASUVORK5CYII=', w: 1, h: 1 }));
  await goto(page, '#/paginas');
  await page.click('.toc__link >> nth=0');
  await page.waitForSelector('#page-body');
  await page.click('button:has-text("Decorar")');
  await page.click('.sticker-tools button:has-text("Sticker")');
  await page.click('button[aria-label="Sacar «Nicole» de mis stickers"]');
  await page.click('dialog.sheet button:has-text("Sacar")');
  await page.waitForFunction(() => document.querySelector('dialog.sheet .saved-note').dataset.state === 'saved');
  assert.equal(await page.evaluate(() => MC.model.images().length), 0, 'la baja llegó a IndexedDB');
  await context.close();
});

await test('calendario, semana y año muestran lo registrado; teclado en el mes', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await addFeeling(page, 'calma');
  await page.waitForTimeout(400);
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  const cell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  assert.equal(await cell.getAttribute('data-feeling'), 'calma');
  await cell.focus();
  await page.keyboard.press('ArrowRight');
  const focused = await page.evaluate(() => document.activeElement.dataset.date);
  assert.ok(focused && focused > TODAY || focused === undefined);
  await goto(page, '#/calendario/semana/' + TODAY);
  assert.equal(await page.locator('.week-day').count(), 7);
  await goto(page, '#/anio');
  assert.equal(await page.locator(`.stitch-cell[data-date="${TODAY}"]`).getAttribute('data-feeling'), 'calma');
  assert.equal(await page.locator('.stitch-cell').count() >= 365, true);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('el calendario reúne lo registrado, oculta sin marcar y conserva páginas del día y el año', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/rutinas');
  await page.click('button:has-text("Nueva repetición")');
  await page.fill('#rt-title', 'Estirar');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog.sheet button:has-text("Que se repita")');
  await page.waitForSelector('.routine__title:has-text("Estirar")');
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva hoja")');
  await page.click('.template:has-text("Lugares que amo")');
  await page.waitForSelector('.free-list input');
  await page.waitForTimeout(500);
  const d = new Date(); d.setDate(d.getDate() + 1);
  const TOMORROW = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await goto(page, '#/calendario/mes/' + TOMORROW.slice(0, 7));
  const next = page.locator(`.day-cell[data-date="${TOMORROW}"]`);
  assert.equal(await next.locator('.mark--planned').count(), 0);
  assert.doesNotMatch(await next.getAttribute('aria-label'), /una cosa planeada|Estirar/);
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  const cell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  assert.equal(await cell.locator('.mark--page').count(), 1, 'marca de página en hoy');
  assert.match(await cell.getAttribute('aria-label'), /una página: «Lugares que amo»/);
  await cell.click();
  await page.waitForSelector('#panel[open] #q-pages');
  await page.click('#panel .day-pages a:has-text("Lugares que amo")');
  await page.waitForSelector('#panel[open] .free-list input');
  await goto(page, '#/calendario/semana/' + TODAY);
  await page.waitForSelector('.week-day');
  assert.equal(await page.locator('.week-day .day-pages a').count(), 1, 'página en la semana');
  if (TOMORROW.slice(0, 4) === TODAY.slice(0, 4)) {
    await goto(page, '#/anio');
    assert.equal(await page.locator(`.stitch-cell[data-date="${TOMORROW}"].is-half`).count(), 0, 'una rutina sin marcar no borda medio punto');
  }
  assert.deepEqual(errors, []);
  await context.close();
});

await test('papelera: borrar una página la saca del mes; restaurarla desde Ajustes la devuelve', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva hoja")');
  await page.click('.template:has-text("Lugares que amo")');
  await page.waitForSelector('.free-list input');
  await page.waitForTimeout(500);
  const pageHash = await page.evaluate(() => location.hash);
  const cell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  const pageMarks = () => page.locator(`.day-cell[data-date="${TODAY}"] .mark--page`).count();
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  assert.equal(await pageMarks(), 1, 'la página está en el mes');
  await goto(page, pageHash);
  await page.waitForSelector('#panel[open] .free-list input');
  await page.click('button[aria-label="Opciones de la página"]');
  await page.click('.menu [role="menuitem"]:has-text("Borrar la página")');
  await page.click('dialog[open] button:has-text("Mandar a la papelera")');
  await page.waitForSelector('.toast:has-text("Se fue a la papelera")');
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  await page.waitForFunction((d) => !document.querySelector(`.day-cell[data-date="${d}"] .mark--page`), TODAY, { timeout: 4000 });
  assert.doesNotMatch(await cell.getAttribute('aria-label'), /Lugares que amo/, 'lo que está en la papelera no aparece en el mes');
  await goto(page, '#/paginas');
  assert.doesNotMatch(await page.textContent('#panel'), /Lugares que amo/, 'ni en el índice');
  await goto(page, '#/ajustes');
  const toggle = page.locator('#panel button:has-text("Ver papelera")');
  await toggle.scrollIntoViewIfNeeded();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const item = page.locator('#st-trash-panel .trash-item');
  await item.first().waitFor();
  assert.equal(await item.count(), 1);
  assert.match(await item.textContent(), /Página: Lugares que amo/);
  await item.locator('button:has-text("Restaurar")').click();
  await page.waitForFunction(() => document.querySelectorAll('#st-trash-panel .trash-item').length === 0);
  assert.equal(await page.locator('#st-trash-panel .slip:has-text("La papelera está limpia")').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim()), 'Ver papelera', 'el foco vuelve al botón de la papelera');
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  await page.waitForFunction((d) => !!document.querySelector(`.day-cell[data-date="${d}"] .mark--page`), TODAY, { timeout: 4000 });
  assert.match(await cell.getAttribute('aria-label'), /una página: «Lugares que amo»/, 'restaurada, vuelve al mes');
  await goto(page, '#/paginas');
  assert.match(await page.textContent('.toc'), /Lugares que amo/, 'y al índice');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('papelera: si la limpieza de lo vencido falla al arrancar, el cuaderno abre igual', async () => {
  const { page, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.evaluate(async () => {
    const p = await MC.model.savePage({ title: 'Vieja' });
    await MC.model.sendToTrash('pages', p.id, '2020-01-01T00:00:00.000Z');
  });
  // IndexedDB no deja borrar en el próximo arranque (disco lleno, transacción rota…).
  await context.addInitScript(() => { IDBObjectStore.prototype.delete = function () { throw new DOMException('simulado', 'UnknownError'); }; });
  await page.reload();
  await openCover(page);
  await page.waitForSelector('.day-head');
  assert.equal(await page.evaluate(async () => (await MC.model.trashItems()).length), 1, 'lo vencido sigue ahí para el próximo intento');
  await context.close();
});

await test('las secciones se conectan: rutina ↔ calendario, página → día, año ↔ mes, notando → días', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const add = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const Y = add(TODAY, -1);
  const ids = await page.evaluate(async ([today, y, start]) => {
    const M = MC.model;
    const r = await M.saveRoutine({ title: 'Estirar', rule: { type: 'daily' }, startDate: start });
    const yItem = (await M.itemsForDay(y)).find((i) => i.routineId === r.id);
    await M.setStatus(yItem, 'done');
    const a = await M.addActivity(y, 'llamar a la abuela');
    await M.moveToTomorrow(a);
    const d = await M.getDay(today); d.notes = 'hoy escribí'; await M.saveDay(d);
    const p = await M.savePage({ title: 'Ideas' });
    return { routine: r.id, page: p.id };
  }, [TODAY, Y, add(TODAY, -3)]);

  // Día → “Ver lo que se repite” → Mis hojas, con la repetición resaltada y con el foco.
  await goto(page, '#/dia/' + TODAY);
  await page.click('button[aria-label="Más opciones para Estirar"]');
  await page.click('.menu__item:has-text("Ver lo que se repite")');
  await page.waitForSelector('.routine.is-focus[aria-current="true"]');
  assert.match(await page.textContent('.routine.is-focus'), /Estirar/);
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('is-focus')), true, 'el foco queda en la rutina');

  // Rutina → sus días en el calendario.
  await page.click('.routine.is-focus a[aria-label^="Ver los días"]');
  await page.waitForSelector('.routine-filter');
  assert.equal(await page.locator('#panel').evaluate((d) => d.open), false, 'se cerró el cuadro');
  assert.match(page.url(), new RegExp('/rutina/' + ids.routine + '$'));
  const todayCell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  assert.equal(await todayCell.getAttribute('data-routine'), null);
  assert.doesNotMatch(await todayCell.getAttribute('aria-label'), /toca «Estirar»/);
  await goto(page, `#/calendario/mes/${Y.slice(0, 7)}/rutina/${ids.routine}`);
  assert.equal(await page.locator(`.day-cell[data-date="${Y}"]`).getAttribute('data-routine'), 'done');
  const before = page.locator(`.day-cell[data-date="${add(TODAY, -2)}"]`);
  if (await before.count()) assert.equal(await before.getAttribute('data-routine'), null, 'lo que no se hizo no se marca');
  // Cambiar de mes no apaga la rutina; “Dejar de mostrar” sí.
  await page.click('.month-chip:not([aria-current])');
  await page.waitForTimeout(350);
  assert.match(page.url(), /\/rutina\//);
  await page.waitForSelector('.routine-filter');
  await page.click('.routine-filter a:has-text("Dejar de mostrar")');
  await page.waitForTimeout(350);
  assert.doesNotMatch(page.url(), /\/rutina\//);
  assert.equal(await page.locator('.routine-filter').count(), 0);

  // Mes ↔ año.
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  await page.click('a.months__year');
  await page.waitForSelector('#panel[open] .hoop');
  const monthName = await page.evaluate((k) => MC.dates.MONTHS[+k.slice(5, 7) - 1], TODAY);
  await page.click(`.hoop__month a[aria-label="Ver ${monthName} en el calendario"]`);
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#panel').evaluate((d) => d.open), false);
  assert.match(page.url(), new RegExp('#/calendario/mes/' + TODAY.slice(0, 7) + '$'));
  await goto(page, '#/calendario/mes/2025-03');
  assert.match(await page.getAttribute('.tab[data-tab="anio"]', 'href'), /#\/anio\/2025$/, 'Mi año sigue al calendario');
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  assert.match(await page.getAttribute('.tab[data-tab="anio"]', 'href'), /#\/anio$/);

  // Página → su día; “viene del…” → el día de donde se pasó.
  await goto(page, '#/pagina/' + ids.page);
  await page.click('.page-meta a');
  await page.waitForSelector('#panel[open] .day-head');
  assert.match(page.url(), new RegExp('#/dia/' + TODAY + '$'));
  await page.click('.activity__from');
  await page.waitForTimeout(400);
  assert.match(page.url(), new RegExp('#/dia/' + Y + '$'));

  // Lo que fui notando → los días.
  await goto(page, '#/anio');
  await page.click('.noticed li:has-text("empezaste este cuaderno") a:has-text("Ir a ese día")');
  await page.waitForTimeout(400);
  assert.match(page.url(), new RegExp('#/dia/' + Y + '$'), 'lo primero registrado fue ayer');
  await goto(page, '#/anio');
  await page.click('.noticed li:has-text("Esta semana escribiste") a:has-text("Ir a ese día")');
  await page.waitForTimeout(400);
  assert.match(page.url(), new RegExp('#/dia/' + TODAY + '$'));
  assert.deepEqual(errors, []);
  await context.close();
});

await test('calendario en vivo: se actualiza detrás del cuadro y desde otra pestaña, sin tocar lo que se escribe', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(HTTP_URL);
  await onboard(page);
  await page.click('#panel-close');
  await page.waitForSelector('#panel:not([open])', { state: 'attached' });
  // El mes elegido en la sesión (por defecto abre la semana, A6).
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  await page.waitForSelector('#main .day-cell');
  const cell = (k) => page.locator(`#main .day-cell[data-date="${k}"]`);
  // Abrir hoy con el teclado y registrar el ánimo: el calendario de atrás se entera solo.
  await cell(TODAY).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#panel[open] .day-head');
  await addFeeling(page, 'con energía', '#panel .section--mood');
  const feelingIs = (k, word) => page.waitForFunction(([k, word]) => { const c = document.querySelector(`#main .day-cell[data-date="${k}"]`); return c && c.dataset.feeling === word; }, [k, word], { timeout: 4000 });
  await feelingIs(TODAY, 'con energía'); // el día ya muestra la emoción detrás del cuadro
  assert.equal(await page.locator('#panel').evaluate((d) => d.open), true, 'el cuadro sigue abierto');
  // Escribir mientras el fondo se redibuja: no se pierde ni una letra, ni el foco.
  await page.click('#notes');
  await page.keyboard.type('hola ');
  await page.waitForTimeout(1300);
  await page.keyboard.type('mundo');
  assert.equal(await page.inputValue('#notes'), 'hola mundo');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'notes');
  // Pasar a otro día en el cuadro y volver: la cinta y el foco quedan en ese día.
  const add = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const first = TODAY.slice(8) === '01';
  const other = add(TODAY, first ? 1 : -1);
  await page.click(first ? '#panel button[aria-label="Día siguiente"]' : '#panel button[aria-label="Día anterior"]');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForFunction((k) => !document.getElementById('panel').open && document.activeElement && document.activeElement.dataset.date === k, other, { timeout: 4000 });
  assert.equal(await cell(other).getAttribute('aria-selected'), 'true', 'la cinta marca el último día abierto');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.date), other, 'el foco vuelve a ese día');
  // Otra pestaña cambia algo: este calendario se actualiza sin recargar.
  const other2 = await context.newPage();
  const errors2 = watchErrors(other2);
  await other2.goto(HTTP_URL);
  await other2.waitForFunction(() => window.MC && MC.store && MC.store.kind && MC.store.kind());
  await other2.evaluate(async (k) => { const d = await MC.model.getDay(k); d.evening = { mood: null, feelings: ['cansancio'], at: new Date().toISOString() }; await MC.model.saveDay(d); }, TODAY);
  await feelingIs(TODAY, 'cansancio'); // llegó el cambio de la otra pestaña, sin recargar
  assert.deepEqual(errors, []);
  assert.deepEqual(errors2, []);
  await context.close();
});

await test('A5: cuatro marcadores; Agenda va a la semana; Mis hojas reúne hojas y repeticiones; repetir una actividad', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  // Quedan Hoy · Mis hojas · Mi año · Ajustes.
  assert.deepEqual(await page.$$eval('#tabs .tab, #panel .tab', (els) => [...new Set(els.map((e) => e.dataset.tab))]), ['hoy', 'hojas', 'anio', 'ajustes']);
  // La Agenda ya no existe: su ruta vieja lleva a la semana, sin sumar un paso al historial.
  await goto(page, '#/agenda');
  await page.waitForFunction(() => /#\/calendario\/semana\//.test(location.hash));
  // Anotar en un día y pedir que se repita todos los años, desde su menú.
  await goto(page, '#/hoy');
  await page.fill('#panel input[aria-label="Agregar una actividad"]', 'turno con la dentista');
  await page.press('#panel input[aria-label="Agregar una actividad"]', 'Enter');
  await page.waitForSelector('#panel .activity:has-text("turno con la dentista")');
  await page.click('#panel button[aria-label="Más opciones para turno con la dentista"]');
  await page.click('.menu__item:has-text("Que se repita")');
  assert.equal(await page.inputValue('dialog.sheet #rt-title'), 'turno con la dentista');
  await page.selectOption('dialog.sheet #rt-freq', 'yearly');
  assert.equal(await page.inputValue('dialog.sheet #rt-month'), String(+TODAY.slice(5, 7)), 'empieza en el mes del día abierto');
  assert.equal(await page.inputValue('dialog.sheet #rt-yday'), String(+TODAY.slice(8, 10)));
  assert.match(await page.textContent('dialog.sheet .rt-preview'), /Todos los años/);
  await page.click('dialog.sheet button:has-text("Que se repita")');
  // La actividad suelta pasó a ser la primera vez de la repetición: no queda doble.
  await page.waitForFunction(() => document.querySelectorAll('#panel .activity').length === 1 && !!document.querySelector('#panel .activity[data-routine], #panel .activity'));
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#panel .activity:has-text("turno con la dentista")').count(), 1);
  // Desde su menú: dejar de repetir (pide confirmar; lo ya marcado queda).
  await page.click('#panel button[aria-label="Más opciones para turno con la dentista"]');
  assert.ok(await page.locator('.menu__item:has-text("Cambiar cómo se repite")').count());
  assert.ok(await page.locator('.menu__item:has-text("Ver en el calendario")').count());
  await page.keyboard.press('Escape');
  // Mis hojas: lo que se repite, también en pausa, y el índice de hojas.
  await goto(page, '#/hojas');
  await page.waitForSelector('#panel .routine__title:has-text("turno con la dentista")');
  await page.click('#panel button[aria-label="Pausar turno con la dentista"]');
  await page.waitForSelector('#panel .routine.is-paused:has-text("turno con la dentista")');
  assert.match(await page.textContent('#panel .routines-page'), /En pausa/);
  // La ruta vieja de Rutinas también llega acá.
  await goto(page, '#/rutinas');
  await page.waitForFunction(() => location.hash === '#/hojas');
  // Una hoja para un día elegido aparece en ese día.
  const add = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const later = add(TODAY, 5);
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.fill('dialog.sheet #tp-day', later);
  await page.click('dialog.sheet .template:has-text("En blanco")');
  await page.waitForSelector('#panel .page-meta a');
  assert.match(await page.getAttribute('#panel .page-meta a', 'href'), new RegExp('#/dia/' + later + '$'));
  await goto(page, '#/dia/' + later);
  await page.waitForSelector('#panel .day-pages a');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A6 y D55: semana-planner editable, casillas históricas, Importante y Notas persisten', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const add = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  await page.evaluate(async (k) => {
    const D = MC.dates;
    await MC.model.saveRoutine({ title: 'Estirar', rule: { type: 'daily' }, startDate: D.addDays(k, -21) });
  }, TODAY);
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  // De fondo, la semana: Importante, los siete días y Notas, en ese orden.
  await page.waitForSelector('#main .planner');
  const order = await page.$$eval('#main .planner > *', (els) => els.map((e) => e.dataset.date ? 'dia' : e.querySelector('h2').textContent));
  assert.deepEqual(order, ['Progreso', 'dia', 'dia', 'dia', 'dia', 'dia', 'dia', 'dia', 'Notas']);
  assert.match(await page.textContent('#main h1'), /Mi semana/);
  // Anotar en la semana conserva el borrador sin marcar; la página del día ofrece su casilla.
  const todayCell = `#main .week-day[data-date="${TODAY}"]`;
  await page.fill(`${todayCell} .add-activity input`, 'turno con la dentista');
  await page.press(`${todayCell} .add-activity input`, 'Enter');
  await page.waitForFunction(async () => (await MC.model.itemsForDay(MC.dates.today())).some(a => a.title === 'turno con la dentista'));
  assert.equal(await page.locator(`${todayCell} .activity:has-text("turno con la dentista")`).count(), 0);
  await page.locator(`${todayCell} .week-day__head`).click();
  await page.locator('section[aria-labelledby="q-list"] .activity:has-text("turno con la dentista") .stitch-box').click();
  await page.click('#panel-close');
  await page.waitForSelector(`${todayCell} .activity[data-status="done"]:has-text("turno con la dentista")`);
  assert.equal(await page.evaluate(() => document.getElementById('panel').open), false, 'no se abrió ningún cuadro');
  // Importante y Notas son de la semana.
  await page.fill('#main .planner__cell--important input', 'pagar la luz');
  await page.press('#main .planner__cell--important input', 'Enter');
  await page.keyboard.type('regalo de cumple');
  await page.click('#main .planner__check:first-child .stitch-box');
  await page.click('#week-notes');
  await page.keyboard.type('semana ');
  // Un cambio guardado desde otro lado mientras se escribe: no se pierde ni una letra, ni el foco.
  await page.evaluate((k) => MC.model.addActivity(k, 'algo de otra pestaña'), TODAY);
  await page.waitForTimeout(1300);
  await page.keyboard.type('tranquila');
  assert.equal(await page.inputValue('#week-notes'), 'semana tranquila');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'week-notes');
  await page.waitForTimeout(800);
  await page.reload();
  await openCover(page);
  await page.waitForSelector('#main .planner');
  assert.equal(await page.inputValue('#week-notes'), 'semana tranquila');
  const imp = await page.$$eval('#main .planner__check', (els) => els.map((e) => [e.querySelector('input').value, e.querySelector('.stitch-box').dataset.status]));
  assert.deepEqual(imp.slice(0, 2), [['pagar la luz', 'done'], ['regalo de cumple', 'pending']]);
  // Lo que pasó afuera mientras se escribía ya está en su día.
  assert.equal(await page.locator(`${todayCell} .activity:has-text("algo de otra pestaña")`).count(), 0);
  assert.equal(await page.evaluate(async (k) => (await MC.model.itemsForDay(k)).some(a => a.title === 'algo de otra pestaña'), TODAY), true);
  // D55: una semana pasada conserva sus casillas para completar registros después.
  const past = add(TODAY, -7);
  await goto(page, '#/calendario/semana/' + past);
  await page.waitForSelector(`#main .week-day[data-date="${past}"]`);
  assert.equal(await page.locator('#main .activity:has-text("Estirar")').count(), 0, 'las oportunidades sin marcar no aparecen en el calendario');
  await page.fill(`#main .week-day[data-date="${past}"] .add-activity input`, 'caminé por el río');
  await page.press(`#main .week-day[data-date="${past}"] .add-activity input`, 'Enter');
  await page.waitForSelector(`#main .week-day[data-date="${past}"] .activity[data-status="done"]:has-text("caminé por el río")`);
  // Del teclado al día y de vuelta: Enter abre su página; Escape vuelve al mismo día.
  await goto(page, '#/calendario/semana/' + TODAY);
  await page.waitForSelector(`${todayCell} .week-day__head`);
  await page.focus(`${todayCell} .week-day__head`);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#panel[open] .day-head');
  await page.keyboard.press('Escape');
  await page.waitForFunction((k) => !document.getElementById('panel').open && document.activeElement && document.activeElement.dataset.date === k, TODAY, { timeout: 4000 });
  // Mes o semana: lo elegido dura la sesión; una sesión nueva vuelve a la semana.
  await page.click('#main .cal-mode button:has-text("Mes")');
  await page.waitForSelector('#main .day-cell');
  await goto(page, '#/hoy');
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  await page.waitForSelector('#main .day-cell');
  const fresh = await context.newPage();
  await fresh.goto(FILE_URL);
  await openCover(fresh);
  await fresh.waitForSelector('#main .planner');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A7: hojas en bloques; Guardar como plantilla; Mis plantillas dentro de Nueva hoja; la hoja del día aparece sola y se guarda al escribir', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/hojas');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.click('dialog.sheet .template:has-text("Pros y contras")');
  await page.waitForSelector('#page-body');
  // Renglones + columnas, todo en la misma hoja.
  await page.fill('#page-body', 'Mudarme o no');
  const cols = page.locator('.sheet-cols textarea');
  assert.equal(await cols.count(), 2);
  await cols.nth(0).fill('más luz');
  // Sumar un bloque de casillas desde “Agregar a la hoja”.
  await page.click('.sheet-add');
  await page.click('[role="menuitem"]:has-text("Casillas")');
  await page.locator('.free-list--checks input').first().fill('preguntar precios');
  await page.locator('.free-list--checks .stitch-box').first().click();
  await page.waitForFunction(() => document.querySelector('.free-head .saved-note').dataset.state === 'saved', null, { timeout: 3000 });
  const pageId = decodeURIComponent(page.url().split('#/pagina/')[1]);
  const stored = await page.evaluate((id) => MC.model.getPage(id).then((p) => Object.assign(p, { text: MC.model.sheetText(p) })), pageId);
  assert.equal(stored.blocks.length, 3);
  assert.match(stored.text, /A favor: más luz/);
  assert.match(stored.text, /☑ preguntar precios/);
  // Guardar → como plantilla con lo escrito.
  await page.click('.free-head button:has-text("Guardar")');
  await page.click('[role="menuitem"]:has-text("Como plantilla, con lo escrito")');
  await page.waitForSelector('.toast:has-text("Mis plantillas")');
  // Mis hojas ya no la lista aparte (D45): “Nueva hoja” la ofrece primero, junto al “+”.
  await goto(page, '#/hojas');
  assert.equal(await page.locator('.templates-mine').count(), 0);
  assert.match(await page.textContent('.toc'), /Mudarme o no/, 'la vista previa lee los bloques');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.waitForSelector('dialog.sheet .template-group__title:has-text("Mis plantillas")');
  assert.equal(await page.locator('dialog.sheet .template--new').count(), 1);
  await page.click('dialog.sheet .template-own .template:has-text("Pros y contras")');
  await page.waitForSelector('#page-body');
  assert.equal(await page.inputValue('#page-body'), 'Mudarme o no');
  assert.equal(await page.locator('.sheet-cols textarea').first().inputValue(), 'más luz');
  // Editar la plantilla (lápiz de su tarjeta) no toca las hojas ya hechas.
  await goto(page, '#/hojas');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.click('dialog.sheet .template-own:has-text("Pros y contras") .template__edit');
  await page.waitForSelector('.template-page .page-title');
  await page.fill('.template-page #page-body, .template-page textarea.write >> nth=0', 'otra idea');
  await page.waitForTimeout(700);
  assert.equal((await page.evaluate((id) => MC.model.getPage(id), pageId)).values[stored.blocks[0].id], 'Mudarme o no');
  // El “+” arma una plantilla nueva y la abre.
  await goto(page, '#/hojas');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.click('dialog.sheet .template--new');
  await page.waitForSelector('.template-page .page-title');
  assert.equal((await page.evaluate(() => MC.model.getTemplates())).length, 2);
  // Guardar de una hoja: solo como plantilla (repetir es cosa de los días).
  await page.evaluate((id) => { location.hash = MC.routes.page(id); }, pageId);
  await page.waitForSelector('#page-body');
  await page.click('.free-head button:has-text("Guardar")');
  assert.equal(await page.locator('[role="menuitem"]:has-text("Que se repita")').count(), 0);
  await page.keyboard.press('Escape');
  // Una hoja que ya se repetía (de antes) sigue apareciendo sola: no es actividad, sí “Hojas de este día”.
  await page.evaluate((id) => MC.model.getPage(id).then((p) => MC.model.repeatSheet(p, { title: 'Pensar en voz alta', rule: { type: 'daily' }, startDate: MC.dates.today() }, false)), pageId);
  await goto(page, '#/hoy');
  await page.waitForSelector('#q-pages');
  assert.equal(await page.locator('.activity:has-text("Pensar en voz alta")').count(), 0);
  await page.click('#panel .page-link:has-text("Pensar en voz alta")');
  await page.waitForSelector('#page-body');
  assert.match(await page.textContent('.free-page'), /Esta hoja se repite/);
  assert.equal(await page.inputValue('#page-body'), '', 'en blanco: se pidió sin lo escrito');
  const occId = decodeURIComponent(page.url().split('#/pagina/')[1]);
  assert.match(occId, new RegExp('^pag_.+_' + TODAY + '$'));
  assert.equal(await page.evaluate((id) => MC.store.get('pages', id), occId), undefined, 'virtual hasta que se escribe');
  await page.fill('#page-body', 'Hoy pensé en el balcón.');
  await page.waitForFunction(() => document.querySelector('.free-head .saved-note').dataset.state === 'saved', null, { timeout: 3000 });
  assert.match(await page.evaluate((id) => MC.store.get('pages', id).then((p) => MC.model.sheetText(p)), occId), /Hoy pensé en el balcón\.$/);
  await goto(page, '#/hojas');
  await page.waitForSelector('.routine:has-text("Pensar en voz alta") a:has-text("(la hoja)")');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('D45: Guardar del día — que se repita, como plantilla de día y usarla otro día', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const tomorrow = await page.evaluate((k) => MC.dates.addDays(k, 1), TODAY);
  const later = await page.evaluate((k) => MC.dates.addDays(k, 2), TODAY);
  await page.evaluate(async (k) => {
    const M = MC.model;
    const d = M.emptyDay(k); d.intention = 'ir despacio'; await M.saveDay(d);
    const a = await M.addActivity(k, 'Estirar');
    await M.setStatus(a, 'done');
    await M.addActivity(k, 'Leer un rato');
  }, TODAY);
  await goto(page, '#/anio');
  await goto(page, '#/hoy');
  // Como plantilla de día.
  await page.click('.day-head__tools .keep-btn');
  await page.click('[role="menuitem"]:has-text("Como plantilla de día")');
  await page.fill('dialog.sheet input.input', 'Día tranquilo');
  await page.click('dialog.sheet button:has-text("Guardar")');
  await page.waitForSelector('.toast:has-text("Día tranquilo")');
  const tpl = (await page.evaluate(() => MC.model.getDayTemplates()))[0];
  assert.deepEqual(tpl.day.activities, ['Estirar', 'Leer un rato']);
  assert.equal(tpl.day.intention, 'ir despacio');
  assert.equal((await page.evaluate(() => MC.model.getTemplates())).length, 0, 'las de día no aparecen en Nueva hoja');
  // Que se repita este día: todos los días; la actividad de hoy pasa a ser la ocurrencia (sin duplicar).
  await page.click('.day-head__tools .keep-btn');
  await page.click('[role="menuitem"]:has-text("Que se repita este día")');
  assert.equal(await page.locator('dialog.sheet #rt-title').count(), 0, 'sin nombre: son las actividades del día');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog.sheet button:has-text("Que se repita")');
  await page.waitForSelector('.toast:has-text("aparecer sola")');
  await page.waitForFunction(() => document.querySelectorAll('#panel li.activity .activity__routine').length === 2);
  assert.equal(await page.locator('#panel li.activity:has-text("Estirar")').count(), 1);
  const next = await page.evaluate((k) => MC.model.itemsForDay(k).then((l) => l.map((i) => i.title).sort()), tomorrow);
  assert.deepEqual(next, ['Estirar', 'Leer un rato']);
  // Usar la plantilla otro día: suma lo que falta y la intención si estaba vacía.
  await page.evaluate((k) => MC.model.addActivity(k, 'Llamar'), later);
  await page.evaluate((k) => { location.hash = MC.routes.day(k); }, later);
  await page.waitForSelector('.day-head__tools .keep-btn');
  await page.click('.day-head__tools .keep-btn');
  await page.click('[role="menuitem"]:has-text("Usar «Día tranquilo»")');
  await page.waitForSelector('.toast:has-text("Día tranquilo")');
  const titles = await page.evaluate((k) => MC.model.itemsForDay(k).then((l) => l.map((i) => i.title).sort()), later);
  assert.deepEqual(titles, ['Estirar', 'Leer un rato', 'Llamar']);
  assert.equal((await page.evaluate((k) => MC.model.getDay(k), later)).intention, 'ir despacio');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('D52: sacar emociones de base y plantillas de fábrica, y volver a mostrarlas', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/ajustes');
  await page.click('button[aria-label="Sacar «pesado» de las sugerencias"]');
  await page.waitForSelector('.emotion-colors__hidden:has-text("pesado")');
  assert.equal(await page.locator('.emotion-colors li:has-text("pesado")').count(), 0);
  await goto(page, '#/hoy');
  await page.waitForSelector('.section--mood .feelings__suggestion');
  assert.equal(await page.locator('.section--mood .feelings__suggestion:has-text("pesado")').count(), 0);
  assert.equal(await page.locator('.section--mood .feelings__suggestion:has-text("bajito")').count(), 1);
  await goto(page, '#/hojas');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.click('dialog.sheet button[aria-label="Sacar «Pros y contras» de Nueva hoja"]');
  await page.waitForSelector('dialog.sheet .template-factory-note button');
  assert.equal(await page.locator('dialog.sheet .template:has-text("Pros y contras")').count(), 0);
  assert.equal(await page.locator('dialog.sheet button[aria-label^="Sacar «En blanco»"]').count(), 0, 'en blanco queda siempre');
  await page.click('dialog.sheet .template-factory-note button');
  await page.waitForSelector('dialog.sheet .template:has-text("Pros y contras")');
  await page.keyboard.press('Escape');
  await goto(page, '#/ajustes');
  await page.click('.emotion-colors__hidden button:has-text("Volver a mostrarlas")');
  await page.waitForSelector('.emotion-colors li:has-text("pesado")');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A8: Mi año cuenta semana/mes/año sin puntajes, gráfico con tabla y pequeñas victorias desde la actividad', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.evaluate(async (k) => {
    const M = MC.model;
    const d = M.emptyDay(k);
    d.morning.feelings = ['calma']; d.notes = 'Nicole escribió algo.';
    await M.saveDay(d);
    const a = await M.addActivity(k, 'Regar las plantas');
    await M.setStatus(a, 'done');
  }, TODAY);
  // Marcar una victoria desde el menú de la actividad del día.
  await goto(page, '#/anio');
  await goto(page, '#/hoy');
  const row = page.locator('#panel li.activity:has-text("Regar las plantas")');
  await row.locator('button[aria-haspopup="menu"]').click();
  await page.click('[role="menuitem"]:has-text("Es una pequeña victoria")');
  await page.waitForSelector('.toast:has-text("pequeñas victorias")');
  await row.locator('button[aria-haspopup="menu"]').click();
  await page.waitForSelector('[role="menuitem"]:has-text("Ya no es una pequeña victoria")');
  await page.keyboard.press('Escape');
  await goto(page, '#/anio');
  await page.waitForSelector('.tally__list');
  const tally = await page.textContent('.tally__panel');
  assert.match(tally, /Escribiste un día/);
  assert.match(tally, /Hiciste una cosa/);
  assert.match(tally, /calma/);
  assert.doesNotMatch(tally, /racha|puntaje|genial/i);
  // Elegir el período: el año dice lo mismo (todo pasó hoy) y la elección queda.
  await page.click('.tally__switch [role="radio"]:has-text("Este año")');
  assert.equal(await page.getAttribute('.tally__switch [role="radio"]:has-text("Este año")', 'aria-checked'), 'true');
  // Gráfico mes a mes con su tabla accesible.
  assert.equal(await page.locator('.chart__svg rect').count() >= 2, true);
  assert.equal(await page.isVisible('.chart__table'), false);
  await page.click('.chart button:has-text("Ver los números")');
  const month = Number(TODAY.slice(5, 7));
  const cells = await page.locator('.chart__table tbody tr').nth(month - 1).locator('td').allTextContents();
  assert.deepEqual(cells, ['1', '1', '1']);
  // La victoria aparece con su día y lleva a él.
  await page.waitForSelector('.wins .win:has-text("Regar las plantas")');
  await page.click('.wins a:has-text("Regar las plantas")');
  await page.waitForSelector('#panel li.activity:has-text("Regar las plantas")');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A9: colores propios; preset, mis colores con aviso de contraste, volver a la tela; el sistema y la impresión ganan', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const bodyVar = (k) => page.evaluate((k) => document.body.style.getPropertyValue(k), k);
  assert.equal(await bodyVar('--paper'), '', 'de fábrica: sin tema');
  await goto(page, '#/ajustes');
  await page.waitForSelector('#st-theme');
  assert.match(await page.textContent('.theme-status'), /tela de tu tapa/);
  await page.click('.theme-choice[data-preset="cosmos"]');
  assert.equal(await page.getAttribute('.theme-choice[data-preset="cosmos"]', 'aria-pressed'), 'true');
  assert.equal(await bodyVar('--cloth'), '#D6E6E5'); // color-ok: test
  assert.match(await bodyVar('--cloth-image'), /linear-gradient/);
  assert.equal(await page.evaluate(() => document.body.dataset.theme), 'cosmos');
  await page.waitForFunction(() => MC.model.settings().theme && MC.model.settings().theme.preset === 'cosmos');
  // Mis colores: una tinta clarita se corrige y se dice con palabras.
  await page.click('section[aria-labelledby="st-theme"] button:has-text("Elegir mis colores")');
  await page.fill('section[aria-labelledby="st-theme"] .theme-code[aria-label="Código de tinta"]', '#F0F0F0'); // color-ok: test
  await page.press('section[aria-labelledby="st-theme"] .theme-code[aria-label="Código de tinta"]', 'Enter');
  await page.locator('section[aria-labelledby="st-theme"] .theme-code[aria-label="Código de tinta"]').blur();
  await page.waitForFunction(() => /tinta/.test(document.querySelector('.theme-notes').textContent));
  assert.match(await page.textContent('.theme-status'), /mis colores/);
  const ink = await bodyVar('--ink');
  assert.ok(await page.evaluate(([a, b]) => MC.theme.contrast(a, b) >= 7, [ink, await bodyVar('--paper')]));
  // Queda guardado al recargar.
  await page.waitForFunction(() => MC.model.settings().theme && MC.model.settings().theme.preset === 'propio', null, { timeout: 3000 });
  await page.reload();
  await openCover(page);
  await page.waitForFunction(() => document.body.dataset.theme === 'propio');
  // Colores forzados del sistema: el tema se hace a un lado (y vuelve cuando se apagan).
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForFunction(() => !document.body.dataset.theme);
  await page.emulateMedia({ forcedColors: 'none' });
  await page.waitForFunction(() => document.body.dataset.theme === 'propio');
  // La impresión usa sus tokens propios, no los del tema.
  await page.emulateMedia({ media: 'print' });
  const printPaper = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--print-paper').trim());
  assert.equal(printPaper.toUpperCase(), '#FFFFFF'); // color-ok: test
  await page.emulateMedia({ media: 'screen' });
  // Volver a la tela de la tapa.
  await goto(page, '#/ajustes');
  await page.click('section[aria-labelledby="st-theme"] button:has-text("Volver a la tela de la tapa")');
  await page.waitForFunction(() => !document.body.dataset.theme && MC.model.settings().theme === null);
  assert.equal(await bodyVar('--paper'), '');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A10: escenas más seguido, todas en el margen, se cortan al escribir y nunca en Reducidas', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  // Frecuencia del contrato D33.
  const d = await page.evaluate(() => [MC.scenes.delay(true, 'completas', 0), MC.scenes.delay(true, 'completas', 1), MC.scenes.delay(false, 'completas', 0), MC.scenes.delay(false, 'completas', 1), MC.scenes.delay(false, 'suaves', 0), MC.scenes.delay(false, 'suaves', 1)]);
  assert.deepEqual(d, [12000, 25000, 60000, 150000, 180000, 300000]);
  const names = await page.evaluate(() => MC.scenes.NAMES);
  for (const n of ['flor', 'esquina', 'bordado', 'lluvia']) assert.ok(names.includes(n), n);
  // Cada escena se dibuja en la capa de escenas, solo con transform/opacity, y se va sin dejar nada.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (const n of names) {
    const ok = await page.evaluate((n) => {
      MC.scenes.play(n);
      const el = document.querySelector('#panel-scene-layer .scene, #scene-layer .scene');
      if (!el) return 'sin escena';
      const props = el.getAnimations({ subtree: true }).flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))).filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k));
      const bad = props.filter((k) => !['transform', 'opacity', 'strokeDashoffset', 'strokeDasharray'].includes(k));
      MC.scenes.stop();
      return bad.length ? 'anima ' + bad.join(',') : (document.querySelector('.scene') ? 'quedó' : 'ok');
    }, n);
    assert.equal(ok, 'ok', n);
  }
  // Escribir la corta al instante.
  await page.evaluate(() => MC.scenes.play('mariposa'));
  assert.equal(await page.evaluate(() => MC.scenes.state().running), true);
  await page.evaluate(() => MC.emit('typing'));
  assert.equal(await page.evaluate(() => MC.scenes.state().running), false);
  // En Reducidas no se programan.
  await page.evaluate(() => MC.model.saveSettings({ motion: 'reducidas' }));
  assert.equal(await page.evaluate(() => MC.scenes.canPlay()), false);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A11: balde acotado, plumilla con presión, aerógrafo con semilla; deshacer y reabrir sin perder nada', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('#panel .sticker-tools button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet button:has-text("Dibujar uno")');
  await page.waitForSelector('dialog.sheet--draw canvas');
  const box = await page.locator('dialog.sheet--draw canvas').boundingBox();
  const P = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
  async function stroke(points) {
    await page.mouse.move(...P(...points[0]));
    await page.mouse.down();
    for (const pt of points.slice(1)) await page.mouse.move(...P(...pt), { steps: 6 });
    await page.mouse.up();
  }
  // Un cuadrado cerrado con el técnico (grueso, para que no queden huecos).
  await page.click('dialog.sheet--draw .draw__widths .draw__opt >> nth=2');
  await stroke([[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]]);
  // Balde adentro, con otro color.
  await page.click('dialog.sheet--draw .draw__colors .draw__opt >> nth=3');
  await page.click('dialog.sheet--draw .draw__opt[aria-label^="Balde"]');
  await page.mouse.click(...P(0.5, 0.5));
  const pixel = (fx, fy) => page.evaluate(([fx, fy]) => { const cv = document.querySelector('dialog.sheet--draw canvas'); return Array.from(cv.getContext('2d').getImageData(Math.round(cv.width * fx), Math.round(cv.height * fy), 1, 1).data); }, [fx, fy]);
  const inside = await pixel(0.5, 0.5);
  assert.equal(inside[3], 255, 'adentro quedó pintado');
  assert.equal((await pixel(0.1, 0.1))[3], 0, 'afuera, no: el balde respeta el contorno');
  // Deshacer el relleno y rehacerlo.
  await page.click('dialog.sheet--draw button[aria-label="Deshacer Rellenar"]');
  assert.equal((await pixel(0.5, 0.5))[3], 0);
  await page.click('dialog.sheet--draw button[aria-label^="Rehacer"]');
  assert.equal((await pixel(0.5, 0.5))[3], 255);
  // Plumilla (guarda presión) y aerógrafo (guarda semilla).
  await page.click('dialog.sheet--draw .draw__opt[aria-label^="Plumilla"]');
  await stroke([[0.1, 0.85], [0.4, 0.9], [0.8, 0.85]]);
  await page.click('dialog.sheet--draw .draw__opt[aria-label="Aerógrafo"]');
  await stroke([[0.1, 0.15], [0.3, 0.12]]);
  await page.click('dialog.sheet--draw .draw__opt[aria-label="Grafito"]');
  await stroke([[0.8, 0.1], [0.9, 0.2]]);
  await page.fill('#draw-name', 'Cuadrito de Nicole');
  await page.click('dialog.sheet--draw button:has-text("Pegar en la hoja")');
  await page.waitForFunction(() => !document.querySelector('dialog.sheet--draw'));
  const saved = await page.evaluate(() => MC.model.images().find((i) => i.name === 'Cuadrito de Nicole'));
  const tools = saved.drawing.strokes.map((s) => s.tool);
  assert.deepEqual(tools, ['technical', 'fill', 'nib', 'airbrush', 'graphite']);
  const nib = saved.drawing.strokes[2];
  assert.equal(nib.pressure.length, nib.points.length);
  assert.ok(Number.isInteger(saved.drawing.strokes[3].seed));
  // La imagen recortada incluye el relleno (no solo los trazos).
  assert.ok(saved.w > 200 && saved.h > 200);
  // Reabrir para editar: el relleno sigue ahí.
  await page.evaluate((id) => { MC.draw.open({ image: MC.model.imageById(id) }); }, saved.id);
  await page.waitForSelector('dialog.sheet--draw canvas');
  await page.waitForTimeout(100);
  assert.equal((await pixel(0.5, 0.5))[3], 255);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A12: matriz — de cada sección se vuelve al calendario con ✕, Esc, tocando afuera y Atrás; ruta directa y recarga (1366 y 375 px)', async () => {
  for (const viewport of [{ width: 1366, height: 900 }, { width: 375, height: 812 }]) {
    const { page, errors, context } = await newPage(browser, { viewport });
    await page.goto(FILE_URL);
    await onboard(page);
    const ids = await page.evaluate(async () => {
      const M = MC.model;
      const p = await M.savePage({ title: 'Hoja de Nicole', blocks: [{ type: 'text' }], values: {} });
      const t = await M.saveTemplate({ title: 'Plantilla de Nicole', blocks: [{ type: 'list' }] });
      const r = await M.saveRoutine({ title: 'Estirar', rule: { type: 'daily' } });
      return { page: p.id, template: t.id, routine: r.id };
    });
    const R = await page.evaluate((ids) => {
      const R = MC.routes, D = MC.dates;
      return [['hoy', R.today()], ['otro día', R.day(D.addDays(D.today(), -3))], ['mis hojas', R.sheets()], ['lo que se repite', R.routine(ids.routine)],
        ['una hoja', R.page(ids.page)], ['una plantilla', R.template(ids.template)], ['mi año', R.year()], ['ajustes', R.settings()], ['imprimir', R.print()]];
    }, ids);
    const closed = async (why) => {
      await page.waitForFunction(() => !document.getElementById('panel').open, null, { timeout: 3000 }).catch(() => {});
      assert.equal(await page.evaluate(() => document.getElementById('panel').open), false, why + ': el cuadro quedó abierto');
      assert.match(page.url(), /#\/calendario/, why + ': no volvió al calendario');
      await page.waitForSelector('#main .planner, #main .month-grid, #main .cal-page', { timeout: 3000 });
    };
    // Empezar desde el calendario.
    await page.click('#panel-close');
    await closed('inicio');
    for (const [name, hash] of R) {
      for (const how of ['✕', 'Esc', 'afuera', 'Atrás']) {
        const why = viewport.width + 'px · ' + name + ' · ' + how;
        await page.evaluate((h) => { location.hash = h; }, hash);
        await page.waitForFunction(() => document.getElementById('panel').open && document.querySelector('#panel-body').children.length, null, { timeout: 3000 });
        await page.waitForTimeout(150);
        if (how === '✕') await page.click('#panel-close');
        else if (how === 'Esc') { await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('Escape'); }
        else if (how === 'afuera') {
          // En el celular el cuadro ocupa toda la pantalla: no hay “afuera” y se cierra con ✕ o Atrás.
          const full = await page.evaluate(() => { const r = document.getElementById('panel').getBoundingClientRect(); return r.left <= 3 && r.top <= 3; });
          if (full) { await page.click('#panel-close'); } else await page.mouse.click(3, 3);
        }
        else await page.goBack();
        await closed(why);
      }
    }
    // Ruta directa y recarga: el calendario queda detrás y se vuelve a él.
    for (const [name, hash] of R) {
      await page.goto(FILE_URL + hash);
      await page.waitForFunction(() => document.getElementById('panel').open, null, { timeout: 4000 }).catch(async () => { await openCover(page).catch(() => {}); });
      await page.waitForFunction(() => document.getElementById('panel').open, null, { timeout: 4000 });
      await page.reload();
      await page.waitForFunction(() => document.getElementById('panel').open, null, { timeout: 4000 }).catch(async () => { await openCover(page).catch(() => {}); });
      await page.waitForFunction(() => document.getElementById('panel').open, null, { timeout: 4000 });
      await page.click('#panel-close');
      await closed(viewport.width + 'px · directo y recarga · ' + name);
    }
    // Sin scroll horizontal en ninguna sección, y todo control con nombre accesible y tamaño tocable.
    for (const [name, hash] of R) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(350);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 1, viewport.width + 'px · ' + name + ': scroll horizontal de ' + over + 'px');
      const nameless = await page.evaluate(() => {
        const named = (el) => {
          if (el.getAttribute('aria-label') || el.getAttribute('title')) return true;
          const by = el.getAttribute('aria-labelledby');
          if (by && by.split(' ').some((id) => (document.getElementById(id) || {}).textContent)) return true;
          if (el.labels && el.labels.length && Array.from(el.labels).some((l) => l.textContent.trim())) return true;
          return /^(BUTTON|A|SUMMARY)$/.test(el.tagName) && el.textContent.trim().length > 0;
        };
        return Array.from(document.querySelectorAll('#panel button, #panel a[href], #panel input:not([type=hidden]), #panel select, #panel textarea, #main button, #main a[href], #main input, #main select, #main textarea'))
          .filter((el) => el.offsetParent !== null && !el.closest('[hidden], [aria-hidden="true"]') && !named(el))
          .map((el) => el.outerHTML.slice(0, 120));
      });
      assert.deepEqual(nameless, [], viewport.width + 'px · ' + name + ': controles sin nombre');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
});

await test('dibujar, subir imágenes como stickers y adjuntar archivos', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  // Dibujar uno desde el sobre de stickers del día.
  await page.click('#panel .sticker-tools button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet button:has-text("Dibujar uno")');
  await page.waitForSelector('dialog.sheet--draw canvas');
  await page.click('dialog.sheet--draw .draw__colors .draw__opt >> nth=1');
  const box = await page.locator('dialog.sheet--draw canvas').boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.3 + i * 0.04), box.y + box.height * (0.3 + (i % 2) * 0.1));
  await page.mouse.up();
  const drawUndo = page.locator('dialog.sheet--draw button[aria-label="Deshacer Dibujar trazo"]');
  await drawUndo.waitFor();
  const drawRedo = page.locator('dialog.sheet--draw button[aria-label^="Rehacer"]');
  assert.equal(await drawRedo.isDisabled(), true);
  assert.deepEqual(await drawRedo.evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).cursor, el.style.opacity]), ['0.5', 'not-allowed', '']);
  await drawUndo.click();
  await page.locator('dialog.sheet--draw button[aria-label="Rehacer Dibujar trazo"]').click();
  await page.click('dialog.sheet--draw button:has-text("Pegar en la hoja")');
  await page.waitForSelector('#panel .sticker--img img');
  // Editarlo: sumar un texto.
  await page.click('#panel .sticker--img');
  await page.click('#panel .sticker-tools button:has-text("Editar el dibujo")');
  await page.click('dialog.sheet--draw .draw__opt[aria-label="Texto"]');
  await page.fill('dialog.sheet--draw .draw__text-input', 'hola');
  await page.click('dialog.sheet--draw button:has-text("Ponerlo en el medio")');
  await page.click('dialog.sheet--draw button:has-text("Guardar")');
  await page.waitForFunction(() => !document.querySelector('dialog.sheet--draw'));
  assert.equal(await page.evaluate(() => MC.model.images()[0].drawing.texts[0].text), 'hola');
  assert.equal(await page.locator('#panel .sticker--img').count(), 1);
  // Subir una imagen (un SVG: se guarda pasado a imagen, nunca como SVG).
  await page.click('#panel .sticker-tools button:has-text("Sticker")');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('dialog.sheet button:has-text("Subir una imagen")')]);
  await chooser.setFiles({ name: 'sol.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="16" fill="#CAAE31"/></svg>') });
  await page.waitForFunction(() => document.querySelectorAll('#panel .sticker--img').length === 2);
  assert.match(await page.evaluate(() => MC.model.images().find((i) => i.name === 'sol').src), /^data:image\/(webp|png);base64,/);
  // El sobre muestra “Mis stickers” y se pueden sacar.
  await page.click('#panel .sticker-tools button:has-text("Sticker")');
  assert.equal(await page.locator('dialog.sheet .sticker-own').count(), 2);
  await page.click('dialog.sheet button[aria-label="Sacar «sol» de mis stickers"]');
  await page.click('dialog.sheet >> nth=-1 >> button:has-text("Sacar")');
  await page.waitForFunction(() => MC.model.images().length === 1);
  await page.keyboard.press('Escape');
  await page.click('#panel .sticker-tools button:has-text("Listo")');
  // Adjuntar un archivo al día, descargarlo y sacarlo.
  const [chooser2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#panel button:has-text("Adjuntar un archivo")')]);
  await chooser2.setFiles({ name: 'entrada.txt', mimeType: 'text/plain', buffer: Buffer.from('fila 7, asiento 12') });
  await page.waitForSelector('#panel .attachment:has-text("entrada.txt")');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#panel .attachment__open')]);
  assert.equal(dl.suggestedFilename(), 'entrada.txt');
  await page.click('#panel button[aria-label="Sacar el adjunto entrada.txt"]');
  await page.click('dialog.sheet button:has-text("Sacar")');
  await page.waitForFunction(() => !document.querySelector('#panel .attachment'));
  // Plantilla “Para dibujar”: la hoja abre con el lápiz listo.
  await goto(page, '#/paginas');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.click('.template:has-text("Para dibujar")');
  await page.waitForSelector('dialog.sheet--draw canvas');
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('historial de stickers: mover, deshacer, rehacer y texto con deshacer nativo', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('#panel .sticker-tools button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet .sticker-pick >> nth=0');
  const sticker = page.locator('#panel .sticker').first();
  await sticker.waitFor();
  const x0 = await sticker.evaluate((el) => parseFloat(el.style.left));
  await sticker.focus();
  await page.keyboard.press('ArrowRight');
  const x1 = await sticker.evaluate((el) => parseFloat(el.style.left));
  assert.ok(x1 > x0, 'se movió el sticker');
  await page.keyboard.press('Control+z');
  await page.waitForFunction((x) => Math.abs(parseFloat(document.querySelector('#panel .sticker').style.left) - x) < 0.001, x0);
  await page.keyboard.press('Control+Shift+z');
  await page.waitForFunction((x) => Math.abs(parseFloat(document.querySelector('#panel .sticker').style.left) - x) < 0.001, x1);
  await page.fill('#notes', 'Nicole escribió acá');
  await page.keyboard.press('Control+z');
  assert.equal(await sticker.evaluate((el) => parseFloat(el.style.left)), x1, 'el textarea no tocó el historial de stickers');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('historial con teclado: el foco no se pierde y rehacer “sacar” saca la fila', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const focused = () => page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.className);
  await page.click('#panel .sticker-tools button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet .sticker-pick >> nth=0');
  await page.locator('#panel .sticker').first().waitFor();
  await page.focus('#panel .sticker-tools button[aria-label="Girar a la derecha"]');
  await page.keyboard.press('Enter');
  assert.equal(await focused(), 'Girar a la derecha', 'girar deja el foco en el botón');
  await page.focus('#panel .sticker-tools button[aria-label^="Deshacer"]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#panel .sticker-tools button[aria-label^="Rehacer"]').disabled);
  assert.match(await focused(), /^Deshacer/, 'deshacer deja el foco en el botón');
  await page.focus('#panel .sticker');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Control+z');
  await page.waitForFunction(() => document.activeElement.classList.contains('sticker'));
  await page.click('#panel .sticker-tools button:has-text("Listo")');

  await page.fill('#panel .add-activity input', 'Regar las plantas');
  await page.keyboard.press('Enter');
  const row = page.locator('#panel li.activity:has-text("Regar las plantas")');
  await row.waitFor();
  await row.locator('button[aria-haspopup="menu"]').click();
  await page.click('[role="menuitem"]:has-text("Sacar de la lista")');
  await row.waitFor({ state: 'detached' });
  await page.click('.toast button:has-text("Deshacer")');
  await row.waitFor();
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Control+Shift+z');
  await row.waitFor({ state: 'detached' });
  const stored = await page.evaluate((d) => MC.model.itemsForDay(d).then((l) => l.filter((a) => a.title === 'Regar las plantas').length), TODAY);
  assert.equal(stored, 0, 'rehacer la sacó también de lo guardado');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('sticker: flechas y giros seguidos forman un paso; el diálogo tapa el atajo', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('#panel .sticker-tools button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet .sticker-pick >> nth=0');
  const sticker = page.locator('#panel .sticker').first();
  await sticker.focus();
  const x0 = await sticker.evaluate((el) => parseFloat(el.style.left));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const x1 = await sticker.evaluate((el) => parseFloat(el.style.left));
  assert.ok(x1 > x0);
  await page.keyboard.press('Control+z');
  await page.waitForFunction((x) => Math.abs(parseFloat(document.querySelector('#panel .sticker').style.left) - x) < 0.001, x0);
  await page.keyboard.press('Control+Shift+z');
  await page.waitForFunction((x) => Math.abs(parseFloat(document.querySelector('#panel .sticker').style.left) - x) < 0.001, x1);
  assert.equal(await page.locator('#panel .sticker-tools button[aria-label="Deshacer Cambiar sticker"]').isVisible(), true);
  await page.click('#panel .sticker-tools button:has-text("Sticker")');
  await page.keyboard.press('Control+z');
  assert.equal(await sticker.evaluate((el) => parseFloat(el.style.left)), x1, 'la hoja no cambia debajo del diálogo');
  await page.click('dialog.sheet button[aria-label="Cerrar"]');
  await page.click('#panel .sticker-tools button[aria-label="Girar a la derecha"]');
  await page.click('#panel .sticker-tools button[aria-label="Girar a la derecha"]');
  await page.waitForTimeout(450);
  const rot = await sticker.evaluate((el) => el.style.getPropertyValue('--rot'));
  await page.click('#panel .sticker-tools button[aria-label^="Deshacer"]');
  await page.waitForFunction((v) => document.querySelector('#panel .sticker').style.getPropertyValue('--rot') !== v, rot);
  const restoredRot = await sticker.evaluate((el) => el.style.getPropertyValue('--rot'));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(([date, rotValue]) => MC.model.getDay(date).then((d) => d.stickers.some((s) => s.rot + 'deg' === rotValue)), [TODAY, restoredRot]);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('actividades: no se deshace desde otra vista; estado, nombre y traslado sí se revierten', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.fill('#panel .add-activity input', 'Regar las plantas');
  await page.keyboard.press('Enter');
  const row = page.locator('#panel li.activity:has-text("Regar las plantas")');
  await row.waitFor();
  await row.locator('.stitch-box').click();
  await page.waitForFunction(() => document.querySelector('#panel li.activity').dataset.status === 'done');
  await page.waitForFunction(() => MC.history.active() && MC.history.active().undoLabel() === 'Cambiar estado de actividad');
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Control+z');
  await page.waitForFunction(() => document.querySelector('#panel li.activity').dataset.status === 'pending');
  await row.locator('.activity__title').dblclick();
  await page.fill('#panel .activity__edit', 'Regar temprano');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => MC.history.active() && MC.history.active().undoLabel() === 'Cambiar nombre de actividad');
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Control+z');
  await page.waitForSelector('#panel li.activity:has-text("Regar las plantas")');
  await row.locator('button[aria-haspopup="menu"]').click();
  await page.click('[role="menuitem"]:has-text("Pasar a mañana")');
  await page.waitForFunction((d) => MC.model.itemsForDay(d).then((l) => l.some((a) => a.movedFrom === MC.dates.today())), (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })());
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Control+z');
  await page.waitForFunction((d) => MC.model.itemsForDay(d).then((l) => !l.some((a) => a.movedFrom === MC.dates.today())), (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })());
  await row.locator('button[aria-haspopup="menu"]').click();
  await page.click('[role="menuitem"]:has-text("Sacar de la lista")');
  await row.waitFor({ state: 'detached' });
  await goto(page, '#/ajustes');
  await page.keyboard.press('Control+z');
  assert.equal(await page.evaluate((d) => MC.model.itemsForDay(d).then((l) => l.some((a) => a.title === 'Regar las plantas')), TODAY), false);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('mobile 375px: una pantalla, 4 marcadores, sin scroll horizontal', async () => {
  const { page, errors, context } = await newPage(browser, { viewport: { width: 375, height: 760 } });
  await page.goto(FILE_URL);
  await onboard(page);
  for (const h of ['#/hoy', '#/calendario', '#/hojas', '#/anio', '#/ajustes']) {
    await goto(page, h);
    const over = await page.evaluate(() => { const p = document.getElementById('panel'); return Math.max(document.documentElement.scrollWidth - window.innerWidth, p.open ? p.scrollWidth - p.clientWidth : 0); });
    const culprit = over > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => e.className || e.tagName).join(' | ')) : '';
    assert.ok(over <= 0, `${h} desborda ${over}px: ${culprit}`);
  }
  await goto(page, '#/calendario');
  const tabs = await page.$$eval('#tabs .tab', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, bottom: r.bottom }; }));
  assert.equal(tabs.length, 4, "Hoy, Mis hojas, Mi año y Ajustes");
  assert.ok(tabs.every((o) => o.h >= 44 && o.w >= 44), 'marcadores de al menos 44px');
  const vh = await page.evaluate(() => window.innerHeight);
  assert.ok(tabs.every((o) => o.bottom <= vh + 8 && o.bottom > vh - 80), 'marcadores abajo, a la vista (asoman apenas)');
  assert.equal(await page.locator('.month-chip').count(), 12, 'los 12 meses a mano');
  await goto(page, '#/anio');
  const cell = await page.locator('.stitch-cell[data-date]').first().boundingBox();
  assert.ok(cell.width >= 22 && cell.height >= 22, `celda del año ${cell.width}x${cell.height} (mín. 22)`);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('mobile 375px: con teclado virtual abierto la barra de marcadores no tapa el campo y reaparece al cerrar (T6)', async () => {
  const { page, errors, context } = await newPage(browser, { viewport: { width: 375, height: 760 } });
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/hoy');
  await page.waitForSelector('#notes');
  const tabs = page.locator('#tabs');
  assert.equal(await tabs.isVisible(), true, 'los marcadores se ven al inicio');

  // 1. No ocultar sin foco: reducir altura sin campo editable enfocado NO oculta marcadores
  await page.setViewportSize({ width: 375, height: 420 });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.body.classList.contains('keyboard-open')), false, 'sin campo enfocado no se activa modo teclado');
  assert.equal(await tabs.isVisible(), true, 'los marcadores siguen visibles sin foco');
  await page.setViewportSize({ width: 375, height: 760 });

  // 2. Foco real y apertura: al enfocar un campo editable y abrir teclado, se ocultan los marcadores
  await page.locator('#intention').focus();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'intention');
  await page.evaluate(() => {
    window.__keyboardScrolls = 0;
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      if (this.id === 'intention') window.__keyboardScrolls++;
      return original.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 375, height: 420 });
  await page.waitForFunction(() => document.body.classList.contains('keyboard-open'));
  assert.equal(await tabs.isVisible(), false, 'los marcadores se ocultan al abrir teclado con foco real');
  const scrollsOnOpen = await page.evaluate(() => window.__keyboardScrolls);
  assert.ok(scrollsOnOpen >= 1, 'el campo se desplaza al abrir el teclado');
  await page.setViewportSize({ width: 375, height: 410 });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.__keyboardScrolls), scrollsOnOpen, 'otro resize no vuelve a desplazar el mismo campo');

  // 3. Cambio de foco: pasar a otro editable mantiene los marcadores ocultos sin parpadeo
  await page.locator('#notes').focus();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'notes');
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.body.classList.contains('keyboard-open')), true);
  assert.equal(await tabs.isVisible(), false, 'los marcadores siguen ocultos al cambiar de foco entre editables');

  // 4. Cierre y desenfoque: al cerrar teclado y desenfocar, los marcadores reaparecen
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
  await page.setViewportSize({ width: 375, height: 760 });
  await page.waitForFunction(() => !document.body.classList.contains('keyboard-open'));
  assert.equal(await tabs.isVisible(), true, 'los marcadores reaparecen al cerrar el teclado');

  // 5. En escritorio (> 699px), los marcadores se mantienen siempre visibles
  await page.setViewportSize({ width: 1024, height: 420 });
  await page.locator('#notes').focus();
  await page.waitForTimeout(100);
  assert.equal(await tabs.isVisible(), true, 'en escritorio los marcadores se mantienen visibles');

  assert.deepEqual(errors, []);
  await context.close();
});

await test('mobile sin visualViewport: el foco solo no oculta marcadores (T6)', async () => {
  const { page, errors, context } = await newPage(browser, { viewport: { width: 375, height: 760 } });
  await context.addInitScript(() => { Object.defineProperty(window, 'visualViewport', { value: undefined }); });
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/hoy');
  await page.locator('#intention').focus();
  assert.equal(await page.locator('#tabs').isVisible(), true, 'el foco sin reducción de altura deja visibles los marcadores');
  await page.setViewportSize({ width: 375, height: 420 });
  await page.waitForFunction(() => document.body.classList.contains('keyboard-open'));
  assert.equal(await page.locator('#tabs').isVisible(), false, 'la altura reducida con foco oculta los marcadores');
  await page.locator('#notes').focus();
  assert.equal(await page.evaluate(() => document.body.classList.contains('keyboard-open')), true, 'el cambio de foco conserva el estado');
  await page.locator('#notes').evaluate((el) => el.blur());
  await page.waitForFunction(() => !document.body.classList.contains('keyboard-open'));
  assert.equal(await page.locator('#tabs').isVisible(), true, 'los marcadores vuelven al perder foco');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('pantalla única: tocar un día abre su cuadro, cerrar vuelve al calendario, meses con un toque', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await addFeeling(page, 'motivada');
  await page.waitForTimeout(400);
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  assert.match(page.url(), /#\/calendario/);
  // De fondo, la semana-planner (A6), que ya muestra la emoción de hoy; el mes queda a un toque.
  await page.waitForFunction((k) => { const c = document.querySelector(`#main .week-day[data-date="${k}"] .week-day__feelings`); return c && /motivada/.test(c.textContent); }, TODAY, { timeout: 4000 });
  await page.click('#main .cal-mode button:has-text("Mes")');
  await page.waitForFunction((k) => { const c = document.querySelector(`#main .day-cell[data-date="${k}"]`); return c && c.dataset.feeling === 'motivada'; }, TODAY, { timeout: 4000 }); // el calendario ya tiene la emoción
  // Otro día del mes
  const other = await page.$eval('.day-cell:not(.is-out)', (el) => el.dataset.date);
  await page.click(`.day-cell[data-date="${other}"]`);
  await page.waitForFunction(() => document.getElementById('panel').open);
  assert.match(page.url(), new RegExp('#/dia/' + other));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  // Saltar de mes con la tira
  await page.click('.month-chip >> nth=0');
  // El mes nuevo se arma aparte y reemplaza al viejo cuando está listo (D23): hasta entonces el chip del mes anterior sigue marcado.
  await page.waitForSelector('.months__list li:first-child .month-chip[aria-current="date"]');
  assert.match(await page.textContent('.month-chip[aria-current="date"]'), /ene/);
  assert.match(page.url(), /#\/calendario\/mes\/\d{4}-01/);
  // Marcadores: cada uno abre su cuadro, y con el cuadro abierto se pasa de uno a otro sin cerrar.
  await page.click('.tab[data-tab="hojas"]');
  await page.waitForSelector('#panel button:has-text("Nueva hoja")');
  for (const [tab, sel] of [['anio', '.hoop'], ['ajustes', '#st-name'], ['hoy', '.day-head'], ['hojas', 'button:has-text("Nueva repetición")']]) {
    await page.click(`#panel .tab[data-tab="${tab}"]`);
    await page.waitForSelector(`#panel ${sel}`);
    assert.equal(await page.getAttribute(`.tab[data-tab="${tab}"]`, 'aria-current'), 'page');
  }
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  assert.equal(await page.locator('#book > .tabs').count(), 1, 'al cerrar, los marcadores vuelven al costado del calendario');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('cerrar el cuadro vuelve al calendario aunque se haya ido y vuelto a la misma hoja', async () => {
  const { context, page, errors } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const closeToCalendar = async (why) => {
    await page.click('#panel-close');
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.getElementById('panel').open), false, why);
    assert.match(page.url(), /#\/calendario/, why);
  };
  await closeToCalendar('desde Hoy recién abierto');
  // Día → día siguiente → día anterior con las flechas (todo hacia adelante en el historial).
  await goto(page, '#/dia/2026-10-10');
  await page.click('.day-head button[aria-label*="siguiente"]');
  await page.waitForTimeout(400);
  await page.click('.day-head button[aria-label*="anterior"]');
  await page.waitForTimeout(400);
  assert.match(page.url(), /#\/dia\/2026-10-10/);
  await closeToCalendar('después de ir y volver con las flechas');
  // Páginas → Ajustes → Páginas con los marcadores.
  await goto(page, '#/paginas');
  await goto(page, '#/ajustes');
  await goto(page, '#/paginas');
  await closeToCalendar('después de ir y volver entre marcadores');
  // Una ruta que no existe se reemplaza por el calendario y no deja pasos fantasma.
  await goto(page, '#/no-existe');
  await goto(page, '#/rutinas');
  await closeToCalendar('después de una ruta inválida');
  // “Atrás” del navegador sigue funcionando como siempre.
  await goto(page, '#/hoy');
  await page.goBack();
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => document.getElementById('panel').open), false, 'atrás cierra el cuadro');
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
      const over = await page.evaluate(() => { const p = document.getElementById('panel'); return Math.max(document.documentElement.scrollWidth - window.innerWidth, p.open ? p.scrollWidth - p.clientWidth : 0); });
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
  await page.click('button:has-text("Nueva repetición")');
  await page.click('dialog.sheet button:has-text("Que se repita")');
  assert.equal(await page.getAttribute('#rt-title', 'aria-invalid'), 'true');
  assert.match(await page.textContent('#rt-title-err'), /nombre/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'rt-title');
  await context.close();
});

await test('motion: todas las personas empiezan en “Completas”; se puede bajar en Ajustes y queda', async () => {
  const { page, context } = await newPage(browser, { reducedMotion: 'reduce' });
  await page.goto(FILE_URL);
  await onboard(page);
  assert.equal(await page.getAttribute('html', 'data-motion'), 'completas');
  await goto(page, '#/ajustes');
  assert.match(await page.textContent('#panel'), /si las animaciones te marean/);
  await page.click('.motion-choice:has-text("Reducidas")');
  await page.waitForTimeout(300);
  assert.equal(await page.getAttribute('html', 'data-motion'), 'reducidas');
  assert.equal(await page.evaluate(() => MC.motion.allows('scenes')), false);
  await page.reload();
  await openCover(page);
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'reducidas');
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

await test('DA1: editar un día en papelera conserva lo anterior; la papelera y la retención incluyen lo borrado', async () => {
  for (const width of [1280, 375]) {
    const { page, context, errors } = await newPage(browser, { viewport: { width, height: 860 } });
    await page.goto(FILE_URL);
    await onboard(page);
    await page.evaluate(async () => {
      const day = MC.model.emptyDay(MC.dates.today());
      day.notes = 'Lo que ya había escrito';
      day.privacy = { noMemory: true, noInsights: true, noReviews: true };
      await MC.model.saveDay(day);
      await MC.model.sendToTrash('days', day.date);
      const image = await MC.model.saveImage({ name: 'Flor', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
      await MC.model.deleteImage(image.id);
      const old = await MC.model.savePage({ title: 'Para recuperar' });
      await MC.model.sendToTrash('pages', old.id, new Date(Date.now() - 20 * 86400000).toISOString());
    });
    await goto(page, await page.evaluate(() => MC.routes.settings()));
    await page.getByRole('button', { name: 'Ver papelera', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.trash-item').length === 3);
    await page.selectOption('#st-retention', '7');
    await page.waitForFunction(() => document.querySelector('#st-retention-note').textContent.includes('1 cosa se borraría'));
    await goto(page, await page.evaluate(() => MC.routes.today()));
    await page.waitForFunction(() => document.querySelector('#notes').value === 'Lo que ya había escrito');
    assert.equal(await page.getByText('Este día está en la papelera.', { exact: false }).isVisible(), true);
    await page.fill('#notes', 'Lo que ya había escrito y algo nuevo');
    await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'saved');
    assert.equal(await page.evaluate(async () => (await MC.store.get('days', MC.dates.today())).deletedAt), null);
    await page.fill('#notes', 'Lo que ya había escrito y otra cosa');
    await page.waitForFunction(() => document.querySelector('.day-head .saved-note').dataset.state === 'saved');
    assert.equal(await page.evaluate(async () => (await MC.store.get('days', MC.dates.today())).notes), 'Lo que ya había escrito y otra cosa');
    assert.equal(await page.evaluate(async () => (await MC.model.getDay(MC.dates.today())).privacy.noInsights), true);
    assert.equal(await page.getByText('Este día está en la papelera.', { exact: false }).isVisible(), false);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await context.close();
  }
});

/* ---------- A0: la base nunca cae a memoria por una pestaña vieja o una versión más nueva ---------- */
const BLANK_URL = `http://127.0.0.1:${PORT}/manifest.webmanifest`; // misma origen que el cuaderno, sin la app

await test('base: una pestaña vieja que la retiene avisa y espera; nunca modo memoria (A0)', async () => {
  const { page, context, errors } = await newPage(browser);
  const old = await context.newPage();
  await old.goto(BLANK_URL);
  // Una “pestaña vieja”: abre la base en una versión anterior y no la suelta.
  await old.evaluate(() => new Promise((res, rej) => {
    const r = indexedDB.open('mi-cuaderno', 1);
    r.onsuccess = () => { window.__db = r.result; res(); };
    r.onerror = () => rej(r.error);
  }));
  await page.goto(HTTP_URL);
  await page.waitForSelector('.store-notice[data-kind="blocked"]', { timeout: 5000 });
  assert.equal(await page.locator('.storage-warning:not(.store-notice)').count(), 0);
  await old.evaluate(() => window.__db.close());
  await page.locator('.cover__board').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.store-notice').count(), 0);
  assert.equal(await page.evaluate(() => MC.store.kind()), 'indexeddb');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('base: si ya es de una versión más nueva, pide recargar y no escribe en el aire (A0)', async () => {
  const { page, context } = await newPage(browser);
  const other = await context.newPage();
  await other.goto(BLANK_URL);
  await other.evaluate(() => new Promise((res, rej) => {
    const r = indexedDB.open('mi-cuaderno', 99);
    r.onsuccess = () => { r.result.close(); res(); };
    r.onerror = () => rej(r.error);
  }));
  await page.goto(HTTP_URL);
  await page.waitForSelector('.store-notice[data-kind="newer"]', { timeout: 5000 });
  assert.equal(await page.evaluate(() => MC.store.kind()), null);
  assert.equal(await page.locator('.cover__board').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Recargar' }).isVisible(), true);
  await context.close();
});

await test('base: si otra pestaña la actualiza, lo que se estaba escribiendo se guarda antes de soltarla (A0)', async () => {
  const { page, context } = await newPage(browser);
  await page.goto(HTTP_URL);
  await onboard(page);
  await page.fill('#notes', 'justo antes de actualizar');
  // Sin esperar el guardado, otra pestaña pide una versión nueva de la base.
  const other = await context.newPage();
  await other.goto(BLANK_URL);
  const notes = await other.evaluate((today) => new Promise((res, rej) => {
    const r = indexedDB.open('mi-cuaderno', 99);
    r.onsuccess = () => {
      const db = r.result;
      const g = db.transaction('days').objectStore('days').get(today);
      g.onsuccess = () => { db.close(); res(g.result ? g.result.notes : null); };
      g.onerror = () => rej(g.error);
    };
    r.onerror = () => rej(r.error);
  }), TODAY);
  assert.equal(notes, 'justo antes de actualizar');
  await context.close();
});

await test('base: una base vieja (IDB v2, datos y borrador v4) se actualiza a v4 con el contrato v6 sin perder nada, y de nuevo es idempotente (A3, A13)', async () => {
  const { page, context, errors } = await newPage(browser);
  const seed = await context.newPage();
  await seed.goto(BLANK_URL);
  await seed.evaluate((today) => new Promise((res, rej) => {
    const r = indexedDB.open('mi-cuaderno', 2);
    r.onupgradeneeded = () => {
      const db = r.result;
      db.createObjectStore('meta', { keyPath: 'key' });
      db.createObjectStore('days', { keyPath: 'date' });
      const a = db.createObjectStore('activities', { keyPath: 'id' }); a.createIndex('date', 'date'); a.createIndex('routineId', 'routineId');
      db.createObjectStore('routines', { keyPath: 'id' });
      const p = db.createObjectStore('pages', { keyPath: 'id' }); p.createIndex('updatedAt', 'updatedAt');
      db.createObjectStore('images', { keyPath: 'id' });
      const f = db.createObjectStore('files', { keyPath: 'id' }); f.createIndex('owner', 'owner');
    };
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction(['meta', 'days', 'routines', 'pages', 'files'], 'readwrite');
      const at = '2026-10-01T09:00:00.000Z';
      tx.objectStore('meta').put({ key: 'settings', value: { name: 'Nicole', onboarded: true, showCover: false, cover: 'rosa', moodLabels: ['pesado', 'bajito', 'normal', 'bien', 'muy bien'], motion: 'ninguna', motionChosen: true } });
      tx.objectStore('meta').put({ key: 'createdAt', value: '2026-09-01T10:00:00.000Z' });
      tx.objectStore('days').put({ date: today, morning: { mood: 4, at }, evening: { mood: null, at: null }, intention: '', notes: 'escrito en la versión vieja', energy: null, sleep: null, reflection: { good: '', hard: '', lovely: '', keep: '', free: '' }, stickers: [], createdAt: at, updatedAt: at });
      tx.objectStore('routines').put({ id: 'rut_1', title: 'Regar', rule: { type: 'daily' }, startDate: '2026-09-01', endDate: null, moment: null, archived: false, createdAt: at, updatedAt: at });
      tx.objectStore('pages').put({ id: 'pag_1', title: 'Ideas viejas', template: 'blank', kind: 'list', paper: 'punteado', body: '', items: [{ id: 'i1', text: 'la plaza' }], pinned: false, date: today, stickers: [], createdAt: at, updatedAt: at });
      tx.objectStore('files').put({ id: 'fil_1', owner: 'day:' + today, name: 'entrada.txt', type: 'text/plain', size: 4, data: 'data:text/plain;base64,aG9sYQ==', createdAt: at });
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => rej(tx.error);
    };
    r.onerror = () => rej(r.error);
  }), TODAY);
  // Un borrador con la forma vieja, más nuevo que lo guardado (D13): se tiene que recuperar.
  await seed.evaluate((today) => localStorage.setItem('mc.ui.draft.' + today, JSON.stringify({ at: Date.now(), day: { date: today, morning: { mood: 2, at: null }, notes: 'borrador más nuevo' } })), TODAY);
  await seed.close();
  const check = async () => {
    await page.waitForSelector('.day-head');
    await page.waitForFunction(() => document.querySelector('#notes') && document.querySelector('#notes').value === 'borrador más nuevo');
    const readDb = () => page.evaluate((today) => new Promise((res) => {
      const r = indexedDB.open('mi-cuaderno');
      r.onsuccess = () => {
        const d = r.result;
        const tx = d.transaction(['files', 'pages', 'days', 'meta'], 'readonly');
        const out = { version: d.version, stores: Array.from(d.objectStoreNames).sort(), pageIdx: Array.from(tx.objectStore('pages').indexNames).sort() };
        tx.objectStore('files').get('fil_1').onsuccess = (e) => { out.fileUpdatedAt = e.target.result.updatedAt; };
        tx.objectStore('pages').get('pag_1').onsuccess = (e) => { const p = e.target.result; out.page = { old: 'kind' in p || 'items' in p || 'body' in p, items: (p.values.blk_items || []).map((i) => i.text), updatedAt: p.updatedAt }; };
        tx.objectStore('days').get(today).onsuccess = (e) => { const m = e.target.result.morning; out.mood = 'mood' in m ? m.mood : 'sin mood'; out.feelings = m.feelings; };
        tx.objectStore('meta').get('preV6').onsuccess = (e) => { const v = e.target.result && e.target.result.value; out.snap = v ? { days: v.days.map((x) => x.morning.mood), pages: v.pages.map((x) => x.kind), labels: !!v.settings.moodLabels } : null; };
        tx.objectStore('meta').get('settings').onsuccess = (e) => { out.settingsOld = 'moodLabels' in e.target.result.value; };
        tx.oncomplete = () => { d.close(); res(out); };
      };
    }), TODAY);
    // El borrador recuperado se escribe un instante después de mostrarse.
    let db = await readDb();
    for (let i = 0; i < 20 && !(db.feelings && db.feelings[0] === 'bajito'); i++) { await page.waitForTimeout(100); db = await readDb(); }
    assert.equal(db.version, 5);
    assert.deepEqual(db.stores, ['activities', 'days', 'files', 'images', 'marks', 'meta', 'outbox', 'pages', 'routines', 'templates', 'weeks']);
    assert.deepEqual(db.pageIdx, ['date', 'updatedAt']);
    assert.equal(db.fileUpdatedAt, '2026-10-01T09:00:00.000Z');
    assert.deepEqual(db.page, { old: false, items: ['la plaza'], updatedAt: '2026-10-01T09:00:00.000Z' }, 'la página pasó a bloque sin tocar updatedAt');
    assert.equal(db.mood, 'sin mood');
    assert.deepEqual(db.feelings, ['bajito'], 'el borrador (forma vieja, ánimo 2) se guardó como su palabra');
    assert.deepEqual(db.snap, { days: [4], pages: ['list'], labels: true }, 'la instantánea guarda cómo estaba antes');
    assert.equal(db.settingsOld, false);
    assert.equal(await page.locator('#panel .activity:has-text("Regar")').count(), 1);
  };
  await page.goto(HTTP_URL + '#/hoy');
  await check();
  await page.reload();
  await check();
  assert.deepEqual(errors, []);
  await context.close();
});

await test('A13: base v5 (IDB v3) → v6; si el contrato falla queda como estaba y se lee igual; la copia de antes se descarga y se vuelve a abrir', async () => {
  const seedV3 = async (context) => {
    const seed = await context.newPage();
    await seed.goto(BLANK_URL);
    await seed.evaluate((today) => new Promise((res, rej) => {
      const r = indexedDB.open('mi-cuaderno', 3);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore('meta', { keyPath: 'key' });
        db.createObjectStore('days', { keyPath: 'date' });
        const a = db.createObjectStore('activities', { keyPath: 'id' }); a.createIndex('date', 'date'); a.createIndex('routineId', 'routineId');
        db.createObjectStore('routines', { keyPath: 'id' });
        const p = db.createObjectStore('pages', { keyPath: 'id' }); p.createIndex('updatedAt', 'updatedAt'); p.createIndex('date', 'date');
        db.createObjectStore('images', { keyPath: 'id' });
        const f = db.createObjectStore('files', { keyPath: 'id' }); f.createIndex('owner', 'owner');
        db.createObjectStore('weeks', { keyPath: 'week' });
        db.createObjectStore('templates', { keyPath: 'id' });
        const m = db.createObjectStore('marks', { keyPath: 'id' }); m.createIndex('sourceId', 'sourceId');
      };
      r.onsuccess = () => {
        const db = r.result;
        const tx = db.transaction(['meta', 'days', 'pages'], 'readwrite');
        const at = '2026-10-01T09:00:00.000Z';
        tx.objectStore('meta').put({ key: 'settings', value: { name: 'Nicole', onboarded: true, showCover: false, cover: 'rosa', moodLabels: ['mal', 'flojo', 'más o menos', 'lindo', 're lindo'], legacyMoodLabels: ['mal', 'flojo', 'más o menos', 'lindo', 're lindo'], motion: 'ninguna', motionChosen: true } });
        tx.objectStore('days').put({ date: today, morning: { mood: 4, feelings: null, at }, evening: { mood: null, feelings: null, at: null }, intention: '', notes: 'escrito en v5', energy: null, sleep: null, reflection: { good: '', hard: '', lovely: '', keep: '', free: '' }, stickers: [], createdAt: at, updatedAt: at });
        tx.objectStore('pages').put({ id: 'pag_v', title: 'Carta', template: 'letter', kind: 'text', paper: 'rayado', body: 'Querida persona del futuro:', items: [], blocks: null, values: {}, pinned: false, date: today, stickers: [], createdAt: at, updatedAt: at });
        tx.oncomplete = () => { db.close(); res(); };
        tx.onerror = () => rej(tx.error);
      };
      r.onerror = () => rej(r.error);
    }), TODAY);
    await seed.close();
  };
  const dbInfo = (page) => page.evaluate((today) => new Promise((res) => {
    const r = indexedDB.open('mi-cuaderno');
    r.onsuccess = () => {
      const d = r.result, out = { version: d.version };
      const tx = d.transaction(['days', 'pages', 'meta'], 'readonly');
      tx.objectStore('days').get(today).onsuccess = (e) => { out.morning = e.target.result.morning; };
      tx.objectStore('pages').get('pag_v').onsuccess = (e) => { out.kind = e.target.result.kind; };
      tx.objectStore('meta').get('preV6').onsuccess = (e) => { out.snap = !!e.target.result; };
      tx.oncomplete = () => { d.close(); res(out); };
    };
  }), TODAY);

  // 1. El contrato falla: la base sigue en v3, intacta, y el cuaderno la lee con sus palabras.
  {
    const { page, context, errors } = await newPage(browser);
    await seedV3(context);
    await page.addInitScript(() => { window.__mcFailContract = true; });
    await page.goto(HTTP_URL + '#/hoy');
    await page.waitForSelector('.day-head');
    await page.waitForSelector('.toast:has-text("quedó como estaba")');
    const info = await dbInfo(page);
    assert.equal(info.version, 3);
    assert.equal(info.morning.mood, 4, 'nada se reescribió');
    assert.equal(info.kind, 'text');
    assert.equal(info.snap, false);
    assert.match(await page.textContent('#panel'), /lindo/, 'el ánimo 4 se lee con el nombre de esa persona');
    assert.equal(await page.inputValue('#notes'), 'escrito en v5');
    assert.deepEqual(errors, []);
    await context.close();
  }
  // 2. El contrato anda: v4, con instantánea; “Descargar la copia de antes” da una copia v5 que se vuelve a abrir.
  {
    const { page, context, errors } = await newPage(browser);
    await seedV3(context);
    await page.goto(HTTP_URL + '#/hoy');
    await page.waitForSelector('.day-head');
    const info = await dbInfo(page);
    assert.equal(info.version, 5);
    assert.deepEqual(info.morning.feelings, ['lindo'], 'con los nombres de esa persona');
    assert.equal('mood' in info.morning, false);
    assert.equal(info.kind, undefined);
    assert.equal(info.snap, true);
    await goto(page, '#/ajustes');
    await page.waitForSelector('.prev6:not([hidden])');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('.prev6 button:has-text("Descargar la copia de antes")')]);
    const text = fs.readFileSync(await download.path(), 'utf8');
    const copy = JSON.parse(text);
    assert.equal(copy.schemaVersion, 5);
    assert.equal(copy.data.days.find((d) => d.date === TODAY).morning.mood, 4);
    assert.equal(copy.data.pages.find((p) => p.id === 'pag_v').kind, 'text');
    assert.deepEqual(copy.data.meta.settings.moodLabels, ['mal', 'flojo', 'más o menos', 'lindo', 're lindo']);
    const v = await page.evaluate((t) => { const r = MC.backup.validate(t); return { ok: r.ok, feelings: r.ok && r.payload.days[0].morning.feelings }; }, text);
    assert.deepEqual(v, { ok: true, feelings: ['lindo'] }, 'la copia de antes se vuelve a abrir (y se contrae igual)');
    // “Ya no la necesito”.
    await page.click('.prev6 button:has-text("Ya no la necesito")');
    await page.click('dialog.sheet button:has-text("Borrar la copia")');
    await page.waitForSelector('.prev6[hidden]', { state: 'attached' });
    assert.equal((await dbInfo(page)).snap, false);
    assert.deepEqual(errors, []);
    await context.close();
  }
});

/* ---------- A1: arreglos de base ---------- */
/** Después de borrar una página, el índice tiene que responder: el enlace está arriba de todo y no queda nada colgado. */
async function assertIndexAlive(page, label) {
  await page.waitForSelector('.toc__link');
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.toc__link')];
    const hits = links.map((a) => {
      const r = a.getBoundingClientRect();
      const x = r.left + Math.min(40, r.width / 2), y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      return { ok: !!top && a.contains(top), title: a.textContent.trim(), x: Math.round(x), y: Math.round(y),
        top: top ? top.tagName.toLowerCase() + (top.id ? '#' + top.id : '') + (top.className && typeof top.className === 'string' ? '.' + top.className.trim().replace(/\s+/g, '.') : '') : null };
    });
    return {
      hits,
      panelScroll: document.getElementById('panel').scrollTop,
      panelAnimations: document.getElementById('panel-body').getAnimations().length,
      extraDialogs: [...document.querySelectorAll('dialog[open]')].filter((d) => d.id !== 'panel').length,
      popovers: [...document.querySelectorAll('[popover]')].filter((p) => p.matches(':popover-open')).length,
      inert: document.querySelectorAll('[inert]').length
    };
  });
  assert.ok(st.hits.length > 0 && st.hits.every((hit) => hit.ok), `${label}: algo tapa los enlaces del índice (${JSON.stringify(st)})`);
  assert.deepEqual([st.extraDialogs, st.popovers, st.inert], [0, 0, 0], `${label}: quedó algo colgado`);
  await page.mouse.move(2, 2);
  await page.hover('.toc__link >> nth=0');
  assert.equal(await page.evaluate(() => document.querySelector('.toc__link').matches(':hover')), true, `${label}: el índice no responde al mouse`);
  await page.click('.toc__link >> nth=0');
  await page.waitForSelector('.free-page .page-title');
}
async function deletePageFromMenu(page) {
  await page.click('button[aria-label="Opciones de la página"]');
  await page.click('.menu__item:has-text("Borrar la página")');
  await page.click('dialog.sheet button:has-text("Mandar a la papelera")');
}

await test('páginas: después de borrar, el índice responde siempre (decorando, con dibujo, con deshacer; file:// y http://)', async () => {
  for (const url of [FILE_URL, HTTP_URL]) {
    const { page, context, errors } = await newPage(browser);
    await page.goto(url);
    await onboard(page);
    await page.evaluate(async () => { for (const t of ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco']) await MC.model.savePage({ title: t, kind: 'text', body: 'x', date: MC.dates.today() }); });
    await goto(page, await page.evaluate(() => MC.routes.sheets()));
    await page.click('.toc__link >> nth=0');
    await page.waitForSelector('.free-page .page-title');
    await deletePageFromMenu(page);
    await assertIndexAlive(page, 'simple');
    // Decorando: queda el modo decorar prendido al borrar.
    await page.click('button:has-text("Pegar un sticker")');
    await page.click('dialog.sheet .sticker-pick >> nth=0');
    await page.waitForSelector('.free-page.is-decorating');
    // Decorar se activa al abrir la bandeja; esperar el sticker, cuyo onClose también toma el foco.
    await page.waitForSelector('.free-page .sticker');
    await page.locator('button[aria-label="Opciones de la página"]').focus();
    await page.keyboard.press('Enter');
    await page.click('.menu__item:has-text("Borrar la página")');
    await page.click('dialog.sheet button:has-text("Mandar a la papelera")');
    await assertIndexAlive(page, 'decorando');
    // Borrar → Deshacer → borrar otra vez.
    await deletePageFromMenu(page);
    await page.click('.toast button:has-text("Deshacer")');
    await page.waitForSelector('.free-page .page-title');
    await deletePageFromMenu(page);
    await assertIndexAlive(page, 'deshacer');
    // Con teclado: Enter sobre un enlace del índice abre la página.
    await deletePageFromMenu(page);
    await page.waitForSelector('.toc__link');
    await page.locator('.toc__link >> nth=0').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.free-page .page-title');
    assert.deepEqual(errors, []);
    await context.close();
  }
  // Táctil en el celular.
  const { page, context, errors } = await newPage(browser, { viewport: { width: 375, height: 812 }, hasTouch: true });
  await page.goto(FILE_URL);
  await onboard(page);
  await page.evaluate(async () => { for (const t of ['Uno', 'Dos']) await MC.model.savePage({ title: t, kind: 'text', body: 'x', date: MC.dates.today() }); });
  await goto(page, await page.evaluate(() => MC.routes.sheets()));
  await page.click('.toc__link >> nth=0');
  await page.waitForSelector('.free-page .page-title');
  await deletePageFromMenu(page);
  await page.waitForSelector('.toc__link');
  await page.waitForTimeout(300);
  await page.locator('.toc__link >> nth=0').tap();
  await page.waitForSelector('.free-page .page-title');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('?debug=hit muestra qué queda bajo el puntero, también con un cuadro abierto', async () => {
  const { page, context, errors } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.goto(FILE_URL + '?debug=hit#/hoy');
  await openCover(page);
  await page.waitForSelector('.day-head');
  await page.mouse.move(300, 300);
  await page.mouse.move(320, 310);
  await page.waitForFunction(() => { const d = document.querySelector('.hit-debug'); return d && /bajo el puntero/.test(d.textContent) && /dialog#panel/.test(d.textContent) && !!d.closest('dialog'); });
  assert.deepEqual(errors, []);
  await context.close();
});

await test('escenas: salir de una hoja mientras se decora no las deja trabadas', async () => {
  const { page, context, errors } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.evaluate(async () => { await MC.model.savePage({ title: 'Para decorar', kind: 'text', body: 'x', date: MC.dates.today() }); });
  await goto(page, await page.evaluate(() => MC.routes.sheets()));
  await page.click('.toc__link >> nth=0');
  await page.click('button:has-text("Pegar un sticker")');
  await page.click('dialog.sheet .sticker-pick >> nth=0');
  await page.waitForSelector('.free-page.is-decorating');
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  assert.deepEqual(await page.evaluate(() => MC.scenes.state()), { decorating: false, dialogs: 0, running: false });
  assert.deepEqual(errors, []);
  await context.close();
});

await test('menú: uno que se cerró enseguida no cierra el próximo', async () => {
  const { page, context, errors } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.evaluate(async () => { await MC.model.savePage({ title: 'Con menú', kind: 'text', body: 'x', date: MC.dates.today() }); });
  await goto(page, await page.evaluate(() => MC.routes.sheets()));
  await page.click('.toc__link >> nth=0');
  await page.waitForSelector('.free-page .page-title');
  // Un menú que se abre y se cierra en el mismo instante (p. ej. al cambiar de vista).
  await page.evaluate(() => { const a = document.querySelector('button[aria-label="Opciones de la página"]'); MC.c.menu(a, [{ label: 'x', onSelect() {} }]); MC.c.closeMenu(false); });
  await page.waitForTimeout(50);
  await page.click('button[aria-label="Opciones de la página"]');
  await page.click('.menu__item:has-text("Privacidad de esta página")');
  await page.waitForSelector('dialog.sheet:has-text("Privacidad de esta página")');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('volver al calendario: doble cierre, arranque directo en un cuadro y recarga (T7)', async () => {
  const { page, context, errors } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  // Al terminar la bienvenida, cerrar Hoy vuelve al calendario y “atrás” no muestra la bienvenida.
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  assert.equal(await page.evaluate(() => MC.app.parse(location.hash).kind), 'base');
  // Doble cierre: dos pedidos seguidos retroceden una sola vez.
  await page.click('.tab[data-tab="anio"]');
  await page.waitForFunction(() => document.getElementById('panel').open);
  await page.click('.tab[data-tab="ajustes"]');
  await page.waitForSelector('#panel .settings-page, #panel h1');
  await page.evaluate(() => { MC.app.closePanel(); MC.app.closePanel(); MC.app.closePanel(); });
  await page.waitForFunction(() => !document.getElementById('panel').open);
  await page.waitForTimeout(400);
  assert.ok(page.url().startsWith('file:'), 'el doble cierre sacó a la persona del cuaderno');
  assert.equal(await page.evaluate(() => MC.app.parse(location.hash).kind), 'base');
  // Recarga con un cuadro abierto: cerrar vuelve por el historial (adelante sigue estando el cuadro).
  await page.click('.tab[data-tab="hoy"]');
  await page.waitForSelector('.day-head');
  await page.reload();
  await openCover(page);
  await page.waitForSelector('.day-head');
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  await page.goForward();
  await page.waitForSelector('.day-head');
  assert.deepEqual(errors, []);
  await context.close();
  // Arranque directo en un cuadro (PWA #/hoy, notificación): cerrar no suma pasos y “atrás” no lo reabre.
  const second = await newPage(browser);
  await second.page.goto(FILE_URL);
  await onboard(second.page);
  const fresh = await second.context.newPage();
  await fresh.goto(FILE_URL + '#/hoy');
  await openCover(fresh);
  await fresh.waitForSelector('.day-head');
  await fresh.click('#panel-close');
  await fresh.waitForFunction(() => !document.getElementById('panel').open);
  assert.equal(await fresh.evaluate(() => MC.app.parse(location.hash).kind), 'base');
  await fresh.goBack().catch(() => {});
  await fresh.waitForTimeout(300);
  assert.ok(!fresh.url().includes('#/hoy'), 'atrás volvió a abrir Hoy');
  await second.context.close();
});

/** Simula la nube sobre el servidor local: la marca <meta name="mc-cloud"> (como tools/copy-notebook.mjs) y la API. */
async function cloudContext(state) {
  // Sin service worker: las respuestas simuladas no pasan por su caché (en la nube, la caché ya trae la marca).
  const ctx = await newPage(browser, { serviceWorkers: 'block' });
  const { context } = ctx;
  await context.route((url) => /^\/(index\.html)?$/.test(url.pathname), async (route) => {
    const res = await route.fetch({ url: `http://127.0.0.1:${PORT}/index.html` });
    const html = (await res.text()).replace('<meta name="viewport"', '<meta name="mc-cloud" content="1">\n  <meta name="viewport"');
    await route.fulfill({ status: 200, body: html, headers: { 'content-type': 'text/html; charset=utf-8' } });
  });
  await context.route('**/api/me', (route) => route.fulfill({ status: state.meStatus || 200, contentType: 'application/json', body: JSON.stringify(state.meStatus === 401 ? { error: 'Sin sesión.' } : state.me) }));
  await context.route('**/api/auth/logout', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await context.route('**/entrar', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Entrar</title><p id="entrar">entrar</p>' }));
  await context.route('**/cuenta', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Mi cuenta</title><p id="cuenta">cuenta</p>' }));
  state.pushes = [];
  await context.route('**/api/sync/push', async (route) => {
    const b = JSON.parse(route.request().postData() || '{}');
    state.pushes.push(b);
    const skipped = state.onPush ? state.onPush(b) : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, skipped }) });
  });
  await context.route('**/api/sync/pull**', (route) => {
    const u = new URL(route.request().url());
    const id = u.searchParams.get('id');
    const parts = (state.parts || []).filter((p) => !id || (p.record_id === id && p.store === u.searchParams.get('store')));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ parts, more: false }) });
  });
  // Apariencia del cuaderno de la dueña (D48).
  await context.route('**/api/look**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.look || { cover: null, theme: null }) }));
  // Storage simulado (NB1): pedazos por dueña/store/id/n.
  state.media = state.media || {};
  await context.route('**/api/media**', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT') {
      const b = JSON.parse(req.postData() || '{}');
      state.media[[b.owner || state.me.id, b.store, b.id, b.n].join('/')] = b.text;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    const u = new URL(req.url());
    const text = state.media[[u.searchParams.get('owner'), u.searchParams.get('store'), u.searchParams.get('id'), u.searchParams.get('n')].join('/')];
    return route.fulfill({ status: text ? 200 : 404, contentType: 'application/json', body: JSON.stringify(text ? { text } : { error: 'Todavía no está en la nube.' }) });
  });
  ctx.setCookie = (name, value) => context.addCookies([{ name, value, url: `http://127.0.0.1:${PORT}/` }]);
  return ctx;
}

const CA = '11111111-1111-4111-8111-111111111111', CB = '22222222-2222-4222-8222-222222222222';

await test('nube (NB2): la cola de salida vive en IndexedDB junto al cambio, sobrevive a recargar y sincroniza una sola pestaña', async () => {
  const state = { me: { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] } };
  const { page, errors, setCookie } = await cloudContext(state);
  await setCookie('mc_person', CA);
  await page.goto(HTTP_URL);
  await onboard(page);
  await page.evaluate(() => MC.sync.flush());
  await page.waitForFunction(() => MC.sync.pending() === 0, null, { timeout: 6000 });
  // Otra pestaña tiene el candado de sincronizar: esta no sube nada (no se pisan).
  await page.evaluate(() => { window.__release = null; navigator.locks.request('mc-sync-' + MC.cloud.view, () => new Promise((r) => { window.__release = r; })); });
  await page.waitForFunction(() => typeof window.__release === 'function');
  const before = state.pushes.length;
  await page.evaluate((d) => MC.model.saveDay(Object.assign(MC.model.emptyDay(d), { notes: 'en la cola' })), TODAY);
  // El cambio y su entrada en la cola se escribieron juntos.
  const queued = await page.evaluate(() => MC.store.queueAll().then((q) => q.map((x) => x.id)));
  assert.ok(queued.includes('days\u0001' + TODAY), JSON.stringify(queued));
  await page.evaluate(() => MC.sync.flush());
  await page.waitForTimeout(300);
  assert.equal(state.pushes.length, before, 'con el candado tomado por otra pestaña, no sube');
  // Se cierra antes de subir: al volver, la cola sigue ahí y sube.
  await page.evaluate(() => window.__release());
  await page.reload();
  await page.waitForSelector('#panel, .cal-page', { timeout: 6000 });
  await page.waitForFunction(() => MC.sync && MC.sync.pending() === 0, null, { timeout: 8000 });
  const day = state.pushes.slice(before).flatMap((b) => b.changes).find((c) => c.store === 'days' && c.record && c.record.notes === 'en la cola');
  assert.ok(day, 'lo que quedó en la cola subió después de recargar');
  assert.deepEqual(await page.evaluate(() => MC.store.queueAll()), []);
  assert.deepEqual(errors, []);
  await page.context().close();
});

await test('nube (D53): qué ven — Nicole oculta partes de un día, de una hoja y de Mi año; lo que llega no se las borra', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  const state = { me: { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] } };
  const { page, errors, setCookie, context } = await cloudContext(state);
  await setCookie('mc_person', CA);
  await page.goto(HTTP_URL);
  await onboard(page);
  await page.evaluate((d) => MC.model.saveDay(Object.assign(MC.model.emptyDay(d), { notes: 'solo para mí', intention: 'ir despacio' })), TODAY);
  await goto(page, '#/anio');
  await goto(page, '#/hoy');
  // Privacidad → Qué ven: destildar “Durante el día”.
  await page.click('.day-head__tools .privacy-btn');
  await page.waitForSelector('dialog.sheet .share-block');
  await page.click('dialog.sheet .share-parts label:has-text("Durante el día")');
  await page.waitForFunction((d) => MC.store.get('days', d).then((r) => r && r.hide && r.hide.fields.includes('notes')), TODAY);
  assert.match(await page.textContent('.day-head__tools .privacy-btn'), /Con privacidad/);
  await page.keyboard.press('Escape');
  await page.evaluate(() => MC.sync.flush());
  await page.waitForFunction(() => MC.sync.pending() === 0, null, { timeout: 6000 });
  const sent = state.pushes.flatMap((b) => b.changes).filter((c) => c.store === 'days' && c.key === TODAY && c.record).pop();
  assert.deepEqual(sent.record.hide, { all: false, fields: ['notes'], blocks: [] }, 'la dueña manda el registro entero con lo que oculta (el servidor lo separa)');
  // Llega un cambio de la psico (emociones) sin las notas: a Nicole no se le borran ni las notas ni lo que oculta.
  state.parts = [{ store: 'days', record_id: TODAY, section: 'emociones', data: { date: TODAY, morning: { feelings: ['tranquila'], at: null }, updatedAt: '2026-10-05T23:00:00.000Z' }, deleted_at: null, updated_at: '2026-10-05T23:00:00.000Z', updated_by: PSI },
    { store: 'days', record_id: TODAY, section: 'escritura', data: { date: TODAY, intention: 'ir despacio', updatedAt: '2026-10-05T23:00:00.000Z' }, deleted_at: null, updated_at: '2026-10-05T23:00:00.001Z', updated_by: PSI }];
  await page.evaluate(() => MC.sync.pull(true));
  const day = await page.evaluate((d) => MC.store.get('days', d), TODAY);
  assert.deepEqual(day.morning.feelings, ['tranquila']);
  assert.equal(day.notes, 'solo para mí', 'lo oculto sigue en el dispositivo de la dueña');
  assert.deepEqual(day.hide.fields, ['notes']);
  // Mi año: destildar “Lo que guardé”.
  await goto(page, '#/anio');
  await page.click('.cal-head button:has-text("Qué ven")');
  await page.click('dialog.sheet label:has-text("Lo que guardé")');
  await page.waitForFunction(() => MC.model.settings().hideYear.includes('recuerdos'));
  await page.keyboard.press('Escape');
  // Una hoja: ocultar un bloque.
  await page.evaluate(() => MC.model.savePage({ id: 'pg_q', title: 'Ideas', blocks: [{ id: 'b1', type: 'text', title: 'Lo público' }, { id: 'b2', type: 'text', title: 'Lo mío' }], values: { b1: 'hola', b2: 'secreto' } }));
  await page.evaluate(() => { location.hash = MC.routes.page('pg_q'); });
  await page.waitForSelector('.free-head');
  await page.evaluate(() => MC.views.pages && document.querySelector('.free-head .icon-btn[aria-haspopup="menu"]').click());
  await page.click('[role="menuitem"]:has-text("Privacidad")');
  await page.click('dialog.sheet .share-parts label:has-text("«Lo mío»")');
  await page.waitForFunction(() => MC.store.get('pages', 'pg_q').then((p) => p.hide && p.hide.blocks.includes('b2')));
  await page.keyboard.press('Escape');
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await context.close();
});

await test('nube (D53): quien mira no ve lo oculto de Mi año y no la saluda con el nombre de Nicole', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  const state = { me: { id: PSI, username: 'psicologa', name: 'Psicóloga', admin: false, hasNotebook: false, shares: [{ owner: CA, name: 'Nicole', sections: { emociones: 'ver', escritura: 'ver', anio: 'ver' } }] },
    parts: [{ store: 'days', record_id: TODAY, section: 'escritura', data: { date: TODAY, intention: 'ir despacio', reflection: { good: '', hard: '', nice: '', keep: 'un recuerdo', free: '' }, updatedAt: '2026-10-05T10:00:00.000Z' }, deleted_at: null, updated_at: '2026-10-05T10:00:00.000Z', updated_by: CA }],
    look: { cover: 'lavanda', theme: null, yearHide: ['recuerdos', 'grafico'] } };
  const { page, errors, setCookie, context } = await cloudContext(state);
  await setCookie('mc_person', PSI);
  await setCookie('mc_view', CA);
  await page.goto(HTTP_URL + '#/hoy');
  await page.waitForSelector('.day-head', { timeout: 8000 });
  assert.match(await page.textContent('.day-head__greet'), /Cuaderno de Nicole/);
  await page.evaluate(() => { location.hash = MC.routes.year(); });
  await page.waitForSelector('[data-year-part="mapa"]');
  await page.waitForTimeout(300);
  const vis = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-year-part]')].map((el) => [el.dataset.yearPart, !el.hidden])));
  assert.equal(vis.recuerdos, false);
  assert.equal(vis.grafico, false);
  assert.equal(vis.mapa, true);
  assert.equal(await page.locator('.cal-head button:has-text("Qué ven")').count(), 0, 'la invitada no elige qué ven');
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await context.close();
});

await test('nube (D54): Nicole en dos dispositivos — el nuevo trae lo de la otra, saltea la bienvenida y no pisa lo que falta subir', async () => {
  const T1 = '2026-10-05T10:00:00.000Z', T2 = '2026-10-05T12:00:00.000Z';
  const own = (store, id, section, data, at, n) => ({ store, record_id: id, section, data: { ...data, updatedAt: at }, deleted_at: null, updated_at: '2026-10-05T12:00:00.0' + String(n).padStart(2, '0') + 'Z', updated_by: CA });
  const state = { me: { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] },
    parts: [
      own('meta', 'settings', 'ajustes', { key: 'settings', value: { name: 'Nicole', onboarded: true, showCover: false, cover: 'lavanda' } }, T1, 1),
      own('days', TODAY, 'escritura', { date: TODAY, notes: 'lo que escribí en la compu' }, T1, 2)
    ] };
  const { page, errors, setCookie, context } = await cloudContext(state);
  await setCookie('mc_person', CA);
  await page.goto(HTTP_URL);
  // Abre directo el cuaderno (los ajustes vinieron de la nube): sin bienvenida ni tapa.
  await page.waitForSelector('.planner, .cal-page', { timeout: 10000 });
  assert.equal(await page.locator('.cover, .onboarding').count(), 0);
  await goto(page, '#/hoy');
  await page.waitForSelector('.day-head');
  assert.equal(await page.inputValue('#notes'), 'lo que escribí en la compu');
  assert.match(await page.textContent('.day-head__greet'), /Nicole/);
  // Escribe en este dispositivo: mientras no subió, lo que llega de la nube (aunque sea más nuevo) no lo pisa.
  await page.evaluate((d) => MC.model.getDay(d).then((x) => { x.notes = 'lo que escribí en el celular'; return MC.model.saveDay(x); }), TODAY);
  state.parts = [own('days', TODAY, 'escritura', { date: TODAY, notes: 'otra vez desde la compu' }, '2099-01-01T00:00:00.000Z', 3)];
  await page.evaluate(() => MC.sync.pull(false));
  assert.equal((await page.evaluate((d) => MC.store.get('days', d), TODAY)).notes, 'lo que escribí en el celular');
  // Ya subido: una versión más vieja de la otra no la pisa; una más nueva, sí.
  await page.evaluate(() => MC.sync.flush());
  await page.waitForFunction(() => MC.sync.pending() === 0, null, { timeout: 6000 });
  state.parts = [own('days', TODAY, 'escritura', { date: TODAY, notes: 'vieja de la compu' }, T1, 4)];
  await page.evaluate(() => MC.sync.pull(true));
  assert.equal((await page.evaluate((d) => MC.store.get('days', d), TODAY)).notes, 'lo que escribí en el celular');
  state.parts = [own('days', TODAY, 'escritura', { date: TODAY, notes: 'nueva de la compu' }, '2099-01-01T00:00:00.000Z', 5)];
  await page.evaluate(() => MC.sync.pull(true));
  assert.equal((await page.evaluate((d) => MC.store.get('days', d), TODAY)).notes, 'nueva de la compu');
  // Al ponerse al día no subió de nuevo lo que ya estaba en la nube igual (los ajustes de la compu).
  const pushedSettings = state.pushes.flatMap((b) => b.changes).filter((c) => c.store === 'meta' && c.record && c.record.value && c.record.value.name !== 'Nicole');
  assert.deepEqual(pushedSettings, [], 'no pisó los ajustes de la otra con los de fábrica');
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await context.close();
});

await test('nube (NB1): una foto sube su contenido en pedazos y la ficha sin él; una que llega se baja y se ve; si falta, se reintenta', async () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const state = { me: { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] } };
  const { page, errors, context, setCookie } = await cloudContext(state);
  await setCookie('mc_person', CA);
  await page.goto(HTTP_URL);
  await onboard(page);
  // Subir: el contenido va a /api/media y la ficha (sin src) a la sincronización.
  const id = await page.evaluate(async (src) => (await MC.model.saveImage({ kind: 'upload', name: 'flor de Nicole', src, w: 1, h: 1 })).id, PNG);
  await page.evaluate(() => MC.sync.flush());
  await page.waitForFunction(() => MC.sync.pending() === 0, null, { timeout: 6000 });
  assert.equal(state.media[[CA, 'images', id, 0].join('/')], PNG, 'el contenido subió entero');
  const card = state.pushes.flatMap((b) => b.changes).find((c) => c.store === 'images' && c.key === id);
  assert.ok(card && !('src' in card.record), 'la ficha no lleva el contenido');
  assert.equal(card.record.media.length, PNG.length);
  // Cambiar solo el nombre no vuelve a subir el contenido.
  const putsBefore = Object.keys(state.media).length;
  // Llega una foto de otra persona: primero sin contenido en la nube (se espera), después con él (se baja).
  const other = '33333333-3333-4333-8333-333333333333';
  const meta = { v: '2030-01-01T00:00:00.000Z:' + PNG.length, chunks: 1, length: PNG.length };
  state.parts = [{ store: 'images', record_id: 'img_remota', section: 'fotos', data: { id: 'img_remota', kind: 'upload', name: 'foto compartida', w: 1, h: 1, updatedAt: '2030-01-01T00:00:00.000Z', media: meta }, deleted_at: null, updated_at: '2030-01-01T00:00:00.000Z', updated_by: other }];
  await page.evaluate(() => MC.sync.pull());
  assert.equal(await page.evaluate(() => MC.store.get('images', 'img_remota')), undefined, 'sin contenido no se guarda una foto rota');
  state.media[[CA, 'images', 'img_remota', 0].join('/')] = PNG;
  await page.evaluate(() => MC.sync.pull());
  const got = await page.evaluate(() => MC.store.get('images', 'img_remota'));
  assert.equal(got.src, PNG);
  await page.waitForFunction(() => MC.model.images().some((i) => i.id === 'img_remota'), null, { timeout: 3000 });
  // Volver a traer la misma versión no la vuelve a bajar.
  let gets = 0;
  await context.route('**/api/media**', async (route) => { gets++; await route.fallback(); });
  await page.evaluate(() => MC.sync.pull(true));
  assert.equal(gets, 0, 'la misma versión se conserva sin bajarla de nuevo');
  assert.equal(Object.keys(state.media).length, putsBefore + 1);
  // El 404 simulado de “todavía no está en la nube” lo anota el navegador; nada más.
  assert.deepEqual(errors.filter((e) => !/404/.test(e)), []);
  await context.close();
});


await test('nube: con cuentas cada persona abre su propia base y sus preferencias; sin sesión va al ingreso (D37)', async () => {
  const state = { me: { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] } };
  const { page, errors, context, setCookie } = await cloudContext(state);

  // Sin persona: al ingreso, sin abrir ninguna base.
  await page.goto(HTTP_URL);
  await page.waitForURL(/\/entrar$/, { timeout: 4000 });

  // Nicole escribe en su cuaderno (su sesión no sabía qué cuaderno abrir: se pregunta una vez).
  await setCookie('mc_person', CA);
  await page.goto(HTTP_URL);
  await onboard(page);
  assert.equal(await page.evaluate(() => MC.cloud.mode), 'owner');
  await page.fill('#notes', 'lo de Nicole');
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => MC.cloud.suffix), '@' + CA);
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  assert.ok(dbs.includes('mi-cuaderno@' + CA), JSON.stringify(dbs));
  assert.ok(!dbs.includes('mi-cuaderno'), 'con cuentas no se usa la base sin dueña');
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('mc.ui.')));
  assert.ok(keys.every((k) => k.startsWith('mc.ui.' + CA + '.')), JSON.stringify(keys));
  // Lo escrito se sube a la nube (B5): el día con sus notas, sin dueña explícita (es el propio).
  await page.evaluate(() => MC.sync.flush());
  await page.waitForFunction(() => MC.sync.pending() === 0, null, { timeout: 6000 });
  const day = state.pushes.flatMap((b) => b.changes).find((c) => c.store === 'days' && c.record && c.record.notes === 'lo de Nicole');
  assert.ok(day, 'el día se subió: ' + JSON.stringify(state.pushes).slice(0, 300));
  assert.ok(state.pushes.every((b) => !b.owner));
  assert.ok(!state.pushes.flatMap((b) => b.changes).some((c) => (c.store === 'meta' && c.key !== 'settings') || (c.record && ('src' in c.record || 'data' in c.record))), 'lo del dispositivo no viaja, ni el contenido de fotos en la ficha');
  // Lo que edita la psicóloga (emociones) le llega a Nicole sin tocar sus notas; lo propio no se vuelve a aplicar.
  state.parts = [
    { store: 'days', record_id: TODAY, section: 'emociones', data: { date: TODAY, morning: { feelings: ['acompañada'], at: null }, updatedAt: '2030-01-01T00:00:00.000Z' }, deleted_at: null, updated_at: '2030-01-01T00:00:00.000Z', updated_by: '33333333-3333-4333-8333-333333333333' },
    { store: 'days', record_id: TODAY, section: 'escritura', data: { date: TODAY, notes: 'versión vieja propia' }, deleted_at: null, updated_at: '2030-01-01T00:00:00.001Z', updated_by: CA }
  ];
  assert.equal(await page.evaluate(() => MC.sync.pull()), 1);
  const merged = await page.evaluate((d) => MC.store.get('days', d), TODAY);
  assert.deepEqual(merged.morning.feelings, ['acompañada']);
  assert.equal(merged.notes, 'lo de Nicole');
  state.parts = [];
  // Ajustes muestra la cuenta, con enlace.
  await goto(page, '#/ajustes');
  const account = 'section[aria-labelledby="st-account"]';
  await page.waitForSelector(account);
  assert.match(await page.textContent(account), /Entraste como Nicole \(nicole\)/);
  assert.equal(await page.getAttribute(account + ' a', 'href'), '/cuenta');

  // Otra persona con cuaderno propio en el mismo navegador: cuaderno nuevo, sin lo de Nicole.
  state.me = { id: CB, username: 'otra', name: 'Otra persona', admin: false, hasNotebook: true, shares: [] };
  await setCookie('mc_person', CB);
  await setCookie('mc_view', CB);
  await page.goto(HTTP_URL);
  await onboard(page, 'Nicole');
  assert.equal(await page.inputValue('#notes'), '');

  // Sesión vencida: al ingreso.
  state.meStatus = 401;
  await page.goto(HTTP_URL);
  await page.waitForURL(/\/entrar$/, { timeout: 4000 });
  // Cookie y sesión de personas distintas: se cierra la sesión y al ingreso.
  state.meStatus = 200; state.me = { id: CA, username: 'nicole', name: 'Nicole', admin: true, hasNotebook: true, shares: [] };
  await page.goto(HTTP_URL);
  await page.waitForURL(/\/entrar$/, { timeout: 4000 });
  const real = errors.filter((e) => !/401|Failed to load resource/.test(e));
  assert.deepEqual(real, [], JSON.stringify(real));
  await context.close();
});

await test('nube: la psicóloga abre el cuaderno de Nicole, edita lo permitido y lo demás solo lo mira (D38)', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  const state = {
    me: { id: PSI, username: 'psicologa', name: 'Psicóloga', admin: false, hasNotebook: false,
      shares: [{ owner: CA, name: 'Nicole', sections: { escritura: 'ver', emociones: 'editar', actividades: 'ver' } }] },
    parts: [
      { store: 'days', record_id: TODAY, section: 'escritura', data: { date: TODAY, notes: 'lo que escribió Nicole', updatedAt: '2026-10-05T10:00:00.000Z' }, deleted_at: null, updated_at: '2026-10-05T10:00:00.000Z', updated_by: CA },
      { store: 'days', record_id: TODAY, section: 'emociones', data: { date: TODAY, morning: { feelings: ['tranquila'], at: null }, updatedAt: '2026-10-05T10:00:00.000Z' }, deleted_at: null, updated_at: '2026-10-05T10:00:00.001Z', updated_by: CA }
    ],
    // El servidor de verdad descarta lo que no se puede escribir: acá, escritura.
    onPush: () => ['escritura'],
    // Sin permiso en Ajustes igual ve la tela que eligió Nicole (D48).
    look: { cover: 'lavanda', theme: null }
  };
  const { page, errors, context, setCookie } = await cloudContext(state);
  await setCookie('mc_person', PSI);
  await setCookie('mc_view', CA);
  await page.goto(HTTP_URL + '#/hoy');
  await page.waitForSelector('.day-head', { timeout: 6000 });
  assert.equal(await page.evaluate(() => MC.cloud.mode), 'guest');
  // Sin tapa ni bienvenida: ve directo el día de Nicole, con sus notas y sus emociones.
  assert.equal(await page.inputValue('#notes'), 'lo que escribió Nicole');
  assert.match(await page.textContent('.section--mood'), /tranquila/);
  assert.match(await page.textContent('.guest-note'), /Cuaderno de Nicole · podés editar: emociones/);
  assert.equal(await page.evaluate(() => document.body.dataset.cover), 'lavanda', 'la tela de Nicole');
  // Nicole elige colores propios: en la próxima vuelta cambian acá también.
  state.look = { cover: 'lavanda', theme: { preset: 'menta', cloth: '#A9CDBF', paper: '#FBFBF3', ink: '#33433E', accents: [] } };
  await page.evaluate(() => MC.sync.pull(false));
  await page.waitForFunction(() => MC.model.settings().theme && MC.model.settings().theme.preset === 'menta', null, { timeout: 4000 });
  // Sin copia local del cuaderno de Nicole.
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  assert.ok(!dbs.some((n) => /^mi-cuaderno/.test(n)), JSON.stringify(dbs));
  // D51: escritura es solo para mirar → las notas no se pueden tocar y lo dice; emociones (editar) sí.
  assert.equal(await page.evaluate(() => document.getElementById('notes').readOnly), true);
  assert.match(await page.textContent('#q-notes'), /solo para mirar/);
  assert.equal(await page.evaluate(() => document.querySelector('.section--mood .feelings__input').readOnly), false);
  assert.equal(await page.evaluate(() => !!document.getElementById('q-list').closest('.is-lookonly')), true, 'actividades, solo para mirar');
  // Si igual llega un cambio de escritura (otra pestaña, una versión vieja), el servidor no lo guarda y se le avisa.
  await page.evaluate(async (k) => { const d = await MC.model.getDay(k); d.notes = 'intento de la psicóloga'; await MC.model.saveDay(d); }, TODAY);
  await page.evaluate(() => MC.sync.flush());
  await page.waitForSelector('.toast:not([hidden])', { timeout: 6000 });
  assert.match(await page.textContent('.toast'), /Este cuaderno es de Nicole: esta parte la podés mirar, pero no cambiar/);
  const sent = state.pushes.flatMap((b) => b.changes.map((c) => ({ ...c, owner: b.owner })));
  assert.ok(sent.length && sent.every((c) => c.owner === CA), 'todo va al cuaderno de Nicole');
  // Algo de una sección sin ningún permiso de edición (rutinas) ni siquiera se escribe en memoria.
  const blocked = await page.evaluate(() => MC.store.put('routines', { id: 'rut_x', title: 'x', rule: { type: 'daily' } }).then(() => 'ok', (e) => e.code));
  assert.equal(blocked, 'MC_READONLY');
  // Lo no compartido (hojas, repeticiones, ajustes) ni se abre: un cartel lo dice. En Ajustes, igual puede salir.
  await page.evaluate(() => { location.hash = MC.routes.sheets(); });
  await page.waitForSelector('.access-blocked');
  assert.match(await page.textContent('.access-blocked'), /no está compartida/);
  assert.equal(await page.locator('.index-page').count(), 0);
  await page.evaluate(() => { location.hash = MC.routes.settings(); });
  await page.waitForSelector('.access-blocked button:has-text("Cerrar sesión")');
  // Cerrar sesión desde el cartelito: avisa al servidor y vuelve al ingreso.
  let loggedOut = false;
  await context.route('**/api/auth/logout', (route) => { loggedOut = true; return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  // Sin permiso de Semana, las anotaciones de Importante y Notas no se muestran; las barras dependen de Actividades/Repeticiones.
  await page.waitForSelector('.planner');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.planner__important-notes, .planner__cell--notes')].every((el) => el.hidden)), true);
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.week-day .add-activity input')].every((el) => el.readOnly)), true);
  assert.equal(await page.locator('.week-progress__details').isVisible(), false, 'sin permiso de repeticiones no se ofrece programar actividades');
  await page.click('.guest-note__out');
  await page.waitForURL(/\/entrar$/, { timeout: 4000 });
  assert.ok(loggedOut, 'se cerró la sesión en el servidor');
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await context.close();
});

await test('nube (D51): matriz de permisos — en cada cuadro, nada editable fuera de lo que se puede editar', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  const T0 = '2026-10-05T10:00:00.000Z';
  const part = (store, id, section, data, n) => ({ store, record_id: id, section, data: { ...data, updatedAt: T0 }, deleted_at: null, updated_at: '2026-10-05T10:00:00.0' + String(n).padStart(2, '0') + 'Z', updated_by: CA });
  const WK = await (async () => { const d = new Date(TODAY + 'T12:00:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.toISOString().slice(0, 10); })();
  const parts = [
    part('days', TODAY, 'escritura', { date: TODAY, notes: 'lo que escribió Nicole', intention: 'ir despacio', reflection: { good: 'el mate', hard: '', nice: '', keep: '', free: '' } }, 1),
    part('days', TODAY, 'emociones', { date: TODAY, morning: { feelings: ['tranquila'], at: null }, evening: { feelings: ['cansada'], at: null }, energy: 2 }, 2),
    part('activities', 'act_x', 'actividades', { id: 'act_x', date: TODAY, title: 'caminar', status: 'done', order: 0 }, 3),
    part('activities', 'act_x', 'emociones', { id: 'act_x', date: TODAY, feel: { before: ['inquieta'], after: ['tranquila'] } }, 4),
    part('pages', 'pg_n', 'hojas', { id: 'pg_n', title: 'Ideas', date: TODAY, blocks: [{ id: 'b1', type: 'text', title: '' }], values: { b1: 'algo' } }, 5),
    part('routines', 'rut_n', 'repeticiones', { id: 'rut_n', title: 'Regar', rule: { type: 'daily' }, startDate: TODAY }, 6),
    part('weeks', WK, 'semana', { week: WK, important: [{ id: 'i1', text: 'turno', done: false }], notes: 'semana tranquila' }, 7)
  ];
  const ALL = ['semana', 'actividades', 'emociones', 'escritura', 'hojas', 'repeticiones', 'fotos', 'anio', 'ajustes'];
  const COMBOS = [
    { escritura: 'ver' },
    { emociones: 'ver', actividades: 'ver' },
    { emociones: 'editar', escritura: 'ver', actividades: 'ver' },
    { hojas: 'ver' },
    { hojas: 'editar', repeticiones: 'ver' },
    { semana: 'editar', actividades: 'ver' },
    { semana: 'ver', repeticiones: 'editar', actividades: 'ver' },
    { semana: 'editar', repeticiones: 'ver', actividades: 'editar' },
    { repeticiones: 'editar' },
    { anio: 'ver', ajustes: 'ver', fotos: 'ver' },
    Object.fromEntries(ALL.map((x) => [x, 'ver'])),
    Object.fromEntries(ALL.map((x) => [x, 'editar']))
  ];
  const VIEWS = { today: ['actividades', 'emociones', 'escritura', 'fotos', 'hojas'], sheets: ['hojas', 'repeticiones'], page: ['hojas'], year: ['anio', 'emociones', 'actividades', 'escritura'], settings: ['ajustes'] };
  const problems = [];
  for (const sections of COMBOS) {
    const state = { me: { id: PSI, username: 'psicologa', name: 'Psicóloga', admin: false, hasNotebook: false, shares: [{ owner: CA, name: 'Nicole', sections }] }, parts, onPush: () => [] };
    const { page, errors, context, setCookie } = await cloudContext(state);
    await setCookie('mc_person', PSI);
    await setCookie('mc_view', CA);
    await page.goto(HTTP_URL + '#/semana/' + TODAY);
    await page.waitForSelector('.planner', { timeout: 8000 });
    // D55: incluir el botón de programar en la matriz, aunque los objetivos nazcan plegados.
    const goals = page.locator('.week-progress__details');
    if (await goals.isVisible()) await goals.evaluate(el => { el.open = true; });
    const label = JSON.stringify(sections);
    const scan = (where) => page.evaluate(([where]) => {
      const root = where === 'base' ? document.getElementById('main') : document.getElementById('panel-body');
      const out = [];
      const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
      root.querySelectorAll('input, textarea, select, button').forEach((c) => {
        if (!visible(c)) return;
        const editable = (c.tagName === 'BUTTON' || c.tagName === 'SELECT' || ['checkbox', 'radio', 'file', 'date', 'color'].includes(c.type)) ? !c.disabled : !(c.readOnly || c.disabled);
        if (!editable) return;
        // Moverse no cambia nada: flechas, mes/semana, días del año, meses, pestañas de período.
        if (c.closest('.cal-head, .day-head__row, .months, .access-blocked, #st-account')) return;
        // Mirar más (desplegar) y elegir qué período ver tampoco cambian nada; Mi año solo lee.
        if (c.hasAttribute('aria-expanded') && !c.hasAttribute('aria-haspopup')) return;
        if (c.matches('.stitch-cell, .year-page .choice, .year-notes .choice')) return;
        // D62: filtros e índices de lectura no escriben ni conceden permisos de edición.
        if (c.dataset.browse === '1' && (c.closest('.record-calendar, .date-range, .notebook-search, .photo-album') || c.matches('.year-album__photo, .attachment__open, .attachment__download'))) return;
        const zone = c.closest('[data-access]');
        const lv = zone ? zone.dataset.access : 'sin-parte';
        if (lv === 'editar') return;
        out.push(lv + ': ' + (c.getAttribute('aria-label') || c.textContent.trim().slice(0, 30) || c.placeholder || c.tagName) + ' [' + (c.className || c.tagName) + ']');
      });
      return out;
    }, [where]);
    // La semana del fondo.
    await page.waitForTimeout(500);
    for (const p of await scan('base')) problems.push(label + ' semana · ' + p);
    for (const [view, need] of Object.entries(VIEWS)) {
      await page.evaluate((v) => {
        const R = MC.routes;
        location.hash = v === 'today' ? R.today() : v === 'sheets' ? R.sheets() : v === 'page' ? R.page('pg_n') : v === 'year' ? R.year ? R.year() : '#/anio' : R.settings();
      }, view);
      await page.waitForFunction(() => document.getElementById('panel').open);
      await page.waitForTimeout(700);
      const allowed = need.some((x) => sections[x]);
      const blocked = await page.locator('#panel-body .access-blocked').count();
      if (allowed && blocked) problems.push(label + ' ' + view + ' · se bloqueó aunque tiene permiso');
      if (!allowed && !blocked) problems.push(label + ' ' + view + ' · se abrió sin permiso');
      if (allowed && !blocked) for (const p of await scan('panel')) problems.push(label + ' ' + view + ' · ' + p);
      // Y al revés: lo que se puede editar no queda trabado.
      if (view === 'today' && !blocked) {
        const st = await page.evaluate(() => ({ notes: !!document.getElementById('notes') && !document.getElementById('notes').readOnly && !!document.getElementById('notes').offsetParent, mood: !!document.querySelector('.section--mood .feelings__input') && !document.querySelector('.section--mood .feelings__input').readOnly && !!document.querySelector('.section--mood .feelings__input').offsetParent, add: !!document.querySelector('#q-list ~ * .add-activity input, .add-activity input') && !!document.querySelector('.add-activity input').offsetParent }));
        if (sections.escritura === 'editar' && !st.notes) problems.push(label + ' today · notas trabadas con permiso de editar');
        if (sections.emociones === 'editar' && !st.mood) problems.push(label + ' today · emociones trabadas con permiso de editar');
        if (sections.actividades === 'editar' && !st.add) problems.push(label + ' today · no deja anotar actividades con permiso de editar');
        if (sections.escritura !== 'editar' && st.notes) problems.push(label + ' today · notas editables sin permiso');
      }
    }
    const errs = errors.filter((e) => !/Failed to load resource/.test(e));
    if (errs.length) problems.push(label + ' errores: ' + errs.join(' | '));
    await context.close();
  }
  if (problems.length) console.log([...new Set(problems.map((x) => x.replace(/^(\{[^}]*\}) (\w+) · (\S+): .*\[(.*)\]$/, '$2 · $3 · [$4]')))].join('\n'));
  assert.deepEqual(problems, []);
});

await test('nube: sin la marca de cuentas (file:// o servidor simple) no cambia nada', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(HTTP_URL);
  await onboard(page);
  assert.equal(await page.evaluate(() => MC.cloud.on), false);
  assert.equal(await page.evaluate(() => MC.ui.prefix), '');
  assert.equal(await page.locator('#st-account').count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('objetivos semanales: 5 + 5 + 3, casillas, recarga e historial (file y HTTP, desktop y móvil)', async () => {
  for (const [url, viewport] of [[FILE_URL, { width: 1366, height: 900 }], [HTTP_URL, { width: 375, height: 812 }]]) {
    const { page, errors, context } = await newPage(browser, { viewport, reducedMotion: 'reduce' });
    await page.goto(url);
    await onboard(page);
    const start = await page.evaluate(async () => {
      await MC.model.saveSettings({ showCover: false, motion: 'ninguna', motionChosen: true });
      const k = MC.dates.addDays(MC.dates.startOfWeek(MC.dates.today()), -7);
      for (const [id, title, rule, targetNote] of [
        ['rut_trabajar', 'Trabajar', { type: 'weekdays', days: [1, 2, 3, 4, 5] }, 'Según planificación'],
        ['rut_diseno', 'Practicar diseño', { type: 'weekdays', days: [1, 2, 3, 4, 5] }, '1 hora por día'],
        ['rut_caminar', 'Caminar', { type: 'weeklyTarget', count: 3 }, '3 caminatas']]) {
        await MC.model.saveRoutine({ id, title, rule, targetNote, startDate: k });
      }
      location.hash = MC.routes.week(k);
      return k;
    });
    await page.waitForSelector('.week-progress__count:has-text("0 de 13")');
    assert.equal(await page.locator('.week-day').count(), 7);
    assert.equal(await page.locator('.week-progress__details').getAttribute('open'), null);
    assert.equal(await page.locator('.planner__cell--important .week-progress').count(), 1, 'progreso dentro de Importante');
    assert.equal(await page.locator('.planner-page > .week-progress').count(), 0, 'sin barra encima de la grilla');
    assert.equal(await page.locator('.week-progress__goal progress').count(), 3, 'una barra visible por objetivo');
    assert.equal(await page.locator('.week-day').nth(5).locator('.activity').count(), 0, 'las opciones sin marcar quedan en la página del día');
    await page.locator('.week-progress__details > summary').click();
    await page.waitForSelector('.week-progress__goal:has-text("Caminar"):has-text("0/3")');
    async function mark(day, title, key = false) {
      await page.locator('.week-day').nth(day).locator('.week-day__head').click();
      const box = page.locator('section[aria-labelledby="q-list"] .activity').filter({ has: page.locator('.activity__title', { hasText: title }) }).locator('.stitch-box');
      if (key) { await box.focus(); await box.press('Space'); } else await box.click();
      await page.waitForFunction(async ([title]) => (await MC.model.itemsForDay(MC.routes.parse(location.hash).params.date)).some(a => a.title === title && !a.virtual), [title]);
      await page.click('#panel-close');
    }
    await mark(0, 'Caminar', true);
    await page.waitForSelector('.week-progress__count:has-text("1 de 13")');
    await mark(2, 'Caminar'); await mark(6, 'Caminar');
    await page.waitForSelector('.week-progress__goal:has-text("Caminar"):has-text("3/3 · completo")');
    await page.waitForSelector('.week-progress__percent:has-text("23%")');
    await mark(1, 'Caminar');
    await page.waitForSelector('.week-progress__count:has-text("3 de 13")');
    for (let n = 0; n < 5; n++) { await mark(n, 'Trabajar'); await mark(n, 'Practicar diseño'); }
    await page.waitForSelector('.week-progress__percent:has-text("100%")');
    await mark(0, 'Trabajar');
    await page.waitForSelector('.week-progress__count:has-text("12 de 13")');
    await page.reload();
    await page.waitForSelector('.week-progress__count:has-text("12 de 13")');
    assert.equal(await page.locator('.week-day').nth(0).locator('.activity:has-text("Trabajar")').count(), 0);
    assert.equal(await page.evaluate(async k => (await MC.model.itemsForDay(k)).find(a => a.title === 'Trabajar').status, start), 'pending');
    await page.evaluate(async () => {
      const r = (await MC.model.getRoutines()).find((r) => r.id === 'rut_caminar');
      await MC.model.saveRoutine({ ...r, rule: { type: 'weeklyTarget', count: 5 } });
      location.hash = MC.routes.week(MC.dates.addDays(MC.dates.startOfWeek(MC.dates.today()), 7));
    });
    await page.waitForSelector('.week-progress__count:has-text("0 de 15")');
    await page.evaluate((k) => { location.hash = MC.routes.week(k); }, start);
    await page.waitForSelector('.week-progress__count:has-text("12 de 13")');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await context.close();
  }
});

await test('objetivos semanales: formulario flexible, meta opcional y validación', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL); await onboard(page);
  await page.evaluate(() => { location.hash = MC.routes.week(MC.dates.today()); });
  await page.waitForSelector('.week-progress');
  await page.locator('.week-progress__details > summary').click();
  await page.getByRole('button', { name: 'Programar actividad' }).click();
  await page.fill('#rt-title', 'Caminar');
  await page.selectOption('#rt-freq', 'weeklyTarget');
  await page.fill('#rt-count', '8');
  await page.getByRole('button', { name: 'Que se repita', exact: true }).click();
  await page.waitForSelector('.form-error:has-text("entre 1 y 7")');
  await page.fill('#rt-count', '3'); await page.fill('#rt-target-note', '3 caminatas');
  await page.getByRole('button', { name: 'Que se repita', exact: true }).click();
  await page.waitForFunction(async () => (await MC.model.getRoutines()).some((r) => r.rule.type === 'weeklyTarget' && r.rule.count === 3 && r.targetNote === '3 caminatas'));
  await page.waitForSelector('.week-progress__goal:has-text("Caminar"):has-text("0/3")');
  assert.equal(await page.locator('.week-day .activity:has-text("Caminar")').count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
});

await test('objetivos semanales D56: cinco predeterminadas en Importante, barras propias, editar, borrar y crear (file y HTTP, desktop y móvil)', async () => {
  for (const [url, viewport] of [[FILE_URL, { width: 1366, height: 900 }], [HTTP_URL, { width: 375, height: 812 }]]) {
    const { page, errors, context } = await newPage(browser, { viewport, reducedMotion: 'reduce' });
    await page.goto(url); await onboard(page, 'Nicole', { weeklyDefaults: true });
    await page.evaluate(() => MC.model.saveSettings({ showCover: false, motion: 'ninguna', motionChosen: true }));
    await page.click('#panel-close');
    const note = page.locator('.planner__cell--important');
    await note.locator('.week-progress__count:has-text("0 de 15")').waitFor();
    assert.deepEqual(await note.locator('.week-progress__name').allTextContents(), ['Trabajar', 'Caminar', 'Practica Diseño', 'Salir con una amiga', 'Bici']);
    assert.equal(await note.locator('.week-progress__goal progress').count(), 5);
    assert.equal(await page.locator('.planner-page > .week-progress').count(), 0);
    assert.equal(await note.locator('.week-progress__details').getAttribute('open'), null);
    await note.locator('input[aria-label="Importante"]').fill('Preparar la semana');
    await note.locator('input[aria-label="Importante"]').blur();
    await page.locator('.week-day').nth(2).locator('.week-day__head').click();
    const walk = page.locator('section[aria-labelledby="q-list"] .activity').filter({ has: page.locator('.activity__title', { hasText: 'Caminar' }) }).locator('.stitch-box');
    await walk.focus(); await walk.press('Space');
    await page.waitForSelector('section[aria-labelledby="q-list"] .activity[data-status="done"]:has-text("Caminar")');
    await page.click('#panel-close');
    await note.locator('.week-progress__count:has-text("1 de 15")').waitFor();
    const walkBar = note.locator('.week-progress__goal:has-text("Caminar") progress');
    assert.equal(await walkBar.getAttribute('value'), '1');
    assert.equal(await walkBar.getAttribute('max'), '3');
    await note.getByRole('button', { name: 'Editar actividad: Caminar', exact: true }).click();
    assert.equal(await page.locator('#rt-count').inputValue(), '3');
    await page.fill('#rt-title', 'Caminar un rato'); await page.fill('#rt-count', '2'); await page.fill('#rt-target-note', '30 minutos');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await note.locator('.week-progress__count:has-text("1 de 14")').waitFor();
    await note.locator('.week-progress__goal:has-text("Caminar un rato"):has-text("30 minutos")').waitFor();
    await note.getByRole('button', { name: 'Editar actividad: Bici', exact: true }).click();
    await page.getByRole('button', { name: 'Borrar', exact: true }).click();
    await page.getByRole('button', { name: 'Mandar a la papelera', exact: true }).click();
    await note.locator('.week-progress__count:has-text("1 de 13")').waitFor();
    await note.locator('.week-progress__details > summary').click();
    await note.getByRole('button', { name: 'Programar actividad' }).click();
    await page.fill('#rt-title', 'Leer'); await page.selectOption('#rt-freq', 'weeklyTarget'); await page.fill('#rt-count', '2');
    await page.getByRole('button', { name: 'Que se repita', exact: true }).click();
    await note.locator('.week-progress__count:has-text("1 de 15")').waitFor();
    await page.reload();
    await note.locator('.week-progress__count:has-text("1 de 15")').waitFor();
    assert.equal(await note.locator('.week-progress__name:has-text("Bici")').count(), 0, 'borrar no reinstala el valor de fábrica');
    assert.equal(await note.locator('.week-progress__goal:has-text("Leer") progress').getAttribute('max'), '2');
    assert.equal(await note.locator('input[aria-label="Importante"]').first().inputValue(), 'Preparar la semana');
    await page.getByRole('link', { name: 'Semana siguiente', exact: true }).click();
    await note.locator('.week-progress__count:has-text("0 de 15")').waitFor();
    await page.getByRole('link', { name: 'Semana anterior', exact: true }).click();
    await note.locator('.week-progress__count:has-text("1 de 15")').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); await context.close();
  }
});

await test('objetivos semanales D57: una barra Trabajar 0/3 y calendarios muestran todos los estados salvo sin marcar (file y HTTP, desktop y móvil)', async () => {
  for (const [url, viewport] of [[FILE_URL, { width: 1366, height: 900 }], [HTTP_URL, { width: 375, height: 812 }]]) {
    const { page, errors, context } = await newPage(browser, { viewport, reducedMotion: 'reduce' });
    await page.goto(url); await onboard(page);
    const dates = await page.evaluate(async () => {
      const M = MC.model, D = MC.dates, today = D.today(), start = D.startOfWeek(today);
      await M.saveSettings({ showCover: false, motion: 'ninguna', motionChosen: true });
      for (const [n, title] of ['Trabajar', ' TRABAJAR ', 'trabajar'].entries()) await M.addActivity(D.addDays(start, n), title);
      const dates = [-7, 0, 7].map(n => D.addDays(today, n));
      for (const date of dates) for (const status of M.STATUSES) {
        const a = await M.addActivity(date, 'Estado ' + status);
        if (status !== 'pending') await M.setStatus(a, status);
      }
      location.hash = MC.routes.week(today); return dates;
    });
    const work = page.locator('.week-progress__goal').filter({ has: page.locator('.week-progress__name', { hasText: /^Trabajar$/i }) });
    await work.locator('.week-progress__goal-count:has-text("0/3")').waitFor();
    assert.equal(await work.count(), 1);
    for (const date of dates) {
      await page.evaluate(k => { location.hash = MC.routes.week(k); }, date);
      const day = page.locator(`.week-day[data-date="${date}"]`);
      await day.locator('.activity[data-status="skipped"]').waitFor();
      assert.deepEqual((await day.locator('.activity').evaluateAll(nodes => nodes.map(n => n.dataset.status))).sort(), ['done', 'partial', 'postponed', 'skipped']);
      assert.equal(await page.locator('.week-day .activity[data-status="pending"]').count(), 0);
      await page.evaluate(k => { location.hash = MC.routes.month(MC.dates.monthKey(k)); }, date);
      const cell = page.locator(`.day-cell[data-date="${date}"]`);
      await cell.locator('.mark--skipped').waitFor();
      assert.equal(await cell.locator('.mark--postponed').count(), 1);
      const label = await cell.getAttribute('aria-label');
      for (const status of ['Lo hice', 'Hice un poquito', 'Lo dejo para otro día', 'Hoy no salió']) assert.ok(label.includes(status), label);
      assert.doesNotMatch(label, /Estado pending|Sin marcar/);
      assert.equal(await cell.locator('.mark--planned').count(), 0);
    }
    await page.evaluate(() => { location.hash = MC.routes.week(MC.dates.today()); });
    await work.locator('.week-progress__goal-count:has-text("0/3")').waitFor();
    await page.locator('.week-day').nth(0).locator('.week-day__head').click();
    await page.locator('section[aria-labelledby="q-list"] .activity:has-text("Trabajar") .stitch-box').first().press('Space');
    await page.waitForSelector('section[aria-labelledby="q-list"] .activity[data-status="done"]:has-text("Trabajar")');
    await page.click('#panel-close');
    await work.locator('.week-progress__goal-count:has-text("1/3")').waitFor();
    await page.reload(); await work.locator('.week-progress__goal-count:has-text("1/3")').waitFor();
    assert.equal(await work.count(), 1);
    await page.evaluate(async () => {
      const M = MC.model, D = MC.dates, start = D.startOfWeek(D.today());
      await M.saveRoutine({ id: 'read-a', title: 'Leer', rule: { type: 'once', date: start }, startDate: start });
      await M.saveRoutine({ id: 'read-b', title: 'Leer', rule: { type: 'once', date: D.addDays(start, 1) }, startDate: start });
    });
    await page.getByRole('button', { name: 'Editar actividad: Leer', exact: true }).click();
    await page.waitForSelector('dialog.sheet:has-text("Configurar Leer")');
    assert.equal(await page.locator('dialog.sheet .week-progress__goals button').count(), 2);
    await page.locator('dialog.sheet .week-progress__goals button').first().click();
    await page.waitForSelector('#rt-title');
    assert.equal(await page.locator('#rt-title').inputValue(), 'Leer');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(await page.evaluate(async () => (await MC.model.getRoutines()).filter(r => r.title === 'Leer').length), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); await context.close();
  }
});

await test('objetivos semanales D58: tres un poquito llenan media barra amarilla con 3/3, mezcla y recarga (file y HTTP, desktop y móvil)', async () => {
  for (const [url, viewport] of [[FILE_URL, { width: 1366, height: 900 }], [HTTP_URL, { width: 375, height: 812 }]]) {
    const { page, errors, context } = await newPage(browser, { viewport, reducedMotion: 'reduce' });
    await page.goto(url); await onboard(page);
    const start = await page.evaluate(async () => {
      const k = MC.dates.startOfWeek(MC.dates.today());
      await MC.model.saveSettings({ showCover: false, motion: 'ninguna', motionChosen: true });
      await MC.model.saveRoutine({ id: 'half-walk', title: 'Caminar', rule: { type: 'weeklyTarget', count: 3 }, startDate: k });
      location.hash = MC.routes.week(k); return k;
    });
    const goal = page.locator('.week-progress__goal:has-text("Caminar")');
    await goal.locator('.week-progress__goal-count:has-text("0/3")').waitFor();
    for (let n = 0; n < 3; n++) {
      await page.locator('.week-day').nth(n).locator('.week-day__head').click();
      await page.locator('#panel .activity:has-text("Caminar") .icon-btn').click();
      await page.locator('.menu__item:has-text("Hice un poquito")').click();
      await page.waitForSelector('#panel .activity[data-status="partial"]:has-text("Caminar")');
      await page.click('#panel-close');
      await goal.locator(`.week-progress__goal-count:has-text("${n + 1}/3")`).waitFor();
      if (n < 2) assert.equal(await goal.locator('.week-progress__victory').isVisible(), false);
    }
    await page.locator('.week-progress__percent:has-text("50%")').waitFor();
    assert.equal(await page.locator('#pl-important').textContent(), 'Progreso');
    assert.equal(await goal.locator('.week-progress__victory').isVisible(), true);
    assert.equal(await goal.locator('.week-progress__victory svg').count(), 1, 'estrella del cuaderno');
    assert.equal(await goal.locator('.week-progress__victory').evaluate(el => el.getAnimations().length), 0, 'movimiento reducido conserva la estrella quieta');
    assert.match(await goal.locator('.week-progress__goal-count').textContent(), /^3\/3/);
    assert.doesNotMatch(await goal.locator('.week-progress__goal-count').textContent(), /un poquito/);
    assert.doesNotMatch(await page.locator('.week-progress__count').textContent(), /un poquito/);
    assert.doesNotMatch(await goal.locator('.week-progress__goal-count').textContent(), /completo/);
    assert.equal(await goal.locator('progress').getAttribute('value'), '1.5');
    await page.evaluate(() => { location.hash = MC.routes.year(MC.dates.today().slice(0, 4)); });
    await page.locator('.wins .win:has-text("Caminar · 3/3")').waitFor();
    assert.doesNotMatch(await page.locator('.wins .win:has-text("Caminar · 3/3")').textContent(), /un poquito/);
    assert.equal(await page.locator('.wins .win:has-text("Caminar · 3/3")').count(), 1);
    await page.locator('.wins a:has-text("Caminar · 3/3")').click();
    await goal.locator('.week-progress__goal-count:has-text("3/3")').waitFor();
    const paint = await goal.locator('.week-progress__partial').evaluate(el => {
      const meter = el.parentNode.getBoundingClientRect(), span = el.getBoundingClientRect();
      return { width: span.width / meter.width, left: el.style.left, yellow: getComputedStyle(el).backgroundColor };
    });
    assert.ok(Math.abs(paint.width - 0.5) < 0.01, JSON.stringify(paint));
    assert.equal(paint.left, '0%'); assert.equal(paint.yellow, 'rgb(245, 217, 144)');
    assert.match(await goal.locator('progress').getAttribute('aria-valuetext'), /0 completas y 3 un poquito; 50%/);
    await page.reload(); await goal.locator('.week-progress__goal-count:has-text("3/3")').waitFor();
    assert.equal(await goal.locator('progress').getAttribute('value'), '1.5');
    await page.locator('.week-day').nth(0).locator('.week-day__head').click();
    await page.locator('#panel .activity:has-text("Caminar") .icon-btn').click();
    await page.locator('.menu__item:has-text("Lo hice")').click();
    await page.waitForSelector('#panel .activity[data-status="done"]:has-text("Caminar")');
    await page.click('#panel-close');
    await page.locator('.week-progress__percent:has-text("67%")').waitFor();
    assert.equal(await goal.locator('progress').getAttribute('value'), '2');
    assert.match(await goal.locator('progress').getAttribute('aria-valuetext'), /1 completas y 2 un poquito/);
    await page.evaluate(async k => {
      for (let n = 1; n < 3; n++) await MC.model.setStatus((await MC.model.itemsForDay(MC.dates.addDays(k, n))).find(a => a.routineId === 'half-walk'), 'done');
    }, start);
    await goal.locator('.week-progress__goal-count:has-text("3/3 · completo")').waitFor();
    assert.equal(await goal.locator('progress').getAttribute('value'), '3');
    assert.equal(await goal.locator('.week-progress__partial').evaluate(el => el.style.width), '0%');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(async k => {
      MC.motion.apply('completas');
      const original = Element.prototype.animate;
      window.__victoryAnimations = [];
      Element.prototype.animate = function (frames, opts) {
        if (this.classList.contains('week-progress__victory')) window.__victoryAnimations.push({ frames, opts });
        return original.call(this, frames, opts);
      };
      await MC.model.setStatus((await MC.model.itemsForDay(k)).find(a => a.routineId === 'half-walk'), 'pending');
    }, start);
    await goal.locator('.week-progress__goal-count:has-text("2/3")').waitFor();
    await page.evaluate(async k => MC.model.setStatus((await MC.model.itemsForDay(k)).find(a => a.routineId === 'half-walk'), 'done'), start);
    await goal.locator('.week-progress__goal-count:has-text("3/3")').waitFor();
    await page.waitForFunction(() => window.__victoryAnimations.length === 1);
    const animation = await page.evaluate(() => window.__victoryAnimations[0]);
    assert.ok(animation.opts.duration > 0 && animation.opts.duration <= 300);
    assert.equal(animation.opts.iterations, undefined, 'sin loop');
    assert.deepEqual(Object.keys(animation.frames[0]).sort(), ['opacity', 'transform']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); await context.close();
  }
});

await test('D59: victorias personales, momentos especiales y álbum con imágenes, copia y barras grandes (file/HTTP, desktop/375)', async () => {
  for (const [url, viewport] of [[FILE_URL, { width: 1366, height: 900 }], [HTTP_URL, { width: 375, height: 812 }]]) {
    const { page, errors, context } = await newPage(browser, { viewport, reducedMotion: 'reduce' });
    await page.goto(url); await onboard(page);
    await page.locator('.memory-btn').click();
    await page.getByRole('menuitem', { name: 'Mi pequeña victoria…', exact: true }).click();
    await page.locator('.memory-editor select').selectOption('rest');
    await page.locator('.memory-editor textarea').fill('Me di tiempo para descansar');
    await page.locator('.memory-editor').getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor').waitFor({ state: 'detached' });
    await page.evaluate(async () => {
      const M = MC.model, D = MC.dates;
      const now = D.today();
      await M.saveRoutine({ id: 'especial-nicole', title: 'Volver a dibujar', startDate: now, rule: { type: 'weeklyTarget', count: 3 } });
      location.hash = MC.routes.day(now);
    });
    // La vista abierta se conserva; se vuelve por el router para cargar la nueva repetición.
    await page.evaluate(() => { location.hash = MC.routes.week(); });
    await page.waitForSelector('.week-progress__goals');
    assert.ok(await page.locator('.week-progress__goal progress').first().evaluate(el => el.getBoundingClientRect().height) >= 16);
    if (process.env.E2E_CAPTURE) await page.locator('.planner__cell--important').screenshot({ path: path.join(process.env.E2E_CAPTURE, 'progress-large-' + viewport.width + '.png') });
    await page.evaluate(() => { location.hash = MC.routes.today(); });
    const activity = page.locator('.activity', { hasText: 'Volver a dibujar' });
    await activity.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: 'Esto es especial para mí…', exact: true }).click();
    await page.locator('.memory-editor select').selectOption('return');
    await page.locator('.memory-editor').getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor').waitFor({ state: 'detached' });
    await activity.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitemradio', { name: 'Hice un poquito', exact: true }).click();
    const pageId = await page.evaluate(async () => {
      const M = MC.model, date = MC.dates.today();
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 160;
      const ctx = cv.getContext('2d'); ctx.fillStyle = 'seagreen'; ctx.beginPath(); ctx.arc(120, 70, 42, 0, Math.PI * 2); ctx.fill();
      const img = await M.saveImage({ id: 'dibujo-nicole', kind: 'drawing', name: 'Mi primer dibujo', src: cv.toDataURL(), w: 240, h: 160 });
      const p = await M.savePage({ id: 'creacion-nicole', title: 'Un dibujo para guardar', date, stickers: [{ id: 'pegado', sticker: 'img:' + img.id, x: .5, y: .5 }] });
      location.hash = MC.routes.page(p.id); return p.id;
    });
    await page.getByRole('button', { name: 'Opciones de la página', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Terminé esta creación…', exact: true }).click();
    await page.locator('.memory-editor textarea').fill('Terminé mi dibujo');
    await page.locator('.memory-editor').getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Opciones de la página', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Quiero recordarlo…', exact: true }).click();
    await page.locator('.memory-editor textarea').fill('Un recuerdo con mi dibujo');
    await page.locator('.memory-editor').getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor').waitFor({ state: 'detached' });
    await page.evaluate(() => { location.hash = MC.routes.year(); });
    await page.waitForSelector('.year-album').catch(async e => { console.log('D59 año:', JSON.stringify({ errors, url: page.url(), text: (await page.locator('body').innerText()).slice(-1000) })); throw e; });
    assert.equal(await page.locator('.win', { hasText: 'Me di tiempo para descansar' }).count(), 1);
    assert.equal(await page.locator('.win', { hasText: 'Volví a algo querido' }).count(), 1);
    assert.equal(await page.locator('.win', { hasText: 'Terminé mi dibujo' }).count(), 1);
    const memory = page.locator('.memory', { hasText: 'Un recuerdo con mi dibujo' });
    assert.equal(await memory.locator('img').count(), 1);
    assert.equal(await memory.locator('a').getAttribute('href'), await page.evaluate(id => MC.routes.page(id), pageId));
    assert.equal(await page.locator('.year-album__month').count(), 2, 'un mes por cada sección del álbum');
    if (process.env.E2E_CAPTURE) {
      await page.waitForTimeout(400);
      await page.locator('[data-year-part="victorias"] h2').scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'memories-year-' + viewport.width + '.png') });
      await page.locator('[data-year-part="recuerdos"] h2').scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'memories-saved-' + viewport.width + '.png') });
    }
    await page.reload();
    await page.locator('.cover__board, .year-album').first().waitFor();
    if (await page.locator('.cover__board').count()) await openCover(page);
    await page.waitForSelector('.year-album');
    assert.equal(await page.locator('.win', { hasText: 'Me di tiempo para descansar' }).count(), 1);
    // La copia real, sin fixtures inventadas, conserva las referencias y los medios adjuntos.
    assert.equal(await page.evaluate(async () => MC.backup.validate(JSON.stringify(MC.backup.build(await MC.model.everything()))).ok), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []); await context.close();
  }
});

await test('D60: carga visible con mariposa hasta completar nube y calendario, recarga y 375px', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  for (const width of [1366, 375]) {
    const state = { me: { id: PSI, name: 'Psicóloga', hasNotebook: false,
      shares: [{ owner: CA, name: 'Nicole', sections: { escritura: 'ver', actividades: 'ver', semana: 'ver' } }] }, parts: [], look: { cover: 'lavanda', theme: null } };
    const { page, context, errors, setCookie } = await cloudContext(state);
    await page.setViewportSize({ width, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setCookie('mc_person', PSI); await setCookie('mc_view', CA);
    let releasePull, releaseLook;
    const pullGate = new Promise(resolve => { releasePull = resolve; });
    const lookGate = new Promise(resolve => { releaseLook = resolve; });
    await context.route('**/api/sync/pull**', async route => {
      await pullGate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"parts":[],"more":false}' });
    });
    await context.route('**/api/look**', async route => {
      await lookGate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state.look) });
    });
    try {
      await page.goto(HTTP_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#boot-loading');
      assert.match(await page.textContent('[role="status"]'), /Cargando el cuaderno/);
      assert.equal(await page.locator('.boot-loading__preview').getAttribute('aria-hidden'), 'true');
      assert.equal(await page.locator('.boot-loading__butterfly').evaluate(img => img.complete && img.naturalWidth > 0), true);
      assert.equal(await page.locator('#boot-loading').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.E2E_CAPTURE) await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'loading-butterfly-' + width + '.png') });
      await page.evaluate(() => {
        const render = MC.views.calendar.render;
        MC.views.calendar.render = function (host, params) {
          const instance = render(host, params);
          const gate = new Promise(resolve => { window.__releaseCalendar = resolve; });
          instance.ready = Promise.all([instance.ready, gate]);
          return instance;
        };
      });
      releasePull();
      assert.equal(await page.locator('#boot-loading').isVisible(), true, 'la apariencia todavía no llegó');
      releaseLook();
      await page.waitForFunction(() => typeof window.__releaseCalendar === 'function');
      assert.equal(await page.locator('#boot-loading').isVisible(), true, 'el calendario todavía no está listo');
      await page.evaluate(() => window.__releaseCalendar());
      await page.locator('#boot-loading').waitFor({ state: 'detached' });
      await page.waitForSelector('.planner-page, .cal-page');
      assert.equal(await page.evaluate(() => MC.cloud.mode), 'guest');
      await page.reload();
      await page.waitForSelector('.planner-page, .cal-page');
      assert.equal(await page.locator('#boot-loading').count(), 0);
      assert.deepEqual(errors, []);
    } finally { releasePull(); releaseLook(); await context.close(); }
  }
});

await test('D60: descarga fallida ofrece reintentar con teclado y no abre un cuaderno vacío', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  const state = { me: { id: PSI, name: 'Psicóloga', hasNotebook: false,
    shares: [{ owner: CA, name: 'Nicole', sections: { escritura: 'ver' } }] }, parts: [] };
  const { page, context, setCookie, errors } = await cloudContext(state);
  await setCookie('mc_person', PSI); await setCookie('mc_view', CA);
  let fail = true;
  await context.route('**/api/sync/pull**', route => route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json', body: fail ? '{"error":"No se pudo leer el cuaderno."}' : '{"parts":[],"more":false}' }));
  try {
    await page.goto(HTTP_URL);
    await page.waitForSelector('#boot-loading[data-state="failed"]');
    assert.equal(await page.locator('.planner-page, .cal-page').count(), 0);
    assert.equal(await page.locator('.boot-loading__preview').isVisible(), false);
    assert.equal(await page.locator('#boot-loading').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
    const retry = page.getByRole('button', { name: 'Volver a intentar', exact: true });
    await retry.focus(); fail = false;
    await Promise.all([page.waitForEvent('domcontentloaded'), page.keyboard.press('Enter')]);
    await page.waitForSelector('.planner-page, .cal-page');
    await page.locator('#boot-loading').waitFor({ state: 'detached' });
    assert.equal(await page.locator('#boot-loading').count(), 0);
    assert.ok(errors.every(error => /503|No se pudo leer el cuaderno/.test(error)), errors.join('\n'));
  } finally { await context.close(); }
});

await test('D60: sin JavaScript conserva el aviso; favicon transparente reproducible en SVG, PNG e ICO', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  try {
    await page.goto(FILE_URL);
    assert.equal(await page.locator('#boot-loading').isVisible(), false);
    assert.match(await page.textContent('noscript'), /necesita JavaScript/);
    const source = fs.readFileSync(path.join(root, 'assets/icons/src/favicon.svg'), 'utf8');
    assert.equal(fs.readFileSync(path.join(root, 'assets/icons/favicon.svg'), 'utf8'), source);
    assert.doesNotMatch(source, /<circle|stroke-dasharray|width="512"/);
    for (const size of [16, 32, 48]) {
      const png = fs.readFileSync(path.join(root, 'assets/icons/favicon-' + size + 'x' + size + '.png'));
      assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size);
    }
    const ico = fs.readFileSync(path.join(root, 'assets/icons/favicon.ico'));
    assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
  } finally { await context.close(); }
});

await test('D61: skeleton pulsa y cruza con contenido listo, sin tapar controles, escritorio y 375px', async () => {
  const PSI = '33333333-3333-4333-8333-333333333333';
  for (const width of [1366, 375]) {
    const state = { me: { id: PSI, name: 'Psicóloga', hasNotebook: false,
      shares: [{ owner: CA, name: 'Nicole', sections: { escritura: 'ver', actividades: 'ver', semana: 'ver' } }] }, parts: [] };
    const { page, context, errors, setCookie } = await cloudContext(state);
    await page.setViewportSize({ width, height: 812 });
    await setCookie('mc_person', PSI); await setCookie('mc_view', CA);
    let releasePull;
    const gate = new Promise(resolve => { releasePull = resolve; });
    await context.route('**/api/sync/pull**', async route => {
      await gate;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"parts":[],"more":false}' });
    });
    try {
      await page.goto(HTTP_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#boot-loading.is-pulsing');
      const pulse = await page.evaluate(() => {
        const el = document.querySelector('.boot-loading__preview > span');
        const animation = el.getAnimations()[0];
        animation.pause(); animation.currentTime = 0;
        const start = Number(getComputedStyle(el).opacity);
        animation.currentTime = 500;
        const halfway = Number(getComputedStyle(el).opacity);
        animation.play();
        return { start, halfway, text: getComputedStyle(document.querySelector('.boot-loading__message')).opacity };
      });
      assert.equal(pulse.start, 1); assert.equal(pulse.halfway, 0.5); assert.equal(pulse.text, '1');
      if (process.env.E2E_CAPTURE) await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'skeleton-pulse-' + width + '.png') });
      await page.evaluate(() => {
        document.addEventListener('transitionrun', event => {
          if (!event.target.classList.contains('t-skel-content') || event.propertyName !== 'opacity') return;
          const content = event.target, loading = document.getElementById('boot-loading');
          const animation = content.getAnimations()[0];
          animation.pause(); animation.currentTime = 90;
          const head = content.querySelector('.week-day__head');
          const rect = head.getBoundingClientRect();
          window.__bootReveal = {
            opacity: Number(getComputedStyle(content).opacity), duration: animation.effect.getTiming().duration,
            inert: loading.inert, hidden: loading.getAttribute('aria-hidden'),
            hit: !!document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).closest('.week-day__head'),
            pulsing: loading.getAnimations({ subtree: true }).some(a => a.animationName === 't-skel-pulse')
          };
          animation.play();
        });
      });
      releasePull();
      await page.waitForFunction(() => !!window.__bootReveal);
      const reveal = await page.evaluate(() => window.__bootReveal);
      assert.ok(reveal.opacity > 0 && reveal.opacity < 1, 'el contenido realmente entra con opacidad intermedia');
      assert.ok(reveal.duration > 0 && reveal.duration <= 300);
      assert.equal(reveal.inert, true); assert.equal(reveal.hidden, 'true');
      assert.equal(reveal.hit, true); assert.equal(reveal.pulsing, false);
      await page.locator('#boot-loading').waitFor({ state: 'detached' });
      assert.equal(await page.locator('#main.t-skel, .t-skel-content').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const day = page.locator('.week-day__head').first();
      await day.focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#panel[open] .day-head');
      assert.deepEqual(errors, []);
    } finally { releasePull(); await context.close(); }
  }
});

await test('D61: Ninguna y Reducidas se recuerdan antes de abrir la base y conservan teclado y calendario', async () => {
  for (const motion of ['ninguna', 'reducidas']) {
    const { page, context, errors } = await newPage(browser, { serviceWorkers: 'block' });
    try {
      await page.goto(HTTP_URL); await onboard(page);
      await page.evaluate(motion => MC.model.saveSettings({ motion, motionChosen: true, showCover: false }), motion);
      await context.route('**/js/core/store.js', async route => {
        const res = await route.fetch();
        await route.fulfill({ response: res, body: (await res.text()) + '\n(function(){var init=MC.store.init;MC.store.init=function(){return new Promise(function(resolve){window.__openStore=resolve;}).then(function(){return init();});};})();' });
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.__openStore === 'function');
      assert.equal(await page.getAttribute('html', 'data-motion'), motion);
      assert.equal(await page.locator('#boot-loading').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
      await page.evaluate(() => window.__openStore());
      await page.locator('#boot-loading').waitFor({ state: 'detached' });
      await page.waitForSelector('.planner-page');
      assert.equal(await page.getAttribute('html', 'data-motion'), motion);
      assert.equal(await page.locator('.t-skel, .t-skel-content').count(), 0);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});

await test('D62: carpetas y búsqueda local con tildes, privacidad y actualización en vivo', async () => {
  const { page, context, errors } = await newPage(browser);
  try {
    await page.goto(FILE_URL); await onboard(page);
    await page.evaluate(async () => {
      const M = MC.model, today = MC.dates.today();
      await M.savePage({ id: 'hoja-nicole', title: 'Mi práctica de diseño', date: today, blocks: [{ id: 'texto', type: 'text' }], values: { texto: 'Un dibujo en el cuaderno' } });
      await M.savePage({ id: 'otra-hoja-nicole', title: 'Una hoja anterior', date: MC.dates.addDays(today, -60) });
      const day = M.emptyDay(MC.dates.addDays(today, -1)); day.notes = 'Diseño solo para mí'; day.privacy = { noMemory: true }; await M.saveDay(day);
      location.hash = MC.routes.sheets();
    });
    await page.waitForSelector('.paper-folder');
    assert.equal(await page.locator('.paper-folder').count(), 2);
    assert.equal(await page.locator('.paper-folder').first().getAttribute('open'), '');
    await page.locator('.notebook-search > summary').click();
    await page.getByRole('searchbox', { name: 'Buscar en mi cuaderno' }).fill('practica diseno');
    await page.locator('.notebook-search__results a:has-text("Mi práctica de diseño")').waitFor();
    assert.equal(await page.locator('.notebook-search__results li').count(), 1);
    await page.getByRole('searchbox', { name: 'Buscar en mi cuaderno' }).fill('solo para');
    await page.waitForFunction(() => document.querySelector('.notebook-search [role="status"]').textContent === '0 resultados');
    await page.evaluate(() => MC.model.savePage({ id: 'nueva-hoja-nicole', title: 'Un paseo', date: MC.dates.today() }));
    await page.getByRole('searchbox', { name: 'Buscar en mi cuaderno' }).fill('paseo');
    await page.locator('.notebook-search__results a:has-text("Un paseo")').waitFor();
    await page.locator('.paper-folder').last().locator('summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.paper-folder').last().locator('a:has-text("Una hoja anterior")').isVisible(), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

await test('D62: fotos del año, zoom, período y mosaico accesibles en escritorio y 375px', async () => {
  for (const width of [1280, 375]) {
    const { page, context, errors } = await newPage(browser, { viewport: { width, height: 860 }, hasTouch: width === 375 });
    try {
      await page.goto(HTTP_URL); await onboard(page);
      const today = await page.evaluate(async () => {
        const M = MC.model, today = MC.dates.today(), cv = document.createElement('canvas'); cv.width = 240; cv.height = 180;
        const ctx = cv.getContext('2d'); ctx.fillStyle = 'lavender'; ctx.fillRect(0, 0, 240, 180); ctx.fillStyle = 'seagreen'; ctx.beginPath(); ctx.arc(120, 90, 40, 0, Math.PI * 2); ctx.fill();
        const im = await M.saveImage({ id: 'foto-nicole', kind: 'upload', name: 'Mi foto', src: cv.toDataURL(), w: 240, h: 180 });
        const day = M.emptyDay(today); day.notes = 'Un paseo tranquilo'; day.reflection.keep = 'Un momento con mi foto'; day.stickers = [{ id: 'pegado', sticker: 'img:' + im.id, x: .5, y: .5 }]; await M.saveDay(day);
        const earlier = M.emptyDay(today.slice(0, 4) + '-01-02'); earlier.reflection.keep = 'Mi recuerdo de enero'; await M.saveDay(earlier);
        location.hash = MC.routes.year(); return today;
      });
      await page.waitForSelector('.year-album__photo');
      await page.evaluate(() => {
        window.__photoAnimations = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (frames, timing) {
          const a = animate.call(this, frames, timing);
          if (this.matches('.image-viewer__photo')) { window.__photoAnimations.push({ frames, timing }); a.pause(); a.currentTime = timing.duration / 2; }
          return a;
        };
      });
      await page.locator('.year-album__photo').first().click();
      await page.waitForSelector('dialog.image-viewer[open]');
      await page.waitForFunction(() => window.__photoAnimations.length === 1);
      const entrance = await page.evaluate(() => window.__photoAnimations[0]);
      assert.match(entrance.frames[0].transform, /translate\(.+scale\(/);
      assert.ok(entrance.timing.duration > 0 && entrance.timing.duration <= 300);
      if (process.env.E2E_CAPTURE) await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'photo-reveal-' + width + '.png') });
      await page.getByRole('button', { name: 'Acercar foto', exact: true }).click();
      assert.equal(await page.locator('.image-viewer__photo').evaluate(el => el.getAnimations().length), 0, 'zoom interrumpe la entrada');
      assert.match(await page.locator('.image-viewer__photo').evaluate(el => el.style.transform), /scale\(1.5\)/);
      await page.getByRole('button', { name: 'Ver completa', exact: true }).click();
      assert.match(await page.locator('.image-viewer__photo').evaluate(el => el.style.transform), /scale\(1\)/);
      await page.keyboard.press('Escape'); await page.locator('dialog.image-viewer').waitFor({ state: 'detached' });
      assert.equal(await page.locator('.year-album__photo').first().evaluate(el => el === document.activeElement), true);
      await page.locator('.year-album__photo').first().press('Enter');
      await page.waitForSelector('dialog.image-viewer[open]');
      assert.equal(await page.evaluate(() => window.__photoAnimations.length), 1, 'teclado abre sin movimiento');
      await page.keyboard.press('Escape'); await page.locator('dialog.image-viewer').waitFor({ state: 'detached' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.year-album__photo').first().click(); await page.waitForSelector('dialog.image-viewer[open]');
      assert.equal(await page.evaluate(() => window.__photoAnimations.length), 1, 'el sistema reducido abre sin movimiento');
      await page.keyboard.press('Escape'); await page.locator('dialog.image-viewer').waitFor({ state: 'detached' });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('.photo-album > summary').click();
      await page.locator('.photo-collage__item').first().waitFor();
      assert.equal(await page.locator('.photo-collage__item').count(), 1);
      await page.locator('.photo-collage__open').click(); await page.waitForSelector('dialog.image-viewer[open]'); await page.keyboard.press('Escape');
      await page.locator('.date-range > summary').click();
      await page.getByLabel('Desde', { exact: true }).fill(today); await page.getByLabel('Hasta', { exact: true }).fill(today);
      await page.getByRole('button', { name: 'Ver período', exact: true }).click();
      assert.equal(await page.locator('.memory').count(), 1);
      await page.locator('.date-range > summary').click(); await page.getByRole('button', { name: 'Todo el año', exact: true }).click();
      assert.equal(await page.locator('.memory').count(), 2);
      await page.locator('.record-calendar > summary').click();
      assert.equal(await page.locator('.record-calendar > .t-meta svg').first().evaluate(el => el.getBoundingClientRect().width), 16);
      const cell = page.locator('.record-calendar [data-date]').first(); await cell.focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.record-calendar [data-date]').nth(7).evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.E2E_CAPTURE) {
        await page.locator('[data-year-part="recuerdos"]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'beui-year-' + width + '.png') });
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  }
});

await test('D62: metas ordenadas por teclado, límites del contador y hoja inferior móvil', async () => {
  const { page, context, errors } = await newPage(browser, { viewport: { width: 375, height: 860 }, hasTouch: true });
  try {
    await page.goto(HTTP_URL); await onboard(page, 'Nicole', { weeklyDefaults: true });
    await page.click('#panel-close'); await page.waitForSelector('.week-progress__details');
    await page.locator('.week-progress__details > summary').click();
    const handles = page.locator('.sortable-list__handle'), first = await handles.first().textContent();
    await handles.first().focus(); await page.keyboard.press('ArrowDown');
    await page.waitForFunction(first => document.querySelectorAll('.sortable-list__handle')[1].textContent === first, first);
    assert.equal(await handles.nth(1).evaluate(el => el === document.activeElement), true);
    await page.reload(); await openCover(page); await page.waitForSelector('.week-progress__details');
    await page.locator('.week-progress__details > summary').click(); assert.equal(await handles.nth(1).textContent(), first);
    await page.getByRole('button', { name: 'Editar actividad: Caminar', exact: true }).click();
    assert.equal(await page.locator('dialog.sheet--mobile-bottom[open]').count(), 1);
    await page.getByRole('button', { name: 'Aumentar veces por semana', exact: true }).click();
    assert.equal(await page.locator('#rt-count').inputValue(), '4');
    await page.locator('#rt-count').fill('7'); assert.equal(await page.getByRole('button', { name: 'Aumentar veces por semana', exact: true }).isDisabled(), true);
    await page.locator('#rt-count').fill('1'); assert.equal(await page.getByRole('button', { name: 'Reducir veces por semana', exact: true }).isDisabled(), true);
    await page.keyboard.press('Escape'); await page.locator('#rt-count').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

await test('D62: cola de archivos reintenta errores sin duplicar y cerrar respeta lo pendiente', async () => {
  const { page, context, errors } = await newPage(browser);
  try {
    await page.goto(FILE_URL); await onboard(page);
    await page.evaluate(() => {
      window.__attempts = {}; window.__saved = null;
      const files = ['primero.txt', 'segundo.txt'].map(name => new File(['Nicole'], name));
      MC.images.fileQueue(files, file => {
        const n = window.__attempts[file.name] = (window.__attempts[file.name] || 0) + 1;
        if (file.name === 'segundo.txt' && n === 1) throw new Error('Probá de nuevo');
        return { name: file.name };
      }, 'Agregar archivos').then(saved => { window.__saved = saved; });
    });
    const retry = page.getByRole('button', { name: 'Reintentar', exact: true }); await retry.waitFor(); await page.waitForFunction(() => !document.querySelector('.file-queue button:not([hidden])').disabled);
    assert.equal(await page.locator('.file-queue__progress').getAttribute('value'), '1');
    await retry.click(); await page.waitForFunction(() => !!window.__saved);
    assert.deepEqual(await page.evaluate(() => window.__attempts), { 'primero.txt': 1, 'segundo.txt': 2 });
    assert.equal(await page.evaluate(() => window.__saved.length), 2);
    await page.evaluate(() => {
      window.__saved = null; window.__attempts = [];
      MC.images.fileQueue(['primero', 'segundo'].map(name => new File(['Nicole'], name)), file => {
        window.__attempts.push(file.name); return new Promise(resolve => { window.__finishFile = () => resolve({ name: file.name }); });
      }, 'Agregar archivos').then(saved => { window.__saved = saved; });
    });
    await page.waitForFunction(() => typeof window.__finishFile === 'function');
    await page.keyboard.press('Escape'); await page.evaluate(() => window.__finishFile()); await page.waitForFunction(() => !!window.__saved);
    assert.deepEqual(await page.evaluate(() => window.__attempts), ['primero']); assert.equal(await page.evaluate(() => window.__saved.length), 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

await test('D63: transición de calendario direccional, interrumpible y sin movimiento por teclado o sistema reducido', async () => {
  const { page, context, errors } = await newPage(browser);
  try {
    await page.goto(HTTP_URL); await onboard(page); await page.click('#panel-close'); await page.waitForSelector('.planner-page');
    await page.evaluate(() => {
      window.__calendarAnimations = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, timing) {
        const a = animate.call(this, frames, timing);
        if (this.parentElement && this.parentElement.id === 'main') {
          window.__calendarAnimations.push({ frames, timing, animation: a }); a.pause(); a.currentTime = timing.duration / 2;
        }
        return a;
      };
    });
    await page.getByRole('link', { name: 'Semana siguiente', exact: true }).click();
    await page.waitForFunction(() => window.__calendarAnimations.length === 1);
    assert.equal(await page.evaluate(() => window.__calendarAnimations[0].frames[0].transform), 'translateX(28px)');
    await page.getByRole('link', { name: 'Semana anterior', exact: true }).click();
    await page.waitForFunction(() => window.__calendarAnimations.length === 2);
    assert.equal(await page.evaluate(() => window.__calendarAnimations[0].animation.playState), 'idle');
    assert.equal(await page.evaluate(() => window.__calendarAnimations[1].frames[0].transform), 'translateX(-28px)');
    const before = page.url(); await page.getByRole('link', { name: 'Semana siguiente', exact: true }).press('Enter');
    await page.waitForURL(url => url.href !== before); await page.waitForFunction(() => window.__calendarAnimations[1].animation.playState === 'idle');
    await page.waitForFunction(() => document.querySelector('.planner-page') && !document.querySelector('#boot-loading'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('link', { name: 'Semana siguiente', exact: true }).click();
    await page.getByRole('button', { name: 'Mes', exact: true }).click(); await page.waitForSelector('.day-cell');
    assert.equal(await page.evaluate(() => window.__calendarAnimations.length), 2);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.months li a:not([aria-current="date"])').first().click();
    await page.waitForFunction(() => window.__calendarAnimations.length === 3);
    assert.ok(await page.evaluate(() => window.__calendarAnimations[2].timing.duration <= 300));
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

await test('D63: papelito solo tras guardar, aviso visible fuera del editor y alternativa estática', async () => {
  const { page, context, errors } = await newPage(browser, { viewport: { width: 375, height: 860 } });
  try {
    await page.goto(FILE_URL); await onboard(page);
    await page.evaluate(() => {
      window.__receiptAnimations = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, timing) {
        const a = animate.call(this, frames, timing);
        if (this.matches('.memory-receipt__paper')) { window.__receiptAnimations.push({ frames, timing }); a.pause(); a.currentTime = timing.duration / 2; }
        return a;
      };
      return MC.memories.editor('day', MC.dates.today(), 'recuerdo', { title: 'Un día para guardar' });
    });
    await page.locator('.memory-editor textarea').fill('El paseo de Nicole');
    await page.getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor').waitFor({ state: 'detached' }); await page.locator('.toast:not([hidden]) .memory-receipt').waitFor();
    assert.equal(await page.evaluate(() => window.__receiptAnimations.length), 1);
    assert.ok(await page.locator('.toast').evaluate(el => el.getBoundingClientRect().width > 300));
    assert.equal(await page.locator('.toast').evaluate(el => !!el.closest('#panel') && !el.closest('.memory-editor')), true);
    assert.equal(await page.evaluate(async () => (await MC.model.getMarks()).filter(m => m.note === 'El paseo de Nicole').length), 1);
    assert.ok(await page.evaluate(() => window.__receiptAnimations[0].timing.duration <= 300));
    if (process.env.E2E_CAPTURE) await page.screenshot({ path: path.join(process.env.E2E_CAPTURE, 'memory-receipt-375.png') });
    await page.locator('.toast').getByRole('button', { name: 'Ver', exact: true }).click(); await page.waitForSelector('.memory');
    assert.match(await page.locator('.memory').innerText(), /El paseo de Nicole/);
    await page.evaluate(() => MC.memories.editor('day', MC.dates.today(), 'recuerdo'));
    await page.getByRole('button', { name: 'Guardar en Mi año', exact: true }).press('Enter');
    await page.locator('.memory-editor').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => window.__receiptAnimations.length), 1, 'teclado confirma sin animar');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => MC.memories.editor('day', MC.dates.today(), 'recuerdo'));
    await page.getByRole('button', { name: 'Guardar en Mi año', exact: true }).click(); await page.locator('.memory-editor').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => window.__receiptAnimations.length), 1, 'sistema reducido confirma sin animar');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => { window.__setMemory = MC.model.setMemory; MC.model.setMemory = () => Promise.reject(new Error('Guardado interrumpido')); return MC.memories.editor('day', MC.dates.today(), 'recuerdo'); });
    await page.getByRole('button', { name: 'Guardar en Mi año', exact: true }).click();
    await page.locator('.memory-editor [role="alert"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.__receiptAnimations.length), 1, 'un error nunca celebra un guardado');
    assert.equal(await page.locator('.memory-editor').isVisible(), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

await browser.close();
server.close();
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} recorridos ok`);
process.exit(failed.length ? 1 : 0);
