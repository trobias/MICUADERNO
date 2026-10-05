// Subir cambios del cuaderno: la dueña, los suyos; quien tiene permiso de editar, al cuaderno compartido.
import { body, json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { toRows, validChange, withoutMedia, type Change } from '../../../../lib/sync';
import { dropMedia, media } from '../../../../lib/media';

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ owner?: string; changes?: unknown[] }>(req, 3_500_000);
  if (!b || !Array.isArray(b.changes) || b.changes.length > 500) return problem('Pedido demasiado grande o inválido.', 413);
  const changes = (b.changes.filter(validChange) as Change[]).map(withoutMedia);
  const owner = b.owner || who.id;
  const sb = await supabaseServer();

  let canWrite: (s: string) => boolean;
  if (owner === who.id) {
    if (!who.has_notebook) return problem('Esta cuenta no tiene cuaderno propio.', 403);
    canWrite = () => true;
  } else {
    const { data } = await sb.from('notebook_grants').select('section, level').eq('owner_id', owner).eq('grantee_id', who.id);
    const editable = new Set(((data as { section: string; level: string }[] | null) ?? []).filter((g) => g.level === 'editar').map((g) => g.section));
    canWrite = (s) => editable.has(s);
  }

  const { rows, skipped } = toRows(owner, who.id, changes, canWrite, Date.now());
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from('notebook_parts').upsert(rows.slice(i, i + 200) as never, { onConflict: 'owner_id,store,record_id,section' });
    if (error) return problem('No se pudo guardar en la nube. Se reintenta solo.', 503);
  }
  // Una foto o adjunto borrado del todo se lleva su contenido de Storage (si se pudo borrar la ficha).
  if (!skipped.includes('fotos')) {
    for (const c of changes) if (!c.record && media.isMedia(c.store)) await dropMedia(owner, c.store, c.key).catch(() => {});
  }
  return json({ ok: true, saved: rows.length, skipped, ignored: b.changes.length - changes.length });
}
