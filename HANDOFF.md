# MI CUADERNO — Traspaso para el próximo agente

Para retomar el desarrollo **sin haber estado en las conversaciones anteriores**. Leelo después de `AGENTS.md` y antes de tocar código. Estado al 04/10/2026. El plan ejecutable completo está en [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md); no hace falta tener acceso al plan externo ni a la conversación.

**En una línea:** el cuaderno local está en la etapa **A** de la migración aprobada. A0–A4 están terminados y probados en Chromium; A4 reemplazó la escala de cinco ánimos por emociones escritas. Lo próximo es **A5: Mis hojas y menos marcadores**; después la semana planner. La nube y React vienen en B y C, respectivamente. `ROADMAP.md` y `MIGRATION_PLAN.md` dan el orden; `BACKLOG.md` conserva el resto de ideas.

## 1. Cómo trabaja la dueña del proyecto

- Escribe en **español rioplatense**, corto y a veces con errores de tipeo; respondele igual, en criollo, claro y sin jerga técnica innecesaria. La app es para cualquier persona: textos **neutros en género**.
- Piensa en **experiencia**, no en features: lo que más pidió es que todo esté **conectado** y gire alrededor del **calendario**, que se vea **lindo** y se sienta un cuaderno real.
- Manda ideas grandes de a ráfagas, a veces mientras trabajás. Anotalas (en `BACKLOG.md` si no entran ya) y terminá lo que estás haciendo antes de cambiar de tema.
- Valora mucho la **documentación**: pidió más de una vez “documentá todo”. Cada entrega actualiza `CHANGELOG.md` y los docs que toque.
- **Git** (actualizado el 02/10/2026, a pedido suyo: “commit en cada cambio que se pueda considerar un cambio y pusheá”): **un commit por cada cambio con sentido propio** (un arreglo, una función, un ajuste de docs), con `npm run check` en verde, y **push a `main`**. Mensajes claros (los últimos van en español) con las líneas de atribución que pida el entorno. Nada de PRs salvo que los pida. Lo destructivo (force-push, reescribir historia, borrar ramas o worktrees) sigue necesitando su “sí” explícito.
- No quiere que se gasten tokens de más: ir al grano, terminar lo pedido y reportar corto.
- **Nombre de ejemplo: siempre “Nicole”**, en tests, docs y capturas. Fue un pedido tajante (“que ningún lado diga otro nombre, ni de ejemplo ni de broma”); lo vigila `tests/unit/names.test.js`.
- Le gustan las respuestas que dicen qué cambió **para quien usa el cuaderno**, con capturas mentales concretas, y qué quedó pendiente.

## 2. Historia: qué pidió y cómo quedó (en orden)

| # | Pedido | Resultado | Dónde |
|---|---|---|---|
| 1 | Brief inicial: diario íntimo offline (ánimo, actividades amables, rutinas, calendario, año, páginas, stickers, exportar, imprimir, PWA, motion calmo), sin backend, doble clic en `index.html`. | MVP v1.0 | SPEC, DECISIONS D1–D15 |
| 2 | Esperar sus skills (`skills/`) y leer ui-ux-pro-max y las de front anti “AI slop”. | Auditoría aplicada | D16 |
| 3 | “Es muy complejo el inicio”: nada de secciones; una sola pantalla con el **calendario al centro**, meses a mano y botoncitos que abren cuadros. | Pantalla única | D17 |
| 4 | “¿Están todas las secciones en el calendario? Todo debería aparecer ahí.” | Rutinas planeadas y páginas en el mes | D18 |
| 5 | “¿Cómo conectarías todo? ¿Reutilizarías lógica?” | 3 entregas: un solo lugar para rutas/cuentas/dibujos, enlaces entre secciones, calendario en vivo | D19–D21 |
| 6 | Sacar un nombre de ejemplo y usar **Nicole** en todos lados. | Hecho + test guardián | AGENTS, `names.test.js` |
| 7 | Que los botones **vuelvan a ser marcadores como antes** (mandó capturas: pestañas al costado; abajo en el celular), que solo abran cuadros, que giren en torno a **poner cosas en el calendario** y tengan su alta/edición/baja. | Marcadores + Agenda + páginas con día | D22 |
| 8 | Hoy, Rutinas y Páginas **visibles en el mes**; **animaciones en todo** (también mes ↔ semana); **“Completas” por defecto para cualquier persona**. | Hilitos en las celdas, transiciones, motion por defecto | D23 |
| 9 | **Dibujar** donde convenga (colores, trazos, letras, “sin ser Illustrator”); **subir imágenes** de cualquier formato como stickers en todos lados; **adjuntar archivos** en general. | Dibujo, Mis stickers, adjuntos | D24 |
| 10 | Una **visión de 80 puntos** (memoria, scrapbook, privacidad, experiencia personal) para guardar como referencia, con roadmap y backlog. | Documentada, sin implementar | `VISION.md`, `ROADMAP.md`, `BACKLOG.md`, D25 |
| 11 | “¿Está todo documentado para que cualquier agente siga?” | Este archivo + docs al día | — |
| 12 | Cerrar la Fase 1 con **varios agentes en paralelo** (Orca: Antigravity `agy`, Claude y Codex, alternando y revisándose entre sí). | **Fase 1 hecha**: papelera (DA1), deshacer/rehacer (DA2), “guardando… → guardado ✓” (DA3), cuánto ocupa (DA4), privacidad por día/página + esquema v4 (PV1), marcadores con teclado móvil (T6). Cada entrega tuvo revisión cruzada y E2E. | D26, `CHANGELOG.md` 2026-10-02 |
| 13 | “Terminá ya, commit por cambio y pusheá.” | Integrado y pusheado a `main`; nueva regla de git (§1). | — |
| 14 | “Está bugueado volver al calendario desde algunos lugares.” | La ✕ vuelve siempre al calendario: el router guarda la posición de cada paso en `history.state`. | `CHANGELOG.md` 2026-10-03, `js/app.js` |
| 15 | “¿Qué fases faltan?” y “documentá todo para cualquier agente sin contexto”. | Este traspaso, `ROADMAP.md` y `BACKLOG.md` al día. | — |
| 16 | Semana planner, emociones libres, colores, fuera Agenda/Rutinas, hojas y plantillas, Mi año con estrellas/gráficos, escenas, dibujo, y nube con PIN/roles. | Migración A → B → C aprobada. Ver estado exacto en §3 y pasos en `MIGRATION_PLAN.md`. | D27–D36 |
| 17 | “Una vez que termines un cambio estable, documentá todos los cambios y commits, lo que falta, el plan y cómo retomarlo sin memoria”. | Este traspaso, `MIGRATION_PLAN.md`, `ROADMAP.md`, `BACKLOG.md` y docs de producto sincronizados. | Commit A4 |

## 3. Estado actual

- **Commits de la etapa A:** A0 `34e9b6e`, A1 `cc7697d`, A2 `4f124d7`, A3 `a39dad2`; para A4, consultá `git log -5 --oneline`. A0 protege IndexedDB de pestañas viejas/versiones nuevas; A1 repara navegación/escenas/menús y cubre el índice de Páginas; A2 quita sombras y el desglose de almacenamiento, centraliza colores; A3 crea el contrato v5 aditivo (sin adelantar UI). A4 agrega emociones escritas al día y actividades, calendarios, Año, ajustes de color, observaciones, exportación, impresión y notificaciones. Ver `CHANGELOG.md` para efectos visibles y pruebas.
- `schemaVersion` **5**, IndexedDB **3**. `CACHE_VERSION` es `mi-cuaderno-v26` (v25 arreglo de Páginas, v26 `js/cloud.js` + push en el SW). Las formas viejas (`mood`, `moodLabels`, `kind/body/items`) siguen legibles hasta A13/v6: no borrarlas en A5–A12.
- `npm run check` pasó en A4: sintaxis de 34 archivos, 94 pruebas unitarias y 43/43 recorridos Chromium E2E sobre `file://` y HTTP. Para E2E se usa `playwright-core` local y `CHROMIUM` apunta a un ejecutable Chromium. Una corrida anterior tuvo una falla intermitente en el caso A0 de cambio de versión entre pestañas; el caso aislado y la corrida completa posterior pasaron. No se atribuye esa falla a A4 ni se declara resuelta su intermitencia.
- **Nunca se probó en dispositivos reales** ni se publicó: ver `ROADMAP.md` → Verificación pendiente (V1–V7).
- Fase 1 y T6 ya están integrados: no rehacerlos. DA4 (“Cuánto ocupa”) se retiró en A2. Los viejos ítems de V1–V7 siguen como **verificación pendiente**, pero GitHub Pages ya no es el objetivo de despliegue: B apunta a Vercel.
- **Qué queda en orden:** A5 Mis hojas y cuatro marcadores; A6 semana planner inicial y editable; A7 hojas/plantillas/Guardar y repetición; A8 Mi año y métricas; A9 tema propio; A10 escenas; A11 dibujo; A12 QA cruzada; A13 contrato v6. Después B cuenta/nube/roles/PWA/push y C vistas React/escenas 2.0. Cada paso, archivos, invariantes y pruebas: `MIGRATION_PLAN.md`.
- **Base de la nube (adelantada, D37):** Next.js 16 en la raíz + Supabase. Hay cuentas con usuario y PIN de 6, `/preparar` para la primera administradora, `/cuenta` (PIN, avisos, personas, permisos por sección), RLS probada en Postgres 16 (`npm run test:cloud`), Web Push y latido diario anti-pausa (`vercel.json`). El cuaderno con cuentas usa una base por persona (`js/cloud.js`). **05/10:** el esquema y la RLS se aplicaron en Supabase con el conector de claude.ai y se verificaron con SQL (docs/NUBE.md §4.2; el historial de migraciones queda vacío porque se usó `execute_sql`). Vercel ya tiene las variables verificadas por nombre y un `SETUP_TOKEN` nuevo que tiene la dueña (§4.4). Falta **solo `SUPABASE_SECRET_KEY`**, que hay que copiar a mano del panel de Supabase (el proyecto está en otra cuenta de Vercel y el conector no entrega claves secretas). Después: un deploy nuevo y probar `/preparar`. **No está verificado que entrar, los permisos ni los avisos funcionen en la nube.** Desde claude.ai/code, `.mcp.json` no conecta (403 de red); usar los conectores de la cuenta.
- **Lo que NO está implementado todavía:** sincronización con la nube (B5), React (C), push probado en dispositivos, semana planner por defecto, Mis hojas, plantilla aplicada al día, tema completo, gráficos/victorias y nuevos pinceles. Los campos v5 para esas funciones existen; no interpretarlos como función terminada.
- **Ramas y worktrees viejos**: quedaron ramas `trobias/*` locales y worktrees de Orca de la Fase 1, ya integrados en `main`. No borrarlos sin su ok.

## 4. Preguntas abiertas (esperan a la dueña; no decidir solo)

1. **Motion y “reducir movimiento” del sistema**: hoy todas las personas empiezan en “Completas” aunque el sistema pida menos (D23, pedido explícito); Ajustes lo sugiere bajar. Se le ofreció hacer que en ese caso empiece en “Reducidas”: no respondió.
2. **Canciones** (VISION §10, BACKLOG MD4): traer título/portada de Spotify/YouTube choca con “nada sale del dispositivo”. Propuesta: guardar solo lo escrito + proveedor reconocido por la URL; traer metadatos solo con un toque explícito. Falta su ok.
3. **Bloqueo con PIN** (BACKLOG PV3): ¿pantalla de privacidad o cifrado real? Ser honestos en la UI.
4. **Historial de git**: versiones viejas de los tests en el historial todavía tienen el nombre de ejemplo anterior. Reescribir historia exige force-push a `main`; se le ofreció y no respondió. No hacerlo sin un “sí” explícito.
5. Nombre de la vista “Volver a mí” (VISION §3): elegir con ella.
6. **Sacar una actividad** sigue siendo definitivo (con “Deshacer” en el aviso), no va a la papelera: lo decidió la Fase 1 para no romper ese flujo (D26). Si ella quiere actividades en la papelera, es un cambio chico en `js/ui/activity.js` + `MC.model`.
7. **Nube:** la dueña ya creó el proyecto Supabase `lrwfkbuhmgtckjmswrzp` y conectó Vercel (`trobias-projects/micuaderno`). Hay una Preview `Ready` y todas las variables requeridas menos `SUPABASE_SECRET_KEY` en Production/Preview; falta aplicar y verificar la migración y probar la app contra Supabase (`docs/NUBE.md` §3–§4.1). El `SETUP_TOKEN` guardado como Secret no es recuperable: la dueña debe reemplazarlo por uno que conserve antes de crear a Nicole en `/preparar`. La dueña habilitó los MCP en Claude web: usar Supabase MCP allí para la migración; token y contraseña de CLI son solo respaldo. Siguen pendientes un entorno preview de datos aislado y la política de restaurar/borrar con sincronización (B5). No publicar Production sin su ok.
8. **Páginas:** el índice que a veces no respondía tras borrar se **reprodujo y arregló en Chromium** (cache `v25`): `MC.motion.swap` animaba `#panel-body` mientras se reemplazaba su contenido y Chromium dejaba el hit-test del contenedor viejo; ahora se anima la hoja nueva (antes 1/6 corridas fallaban, después 0/9). Falta confirmarlo en el navegador o celular de la dueña y en otros motores. Detalle en [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md).

## 5. Cómo retomar (paso a paso)

1. `AGENTS.md` → este archivo → `MIGRATION_PLAN.md` → `SPEC.md` → `DESIGN.md` → `DATA_MODEL.md` → `DECISIONS.md` (D27–D37 para el pedido actual; D37 + `docs/NUBE.md` para la nube) → `ROADMAP.md` / `BACKLOG.md` → `VISION.md` si tocás algo de la visión. El plan externo era un borrador de 03/10 y contiene cifras de tests y versiones ya superadas; este archivo y el código mandan.
2. `npm test` (no necesita nada) y `npm install && npm run e2e` (usa el Chromium del sistema en `/opt/pw-browsers/chromium`, o `CHROMIUM=/ruta`). En Windows funciona igual: apuntá `CHROMIUM` al `chrome.exe` de un Chromium de Playwright (`%LOCALAPPDATA%\ms-playwright\chromium-<build>\chrome-win\chrome.exe`) o a otro Chromium instalado. Si corrés varias suites a la vez (varios worktrees), usá un `E2E_PORT` distinto en cada una.
3. Seguí el próximo paso A del `MIGRATION_PLAN.md`, leé la decisión que lo cubre y buscá la primitiva existente (AGENTS → “Antes de tomar algo de la visión”). No saltes a B/C ni al antiguo roadmap de Fases 2–10 por un encabezado viejo.
4. Implementá con su test (unit en `tests/unit/`, recorrido en `tests/e2e/run.mjs`), estilos solo con tokens, y **revisá a ojo en 1366px y 375px** (ver §6).
5. Docs: SPEC/DESIGN/DATA_MODEL según corresponda, decisión nueva en `DECISIONS.md` si no es obvia, `CHANGELOG.md` (para quien lo usa + para quien lo mantiene), sacar el ítem de `BACKLOG.md`, `ROADMAP.md` si cerró una fase. Si tocaste algún archivo del shell, subí `CACHE_VERSION` en `sw.js`.
6. `npm run check` en verde → commit (uno por cambio) → push a `main` (§1).

## 6. Trucos que se usaron para QA visual

- Capturas con Playwright desde un script temporal (fuera del repo): abrir `file:///…/index.html`, tocar `.cover__board`, esperar que la tapa se vaya, completar el onboarding con **Nicole**, sembrar datos con `MC.model.*` desde `page.evaluate`, navegar con `location.hash = MC.routes.*`, y `page.screenshot()` en 1366×900 y 375×812. `tools/shot.mjs` sirve para capturas simples sin datos.
- Antes de llenar el onboarding, esperá a que la tapa desaparezca: si no, el onboarding se vuelve a dibujar y se pierde lo tipeado (parece un bug y no lo es).
- En los E2E, preferí `waitForFunction` a esperas fijas: el calendario de fondo se redibuja ~600 ms después de cada cambio (D21) y el mes nuevo entra con animación (D23).
- `c.section(title, …, { id })` pone el `id` en el **título** (h2), no en la sección: para buscar adentro usá la clase.

## 7. Mapa rápido del código vivo

- Arranque y navegación: `js/app.js` (calendario de fondo + `<dialog id="panel">` + marcadores `TABS`; `renderBase` arma aparte y anima; `refreshBase` en vivo; `placeTabs` muda los marcadores; `track`/`requestClose`: cada paso del historial lleva su posición en `history.state.mcAt` y cerrar vuelve con `history.go` hasta el último calendario; los reemplazos van por `replaceHash`).
- Fase 1: `js/core/history.js` (`MC.history`: una pila por superficie, atajos solo fuera de campos de texto) · papelera y privacidad en `js/core/model.js` (`deletedAt`, `privacy`, `restoreTrash`, purga al arrancar) · `c.savedNote` en `js/ui/components.js` (guardando/guardado/aviso de fallo) · Papelera en `js/views/settings.js` (“Cuánto ocupa” se retiró en A2) · migraciones hasta v5 en `js/core/backup.js`.
- Rutas: `js/core/routes.js` (`MC.routes.*`; nunca `'#/…'` a mano).
- Datos: `js/core/store.js` (stores: meta, days, activities, routines, pages, images, files, weeks, templates, marks) · `js/core/model.js` (dominio; `summarize` = cuenta común por día, `feelingsOf` = lectura dual) · `js/core/backup.js` (copia, validación, migraciones).
- Vistas: `js/views/{calendar,today,agenda,routines,pages,year,settings,print,cover,onboarding}.js`.
- Piezas compartidas: `js/ui/components.js` (`MC.c.*`: diálogos, menú, avisos, `askDate`, `feelingEditor`, `feelingMark`, `statusMark`, `pageLink(s)`) · `js/ui/activity.js` (fila de actividad y emociones antes/después) · `js/ui/scrapbook.js` (stickers + Mis stickers) · `js/ui/draw.js` (dibujo) · `js/ui/images.js` (subir imágenes, adjuntos) · `js/ui/motion.js` · `js/ui/scenes.js`.

## 8. Trabajo con varios agentes (cómo se cerró la Fase 1)

Sirve si te piden repetirlo; si trabajás solo, ignoralo.

- **Orquestación con Orca**: un Run por objetivo, una tarea por ítem del backlog, cada una con su **worktree propio** creado desde una rama de integración. Las especificaciones de cada tarea seguían la forma Target / Cambio / Restricciones / Dueño de qué archivos / Aceptación observable.
- **Integración**: cada rama se revisa y se fusiona en una rama de integración; con `npm run check` en verde, `main` avanza en fast-forward y se pushea. Los choques típicos son siempre los mismos: `CACHE_VERSION` en `sw.js` (quedarse con una versión mayor que todas), `CHANGELOG.md` (juntar las entradas) y `BACKLOG.md`.
- **Revisión cruzada**: lo que implementa un agente lo revisa otro distinto (Claude ↔ Codex). Las revisiones encontraron defectos reales (foco perdido en la barra de stickers, adjuntos huérfanos, purga que impedía abrir el cuaderno, etc.).
- **E2E en paralelo**: cada worker con su `E2E_PORT`; si no, las corridas se pisan en el puerto 4199.
- **Antigravity (`agy`)**: al abrir un worktree nuevo pide confiar en la carpeta; en modo `accept-edits` igual pide permiso para cada comando; y se le puede acabar la cuota (error 429 “RESOURCE_EXHAUSTED”). Cuando pasó, las tareas siguieron con Claude y Codex.
- **Codex en Orca**: a veces el prompt queda pegado sin enviar (“turn start could not be verified”): mirar la terminal y mandar Enter. Si ofrece actualizarse, elegir “Skip” (no instalar nada global sin permiso).
