# MI CUADERNO — Roadmap

Estado al 05/10/2026: **la etapa A del plan nuevo está completa** (A0–A13) y la base de la nube está publicada (`https://micuaderno-five.vercel.app`, Nicole ya tiene su cuenta) con cuadernos compartidos (D38). **Lo próximo: fotos, dibujos y adjuntos en la nube** (NB1, D40). Lo que falta de B y lo que hay en C están en `BACKLOG.md` (secciones NB y C) y en [`docs/EVALUACION_BC.md`](docs/EVALUACION_BC.md); el orden y los criterios, en [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md). La tabla de fases históricas más abajo conserva la visión anterior como referencia de ideas: **no es el orden de implementación actual**. Lo visible hoy está en `SPEC.md` y lo entregado por commit, en `CHANGELOG.md`.

## Ruta aprobada ahora

| Tramo | Estado | Resultado |
|---|---|---|
| A0–A3 · protección, navegación, limpieza y datos v5 | Hecho | Commits `34e9b6e`, `cc7697d`, `4f124d7`, `a39dad2`. |
| A4 · emociones libres | Hecho | Día, actividad, calendarios, Año, ajustes, exportación, impresión e insights sin escala de cinco. |
| A5 · Mis hojas y cuatro marcadores | Hecho (v28) | Fuera Agenda/Rutinas como marcadores, sin perder repeticiones. |
| A6 · semana planner | Hecho (v29) | Semana inicial editable. |
| A7 · hojas/plantillas | Hecho (v30) | Bloques, plantillas propias, Guardar y hojas que se repiten. |
| A8 · Mi año | Hecho (v31) | Cuentas por período, mes a mes con tabla, pequeñas victorias. |
| A9 · Colores propios | Hecho (v32) | Presets, editor, AA, Noche (PE5). |
| A10 · Escenas | Hecho (v33) | Más seguido (D33) y cuatro escenas nuevas. |
| A11 · Dibujo | Hecho (v34) | Balde, plumilla, grafito, resaltador, aerógrafo. |
| A12 · QA cruzada | Hecho (v35) | Matriz de navegación, auditorías, `docs/QA.md`. Solo Chromium. |
| A13 · Contrato v6 | Hecho (v36) | IndexedDB 4, `SCHEMA_VERSION` 6, instantánea y vuelta atrás; `cover` queda (D39). |
| B-base · cuentas en la nube | Publicado (05/10) | Next.js + Supabase: PIN, Nicole admin, permisos con RLS, push, latido anti-pausa. `docs/NUBE.md`, D37. |
| B5 · sincronización y cuadernos compartidos | Hecho en su forma simple (D38) | La dueña sube su cuaderno partido por sección; quien mira lo abre en memoria. Falta probar con dos cuentas reales. |
| **NB1 · fotos, dibujos y adjuntos en la nube** | **Siguiente** | Storage privado por persona, firmado desde el servidor, con permiso por la sección `fotos` (D40). |
| NB2–NB5 · cola firme, historial de migraciones, restaurar con nube, avisos más seguido | Después de NB1 | `BACKLOG.md` sección NB. |
| Pruebas con la psicóloga y en el celular; segundo proyecto de Supabase | **Descartado por la dueña** (D40) | No se proponen. |
| C · React y escenas 2.0 | Esperando a la dueña | C1–C5 en `BACKLOG.md` sección C; recomendación: solo C1 y C5 cuando hagan falta. |

Cada paso exige `npm run check`, revisión visual y documentación del cambio. La verificación en Firefox/Safari/dispositivos reales sigue pendiente; no sustituye la suite Chromium. Publicar en GitHub Pages (V7) deja de ser un objetivo porque la migración de nube aprobada usa Vercel.

Regla de este roadmap: **la app no tiene que sentirse grande**. Cada fase es una capacidad bien diseñada que después usan varias ideas; no una lista de features sueltas.

## Hecho

MVP completo del brief §64 y, después: pantalla única con calendario (D17), todo lo fechado visible (D18), rutas/cuentas/dibujos compartidos (D19), secciones conectadas (D20), calendario en vivo (D21), marcadores (D22), motion completo (D23), dibujo, imágenes y adjuntos (D24), Fase 1 (D26), la etapa A entera (A0–A13: emociones escritas, Mis hojas, semana-planner, hojas en bloques y plantillas, Mi año con cuentas y victorias, colores propios, escenas, dibujo con balde, QA y contrato v6) y la nube con cuentas y cuadernos compartidos (D37–D38). La cantidad de tests del gate se lee de `npm run check`, no de una cifra histórica.

---

## Verificación pendiente (antes de llamarlo “probado”)

Lo construido no se probó todavía fuera de Chromium headless.

| # | Qué | Por qué | Prioridad |
|---|---|---|---|
| V1 | Firefox y Safari (macOS/iOS) con doble clic y como web | brief §66; IndexedDB en `file://` varía (Safari puede caer a modo memoria con aviso) | P1 |
| V2 | Instalar la PWA en Android, iOS y Windows reales; ícono, splash, atajos | brief §83, §97. La dueña no quiere una prueba guiada (D40): queda para cuando ella la haga por su cuenta | — |
| V3 | Que una notificación llegue de verdad (abierta, en segundo plano, instalada/cerrada) | brief §94, §97; bloquea NO1. Igual que V2 (D40) | — |
| V4 | Lector de pantalla real (NVDA / VoiceOver) en Hoy, calendario, Agenda, bastidor, dibujo | skill `accessibility` | P1 |
| V5 | Detector completo de `impeccable` y `axe-core` | corrió en modo degradado | P2 |
| V6 | Almacenamiento lleno (cuota de IndexedDB con fotos y adjuntos) | brief §67, D24; ahora más probable | P1 |
| V7 | Probar actualización de `CACHE_VERSION` en PWA instalada; el despliegue objetivo será Vercel en B, no GitHub Pages | brief §86, D35 | P1 |

## Fases

Cada fase dice qué capacidad construye, qué ítems del backlog resuelve y de qué depende. Se puede cambiar el orden si la verificación (V1–V7) muestra otra urgencia.

### Fase 1 · Cimientos que protegen lo guardado — **hecha** (2026-10-02)
Antes de sumar mucho contenido nuevo, que nada se pierda y que todo se pueda deshacer.
- **Papelera** con borrado suave y retención (DA1).
- **Deshacer / rehacer** común con `Ctrl+Z` / `Ctrl+Shift+Z` (DA2).
- **“guardando… → guardado ✓”** en todas las superficies (DA3).
- ~~**Cuánto ocupa mi cuaderno** (DA4)~~: se retiró el 04/10/2026 a pedido de la dueña.
- **Privacidad de esta página** (no recuerdo / no insights / no revisiones) que respeten insights y *Mi año* (PV1).
- Seguimiento de DA1 completado: editar un día en papelera conserva su contenido, bajar la retención avisa qué vencería y “Cuánto ocupa” incluye imágenes borradas. Sacar actividades sigue siendo definitivo con “Deshacer”; no las manda a papelera.
- Reglas permanentes desde ya: todo lo nuevo entra en la copia con migración y test (DA6) y degrada con elegancia (DA7).

### Fase 2 · Motor de elementos de página — NEXT
Una sola infraestructura para todo lo que se pone sobre una hoja (VISION §2). Nace de los stickers que ya existen (`Placed`), con migración.
- Motor común `PageElement` + operaciones (duplicar, bloquear, orden adelante/atrás) + barra contextual + gestos táctiles (EL1–EL3, EL12).
- Tipos que llegan con el motor: **post-it**, **nota al margen**, **polaroid**, **dibujo como elemento** con resaltador, rehacer y presión (EL4–EL6, EL9).
- Páginas libres sin estructura fija (EL14).
- Después, sobre el mismo motor: más estilos de foto, texto/cinta/sellos, snap y selección múltiple como experimentos (EL7, EL8, EL10, EL11).
- Depende de: Fase 1 (deshacer y papelera).

### Fase 3 · Memorias — NEXT
Referencias comunes en vez de copias (VISION §3).
- Referencias + favorito/marcador + recuerdos positivos (ME1, ME2, ME5); las **pequeñas victorias** ya existen (A8) y se amplían (ME4).
- **Abrime algo lindo ♡** y **recuerdos suaves** / “un día como hoy” (ME6, ME8).
- Diseñar antes: marcadores físicos en el borde (ME3) y la vista **Volver a mí** (ME7).
- Depende de: PV1 (Fase 1).

### Fase 4 · Encontrar y ordenar — NEXT
- **Buscar en mi cuaderno…** con filtros progresivos (OR1, OR2).
- **Etiquetas** como sellos de papel (OR3); **colecciones** como referencias con nombre (OR4).
- Depende de: PV1; las colecciones, de Fase 3.

### Fase 5 · Escribir tranquila — NEXT (en paralelo, es chica)
- **Solo escribir** + pantalla completa (ES1), **modo calma** (ES2), **“No quiero explicarlo”** (ES3). (El papel de noche, PE5, ya está: preset *Noche*, A9.)
- Diseñar antes: bloques flexibles en el día (ES4), después de partir `today.js` (T1). Las hojas ya tienen bloques (A7).

### Fase 6 · Media liviana — NEXT/LATER
- Imágenes con miniatura, Blob, carga diferida y deduplicación; arrastrar/soltar y pegar (MD1, MD2).
- Formato **`.micuaderno`** con la media separada (DA5).
- **Notas de voz** (MD3) y **canciones** offline-first (MD4, investigar antes la privacidad del link).
- Depende de: nada (DA4 se retiró; medir con herramientas de desarrollo cuando haga falta).

### Fase 7 · Revisiones — LATER
- **Esta semana** (RV1) → **revisión mensual** con scrapbook automático editable (RV2) → **capítulo anual** de *Mi año* (RV3).
- Depende de: PV1, Fase 2 (composición editable), Fase 3 (recuerdos y victorias), Fase 6 (fotos).

### Fase 8 · Cartas, cosas sueltas y captura — LATER (Cosas sueltas puede adelantarse)
- **Cosas sueltas** + captura rápida desde cualquier lado (CA3, CA4).
- **Sobres** con apertura libre o por fecha, sin previews ni apariciones antes de tiempo (CA1, CA2).
- Depende de: Fase 2 (contenido del sobre) y PV1.

### Fase 9 · Hacerlo propio — LATER
- **Portada** editable con el motor de elementos (PE1) → portadas guardadas (PE2) → separadores propios y orden de los marcadores (PE3).
- Depende de: Fase 2; separadores, de colecciones (OR4).

### Fase 10 · Privacidad local y notificaciones finas — LATER
- **Ocultar mi cuaderno** puede ir antes (PV2); **bloqueo** con PIN tras investigar cifrado (PV3).
- **Notificaciones por categoría**, horarios, no molestar y mensajes con contexto (NO1–NO3), cuando V3 confirme que llegan.

## Próximo paso

**NB1: fotos, dibujos y adjuntos en la nube** (`BACKLOG.md` sección NB, D40). Después, NB2–NB5. Las fases 2–10 de arriba son la reserva de ideas para cuando la dueña pida algo nuevo; la etapa C espera su elección (sección C del backlog).
