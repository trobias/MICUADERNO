// Sincronización del cuaderno con la nube (B5, D38). El servidor parte cada registro por sección
// (js/core/sections.js) y escribe solo las partes que quien pide puede escribir; la RLS es la segunda llave.
import 'server-only';
import { NOTEBOOK_STORES, baseOf, canHide, conceal, HIDDEN_SUFFIX, sectionsOf, splitAll } from './sections';

// Todo viaja. De fotos y adjuntos (NB1, D43) viaja la ficha; el contenido va aparte a Storage (lib/media.ts).
export const SYNC_STORES = NOTEBOOK_STORES;
const MEDIA_FIELD: Record<string, string> = { images: 'src', files: 'data' };
// De `meta` solo viajan los ajustes; lo demás (última copia, recordatorios vistos…) es del dispositivo.
export const SYNC_META_KEYS = ['settings'];

export type Change = { store: string; key: string; record: Record<string, unknown> | null };

export function validChange(c: unknown): c is Change {
  if (!c || typeof c !== 'object') return false;
  const x = c as Change;
  if (!SYNC_STORES.includes(x.store)) return false;
  if (typeof x.key !== 'string' || !x.key || x.key.length > 160) return false;
  if (x.store === 'meta' && !SYNC_META_KEYS.includes(x.key)) return false;
  return x.record === null || (typeof x.record === 'object' && !Array.isArray(x.record));
}

/** Por las dudas: la ficha de una foto o adjunto nunca lleva el contenido (va a Storage, no a la tabla). */
export function withoutMedia(c: Change): Change {
  const f = MEDIA_FIELD[c.store];
  if (!f || !c.record || !(f in c.record)) return c;
  const record = { ...c.record };
  delete record[f];
  return { ...c, record };
}

export type Row = {
  owner_id: string; store: string; record_id: string; section: string; data: Record<string, unknown>;
  private: boolean; updated_at: string; deleted_at: string | null; updated_by: string;
};

/** Cambios → filas de notebook_parts, solo de las secciones que se pueden escribir. */
// Cada fila lleva su propio instante (1 ms de diferencia): así una página de `pull` nunca corta a la mitad
// de un grupo con la misma hora y no se pierde ninguna parte.
export function toRows(owner: string, by: string, changes: Change[], canWrite: (section: string) => boolean, nowMs: number) {
  const rows: Row[] = [];
  const skipped = new Set<string>();
  const isOwner = by === owner;
  const stamp = () => new Date(nowMs + rows.length).toISOString();
  for (const c of changes) {
    // Borrar un registro entero solo si se pueden editar todas sus secciones: con permiso parcial (por ejemplo,
    // solo Emociones), borrar un día no puede llevarse lo que la dueña escribió en las otras.
    if (!c.record && !sectionsOf(c.store).every(canWrite)) { sectionsOf(c.store).forEach((s) => skipped.add(s)); continue; }
    // Lo que la dueña ocultó (D53) va aparte, en un pedazo privado; quien edita un cuaderno ajeno nunca lo toca.
    let record = c.record, hidden: Record<string, unknown> | null = null, all = false;
    if (record && canHide(c.store)) {
      if (isOwner) ({ open: record, hidden, all } = conceal(c.store, record));
      else { record = { ...record }; delete record.hide; }
    }
    const parts = record
      ? splitAll(c.store, record)
      : sectionsOf(c.store).map((section) => ({ section, data: {} as Record<string, unknown> }));
    for (const p of parts) {
      if (!canWrite(p.section)) { skipped.add(p.section); continue; }
      const at = stamp();
      rows.push({
        owner_id: owner, store: c.store, record_id: c.key, section: p.section, data: p.data,
        private: all, updated_at: at, deleted_at: record ? null : at, updated_by: by
      });
    }
    if (isOwner && canHide(c.store)) {
      const at = stamp();
      rows.push({
        owner_id: owner, store: c.store, record_id: c.key + HIDDEN_SUFFIX, section: baseOf(c.store) as string, data: hidden ?? {},
        private: true, updated_at: at, deleted_at: hidden ? null : at, updated_by: by
      });
    }
  }
  return { rows, skipped: [...skipped] };
}

export type Stamp = { store: string; record_id: string; section: string; stamp: string | null; deleted_at: string | null };

/**
 * Gana el más nuevo (D54): saca las filas que traen una versión (`updatedAt`) más vieja que la que ya está en la nube
 * para ese pedazo. Lo borrado y lo que no trae hora (pedazo oculto, ajustes de antes) pasa como siempre.
 */
export function dropStale(rows: Row[], have: Stamp[]): Row[] {
  const newer = new Map<string, string>();
  for (const h of have) if (typeof h.stamp === 'string' && h.stamp && !h.deleted_at) newer.set(h.store + '|' + h.record_id + '|' + h.section, h.stamp);
  return rows.filter((r) => {
    const mine = typeof r.data.updatedAt === 'string' ? (r.data.updatedAt as string) : '';
    const there = newer.get(r.store + '|' + r.record_id + '|' + r.section);
    return !(mine && there && there > mine);
  });
}
