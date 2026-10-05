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

/** Borra todas las fotos, dibujos y adjuntos de un cuaderno (al borrar la cuenta de su dueña, D50). */
export async function dropAllMedia(owner: string) {
  const bucket = supabaseAdmin().storage.from(BUCKET);
  const list = async (prefix: string) => {
    const out: string[] = [];
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
      if (error || !data || !data.length) break;
      out.push(...data.map((x) => x.name));
      if (data.length < 1000) break;
    }
    return out;
  };
  for (const store of media.STORES) {
    for (const id of await list(`${owner}/${store}`)) {
      const files = (await list(`${owner}/${store}/${id}`)).map((n) => `${owner}/${store}/${id}/${n}`);
      if (files.length) await bucket.remove(files);
    }
  }
}
