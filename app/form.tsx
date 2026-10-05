'use client';
// Envío de formularios a /api con mensaje amable. Sin librerías: fetch + estado.
import { useState } from 'react';

export async function send(url: string, method: string, data?: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), credentials: 'same-origin' });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, data: json };
  } catch {
    return { ok: false, data: { error: 'Sin conexión. Probá de nuevo cuando vuelva.' } };
  }
}

export function useNote() {
  const [note, setNote] = useState<{ text: string; kind: 'ok' | 'problem' } | null>(null);
  const view = note ? <p className="note" data-kind={note.kind} role={note.kind === 'problem' ? 'alert' : 'status'}>{note.text}</p> : null;
  return { view, ok: (text: string) => setNote({ text, kind: 'ok' }), problem: (text: string) => setNote({ text, kind: 'problem' }), clear: () => setNote(null) };
}

/** Clave VAPID (base64url) → bytes para `pushManager.subscribe`. */
export function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
