// Subir cambios del cuaderno: la dueña, los suyos; quien tiene permiso de editar, al cuaderno compartido.
import { body, json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { dropStale, toRows, validChange, withoutMedia, type Change, type Stamp } from '../../../../lib/sync';
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

  const out = toRows(owner, who.id, changes, canWrite, Date.now());
  let rows = out.rows;
  const skipped = out.skipped;
  // Quien edita un cuaderno ajeno nunca pisa una parte que la dueña ocultó (D53): la RLS la rechazaría y la cola
  // de esa persona se trabaría. Se saltea y se avisa como lo que no se puede escribir.
  if (owner !== who.id && rows.length) {
    const keys = [...new Set(rows.map((r) => r.record_id))];
    const { data: priv } = await supabaseAdmin().from('notebook_parts').select('store, record_id, section').eq('owner_id', owner).eq('private', true).in('record_id', keys);
    const blocked = new Set(((priv as { store: string; record_id: string; section: string }[] | null) ?? []).map((p) => p.store + '|' + p.record_id + '|' + p.section));
    rows = rows.filter((r) => {
      if (!blocked.has(r.store + '|' + r.record_id + '|' + r.section)) return true;
      if (!skipped.includes(r.section)) skipped.push(r.section);
      return false;
    });
  }
  // Gana el más nuevo (D54): una versión más vieja que la que ya está en la nube (por ejemplo, de un dispositivo
  // que estuvo sin conexión) no la pisa. Se compara la hora de cada registro (`updatedAt`) por pedazo.
  if (rows.length) {
    const keys = [...new Set(rows.map((r) => r.record_id))];
    const have: Stamp[] = [];
    for (let i = 0; i < keys.length; i += 200) {
      const { data } = await supabaseAdmin().from('notebook_parts').select('store, record_id, section, stamp:data->>updatedAt, deleted_at')
        .eq('owner_id', owner).in('record_id', keys.slice(i, i + 200));
      have.push(...(((data as Stamp[] | null) ?? [])));
    }
    rows = dropStale(rows, have);
  }
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
