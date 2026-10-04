// Permisos sobre MI cuaderno, por sección: ver o editar. Usa la sesión de la persona: la RLS
// (grants_insert/update/delete) impide tocar permisos de un cuaderno ajeno aunque este código fallara.
import { body, json, problem, sameOrigin } from '../../../lib/http';
import { audit, me } from '../../../lib/auth';
import { supabaseServer } from '../../../lib/supabase/server';
import { LEVELS, SECTION_IDS } from '../../../lib/sections';

export async function GET() {
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const sb = await supabaseServer();
  const { data, error } = await sb.from('notebook_grants').select('owner_id, grantee_id, section, level');
  if (error) return problem('No se pudieron leer los permisos.', 500);
  const rows = (data ?? []) as { owner_id: string; grantee_id: string; section: string; level: string }[];
  return json({ given: rows.filter((r) => r.owner_id === who.id), received: rows.filter((r) => r.grantee_id === who.id) });
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ grantee?: string; section?: string; level?: string | null }>(req);
  const grantee = String(b?.grantee ?? ''), section = String(b?.section ?? ''), level = b?.level ?? null;
  if (!SECTION_IDS.includes(section)) return problem('Sección desconocida.');
  if (grantee === who.id) return problem('Tu cuaderno ya es tuyo.');
  if (level !== null && !(LEVELS as readonly string[]).includes(level)) return problem('El permiso es “ver” o “editar”.');
  const sb = await supabaseServer();
  const q = level === null
    ? sb.from('notebook_grants').delete().eq('owner_id', who.id).eq('grantee_id', grantee).eq('section', section)
    : sb.from('notebook_grants').upsert({ owner_id: who.id, grantee_id: grantee, section, level } as never);
  const { error } = await q;
  if (error) return problem('No se pudo guardar el permiso.', 400);
  await audit(who.id, level ? 'permiso.da' : 'permiso.saca', grantee, { section, level });
  return json({ ok: true });
}
