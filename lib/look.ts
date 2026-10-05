// La apariencia de un cuaderno (D48): la tela de la tapa y los colores propios que eligió su dueña. Es lo único
// de sus ajustes que ve toda persona con algún permiso, para que su cuaderno se vea como ella lo eligió.
// También qué partes de Mi año eligió no mostrar (D53). Nunca el nombre, los avisos, las emociones ni nada escrito.

export type Look = { cover: string | null; theme: Record<string, unknown> | null; yearHide: string[] };

// Partes de Mi año que la dueña puede ocultar (D53); la misma lista que M.YEAR_PARTS.
const YEAR_PARTS = ['mapa', 'cuentas', 'grafico', 'notando', 'recuerdos', 'victorias'];

const COVER = /^[a-z-]{1,24}$/;

/** De los ajustes guardados (`meta/settings` → `value`), solo la apariencia, saneada. */
export function lookOf(value: unknown): Look {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const cover = typeof v.cover === 'string' && COVER.test(v.cover) ? v.cover : null;
  const t = v.theme;
  // El tema es un objeto chico (preset y colores); el cuaderno lo vuelve a sanear al leerlo.
  const theme = t && typeof t === 'object' && !Array.isArray(t) && JSON.stringify(t).length <= 4000 ? t as Record<string, unknown> : null;
  const yearHide = Array.isArray(v.hideYear) ? (v.hideYear as unknown[]).filter((k): k is string => typeof k === 'string' && YEAR_PARTS.includes(k)) : [];
  return { cover, theme, yearHide: [...new Set(yearHide)] };
}
