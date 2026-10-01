# AGENTS.md — MI CUADERNO

Leé esto primero. Después `SPEC.md` (qué hace), `DESIGN.md` (cómo se ve y se mueve) y `DATA_MODEL.md` (qué se guarda). Hacia dónde va: `VISION.md` (la experiencia que se busca, **referencia, no implementación literal**). Lo que falta: `ROADMAP.md` (fases) y `BACKLOG.md` (cada idea con su estado). Recién ahí abrí el código relevante.

## Qué es

Un diario personal digital con forma de **cuaderno de tela bordado**: registro de ánimo, actividades con estados amables, rutinas recurrentes, páginas libres con stickers, calendario, mapa del año, exportación e impresión. 100 % local (IndexedDB), offline, sin cuenta ni servidor. Español rioplatense, neutro en género.

## Skills del repo que aplican (leelas antes de tocar UI)

- `skills/impeccable/reference/craft-floor.md` — piso de calidad y lo que se rechaza (eyebrows, glass, gradientes, íconos con emoji…).
- `skills/ui-ux-pro-max/references/quick-reference.md` — reglas de UX/accesibilidad (§1–§3 críticas). Sus sugerencias de paleta/tipografía no pisan DESIGN.md.
- `skills/frontend-ui-engineering/SKILL.md` — tabla “Avoid the AI Aesthetic”.
- `skills/animate/SKILL.md` y `skills/review-animations/SKILL.md` — antes de agregar o cambiar motion.
- `skills/accessibility/SKILL.md` — WCAG 2.2.

## Filosofía (no negociable)

- Amable siempre: nunca “fallaste”, “racha perdida”, rojo de error para la vida de la persona.
- No clínico: insights descriptivos con conteos, nunca causalidad ni diagnóstico.
- Silencio visual: la pantalla puede estar quieta; motion con propósito; escenas raras.
- Privacidad: nada sale del dispositivo. Sin analytics, sin CDNs en runtime, sin fetch a terceros.
- Nombre de ejemplo (tests, docs, capturas, textos de prueba): siempre **Nicole**. Ningún otro nombre, ni de ejemplo ni de broma (lo vigila `tests/unit/names.test.js`).

## Antes de tomar algo de la visión o del backlog

1. Leé `VISION.md` §0–§1 y `DECISIONS.md` D25 (arquitectura común ya fijada).
2. Buscá la primitiva que ya existe antes de crear otra: motor de elementos (`Placed` → `PageElement`), referencias (`marks`), privacidad en la fuente, `summarize`, `MC.routes`, `activityRow`, `askDate`, `images`/`files`, `draw.js`.
3. **Opcionalidad**: ningún campo nuevo se vuelve obligatorio ni deuda; un día vacío es válido y no se interpreta.
4. **Progressive disclosure**: lo nuevo se descubre; nada de sumar botones a la barra inicial.
5. Todo lo nuevo entra en la copia (`backup.js`, `schemaVersion` + migración + test) y degrada con elegancia si falta una API.
6. Al terminar: sacá el ítem de `BACKLOG.md`, anotalo en `CHANGELOG.md`, actualizá `ROADMAP.md` si cerró una fase.

## Stack

HTML + CSS + **JavaScript clásico** (sin `type="module"`: los módulos no cargan en `file://`). Sin framework, sin build. Todo cuelga de un namespace global `window.MC`.

## Estructura

```
index.html              entrada; carga CSS y scripts en orden (ver final del body)
manifest.webmanifest    PWA
sw.js                   service worker (cache-first del shell; solo http/https)
css/fonts.css           fuentes embebidas (data URI; GENERADO por tools/build-fonts.mjs, no editar)
css/tokens.css          ← todos los tokens (colores, tipos, espacios, motion). Empezá acá.
css/base.css            reset, tipografía, foco, selección, utilidades
css/notebook.css        tela, hojas, lomo, pestañas, tapa, onboarding
css/components.css      parches, casillas de punto cruz, notas, botones-etiqueta, diálogos, stickers
css/views.css           layouts por vista
css/print.css           impresión
js/core/ns.js           namespace, utilidades DOM (h, $, on), ids, debounce
js/core/dates.js        fechas locales AAAA-MM-DD, nombres en español
js/core/routes.js       rutas #/…: armar (MC.routes.day(fecha)…) y leer (parse); única fuente
js/core/recurrence.js   reglas de rutinas → ¿ocurre en esta fecha? + descripción humana
js/core/store.js        IndexedDB (con modo memoria de emergencia)
js/core/model.js        operaciones de dominio (días, actividades, rutinas, páginas, settings)
js/core/backup.js       export/import/validación/migraciones del JSON
js/core/zip.js          ZIP “store” + CRC32 (para XLSX)
js/core/exporters.js    TXT, CSV, XLSX
js/core/insights.js     “Lo que fui notando”
js/ui/icons.js          sprite SVG de íconos
js/ui/stickers.js       arte SVG de stickers + glifos de ánimo
js/ui/components.js     parche de ánimo, casilla de punto cruz, diálogos, toasts, askDate, etc.
js/ui/activity.js       fila de actividad (casilla + menú: estados, pasar a otro día, renombrar, sacar); Hoy y Agenda
js/ui/motion.js         nivel de motion, helpers WAAPI, transiciones de vista
js/ui/scenes.js         director de escenas ocasionales
js/ui/scrapbook.js      capa de stickers (arrastrar, rotar, teclado) + Mis stickers (img:<id>)
js/ui/draw.js           hojita para dibujar (lápiz, goma, texto, colores, deshacer) → imagen propia
js/ui/images.js         subir imágenes (rasterizadas) y adjuntos de un día/página
js/views/*.js           cover, onboarding, today, calendar, agenda, routines, pages, year, settings, print
js/notify.js            recordatorios locales
js/pwa.js               registro de SW, instalación, aviso de actualización
js/app.js               router por hash + arranque: calendario de fondo + cuadro desplegable (dialog #panel) + marcadores
assets/fonts/           woff2 autoalojadas
assets/icons/           favicon, iconos PWA, notificación (generados por tools/make-icons.mjs)
tests/unit/             node:test sobre js/core
tests/e2e/              Playwright
tools/                  serve.mjs, make-icons.mjs, build-fonts.mjs, dist.mjs, check.mjs, shot.mjs (captura para QA)
CHANGELOG.md            qué cambió en cada entrega (actualizarlo al commitear algo visible)
VISION.md               visión de memoria/scrapbook/privacidad (referencia, con numeración del pedido)
ROADMAP.md              fases y verificación pendiente
BACKLOG.md              cada idea pendiente con estado NOW/NEXT/LATER/NEEDS DESIGN/…
PRODUCT.md              verdad de producto (usada por la skill impeccable)
skills/                 colección de skills del proyecto (no es parte de la app; no se distribuye)
```

## Archivos críticos

- `js/core/store.js` + `js/core/backup.js`: tocar con cuidado; cualquier cambio de forma de datos exige migración y subir `SCHEMA_VERSION` (ver DATA_MODEL.md).
- `js/core/recurrence.js`: cubierto por tests; agregá casos antes de cambiar.
- `css/tokens.css`: única fuente de valores visuales. No hardcodear colores en otros archivos.

## Reglas visuales (resumen de DESIGN.md)

- Tela de encuadernar de fondo, hojas crema, hilos como color de dato.
- Jerarquía por tipografía: Young Serif (display), Castoro (escritura), Atkinson Hyperlegible Next (UI), Nanum Pen Script (solo acentos).
- Nada de: cards genéricas, eyebrows, glass, gradientes, glows, pills por todos lados, emojis como íconos, `rounded-3xl` general.
- Estado nunca solo por color (glifo + texto).

## Reglas de motion

- Solo `transform`/`opacity` (y `stroke-dashoffset` para bordar). Easing `--ease-out`. UI ≤ 300ms salvo rituales raros (tapa).
- Respetar `html[data-motion]` (completas/suaves/reducidas/ninguna). El default es **Completas** para todas las personas (D23, pedido de la dueña); quien elige menos en Ajustes, lo tiene.
- Escenas solo vía `MC.scenes` (respeta frecuencia, foco, tecleo, `document.hidden`).

## Almacenamiento y privacidad

- Datos personales → IndexedDB (`MC.store`). localStorage solo para preferencias de UI (`mc.ui.*`).
- Si IndexedDB falla, la app entra en **modo memoria** y muestra un papelito pidiendo descargar copia. No perder datos en silencio.
- Nunca poner contenido escrito por la persona en notificaciones.

## Cómo probar

```
npm test          # unit (node:test), sin instalar nada
npm install       # solo para e2e/íconos: instala playwright-core (no descarga navegadores)
npm run e2e       # 21 recorridos en file:// y http:// (Chromium en /opt/pw-browsers/chromium o CHROMIUM=/ruta)
npm run check     # sintaxis + unit + e2e
npm run serve     # http://localhost:4173 (probar PWA/SW)
```

Probar a mano además: doble clic en `index.html`; mobile 375px; teclado solo; `prefers-reduced-motion`.

## Cómo agregar una funcionalidad

1. Escribila en `SPEC.md` (y `DATA_MODEL.md` si guarda algo nuevo). Registrá decisiones no obvias en `DECISIONS.md`.
2. Lógica pura en `js/core/` con test en `tests/unit/`.
3. UI en `js/views/` o `js/ui/`, usando `MC.h()` y los componentes existentes; estilos con tokens.
4. Nuevo script → agregarlo a `index.html` **y** a la lista `SHELL` de `sw.js`. **Cualquier cambio a un archivo del shell → subir `CACHE_VERSION` en `sw.js`**, o las PWA instaladas no se enteran.
5. `npm run check`. Revisar en desktop y 375px.

## Trampas conocidas

- `file://` bloquea: módulos ES, `fetch` de archivos locales, `@font-face` locales y el manifest. Por eso: scripts clásicos, fuentes embebidas, manifest inyectado solo en http(s).
- Los datos del día se guardan con borrador local + IndexedDB (ver DECISIONS D13): no saltear `persist()`.
- Marcadores (D22): la `nav#tabs` se muda adentro del cuadro abierto y vuelve al cerrarlo (`placeTabs`); no la dupliques.
- Pantalla única (DECISIONS D17): las vistas que no son el calendario se renderizan dentro de `#panel-body`. Menús/avisos van en `MC.c.layer()` (el diálogo abierto), no en `body`.
- Imágenes propias (D24): nunca guardar SVG/HTML del usuario; todo pasa por canvas → WebP/PNG (`MC.images.importImage`). Un sticker `img:<id>` sin imagen no se dibuja.
- Las ocurrencias de rutina son virtuales hasta que se marcan (`item.virtual`); usá `MC.model.setStatus`, nunca escribas actividades de rutina a mano.
- Rutas: nunca escribir `'#/…'` a mano; usar `MC.routes.*`. Una ruta nueva se agrega en `js/core/routes.js` con su test (D19).
- Antes de dibujar o contar algo, buscá si ya existe (D19): `MC.model.summarize` / `countsAsDone` / `hasWriting` / `moodLabel` / `pageTitle`, `MC.dates.fromISO`, `MC.c.moodMark` / `statusMark` / `pageLink(s)`, `MC.stickers.statusMarkup`.
- Conexiones (D20): una vista nueva se conecta con las demás por las fechas: de cada cosa a sus días y de cada día a sus cosas (SPEC §5.1). Enlaces sobre texto que ya existe, no botones nuevos.
- Todo lo que tiene fecha tiene que verse en el calendario (DECISIONS D18). Si agregás algo fechado, sumalo en `MC.model.summarize` (con test) y dale marca + texto en la celda y la leyenda de `js/views/calendar.js`. En días pasados, nunca mostrar lo que quedó sin hacer.
- El calendario de fondo se redibuja solo después de cada cambio guardado (D21): no hace falta avisarle. Una vista del calendario tiene que devolver `{ destroy, ready }` (`ready` = promesa de “ya está dibujado”) para que el cambio sea sin parpadeo.

## Anti-patterns

- Rachas, puntajes, badges, confeti, “¡Genial!🎉”.
- Pedir permisos de notificación al abrir.
- Dashboards/gráficos de barras para el ánimo.
- Guardar datos importantes solo en localStorage.
- Módulos ES o dependencias por CDN (rompen `file://` y offline).
- Animaciones en loop o que se disparan mientras la persona escribe.
