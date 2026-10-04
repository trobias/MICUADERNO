// Cambiar el PIN de otra persona (si se lo olvidó) o pausarla. Solo quien administra.
import { body, json, problem, sameOrigin } from '../../../../lib/http';
import { me } from '../../../../lib/auth';
import { setDisabled, setPin } from '../../../../lib/people';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return problem('Pedido no permitido.', 403);
  const who = await me();
  if (!who) return problem('Tu sesión terminó. Entrá de nuevo.', 401);
  if (!who.is_admin) return problem('Solo quien administra puede cambiar esto.', 403);
  const { id } = await ctx.params;
  if (!UUID.test(id)) return problem('Persona desconocida.', 404);
  const b = await body<{ pin?: string; disabled?: boolean }>(req);
  let err: string | null = null;
  if (b && 'pin' in b) err = await setPin(who.id, id, b.pin);
  else if (b && typeof b.disabled === 'boolean') err = await setDisabled(who.id, id, b.disabled);
  else err = 'No hay nada para cambiar.';
  return err ? problem(err) : json({ ok: true });
}
