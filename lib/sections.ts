// Las secciones y el partido de registros vienen de js/core/sections.js (única fuente, compartida con el cuaderno).
import S from '../js/core/sections.js';

export type Section = { id: string; label: string };
export type Part = { section: string; data: Record<string, unknown> };
type Api = {
  LIST: Section[]; STORES: string[];
  splitAll: (store: string, record: Record<string, unknown>) => Part[];
  sectionsOf: (store: string) => string[];
  HIDDEN_SUFFIX: string;
  canHide: (store: string) => boolean;
  baseOf: (store: string) => string | null;
  conceal: (store: string, record: Record<string, unknown>) => { open: Record<string, unknown>; hidden: Record<string, unknown> | null; all: boolean };
};
const api = S as unknown as Api;

export const SECTIONS: Section[] = api.LIST;
export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const NOTEBOOK_STORES = api.STORES;
export const splitAll = api.splitAll;
export const sectionsOf = api.sectionsOf;
export const HIDDEN_SUFFIX = api.HIDDEN_SUFFIX;
export const canHide = api.canHide;
export const baseOf = api.baseOf;
export const conceal = api.conceal;
export const LEVELS = ['ver', 'editar'] as const;
export type Level = (typeof LEVELS)[number];
