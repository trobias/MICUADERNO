// Editar a una persona (D50), cambiarle el PIN, dejarla sin PIN (D47), pausarla o borrarla (D50). Solo quien administra. Solo quien administra.
import { body, json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { deletePerson, removePin, setDisabled, setPin, updatePerson } from '../../../../lib/people';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function admin(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return { error: problem('Pedido no permitido.', 403) };
  const who = await me();
  if (!who) return { error: problem('Tu sesión terminó. Entrá de nuevo.', 401) };
  if (!who.is_admin) return { error: problem('Solo quien administra puede cambiar esto.', 403) };
  const { id } = await ctx.params;
  if (!UUID.test(id)) return { error: problem('Persona desconocida.', 404) };
  return { who, id };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await admin(req, ctx);
  if ('error' in a) return a.error;
  const b = await body<{ pin?: string; noPin?: boolean; disabled?: boolean; displayName?: string; username?: string; isAdmin?: boolean; hasNotebook?: boolean }>(req);
  let err: string | null = null;
  if (b && b.noPin === true) err = await removePin(a.who.id, a.id);
  else if (b && 'pin' in b) err = await setPin(a.who.id, a.id, b.pin);
  else if (b && typeof b.disabled === 'boolean') err = await setDisabled(a.who.id, a.id, b.disabled);
  else if (b && ['displayName', 'username', 'isAdmin', 'hasNotebook'].some((k) => k in b)) {
    err = await updatePerson(a.who.id, a.id, { displayName: b.displayName, username: b.username, isAdmin: b.isAdmin, hasNotebook: b.hasNotebook });
  } else err = 'No hay nada para cambiar.';
  return err ? problem(err) : json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await admin(req, ctx);
  if ('error' in a) return a.error;
  const b = await body<{ confirm?: string }>(req);
  const err = await deletePerson(a.who.id, a.id, b?.confirm);
  return err ? problem(err) : json({ ok: true });
}
