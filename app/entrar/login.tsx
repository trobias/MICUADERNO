'use client';
import { useState } from 'react';
import { send, useNote } from '../form';

export default function Login() {
  const [busy, setBusy] = useState(false);
  const note = useNote();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); note.clear();
    const r = await send('/api/auth/login', 'POST', { username: f.get('username'), pin: f.get('pin') });
    setBusy(false);
    if (r.ok) location.replace('/');
    else note.problem(String(r.data.error || 'No se pudo entrar.'));
  }
  return (
    <form className="form" onSubmit={submit}>
      <label>Usuario<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required /></label>
      <label>PIN<input name="pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="\d{6}" maxLength={6} required /></label>
      {note.view}
      <div className="row"><button className="label-btn" disabled={busy}>{busy ? 'Abriendo…' : 'Abrir mi cuaderno'}</button></div>
    </form>
  );
}
