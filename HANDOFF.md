# MI CUADERNO — Traspaso para el próximo agente

Para retomar el desarrollo **sin haber estado en las conversaciones anteriores**. Leelo después de `AGENTS.md` y antes de tocar código. Estado al 02/10/2026.

## 1. Cómo trabaja la dueña del proyecto

- Escribe en **español rioplatense**, corto y a veces con errores de tipeo; respondele igual, en criollo, claro y sin jerga técnica innecesaria. La app es para cualquier persona: textos **neutros en género**.
- Piensa en **experiencia**, no en features: lo que más pidió es que todo esté **conectado** y gire alrededor del **calendario**, que se vea **lindo** y se sienta un cuaderno real.
- Manda ideas grandes de a ráfagas, a veces mientras trabajás. Anotalas (en `BACKLOG.md` si no entran ya) y terminá lo que estás haciendo antes de cambiar de tema.
- Valora mucho la **documentación**: pidió más de una vez “documentá todo”. Cada entrega actualiza `CHANGELOG.md` y los docs que toque.
- **Git**: trabajar en la rama asignada a la sesión y pushearla; **a `main` solo cuando ella lo aprueba explícitamente** (casi siempre dice “sí, pasalo a main”). Un commit por entrega completa, con mensaje claro en inglés y las líneas de atribución que pida el entorno. Nada de PRs salvo que los pida.
- **Nombre de ejemplo: siempre “Nicole”**, en tests, docs y capturas. Fue un pedido tajante (“que ningún lado diga otro nombre, ni de ejemplo ni de broma”); lo vigila `tests/unit/names.test.js`.
- Le gustan las respuestas que dicen qué cambió **para quien usa el cuaderno**, con capturas mentales concretas, y que terminen preguntando si pasa a `main`.

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

## 3. Estado actual

- Todo lo de la tabla está en `main` (y en la rama de la sesión). `schemaVersion` 4, `CACHE_VERSION` `mi-cuaderno-v19`. Fase 1 (DA1–DA4, PV1, T6) integrada el 2026-10-02.
- `npm run check` verifica sintaxis, **91 unit** y **34 E2E** sobre `file://` y HTTP. Para E2E necesita la dependencia local `playwright-core` y un navegador Chromium indicado con `CHROMIUM`.
- **Nunca se probó en dispositivos reales** ni se publicó: ver `ROADMAP.md` → Verificación pendiente (V1–V7).
- Fase 1 y T6 ya están integrados: no rehacerlos. El seguimiento de DA1 está completado. Antes de avanzar a Fase 2, revisar la verificación pendiente V1–V7 en `ROADMAP.md`.

## 4. Preguntas abiertas (esperan a la dueña; no decidir solo)

1. **Motion y “reducir movimiento” del sistema**: hoy todas las personas empiezan en “Completas” aunque el sistema pida menos (D23, pedido explícito); Ajustes lo sugiere bajar. Se le ofreció hacer que en ese caso empiece en “Reducidas”: no respondió.
2. **Canciones** (VISION §10, BACKLOG MD4): traer título/portada de Spotify/YouTube choca con “nada sale del dispositivo”. Propuesta: guardar solo lo escrito + proveedor reconocido por la URL; traer metadatos solo con un toque explícito. Falta su ok.
3. **Bloqueo con PIN** (BACKLOG PV3): ¿pantalla de privacidad o cifrado real? Ser honestos en la UI.
4. **Historial de git**: versiones viejas de los tests en el historial todavía tienen el nombre de ejemplo anterior. Reescribir historia exige force-push a `main`; se le ofreció y no respondió. No hacerlo sin un “sí” explícito.
5. Nombre de la vista “Volver a mí” (VISION §3): elegir con ella.

## 5. Cómo retomar (paso a paso)

1. `AGENTS.md` → este archivo → `SPEC.md` → `DESIGN.md` → `DATA_MODEL.md` → `DECISIONS.md` (sobre todo D17–D25) → `ROADMAP.md` / `BACKLOG.md` → `VISION.md` si vas a tocar algo de la visión.
2. `npm test` (no necesita nada) y `npm install && npm run e2e` (usa el Chromium del sistema en `/opt/pw-browsers/chromium`, o `CHROMIUM=/ruta`).
3. Elegí un ítem del backlog (NOW primero), leé la decisión que lo cubre y buscá la primitiva existente (AGENTS → “Antes de tomar algo de la visión”).
4. Implementá con su test (unit en `tests/unit/`, recorrido en `tests/e2e/run.mjs`), estilos solo con tokens, y **revisá a ojo en 1366px y 375px** (ver §6).
5. Docs: SPEC/DESIGN/DATA_MODEL según corresponda, decisión nueva en `DECISIONS.md` si no es obvia, `CHANGELOG.md` (para quien lo usa + para quien lo mantiene), sacar el ítem de `BACKLOG.md`, `ROADMAP.md` si cerró una fase. Si tocaste algún archivo del shell, subí `CACHE_VERSION` en `sw.js`.
6. `npm run check` en verde → commit → push a la rama → preguntar si pasa a `main`.

## 6. Trucos que se usaron para QA visual

- Capturas con Playwright desde un script temporal (fuera del repo): abrir `file:///…/index.html`, tocar `.cover__board`, esperar que la tapa se vaya, completar el onboarding con **Nicole**, sembrar datos con `MC.model.*` desde `page.evaluate`, navegar con `location.hash = MC.routes.*`, y `page.screenshot()` en 1366×900 y 375×812. `tools/shot.mjs` sirve para capturas simples sin datos.
- Antes de llenar el onboarding, esperá a que la tapa desaparezca: si no, el onboarding se vuelve a dibujar y se pierde lo tipeado (parece un bug y no lo es).
- En los E2E, preferí `waitForFunction` a esperas fijas: el calendario de fondo se redibuja ~600 ms después de cada cambio (D21) y el mes nuevo entra con animación (D23).
- `c.section(title, …, { id })` pone el `id` en el **título** (h2), no en la sección: para buscar adentro usá la clase.

## 7. Mapa rápido del código vivo

- Arranque y navegación: `js/app.js` (calendario de fondo + `<dialog id="panel">` + marcadores `TABS`; `renderBase` arma aparte y anima; `refreshBase` en vivo; `placeTabs` muda los marcadores).
- Rutas: `js/core/routes.js` (`MC.routes.*`; nunca `'#/…'` a mano).
- Datos: `js/core/store.js` (stores: meta, days, activities, routines, pages, images, files) · `js/core/model.js` (todo el dominio; `summarize` = única cuenta por día) · `js/core/backup.js` (copia, validación, migraciones).
- Vistas: `js/views/{calendar,today,agenda,routines,pages,year,settings,print,cover,onboarding}.js`.
- Piezas compartidas: `js/ui/components.js` (`MC.c.*`: diálogos, menú, avisos, `askDate`, `moodMark`, `statusMark`, `pageLink(s)`) · `js/ui/activity.js` (fila de actividad) · `js/ui/scrapbook.js` (stickers + Mis stickers) · `js/ui/draw.js` (dibujo) · `js/ui/images.js` (subir imágenes, adjuntos) · `js/ui/motion.js` · `js/ui/scenes.js`.
