// Fotos, dibujos y adjuntos en Storage privado (NB1, D43). El servidor revisa el permiso de la sección
// `fotos` en cada pedazo y recién ahí usa la clave secreta; el navegador nunca habla con Supabase.
import 'server-only';
import M from '../js/core/media.js';
import { supabaseAdmin } from './supabase/admin';
import { supabaseServer } from './supabase/server';
import type { Profile } from './auth';

type Api = {
  STORES: string[]; CHUNK: number; MAX_CHUNKS: number;
  isMedia: (store: string) => boolean;
  path: (owner: string, store: string, id: string, n: number) => string;
  validKey: (store: string, id: string, n: number) => boolean;
  validMeta: (m: unknown) => boolean;
  FIELD: Record<string, string>;
};
export const media = M as unknown as Api;
export const BUCKET = 'cuaderno';

/** Qué puede hacer esta persona con las fotos de ese cuaderno: la dueña, todo; con permiso, según su nivel. */
export async function mediaAccess(who: Profile, owner: string): Promise<{ read: boolean; write: boolean }> {
  if (owner === who.id) return { read: who.has_notebook, write: who.has_notebook };
  const sb = await supabaseServer();
  const { data } = await sb.from('notebook_grants').select('level').eq('owner_id', owner).eq('grantee_id', who.id).eq('section', 'fotos').maybeSingle();
  const level = (data as { level?: string } | null)?.level;
  return { read: level === 'ver' || level === 'editar', write: level === 'editar' };
}

export async function putChunk(owner: string, store: string, id: string, n: number, text: string) {
  const { error } = await supabaseAdmin().storage.from(BUCKET).upload(media.path(owner, store, id, n), text, { contentType: 'text/plain', upsert: true });
  return !error;
}

export async function getChunk(owner: string, store: string, id: string, n: number): Promise<string | null> {
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(media.path(owner, store, id, n));
  return error || !data ? null : await data.text();
}

/** Borra todos los pedazos de un registro (cuando el registro se borra del todo). */
export async function dropMedia(owner: string, store: string, id: string) {
  const paths = Array.from({ length: media.MAX_CHUNKS }, (_, n) => media.path(owner, store, id, n));
  await supabaseAdmin().storage.from(BUCKET).remove(paths);
}
