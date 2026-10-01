# MI CUADERNO — Modelo de datos

`schemaVersion: 2` · Base IndexedDB `mi-cuaderno` (versión IDB 1: la v2 no agrega índices).

## Principios

- **Fechas como texto local `AAAA-MM-DD`.** Un día del cuaderno es un día del calendario de la persona, no un instante UTC. Nunca guardar `Date` para identificar días (evita corrimientos por zona horaria).
- **Instantes como ISO 8601** (`createdAt`, `updatedAt`) en UTC.
- **IDs**: `crypto.randomUUID()` si existe; si no, `Date.now().toString(36) + random`. Prefijos legibles (`act_`, `rut_`, `pag_`, `stk_`).
- **Nada se deriva y se guarda.** Rutinas → ocurrencias se calculan; insights se calculan.
- **Todo registro tiene `updatedAt`** para futuras fusiones.

## Stores

### `meta` (keyPath `key`)

| key | value |
|---|---|
| `schemaVersion` | `2` |
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
  motion: 'suaves',               // 'completas' | 'suaves' | 'reducidas' | 'ninguna'
  scenes: true,                   // escenas ocasionales
  showCover: true,                // mostrar la tapa al abrir
  onboarded: false,
  backupEveryDays: 14,            // 0 = nunca recordar
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
  createdAt, updatedAt
}
```

### `Placed` (sticker pegado)
```js
{ id: 'stk_…', sticker: 'mariposa', x: 0..1, y: 0..1, rot: -30..30, scale: 0.6..1.6 }
```
`x`, `y` son fracciones del ancho/alto de la hoja → el scrapbook sobrevive a cambios de tamaño de pantalla.

## Backup (`.json`)

```js
{
  app: 'mi-cuaderno',
  kind: 'backup',
  schemaVersion: 2,
  exportedAt: ISO,
  data: {
    meta: { createdAt, settings },
    days: [...], activities: [...], routines: [...], pages: [...]
  }
}
```

Validación al importar (en orden, con mensaje humano por cada falla):
1. Es JSON parseable.
2. `app === 'mi-cuaderno'` y `kind === 'backup'`.
3. `schemaVersion` es entero ≤ versión actual (si es mayor: “Esta copia es de una versión más nueva del cuaderno”).
4. `data.*` son arrays; cada registro pasa `sanitize*` (tipos, fechas válidas, estados conocidos; campos desconocidos se descartan, textos se recortan a 20 000 caracteres).
5. Migraciones `migrations[v]` se aplican de `schemaVersion` a la actual.

## Migraciones

`js/core/backup.js` exporta `MIGRATIONS = { 1: d => d }`. Para agregar la v2: escribir `2: d => {...}` que transforme datos v1 → v2, subir `SCHEMA_VERSION`, y en `store.js` subir la versión IDB con `onupgradeneeded` que cree índices nuevos y reescriba registros con la misma función. Un backup v1 importado en v2 pasa por la migración.

### Migración v1 → v2 (2026-10-01)
Las páginas ganan `date` (su día en el calendario). `MIGRATIONS[2]` lo completa con el día local de `createdAt` al importar una copia v1; en IndexedDB no hace falta reescribir nada porque `normalizePage` hace lo mismo al leer. Sin índices nuevos: la versión IDB sigue en 1.

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
