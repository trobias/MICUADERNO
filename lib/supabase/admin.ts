// Cliente con la clave secreta: salta la RLS. Solo para lo que el navegador nunca puede hacer (altas, PIN,
// demoras de ingreso, avisos, latido), siempre después de comprobar en el servidor quién pide qué.
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

let client: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.secretKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }
  return client;
}
