// Respuestas y controles comunes de las rutas /api (D37).
import { NextResponse } from 'next/server';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Mensaje amable para la persona; nunca detalles internos. */
export function problem(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Corta pedidos que cambian algo y no vienen de este mismo sitio (CSRF). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (text.length > 20_000) return null;
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null;
  } catch { return null; }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip') || 'local').trim().slice(0, 64);
}

/** Cookie no secreta con el id de la persona: el cuaderno la lee sin red para abrir SU base local. */
export const PERSON_COOKIE = 'mc_person';
export const personCookieOptions = {
  path: '/', sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', httpOnly: false, maxAge: 60 * 60 * 24 * 400
};
