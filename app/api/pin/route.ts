// Cambiar el propio PIN (pide el actual; una cuenta sin PIN se pone uno, D47).
import { body, json, problem, sameOrigin } from '../../../lib/http';
import { me } from '../../../lib/auth';
import { setPin } from '../../../lib/people';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { NO_PIN, verifyPin } from '../../../lib/pin';
import { env } from '../../../lib/env';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ current?: string; next?: string }>(req);
  const { data } = await supabaseAdmin().from('profiles').select('pin_hash').eq('id', who.id).single();
  const hash = (data as unknown as { pin_hash: string } | null)?.pin_hash ?? '';
  // Una cuenta sin PIN (D47) se pone uno sin “PIN actual”.
  const ok = hash === NO_PIN || await verifyPin(String(b?.current ?? ''), hash, env.pinPepper());
  if (!ok) return problem('El PIN actual no coincide.', 401);
  const err = await setPin(who.id, who.id, b?.next);
  return err ? problem(err) : json({ ok: true });
}
