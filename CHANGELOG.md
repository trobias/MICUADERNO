# MI CUADERNO — Cambios

Qué cambió en cada entrega, para quien usa el cuaderno y para quien lo mantiene. El porqué de cada decisión está en `DECISIONS.md` (Dn); lo que falta, en `ROADMAP.md`. Cada entrega que toca archivos de la app sube `CACHE_VERSION` en `sw.js` para que las PWA instaladas se actualicen.

## 2026-10-01 · La visión, documentada (sin cambios en la app)

**Para quien mantiene el cuaderno**
- `VISION.md`: la visión de memoria, scrapbook, privacidad y experiencia personal (80 ideas, con su numeración original), agrupada por la infraestructura que comparten y con lo que ya existe en el código en cada grupo. Es referencia, no implementación literal.
- `ROADMAP.md` reescrito por **fases** (1 cimientos · 2 motor de elementos · 3 memorias · 4 buscar y ordenar · 5 escribir tranquila · 6 media · 7 revisiones · 8 cartas y cosas sueltas · 9 hacerlo propio · 10 privacidad local y notificaciones).
- `BACKLOG.md` nuevo: cada idea con estado NOW/NEXT/LATER/NEEDS DESIGN/NEEDS RESEARCH/EXPERIMENTAL/BLOCKED, dependencias y lo que hay hoy. El backlog viejo (B*, I*, T*) se mudó acá.
- Decisión **D25**: arquitectura común (un motor de elementos que nace de los stickers, memorias por referencia, privacidad en la fuente, papelera como borrado suave, deshacer por superficie, modo calma aparte del motion, canciones sin fetch a terceros por defecto, bloqueo honesto, `.micuaderno` como ZIP).
- `AGENTS.md`: qué leer y qué revisar antes de tomar algo de la visión.

## 2026-10-01 · Dibujar, Mis stickers y adjuntos (cache `v9`)

**Para quien lo usa**
- **Dibujar**: en cualquier hoja (Decorar → Dibujar, o en el sobre de stickers → Dibujar uno) y con la plantilla nueva **Para dibujar**. Lápiz, goma, texto con las letras del cuaderno, los colores de los hilos, tres grosores y deshacer. El dibujo se pega como sticker y lo podés **editar después**.
- **Subí tus imágenes** (PNG, JPG, WebP, GIF, SVG…) y usalas como stickers en todos lados: quedan en **Mis stickers**, al principio del sobre. Las podés sacar cuando quieras.
- **Adjuntos**: guardá cualquier archivo en un día o una página (la entrada del recital, el PDF de un turno, una foto, un audio). Se abren con un toque; una foto adjunta se puede pegar como sticker.
- Todo va en la copia de seguridad.

**Para quien lo mantiene** (decisión **D24**)
- `js/ui/draw.js` (`MC.draw.open`), `js/ui/images.js` (`importImage`, `uploadStickers`, `attachments`); scrapbook con `img:<id>`, `draw()` y `addImage()`; `c.dialog` acepta `className`.
- Modelo: `images` (con caché en memoria para dibujar sin esperar) y `files`; `schemaVersion` 3, IDB v2. Las imágenes se rasterizan siempre (nada de SVG guardado).
- Tests: 50 unit y 21 E2E (dibujar, editar, subir SVG, sacar de la colección, adjuntar/descargar/sacar, plantilla Para dibujar).

## 2026-10-01 · El mes muestra todo, todo se anima (cache `v8`)

**Para quien lo usa**
- En el mes (pantallas anchas) cada día muestra **qué hay**, en hilitos del color de su marcador: lo de la Agenda en rosa, las rutinas en salvia, las páginas en lavanda. De hoy en adelante lo que falta; para atrás, lo que hiciste.
- **Animaciones**: cambiar de mes desliza la hoja hacia ese lado; pasar de mes a semana la acomoda; pasar de un marcador a otro sube la hoja; tocar un día la hunde apenas.
- Todas las personas empiezan con animaciones **Completas** (si antes nunca habías elegido, ahora también). Se puede bajar en Ajustes → Cómo se mueve; si ya habías elegido “Ninguna”, queda así.

**Para quien lo mantiene** (decisión **D23**)
- `summarize` suma `items` por día; `calendar.js` dibuja `.day-cell__lines`.
- `app.js`: `renderBase` arma el calendario nuevo aparte y lo muestra con `animateBase`; `shownBase` = lo que está en pantalla.
- Settings: `motion: 'completas'` + `motionChosen`.
- Tests: 47 unit y 20 E2E (el de motion ahora verifica “Completas” para todas las personas y que bajarlo en Ajustes queda guardado).

## 2026-10-01 · Vuelven los marcadores; la Agenda (cache `v7`)

**Para quien lo usa**
- Los botoncitos vuelven a ser **marcadores de tela** al costado del cuaderno, como antes (en el celular, abajo, con el carretel de Ajustes al final). Cada uno abre su **cuadro** encima del calendario; con un cuadro abierto, los marcadores quedan a su costado y se pasa de uno a otro sin cerrar. El cuadro se despliega desde el lado de los marcadores.
- Nuevo marcador **Agenda**: anotás algo para cualquier día (con atajos Hoy · Mañana · En una semana) y aparece en el calendario. Abajo, **Lo que viene**, día por día, con todo para editar: marcar, renombrar, **pasar a otro día**, sacar (con deshacer). Desde ahí también podés crear una rutina o una página para ese día.
- **“Pasar a otro día…”** también en la página de cada día.
- Las **páginas tienen su día**: lo elegís al crearla y lo cambiás cuando quieras (“Cambiar el día”). Desde un día: “Empezar una página para este día”.

**Para quien lo mantiene** (decisión **D22**)
- `js/ui/activity.js` (`MC.activityRow`, `MC.c.askDate`) reemplaza la fila de `today.js`; `js/views/agenda.js`; ruta `#/agenda`.
- `MC.model.moveActivity`, `MC.model.upcoming`; `page.date` con `schemaVersion` 2 y migración (DATA_MODEL).
- `app.js`: `TABS`, `buildTabs`, `placeTabs`; los marcadores se mudan al `<dialog>` abierto.
- Tests: 46 unit y 20 E2E (recorrido nuevo de la Agenda; los marcadores se recorren con el cuadro abierto).

## 2026-10-01 · El calendario se actualiza solo (cache `v6`)

**Para quien lo usa**
- Mientras tenés un cuadro abierto, el calendario de atrás ya muestra lo que vas registrando (el ánimo, lo hecho, lo planeado…), sin parpadear y sin tocar lo que estás escribiendo.
- Si tenés el cuaderno abierto en otra pestaña y cambiás algo, esta pestaña se entera sola.
- Al cerrar un cuadro, la cinta y el foco quedan en el último día que abriste (si pasaste de día con las flechas, en ese). Si lo abriste con un botoncito, el foco vuelve a ese botoncito.

**Para quien lo mantiene** (decisión **D21**)
- `app.js`: `markBaseDirty` (escucha `store:changed` y `store:remote`) + `refreshBase` (dibuja aparte, cambia entero cuando `ready`) + `focusMarkedDay`. `renderBase` ya no tiene `force` y devuelve si dibujó uno nuevo.
- Las vistas del calendario devuelven `{ destroy, ready }`.
- Tests: 19 E2E. El recorrido nuevo cubre el fondo actualizado con el cuadro abierto, escribir sin perder letras ni foco, la cinta y el foco al volver, y el cambio desde otra pestaña.

## 2026-10-01 · Las secciones se conectan (cache `v5`)

**Para quien lo usa**
- Desde un día, “Ver la rutina” abre **esa** rutina, resaltada.
- Cada rutina tiene un ícono de calendario: muestra el mes con **sus días marcados** (los que tocan de hoy en adelante y los que ya hiciste). Al cambiar de mes se mantiene; “Dejar de mostrar” la apaga.
- En Rutinas, “próxima: viernes 2 de octubre” lleva a ese día.
- En una página libre, “Empezada el …” lleva a ese día.
- En la página del día, “viene del 30 sep” lleva al día de donde pasaste esa actividad.
- En el calendario, el año de la tira (“2026”) abre *Mi año*. El botoncito *Mi año* abre el año que estás mirando.
- En *Mi año*, la inicial de cada mes lleva a ese mes. Cada observación de *Lo que fui notando* lleva a sus días: “Ir a ese día”, “Ver los días” o “Ver en el calendario”.
- La leyenda del bastidor dice “algo anotado, sin ánimo” (antes decía “escribiste”, aunque el día solo tuviera actividades).

**Para quien lo mantiene** (decisión **D20**, tabla en SPEC §5.1)
- Rutas nuevas: `MC.routes.routine(id)` → `#/rutinas/:id` y `MC.routes.month(m, { routine })` → `#/calendario/mes/AAAA-MM/rutina/:id`.
- `summarize` suma `byRoutine` (estado de cada rutina por día). `MC.insights.compute` devuelve `day`, `days` o `routineId` + `month` en cada observación.
- `app.js`: la clave del calendario de fondo incluye la rutina; `followYear` actualiza el enlace de *Mi año*.
- Tests: 43 unit y 18 E2E (recorrido nuevo que pasa por cada conexión).

## 2026-10-01 · Un solo lugar para rutas, cuentas y dibujos (cache `v4`)

**Para quien lo usa**
- Casi nada cambia a la vista: es el orden de la casa antes de conectar las secciones entre sí.
- La impresión cuenta lo hecho “un poquito” igual que el calendario (antes solo contaba lo hecho del todo).
- En la semana, las puntadas de cada actividad son exactamente las mismas que en la casilla del día.

**Para quien lo mantiene** (decisión **D19**)
- Nuevo `js/core/routes.js`: `MC.routes.day(fecha)`, `month`, `week`, `page(id)`, `year`, `settings`… y `MC.routes.parse(hash, { calMonth })`. `app.js` y todas las vistas lo usan; ya no hay `'#/…'` escritos a mano (salvo en `sw.js`, cubierto por test). Una ruta con `%XX` roto ya no rompe el router.
- `MC.model.summarize` es la única cuenta por día (mes, semana, *Mi año*, impresión), con filtro `from`/`to`. *Mi año* la calcula sobre lo ya cargado: una lectura de la base en vez de dos.
- Reglas compartidas: `countsAsDone`, `hasWriting` (también la usan los insights), `moodLabel`, `pageTitle`, `pageDate` y `MC.dates.fromISO`.
- Un solo dibujo de puntadas: `MC.stickers.STITCH`, `stitchMarkup` y `statusMarkup` (`.st-mark`, colores por CSS con tokens; la impresión los pasa a tinta). Glifo de ánimo en tinta para imprimir: `inkGlyphMarkup`.
- Piezas en `MC.c`: `moodMark`, `statusMark`, `pageLink`, `pageLinks`.
- Tests: 40 unit (rutas, `fromISO`, resumen con rango, lecturas compartidas, nombre de ejemplo) y 17 E2E.
- Nombre de ejemplo en tests, docs y capturas: siempre **Nicole** (`tests/unit/names.test.js` lo vigila).

## 2026-10-01 · El calendario reúne todo (cache `v3`)

**Para quien lo usa**
- Las **rutinas** aparecen en el mes desde que las creás, en todos los días que les tocan, sin tener que marcarlas antes.
- Hoy y los días que vienen muestran una **cajita □ con lo planeado** (rutinas + cosas anotadas para ese día).
- Los días pasados muestran solo **lo hecho (×n)**. Lo que quedó sin marcar no se cuenta: el calendario no es una lista de deudas.
- Las **páginas libres** aparecen con una hojita en el día en que se empezaron. Al abrir ese día, hay una sección *Páginas de este día* con un enlace a cada una. La vista *Semana* también las muestra.
- La leyenda del mes explica todas las marcas: hecho, planeado (con rutinas) y página empezada.
- *Mi año* no cambia: solo borda lo registrado. Una rutina sin marcar no deja medio punto.

**Para quien lo mantiene**
- `MC.model.summarize(days, activities, extra)` acepta `{ from, to, routines, pages }`. Suma ocurrencias virtuales de rutina (`pending`, `planned`, `routines`) y `pages` por fecha local de `createdAt`. Sin `extra` conserva la forma anterior.
- `summaryRange` carga rutinas y páginas. Es nuevo `MC.model.pagesOn(fecha)`.
- No hay cambio de datos guardados: todo es derivado (ver `DATA_MODEL.md` › Resumen del calendario).
- Decisión **D18**; regla nueva en `AGENTS.md` › Trampas: todo lo fechado se ve en el calendario.
- Tests: 31 unit (2 nuevos sobre el resumen) y 17 E2E. El recorrido nuevo cubre rutina planeada en el día siguiente, marca de página en hoy, enlace desde el día, semana y año sin falsos medios puntos.
- Archivos: `js/core/model.js`, `js/views/calendar.js`, `js/views/today.js`, `js/views/year.js`, `css/views.css`, `sw.js`.

## 2026-10-01 · Una sola pantalla con el calendario al centro (cache `v2`)

**Para quien lo usa**
- Se acabaron las secciones separadas. El **calendario del mes es la pantalla principal**, con una **tira de los 12 meses** (y flechas de año) para cambiar de mes con un toque.
- **Cinco botoncitos** arriba: *Hoy · Rutinas · Páginas · Mi año · Ajustes*. Cada uno abre un **cuadro desplegable** encima del calendario.
- **Tocar un día** abre su página en el cuadro. Para volver al calendario: *Volver al calendario*, `Esc`, tocar afuera o *atrás* del navegador. Al volver, el calendario se actualiza.
- La página del día ofrece *Ir a hoy* cuando mirás otro día. El selector de fecha se fue: para saltar lejos está el calendario.

**Para quien lo mantiene**
- `js/app.js` reescrito: el calendario se renderiza como base y las demás vistas van en `<dialog id="panel">` / `#panel-body`. Las rutas por hash se conservan.
- Menús y avisos se cuelgan de `MC.c.layer()` (el diálogo abierto) para no quedar inertes.
- Se eliminaron las pestañas laterales, la barra inferior y la barra superior del celular.
- Decisión **D17**. Los E2E pasaron a 16 recorridos, incluido el de pantalla única. Los selectores de confirmación son `dialog.sheet`.

## 2026-09-30 · Auditoría de UI y roadmap

- Se aplicaron las skills `ui-ux-pro-max`, `frontend-ui-engineering` e `impeccable` (D16):
  - celdas del año de 22 px;
  - foco en tinta;
  - `scroll-padding`;
  - umbral de arrastre en stickers;
  - errores del formulario de rutina junto al campo;
  - restaurar el scroll al volver;
  - avisos de 3,5 s;
  - `touch-action: manipulation`.
- Nuevos E2E: 320 px, celular apaisado, tamaño de celdas, error junto al campo.
- `ROADMAP.md` con verificación pendiente, backlog y deuda técnica.

## 2026-09-30 · Primera versión (v1.0)

- **Documentos:** `SPEC.md`, `DESIGN.md`, `DATA_MODEL.md`, `AGENTS.md`, `DECISIONS.md` (D1–D15), `PRODUCT.md`.
- **Núcleo:**
  - fechas locales, recurrencias (diaria, días de semana, cada N días, día del mes, n-ésimo día, una vez);
  - IndexedDB con modo memoria de emergencia;
  - modelo de dominio, backup JSON con validación y migraciones;
  - TXT/CSV/XLSX propio (ZIP + CRC32);
  - “Lo que fui notando”.
- **App:**
  - tapa con tela elegible y onboarding;
  - página del día: ánimo al empezar y terminar, intención, actividades con 5 estados de punto cruz, notas, energía y sueño, cierre con reflexiones, stickers;
  - calendario mes/semana, rutinas, páginas libres con plantillas y scrapbook;
  - *Mi año* bordado, ajustes, impresión A4/A5/Carta;
  - 5 escenas ocasionales y 4 niveles de motion.
- **PWA:**
  - íconos (parche bordado, D14) y manifest solo por http(s) (D15);
  - service worker cache-first;
  - recordatorios locales opt-in (D11);
  - atajos *Hoy, Escribir una nota, Registrar ánimo, Calendario*.
- **Robustez:**
  - fuentes embebidas para `file://` (D12);
  - borrador local además de IndexedDB para no perder lo escrito al recargar (D13).
