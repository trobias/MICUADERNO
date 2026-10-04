// La lista de secciones viene de js/core/sections.js (única fuente, compartida con el cuaderno).
// eslint-disable-next-line @typescript-eslint/no-require-imports
import S from '../js/core/sections.js';

export type Section = { id: string; label: string };
export const SECTIONS: Section[] = (S as { LIST: Section[] }).LIST;
export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const LEVELS = ['ver', 'editar'] as const;
export type Level = (typeof LEVELS)[number];
