# QA cruzada (A12) — 05/10/2026

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
