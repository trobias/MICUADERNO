// Variables de entorno de la nube (D37). Nunca se exponen al navegador las que no empiezan con NEXT_PUBLIC_.
// Se leen al usarlas (no al importar) para que `next build` funcione sin secretos; faltar una da un error claro.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name} (ver docs/NUBE.md).`);
  return v;
}

export const env = {
  supabaseUrl: () => need('NEXT_PUBLIC_SUPABASE_URL'),
  publishableKey: () => need('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  /** Clave secreta de Supabase (sb_secret_… o la service_role vieja). Solo servidor. */
  secretKey: () => need('SUPABASE_SECRET_KEY'),
  /** Pimienta del PIN: se suma antes de Argon2id; sin ella, la tabla filtrada no alcanza para probar PIN. */
  pinPepper: () => need('PIN_PEPPER'),
  /** Deriva la contraseña de Supabase Auth de cada persona (HMAC). Cambiarla obliga a regenerar contraseñas. */
  authSecret: () => need('AUTH_SECRET'),
  /** Solo para crear la primera persona administradora en /preparar. Se puede borrar después. */
  setupToken: () => process.env.SETUP_TOKEN || '',
  /** Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`. */
  cronSecret: () => need('CRON_SECRET'),
  vapidPublic: () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  vapidPrivate: () => process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: () => process.env.VAPID_SUBJECT || 'mailto:admin@example.invalid'
};

export function hasSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
