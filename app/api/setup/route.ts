// Primera persona (administradora). Solo funciona si todavía no hay nadie y con SETUP_TOKEN.
import { body, json, problem, sameOrigin } from '../../../lib/http';
import { countPeople, createPerson } from '../../../lib/people';
import { env } from '../../../lib/env';
import { safeEqual } from '../../../lib/pin';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const b = await body<{ token?: string; username?: string; displayName?: string; pin?: string }>(req);
  const token = env.setupToken();
  if (!token || !safeEqual(String(b?.token ?? ''), token)) return problem('La clave de preparación no coincide.', 403);
  if ((await countPeople()) > 0) return problem('El cuaderno ya tiene personas. Entrá con tu usuario.', 409);
  const r = await createPerson(null, { username: b?.username, displayName: b?.displayName, pin: b?.pin, isAdmin: true, hasNotebook: true });
  if (r.error) return problem(r.error);
  return json({ ok: true });
}
