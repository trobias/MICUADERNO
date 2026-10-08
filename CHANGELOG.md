# MI CUADERNO — Cambios

## 2026-10-08 · Mariposa durante la apertura y favicon claro (D60, cache v56)

- Una hoja con mariposa rosa/lavanda, «Cargando el cuaderno…» y esqueleto de calendario aparece desde el HTML inicial. Se reemplaza al estar lista la bienvenida o el primer calendario, sin espera artificial.
- Si la descarga inicial de la invitada falla, muestra «Volver a intentar» y conserva los avisos de base bloqueada o versión nueva. Nunca presenta una descarga fallida como cuaderno vacío listo.
- Favicon transparente con mariposa grande, sin el medallón y costura anteriores. Mismo arte que la carga, en SVG y PNG de 16/32/48 px e ICO; generación desde assets/icons/src/favicon.svg. URLs versionadas y precargadas para PWA/offline.
- Sin animaciones repetidas, cambios de datos o nuevas dependencias. La espera de red todavía conserva la descarga completa; resultados y límites en docs/QA.

## 2026-10-08 · Conteos de progreso más simples (cache v55)

- Quita «N un poquito» del resumen, las barras individuales y las victorias semanales de Mi año. Quedan los conteos N/M y las barras pastel; los medios avances siguen aportando la mitad y generando estrellas.
- La descripción para lectores de pantalla conserva completas, medios avances y porcentaje. Sin cambios de datos o frecuencias.

## 2026-10-08 · Barras de actividades en pastel (cache v54)

- Cada actividad tiene una barra de 24 px, con verde menta para Lo hice y amarillo manteca para Un poquito. Fondo de papel con un toque lavanda, contorno suave y esquinas de 6 px.
- Conserva conteos, medios avances, estrellas y descripciones accesibles; alto contraste del sistema conserva sus colores. Sin datos nuevos ni dependencias.
- Verificación visual y recorridos de progreso en `docs/QA.md`.

## 2026-10-08 · Un año de recuerdos y pequeñas victorias (D59, cache v53)

- Álbum por mes con estrellas, papelitos, frases propias y miniaturas de fotos/dibujos colocados. Conserva metas semanales y Qué quiero guardar; enlaces a su día, hoja o semana y más entradas a elección.
- Victorias personales: descanso, pedir ayuda, límites, animarse, cuidado y disfrute. Día especial desde “Este día…”, recuerdos desde actividad/hoja y creación terminada desde su hoja. Un mismo editor para elegir, cambiar o quitar.
- Señalar actividades/repeticiones como especiales produce un momento al marcar Lo hice/Un poquito; primera vez guarda solo el primer registro. Primer dibujo anual automático con fuente visible. Sin interpretación de emociones ni rachas.
- Barras individuales de Progreso ampliadas a 16 px; conservan amarillo/verde y cálculo D58.
- Copia v12 aditiva, IDB 5, cache v53; referencias en anio, TXT e impresión. Sin dependencias o SQL nuevo. Verificación y límites en docs/QA.

Qué cambió en cada entrega, para quien usa el cuaderno y para quien lo mantiene. El porqué de cada decisión está en `DECISIONS.md` (Dn); lo que falta, en `ROADMAP.md`. Cada entrega que toca archivos de la app sube `CACHE_VERSION` en `sw.js` para que las PWA instaladas se actualicen.

## 2026-10-08 · Medio avance amarillo, Progreso y estrellas de victoria (D58, cache `v52`)

- Un poquito cuenta una vez y llena media oportunidad en amarillo: tres marcas muestran **3/3**, barra al **50 %** y estrella. Lo hice llena en verde; mezclas muestran ambos segmentos y la cuenta distingue completas/un poquito.
- La nota de barras se llama **Progreso**. Cada meta alcanzada, incluso con medios avances, muestra **Pequeña victoria** con la estrella SVG existente y una aparición breve que respeta movimiento reducido. Sin loops ni dependencias nuevas.
- Las metas alcanzadas se suman a Pequeñas victorias de Mi año y llevan a su semana; se calculan desde las marcas y planes, sin duplicar al recargar ni escribir nuevas referencias. Privacidad, papelera, historial y victorias manuales se conservan.
- Copia v11 e IDB 5 intactos; solo cambia cálculo y presentación. Resultados y límites en `docs/QA.md`.

## 2026-10-08 · Actividades agrupadas y calendarios sin Sin marcar (D57, cache `v51`)

- Una barra por nombre en Importante: tres Trabajar aparecen como **0/3**, una hecha cambia a **1/3**. Agrupa actividades sueltas y repeticiones equivalentes, sin modificar sus registros ni reglas, respetando el límite de cada meta flexible.
- Mes y semana ocultan únicamente **Sin marcar**, tanto en pasado como hoy y futuro. **Lo hice**, **Hice un poquito**, **Lo dejo para otro día** y **Hoy no salió** se mantienen visibles, con glifo y texto accesible.
- Las casillas precargadas siguen disponibles al abrir el día. Las oportunidades sin marcar siguen en el denominador semanal y el historial se conserva. El lápiz permite elegir qué repetición configurar cuando varias comparten nombre.
- Copia v11 e IndexedDB 5 sin migración nueva: solo cambia una lectura derivada. Documentación y pruebas actualizadas; resultados y límites en `docs/QA.md`.

## 2026-10-08 · Barras y actividades configurables dentro de Importante (D56, cache `v50`)

- El progreso pasa a la nota Importante: resumen semanal y una barra visible propia por actividad, sin barra encima de la grilla. Las notas y casillas manuales se conservan debajo y no se cuentan como actividades.
- Precargadas una sola vez: Trabajar y Practica Diseño de lunes a viernes (diseño: 1 hora por día), Caminar 3 veces, Salir con una amiga y Bici 1 vez cada una, con días a elección. El lápiz permite definir nombre, frecuencia, días, duración/meta y vigencia, o borrar. «Organizar actividades» permite crear y acceder a las repeticiones.
- No duplica rutinas equivalentes existentes ni cambia sus reglas, pausa o papelera; reconoce «Practicar diseño». Borrar/purgar no reinstala una inicial. La nueva semana renueva las oportunidades y el historial D55 se mantiene.
- `weeklyDefaultsInstalled` viaja en settings, copia v11 y nube; migración aditiva, IDB 5 sin stores nuevos. Una invitada nunca instala actividades. Los permisos de notas, barras y controles se aplican por separado dentro de Importante.
- Pruebas de instalación, reintento interrumpido, equivalencias, edición/purga/copia y ausencia de historia fabricada; E2E con teclado, edición, borrado, alta, recarga y semanas, en file y HTTP a 1366px/375px. Se amplía la matriz de permisos mezclados. Resultados y límites en `docs/QA.md`.
- Se corrige la espera del test anterior de borrado de páginas: el modo Decorar se activa antes de que termine la bandeja; ahora espera el sticker colocado antes de usar el teclado. Mantiene todas las comprobaciones, sin cambiar la función de stickers.
- Actualizados AGENTS, BACKLOG, DATA_MODEL, DECISIONS, DESIGN, HANDOFF, MIGRATION_PLAN, PRODUCT, README, ROADMAP, SPEC, docs/NUBE y docs/QA. Sin dependencias nuevas ni cambios de infraestructura.

## 2026-10-07 · Actividades automáticas y objetivos semanales (verificado localmente, cache `v49`)

**Para quien lo usa**
- La semana tiene barra de progreso arriba, porcentaje y actividades completadas frente a programadas. Los siete días conservan sus casillas, incluso para marcar un día anterior. El mes sigue sin mostrar pendientes pasados.
- Desde «Ver objetivos y organizar → Programar actividad»: días fijos o una cantidad por semana, con duración/meta opcional. Se configura una vez y aparece sola; no hay que volver a escribir cada cumplimiento.
- Cinco veces de trabajo, cinco de diseño y tres caminatas suman trece oportunidades. Las caminatas se marcan en los días elegidos y la meta queda completa al llegar a tres; otras marcas no inflan el porcentaje. Solo «Lo hice» completa una oportunidad.
- El lunes renueva oportunidades, sin borrar marcas ni planes de semanas anteriores. Sin juicios, rachas ni tareas de ejemplo cargadas en datos reales.

**Para quien lo mantiene**
- `weeklyTarget`/`targetNote`, cálculo puro de progreso y plan en `weeks.activityPlan`. Esquema v10 con migración aditiva, IDB 5 sin cambios de stores, cache v49. Se captura antes de marcar y antes de editar/borrar repeticiones con historial; guardar Notas preserva el plan.
- Integrado sobre main (`9d5f885`) conservando las entregas D45–D54 y las migraciones v7–v9. Esta entrega usa D55. El control de programar y los objetivos respetan los permisos nuevos de Repeticiones y Actividades (D51).
- Permisos: el plan pertenece a `repeticiones`, separado de `semana`; mirar como invitada no captura. Privacidad y papelera se excluyen de los conteos. TXT, XLSX e impresión incluyen duración/meta.
- Se actualizan SPEC, DESIGN, DATA_MODEL, D55, AGENTS, HANDOFF, MIGRATION_PLAN, ROADMAP, BACKLOG, README, PRODUCT y docs/NUBE. No se creó CLAUDE.md (no existe), ni se tocaron dependencias o trabajo ajeno. Verificación y límites en docs/QA.

## 2026-10-04 · Accesos de nube preparados, credenciales de Supabase pendientes

- La CLI de Vercel quedó vinculada a `trobias-projects/micuaderno`. Se fijaron las variables públicas indicadas y se cargaron en Production y Preview los secretos generables, VAPID, su asunto y `NEXT_TELEMETRY_DISABLED`. Falta `SUPABASE_SECRET_KEY`.
- `.mcp.json` ya está en la rama. La dueña habilitó los dos MCP en su entorno web de Claude Code; el estado de `claude mcp list` en una instalación local distinta no verifica ese entorno.
- `docs/NUBE.md` registra la verificación de red, los entornos y lo que falta para aplicar la migración SQL existente. Ningún secreto se agregó a Git.

## 2026-10-06 · Celular y compu sincronizados (cache `v48`)

- Arreglado: lo que Nicole escribía en un dispositivo no aparecía en el otro. Ahora cada uno trae lo del otro, gana lo más nuevo y nunca se pisa lo que falta subir. Al abrir la versión nueva, cada dispositivo se pone al día una vez. D54.

## 2026-10-06 · Qué ven quienes miran tu cuaderno (cache `v47`)

**Para quien lo usa**
- En **Privacidad** de cada día y cada hoja (con cuenta) aparece “Qué ven quienes miran tu cuaderno”: podés esconder el día o la hoja entera, o partes: cómo arrancó, cómo terminó, el cuerpo, algo que quiero cuidar, durante el día, las reflexiones, los stickers; en una hoja, cada bloque, el papel y los stickers. En **Mi año**, “Qué ven” esconde el bastidor, las cuentas, el gráfico, lo que fui notando, los recuerdos o las victorias.
- Lo que escondés no les llega: queda solo para vos en la nube. Quien mira ya no es saludada con tu nombre: dice “Cuaderno de Nicole”.

**Para quien lo mantiene**
- `hide` en días y hojas, `hideYear` en ajustes (copia v9). `MC.sections.conceal/reveal`; pedazo `<id>~oculto` privado en `notebook_parts`; `toRows` y el push saltean lo privado para quien edita; `pullLook` trae `yearHide`. D53.
- Pruebas: 142 unit, `test:cloud` 28/28, 61/61 E2E, `e2e:cloud` 3/3.

## 2026-10-06 · QA de emociones (cache `v46`)

- Una emoción tiene el mismo color en el día, la semana, el mes y Mi año (antes podía cambiar de una vista a otra). En Ajustes, el cuadradito muestra ese color real (antes todos salían azules).
- Las sugerencias ya no repiten palabras que ya anotaste en ese lugar. El campo dice “Escribí una emoción” (en el celular se cortaba).

## 2026-10-06 · Sacar lo de fábrica (cache `v45`)

- Ajustes → Mis emociones: una ✕ en cada palabra la saca de las sugerencias (también las de base: pesado, bajito…). “Nueva hoja”: una ✕ saca una plantilla de fábrica. Las dos tienen “Volver a mostrar”. D52, copia v8.

## 2026-10-06 · Solo para mirar, sin campos para escribir (cache `v44`)

- Lo que es solo para mirar ya no parece un formulario: no aparecen “Escribí cómo te sentiste”, “agregar algo para este día”, las sugerencias, las ✕, los menús ni los botones; queda lo anotado y, si no hay nada, “Nada anotado.”. Ya no salta “no se pudo guardar” al abrir un día. Probado con 9 combinaciones de permisos en todos los cuadros.
- Arreglada una prueba intermitente (recargaba antes de que se guardara el color).

## 2026-10-06 · Quien mira: lo no compartido no se abre (cache `v43`)

- En el cuaderno de otra persona, lo que no te compartieron ni se abre: aparece “Esta parte no está compartida”. Lo que es solo para ver se abre sin poder tocar nada (campos de solo lectura, botones apagados) y cada parte dice “solo para mirar”. También en la semana del fondo. `MC.access`, D51.

## 2026-10-06 · Cerrar sesión desde el cuaderno (cache `v42`)

- Ajustes → Mi cuenta tiene **Cerrar sesión en este dispositivo** (antes había que ir a Mi cuenta). Quien mira el cuaderno de otra persona también lo tiene en el cartelito de arriba (“Cuaderno de Nicole · … · Cerrar sesión”), visible desde el calendario. Antes de salir sube lo pendiente. `MC.cloud.logout()`.

## 2026-10-06 · Editar y borrar cuentas

**Para quien lo usa**
- En Mi cuenta → Personas, **Editar** cambia el nombre, el usuario, si tiene su propio cuaderno o solo mira, si administra y si entra **sin PIN** (aunque ya tuviera uno; para volver a tener PIN se escribe uno nuevo). **Borrar cuenta…** la borra para siempre (con su cuaderno y sus fotos de la nube, si tenía), después de escribir su usuario para confirmar. Para algo reversible sigue estando “Poner en pausa”.

**Para quien lo mantiene**
- `updatePerson`, `deletePerson` (`lib/people.ts`), `dropAllMedia` (`lib/media.ts`); `PATCH`/`DELETE /api/people/:id`. D50.
- Pruebas: `test:cloud` 25/25 (cascada al borrar).

## 2026-10-06 · Emociones con parche y marcas bordadas, también en la semana (cache `v41`)

**Para quien lo usa**
- Al escribir cómo te sentiste aparecen de entrada *pesado, bajito, normal, bien, muy bien* para tener de dónde partir (después de las palabras que ya usaste).
- Cada emoción se ve como un parchecito: las de base con su dibujito de antes y las demás con una estrellita. Al cambiarle el color en Ajustes, cambia solo el fondo.
- Las marcas del calendario (escribiste, recuerdo, hecho, planeado, hoja) son botoncitos bordados, y ahora también aparecen en cada día de la semana, con sus referencias abajo.

**Para quien lo mantiene**
- `M.BASE_FEELINGS`, `M.feelingGlyph`; `c.feelingPatch`; `MC.stickers.feelingPatchMarkup`; `MC.views.calendar.parts.dayMarks/legend`. D49.
- Pruebas: 138 unit, 57/57 E2E.

## 2026-10-06 · El cuaderno compartido con los colores de su dueña (cache `v40`)

**Para quien lo usa**
- Quien mira el cuaderno de Nicole lo ve con la tela y los colores que eligió ella, aunque no tenga permiso en Ajustes. Si Nicole los cambia, cambian solos para quien mira (en menos de un minuto). Quien tiene su propio cuaderno lo sigue viendo con sus propios colores.

**Para quien lo mantiene**
- `GET /api/look` (`lib/look.ts`: solo `cover` y `theme`), `pullLook()` en `js/sync.js` para la invitada. D48.
- Pruebas: `test:cloud` 24/24 (`look.test.mjs`), E2E de la invitada con la apariencia.

## 2026-10-06 · Cuentas sin PIN

**Para quien lo usa**
- Al sumar una persona (Mi cuenta → Personas) hay una casilla **Sin PIN**: esa cuenta entra con solo elegir su nombre en `/entrar`. Quien administra siempre tiene PIN. Desde Personas se le puede sacar o poner el PIN a alguien, y una cuenta sin PIN se puede poner uno en Mi cuenta.

**Para quien lo mantiene**
- `profiles.pin_hash = 'sin-pin'` (`NO_PIN`), sin migración; `removePin`, `noPinIds`; `/api/auth/login` sin PIN para esas cuentas; `/api/people` con `noPin: true` explícito. D47.
- Pruebas: `test:cloud` 23/23; `/entrar` revisado con Supabase simulada.

## 2026-10-06 · Guardar del día, plantillas en Nueva hoja y entrada por `/` (cache `v39`)

**Para quien lo usa**
- Cada día (Hoy o cualquier otro) tiene **Guardar** arriba: *que se repita este día* (sus actividades aparecen solas en los días que elijas), *como plantilla de día* y *usar* una plantilla de día en otro (suma lo que falte, nunca pisa lo escrito).
- Las plantillas de hojas ya no aparecen sueltas en Mis hojas: están en **Nueva hoja**, con un **+** para armar una nueva y un lápiz para editar las tuyas. El Guardar de una hoja queda solo como plantilla.
- Entrar por `https://micuaderno-five.vercel.app/` vuelve a andar (antes había que ir a `/entrar`). En el ingreso se explica cómo se crea una cuenta: la suma quien administra en Mi cuenta → Personas.

**Para quien lo mantiene**
- `templates` con `kind: 'day'` y `day`; `M.getDayTemplates/dayTemplateFrom/applyDayTemplate/repeatDay`; copia `schemaVersion` 7 (aditiva). `c.askText`; `MC.repeat.editor` con `noTitle`/`dialogTitle`. D45.
- `sw.js` guarda el HTML del cuaderno solo si llegó sin redirección y, sin copia buena, deja decidir a la red; `/entrar` activa enseguida un service worker nuevo. D46.
- Pruebas: 136 unit (`day-templates`, `sw-redirect`), 57/57 E2E (“D45”, A7 actualizado), `e2e:cloud` 3/3.

## 2026-10-06 · NB2: cola de salida firme (cache `v38`)

**Para quien lo usa**
- Si el navegador se cierra justo después de escribir, lo escrito igual sube a la nube la próxima vez que se abre. Con varias pestañas abiertas, sincroniza una sola por vez.

**Para quien lo mantiene**
- IndexedDB 5: store interno `outbox` (`INTERNAL_STORES`), escrito en la misma transacción que el cambio (`store.put/del` con tercer argumento); `store.queueAll/queuePut/queueDone`. `js/sync.js` lee la cola de ahí, saca solo lo que se mandó sin cambios, migra la cola vieja de `localStorage` y usa `navigator.locks` para el cuaderno propio. D44.
- Pruebas: 130 unit, 56/56 E2E (“nube (NB2)”), `test:cloud` 22/22.

## 2026-10-06 · NB1: fotos, dibujos y adjuntos en la nube (cache `v37`)

**Para quien lo usa**
- Las fotos, los dibujos y los adjuntos ya viajan con el cuaderno: quien tiene permiso en “Fotos y adjuntos” los ve. Si alguno tarda en llegar, aparece cuando está, nunca roto.

**Para quien lo mantiene**
- `js/core/media.js` (única fuente), `lib/media.ts` y `PUT/GET /api/media`: la ficha va por la sincronización sin el contenido; el contenido, en pedazos de 3 MB a un bucket privado (`cuaderno`) que solo usa el servidor después de revisar el permiso. `js/sync.js` sube antes la foto y después su ficha, conserva lo local si es la misma versión y reintenta lo que no pudo bajar. `GET /api/sync/pull` acepta `store` + `id`. D43.
- Supabase: bucket creado y migración `20261006090000_fotos_storage` registrada; el historial ya tenía las anteriores (NB3 cerrado).
- Pruebas: 130 unit (`media-nb1`), 55/55 E2E (“nube (NB1)” con Storage simulado), `test:cloud` 22/22 (bucket privado).

## 2026-10-05 · Entrar eligiendo a la persona; nunca React

**Para quien lo usa**
- En la entrada de la nube ya no hace falta escribir el usuario: aparece la lista de personas del cuaderno, se toca la propia y se escribe el PIN. El dispositivo recuerda a quién eligió la última vez.
- Ahí mismo: **Instalar app** (si el navegador lo ofrece; en iPhone dice cómo agregarlo a inicio) y **Activar notificaciones**, que al entrar dejan ese dispositivo con los avisos de la mañana y la noche.

**Para quien lo mantiene**
- `app/entrar/page.tsx` arma la lista en el servidor (`profiles` habilitados, con `connection()`); `app/entrar/login.tsx` con radiogroup accesible, `beforeinstallprompt`, suscripción push guardada al entrar. `b64ToBytes` pasa a `app/form.tsx`. D41.
- La etapa C (React, islas, Three.js) queda **descartada para siempre** (D42). Docs al día.
- Pruebas: typecheck, build y `e2e:cloud` 3/3; la lista se revisó con una Supabase simulada local (`docs/NUBE.md`).

## 2026-10-05 · Lo próximo y lo descartado (docs)

- Decisiones de la dueña (D40): nunca la prueba con la psicóloga ni en el celular, nunca un segundo proyecto de Supabase. Lo próximo del roadmap: **fotos, dibujos y adjuntos en la nube** (NB1).
- `BACKLOG.md` suma la sección **NB** (lo que falta de la nube) y la sección **C** (qué hay en la etapa C, ítem por ítem, con su costo); `ROADMAP.md` y `HANDOFF.md` al día.

## 2026-10-05 · A13: contrato v6 (cache `v36`)

**Para quien lo usa**
- El cuaderno se ordenó por dentro: los ánimos viejos (del 1 al 5) ahora son palabras, con los nombres que vos les habías puesto, y las páginas de antes son hojas en bloques. No se ve distinto y no se pierde nada.
- En Ajustes → Mis datos aparece **“Descargar la copia de antes”**, por si querés guardar cómo estaba todo antes de ordenarlo. Cuando ya no la necesites, “Ya no la necesito”.
- Si algo no saliera bien al ordenar, el cuaderno queda como estaba, te avisa y lo vuelve a intentar la próxima vez.

**Para quien lo mantiene**
- IndexedDB 4 y `SCHEMA_VERSION` 6 (D39). `MC.backup.contractRecord/moodWords/buildPreV6/downloadPreV6`, `MIGRATIONS[6]`; `store.js` contrae en `onupgradeneeded` con instantánea `meta.preV6` y, si se aborta, abre la v3 (`store:contract-failed`). Normalizadores sin `mood`/`kind/body/items`/`moodLabels` (los leen si llegan); fuera `M.moodLabel` y los campos derivados de `savePage`. `cover` queda.
- Pruebas: 126 unit (`contract-v6.test.js`; esquema v6 en las de copia), 54/54 E2E (v2 → v4 con borrador viejo; v3 → v4 con vuelta atrás y copia de antes que se vuelve a abrir). `npm run test:cloud` sigue verde.

## 2026-10-05 · A12: QA cruzada (cache `v35`)

**Para quien lo usa**
- La leyenda del mes usa las palabras de hoy (*algo anotado, lo que se repite, título de una hoja*).
- La exportación de texto suma tus **semanas** (Importante y Notas) y dice *Mis hojas* y *Lo que se repite*.

**Para quien lo mantiene**
- `docs/QA.md`: matriz de navegación (9 secciones × ✕/Esc/afuera/Atrás + ruta directa y recarga, en 1366 y 375 px), revisión por capturas, auditorías (lógica duplicada, privacidad, exportación, impresión, PWA, accesibilidad, rendimiento) y lo que **no** se probó (Firefox/WebKit, dispositivos, lectores de pantalla, nube con dos cuentas reales).
- Pruebas: 122 unit (`export-a12`), 53/53 E2E (matriz A12 con nombres accesibles y sin scroll horizontal).

## 2026-10-05 · A11: balde y tipos de trazo (cache `v34`)

**Para quien lo usa**
- La hojita de dibujo suma herramientas: **plumilla** (más finita si vas rápido o apretás menos), **grafito**, **resaltador**, **aerógrafo** y **balde** para rellenar una zona cerrada. El lápiz de siempre ahora se llama *Técnico*.
- Todo se deshace y se rehace, y al volver a abrir un dibujo para editarlo está igual que como lo dejaste, rellenos incluidos.

**Para quien lo mantiene**
- `js/core/brush.js` (`MC.brush`: `floodFill` scanline con tolerancia, `random` con semilla, `smooth`, `pressureFrom`, `widthAt`, `sprayDots`, `graphiteStrands`). `draw.js` pinta por herramienta, guarda presión/semilla, recorta por alfa y repinta en vivo solo el trazo nuevo. Íconos nuevos `nib`, `graphite`, `marker`, `spray`, `bucket`, `eraser`.
- Pruebas: 121 unit (`brush-a11.test.js`), 52/52 E2E (recorrido A11: balde acotado, deshacer, presión, semilla, reabrir).

## 2026-10-05 · A10: escenas más seguido (cache `v33`)

**Para quien lo usa**
- Las escenitas aparecen bastante más: la primera a los pocos segundos y después cada uno o dos minutos (en *Suaves*, cada tres a cinco). Nunca mientras escribís, de a una y en el margen.
- Cuatro escenas nuevas: una **margarita** que se mece en el borde, la **esquina** de la hoja que se levanta con la brisa, una fila de **puntadas** que se cose sola y **gotas de lluvia** que resbalan por la tela.

**Para quien lo mantiene**
- `MC.scenes.delay(first, nivel, r)` concentra la frecuencia de D33; las escenas nuevas usan solo `transform` y `opacity`. Tecleo reciente: 12 s.
- Pruebas: 116 unit, 51/51 E2E (recorrido A10: frecuencia, propiedades animadas, se corta al escribir, nada en Reducidas).

## 2026-10-05 · A9: colores propios (cache `v32`)

**Para quien lo usa**
- En Ajustes, **Colores propios**: diez combinaciones listas (pasteles como *Cosmos pastel*, quebrados, neutros, un neón suave y *Noche* para escribir a oscuras) o **Elegir mis colores**: tela, hojas, tinta y cuatro acentos, con código `#RRGGBB` si querés. Degradado en la tela y acabado mate, satinado o brillante, solo si los elegís.
- Todo cambia al momento y el cuaderno cuida que se lea: si una tinta quedaba muy clarita, la ajusta y te lo dice. “Volver a la tela de la tapa” deja todo como venía.
- Si tu sistema pide alto contraste, el cuaderno lo respeta por encima de tus colores. La impresión sigue siendo tinta sobre blanco.

**Para quien lo mantiene**
- `js/core/theme.js` (`MC.theme`: presets, `derive`, `report`, contraste WCAG) y `js/ui/theme.js` (`MC.themeUI.apply`, en `<body>`; lo llama `applySettings`). Tokens nuevos `--cloth-layers`, `--on-accent`, `--field`.
- Pruebas: 116 unit (`theme-a9.test.js`: AA de cada preset, corrección, degradado, copia), 50/50 E2E (recorrido A9 con colores forzados e impresión).

## 2026-10-05 · A8: Mi año con cuentas, mes a mes y pequeñas victorias (cache `v31`)

**Para quien lo usa**
- **Lo que fui notando** ahora tiene *Esta semana · Este mes · Este año*: cuántos días escribiste, qué palabras anotaste más, cuántas cosas hiciste, cuántas pasaron a otro día, qué anotaste antes y después de algo y cuántas hojas empezaste. Solo cuentas; un período vacío también está bien.
- **Mes a mes**, debajo del bastidor: un gráfico chiquito con días escritos, días con emociones y cosas hechas, y “Ver los números” para leerlo como tabla.
- **Pequeñas victorias**: desde el menú de una actividad o de una hoja, “Es una pequeña victoria”. Aparecen en Mi año con su día (y una puntadita dorada en el bastidor). Se sacan igual de fácil.

**Para quien lo mantiene**
- `MC.insights.period/periods/byMonth/victories`; `M.markId/getMarks/isVictory/setVictory`. Los menús de actividad y hoja consultan la victoria antes de abrirse. Vista: `tallies()` y `monthChart()` en `js/views/year.js`.
- Pruebas: 111 unit (`year-a8.test.js`), 49/49 E2E (recorrido A8 nuevo).

## 2026-10-05 · A7: hojas en bloques, plantillas y Guardar (cache `v30`)

**Para quien lo usa**
- Las hojas se arman con **bloques**: renglones, lista, casillas y columnas (de 2 a 4). “Agregar a la hoja” suma uno; el `⋯` de cada bloque le pone título, lo mueve, suma columnas o lo saca. Las hojas que ya tenías se abren igual que siempre.
- Plantillas de fábrica nuevas: **Comidas del día** (Desayuno · Almuerzo · Merienda · Cena), **Pros y contras** y **Lo hecho y lo que sigue**; *Cosas que quiero probar* ahora tiene casillas y *Reflexión del mes*, tres partes con título.
- **Guardar**, en cada hoja y debajo de las notas del día: como plantilla (en blanco o con lo escrito) o **que se repita** (en blanco o con lo escrito, cada semana, mes, año o cada tantos días). La hoja aparece sola en los días que toca y se guarda cuando escribís algo; si un día no la querés, se manda a la papelera y ese día no vuelve.
- **Mis plantillas**, debajo del índice de Mis hojas: crear, editar, duplicar y mandar a la papelera. Al empezar una hoja nueva, las tuyas aparecen primero.
- En la página de un día: **Hojas de este día**, también las que se repiten, y “Agregar una hoja”.
- El aviso “Listo: va a aparecer sola…” ya no desaparece con el diálogo de repetición.

**Para quien lo mantiene**
- `js/core/templates.js` (fábrica, `instantiate`, `cloneStructure`) y `js/ui/sheet.js` (`MC.sheet.editor`). Modelo: `sheetBlocks/sheetText/sheetCount`, `getTemplates/getTemplate/saveTemplate/deleteTemplate/templateFrom/repeatSheet`, `sheetOccurrenceId/sheetOccurrences`; `getPage` arma la ocurrencia virtual, `pagesOn` y `summarize` las suman de hoy en adelante, `routineOccurrences` excluye `kind: 'sheet'`, `savePage` deriva `kind/body/items`. Ruta `#/plantilla/:id` (`MC.views.template`). `MC.repeat.editor` acepta `opts.save` y `opts.hint`. Exportar e imprimir usan `M.sheetText`.
- Pruebas: 107 unit (`sheets-a7.test.js`; ruta de plantilla), 48/48 E2E (recorrido A7 nuevo).

## 2026-10-05 · A6: Mi semana, el planner por defecto (cache `v29`)

**Para quien lo usa**
- El calendario abre en **Mi semana**, como un planner de papel: Importante · Lunes · Martes / Miércoles · Jueves · Viernes / Sábado · Domingo · Notas. En el celular, una columna con hoy a la vista. El mes queda a un toque, y lo que elijas dura hasta cerrar el cuaderno.
- En cada día se anota y se marca ahí mismo, sin abrir nada; el menú de cada cosa es el de siempre (antes/después, pasar a otro día, que se repita…). Lo que anotás en un día que ya pasó nace hecho. En los días pasados nunca aparecen las repeticiones que no marcaste.
- **Importante** (con casillas) y **Notas** son de la semana y se guardan solos.

**Para quien lo mantiene**
- `js/views/week.js` (nuevo) reemplaza la semana de `calendar.js` (que exporta `parts.modeSwitch` y `parts.monthsStrip`). `M.getWeek`, `M.saveWeek`, `M.isEmptyWeek`. `MC.routes.parse` abre la semana por defecto (`ctx.calMode`, `ctx.calWeek` desde `sessionStorage`). Contrato de vista base con `busy()` y `flush()`; foco restaurado con `data-focus`. La etiqueta de las actividades que se repiten dice “se repite”.
- Pruebas: 101 unit (semana del planner; rutas por defecto), 47/47 E2E (recorrido A6 nuevo; los que suponían el mes de fondo ahora lo eligen).

## 2026-10-05 · A5: cuatro marcadores y Mis hojas (cache `v28`)

**Para quien lo usa**
- Quedan cuatro marcadores: **Hoy · Mis hojas · Mi año · Ajustes**. Agenda y Rutinas dejaron de ser marcadores; no se perdió nada.
- **Mis hojas** reúne el índice de hojas y **Lo que se repite** (también lo que está en pausa, para retomarlo).
- Desde el menú de cualquier actividad: **Que se repita…**, con los valores de ese día y la opción nueva **Todos los años**. La actividad pasa a ser la primera vez de la repetición. En lo que ya se repite: *Cambiar cómo se repite…*, *Dejar de repetir* (desde ese día; lo marcado queda) y *Ver en el calendario*.
- Las direcciones viejas siguen andando: la Agenda lleva a la semana; Rutinas y Páginas, a Mis hojas.

**Para quien lo mantiene**
- Nuevos `js/views/sheets.js`, `js/ui/repeat.js` (`MC.repeat.editor`) y `js/ui/privacy.js` (`MC.privacy`, antes en `pages.js`). Fuera `js/views/agenda.js`, `js/views/routines.js`, `model.upcoming` y el CSS de la agenda. Rutas: `MC.routes.sheets()`, `routine(id)` → `#/hojas/repite/:id`; `parse` devuelve `{ redirect }` para `#/agenda`, `#/rutinas[/:id]` y `#/paginas`, y el router los reemplaza sin sumar historial.
- Pruebas: 100 unit (rutas con redirecciones), 46/46 E2E (recorrido A5 nuevo: cuatro marcadores, redirecciones, repetir desde una actividad con regla anual, pausar, hoja con su día; la prueba de borrar → abrir otra hoja sigue en verde).

## 2026-10-05 · Cuadernos compartidos: la psicóloga entra al cuaderno de Nicole (cache `v27`)

**Para quien lo usa**
- Al sumar una persona en Mi cuenta, Nicole elige si **mira su cuaderno** (por defecto) o **tiene uno propio**. Después decide, sección por sección, qué puede ver y qué puede editar.
- Quien mira entra con su usuario y PIN y ve el cuaderno de Nicole, solo con las secciones permitidas, y arriba un aviso de quién es y qué puede editar. Lo que no puede cambiar no se guarda y se le dice con amabilidad. No queda copia en su dispositivo.
- El cuaderno de Nicole se guarda solo en la nube cada vez que escribe, y lo que edita alguien con permiso le llega a ella. Fotos y adjuntos todavía no se comparten.

**Para quien lo mantiene**
- `js/sync.js` (nuevo), `js/cloud.js` (cookie `mc_view`, modos `owner`/`guest`), `MC.sections.splitAll`/`overlay`/`keyOf`/`sectionsOf`, `/api/sync/push`, `/api/sync/pull`, `/api/me` con `hasNotebook` y `shares`. Migración `20261005090000_cuadernos_compartidos.sql`, aplicada en Supabase. D38.
- Pruebas: 100 unit, 46/46 E2E (Nicole sincroniza y recibe lo editado por la psicóloga; la psicóloga ve, edita solo lo permitido y recibe el aviso), 21 de nube, typecheck, build y humo.

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
