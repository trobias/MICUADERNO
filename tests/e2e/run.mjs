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
  await page.click('dialog.sheet button:has-text("Crear rutina")');
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
  assert.equal(json.schemaVersion, 3);
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

await test('el calendario reúne todo: rutinas planeadas, páginas del día y el año sin falsos puntos', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await goto(page, '#/rutinas');
  await page.click('button:has-text("Nueva rutina")');
  await page.fill('#rt-title', 'Estirar');
  await page.selectOption('#rt-freq', 'daily');
  await page.click('dialog.sheet button:has-text("Crear rutina")');
  await page.waitForSelector('.routine__title:has-text("Estirar")');
  await goto(page, '#/paginas');
  await page.click('button:has-text("Nueva página")');
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

  // Día → “Ver la rutina” → la rutina, resaltada y con el foco.
  await goto(page, '#/dia/' + TODAY);
  await page.click('button[aria-label="Más opciones para Estirar"]');
  await page.click('.menu__item:has-text("Ver la rutina")');
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
  const cell = (k) => page.locator(`#main .day-cell[data-date="${k}"]`);
  // Abrir hoy con el teclado y registrar el ánimo: el calendario de atrás se entera solo.
  await cell(TODAY).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#panel[open] .day-head');
  await page.click('#panel .section--mood .mood-patch[data-mood="4"]');
  const moodIs = (k, m) => page.waitForFunction(([k, m]) => { const c = document.querySelector(`#main .day-cell[data-date="${k}"]`); return c && c.dataset.mood === m; }, [k, m], { timeout: 4000 });
  await moodIs(TODAY, '4'); // el día ya muestra el ánimo detrás del cuadro
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
  await other2.evaluate(async (k) => { const d = await MC.model.getDay(k); d.evening.mood = 2; await MC.model.saveDay(d); }, TODAY);
  await moodIs(TODAY, '2'); // llegó el cambio de la otra pestaña, sin recargar
  assert.deepEqual(errors, []);
  assert.deepEqual(errors2, []);
  await context.close();
});

await test('agenda: anotar en cualquier día, verlo en el mes, pasarlo a otro día, sacarlo; páginas con su día', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  const add = (k, n) => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const later = add(TODAY, 3);
  await page.click('#panel .tab[data-tab="agenda"]');
  await page.waitForSelector('#panel #ag-what');
  // Sin nombre: el error aparece junto al campo.
  await page.click('#panel button:has-text("Poner en el calendario")');
  assert.match(await page.textContent('#ag-what-err'), /Escribí qué/);
  await page.fill('#ag-what', 'turno con la dentista');
  await page.fill('#ag-when', later);
  await page.click('#panel button:has-text("Poner en el calendario")');
  await page.waitForSelector(`#panel .agenda-day[data-date="${later}"] .activity`);
  // Detrás del cuadro, el mes ya lo cuenta como planeado.
  if (later.slice(0, 7) === TODAY.slice(0, 7)) {
    await page.waitForFunction((k) => { const c = document.querySelector(`#main .day-cell[data-date="${k}"] .mark-plan`); return c && /1/.test(c.textContent); }, later, { timeout: 4000 });
  }
  // Pasar a otro día desde su menú.
  const moved = add(TODAY, 5);
  await page.click('#panel button[aria-label="Más opciones para turno con la dentista"]');
  await page.click('.menu__item:has-text("Pasar a otro día")');
  await page.fill('dialog.sheet input[type="date"]', moved);
  await page.click('dialog.sheet button:has-text("Pasar")');
  await page.waitForSelector(`#panel .agenda-day[data-date="${moved}"] .activity`);
  assert.equal(await page.locator(`#panel .agenda-day[data-date="${later}"]`).count(), 0);
  // Sacar y deshacer.
  await page.click('#panel button[aria-label="Más opciones para turno con la dentista"]');
  await page.click('.menu__item:has-text("Sacar de la lista")');
  await page.waitForFunction(() => !document.querySelector('#panel .agenda-day .activity'));
  await page.click('.toast button:has-text("Deshacer")');
  await page.waitForSelector(`#panel .agenda-day[data-date="${moved}"] .activity`);
  // Una página para un día elegido aparece en ese día.
  await page.click('#panel button:has-text("Una página para ese día")');
  await page.fill('dialog.sheet #tp-day', moved);
  await page.click('dialog.sheet .template:has-text("En blanco")');
  await page.waitForSelector('#panel .page-meta a');
  assert.match(page.url(), /#\/pagina\//);
  assert.match(await page.getAttribute('#panel .page-meta a', 'href'), new RegExp('#/dia/' + moved + '$'));
  await goto(page, '#/dia/' + moved);
  await page.waitForSelector('#panel .day-pages a');
  assert.equal(await page.locator('#panel .activity').count(), 1, 'la actividad está en su día');
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
  await page.click('#panel button:has-text("Nueva página")');
  await page.click('.template:has-text("Para dibujar")');
  await page.waitForSelector('dialog.sheet--draw canvas');
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await context.close();
});

await test('mobile 375px: una pantalla, 5 botoncitos, sin scroll horizontal', async () => {
  const { page, errors, context } = await newPage(browser, { viewport: { width: 375, height: 760 } });
  await page.goto(FILE_URL);
  await onboard(page);
  for (const h of ['#/hoy', '#/calendario', '#/rutinas', '#/paginas', '#/anio', '#/ajustes']) {
    await goto(page, h);
    const over = await page.evaluate(() => { const p = document.getElementById('panel'); return Math.max(document.documentElement.scrollWidth - window.innerWidth, p.open ? p.scrollWidth - p.clientWidth : 0); });
    const culprit = over > 0 ? await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 4).map((e) => e.className || e.tagName).join(' | ')) : '';
    assert.ok(over <= 0, `${h} desborda ${over}px: ${culprit}`);
  }
  await goto(page, '#/calendario');
  const tabs = await page.$$eval('#tabs .tab', (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, bottom: r.bottom }; }));
  assert.equal(tabs.length, 6, 'cinco marcadores + ajustes');
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

await test('pantalla única: tocar un día abre su cuadro, cerrar vuelve al calendario, meses con un toque', async () => {
  const { page, errors, context } = await newPage(browser);
  await page.goto(FILE_URL);
  await onboard(page);
  await page.click('.section--mood .mood-patch[data-mood="3"]');
  await page.waitForTimeout(400);
  await page.click('#panel-close');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  assert.match(page.url(), /#\/calendario/);
  await page.waitForFunction((k) => { const c = document.querySelector(`#main .day-cell[data-date="${k}"]`); return c && c.dataset.mood === '3'; }, TODAY, { timeout: 4000 }); // el calendario ya tiene el ánimo
  // Otro día del mes
  const other = await page.$eval('.day-cell:not(.is-out)', (el) => el.dataset.date);
  await page.click(`.day-cell[data-date="${other}"]`);
  await page.waitForFunction(() => document.getElementById('panel').open);
  assert.match(page.url(), new RegExp('#/dia/' + other));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('panel').open);
  // Saltar de mes con la tira
  await page.click('.month-chip >> nth=0');
  await page.waitForSelector('.month-chip[aria-current="date"]');
  assert.match(await page.textContent('.month-chip[aria-current="date"]'), /ene/);
  assert.match(page.url(), /#\/calendario\/mes\/\d{4}-01/);
  // Marcadores: cada uno abre su cuadro, y con el cuadro abierto se pasa de uno a otro sin cerrar.
  await page.click('.tab[data-tab="agenda"]');
  await page.waitForSelector('#panel #ag-what');
  for (const [tab, sel] of [['rutinas', 'button:has-text("Nueva rutina")'], ['paginas', 'button:has-text("Nueva página")'], ['anio', '.hoop'], ['ajustes', '#st-name'], ['hoy', '.day-head']]) {
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
  await page.click('button:has-text("Nueva rutina")');
  await page.click('dialog.sheet button:has-text("Crear rutina")');
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

await browser.close();
server.close();
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} recorridos ok`);
process.exit(failed.length ? 1 : 0);
