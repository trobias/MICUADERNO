# Evaluación de las etapas B y C (05/10/2026)

La etapa A está completa (A0–A13). Este documento dice qué hay de la nube (B), qué falta, y si conviene hacer la etapa C (React y escenas 2.0) ahora. Las decisiones grandes (gastos, servicios nuevos, reescrituras) son de la dueña: acá van recomendaciones, no hechos consumados.

## 1. Etapa B · nube: qué hay y qué falta

**Publicado:** `https://micuaderno-five.vercel.app` (Vercel `trobias-projects/micuaderno`, cada push a `main` despliega Production; el último, A13, está `READY`). Supabase `lrwfkbuhmgtckjmswrzp` con el esquema y la RLS aplicados. Nicole creó su cuenta de administradora.

| Paso del plan | Estado | Diferencias con el plan original (y por qué) |
|---|---|---|
| B1 estructura | Hecho | Next.js 16 en la raíz; el cuaderno se **copia** a `public/` en cada build (no `git mv`): sigue andando con doble clic en `index.html`. |
| B2 datos | Hecho | `notebook_parts` partido por sección con `MC.sections` y RLS en todas las tablas; fotos, dibujos y adjuntos en Storage privado en pedazos por el servidor (NB1, D43). Tests de RLS propios en Postgres 16 real en vez de pgTAP. |
| B3–B4 identidad y permisos | Hecho | Usuario + PIN de 6 (Argon2id con pepper, `hash-wasm`), demoras progresivas, contraseña de Supabase derivada por HMAC. Nicole admin con `/preparar?clave=` (en vez de un script). Permisos ver/editar por sección. |
| B5 sincronización | Hecho en su forma simple (D38) | La dueña sube su cuaderno; quien recibe permiso lo abre **en memoria** (sin copia local). Cola de salida en `localStorage` (no en la misma transacción de IndexedDB), sin Web Locks ni reloj híbrido: “gana el más nuevo” por pedazo. Lectura protegida por RLS y por el servidor. |
| B6 push/PWA | Hecho, sin probar en un teléfono | Web Push con VAPID, mensajes sin contenido escrito; un aviso por día (Vercel Hobby). |
| B7–B8 entrega | Parcial | Production publicada con el ok de la dueña. **Falta** un entorno preview con datos aislados, la prueba con dos cuentas reales y la revisión en dispositivos. El historial de migraciones de Supabase está vacío (se aplicó con `execute_sql`): ver `docs/NUBE.md` para `supabase migration repair`. |

### Lo que sigue (con las respuestas de la dueña, D40)

- **Descartado por la dueña:** la prueba guiada con la psicóloga, la prueba en el celular y un segundo proyecto de Supabase para las Preview. No volver a proponerlos.
1. **Hecho (06/10, D43): fotos, dibujos y adjuntos en la nube** (NB1). Hoy una foto queda solo en el dispositivo donde se subió y quien mira el cuaderno compartido no la ve. Bucket privado por persona, subida y descarga firmadas desde el servidor, la misma RLS por sección (`fotos`), papelera y copia `.json` sin cambios. *Mediano; entra en el plan gratis mientras no pase de 1 GB.*
2. **Cola de salida más firme** (NB2): la cola en un store de IndexedDB en la misma transacción que el cambio y Web Locks para que sincronice una sola pestaña. *Chico/mediano.*
3. **Hecho (06/10): historial de migraciones** (NB3): ya estaban registradas; se sumó la del bucket.

## 2. Etapa C · descartada (D42)

Se le presentaron a la dueña las cinco opciones (validar en el servidor con `js/core`, vistas React, armazón React, escenas 3D, islas React). Respuesta: **“no me gusta ninguna, nunca pasemos a React, está bien como está”**. No hay etapa C y no se vuelve a proponer.

## 3. Lo que sigue esperando a la dueña

Están en `HANDOFF.md` §4: motion por defecto con “reducir movimiento”, canciones con metadatos, bloqueo con PIN local, reescribir historia de git (no sin su “sí”), nombre de “Volver a mí”, actividades a la papelera. Y NB4: si abrir una copia con la nube prendida tiene que reemplazar también lo de la nube.
