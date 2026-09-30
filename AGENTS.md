# AGENTS.md — MI CUADERNO

Leé esto primero. Después `SPEC.md` (qué hace), `DESIGN.md` (cómo se ve y se mueve) y `DATA_MODEL.md` (qué se guarda). Recién ahí abrí el código relevante.

## Qué es

Un diario personal digital con forma de **cuaderno de tela bordado**: registro de ánimo, actividades con estados amables, rutinas recurrentes, páginas libres con stickers, calendario, mapa del año, exportación e impresión. 100 % local (IndexedDB), offline, sin cuenta ni servidor. Español rioplatense, neutro en género.

## Filosofía (no negociable)

- Amable siempre: nunca “fallaste”, “racha perdida”, rojo de error para la vida de la persona.
- No clínico: insights descriptivos con conteos, nunca causalidad ni diagnóstico.
- Silencio visual: la pantalla puede estar quieta; motion con propósito; escenas raras.
- Privacidad: nada sale del dispositivo. Sin analytics, sin CDNs en runtime, sin fetch a terceros.

## Stack

HTML + CSS + **JavaScript clásico** (sin `type="module"`: los módulos no cargan en `file://`). Sin framework, sin build. Todo cuelga de un namespace global `window.MC`.

## Estructura

```
index.html              entrada; carga CSS y scripts en orden (ver final del body)
manifest.webmanifest    PWA
sw.js                   service worker (cache-first del shell; solo http/https)
css/tokens.css          ← todos los tokens (colores, tipos, espacios, motion). Empezá acá.
css/base.css            reset, tipografía, foco, selección, utilidades
css/notebook.css        tela, hojas, lomo, pestañas, tapa, onboarding
css/components.css      parches, casillas de punto cruz, notas, botones-etiqueta, diálogos, stickers
css/views.css           layouts por vista
css/print.css           impresión
js/core/ns.js           namespace, utilidades DOM (h, $, on), ids, debounce
js/core/dates.js        fechas locales AAAA-MM-DD, nombres en español
js/core/recurrence.js   reglas de rutinas → ¿ocurre en esta fecha? + descripción humana
js/core/store.js        IndexedDB (con modo memoria de emergencia)
js/core/model.js        operaciones de dominio (días, actividades, rutinas, páginas, settings)
js/core/backup.js       export/import/validación/migraciones del JSON
js/core/zip.js          ZIP “store” + CRC32 (para XLSX)
js/core/exporters.js    TXT, CSV, XLSX
js/core/insights.js     “Lo que fui notando”
js/ui/icons.js          sprite SVG de íconos
js/ui/stickers.js       arte SVG de stickers + glifos de ánimo
js/ui/components.js     parche de ánimo, casilla de punto cruz, diálogos, toasts, etc.
js/ui/motion.js         nivel de motion, helpers WAAPI, transiciones de vista
js/ui/scenes.js         director de escenas ocasionales
js/ui/scrapbook.js      capa de stickers (arrastrar, rotar, teclado)
js/views/*.js           cover, onboarding, today, calendar, routines, pages, year, settings, print
js/notify.js            recordatorios locales
js/pwa.js               registro de SW, instalación, aviso de actualización
js/app.js               router por hash + arranque
assets/fonts/           woff2 autoalojadas
assets/icons/           favicon, iconos PWA, notificación (generados por tools/make-icons.mjs)
tests/unit/             node:test sobre js/core
tests/e2e/              Playwright
tools/                  serve.mjs, make-icons.mjs, dist.mjs
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
- Respetar `html[data-motion]` (completas/suaves/reducidas/ninguna) y `prefers-reduced-motion`.
- Escenas solo vía `MC.scenes` (respeta frecuencia, foco, tecleo, `document.hidden`).

## Almacenamiento y privacidad

- Datos personales → IndexedDB (`MC.store`). localStorage solo para preferencias de UI (`mc.ui.*`).
- Si IndexedDB falla, la app entra en **modo memoria** y muestra un papelito pidiendo descargar copia. No perder datos en silencio.
- Nunca poner contenido escrito por la persona en notificaciones.

## Cómo probar

```
npm test          # unit (node:test), sin instalar nada
npm install       # solo para e2e (instala @playwright/test; usa el Chromium del sistema si PLAYWRIGHT_BROWSERS_PATH existe)
npm run e2e       # recorridos en file:// y http://
npm run check     # sintaxis + unit + e2e
npm run serve     # http://localhost:4173 (probar PWA/SW)
```

Probar a mano además: doble clic en `index.html`; mobile 375px; teclado solo; `prefers-reduced-motion`.

## Cómo agregar una funcionalidad

1. Escribila en `SPEC.md` (y `DATA_MODEL.md` si guarda algo nuevo). Registrá decisiones no obvias en `DECISIONS.md`.
2. Lógica pura en `js/core/` con test en `tests/unit/`.
3. UI en `js/views/` o `js/ui/`, usando `MC.h()` y los componentes existentes; estilos con tokens.
4. Nuevo script → agregarlo a `index.html` **y** a la lista `SHELL` de `sw.js` (y subir `CACHE_VERSION`).
5. `npm run check`. Revisar en desktop y 375px.

## Anti-patterns

- Rachas, puntajes, badges, confeti, “¡Genial!🎉”.
- Pedir permisos de notificación al abrir.
- Dashboards/gráficos de barras para el ánimo.
- Guardar datos importantes solo en localStorage.
- Módulos ES o dependencias por CDN (rompen `file://` y offline).
- Animaciones en loop o que se disparan mientras la persona escribe.
