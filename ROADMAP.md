# MI CUADERNO — Roadmap

Estado al 04/10/2026: **etapa A del plan nuevo en curso**. A0–A4 están terminados, el índice de Páginas quedó arreglado y la base de la nube (cuentas, permisos, push) se adelantó en local; A5 es el siguiente paso. El orden vigente, los criterios de cada entrega y la futura nube están en [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md). La tabla de fases históricas más abajo conserva la visión anterior como referencia de ideas: **no es el orden de implementación actual**. Lo visible hoy está en `SPEC.md` y lo entregado por commit, en `CHANGELOG.md`.

## Ruta aprobada ahora

| Tramo | Estado | Próximo resultado |
|---|---|---|
| A0–A3 · protección, navegación, limpieza y datos v5 | Hecho en `main` | Commits `34e9b6e`, `cc7697d`, `4f124d7`, `a39dad2`. |
| A4 · emociones libres | Hecho | Día, actividad, calendarios, Año, ajustes, exportación, impresión e insights sin escala de cinco. |
| A5 · Mis hojas y cuatro marcadores | Hecho (v28) | Fuera Agenda/Rutinas como marcadores, sin perder repeticiones. |
| A6 · semana planner | Hecho (v29) | Semana inicial editable. |
| A7 · hojas/plantillas | Hecho (05/10, cache v30) | Bloques, plantillas propias, Guardar y hojas que se repiten. |
| A8 · Mi año | Hecho (05/10, cache v31) | Cuentas por período, mes a mes con tabla, pequeñas victorias. |
| A9 · Colores propios | Hecho (05/10, cache v32) | Presets, editor, AA, Noche (PE5). |
| A10 · Escenas | Hecho (05/10, cache v33) | Más seguido (D33) y cuatro escenas nuevas. |
| A11 · dibujo | Siguiente | Métricas amables, colores propios, más escenas, balde/trazos. |
| A12–A13 · QA y contrato v6 | Pendiente | Navegación completa, accesibilidad, revisión de redundancia, migración segura. |
| B-base · cuentas en la nube (adelantada) | Hecho en local, sin desplegar | Next.js + Supabase: PIN, Nicole admin, permisos con RLS, push, latido anti-pausa. `docs/NUBE.md`. |
| B5–B8 · sincronización, Storage, deploy y dispositivos | Pendiente (después de A7) | Copia offline sincronizada por persona, solo lectura para quien recibe permiso. |
| C · React y motion | Pendiente | Migrar vistas una a una; escenas especiales si aportan y rinden bien. |

Cada paso exige `npm run check`, revisión visual y documentación del cambio. La verificación en Firefox/Safari/dispositivos reales sigue pendiente; no sustituye la suite Chromium. Publicar en GitHub Pages (V7) deja de ser un objetivo porque la migración de nube aprobada usa Vercel.

Regla de este roadmap: **la app no tiene que sentirse grande**. Cada fase es una capacidad bien diseñada que después usan varias ideas; no una lista de features sueltas.

## Hecho

MVP completo del brief §64 y, después: pantalla única con calendario (D17), todo lo fechado visible (D18), rutas/cuentas/dibujos compartidos (D19), secciones conectadas (D20), calendario en vivo (D21), marcadores y Agenda (D22), motion completo (D23), dibujo, imágenes y adjuntos (D24), Fase 1 (D26). En la etapa A ya se cerraron A0–A4: seguridad de base, navegación/índice/escenas, sombras y desglose de espacio retirados, esquema v5 y emociones escritas. El desglose “Cuánto ocupa” que tuvo la Fase 1 se retiró en A2. La cantidad de tests del gate se lee de `npm run check`, no de una cifra histórica.

---

## Verificación pendiente (antes de llamarlo “probado”)

Lo construido no se probó todavía fuera de Chromium headless.

| # | Qué | Por qué | Prioridad |
|---|---|---|---|
| V1 | Firefox y Safari (macOS/iOS) con doble clic y como web | brief §66; IndexedDB en `file://` varía (Safari puede caer a modo memoria con aviso) | P1 |
| V2 | Instalar la PWA en Android, iOS y Windows reales; ícono, splash, atajos | brief §83, §97 | P1 |
| V3 | Que una notificación llegue de verdad (abierta, en segundo plano, instalada/cerrada) | brief §94, §97; bloquea NO1 | P1 |
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
- Referencias + favorito/marcador + **pequeñas victorias** + recuerdos positivos (ME1, ME2, ME4, ME5).
- **Abrime algo lindo ♡** y **recuerdos suaves** / “un día como hoy” (ME6, ME8).
- Diseñar antes: marcadores físicos en el borde (ME3) y la vista **Volver a mí** (ME7).
- Depende de: PV1 (Fase 1).

### Fase 4 · Encontrar y ordenar — NEXT
- **Buscar en mi cuaderno…** con filtros progresivos (OR1, OR2).
- **Etiquetas** como sellos de papel (OR3); **colecciones** como referencias con nombre (OR4).
- Depende de: PV1; las colecciones, de Fase 3.

### Fase 5 · Escribir tranquila — NEXT (en paralelo, es chica)
- **Solo escribir** + pantalla completa (ES1), **modo calma** (ES2), **“No quiero explicarlo”** (ES3), **papel de noche** (PE5).
- Diseñar antes: bloques flexibles y `ContentBlock` (ES4, ES5), después de partir `today.js` (T1).

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

Implementar A5 según [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md): cuatro marcadores, Mis hojas y editor de repetición accesible desde el día, con rutas antiguas redirigidas. Conservar la verificación de dispositivos como trabajo pendiente y avanzar por A6–A13 antes de preparar B/C.
