# MI CUADERNO — Plan de ejecución vigente

Estado: 2026-10-04. Este archivo permite continuar sin acceso a conversaciones ni al plan externo `fluffy-finding-grove.md`. Leé primero `AGENTS.md` y `HANDOFF.md`. `SPEC.md` describe lo que funciona **hoy**; `DECISIONS.md` D27–D37 fija el destino aprobado. No confundas contrato de datos v5 con funciones ya visibles.

## Pedido y dirección aprobada

La dueña pidió: semana tipo planner como calendario inicial (referencia: grilla con Importante, lunes a domingo y Notas; actividades con antes/después); emociones escritas; tapa y cuaderno con colores y códigos propios; sacar Agenda y Rutinas de los marcadores; convertir Páginas en **Mis hojas**, con plantillas aplicables a días y botón Guardar para repetir; más escenas; corregir el índice de páginas; Mi año con observaciones, estrellas y gráficos amables; balde y trazos de dibujo; sacar sombras y “Cuánto ocupa”; revisar todas las conexiones y el regreso al calendario. Después pidió nube en Vercel con Next.js/React/TypeScript + Supabase, cuenta con usuario y PIN, Nicole admin, roles por sección, PWA y push, con copia local offline. La migración aprobada es **A (cuaderno actual) → B (cuenta y nube) → C (vistas React una por una)**.

La referencia visual de la segunda imagen era una paleta pastel (`#F2CFD7`, `#D6E6E5`, `#D1D171`, `#FEE088`). Son inspiración para el futuro editor de temas, no los colores obligatorios de fábrica. Las dos imágenes originales no están guardadas en este repo; no afirmar que se comparó pixel a pixel contra ellas. La identidad vigente es el cuaderno de tela y papel de `DESIGN.md`, nunca una plantilla genérica de dashboard.

## Estado de la etapa A

| Paso | Estado | Evidencia / salida |
|---|---|---|
| A0 · Base segura | Hecho | `34e9b6e`: pestaña vieja, `VersionError`, guardado antes de cambio de versión. |
| A1 · Navegación y bugs | Hecho con seguimiento abierto | `cc7697d`: escenas al salir de Decorar, menús, doble cierre, ruta directa, `trail` en sesión; E2E del índice de Páginas. El síntoma original del índice sigue en investigación: [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md). |
| A2 · Limpieza visual | Hecho | `4f124d7`: sin sombras en stickers/dibujos, fuera “Cuánto ocupa”, colores en tokens. |
| A3 · Esquema v5 aditivo | Hecho | `a39dad2`: IndexedDB v3, stores `weeks/templates/marks`, campos `feelings`, `feel`, `moves`, bloques de hojas, tema, regla anual, IDs de ocurrencia. Lo nuevo en el esquema **no implica** UI terminada. |
| A4 · Emociones escritas | Hecho | Día, Actividad, Calendario, Año, Ajustes, observaciones, exportación, impresión y recordatorios con lectura de copias viejas. `npm run check`: 94 unit y 43/43 E2E Chromium; ver `CHANGELOG.md`. |
| Índice de Páginas | Hecho en Chromium | `58ed3c9`: `MC.motion.swap` anima la hoja nueva, no el contenedor; 1/6 → 0/9. Ver [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md). |
| B-base (adelantada) | Hecho en local, sin desplegar | Next.js + Supabase: cuentas con PIN, Nicole admin, permisos con RLS, push y latido. Ver [`docs/NUBE.md`](docs/NUBE.md) y D37. |
| A5 · Marcadores y Mis hojas | Hecho | Cuatro marcadores, `#/hojas` con índice y repeticiones (también en pausa), `MC.repeat.editor` (anual), redirecciones de rutas viejas; fuera agenda.js/routines.js. Cache v28. |
| A6 · Semana-planner | Hecho | `js/views/week.js` por defecto, Importante/Notas en `weeks`, anotar y marcar en el fondo con `busy/flush`, D18 en el pasado. Cache v29. |
| A7 · Hojas, plantillas y Guardar | Hecho | `MC.sheet.editor` (renglones/lista/casillas/columnas), `js/core/templates.js`, Mis plantillas y `#/plantilla/:id`, Guardar (plantilla / que se repita, en blanco o con lo escrito), ocurrencias `pag_<rep>_<fecha>` virtuales. Cache v30. |
| A8 · Mi año | Hecho | `MC.insights.period/byMonth/victories`, victorias con `marks` de id fijo desde actividad y hoja, gráfico SVG + tabla. Cache v31. |
| A9–A13 | Pendiente | Orden y criterios debajo. |

### A5 · Menos marcadores y Mis hojas inicial

Quedan Hoy · Mis hojas · Mi año · Ajustes. Eliminar Agenda y Rutinas como marcadores, conservando **todos sus datos** y el motor `js/core/recurrence.js`. `#/agenda` debe redirigir a la semana; rutas antiguas de Rutinas/Páginas a Mis hojas. Mis hojas debe reunir índice actual y repetición, incluso pausadas. Extraer un editor de repetición (`MC.repeat.editor`) reutilizable desde actividades y hojas; empezar con valores de la fecha abierta, contemplar regla anual. Conservar el filtro de calendario por repetición. Si se eliminan scripts, quitarlos de `index.html` y `sw.js` `SHELL`; subir caché. `today.js` hoy toma privacidad de `pages.js`: extraer antes de borrar esa vista. Actualizar rutas, unitarias y E2E de navegación; comprobar que no haya rutinas huérfanas. Antes de reemplazar el índice, leer [`PAGES_INDEX_INVESTIGATION.md`](PAGES_INDEX_INVESTIGATION.md) y conservar la prueba de borrar → abrir otra hoja sin salir al calendario.

### A6 · Semana planner inicial

`#/calendario` abre la semana actual, con elección de mes/semana persistida durante la sesión. La grilla amplia: Importante · Lunes · Martes / Miércoles · Jueves · Viernes / Sábado · Domingo · Notas; dos columnas en tablet y una en móvil. Los días muestran actividades editables mediante `MC.activityRow`, emociones antes/después y hojas; renglón discreto para añadir. Importante y Notas se guardan en `weeks` con borrador. Reutilizar `summarize`, `routineOccurrences`, `D.startOfWeek` y los enlaces por fecha. Nunca mostrar en días pasados las repeticiones virtuales sin marcar (D18). Al abrir/cerrar un día, restaurar selección y foco; no reemplazar un campo del fondo mientras se escribe (`app.js` refresca `#main`). E2E desktop/móvil, teclado y cierre desde todas las rutas.

### A7 · Hojas de día, plantillas y Guardar

Crear un solo editor de hoja para día, página suelta y plantilla; bloques renglones, lista, casillas y columnas, papel y stickers. Plantillas de fábrica y propias. En un día: hojas reales, ocurrencias virtuales de hojas repetidas y “Agregar una hoja”. Botón Guardar: como plantilla y/o que se repita semanal, mensual, anual o intervalo; ofrecer repetir en blanco o con contenido. Reusar rutinas (`kind:'sheet'`) y la plantilla congelada; materializar ocurrencias con ID determinista. Borrado a papelera con restauración; el índice debe seguir respondiendo después de borrar, incluso con teclado y táctil. Actualizar `summarize`, notificaciones, impresión, exportaciones y copia.

### A8 · Mi año con observaciones, estrellas y gráficos

Bastidor con emociones escritas y leyenda. “Lo que fui notando” por semana, mes y año: hechas, movidas (`moves`), días escritos, palabras anotadas y antes/después de actividades, siempre conteos descriptivos, sin diagnóstico ni causalidad. Estrellas discretas por lo hecho y victorias manuales con referencias `marks`; cada una enlaza al día. Gráficos SVG propios y tabla accesible para los mismos datos. Respetar `noInsights`/`noReviews`, papelera y permisos futuros desde el origen del dato; nada de rachas, puntajes o castigos.

### A9 · Colores propios

Editor en Ajustes de tema: presets pastel, quebrados, neutros, neón, etc.; color hex por superficie y acentos, degradado y acabado mate/satinado/brillante solo a elección de la persona. `theme` ya existe en v5, pero falta el motor y la UI. Contraste AA para texto y controles, vista previa, restablecer, guardado y copia. El modo de fábrica sigue siendo tela lisa. Impresión y alto contraste ganan sobre el tema; los hilos de emociones son independientes del tema.

### A10 · Escenas frecuentes con propósito

Aumentar frecuencia desde `MC.scenes`; ampliar escenas relacionadas con papel, bordado y paso del tiempo. Una escena a la vez, breve (≤8 s), nunca al teclear, con la pestaña oculta ni en motion Reducidas/Ninguna. Probar foco, scroll, rendimiento y `prefers-reduced-motion`. Three.js es opción para **C**, si SVG/CSS no alcanza, con carga diferida y fallback: no agregarlo por novedad.

### A11 · Dibujo

Activar el balde y herramientas del contrato v5: técnico, plumilla con presión, grafito, aerógrafo y resaltador, priorizando los útiles y viables. Guardar trazo, presión, semilla y pasos de relleno para poder reabrir; no rasterizar el original editable. Test de relleno acotado, deshacer/rehacer, puntero y táctil. Mezclador, óleo y otras simulaciones complejas quedan experimentales.

### A12–A13 · Revisión y contrato v6

A12: matriz E2E de pasar entre todas las secciones y **volver al calendario** (✕, Esc, clic fuera, Atrás, ruta directa, recarga, 375 px). Auditar lógica duplicada, privacidad, exportación, impresión, PWA, accesibilidad y rendimiento. Revisar con capturas 1366×900 y 375×812 contra `DESIGN.md`. Probar WebKit/Firefox y dispositivos reales cuando haya navegadores/dispositivos disponibles; no etiquetar eso como probado si solo corrió Chromium. A13: recién al terminar A, migración v6 que retira formas viejas (`mood`, `kind/body/items`, `cover`, `moodLabels`) con copia previa, actualización atómica de IndexedDB, `MIGRATIONS[6]`, test de actualización v5→v6 y rollback seguro.

## Etapa B · Cuenta, nube y permisos

**Estado (04/10/2026):** a pedido de la dueña se adelantó lo que no depende de la forma de los datos (B1, B3–B4, B6 sin dispositivos reales, la parte de B2 sin Storage y el latido anti-pausa): ver [`docs/NUBE.md`](docs/NUBE.md) y D37. Quedan B5 (sincronización, después de A7), Storage, preview protegida, el deploy y las pruebas en dispositivos (B7–B8).

1. **B1 estructura:** Next.js/TypeScript en raíz; cuaderno probado a `public/` conservando sus rutas mientras se migra; ajustar herramientas, CSP, SW y tests. Nunca cachear API ni páginas de login como shell offline del cuaderno.
2. **B2 datos:** Supabase Postgres con migraciones versionadas, RLS en todas las tablas, Storage privado. Separar los datos por sección **en servidor** para que lectura de `emociones` no entregue escritura. Mapa de campos por defecto denegado, prueba que falla al aparecer un campo nuevo sin clasificación. Privacidad “Solo para mí” también en adjuntos y referencias del día.
3. **B3–B4 identidad:** usuario + PIN de 6, hash Argon2id con secreto servidor, demoras progresivas y respuestas indistinguibles. El PIN no debe ser credencial directa adivinable en Supabase. Nicole admin; crear personas y dar sin acceso/ver/editar por sección, incluidas excepciones de solo lectura para su psicóloga. Comprobar autorización en servidor y RLS, no solo ocultar botones. Auditar altas y cambios de permisos sin contenido personal.
4. **B5 sincronización:** IndexedDB sigue como copia offline por persona. Outbox y cambio local en una transacción; lápidas para borrados; una pestaña sincroniza; reintentos e idempotencia; importación `.json` existente sin pérdida de texto, porque `file://` y HTTPS usan orígenes distintos. Acceso invitado en solo lectura y sin copia local persistente. Definir semántica de restaurar/borrar en nube antes de implementar.
5. **B6 push/PWA:** Web Push activado por la persona, zona horaria, entrega idempotente y mensajes sin contenido escrito. Instalada/offline y login probados en dispositivos reales.
6. **B7–B8 entrega:** proyecto Supabase separado de otros proyectos y entorno preview aislado; secretos solo en entorno seguro; preview protegida, pruebas RLS/pgTAP, E2E de dos dispositivos y revisión de seguridad antes de producción. Crear proyectos, servicios y desplegar son cambios externos: confirmar con la dueña antes de cada uno.

Verificar versiones vigentes y documentación oficial de Next.js, Supabase y Vercel al continuar B; las versiones fijadas en el plan de 03/10/2026 pueden haber cambiado. No instalar paquetes globales ni `latest` mutable. La base B1–B4 y B6 está implementada en local (D37), con migración SQL versionada; `docs/NUBE.md` registra el acceso comprobado y lo que falta para autenticar Supabase, aplicar la migración y verificar un despliegue nuevo. B5 y la entrega B7–B8 siguen pendientes.

## Etapa C · React y escenas 2.0

Convertir lógica `js/core` en módulos compartidos; mantener paridad de test. Montar vistas React una por una en el shell existente: Ajustes → Año → Mis hojas → Semana/Mes → Día → scrapbook/dibujo; borrar la vista vieja solo cuando la nueva pasa sus recorridos. Al final migrar el shell. Motion/Three.js solo para interacciones justificadas por el cuaderno, cargadas a demanda, con fallback sin WebGL, limpieza de recursos y pausa al salir; las referencias de componentes del pedido son inspiración, no material para copiar tal cual.

## Regla por entrega y evidencia

Leer `AGENTS.md`, `DESIGN.md`, `DATA_MODEL.md` y la decisión relevante. Definir contrato y migración antes de cambiar datos. Cambiar todos los consumidores, backup, papelera, exportación, impresión y tests juntos; nunca dejar campos nuevos adelantados a la UI. Reusar `MC.routes`, `MC.model.summarize`, `routineOccurrences`, `MC.c`, `MC.activityRow`, `MC.scenes`. Ejecutar el script real `npm run check` (sintaxis + unitarias + Chromium E2E `file://`/HTTP), revisar consola y responsive. Subir `CACHE_VERSION` por cambios de shell. Registrar lo hecho en `CHANGELOG.md`, estado en `BACKLOG.md`/`ROADMAP.md`, especificación y diseño si cambiaron. Un commit por cambio estable y push a `main` según instrucción de la dueña; no reescribir historia ni borrar datos/ramas sin autorización.
