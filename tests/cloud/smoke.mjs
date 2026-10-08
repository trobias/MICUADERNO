// Humo de la nube sin Supabase: `next start` sirve el cuaderno con sus cabeceras (CSP estricta) y la cuenta.
// Requiere `npm run build` antes. Uso: npm run e2e:cloud  (puerto 4300 o CLOUD_PORT=…)
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = +(process.env.CLOUD_PORT || 4300);
const BASE = `http://127.0.0.1:${PORT}`;
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
delete env.NEXT_PUBLIC_SUPABASE_URL; delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT), '-H', '127.0.0.1'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
server.stdout.on('data', (d) => { log += d; });
server.stderr.on('data', (d) => { log += d; });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* ya terminó */ } };

let ok = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); ok++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n    ')); }
}

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + '/entrar')).ok) break; } catch { /* todavía no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });

  await check('el cuaderno abre en / con CSP estricta y sin errores', async () => {
    const res = await fetch(BASE + '/');
    assert.equal(res.status, 200);
    const csp = res.headers.get('content-security-policy') || '';
    assert.match(csp, /script-src 'self';/);
    assert.ok(!/unsafe-inline'[^;]*;/.test(csp.split('script-src')[1].split(';')[0]), 'el cuaderno no permite scripts en línea');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '/');
    await page.locator('.cover__board').click();
    await page.fill('#ob-name', 'Nicole');
    await page.click('button:has-text("Seguir")');
    await page.click('button:has-text("Seguir")');
    await page.click('[data-cover="lavanda"]');
    await page.click('button:has-text("Abrir mi cuaderno")');
    await page.waitForSelector('.day-head');
    await page.fill('#notes', 'probando en la nube');
    await page.evaluate(() => navigator.serviceWorker.ready);
    assert.equal(await page.evaluate(() => MC.cloud.on), false, 'sin Supabase no hay cuentas');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('ingreso y preparación se dibujan con los estilos del cuaderno', async () => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE + '/entrar');
    await page.waitForSelector('input[name="username"]');
    const font = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
    assert.match(font, /Young Serif/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin scroll horizontal a 375px');
    const pin = page.locator('input[name="pin"]');
    await pin.fill('583');
    assert.equal(await page.locator('.pin-entry__dot').count(), 3);
    await pin.press('Control+A'); await pin.press('Backspace');
    assert.equal(await page.locator('.pin-entry__dot').count(), 0);
    // Pegado completo y edición usan el mismo campo real, sin exponer dígitos en las casillas.
    await pin.fill('583927');
    assert.equal(await pin.inputValue(), '583927');
    assert.equal(await page.locator('.pin-entry__dot').count(), 6);
    assert.equal(await pin.evaluate(el => el.validity.valid), true);
    assert.equal(await page.locator('.pin-entry__cells').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('.pin-entry__cells').textContent(), '');
    const pinBox = await pin.boundingBox();
    await pin.click({ position: { x: pinBox.width / 4, y: pinBox.height / 2 } });
    assert.equal(await pin.evaluate(el => el.selectionStart), 1, 'tocar la segunda casilla permite editar ese lugar');
    await pin.press('Delete'); await pin.press('8');
    assert.equal(await pin.inputValue(), '583927');
    await page.goto(BASE + '/preparar');
    assert.match(await page.textContent('main'), /falta conectar la base/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('la API no responde nada sin sesión ni sin el secreto del cron', async () => {
    assert.equal((await fetch(BASE + '/api/me')).status, 401);
    assert.equal((await fetch(BASE + '/api/keepalive')).status, 401);
    assert.equal((await fetch(BASE + '/api/push/cron')).status, 401);
    const cross = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { origin: 'https://otro.example', 'content-type': 'application/json' }, body: '{}' });
    assert.equal(cross.status, 403, 'pedido de otro sitio');
    assert.equal((await fetch(BASE + '/api/people')).status, 401);
  });

  await browser.close();
} finally {
  stop();
}
console.log(`\n${ok}/${ok + failed} comprobaciones de la nube ok`);
if (failed) console.log(log.slice(-2000));
process.exit(failed ? 1 : 0);
