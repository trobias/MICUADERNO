'use client';
import { useState } from 'react';
import { b64ToBytes, send, useNote } from '../form';

export function ChangePin() {
  const note = useNote();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    if (f.get('next') !== f.get('next2')) { note.problem('Los dos PIN nuevos no coinciden.'); return; }
    const r = await send('/api/pin', 'POST', { current: f.get('current'), next: f.get('next') });
    if (r.ok) { form.reset(); note.ok('Listo: tu PIN nuevo ya vale.'); } else note.problem(String(r.data.error || 'No se pudo cambiar.'));
  }
  return (
    <form className="form" onSubmit={submit}>
      <label>PIN actual<input name="current" type="password" inputMode="numeric" autoComplete="current-password" required /></label>
      <label>PIN nuevo<input name="next" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      <label>Repetí el PIN nuevo<input name="next2" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      {note.view}
      <div className="row"><button className="label-btn label-btn--soft">Cambiar PIN</button></div>
    </form>
  );
}

export function Logout() {
  async function out() {
    await send('/api/auth/logout', 'POST');
    location.replace('/entrar');
  }
  return (
    <div className="row">
      <button className="label-btn label-btn--soft" onClick={out}>Cerrar sesión en este dispositivo</button>
      <p className="note">Lo que escribiste queda guardado en este dispositivo, separado del de otras personas.</p>
    </div>
  );
}

export function Notices({ vapid }: { vapid: string }) {
  const note = useNote();
  const [morning, setMorning] = useState('08:30');
  const [evening, setEvening] = useState('21:30');
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!vapid) return <p className="note">Los avisos todavía no están configurados en el servidor.</p>;
  if (!supported) return <p className="note">Este navegador no permite avisos. En iPhone, primero agregá el cuaderno a la pantalla de inicio.</p>;
  async function turnOn() {
    // El permiso se pide solo acá, cuando la persona lo elige (nunca al abrir).
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { note.problem('Sin permiso para avisar. Lo podés habilitar en los ajustes del navegador.'); return; }
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapid) }));
    const r = await send('/api/push/subscribe', 'POST', { ...sub.toJSON(), morning: morning || null, evening: evening || null });
    if (r.ok) note.ok('Listo: este dispositivo va a recibir los avisos.'); else note.problem(String(r.data.error || 'No se pudo.'));
  }
  async function turnOff() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) { await send('/api/push/subscribe', 'DELETE', { endpoint: sub.endpoint }); await sub.unsubscribe(); }
    note.ok('Este dispositivo ya no recibe avisos.');
  }
  async function test() {
    const r = await send('/api/push/test', 'POST');
    if (r.ok) note.ok(r.data.of ? 'Aviso enviado.' : 'Primero activá los avisos en este dispositivo.'); else note.problem(String(r.data.error || 'No se pudo.'));
  }
  return (
    <div className="form">
      <div className="row">
        <label>A la mañana<input type="time" value={morning} onChange={(e) => setMorning(e.target.value)} /></label>
        <label>A la noche<input type="time" value={evening} onChange={(e) => setEvening(e.target.value)} /></label>
      </div>
      <p className="note">Los avisos nunca muestran lo que escribiste. Dejá un horario vacío si no lo querés.</p>
      {note.view}
      <div className="row">
        <button className="label-btn label-btn--soft" onClick={turnOn}>Activar o actualizar</button>
        <button className="label-btn label-btn--soft" onClick={test}>Probar</button>
        <button className="label-btn label-btn--soft" onClick={turnOff}>Desactivar</button>
      </div>
    </div>
  );
}

type Person = { id: string; name: string; username: string; admin: boolean; disabled: boolean; hasNotebook: boolean };

export function People({ me, people }: { me: string; people: Person[] }) {
  const note = useNote();
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    const r = await send('/api/people', 'POST', { displayName: f.get('displayName'), username: f.get('username'), pin: f.get('pin'), isAdmin: f.get('isAdmin') === 'on', hasNotebook: f.get('kind') === 'propio' });
    if (r.ok) location.reload(); else note.problem(String(r.data.error || 'No se pudo.'));
  }
  async function resetPin(p: Person) {
    const pin = prompt(`PIN nuevo para ${p.name} (6 números):`);
    if (!pin) return;
    const r = await send(`/api/people/${p.id}`, 'PATCH', { pin });
    if (r.ok) note.ok(`Listo: ${p.name} ya puede entrar con su PIN nuevo.`); else note.problem(String(r.data.error || 'No se pudo.'));
  }
  async function toggle(p: Person) {
    const r = await send(`/api/people/${p.id}`, 'PATCH', { disabled: !p.disabled });
    if (r.ok) location.reload(); else note.problem(String(r.data.error || 'No se pudo.'));
  }
  return (
    <div className="form">
      <ul className="people">
        {people.map((p) => (
          <li key={p.id}>
            <span className="who">{p.name}</span>
            <span className="meta">usuario {p.username} · {p.hasNotebook ? 'su propio cuaderno' : 'mira cuadernos compartidos'}{p.admin ? ' · administra' : ''}{p.disabled ? ' · en pausa' : ''}</span>
            {p.id !== me && (
              <div className="row">
                <button className="label-btn label-btn--soft" onClick={() => resetPin(p)}>Cambiar su PIN</button>
                <button className="label-btn label-btn--soft" onClick={() => toggle(p)}>{p.disabled ? 'Reactivar' : 'Poner en pausa'}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form className="form" onSubmit={create}>
        <h2>Sumar una persona</h2>
        <label>Cómo se llama<input name="displayName" maxLength={60} required /></label>
        <label>Usuario<input name="username" autoCapitalize="none" spellCheck={false} required /></label>
        <label>PIN inicial<input name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
        <fieldset className="choice">
          <legend>Qué cuaderno usa</legend>
          <label className="check"><input type="radio" name="kind" value="invitada" defaultChecked /> Mira mi cuaderno, con los permisos que le dé abajo</label>
          <label className="check"><input type="radio" name="kind" value="propio" /> Tiene su propio cuaderno</label>
        </fieldset>
        <label className="check"><input type="checkbox" name="isAdmin" /> También administra (suma personas y cambia PIN)</label>
        {note.view}
        <div className="row"><button className="label-btn">Sumar persona</button></div>
      </form>
    </div>
  );
}

type Grant = { grantee_id: string; section: string; level: string };

export function Sharing({ sections, people, grants }: { sections: { id: string; label: string }[]; people: { id: string; name: string; username: string }[]; grants: Grant[] }) {
  const note = useNote();
  const [rows, setRows] = useState(grants);
  if (!people.length) return <p className="note">Todavía no hay otras personas con quien compartir. Quien administra las puede sumar.</p>;
  const level = (g: string, s: string) => rows.find((r) => r.grantee_id === g && r.section === s)?.level ?? '';
  async function change(grantee: string, section: string, value: string) {
    const r = await send('/api/grants', 'PUT', { grantee, section, level: value || null });
    if (!r.ok) { note.problem(String(r.data.error || 'No se pudo.')); return; }
    setRows((prev) => [...prev.filter((x) => !(x.grantee_id === grantee && x.section === section)), ...(value ? [{ grantee_id: grantee, section, level: value }] : [])]);
    note.ok('Guardado.');
  }
  return (
    <div className="form">
      <p className="note">Por sección: nada, ver o editar. Ver deja mirar esa parte de tu cuaderno; editar también deja escribir, cambiar y borrar en ella. “Fotos y adjuntos” incluye las imágenes, los dibujos y los archivos adjuntos.</p>
      <div className="table-scroll">
        <table className="grants">
          <thead><tr><th scope="col">Sección</th>{people.map((p) => <th key={p.id} scope="col">{p.name}</th>)}</tr></thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <th scope="row">{s.label}</th>
                {people.map((p) => (
                  <td key={p.id}>
                    <select aria-label={`${s.label} para ${p.name}`} value={level(p.id, s.id)} onChange={(e) => change(p.id, s.id, e.target.value)}>
                      <option value="">nada</option><option value="ver">ver</option><option value="editar">editar</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note.view}
    </div>
  );
}

type Share = { owner: string; name: string; sections: Record<string, string> };

/** Cuadernos que otras personas me compartieron: abrir uno lo deja como el cuaderno de este dispositivo. */
export function Shared({ shares, current, labels }: { shares: Share[]; current: string | null; labels: Record<string, string> }) {
  if (!shares.length) return <p className="note">Todavía nadie compartió su cuaderno con vos. Cuando lo hagan, aparece acá.</p>;
  function open(owner: string) {
    document.cookie = 'mc_view=' + encodeURIComponent(owner) + '; path=/; max-age=34560000; samesite=lax' + (location.protocol === 'https:' ? '; secure' : '');
    location.assign('/');
  }
  return (
    <ul className="people">
      {shares.map((s) => {
        const edit = Object.keys(s.sections).filter((k) => s.sections[k] === 'editar').map((k) => labels[k] || k);
        const see = Object.keys(s.sections).filter((k) => s.sections[k] === 'ver').map((k) => labels[k] || k);
        return (
          <li key={s.owner}>
            <span className="who">Cuaderno de {s.name}</span>
            <span className="meta">{see.length ? 'Podés mirar: ' + see.join(', ') + '. ' : ''}{edit.length ? 'Podés editar: ' + edit.join(', ') + '.' : ''}</span>
            <div className="row"><button className="label-btn" onClick={() => open(s.owner)}>{current === s.owner ? 'Volver a este cuaderno' : 'Abrir este cuaderno'}</button></div>
          </li>
        );
      })}
    </ul>
  );
}
