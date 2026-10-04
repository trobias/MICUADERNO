// Envío de avisos Web Push (VAPID). Solo servidor. D37.
import 'server-only';
import webpush from 'web-push';
import { env } from './env';
import { supabaseAdmin } from './supabase/admin';

export type Sub = { endpoint: string; p256dh: string; auth: string };

export function pushReady(): boolean {
  return !!(env.vapidPublic() && env.vapidPrivate());
}

/** true si llegó; si el servicio dice que la suscripción ya no existe, se borra. */
export async function sendPush(sub: Sub, payload: { title: string; body: string; url: string; tag?: string }): Promise<boolean> {
  webpush.setVapidDetails(env.vapidSubject(), env.vapidPublic(), env.vapidPrivate());
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600, urgency: 'low' });
    await supabaseAdmin().from('push_subscriptions').update({ last_ok_at: new Date().toISOString() } as never).eq('endpoint', sub.endpoint);
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await supabaseAdmin().from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    return false;
  }
}

/** Vercel Cron (y quien lo llame a mano) manda `Authorization: Bearer <CRON_SECRET>`. */
export function cronAllowed(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}
