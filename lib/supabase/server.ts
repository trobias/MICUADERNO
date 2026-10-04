// Cliente de Supabase con la sesión de la persona (cookies). Sus consultas pasan por la RLS.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl(), env.publishableKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // En un Server Component no se pueden escribir cookies; el proxy ya las renueva en cada pedido.
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* lectura */ }
      }
    }
  });
}

/** Quién está con sesión, verificado (getClaims valida el JWT). null si nadie. */
export async function currentUserId(): Promise<string | null> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return String(data.claims.sub);
}
