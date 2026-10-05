'use client';
import { useEffect, useRef, useState } from 'react';
import { b64ToBytes, send, useNote } from '../form';

export type Chooser = { username: string; name: string; admin: boolean };

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const LAST = 'mc.entrar.ultimo'; // solo el usuario elegido la última vez en este dispositivo (preferencia de UI)
const PENDING = 'mc.entrar.avisos'; // la suscripción a avisos pedida antes de entrar, para guardarla al entrar

function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string | null) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* sin almacenamiento: no pasa nada */ } }

export default function Login({ people, vapid }: { people: Chooser[] | null; vapid: string }) {
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState('');
  const note = useNote();
  const pinRef = useRef<HTMLInputElement>(null);
  const choose = !!(people && people.length);

  // Preseleccionar a quien entró la última vez en este dispositivo.
  useEffect(() => {
    const last = read(LAST);
    if (last && people?.some((p) => p.username === last)) setUser(last);
  }, [people]);

  function pick(username: string) {
    setUser(username);
    note.clear();
    setTimeout(() => pinRef.current?.focus(), 0);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const username = choose ? user : String(f.get('username') || '');
    if (!username) { note.problem('Elegí quién sos.'); return; }
    setBusy(true); note.clear();
    const r = await send('/api/auth/login', 'POST', { username, pin: f.get('pin') });
    if (!r.ok) { setBusy(false); note.problem(String(r.data.error || 'No se pudo entrar.')); return; }
    write(LAST, username);
    // Si pidió avisos antes de entrar, ahora que hay sesión se guardan para esta persona.
    const pending = read(PENDING);
    if (pending) {
      const saved = await send('/api/push/subscribe', 'POST', { ...JSON.parse(pending), morning: '08:30', evening: '21:30' });
      if (saved.ok) write(PENDING, null);
    }
    location.replace('/');
  }

  // Las flechas mueven la selección entre personas (patrón radiogroup).
  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!people || !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const i = Math.max(0, people.findIndex((p) => p.username === user));
    const next = people[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : people.length - 1)) % people.length];
    setUser(next.username);
    (e.currentTarget.querySelector(`[data-user="${CSS.escape(next.username)}"]`) as HTMLElement | null)?.focus();
  }

  return (
    <div className="form">
      <form className="form" onSubmit={submit}>
        {choose ? (
          <div className="field">
            <span className="field__label" id="who-label">Quién sos</span>
            <div className="who-list" role="radiogroup" aria-labelledby="who-label" onKeyDown={onKey}>
              {people!.map((p, i) => {
                const on = p.username === user;
                return (
                  <button key={p.username} type="button" role="radio" aria-checked={on} data-user={p.username}
                    tabIndex={on || (!user && i === 0) ? 0 : -1} className="who" onClick={() => pick(p.username)}>
                    <span className="who__check" aria-hidden="true">{on ? '✓' : ''}</span>
                    <span className="who__name">{p.name}</span>
                    <span className="who__user">{p.username}</span>
                    {p.admin && <span className="who__tag">administra</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <label>Usuario<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required /></label>
        )}
        <label>PIN<input ref={pinRef} name="pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="\d{6}" maxLength={6} required /></label>
        {note.view}
        <div className="row"><button className="label-btn entrar-btn" disabled={busy}>{busy ? 'Abriendo…' : 'Abrir mi cuaderno'}</button></div>
      </form>
      <Extras vapid={vapid} />
    </div>
  );
}

/** “Instalar app” y “Activar notificaciones”, como en la entrada de otras apps: aparecen solo si se pueden usar. */
function Extras({ vapid }: { vapid: string }) {
  const note = useNote();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [pushOk, setPushOk] = useState(false);
  const [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setInstall(null); };
    addEventListener('beforeinstallprompt', onPrompt);
    addEventListener('appinstalled', onInstalled);
    // El service worker del cuaderno: hace falta para instalar y para recibir avisos.
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const can = !!vapid && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushOk(can);
    setPushOn(can && Notification.permission === 'granted' && !!read(PENDING));
    return () => { removeEventListener('beforeinstallprompt', onPrompt); removeEventListener('appinstalled', onInstalled); };
  }, [vapid]);

  async function doInstall() {
    if (!install) return;
    await install.prompt();
    const { outcome } = await install.userChoice;
    setInstall(null);
    if (outcome === 'accepted') note.ok('Listo: el cuaderno queda como app en este dispositivo.');
  }

  async function doPush() {
    // El permiso se pide solo acá, cuando la persona toca el botón (nunca al abrir).
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { note.problem('Sin permiso para avisar. Lo podés habilitar en los ajustes del navegador.'); return; }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapid) }));
      write(PENDING, JSON.stringify(sub.toJSON()));
      setPushOn(true);
      note.ok('Listo: al entrar, este dispositivo queda con los avisos de la mañana (8:30) y la noche (21:30). Los horarios se cambian en Mi cuenta. Nunca muestran lo que escribiste.');
    } catch {
      note.problem('Este navegador no pudo activar los avisos.');
    }
  }

  const showInstall = !installed && (install || ios);
  if (!showInstall && !pushOk) return null;
  return (
    <div className="entrar-extras">
      {install && <button type="button" className="label-btn label-btn--soft" onClick={doInstall}>Instalar app</button>}
      {!install && ios && !installed && <p className="note">Para tenerlo como app en el iPhone: tocá Compartir y después “Agregar a inicio”.</p>}
      {pushOk && (
        <button type="button" className="label-btn label-btn--soft" onClick={doPush} aria-pressed={pushOn}>
          {pushOn ? 'Notificaciones activadas ✓' : 'Activar notificaciones'}
        </button>
      )}
      {note.view}
    </div>
  );
}
