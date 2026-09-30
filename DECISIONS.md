# Decisiones

Registro breve de decisiones de arquitectura y producto. Formato: contexto → decisión → consecuencias.

## D1 · JavaScript clásico, sin build (2026-09-30)
**Contexto:** la persona usuaria debe abrir `index.html` con doble clic. Chrome bloquea `<script type="module">` y `fetch` de archivos locales en `file://`.
**Decisión:** scripts clásicos que cuelgan de `window.MC`, cargados en orden desde `index.html`. Sin bundler.
**Consecuencias:** cero pasos de build; el repo es la app. Hay que mantener el orden de scripts a mano. Tests de Node cargan los archivos con `vm`.

## D2 · Doble modo: carpeta + PWA (2026-09-30)
**Contexto:** la dueña eligió “ambas”. Los service workers no existen en `file://`.
**Decisión:** la misma carpeta funciona en `file://` (sin SW, sin instalación) y por HTTPS como PWA instalable. `js/pwa.js` detecta el protocolo.
**Consecuencias:** notificaciones y offline-cache solo en el modo PWA; en `file://` offline es natural (los archivos ya son locales).

## D3 · App en la raíz del repo (2026-09-30)
**Contexto:** el repo ya contenía `skills/`. La dueña eligió la raíz.
**Decisión:** `index.html` en la raíz; `skills/`, `tests/`, `tools/` quedan al lado y **no** se distribuyen: `npm run dist` copia solo la app a `dist/MI-CUADERNO/`.

## D4 · Dirección visual “diario de tela bordado” (2026-09-30)
**Contexto:** el brief fija cuaderno/papelería/paleta pastel; la tirada de `impeccable` (modo degradado, sin retadores) asignó el candidato 3 de la lista propia: diario encuadernado en tela con bordado.
**Decisión:** tela de color pleno como fondo, hojas crema, hilos como color de dato; punto cruz para estados de actividad y para el año.
**Consecuencias:** evita el look genérico “crema + serif + acento terracota”: el color de página completa es la tela de la tapa elegida.

## D5 · Tipografías fuera de los defaults (2026-09-30)
**Contexto:** las sugeridas por el brief (DM Serif, Lora, Cormorant) están en la lista de defaults de entrenamiento que `impeccable` pide evitar salvo razón fuerte; el brief permite alternativas.
**Decisión:** Young Serif / Castoro / Atkinson Hyperlegible Next / Nanum Pen Script, autoalojadas (OFL).

## D6 · Paleta de ánimo validada (2026-09-30)
**Contexto:** 5 niveles ordenados, deben distinguirse con daltonismo.
**Decisión:** rampa ordinal oscuro→claro validada con `dataviz` (monótona, ΔL ≥ 0.06); CVD 6.3 entre 1–2 → glifo obligatorio por ánimo.

## D7 · Rutinas con materialización perezosa (2026-09-30)
**Decisión:** las ocurrencias se calculan; solo se guarda una actividad cuando la persona cambia su estado.
**Consecuencias:** editar/borrar una rutina no reescribe el pasado; los días futuros se ven al instante; no hay jobs de generación.

## D8 · XLSX sin dependencia (2026-09-30)
**Contexto:** SheetJS en npm está desactualizado y pesa ~900 KB; solo necesitamos escribir tablas simples.
**Decisión:** ZIP “store” + CRC32 + SpreadsheetML mínimo (~150 líneas, `js/core/zip.js` + `exporters.js`), con strings inline y encabezados en negrita.

## D9 · PDF vía impresión del navegador (2026-09-30)
**Decisión:** documento de impresión dedicado con `@page` (A4/A5/Letter) → “Guardar como PDF” del sistema. Sin jsPDF/html2canvas (texto seleccionable, liviano, fiel a las fuentes).

## D10 · Restaurar = reemplazar (2026-09-30)
**Decisión:** en v1, importar reemplaza todo, con advertencia y opción de descargar la copia actual antes. Sin “merge” para no generar duplicados ambiguos.

## D11 · Notificaciones locales (2026-09-30)
**Contexto:** sin servidor no hay Web Push.
**Decisión:** `Notification`/`registration.showNotification` programadas por un reloj interno mientras la app/PWA está viva + Periodic Background Sync cuando exista. Se explica honestamente en Ajustes.

## D12 · Fuentes embebidas en CSS (2026-09-30)
**Contexto:** al probar con doble clic, Chrome bloqueó las `@font-face` locales (CORS, origen `null` en `file://`).
**Decisión:** `css/fonts.css` con las cinco fuentes como data URI (≈172 KB), generado por `tools/build-fonts.mjs`.
**Consecuencias:** misma tipografía en `file://` y en la PWA; el CSS inicial pesa más, pero se cachea y no hay peticiones extra.

## D13 · Borrador local además de IndexedDB (2026-09-30)
**Contexto:** las pruebas E2E mostraron que lo escrito justo antes de recargar podía perderse (la escritura en IndexedDB es asíncrona y va con un respiro de 400 ms).
**Decisión:** cada cambio de un día o página se anota al instante en `localStorage` (`mc.ui.draft.*`) y se borra cuando IndexedDB confirma. Al abrir, un borrador más nuevo que lo guardado se recupera y se guarda.
**Consecuencias:** localStorage solo guarda transitoriamente el último cambio en curso; la fuente de verdad sigue siendo IndexedDB.

## D14 · Ícono: parche bordado (2026-09-30)
**Decisión:** entre tres exploraciones se eligió el parche bordado (ver DESIGN §16) por legibilidad a 16 px y coherencia con los parches de ánimo.

## D15 · El manifest se enlaza solo por http(s) (2026-09-30)
**Contexto:** en `file://` el navegador no puede leer el manifest y deja un error en consola.
**Decisión:** `js/pwa.js` agrega `<link rel="manifest">` solo cuando la app se sirve por http(s). El SW solo recarga la página cuando reemplaza a una versión anterior (no en la primera instalación).
