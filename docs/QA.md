# QA cruzada (A12) — 05/10/2026

## Actualización del 08/10/2026 · Continuidad y confirmación (D63, cache v81)

- Dos interacciones nuevas y un refinamiento del calendario existente; sin dependencias ni cambios de datos (copia v13/IDB 5).
- Recorridos enfocados **3/3**: foto a 1280/375 px con entrada muestreada a mitad de animación, cancelación por zoom, teclado y sistema reducido; calendario con dirección, interrupción, cambio de mes y alternativas estáticas; recuerdo persistido antes del aviso, enlace a Mi año, teclado, sistema reducido y error de guardado sin falsa confirmación.
- Capturas sintéticas revisadas: foto en tránsito y aviso a 375 px. Se corrigió el ancho del aviso ilustrado para evitar texto apilado; conserva acción Ver y queda fuera del editor cerrado. No se usaron datos personales.
- `npm run typecheck`, build de producción y `npm run e2e:cloud` **3/3** aprobados con Next local.
- `npm run check`: sintaxis de **50** scripts y **172/172** unitarias aprobadas; corrida completa **78/79**. D59 agotó la espera después de recargar: consultaba la tapa antes de terminar el arranque. Pasó al repetirlo; se reemplazó la consulta inmediata por una espera explícita de tapa/álbum. Los recorridos D62/D63 pasaron dentro de la corrida completa. No se presenta esa corrida como 79/79.
- D59 volvió a pasar **1/1** después de corregir su espera (file/HTTP, escritorio/375 px); no cambió código de producción para resolver ese fallo.

### Revisión de animaciones

| Antes | Después | Por qué |
| --- | --- | --- |
| Foto abría sin continuidad con su miniatura | Imagen con escala uniforme y recorrido desde la miniatura; marco estático, 260 ms (`js/ui/viewer.js:92`) | Conserva el origen visual; zoom/cierre cancelan la entrada sin bloquear controles. |
| Calendario ya deslizaba al navegar | Misma dirección, token de 260 ms y cancelación; teclado/sistema reducido estáticos (`js/app.js:205`) | Evita duplicar la interacción y movimiento innecesario al usar teclado. |
| Aviso de recuerdo podía desaparecer con el editor | Aviso en capa activa y papel entrando al bolsillo, 200 ms, solo tras persistir (`js/ui/memories.js:23`) | Confirma una operación real sin retrasarla; fallo no genera celebración. |

**Veredicto: Approve.** Solo transform/opacity, easing existente, duración acotada, sin loops nuevos; teclado y preferencias reducidas tienen alternativa estática. Se comprobaron cuadros intermedios en Chromium, no fluidez en dispositivos físicos. No se midió la sesión de la psicóloga, la demora de descarga ni Production.

## Actualización del 08/10/2026 · Interacciones de papelería (D62, cache v78)

- Selección de 19 componentes, cada uno en un commit; adaptación propia en JS/CSS clásicos, sin instalaciones. Mapa en `docs/BEUI.md`. Copia v13 aditiva por orden de rutinas; IndexedDB 5.
- `npm run check` aprobado: sintaxis de **50** scripts, **172/172** unitarias y **77/77** recorridos de Chromium. Incluye file/HTTP, móvil, offline, copias/historial, motion y matriz de permisos. La matriz D51 distingue controles concretos de lectura (búsqueda/filtros/mosaico/visor/descarga) de edición; las demás comprobaciones siguen vigentes.
- Nuevos D62 **4/4**: carpetas y búsqueda con tildes, privacidad y actualización; fotos desde bolsillo y collage, zoom/restablecer/foco al cerrar, períodos y mosaico con flechas (1280 y 375 px); reordenar con teclado, recarga, límites menos/más y diálogo móvil; cola con error síncrono, reintento sin duplicar éxitos y cierre mientras termina el archivo actual.
- `npm run typecheck` y `npm run build` aprobados. `npm run e2e:cloud` **3/3**: shell/CSP, entrada a 375 px y API sin sesión. El ingreso comprueba máscara, borrado, entrada completa, validez, selección de casilla y edición del PIN en el único campo real. No cambia contratos de autenticación.
- Revisión visual en navegador y capturas sintéticas del año a 1280 y 375 px: bolsillos pastel, fotos y leyenda compacta, sin desborde horizontal. El menú de decorar muestra sus cuatro acciones; la página del día muestra sus cinco rutinas al entrar. Capturas reproducibles con `E2E_CAPTURE`; no contienen datos reales del cuaderno.
- La primera corrida completa dejó **72/73**: la matriz antigua trataba filtros de lectura como edición. La primera corrida enfocada detectó además errores de fixture/espera nativa. Se corrigieron esos casos, el visor que perdía su lista al añadir collage y una carrera real al cerrar la cola. Corridas finales completas y enfocadas en verde; no se omiten recorridos.
- Revisión de motion: puntadas/contadores/confirmación interrumpibles, tokens y guardas de Ajustes/sistema, sin loops nuevos. Las carpetas neutralizan desplazamiento/rotación en Reducidas/Ninguna; el PIN respeta el sistema reducido. No se midieron todos los gestos en un dispositivo físico.
- Límites: nube comprobada con servidor Next local y fixtures de permisos; no se usaron sesiones ni datos reales de la psicóloga. No se mide ni optimiza la espera de unos 20 s, no se verifica Production y no se cambia la descarga/sincronización. La búsqueda no indexa binarios ni colecciones; el collage carga por tandas y los gestos de actividad solo abren opciones.

## Actualización del 08/10/2026 · Skeleton loader and reveal (D61, cache v57)

- Adaptación de la receta de transitions.dev: pulso real de opacidad 1 → 0.5 en las casillas; el texto mantiene opacidad 1. Cruce de capas de 260 ms al llegar el calendario listo, sin espera mínima. Conserva mariposa y favicon D60.
- Recorridos D61 2/2: escritorio/375 px con descarga retenida; muestreo de opacidad intermedia durante el reveal, capa saliente inerte/aria-hidden, hit-test sobre el día durante el fundido y apertura con teclado después de limpiar. Reducidas/Ninguna se guardan realmente en Ajustes, se recarga reteniendo IndexedDB y se verifica el recuerdo de UI antes de abrir. D60 sigue cubriendo reduced-motion del sistema, apariencia/calendario retenidos, reintento tras fallo y sin JavaScript; el fallo ahora también comprueba cero animaciones.
- Capturas revisadas a 1366 y 375 px: papel crema, mariposa legible, pulso pastel de las casillas, sin overflow. Los tests D61 observan animaciones del navegador, no solo las clases CSS.
- `npm run check` completo aprobado: sintaxis de 47 scripts, 170/170 unitarias y 73/73 recorridos en Chromium local. Incluye file/HTTP, PWA/offline, base bloqueada/nueva, permisos y los recorridos D60/D61.
- `npm run typecheck`, `npm run build` y humo de Next (`npm run e2e:cloud`) aprobados, 3/3. Sin dependencias nuevas, cambios de esquema, credenciales o servicios.
- Revisión de motion con animate/review-animations: aprobada para la apertura, opacidad únicamente, tokens del cuaderno, fin/limpieza y guard de reduced-motion. El pulso continuo es feedback de carga solicitado por la dueña, pausado en pestaña oculta; no es una escena ambiental ni se repite al escribir.

| Receta de referencia | Adaptación aplicada | Motivo |
| --- | --- | --- |
| Reveal de 400 ms y blur | `--dur-panel` (260 ms), `--ease-out`, solo opacidad | Cohesión del cuaderno y evitar difuminar toda la hoja |
| Ambas capas absolutas | Calendario en flujo; solo espera saliente absoluta/inerta | Altura natural y controles utilizables al llegar datos |
| Un pulso de demostración | Pulso mientras carga; pausa/fin explícitos | La espera real puede durar más de un segundo, sin fingir un porcentaje |

- La primera corrida enfocada D60 detectó una expectativa antigua de retiro inmediato: ahora el recorrido espera que termine el fundido antes de comprobar retiro. No se alteró la comprobación de fallo, calendario vacío ni reintento.
- Pedidos de nube simulados; no mide los 20 s de la sesión real ni confirma Production. La entrega mejora la transición, conserva la descarga completa existente.

## Actualización del 08/10/2026 · carga con mariposa y favicon (D60, cache v56)

- La hoja de espera existe desde index.html: mariposa pastel, estado accesible y esqueleto decorativo estático. Sin animaciones, porcentajes inventados o espera mínima. Favicon SVG transparente y PNG/ICO legibles sin medallón; arte maestro separado de los iconos de instalación.
- Recorridos D60 enfocados 3/3: invitada con descarga y apariencia retenidas, primer calendario retenido hasta ready, recarga en 1366 y 375 px; error real de API simulada 503 con reintento por teclado; sin JavaScript conserva el aviso; SVG publicado coincide con el maestro y PNG/ICO contienen 16/32/48 px.
- Capturas revisadas en escritorio/celular y comparación del favicon en sus tamaños reales. Sin overflow horizontal ni errores de JavaScript en la apertura correcta; movimiento reducido conserva todo quieto. Un fallo de descarga inicial no abre un calendario vacío.
- Se detectó y corrigió un botón Recargar duplicado en VersionError: se mantiene el único botón del aviso existente de la base. Recorrido A0 enfocado aprobado tras la corrección.
- Gate final `npm run check` aprobado: sintaxis de 47 scripts, 170/170 unitarias y 71/71 recorridos Chromium, incluidos los tres D60 y las regresiones de tapa, calendario, persistencia, PWA y permisos. La primera pasada encontró el duplicado de Recargar; se repitió la suite completa después de corregirlo.
- `npm run typecheck` y `npm run build` aprobados; humo de Next 3/3 con Chromium local. El primer intento del humo usó la ruta Linux por falta de CHROMIUM y no inició el navegador; se repitió con el ejecutable local instalado. Sin dependencias o servicios nuevos.
- Los pedidos de la nube se simulan en los recorridos. No se midieron los 20 s de la sesión real ni se optimizó su descarga; esto verifica feedback de espera, permisos existentes y recuperación. No confirma una sesión de Production, otro navegador o un dispositivo real.

## Actualización del 08/10/2026 · conteos sin «N un poquito» (cache v55)

- Resumen, metas individuales y victorias semanales de Mi año omiten el añadido. El nombre accesible de las barras conserva completas, medios avances y porcentaje; el relleno y las estrellas mantienen D58.
- `npm run check` con `E2E_GREP=D58:`: sintaxis de 47 scripts, 170/170 unitarias y recorrido D58 aprobado en file/HTTP, escritorio/375 px. Verifica ausencia del añadido en conteos y Mi año, media barra amarilla, mezclas, recarga y estrellas. No se repitió la suite completa.
- Revisión visual adicional en 1366 y 375 px: sin errores JavaScript ni overflow; rellenos pastel, 24 px y colores forzados intactos.
- Investigación de la demora al reabrir una invitada: `store.init` espera permisos, `pullLocked(true)` completo, contenido de medios y apariencia antes de renderizar. La base de la invitada es memoria y se rehace al reabrir; `apply` procesa registros en serie. Se identificó el bloqueo en código, sin medir la sesión real ni atribuir tiempos concretos a Supabase/Vercel. La carga no fue modificada en esta entrega.

## Actualización del 08/10/2026 · barras pastel (cache v54)

- Barras individuales de 24 px: menta para completas y manteca para medios avances. Contorno suave y esquinas de 6 px; texto y glifos de estado conservan sus hilos oscuros.
- `npm run check` con `E2E_GREP=D58:`: sintaxis de 47 scripts, 170/170 unitarias y recorrido D58 aprobado en file/HTTP, escritorio/375 px. Tres parciales conservan 3/3 y media barra amarilla; mezclas y recarga conservan sus cuentas. La aserción de color del recorrido se actualizó al nuevo amarillo pastel.
- `npm run e2e` con `E2E_GREP=D59:`: recorrido D59 aprobado en file/HTTP, escritorio/375 px, incluyendo barras grandes, álbum y copia. No se repitió la suite completa de 68 recorridos para este ajuste de CSS.
- Revisión visual adicional con avances completos, parciales y mixtos en 1366 px y 375 px: barras de 24 px, sin errores de JavaScript ni overflow horizontal. Colores forzados reemplazan el pastel por los colores del sistema; conserva descripción accesible del conteo. Sin dependencias, datos nuevos o migración.
- `npm run build` aprobado; copia los estilos del cuaderno al shell publicado por Next. Esta verificación local no confirma la actualización de Production.

## Actualización del 08/10/2026 · álbum anual y barras grandes (D59)

- Copia v12 aditiva, IDB 5, cache v53. Nuevo script clásico memories.js en index y shell; ninguna dependencia/SQL nueva.
- Unitarias: 170/170 en npm test final. Casos D59: IDs estables y compatibilidad, v11→v12 y referencia ida/vuelta en copia, category/note saneados, días vacíos elegidos, imágenes solo desde fuente visible, papelera/privacidad, primera vez entre años, partial/done y estados que no generan momentos, creación terminada, deduplicación manual y TXT con exclusiones. Reafirmar una victoria conserva las palabras elegidas.
- E2E D59 enfocado aprobado en file:// 1366×900 y HTTP 375×812: victoria personal, repetición especial señalada antes de marcar Un poquito, hoja terminada, recuerdo con imagen/enlace, agrupación por mes, recarga sin duplicados, copia válida, barras individuales de al menos 16 px, sin overflow horizontal ni errores de consola. Primera recarga vuelve a la tapa, siguiendo el ritual existente; abrirla restaura la vista.
- npm run check: sintaxis de 47 scripts, 169 unitarias al comenzar el gate y 68/68 recorridos Chromium aprobados; la quinta prueba nueva de exportación y el ajuste de conservación de palabras se validaron después con npm test (170/170) y node --check. npm run typecheck y npm run build: exit 0; build final tras el ajuste de modelo: exit 0. npm run e2e:cloud: 3/3 humo local. Revisión visual de barras y álbum en 1366/375 px con capturas sintéticas de Nicole, sin imágenes o datos reales.
- Fuentes no compartidas no se renderizan y sin permiso de fotos no hay miniaturas. category/note se clasifican en anio como elecciones independientes. No se verificaron cuentas/dispositivos reales ni entrega autenticada de datos de producción; se mantiene D40.
- Revisión final: miniaturas con dimensiones reservadas para evitar saltos al cargar. D59 repetido tras ese ajuste y conservación de palabras: 1/1 (file/HTTP, desktop/móvil); A8 anterior: 1/1. node --check year/model/e2e y build final: exit 0. Capturas revisadas de Progreso y Mi año en 1366/375 px.

## Actualización del 08/10/2026 · Medios avances y victorias (D58)

- Base `main` en `80d1b33`. Copia **v11**, cache **v52**, IDB **5**, sin nueva persistencia ni SQL.
- Casos específicos aprobados: 3 Un poquito → **3/3**, value **1,5/3**, **50 %** amarillo, estrella y una victoria en Mi año; enlace a la semana y recarga. Mezcla de 1 completa + 2 parciales → **67 %** con verde/amarillo, y 3 completas → **100 %** verde. Se mide ancho real del segmento amarillo (50 % del interior).
- E2E específico en `file://` a 1366×900 y HTTP a 375×812: menú de estados desde la página del día, título Progreso, estrella SVG reutilizada, sin estrella antes de 3/3, sin animación con movimiento reducido y efecto con opacity/transform, duración 200 ms, sin loops. Sin errores de consola ni scroll horizontal.
- Unitarias de límites flexibles, prioridad de completas sobre parciales extra, mezcla/agrupación, estados que no avanzan, privacidad, papelera, primera fecha de victoria, historial sin rutina vigente y recálculo sin duplicados ni nuevos marks. Referencias manuales conservadas, sin duplicar una meta de 1/1 ya elegida.
- **Gate `npm run check` aprobado:** sintaxis de 46 scripts, **165/165 unitarias y 67/67 E2E**. Se volvió a ejecutar el conjunto unitario tras agregar la guarda de rutinas sin plan/regla (permiso parcial): 165/165. Tipos y build aprobados; humo de Next **3/3**. Tests de nube **14 aprobados y RLS omitida** por falta de Postgres local.
- Revisión visual de escritorio y 375px con registros sintéticos de Nicole: título Progreso, barras mezcladas verde/amarillo, meta parcial 3/3 al 50 %, estrellas y controles legibles, sin scroll horizontal. SVG y tokens existentes, sin instalar dependencias. Documentación contractual, AGENTS, HANDOFF, README, CHANGELOG y ruta/backlog actualizados.

**Límites:** pruebas locales; no se prueban cuentas/dispositivos reales, RLS remota ni lectores de pantalla. No se inventan reglas históricas borradas; los planes capturados siguen siendo la fuente.

## Actualización del 08/10/2026 · Agrupación y visibilidad final (D57)

- Base `main` en `e9cd5a2` (D56 ya pusheado). Copia **v11**, cache **v51**, IDB **5**; sin cambio persistente ni SQL.
- Unitarias específicas: tres Trabajar sueltos → una barra 0/3 y luego 1/3; combinación de varias repeticiones y actividades propias por nombre con límites flexibles intactos; filtro de los cinco estados, hojas conservadas y resumen general sin alterar. **162/162 unitarias aprobadas**.
- Cuatro recorridos de objetivos aprobados en la ejecución específica. D57 verifica mes y semana en pasado/hoy/futuro con los cuatro estados visibles y pending oculto; barra agrupada, marca por teclado desde la página del día, recarga y elección de la repetición a editar. `file://` a **1366×900** y HTTP a **375×812**, sin errores de consola ni scroll horizontal. D55/D56 conservan historial, frecuencias, alta, edición y borrado; las pruebas marcan ahora desde la página del día.
- `npm run typecheck` y `npm run build`: exit 0. `npm run e2e:cloud`: **3/3** comprobaciones locales aprobadas. `npm run test:cloud`: **14 aprobadas y 1 omitida**, RLS sin Postgres local.
- Capturas de mes y semana en escritorio y 375px con registros sintéticos de Nicole: barras dentro de Importante, conteos N/M, sin filas Sin marcar ni desbordamiento. Mes con glifos de parcial/otro día/hoy no salió y leyenda correspondiente.
- **Control completo `npm run check`: sintaxis aprobada (46 scripts), 162/162 unitarias y 66/66 recorridos E2E aprobados.** Tipos, build y humo de Next también aprobados. No hay script de lint adicional en el proyecto.

**Límites:** QA local de Chromium y humo local de Next; sin verificación de Production, RLS remota, cuentas/dispositivos reales, Firefox/Safari ni lectores de pantalla. Ocultar no borra registros; Sin marcar permanece en la página del día y en las oportunidades semanales.

## Actualización del 08/10/2026 · Objetivos dentro de Importante (D56)

- Base `main` en `6caaac7` (D55 ya pusheado). Copia **v11**, cache **v50**, IDB **5**. No cambia la cuenta de D55 ni el historial; cambia la presentación y agrega instalación única de cinco rutinas comunes.
- Pruebas específicas en `file://` a **1366×900** y HTTP a **375×812**: cinco predeterminadas, **15** oportunidades, todas las barras dentro de Importante y ninguna encima de la grilla, teclado Espacio, barra de Caminar 1/3, cambio de nombre/meta/frecuencia a 2, borrado de Bici, alta de Leer, recarga sin reinstalar Bici, conservación de Importante y semana siguiente vacía de marcas. Sin errores de consola ni scroll horizontal.
- Unitarias: instalación concurrente en una pestaña, equivalencias existentes sin modificar reglas/pausa/papelera, edición y purga sin reaparición, copia/restauración, reintento tras escritura interrumpida sin duplicar ni pisar lo editado, bienvenida/invitada sin instalación y ausencia de oportunidades nuevas en semanas pasadas. Migración v10→v11 no instala rutinas.
- La matriz de permisos D51 incorpora Semana ver/Repeticiones editar/Actividades ver, Semana editar/Repeticiones ver/Actividades editar y Repeticiones editar sin Semana. Anotaciones y controles de objetivos conservan permisos separados dentro de la misma celda.
- `npm run typecheck` y `npm run build`: exit 0. `npm run e2e:cloud`: **3/3** comprobaciones locales aprobadas. `npm run test:cloud`: **14 aprobadas y 1 omitida**, RLS sin Postgres local.
- Revisión visual de escritorio y 375px: barras finas, nombres y conteos visibles, lápices con área de 44px, controles de alta plegados y notas manuales conservadas. Capturas locales de QA con registros sintéticos de Nicole, sin datos de Production.
- Primer gate: **159/159 unitarias**, **64/65 E2E**. Se reprodujo el fallo del recorrido de borrado de páginas: esperaba el modo Decorar, activo antes de cerrar la bandeja; su cierre tomaba el foco después de que el test lo intentara mover. Ahora espera el sticker colocado. El recorrido específico pasó en file, HTTP y táctil. **Control completo final `npm run check`: exit 0, sintaxis del shell, 159/159 unitarias y 65/65 recorridos E2E aprobados.**

**Límites:** pruebas locales en Chromium, API simulada en la matriz compartida y humo local de Next; sin verificación de Production, dos cuentas/dispositivos reales, RLS remota o lectores de pantalla. La carga inicial empieza en la semana actual y respeta configuraciones existentes; una invitada ve lo que la dueña ya guardó, nunca instala actividades por mirar. No se instalaron dependencias, servicios ni credenciales.

## Actualización del 07/10/2026 · Objetivos semanales (D55, entrega local)

- Integrado sobre `main` en `9d5f885`, conservando sus 13 commits de plantillas, emociones, permisos y sincronización. D55 suma la migración v10 después de v7–v9 y cache v49 después de v48. La matriz D51 también abre los objetivos para comprobar el permiso del botón de programar; una invitada sin Repeticiones no lo ve y mirar nunca escribe el plan.
- `npm run check`: **exit 0**, sintaxis del shell, **153/153 pruebas unitarias** y **64/64 recorridos E2E** aprobados después de integrar main.
- `npm run typecheck` y `npm run build`: exit 0. `npm run e2e:cloud`: **3/3** comprobaciones locales aprobadas (cuaderno servido por Next con CSP, ingreso/preparación y API sin sesión).
- `npm run test:cloud`: **14 aprobadas, 1 omitida**: RLS no corrió porque no hay Postgres local. El humo de la nube no prueba sincronización entre cuentas ni permisos en una base remota.
- Recorridos D55: `file://` a **1366×900** y HTTP a **375×812**, con movimiento reducido. Cinco días de trabajo, cinco de diseño y tres caminatas suman **13** oportunidades. Se verificaron teclado (Espacio), marca/desmarca, tres caminatas completas, cuarta marca sin inflar el porcentaje, 100 %, recarga, una semana nueva sin marcas y plan histórico intacto tras editar la frecuencia. El formulario rechaza 8 veces, acepta 3 y conserva duración/meta. Sin errores de consola ni scroll horizontal.
- Unitarias específicas: vigencia parcial, solo `done`, deduplicación, límite del 100 %, actividad suelta, semana vacía, pausa/hojas, `noInsights`, días en papelera, edición/borrado/purga de rutina, borrador de Notas anterior al plan, copia v9→v10 y v10 de ida/vuelta, exportación TXT/XLSX, lectura invitada sin escrituras y separación de permisos `semana`/`repeticiones`.
- Revisión visual de capturas de escritorio y 375 px: papel/tela/tokens existentes, barra antes de la grilla, cuenta textual, objetivos cerrados de fábrica, sin animación de ancho ni tarjetas nuevas. Se quitó el desplazamiento automático a hoy para conservar visible el inicio de la semana.
- Se corrigió una espera de la suite anterior: el test de color de emoción recargaba al cambiar la caché antes de terminar IndexedDB. Se reprodujo también con los archivos del commit anterior y ahora espera el valor durable; no cambió la función de guardado ni se debilitó la comprobación.

**Límites:** verificación local; el push a main fue autorizado por la dueña. El despliegue de Production no se valida con esta QA. No se instalaron dependencias ni se modificaron credenciales, servicios o datos de Production. No se probaron dispositivos ni lectores de pantalla reales, Firefox/WebKit, RLS ni la sincronización con dos cuentas reales. Una copia antigua sin planificación no permite reconstruir reglas históricas que ya fueron borradas; conserva las marcas existentes. Cache **v49**, copia **v10**, IndexedDB **5**.

---

Qué se probó, cómo y qué **no** se pudo probar. Todo corrió en Chromium (`/opt/pw-browsers/chromium`, el único navegador del entorno). Nada de esto reemplaza probar en dispositivos reales (ROADMAP → Verificación pendiente).

## 1. Matriz de navegación (E2E `A12: matriz…`)

De cada sección se vuelve al calendario de fondo, en **1366×900** y **375×812**:

| Sección | ✕ | Esc | Tocar afuera | Atrás | Ruta directa + recarga |
|---|---|---|---|---|---|
| Hoy | ✓ | ✓ | ✓ (en 375 px el cuadro ocupa la pantalla: no hay afuera, se usa ✕) | ✓ | ✓ |
| Otro día | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mis hojas | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lo que se repite (`#/hojas/repite/:id`) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Una hoja | ✓ | ✓ | ✓ | ✓ | ✓ |
| Una plantilla | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mi año | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ajustes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Imprimir | ✓ | ✓ | ✓ | ✓ | ✓ |

En cada sección, además: **sin scroll horizontal** y **todo control visible con nombre accesible** (texto, `aria-label`, `title`, `<label>` o `aria-labelledby`). Los recorridos anteriores siguen cubriendo: cerrar dos veces, arranque directo con `seedBase`, `?go=`, foco al volver, teclado virtual a 375 px, 320 px y celular apaisado.

## 2. Revisión visual (capturas 1366×900 y 375×812)

Semana, mes, Hoy, Mis hojas, una hoja en bloques, una plantilla, Mi año y Ajustes, con datos de ejemplo (40 días, actividades, una repetición, una hoja *Pros y contras*, una plantilla *Comidas*). Contra DESIGN.md:

- Corregido: la leyenda del mes todavía decía *agenda / rutina / página* (vocabulario de antes de A5). Ahora: *algo anotado / lo que se repite / título de una hoja*.
- Corregido en la exportación de texto: *MIS RUTINAS / MIS PÁGINAS* → *LO QUE SE REPITE / MIS HOJAS*; se suman **las semanas** (Importante y Notas), que no se exportaban.
- Aceptado: en 375 px los marcadores de abajo muestran *Ajustes* solo con ícono (tiene nombre accesible). En el mes, las emociones de cada celda se cortan con “…” (la palabra entera está en el nombre del día).
- Temas (A9): se revisaron *Cosmos pastel*, *Noche* y *Neón suave*; en *Noche* se corrigió el texto sobre los acentos llenos (`--on-accent`) y el fondo de los campos (`--field`).

## 3. Auditorías

| Tema | Resultado |
|---|---|
| Lógica duplicada | Plantillas de fábrica en un solo lugar (`js/core/templates.js`); un editor de bloques (`MC.sheet.editor`) para hojas y plantillas; un editor de repetición (`MC.repeat.editor`, con `opts.save`); texto de hoja con `M.sheetText` en índice, exportación e impresión; cuentas del año en `MC.insights`. |
| Privacidad | Las cuentas por período (A8) usan el mismo filtro que las observaciones (`noInsights`, papelera); las victorias respetan `noReviews`/`noMemory` y la papelera; nada nuevo va a notificaciones; las hojas que se repiten no son actividades (fuera de recordatorios). |
| Exportación | TXT con hojas en bloques, semanas y lo que se repite (test `export-a12`). CSV/XLSX sin cambios de forma. La copia `.json` lleva `weeks`, `templates` y `marks` (tests A7–A9). |
| Impresión | Lee las hojas en bloques; `--print-*` no siguen al tema (E2E A9 con `media: print`). |
| PWA | Cada script de `index.html` está en `SHELL` de `sw.js` y existe; `CACHE_VERSION` subió en cada entrega (v30 → v35). |
| Accesibilidad | Nombres accesibles (matriz), radios con `aria-checked`, menús con roles, gráfico con tabla y resumen para lectores de pantalla, estado nunca solo por color (glifos + texto), alto contraste/colores forzados ganan sobre el tema. |
| Rendimiento | Con un año de datos (365 días con texto y emociones, ~500 actividades, 6 repeticiones, 40 hojas): Mi año 97 ms, Mis hojas 26 ms, Ajustes 36 ms, guardar + redibujo de la semana 51 ms, heap ≈ 10 MB. El dibujo repinta en vivo solo el trazo nuevo (el balde es caro). |
| Motion | Escenas solo con `transform`/`opacity` (E2E A10 lo comprueba en cada una); nunca en Reducidas/Ninguna. |

## 4. Lo que no se probó (y no se debe decir que sí)

- **Firefox y WebKit/Safari**: el entorno solo tiene Chromium. Pendiente con `npx playwright install firefox webkit` en una máquina con red, o a mano.
- **Dispositivos reales** (iPhone/Android, lápiz óptico con presión, instalación PWA, avisos push): sin dispositivos en el entorno. La plumilla con mouse usa la velocidad; con lápiz óptico usa `pointer.pressure`, sin probar en hardware.
- **Lectores de pantalla** (VoiceOver, TalkBack, NVDA): la auditoría es de nombres y roles en el DOM, no de uso real.
- **Nube con dos cuentas reales**: los cuadernos compartidos (D38) están probados con la API simulada; falta probarlos con Nicole y otra persona de verdad.
