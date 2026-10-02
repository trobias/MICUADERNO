# MI CUADERNO — Modelo de datos

`schemaVersion: 4` · Base IndexedDB `mi-cuaderno` (versión IDB 2: stores `images` y `files`).

## Principios

- **Fechas como texto local `AAAA-MM-DD`.** Un día del cuaderno es un día del calendario de la persona, no un instante UTC. Nunca guardar `Date` para identificar días (evita corrimientos por zona horaria).
- **Instantes como ISO 8601** (`createdAt`, `updatedAt`) en UTC.
- **IDs**: `crypto.randomUUID()` si existe; si no, `Date.now().toString(36) + random`. Prefijos legibles (`act_`, `rut_`, `pag_`, `stk_`).
- **Nada se deriva y se guarda.** Rutinas → ocurrencias se calculan; insights se calculan; almacenamiento ocupado se calcula.
- **Todo registro tiene `updatedAt`** para futuras fusiones.
- **Borrado suave en la misma tabla.** La papelera no usa stores separados: cada registro borrado conserva su forma y suma `deletedAt: ISO | null` (D25).
- **Privacidad en la fuente.** Las preferencias de privacidad emocional viven con el registro (`privacy`) y las herramientas de análisis las respetan.

## Stores

### `meta` (keyPath `key`)

| key | value |
|---|---|
| `schemaVersion` | `4` |
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
    type: 'daily' | 'weekdays' | 'interval' | 'monthlyDay' | 'monthlyNth' | 'once',
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
  schemaVersion: 4,
  exportedAt: ISO,
  data: {
    meta: { createdAt, settings },
    days: [...], activities: [...], routines: [...], pages: [...],
    images: [...], files: [...]
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
- **Purga automática:** en cada arranque de la aplicación (`MC.store.init`), se ejecuta una limpieza silenciosa que elimina definitivamente (`delete`) los registros cuyo `deletedAt` tenga una antigüedad mayor al plazo configurado (`now - deletedAt > retentionMs`).
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

## Migraciones

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

## Medición de almacenamiento (DA4)

Implementado en `MC.views.settings.measureStorage(everything, estimate)` (commit `31cf336`): cálculo derivado en tiempo real sin store propio en IndexedDB.

- **Categorías del desglose:**
  - `texto`: días, actividades, rutinas, páginas y metadatos (JSON serializado en UTF-8).
  - `fotos`: imágenes de scrapbook y fotos adjuntas (`kind === 'upload'`).
  - `audio`: archivos adjuntos de audio (MIME `audio/*` o extensiones `.mp3`, `.m4a`, `.wav`, etc.).
  - `dibujos`: trazos vectoriales y mapas de bits generados en el cuaderno (`kind === 'drawing'`).
  - `otros`: adjuntos no clasificables en las categorías anteriores.
- **Umbral de aviso:** `LARGE_THRESHOLD = 5 * 1024 * 1024` (5 MB). Si el peso de los datos propios supera este valor, `isLarge` es `true` y la interfaz presenta un papelito informativo advirtiendo que la descarga de la copia de seguridad puede demorar.
- **Estimación de origen:** integra opcionalmente `navigator.storage.estimate()` para contrastar los datos del cuaderno con el uso total reportado por el navegador (aplicación + caché de fuentes y shell).

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
