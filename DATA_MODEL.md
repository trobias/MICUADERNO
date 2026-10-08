# MI CUADERNO — Modelo de datos

### Esquema v13 · orden de repeticiones (D62)

`routines.order: entero 0..10000 | null`, opcional. Copias anteriores reciben null al normalizar,
sin inventar timestamps ni reordenar datos históricos. Varias repeticiones agrupadas pueden compartir
la posición. Viaja por Repeticiones, con su registro; no modifica actividadPlan ni las fechas/estados.

`schemaVersion: 12` · Base IndexedDB `mi-cuaderno` (versión IDB 5, incluido el store interno `outbox`). El contrato activo retira las formas viejas desde v6; las secciones v1–v6 de abajo registran la evolución histórica. D55 suma metas semanales, D56 su carga inicial y D59 recuerdos por referencia, sin stores ni índices nuevos.

**Uso activo desde A4:** `days.morning/evening.feelings` y `activities.feel.before/after` se escriben desde la interfaz. `MC.model.feelingsOf(slot, settings)` hace lectura dual: si `feelings` es array, lo respeta incluso vacío; si es `null`, convierte `mood` con `legacyMoodLabels` (o `moodLabels` de una copia vieja). `emotionKey` normaliza mayúsculas y tildes para deduplicar y para `settings.emotionColors`; conserva la palabra escrita para mostrarla. `emotionPalette` asigna ocho hilos por frecuencia de la vista, con prioridad a colores elegidos. `summarize` devuelve `morning`, `evening` y `feelings` como arrays de palabras; `mood` ya no es el dato visible. TXT/CSV/XLSX e impresión exportan las palabras y antes/después de actividades. El v5 sigue siendo **aditivo**; no reescribir `updatedAt` al leer ni retirar formas antiguas hasta A13.

## Principios

- **Fechas como texto local `AAAA-MM-DD`.** Un día del cuaderno es un día del calendario de la persona, no un instante UTC. Nunca guardar `Date` para identificar días (evita corrimientos por zona horaria).
- **Instantes como ISO 8601** (`createdAt`, `updatedAt`) en UTC.
- **IDs**: `crypto.randomUUID()` si existe; si no, `Date.now().toString(36) + random`. Prefijos legibles (`act_`, `rut_`, `pag_`, `stk_`).
- **Nada se deriva y se guarda.** Rutinas → ocurrencias se calculan; insights se calculan.
- **Todo registro tiene `updatedAt`** para futuras fusiones.
- **Borrado suave en la misma tabla.** La papelera no usa stores separados: cada registro borrado conserva su forma y suma `deletedAt: ISO | null` (D25).
- **Privacidad en la fuente.** Las preferencias de privacidad emocional viven con el registro (`privacy`) y las herramientas de análisis las respetan.

## Stores

### `meta` (keyPath `key`)

| key | value |
|---|---|
| `schemaVersion` | `12` |
| `settings` | objeto Settings (abajo) |
| `createdAt` | ISO del primer arranque |
| `lastBackupAt` | ISO de la última copia descargada, o `null` |
| `lastOpenedDay` | `AAAA-MM-DD` del último día con apertura |
| `openedDays` | cantidad de días distintos con apertura (para recordatorio de permisos) |
| `notifyLog` | `{ morning: 'AAAA-MM-DD', evening: ..., routines: ..., comeback: ... }` |

**Settings**
```js
{
  name: '',                       // cómo llamarte (opcional)
  cover: 'salvia',                // 'salvia' | 'rosa' | 'lavanda' | 'manteca'
  moodLabels: ['pesado','bajito','normal','bien','muy bien'],
  track: { morning: true, evening: true, activities: true, reflection: true, energy: false, sleep: false },
  motion: 'completas',            // 'completas' | 'suaves' | 'reducidas' | 'ninguna' (default Completas para todas las personas, D23)
  motionChosen: false,            // true si la persona eligió el nivel en Ajustes (si no, se usa el default; “ninguna” siempre se respeta)
  scenes: true,                   // escenas ocasionales
  showCover: true,                // mostrar la tapa al abrir
  onboarded: false,
  weeklyDefaultsInstalled: false, // v11 (D56): instalación única; conserva borrados y cambios de las actividades iniciales
  backupEveryDays: 14,            // 0 = nunca recordar
  trashRetentionDays: 30,         // DA1 (v4): días de retención en papelera antes de vaciar automáticamente (default 30; 0 = conservar siempre)
  notify: {
    enabled: false,               // permiso concedido y activado por la persona
    morning: { on: true, time: '08:30' },
    evening: { on: true, time: '21:30' },
    routines: false,
    comeback: false,
    mode: 'tranquilo'             // 'normal' | 'tranquilo' | 'silencioso'
  },
  notifyAsked: false              // ya se ofreció el papelito de recordatorios
}
```

### `days` (keyPath `date`)
```js
{
  date: '2026-09-30',
  morning: { mood: 1..5 | null, at: ISO | null },
  intention: '',                  // “algo que quiero cuidar hoy”
  notes: '',                      // durante el día
  energy: 1..3 | null,
  sleep: number | null,           // horas, pasos de 0.5
  evening: { mood: 1..5 | null, at: ISO | null },
  reflection: { good: '', hard: '', lovely: '', keep: '', free: '' },
  stickers: [Placed],             // capa scrapbook del día
  privacy: {                      // PV1 (v4; opcional, nunca obligatorio):
    noMemory: false,              // true: no mostrar en recuerdos suaves ni "Abrime algo lindo"
    noInsights: false,            // true: no incluir en observaciones de "Lo que fui notando"
    noReviews: false              // true: no incluir en revisiones periódicas ni en "Lo que guardé" de Mi año
  } | null,
  deletedAt: ISO | null,          // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt, updatedAt
}
```
Un día existe en la base solo si se escribió algo. `isEmptyDay(day)` define cuándo se borra en vez de guardarse vacío.

### `activities` (keyPath `id`, índices `date`, `routineId`)
```js
{
  id: 'act_…',
  date: '2026-09-30',
  title: 'caminar 20 minutos',
  status: 'pending' | 'done' | 'partial' | 'postponed' | 'skipped',
  routineId: 'rut_…' | null,      // si es una ocurrencia materializada de rutina
  order: number,                  // orden en la lista del día
  movedFrom: 'AAAA-MM-DD' | null, // si vino de “pasar a mañana”
  deletedAt: ISO | null,          // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt, updatedAt
}
```
Unicidad lógica: para ocurrencias de rutina, a lo sumo una actividad por `(routineId, date)`.

### `routines` (keyPath `id`)
```js
{
  id: 'rut_…',
  title: 'Caminar',
  rule: {
    type: 'daily' | 'weekdays' | 'weeklyTarget' | 'interval' | 'monthlyDay' | 'monthlyNth' | 'yearly' | 'once',
    count: 3,                    // weeklyTarget: entero 1..7, una vez por fecha
    days: [1,3,5],                // weekdays (0 = domingo)
    every: 3,                     // interval
    day: 15,                      // monthlyDay (1..31; clamp al último día)
    nth: 1 | 2 | 3 | 4 | -1,      // monthlyNth (-1 = último)
    weekday: 6,                   // monthlyNth
    date: 'AAAA-MM-DD'            // once
  },
  startDate: 'AAAA-MM-DD',
  endDate: 'AAAA-MM-DD' | null,
  moment: 'manana' | 'tarde' | 'noche' | null,
  archived: false,                // pausada
  targetNote: '',                 // duración/meta opcional; texto de hasta 120 caracteres (v10)
  deletedAt: ISO | null,          // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt, updatedAt
}
```

### `pages` (keyPath `id`, índice `updatedAt`)
```js
{
  id: 'pag_…',
  title: 'Lugares que amo',
  template: 'blank' | 'goodThings' | 'places' | … ,
  kind: 'text' | 'list',
  paper: 'rayado' | 'cuadriculado' | 'punteado' | 'liso',
  body: '',                       // kind 'text'
  items: [{ id, text }],          // kind 'list'
  pinned: false,
  date: 'AAAA-MM-DD',             // día en el calendario (v2; elegible). Si falta: el día local de createdAt
  stickers: [Placed],
  privacy: {                      // PV1 (v4; opcional, nunca obligatorio):
    noMemory: false,              // true: no mostrar en recuerdos suaves ni "Abrime algo lindo"
    noInsights: false,            // true: no incluir en observaciones de "Lo que fui notando"
    noReviews: false              // true: no incluir en revisiones periódicas ni en "Lo que guardé" de Mi año
  } | null,
  deletedAt: ISO | null,          // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt, updatedAt
}
```

### `images` (keyPath `id`) — Mis stickers (v3) y Dibujos
```js
{
  id: 'img_…',
  kind: 'upload' | 'drawing',
  name: 'mi gato',
  src: 'data:image/webp;base64,…',   // solo png/webp/jpeg rasterizados por la app; máx. ≈3 MB
  w, h,
  drawing: { strokes: [{ color, erase, width, points: [[x, y], …] }], texts: [{ text, x, y, size, font, color }] } | null,
  deletedAt: ISO | null,              // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt, updatedAt                // coordenadas del dibujo: 0..1000
}
```
Un sticker pegado la usa con `sticker: 'img:<id>'`. Si la imagen se manda a la papelera o se borra de la colección, el sticker deja de dibujarse (no se rompe nada).

### `files` (keyPath `id`, índice `owner`) — adjuntos (v3)
```js
{
  id: 'fil_…',
  owner: 'day:AAAA-MM-DD' | 'page:<id>',
  name,
  type,
  size,
  data: 'data:…;base64,…',           // máx. 10 MB
  deletedAt: ISO | null,              // DA1 (v4): instante de envío a la papelera (null o ausente = activo)
  createdAt
}
```

### `Placed` (sticker pegado)
```js
{ id: 'stk_…', sticker: 'mariposa' | 'img:<id>', x: 0..1, y: 0..1, rot: -45..45, scale: 0.4..3 }
```
`x`, `y` son fracciones del ancho/alto de la hoja → el scrapbook sobrevive a cambios de tamaño de pantalla.

## Backup (`.json`)

```js
{
  app: 'mi-cuaderno',
  kind: 'backup',
  schemaVersion: 12,
  exportedAt: ISO,
  data: {
    meta: { createdAt, settings },
    days: [...], activities: [...], routines: [...], pages: [...],
    images: [...], files: [...], weeks: [...], templates: [...], marks: [...]
  }
}
```

Validación al importar (en orden, con mensaje humano por cada falla):
1. Es JSON parseable.
2. `app === 'mi-cuaderno'` y `kind === 'backup'`.
3. `schemaVersion` es entero ≤ versión actual (si es mayor: “Esta copia es de una versión más nueva del cuaderno”).
4. `data.*` son arrays; cada registro pasa `sanitize*` (tipos, fechas válidas, estados conocidos; campos desconocidos se descartan, textos se recortan a 20 000 caracteres, campos opcionales `deletedAt` y `privacy` se preservan si son válidos).
5. Migraciones `migrations[v]` se aplican en orden desde `schemaVersion` hasta la versión actual.

## Papelera y borrado suave (DA1)

En coherencia con DECISIONS D25, la papelera **no crea almacenes separados**. Cada entidad conserva su identidad, su ID y su store original, recibiendo la marca de borrado suave:

- **Campo:** `deletedAt: ISO | null` (UTC). Ausente o `null` significa elemento activo. Con fecha ISO significa elemento en papelera.
- **Entidades que lo usan:**
  - `pages` (páginas libres)
  - `routines` (rutinas)
  - `images` (fotos subidas y dibujos de *Mis stickers*)
  - `files` (adjuntos de días y páginas)
  - `activities` (actividades de la agenda o del día)
  - `days` (entradas diarias)
- **Filtro universal en lecturas:** todas las consultas del dominio (`days`, `pages`, `routines`, `activities`, `images`, `files`), las vistas de la interfaz (`today`, `calendar`, `agenda`, `routines`, `pages`, `year`), `MC.model.summarize` y los cálculos de `insights.js` filtran y descartan registros con `deletedAt != null`. Para la experiencia diaria, lo borrado no existe.
- **Retención configurable:** `settings.trashRetentionDays` (default 30 días; opciones 7, 15, 30, 60 días, o 0 para conservar siempre sin purga automática).
- **Purga automática:** en cada arranque de la aplicación, después de `MC.store.init` y de cargar los ajustes, se ejecuta una limpieza silenciosa que elimina definitivamente (`delete`) los registros cuyo `deletedAt` tenga una antigüedad mayor al plazo configurado (`now - deletedAt > retentionMs`). Si la limpieza falla, el cuaderno abre igual y lo vencido espera al próximo arranque.
- **Adjuntos de una página:** mandar una página a la papelera no toca sus adjuntos (siguen con `owner: 'page:<id>'` y vuelven con ella al restaurarla). Cuando la página se borra del todo (purga, *Borrar definitivamente* o *Vaciar*), sus adjuntos se borran con ella: sin la página no hay dónde verlos.
- **Vaciar a mano:** acción explícita en Ajustes → Mis datos → Papelera con confirmación previa (“¿Querés vaciar la papelera? Esta acción no se puede deshacer”), que purga inmediatamente los registros marcados.
- **Restaurar:** devuelve el elemento a su colección activa fijando `deletedAt = null` y actualizando `updatedAt`. Una página vuelve al índice, una rutina vuelve a materializarse en el calendario, un sticker vuelve a estar disponible.
- **Entra en la copia de seguridad:** los elementos en papelera se incluyen en la exportación `.json` con su `deletedAt` intacto. Quien restaura una copia conserva su papelera con los tiempos de retención correspondientes.

## Privacidad de página y día (PV1)

En coherencia con DECISIONS D25, la privacidad emocional vive en la fuente de los datos:

- **Campo:** `privacy: { noMemory, noInsights, noReviews } | null` opcional en `days` y `pages`.
- **Banderas booleanas (todas independientes):**
  - `noMemory: true` → **No mostrar como recuerdo**: este día o página nunca se selecciona para recuerdos espontáneos (“Abrime algo lindo ♡”, “Un día como hoy”, recuerdos suaves al año/mes).
  - `noInsights: true` → **No incluir en observaciones**: `insights.js` descarta completamente el registro de sus análisis de frecuencia, co-ocurrencias de ánimo y hábitos.
  - `noReviews: true` → **No incluir en revisiones**: este día o página no aporta frases, reflexiones ni ítems a las revisiones semanales/mensuales ni a “Lo que guardé” de *Mi año*.
- **Opcionalidad radical:** ausencia de campo o valores `undefined`/`false` significan inclusión habitual. Un día o página sin privacidad es 100 % válido y no genera deuda técnica ni avisos.
- **Normalización** (`MC.model.sanitizePrivacy`): solo `true` cuenta como prendido; cualquier otro valor es `false` y los campos desconocidos se descartan. Si no queda ninguna bandera prendida, se guarda `privacy: null`. La privacidad sola no hace que un día vacío exista (`isEmptyDay` no la mira): se guarda junto con lo primero que se anote ese día.
- **Quién la respeta hoy:** `insights.js` (días con `noInsights` y sus actividades) y *Mi año* → “Lo que guardé” (`noReviews` o `noMemory`). Recuerdos, revisiones y buscador la van a consultar con `MC.model.isPrivate(registro, bandera)` cuando existan.

## Esquema v5 (contrato del 04/10/2026 · DECISIONS D27–D34)

v5 es **aditiva** (D34): los stores y campos nuevos conviven con los viejos hasta el contrato v6 (fin de la etapa A). Los normalizadores aceptan las dos formas, ninguna migración toca `updatedAt` y cada función nueva cambia todos sus consumidores en un mismo commit. Los campos nuevos existen desde v5 aunque su pantalla llegue en un paso posterior (se indica entre paréntesis).

**IndexedDB v3** (`onupgradeneeded`): stores nuevos `weeks`, `templates` y `marks`; índice `pages.date`; `files.updatedAt = createdAt` donde faltaba. La versión de IndexedDB es la autoridad; `meta.schemaVersion` queda como marca informativa.

### `weeks` (keyPath `week`) — la semana-planner (A6, visible desde v29: `M.getWeek` / `M.saveWeek`; una semana sin texto se borra en vez de guardarse)
```js
{
  week: '2026-09-28',             // lunes de la semana (clave)
  important: [{ id: 'imp_…', text: '', done: false }],   // “Importante” (casillas), máx. 40
  notes: '',                      // “Notas” de la semana
  privacy: { … } | null,          // como en días y páginas (PV1)
  deletedAt: ISO | null,
  createdAt: ISO | null, updatedAt: ISO | null
}
```

### `templates` (keyPath `id`) — plantillas de hojas (A7)
```js
{
  id: 'tpl_…',
  title: 'Comidas del día',
  paper: 'rayado' | 'cuadriculado' | 'punteado' | 'liso',
  blocks: [Block],                // estructura (ver abajo)
  values: { [blockId]: Value },   // contenido inicial (“con lo escrito”); {} = en blanco
  stickers: [Placed],
  frozen: false,                  // true: copia congelada que usa una repetición (no se lista ni se edita)
  kind: 'sheet' | 'day',          // D45 (copia v7): 'day' = plantilla de un día; sin campo = 'sheet'
  day: null | {                   // solo con kind 'day': lo que se suma al usarla (nunca pisa lo escrito)
    intention: string,            // ≤ 500
    notes: string,
    activities: [string]          // títulos sin marcar, sin repetidos, ≤ 50
  },
  // A7: una hoja nacida de una plantilla guarda `templateId` pero es independiente; editar la plantilla no la toca.
  deletedAt: ISO | null,
  createdAt: ISO | null, updatedAt: ISO | null
}
```
**Block**: `{ id: 'blk_…', type: 'text' | 'list' | 'checks' | 'columns', title: '', columns: [{ id: 'col_…', title: '' }] }` (`columns` solo en `type: 'columns'`, de 2 a 4). Máx. 24 bloques por hoja.
**Value** según el tipo: `text` → string · `list` → `[{ id, text }]` · `checks` → `[{ id, text, done }]` · `columns` → `{ [colId]: string }`.

### `marks` (keyPath `id`, índice `sourceId`) — referencias (D25.2; victorias en A8)

D59 (08/10): copia v12 aditiva, IDB 5. Las referencias también admiten `sourceType: 'routine'` y `kind: 'recuerdo' | 'especial' | 'terminado'`, además de victoria. `category` opcional identifica primera vez, encuentro, decisión, retomar o una victoria personal; `note` opcional (200 caracteres) contiene las palabras elegidas por la persona. IDs estables por fuente y tipo, conservando el ID de las victorias anteriores. Una repetición especial genera recuerdos solo para ocurrencias done/partial; primera vez conserva solo la primera ocurrencia. No analiza el contenido ni interpreta emociones. Primer dibujo anual derivado de imágenes efectivamente colocadas en un día/hoja visible, con fuente y privacidad intactas. Sin store ni sección nuevos: marks sigue en anio. Migración v12 identidad, sin inventar fechas ni recuerdos históricos. Referencias editables/eliminables; las fuentes en papelera o excluidas de recuerdos/revisiones no aparecen. Los hitos automáticos también respetan noInsights.
```js
{ id: 'mrk_…', sourceType: 'activity' | 'day' | 'page', sourceId: '…', kind: 'victoria', deletedAt: ISO | null, createdAt: ISO | null }
```
A8: el id es fijo por cosa marcada (`M.markId(tipo, id)` = `mrk_<tipo>_<id>`), así no hay duplicados entre pestañas o dispositivos. `M.setVictory(tipo, id, false)` borra el registro. Nunca copia el texto: `MC.insights.victories` lo resuelve al mostrar.

### Campos nuevos en stores existentes
| Store | Campo | Forma | Paso |
|---|---|---|---|
| `days` | `morning.feelings`, `evening.feelings` | `[string]` (emociones escritas) o `null` si nunca se anotaron; conviven con `mood` hasta v6 | A4 visible |
| `activities` | `feel` | `{ before: [string], after: [string] }` o `null` | A4 visible; A6 lo pondrá también en la semana editable |
| `activities` | `moves` | `[{ from: 'AAAA-MM-DD', to: 'AAAA-MM-DD', at: ISO }]`, máx. 50 | A3 |
| `pages` (hojas) | `blocks`, `values` | como en `templates`; `null` mientras la hoja siga con `kind/body/items` | A7 |
| `pages` | `templateId`, `routineId` | de qué plantilla nació; de qué repetición es ocurrencia (id `pag_<repetición>_<fecha>`, virtual hasta que se escribe) | A7 |
| `pages` | `kind/body/items` derivados | al guardar una hoja con bloques: un solo bloque lista → `list`; si no, `text` con `M.sheetText` | A7 |
| `routines` | `kind` | `'activity'` (de siempre) o `'sheet'` (hoja que se repite) | A7 |
| `routines` | `templateId` | la plantilla congelada que repite (`kind: 'sheet'`) | A7 |
| `routines.rule` | `type: 'yearly'` | `{ month: 1..12, day: 1..31 }`; el 29/02 cae el 28/02 en años comunes | A3 |
| `images.drawing.strokes[]` | `tool`, `pressure`, `seed` | `tool`: `'technical'` (los viejos) · `'nib'` · `'highlighter'` · `'airbrush'` · `'graphite'`; `pressure: [0..1]` paralelo a `points`; `seed` entero | A11 |
| `images.drawing.strokes[]` | paso de relleno | `{ tool: 'fill', x, y, color, tolerance: 0..255 }` (sin `points`), en el mismo orden que los trazos | A11 |
| `files` | `updatedAt` | ISO (= `createdAt` en los viejos) | A3 |
| `meta.settings` | `theme` | `null` (tela de la tapa) o `{ preset, cloth, cloth2, angle, paper, ink, accents: [4], finish }` con hex `#RRGGBB` | A9 |
| `meta.settings` | `emotionColors` | `{ [clave]: '#RRGGBB' }`, máx. 200 | A4 visible en Ajustes |
| `meta.settings` | `legacyMoodLabels` | los 5 nombres de ánimo congelados al pasar a emociones (convierte `mood n` → emoción) | A4, compatibilidad hasta v6 |

### Reglas nuevas
- **Ids deterministas** (D34): una ocurrencia de repetición que se marca se guarda como `act_<idRutina>_<AAAA-MM-DD>` (y una hoja que se repite, `pag_<idRutina>_<AAAA-MM-DD>`): marcarla dos veces, desde dos pestañas o dos dispositivos, escribe el mismo registro. Si quedaron dos de antes, la lista del día muestra uno (el más nuevo).
- **Pasar a otro día / a mañana**: una actividad propia se mueve en el lugar (mismo id, nueva fecha) y suma un paso a `moves`; una de repetición queda “lo dejo para otro día” en su fecha y se copia suelta al día nuevo (si no, la ocurrencia virtual reaparecería).
- **Fechas en lectura**: los normalizadores ya no inventan `createdAt`/`updatedAt` al leer un registro sin fecha (quedan `null`); se estampan al escribir.
- **Día vacío**: un día con emociones (aunque no tenga nada más) no está vacío.

### Migración v4 → v5
- **En IndexedDB** (`onupgradeneeded` de la versión 3): crea los stores y el índice; completa `files.updatedAt`. Nada más se reescribe.
- **En una copia `.json`**: `MIGRATIONS[5]` agrega `weeks`, `templates` y `marks` vacíos si faltan. Los registros pasan por los mismos normalizadores. Una copia v6 o más nueva se rechaza (“versión más nueva”).
- **Contrato v6** (A13): ver abajo.

### `outbox` (keyPath `id`) — interno, IndexedDB 5 (NB2, D44)
Cola de cambios para subir a la nube: `{ id: '<store>\u0001<clave>', at }`. Se escribe en la misma transacción que el registro; no va en la copia (`INTERNAL_STORES`), ni en la papelera, ni tiene sección.

### Contrato v6 (A13, 05/10/2026 · D34, D39)
**Qué se retira:** `days.*.mood` (el ánimo 1–5 pasa a ser su palabra en `feelings`, solo si ese momento no tenía emociones; `[]` se respeta), `pages.kind/body/items` (pasan a un bloque: `blk_body` de renglones o `blk_items` de lista, si la hoja no tenía bloques) y `settings.moodLabels` / `settings.legacyMoodLabels` (ya usados para convertir). **Qué queda:** `settings.cover` (D39: es la tela de la tapa cuando no hay tema propio). Ninguna conversión toca `updatedAt`. La conversión es una sola función pura, `MC.backup.contractRecord(store, registro, palabras)`, con `MC.backup.moodWords(settings)` (los nombres congelados, los elegidos o los de fábrica).
- **En IndexedDB** (versión **4**, `onupgradeneeded`, atómico y exclusivo entre pestañas): lee los ajustes, guarda en `meta.preV6` una instantánea `{ at, days, pages, settings }` con la forma vieja de lo que cambia y reescribe. Si algo falla, la transacción se aborta, la base queda en la versión 3 tal como estaba, el cuaderno la abre igual (los normalizadores siguen leyendo `mood` y `kind/body/items`) y avisa que lo vuelve a intentar.
- **En una copia `.json`**: `MIGRATIONS[6]` hace lo mismo con los nombres de ánimo de esa copia. `SCHEMA_VERSION` = 6; una copia 7 o más nueva se rechaza.

### Esquema v9 (D53, aditivo)
Días y hojas pueden traer `hide: { all: boolean, fields: [campo], blocks: [id de bloque] }` (qué no ven quienes miran el cuaderno; solo si oculta algo). Campos ocultables: días `morning, evening, energy, sleep, intention, notes, reflection, stickers`; hojas `paper, stickers` y bloques. Los ajustes traen `hideYear: ['mapa' | 'cuentas' | 'grafico' | 'notando' | 'recuerdos' | 'victorias']`. En la nube lo oculto va en un pedazo aparte `<id>~oculto` con `private = true` (sección base del store). `MIGRATIONS[9]` es la identidad.

### Esquema v8 (D52, aditivo)
Los ajustes pueden traer `hiddenDefaults: { feelings: [clave], templates: [id de fábrica] }`: lo de fábrica que la persona sacó. `MIGRATIONS[8]` es la identidad.

### Esquema v7 (D45, aditivo)
`templates` puede llevar `kind: 'day'` y `day` (plantillas de día). `MIGRATIONS[7]` es la identidad: las plantillas sin `kind` son de hojas. `SCHEMA_VERSION` = 7; una copia 8 o más nueva se rechaza. IndexedDB sigue en 5.
- **Leer nunca pierde:** si igual llega un `mood` o una hoja vieja (una pestaña vieja, un borrador local, la nube, una base que no pudo actualizarse), `normalizeDay`/`normalizePage`/`feelingsOf` la leen; nunca se vuelve a escribir la forma vieja.
- **Copia de antes:** Ajustes → Mis datos → *Antes de la actualización*: “Descargar la copia de antes” (`MC.backup.downloadPreV6`: el cuaderno de hoy con días, hojas y ajustes como eran, en una copia v5 que se puede volver a abrir) y “Ya no la necesito” (borra `meta.preV6`). La instantánea no va en las copias ni a la nube.

## Nube (base, etapa B · D37)

**En el dispositivo:** con cuentas, la base IndexedDB se llama `mi-cuaderno@<id de la persona>` (sin cuentas, `mi-cuaderno`) y las preferencias de UI `mc.ui.<id>.<clave>`. La cookie `mc_person` guarda solo ese id. Mismos stores, mismas versiones.

D61: la clave de UI `motion` recuerda el nivel efectivo de movimiento para respetarlo durante la espera, antes de abrir IndexedDB/nube. `settings.motion` y `motionChosen` conservan su contrato como fuente de Ajustes/copia/sincronización; el recuerdo de UI es prescindible y no guarda contenido personal. Sin cambio de esquema.

**En Supabase** (`supabase/migrations/20261004120000_cuentas_permisos.sql`, RLS en todas):
| Tabla | Qué guarda |
|---|---|
| `sections` | Las 9 secciones (igual que `js/core/sections.js`). |
| `profiles` | Persona: `id` (= Supabase Auth), `username`, `display_name`, `pin_hash` (Argon2id; ilegible desde el navegador), `is_admin`, `disabled_at`, `timezone`. |
| `notebook_grants` | `owner_id` comparte `section` con `grantee_id` en nivel `ver`/`editar`. |
| `notebook_parts` | (B5) cada registro de IndexedDB partido por sección: `store`, `record_id`, `section`, `data` JSONB, `private`, `updated_at`, `deleted_at`. |
| `audit_events` | Eventos de seguridad, nunca contenido. |
| `login_throttle`, `push_subscriptions`, `push_log`, `keepalive` | Demoras de ingreso, dispositivos con aviso, avisos enviados por día, latido diario. |

B5 (D38, migración `20261005090000`): `profiles.has_notebook` (quien tiene cuaderno propio) y `notebook_parts.updated_by` (quién escribió cada parte). La sincronización usa `MC.sections.splitAll` (una parte por cada sección posible del store) y `MC.sections.overlay` (aplica partes sobre el registro local reemplazando solo los campos de cada sección). No viajan `images`, `files` ni las claves de `meta` distintas de `settings`. En el dispositivo, la cola de salida guarda solo claves (`mc.ui.<id>.sync.outbox`), nunca contenido.

`MC.sections.split(store, registro)` decide las partes: los campos de identidad, fechas, papelera y privacidad van en todas; el resto según el mapa (por ejemplo `days.morning/evening/energy/sleep` → `emociones`, lo demás del día → `escritura`; `activities.feel` → `emociones`). Un campo nuevo cae en la sección por defecto de su store.

## Migraciones

### Lecturas derivadas · medios avances y victorias (08/10/2026, D58)

- `weeklyProgress` y cada goal incluyen `done` (completas), `partial` (Un poquito), `checked = done + partial` y `value = done + partial / 2`. `percent` usa `value / total`. Para metas flexibles: completas limitadas a total; partial limitado a `total - done`. `recorded` conserva todas las marcas done/partial, incluidas extra; no cambia estados ni planes.
- `insights.victories` suma metas con checked igual a total; id derivado `week:<lunes>:<nombre normalizado>`, fecha de primer alcance y enlace a la semana. Lee planes guardados; si faltan, usa reglas disponibles. No afirma una victoria de rutina si faltan tanto regla como plan (configuración borrada o permiso parcial). Las filas ocultas en revisiones/recuerdos conservan su oportunidad pero no aportan marcas; noInsights y días borrados se excluyen. Mi año conserva fichas de días borrados solo para excluirlas, sin dibujarlas.
- No se guardan pesos, porcentajes, estrellas ni victorias semanales nuevas. Los datos actuales bastan para recalcular al recargar, copiar y sincronizar. Copia **v11**, IDB **5**, cache **v52**; sin migración nueva ni SQL.

### Lecturas derivadas · agrupación y calendarios (08/10/2026, D57)

- `weeklyProgress.goals` agrupa por `weeklyActivityKey(title)`: ignora mayúsculas, tildes y espacios repetidos, y reconoce Practica/Practicar Diseño. Cada grupo suma `done`, `total` y `recorded` después de limitar cada meta flexible; conserva las fechas, `routineIds` y `targetNotes` de sus componentes para configurar cada repetición. No fusiona actividades ni planes guardados.
- `calendarVisible(item)` admite done, partial, postponed y skipped, y excluye únicamente pending. `summaryRange(desde, hasta, { recordedOnly: true })` aplica ese filtro a actividades reales y omite sus ocurrencias virtuales; las hojas mantienen su lógica. La lectura general sin esa opción sigue incluyendo pendientes para otros consumidores. La página del día no se filtra.
- Solo cambia presentación y cálculo derivado: copia **v11**, IndexedDB **5**, sin campos persistentes ni migración nuevos. Cache **v51**.

### Esquema v11 · actividades iniciales (08/10/2026, D56)

- `settings.weeklyDefaultsInstalled: boolean`, `false` si falta o no es booleano. Se escribe `true` después de instalar las actividades iniciales, viaja en Ajustes y en la copia. `MIGRATIONS[11]` es aditiva: importar nunca fabrica rutinas ni historia.
- `M.weeklyDefaults(fecha)` define cinco rutinas comunes con IDs `weekly-default-*` y comienzo el lunes actual: Trabajar 5, Caminar 3, Practica Diseño 5, Salir con una amiga 1 y Bici 1. Diseño lleva «1 hora por día». Todos los campos se editan con el editor habitual; no son actividades de cumplimiento guardadas.
- `M.ensureWeeklyDefaults()` instala una sola vez tras la bienvenida, solo en cuaderno propio/local. Reutiliza nombres equivalentes, ignorando mayúsculas/tildes y aceptando «Practicar diseño», incluso en pausa o papelera. Conserva IDs existentes en reintentos. El indicador evita volver a crear una rutina renombrada o purgada; no se guardan contadores ni porcentajes.
- Antes de agregar rutinas captura la planificación previa de semanas con registros. No escribe semanas anteriores con las actividades nuevas. Esquema de copia **11**, IndexedDB **5**, sin SQL, stores ni índices nuevos.

### Esquema v10 · objetivos semanales (07/10/2026, D55)

- `routines.rule = { type: 'weeklyTarget', count: 1..7 }` y `routines.targetNote: string` opcional. La cantidad se valida como entero; las hojas que se repiten conservan reglas con días definidos.
- `weeks.activityPlan: null | [{ routineId, title, targetNote, dates: ['AAAA-MM-DD'], flexible, target }]`. `dates` son los días elegibles de esa semana; las oportunidades fijas son `dates.length`, las flexibles `min(count, dates.length)`. `null` significa que no se capturó el plan; `[]`, que se capturó sin metas. No se guardan porcentajes ni acumulados.
- `M.activityPlan` calcula; `M.ensureActivityPlan` captura al abrir el planner o antes de marcar. Antes de cambiar/borrar una rutina, captura también las semanas con actividades que todavía no tenían plan. La semana actual/futura usa las reglas vigentes; una semana cerrada con plan nunca lo recalcula por una edición de rutinas. Las casillas históricas del planner se generan desde ese plan incluso si la rutina fue purgada.
- `M.weeklyProgress` es puro: deduplica `(routineId, date)`, cuenta solo `done`, limita cada meta flexible al objetivo, suma una oportunidad por actividad suelta, devuelve `{ week, done, total, percent, goals, daily }`. `M.getWeeklyProgress` lee también las fichas de días en papelera para excluir sus actividades, además de los días con `noInsights`. Los conteos generales del mes/año siguen admitiendo `partial` como registro; no son la medida de cumplimiento de un objetivo.
- `saveWeek` preserva el plan más reciente al guardar Importante/Notas, incluso si el borrador se tomó antes de capturarlo. Las semanas con plan son registros válidos aunque no tengan texto. Una semana vacía sin plan no se guarda. La invitada no captura planes por mirar.
- **Copia:** `SCHEMA_VERSION = 10`, `MIGRATIONS[10]` aditiva e idempotente, sin inventar planes históricos ni tocar fechas. Las migraciones v7–v9 de main se conservan. `normalizeRoutine`/`normalizeWeek` validan los campos nuevos. IndexedDB permanece en **5**, sin reescritura masiva. No es posible recuperar reglas históricas ya borradas en versiones anteriores.
- **Permisos:** `targetNote` viaja con `routines` en `repeticiones`; `weeks.activityPlan` también pertenece a `repeticiones`, separado de Importante/Notas (`semana`). Las marcas siguen en `actividades` y las emociones en `emociones`. No hay sección, tabla ni migración SQL nueva.
- TXT e impresión incluyen la duración/meta junto a la frecuencia; la hoja Rutinas del XLSX agrega `duracion_meta`. La copia JSON conserva el plan completo.

`js/core/backup.js` exporta `MIGRATIONS = { 1: d => d }`. Para agregar una versión: escribir `N: d => {...}` que transforme datos v(N-1) → vN y subir `SCHEMA_VERSION`.

### Migración v1 → v2 (2026-10-01)
Las páginas ganan `date` (su día en el calendario). `MIGRATIONS[2]` lo completa con el día local de `createdAt` al importar una copia v1; en IndexedDB no hace falta reescribir nada porque `normalizePage` hace lo mismo al leer. Sin índices nuevos: la versión IDB sigue en 1.

### Migración v2 → v3 (2026-10-01)
Suma `images` y `files` (vacíos en una copia v2). IndexedDB pasa a la versión 2 y crea los dos stores. `Placed.scale` ahora va de 0,4 a 3 (antes 0,5–2: los datos viejos siguen valiendo).

### Migración v3 → v4 (2026-10-02 · Fase 1)
- **Contenido:** incorpora campos opcionales `deletedAt: null` y `privacy: null` en las entidades del modelo, y agrega `trashRetentionDays: 30` en `settings` si no existía.
- **Estrategia en IndexedDB:** puramente aditiva; no requiere reescritura masiva de registros en IndexedDB porque las funciones de normalización del dominio (`normalizeDay`, `normalizePage`, etc.) admiten la ausencia de `deletedAt` y `privacy` asignando `null` o `false` en memoria.
- **En la importación de copias:** `MIGRATIONS[4]` asegura que `data.meta.settings.trashRetentionDays` tenga valor por defecto (30) si falta, y los sanitizadores permiten los nuevos campos si vienen presentes en el JSON. Copias v1, v2 y v3 abren de forma transparente y sin pérdidas.
- **Cobertura de tests (`tests/unit/backup-v4.test.js` o `backup.test.js`):**
  1. Importar backup v3 en v4 produce un estado válido con settings v4 y datos intactos.
  2. Exportar entidades con `deletedAt` y `privacy` genera un JSON v4 fiel; al reimportar, los valores se preservan.
  3. Sanitización de registros sin `deletedAt` ni `privacy` no arroja errores ni altera el objeto original.
  4. Copias con `schemaVersion: 5` se rechazan con el mensaje amigable predeterminado (“Esta copia es de una versión más nueva del cuaderno”).

## Resumen del calendario (derivado, no se guarda)

`MC.model.summaryRange(desde, hasta)` arma, para cada fecha con algo, un objeto calculado en el momento (no hay store ni cambio de `schemaVersion`):

```js
{
  date, morning, evening, mood,   // ánimos del día (mood = final || inicial)
  wrote, memory,                  // escribió algo / texto de “qué quiero guardar”
  done,      // actividades guardadas en done o partial
  pending,   // pendientes: guardadas en pending + ocurrencias de rutina sin marcar
  planned,   // solo las ocurrencias de rutina sin marcar (virtuales)
  routines,  // ítems de rutina del día (marcados o no)
  byRoutine, // { routineId: estado } — 'pending' si todavía no se marcó (para “los días de una rutina”)
  items,     // [{ title, kind: 'routine' | 'own', status }] — lo que se lee en la celda del mes
  total,     // guardadas + virtuales
  pages: [{ id, title }]  // páginas cuyo createdAt cae en esa fecha local
}
```

Las ocurrencias virtuales salen de `MC.recurrence.occursOn` sin contar las que ya tienen actividad `(routineId, date)`. `MC.model.pagesOn(fecha)` devuelve las páginas empezadas ese día (para la página del día).

`MC.model.summarize(días, actividades, { from, to, routines, pages })` es la **única cuenta** de “qué hubo cada día”: la usan el mes, la semana, *Mi año* (sin `routines`, para bordar solo lo registrado) y la impresión. Con `from`/`to` ignora lo que cae afuera. Reglas compartidas en el modelo: `countsAsDone(estado)` (“hecho” = `done` o `partial`; las exportaciones conservan el estado exacto), `hasWriting(día)`, `moodLabel(n)`, `pageTitle(página)`, `pageDate(página)` y `MC.dates.fromISO(instante)` para pasar un `createdAt`/`updatedAt` a fecha local.

## Exportaciones derivadas

- **TXT:** encabezado + un bloque por día (fecha larga, ánimos por nombre, intención, actividades con marca `[x] [/] [→] [·] [ ]`, notas, reflexiones) + páginas.
- **CSV `dias`:** `fecha,animo_inicio,animo_final,energia,sueno,intencion,notas,me_hizo_bien,algo_dificil,algo_lindo,para_guardar,libre,actividades_hechas,actividades_total`.
- **CSV `actividades`:** `fecha,actividad,estado,rutina`.
- **XLSX:** hojas `Resumen`, `Días`, `Estados`, `Actividades`, `Rutinas`, `Reflexiones`.
