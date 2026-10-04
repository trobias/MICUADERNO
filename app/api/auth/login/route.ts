// Entrar con usuario + PIN. El PIN se verifica acá (Argon2id + pimienta) y recién entonces se abre la sesión
// de Supabase Auth con la contraseña derivada que solo conoce el servidor. D37.
import { cookies } from 'next/headers';
import { body, clientIp, json, PERSON_COOKIE, personCookieOptions, problem, sameOrigin } from '../../../../lib/http';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { supabaseServer } from '../../../../lib/supabase/server';
import { authEmail, derivedPassword, dummyHash, normalizeUsername, throttleDelayMs, verifyPin } from '../../../../lib/pin';
import { env } from '../../../../lib/env';
import { audit } from '../../../../lib/auth';

const WRONG = 'Ese usuario y PIN no coinciden. Probá de nuevo.';

type Throttle = { key: string; failed_count: number; next_try_at: string | null };

async function waitFor(keys: string[]): Promise<number> {
  const { data } = await supabaseAdmin().from('login_throttle').select('key, failed_count, next_try_at').in('key', keys);
  const now = Date.now();
  return Math.max(0, ...((data as Throttle[] | null) ?? []).map((t) => (t.next_try_at ? Date.parse(t.next_try_at) - now : 0)));
}

async function fail(keys: string[]) {
  const sb = supabaseAdmin();
  const { data } = await sb.from('login_throttle').select('key, failed_count').in('key', keys);
  const prev = new Map(((data as Throttle[] | null) ?? []).map((t) => [t.key, t.failed_count]));
  const rows = keys.map((key) => {
    const failed = (prev.get(key) ?? 0) + 1;
    const d = throttleDelayMs(failed);
    return { key, failed_count: failed, next_try_at: d ? new Date(Date.now() + d).toISOString() : null, updated_at: new Date().toISOString() };
  });
  await sb.from('login_throttle').upsert(rows as never);
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const b = await body<{ username?: string; pin?: string }>(req);
  const username = normalizeUsername(b?.username);
  const pin = String(b?.pin ?? '');
  if (!username || !pin) return problem('Escribí tu usuario y tu PIN.');

  const keys = ['u:' + username, 'ip:' + clientIp(req)];
  const wait = await waitFor(keys);
  if (wait > 0) {
    const min = Math.ceil(wait / 60000);
    return problem(`Por cuidado, esperá ${min === 1 ? 'un minuto' : min + ' minutos'} antes de probar de nuevo.`, 429);
  }

  const sb = supabaseAdmin();
  const { data: row } = await sb.from('profiles').select('id, pin_hash, disabled_at').eq('username', username).maybeSingle();
  const p = row as { id: string; pin_hash: string; disabled_at: string | null } | null;
  // Mismo trabajo exista o no el usuario: no se puede adivinar quién tiene cuenta por el tiempo de respuesta.
  const ok = await verifyPin(pin, p?.pin_hash ?? (await dummyHash(env.pinPepper())), env.pinPepper());
  if (!p || !ok || p.disabled_at) {
    await fail(keys);
    return problem(WRONG, 401);
  }

  const auth = await supabaseServer();
  const { error } = await auth.auth.signInWithPassword({
    email: authEmail(p.id, process.env.AUTH_EMAIL_DOMAIN || undefined), password: derivedPassword(p.id, env.authSecret())
  });
  if (error) return problem('No se pudo abrir la sesión. Probá de nuevo en un rato.', 503);

  await sb.from('login_throttle').delete().in('key', keys);
  (await cookies()).set(PERSON_COOKIE, p.id, personCookieOptions);
  await audit(p.id, 'sesion.entra', p.id);
  return json({ ok: true });
}
