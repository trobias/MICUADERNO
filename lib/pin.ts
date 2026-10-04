// PIN, usuario y demoras de ingreso (D37). Funciones puras: los secretos llegan por parámetro (tests/cloud).
import { argon2id, argon2Verify } from 'hash-wasm';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Argon2id con parámetros de OWASP (19 MiB, 2 pasadas) y la pimienta como `secret` del algoritmo.
const ARGON = { iterations: 2, parallelism: 1, memorySize: 19456, hashLength: 32 } as const;

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeUsername(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

/** null si el PIN sirve (6 números, D36); si no, por qué (texto amable para mostrar). */
export function pinProblem(pin: unknown): string | null {
  const p = String(pin ?? '');
  if (!/^\d{6}$/.test(p)) return 'El PIN tiene que tener 6 números.';
  if (/^(\d)\1+$/.test(p)) return 'Elegí un PIN que no repita el mismo número.';
  const up = '01234567890', down = '09876543210';
  if (up.includes(p) || down.includes(p)) return 'Elegí un PIN que no sea una escalera de números.';
  return null;
}

export async function hashPin(pin: string, pepper: string): Promise<string> {
  return argon2id({ ...ARGON, password: pin, secret: pepper, salt: randomBytes(16), outputType: 'encoded' });
}

export async function verifyPin(pin: string, hash: string, pepper: string): Promise<boolean> {
  try { return await argon2Verify({ password: pin, hash, secret: pepper }); } catch { return false; }
}

/** Hash de mentira para comparar igual cuando el usuario no existe (mismo tiempo de respuesta). */
let dummy: Promise<string> | null = null;
export function dummyHash(pepper: string): Promise<string> {
  return (dummy ??= hashPin('000000', pepper));
}

/** Contraseña de Supabase Auth de una persona: la conoce solo el servidor; el PIN nunca viaja a Supabase. */
export function derivedPassword(userId: string, authSecret: string): string {
  return createHmac('sha256', authSecret).update('mc-auth:' + userId).digest('base64url');
}

/** Correo interno de Supabase Auth (nunca se usa para escribirle a nadie). */
export function authEmail(userId: string, domain = 'personas.mi-cuaderno.invalid'): string {
  return `${userId}@${domain}`;
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Demora después de `failed` intentos fallidos: 3 libres, después 30 s, 1, 2, 4… hasta 1 hora. */
export function throttleDelayMs(failed: number): number {
  if (failed < 3) return 0;
  return Math.min(30_000 * 2 ** (failed - 3), 3_600_000);
}
