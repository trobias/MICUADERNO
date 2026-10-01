# MI CUADERNO — Cambios

Qué cambió en cada entrega, para quien usa el cuaderno y para quien lo mantiene. El porqué de cada decisión está en `DECISIONS.md` (Dn); lo que falta, en `ROADMAP.md`. Cada entrega que toca archivos de la app sube `CACHE_VERSION` en `sw.js` para que las PWA instaladas se actualicen.

## 2026-10-01 · El calendario reúne todo (cache `v3`)

**Para quien lo usa**
- Las **rutinas** aparecen en el mes desde que las creás, en todos los días que les tocan, sin tener que marcarlas antes.
- Hoy y los días que vienen muestran una **cajita □ con lo planeado** (rutinas + cosas anotadas para ese día).
- Los días pasados muestran solo **lo hecho (×n)**. Lo que quedó sin marcar no se cuenta: el calendario no es una lista de deudas.
- Las **páginas libres** aparecen con una hojita en el día en que se empezaron. Al abrir ese día, hay una sección *Páginas de este día* con un enlace a cada una. La vista *Semana* también las muestra.
- La leyenda del mes explica todas las marcas: hecho, planeado (con rutinas) y página empezada.
- *Mi año* no cambia: solo borda lo registrado. Una rutina sin marcar no deja medio punto.

**Para quien lo mantiene**
- `MC.model.summarize(days, activities, extra)` acepta `{ from, to, routines, pages }`. Suma ocurrencias virtuales de rutina (`pending`, `planned`, `routines`) y `pages` por fecha local de `createdAt`. Sin `extra` conserva la forma anterior.
- `summaryRange` carga rutinas y páginas. Es nuevo `MC.model.pagesOn(fecha)`.
- No hay cambio de datos guardados: todo es derivado (ver `DATA_MODEL.md` › Resumen del calendario).
- Decisión **D18**; regla nueva en `AGENTS.md` › Trampas: todo lo fechado se ve en el calendario.
- Tests: 31 unit (2 nuevos sobre el resumen) y 17 E2E. El recorrido nuevo cubre rutina planeada en el día siguiente, marca de página en hoy, enlace desde el día, semana y año sin falsos medios puntos.
- Archivos: `js/core/model.js`, `js/views/calendar.js`, `js/views/today.js`, `js/views/year.js`, `css/views.css`, `sw.js`.

## 2026-10-01 · Una sola pantalla con el calendario al centro (cache `v2`)

**Para quien lo usa**
- Se acabaron las secciones separadas. El **calendario del mes es la pantalla principal**, con una **tira de los 12 meses** (y flechas de año) para cambiar de mes con un toque.
- **Cinco botoncitos** arriba: *Hoy · Rutinas · Páginas · Mi año · Ajustes*. Cada uno abre un **cuadro desplegable** encima del calendario.
- **Tocar un día** abre su página en el cuadro. Para volver al calendario: *Volver al calendario*, `Esc`, tocar afuera o *atrás* del navegador. Al volver, el calendario se actualiza.
- La página del día ofrece *Ir a hoy* cuando mirás otro día. El selector de fecha se fue: para saltar lejos está el calendario.

**Para quien lo mantiene**
- `js/app.js` reescrito: el calendario se renderiza como base y las demás vistas van en `<dialog id="panel">` / `#panel-body`. Las rutas por hash se conservan.
- Menús y avisos se cuelgan de `MC.c.layer()` (el diálogo abierto) para no quedar inertes.
- Se eliminaron las pestañas laterales, la barra inferior y la barra superior del celular.
- Decisión **D17**. Los E2E pasaron a 16 recorridos, incluido el de pantalla única. Los selectores de confirmación son `dialog.sheet`.

## 2026-09-30 · Auditoría de UI y roadmap

- Se aplicaron las skills `ui-ux-pro-max`, `frontend-ui-engineering` e `impeccable` (D16):
  - celdas del año de 22 px;
  - foco en tinta;
  - `scroll-padding`;
  - umbral de arrastre en stickers;
  - errores del formulario de rutina junto al campo;
  - restaurar el scroll al volver;
  - avisos de 3,5 s;
  - `touch-action: manipulation`.
- Nuevos E2E: 320 px, celular apaisado, tamaño de celdas, error junto al campo.
- `ROADMAP.md` con verificación pendiente, backlog y deuda técnica.

## 2026-09-30 · Primera versión (v1.0)

- **Documentos:** `SPEC.md`, `DESIGN.md`, `DATA_MODEL.md`, `AGENTS.md`, `DECISIONS.md` (D1–D15), `PRODUCT.md`.
- **Núcleo:**
  - fechas locales, recurrencias (diaria, días de semana, cada N días, día del mes, n-ésimo día, una vez);
  - IndexedDB con modo memoria de emergencia;
  - modelo de dominio, backup JSON con validación y migraciones;
  - TXT/CSV/XLSX propio (ZIP + CRC32);
  - “Lo que fui notando”.
- **App:**
  - tapa con tela elegible y onboarding;
  - página del día: ánimo al empezar y terminar, intención, actividades con 5 estados de punto cruz, notas, energía y sueño, cierre con reflexiones, stickers;
  - calendario mes/semana, rutinas, páginas libres con plantillas y scrapbook;
  - *Mi año* bordado, ajustes, impresión A4/A5/Carta;
  - 5 escenas ocasionales y 4 niveles de motion.
- **PWA:**
  - íconos (parche bordado, D14) y manifest solo por http(s) (D15);
  - service worker cache-first;
  - recordatorios locales opt-in (D11);
  - atajos *Hoy, Escribir una nota, Registrar ánimo, Calendario*.
- **Robustez:**
  - fuentes embebidas para `file://` (D12);
  - borrador local además de IndexedDB para no perder lo escrito al recargar (D13).
