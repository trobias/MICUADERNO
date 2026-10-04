'use client';
import { useState } from 'react';
import { send, useNote } from '../form';

export default function Setup() {
  const [busy, setBusy] = useState(false);
  const note = useNote();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get('pin') !== f.get('pin2')) { note.problem('Los dos PIN no coinciden.'); return; }
    setBusy(true); note.clear();
    const r = await send('/api/setup', 'POST', { token: f.get('token'), username: f.get('username'), displayName: f.get('displayName'), pin: f.get('pin') });
    setBusy(false);
    if (r.ok) location.replace('/entrar');
    else note.problem(String(r.data.error || 'No se pudo preparar.'));
  }
  return (
    <form className="form" onSubmit={submit}>
      <label>Clave de preparación (SETUP_TOKEN)<input name="token" type="password" autoComplete="off" required /></label>
      <label>Cómo te llamás<input name="displayName" defaultValue="" maxLength={60} required /></label>
      <label>Usuario<input name="username" autoCapitalize="none" spellCheck={false} autoComplete="username" required /></label>
      <label>PIN (6 números)<input name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      <label>Repetí el PIN<input name="pin2" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="new-password" required /></label>
      {note.view}
      <div className="row"><button className="label-btn" disabled={busy}>{busy ? 'Preparando…' : 'Preparar el cuaderno'}</button></div>
    </form>
  );
}
