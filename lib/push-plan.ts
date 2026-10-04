// Qué aviso toca a cada persona (puro, probado en tests/cloud). Los textos nunca llevan nada escrito por la
// persona (AGENTS: privacidad) y son amables, sin deuda ni rachas.
export type Kind = 'manana' | 'noche';

export const TEXTS: Record<Kind, { title: string; body: string; url: string }> = {
  manana: { title: 'MI CUADERNO', body: 'Tu cuaderno está acá, por si querés empezar el día.', url: '/#/hoy' },
  noche: { title: 'MI CUADERNO', body: 'Un ratito para cerrar el día, si tenés ganas.', url: '/#/hoy' }
};

/** Hora local "HH:MM" y fecha local "AAAA-MM-DD" de un instante en una zona horaria. */
export function localParts(at: Date, timeZone: string): { day: string; minutes: number } {
  let tz = timeZone;
  try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); } catch { tz = 'America/Argentina/Buenos_Aires'; }
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

function toMinutes(hhmm: string | null): number | null {
  const m = /^(\d{2}):(\d{2})/.exec(hhmm ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * El aviso que toca ahora: el último horario elegido que ya pasó hoy (dentro de `windowMin`), o null.
 * Con un cron cada hora, windowMin = 60 entrega cada aviso una vez; con el cron diario de Vercel Hobby,
 * un windowMin grande entrega el que corresponda a esa hora. La idempotencia la da push_log (persona, tipo, día).
 */
export function dueKind(at: Date, timeZone: string, morning: string | null, evening: string | null, windowMin = 60): { kind: Kind; day: string } | null {
  const { day, minutes } = localParts(at, timeZone);
  const cands: [Kind, number | null][] = [['noche', toMinutes(evening)], ['manana', toMinutes(morning)]];
  for (const [kind, t] of cands) {
    if (t !== null && minutes >= t && minutes - t < windowMin) return { kind, day };
  }
  return null;
}
