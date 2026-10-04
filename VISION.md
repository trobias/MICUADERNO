# MI CUADERNO — Visión: memoria, scrapbook, privacidad y experiencia personal

Pedido de la dueña del proyecto (2026-10-01). **Es referencia, no implementación literal**: describe *qué experiencia queremos*; el repositorio, `SPEC.md`, `DESIGN.md`, `DATA_MODEL.md`, las skills y el criterio técnico deciden *cómo*. El pedido posterior del 03/10/2026 aprobó una migración A→B→C con semana planner, emociones escritas, Mis hojas y nube con roles: [`MIGRATION_PLAN.md`](MIGRATION_PLAN.md) es ahora el orden vigente. Lo que todavía no se hizo vive en [`ROADMAP.md`](ROADMAP.md) y [`BACKLOG.md`](BACKLOG.md). D25 sigue orientando el motor común; D27–D36 registran las decisiones nuevas.

> **MI CUADERNO no es un dashboard personalizable. Es un objeto digital personal que va adquiriendo historia.**
> Dos personas empiezan con la misma app y terminan con cuadernos completamente distintos: sus tapas, sus páginas, sus marcadores, sus canciones, sus dibujos, sus fotos, sus cartas, sus recuerdos, sus pequeñas victorias. Después de seis meses tiene que sentirse que el cuaderno evolucionó con la persona: **más personal, no más complicado**.

Los números entre corchetes ([12]) son los del pedido original, para poder rastrear cada idea.

---

## 0. Antes de programar cualquier cosa de esta visión

1. Leer `SPEC.md`, `DESIGN.md`, `AGENTS.md`, `DATA_MODEL.md`, `DECISIONS.md` y las skills que apliquen (`AGENTS.md` las lista).
2. Mirar qué infraestructura ya existe (abajo, “Hoy”, en cada grupo).
3. **Fusionar conceptos relacionados y reutilizar** componentes, almacenamiento y comportamientos. Si dos features pueden compartir una abstracción, preferir la común. Nunca seis editores para stickers, imágenes, post-its, dibujos, notas al margen, polaroids y portada.
4. Los nombres del pedido (`PageElement`, `MemoryReference`, `ContentBlock`, `calmMode`…) son conceptuales: si el código ya tiene algo equivalente, se usa eso.
5. Libertad creativa con coherencia: se puede mejorar, combinar, simplificar o inventar, preguntándose *¿pertenece a MI CUADERNO? ¿respeta el sistema visual? ¿mejora la experiencia o solo agrega ruido?* Una buena idea nueva es bienvenida; una decoración arbitraria, no.
6. **No implementar todo porque está escrito.** El backlog puede ser grande; la app no debe sentirse grande. Mejor una capacidad bien diseñada que cinco features superficiales.
7. Todo lo nuevo sigue `DESIGN.md` (componentes, diálogos, inputs, vacíos, animaciones, avisos, pickers, editores, barras, ajustes). Nada genérico “porque es más rápido”.

## 1. Reglas generales (valen para todo)

- **Opcionalidad [77]**: casi todo se puede ignorar. Días sin ánimo, sin actividades, sin reflexión; páginas sin título; semanas sin revisión; entradas sin etiquetas; fotos sin explicación; días vacíos. Ningún campo opcional se vuelve deuda.
- **Día en blanco [48]**: una página vacía es válida. Sin error, sin pendiente, sin advertencia, sin racha perdida. Ese día sigue existiendo.
- **Días vacíos en revisiones [49]**: no se interpretan (ni tristeza, ni olvido, ni abandono). Solo: no hubo contenido registrado.
- **Personalización [78]**: no es configurar cada píxel; es que el cuaderno refleje a la persona (portada, separadores, contenido, stickers, páginas, estructura, recuerdos, etiquetas, organización). El design system sigue controlado.
- **Reutilización [79]**: antes de una feature nueva, preguntar si ya existe una primitiva. Post-it y nota al margen comparten base de texto; polaroid e imagen comparten media; portada y página comparten scrapbook; favoritos, victorias y recuerdos comparten referencias; carta y página comparten bloques de contenido.
- **Progressive disclosure [65]**: la primera apertura es simple; el scrapbook, el dibujo, las cartas, las canciones, las revisiones, los recuerdos se descubren después. Nunca 25 botones en la barra inicial.
- **Barras contextuales [66]**: las herramientas aparecen según lo seleccionado (foto: mover, rotar, marco, duplicar, eliminar · texto: formato, resaltar, convertir · sticker: rotar, duplicar, bloquear, eliminar).
- **Interacciones naturales [67]**: escritorio = arrastrar, redimensionar, teclado, atajos, barra contextual; táctil = tocar, mantener apretado, pellizcar, arrastrar. Nada que dependa solo del hover.
- **Autoguardado [68]** de escritura, posiciones, dibujos, configuración y scrapbook (con debounce). Nunca un “guardar” obligatorio.
- **Indicador de guardado [69]**: discreto, “guardando…” → “guardado ✓”. Sin toast cada vez.
- **Confirmaciones solo para lo destructivo [13]**: las microacciones se deshacen, no se confirman.

---

## 2. Motor de elementos de página (scrapbook común) — [1 ejemplo, 18–22, 25–26, 28–29, 35, 64]

**Idea:** una sola infraestructura para todo lo que se coloca sobre una superficie (hoja de un día, página libre, revisión, portada, sobre).

- Tipos posibles: `sticker`, `image`, `polaroid`, `postit`, `text`, `marginNote`, `drawing`, `tape`, `stamp`, `decoration`, `linkCard`, `songCard` (y `audio`).
- Campos comunes cuando corresponda: `id`, `pageId` (superficie), `type`, `x`, `y`, `width`, `height`, `rotation`, `scale`, `zIndex`, `locked`, `createdAt`, `updatedAt`, `style`, `metadata`. Guardado en IndexedDB.
- **Operaciones [21]**: mover, escalar, rotar, duplicar, eliminar, bloquear/desbloquear, traer adelante/enviar atrás, snap suave, selección múltiple cuando sea útil. Controles simples: no es Illustrator.
- **Snap [22]**: discreto, a bordes, centro, otros objetos y márgenes; desactivable con una tecla/modificador o un ajuste.
- **Dibujo [18–19]**: lápiz, **resaltador**, goma, color, grosor, deshacer, **rehacer**; presión del Pointer Events cuando exista (mouse y touch siguen igual). El dibujo es un elemento más: se mueve, se borra, se oculta, se duplica; convive con stickers, fotos, texto y post-its.
- **Post-its [29]**: mover, redimensionar, rotar apenas, paleta limitada, borrar, duplicar, bloquear; formas cuadrada, rectangular, papel rasgado.
- **Notas al margen [28]**: anotación lateral distinta del contenido principal, como escrita en el margen de un libro; acompaña un párrafo, una foto o la página.
- **Polaroid [25]** y **otros formatos de foto [26]** (cinta, papel fotográfico, recorte, marco, círculo, corazón, forma orgánica): estilos de un mismo elemento `image`, con arquitectura extensible; no diez estilos de entrada. La polaroid genera marco, sombra, espacio inferior, fecha y descripción opcionales.
- **Páginas libres [64]**: una página puede ser solo `[foto]`, solo `[dibujo]`, solo “Hoy fue lindo.”, o `[post-it] [canción] [foto]`.
- **Portada [35]** = otra superficie del mismo sistema (ver §8).
- Evaluar si en el repo existe algo llamado *Ponytail* para edición visual; **no existe** a la fecha (2026-10-01) y no se inventa la dependencia.

**Hoy:** `js/ui/scrapbook.js` ya coloca stickers con `x`, `y` (fracciones de la hoja), `rot`, `scale`, con arrastre, teclado y accesibilidad (`Placed` en `DATA_MODEL.md`); `js/ui/draw.js` dibuja con lápiz, goma, texto, colores y deshacer, y guarda los trazos; `images` guarda imágenes propias rasterizadas. El motor común **nace de `Placed`** (con migración), no al lado.

## 3. Memorias: referencias comunes — [4, 10–11, 39–40, 58–62]

**Idea:** favoritos, marcadores, victorias, recuerdos, “Abrime algo lindo”, revisiones, “Un día como hoy” y colecciones comparten **referencias**, no copias de datos.

- Concepto `MemoryReference`: `{ id, sourceType, sourceId, category, createdAt, resurfacingAllowed, includeInReviews, metadata }` (adaptar a la arquitectura real).
- **Favorito ≠ marcador [10]**: favorito = contenido especial; marcador = algo a lo que quiero volver. Se puede marcar cualquier día, entrada, página, foto, carta o recuerdo.
- **Marcadores físicos [10–11]**: sobresalen del borde del cuaderno como señaladores reales, con colores-significado personalizables (rosa especial · amarillo volver después · verde recuerdo lindo · lavanda importante).
- **Pequeñas victorias [39–40]**: cualquier momento puede ser una victoria; sin XP, monedas, niveles ni rankings: la recompensa es conservar el recuerdo. Una página las junta como papelitos, flores, estrellas, notas o sellos; cada una abre el día original.
- **Recuerdos positivos [58]**: taxonomía simple (positivo / especial / quiero recordarlo / victoria).
- **Abrime algo lindo ♡ [59]**: elige al azar **solo** entre lo marcado como lindo/positivo/especial/victoria/quiero recordar. Nunca una entrada cualquiera.
- **Volver a mí [60–61]** (nombre interno “necesito acordarme de quién era”; nombres posibles: *Mis recuerdos*, *Cosas que quiero guardar*, *Volver a mí*, *Lo que fui guardando*, *Pedacitos de mí*): recuerdos elegidos, fotos, victorias, frases, canciones, dibujos, cartas abiertas, momentos favoritos. **Nunca** pendientes, porcentajes, tareas incumplidas, productividad, rachas ni estadísticas negativas. Es memoria, no evaluación.
- **Recuerdos suaves [4]**: “Hace un mes escribiste esto ♡”, “Hace seis meses guardaste esta foto”, “Hace un año estabas escuchando esta canción”. Preferentemente dentro del cuaderno (no notificación). Se puede apagar.

**Hoy:** `reflection.keep` (“Qué quiero guardar”) ya funciona como recuerdo y *Mi año* los lista; `insights.js` produce observaciones con sus días (D20); la plantilla “Mis pequeñas victorias” existe como página. No hay referencias ni favoritos todavía.

## 4. Privacidad emocional de cada entrada — [5, 56]

- Cualquier entrada puede marcarse: **No mostrar como recuerdo** · **No incluir en insights** · **No incluir en revisiones automáticas**, juntas bajo *Privacidad de esta página*.
- No asumir que todo lo escrito debe volver a aparecer.
- El contenido de un **sobre con fecha** (§7) no aparece en buscador, recuerdos, insights ni revisiones hasta que se puede abrir, salvo decisión explícita distinta.

**Hoy:** nada de esto existe; `insights.js` y *Mi año* leen todo. Es requisito previo de §3 y §6.

## 5. Organización y búsqueda — [6–9]

- **Buscador real [6]** “Buscar en mi cuaderno…”: texto, fecha, rango, etiqueta, colección, actividad, rutina, emoción, página, título, recuerdo, victoria, canción, adjunto, nota… Se siente como índice, fichero, pestañas o marcadores; no como buscador empresarial. Los resultados muestran contexto suficiente para reconocer la entrada.
- **Filtros progresivos [7]**: no veinte opciones de entrada; aparecen de a poco (Fecha · Tipo · Etiqueta · Estado · Tiene foto · Tiene canción · Es favorito).
- **Etiquetas [8]** libres (facultad, familia, amigos, trabajo, gym, viaje, ideas) dibujadas como sellos, etiquetas de papel, tabs, marcas o cintas; nunca badges SaaS.
- **Colecciones [9]** opcionales (Viaje a Córdoba, Facultad 2027, Cartas, Mis libros, Proyecto personal); una entrada en ninguna, una o varias. Nunca obligar a clasificar.

**Hoy:** rutas por fecha y enlaces entre secciones (D20) ayudan a navegar; no hay índice de búsqueda (BACKLOG OR1).

## 6. Revisiones del cuaderno — [1–3]

No son dashboards de productividad: son **páginas editoriales generadas dentro del cuaderno**.

- **Semanal [1]** *Esta semana*: cómo empezaron y terminaron los días, estados, rutinas hechas, actividades repetidas y la más frecuente, victorias, recuerdos, imágenes, frases destacadas, canciones, páginas escritas, días vacíos (sin interpretarlos). Espacio editable y opcional: *Lo que quiero recordar de esta semana · Algo que aprendí · Algo que me hizo bien · Algo que quiero dejar acá · Qué quiero llevarme a la próxima semana*.
- **Mensual [2]**: doble página o composición especial (emociones predominantes, días destacados, victorias, recuerdos, canciones, imágenes, rutinas, actividades, frases, páginas favoritas) con un **scrapbook automático editable**: la app propone, la persona termina la página (mover, sacar, agregar notas, stickers, dibujar, reorganizar).
- **Anual [3]** *Mi año*: un capítulo lento, bonito y navegable (meses, recuerdos, victorias, fotos, frases, páginas importantes, estados, rutinas, canciones, cartas, momentos marcados). Nada de “Spotify Wrapped” hiperestimulante. Termina con una página libre: *Lo que quiero guardar de este año*.

**Hoy:** `summarize` (única cuenta por día), `insights.js` con días, *Mi año* (bastidor + notando + lo que guardé) y el motor de stickers son la base; respetan D18 (nunca lo no hecho) y deberán respetar §4.

## 7. Cartas, cosas sueltas y captura rápida — [30–31, 54–57]

- **Sobre [54]**: objeto que contiene texto, imagen, dibujo, sticker, canción, nota, audio; se siente como un sobre físico.
- **Tipos [55]**: *Abrir cuando quiera* (se cierra y listo) · *Abrir después de una fecha* (“No abrir hasta: 01/01/2027”; hasta entonces se ve cerrado).
- **Bloqueo por fecha [56]**: sin previews accidentales; fuera de buscador, recuerdos, insights y revisiones hasta que se puede abrir.
- **Apertura [57]**: pequeña interacción (levantar la solapa, abrir, desplegar el papel), no cinematográfica; respeta el nivel de motion.
- **Cosas sueltas [30]**: inbox local para capturar pensamientos, frases, ideas, imágenes, canciones, links y notas sin elegir página, fecha, categoría ni colección. Después: dejarlo, moverlo a una página, convertirlo en recuerdo o en actividad, archivarlo.
- **Captura rápida [31]** desde cualquier sección sin abandonar la página actual (atajo tipo `Ctrl + Shift + N`; elegir uno sin conflictos).

**Hoy:** la plantilla “Carta para mi yo futuro” existe como página común; la Agenda (D22) ya anota cosas en cualquier día.

## 8. Personalización: portada, portadas guardadas y separadores — [35–38]

- **Portada personalizable [35]**: color, textura, título, subtítulo, nombre, año, estampado, adornos, señalador, sticker, dibujo. **No es otra herramienta**: reutiliza motor de elementos, stickers, dibujo, transformaciones, capas y posicionamiento.
- **Portadas guardadas [36]** (Mi Cuaderno 2026, Facultad, Viaje, Cartas); si algún día hay varios cuadernos, se reutiliza esto.
- **Separadores propios [37]** además de los de base (Facultad, Viaje, 2027, Cartas, Ideas, Gym) con nombre, color, ícono, dibujito, sticker y orden.
- **Orden personalizable [38]**: cada persona decide dónde aparecen.

**Hoy:** 4 telas de tapa (`settings.cover`), tapa animada (`cover.js`), marcadores de tela con colores fijos (D22, `TABS` en `app.js`).

## 9. Escritura, calma y bloques flexibles — [14–17, 45–47, 63]

- **Solo escribir [14]**: oculta navegación, estadísticas, scrapbook y decoraciones secundarias; queda la página, la fecha, el texto y el cursor.
- **Pantalla completa [15]** cuando la API exista, siempre por decisión de la persona, nunca automática.
- **Modo calma [16–17]** (`calmMode`): detiene escenas y stickers animados, esconde insights y estadísticas secundarias, reduce decoraciones, silencia recordatorios visuales, evita cambios automáticos. No borra nada. **No es lo mismo que reducir movimiento**: reduced motion es accesibilidad de movimiento; modo calma es una decisión de densidad y estímulo. Pueden convivir.
- **Campos flexibles [45]**: no hardcodear títulos como “Durante el día” si no hace falta; un bloque tiene *Título* y *Contenido* que la persona nombra (“Hoy fue raro” / “No tengo muchas ganas de explicarlo.”).
- **Bloques opcionales [46]**: todo bloque reflexivo se puede usar, ignorar, ocultar, eliminar y reordenar. Nada de mañana/tarde/noche/gratitud obligatorios. El cuaderno ofrece, no impone.
- **“No quiero explicarlo” [47]**: acción simple para días difíciles: título y texto opcionales, símbolo, color, mancha o sellito; o solo “Hoy no quiero explicarlo.” Nunca pedir explicación adicional.
- **`ContentBlock` [63]** (text, heading, mood, activity, image, audio, drawing, postit, marginNote, song, link, sticker, separator, quote): evaluar antes complejidad, serialización, IndexedDB y render. No adoptarlo a ciegas.

**Hoy:** la página del día tiene secciones fijas (con algunas apagables en Ajustes → qué registrar); niveles de motion (D23) y escenas con ajuste propio; las páginas libres ya son texto o lista.

## 10. Media: imágenes, audio, canciones, adjuntos — [23–27, 50–53, 71]

- **Adjuntos locales [23]**: imágenes, audio, archivos simples. Todo local, nunca se sube nada.
- **Imágenes [24]**: miniatura, compresión de lo innecesariamente enorme, calidad razonable; elegir archivo, **arrastrar y soltar** y **pegar del portapapeles**.
- **Audio [27]**: notas de voz locales con `MediaRecorder` donde exista: grabar, reproducir, renombrar, eliminar, agregar a una página; se ve como una casetera, una nota de voz o una cinta, no un reproductor SaaS.
- **Canciones [50–53]** en un día, página, recuerdo, carta, colección o entrada; reconocer Spotify, YouTube, YouTube Music o URL genérica y mostrar una **tarjeta** coherente (canción, artista, proveedor, portada si se obtiene legítimamente, link, nota personal). **Offline-first**: se guarda localmente URL, título/artista si están, metadatos permitidos y el comentario; sin Internet la tarjeta sigue existiendo. **No es un reproductor**: el objetivo es recordar qué estaba sonando; nunca reproducir solo.
- **Optimización [71]**: miniaturas, compresión, deduplicación cuando sea viable, object URLs liberadas, carga diferida y progresiva. Nunca todas las fotos del año juntas.

**Hoy:** D24 — imágenes rasterizadas a 900 px (WebP/PNG) en `images`, adjuntos de hasta 10 MB en `files` como data URL, sin miniaturas aparte, sin arrastrar/pegar, sin audio ni canciones.

## 11. Privacidad local — [32–34]

- **Bloqueo opcional [32]**: PIN, contraseña local, por inactividad, al minimizar, al cerrar, manual. Nunca impuesto.
- **Ocultar mi cuaderno [33]**: difumina/tapa todo al instante; atajo (ej. `Ctrl + Shift + L`, elegir sin conflictos).
- **Bloqueo automático [34]**: Nunca · 1 min · 5 min · 15 min · Al minimizar. Guardar antes de bloquear: no perder lo que se estaba escribiendo.

**Hoy:** nada; los datos viven en IndexedDB del navegador sin cifrar.

## 12. Notificaciones granulares — [41–44]

- **Por categoría [41]**: Inicio del día · Cierre del día · Rutinas · Actividades pendientes · Después de completar algo · Preguntar cómo me sentí · Revisión semanal · Revisión mensual · Recuerdos · Cartas que ya puedo abrir · Volver a leer algo · Mensajes ocasionales; cada una por separado.
- **Horario por categoría [42]** cuando tenga sentido (Inicio 08:30, Cierre 22:00) con presets sensatos; poca configuración al principio.
- **No molestar [43]** (23:00–08:00) y **no notificar mientras estoy usando MI CUADERNO**.
- **Contexto [44]**: rutina sin hacer → “Cuando tengas un rato, todavía está acá.”; algo hecho → “Lo hiciste ♡ ¿Querés guardar cómo te sentiste?”; día completo sin cierre → “Antes de cerrar hoy, ¿querés dejar una línea?”. Si no quiere: no insistir.

**Hoy:** `settings.notify` con mañana, noche, rutinas y “volver” + modo tranquilo/normal (D11), reloj interno + Periodic Background Sync.

## 13. Datos: papelera, deshacer, almacenamiento, copia — [12–13, 70, 72–76]

- **Papelera [12]**: páginas, recuerdos, imágenes, rutinas, entradas, cartas y dibujos van primero a la papelera; se retienen un período configurable o hasta vaciarla.
- **Deshacer / rehacer [13]** con `Ctrl + Z` / `Ctrl + Shift + Z` donde corresponda: escritura, dibujo, scrapbook, mover y borrar elementos, edición visual.
- **Control de almacenamiento [70]**: “Tu cuaderno ocupa 126 MB”, con desglose (texto, fotos, audio, dibujos, otros).
- **Copia completa [72]** de todo: páginas, texto, rutinas, etiquetas, colecciones, scrapbook, dibujos, imágenes, audio, cartas, canciones, post-its, marcadores, favoritos, victorias, ajustes, portada, separadores.
- **Formato `.micuaderno` [73]**: paquete con `manifest.json`, `data.json` y `media/images/`, `media/audio/`…; la persona no necesita conocer la estructura.
- **Migraciones [74]**: `schemaVersion` y estrategia de migraciones; nunca romper cuadernos viejos.
- **Tests [75]** para recuerdos, fechas, cartas futuras, filtros, búsqueda, etiquetas, colecciones, deshacer, papelera, transformaciones, posiciones, copias, restauración, archivos, audios, recurrencias, notificaciones.
- **Casos de error [76]** con degradación elegante: archivo demasiado grande, imagen corrupta, audio sin permiso, IndexedDB lleno, portapapeles denegado, sin `MediaRecorder`, navegador sin cierta API, copia antigua, carta con fecha pasada, URL de canción inválida.

**Hoy:** `schemaVersion` 3 con migraciones encadenadas y tests (`backup.js`, D10, D22, D24); copia JSON con imágenes y adjuntos como data URL; `zip.js` ya escribe ZIP “store” (base para `.micuaderno`); “Sacar de la lista” tiene deshacer; dibujo tiene deshacer; borrar páginas/rutinas es definitivo (con confirmación).
