import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { me, sharesFor } from '../../lib/auth';
import { listPeople } from '../../lib/people';
import { supabaseServer } from '../../lib/supabase/server';
import { SECTIONS } from '../../lib/sections';
import { ChangePin, Logout, Notices, People, Shared, Sharing } from './parts';

export const metadata = { title: 'Mi cuenta · MI CUADERNO' };

export default async function Page() {
  const who = await me();
  if (!who) redirect('/entrar');
  const sb = await supabaseServer();
  const shares = await sharesFor(who.id);
  const current = (await cookies()).get('mc_view')?.value ?? null;
  const labels = Object.fromEntries(SECTIONS.map((x) => [x.id, x.label]));
  const { data: grants } = await sb.from('notebook_grants').select('grantee_id, section, level').eq('owner_id', who.id);
  // Con quién se puede compartir: quien administra ve a todas; las demás personas, a quienes ya comparten algo.
  const people = who.is_admin ? await listPeople() : [];
  const visible = who.is_admin ? people
    : (((await sb.from('profiles').select('id, username, display_name, disabled_at')).data ?? []) as { id: string; username: string; display_name: string; disabled_at: string | null }[]);
  const others = visible.filter((p) => p.id !== who.id && !p.disabled_at).map((p) => ({ id: p.id, name: p.display_name, username: p.username }));
  return (
    <main className="sheet sheet--wide">
      {(who.has_notebook || shares.length > 0) && <p><a className="back" href="/">← Volver al cuaderno</a></p>}
      <h1>Mi cuenta</h1>
      <p className="lead">{who.display_name} · usuario <strong>{who.username}</strong>{who.is_admin ? ' · administra el cuaderno' : ''}</p>

      <section className="block" aria-labelledby="pin-h"><h2 id="pin-h">Cambiar mi PIN</h2><ChangePin /></section>
      <section className="block" aria-labelledby="avisos-h"><h2 id="avisos-h">Avisos en este dispositivo</h2><Notices vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''} /></section>
      {who.is_admin && (
        <section className="block" aria-labelledby="personas-h">
          <h2 id="personas-h">Personas</h2>
          <People me={who.id} people={people.map((p) => ({ id: p.id, name: p.display_name, username: p.username, admin: p.is_admin, disabled: !!p.disabled_at, hasNotebook: p.has_notebook }))} />
        </section>
      )}
      {who.has_notebook && (
        <section className="block" aria-labelledby="compartir-h">
          <h2 id="compartir-h">Quién puede ver mi cuaderno</h2>
          <Sharing sections={SECTIONS} people={others} grants={(grants ?? []) as { grantee_id: string; section: string; level: string }[]} />
        </section>
      )}
      {(shares.length > 0 || !who.has_notebook) && (
        <section className="block" aria-labelledby="compartidos-h">
          <h2 id="compartidos-h">Cuadernos que podés abrir</h2>
          <Shared shares={shares} current={current} labels={labels} />
        </section>
      )}
      <section className="block"><Logout /></section>
    </main>
  );
}
