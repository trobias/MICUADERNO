# MI CUADERNO en la nube: Vercel + Supabase (etapa B, base)

Estado al 04/10/2026: **la base de la nube está hecha y probada en local; existe una Preview `Ready`, pero falta conectarla y verificarla con Supabase.** Hay cuentas con usuario y PIN, Nicole administra, permisos por sección con RLS, avisos push y el latido que evita que Supabase pause el proyecto. **Todavía no hay sincronización**: el cuaderno de cada persona vive en su dispositivo (IndexedDB) hasta el paso B5, que viene después de A7 porque la forma de las hojas cambia en A6–A7. Decisiones: `DECISIONS.md` D35 (etapas), D36 (personas, roles y permisos) y D37 (cómo quedó armada la base).

## 1. Cómo está armado

```
navegador ──► Vercel (Next.js 16)
                ├─ /                 → el cuaderno de siempre (public/index.html, copiado por tools/copy-notebook.mjs)
                ├─ /entrar           → usuario + PIN
                ├─ /preparar         → crear la primera persona administradora (con SETUP_TOKEN, una sola vez)
                ├─ /cuenta           → cambiar PIN, avisos, personas (admin), quién ve mi cuaderno
                ├─ /api/*            → login, logout, setup, pin, me, people, grants, push, keepalive
                └─ proxy.ts          → renueva la sesión y manda a /entrar si no hay sesión
              ──► Supabase (Auth + Postgres con RLS)   ← solo el servidor habla con Supabase
```

- **El cuaderno sigue siendo el mismo.** `index.html` abre igual con doble clic (`file://`). Para la nube, `npm run build` copia `index.html`, `sw.js`, `manifest`, `css/`, `js/` y `assets/` a `public/` (carpeta generada, no se commitea). Si hay variables de Supabase, también le suma `<meta name="mc-cloud">`: con esa marca, `js/cloud.js` activa las cuentas.
- **Una base local por persona.** Con cuentas, cada persona abre `IndexedDB mi-cuaderno@<su id>` y sus preferencias `mc.ui.<su id>.*`. Dos personas que comparten un dispositivo no se mezclan. Sin la marca (file:// o un servidor simple), todo sigue como siempre (`mi-cuaderno`).
- **El navegador nunca habla con Supabase.** Lo hace el servidor de Next: con la sesión de la persona (clave publicable + su JWT en cookies, y entonces pasa por la RLS) o, para lo administrativo, con la clave secreta, siempre después de comprobar quién pide.
- **Sin conexión:** el service worker sirve el cuaderno desde la caché. La cookie `mc_person` (solo el id, no es secreta) dice qué base abrir, así que funciona sin red. Con red, `js/cloud.js` consulta `/api/me`: si la sesión terminó, lleva a `/entrar`. `/entrar`, `/cuenta` y `/api` nunca salen de la caché.

## 2. Seguridad

| Tema | Cómo |
|---|---|
| PIN | 6 números (D36). Se guarda como **Argon2id** (19 MiB, 2 pasadas) con **pimienta** (`PIN_PEPPER`) como secreto del algoritmo. La columna `profiles.pin_hash` no la puede leer ningún rol del navegador (permiso por columna). Sin escaleras (123456) ni repetidos (000000). |
| Supabase Auth | El PIN **nunca** es la contraseña de Supabase. La contraseña es `HMAC-SHA256(AUTH_SECRET, id)` y el correo es interno (`<id>@personas.mi-cuaderno.invalid`, se cambia con `AUTH_EMAIL_DOMAIN`). Nadie recibe correos. |
| Fuerza bruta | 3 intentos libres; después la espera se duplica (30 s, 1, 2, 4 min… hasta 1 hora), por usuario y por IP (`login_throttle`). Si el usuario no existe, la respuesta y el tiempo son los mismos. |
| CSRF | Las rutas que cambian algo exigen `Origin` del mismo sitio. Las cookies de sesión las maneja `@supabase/ssr` (`SameSite=Lax`, `Secure` en producción). |
| RLS | En **todas** las tablas. Sin sesión no se lee nada. Funciones `private.can_read`, `private.can_write` y `private.is_admin` (security definer, en un esquema fuera de la API para que no se puedan llamar por RPC). “Solo para mí” (`private`) no lo ve nadie más, aunque tenga permiso. Una persona en pausa pierde los permisos. Lo prueba `tests/cloud/rls.test.mjs` contra un Postgres 16 real. |
| Permisos | Los da **la dueña o el dueño de cada cuaderno**, por sección (`semana`, `actividades`, `emociones`, `escritura`, `hojas`, `repeticiones`, `fotos`, `anio`, `ajustes`) y nivel (`ver` / `editar`). Quien administra crea personas, cambia PIN olvidados y pone en pausa, pero **no** puede abrir ni compartir el cuaderno de otra persona. Ejemplo: Nicole crea a su psicóloga y le da “ver” en Emociones y Escritura. |
| Cabeceras | El cuaderno se sirve con CSP estricta (`script-src 'self'`, sin scripts en línea). Además: HSTS, `nosniff`, `no-referrer` y `Permissions-Policy`. |
| Registro | `audit_events` guarda altas, pausas, cambios de PIN y de permisos, e ingresos. **Nunca** contenido ni PIN. |
| Avisos | Textos fijos y amables, sin nada escrito por la persona. El permiso del navegador se pide solo al tocar “Activar” en Mi cuenta. |

**Qué partes hay en la base.** `js/core/sections.js` es la única fuente que dice qué campo de cada registro va a qué sección. Por ejemplo, las emociones de un día van a `emociones` y sus notas a `escritura`. Cuando exista la sincronización (B5), cada registro se va a guardar en `notebook_parts` partido así, y la RLS va a entregar solo las partes permitidas. Un test compara esa lista con la tabla `sections` de la migración.

## 3. Puesta en marcha (una vez)

Hacelo en este orden. Son pasos externos: los hace la dueña o un agente con acceso a sus cuentas.

### 3.1 Supabase (cuenta de Supabase)
1. Proyecto: `lrwfkbuhmgtckjmswrzp` (`https://lrwfkbuhmgtckjmswrzp.supabase.co`).
2. Aplicar la migración `supabase/migrations/20261004120000_cuentas_permisos.sql`. Hay tres caminos:
   - **CLI:** `npx supabase login` → `npx supabase link --project-ref lrwfkbuhmgtckjmswrzp` (pide la contraseña de la base) → `npx supabase db push`.
   - **MCP de Supabase:** herramienta `apply_migration` con el contenido del archivo.
   - **Panel:** SQL Editor → pegar el archivo → Run. Es idempotente: se puede correr dos veces.
3. Authentication → Providers → Email: dejarlo **habilitado** (las cuentas internas usan correo + contraseña). Apagá “Confirm email” o dejalo como está: las cuentas se crean ya confirmadas. Apagá también los registros públicos (“Allow new users to sign up”): las altas las hace el servidor.
4. Project Settings → API keys: copiá la **publishable** (`sb_publishable_…`, ya la tenemos) y la **secret** (`sb_secret_…`). La secreta va **solo** a Vercel.

### 3.2 Vercel (cuenta de Vercel)
Proyecto `https://vercel.com/trobias-projects/micuaderno`, conectado a este repo. Next.js se detecta solo (`vercel.json`). Variables de entorno, en Production y Preview:

| Variable | Valor | ¿Secreta? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lrwfkbuhmgtckjmswrzp.supabase.co` | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_THfa2QZrFLn7AU4dwi4jvA_TCyrYfEx` | no (es pública por diseño) |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` del paso 3.1.4 | **sí** |
| `PIN_PEPPER` | `openssl rand -base64 32` | **sí**; si se cambia, todos los PIN dejan de valer |
| `AUTH_SECRET` | `openssl rand -base64 32` | **sí**; si se cambia, hay que regenerar las contraseñas internas |
| `CRON_SECRET` | `openssl rand -base64 32` | **sí**; Vercel lo manda solo a los cron |
| `SETUP_TOKEN` | `openssl rand -base64 24` | **sí**; se puede borrar después de preparar |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` | la privada **sí** |
| `VAPID_SUBJECT` | `mailto:tomanotartobinotar@gmail.com` | no |
| `NEXT_TELEMETRY_DISABLED` | `1` (sin telemetría de Next en el build) | no |
| `AUTH_EMAIL_DOMAIN` | opcional (por defecto `personas.mi-cuaderno.invalid`) | no |

Después: Deploy. Abrí `https://<tu-dominio>/preparar`, escribí el `SETUP_TOKEN` y creá a **Nicole** (administradora). `/preparar` deja de funcionar cuando ya hay una persona.

### 3.3 Que Supabase no se pause (pedido de la dueña)
El plan gratuito de Supabase **pausa el proyecto después de unos 7 días sin actividad**. `vercel.json` programa dos cron diarios (el plan Hobby de Vercel permite uno por día por cron):
- `/api/keepalive` a las 09:17 UTC: escribe `keepalive.beat_at = now()` en la base, que es actividad real.
- `/api/push/cron` a las 11:35 UTC (08:35 en Argentina): manda el aviso de la mañana y también actualiza el latido.

Para revisarlo: Vercel → proyecto → Settings → Cron Jobs (debe listar los dos), o en SQL `select beat_at from public.keepalive;` (tiene que ser de hoy). Como refuerzo opcional, en Supabase se puede activar `pg_cron` y programar `update public.keepalive set beat_at = now()` cada día. Ojo: que sea pg_cron dentro de la base puede no contar como “uso” para la pausa, así que la llamada desde Vercel sigue siendo la principal.

### 3.4 Avisos a la hora elegida
Con el cron diario solo sale el aviso de la mañana (ventana de 12 h). Para que lleguen a la hora que cada persona elige (mañana y noche), hace falta que `/api/push/cron` corra **cada hora**. Hay dos formas:
- **Vercel Pro:** cambiar el schedule a `5 * * * *` y la ruta a `/api/push/cron` (ventana de 60 min).
- **Supabase (gratis):** activar las extensiones `pg_cron` y `pg_net`, y programar cada hora:
  ```sql
  select cron.schedule('mc-avisos', '5 * * * *', $$
    select net.http_get(url := 'https://<tu-dominio>/api/push/cron',
                        headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>'));
  $$);
  ```
  Guardá el secreto en Supabase Vault si preferís no dejarlo en el texto del cron.

La entrega es idempotente: un aviso de cada tipo por persona y por día (`push_log`). En iPhone, los avisos funcionan solo con el cuaderno agregado a la pantalla de inicio (iOS 16.4 o más nuevo).

## 4. MCP y acceso de agentes (dos cuentas distintas)

**Comprobado el 04/10/2026:** en claude.ai/code funcionan los **conectores** Supabase y Vercel de la cuenta (pasan por el proxy de MCP de Anthropic). Los servidores de `.mcp.json` no, porque el contenedor no llega a `mcp.supabase.com` ni a `mcp.vercel.com` (403 del proxy). El conector de Supabase ve el proyecto `MICUADERNO` (`lrwfkbuhmgtckjmswrzp`, sa-east-1, activo), sus claves y sus asesores de seguridad. El de Vercel lista el proyecto `micuaderno`, pero para verlo, desplegarlo o cargar variables pide **volver a autorizar el conector con acceso al equipo `trobias-projects`** (claude.ai → Configuración → Conectores → Vercel).

`.mcp.json` (en la raíz) declara los dos servidores MCP para Claude Code. **Son cuentas distintas:** Supabase con la cuenta de Supabase y Vercel con la de Vercel. Cada uno pide su propio inicio de sesión (OAuth) la primera vez (`/mcp` en Claude Code).

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=lrwfkbuhmgtckjmswrzp&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
claude mcp add --scope project --transport http vercel https://mcp.vercel.com
```

**En los entornos en la nube de Claude Code** (claude.ai/code), la red está limitada por la política del entorno. Si `supabase.com` o `vercel.com` dan 403, la dueña tiene que habilitarlos: menú del entorno → **Edit** → **Network access** → **Custom**, sumar en *Allowed domains* `mcp.supabase.com`, `api.supabase.com`, `supabase.com`, `*.supabase.co`, `mcp.vercel.com`, `api.vercel.com`, `vercel.com` y `*.vercel.app`, y dejar marcada la lista de gestores de paquetes. Docs: https://code.claude.com/docs/en/cloud-environments#network-access. Un agente no puede cambiar esto desde adentro.

Si el OAuth del MCP no se puede completar en un contenedor, usá la CLI con tokens guardados como **variables de entorno del entorno** (nunca pegados en un chat ni commiteados):
- `SUPABASE_ACCESS_TOKEN` (supabase.com/dashboard/account/tokens) y `SUPABASE_DB_PASSWORD` → `npx supabase login --token "$SUPABASE_ACCESS_TOKEN"`, `npx supabase link --project-ref lrwfkbuhmgtckjmswrzp -p "$SUPABASE_DB_PASSWORD"`, `npx supabase db push`.
- `VERCEL_TOKEN` (vercel.com/account/tokens) → `npx vercel link --yes --project micuaderno --token "$VERCEL_TOKEN"`, `npx vercel env ls --token "$VERCEL_TOKEN"`.

Cadena de conexión directa (para psql o herramientas): `postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.lrwfkbuhmgtckjmswrzp.supabase.co:5432/postgres`.

### 4.1 Verificación de acceso de esta rama (04/10/2026)

- **Red local:** `mcp.supabase.com/mcp` respondió 401, `api.supabase.com` 404, `lrwfkbuhmgtckjmswrzp.supabase.co` 404, `mcp.vercel.com` 401 y `api.vercel.com` 308. Ningún host devolvió 403. `HTTPS_PROXY` no estaba definido, así que no se pudo consultar `__agentproxy/status`. Los 401 de MCP no prueban un login; requieren OAuth. No se cambió proxy ni TLS.
- **MCP:** la dueña confirmó que habilitó ambos en el **entorno web** de Claude Code, cada uno con su cuenta. No se verificó directamente desde aquí. El `claude mcp list` de esta máquina local mostró Supabase en `Pending approval` y Vercel en `Needs authentication`; ese resultado **no representa** el entorno web. Para verificar allí, pedirle al agente de esa sesión `/mcp` o una llamada de prueba a cada servicio.
- **Vercel CLI:** sesión autenticada como `trobias`; `vercel link --yes --team trobias-projects --project micuaderno` vinculó el proyecto (la CLI ahora recomienda `--scope`). `vercel env ls --scope trobias-projects` confirmó en **Production y Preview**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PIN_PEPPER`, `AUTH_SECRET`, `CRON_SECRET`, `SETUP_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `NEXT_TELEMETRY_DISABLED`. Las dos públicas se fijaron con los valores de §3.2; las cuatro de autenticación se generaron con 32 bytes aleatorios cada una y VAPID con `web-push@3.6.7`. Faltó **`SUPABASE_SECRET_KEY`**, no disponible en el entorno. No se mostraron ni commitearon valores secretos. `.vercel/` y `.env*` se ignoran en Git.
- **Supabase CLI y migración:** en esta máquina local no estaban disponibles `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` ni `SUPABASE_SECRET_KEY`, y la CLI no estaba instalada. La dueña está cargando las variables en **su entorno web**, que es donde deben usarse; las variables de Windows no llegan allí. Por eso aquí **no se ejecutaron** login, link, `supabase migration list` ni `supabase db push`. La migración `supabase/migrations/20261004120000_cuentas_permisos.sql` sí existe en la rama; su aplicación remota está **sin verificar**. En el entorno web: abrir el selector de entorno (ícono de nube sobre el cuadro de mensaje) → engranaje del entorno personal → Environment variables; cargar una línea `.env` por variable sin pegar valores en el chat. Una sesión nueva usa los cambios enseguida; una sesión existente puede esperar a que su VM se reinicie. [Guía oficial de entornos](https://code.claude.com/docs/en/cloud-environments#set-environment-variables). Con las credenciales allí, usar una versión fijada de la CLI, autenticar la cuenta correcta, consultar `migration list`, revisar el diff y recién entonces aplicar `db push`. No incluir contraseñas en logs; si la CLI permite ingreso interactivo, preferirlo a poner la contraseña en argumentos visibles del proceso.
- **Deploy observado:** `vercel ls micuaderno --scope trobias-projects --limit 1` y `vercel inspect` mostraron una Preview **Ready** creada el 04/10/2026 a las 20:29 ART: `https://micuaderno-dsysjgjiu-trobias-projects.vercel.app`. El build incluye salidas de Next.js, pero `inspect` no indicó el SHA de Git; además faltan la clave secreta y la migración remota verificada, así que **Ready no acredita funcionamiento de cuentas ni push**. Repetir `vercel ls` después de configurar Supabase y probar la Preview.
- **Pruebas locales del HEAD con base nueva:** `npm run check` pasó con sintaxis de 36 archivos, 99 unitarias y 45/45 E2E Chromium. `test:cloud`, `typecheck` y `build` no se repitieron en este worktree; el commit `c5c705f` documenta sus resultados propios. Ninguna de esas pruebas sustituye la verificación remota con Supabase.

La CLI de Vercel y el MCP usan autenticaciones separadas. Aunque las variables estén configuradas, un deploy anterior no recibe automáticamente la nueva configuración: hay que desplegar y verificar el entorno objetivo.

## 5. Desarrollo y pruebas

```
npm run dev          # copia el cuaderno a public/ y levanta Next en http://localhost:3000 (sin variables: sin cuentas)
npm run build        # build de producción (lo que corre Vercel)
npm run typecheck    # tipos de Next (typegen) + tsc
npm run test:cloud   # PIN, plan de avisos y RLS contra un Postgres 16 descartable (PGBIN=… si no está en /usr/lib/postgresql/16/bin)
npm run e2e:cloud    # (después de build) next start: CSP del cuaderno, ingreso a 375px, API cerrada sin sesión
npm run check        # el gate del cuaderno: sintaxis + unit + E2E (incluye “nube:” con cuentas simuladas)
```

Para probar con Supabase de verdad en local, creá `.env.local` (no se commitea) con las variables de §3.2 y corré `npm run dev`.

Estructura: `app/` (páginas y `/api`), `lib/` (env, PIN, sesión, personas, avisos, secciones), `proxy.ts`, `next.config.ts`, `vercel.json`, `supabase/migrations/`, `tests/cloud/`, `tools/copy-notebook.mjs`, `js/cloud.js` y `js/core/sections.js`.

## 6. Qué falta (en orden)

1. **Desplegar** (§3): requiere las cuentas de la dueña y su ok. Después, probar ingreso, PIN, pausa, permisos y avisos en un celular real.
2. **B5 sincronización** (después de A7): outbox en IndexedDB, `notebook_parts` partido con `MC.sections.split`, lápidas para borrados, una pestaña sincroniza, importar la copia `.json` que ya tiene cada persona. Vista de solo lectura para quien recibió permiso, sin copia local persistente (D36).
3. Storage privado para fotos y adjuntos (sección `fotos`), con la misma RLS.
4. Pantalla de `audit_events` para quien administra, y cambiar quién administra sin tocar SQL.
5. Etapa C: vistas en React una por una (`MIGRATION_PLAN.md`).
