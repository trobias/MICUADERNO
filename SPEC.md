# MI CUADERNO — SPEC

**D63 · guardar un momento:** el aviso confirmado muestra un papelito entrando en un bolsillo durante 200 ms después de persistir y cerrar el editor. El enlace Ver abre Mi año. Con teclado, movimiento reducido o escritura activa, el papelito es estático. Quitar un momento, señalar una repetición especial y los errores no disparan el efecto de guardado en el año. La confirmación no desaparece al retirar el diálogo.

**D63 · calendario:** el deslizamiento direccional existente se conserva para puntero/toque, con 260 ms y tokens compartidos. Navegación por teclado, actualizaciones guardadas, movimiento reducido y pestaña oculta no lo disparan; una nueva navegación o tecla interrumpe la transición activa.

**D63 · foto desde su miniatura:** abrir una foto con puntero conecta la miniatura con el visor mediante geometría real, escala uniforme y opacidad; ocupa el espacio disponible conservando su proporción. El diálogo y sus controles son utilizables desde el inicio. Zoom, gesto, otra foto o cierre interrumpen la entrada. Teclado, Ajustes en Reducidas/Ninguna y reduced-motion del sistema abren directamente. Es una mejora del visor D62, sin modificar imágenes, registros ni permisos.

## Interacciones de papelería · D62 (08/10/2026)

Selección de 19 interacciones inspiradas en Be UI, integradas sin dependencias nuevas: [mapa de componentes y contratos](docs/BEUI.md). Casillas con puntadas, contadores con transición, frecuencia con menos/más, orden de metas con arrastre o teclado, opciones de actividad con gesto y diálogos inferiores en celular. La página del día espera la carga inicial de rutinas antes de mostrar sus casillas; mes/semana mantienen D57. Ningún gesto marca ni borra.

Mis hojas agrupa por mes y ofrece búsqueda plegada de palabras, emociones y fechas, con filtros de tipo/período. Índice solo en memoria, actualizado mientras se usa; excluye papelera y fuentes excluidas de recuerdos/revisiones, y respeta secciones/partes compartidas. Los recuerdos derivados se buscan solo en el cuaderno propio. Mi año suma bolsillos desplegables, visor de imágenes con zoom/gestos/teclado, collage opcional en tandas de 24, rango para los álbumes y mosaico descriptivo de escritura/victorias. Cada entrada mantiene su enlace a la fuente. No agrega puntajes ni rachas.

Muestras de colores con nombres, menú de cuatro acciones para decorar, estado de guardado y cola de archivos con reintento. Cerrar la cola conserva lo que terminó y detiene lo pendiente. El ingreso muestra seis casillas de PIN oculto con un solo campo nativo. Filtros, visor y búsqueda son acciones de lectura; no conceden edición. Solo el orden opcional agrega datos (copia v13 aditiva); el resto conserva contratos actuales.

**Apertura visible (D60):** desde el HTML inicial, una hoja de papel con mariposa pastel, «Cargando el cuaderno…» y un esqueleto discreto del calendario acompaña el arranque. No muestra datos personales ni porcentajes ficticios. Permanece hasta que la bienvenida o el primer calendario estén listos; un fallo ofrece reintentar y las advertencias de base bloqueada/nueva se conservan. Favicon transparente con la misma mariposa ampliada, sin medallón o marco de bordado. No cambia la descarga ni guarda el cuaderno de las invitadas.

**Transición de apertura (D61):** la receta Skeleton loader and reveal de transitions.dev reemplaza la espera estática de D60: solo las casillas decorativas pulsan, sin desvanecer el texto o la mariposa. Al estar listo el primer calendario, ambas capas cruzan su opacidad durante 260 ms; el calendario es utilizable desde que llega. Sin pausa artificial. Sistema con movimiento reducido o Ajustes en Reducidas/Ninguna: espera y reemplazo estáticos; se recuerda la preferencia de UI por persona antes de cargar la base. El pulso se pausa en pestaña oculta y termina al revelar o fallar. No se repite al navegar ni al marcar actividades.

## Actualización D59 · victorias y recuerdos personales (08/10/2026)

- Mi año conserva metas semanales D58 y suma primer dibujo anual guardado/colocado, creaciones elegidas como terminadas y momentos especiales. La persona señala una actividad o repetición una vez desde “Esto es especial para mí…”: primera vez, encuentro, decisión, retomar algo o significado propio. Solo Lo hice/Hice un poquito produce el momento; primera vez usa solo la primera ocurrencia, incluso entre años. No interpreta texto, emociones, pausas ni vínculos.
- Actividad/hoja: “Elegir mi pequeña victoria…” permite elegir descanso, ayuda, límites, valentía, cuidado, disfrute o palabras propias. “Quiero recordarlo…” conserva una referencia y frase opcional. En el día, “Este día…” guarda una victoria o un día especial; puede ser un día vacío. En una hoja, “Terminé esta creación…” registra el cierre elegido por la persona, nunca por cantidad escrita.
- El mismo editor permite cambiar o quitar la elección. Fotografías y dibujos colocados en un día/hoja elegidos aparecen como miniatura de esa fuente; no se recuperan imágenes privadas o sin una fuente visible. No hay elección de una foto individual separada de su día/hoja.
- Álbum en las partes existentes Pequeñas victorias y Lo que guardé, agrupado por mes, seis entradas iniciales por parte y enlace para mostrar las demás. Cada papelito lleva a su día, hoja o semana. Conserva Qué quiero guardar y las referencias anteriores; privacidad de fuentes, papelera y permisos existentes, con notas/category en la sección anio. El primer dibujo es derivado, no duplica marks al recargar.
- Barras individuales de Progreso de 16 px, con conteo N/M, verde completo y amarillo para medio avance. No cambia la visibilidad D57 de las casillas.
- Copia v12 aditiva, IDB 5, cache v53. TXT e impresión incluyen victorias/recuerdos visibles; CSV/XLSX mantienen sus tablas actuales. Sin dependencias ni servicios nuevos.

> Fuente funcional de verdad. Si el código y este documento no coinciden, uno de los dos está mal: arreglá el que corresponda y dejá constancia en `DECISIONS.md`.

## 1. Qué es

MI CUADERNO es un cuaderno personal digital: diario, semana-planner, emociones escritas, lo que se repite, hojas con plantillas y scrapbook, en un solo objeto. Sin cuenta funciona 100 % en el dispositivo de la persona, sin servidor y sin conexión; con cuenta (etapa B, `docs/NUBE.md`) el cuaderno de la dueña se sincroniza y quien recibe permiso lo mira por sección.

**Problema que resuelve.** Las apps de hábitos castigan (rachas perdidas, rojo, “fallaste”). Las apps de notas son frías. Los cuadernos de papel no se pueden buscar, se pierden y no muestran el año de un vistazo. MI CUADERNO toma lo mejor del papel (ritual, calma, belleza, propiedad) y lo mejor del software (persistencia, calendario, recurrencias, exportación), sin traer la ansiedad del software de productividad.

**Promesa:** *abrís, registrás algo en menos de un minuto, cerrás. Y con el tiempo, el cuaderno te devuelve tu propia historia.*

### Hacia dónde va
La visión de memoria, scrapbook, privacidad y experiencia personal (revisiones, recuerdos, privacidad por página, buscador, etiquetas, colecciones, victorias, sobres, portada propia, modo calma…) está en `VISION.md` como **referencia**; el orden, en `ROADMAP.md`; cada idea, en `BACKLOG.md`. Esta SPEC describe solo lo que ya funciona.

## 2. No es

- No es una app clínica. No diagnostica, no infiere trastornos, no dice que algo “cura” o “mejora tu salud mental”.
- No es una app de productividad. No hay puntajes, rachas que se pierden ni rankings.
- No es un servicio. No hay backend, login, analytics, telemetría ni sincronización en la nube.

## 3. Personas y situaciones de uso

**Para cualquiera** (decisión de la dueña del proyecto). El copy es neutro en género (“¿Cómo arrancaste?”, nunca “¿estás cansada?”); la personalidad femenina y delicada vive en lo visual, no en la gramática. No hay estudio de mercado; hay situaciones reales:

| Situación | Qué necesita |
|---|---|
| **Mañana apurada** | Marcar cómo arrancó en 2 toques y ver qué tiene hoy. |
| **Mitad del día** | Tachar/marcar una actividad. Anotar algo suelto. |
| **Noche tranquila** | Cerrar el día: cómo terminó, qué hizo bien, qué quiere guardar. |
| **Domingo** | Mirar la semana como agenda. Planear rutinas. |
| **Fin de mes / año** | Ver el mapa de su año, releer recuerdos, imprimir o exportar. |
| **Día difícil** | Que la app no la juzgue. Poder escribir y nada más. |
| **Días sin abrir** | Volver sin culpa. Nada “perdido”. |

## 4. Principios de producto

1. **El cuaderno es el objeto central.** Todo se presenta como papel, páginas, pestañas, stickers.
2. **Amable siempre.** Ningún estado se nombra como fracaso. Ver §8 (copy).
3. **Registrar < 60 s.** La acción principal (escribir cómo te sentiste y anotar una actividad) está en Hoy al abrir.
4. **Opcional por defecto.** Nada es obligatorio: ni nombre, ni emoción, ni reflexión. Una página vacía está bien.
5. **Silencio visual.** Una pantalla puede estar completamente quieta. Las escenas vivas son ocasionales.
6. **Local y exportable.** Los datos son de la persona. Siempre puede llevárselos (JSON, TXT, CSV, XLSX, impresión).
7. **Descriptivo, nunca causal.** Los insights cuentan (“8 de 11 veces”), no concluyen.

## 5. Navegación: una sola pantalla

Pedido de la dueña del proyecto (DECISIONS D17): **sin secciones separadas**. Todo pasa en una pantalla:

- **Centro: el calendario**, que abre en **Mi semana** (la semana-planner, A6) y tiene el mes a un toque; lo elegido dura la sesión. **Tira de los 12 meses** (y flechas de año) para saltar de mes con un toque. Interruptor chico *Mes / Semana*.
- **Marcadores de tela al costado del cuaderno** (en el celular, abajo): *Hoy · Mis hojas · Mi año* y, separado, *Ajustes* (en el celular, solo el carretel) (D27, A5). Cada uno abre un **cuadro desplegable** encima del calendario (un `<dialog>`), sin salir de la pantalla. Con un cuadro abierto los marcadores se mudan a su costado: se pasa de uno a otro sin cerrar (DECISIONS D22). Agenda y Rutinas dejaron de ser marcadores: anotar en cualquier día se hace desde ese día (y desde A6, desde la semana); repetir, desde el menú de una actividad o desde Mis hojas. Las rutas viejas redirigen: `#/agenda` → la semana, `#/rutinas` y `#/paginas` → Mis hojas.
- **Tocar un día** del calendario abre la página de ese día en el cuadro. Al cerrarlo (botón “Volver al calendario”, `Esc`, tocar afuera o *atrás* del navegador) se vuelve al calendario. El calendario de atrás **se actualiza solo** mientras el cuadro está abierto y cuando otra pestaña cambia algo, sin parpadeo y sin tocar lo que se está escribiendo (DECISIONS D21). Al volver, la cinta y el foco quedan en el último día abierto; si el cuadro se abrió con un marcador, el foco vuelve a ese marcador.
- **Teclado en el celular (T6):** en pantallas chicas (< 700px), cuando se hace foco en un campo editable para escribir, la barra inferior de marcadores se oculta de forma automática (detectada vía `visualViewport` con fallback de redimensión y foco) para no tapar el texto ni estorbar, y reaparece suavemente al cerrar el teclado o perder el foco.

| Ruta | Qué muestra |
|---|---|
| `#/calendario` · `#/calendario/mes/AAAA-MM` · `#/calendario/semana/AAAA-MM-DD` | la pantalla principal (sin cuadro); `#/calendario` abre la semana salvo que en la sesión se haya elegido el mes |
| `#/calendario/mes/AAAA-MM/rutina/:id` | el mes con los días de esa rutina marcados |
| `#/hoy` · `#/dia/AAAA-MM-DD` | cuadro con la página del día |
| `#/rutinas` · `#/rutinas/:id` | cuadro de rutinas (con esa rutina resaltada) |
| `#/paginas` · `#/pagina/:id` | cuadro con el índice o una página |
| `#/anio/AAAA` | cuadro con el bordado del año, lo que fui notando y lo que guardé |
| `#/ajustes` · `#/imprimir` | cuadro de ajustes / impresión |

Todas las rutas siguen siendo enlazables (atajos de la PWA, notificaciones). Se arman y se leen en un solo lugar, `js/core/routes.js` (`MC.routes.day(fecha)`, `MC.routes.page(id)`, `MC.routes.parse(hash)`…): ninguna vista escribe `#/…` a mano (DECISIONS D19).

### 5.1 Cómo se conectan las secciones

Todo lo que tiene fecha lleva a su día, y cada día lleva a sus cosas (DECISIONS D20). Los enlaces son texto chiquito o íconos que ya estaban, nunca botones nuevos que compitan con el calendario.

| Desde | Lleva a |
|---|---|
| Calendario: un día | la página de ese día |
| Calendario: el año de la tira (“2026”) | *Mi año* de ese año; además el marcador *Mi año* abre el año que se está mirando |
| Página del día: “Ver la rutina” (menú de una actividad de rutina) | el cuadro de rutinas con esa rutina resaltada y con el foco |
| Página del día: “viene del 30 sep” | el día de donde se pasó esa actividad |
| Página del día: *Páginas de este día* | cada página empezada ese día |
| Rutina: “próxima: …” | el día de la próxima vez |
| Rutina: ícono de calendario | el mes con sus días marcados: de hoy en adelante los que tocan, para atrás solo los que se hicieron |
| Calendario con una rutina marcada | “Ver la rutina”, “Dejar de mostrar”; cambiar de mes la mantiene |
| Página libre: “Empezada el …” | el día en que se empezó |
| *Mi año*: la inicial de cada mes | ese mes en el calendario |
| *Mi año*: un punto cruz o un recuerdo | ese día |
| *Lo que fui notando* | los días de los que habla cada observación (“Ir a ese día”, “Ver los días”, o la rutina en el calendario) |
| Semana: un día o una página | ese día o esa página |

## 6. User journeys

### 6.1 Primera apertura
1. Se ve la **tapa** cerrada (tela, etiqueta “MI CUADERNO · un lugarcito para mí ♡”, elástico).
2. Toque/click/Enter → el elástico se corre, la tapa se abre (≤ 900 ms; reducido si hay reduced-motion).
3. **Onboarding (3 hojas, todo salteable):**
   1. ¿Cómo querés que te llame? (opcional)
   2. ¿Qué querés registrar? (ánimo al empezar / al terminar, actividades, reflexión, energía, sueño)
   3. Elegí una tapa (4 opciones)
4. “Abrir mi cuaderno” → **Hoy**, con foco visual en “¿Cómo arrancaste hoy?”.

### 6.2 Uso diario
Abrir → (tapa breve o directo, según ajuste) → calendario → marcador **Hoy** (o tocar el día) → escribir una o varias palabras sobre cómo te sentiste → ver actividades del día (propias + rutinas) → marcar estados → escribir → más tarde “¿Cómo terminó tu día?” + reflexiones.

### 6.3 Revisión
Calendario → tocar un mes en la tira → tocar un día → se abre su página en el cuadro (editable, pasada o futura) → cerrar y seguir mirando.

### 6.4 Que algo se repita
En el día, menú de una actividad → **Que se repita…** → el editor empieza con su nombre y con los valores de ese día (su día de la semana, del mes o la fecha anual) → elegir frecuencia (+ desde/hasta, momento del día) → aparece sola en los días que corresponde; la actividad suelta pasa a ser su primera vez. También desde **Mis hojas → Nueva repetición**. En el menú de algo que se repite: *Cambiar cómo se repite…*, *Dejar de repetir* (desde ese día; lo marcado queda), *Ver en el calendario*, *Ver lo que se repite*.

### 6.5 Hoja libre
Mis hojas → “Nueva hoja” → elegir en blanco o una plantilla (lista, carta al futuro, gratitud…) → escribir → abrir el sobre de stickers → pegar una mariposa, rotarla, moverla.

### 6.6 Backup y restauración
Ajustes → “Mis datos” → **Guardar una copia (.json)**. Para restaurar: “Abrir otra copia” → elegir archivo → se valida → se muestra qué contiene (días, rutinas, páginas, fecha) → advertencia clara → “Reemplazar mi cuaderno” (con opción previa de descargar la copia actual).

### 6.7 Exportar / imprimir
Ajustes → “Llevarme mi cuaderno”: TXT (diario legible), CSV (días / actividades), XLSX (hojas: Resumen, Días, Emociones, Actividades, Rutinas, Reflexiones), **Imprimir mi cuaderno** (A4, A5, Carta; rango; secciones) → diálogo de impresión del sistema → PDF o papel.

### 6.8 Recordatorios
Nunca se piden permisos al abrir. Después de ≥ 3 días distintos con registros aparece un papelito: “¿Querés que te deje un pequeño recordatorio para volver a tu cuaderno? ♡”. Solo al aceptar se pide el permiso del navegador. Todo se configura en Ajustes.

## 7. Funcionalidad por pantalla

### 7.1 Tapa
- Se muestra al abrir la app si `settings.showCover` (default `true`).
- Las 3 primeras aperturas: animación completa. Después: transición corta (fade + leve desplazamiento). Reduced-motion: sin rotación.
- Muestra: título, frase, nombre (si hay), año actual, una mariposa bordada.
- Accesible: es un `<button>` “Abrir mi cuaderno”.

### 7.2 Hoy (página del día)
Secciones, en orden de lectura (mobile) o repartidas en doble página (desktop: izquierda = mañana y lista; derecha = durante y cierre):

1. **Encabezado**: saludo según hora (“Buenos días / Buenas tardes / Buenas noches, {nombre} ♡”), día de semana + fecha. Flechas día anterior/siguiente y “Ir a hoy” si no es hoy (para saltar lejos se usa el calendario, que queda debajo). Indicador unificado de **guardado visible** `c.savedNote` (DA3) y acceso discreto a **Privacidad de este día** (PV1: no mostrar en recuerdos, no incluir en insights, no incluir en revisiones). **Guardar** (D45): *Que se repita este día…* (sus actividades propias pasan a repetirse con la regla que se elija; si cae ese mismo día, la actividad pasa a ser la ocurrencia), *Como plantilla de día…* (actividades sin marcar, intención y notas, con un nombre) y, si hay, *Usar «plantilla»* (suma lo que falte y completa intención/notas solo si están vacías) y *Borrar una plantilla de día…* (a la papelera, con deshacer).
2. **¿Cómo arrancaste hoy?** — campo para escribir una o varias emociones (§9), sugerencias de las palabras que ya anotaste y, para empezar, *pesado, bajito, normal, bien, muy bien* (D49); cada palabra se ve con su parche y se puede sacar.
3. **Algo que quiero cuidar hoy…** — nota adhesiva, una línea o dos.
4. **Lo de hoy** — lista de actividades: propias del día + ocurrencias de rutinas. Cada una con 5 estados (§10) y emociones opcionales **antes y después**, editables desde el menú y visibles junto a la fila. Agregar inline. Editar texto, mover a mañana o sacar (borrado definitivo con deshacer inmediato, DA2). Pila de deshacer (`Ctrl+Z` / `Ctrl+Shift+Z`) para cambios de estado y acciones fuera de inputs.
5. **Durante el día** — texto libre sobre renglones (deshacer nativo del navegador mientras se escribe).
6. **Energía / sueño** (si están activados) — energía 1-3 (“poquita / media / mucha”), horas de sueño (0–14, pasos de 0,5).
7. **¿Cómo terminó tu día?** — emociones escritas + reflexiones: *qué me hizo bien*, *algo difícil*, *algo lindo*, *qué quiero guardar* (⇒ recuerdo), *texto libre*. Se muestra plegado como “cerrar el día” antes de las 17 h si está vacío; siempre se puede desplegar.
8. **Páginas de este día** — si ese día se empezó alguna página libre, un enlace a cada una (así el calendario también encuentra las páginas).
9. **Adjuntos** del día: cualquier archivo (una foto, una entrada, un PDF, un audio) para abrirlo desde ahí; una imagen adjunta se puede pegar como sticker. Sacar un adjunto lo envía a la papelera (DA1).
10. **Capa de stickers** del día (scrapbook) — botón “stickers”: arte del cuaderno, **Mis stickers** (imágenes subidas y dibujos) y **Dibujar**. Pila de deshacer/rehacer dedicada (DA2) para mover, escalar, rotar, pegar y despegar.

Guardado automático y visible (DA3): cada cambio se anota al instante como borrador local y se escribe en IndexedDB a los 400 ms; si la pestaña se cierra antes, el borrador se recupera al volver. El componente `c.savedNote` transiciona sutilmente por `guardando…` → `guardado ✓` → reposo (se oculta tras ~1.5 s). Si IndexedDB falla o la memoria está llena, no pierde datos en silencio: avisa amablemente que el contenido se mantiene como borrador local e invita a descargar una copia. Días futuros: editables (planear). Días pasados: editables.

### 7.3 Calendario
El calendario es donde aparece **todo lo que tiene fecha**: emociones, escritura, recuerdos, actividades, rutinas y páginas.

- **Mes** (pantalla principal): tira de 12 meses + grilla lunes-domingo. Cada día muestra:
  - número;
  - palabras de cómo te sentiste al final (o al inicio si no hay final), con hilo de color y texto;
  - punto de tinta si escribió; estrellita si guardó un recuerdo;
  - **×n** cosas hechas (o a medias);
  - marcas con texto para **Lo dejo para otro día** y **Hoy no salió**;
  - **hoja chiquita** si ese día tiene una página libre;
  - en pantallas anchas, además, **lo registrado ese día escrito en hilitos** con su glifo de estado y las hojas; hasta 3 y “+N más”. En el celular quedan las marcas compactas.
  
  **D57:** en cualquier fecha, pasada, presente o futura, únicamente las actividades **Sin marcar** (`pending`) quedan fuera del mes y la semana. Los demás estados aparecen: Lo hice, Hice un poquito, Lo dejo para otro día y Hoy no salió. Ocultar no borra ni cambia los registros: las casillas precargadas siguen disponibles al abrir la página del día. Cada marca tiene texto en el `aria-label` y en la leyenda. Papelera se ignora (DA1). Hoy con borde a lápiz; el último día abierto lleva una cinta-marcador. Tocar un día → su página en el cuadro desplegable. Las hojas conservan su regla propia de visibilidad.
- **Animaciones** (con motion “Completas”/“Suaves”): cambiar de mes desliza la hoja hacia ese lado; pasar de mes a semana (o al revés) la acomoda con una escala apenas; el día nuevo se arma aparte y entra cuando está listo (sin parpadeo).
- **Mi semana (A6, vista por defecto)**: un planner de papel en una sola hoja: **Progreso · Lunes · Martes / Miércoles · Jueves · Viernes / Sábado · Domingo · Notas** (tres columnas si la hoja es ancha, dos en tablet, una en el celular, con hoy a la vista). Flechas de semana, “Esta semana”, Mes/Semana y la tira de meses.
  - **Progreso semanal (D56–D58):** la nota se llama **Progreso** (antes Importante), con resumen semanal y una barra por nombre de actividad, conteo entero **N/M**. Tres Trabajar sin marcar → **0/3**; tres «un poquito» → **3/3**, **50 %** de barra amarilla y una estrella **Pequeña victoria**. Cada Lo hice aporta 1 en verde; cada Un poquito, 0,5 en amarillo. La parte verde precede a la amarilla al mezclar estados. El conteo visible muestra N/M sin «N un poquito»; la descripción accesible conserva completas y medios avances, sin depender solo del color. Las victorias semanales de Mi año también omiten ese añadido. La estrella aparece cuando todas las veces están registradas como done/partial; no exige 100 % de barra. Reutiliza el SVG del cuaderno con aparición de 200 ms (transform/opacity), sin loops, tecleo, panel abierto ni movimiento reducido; no se repite al redibujar. Sin nueva dependencia. La agrupación por nombre, los lápices, el alta plegada y las anotaciones manuales se conservan. Progreso queda primero también en el celular; sin actividades muestra «—».
  - **Actividades iniciales configurables:** Trabajar y Practica Diseño de lunes a viernes (diseño: 1 hora por día), Caminar 3 veces a elección, Salir con una amiga y Bici 1 vez a elección: 15 oportunidades. Se instalan una sola vez en el cuaderno propio, desde el lunes actual, sin crear cumplimientos ni semanas pasadas. Se conservan las equivalentes ya configuradas (también «Practicar diseño»), incluidas pausa y papelera. Borrar o purgar una inicial no vuelve a crearla. Todo es editable; una invitada solo ve lo que le compartieron y nunca instala actividades.
  - **Cada día:** nombre y número (enlace a su página; flechas, Enter y foco de vuelta al cerrar), emociones, actividades con estado registrado y la **misma fila** de la página del día (casilla, menú completo, antes/después), renglón **anotar…**, hojas y conteo de actividades registradas. Se omite el conteo si no hay registros visibles. Las opciones Sin marcar se encuentran precargadas al abrir el día; el calendario aplica D57 a todas las fechas. Lo que se anota en un día pasado **nace hecho** (se cambia con un toque).
  - **Días fijos:** elegir lunes a viernes genera cinco oportunidades. **Meta flexible:** «3 veces por semana» ofrece una casilla por día elegible, con «elegís el día», y cuenta tres oportunidades semanales, nunca siete. Las casillas de otros días no son obligaciones; se puede registrar más sin superar el 100 %. Una marca por actividad y fecha. La duración/meta escrita es opcional y se ve junto a la actividad.
  - **Cálculo (D58):** `checked = done + partial` cuenta veces registradas; el avance es `value = done + partial / 2`, y el porcentaje deriva de `value / total`. Pending/postponed/skipped no aportan avance. Cada meta flexible limita sus veces a la cantidad objetivo; las completas tienen prioridad sobre los medios avances excedentes, sin reescribir las marcas extra. La agrupación suma después de ese límite. Sin marcar sigue siendo oportunidad semanal aunque no aparezca en el calendario. `noInsights` y papelera se excluyen. Anotaciones manuales, Notas y hojas repetidas no son objetivos.
  - **Historial:** la planificación semanal se conserva en `weeks.activityPlan`; una semana cerrada conserva sus metas aunque después cambie, se pause o se purgue una repetición. La semana actual y las futuras reflejan la configuración vigente. Las marcas quedan en `activities`, con su fecha; el lunes siguiente se calculan nuevas oportunidades sin copiar estados. Una semana antigua sin plan se calcula con las reglas disponibles: no se pueden recuperar configuraciones borradas antes de esta entrega.
  - Las **anotaciones de Importante** (casillas) y **Notas** son de la semana (`weeks`): se guardan solos con borrador (D13) e indicador de guardado; una semana vacía no se guarda. Las anotaciones conservan permiso Semana; barras y configuración respetan Actividades/Repeticiones por separado, aunque convivan en la misma nota.
  - Se edita en el fondo (D27): mientras se escribe en ella o hay un menú abierto, el calendario en vivo espera (no pisa ni una letra ni el foco); lo escrito se guarda antes de abrir un cuadro, al ocultar la pestaña y al cerrar.
- **Mi año** sigue mostrando solo lo registrado: una rutina sin marcar no borda medio punto. Días con `privacy.noReviews` no aportan recuerdos a “Lo que guardé” (PV1), y elementos borrados no se computan (DA1).
- **Los días de algo que se repite** (desde Mis hojas, la actividad o *Lo que fui notando*): para actividades, el mes resalta únicamente fechas con estado registrado, incluyendo «otro día» y «hoy no salió» (D57); Sin marcar no resalta ninguna fecha. Las hojas conservan su regla propia. Arriba, aviso con “Ver lo que se repite” y “Dejar de mostrar”.
- Navegación anterior/siguiente, “hoy”.

### 7.4 Mis hojas · Lo que se repite (A5)
Mis hojas (`#/hojas`) es un cuadro de dos hojas: a la izquierda el **índice de hojas** (§7.5), a la derecha **Lo que se repite** (las rutinas de siempre, D7, y las hojas que se repiten, con un ícono de hoja y enlace a la hoja de la próxima vez). Las plantillas propias viven en **Nueva hoja** (D45).
- Lista agrupada por momento del día (mañana / tarde / noche / cuando sea) y, aparte, **En pausa** (que siguen siendo alcanzables para retomarlas).
- Frecuencias soportadas (§11), incluida **Todos los años** (el 29/02 cae el 28/02 en años comunes). Descripción humana de la regla (“Lun · Mié · Vie”, “Cada 3 días”, “Primer sábado del mes”, “Todos los años, el 14 de marzo”). Un solo editor (`MC.repeat.editor`, `js/ui/repeat.js`) para Mis hojas, el menú de la actividad y, desde A7, Guardar de una hoja.
- Pausar/reanudar (archivar), editar, borrar (borrado suave a la papelera, DA1; el historial ya marcado se conserva como actividades sueltas).
- Cada rutina: la próxima vez es un enlace a ese día; el ícono de calendario muestra sus días en el mes. Si se llega desde “Ver lo que se repite” (`#/hojas/repite/:id`), aparece resaltada y con el foco.

### 7.5 Hojas (índice en Mis hojas; plantillas en Nueva hoja; editor en `#/pagina/:id`; plantilla en `#/plantilla/:id`) — A7, D29
- Cada hoja es **una hoja de un día**: se elige al crearla (“Para el día”, por defecto hoy o el día desde donde se empezó) y se cambia con “Cambiar el día”. Desde la página de un día: **Hojas de este día** y “Agregar una hoja”.
- **Bloques** (un solo editor, `MC.sheet.editor` en `js/ui/sheet.js`, para hojas y plantillas): *renglones*, *lista*, *casillas* (punto cruz) y *columnas* (de 2 a 4, con título cada una). “Agregar a la hoja” suma un bloque; el menú `⋯` de cada bloque: ponerle/sacar título, sumar/sacar columna, pasar de lista a casillas y al revés, subir, bajar, sacar (con deshacer si tenía algo escrito). Hasta 24 bloques. Las hojas de antes (texto o lista) se abren como un bloque y no pierden nada.
- **Nueva hoja**: primero **Mis plantillas** (la tarjeta **+ Nueva plantilla**, que arma una y la abre, y las propias, cada una con un lápiz para editarla; D45) y después **De fábrica**: *En blanco, Para dibujar, Comidas del día (columnas), Pros y contras, Lo hecho y lo que sigue (casillas + lista), Cosas que me hacen bien, Lugares que amo, Personas importantes, Canciones de este momento, Pequeñas victorias, Cosas que quiero probar (casillas), Carta para mi yo futuro, Vaciar la cabeza, Gratitud, Sueños, Lista de deseos, Reflexión del mes* (tres bloques con título; el título suma el mes). Cada tarjeta dice de qué está hecha (“renglones y columnas”).
- **Guardar** (botón de texto en la cabecera de la hoja): *Como plantilla, en blanco* / *con lo escrito* (va a Mis plantillas, en Nueva hoja). Repetir es cosa de los días (§7.2, D45).
- **Hojas que se repiten** (las que se armaron antes de D45 siguen funcionando igual): son repeticiones `kind: 'sheet'` con una **copia congelada** de la plantilla (editar la hoja original no cambia las que vienen). De hoy en adelante aparecen solas en el día, la semana y el mes (con “· se repite”); en días pasados, solo las que se escribieron (D18). Son virtuales hasta que se escribe algo: entonces se guardan con id fijo `pag_<repetición>_<fecha>`. Si se manda a la papelera una que nunca se escribió, ese día no vuelve a aparecer. Nunca aparecen como actividad ni en los recordatorios.
- **Mis plantillas** (en Nueva hoja): crear, editar como una hoja sin día (nombre, papel, bloques, texto inicial), *Usarla en una hoja nueva*, *Duplicar*, *Mandar a la papelera* (con deshacer y restaurable desde Ajustes). Las hojas hechas con una plantilla no cambian si después se edita la plantilla.
- **Índice** con título, primera línea (o “3 cosas”), fecha y número de página con puntos guía. Fijar hojas arriba. Las hojas en papelera no se muestran (DA1).
- Papel: rayado, cuadriculado, punteado, liso.
- Stickers (scrapbook), con dibujos e imágenes propias; **Para dibujar** abre con el lápiz listo. Pila de deshacer/rehacer independiente para elementos colocados (DA2).
- **Privacidad de esta hoja** (PV1), **guardado visible** (DA3), **adjuntos** y **borrar** (papelera con deshacer, DA1), como antes.
- Exportar e imprimir leen los bloques (`M.sheetText`); la hoja guardada además escribe `kind/body/items` derivados hasta el contrato v6.

### 7.6 Mi año
- **Bordado**: 12 columnas (meses) × 31 filas (días). Día sin registro = punto de cruz a lápiz sin llenar (bonito vacío). Día con emoción = hilo de color y palabra accesible en el nombre del día.
- Leyenda de las palabras más anotadas en ese año, siempre con texto además de color.
- Tocar un día → abre su página. La inicial de cada mes lleva a ese mes en el calendario.
- **Lo que fui notando**: 3-6 observaciones descriptivas (§12), cada una con el camino a sus días. Respeta estrictamente `privacy.noInsights` y omite registros borrados (PV1, DA1).
- **Mes a mes** (A8, D31), debajo del bastidor: barras SVG propias con tres hilos (días escritos, días con emociones, cosas hechas), leyenda con texto y “Ver los números” (tabla con los mismos datos, encabezados de fila y columna). Nota fija: “Cuentas, no metas: un mes con menos no es peor.”
- **Lo que fui notando por período** (A8): *Esta semana · Este mes · Este año* (radio, se recuerda la elección; en años pasados, solo *Ese año*). Cuentas en frases: días escritos, días con emociones y las palabras más anotadas (con su hilo y su número), cosas hechas (estrellita), cosas pasadas a otro día (`moves` y copias de repeticiones), antes/después de actividades con lo más anotado antes y después, hojas empezadas. Vacío: “Un período vacío también está bien.” Debajo, las observaciones de §12.
- **Pequeñas victorias** (A8): se marcan desde el menú de una actividad o de una hoja (“Es una pequeña victoria” / “Ya no es…”). Son referencias (`marks`, id fijo `mrk_<tipo>_<id>`): muestran el texto actual de la cosa, se van si la cosa va a la papelera, y respetan `noReviews`/`noMemory` del día. Cada una lleva a su día (o a su hoja) y su día lleva una puntadita dorada en el bastidor (dicha también en el nombre del día).
  **D58** suma automáticamente una victoria por objetivo semanal alcanzado, incluidas metas enteramente Un poquito. Es una lectura derivada de actividades y planes: sin nuevas referencias persistentes ni duplicados al recargar. Lleva a su semana y se fecha en el primer día en que alcanzó todas sus veces; cambiar frecuencia conserva planes históricos. Las completas extra no crean otra victoria. Papelera, `noInsights`, `noReviews` y `noMemory` se respetan. Una meta de 1/1 ya elegida manualmente conserva su victoria y enlace originales, sin repetirla.
- **Lo que guardé**: lista de recuerdos (“qué quiero guardar”) del año, como papelitos. Respeta `privacy.noReviews` y `privacy.noMemory` (PV1), además de ignorar lo que esté en papelera (DA1).

### 7.9 Dibujar, Mis stickers y adjuntos (D24)
- **Dibujar** (desde el sobre de stickers, la barra de decorar o la plantilla *Para dibujar*): hoja cuadrada con herramientas (A11, D32): **técnico** (el lápiz de siempre), **plumilla** (grosor según la presión del lápiz óptico o, con mouse o dedo, según la velocidad), **grafito** (tres hebras finitas con grano), **resaltador** (ancho y translúcido), **aerógrafo** (puntitos con semilla, salen iguales cada vez), **balde** (rellena la zona cerrada donde se toca, con tolerancia; se deshace como un trazo), **goma**, **texto** (letra a mano / de libro / de título / simple; chica, mediana, grande), los 12 colores de los hilos y la papelería, 3 grosores, **deshacer y rehacer** (DA2) y *borrar todo*. Al guardar se recorta y se pega como sticker; queda en *Mis stickers* y se puede **editar después** (“Editar el dibujo”: cambia en todas las hojas donde esté). Sin capas, sin vectores para exportar: no es un programa de diseño. Cada trazo guarda herramienta, puntos (con un estabilizador suave al soltar), presión y semilla, y cada relleno es un paso `{ tool: 'fill', x, y, color, tolerance }` en el mismo orden: al reabrir, todo se vuelve a pintar igual. La imagen se recorta por lo que quedó pintado (así el relleno entra). Núcleo puro: `MC.brush` (`js/core/brush.js`).
- **Pila de deshacer/rehacer en dibujo (DA2):** pila propia de `MC.history` con 50 pasos que registra trazos de lápiz, goma y agregado/modificación de textos. Botones táctiles visibles en la barra superior del dibujo y atajos `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` mientras no se esté editando un campo de texto nativo.
- **Subir una imagen** (PNG, JPG, WebP, GIF, SVG, AVIF… lo que el navegador sepa leer; HEIC solo donde el navegador lo abra): se achica a 900 px y se guarda como WebP/PNG (un SVG se convierte en imagen; nunca se guarda como código). Va a *Mis stickers* y se pega en cualquier hoja. Sacar una imagen de la colección la envía a la papelera (DA1) y la despega de las hojas sin romper nada.
- **Adjuntos**: cualquier archivo de hasta 10 MB en un día o una página; se descarga/abre con un toque y se saca con confirmación (borrado suave a la papelera, DA1). Sirven para guardar con el día lo que no es texto: la entrada del recital, el PDF de un turno, una foto, un audio. Van en la copia de seguridad.
- **Guardado visible (DA3):** cada cambio en dibujos, stickers y adjuntos se acompaña del indicador `c.savedNote`.

### 7.8 Agenda (retirada en A5)
La Agenda dejó de existir como cuadro (D27): anotar en cualquier día se hace desde ese día (y, desde A6, en la semana-planner); repetir, desde el menú de la actividad o Mis hojas; una hoja para un día, con “Nueva hoja” y su día. `#/agenda` lleva a la semana actual. Los datos no cambiaron.

### 7.7 Ajustes
- **Vos**: nombre y qué registrar. **Mis emociones** permite elegir color por palabra, con selector nativo o código `#RRGGBB`; las palabras del registro nunca salen de una lista cerrada.
- **Colores propios** (A9, D30): de fábrica, la tela de la tapa (`settings.theme = null`). Presets por familia —*Pastel* (Cosmos pastel `#F2CFD7 #D6E6E5 #D1D171 #FEE088`, Algodón, Menta), *Quebrados* (Terracota, Oliva, Ciruela), *Neutros* (Lino, Grafito), *Neón* (Neón suave, con degradado y brillo), *Noche* (hojas oscuras para escribir a oscuras)— y **Elegir mis colores**: tela, hojas, tinta y 4 acentos con selector nativo o `#RRGGBB`; degradado en la tela (segundo color y dirección) y acabado *Mate / Satinado / Brillante*, solo si se eligen. Todo cambia al momento, con una hojita de muestra; un aviso dice con palabras qué se corrigió para que se lea (contraste AA: tinta ≥ 7:1, tinta suave y texto sobre la tela ≥ 4.5:1). “Volver a la tela de la tapa” restablece. Con alto contraste o colores forzados del sistema, el tema no se aplica (y se avisa); la impresión usa siempre sus tokens. Motor: `MC.theme` (`js/core/theme.js`, puro) + `MC.themeUI.apply` (`js/ui/theme.js`).
- **Cómo se mueve**: animaciones *Completas / Suaves / Reducidas / Ninguna* (default para todas las personas: *Completas*, D23; si el sistema pide menos movimiento, Ajustes lo sugiere bajar; “Ninguna” elegida antes se respeta); escenas ocasionales on/off; mostrar la tapa al abrir.
- **Recordatorios**: ver §14.
- **Mis datos**:
  - Texto de privacidad.
  - **Papelera (DA1):** selector de tiempo de retención (`settings.trashRetentionDays`, default 30 días; opciones 7, 15, 30, 60 días o nunca), acceso al listado de elementos en papelera con opción de **Restaurar** o **Eliminar definitivamente**, y botón **Vaciar papelera** con confirmación clara.
  - **Copia de seguridad y exportación:** guardar copia (`.json` v6); “Descargar la copia de antes” después del contrato v6; abrir/restaurar copia; exportar (TXT, CSV, XLSX); imprimir; recordatorio de copia (cada 7/14/30 días/nunca); borrar todo (doble confirmación, escribiendo “borrar”).
- **Guardado visible (DA3):** cada cambio de configuración se confirma con `c.savedNote`.
- **Instalar**: si el navegador lo permite, botón “Instalar en este dispositivo”.

### 7.10 Papelera y borrado suave (DA1)
Para evitar pérdidas accidentales y dar tranquilidad (filosofía amable), el borrado en MI CUADERNO es **suave por defecto** y vive en el mismo almacén de datos (D25):

- **Entidades cubiertas:** páginas libres (`pages`), rutinas recurrentes (`routines`), imágenes y fotos de *Mis stickers* (`images`), dibujos (`images`), archivos adjuntos (`files`), actividades individuales (`activities`) y días completos (`days`).
- **Mecanismo:** el registro recibe una marca temporal `deletedAt: ISO` (UTC). Ausente o `null` indica que el registro está activo.
- **Aislamiento:** las listas activas, el resumen del calendario (`MC.model.summarize`), la agenda y las observaciones de `insights.js` filtran los registros con `deletedAt != null`. La única excepción es abrir explícitamente una fecha para revisar su hoja en papelera, con aviso y restauración al editar. Sacar una actividad desde un día usa borrado definitivo con Deshacer; el esquema admite su marca de papelera, pero esa acción no la utiliza.
- **Retención configurable:** `settings.trashRetentionDays` (default 30 días). En cada inicio del cuaderno, los elementos cuyo `deletedAt` supere el período de retención se eliminan de manera definitiva (`delete` físico en IndexedDB).
- **Restauración:** cualquier elemento en papelera puede devolverse a la vida (`deletedAt = null`). Una página regresa al índice y al calendario; una rutina retoma sus apariciones; una foto o dibujo reaparece en *Mis stickers*; un adjunto vuelve a su día o página. Abrir la fecha de un día en papelera permite revisar su contenido con un aviso; editarlo lo restaura. Un guardado vacío no lo elimina y un borrador anterior al borrado no lo sobrescribe.
- **Retención:** al acortar el plazo, Ajustes anuncia cuántos registros vencerían en el próximo arranque (`MC.model.countDueTrash`); no los borra en ese momento.
- **Vaciado manual:** opción en Ajustes → Mis datos → Papelera para vaciar todo el contenido borrado de una sola vez, previa confirmación amable.
- **Preservación en copias:** la papelera se incluye en el archivo de backup `.json` (con sus fechas `deletedAt`). Si la persona exporta e importa su cuaderno en otro dispositivo, sus elementos en papelera y sus plazos de retención siguen existiendo.

### 7.11 Privacidad de esta página y de este día (PV1)
En MI CUADERNO la persona tiene derecho a escribir cosas difíciles o íntimas sin temor a que la app se las devuelva por sorpresa (D25):

- **Banderas opcionales (`privacy` en `days` y `pages`):**
  - `noMemory` (default `false`): **No mostrar como recuerdo**. Excluye el día o página de apariciones espontáneas (“Abrime algo lindo ♡”, “Un día como hoy”, recuerdos suaves al año o al mes).
  - `noInsights` (default `false`): **No incluir en observaciones**. `insights.js` saltea por completo este registro; no se extraen hábitos, conteos de ánimo ni correlaciones de él.
  - `noReviews` (default `false`): **No incluir en revisiones**. Omite el contenido en revisiones semanales o mensuales y en la sección “Lo que guardé” de *Mi año*.
- **Opcionalidad y silencio:** ningún campo de privacidad es obligatorio. Si `privacy` no existe o sus banderas son `false`, el comportamiento es el habitual. Configurar la privacidad no deja marcas llamativas ni juicio moral: solo un candadito discreto en tinta suave en el encabezado.

### 7.12 Motor de deshacer y rehacer (DA2)
Un único contrato formal en `js/core/history.js` gestiona el historial de acciones reversibles:

- **Contrato de API (`MC.history.create({ limit = 50 })`):**
  - `push({ label, undo, redo })`: apila una acción con sus funciones de reversión y repetición, descarta la pila de rehacer y limita el tamaño a 50 comandos.
  - `undo()`: ejecuta la función `undo` del tope, pasa la acción a la pila de rehacer y notifica oyentes.
  - `redo()`: ejecuta la función `redo` del tope, devuelve la acción a la pila de deshacer y notifica oyentes.
  - `canUndo()`: booleano que indica si hay acciones para deshacer.
  - `canRedo()`: booleano que indica si hay acciones para rehacer.
  - `clear()`: vacía ambas pilas (por ejemplo, al cambiar de página o cerrar un editor).
  - `onChange(callback)`: suscribe una función receptora para refrescar el estado de los controles de la interfaz.
- **Una pila por superficie:** pilas independientes y aisladas para:
  1. *Scrapbook* (`scrapbook.js`): colocar, mover, rotar, escalar o despegar stickers y elementos.
  2. *Dibujo* (`draw.js`): trazos de lápiz, borrado con goma, agregado y movimiento de textos sobre la hoja de dibujo.
  3. *Acciones de actividad* (`activity.js`): marcar estado de punto cruz, mover a otro día, sacar actividad, renombrar.
- **Atajos de teclado:** `Ctrl+Z` (Deshacer) y `Ctrl+Shift+Z` / `Ctrl+Y` (Rehacer) en Windows/Linux (`Cmd+Z`, `Cmd+Shift+Z`, `Cmd+Y` en macOS).
  - **Regla estricta:** solo se interceptan los atajos cuando el foco del teclado **NO** está en un campo de texto editable (`input`, `textarea`, `[contenteditable]`). Dentro de campos de texto rige exclusivamente el deshacer nativo del navegador.
- **Controles táctiles:** botones visuales integrados en las barras de herramientas existentes (barra de dibujo, barra de herramientas de stickers, menú de acciones).
- **Accesibilidad:** el estado no depende solo del color: botones con glifos comprensibles de flecha curva, atributos `disabled` y `aria-disabled="true"`, opacidad diferenciada (50 % al estar inactivo) y etiquetas accesibles contextuales (`aria-label="Deshacer {label}"`).

### 7.13 Guardado visible y estados de persistencia (DA3)
La tranquilidad de que nada se pierde se transmite con un componente unificado `c.savedNote()` (`js/ui/components.js`):

- **Ciclo de estados:**
  - `guardando…`: texto tenue en Castoro/Atkinson, tinta suave (`--ink-faint` / `--ink-soft`), anuncia que hay cambios en camino a IndexedDB.
  - `guardado ✓`: confirmación en acento salvia (`--thread-done-text`) con tilde de bordado o corazón ♡. Se mantiene visible por ~1.5 segundos.
  - `reposo`: transición suave de desvanecimiento hacia un estado invisible sin ocupar espacio visual innecesario.
  - `fallo`: si IndexedDB rechaza la escritura o la cuota se agota, el indicador se transforma en un aviso amable: *“Todavía no se pudo guardar en el cuaderno; queda como borrador en este dispositivo.”*, acompañado de un botón directo para descargar una copia. En Ajustes, donde el cambio solo vive en la ventana si falla, el texto aclara esa condición.
- **Misma pieza en todas las superficies:** se reutiliza idéntica lógica y diseño en la página del día (`today.js`), en páginas libres (`pages.js`), en el scrapbook (`scrapbook.js`) y en Ajustes (`settings.js`).
- **Sin toasts repetitivos:** las microescrituras y ediciones continuas no generan carteles flotantes ni interrupciones visuales.
- **Respeto de motion:** transiciones de opacidad gobernadas por `--dur-ui` y `--ease-out`; en modos `reducidas` o `ninguna`, el cambio de estado es instantáneo sin animación.
- **Accesibilidad para lectores de pantalla:** atributo `aria-live="polite"` activo **únicamente** cuando se alcanza el estado `guardado` o `fallo`. El estado transitorio `guardando…` se silencia para no aturdir a quien escribe con tecnologías asistivas.

## 8. Tono y copy

- Español rioplatense (vos, querés, pieza). Breve, cálido, adulto.
- No abusar de diminutivos; no infantilizar; no asumir tristeza.
- Prohibido: “fallaste”, “incumplido”, “racha perdida”, “fracaso”, “no completaste”, signos de exclamación en cadena, emojis múltiples.
- Empty states propios: “Esta página todavía está en blanco.”, “Tu semana recién empieza.”, “Todavía no guardaste ningún recuerdo este año.”, “Cuando quieras, escribí la primera línea.”
- El ♡ se usa como firma, máximo una vez por pantalla.

## 9. Emociones

Una persona puede escribir una o varias palabras o frases cortas al empezar (`morning.feelings`) y al terminar (`evening.feelings`) el día; ambos campos son opcionales y se pueden vaciar. No hay escala, puntuación ni lista cerrada. Las sugerencias muestran solo palabras ya anotadas por esa persona. Cada palabra se ve junto a un hilo; el calendario y *Mi año* asignan hasta ocho colores según frecuencia en la vista, y un color fijado en Ajustes tiene prioridad. El texto siempre comunica el dato aunque no se distinga el color.

Una actividad guarda opcionalmente `feel.before` y `feel.after`, visibles en su fila y exportables. Las copias con `mood: 1..5` se siguen leyendo mediante los nombres del cuaderno de origen; `[]` significa que la persona quitó las emociones y no debe reponer el valor viejo. El contrato v6 retiró `mood` de la escritura con migración e instantánea; la lectura conserva compatibilidad.

## 10. Estados de actividad

| Valor | Etiqueta UI | Visual (lenguaje de bordado, ver DESIGN §6) |
|---|---|---|
| `pending` | (sin marcar) | cuadradito de tela vacío (4 agujeritos) |
| `done` | Lo hice | punto cruz completo ✕ en hilo salvia |
| `partial` | Hice un poquito | medio punto (una sola diagonal) en hilo durazno |
| `postponed` | Lo dejo para otro día | puntada corrida → en hilo lavanda; ofrece “pasar a mañana” |
| `skipped` | Hoy no salió | nudito francés (un punto) en tinta suave; el texto no se tacha |

Click en la casilla alterna `pending ↔ done`. El menú (…) ofrece los cinco.

## 11. Recurrencia de rutinas

`rule.type`:

| type | Campos | Ejemplo |
|---|---|---|
| `daily` | — | Todos los días |
| `weekdays` | `days: [0..6]` (0 = domingo) | Lun · Mié · Vie; semanal = un día |
| `weeklyTarget` | `count: 1..7` entero | Caminar 3 veces por semana, cualquier día; solo actividades |
| `interval` | `every: n` (días), ancla = `startDate` | Cada 3 días |
| `monthlyDay` | `day: 1..31` (si el mes es más corto → último día) | Todos los 15 |
| `monthlyNth` | `nth: 1..4 \| -1`, `weekday: 0..6` | Primer sábado del mes · Último domingo |
| `once` | `date` | Una sola vez, el 12/10 |

Todas aceptan `startDate` (default: fecha de creación) y `endDate` opcional (rutinas temporales). Las pausadas (`archived: true`) no generan nuevas oportunidades. En semanas parciales, la meta flexible se limita a la cantidad de días elegibles. `targetNote` permite escribir una duración/meta opcional, sin medir tiempo ni exigir una nota de cumplimiento.

**Materialización perezosa:** las ocurrencias no se guardan por adelantado. Se calculan al mostrar un día. Solo cuando la persona cambia el estado de una ocurrencia se crea un registro `activity` con `routineId` y `date`. Consecuencias: borrar o editar una rutina no reescribe el pasado ya registrado; los días futuros se ven al instante.

## 12. “Lo que fui notando” (insights)

Reglas:
- Solo descriptivo, con conteos (“8 de 11 veces”). Nunca porcentajes de “mejora”, nunca causalidad.
- Umbral mínimo: al menos 5 observaciones para comparar; si no, no se muestra ese insight.
- Nunca más de 6 a la vez. Desde A8 las cuentas por período van arriba y tienen su propio texto para cuando no hay nada.
- **Filtro estricto de privacidad y papelera:** cualquier día o entrada marcado con `privacy.noInsights === true` (PV1) o enviado a la papelera (`deletedAt != null`, DA1) queda completamente excluido de todos los cálculos de insights. Las observaciones nunca computan ni mencionan información protegida o descartada.

Cada observación dice de qué días habla (`day`, `days` o `routineId` + `month`), así se puede ir a verlos: “Ir a ese día”, “Ver los días” (lista desplegable de fechas) o “Ver en el calendario” (los días de la rutina). “Hoy empezaste este cuaderno” no lleva a ningún lado.

Catálogo actual: días desde que empezó el cuaderno; veces que escribió esta semana; rutina más acompañada del mes; palabra de emoción repetida esta semana; días con alguna palabra compartida al empezar y terminar; coocurrencia descriptiva entre una actividad hecha y una palabra anotada al cerrar; recuerdos guardados en el año. No clasifica palabras como mejores o peores. Las cuentas por período, mes a mes y victorias (A8) están en `MC.insights.period/periods/byMonth/victories`, con los mismos filtros de privacidad y papelera.

## 13. Datos, backup y exportación

Ver `DATA_MODEL.md` para esquema. Resumen:

- **IndexedDB** (`mi-cuaderno`): `meta`, `days`, `activities`, `routines`, `pages`, `images`, `files`, `weeks`, `templates`, `marks` y el store interno `outbox`. Versión IDB 5 (NB2); esquema de copia v12 aditivo (D59), sin stores nuevos.
- **localStorage**: solo preferencias livianas de UI (última ruta, cantidad de aperturas de tapa, borrador transitorio). Nada importante vive solo ahí.
- **Backup JSON**: `{ app: "mi-cuaderno", kind: "backup", schemaVersion: 13, exportedAt, data: {...} }`. Import valida estructura, aplica migraciones automáticas (`MIGRATIONS[v]`, incluidas v6 a v13), rechaza archivos de otra app o versiones futuras (> 13) con mensaje claro. Incluye elementos en papelera, marcas de `privacy`, emociones libres, semanas con su planificación, metas flexibles y duración, orden opcional de repeticiones, indicador de actividades iniciales, plantillas y marcas (victorias, recuerdos, especiales y creaciones terminadas). Después del contrato v6, Ajustes ofrece “Descargar la copia de antes”.
- **Restaurar = reemplazar** (con advertencia y opción de descargar la copia actual antes). No hay “merge” en v1 para evitar duplicados ambiguos.
- **Papelera y retención (DA1):** borrado suave universal con purga automática según `settings.trashRetentionDays` (default 30 días) y vaciado manual.
- **TXT**: diario legible, día por día.
- **CSV**: `dias.csv` y `actividades.csv` (UTF-8 con BOM para Excel, separador `,`, comillas RFC 4180).
- **XLSX**: generado localmente sin dependencias (ZIP + SpreadsheetML).
- **Impresión**: documento dedicado con `@page` A4 / A5 / Letter: portada, calendario mensual resumido, los días en secuencia (sin partir un día entre hojas), páginas libres y rutinas. Ignora elementos en papelera.
- **Recordatorio de copia**: nota suave en Hoy si pasaron N días desde la última copia (default 14) y hay datos.

## 14. Recordatorios / notificaciones

Honestidad técnica: sin servidor no existe push remoto. MI CUADERNO usa **notificaciones locales** (Notification API vía service worker cuando existe) que se disparan mientras la app o la PWA está abierta o en segundo plano (el navegador puede suspenderla). En Chromium instalado se intenta además *Periodic Background Sync* si está disponible. Esto se explica en Ajustes.

Ajustes: inicio del día (on/off + hora, default 08:30), cierre del día (on/off + hora, default 21:30), rutinas del día (off), mensaje de regreso tras ≥ 4 días sin abrir (off), modo *Normal / Tranquilo* (sin sonido, `silent: true`) */ Silencioso* (nada). Máximo 1 notificación por tipo por día. Nunca incluir contenido escrito por la persona en el texto de la notificación.

## 15. PWA

- Servida por HTTP(S): instalable (manifest, iconos, service worker offline-first, shortcuts: *Hoy, Escribir una nota, Registrar ánimo, Calendario*).
- Abierta por doble clic (`file://`): funciona igual, sin instalación ni service worker (los navegadores no lo permiten en `file://`).
- Actualización: el SW nuevo queda en espera; la app muestra “Hay una versión nueva del cuaderno — actualizar”.

### 15.1 Cuentas en la nube (base, sin desplegar · D36–D37)

Solo cuando el cuaderno se sirve desde Vercel con Supabase configurado (index con `<meta name="mc-cloud">`); en `file://` o en un servidor simple no cambia nada.
- **Entrar** (`/entrar`, D41): la lista de personas habilitadas (nombre, usuario y “administra”) para elegir con un toque o con flechas; el foco pasa al PIN de 6 números y el dispositivo recuerda a quién se eligió la última vez. Si la lista no carga, se escribe el usuario. Si se equivoca varias veces, se pide esperar con un texto amable. Debajo, **Instalar app** (cuando el navegador lo ofrece; en iPhone, la indicación de Compartir → Agregar a inicio; no aparece si ya está instalada) y **Activar notificaciones** (pide permiso solo al tocarlo; al entrar, ese dispositivo queda con los avisos de 8:30 y 21:30, que se cambian en Mi cuenta). Sin sesión, el cuaderno manda acá.
- **Preparar** (`/preparar`): con la clave `SETUP_TOKEN`, crea la primera persona, que administra. Deja de funcionar cuando ya hay alguien.
- **Mi cuenta** (`/cuenta`, enlazada desde Ajustes → Mi cuenta): cambiar el PIN (pide el actual); avisos en este dispositivo (mañana/noche, probar, desactivar); quien administra ve **Personas** (sumar, cambiar su PIN, poner en pausa/reactivar); todos ven **Quién puede ver mi cuaderno** (por sección: nada / ver / editar); cerrar sesión en este dispositivo.
- Al sumar una persona, quien administra elige si **tiene su propio cuaderno** o **mira el cuaderno de quien la suma** (por defecto). Quien mira abre ese cuaderno con la misma interfaz, sin tapa ni bienvenida, con un aviso fijo de quién es y qué puede editar; lo que no puede cambiar no se guarda y se le avisa con amabilidad (D38).
- Quien tiene cuaderno propio lo tiene en su dispositivo y, con cuenta en la nube, se sincroniza solo (cada cambio se sube; lo que editan otras personas con permiso llega cada 45 s o al volver a la pestaña). Cerrar sesión no borra nada. Las fotos, los dibujos y los adjuntos también viajan (NB1): quien tiene permiso en “Fotos y adjuntos” los ve; si una tarda en bajar, aparece cuando llega, nunca rota.

## 16. Accesibilidad

WCAG 2.2 AA como piso: contraste de texto ≥ 4.5:1, foco visible propio, todo operable por teclado (incluye stickers: flechas mueven, `[` `]` rotan, `Supr` borra), labels en todos los inputs, `aria-live` para “guardado”, decoraciones con `aria-hidden`, targets ≥ 44 px en táctil, respeto de `prefers-reduced-motion` y del ajuste interno.
- **Deshacer y rehacer (DA2):** botones con nombres accesibles (`aria-label="Deshacer {acción}"`), estados deshabilitados con `disabled` y `aria-disabled="true"`, y percepción no dependiente del color. Los atajos globales `Ctrl+Z` / `Ctrl+Shift+Z` ceden el paso en campos de texto para respetar el historial nativo del sistema.
- **Guardado visible (DA3):** el atributo `aria-live="polite"` se activa únicamente en los anuncios de `guardado` y en fallos de almacenamiento; el estado transitorio `guardando…` se silencia para no interferir con la lectura del lector de pantalla.

## 17. Casos borde que deben funcionar

Sin datos · un día · 30 días · un año (365 días + 1000 actividades) · muchas rutinas (30+) · rutina borrada con historial · fecha pasada y futura · cambio de mes/año · 29 de febrero · regla “día 31” en meses cortos · import del mismo backup dos veces (reemplaza, no duplica) · backup inválido / de otra app / versión futura · almacenamiento lleno o IndexedDB no disponible (aviso + modo de emergencia en memoria con exportación) · dos pestañas abiertas (BroadcastChannel: el calendario de la otra pestaña se redibuja solo; el cuadro abierto se refresca solo si no se está escribiendo) · una pestaña vieja que retiene la base mientras otra la actualiza (se espera con aviso, nunca modo memoria; la vieja guarda lo pendiente antes de soltarla y recarga) · una base de una versión más nueva que el código (se pide recargar) · restauración de elementos desde la papelera · días y páginas con banderas de privacidad activadas.

## 18. MVP (criterio de “funciona”)

Abrir · cerrar · volver a abrir con los datos · registrar ánimo inicial/final · crear/completar actividades con 5 estados · escribir · navegar fechas · crear rutinas con recurrencia · calendario semana/mes · exportar backup · restaurar backup. Todo lo demás es incremento.

## 19. Stack, estructura y comandos

- **Stack:** HTML + CSS + JavaScript clásico (scripts sin `type="module"`, porque Chrome bloquea módulos en `file://`). Sin framework, sin paso de build. Todo lo que usa la app está dentro del repo (fuentes incluidas, sin CDN).
- **Distribución:** la raíz del repo *es* la app. `index.html` abre con doble clic. Publicada por HTTPS (GitHub Pages) es PWA instalable. `npm run dist` arma `dist/MI-CUADERNO/` (solo los archivos de la app, sin `skills/`, tests ni herramientas) y un `.zip` para regalar.
- **Estructura:**

```
index.html            entrada única
manifest.webmanifest  PWA
sw.js                 service worker (solo http/https)
css/                  tokens, base, cuaderno, componentes, vistas, impresión
js/core/              lógica pura + almacenamiento (sin DOM salvo store); rutas en routes.js; historial en history.js
js/ui/                íconos, stickers, componentes, motion, escenas
js/views/             una vista por archivo
js/app.js             router + arranque
assets/fonts/ icons/  fuentes woff2 e íconos PNG/ICO
tests/unit/           node:test sobre js/core
tests/e2e/            Playwright (Chromium) sobre file:// y http://
tools/                generación de íconos, servidor local, dist
skills/               colección de skills (no es parte de la app)
```

- **Comandos (desarrollo, nunca para la persona usuaria):**
  - `npm test` — unit tests (node:test, sin dependencias).
  - `npm run e2e` — 21 recorridos con `playwright-core` contra `file://` y `http://127.0.0.1` (usa el Chromium del sistema; `CHROMIUM=/ruta` para cambiarlo).
  - `npm run check` — `node --check` de todos los JS + unit + e2e.
  - `npm run serve` — servidor estático en `http://localhost:4173` para probar la PWA.
  - `npm run icons` — regenera PNG/ICO desde los SVG maestros.
  - `node tools/build-fonts.mjs` — regenera `css/fonts.css` (fuentes embebidas) si cambian los `.woff2`.
  - `npm run dist` — arma la carpeta distribuible.

## 20. Estrategia de pruebas

- **Unit (node:test):** fechas, recurrencias (incluye 29/02, día 31, n-ésimo día, intervalos, temporales y metas flexibles), materialización de rutinas, progreso diario/semanal e historial de planes, instalación única de actividades iniciales y reintentos, validación y migración de backups (v1→…→v12, contrato v6 puro, v10/v11/v12 aditivas, rechazo de versiones más nuevas), plantillas y bloques de hojas, cuentas del año y victorias, motor de temas (AA), pinceles y balde, historial de deshacer/rehacer (`MC.history`: límites, reversión, eventos), papelera (DA1: soft-delete, retención, purga, restauración), privacidad emocional (PV1: exclusión en insights y recuerdos), CSV (escapes), ZIP/XLSX (estructura válida), insights (umbrales, redacción no causal).
- **E2E (Playwright/Chromium):** primera apertura → onboarding → registrar ánimo → actividades con estados → recargar y ver persistencia → rutina que aparece → calendario → exportar JSON → borrar → restaurar → datos de vuelta. En `file://` y en `http://` (SW registrado, offline con red cortada). Viewports 375×812, 820×1180, 1440×900.
- **QA visual:** capturas desktop + mobile revisadas contra DESIGN.md; detector de `impeccable` una vez al final.

## 21. Límites

- **Siempre:** correr `npm run check` antes de commitear; mantener SPEC/DESIGN/AGENTS al día; validar todo archivo importado; `aria-hidden` en decoración.
- **Preguntar antes:** agregar dependencias de runtime, cambiar el esquema (requiere migración + `schemaVersion`), cambiar la paleta de ánimos, agregar un destino de navegación.
- **Nunca:** enviar contenido del cuaderno a un servidor fuera de la sincronización aprobada (B5, D35–D37), agregar analytics, lenguaje de culpa, sonido automático, pedir permisos al abrir, cargar recursos de CDN en runtime.

## 22. Criterios de éxito

1. Doble clic en `index.html` (Chrome/Edge/Firefox) abre la app, y los datos sobreviven a cerrar el navegador.
2. Servida por HTTPS: instalable, abre sin conexión, se actualiza avisando.
3. Registrar ánimo + marcar una actividad al abrir: ≤ 3 interacciones.
4. Export JSON → borrar todo → import → estado idéntico (test automatizado).
5. Sin errores de consola en los recorridos E2E; contraste AA en texto; operable solo con teclado.
6. Con “Reducidas” o “Ninguna”: sin escenas ni desplazamientos (el default es “Completas”, D23).
