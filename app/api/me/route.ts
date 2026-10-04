// Quién soy: el cuaderno lo consulta al abrir (con red) para saber si la sesión sigue viva.
import { json, problem } from '../../../lib/http';
import { me } from '../../../lib/auth';

export async function GET() {
  const who = await me();
  if (!who) return problem('Sin sesión.', 401);
  return json({ id: who.id, username: who.username, name: who.display_name, admin: who.is_admin });
}
