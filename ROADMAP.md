# MI CUADERNO — Roadmap

Estado al 01/10/2026. Lo hecho está en `SPEC.md` y `CHANGELOG.md`. Acá va **el orden** de lo que falta, agrupado por la infraestructura que comparte; cada ítem (con su estado NOW/NEXT/LATER…) está en [`BACKLOG.md`](BACKLOG.md) y la experiencia que se busca, en [`VISION.md`](VISION.md). Las decisiones de arquitectura de la visión: `DECISIONS.md` D25.

Regla de este roadmap: **la app no tiene que sentirse grande**. Cada fase es una capacidad bien diseñada que después usan varias ideas; no una lista de features sueltas.

## Hecho

MVP completo del brief §64 y, después: una sola pantalla con el calendario al centro (D17); todo lo que tiene fecha en el calendario (D18); rutas, cuentas y dibujos en un solo lugar (D19); secciones conectadas por las fechas (D20); calendario en vivo (D21); marcadores que abren cuadros y Agenda con alta/edición/baja (D22); el mes muestra todo y todo se anima, “Completas” por defecto (D23); dibujar, imágenes propias como stickers y adjuntos (D24). `schemaVersion` 3. 50 unit + 21 E2E en verde.

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
| V7 | Publicar en GitHub Pages y probar la actualización de versión (`CACHE_VERSION`) | brief §86 | P1 |

## Fases

Cada fase dice qué capacidad construye, qué ítems del backlog resuelve y de qué depende. Se puede cambiar el orden si la verificación (V1–V7) muestra otra urgencia.

### Fase 1 · Cimientos que protegen lo guardado — **NOW**
Antes de sumar mucho contenido nuevo, que nada se pierda y que todo se pueda deshacer.
- **Papelera** con borrado suave y retención (DA1).
- **Deshacer / rehacer** común con `Ctrl+Z` / `Ctrl+Shift+Z` (DA2).
- **“guardando… → guardado ✓”** en todas las superficies (DA3).
- **Cuánto ocupa mi cuaderno**, con desglose y aviso de copia grande (DA4).
- **Privacidad de esta página** (no recuerdo / no insights / no revisiones) que respeten insights y *Mi año* (PV1).
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
- Depende de: DA4 (medir antes de optimizar).

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

## Próximo paso sugerido

1. V7 publicar en GitHub Pages → V1–V3 y V6 en dispositivos reales.
2. Fase 1 completa (es lo que protege todo lo demás).
3. Fase 5 en paralelo (chica, alto impacto en el día a día) y después Fase 2.
