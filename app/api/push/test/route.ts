// “Probar aviso”: manda uno a los dispositivos de quien lo pide.
import { json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { pushReady, sendPush, type Sub } from '../../../../lib/push';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  if (!pushReady()) return problem('Los avisos todavía no están configurados en el servidor.', 503);
  const { data } = await supabaseAdmin().from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', who.id);
  const subs = (data as Sub[] | null) ?? [];
  const sent = await Promise.all(subs.map((s) => sendPush(s, { title: 'MI CUADERNO', body: 'Así se ven los avisos del cuaderno.', url: '/#/hoy', tag: 'prueba' })));
  return json({ sent: sent.filter(Boolean).length, of: subs.length });
}
