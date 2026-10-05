import { connection } from 'next/server';
import Login, { type Chooser } from './login';
import { supabaseAdmin } from '../../lib/supabase/admin';
import { hasSupabase } from '../../lib/env';

export const metadata = { title: 'Entrar · MI CUADERNO' };

/**
 * Las personas habilitadas, para elegir con un toque (pedido de la dueña, D41). Solo el nombre, el usuario y si
 * administra: nunca el PIN ni nada del cuaderno. Si la base no responde, se escribe el usuario a mano.
 */
async function people(): Promise<Chooser[] | null> {
  if (!hasSupabase()) return null;
  try {
    const { data, error } = await supabaseAdmin().from('profiles').select('username, display_name, is_admin, disabled_at').is('disabled_at', null).order('is_admin', { ascending: false }).order('display_name');
    if (error || !data) return null;
    return (data as { username: string; display_name: string; is_admin: boolean }[]).map((p) => ({ username: p.username, name: p.display_name, admin: p.is_admin }));
  } catch {
    return null;
  }
}

export default async function Page() {
  await connection(); // la lista se arma en cada visita (personas nuevas o dadas de baja)
  const list = await people();
  return (
    <main className="sheet">
      <h1>MI CUADERNO</h1>
      <p className="lead">{list && list.length ? 'Elegí quién sos y escribí tu PIN.' : 'Escribí tu usuario y tu PIN para abrir tu cuaderno.'}</p>
      <Login people={list} vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''} />
      <p className="note">Si te olvidaste el PIN, pedíselo a quien administra el cuaderno: lo puede cambiar.</p>
      <p className="note">
        ¿Todavía no tenés cuenta? No se crea desde acá (así nadie de afuera puede sumarse): quien administra la arma en
        <strong> Mi cuenta → Personas → Sumar una persona</strong>, con tu usuario, un PIN y si tenés tu propio cuaderno.
        {list && list.length ? null : ' La primera cuenta, la de quien administra, se prepara una sola vez con el enlace de preparación.'}
      </p>
    </main>
  );
}
