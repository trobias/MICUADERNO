# MI CUADERNO — Backlog

Cada idea pendiente, con su estado. **Nada se pierde por estar fuera de la fase actual.** El orden y las fases están en [`ROADMAP.md`](ROADMAP.md); el porqué de las ideas nuevas, en [`VISION.md`](VISION.md) (los números `[n]` son los del pedido original); lo hecho, en [`CHANGELOG.md`](CHANGELOG.md).

**Estados**

| Estado | Quiere decir |
|---|---|
| **NOW** | entra en la próxima entrega (fase actual del roadmap) |
| **NEXT** | después de NOW; el diseño está claro |
| **LATER** | vale la pena, pero depende de otras cosas o no es prioridad |
| **NEEDS DESIGN** | antes de programar hay que decidir cómo se ve o cómo se comporta |
| **NEEDS RESEARCH** | depende de una API, de privacidad o de rendimiento que hay que averiguar |
| **EXPERIMENTAL** | probar en chico; si no suma, se descarta |
| **BLOCKED** | espera otra cosa (dice cuál) |

**Dónde estamos (03/10/2026):** no hay ítems de producto en NOW porque la Fase 1 se cerró el 02/10 (ver “Cerrados recientemente”, al final). Lo próximo según `ROADMAP.md`: verificación V7 → V1–V6, después la Fase 5 (ES1–ES3, PE5) y la Fase 2 (EL1 primero). Al tomar uno, pasalo a NOW.

Al empezar un ítem: pasarlo a NOW, leer `VISION.md` §0 y la decisión que lo cubre (D25 para todo lo de la visión). Al terminarlo: sacarlo de acá y anotarlo en `CHANGELOG.md`.

---

## DA · Datos: papelera, deshacer, almacenamiento, copia

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| DA5 | **Formato `.micuaderno`**: ZIP con `manifest.json`, `data.json` y `media/` (imágenes, audio) en vez de data URLs en el JSON; abrir copias `.json` viejas igual. [73] | NEXT | MD1 | `zip.js` ya escribe ZIP “store”; falta leerlo (sin dependencias). |
| DA6 | **Copia completa** de todo lo nuevo a medida que aparece (etiquetas, colecciones, elementos, referencias, cartas, canciones, audio, portada, separadores). [72] | NOW (regla) | — | Regla permanente: cada feature nueva entra en `backup.js` con migración y test (AGENTS.md). |
| DA7 | Casos de error con degradación elegante: archivo grande, imagen corrupta, audio sin permiso, IndexedDB lleno, portapapeles denegado, sin `MediaRecorder`, copia vieja, carta con fecha pasada, URL inválida. [76] | NOW (regla) | — | Ya hay: modo memoria, mensajes de imagen ilegible y archivo > 10 MB. |
| DA8 | Importar **fusionando** en vez de reemplazar (traer el cuaderno del celular a la compu). | LATER | DA5 | Antes I3. D10 lo dejó afuera. |
| DA9 | Copia automática a un archivo elegido (File System Access API). | NEEDS RESEARCH | DA5 | Antes I4. Solo Chromium de escritorio. |

## EL · Motor de elementos de página (scrapbook común)

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| EL1 | **Motor común de elementos** (`PageElement`): `type`, `x`, `y`, `w`, `h`, `rot`, `scale`, `z`, `locked`, `style`, `content`, `meta`; superficies = día, página, revisión, portada, sobre. [1, 20] | NEXT | DA1, DA2 | D25: nace de `Placed` (stickers) con migración; `scrapbook.js` pasa a ser el editor de todos los tipos. |
| EL2 | Operaciones: duplicar, bloquear/desbloquear, traer adelante / enviar atrás, borrar a la papelera. [21] | NEXT | EL1 | Hoy: mover, rotar, tamaño, despegar. |
| EL3 | **Barra contextual** según lo seleccionado (foto · texto · sticker · dibujo). [66] | NEXT | EL1 | Hoy la barra de decorar es una sola. |
| EL4 | **Post-its**: mover, redimensionar, rotar apenas, paleta limitada, formas cuadrada/rectangular/rasgada. [29] | NEXT | EL1 | Antes parte de B2. |
| EL5 | **Notas al margen** (texto chico en el margen rosa, acompaña párrafo/foto/página). [28] | NEXT | EL1, EL4 | Comparte base de texto con post-it. |
| EL6 | **Polaroid** como estilo de `image` (marco, sombra, espacio abajo, fecha y descripción opcionales). [25] | NEXT | EL1 | |
| EL7 | Más estilos de foto (cinta, papel fotográfico, círculo, corazón, forma orgánica) sobre la misma arquitectura. [26] | LATER | EL6 | No diez estilos de entrada. |
| EL8 | Texto suelto, cinta con texto, fecha-sello, sellos. | LATER | EL1 | Antes B2. |
| EL9 | **Dibujo como elemento**: resaltador, rehacer, presión del lápiz cuando exista, ocultar/duplicar. [18–19] | NEXT | EL1, DA2 | Hoy `draw.js` con lápiz, goma, texto, deshacer; el dibujo es un sticker `img:<id>`. |
| EL10 | **Snap suave** a bordes, centro y márgenes; desactivable (tecla o ajuste). [22] | EXPERIMENTAL | EL1 | Snap a otros objetos: probar después. |
| EL11 | Selección múltiple. [21] | EXPERIMENTAL | EL1 | Solo si hace falta de verdad. |
| EL12 | Gestos táctiles: mantener apretado para el menú, pellizcar para escalar/rotar. [67] | NEXT | EL1 | |
| EL13 | Exportar un dibujo como PNG suelto; capas en el dibujo. | LATER | EL9 | Antes I10. |
| EL14 | Páginas libres sin estructura fija (solo foto, solo dibujo, mezcla). [64] | NEXT | EL1 | Hoy una página es texto o lista + stickers. |

## ME · Memorias (referencias comunes)

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| ME1 | **Referencias** (`MemoryReference`): marcar cualquier día, entrada, página, foto, carta o recuerdo sin copiar datos. [62] | NEXT | PV1 | D25: store `marks` con `{ id, sourceType, sourceId, kind, color, createdAt }`. |
| ME2 | **Favorito** (especial) y **marcador** (volver) como dos tipos. [10] | NEXT | ME1 | |
| ME3 | **Marcadores físicos** que asoman del borde de la hoja, con colores-significado personalizables (rosa especial · amarillo volver · verde recuerdo lindo · lavanda importante). [10–11] | NEEDS DESIGN | ME2 | Convivir con los marcadores de navegación (D22) sin confundirlos. |
| ME4 | **Pequeñas victorias**: marcar cualquier momento; página que las junta (papelitos/flores/estrellas/sellos) y abre el día. Sin XP ni niveles. [39–40] | NEXT | ME1 | Hoy existe la plantilla de página “Mis pequeñas victorias”. |
| ME5 | **Recuerdos positivos**: taxonomía simple (lindo · especial · quiero recordarlo · victoria). [58] | NEXT | ME1 | “Qué quiero guardar” (`reflection.keep`) cuenta como recuerdo. |
| ME6 | **Abrime algo lindo ♡**: azar **solo** entre lo marcado lindo/especial/victoria/quiero recordar. [59] | NEXT | ME5, PV1 | Nunca una entrada cualquiera. |
| ME7 | **Volver a mí** (nombre a elegir: *Mis recuerdos*, *Lo que fui guardando*, *Pedacitos de mí*…): recuerdos, fotos, victorias, frases, canciones, dibujos, cartas abiertas. Nunca pendientes ni estadísticas. [60–61] | NEEDS DESIGN | ME5, MD1 | |
| ME8 | **Recuerdos suaves** (“Hace un mes escribiste esto ♡”) dentro del cuaderno, apagables; también “Un día como hoy”. [4] | NEXT | PV1, ME1 | Respeta privacidad por entrada y modo calma. |

## PV · Privacidad emocional y privacidad local

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| PV2 | **Ocultar mi cuaderno** al instante (difumina y tapa), con atajo sin conflictos (propuesto `Ctrl+Shift+L`; verificar). [33] | NEXT | — | Barato y útil ya. |
| PV3 | **Bloqueo local opcional** (PIN/contraseña), manual, por inactividad, al minimizar, al cerrar; guarda antes de bloquear. [32, 34] | NEEDS RESEARCH | PV2 | D25: decidir si es solo una “pantalla” (privacidad visual) o cifrado real con WebCrypto (clave derivada del PIN); ser honestos en la UI sobre cuál es. |

## OR · Organización y búsqueda

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| OR1 | **Buscar en mi cuaderno…**: texto, fecha, rango, título, actividad, rutina, emoción, recuerdo, adjunto, canción, etiqueta, colección… con contexto suficiente en cada resultado; se siente como un índice/fichero. [6] | NEXT | PV1 | Antes I1. Índice en memoria construido desde IndexedDB; los sobres cerrados no aparecen. |
| OR2 | **Filtros progresivos** (Fecha · Tipo · Etiqueta · Estado · Tiene foto · Tiene canción · Es favorito). [7] | NEXT | OR1 | |
| OR3 | **Etiquetas** libres como sellos/etiquetas de papel. [8] | NEXT | — | Nunca badges. |
| OR4 | **Colecciones** opcionales (una entrada en ninguna, una o varias). [9] | LATER | OR3, ME1 | Pueden ser referencias (ME1) con nombre. |

## RV · Revisiones

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| RV1 | **Esta semana**: página editorial generada + preguntas opcionales editables. [1] | NEXT | PV1 | Base: `summarize`, `insights` con días, recuerdos. Días vacíos sin interpretar [49]. |
| RV2 | **Revisión mensual**: doble página con scrapbook automático editable (la app propone, la persona termina). [2] | LATER | RV1, EL1 | |
| RV3 | **Mi año, capítulo anual** lento y navegable + “Lo que quiero guardar de este año”. [3] | LATER | RV2, ME5, MD1 | Hoy *Mi año* = bastidor + notando + lo que guardé. |
| RV4 | Más “Lo que fui notando”: comparaciones de semana, energía y sueño (siempre descriptivo). | LATER | RV1 | Antes B8. |

## CA · Cartas, cosas sueltas, captura rápida

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| CA1 | **Sobre**: contiene texto, imagen, dibujo, sticker, canción, nota, audio; *abrir cuando quiera* o *no abrir hasta…*; cerrado = sin previews ni aparición en buscador/recuerdos/insights/revisiones. [54–56] | LATER | EL1, PV1 | Hoy: plantilla “Carta para mi yo futuro”. |
| CA2 | Apertura del sobre (solapa, papel), pequeña y con el nivel de motion. [57] | LATER | CA1 | |
| CA3 | **Cosas sueltas** (inbox): capturar sin elegir lugar; después mover a una página, volver recuerdo/actividad, archivar. [30] | NEXT | — | |
| CA4 | **Captura rápida** desde cualquier sección sin salir de la página (atajo tipo `Ctrl+Shift+N`, verificar conflictos). [31] | NEXT | CA3 | |

## PE · Personalización

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| PE1 | **Portada personalizable** con el mismo motor de elementos (color, textura, título, subtítulo, nombre, año, estampado, adornos, señalador, sticker, dibujo). [35] | LATER | EL1 | Hoy 4 telas + tapa animada. |
| PE2 | **Portadas guardadas** (y base para varios cuadernos). [36] | LATER | PE1 | |
| PE3 | **Separadores propios** (nombre, color, ícono, dibujito, sticker) y **orden** de los marcadores. [37–38] | NEEDS DESIGN | OR4 | Un separador propio ≈ una colección con pestaña (D22). |
| PE4 | Papel del día (rayado/cuadriculado), densidad, más tapas. | LATER | PE1 | Antes B7. |
| PE5 | **Papel de noche** (tema oscuro) para escribir a oscuras. | NEXT | — | Antes B1. |

## ES · Escritura, calma y bloques

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| ES1 | **Solo escribir** (oculta todo menos página, fecha y texto) + **pantalla completa** a pedido. [14–15] | NEXT | — | |
| ES2 | **Modo calma** (`calmMode`), independiente del nivel de motion. [16–17] | NEXT | — | Apaga escenas, insights secundarios, decoraciones y avisos visuales; no borra nada. |
| ES3 | **“No quiero explicarlo”**: registrar un día difícil con lo mínimo (sello, color, una línea o nada). [47] | NEXT | — | Nunca pedir más. |
| ES4 | **Bloques flexibles y opcionales**: títulos propios, ocultar/eliminar/reordenar bloques reflexivos. [45–46] | NEEDS DESIGN | ES5 | Hoy hay secciones fijas (algunas apagables en Ajustes). |
| ES5 | Evaluar **`ContentBlock`** para páginas y cartas (no para todo a ciegas). [63] | NEEDS DESIGN | EL1 | D25: primero páginas libres y sobres. |
| ES6 | Papelito tras completar algo (“¿Querés escribir cómo te hizo sentir?”), dentro de la app. | LATER | ES2 | Antes B6. |

## MD · Media

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| MD1 | **Imágenes optimizadas**: miniatura aparte, Blob en IndexedDB en vez de data URL, carga diferida, object URLs liberadas, deduplicar por hash. [24, 71] | NEXT | — | Hoy: rasterizadas a 900 px como data URL (D24). |
| MD2 | **Arrastrar y soltar** y **pegar del portapapeles** imágenes en cualquier hoja. [24] | NEXT | — | Portapapeles denegado → mensaje amable. |
| MD3 | **Notas de voz** con `MediaRecorder` (grabar, reproducir, renombrar, borrar, pegar en una página), con forma de casetera/cinta. [27] | LATER | MD1, EL1 | Sin `MediaRecorder` → no aparece la opción. |
| MD4 | **Canciones**: tarjeta desde un link de Spotify/YouTube/YouTube Music/URL, con título, artista y nota; offline-first; nunca reproductor. [50–53] | NEEDS RESEARCH | EL1 | Choca con “sin fetch a terceros” (AGENTS): por defecto se guarda solo lo que la persona escribe + el proveedor reconocido por la URL; traer título/portada solo con un toque explícito y avisando. D25. |

## NO · Notificaciones

| # | Qué | Estado | Depende de | Notas / hoy |
|---|---|---|---|---|
| NO1 | **Categorías independientes** con horario donde tenga sentido y presets sensatos. [41–42] | LATER | V3 | Hoy: mañana, noche, rutinas, “volver” (D11). |
| NO2 | **No molestar** (franja horaria) y no notificar mientras la app está en uso. [43] | LATER | NO1 | |
| NO3 | Mensajes que reaccionan a lo que pasó, sin insistir. [44] | LATER | NO1 | |
| NO4 | Frases suaves / mensajes sorpresa opt-in (máx. 1 por semana). | LATER | NO1 | Antes B5. |

## Producto y mejoras sueltas (de antes de la visión)

| # | Qué | Estado | Notas |
|---|---|---|---|
| B4 | Escenas que faltan (lluvia en la ventana, cortina, flor con viento, esquina de hoja con brisa). | LATER | Hay 5 de 9. Se apagan con el modo calma (ES2). |
| B9 | Empaquetado portable (Tauri) para quien no quiera navegador. | EXPERIMENTAL | Solo si hace falta. |
| I2 | Sacar una ocurrencia de rutina de un día puntual (“hoy no toca”). | NEXT | |
| I5 | *Mi año* alternando ánimo al empezar / al terminar. | LATER | |
| I6 | Reordenar actividades del día arrastrando (con teclado). | LATER | |
| I7 | Hora opcional y recordatorio por rutina. | LATER | Encaja con NO1. |
| I9 | En el mes, tocar la marca de página para abrirla directo. | LATER | |

## T · Deuda técnica

| # | Qué | Estado | Notas |
|---|---|---|---|
| T1 | Partir `js/views/today.js` (≈370 líneas) en encabezado, cierre y cuerpo. | NEXT | Conviene antes de ES4. |
| T2 | E2E de “pasar a mañana”, deshacer al sacar, stickers con teclado, restaurar scroll. | NEXT | |
| T3 | Subir `CACHE_VERSION` automáticamente en `npm run dist`. | NEXT | Hoy `v19`. |
| T4 | Sacar los `woff2` duplicados del dist (las fuentes ya van embebidas). | LATER | |
| T5 | Un ícono por atajo de la PWA. | LATER | |
| T8 | Los números de la suite (unit/E2E) y la caché se repiten a mano en `AGENTS.md`, `HANDOFF.md`, `ROADMAP.md` y `README.md`, y se desactualizan. | LATER | Junto con T3: que `npm run check`/`dist` los informe, o nombrarlos en un solo lugar. |

## BLOCKED / descartado

| # | Qué | Estado | Por qué |
|---|---|---|---|
| X1 | Varios cuadernos en la misma app. | BLOCKED | Espera PE2 (portadas guardadas) y DA5 (`.micuaderno`). |
| X2 | Reutilizar “Ponytail” para edición visual. | BLOCKED | No existe en el repo (revisado el 2026-10-01); no se inventa la dependencia. |
| — | Rachas, puntajes, badges, XP, monedas, niveles, rankings, confeti. | Descartado | Filosofía (brief §4, §42; VISION [39]). |
| — | “Wrapped” hiperestimulante, dashboards de ánimo. | Descartado | VISION [3]. |
| — | Reproducir música dentro de la app. | Descartado | VISION [53]: recordar qué sonaba, no ser un reproductor. |
| — | Push remoto con servidor; sonido ambiente por defecto. | Descartado | D11; brief §44. |
| — | Sugerencias del `--design-system` de `ui-ux-pro-max` (índigo, manuscrita principal, landing). | Descartado | D16. |

## Cerrados recientemente (traza para quien llega sin contexto)

Ya no están arriba porque están hechos. El detalle, en `CHANGELOG.md` (por fecha) y el contrato, en la decisión indicada.

| # | Qué quedó | Cuándo | Dónde mirar |
|---|---|---|---|
| DA1 | Papelera: borrado suave (`deletedAt`) en páginas, rutinas, imágenes, dibujos y adjuntos; restaurar, vaciar, retención (30 días por defecto, 0 = nunca) con aviso al acortarla; un día en papelera se restaura al editarlo. Sacar actividades sigue siendo definitivo con “Deshacer”. | 02/10/2026 | D26, `SPEC.md`, `DATA_MODEL.md`, `js/core/model.js`, `js/views/settings.js` |
| DA2 | Deshacer/rehacer por superficie (`MC.history`): stickers, dibujo y acciones de actividades; `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+Y` solo fuera de campos de texto; botones en las barras existentes. | 02/10/2026 | D26, `js/core/history.js` |
| DA3 | “guardando… → guardado ✓” igual en día, página, scrapbook y Ajustes; aviso amable si no se pudo guardar. | 02/10/2026 | D26, `c.savedNote` en `js/ui/components.js` |
| DA4 | Cuánto ocupa el cuaderno: **retirado el 04/10/2026** a pedido de la dueña (“innecesario”). | 02/10 → 04/10/2026 | `CHANGELOG.md` 04/10 |
| PV1 | Privacidad por día o página (no recuerdo / no insights / no revisiones); esquema v4 con migración desde v3. | 02/10/2026 | D26, `DATA_MODEL.md`, `js/core/backup.js` |
| T6 | En el celular, los marcadores se esconden mientras el teclado está abierto. | 02/10/2026 | DESIGN §10, `js/app.js` |
| — | La ✕ del cuadro vuelve siempre al calendario (antes fallaba al ir y volver a la misma hoja). | 03/10/2026 | `CHANGELOG.md`, `js/app.js` |
| T7 | Cerrar el cuadro después de recargar (o de actualizar el SW) vuelve por el historial: el recorrido vive en `sessionStorage`. También: doble cierre sin retroceder de más, arranque directo en un cuadro (PWA, notificación, `?go=`) y fin de la bienvenida dejan el calendario detrás. | 04/10/2026 | `js/app.js` (`seedBase`, `saveTrail`, `requestClose`) |
