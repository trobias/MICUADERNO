// Altas, PIN y bajas de personas (solo servidor, con la clave secreta). D37.
import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { env } from './env';
import { authEmail, derivedPassword, hashPin, NO_PIN, normalizeUsername, pinProblem, USERNAME_RE } from './pin';
import { audit, PROFILE_COLUMNS, type Profile } from './auth';

export type NewPerson = { username: unknown; displayName: unknown; pin: unknown; noPin?: unknown; isAdmin?: unknown; hasNotebook?: unknown };

export function personProblem(p: NewPerson): string | null {
  const u = normalizeUsername(p.username);
  if (!USERNAME_RE.test(u)) return 'El usuario va en minúsculas, de 3 a 32 letras o números (también . _ -).';
  const n = String(p.displayName ?? '').trim();
  if (!n || n.length > 60) return 'Escribí cómo se llama (hasta 60 letras).';
  // Sin PIN solo si se pidió así (la casilla “Sin PIN”, D47): entra con solo elegirla. Quien administra, siempre con PIN.
  if (p.noPin === true) return p.isAdmin === true ? 'Quien administra necesita un PIN (puede ver y cambiar todo).' : null;
  return pinProblem(p.pin);
}

export async function createPerson(actorId: string | null, p: NewPerson): Promise<{ id?: string; error?: string }> {
  const bad = personProblem(p);
  if (bad) return { error: bad };
  const sb = supabaseAdmin();
  const username = normalizeUsername(p.username);
  const { data: taken } = await sb.from('profiles').select('id').eq('username', username).maybeSingle();
  if (taken) return { error: 'Ese usuario ya existe. Probá con otro.' };

  // Primero la cuenta de Supabase Auth con un id propio, para derivar su contraseña desde ese id.
  const id = crypto.randomUUID();
  const created = await sb.auth.admin.createUser({
    id, email: authEmail(id, process.env.AUTH_EMAIL_DOMAIN || undefined), email_confirm: true,
    password: derivedPassword(id, env.authSecret()), app_metadata: { mc: true }
  } as never);
  if (created.error) return { error: 'No se pudo crear la cuenta. Probá de nuevo en un rato.' };

  const withPin = p.noPin !== true;
  const pin_hash = withPin ? await hashPin(String(p.pin), env.pinPepper()) : NO_PIN;
  const { error } = await sb.from('profiles').insert({
    id, username, display_name: String(p.displayName).trim(), pin_hash, is_admin: p.isAdmin === true, has_notebook: p.hasNotebook === true, created_by: actorId
  } as never);
  if (error) {
    await sb.auth.admin.deleteUser(id);
    return { error: 'No se pudo guardar a la persona. Probá de nuevo.' };
  }
  await audit(actorId, 'persona.alta', id, { username, admin: p.isAdmin === true, cuaderno: p.hasNotebook === true, pin: withPin });
  return { id };
}

export async function setPin(actorId: string, targetId: string, pin: unknown): Promise<string | null> {
  const bad = pinProblem(pin);
  if (bad) return bad;
  const pin_hash = await hashPin(String(pin), env.pinPepper());
  const { error } = await supabaseAdmin().from('profiles')
    .update({ pin_hash, pin_changed_at: new Date().toISOString() } as never).eq('id', targetId);
  if (error) return 'No se pudo cambiar el PIN. Probá de nuevo.';
  await audit(actorId, actorId === targetId ? 'pin.propio' : 'pin.admin', targetId);
  return null;
}

/** Dejar a otra persona sin PIN (D47): entra con solo elegirla. Nunca a quien administra ni a una misma. */
export async function removePin(actorId: string, targetId: string): Promise<string | null> {
  if (actorId === targetId) return 'Tu cuenta administra: necesita un PIN.';
  const sb = supabaseAdmin();
  const { data: t } = await sb.from('profiles').select('is_admin').eq('id', targetId).maybeSingle();
  if (!t) return 'Persona desconocida.';
  if ((t as { is_admin?: boolean }).is_admin) return 'Quien administra necesita un PIN.';
  const { error } = await sb.from('profiles').update({ pin_hash: NO_PIN, pin_changed_at: new Date().toISOString() } as never).eq('id', targetId);
  if (error) return 'No se pudo cambiar. Probá de nuevo.';
  await audit(actorId, 'pin.sin', targetId);
  return null;
}

/** Ids de las cuentas sin PIN (para mostrarlo en Mi cuenta; el hash nunca sale del servidor). */
export async function noPinIds(): Promise<Set<string>> {
  const { data } = await supabaseAdmin().from('profiles').select('id').eq('pin_hash', NO_PIN);
  return new Set(((data as { id: string }[] | null) ?? []).map((r) => r.id));
}

export async function listPeople(): Promise<Profile[]> {
  const { data } = await supabaseAdmin().from('profiles').select(PROFILE_COLUMNS).order('created_at');
  return (data as Profile[] | null) ?? [];
}

export async function countPeople(): Promise<number> {
  const { count } = await supabaseAdmin().from('profiles').select('id', { count: 'exact', head: true });
  return count ?? 0;
}

/** Pausar o reactivar: una persona pausada no entra y pierde los permisos que le dieron (RLS). */
export async function setDisabled(actorId: string, targetId: string, disabled: boolean): Promise<string | null> {
  if (actorId === targetId) return 'No podés pausar tu propia cuenta.';
  const sb = supabaseAdmin();
  const { error } = await sb.from('profiles').update({ disabled_at: disabled ? new Date().toISOString() : null } as never).eq('id', targetId);
  if (error) return 'No se pudo cambiar. Probá de nuevo.';
  // Corta también las sesiones abiertas en Supabase Auth.
  await sb.auth.admin.updateUserById(targetId, { ban_duration: disabled ? '876000h' : 'none' } as never);
  await audit(actorId, disabled ? 'persona.pausa' : 'persona.vuelve', targetId);
  return null;
}
