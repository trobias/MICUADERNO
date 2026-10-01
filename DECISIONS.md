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

## D16 · Auditoría con las skills de UI del repo (2026-09-30)
**Contexto:** se revisó la app con `ui-ux-pro-max` (quick-reference + pro-rules), `frontend-ui-engineering` y `impeccable` (craft-floor, polish). El `--design-system` de `ui-ux-pro-max` propuso un patrón de landing (“storytelling”), acento índigo `#6366F1` y manuscrita como fuente principal: se descartó por contradecir el brief (manuscrita solo como acento) y por ser justamente el look genérico a evitar.
**Decisión (aplicada):** barra inferior con 5 destinos + Ajustes arriba en celular; celdas del año de 22 px; foco en tinta en vez de violeta; `scroll-padding` para que las barras fijas no tapen el foco; umbral de arrastre en stickers; errores del formulario de rutina junto al campo con `aria-describedby`/`aria-invalid`; restaurar el scroll al volver atrás; avisos de 3,5 s; `touch-action: manipulation`. Nuevos E2E: 320 px, celular apaisado, ≤5 pestañas, tamaño de celdas, error junto al campo.
**Pendiente propuesto:** tema “papel de noche” para escribir a oscuras (ui-ux-pro-max recomienda diseñar claro/oscuro juntos).

## D17 · Una sola pantalla con el calendario al centro (2026-10-01)
**Contexto:** la dueña del proyecto encontró complejo navegar entre marcadores (Hoy, Calendario, Rutinas, Páginas, Mi año) como pantallas separadas. Pidió “todo en la misma pantalla, como mini opciones que abran cuadros desplegables”, con el calendario como centro y los meses a mano para cambiar fácil.
**Decisión:** el calendario mensual es el fondo permanente, con tira de 12 meses. Cinco botoncitos (Hoy, Rutinas, Páginas, Mi año, Ajustes) abren cuadros desplegables (`<dialog>` modal) encima; tocar un día abre su página en el cuadro. Se eliminaron las pestañas laterales, la barra inferior y la barra superior del celular. Las rutas por hash se mantienen (cada cuadro es enlazable y el *atrás* del navegador lo cierra).
**Consecuencias:** menos lugares a donde ir; el calendario se refresca al cerrar un cuadro. Menús y avisos se cuelgan dentro del diálogo abierto (`MC.c.layer()`) para no quedar inertes. Reemplaza la parte de navegación de D16 (barra inferior de 5 destinos).

## D18 · Todo lo que tiene fecha aparece en el calendario (2026-10-01)
**Contexto:** con el calendario como centro (D17), la dueña del proyecto preguntó si “todas las secciones” se veían ahí. No: las rutinas solo contaban después de marcarlas (D7, materialización perezosa), lo planeado para días futuros no se veía en el mes y las páginas libres no tenían lugar en el calendario.
**Decisión:** el resumen del calendario (`summaryRange`) suma las ocurrencias de rutina todavía sin marcar y las páginas (por la fecha local de `createdAt`, que no cambia al editar; `updatedAt` haría saltar la marca). En la celda: **hoy y adelante** muestran lo planeado (□n, rutinas incluidas); **el pasado** solo muestra lo hecho (×n): no se cuenta lo que quedó sin marcar, para no convertir el calendario en una lista de deudas (filosofía amable). La página del día y la semana enlazan las páginas empezadas ese día. *Mi año* ignora las ocurrencias virtuales (solo borda lo registrado).
**Consecuencias:** no cambia la forma de los datos (todo es derivado). Calcular rutinas por día cuesta `días × rutinas` llamadas a `occursOn`; un año con 20 rutinas son ~7 300 llamadas baratas, sin impacto visible. Una página no tiene “día” propio: si en el futuro se quiere atar a otro día, haría falta un campo `date` y migración.

## D19 · Un solo lugar para rutas, cuentas y dibujos (2026-10-01)
**Contexto:** al conectar las secciones entre sí aparecieron copias de la misma lógica: unas 40 direcciones `#/…` escritas a mano en 10 archivos; tres cuentas de “qué hubo ese día” que no coincidían (la impresión contaba solo `done`, el calendario `done` + `partial`); tres dibujos de los estados de punto cruz (casilla, semana, impresión); seis conversiones de `createdAt` a fecha; el parche de ánimo con su nombre armado a mano en cada vista.
**Decisión:** `js/core/routes.js` (`MC.routes`) arma y lee todas las rutas, con tests; `MC.model.summarize` es la única cuenta por día y `countsAsDone` la única regla de “hecho”; `MC.stickers.STITCH` es el único dibujo de las puntadas (`statusMarkup` para la marca quieta); piezas compartidas en `MC.c`: `moodMark`, `statusMark`, `pageLink`, `pageLinks`; `MC.dates.fromISO` para instantes guardados.
**Consecuencias:** agregar una ruta o un enlace es un cambio en un lugar. La impresión ahora cuenta “un poquito” como hecho, igual que el calendario. `sw.js` no puede cargar `MC.routes` (no tiene `window`): sus `#/hoy` quedan escritos a mano y un test verifica que sigan siendo rutas válidas.
