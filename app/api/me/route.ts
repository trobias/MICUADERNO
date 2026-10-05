// Quién soy y qué cuadernos puedo abrir: el cuaderno lo consulta al abrir (con red) para saber si la sesión
// sigue viva y si abre el propio o el de quien le compartió (D38).
import { json, problem } from '../../../lib/http';
import { me, sharesFor } from '../../../lib/auth';

export async function GET() {
  const who = await me();
  if (!who) return problem('Sin sesión.', 401);
  return json({
    id: who.id, username: who.username, name: who.display_name, admin: who.is_admin,
    hasNotebook: who.has_notebook, shares: await sharesFor(who.id)
  });
}
