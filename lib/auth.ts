// Quién pide y qué puede (D37). Toda ruta que lee o cambia algo pasa por acá; la RLS es la segunda llave.
import 'server-only';
import { currentUserId } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';
import { hasSupabase } from './env';

export type Profile = {
  id: string; username: string; display_name: string; is_admin: boolean;
  created_at: string; disabled_at: string | null; timezone: string; has_notebook: boolean;
};

export const PROFILE_COLUMNS = 'id, username, display_name, is_admin, created_at, disabled_at, timezone, has_notebook';

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

export type Share = { owner: string; name: string; sections: Record<string, 'ver' | 'editar'> };

/** Cuadernos que otras personas compartieron conmigo, con el nivel por sección. */
export async function sharesFor(userId: string): Promise<Share[]> {
  const sb = supabaseAdmin();
  const { data } = await sb.from('notebook_grants').select('owner_id, section, level').eq('grantee_id', userId);
  const rows = (data as { owner_id: string; section: string; level: 'ver' | 'editar' }[] | null) ?? [];
  const owners = [...new Set(rows.map((r) => r.owner_id))];
  if (!owners.length) return [];
  const { data: people } = await sb.from('profiles').select('id, display_name, disabled_at').in('id', owners);
  const alive = new Map(((people as { id: string; display_name: string; disabled_at: string | null }[] | null) ?? [])
    .filter((p) => !p.disabled_at).map((p) => [p.id, p.display_name]));
  return owners.filter((o) => alive.has(o)).map((o) => ({
    owner: o, name: alive.get(o)!,
    sections: Object.fromEntries(rows.filter((r) => r.owner_id === o).map((r) => [r.section, r.level]))
  }));
}

/** Qué cuaderno abre esta persona: el propio, o el primero que le compartieron. null si ninguno. */
export async function defaultView(p: Profile): Promise<string | null> {
  if (p.has_notebook) return p.id;
  const shares = await sharesFor(p.id);
  return shares[0]?.owner ?? null;
}
