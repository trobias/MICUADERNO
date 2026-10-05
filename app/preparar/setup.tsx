'use client';
import { useEffect, useState } from 'react';
import { send, useNote } from '../form';

/** `clave`: el SETUP_TOKEN que viene en el link de invitación (?clave=…). Con él, la persona solo elige nombre, usuario y PIN. */
export default function Setup({ clave }: { clave: string }) {
  const [busy, setBusy] = useState(false);
  const note = useNote();
  // La clave no queda en la barra de direcciones ni en el historial después de abrir el link.
  useEffect(() => { if (clave) history.replaceState(null, '', '/preparar'); }, [clave]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('pin') !== f.get('pin2')) { note.problem('Los dos PIN no coinciden.'); return; }
    setBusy(true); note.clear();
    const r = await send('/api/setup', 'POST', { token: clave || f.get('token'), username: f.get('username'), displayName: f.get('displayName'), pin: f.get('pin') });
    if (!r.ok) { setBusy(false); note.problem(String(r.data.error || 'No se pudo preparar.')); return; }
    // Recién creada: entra directo a su cuaderno con el mismo usuario y PIN.
    const login = await send('/api/auth/login', 'POST', { username: f.get('username'), pin: f.get('pin') });
    location.replace(login.ok ? '/' : '/entrar');
  }
  return (
    <form className="form" onSubmit={submit}>
      {!clave && <label>Clave de preparación (SETUP_TOKEN)<input name="token" type="password" autoComplete="off" required /></label>}
      <label>Cómo te llamás<input name="displayName" defaultValue="" maxLength={60} required /></label>
      <label>Usuario<input name="username" autoCapitalize="none" spellCheck={false} autoComplete="username" required /></label>
      <label>PIN (6 números)<input name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      <label>Repetí el PIN<input name="pin2" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      {note.view}
      <div className="row"><button className="label-btn" disabled={busy}>{busy ? 'Abriendo…' : 'Crear mi cuenta y abrir mi cuaderno'}</button></div>
    </form>
  );
}
