// Traer partes del cuaderno cambiadas desde `since`. La RLS decide qué partes ve cada quien: la dueña todas;
// quien recibió permiso, las de sus secciones y nunca las privadas.
import { json, problem } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { supabaseServer } from '../../../../lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 1000;

export async function GET(req: Request) {
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const url = new URL(req.url);
  const owner = url.searchParams.get('owner') || who.id;
  if (!UUID.test(owner)) return problem('Cuaderno desconocido.', 404);
  const since = url.searchParams.get('since') || '1970-01-01T00:00:00Z';
  if (Number.isNaN(Date.parse(since))) return problem('Fecha inválida.');
  // Opcional: un solo registro (para reintentar una foto que llegó sin poder bajar su contenido, NB1).
  const store = url.searchParams.get('store'), id = url.searchParams.get('id');
  if ((store && !/^[a-z]{1,20}$/.test(store)) || (id && id.length > 160)) return problem('Pedido inválido.');
  const sb = await supabaseServer();
  let q = sb.from('notebook_parts')
    .select('store, record_id, section, data, deleted_at, updated_at, updated_by')
    .eq('owner_id', owner).gt('updated_at', since);
  if (store && id) q = q.eq('store', store).eq('record_id', id);
  const { data, error } = await q.order('updated_at').limit(PAGE);
  if (error) return problem('No se pudo leer el cuaderno.', 503);
  const parts = data ?? [];
  return json({ parts, more: parts.length === PAGE });
}
