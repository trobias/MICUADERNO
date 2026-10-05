// Un pedazo del contenido de una foto, dibujo o adjunto (NB1, D43). PUT lo guarda; GET lo devuelve.
// El permiso es el de la sección `fotos` del cuaderno (`owner`): la dueña, o quien recibió ver/editar.
import { body, json, problem, sameOrigin } from '../../../lib/http';
import { me } from '../../../lib/auth';
import { getChunk, media, mediaAccess, putChunk } from '../../../lib/media';

export const maxDuration = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASCII = /^[\x20-\x7e]*$/;

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const b = await body<{ owner?: string; store?: string; id?: string; n?: number; text?: string }>(req, media.CHUNK + 2000);
  if (!b) return problem('Pedazo demasiado grande o inválido.', 413);
  const owner = b.owner || who.id, store = String(b.store || ''), id = String(b.id || ''), n = Number(b.n);
  if (!UUID.test(owner) || !media.validKey(store, id, n) || typeof b.text !== 'string' || !b.text || b.text.length > media.CHUNK || !ASCII.test(b.text)) return problem('Pedazo inválido.');
  // El primer pedazo es el principio del data URL: solo imágenes en `images`; en `files`, cualquier tipo.
  if (n === 0 && !(store === 'images' ? /^data:image\/(png|webp|jpeg);base64,/ : /^data:[\w.+\/-]*(;[\w=.+-]+)*;base64,/).test(b.text)) return problem('Ese contenido no se puede guardar.');
  const can = await mediaAccess(who, owner);
  if (!can.write) return problem('Esta parte la podés mirar, pero no cambiar.', 403);
  return (await putChunk(owner, store, id, n, b.text)) ? json({ ok: true }) : problem('No se pudo guardar en la nube. Se reintenta solo.', 503);
}

export async function GET(req: Request) {
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  const url = new URL(req.url);
  const owner = url.searchParams.get('owner') || who.id, store = url.searchParams.get('store') || '', id = url.searchParams.get('id') || '', n = Number(url.searchParams.get('n'));
  if (!UUID.test(owner) || !media.validKey(store, id, n)) return problem('Pedazo inválido.');
  const can = await mediaAccess(who, owner);
  if (!can.read) return problem('No tenés permiso para ver esto.', 403);
  const text = await getChunk(owner, store, id, n);
  return text === null ? problem('Todavía no está en la nube.', 404) : json({ text });
}
