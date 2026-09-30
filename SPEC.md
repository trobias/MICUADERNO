# MI CUADERNO — SPEC

> Fuente funcional de verdad. Si el código y este documento no coinciden, uno de los dos está mal: arreglá el que corresponda y dejá constancia en `DECISIONS.md`.

## 1. Qué es

MI CUADERNO es un cuaderno personal digital: diario, agenda, registro de ánimo, rutinas y scrapbook, en un solo objeto. Funciona 100 % en el dispositivo de la persona, sin cuenta, sin servidor y sin conexión.

**Problema que resuelve.** Las apps de hábitos castigan (rachas perdidas, rojo, “fallaste”). Las apps de notas son frías. Los cuadernos de papel no se pueden buscar, se pierden y no muestran el año de un vistazo. MI CUADERNO toma lo mejor del papel (ritual, calma, belleza, propiedad) y lo mejor del software (persistencia, calendario, recurrencias, exportación), sin traer la ansiedad del software de productividad.

**Promesa:** *abrís, registrás algo en menos de un minuto, cerrás. Y con el tiempo, el cuaderno te devuelve tu propia historia.*

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
3. **Registrar < 60 s.** La acción principal (ánimo + una actividad) nunca está a más de un toque de distancia al abrir.
4. **Opcional por defecto.** Nada es obligatorio: ni nombre, ni ánimo, ni reflexión. Una página vacía está bien.
5. **Silencio visual.** Una pantalla puede estar completamente quieta. Las escenas vivas son ocasionales.
6. **Local y exportable.** Los datos son de la persona. Siempre puede llevárselos (JSON, TXT, CSV, XLSX, impresión).
7. **Descriptivo, nunca causal.** Los insights cuentan (“8 de 11 veces”), no concluyen.

## 5. Navegación (destinos)

Cinco pestañas de papel + ajustes. Nunca más de seis destinos.

| Pestaña | Ruta | Qué es |
|---|---|---|
| **Hoy** | `#/hoy` · `#/dia/AAAA-MM-DD` | La página del día (hoy o cualquier fecha). Corazón del producto. |
| **Calendario** | `#/calendario/semana/AAAA-MM-DD` · `#/calendario/mes/AAAA-MM` | Semana como agenda, mes como calendario ilustrado. |
| **Rutinas** | `#/rutinas` | Crear/editar/pausar rutinas recurrentes. |
| **Páginas** | `#/paginas` · `#/pagina/:id` | Índice de páginas libres + editor con stickers. |
| **Mi año** | `#/anio/AAAA` | Bordado de 365 días + “Lo que fui notando” + “Lo que guardé” (recuerdos). |
| Ajustes | `#/ajustes` | Nombre, tapa, qué registrar, animaciones, recordatorios, datos. |

“Recuerdos” no es un destino propio: vive dentro de *Mi año* como “Lo que guardé” para no sumar una pestaña más.

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
Abrir → (tapa breve o directo, según ajuste) → **Hoy** → sello de ánimo → ver actividades del día (propias + rutinas) → marcar estados → escribir → más tarde “¿Cómo terminó tu día?” + reflexiones.

### 6.3 Revisión
Calendario → Mes → tocar un día → se apoya un marcador → “abrir página” → la página de ese día (editable, pasada o futura).

### 6.4 Rutinas
Rutinas → “nueva rutina” → nombre + frecuencia (+ desde/hasta opcional, momento del día opcional) → aparece sola en los días que corresponde, en Hoy y en la Semana.

### 6.5 Página libre
Páginas → “nueva página” → elegir en blanco o una plantilla (lista, carta al futuro, gratitud…) → escribir → abrir el sobre de stickers → pegar una mariposa, rotarla, moverla.

### 6.6 Backup y restauración
Ajustes → “Mis datos” → **Guardar una copia (.json)**. Para restaurar: “Abrir otra copia” → elegir archivo → se valida → se muestra qué contiene (días, rutinas, páginas, fecha) → advertencia clara → “Reemplazar mi cuaderno” (con opción previa de descargar la copia actual).

### 6.7 Exportar / imprimir
Ajustes → “Llevarme mi cuaderno”: TXT (diario legible), CSV (días / actividades), XLSX (hojas: Resumen, Días, Estados, Actividades, Rutinas, Reflexiones), **Imprimir mi cuaderno** (A4, A5, Carta; rango; secciones) → diálogo de impresión del sistema → PDF o papel.

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

1. **Encabezado**: saludo según hora (“Buenos días / Buenas tardes / Buenas noches, {nombre} ♡”), día de semana + fecha. Flechas día anterior/siguiente, “volver a hoy” si no es hoy. Selector de fecha nativo accesible.
2. **¿Cómo arrancaste hoy?** — 5 sellos de ánimo (ver §9). Tocar el mismo sello lo quita.
3. **Algo que quiero cuidar hoy…** — nota adhesiva, una línea o dos.
4. **Lo de hoy** — lista de actividades: propias del día + ocurrencias de rutinas. Cada una con 5 estados (§10). Agregar inline. Editar texto, borrar, mover a mañana (“lo dejo para otro día” ofrece “pasar a mañana”).
5. **Durante el día** — texto libre sobre renglones.
6. **Energía / sueño** (si están activados) — energía 1-3 (“poquita / media / mucha”), horas de sueño (0–14, pasos de 0,5).
7. **¿Cómo terminó tu día?** — sellos de ánimo + reflexiones: *qué me hizo bien*, *algo difícil*, *algo lindo*, *qué quiero guardar* (⇒ recuerdo), *texto libre*. Se muestra plegado como “cerrar el día” antes de las 17 h si está vacío; siempre se puede desplegar.
8. **Capa de stickers** del día (scrapbook) — botón “stickers”.

Guardado automático (debounce 500 ms) con un “guardado ♡” discreto. Días futuros: editables (planear). Días pasados: editables.

### 7.3 Calendario
- **Mes**: grilla lunes-domingo. Cada día muestra: número, mancha de acuarela del ánimo final (o inicial si no hay final), punto de tinta si escribió, estrellita si guardó un recuerdo, trazo pequeño con cantidad de actividades hechas. Hoy con círculo a lápiz. Seleccionar día → cae una cinta-marcador y aparece una ficha con resumen + “abrir página”.
- **Semana**: agenda de 7 días (desktop: lun-mié izquierda / jue-dom derecha). Cada día: ánimo, actividades (incluye rutinas futuras virtuales), primera línea escrita. Tocar → abre el día.
- Navegación anterior/siguiente, “hoy”.

### 7.4 Rutinas
- Lista agrupada por momento del día (mañana / tarde / noche / cuando sea).
- Frecuencias soportadas (§11). Descripción humana de la regla (“Lun · Mié · Vie”, “Cada 3 días”, “Primer sábado del mes”).
- Pausar/reanudar (archivar), editar, borrar (con confirmación; el historial ya marcado se conserva como actividades sueltas).

### 7.5 Páginas
- **Índice** con título, fecha y número de página con puntos guía (como un índice real). Fijar páginas arriba.
- **Nueva página**: en blanco o plantillas: *Cosas que me hacen bien, Lugares que amo, Personas importantes, Canciones de este momento, Mis pequeñas victorias, Cosas que quiero probar, Carta para mi yo futuro, Brain dump, Gratitud, Sueños, Lista de deseos, Reflexión del mes*.
- Tipos: `text` (renglones) o `list` (ítems con viñeta dibujada).
- Papel: rayado, cuadriculado, punteado, liso.
- Stickers (scrapbook).
- Borrar con confirmación.

### 7.6 Mi año
- **Bordado**: 12 columnas (meses) × 31 filas (días). Día sin registro = punto de cruz a lápiz sin llenar (bonito vacío). Día con ánimo = parche del color del hilo de ese ánimo + glifo accesible en tooltip/label.
- Leyenda de ánimos siempre visible (glifo + nombre + color).
- Tocar un día → abre su página.
- **Lo que fui notando**: 3-6 observaciones descriptivas (§12).
- **Lo que guardé**: lista de recuerdos (“qué quiero guardar”) del año, como papelitos.

### 7.7 Ajustes
- **Vos**: nombre, tapa, nombres de los 5 ánimos (editables), qué registrar.
- **Cómo se mueve**: animaciones *Completas / Suaves / Reducidas / Ninguna* (default: *Suaves*, o *Reducidas* si el sistema pide reduced-motion); escenas ocasionales on/off; mostrar la tapa al abrir.
- **Recordatorios**: ver §14.
- **Mis datos**: texto de privacidad; guardar copia; abrir/restaurar; exportar; imprimir; recordatorio de copia (cada 7/14/30 días/nunca); borrar todo (doble confirmación, escribiendo “borrar”).
- **Instalar**: si el navegador lo permite, botón “Instalar en este dispositivo”.

## 8. Tono y copy

- Español rioplatense (vos, querés, pieza). Breve, cálido, adulto.
- No abusar de diminutivos; no infantilizar; no asumir tristeza.
- Prohibido: “fallaste”, “incumplido”, “racha perdida”, “fracaso”, “no completaste”, signos de exclamación en cadena, emojis múltiples.
- Empty states propios: “Esta página todavía está en blanco.”, “Tu semana recién empieza.”, “Todavía no guardaste ningún recuerdo este año.”, “Cuando quieras, escribí la primera línea.”
- El ♡ se usa como firma, máximo una vez por pantalla.

## 9. Ánimo

Cinco niveles ordenados, con nombre editable, glifo propio y color de hilo (ver DESIGN §3.3):

| Valor | Nombre default | Glifo |
|---|---|---|
| 1 | pesado | nube con lluvia |
| 2 | bajito | nube |
| 3 | normal | sol detrás de nube |
| 4 | bien | flor |
| 5 | muy bien | sol |

Se registra al empezar (`morning.mood`) y al terminar (`evening.mood`). Ambos opcionales.

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

Catálogo inicial: días desde que empezó el cuaderno; veces que escribió esta semana; rutina más acompañada del mes (“Caminaste 6 días este mes”); día de la semana que más suele empezar con ánimo alto; comparación entre empezar y terminar el día (“Terminaste el día igual o mejor de lo que empezaste 12 de 18 veces”); co-ocurrencia descriptiva actividad-ánimo (“Los días que caminaste terminaste el día bien o muy bien 8 de 11 veces”).

## 13. Datos, backup y exportación

Ver `DATA_MODEL.md` para esquema. Resumen:

- **IndexedDB** (`mi-cuaderno`): `meta`, `days`, `activities`, `routines`, `pages`.
- **localStorage**: solo preferencias livianas de UI (última ruta, cantidad de aperturas de tapa). Nada importante vive solo ahí.
- **Backup JSON**: `{ app: "mi-cuaderno", kind: "backup", schemaVersion, exportedAt, data: {...} }`. Import valida estructura, migra versiones anteriores, rechaza archivos de otra app o versiones futuras con mensaje claro.
- **Restaurar = reemplazar** (con advertencia y opción de descargar la copia actual antes). No hay “merge” en v1 para evitar duplicados ambiguos.
- **TXT**: diario legible, día por día.
- **CSV**: `dias.csv` y `actividades.csv` (UTF-8 con BOM para Excel, separador `,`, comillas RFC 4180).
- **XLSX**: generado localmente sin dependencias (ZIP + SpreadsheetML).
- **Impresión**: documento dedicado con `@page` A4 / A5 / Letter: portada, calendario mensual resumido, una página por día con contenido, páginas libres.
- **Recordatorio de copia**: nota suave en Hoy si pasaron N días desde la última copia (default 14) y hay datos.

## 14. Recordatorios / notificaciones

Honestidad técnica: sin servidor no existe push remoto. MI CUADERNO usa **notificaciones locales** (Notification API vía service worker cuando existe) que se disparan mientras la app o la PWA está abierta o en segundo plano (el navegador puede suspenderla). En Chromium instalado se intenta además *Periodic Background Sync* si está disponible. Esto se explica en Ajustes.

Ajustes: inicio del día (on/off + hora, default 08:30), cierre del día (on/off + hora, default 21:30), rutinas del día (off), mensaje de regreso tras ≥ 4 días sin abrir (off), modo *Normal / Tranquilo* (sin sonido, `silent: true`) */ Silencioso* (nada). Máximo 1 notificación por tipo por día. Nunca incluir contenido escrito por la persona en el texto de la notificación.

## 15. PWA

- Servida por HTTP(S): instalable (manifest, iconos, service worker offline-first, shortcuts: *Hoy, Escribir una nota, Registrar ánimo, Calendario*).
- Abierta por doble clic (`file://`): funciona igual, sin instalación ni service worker (los navegadores no lo permiten en `file://`).
- Actualización: el SW nuevo queda en espera; la app muestra “Hay una versión nueva del cuaderno — actualizar”.

## 16. Accesibilidad

WCAG 2.2 AA como piso: contraste de texto ≥ 4.5:1, foco visible propio, todo operable por teclado (incluye stickers: flechas mueven, `[` `]` rotan, `Supr` borra), labels en todos los inputs, `aria-live` para “guardado”, decoraciones con `aria-hidden`, targets ≥ 44 px en táctil, respeto de `prefers-reduced-motion` y del ajuste interno.

## 17. Casos borde que deben funcionar

Sin datos · un día · 30 días · un año (365 días + 1000 actividades) · muchas rutinas (30+) · rutina borrada con historial · fecha pasada y futura · cambio de mes/año · 29 de febrero · regla “día 31” en meses cortos · import del mismo backup dos veces (reemplaza, no duplica) · backup inválido / de otra app / versión futura · almacenamiento lleno o IndexedDB no disponible (aviso + modo de emergencia en memoria con exportación) · dos pestañas abiertas (BroadcastChannel refresca).

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
js/core/              lógica pura + almacenamiento (sin DOM salvo store)
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
  - `npm run e2e` — Playwright contra `file://` y `http://localhost` (usa el Chromium preinstalado).
  - `npm run check` — `node --check` de todos los JS + unit + e2e.
  - `npm run serve` — servidor estático en `http://localhost:4173` para probar la PWA.
  - `npm run icons` — regenera PNG/ICO desde los SVG maestros.
  - `npm run dist` — arma la carpeta distribuible.

## 20. Estrategia de pruebas

- **Unit (node:test):** fechas, recurrencias (incluye 29/02, día 31, n-ésimo día, intervalos, temporales), materialización de rutinas, validación y migración de backups, CSV (escapes), ZIP/XLSX (estructura válida), insights (umbrales, redacción no causal).
- **E2E (Playwright/Chromium):** primera apertura → onboarding → registrar ánimo → actividades con estados → recargar y ver persistencia → rutina que aparece → calendario → exportar JSON → borrar → restaurar → datos de vuelta. En `file://` y en `http://` (SW registrado, offline con red cortada). Viewports 375×812, 820×1180, 1440×900.
- **QA visual:** capturas desktop + mobile revisadas contra DESIGN.md; detector de `impeccable` una vez al final.

## 21. Límites

- **Siempre:** correr `npm run check` antes de commitear; mantener SPEC/DESIGN/AGENTS al día; validar todo archivo importado; `aria-hidden` en decoración.
- **Preguntar antes:** agregar dependencias de runtime, cambiar el esquema (requiere migración + `schemaVersion`), cambiar la paleta de ánimos, agregar un destino de navegación.
- **Nunca:** enviar datos a un servidor, agregar analytics, lenguaje de culpa, sonido automático, pedir permisos al abrir, cargar recursos de CDN en runtime.

## 22. Criterios de éxito

1. Doble clic en `index.html` (Chrome/Edge/Firefox) abre la app, y los datos sobreviven a cerrar el navegador.
2. Servida por HTTPS: instalable, abre sin conexión, se actualiza avisando.
3. Registrar ánimo + marcar una actividad al abrir: ≤ 3 interacciones.
4. Export JSON → borrar todo → import → estado idéntico (test automatizado).
5. Sin errores de consola en los recorridos E2E; contraste AA en texto; operable solo con teclado.
6. Con `prefers-reduced-motion` o “Ninguna”: sin escenas ni desplazamientos.
