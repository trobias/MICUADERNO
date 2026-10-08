# MI CUADERNO — DESIGN

> Reglas visuales, de interacción y de motion. Si una decisión no está acá, se decide en coherencia con §1 y se agrega acá.

**D62 · interacciones de papelería:** referencias de Be UI reinterpretadas con los tokens existentes: hojas salvia/manteca/rosa/lavanda, carpetas por mes, bolsillos con notas y controles discretos plegados. Las casillas mantienen sus estados; los contadores muestran siempre el valor real. Menos/más conserva entrada editable; arrastre y gesto tienen alternativa visible de teclado/toque. En móvil los diálogos se apoyan abajo, conservando cierre y foco nativos. Filtros se cierran al aplicarse. Visor: foto protagonista, miniaturas y zoom explícito; collage solo al abrirlo y por tandas. Mosaico neutro, con texto y glifos de escritura/victoria, nunca niveles que juzguen a la persona. Sin movimiento inicial ni loops nuevos, sin animar guardado/contadores mientras se escribe; sistema reducido y Ajustes mandan. Contratos y destinos en `docs/BEUI.md`.

## 1. Esencia

**Un diario de tela, bordado a mano, que se abre sobre la mesa.**

- La tapa es **tela de encuadernar** (lino) de un color pleno, con una mariposa bordada y un elástico.
- Abierto, la tela de la tapa **enmarca** las hojas: el fondo de la app *es* el interior de las tapas, no un escritorio ni un gradiente.
- Las hojas son **papel crema** con renglones suaves y margen rosado.
- Lo que la persona marca se **borda**: las actividades se completan con **punto cruz**, las emociones escritas llevan un hilo junto a su palabra y el año es un **bastidor de punto cruz** que se va llenando día a día.
- Los adornos son **papelería**: cintas-marcador, washi tape, stickers troquelados, notas adhesivas. Pocos y bien puestos.

Test de identidad: si sacás el logo y cambiás el color, ¿sigue pareciendo un diario de tela bordado? Si no, está mal.

### Contrato de dirección (resumen del comentario en `index.html`)
- **Tesis:** el registro diario como bordado lento; rechaza las cards de hábitos y las rachas. A8 sumará gráficos de conteos útiles dentro del cuaderno, según D31, sin convertirlo en un tablero de puntajes.
- **Mundo propio:** tela de encuadernar a página completa + papel crema + hilo de bordar como color de dato.
- **Primer viewport actual:** cuaderno abierto; fecha grande, campo discreto para escribir cómo te sentiste y lista del día con casillas de punto cruz. Acción principal: escribir una palabra propia o marcar una actividad. A6 pondrá la semana planner al centro.
- **Interacción firma:** marcar una actividad borda una ✕ en dos puntadas.

### Mi año · álbum de momentos (D59)
Victorias con estrella SVG existente, fondo de papel suavemente teñido de salvia y costura lateral; recuerdos en papel manteca con fotografía o dibujo opcional. Fechas discretas, títulos en Castoro, meses manuscritos y origen expresado en texto. Seis entradas al abrir; revelar el resto conserva foco. Una sola hojita contextual para elegir significado y frase opcional, con menús/diálogos existentes. Sin ranking, confeti, animaciones repetidas ni nuevas librerías; motion del cuaderno y movimiento reducido existentes. Las barras individuales de Progreso miden 24 px, con verde menta y amarillo manteca pastel, contorno suave y esquinas de 6 px. Los rellenos tienen tokens propios para conservar los hilos oscuros de texto y estados.

## 2. Principios de composición

1. **Una hoja, una intención.** Cada sección del día es un bloque de texto sobre renglones, no una card.
2. **Aire.** Más espacio arriba de un título que abajo. Nunca llenar las esquinas.
3. **Máximo un adorno por zona visual** (una cinta, un sticker, una nota). La decoración vive en los bordes, nunca encima de un campo de texto.
4. **Jerarquía por tipografía y tinta**, no por cajas: título en Young Serif, pregunta en Castoro itálica, controles en Atkinson.
5. **Nada de eyebrows/kickers** (etiquetas en mayúscula sobre títulos). El título habla solo.
6. **Cards permitidas solo si son objetos físicos:** nota adhesiva, ficha, papelito, sticker.

## 3. Color

### 3.1 Papel y tinta
| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#FFF9ED` | hoja |
| `--paper-shade` | `#F6EDDA` | borde/sombra interna de la hoja, lomo |
| `--paper-edge` | `#EADFC8` | canto de hojas apiladas |
| `--rule` | `#E3DCEB` | renglones (lavanda muy claro) |
| `--margin` | `#EDB9C4` | línea de margen |
| `--ink` | `#493D3B` | texto principal (≈10:1 sobre papel) |
| `--ink-soft` | `#796966` | texto secundario (≈5:1, AA) |
| `--ink-faint` | `#B3A5A0` | **solo** decoración y placeholders grandes (no texto normal) |
| `--placeholder` | `#796966` | placeholders en itálica (≥4.5:1) |

### 3.2 Pasteles de papelería (fondos de objetos, nunca texto)
`--butter #F6D978` · `--blush #F4B9C6` · `--rose #D98FA1` · `--peach #F4C3A2` · `--sage #B9CBA7` · `--lavender #C9B8DE`

Uso: notas adhesivas (butter), cintas (rose/butter), washi (blush/sage/lavender a 75 % de opacidad), pestañas del índice (una por destino).

### 3.3 Hilos (color que **codifica** algo)

**Emociones escritas (D28, A4)** — no hay rampa ordinal ni cinco valores predefinidos. Cada vista cuenta palabras y asigna hasta ocho hilos `--emotion-1…8` por frecuencia; las menos usadas llevan tinta neutra. En Ajustes se puede fijar un color `#RRGGBB` para una palabra, que tiene prioridad. La palabra aparece **siempre** en texto (Día, actividad, celda, leyenda o nombre accesible del punto del Año): el color solo ayuda a encontrarla. Los ocho hilos base viven en `css/tokens.css` y no cambian con el tema del cuaderno. Las variables `--mood-*` restantes pertenecen a la paleta de dibujo y a acentos históricos; no son una escala de datos.

**Estados de actividad** (hilo sobre papel, ≥3:1 como componente gráfico):
`--thread-done #5F8150` (salvia oscura) · `--thread-partial #BF6E3F` (durazno tostado) · `--thread-later #6E5CA0` (lavanda oscura) · `--thread-skip` = `--ink-soft`.
Para **texto chico** en color de hilo (“un poquito”, “guardado”, “×2”) se usan las variantes `--thread-done-text #4E6B41` y `--thread-partial-text #9E552B` (≥4.5:1).

### 3.4 Tela de tapa (color de página completa)
| Tapa | `--cloth` | `--cloth-deep` (tramado) | `--cloth-ink` (texto sobre tela) |
|---|---|---|---|
| salvia (default) | `#6F8A6A` | `#5F7A5A` | `#FFF9ED` (3.6:1) |
| rosa viejo | `#B07385` | `#9C6273` | `#FFF9ED` (3.6:1) |
| lavanda | `#857AA8` | `#736896` | `#FFF9ED` (3.8:1) |
| manteca | `#DDB450` | `#C99F3F` | `#493D3B` (5.3:1) |

Texto sobre tela: solo el de la tapa y el de las pestañas (sobre papel de color). Nunca párrafos sobre tela.

### 3.4b Colores que no cambian con el tema
Viven en `css/tokens.css` como cualquier otro, pero un tema propio no los toca: el arte de los stickers y de la mariposa de la tapa (`--st-*`, pintado con clases `sf-*`/`ss-*`), el elástico de la tapa (`--elastic*`), el bastidor de madera del año (`--wood*`, `--hoop-cloth`, `--hole`) y la impresión (`--print-*`: siempre tinta sobre blanco). Un test guardián falla si aparece un color en hex fuera de `tokens.css` (en JS solo se admite con la marca `color-ok` y una razón).

### 3.4c Colores propios (A9, D30)
`MC.theme.derive` arma los tokens desde tela, hojas, tinta y 4 acentos (acentos → `--butter`, `--rose`, `--sage`, `--lavender`; `--blush`, `--peach`, `--margin`, `--rule*`, `--paper-*`, `--ink-*`, `--cloth-*` salen de mezclas) y los pone en `<body>` (así ganan sobre `[data-cover]`). Tokens nuevos: `--cloth-layers` (de fábrica, solo la trama; con tema, brillo + trama + degradado), `--on-accent` (texto sobre un acento lleno: marcadores, nota adhesiva) y `--field` (fondo de los campos). En hojas oscuras (*Noche*) los hilos de estado se aclaran para leerse; los hilos de las emociones no cambian. Ojo: un token definido con `var()` en `:root` se resuelve ahí; si depende de un color del tema, el motor lo fija aparte.

### 3.5 Superficies del navegador
`::selection` fondo `--butter`, texto `--ink`. `caret-color: --mood-3` (hilo de tinta del lápiz, no codifica emoción). Scrollbar: `scrollbar-color: var(--paper-edge) transparent; scrollbar-width: thin`. Foco: ver §11.

## 4. Tipografía

Todas autoalojadas (woff2, subset latin, OFL). Se sirven **embebidas en `css/fonts.css`** como data URI (generado por `tools/build-fonts.mjs`): Chrome y Firefox bloquean `@font-face` desde archivos locales en `file://`, y la app tiene que verse igual con doble clic.

| Rol | Familia | Por qué |
|---|---|---|
| Display (tapa, fechas, títulos de página) | **Young Serif** 400 | serif blanda de imprenta, como una etiqueta estampada en la tela. |
| Escritura y preguntas | **Castoro** 400 + itálica | serif de texto cálida con itálica caligráfica: lo que escribe la persona se ve impreso con cariño. |
| Interfaz (botones, pestañas, meta) | **Atkinson Hyperlegible Next** (variable) | máxima legibilidad para controles pequeños; baja fatiga. |
| Acento manuscrito | **Nanum Pen Script** | anotaciones a mano: “guardado ♡”, “→ mañana”, frase de la tapa. Nunca para contenido ni controles. Tamaño mínimo 1.35rem. |

Escala (rem, base 16px):

| Token | Tamaño | Uso |
|---|---|---|
| `--fs-xs` | 0.8125 | meta (fechas chicas, contadores) |
| `--fs-sm` | 0.9375 | controles, pestañas |
| `--fs-md` | 1.0625 | escritura y cuerpo |
| `--fs-lg` | 1.3125 | preguntas (Castoro itálica) |
| `--fs-xl` | 1.75 | títulos de sección/página |
| `--fs-2xl` | clamp(2.25, 1.7 + 2.2vw, 3.25) | fecha del día |
| `--fs-cover` | clamp(2.5, 1.9 + 3vw, 4) | título de la tapa |

- Interlineado de escritura = `--line` (1.75rem) y los renglones del papel se dibujan con ese mismo paso: el texto **cae sobre la línea**.
- Medida de lectura: 60–70ch.
- Tracking: títulos `-0.01em`; tapa `0.08em` en mayúsculas (es una etiqueta).
- Números tabulares (`font-variant-numeric: tabular-nums`) en calendario, año y horas.

## 5. Espacio, radios, sombras

- Espaciado base 4px: `--s-1 4` `--s-2 8` `--s-3 12` `--s-4 16` `--s-5 24` `--s-6 32` `--s-7 48` `--s-8 64`.
- Padding de hoja: `clamp(20px, 4vw, 56px)` lateral; margen izquierdo de escritura 44px con línea de margen.
- Radios: hoja `4px 10px 10px 4px` (esquina externa apenas gastada); nota adhesiva `2px`; botones-etiqueta `6px`; hilos de emoción pequeños; nada de `rounded-3xl` genérico.
- Elevación (una sola por objeto):
  - `--shadow-page`: `0 1px 0 var(--paper-edge), 0 18px 40px -24px rgb(40 30 28 / .45)`
  - `--shadow-note`: `0 1px 1px rgb(73 61 59 / .12), 0 6px 12px -6px rgb(73 61 59 / .28)`
  - Stickers y dibujos **sin sombra** (pedido de la dueña, 04/10): el troquelado se nota solo por el borde blanco de corte; una sombra o un halo alrededor de un dibujo transparente se veía raro.

## 6. Lenguaje de bordado (componentes firma)

- **Casilla de punto cruz** (`.stitch-box`): cuadrado 22px de “tela aida” (4 agujeritos en las esquinas) con borde punteado suave. Las puntadas tienen **un solo dibujo** (`MC.stickers.STITCH`): lo usan la casilla que se toca, la marca quieta de la semana (`.st-mark`, mismos colores de hilo) y la impresión (`.st-mark` en tinta: el estado se lee por la forma, no por el color).
  - done: dos diagonales en `--thread-done`, trazo 2.5px, extremos redondeados. Animación: 1.ª diagonal 140ms, 2.ª 140ms (stroke-dashoffset), ease-out.
  - partial: una diagonal en `--thread-partial`.
  - postponed: puntada corrida horizontal con punta de flecha en `--thread-later` + anotación manuscrita “otro día”.
  - skipped: nudito francés (círculo 5px) en `--ink-soft`.
  - El texto **nunca se tacha**; done lleva un subrayado de puntada corrida muy suave.
- **Emociones escritas** (`.feelings`, `.feeling-chip`, `.feeling-mark`): campo de texto, botón Agregar y sugerencias de palabras que ya se anotaron; cada palabra agregada lleva un hilo de color y un botón de quitar con nombre accesible. La marca en el calendario conserva la palabra legible. Son frases propias de la persona, sin glifo que las ordene o valore.
- **Puntada corrida** (`.running-stitch`): separador de secciones = línea discontinua `8px trazo / 6px espacio` en `--rule` más oscuro. Reemplaza a `<hr>` y a bordes de cards.
- **Bastidor del año**: tela aida (grilla de agujeritos) 12 × 31; día con emociones = ✕ en el hilo de la primera palabra del cierre o del inicio y nombre accesible con todas las palabras; día con algo anotado sin emoción = medio punto en `--ink-faint`; día inexistente (30/02) = sin agujeros. Leyenda palabra + hilo.
- **Botón-etiqueta** (`.label-btn`): etiqueta tejida: fondo `--ink`, texto `--paper`, radio 6px, costura interna punteada `1px rgb(255 249 237 / .45)` a 3px. Variante suave: fondo `--paper-shade`, texto `--ink`.
- **Cinta-marcador**: cinta de raso (butter o rose) que cuelga del borde superior de la hoja activa; en el calendario, cae sobre el día seleccionado.
- **Marcas de la celda del mes** (`.day-cell__marks`, fila de 14px bajo las palabras, 0.72rem): punto de tinta (`.mark-ink`, escribió) · estrella `--mood-5` (`.mark-star`, recuerdo) · `×n` en `--thread-done-text` (`.mark-x`, hechas) · cajita `box` 12px + número en `--ink-soft` (`.mark-plan`, planeado; solo hoy y adelante) · ícono `paginas` 12px en `--thread-later` (`.mark-page`, página empezada). Todas `aria-hidden`: el significado va en el `aria-label` del día. Nada de rojo ni de “faltan”.

## 7. Papelería

- **Nota adhesiva** (`.sticky`): butter, rotación ±1.5°, cinta washi arriba. Para “Algo que quiero cuidar hoy”.
- **Washi tape**: rectángulo 64×18px con bordes dentados (clip-path), 75 % opacidad.
- **Papelito** (`.slip`): tira de papel con borde rasgado (clip-path) para recuerdos y avisos suaves (backup, recordatorios).
- **Marcadores** (`.tab`, D22): pestañas de tela al costado derecho del cuaderno, metidas 8px detrás de la hoja; la del cuadro abierto sale entera con una costura punteada abajo. Cuatro marcadores (D27, A5) con colores fijos: Hoy `--butter`, Mis hojas `--lavender`, Mi año `--peach`, Ajustes `--paper-shade` (separado 18px). En el celular: barra inferior sobre la tela, pestañas que asoman 6px desde abajo; Ajustes solo con el carretel. Con un cuadro abierto, los marcadores van a su costado.
- **Cuadro desplegable al abrirse**: sale desde el lado de los marcadores (18px desde la derecha; en el celular 14px desde abajo) + fundido, 260ms `--ease-out`.
- **Cuadro desplegable** (`.panel`, un `<dialog>` modal): tela de la tapa como fondo, adentro las mismas hojas de siempre; barra superior fija con “Volver al calendario”. Se abre con un fundido + 14px de caída (260 ms, `--ease-out`); en celular ocupa toda la pantalla.
- **Tira de meses** (`.months`): 12 meses en minúscula Castoro; el actual con fondo manteca, el de hoy con un puntito rosa. El año entre las flechas es un enlace a *Mi año* (subrayado punteado al pasar).
- **Mis stickers** (`.sticker--img`): la imagen tal cual, sin sombra ni halo (04/10); 110px de ancho base, escala 0,4–3.
- **Hoja para dibujar** (`.sheet--draw`): papel crema con renglón de borde; herramientas como botones-etiqueta con costura punteada al elegirlas; colores en círculos de 22px tomados de los tokens (tinta, los 5 hilos de ánimo, verde y lavanda de estado, rosa, salvia, manteca, papel); grosores como trazos.
- **Hilitos del mes** (`.cell-line`, ≥700px): línea de 0,68rem en Atkinson con hilo de 3px a la izquierda del color de su marcador (`--rose` agenda, `--thread-done` rutina, `--thread-later` página) y fondo al 22 %; máx. 3 por día + “+N más”. En el celular no se muestran (quedan las marcas).
- **Días de una rutina** (`.day-cell.is-routine` + `.mark-routine`): tinte `--sage` al 50 % sobre papel, borde de hilo `--thread-done` suave y el ícono de rutinas de 12px en las marcas (estado nunca solo por color). Aviso arriba (`.routine-filter`): papelito salvia con borde punteado, texto + “Ver la rutina” + “Dejar de mostrar”.
- **Rutina resaltada** (`.routine.is-focus`): tinte salvia + hilo de 3px a la izquierda, sin animación; recibe el foco.
- **Enlaces dentro del texto** (fechas, “viene del…”, “próxima: …”, iniciales del bastidor): mismo texto que antes, con subrayado fino o punteado; nunca botones nuevos.
- **Panel de papelera** (`.trash-panel`, DA1): papel crema con listado de elementos en baja temporal; cada ítem muestra su tipo con glifo suave, nombre o título, fecha de borrado en `.t-meta` (`--ink-soft`), y botones-etiqueta suaves (`.label-btn.label-btn--soft`) para *Restaurar* y *Eliminar definitivamente*. Botón *Vaciar papelera* en el encabezado con confirmación en diálogo modal. Estado vacío con `.slip`: “La papelera está limpia ♡”.
- **Privacidad de la hoja** (`.privacy-popover`, PV1): botón discreto en el encabezado de la hoja (Día y Página) con ícono de candado (`lock`) en `--ink-soft`. Al abrirse, despliega un recuadro de papel crema con tres opciones amables acompañadas de casillas de punto cruz o selectores suaves. Si hay opciones activadas, el candado permanece sutilmente visible junto a la fecha o título.
- **Deshacer y rehacer** (`.history-ctrls`, DA2): controles integrados en las barras existentes (dibujo, scrapbook, barra de hoja). Botones-etiqueta o circulares con glifos claros de flecha curva. Estado deshabilitado al 50 % de opacidad y `cursor: not-allowed` (el estado nunca se comunica solo con color).

## 8. Stickers

Biblioteca propia en SVG (`js/ui/stickers.js`), estilo **troquelado**: forma plana en pastel + contorno de tinta 1.6px + borde blanco de corte. Geometría limpia, nada de trazos temblorosos ni sombreados.

Categorías (18):
- **Naturaleza:** mariposa, margarita, tulipán, hoja, sol, luna, nube, ramita.
- **Cositas:** taza, libro, auriculares, sobre, vela, corazón.
- **Símbolos:** estrella, brillito, moño, flecha.
- **Cintas washi:** rosa, salvia, lavanda, manteca (se pegan como sticker).

Reglas: máx. ~12 stickers por hoja recomendados (sin límite duro); tamaño 48–96px; rotación −30°…30°; nunca tapan inputs (la capa de stickers queda detrás del texto en z-index salvo en modo “decorar”).

## 9. Iconografía

**Favicon y apertura (D60–D61):** mariposa rosa y lavanda con contorno de tinta, alas que ocupan el icono y fondo transparente, sin marco, círculo o bordado alrededor. Su maestro es `assets/icons/src/favicon.svg`; el generador reproduce SVG, PNG 16/32/48 e ICO. El mismo SVG aparece a 96 px en una hoja de carga centrada, con «Cargando el cuaderno…», texto secundario y tres casillas de esqueleto en papel/lavanda. D61 adapta Skeleton loader and reveal de transitions.dev con clases `.t-skel*`: solo las casillas pulsan entre opacidad 1 y 0.5 cada segundo durante la espera. Texto y mariposa permanecen legibles. El primer calendario listo cruza con la espera en `--dur-panel` (260 ms), con `--ease-out`; no se difumina toda la hoja ni se anima el layout. Excepción funcional al silencio de loops: solo mientras abre, pausa al ocultar la pestaña y termina al revelar/fallar. Reducidas/Ninguna y movimiento reducido del sistema mantienen la espera estática. La preferencia de UI recordada permite respetarla antes de IndexedDB/nube. Errores muestran un botón-etiqueta de reintentar, sin rojo de valoración. Sin porcentajes ficticios, demoras artificiales o efectos al escribir/navegar. La carga no se imprime.

Un solo sistema, `js/ui/icons.js` (sprite SVG): 24×24, trazo 1.75px, `stroke-linecap: round`, `stroke-linejoin: round`, `currentColor`. Navegación (hoy=sol naciente sobre hoja, calendario, rutinas=bucle de hilo, páginas, año=bastidor, ajustes=carretel), acciones (agregar, editar, borrar, exportar, imprimir, restaurar, cerrar, flechas, más). Sin emojis como íconos. El ♡ tipográfico se permite solo como firma de texto.

## 10. Layout y responsive

**D58 vigente:** la nota se llama **Progreso**. La barra nativa usa verde menta (`--progress-done-fill`), amarillo manteca (`--progress-partial-fill`) y fondo de papel con lavanda; su contorno suave y esquinas de 6 px acompañan los 24 px de cada actividad. Un segmento superpuesto amarillo distingue medios avances junto al verde, sin gradientes ni animar ancho. Conteo N/M entero sin el añadido «N un poquito» (también en Mi año); la descripción accesible conserva el desglose de estados; 3/3 parciales deja media barra. Una estrella SVG existente con texto Pequeña victoria aparece al alcanzar todas las veces y también en Mi año. Aparición única con transform/opacity, `--dur-ui`/`--ease-out` (200 ms), sin loops, tecleo, panel abierto ni movimiento reducido. No hay confeti ni arte nuevo. Las anotaciones y controles existentes se conservan.

**Semana y objetivos (D56, D57; presentación actualizada después de D59):** las barras de progreso viven dentro de **Progreso**. Resumen compacto (porcentaje, barra nativa y «N de M actividades completadas») antes del listado siempre visible: nombre, lápiz, **N/M** y una barra de 24 px por nombre, por ejemplo **Trabajar 0/3**. Rellenos menta y manteca pastel, borde suave y papel con lavanda, sin otra tarjeta. Los lápices tienen nombre accesible y área de 44px; reutilizan el editor, con una elección previa si hay varias repeticiones del mismo nombre. «Organizar actividades» es un `<details>` cerrado. Las anotaciones manuales quedan debajo, separadas por un renglón de hilo. A 375px Progreso continúa primero. La cuenta cambia sin reemplazar campos ni foco, ni animar ancho o números. En los días de ambos calendarios se oculta únicamente Sin marcar, para cualquier fecha; los otros estados conservan glifo y texto. El pie semanal cuenta actividades registradas y se oculta si no hay ninguna. Las casillas precargadas siguen en la página del día. Sin rojo, medallas, anillos ni lenguaje de deuda.

- **Pantalla principal (todas las medidas):** la hoja ancha del calendario (máx. 1040px) con la tira de meses y, a su derecha, los marcadores de tela (D22). Sin encabezado aparte.
- **Cuadros, ≥ 1100px — doble página:** dos hojas de ~560px con lomo central (sombra interior + costura).
- **Cuadros, 700–1099px — una hoja:** máx. 780px.
- **< 700px:** los marcadores bajan a una barra fija inferior (5 con ícono + etiqueta chica, 58px de alto, y el carretel de Ajustes solo con ícono); la tira de meses en dos filas de seis; el calendario entra entero; en las celdas no hay hilitos, solo marcas. Los cuadros ocupan toda la pantalla y llevan la misma barra abajo.
- Qué va en cada hoja del cuadro (desktop): Hoy → izq. encabezado + ánimo inicial + intención + lista; der. notas + energía/sueño + cierre. Semana → lun–mié / jue–dom. Año → bastidor / notas.
- Teclado móvil: el campo activo se desplaza a la vista (`scrollIntoView({block:'center'})`); con un campo editable enfocado, la barra de marcadores inferior se oculta automáticamente mientras el teclado está abierto (`visualViewport`, con fallback de redimensión y foco) para no tapar el texto, y reaparece al cerrar o desenfocar el campo (T6).

## 11. Accesibilidad

- Foco: `outline: 2px solid var(--ink); outline-offset: 3px;` (tinta, no violeta: el anillo índigo es una marca de UI genérica). Siempre visible con teclado (`:focus-visible`). Sobre tela, anillo en `--cloth-ink`.
- Targets ≥ 44×44 en táctil (los parches, casillas y pestañas se agrandan con padding invisible). En el bastidor del año cada día es un blanco de 22 px con centros a 24 px (WCAG 2.2 · 2.5.8); el punto cruz de 14 px se dibuja adentro.
- Las barras fijas del celular nunca tapan el foco: `scroll-padding-top/bottom` (WCAG 2.2 · 2.4.11).
- `touch-action: manipulation` en controles; los stickers necesitan moverse 4 px antes de arrastrarse (un toque solo selecciona).
- Estado nunca solo por color: glifo + texto accesible.
- Decoración (`.deco`, stickers de la tapa, escenas) con `aria-hidden="true"`.
- `aria-live="polite"` para confirmación de “guardado” y avisos relevantes (silenciado durante el estado transitorio `guardando…` para no saturar al lector de pantalla).
- Idioma `es-AR`.
- Al cerrar un cuadro el foco vuelve a donde estaba: al marcador que lo abrió o, si se abrió desde un día, al último día abierto (aunque el calendario se haya redibujado mientras tanto).
- Deshacer y rehacer (DA2): controles con `aria-label` descriptivo, `disabled` y `aria-disabled="true"` cuando no hay acciones en la pila; foco visible propio en tinta. Atajos de teclado `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` inhibidos cuando el foco está en un campo de texto editable para preservar el historial nativo del navegador.

## 12. Motion

**Presupuesto:** la app está quieta por defecto. Motion solo para feedback, continuidad espacial y rituales raros.

Tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` · `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` · `--dur-press 120ms` · `--dur-ui 200ms` · `--dur-panel 260ms` · `--dur-page 420ms` · `--dur-cover 900ms`.

| Momento | Frecuencia | Motion |
|---|---|---|
| Marcar casilla | decenas/día | bordado de la ✕ en 2×140ms; nada más se mueve |
| Agregar una emoción | ocasional | aparece el hilo y la palabra, sin desplazar el texto que se está escribiendo |
| Cambiar de día (flechas) | varias/día | hoja se desliza 12px + fade, 260ms (View Transitions si hay, fallback WAAPI) |
| Abrir un marcador | varias/día | el marcador sale de atrás de la hoja (−8px → +4px) y el cuadro se despliega desde ese lado (18px; abajo en el celular) |
| Soltar sticker | ocasional | asentamiento: escala 1.06→1 y rotación ±2°, 260ms |
| Seleccionar día (calendario) | ocasional | la cinta baja 16px → 0, 260ms |
| Cambiar de mes | varias/sesión | la hoja nueva entra 28px desde ese lado + fundido, ≤300ms (armada aparte, sin parpadeo) |
| Mes ↔ semana | ocasional | la hoja entra con escala 0,97 → 1 + fundido, ≤300ms |
| Pasar de un marcador a otro | varias/sesión | la hoja del cuadro sube 8px + fundido, 200ms |
| Tocar un día | varias/sesión | la celda se hunde a 0,97, 120ms |
| Calendario que se actualiza solo | con cada cambio | **ninguno**: se redibuja aparte y se cambia entero (sin parpadeo, sin animar los números ni las marcas) |
| Abrir tapa | 1/sesión | primeras 3 veces: elástico se corre + tapa gira sobre bisagra izquierda, 900ms; luego fade 250ms |
| Cierre del día guardado | 1/día | una ramita/luna aparece a su lado, 600ms, una vez |
| Escenas ambientales | ocasionales hoy; más frecuentes desde A10 | ver §13 y D33 |

Nunca: `transition: all`, `scale(0)`, `ease-in` en UI, rebotes, motion en atajos de teclado, parallax, cosas siguiendo al cursor. Hover con movimiento solo en `@media (hover: hover) and (pointer: fine)`.

### Niveles (Ajustes → Cómo se mueve)
- **Completas (default para todas las personas, D23):** todo lo anterior + escenas.
- **Suaves:** sin giro 3D de tapa (fade), escenas menos frecuentes.
- **Reducidas:** solo opacidad/color; sin desplazamientos, sin escenas; el bordado de la ✕ aparece instantáneo.
- **Ninguna:** duraciones 0.

Se aplica con `html[data-motion]` y las variables `--motion-scale` (1 / 0.85 / 0 para movimiento) y `--fade-scale`.

## 13. Escenas ocasionales

Pequeñas escenas SVG animadas con Web Animations API (`js/ui/scenes.js`), en el margen de la hoja, **nunca** sobre texto.

Escenas: **mariposa** (cruza el margen y se posa en una esquina, luego se va), **vapor de té** (tres hilos de vapor sobre una taza, de noche), **sombra de hojas** (una sombra de ramita se desliza sobre el papel, de mañana), **nubes** (dos nubecitas cruzan el encabezado), **lámpara** (un halo cálido que respira una vez, de noche) y, desde A10, **flor** (una margarita asoma en el borde de afuera y se mece), **esquina** (la esquina de abajo de la hoja se levanta con la brisa), **bordado** (una fila de puntadas se cose sola en el margen) y **lluvia** (unas gotas resbalan por la tela al costado de la hoja). Pendiente: cortina.

Reglas del director de escenas:
- **Una** escena a la vez, como máximo.
- Primera aparición: entre 12 y 25 s de haber llegado a una vista (D33).
- Separación: 1–2,5 min aleatorio (Completas); 3–5 min (Suaves); nunca en Reducidas/Ninguna. Si en ese momento no se puede, vuelve a probar en 15–30 s.
- No se dispara si: hay foco en un campo de texto, hubo tecleo en los últimos 12 s, hay un diálogo abierto, la pestaña está oculta (`document.hidden`), o la ventana no tiene foco.
- Duración 4–8s; después, silencio.
- No repite la misma escena dos veces seguidas. Elige por hora del día.
- Se cancela al instante si la persona empieza a escribir.

## 14. Estados

- **Vacíos** con voz propia (SPEC §8) y, como mucho, un sticker gris-tinta chiquito.
- **Guardando/guardado (DA3):** componente unificado `.saved-note` junto al encabezado o barra superior de la hoja (día, página, scrapbook, ajustes). Fase `guardando…` en tinta tenue (`--ink-faint` / `--ink-soft`); fase `guardado ✓` en hilo salvia (`--thread-done-text`) durante ~1.5 s; fase `reposo` con transición suave de desvanecimiento (`--dur-ui`, `--ease-out`) hasta ocultarse. Sin toasts flotantes por cada cambio o pulsación.
- **Error de almacenamiento:** papelito rosa arriba (`.slip.slip--blush`): “No pude guardar en este dispositivo; sigue como borrador en esta pestaña. Podés descargar una copia para resguardar tus datos ♡” + botón de descarga.
- **Deshabilitado:** 50 % opacidad + `cursor: not-allowed`, nunca gris frío.

Los días abiertos desde la papelera muestran un papelito junto al encabezado: editar restaura lo ya guardado. El selector de retención tiene una descripción accesible que anuncia cuántas cosas vencerían al acortar el plazo.

## 15. Impresión

Documento dedicado (`js/views/print.js` + `css/print.css`): `@page { size: A4 | A5 | letter }` con márgenes 15/14 mm (11/10 mm en A5). Portada (título, frase, nombre, rango, mariposa), una hoja por mes con palabras de emoción y cantidad de cosas hechas, **los días en secuencia** (sin cortar un día entre dos hojas, `break-inside: avoid`), páginas libres y rutinas. Emociones de cada actividad antes/después si se anotaron. Sin fondos de tela; todo en tinta y texto legible en blanco y negro.

## 16. Íconos de la app

Elegido entre tres exploraciones (mariposa sobre hoja, cuaderno cerrado con etiqueta, **parche bordado**): el **parche bordado** —círculo crema con costura rosa y mariposa pastel sobre tela salvia— porque se reconoce a 16 px y es el mismo lenguaje de los parches de ánimo. Maestros SVG en `assets/icons/src/` (claro, oscuro, monocromo, maskable con zona segura, notificación y badge); PNG/ICO generados con `npm run icons`.

## 17. Do / Don't

| Do | Don't |
|---|---|
| Separar secciones con puntada corrida y aire | Cards idénticas con ícono+título+texto |
| Un sticker en una esquina | Stickers flotando por toda la hoja |
| Parches con glifo + color | Color como único portador de significado |
| “Hoy no salió” con un nudito suave | Tachar, rojo, “fallaste” |
| Escena una vez, después silencio | Animaciones en loop |
| Tela de color pleno como fondo de fábrica | Gradientes y acabados solo elegidos en Ajustes desde A9; nunca glass o glows genéricos |
| Young Serif para fechas | Mayúsculas espaciadas como eyebrow sobre títulos |
| Insights y gráficos editoriales de conteos desde A8, con tabla accesible | Porcentajes de “mejora”, rachas, puntajes o gráficos de SaaS |
| Deshacer con botones accesibles y atajos fuera de inputs | Confiar solo en atajos o solo en color para deshabilitar |
| Guardado visible con estado reposo sin toasts repetitivos | Llenar la pantalla de carteles y toasts con cada letra tipeada |
| Papelera con retención amable y restauración simple | Borrado destructivo inmediato e irreversible |
