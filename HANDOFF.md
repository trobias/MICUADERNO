# MI CUADERNO — Traspaso para el próximo agente

Para retomar el desarrollo **sin haber estado en las conversaciones anteriores**. Leelo después de `AGENTS.md` y antes de tocar código. Estado al 05/10/2026. El plan ejecutable completo está en [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md); no hace falta tener acceso al plan externo ni a la conversación.

**En una línea:** la etapa **A** de la migración está **completa** (A0–A13, cache `v36`, esquema v6) y la base de la nube está **publicada** (`https://micuaderno-five.vercel.app`; Nicole tiene su cuenta) con cuadernos compartidos por sección (D38). Lo que falta de la nube y la recomendación sobre React están en [`docs/EVALUACION_BC.md`](docs/EVALUACION_BC.md); la QA, en [`docs/QA.md`](docs/QA.md). `BACKLOG.md` conserva el resto de ideas.

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
| 18 | Adelantar la nube; que Supabase no se pause solo; configurar Vercel y Supabase por MCP (autorizó variables, migración y push a `main`). | Cuentas con PIN, Nicole admin, permisos, push, latido; publicado. | D37, `docs/NUBE.md` |
| 19 | Que las personas que suma Nicole (su psicóloga) entren a **su** cuaderno con permisos, y que ella elija si cada una tiene cuaderno propio o mira el suyo. | Cuadernos compartidos y sincronización por sección. | D38 |
| 20 | “Seguí con A5…A13 y los docs finales.” | Etapa A completa, un commit por paso, todo pusheado a la rama y a `main` (Production se despliega sola). | `CHANGELOG.md` 05/10, D39 |
| 21 | Respuestas: nunca pruebas con la psicóloga/celular ni segundo Supabase; fotos en la nube como lo próximo; documentar qué hay en C. | NB1 en NOW; secciones NB y C en el backlog. | D40, `BACKLOG.md` |
| 22 | Entrar como en Mamayucca: elegir el usuario de una lista, PIN, instalar app y activar avisos. | Hecho. | D41 |
| 23 | “No me gusta ninguna de la etapa C, nunca pasemos a React; sigamos con los NB.” | Etapa C descartada; se sigue con NB. | D42 |
| 24 | NB1: fotos en la nube. | Hecho: pedazos por el servidor a Storage privado; NB3 cerrado. | D43 |
| 25 | NB2: cola firme. | Hecho: cola en IndexedDB junto al cambio, una pestaña sincroniza. | D44 |

## 3. Estado actual

- **Etapa A completa (05/10/2026).** Commits: A0 `34e9b6e`, A1 `cc7697d`, A2 `4f124d7`, A3 `a39dad2`, A4 (ver `git log`), A5 `f4ceeea` (v28), A6 `75b5226` (v29), A7 `56f0691` (v30), A8 `b0bd076` (v31), A9 `1438f4f` (v32), A10 `5d2692e` (v33), A11 `d3faaef` (v34), A12 `94b61f2` (v35), A13 `6365fdf` (v36). Qué cambió en cada uno, para quien usa y para quien mantiene: `CHANGELOG.md`.
- **Datos:** `schemaVersion` **6**, IndexedDB **4** (contrato v6, D39). Las formas viejas (`mood`, `kind/body/items`, `moodLabels`) ya no se escriben, pero se leen si llegan. `cover` queda. Después de actualizar, Ajustes ofrece “Descargar la copia de antes”.
- **Pruebas:** `npm run check` → 126 unitarias y 54/54 recorridos E2E en Chromium (`file://` y HTTP); `npm run test:cloud` verde. Solo Chromium: Firefox, Safari, dispositivos reales y lectores de pantalla **no** se probaron (`docs/QA.md` §4).
- **Nube (D37, D38):** publicada en `https://micuaderno-five.vercel.app` (Vercel `trobias-projects/micuaderno`, Production se despliega en cada push a `main`; el último despliegue, A13, quedó `READY`). Supabase `lrwfkbuhmgtckjmswrzp` con esquema y RLS aplicados por SQL (el historial de migraciones está vacío: `docs/NUBE.md`). Nicole creó su cuenta. Cuadernos compartidos implementados y probados con la API simulada. La dueña decidió no hacer pruebas guiadas con personas o teléfonos ni un segundo proyecto de Supabase (D40): las Preview usan la base real.
- **Qué queda en orden:** NB1, NB2 y NB3 hechos (D43, D44); quedan NB4 (espera respuesta de la dueña) y NB5; nunca React (D42).
- **C (React/escenas 2.0): descartada para siempre** (D42, “nunca pasemos a React”). No proponerla.
- **Entrar (D41):** `/entrar` muestra la lista de personas para elegir con un toque, el PIN, “Instalar app” y “Activar notificaciones”.
- **Accesos:** desde claude.ai/code, `.mcp.json` no conecta (403 de red); los conectores de la cuenta (Vercel y Supabase) sí. Los secretos viven solo en las variables de Vercel; nunca en el repo ni en el chat.
- **Ramas y worktrees viejos**: quedaron ramas `trobias/*` locales y worktrees de Orca de la Fase 1, ya integrados en `main`. No borrarlos sin su ok.

## 4. Preguntas abiertas (esperan a la dueña; no decidir solo)

1. **Motion y “reducir movimiento” del sistema**: hoy todas las personas empiezan en “Completas” aunque el sistema pida menos (D23, pedido explícito); Ajustes lo sugiere bajar. Se le ofreció hacer que en ese caso empiece en “Reducidas”: no respondió.
2. **Canciones** (VISION §10, BACKLOG MD4): traer título/portada de Spotify/YouTube choca con “nada sale del dispositivo”. Propuesta: guardar solo lo escrito + proveedor reconocido por la URL; traer metadatos solo con un toque explícito. Falta su ok.
3. **Bloqueo con PIN** (BACKLOG PV3): ¿pantalla de privacidad o cifrado real? Ser honestos en la UI.
4. **Historial de git**: versiones viejas de los tests en el historial todavía tienen el nombre de ejemplo anterior. Reescribir historia exige force-push a `main`; se le ofreció y no respondió. No hacerlo sin un “sí” explícito.
5. Nombre de la vista “Volver a mí” (VISION §3): elegir con ella.
6. **Sacar una actividad** sigue siendo definitivo (con “Deshacer” en el aviso), no va a la papelera: lo decidió la Fase 1 para no romper ese flujo (D26). Si ella quiere actividades en la papelera, es un cambio chico en `js/ui/activity.js` + `MC.model`.
7. **Nube (respondido el 05/10, D40):** nunca la prueba con la psicóloga ni en el celular, nunca un segundo proyecto de Supabase; **lo próximo son las fotos en la nube (NB1)**. La etapa C quedó descartada (D42). Sigue abierto: si restaurar una copia con la nube prendida debe reemplazar también lo de la nube (NB4).
8. **Páginas:** el índice que a veces no respondía tras borrar se **reprodujo y arregló en Chromium** (cache `v25`): `MC.motion.swap` animaba `#panel-body` mientras se reemplazaba su contenido y Chromium dejaba el hit-test del contenedor viejo; ahora se anima la hoja nueva (antes 1/6 corridas fallaban, después 0/9). Falta confirmarlo en el navegador o celular de la dueña y en otros motores. Detalle en [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md).

## 5. Cómo retomar (paso a paso)

1. `AGENTS.md` → este archivo → `MIGRATION_PLAN.md` → `SPEC.md` → `DESIGN.md` → `DATA_MODEL.md` → `DECISIONS.md` (D27–D37 para el pedido actual; D37 + `docs/NUBE.md` para la nube) → `ROADMAP.md` / `BACKLOG.md` → `VISION.md` si tocás algo de la visión. El plan externo era un borrador de 03/10 y contiene cifras de tests y versiones ya superadas; este archivo y el código mandan.
2. `npm test` (no necesita nada) y `npm install && npm run e2e` (usa el Chromium del sistema en `/opt/pw-browsers/chromium`, o `CHROMIUM=/ruta`). En Windows funciona igual: apuntá `CHROMIUM` al `chrome.exe` de un Chromium de Playwright (`%LOCALAPPDATA%\ms-playwright\chromium-<build>\chrome-win\chrome.exe`) o a otro Chromium instalado. Si corrés varias suites a la vez (varios worktrees), usá un `E2E_PORT` distinto en cada una.
3. La etapa A terminó: lo próximo sale de `docs/EVALUACION_BC.md` (nube) o de lo que pida la dueña (`BACKLOG.md`). Leé la decisión que lo cubre y buscá la primitiva existente (AGENTS → “Antes de tomar algo de la visión”). No saltes al antiguo roadmap de Fases 2–10 por un encabezado viejo.
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
- Fase 1: `js/core/history.js` (`MC.history`: una pila por superficie, atajos solo fuera de campos de texto) · papelera y privacidad en `js/core/model.js` (`deletedAt`, `privacy`, `restoreTrash`, purga al arrancar) · `c.savedNote` en `js/ui/components.js` (guardando/guardado/aviso de fallo) · Papelera en `js/views/settings.js` (“Cuánto ocupa” se retiró en A2) · migraciones hasta v6 en `js/core/backup.js` (contrato v6: `contractRecord`).
- Rutas: `js/core/routes.js` (`MC.routes.*`; nunca `'#/…'` a mano).
- Datos: `js/core/store.js` (stores: meta, days, activities, routines, pages, images, files, weeks, templates, marks) · `js/core/model.js` (dominio; `summarize` = cuenta común por día, `feelingsOf` = lectura dual) · `js/core/backup.js` (copia, validación, migraciones).
- Vistas: `js/views/{calendar,week,today,sheets,pages,year,settings,print,cover,onboarding}.js` (`week` = semana-planner por defecto; `sheets` = Mis hojas, lo que se repite y Mis plantillas; `pages` = hoja en bloques y plantilla propia).
- Núcleo nuevo de la etapa A: `js/core/templates.js` (plantillas de fábrica), `js/core/theme.js` (colores propios), `js/core/brush.js` (pinceles y balde); `js/ui/sheet.js` (editor de bloques), `js/ui/repeat.js` (repetición), `js/ui/theme.js` (aplica el tema). Victorias: `M.setVictory` + `MC.insights.victories`.
- Piezas compartidas: `js/ui/components.js` (`MC.c.*`: diálogos, menú, avisos, `askDate`, `feelingEditor`, `feelingMark`, `statusMark`, `pageLink(s)`) · `js/ui/activity.js` (fila de actividad y emociones antes/después) · `js/ui/scrapbook.js` (stickers + Mis stickers) · `js/ui/draw.js` (dibujo) · `js/ui/images.js` (subir imágenes, adjuntos) · `js/ui/motion.js` · `js/ui/scenes.js`.

## 8. Trabajo con varios agentes (cómo se cerró la Fase 1)

Sirve si te piden repetirlo; si trabajás solo, ignoralo.

- **Orquestación con Orca**: un Run por objetivo, una tarea por ítem del backlog, cada una con su **worktree propio** creado desde una rama de integración. Las especificaciones de cada tarea seguían la forma Target / Cambio / Restricciones / Dueño de qué archivos / Aceptación observable.
- **Integración**: cada rama se revisa y se fusiona en una rama de integración; con `npm run check` en verde, `main` avanza en fast-forward y se pushea. Los choques típicos son siempre los mismos: `CACHE_VERSION` en `sw.js` (quedarse con una versión mayor que todas), `CHANGELOG.md` (juntar las entradas) y `BACKLOG.md`.
- **Revisión cruzada**: lo que implementa un agente lo revisa otro distinto (Claude ↔ Codex). Las revisiones encontraron defectos reales (foco perdido en la barra de stickers, adjuntos huérfanos, purga que impedía abrir el cuaderno, etc.).
- **E2E en paralelo**: cada worker con su `E2E_PORT`; si no, las corridas se pisan en el puerto 4199.
- **Antigravity (`agy`)**: al abrir un worktree nuevo pide confiar en la carpeta; en modo `accept-edits` igual pide permiso para cada comando; y se le puede acabar la cuota (error 429 “RESOURCE_EXHAUSTED”). Cuando pasó, las tareas siguieron con Claude y Codex.
- **Codex en Orca**: a veces el prompt queda pegado sin enviar (“turn start could not be verified”): mirar la terminal y mandar Enter. Si ofrece actualizarse, elegir “Skip” (no instalar nada global sin permiso).
