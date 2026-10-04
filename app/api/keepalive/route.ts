// Latido diario (Vercel Cron): una escritura real en la base para que el proyecto gratuito de Supabase no se
// pause por inactividad (se pausa tras ~7 días sin uso). Pedido de la dueña, D37.
import { json, problem } from '../../../lib/http';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { cronAllowed } from '../../../lib/push';

export async function GET(req: Request) {
  if (!cronAllowed(req)) return problem('No autorizado.', 401);
  const at = new Date().toISOString();
  const { error } = await supabaseAdmin().from('keepalive').update({ beat_at: at } as never).eq('id', 1);
  if (error) return problem('La base no respondió.', 503);
  return json({ ok: true, at });
}
