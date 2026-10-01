# MI CUADERNO — Roadmap y backlog

Estado al 30/09/2026. Lo hecho está en `SPEC.md`; acá va lo que falta, ordenado por valor para la persona que usa el cuaderno. Cada ítem dice de dónde sale (brief, skill, prueba) para no inventar trabajo.

Leyenda: **P1** = próximo · **P2** = después · **P3** = algún día · (brief §n) = sección del prompt original.

## v1.0 — hecho

MVP completo del brief §64, con navegación de una sola pantalla (calendario al centro + cuadros desplegables, DECISIONS D17): abrir/cerrar/volver con los datos, ánimo al empezar y terminar, actividades con 5 estados, escribir, navegar fechas, rutinas con recurrencia, calendario semana/mes, año bordado, páginas con stickers, backup/restauración, TXT/CSV/XLSX, impresión A4/A5/Carta, PWA offline instalable, recordatorios locales, 5 escenas, 4 niveles de motion. El calendario reúne todo lo que tiene fecha: rutinas planeadas, páginas empezadas, lo hecho (D18). 46 unit + 20 E2E en verde. Rutas, cuentas y dibujos en un solo lugar (D19); las secciones se conectan por las fechas (D20); el calendario se actualiza solo (D21); marcadores que abren cuadros y Agenda (D22). Historial de cambios en `CHANGELOG.md`.

---

## Verificación pendiente (antes de llamarlo “probado”)

Lo construido no se probó todavía fuera de Chromium headless.

| # | Qué | Por qué | Prioridad |
|---|---|---|---|
| V1 | Firefox y Safari (macOS/iOS) con doble clic y como web | brief §66; IndexedDB en `file://` varía por navegador (Safari puede no permitirlo → cae a modo memoria con aviso) | P1 |
| V2 | Instalar la PWA en Android, iOS y Windows reales; ver ícono, splash y atajos | brief §83, §97 | P1 |
| V3 | Que una notificación llegue de verdad (con la app abierta, en segundo plano e instalada/cerrada en Chrome) | brief §94, §97; solo se probó que el código no falle | P1 |
| V4 | Lector de pantalla real (NVDA / VoiceOver) en Hoy, calendario y bastidor | skill `accessibility`; hoy solo hay chequeos automáticos | P1 |
| V5 | Detector completo de `impeccable` (necesita instalar sus parsers: pedir permiso) y `axe-core` | corrió en modo degradado | P2 |
| V6 | Almacenamiento lleno | brief §67; el código existe, falta prueba E2E (dos pestañas a la vez ya está cubierto, D21) | P2 |
| V7 | Publicar en GitHub Pages (Settings → Pages → `main` / root) y probar la actualización de versión (subir `CACHE_VERSION`) | brief §86 “actualizarse correctamente” | P1 |

## Producto — lo que el brief pedía y todavía no está

| # | Qué | Origen | Prioridad |
|---|---|---|---|
| B1 | **Tema “papel de noche”** para escribir a oscuras (hojas tinta, hilos claros, validado con `dataviz` en modo oscuro) | skill `ui-ux-pro-max` (diseñar claro/oscuro juntos); uso real: cerrar el día en la cama | P1 |
| B2 | **Scrapbook más completo**: nota adhesiva y texto sueltos pegables, fecha-sello, cinta con texto | brief §30 (sticker, texto, cinta, nota, doodle, fecha) | P2 |
| B3 | Foto local opcional en páginas (guardada en IndexedDB como Blob, incluida en el backup) | brief §30 “foto local opcional en futuro” | P3 |
| B4 | Escenas que faltan: ventana con lluvia, cortina que se mueve, flor con viento, esquina de hoja con brisa | brief §39 (hay 5 de 9) | P2 |
| B5 | Recordatorios “frases suaves” y “pequeños mensajes sorpresa” (opt-in, máx. 1 por semana) | brief §91 | P3 |
| B6 | Papelito tras completar algo (“Guardaste algo de hoy. ¿Querés escribir cómo te hizo sentir?”), como aviso dentro de la app, no notificación | brief §90 | P2 |
| B7 | Personalización: papel del día (rayado/cuadriculado), densidad, más tapas | brief §54 | P3 |
| B8 | Más “Lo que fui notando”: comparaciones de semana (“las mañanas empezaron mejor que la semana pasada”), energía y sueño | brief §32, §93 (siempre descriptivo) | P2 |
| B9 | Empaquetado portable (Tauri) para quien no quiera navegador | brief §17 opción C — solo si hace falta | P3 |

## Producto — ideas que surgieron al construir

| # | Qué | Por qué | Prioridad |
|---|---|---|---|
| I1 | **Buscar en el cuaderno** (texto de días, recuerdos y páginas) | brief §6.3 “recordar qué ocurrió”: con un año de datos, el calendario solo no alcanza | P1 |
| I2 | Sacar una ocurrencia de rutina de un día puntual (“hoy no toca”) sin pausar la rutina | hoy solo se puede marcar un estado | P2 |
| I3 | Importar **fusionando** en vez de reemplazar (p. ej. traer el cuaderno del celular a la compu) | DECISIONS D10 lo dejó fuera de v1; cada navegador tiene su propio cuaderno | P2 |
| I4 | Copia automática a un archivo elegido (File System Access API, donde exista) | reduce el riesgo de perder datos al borrar el navegador | P2 |
| I5 | “Mi año” alternando ánimo al empezar / al terminar | hoy muestra el final (o el inicial si no hay final) | P3 |
| I6 | Reordenar actividades del día arrastrando (con alternativa de teclado) | hoy el orden es rutinas → propias por fecha de alta | P3 |
| I7 | Hora opcional por rutina y recordatorio por rutina | hoy el recordatorio de rutinas va con el de la mañana | P3 |
| I9 | En el mes, tocar la marca de página para abrirla directo (hoy se entra por el día) | D18 | P3 |

## Deuda técnica

| # | Qué | Origen | Prioridad |
|---|---|---|---|
| T1 | Partir `js/views/today.js` (≈370 líneas; la fila ya está en `js/ui/activity.js`) en encabezado, cierre y cuerpo | skill `frontend-ui-engineering` (componentes > 200 líneas) | P2 |
| T2 | E2E de “pasar a mañana”, deshacer al sacar una actividad, stickers con teclado, restaurar scroll al volver | cubiertos a mano, no automatizados | P2 |
| T3 | Subir `CACHE_VERSION` en `sw.js` en cada entrega (hoy `v7`; nunca se publicó) — automatizarlo en `npm run dist` | AGENTS.md | P1 (al publicar) |
| T4 | `assets/fonts/*.woff2` y `css/fonts.css` duplican las fuentes; dejar los woff2 solo como fuente de `build-fonts` fuera del dist | tamaño del paquete | P3 |
| T5 | Atajos de la PWA usan el mismo ícono; dibujar uno por atajo (hoy, nota, ánimo, calendario) | brief §85 | P3 |

## Descartado a propósito

- Rachas, puntajes, badges, confeti (brief §4, §42).
- Sonido ambiente por defecto (brief §44): solo si se pide explícitamente, y no es prioridad.
- Push remoto con servidor (brief §14 “sin backend”); ver DECISIONS D11.
- Sugerencias del `--design-system` de `ui-ux-pro-max` (acento índigo, manuscrita como fuente principal, patrón de landing): contradicen el brief; ver DECISIONS D16.

## Próximo paso sugerido

1. V7 publicar en GitHub Pages → V1–V3 probar en dispositivos reales (lo que falle define el resto).
2. B1 papel de noche.
3. I1 buscar.
