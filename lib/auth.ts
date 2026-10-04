// Quién pide y qué puede (D37). Toda ruta que lee o cambia algo pasa por acá; la RLS es la segunda llave.
import 'server-only';
import { currentUserId } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';
import { hasSupabase } from './env';

export type Profile = {
  id: string; username: string; display_name: string; is_admin: boolean;
  created_at: string; disabled_at: string | null; timezone: string;
};

export const PROFILE_COLUMNS = 'id, username, display_name, is_admin, created_at, disabled_at, timezone';

/** La persona con sesión y su perfil habilitado, o null. */
export async function me(): Promise<Profile | null> {
  if (!hasSupabase()) return null;
  const id = await currentUserId();
  if (!id) return null;
  const { data } = await supabaseAdmin().from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
  const p = data as Profile | null;
  return p && !p.disabled_at ? p : null;
}

export async function audit(actor: string | null, action: string, target: string | null, detail: Record<string, unknown> = {}) {
  // Nunca contenido del cuaderno ni PIN: solo qué pasó y entre quiénes.
  await supabaseAdmin().from('audit_events').insert({ actor_id: actor, action, target_id: target, detail } as never);
}
