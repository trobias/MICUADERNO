// Personas del cuaderno: solo quien administra las ve todas y crea nuevas.
import { body, json, problem, sameOrigin } from '../../../lib/http';
import { me } from '../../../lib/auth';
import { createPerson, listPeople } from '../../../lib/people';

export async function GET() {
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  if (!who.is_admin) return problem('Solo quien administra ve a todas las personas.', 403);
  return json({ people: await listPeople() });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  if (!who.is_admin) return problem('Solo quien administra puede sumar personas.', 403);
  const b = await body<{ username?: string; displayName?: string; pin?: string; isAdmin?: boolean; hasNotebook?: boolean }>(req);
  const r = await createPerson(who.id, { username: b?.username, displayName: b?.displayName, pin: b?.pin, isAdmin: b?.isAdmin === true, hasNotebook: b?.hasNotebook === true });
  return r.error ? problem(r.error) : json({ id: r.id }, 201);
}
