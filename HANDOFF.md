# MI CUADERNO — Traspaso para el próximo agente

Para retomar el desarrollo **sin haber estado en las conversaciones anteriores**. Leelo después de `AGENTS.md` y antes de tocar código. Estado al 03/10/2026.

**En una línea:** el MVP y la Fase 1 están hechos y en `main`; no hay ninguna fase en curso. Lo próximo es publicar y probar en dispositivos reales (V7 → V1–V6 en `ROADMAP.md`) y después la Fase 5 con la Fase 2 en paralelo. Qué falta, ítem por ítem: `BACKLOG.md`.

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

## 3. Estado actual

- Todo lo de la tabla está en `main` (y en la rama de la sesión). `schemaVersion` 4, `CACHE_VERSION` `mi-cuaderno-v19`. Fase 1 (DA1–DA4, PV1, T6) integrada el 2026-10-02.
- `npm run check` verifica sintaxis, **91 unit** y **34 E2E** sobre `file://` y HTTP. Para E2E necesita la dependencia local `playwright-core` y un navegador Chromium indicado con `CHROMIUM`.
- **Nunca se probó en dispositivos reales** ni se publicó: ver `ROADMAP.md` → Verificación pendiente (V1–V7).
- Fase 1 y T6 ya están integrados: no rehacerlos. El seguimiento de DA1 está completado. Antes de avanzar a Fase 2, revisar la verificación pendiente V1–V7 en `ROADMAP.md`.
- **Qué se hizo** (detalle en `CHANGELOG.md`, por fecha): MVP → pantalla única (D17) → todo en el calendario (D18) → conexiones (D19–D21) → marcadores y Agenda (D22) → motion en todo (D23) → dibujo, Mis stickers, adjuntos (D24) → visión documentada (D25) → Fase 1 (D26) → arreglo del router (03/10).
- **Qué queda, en orden** (`ROADMAP.md` → “Próximo paso sugerido”):
  1. V7: publicar en GitHub Pages y probar que se actualiza la versión; después V1–V6 (otros navegadores, PWA instalada, notificaciones, lector de pantalla, almacenamiento lleno). Esto necesita dispositivos reales: pedirle ayuda a la dueña.
  2. Fase 5 · Escribir tranquila (ES1–ES3, PE5): chica y de alto impacto.
  3. Fase 2 · Motor de elementos (EL1 primero: nace de los stickers con migración).
  4. Fase 3 · Memorias (se apoya en PV1, ya hecho).
  5. Fases 4, 6–10 según `ROADMAP.md`.
- **Ramas y worktrees viejos**: quedaron ramas `trobias/*` locales y worktrees de Orca de la Fase 1, ya integrados en `main`. No borrarlos sin su ok.

## 4. Preguntas abiertas (esperan a la dueña; no decidir solo)

1. **Motion y “reducir movimiento” del sistema**: hoy todas las personas empiezan en “Completas” aunque el sistema pida menos (D23, pedido explícito); Ajustes lo sugiere bajar. Se le ofreció hacer que en ese caso empiece en “Reducidas”: no respondió.
2. **Canciones** (VISION §10, BACKLOG MD4): traer título/portada de Spotify/YouTube choca con “nada sale del dispositivo”. Propuesta: guardar solo lo escrito + proveedor reconocido por la URL; traer metadatos solo con un toque explícito. Falta su ok.
3. **Bloqueo con PIN** (BACKLOG PV3): ¿pantalla de privacidad o cifrado real? Ser honestos en la UI.
4. **Historial de git**: versiones viejas de los tests en el historial todavía tienen el nombre de ejemplo anterior. Reescribir historia exige force-push a `main`; se le ofreció y no respondió. No hacerlo sin un “sí” explícito.
5. Nombre de la vista “Volver a mí” (VISION §3): elegir con ella.
6. **Sacar una actividad** sigue siendo definitivo (con “Deshacer” en el aviso), no va a la papelera: lo decidió la Fase 1 para no romper ese flujo (D26). Si ella quiere actividades en la papelera, es un cambio chico en `js/ui/activity.js` + `MC.model`.
7. **Publicar (V7)**: ¿GitHub Pages desde `main` del repo actual? Confirmar antes de activar nada público.

## 5. Cómo retomar (paso a paso)

1. `AGENTS.md` → este archivo → `SPEC.md` → `DESIGN.md` → `DATA_MODEL.md` → `DECISIONS.md` (sobre todo D17–D26) → `ROADMAP.md` / `BACKLOG.md` → `VISION.md` si vas a tocar algo de la visión.
2. `npm test` (no necesita nada) y `npm install && npm run e2e` (usa el Chromium del sistema en `/opt/pw-browsers/chromium`, o `CHROMIUM=/ruta`). En Windows funciona igual: apuntá `CHROMIUM` al `chrome.exe` de un Chromium de Playwright (`%LOCALAPPDATA%\ms-playwright\chromium-<build>\chrome-win\chrome.exe`) o a otro Chromium instalado. Si corrés varias suites a la vez (varios worktrees), usá un `E2E_PORT` distinto en cada una.
3. Elegí un ítem del backlog (NOW primero), leé la decisión que lo cubre y buscá la primitiva existente (AGENTS → “Antes de tomar algo de la visión”).
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
- Fase 1: `js/core/history.js` (`MC.history`: una pila por superficie, atajos solo fuera de campos de texto) · papelera y privacidad en `js/core/model.js` (`deletedAt`, `privacy`, `restoreTrash`, purga al arrancar) · `c.savedNote` en `js/ui/components.js` (guardando/guardado/aviso de fallo) · Papelera y “Cuánto ocupa” en `js/views/settings.js` · migración 3→4 en `js/core/backup.js`.
- Rutas: `js/core/routes.js` (`MC.routes.*`; nunca `'#/…'` a mano).
- Datos: `js/core/store.js` (stores: meta, days, activities, routines, pages, images, files) · `js/core/model.js` (todo el dominio; `summarize` = única cuenta por día) · `js/core/backup.js` (copia, validación, migraciones).
- Vistas: `js/views/{calendar,today,agenda,routines,pages,year,settings,print,cover,onboarding}.js`.
- Piezas compartidas: `js/ui/components.js` (`MC.c.*`: diálogos, menú, avisos, `askDate`, `moodMark`, `statusMark`, `pageLink(s)`) · `js/ui/activity.js` (fila de actividad) · `js/ui/scrapbook.js` (stickers + Mis stickers) · `js/ui/draw.js` (dibujo) · `js/ui/images.js` (subir imágenes, adjuntos) · `js/ui/motion.js` · `js/ui/scenes.js`.

## 8. Trabajo con varios agentes (cómo se cerró la Fase 1)

Sirve si te piden repetirlo; si trabajás solo, ignoralo.

- **Orquestación con Orca**: un Run por objetivo, una tarea por ítem del backlog, cada una con su **worktree propio** creado desde una rama de integración. Las especificaciones de cada tarea seguían la forma Target / Cambio / Restricciones / Dueño de qué archivos / Aceptación observable.
- **Integración**: cada rama se revisa y se fusiona en una rama de integración; con `npm run check` en verde, `main` avanza en fast-forward y se pushea. Los choques típicos son siempre los mismos: `CACHE_VERSION` en `sw.js` (quedarse con una versión mayor que todas), `CHANGELOG.md` (juntar las entradas) y `BACKLOG.md`.
- **Revisión cruzada**: lo que implementa un agente lo revisa otro distinto (Claude ↔ Codex). Las revisiones encontraron defectos reales (foco perdido en la barra de stickers, adjuntos huérfanos, purga que impedía abrir el cuaderno, etc.).
- **E2E en paralelo**: cada worker con su `E2E_PORT`; si no, las corridas se pisan en el puerto 4199.
- **Antigravity (`agy`)**: al abrir un worktree nuevo pide confiar en la carpeta; en modo `accept-edits` igual pide permiso para cada comando; y se le puede acabar la cuota (error 429 “RESOURCE_EXHAUSTED”). Cuando pasó, las tareas siguieron con Claude y Codex.
- **Codex en Orca**: a veces el prompt queda pegado sin enviar (“turn start could not be verified”): mirar la terminal y mandar Enter. Si ofrece actualizarse, elegir “Skip” (no instalar nada global sin permiso).
