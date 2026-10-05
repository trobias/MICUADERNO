# Evaluación de las etapas B y C (05/10/2026)

La etapa A está completa (A0–A13). Este documento dice qué hay de la nube (B), qué falta, y si conviene hacer la etapa C (React y escenas 2.0) ahora. Las decisiones grandes (gastos, servicios nuevos, reescrituras) son de la dueña: acá van recomendaciones, no hechos consumados.

## 1. Etapa B · nube: qué hay y qué falta

**Publicado:** `https://micuaderno-five.vercel.app` (Vercel `trobias-projects/micuaderno`, cada push a `main` despliega Production; el último, A13, está `READY`). Supabase `lrwfkbuhmgtckjmswrzp` con el esquema y la RLS aplicados. Nicole creó su cuenta de administradora.

| Paso del plan | Estado | Diferencias con el plan original (y por qué) |
|---|---|---|
| B1 estructura | Hecho | Next.js 16 en la raíz; el cuaderno se **copia** a `public/` en cada build (no `git mv`): sigue andando con doble clic en `index.html`. |
| B2 datos | Hecho sin Storage | `notebook_parts` partido por sección con `MC.sections` (una sola fuente, con test contra la migración) y RLS en todas las tablas. **Falta Storage privado**: fotos, dibujos y adjuntos no viajan (se avisa). Tests de RLS propios en Postgres 16 real en vez de pgTAP. |
| B3–B4 identidad y permisos | Hecho | Usuario + PIN de 6 (Argon2id con pepper, `hash-wasm`), demoras progresivas, contraseña de Supabase derivada por HMAC. Nicole admin con `/preparar?clave=` (en vez de un script). Permisos ver/editar por sección. |
| B5 sincronización | Hecho en su forma simple (D38) | La dueña sube su cuaderno; quien recibe permiso lo abre **en memoria** (sin copia local). Cola de salida en `localStorage` (no en la misma transacción de IndexedDB), sin Web Locks ni reloj híbrido: “gana el más nuevo” por pedazo. Lectura protegida por RLS y por el servidor. |
| B6 push/PWA | Hecho, sin probar en un teléfono | Web Push con VAPID, mensajes sin contenido escrito; un aviso por día (Vercel Hobby). |
| B7–B8 entrega | Parcial | Production publicada con el ok de la dueña. **Falta** un entorno preview con datos aislados, la prueba con dos cuentas reales y la revisión en dispositivos. El historial de migraciones de Supabase está vacío (se aplicó con `execute_sql`): ver `docs/NUBE.md` para `supabase migration repair`. |

### Lo que sigue (con las respuestas de la dueña, D40)

- **Descartado por la dueña:** la prueba guiada con la psicóloga, la prueba en el celular y un segundo proyecto de Supabase para las Preview. No volver a proponerlos.
1. **Próximo: Storage privado para fotos, dibujos y adjuntos** (BACKLOG NB1). Hoy una foto queda solo en el dispositivo donde se subió y quien mira el cuaderno compartido no la ve. Bucket privado por persona, subida y descarga firmadas desde el servidor, la misma RLS por sección (`fotos`), papelera y copia `.json` sin cambios. *Mediano; entra en el plan gratis mientras no pase de 1 GB.*
2. **Cola de salida más firme** (NB2): la cola en un store de IndexedDB en la misma transacción que el cambio y Web Locks para que sincronice una sola pestaña. *Chico/mediano.*
3. **Historial de migraciones de Supabase** (NB3): registrar la migración aplicada (`npx supabase migration repair --status applied 20261004120000`) antes de la próxima. *Necesita la CLI con el token de la dueña, en su máquina.*

## 2. Etapa C · React y escenas 2.0: ¿conviene ahora?

**Recomendación: no reescribir las vistas en React ahora.** Razones:

- **Funciona y está probado**: 126 pruebas unitarias y 54 recorridos E2E cubren el cuaderno vanilla; una reescritura vista por vista los tiene que volver a pasar uno por uno, sin ganar nada visible para Nicole.
- **El doble clic en `index.html` y el modo sin red** son parte de la filosofía (AGENTS: “nada sale del dispositivo”, `file://`). React con build obliga a servir el cuaderno y complica ese modo.
- **El costo es alto y el beneficio, sobre todo interno** (mantenimiento). Tiene sentido si entra más gente a programar o si una pantalla nueva se vuelve muy interactiva.
- **Three.js / Motion para escenas**: las escenas actuales (SVG + Web Animations, solo `transform`/`opacity`) son livianas, respetan el motion reducido y rinden bien (ver `docs/QA.md`). Una escena 3D pesaría cientos de KB, necesita WebGL con respaldo y no suma al “cuaderno de tela”. Si algún día se quiere una escena especial (abrir la tapa en 3D, por ejemplo), hacerla **una sola**, cargada a demanda y con respaldo.

**Una “C chica” que sí conviene, cuando haga falta:**
1. Compartir `js/core` con el servidor (Next) como módulos, para validar en el servidor con los mismos normalizadores que el cuaderno (hoy el servidor confía en la forma de los pedazos y la RLS decide quién; validar la forma sumaría una capa).
2. Si una vista nueva necesita mucho estado (por ejemplo un buscador o “Volver a mí” de la VISION), evaluarla en React como isla dentro del shell, con su E2E.

## 3. Lo que sigue esperando a la dueña

Están en `HANDOFF.md` §4: motion por defecto con “reducir movimiento”, canciones con metadatos, bloqueo con PIN local, reescribir historia de git (no sin su “sí”), nombre de “Volver a mí”, actividades a la papelera. De la etapa C: qué ítems (C1–C5 en `BACKLOG.md`) se hacen y cuáles se archivan.
