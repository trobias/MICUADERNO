# MI CUADERNO — SPEC

> Fuente funcional de verdad. Si el código y este documento no coinciden, uno de los dos está mal: arreglá el que corresponda y dejá constancia en `DECISIONS.md`.

## 1. Qué es

MI CUADERNO es un cuaderno personal digital: diario, agenda, registro de ánimo, rutinas y scrapbook, en un solo objeto. Funciona 100 % en el dispositivo de la persona, sin cuenta, sin servidor y sin conexión.

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

- **Centro: el calendario del mes**, con la **tira de los 12 meses** (y flechas de año) para saltar de mes con un toque. Interruptor chico *Mes / Semana*.
- **Marcadores de tela al costado del cuaderno** (como las pestañas de antes; en el celular, abajo): *Hoy · Agenda · Rutinas · Páginas · Mi año* y, separado, *Ajustes* (en el celular, solo el carretel). Cada uno abre un **cuadro desplegable** encima del calendario (un `<dialog>`), sin salir de la pantalla. Con un cuadro abierto los marcadores se mudan a su costado: se pasa de uno a otro sin cerrar (DECISIONS D22). Todos giran en torno a **poner cosas en el calendario**.
- **Tocar un día** del calendario abre la página de ese día en el cuadro. Al cerrarlo (botón “Volver al calendario”, `Esc`, tocar afuera o *atrás* del navegador) se vuelve al calendario. El calendario de atrás **se actualiza solo** mientras el cuadro está abierto y cuando otra pestaña cambia algo, sin parpadeo y sin tocar lo que se está escribiendo (DECISIONS D21). Al volver, la cinta y el foco quedan en el último día abierto; si el cuadro se abrió con un marcador, el foco vuelve a ese marcador.
- **Teclado en el celular (T6):** en pantallas chicas (< 700px), cuando se hace foco en un campo editable para escribir, la barra inferior de marcadores se oculta de forma automática (detectada vía `visualViewport` con fallback de redimensión y foco) para no tapar el texto ni estorbar, y reaparece suavemente al cerrar el teclado o perder el foco.

| Ruta | Qué muestra |
|---|---|
| `#/calendario` · `#/calendario/mes/AAAA-MM` · `#/calendario/semana/AAAA-MM-DD` | la pantalla principal (sin cuadro) |
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

### 6.4 Rutinas
Rutinas → “nueva rutina” → nombre + frecuencia (+ desde/hasta opcional, momento del día opcional) → aparece sola en los días que corresponde, en Hoy y en la Semana.

### 6.5 Página libre
Páginas → “nueva página” → elegir en blanco o una plantilla (lista, carta al futuro, gratitud…) → escribir → abrir el sobre de stickers → pegar una mariposa, rotarla, moverla.

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

1. **Encabezado**: saludo según hora (“Buenos días / Buenas tardes / Buenas noches, {nombre} ♡”), día de semana + fecha. Flechas día anterior/siguiente y “Ir a hoy” si no es hoy (para saltar lejos se usa el calendario, que queda debajo). Indicador unificado de **guardado visible** `c.savedNote` (DA3) y acceso discreto a **Privacidad de este día** (PV1: no mostrar en recuerdos, no incluir en insights, no incluir en revisiones).
2. **¿Cómo arrancaste hoy?** — campo para escribir una o varias emociones (§9), sugerencias solo de palabras que ya anotaste, cada palabra se puede sacar.
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
  - **hoy y días que vienen:** cajita vacía **□n** con lo que queda planeado, *contando las rutinas que tocan ese día* aunque todavía no se hayan marcado;
  - **hoja chiquita** si ese día tiene una página libre;
  - en pantallas anchas, además, **lo que hay ese día escrito en hilitos** del color de su marcador: *Agenda* (rosa), *Rutinas* (salvia), *Páginas* (lavanda); hasta 3 y “+N más”. De hoy en adelante, lo que falta; para atrás, solo lo hecho (D18, D23). En el celular quedan las marcas compactas.
  
  Los días pasados **no** muestran lo que quedó sin marcar (sin cuentas de “pendientes” para atrás: amable, ver D18). Cada marca tiene su texto en el `aria-label` del día (“una cosa planeada”, “empezaste una página”) y su lugar en la leyenda. Todo lo que esté en la papelera (`deletedAt != null`) se ignora por completo (DA1). Hoy con borde a lápiz; el último día abierto lleva una cinta-marcador. Tocar un día → su página en el cuadro desplegable.
- **Animaciones** (con motion “Completas”/“Suaves”): cambiar de mes desliza la hoja hacia ese lado; pasar de mes a semana (o al revés) la acomoda con una escala apenas; el día nuevo se arma aparte y entra cuando está listo (sin parpadeo).
- **Semana**: agenda de 7 días (desktop: lun-mié izquierda / jue-dom derecha). Cada día: emociones, actividades (incluye rutinas futuras virtuales), primera línea escrita y enlaces a las páginas empezadas ese día. Tocar → abre el día. La semana planner editable y por defecto corresponde a A6; aún no está hecha.
- **Mi año** sigue mostrando solo lo registrado: una rutina sin marcar no borda medio punto. Días con `privacy.noReviews` no aportan recuerdos a “Lo que guardé” (PV1), y elementos borrados no se computan (DA1).
- **Los días de una rutina** (desde Rutinas o *Lo que fui notando*): el mes marca con tinte de salvia + el ícono de rutinas los días que la tocan de hoy en adelante y los días pasados en que se hizo (también “un poquito”). Los días pasados en que no se hizo no se marcan. Arriba, un aviso con “Ver la rutina” y “Dejar de mostrar”.
- Navegación anterior/siguiente, “hoy”.

### 7.4 Rutinas
- Lista agrupada por momento del día (mañana / tarde / noche / cuando sea).
- Frecuencias soportadas (§11). Descripción humana de la regla (“Lun · Mié · Vie”, “Cada 3 días”, “Primer sábado del mes”).
- Pausar/reanudar (archivar), editar, borrar (borrado suave a la papelera, DA1; el historial ya marcado se conserva como actividades sueltas).
- Cada rutina: la próxima vez es un enlace a ese día; el ícono de calendario muestra sus días en el mes. Si se llega desde “Ver la rutina”, aparece resaltada y con el foco.

### 7.5 Páginas
- Cada página tiene **su día en el calendario**: se elige al crearla (“Para el día”, por defecto hoy o el día desde donde se empezó) y se cambia con “Cambiar el día” (debajo de la hoja o en su menú). Desde la página de un día: “Empezar una página para este día”.
- **Índice** con título, fecha y número de página con puntos guía (como un índice real). Fijar páginas arriba. Las páginas en papelera no se muestran en el índice (DA1).
- **Nueva página**: en blanco o plantillas: *Cosas que me hacen bien, Lugares que amo, Personas importantes, Canciones de este momento, Mis pequeñas victorias, Cosas que quiero probar, Carta para mi yo futuro, Brain dump, Gratitud, Sueños, Lista de deseos, Reflexión del mes*.
- Tipos: `text` (renglones) o `list` (ítems con viñeta dibujada).
- Papel: rayado, cuadriculado, punteado, liso.
- Stickers (scrapbook), con dibujos e imágenes propias; plantilla **Para dibujar** (hoja lisa que abre con el lápiz listo; el dibujo queda grande en el medio). Pila de deshacer/rehacer independiente para elementos colocados (DA2).
- **Privacidad de esta página** (PV1): menú accesible en la cabecera para activar/desactivar `noMemory`, `noInsights` y `noReviews`.
- **Guardado visible** (DA3): indicador `c.savedNote` en el encabezado.
- **Adjuntos** de la página (se envían a la papelera si se eliminan o si la página se borra).
- **Borrar página**: borrado suave a la papelera (`deletedAt`, DA1) con aviso amable; se puede restaurar en cualquier momento desde Ajustes.
- “Empezada el …” es un enlace al día en que se empezó (ese día la página también aparece en el calendario).

### 7.6 Mi año
- **Bordado**: 12 columnas (meses) × 31 filas (días). Día sin registro = punto de cruz a lápiz sin llenar (bonito vacío). Día con emoción = hilo de color y palabra accesible en el nombre del día.
- Leyenda de las palabras más anotadas en ese año, siempre con texto además de color.
- Tocar un día → abre su página. La inicial de cada mes lleva a ese mes en el calendario.
- **Lo que fui notando**: 3-6 observaciones descriptivas (§12), cada una con el camino a sus días. Respeta estrictamente `privacy.noInsights` y omite registros borrados (PV1, DA1).
- **Lo que guardé**: lista de recuerdos (“qué quiero guardar”) del año, como papelitos. Respeta `privacy.noReviews` y `privacy.noMemory` (PV1), además de ignorar lo que esté en papelera (DA1).

### 7.9 Dibujar, Mis stickers y adjuntos (D24)
- **Dibujar** (desde el sobre de stickers, la barra de decorar o la plantilla *Para dibujar*): hoja cuadrada con **lápiz**, **goma**, **texto** (letra a mano / de libro / de título / simple; chica, mediana, grande), los 12 colores de los hilos y la papelería, 3 grosores, **deshacer y rehacer** (DA2) y *borrar todo*. Al guardar se recorta y se pega como sticker; queda en *Mis stickers* y se puede **editar después** (“Editar el dibujo”: cambia en todas las hojas donde esté). Sin capas, sin vectores para exportar: no es un programa de diseño.
- **Pila de deshacer/rehacer en dibujo (DA2):** pila propia de `MC.history` con 50 pasos que registra trazos de lápiz, goma y agregado/modificación de textos. Botones táctiles visibles en la barra superior del dibujo y atajos `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` mientras no se esté editando un campo de texto nativo.
- **Subir una imagen** (PNG, JPG, WebP, GIF, SVG, AVIF… lo que el navegador sepa leer; HEIC solo donde el navegador lo abra): se achica a 900 px y se guarda como WebP/PNG (un SVG se convierte en imagen; nunca se guarda como código). Va a *Mis stickers* y se pega en cualquier hoja. Sacar una imagen de la colección la envía a la papelera (DA1) y la despega de las hojas sin romper nada.
- **Adjuntos**: cualquier archivo de hasta 10 MB en un día o una página; se descarga/abre con un toque y se saca con confirmación (borrado suave a la papelera, DA1). Sirven para guardar con el día lo que no es texto: la entrada del recital, el PDF de un turno, una foto, un audio. Van en la copia de seguridad.
- **Guardado visible (DA3):** cada cambio en dibujos, stickers y adjuntos se acompaña del indicador `c.savedNote`.

### 7.8 Agenda (poner cosas en el calendario)
- **Anotar**: qué + qué día (atajos *Hoy · Mañana · En una semana*; por defecto el día marcado en el calendario si es de hoy en adelante) → “Poner en el calendario”. Aparece en ese día, en su página y en el mes.
- **También podés poner**: algo que se repite (abre el editor de rutinas) o una página para ese día (elige plantilla con el día ya puesto).
- **Lo que viene**: lo anotado de hoy en adelante, agrupado por día (el día es un enlace, con “en 2 días”, “en 3 semanas”…), más las páginas de esos días. Cada cosa tiene su menú completo: estados, pasar a mañana, **pasar a otro día**, cambiar el nombre, sacar (borrado definitivo con opción de deshacer). Las rutinas no se listan: aparecen solas en sus días.
- La fila de cada actividad es la misma que en la página del día (`js/ui/activity.js`), con historial de acciones (`MC.history`, DA2) para deshacer cambios involuntarios.

### 7.7 Ajustes
- **Vos**: nombre y qué registrar. **Mis emociones** permite elegir color por palabra, con selector nativo o código `#RRGGBB`; las palabras del registro nunca salen de una lista cerrada.
- **Cómo se mueve**: animaciones *Completas / Suaves / Reducidas / Ninguna* (default para todas las personas: *Completas*, D23; si el sistema pide menos movimiento, Ajustes lo sugiere bajar; “Ninguna” elegida antes se respeta); escenas ocasionales on/off; mostrar la tapa al abrir.
- **Recordatorios**: ver §14.
- **Mis datos**:
  - Texto de privacidad.
  - **Papelera (DA1):** selector de tiempo de retención (`settings.trashRetentionDays`, default 30 días; opciones 7, 15, 30, 60 días o nunca), acceso al listado de elementos en papelera con opción de **Restaurar** o **Eliminar definitivamente**, y botón **Vaciar papelera** con confirmación clara.
  - **Copia de seguridad y exportación:** guardar copia (`.json` v5); abrir/restaurar copia; exportar (TXT, CSV, XLSX); imprimir; recordatorio de copia (cada 7/14/30 días/nunca); borrar todo (doble confirmación, escribiendo “borrar”).
- **Guardado visible (DA3):** cada cambio de configuración se confirma con `c.savedNote`.
- **Instalar**: si el navegador lo permite, botón “Instalar en este dispositivo”.

### 7.10 Papelera y borrado suave (DA1)
Para evitar pérdidas accidentales y dar tranquilidad (filosofía amable), el borrado en MI CUADERNO es **suave por defecto** y vive en el mismo almacén de datos (D25):

- **Entidades cubiertas:** páginas libres (`pages`), rutinas recurrentes (`routines`), imágenes y fotos de *Mis stickers* (`images`), dibujos (`images`), archivos adjuntos (`files`), actividades individuales (`activities`) y días completos (`days`).
- **Mecanismo:** el registro recibe una marca temporal `deletedAt: ISO` (UTC). Ausente o `null` indica que el registro está activo.
- **Aislamiento:** las listas activas, el resumen del calendario (`MC.model.summarize`), la agenda y las observaciones de `insights.js` filtran los registros con `deletedAt != null`. La única excepción es abrir explícitamente una fecha para revisar su hoja en papelera, con aviso y restauración al editar. Sacar una actividad desde Hoy o Agenda usa borrado definitivo con Deshacer; el esquema admite su marca de papelera, pero esa acción no la utiliza.
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

Una actividad guarda opcionalmente `feel.before` y `feel.after`, visibles en su fila y exportables. Las copias con `mood: 1..5` se siguen leyendo mediante `legacyMoodLabels` del cuaderno de origen; `[]` significa que la persona quitó las emociones y no debe reponer el valor viejo. El contrato v6 recién retirará `mood` después de una migración segura.

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
| `interval` | `every: n` (días), ancla = `startDate` | Cada 3 días |
| `monthlyDay` | `day: 1..31` (si el mes es más corto → último día) | Todos los 15 |
| `monthlyNth` | `nth: 1..4 \| -1`, `weekday: 0..6` | Primer sábado del mes · Último domingo |
| `once` | `date` | Una sola vez, el 12/10 |

Todas aceptan `startDate` (default: fecha de creación) y `endDate` opcional (rutinas temporales). Las pausadas (`archived: true`) no aparecen.

**Materialización perezosa:** las ocurrencias no se guardan por adelantado. Se calculan al mostrar un día. Solo cuando la persona cambia el estado de una ocurrencia se crea un registro `activity` con `routineId` y `date`. Consecuencias: borrar o editar una rutina no reescribe el pasado ya registrado; los días futuros se ven al instante.

## 12. “Lo que fui notando” (insights)

Reglas:
- Solo descriptivo, con conteos (“8 de 11 veces”). Nunca porcentajes de “mejora”, nunca causalidad.
- Umbral mínimo: al menos 5 observaciones para comparar; si no, no se muestra ese insight.
- Nunca más de 6 a la vez. Si no hay suficientes datos: “Cuando llenes algunas páginas más, acá voy a ir anotando lo que noto.”
- **Filtro estricto de privacidad y papelera:** cualquier día o entrada marcado con `privacy.noInsights === true` (PV1) o enviado a la papelera (`deletedAt != null`, DA1) queda completamente excluido de todos los cálculos de insights. Las observaciones nunca computan ni mencionan información protegida o descartada.

Cada observación dice de qué días habla (`day`, `days` o `routineId` + `month`), así se puede ir a verlos: “Ir a ese día”, “Ver los días” (lista desplegable de fechas) o “Ver en el calendario” (los días de la rutina). “Hoy empezaste este cuaderno” no lleva a ningún lado.

Catálogo actual: días desde que empezó el cuaderno; veces que escribió esta semana; rutina más acompañada del mes; palabra de emoción repetida esta semana; días con alguna palabra compartida al empezar y terminar; coocurrencia descriptiva entre una actividad hecha y una palabra anotada al cerrar; recuerdos guardados en el año. No clasifica palabras como mejores o peores. A8 ampliará los conteos y agregará gráficos.

## 13. Datos, backup y exportación

Ver `DATA_MODEL.md` para esquema. Resumen:

- **IndexedDB** (`mi-cuaderno`): `meta`, `days`, `activities`, `routines`, `pages`, `images`, `files`, `weeks`, `templates`, `marks`. Versión IDB 3; los tres últimos ya tienen contrato pero todavía no toda su interfaz.
- **localStorage**: solo preferencias livianas de UI (última ruta, cantidad de aperturas de tapa, borrador transitorio). Nada importante vive solo ahí.
- **Backup JSON**: `{ app: "mi-cuaderno", kind: "backup", schemaVersion: 5, exportedAt, data: {...} }`. Import valida estructura, aplica migraciones automáticas (`MIGRATIONS[v]`), rechaza archivos de otra app o versiones futuras (> 5) con mensaje claro. Incluye elementos en papelera, marcas de `privacy`, emociones libres y nuevos stores v5.
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
- **Entrar** (`/entrar`): usuario + PIN de 6 números. Si se equivoca varias veces, se pide esperar con un texto amable. Sin sesión, el cuaderno manda acá.
- **Preparar** (`/preparar`): con la clave `SETUP_TOKEN`, crea la primera persona, que administra. Deja de funcionar cuando ya hay alguien.
- **Mi cuenta** (`/cuenta`, enlazada desde Ajustes → Mi cuenta): cambiar el PIN (pide el actual); avisos en este dispositivo (mañana/noche, probar, desactivar); quien administra ve **Personas** (sumar, cambiar su PIN, poner en pausa/reactivar); todos ven **Quién puede ver mi cuaderno** (por sección: nada / ver / editar); cerrar sesión en este dispositivo.
- Cada persona tiene su base local propia en el dispositivo; cerrar sesión no borra nada. Lo compartido viaja recién con la sincronización (B5).

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

- **Unit (node:test):** fechas, recurrencias (incluye 29/02, día 31, n-ésimo día, intervalos, temporales), materialización de rutinas, validación y migración de backups (v1→v2, v2→v3, v3→v4, rechazo de v5), historial de deshacer/rehacer (`MC.history`: límites, reversión, eventos), papelera (DA1: soft-delete, retención, purga, restauración), privacidad emocional (PV1: exclusión en insights y recuerdos), CSV (escapes), ZIP/XLSX (estructura válida), insights (umbrales, redacción no causal).
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
