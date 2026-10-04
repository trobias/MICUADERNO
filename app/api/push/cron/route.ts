// Avisos programados. Lo llama Vercel Cron (una vez por día en el plan Hobby) o un cron cada hora
// (Supabase pg_cron + pg_net, ver docs/NUBE.md). `?ventana=` minutos en que todavía vale un horario pasado.
import { json, problem } from '../../../../lib/http';
import { supabaseAdmin } from '../../../../lib/supabase/admin';
import { cronAllowed, pushReady, sendPush } from '../../../../lib/push';
import { dueKind, TEXTS } from '../../../../lib/push-plan';

type Row = { endpoint: string; p256dh: string; auth: string; morning: string | null; evening: string | null; user_id: string; profiles: { timezone: string; disabled_at: string | null } | null };

export async function GET(req: Request) {
  if (!cronAllowed(req)) return problem('No autorizado.', 401);
  const sb = supabaseAdmin();
  await sb.from('keepalive').update({ beat_at: new Date().toISOString() } as never).eq('id', 1);
  if (!pushReady()) return json({ sent: 0, reason: 'sin VAPID' });
  const win = Math.min(Math.max(Number(new URL(req.url).searchParams.get('ventana')) || 60, 5), 1440);
  const { data } = await sb.from('push_subscriptions').select('endpoint, p256dh, auth, morning, evening, user_id, profiles(timezone, disabled_at)');
  const now = new Date();
  const byUser = new Map<string, Row[]>();
  for (const r of ((data as unknown as Row[] | null) ?? [])) {
    if (!r.profiles || r.profiles.disabled_at) continue;
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
  }
  let sent = 0;
  for (const [userId, subs] of byUser) {
    // Cada dispositivo tiene sus horarios; vale el primero que toque. Un aviso de cada tipo por persona y por
    // día (push_log), aunque tenga varios dispositivos o el cron corra dos veces.
    const due = subs.map((s) => dueKind(now, s.profiles!.timezone, s.morning, s.evening, win)).find(Boolean);
    if (!due) continue;
    const { error } = await sb.from('push_log').insert({ user_id: userId, kind: due.kind, day: due.day } as never);
    if (error) continue; // ya avisado hoy (23505) o la base no respondió: mejor no avisar que avisar dos veces
    for (const s of subs) if (await sendPush(s, { ...TEXTS[due.kind], tag: due.kind })) sent++;
  }
  return json({ sent });
}
