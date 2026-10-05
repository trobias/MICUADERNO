import { connection } from 'next/server';
import Setup from './setup';
import { hasSupabase } from '../../lib/env';
import { countPeople } from '../../lib/people';

export const metadata = { title: 'Preparar · MI CUADERNO' };

export default async function Page({ searchParams }: { searchParams: Promise<{ clave?: string | string[] }> }) {
  await connection();
  const raw = (await searchParams).clave;
  const clave = typeof raw === 'string' ? raw.slice(0, 200) : '';
  const ready = hasSupabase() && !!process.env.SUPABASE_SECRET_KEY;
  const people = ready ? await countPeople().catch(() => -1) : -1;
  return (
    <main className="sheet">
      <h1>Preparar el cuaderno</h1>
      {people === 0 ? (
        <>
          <p className="lead">{clave
            ? 'Elegí cómo querés que te llame, tu usuario y un PIN de 6 números. Con esta cuenta vas a poder sumar a otras personas y decidir qué ve cada una.'
            : 'Esta es la primera cuenta: va a administrar a las demás personas y sus permisos.'}</p>
          <Setup clave={clave} />
        </>
      ) : people > 0 ? (
        <p className="lead">El cuaderno ya está preparado. <a className="back" href="/entrar">Entrar</a></p>
      ) : (
        <p className="lead">Todavía falta conectar la base de datos (ver docs/NUBE.md).</p>
      )}
    </main>
  );
}
