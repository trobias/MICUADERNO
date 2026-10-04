// Guardar o sacar el aviso de ESTE dispositivo, con los horarios elegidos.
import { body, json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { supabaseServer } from '../../../../lib/supabase/server';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ endpoint?: string; keys?: { p256dh?: string; auth?: string }; morning?: string | null; evening?: string | null }>(req);
  const endpoint = String(b?.endpoint ?? '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !b?.keys?.p256dh || !b.keys.auth) return problem('Este navegador no dio una suscripción válida.');
  const morning = b.morning && TIME.test(b.morning) ? b.morning : null;
  const evening = b.evening && TIME.test(b.evening) ? b.evening : null;
  const sb = await supabaseServer();
  const { error } = await sb.from('push_subscriptions').upsert({
    endpoint, user_id: who.id, p256dh: String(b.keys.p256dh).slice(0, 200), auth: String(b.keys.auth).slice(0, 100), morning, evening
  } as never);
  return error ? problem('No se pudo guardar el aviso.', 400) : json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ endpoint?: string }>(req);
  const sb = await supabaseServer();
  await sb.from('push_subscriptions').delete().eq('endpoint', String(b?.endpoint ?? '')).eq('user_id', who.id);
  return json({ ok: true });
}
