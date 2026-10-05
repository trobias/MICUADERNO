// La apariencia del cuaderno de otra persona (D48): quien recibió algún permiso ve la tela y los colores que
// eligió la dueña, aunque no tenga permiso en “Ajustes”. Solo eso: nunca el resto de sus ajustes.
import { json, problem } from '../../../lib/http';
import { me } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { lookOf } from '../../../lib/look';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const owner = new URL(req.url).searchParams.get('owner') || who.id;
  if (!UUID.test(owner)) return problem('Cuaderno desconocido.', 404);
  const sb = supabaseAdmin();
  if (owner !== who.id) {
    const { data: grant } = await sb.from('notebook_grants').select('section').eq('owner_id', owner).eq('grantee_id', who.id).limit(1);
    if (!grant || !(grant as unknown[]).length) return problem('Este cuaderno no está compartido con vos.', 403);
    const { data: o } = await sb.from('profiles').select('disabled_at').eq('id', owner).maybeSingle();
    if (!o || (o as { disabled_at: string | null }).disabled_at) return problem('Este cuaderno no está compartido con vos.', 403);
  }
  const { data } = await sb.from('notebook_parts').select('data, deleted_at')
    .eq('owner_id', owner).eq('store', 'meta').eq('record_id', 'settings').eq('section', 'ajustes').maybeSingle();
  const row = data as { data: { value?: unknown } | null; deleted_at: string | null } | null;
  return json(lookOf(row && !row.deleted_at && row.data ? row.data.value : null));
}
