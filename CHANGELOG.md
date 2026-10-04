# MI CUADERNO — Cambios

Qué cambió en cada entrega, para quien usa el cuaderno y para quien lo mantiene. El porqué de cada decisión está en `DECISIONS.md` (Dn); lo que falta, en `ROADMAP.md`. Cada entrega que toca archivos de la app sube `CACHE_VERSION` en `sw.js` para que las PWA instaladas se actualicen.

## 2026-10-04 · Accesos de nube preparados, credenciales de Supabase pendientes

- La CLI de Vercel quedó vinculada a `trobias-projects/micuaderno`. Se fijaron las variables públicas indicadas y se cargaron en Production y Preview los secretos generables, VAPID, su asunto y `NEXT_TELEMETRY_DISABLED`. Falta `SUPABASE_SECRET_KEY`.
- `.mcp.json` ya está en la rama. La dueña habilitó los dos MCP en su entorno web de Claude Code; el estado de `claude mcp list` en una instalación local distinta no verifica ese entorno.
- `docs/NUBE.md` registra la verificación de red, los entornos y lo que falta para aplicar la migración SQL existente. Ningún secreto se agregó a Git.

## 2026-10-04 · Base de la nube: cuentas con PIN, permisos por sección y avisos (cache `v26`, sin desplegar)

**Para quien lo usa**
- Todavía no cambia nada en el cuaderno que abrís con doble clic. Queda lista la versión en la nube (Vercel + Supabase) para cuando se publique: cada persona entra con **usuario y PIN de 6 números**, Nicole administra (suma personas, cambia un PIN olvidado, pone en pausa) y cada quien elige, sección por sección, quién puede **ver** o **editar** su cuaderno. Lo marcado “solo para mí” no lo ve nadie más.
- En la nube, cada persona tiene su propio cuaderno en el dispositivo, aunque lo compartan. Ajustes muestra con quién entraste y un enlace a **Mi cuenta** (PIN, avisos en este dispositivo, quién ve mi cuaderno).
- Avisos de mañana y noche que se activan solo desde Mi cuenta y nunca muestran lo que escribiste.
- Lo compartido todavía no viaja: la sincronización llega después de las hojas (A7). Mi cuenta lo dice.

**Para quien lo mantiene**
- Next.js 16.3.8 en la raíz (`app/`, `lib/`, `proxy.ts`, `next.config.ts`, `vercel.json`). El cuaderno se copia a `public/` (`tools/copy-notebook.mjs`); con Supabase recibe `<meta name="mc-cloud">` y `js/cloud.js` activa las cuentas: base `mi-cuaderno@<id>`, preferencias `mc.ui.<id>.*`, redirección a `/entrar` sin sesión. CSP estricta para el cuaderno.
- `supabase/migrations/20261004120000_cuentas_permisos.sql`: personas, demoras de ingreso, permisos, partes del cuaderno por sección, registro de seguridad, avisos y latido; RLS en todo. `js/core/sections.js` es el mapa campo → sección (test contra la migración).
- PIN: Argon2id + pimienta; contraseña de Supabase derivada por HMAC; demoras progresivas. Latido diario (`/api/keepalive`) para que Supabase gratis no se pause. SW: solo la navegación al cuaderno sale de la caché, y suma el manejador `push`.
- Pruebas: `npm run test:cloud` (PIN, plan de avisos, RLS contra Postgres 16 real: 20), `npm run e2e:cloud` (next start: 3), dos E2E “nube:” en `npm run check`, `npm run typecheck` y `npm run build` en verde. Puesta en marcha, variables, MCP de las dos cuentas y red del entorno: [`docs/NUBE.md`](docs/NUBE.md). Decisión: D37.

## 2026-10-04 · El índice de Páginas responde siempre después de borrar (cache `v25`)

**Para quien lo usa**
- Después de mandar una página a la papelera, el índice vuelve a responder enseguida: se marca el enlace al pasar el mouse y se puede abrir otra página sin salir al calendario.

**Para quien lo mantiene**
- Causa reproducida (1 de 6 corridas): `MC.motion.swap` animaba `#panel-body`, el contenedor fijo del cuadro, mientras se reemplazaba su contenido; Chromium dejaba a veces el hit-test y el foco del contenido viejo. Ahora se anima la hoja nueva (`firstElementChild`) con la misma duración, curva y desplazamiento. Con el arreglo, 0 de 9 corridas fallaron. Detalle en [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md).
- Falta confirmarlo en el dispositivo de la dueña y en WebKit/Firefox.

## 2026-10-04 · Cobertura del índice de Páginas tras borrar

- El recorrido E2E del índice ahora usa un contexto con tacto real: `tap()` ya no se sustituye silenciosamente por `click()`. Si falla el toque, la prueba falla.
- Una falla de hit-test ahora informa qué enlace, coordenadas y elemento superior vio Chromium, además del scroll y las animaciones del panel. No se cambió la interfaz ni se atribuye una causa sin una corrida fallida con estos datos.
- El caso pasó seis veces aislado antes del ajuste y otra vez con `tap()` real. `npm run check` posterior pasó: 94 unit y 43/43 E2E Chromium. Sigue pendiente probar el síntoma original en otros navegadores o con pasos precisos del dispositivo afectado.
- Investigación y criterio para retomar: [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md). El síntoma de la app queda marcado como abierto en `BACKLOG.md`.

## 2026-10-04 · Emociones con tus propias palabras (A4, cache `v24`)

**Para quien lo usa**
- Al empezar y cerrar un día, las emociones se escriben libremente: una o varias palabras, sin elegir entre cinco estados. Las palabras ya anotadas aparecen como sugerencias y cada una se puede sacar. Las actividades también permiten anotar cómo te sentiste **antes y después** desde su menú; ambas se leen junto a la actividad.
- Mes, semana y *Mi año* muestran palabras e hilos de color. Hasta ocho colores se asignan a las palabras más frecuentes en la vista; Ajustes → Mis emociones permite fijar un color por palabra con selector o código hex. El color siempre acompaña al texto.
- “Lo que fui notando” cuenta palabras repetidas o compartidas entre inicio y cierre y coincidencias descriptivas con actividades, sin valorar emociones como altas/bajas. TXT, CSV, XLSX e impresión incluyen las palabras y antes/después; los recordatorios reconocen que ya escribiste una emoción.
- Los días guardados con los cinco ánimos anteriores se siguen leyendo con los nombres que tenía ese cuaderno. Quitar una palabra no resucita el ánimo viejo.

**Para quien lo mantiene**
- `MC.model.feelingsOf`, `emotionKey`, `emotionPalette` y `emotionSuggestions` centralizan compatibilidad y presentación. `summarize` expone arrays `morning/evening/feelings`; `c.feelingEditor` y `c.feelingMark` sustituyen al selector de cinco parches. `legacyMoodLabels` queda congelado al cargar ajustes, hasta el contrato v6 (A13). Sin cambio de esquema: A3 ya había abierto los campos v5.
- Se cambiaron todos los consumidores activos: Día, fila de actividad, Calendario, Año, Ajustes, observaciones, exportadores, impresión, recordatorios y atajo PWA. `sw.js` ya leía ambos formatos desde A0; caché v24.
- `MIGRATION_PLAN.md` trae el plan externo al repo; `HANDOFF.md`, `ROADMAP.md`, `BACKLOG.md`, `SPEC.md`, `DESIGN.md`, `DATA_MODEL.md`, `DECISIONS.md`, `AGENTS.md`, `PRODUCT.md` y `README.md` distinguen lo implementado de lo pendiente para agentes sin contexto.
- Verificación: `npm run check` pasó con sintaxis de 34 archivos, 94 unit y 43/43 E2E Chromium en `file://`/HTTP. Capturas revisadas en desktop y 375 px; sin errores de página ni scroll horizontal en esas capturas. Una corrida anterior tuvo una falla intermitente en el E2E A0 entre pestañas; pasó aislado y en la corrida completa posterior. WebKit, Firefox y dispositivos reales quedan pendientes.

## 2026-10-04 · Contrato de datos v5: lugar para lo nuevo sin perder nada (cache `v23`)

**Para quien lo usa**
- Por ahora casi nada cambia a la vista: el cuaderno se prepara para la semana-planner, las emociones escritas, las hojas con plantillas y las estrellas. Al abrirlo, la base se actualiza sola y conserva todo, también lo que estaba a medio escribir.
- “Pasar a mañana” y “Pasar a otro día…” hacen lo mismo con una actividad propia: se muda entera al día nuevo (antes “a mañana” dejaba una copia pospuesta). Las de una rutina siguen quedando “para otro día” en su fecha y aparecen sueltas en la nueva.
- Si se marcaba muy rápido dos veces una actividad de rutina, podía duplicarse: ya no.

**Para quien lo mantiene** (paso A3 del plan; DECISIONS D27–D36 y DATA_MODEL “Esquema v5”)
- IndexedDB v3: stores `weeks`, `templates`, `marks`, índice `pages.date`, `files.updatedAt` completado en `onupgradeneeded`.
- `model.js`: campos nuevos que conviven con los viejos (`feelings`, `feel`, `moves`, `blocks/values/templateId/routineId`, `kind/templateId` de rutinas, herramientas y rellenos de dibujos, `theme`, `emotionColors`, `legacyMoodLabels`); normalizadores de semanas, plantillas y marcas; ids deterministas de ocurrencias (`occurrenceId`) con deduplicación al leer; leer ya no inventa fechas (`stamp` al escribir); papelera para los stores nuevos y para adjuntos con `updatedAt`.
- `recurrence.js`: regla anual (el 29/02 cae el 28/02 en años comunes). `backup.js`: `SCHEMA_VERSION` 5 y `MIGRATIONS[5]` aditiva.
- Tests: `schema-v5.test.js` (12) y E2E de actualización real de una base v2 con datos y un borrador viejo (42 recorridos).

## 2026-10-04 · Stickers sin sombra, fuera “Cuánto ocupa” y todos los colores en tokens (cache `v22`)

**Para quien lo usa**
- Los stickers y los dibujos ya no llevan sombra ni el borde claro alrededor (en un dibujo transparente se notaba raro). Queda solo el borde blanco de corte de los stickers.
- En Ajustes → Mis datos ya no está “Cuánto ocupa mi cuaderno”. La papelera y su aviso al acortar el plazo siguen igual.

**Para quien lo mantiene** (paso A2 del plan del 03/10)
- Fuera `--shadow-sticker` y el halo de `.sticker--img` (también en el selector, las plantillas, el cierre del día y la mariposa de las escenas).
- DA4 retirado: sale la medición de `settings.js` (y su test unitario y su E2E); `countDueTrash` pasa a `MC.model` (su test, a `trash.test.js`).
- Todo color a `css/tokens.css`: avisos (`--error-ink`, `--danger`), cantos de cintas, elástico, bastidor, arte de stickers fijo (`--st-*`, pintado con clases `sf-*`/`ss-*` en vez de `fill="#…"`), escenas e impresión (`--print-*`, siempre tinta sobre blanco). El alto contraste del sistema se mudó a `tokens.css`.
- `tests/unit/guards.test.js`: ningún hex fuera de `tokens.css` (en JS, solo con la marca `color-ok`) y la copia de seguridad cubre todos los stores (`MC.store.INTERNAL_STORES`).

## 2026-10-04 · Arreglos de base: escenas, menús y volver al calendario (cache `v21`)

**Para quien lo usa**
- Las escenas ocasionales ya no se apagan para toda la sesión si salís de una hoja mientras la estás decorando (era una de las razones por las que casi no aparecían).
- Un menú ya no se cierra solo al primer toque (pasaba si antes otro menú se había abierto y cerrado de golpe).
- La ✕ (o Esc) tocada dos veces rápido ya no te saca del cuaderno: vuelve una sola vez al calendario.
- Si abrís el cuaderno directo en Hoy (desde la app instalada, una notificación o un atajo), o recién terminás la bienvenida, cerrar vuelve al calendario y “atrás” ya no reabre Hoy ni la bienvenida.
- Después de recargar la página, cerrar un cuadro vuelve por el historial como antes de recargar (T7).
- Para el problema de Páginas que no responden tras borrar: no se pudo reproducir en Chrome (probado en celular, tablet y compu, con mouse y táctil, dibujando, decorando y con Deshacer). Si te vuelve a pasar, abrí el cuaderno con `?debug=hit` al final de la dirección: abajo aparece qué queda bajo el puntero, y con eso se encuentra.

**Para quien lo mantiene** (paso A1 del plan del 03/10)
- `scrapbook.js` `destroy`: `try/finally`, y avisa `decorating:false` si se sale decorando. `pages.js`: el último cambio de stickers después de borrar la página no revienta. `components.js` `c.menu`: el “tocar afuera” no se agrega si el menú ya se cerró (`state.closed`).
- `app.js`: `requestClose` con guarda de doble cierre y espera de rutas pendientes; `seedBase` + `leaveOnboarding`; recorrido en `sessionStorage` (`mc.trail`); `?debug=hit`.
- `model.js`: `routineOccurrences` es el único cálculo de ocurrencias virtuales (lo usan la lista del día y el resumen del calendario). `MC.scenes.state()` para diagnosticar.
- E2E nuevos (42): índice vivo después de borrar en todas sus variantes (`file://` y `http://`, mouse, teclado y táctil), escenas tras decorar, menú tras un cierre instantáneo, doble cierre / arranque directo / recarga y `?debug=hit`.

## 2026-10-04 · La base nunca escribe en el aire (cache `v20`)

**Para quien lo usa**
- Si tenés el cuaderno abierto en otra pestaña con una versión anterior, la nueva ya no arranca “de mentira” (antes caía en un modo que no guardaba nada al cerrar): avisa que hay otra pestaña abierta y termina de abrirse sola cuando la cerrás.
- Si una pestaña se actualiza mientras escribís en otra, lo que estabas escribiendo se guarda antes de que la otra tome la base, y después recarga.
- Si el navegador ya tiene una versión más nueva del cuaderno, pide recargar en vez de abrir sin poder guardar.

**Para quien lo mantiene** (paso A0 del plan del 03/10)
- `js/core/store.js`: `onblocked` emite `store:blocked` y espera (antes rechazaba y caía en memoria); `VersionError` no cae en memoria; ante `versionchange` emite `store:versionchange` (el app hace `flush`), espera a que terminen las operaciones en curso (`settle`, 200 ms–2 s) y recién ahí cierra y emite `store:closed` (el app recarga). Después de cerrar, toda operación devuelve una promesa rechazada.
- `js/app.js`: papelito `.store-notice` (bloqueada / más nueva con “Recargar”, que activa el SW en espera antes de recargar).
- `sw.js`: no crea una base vacía si el cuaderno no existe, suelta la conexión en `versionchange` y al terminar cada recordatorio; lee el ánimo viejo y las emociones nuevas.
- E2E nuevos (37): pestaña vieja que retiene la base, base más nueva, y guardar lo pendiente antes de soltarla.

## 2026-10-03 · Cerrar el cuadro vuelve siempre al calendario (cache `v19`)

**Para quien lo usa**
- La ✕ (y Escape) vuelve al calendario aunque antes se haya ido y vuelto a la misma hoja, por ejemplo con las flechas de día anterior/siguiente o pasando por Páginas → Ajustes → Páginas. Antes caía en otro cuadro y había que cerrar de nuevo.

**Para quien lo mantiene**
- `js/app.js`: el router ya no adivina “atrás” comparando con la ruta anterior; cada entrada del historial guarda su posición en `history.state` (`mcAt`) y `requestClose` vuelve con `history.go` exactamente hasta la última entrada del calendario. Los `location.replace` del router pasan por `replaceHash` para no contar pasos fantasma. E2E nuevo con los recorridos que fallaban.

## 2026-10-02 · Seguimiento de papelera y cierre del traspaso (cache `v18`)

- Traspaso y roadmap reflejan la Fase 1 y T6 ya integrados, el esquema v4, la caché v18 y la suite actual (91 unit y 33 E2E).
- Abrir un día en papelera muestra lo que ya estaba escrito y explica que editarlo lo restaura. Un guardado vacío o un borrador desactualizado no sobrescribe lo recuperable; los guardados sucesivos conservan texto y privacidad.
- La medición de espacio incluye también imágenes en papelera y señala cuántos registros conserva. Al acortar la retención, Ajustes avisa cuántos elementos vencerían en el próximo arranque.
- Las verificaciones en dispositivos reales siguen pendientes; no se presentan como trabajo ya probado.

## 2026-10-02 · Deshacer y rehacer (cache `v13`)

**Corrección posterior (cache `v14`).** El historial de actividades se vacía al salir de la vista; los atajos solo actúan sobre la hoja visible y ceden el paso a un diálogo abierto. Estado, nombre y traslados de actividades también se pueden deshacer y rehacer. En scrapbook, varios movimientos o giros consecutivos del mismo sticker forman un paso; el guardado espera una pausa breve y se vacía al salir, ocultar la pestaña o cerrar la hoja. Los botones de historial anuncian la acción disponible y muestran el estado deshabilitado con estilos del cuaderno.

- Stickers y dibujos tienen Deshacer y Rehacer en sus barras; también funcionan Ctrl+Z, Ctrl+Shift+Z y Ctrl+Y fuera de los campos de texto. Sacar una actividad usa el mismo historial desde el aviso.
- `MC.history` mantiene una pila transitoria por superficie, con límite de 50 acciones; los cambios de stickers siguen el guardado habitual. Pruebas unitarias y recorrido E2E cubren el historial y el texto editable.

## 2026-10-02 · Papelera: arreglos de la revisión (cache `v15`)

**Para quien lo usa**
- Si la limpieza automática de la papelera falla al abrir, el cuaderno abre igual (antes mostraba “Algo no salió bien al abrir el cuaderno”).
- Borrar del todo una página de la papelera también borra sus adjuntos; antes quedaban ocupando lugar y en la copia, sin forma de verlos.

**Para quien lo mantiene** (DA1)
- `dropForever` en `model.js` (purga, borrar definitivamente y vaciar); la purga del arranque en `app.js` es best-effort. Test unitario de adjuntos de página y E2E de papelera (borrar página → sale del mes → Ajustes → Restaurar → vuelve) y de arranque con purga fallida.

## 2026-10-02 · Papelera (cache `v14`)

**Para quien lo usa**
- Páginas, rutinas, stickers propios, dibujos y adjuntos van a la papelera al sacarlos. El aviso ofrece **Deshacer**; en Ajustes → Mis datos se pueden restaurar, borrar uno por uno o vaciar la papelera.
- La retención se puede elegir entre 7, 15, 30 o 60 días, o conservar siempre. Lo que está en la papelera deja de aparecer en el cuaderno, el calendario, las observaciones, las exportaciones legibles y la impresión; sigue en la copia JSON.

**Para quien lo mantiene** (DA1, D26)
- Borrado suave en el mismo store, operaciones de restauración, vaciado y purga por fecha; la purga corre al arrancar después de cargar ajustes. `everything()` conserva todo para backup y `activeEverything()` alimenta vistas y exportaciones.
- Tests unitarios de restauración, retención, borrado, resumen y copia. La actividad individual conserva por ahora su Deshacer existente.

## 2026-10-02 · Privacidad de un día o una página y esquema v4 (cache `v13`)

**Para quien lo usa**
- En la página de un día, debajo de la fecha, está **Privacidad**; en una página libre, en su menú (⋯) → **Privacidad de esta página…**. Son tres casillas: no traerlo como recuerdo, no usarlo en “Lo que fui notando”, no incluirlo en los repasos. Nada es obligatorio y se guarda solo.
- Lo que tiene privacidad sigue en el cuaderno, en el calendario y en las copias. Se nota con un candado y las palabras “Con privacidad” (en la página libre, el candado junto al menú).
- *Mi año*: “Lo que fui notando” no cuenta los días marcados (ni sus actividades) y “Lo que guardé” no muestra los recuerdos de días que pediste dejar afuera.

**Para quien lo mantiene** (PV1 + esquema v4, D26)
- `schemaVersion` 4 con `MIGRATIONS[4]` aditiva: no reescribe registros; solo suma `trashRetentionDays: 30` a los ajustes de la copia si falta. Las copias v1–v3 siguen abriendo; una v5 se rechaza con el aviso de siempre. IndexedDB sigue en la versión 2.
- `js/core/model.js`: `privacy` (días y páginas) y `deletedAt` (todas las entidades) opcionales en los normalizadores, con `sanitizePrivacy`, `isPrivate`, `sanitizeDeletedAt`, `isDeleted`; ajuste `trashRetentionDays` (0/7/15/30/60). `deletedAt` se acepta y se conserva en copias, pero **la papelera (DA1) todavía no existe**: nada lo escribe ni lo filtra fuera de `insights.js` y “Lo que guardé”.
- `js/core/insights.js` mira solo lo visible (sin `noInsights`, sin lo borrado); `js/views/year.js` filtra “Lo que guardé”. UI en `js/views/pages.js` (`privacyDialog`, `privacyButton`, compartidos con `today.js`).
- Tests: `tests/unit/privacy-v4.test.js` (copia v3 real → v4, sanitize, ida y vuelta, rechazo de v5, insights). `tests/e2e/run.mjs` espera `schemaVersion` 4. `sw.js` sube a `mi-cuaderno-v13`.

## 2026-10-02 · “guardando… → guardado ✓” en todas las hojas (cache `v13`)

### Revisión DA3 (cache `v14`)
- El aviso de fallo queda por encima de los stickers en páginas angostas. El error de almacenamiento ya no duplica el aviso con un toast cuando hay un indicador visible; fuera de esas hojas conserva el aviso general.
- Borrar una imagen desde “Mis stickers” muestra el mismo estado de guardado dentro del sobre. `SPEC.md` usa el texto y la firma de `c.savedNote()` reales.

**Para quien lo usa**
- Al escribir en un día o en una página, arriba aparece un “guardando…” tenue; cuando el cuaderno lo guardó de verdad, cambia a “guardado ✓” y al ratito se desvanece. Lo mismo al decorar con stickers (se ve en la barra de decorar) y al cambiar algo en Ajustes, que ya no muestra carteles flotantes por cada cambio.
- Si no se pudo guardar (o el navegador no deja usar su almacenamiento), en vez de “guardado” dice con calma “Todavía no se pudo guardar en el cuaderno; queda como borrador en este dispositivo.”, con un lápiz y “Descargar una copia” a mano. Cuando vuelve a poder, dice “guardado ✓” otra vez.

**Para quien lo mantiene** (DA3)
- `c.savedNote(opts)` (`js/ui/components.js`) suma `saving()`, `saved()`, `failed()`, `track(promesa, esLaUltima?)` y `twin()`; `flash()` sigue funcionando (= `saved()`). “guardado” solo cuando resuelve la promesa de `MC.model`/`MC.store`; en modo memoria (`c.durable()` falso) muestra el aviso de fallo. Lector de pantalla: región `aria-live="polite"` aparte que anuncia “Guardado.” (como mucho cada 15 s) y el fallo; “guardando…” nunca.
- Hoy y Páginas: `persist()` marca “guardando…” y el guardado con debounce pasa por `track`. En modo memoria el borrador local (D13) ya no se borra: es lo único que sobrevive a una recarga.
- Scrapbook: `attach(…, { note })` muestra una copia visual del indicador en la barra mientras se decora. Ajustes: el indicador va junto al título; `save()` ya no lanza toasts.
- Estilos en `css/components.css`: solo opacidad (`--dur-ui`, `--ease-out`), sin transición en *Reducidas*/*Ninguna*; el aviso de fallo baja a su propio renglón. E2E nuevo: día y página pasan por “guardando…” → “guardado”, fallo simulado y recarga. `sw.js` sube a `mi-cuaderno-v13`.

## 2026-10-02 · QA de DA4 y ajuste del teclado móvil (cache `v13`)

**Para quien lo mantiene**
- DA4 suma un recorrido E2E del desglose y del aviso de copia grande. T6 desplaza el campo solo al abrir el teclado o cambiar el foco, y el fallback exige una reducción de altura medida antes de ocultar los marcadores.
- Herramientas en Windows: `tools/serve.mjs`, `build-fonts`, `dist` y `make-icons` resuelven la raíz con `fileURLToPath`; `npm run e2e` acepta `E2E_PORT` y avisa si el puerto está ocupado.

## 2026-10-02 · Espacio del cuaderno (cache `v11`)

**Para quien lo usa**
- En Ajustes → Mis datos se ve un tamaño aproximado del cuaderno, separado en texto, fotos, audio, dibujos y otros adjuntos. Si la copia puede ser grande, aparece un aviso antes de descargarla.

**Para quien lo mantiene** (DA4)
- `js/views/settings.js` mide los datos locales por categoría y muestra aparte la estimación del almacenamiento del sitio cuando el navegador la ofrece. Si no hay `navigator.storage.estimate()`, el desglose del cuaderno sigue disponible.
- `tests/unit/settings-storage.test.js` cubre categorías, tamaño total, estimación opcional y umbral del aviso. `sw.js` sube a `mi-cuaderno-v11` por el cambio de `settings.js` en el shell.

## 2026-10-01 · Barra de marcadores en móvil con teclado abierto (cache `v10`)

**Para quien lo usa**
- En el celular, cuando tocás un campo de texto para escribir y se abre el teclado virtual, la barra de marcadores inferior se oculta automáticamente para no tapar lo que escribís, y el campo activo se acomoda a la vista. Al cerrar el teclado o salir del campo, los marcadores reaparecen de inmediato.

**Para quien lo mantiene** (deuda técnica **T6**)
- `js/app.js`: `setupKeyboard()` detecta la apertura del teclado virtual mediante `window.visualViewport` (reducción de altura > 150px) exigiendo foco en un campo editable (`isEditable`), con restablecimiento de altura base al rotar el dispositivo o redimensionar ventana; evita memorizar la altura reducida del teclado al perder foco; fallback para navegadores sin `visualViewport` con redimensión de ventana y eventos `focusin`/`focusout`.
- `css/notebook.css`: regla `@media (max-width: 699px)` con `body.keyboard-open .tabs { display: none; }`.
- `sw.js`: `CACHE_VERSION` sube a `mi-cuaderno-v10`.
- Tests: E2E en `tests/e2e/run.mjs` cubre foco real en campo de texto, apertura, cambio de foco entre campos editables sin parpadeos, cierre/blur y comprobación de que reducciones de viewport sin foco no oculten la barra.

## 2026-10-01 · Traspaso para retomar sin contexto (sin cambios en la app)

**Para quien mantiene el cuaderno**
- `HANDOFF.md` nuevo: cómo trabaja la dueña (idioma, git, a `main` solo con su ok, nombre de ejemplo Nicole), la historia de pedidos y decisiones en orden, el estado, las preguntas abiertas que esperan su respuesta, cómo retomar paso a paso y trucos de QA.
- Docs al día con los marcadores (D22): DESIGN §10 y §11, SPEC (journeys), README (21 recorridos y qué hace la app), DATA_MODEL (`motion: 'completas'` + `motionChosen`), DESIGN §12 (motion del marcador).
- BACKLOG T6 (NOW): la barra de marcadores del celular no se oculta con el teclado abierto (se había perdido con D22).

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
