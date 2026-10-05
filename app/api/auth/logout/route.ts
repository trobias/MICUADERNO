import { cookies } from 'next/headers';
import { json, PERSON_COOKIE, problem, sameOrigin, VIEW_COOKIE } from '../../../../lib/http';
import { supabaseServer } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const sb = await supabaseServer();
  await sb.auth.signOut({ scope: 'local' });
  const jar = await cookies();
  jar.delete(PERSON_COOKIE);
  jar.delete(VIEW_COOKIE);
  return json({ ok: true });
}
