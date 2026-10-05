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
  catch (e) { results.push([false, name]); console.log(`  ✗ ${name}\n    ${String(e && e.stack || e).split('\n').slice(0, 4).join('\n    ')}`); }
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

async function onboard(page, name = 'Nicole') {
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

await test('el calendario reúne todo: rutinas planeadas, páginas del día y el año sin falsos puntos', async () => {
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
  assert.equal((await next.locator('.mark-plan').textContent()).trim(), '1');
  assert.match(await next.getAttribute('aria-label'), /una cosa planeada/);
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  const cell = page.locator(`.day-cell[data-date="${TODAY}"]`);
  assert.equal(await cell.locator('.mark-page').count(), 1, 'marca de página en hoy');
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
  const pageMarks = () => page.locator(`.day-cell[data-date="${TODAY}"] .mark-page`).count();
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  assert.equal(await pageMarks(), 1, 'la página está en el mes');
  await goto(page, pageHash);
  await page.waitForSelector('#panel[open] .free-list input');
  await page.click('button[aria-label="Opciones de la página"]');
  await page.click('.menu [role="menuitem"]:has-text("Borrar la página")');
  await page.click('dialog[open] button:has-text("Mandar a la papelera")');
  await page.waitForSelector('.toast:has-text("Se fue a la papelera")');
  await goto(page, '#/calendario/mes/' + TODAY.slice(0, 7));
  await page.waitForFunction((d) => !document.querySelector(`.day-cell[data-date="${d}"] .mark-page`), TODAY, { timeout: 4000 });
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
  await page.waitForFunction((d) => !!document.querySelector(`.day-cell[data-date="${d}"] .mark-page`), TODAY, { timeout: 4000 });
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
  assert.equal(await todayCell.getAttribute('data-routine'), 'due');
  assert.match(await todayCell.getAttribute('aria-label'), /toca «Estirar»/);
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

await test('A6: la semana-planner de fondo; anotar y marcar ahí; pasado sin repeticiones sin marcar; Importante y Notas persisten', async () => {
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
  assert.deepEqual(order, ['Importante', 'dia', 'dia', 'dia', 'dia', 'dia', 'dia', 'dia', 'Notas']);
  assert.match(await page.textContent('#main h1'), /Mi semana/);
  // Anotar en el día de hoy desde la semana y marcarlo ahí mismo, sin abrir nada.
  const todayCell = `#main .week-day[data-date="${TODAY}"]`;
  await page.fill(`${todayCell} .add-activity input`, 'turno con la dentista');
  await page.press(`${todayCell} .add-activity input`, 'Enter');
  await page.waitForSelector(`${todayCell} .activity:has-text("turno con la dentista")`);
  await page.click(`${todayCell} .activity:has-text("turno con la dentista") .stitch-box`);
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
  await page.waitForSelector(`${todayCell} .activity:has-text("algo de otra pestaña")`);
  // Una semana pasada: lo anotado nace hecho y no aparecen repeticiones sin marcar (D18).
  const past = add(TODAY, -7);
  await goto(page, '#/calendario/semana/' + past);
  await page.waitForSelector(`#main .week-day[data-date="${past}"]`);
  assert.equal(await page.locator('#main .activity:has-text("Estirar")').count(), 0, 'sin repeticiones sin marcar en el pasado');
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

await test('A7: hojas en bloques; Guardar como plantilla y que se repita; la hoja del día aparece sola y se guarda al escribir', async () => {
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
  const stored = await page.evaluate((id) => MC.model.getPage(id), pageId);
  assert.equal(stored.blocks.length, 3);
  assert.match(stored.body, /A favor: más luz/);
  assert.match(stored.body, /☑ preguntar precios/);
  // Guardar → como plantilla con lo escrito.
  await page.click('.free-head button:has-text("Guardar")');
  await page.click('[role="menuitem"]:has-text("Como plantilla, con lo escrito")');
  await page.waitForSelector('.toast:has-text("Mis plantillas")');
  // Mis hojas la muestra y “Nueva hoja” la ofrece primero.
  await goto(page, '#/hojas');
  await page.waitForSelector('.templates-mine a:has-text("Pros y contras")');
  assert.match(await page.textContent('.toc'), /Mudarme o no/, 'la vista previa lee los bloques');
  await page.click('#panel button:has-text("Nueva hoja")');
  await page.waitForSelector('dialog.sheet .template-group__title:has-text("Mis plantillas")');
  await page.click('dialog.sheet .template-group .template:has-text("Pros y contras")');
  await page.waitForSelector('#page-body');
  assert.equal(await page.inputValue('#page-body'), 'Mudarme o no');
  assert.equal(await page.locator('.sheet-cols textarea').first().inputValue(), 'más luz');
  // Editar la plantilla no toca las hojas ya hechas.
  await goto(page, '#/hojas');
  await page.click('.templates-mine a:has-text("Pros y contras")');
  await page.waitForSelector('.template-page .page-title');
  await page.fill('.template-page #page-body, .template-page textarea.write >> nth=0', 'otra idea');
  await page.waitForTimeout(700);
  assert.equal((await page.evaluate((id) => MC.model.getPage(id), pageId)).values[stored.blocks[0].id], 'Mudarme o no');
  // Guardar → que se repita, en blanco, todos los días.
  await page.evaluate((id) => { location.hash = MC.routes.page(id); }, pageId);
  await page.waitForSelector('#page-body');
  await page.click('.free-head button:has-text("Guardar")');
  await page.click('[role="menuitem"]:has-text("Que se repita, en blanco")');
  await page.fill('#rt-title', 'Pensar en voz alta');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog.sheet button:has-text("Que se repita")');
  await page.waitForSelector('.toast:has-text("aparecer sola")');
  // No es una actividad: no aparece en la lista del día, sí en “Hojas de este día”.
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
  assert.match((await page.evaluate((id) => MC.store.get('pages', id), occId)).body, /Hoy pensé en el balcón\.$/);
  // Mis hojas la lista en “Lo que se repite” con enlace a la hoja.
  await goto(page, '#/hojas');
  await page.waitForSelector('.routine:has-text("Pensar en voz alta") a:has-text("(la hoja)")');
  // Las notas del día también se pueden guardar.
  await goto(page, '#/hoy');
  await page.fill('#notes', 'Nicole anotó una idea.');
  await page.click('#q-notes + * .keep-btn, .keep-btn');
  await page.click('[role="menuitem"]:has-text("Como plantilla, en blanco")');
  await page.waitForSelector('.toast:has-text("Notas del día")');
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

await test('base: una base vieja (IDB v2, datos y borrador v4) se actualiza a v3 sin perder nada, y de nuevo es idempotente (A3)', async () => {
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
        const tx = d.transaction(['files', 'pages', 'days'], 'readonly');
        const out = { version: d.version, stores: Array.from(d.objectStoreNames).sort(), pageIdx: Array.from(tx.objectStore('pages').indexNames).sort() };
        tx.objectStore('files').get('fil_1').onsuccess = (e) => { out.fileUpdatedAt = e.target.result.updatedAt; };
        tx.objectStore('pages').get('pag_1').onsuccess = (e) => { out.pageItems = e.target.result.items.map((i) => i.text); };
        tx.objectStore('days').get(today).onsuccess = (e) => { out.mood = e.target.result.morning.mood; };
        tx.oncomplete = () => { d.close(); res(out); };
      };
    }), TODAY);
    // El borrador recuperado se escribe un instante después de mostrarse.
    let db = await readDb();
    for (let i = 0; i < 20 && db.mood !== 2; i++) { await page.waitForTimeout(100); db = await readDb(); }
    assert.equal(db.version, 3);
    assert.deepEqual(db.stores, ['activities', 'days', 'files', 'images', 'marks', 'meta', 'pages', 'routines', 'templates', 'weeks']);
    assert.deepEqual(db.pageIdx, ['date', 'updatedAt']);
    assert.equal(db.fileUpdatedAt, '2026-10-01T09:00:00.000Z');
    assert.deepEqual(db.pageItems, ['la plaza']);
    assert.equal(db.mood, 2, 'el borrador (forma vieja) se guardó con su ánimo');
    assert.equal(await page.locator('#panel .activity:has-text("Regar")').count(), 1);
  };
  await page.goto(HTTP_URL + '#/hoy');
  await check();
  await page.reload();
  await check();
  assert.deepEqual(errors, []);
  await context.close();
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
  await context.route('**/api/sync/pull**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ parts: state.parts || [], more: false }) }));
  ctx.setCookie = (name, value) => context.addCookies([{ name, value, url: `http://127.0.0.1:${PORT}/` }]);
  return ctx;
}

const CA = '11111111-1111-4111-8111-111111111111', CB = '22222222-2222-4222-8222-222222222222';

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
  assert.ok(!state.pushes.flatMap((b) => b.changes).some((c) => c.store === 'images' || c.store === 'files' || (c.store === 'meta' && c.key !== 'settings')));
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
    onPush: () => ['escritura']
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
  // Sin copia local del cuaderno de Nicole.
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  assert.ok(!dbs.some((n) => /^mi-cuaderno/.test(n)), JSON.stringify(dbs));
  // Cambiar notas (solo puede mirar escritura): se intenta, el servidor no lo guarda y se le avisa.
  await page.fill('#notes', 'intento de la psicóloga');
  await page.waitForTimeout(400);
  await page.evaluate(() => MC.sync.flush());
  await page.waitForSelector('.toast:not([hidden])', { timeout: 6000 });
  assert.match(await page.textContent('.toast'), /Este cuaderno es de Nicole: esta parte la podés mirar, pero no cambiar/);
  const sent = state.pushes.flatMap((b) => b.changes.map((c) => ({ ...c, owner: b.owner })));
  assert.ok(sent.length && sent.every((c) => c.owner === CA), 'todo va al cuaderno de Nicole');
  // Algo de una sección sin ningún permiso de edición (rutinas) ni siquiera se escribe en memoria.
  const blocked = await page.evaluate(() => MC.store.put('routines', { id: 'rut_x', title: 'x', rule: { type: 'daily' } }).then(() => 'ok', (e) => e.code));
  assert.equal(blocked, 'MC_READONLY');
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await context.close();
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

await browser.close();
server.close();
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} recorridos ok`);
process.exit(failed.length ? 1 : 0);
