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
**Decisión:** `js/core/routes.js` (`MC.routes`) arma y lee todas las rutas, con tests; `MC.model.summarize` es la única cuenta por día y `countsAsDone` la única regla de “hecho”; `MC.stickers.STITCH` es el único dibujo de las puntadas (`statusMarkup` para la marca quieta); piezas compartidas en `MC.c`: `statusMark`, `pageLink`, `pageLinks` y, desde A4, `feelingEditor`/`feelingMark` en lugar del antiguo `moodMark`; `MC.dates.fromISO` para instantes guardados.
**Consecuencias:** agregar una ruta o un enlace es un cambio en un lugar. La impresión ahora cuenta “un poquito” como hecho, igual que el calendario. `sw.js` no puede cargar `MC.routes` (no tiene `window`): sus `#/hoy` quedan escritos a mano y un test verifica que sigan siendo rutas válidas.

## D20 · Las secciones se conectan por las fechas (2026-10-01)
**Contexto:** con todo en el calendario (D18) y la lógica en un solo lugar (D19), cada sección seguía siendo una isla: desde un día no se llegaba a su rutina; desde una rutina, no se veían sus días; una página no llevaba a su día; *Mi año* y el mes no se hablaban; “Lo que fui notando” contaba días que no se podían ver.
**Decisión:** cada cosa lleva a sus días y cada día a sus cosas (tabla en SPEC §5.1). Dos rutas nuevas: `#/rutinas/:id` (la rutina resaltada) y `#/calendario/mes/AAAA-MM/rutina/:id` (sus días marcados). Los insights dicen de qué días hablan. El botoncito *Mi año* abre el año que se está mirando. Los enlaces van sobre texto que ya existía (fechas, “próxima: …”, iniciales) o en íconos chicos; no se agregaron botones grandes.
**Consecuencias:** para atrás, los días de una rutina muestran solo cuándo se hizo (coherente con D18: nunca lo que no se hizo). No hay datos nuevos: `summarize` suma `byRoutine` al resumen derivado. Una página sigue atada al día en que se empezó (I8 queda para cuando se quiera elegir otro).

## D21 · El calendario se actualiza solo, sin moverse (2026-10-01)
**Contexto:** el calendario de fondo solo se volvía a dibujar al cerrar un cuadro, y entero: vaciaba la grilla y la llenaba de nuevo (un parpadeo), y el foco del teclado se perdía porque el día que había abierto el cuadro ya no existía. Lo que cambiaba en otra pestaña tampoco se veía hasta navegar.
**Decisión:** cada escritura (`store:changed`) y cada aviso de otra pestaña (`store:remote`) marcan el calendario como desactualizado; 600 ms después del último cambio se dibuja uno nuevo **aparte** y se cambia entero cuando está listo (las vistas del calendario devuelven `ready`). El cuadro abierto no se toca (si el aviso viene de otra pestaña, se refresca solo cuando no se está escribiendo, como antes). Al cerrar un cuadro: si nada cambió, no se redibuja; el foco vuelve al botoncito que lo abrió o al último día abierto, que también lleva la cinta (SPEC §7.3).
**Consecuencias:** mientras se escribe, el fondo se redibuja como mucho una vez por pausa (el guardado ya espera 400 ms); es barato (un mes ≈ 42 celdas) y no tiene animación (DESIGN §12). `renderBase` ya no tiene `force`: para forzar, `MC.app.refresh()`.

## D22 · Vuelven los marcadores, pero abren cuadros; la Agenda pone cosas en el calendario (2026-10-01)
**Contexto:** la dueña del proyecto quiso que los botoncitos vuelvan a ser los marcadores de antes (pestañas al costado; abajo en el celular), sin volver a las secciones separadas: que solo abran cuadros, que todo gire en torno a poner cosas en el calendario y que cada cosa tenga su alta, vista, edición y baja.
**Decisión:** marcadores *Hoy · Agenda · Rutinas · Páginas · Mi año* + *Ajustes* aparte (el viejo “Calendario” es ahora **Agenda**: el calendario ya es el fondo). Con un cuadro abierto la `nav` se muda a su costado (el resto queda inerte por el `<dialog>` modal) para pasar de uno a otro sin cerrar. La Agenda anota cosas en cualquier día y lista lo que viene; la fila de actividad pasa a `js/ui/activity.js` (misma en Hoy y Agenda) y suma **Pasar a otro día…** (`moveActivity`: una propia cambia de fecha; una de rutina queda “para otro día” y se copia). Las páginas tienen día elegible (`page.date`, `schemaVersion` 2) — cierra I8. El cuadro se despliega desde el lado de los marcadores (abajo en el celular).
**Consecuencias:** reemplaza la parte visual de D17 (botoncitos arriba) y D16 (barra inferior: vuelve, con 5 destinos + carretel). Una copia v1 se migra sola; una v2 no abre en una versión vieja (avisa “versión más nueva”).

## D23 · El mes muestra todo, todo se anima y “Completas” por defecto (2026-10-01)
**Contexto:** la dueña del proyecto pidió que Hoy, Rutinas y Páginas se vean en el mes principal (“todo conectado”), que todo tenga animaciones (también al pasar de mes a semana) y que cualquier persona empiece con “Completas”.
**Decisión:** en pantallas anchas cada día muestra hasta 3 **hilitos** con el título y el color de su marcador (Agenda rosa, Rutinas salvia, Páginas lavanda) y “+N más”; de hoy en adelante lo que falta, para atrás solo lo hecho (D18). `summarize` suma `items`. Cambiar de mes desliza la hoja (28px hacia ese lado); mes ↔ semana entra con escala 0,97 → 1; ambos ≤ 300 ms, armados aparte y sin parpadeo; pasar de un marcador a otro sube la hoja 8px; tocar un día hunde la celda. Motion por defecto **Completas** para todas las personas: el viejo valor de fábrica (“suaves”, o “reducidas” por el sistema) se reemplaza; una elección guardada (`motionChosen`) y “Ninguna” se respetan. Si el sistema pide menos movimiento, Ajustes lo dice y sugiere bajarlo.
**Consecuencias:** se deja de seguir automáticamente `prefers-reduced-motion` al empezar (decisión explícita de la dueña; queda a un toque en Ajustes). Reemplaza la parte de motion de D16 y la regla de AGENTS.

## D24 · Dibujar, imágenes propias y adjuntos (2026-10-01)
**Contexto:** la dueña del proyecto pidió poder dibujar donde convenga (colores, trazos, letras, “sin ser un Illustrator”), subir imágenes de cualquier formato para usarlas como stickers en todos lados, y carga de archivos en general (sin un uso claro).
**Decisión:** un dibujo y una imagen subida son lo mismo para el cuaderno: una **imagen propia** (`images`) que se pega como sticker (`img:<id>`) con el scrapbook de siempre (mover, girar, tamaño, teclado). El editor (`js/ui/draw.js`) es una hojita con lápiz, goma, texto, 12 colores de los tokens, 3 grosores y deshacer; guarda los trazos para re-editar y una imagen recortada. Las imágenes subidas se rasterizan (canvas → WebP/PNG, máx. 900 px): un SVG nunca se guarda como código. Para “cualquier archivo”: **adjuntos** en un día o una página (`files`, máx. 10 MB), para guardar con el día lo que no es texto (una entrada, un PDF, una foto, un audio); una imagen adjunta se puede pegar como sticker. Todo va en la copia (`schemaVersion` 3, IDB v2). Cierra B3.
**Consecuencias:** las copias con fotos y adjuntos pesan más (data URLs en el JSON). Sin capas ni exportar dibujos sueltos: si hace falta, se agrega después. Sacar una imagen de *Mis stickers* la despega de todas las hojas.

## D25 · La visión de memoria, scrapbook y privacidad: referencia y arquitectura común (2026-10-01)
**Contexto:** la dueña del proyecto escribió una visión grande (80 puntos: revisiones, recuerdos, privacidad emocional, buscador, etiquetas, colecciones, favoritos y marcadores, papelera, deshacer, modo escritura y modo calma, dibujo, motor de scrapbook, fotos, polaroids, audio, canciones, notas al margen, post-its, cosas sueltas, sobres, bloqueo local, portadas, separadores, victorias, notificaciones finas, `.micuaderno`…). Pidió explícitamente que sea **referencia, no implementación literal**, que se fusionen conceptos y se reutilice la infraestructura, y que todo quede en roadmap y backlog.
**Decisión:** se guarda completa en `VISION.md` (con su numeración), se ordena en fases en `ROADMAP.md` y cada idea queda en `BACKLOG.md` con estado (NOW/NEXT/LATER/NEEDS DESIGN/NEEDS RESEARCH/EXPERIMENTAL/BLOCKED). Direcciones de arquitectura que ya quedan fijadas, para no duplicar sistemas:
1. **Un solo motor de elementos de página**: nace del `Placed` de los stickers (migración, no sistema paralelo); `scrapbook.js` pasa a editar todos los tipos (sticker, imagen/polaroid, post-it, nota al margen, dibujo, texto, cinta, sello, tarjeta de canción, audio). Portada, revisiones y sobres son **superficies** del mismo motor.
2. **Memorias por referencia**: favoritos, marcadores, victorias, recuerdos, “Abrime algo lindo”, “un día como hoy” y colecciones apuntan al contenido (`marks`: `sourceType`, `sourceId`, `kind`, `color`); nunca copian el contenido.
3. **La privacidad vive en la fuente**: cada día/página/elemento lleva sus banderas (no recordar, no insights, no revisiones); las referencias y los cálculos (`insights.js`, revisiones, recuerdos, buscador) las consultan. Es requisito previo de memorias y revisiones.
4. **Papelera = borrado suave** (`deletedAt`) en el mismo store, con limpieza por retención; las lecturas normales filtran lo borrado.
5. **Deshacer/rehacer = pila de comandos por superficie** (`MC.history`); el texto usa el deshacer nativo del navegador.
6. **`ContentBlock` no se adopta a ciegas**: primero páginas libres y sobres; la página del día solo después de diseñar los bloques flexibles (y de partir `today.js`).
7. **Modo calma ≠ nivel de movimiento**: ajuste aparte (`calmMode`) que baja densidad y estímulos; el nivel de motion sigue siendo accesibilidad (D23).
8. **Canciones sin fetch a terceros por defecto** (regla de privacidad de AGENTS): se reconoce el proveedor por la URL y se guarda lo que la persona escribe; traer título o portada solo con un toque explícito y avisando. Nunca reproductor.
9. **Bloqueo honesto**: si es solo una pantalla (privacidad visual), la UI lo dice; cifrar de verdad (WebCrypto con clave derivada del PIN) es una investigación aparte.
10. **`.micuaderno` = ZIP** (reutiliza `zip.js`) con `manifest.json`, `data.json` y `media/`; las copias `.json` viejas siguen abriéndose. Toda forma nueva de datos sube `schemaVersion` con migración y test.
11. No existe ninguna librería “Ponytail” en el repo (revisado el 2026-10-01): no se inventa.
**Consecuencias:** la próxima entrega es la Fase 1 (papelera, deshacer, guardado visible, cuánto ocupa, privacidad por página) porque protege todo lo demás. Cualquier agente que tome una idea de la visión lee `VISION.md` §0 y esta decisión antes de programar.

## D26 · Contratos de Fase 1: papelera, privacidad, esquema v4, deshacer y guardado visible (2026-10-02)
**Contexto:** antes de escribir código para lo que resta de la Fase 1 del roadmap (`ROADMAP.md`), es indispensable fijar contratos explícitos de modelos de datos, APIs y reglas de interfaz/accesibilidad para que los implementadores no adivinen ni bifurquen la arquitectura.
**Decisión:** se fijan y documentan los siguientes contratos en `SPEC.md`, `DATA_MODEL.md` y `DESIGN.md`:
1. **DA1 Papelera (borrado suave):** campo `deletedAt: ISO | null` (UTC) en el mismo store de cada entidad (`pages`, `routines`, `images`, `files`, `activities`, `days`). Sin stores paralelos (D25). Retención configurable en `settings.trashRetentionDays` (default 30 días; 0 = sin purga automática). Purga automática después de cargar Ajustes, antes de cargar las imágenes; si falla, el cuaderno abre igual y vuelve a intentarlo en el próximo arranque. Vaciado manual con confirmación y restauración simple (`deletedAt = null`). Las listas activas, el calendario (`MC.model.summarize`) e `insights.js` descartan los registros borrados. La apertura explícita de un día admite revisar su hoja en papelera; editarla la restaura. Sacar una actividad sigue siendo borrado definitivo con Deshacer, aunque el esquema admite `deletedAt` en actividades. La papelera entra íntegra en las copias de seguridad `.json`.
2. **PV1 Privacidad de página y día:** objeto opcional `privacy: { noMemory, noInsights, noReviews } | null` en días y páginas. Ausencia o valores falsos equivalen a comportamiento normal. Opcionalidad radical sin culpa ni marcas llamativas: solo un candadito sutil en tinta suave. `insights.js` descarta días con `noInsights === true`. *Mi año* y revisiones descartan contenido con `noReviews === true`. Recuerdos espontáneos ("Abrime algo lindo", recuerdos suaves) descartan registros con `noMemory === true`.
3. **Esquema v4 y migración:** `schemaVersion` avanza de 3 a 4. Migración puramente aditiva: `MIGRATIONS[4]` en `backup.js` incorpora `trashRetentionDays: 30` en settings y valida `deletedAt` y `privacy` en las entidades. No requiere reescritura masiva de registros en IndexedDB. Backups v1, v2 y v3 se migran en cadena y abren de forma limpia. Copias futuras (v5) se rechazan con mensaje claro. Pruebas unitarias cubren la migración, la persistencia y la tolerancia a campos ausentes.
4. **DA2 Deshacer y rehacer:** módulo `js/core/history.js` con API `MC.history.create({ limit = 50 })` que expone `push({ label, undo, redo })`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `clear()`, `onChange(fn)`. Una pila aislada por superficie (scrapbook, dibujo, acciones de actividad). Atajos `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` interceptados únicamente cuando el foco **no** está en un campo de texto editable (donde manda el historial nativo del navegador). Botones táctiles integrados en las barras existentes; estado deshabilitado comunicado con opacidad (50 %), `disabled` y `aria-disabled="true"`, nunca solo por color.
5. **DA3 Guardado visible:** componente unificado `c.savedNote` (`js/ui/components.js`) con ciclo `guardando…` (tinta tenue) → `guardado ✓` (hilo salvia, ~1.5 s) → `reposo` (desvanecimiento suave de opacidad). Aviso amable si falla IndexedDB (conserva el borrador en memoria y ofrece descargar copia). Misma pieza en día, página, scrapbook y ajustes. Sin toasts por cada cambio. Respeta tokens de motion (`html[data-motion]`). `aria-live="polite"` activo únicamente para anuncios de guardado y fallos.
6. **Formalización de DA4 y T6:** se incorporan en la especificación la medición de almacenamiento con desglose de categorías y aviso > 5 MB (`settings.measureStorage`, commit `31cf336`) y el ocultamiento automático de la barra de marcadores en móvil ante la apertura del teclado virtual (`visualViewport`, commit `3071b7c`).
**Consecuencias:** la Fase 1 queda completamente contratada para su implementación inmediata. Los datos quedan protegidos ante borrados involuntarios y fallos de almacenamiento; la privacidad emocional queda garantizada en la fuente antes de iniciar las fases de memorias y revisiones; la experiencia de usuario mantiene el silencio visual y la filosofía amable del cuaderno.

## D27 · Menos marcadores, la semana al centro, fondo editable (2026-10-04)
**Contexto:** la dueña del proyecto pidió (03/10) que la semana sea la vista por defecto con forma de *planner* (Importante · Lunes…Domingo · Notas, con casillas), que en cada actividad se anote cómo se sintió antes y después, y sacar *Agenda* (“redundante: desde el calendario ya se toca cualquier día”) y *Rutinas* como marcador (repetir se hace desde el día).
**Decisión:** marcadores **Hoy · Mis hojas · Mi año · Ajustes**. El calendario abre en la **semana-planner** (el modo elegido dura la sesión); el mes queda a un toque. La semana se edita en el fondo: es una enmienda a D17/D21 con un contrato de vista base `{ ready, destroy, refresh(cambio), flush, busy }`, y sus renglones vacíos son la única excepción a “no sumar controles a la vista inicial”. En días pasados queda lo que la persona escribió y nunca las ocurrencias de repetición sin marcar (D18); lo que se anota en un día pasado nace “hecho”. Las rutas viejas (`#/agenda`, `#/rutinas`, `#/rutinas/:id`, `#/paginas`) redirigen.
**Consecuencias:** reemplaza la navegación de D22 y los hilitos por color de marcador de D23 (pasan a hilo + glifo por tipo). Estado: contrato; se implementa en los pasos A5 y A6 del plan del 03/10.

## D28 · Emociones escritas en vez de la escala de 5 (2026-10-04)
**Contexto:** “hay muchísimas emociones” (triste, sin energía, con energía, con ansiedad, con motivación…): una lista cerrada de 5 no alcanza. La dueña eligió que las emociones escritas **reemplacen** los parches.
**Decisión:** el día (al empezar y al terminar) y cada actividad (antes y después) llevan emociones escritas, con sugerencias (las más usadas + una base neutra en género). El color de cada emoción sale de una paleta fija apta para daltonismo, asignada por frecuencia en cada vista (el resto, “otras”), y la persona lo puede fijar; nunca es el único portador de significado (palabra en texto, en `aria-label` y en la leyenda). Las observaciones dejan de comparar ánimos “mejores” y cuentan palabras.
**Consecuencias:** D6 queda como historia. A4 implementa escritura libre en Día y Actividad y lectura dual de `mood n` con el nombre que la persona tenía (`legacyMoodLabels`); la escala no se usa para insights ni exportaciones nuevas. El campo viejo se conserva hasta v6. A8 ampliará los conteos del Año.

## D29 · Hojas del día, plantillas y “Guardar” (2026-10-04)
**Contexto:** “las páginas deberían ser una plantilla para poner en cualquier día y escribir ahí”. Hasta ahora una página era una hoja suelta con un día, y sus 12 plantillas solo ponían un texto inicial.
**Decisión:** una página es una **hoja de un día**. Una plantilla es estructura reutilizable: bloques renglones, lista, casillas y columnas, más papel y stickers. Los campos propios del día (intención, notas, cierre) no se vuelven bloques (D25.6); los elementos sueltos siguen en el scrapbook hasta el motor de elementos (D25.1). “Guardar” vuelve una hoja plantilla y/o la **repite** con el motor de rutinas (D7): ocurrencias virtuales que se materializan al escribir, con id determinista y una copia congelada de la plantilla. La recurrencia suma la regla **anual**. El marcador *Páginas* pasa a ser **Mis hojas** (plantillas, lo que se repite, índice).
**Consecuencias:** las páginas existentes quedan como hojas de su día (sus `kind/body/items` conviven con `blocks/values` hasta v6). Estado: contrato; se implementa en los pasos A5 y A7.

## D30 · Colores propios (2026-10-04)
**Contexto:** la dueña pidió “infinitas posibilidades” de color en Ajustes: pasteles, degradados, quebrados, neutros, neón, mates, brillantes, con código de color.
**Decisión:** un motor de temas deriva todos los tokens desde pocos colores (tela, hojas, tinta, 4 acentos) más un fondo liso o degradado y un acabado (mate, satinado, brillante). Los degradados, el neón y los brillos son **solo elección de la persona**: de fábrica sigue la tela lisa (DESIGN §1). El contraste AA es obligatorio (el motor corrige y avisa). La impresión y el alto contraste del sistema siempre ganan (capas CSS). No siguen al tema: el arte de los stickers, el elástico, el bastidor ni la impresión (DESIGN §3.4b).
**Consecuencias:** se actualizan DESIGN §3 y §17 (“gradientes” pasa de prohibido a “solo elegidos, nunca de fábrica”). El preset **Noche** cierra PE5. Estado: contrato; se implementa en el paso A9.

## D31 · Mi año con métricas amables (2026-10-04)
**Contexto:** la dueña pidió que *Mi año* sea “como métricas”: debajo del bastidor, “Lo que fui notando” por semana (lo pospuesto, lo cumplido), **estrellas** como victorias que hagan sentir el cuaderno como un espacio seguro que recompensa, y gráficos lindos y útiles.
**Decisión:** estrellas bordadas por lo hecho y **victorias** como referencias (`marks`, D25.2); “notando” por semana, mes o año con hechas y **movidas** (pedido explícito; en las celdas del calendario sigue sin mostrarse lo no hecho, D18); gráficos SVG propios con tabla accesible. Esto **anula explícitamente** el anti-pattern “dashboards / gráficos de barras para el ánimo” de AGENTS y DESIGN §17, con reglas: solo conteos, sin totales históricos, sin comparaciones entre períodos, sin récords. Sigue prohibido: rachas, puntajes, “perdiste”, porcentajes de mejora, causalidad.
**Consecuencias:** se actualizan AGENTS (anti-patterns) y DESIGN §17. Estado: contrato; se implementa en el paso A8.

## D32 · Dibujo con herramientas (2026-10-04)
**Contexto:** la dueña pidió balde de pintura y tipos de trazo (pluma con presión, aerógrafo, estabilizador, grafito, técnico…).
**Decisión:** un núcleo puro de pinceles (`js/core/brush.js`: suavizado, presión, relleno por inundación con tolerancia, aerógrafo con semilla). Los dibujos siguen re-editables: cada trazo guarda `tool`, `pressure[]` y `seed`, y cada relleno es un paso `{ tool: 'fill', x, y, color, tolerance }` en la misma lista ordenada. La pintura raster (acuarela, carboncillo, óleo seco, mezclador, difumino) queda experimental en el backlog.
**Consecuencias:** los dibujos viejos son “trazo técnico”. Estado: contrato; se implementa en el paso A11.

## D33 · Escenas más seguido (2026-10-04)
**Contexto:** la dueña pidió que las escenas ocasionales aparezcan “bastante más” (y, más adelante, más ricas con Motion/Three.js).
**Decisión:** se **enmienda** “escenas raras” (AGENTS, DESIGN §12–13, §17) a “frecuentes, pero nunca mientras se escribe, una a la vez, ≤ 8 s y nunca sobre el texto”. Primera aparición entre 12 y 25 s; separación entre 1 y 2,5 min en *Completas* y entre 3 y 5 min en *Suaves*. Suman las escenas que faltaban (B4).
**Consecuencias:** el modo calma (ES2), cuando exista, las apaga. Estado: contrato; se implementa en el paso A10 (frecuencia y escenas nuevas) y en la etapa C (escenas ricas).

## D34 · Migraciones: expandir y después contraer (2026-10-04)
**Contexto:** el pedido del 03/10 cambia la forma de días, actividades, páginas, rutinas, dibujos y ajustes. Reescribir todo de golpe perdía datos: borradores locales viejos (D13), copias viejas, la última escritura de una pestaña vieja y, más adelante, lo que baje de la nube.
**Decisión:** **v5 es aditiva**. Los stores nuevos se crean en `onupgradeneeded` (IndexedDB v3), los campos nuevos conviven con los viejos, y los normalizadores aceptan las dos formas. Ninguna migración toca `updatedAt`. `legacyMoodLabels` queda congelado para convertir ánimos viejos. Cada función cambia **todos sus consumidores en un mismo commit** (nunca datos adelantados a su UI). **v6** borra las formas viejas solo al final de la etapa A, dentro de `onupgradeneeded` (atómico y exclusivo entre pestañas), con una instantánea previa y “Descargar la copia de antes”. La versión de IndexedDB es la autoridad (la marca `meta.schemaVersion` es informativa). Las ocurrencias materializadas usan ids deterministas (`act_<rutina>_<fecha>`, `pag_<rutina>_<fecha>`).
**Consecuencias:** reemplaza las partes de D26.1 (sacar una actividad sigue siendo definitivo) y D26.6 (DA4 se retiró) que cambiaron. La E2E de actualización siembra una base vieja real.

## D35 · A la nube por etapas, todo con cuenta (2026-10-04)
**Contexto:** la dueña decidió migrar a Vercel + Supabase con React/Next.js, con push y PWA, y eligió (03/10): por etapas y todo con cuenta.
**Decisión:** etapa A, este cuaderno; etapa B, Next.js + Supabase con el cuaderno servido desde `public/` (IndexedDB como copia offline por persona, sincronización propia sin supabase-js en el navegador, push con VAPID); etapa C, las vistas pasan a React de a una. Reemplaza D11 y D15 y la promesa “nada sale del dispositivo” por un texto de privacidad honesto: dónde viven los datos, quién los puede ver y “Solo para mí”. D1 y D2 se retiran en C1.
**Consecuencias:** cada paso externo (proyecto Supabase, deploy, dominios) espera el ok de la dueña. Estado: decisión; se implementa en las etapas B y C.

## D36 · Personas, roles y permisos (2026-10-04)
**Contexto:** Nicole es admin; puede crear personas y darles permisos por sección, por ejemplo su psicóloga con solo lectura de algunas secciones, “tal como sería en un ERP”.
**Decisión:** usuario + PIN de 6 números. El PIN se verifica en el servidor con un hash Argon2id + pepper y nunca es la contraseña de Supabase (se usa una derivada con HMAC), con demoras progresivas en vez de bloqueo duro. Los permisos van por sección (semana, actividades, emociones, escritura, hojas, repeticiones, fotos, mi año, ajustes) y por nivel (sin acceso, ver, editar), con RLS de Postgres sobre registros **partidos por sección** según un mapa campo → sección por defecto denegado. “Solo para mí” se oculta a cualquiera que no sea la dueña o el dueño. El registro de actividad guarda eventos de seguridad, nunca contenido.
**Consecuencias:** quien solo puede ver no escribe ni guarda copia local. Quitar un permiso no borra lo ya visto (se dice con honestidad). Estado: decisión; se implementa en la etapa B.

## D37 · Base de la nube adelantada: cómo quedó armada (2026-10-04)
**Contexto:** la dueña pidió adelantar Vercel + Supabase (“Adelantar la base de la nube”) sin esperar el fin de la etapa A, y que Supabase no se pause solo. La forma de los datos todavía cambia en A6–A7.
**Decisión:** se construye ahora solo lo que **no depende de la forma de los datos**. Next.js 16 en la raíz sirve el cuaderno de siempre desde `public/` (copiado por `tools/copy-notebook.mjs`, que con Supabase le suma `<meta name="mc-cloud">`) y suma `/entrar`, `/preparar`, `/cuenta` y `/api`. El navegador nunca habla con Supabase: lo hace el servidor. PIN de 6 con Argon2id + pimienta y contraseña interna derivada por HMAC (D36). Demoras progresivas por usuario e IP. Los permisos los da la dueña o el dueño de cada cuaderno (no quien administra). Quien administra crea personas, cambia PIN y pone en pausa. `js/core/sections.js` es la única fuente del mapa campo → sección, compartida con la migración. Con cuentas, cada persona tiene su base local `mi-cuaderno@<id>` y sus preferencias `mc.ui.<id>.*`; la cookie `mc_person` (no secreta) permite abrir sin red. Web Push con textos fijos. Latido diario por Vercel Cron (`/api/keepalive`) para que el plan gratuito de Supabase no se pause. El service worker solo sirve desde la caché la navegación al cuaderno.
**Consecuencias:** la sincronización (B5) espera a A7. Mientras tanto, los permisos se pueden dar pero no hay datos compartidos (se dice en Mi cuenta). Desplegar requiere los secretos y el ok de la dueña (`docs/NUBE.md` §3). Con el plan Hobby, los avisos salen una vez por día; por hora necesitan pg_cron + pg_net o Vercel Pro.

## D38 · Cuadernos compartidos: cuentas que miran el cuaderno de otra persona (2026-10-05)
**Contexto:** Nicole ya tiene su cuenta en la nube. Pidió que las personas que ella suma (primero su psicóloga) puedan entrar a **su** cuaderno con los permisos que ella les dé, sin tener uno propio; y después, “para no perder nada”, que al sumar a alguien ella elija si esa persona tiene su propio cuaderno o solo mira el suyo.
**Decisión:** `profiles.has_notebook` (por defecto no; la primera administradora sí). Al sumar a alguien, Nicole elige entre “Mira mi cuaderno” (por defecto) y “Tiene su propio cuaderno”. Se adelanta la sincronización B5 en su forma mínima: el cuaderno de la dueña sigue en IndexedDB y `js/sync.js` sube cada cambio guardado a `notebook_parts`, partido por sección con `MC.sections.splitAll` (un pedazo por cada sección posible, para que un campo borrado no sobreviva en la nube), y trae lo que escribieron otras personas (`updated_by`), aplicándolo con `MC.sections.overlay`. La invitada abre el cuaderno compartido **en memoria** (sin copia local, D36), con la misma interfaz, sin tapa ni bienvenida y con un aviso fijo “Cuaderno de Nicole · podés editar: …”. Escribir en un store sin ninguna sección editable se corta antes de guardar (`MC_READONLY`, aviso amable). Con permiso parcial, el servidor guarda solo las partes editables y la invitada recibe el aviso; lo que no se guardó se vuelve a traer. Borrar un registro entero solo se acepta si todas sus secciones son editables. Cookie `mc_view` (no secreta): qué cuaderno abre el dispositivo; `/api/me` la corrige si cambian los permisos. Fotos y adjuntos todavía no viajan (irán a Storage privado); de `meta` solo viajan los ajustes.
**Consecuencias:** el contenido del cuaderno de quien tiene cuenta en la nube se guarda en Supabase (D35 ya lo había aprobado; la RLS decide quién ve qué). Conflictos: gana la última escritura por sección. Quedan para después: elegir entre varios cuadernos compartidos desde el propio cuaderno (hoy, desde Mi cuenta), fotos y adjuntos, y la vista de “sin conexión” para la invitada.

