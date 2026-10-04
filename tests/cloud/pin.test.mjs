// PIN y usuario (lib/pin.ts). Node 22 corre TypeScript borrando tipos, sin compilar.
import test from 'node:test';
import assert from 'node:assert';
import * as P from '../../lib/pin.ts';

test('el PIN se guarda con Argon2id + pimienta y se verifica', async () => {
  const h = await P.hashPin('258031', 'pimienta');
  assert.match(h, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.ok(!h.includes('258031'));
  assert.strictEqual(await P.verifyPin('258031', h, 'pimienta'), true);
  assert.strictEqual(await P.verifyPin('258032', h, 'pimienta'), false);
  assert.strictEqual(await P.verifyPin('258031', h, 'otra'), false, 'sin la pimienta no alcanza');
  assert.strictEqual(await P.verifyPin('258031', 'basura', 'pimienta'), false);
  assert.notStrictEqual(await P.hashPin('258031', 'pimienta'), h, 'cada hash con su sal');
});

test('reglas del PIN, amables', () => {
  assert.strictEqual(P.pinProblem('258031'), null);
  assert.strictEqual(P.pinProblem('739146'), null);
  assert.ok(P.pinProblem('2580'), 'cuatro números no alcanzan');
  assert.ok(P.pinProblem('73914625'), 'son seis');
  assert.ok(P.pinProblem('12a456'));
  assert.ok(P.pinProblem('000000'));
  assert.ok(P.pinProblem('123456'));
  assert.ok(P.pinProblem('987654'));
  assert.ok(P.pinProblem(undefined));
});

test('usuario', () => {
  assert.strictEqual(P.normalizeUsername('  Nicole '), 'nicole');
  assert.ok(P.USERNAME_RE.test('nicole'));
  assert.ok(!P.USERNAME_RE.test('ni'));
  assert.ok(!P.USERNAME_RE.test('-nicole'));
  assert.ok(!P.USERNAME_RE.test('nicole@x'));
});

test('contraseña derivada: estable, distinta por persona y por secreto', () => {
  const a = P.derivedPassword('id-1', 's1');
  assert.strictEqual(a, P.derivedPassword('id-1', 's1'));
  assert.notStrictEqual(a, P.derivedPassword('id-2', 's1'));
  assert.notStrictEqual(a, P.derivedPassword('id-1', 's2'));
  assert.ok(a.length >= 43);
  assert.strictEqual(P.authEmail('abc'), 'abc@personas.mi-cuaderno.invalid');
});

test('demoras progresivas', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map(P.throttleDelayMs), [0, 0, 0, 30000, 60000, 120000]);
  assert.strictEqual(P.throttleDelayMs(50), 3600000);
  assert.ok(P.safeEqual('abc', 'abc'));
  assert.ok(!P.safeEqual('abc', 'abd'));
  assert.ok(!P.safeEqual('abc', 'abcd'));
});
