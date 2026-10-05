# MI CUADERNO en la nube: Vercel + Supabase (etapa B, base)

Estado al 05/10/2026: **publicada en `https://micuaderno-five.vercel.app`** (Production se despliega en cada push a `main`). Supabase con esquema y RLS aplicados; Nicole creó su cuenta de administradora. Hay cuentas con usuario y PIN (entrada eligiendo a la persona, D41), permisos por sección con RLS, cuadernos compartidos y sincronización (D38), avisos push y el latido que evita que Supabase pause el proyecto. **Falta** que viajen fotos, dibujos y adjuntos (NB1, lo próximo) y lo demás de la sección NB de `BACKLOG.md`. Las secciones de abajo guardan la historia de la puesta en marcha. Decisiones: D35–D38, D40–D42.

## 1. Cómo está armado

```
navegador ──► Vercel (Next.js 16)
                ├─ /                 → el cuaderno de siempre (public/index.html, copiado por tools/copy-notebook.mjs)
                ├─ /entrar           → elegir persona + PIN, instalar la app, activar avisos (D41)
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

Después: Deploy. La primera persona entra con el **link de invitación** `https://<tu-dominio>/preparar?clave=<SETUP_TOKEN>`: elige nombre, usuario y PIN, y entra directo a su cuaderno como administradora. La clave sale de la barra de direcciones apenas abre la página. Sin `?clave=`, el formulario la pide. `/preparar` deja de funcionar cuando ya hay una persona; desde ahí la clave no sirve más y se puede borrar.

**Antes de `/preparar`:** el `SETUP_TOKEN` que se cargó automáticamente durante la preparación quedó como Secret de Vercel y su valor no se conservó fuera de Vercel. Los Secrets no se pueden leer después de guardarlos. La dueña debe **reemplazarlo** en Vercel → proyecto `micuaderno` → Settings → Environment Variables por un token nuevo que genere y guarde en su gestor de contraseñas, para **Production y Preview** según el entorno donde hará el alta. Luego crear un nuevo deployment de ese entorno; las variables nuevas no llegan a deploys anteriores. No pegar el token en un chat ni en Git. [Vercel: Secret no recuperable](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

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
- **Supabase CLI y migración:** en esta máquina local no estaban disponibles `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` ni `SUPABASE_SECRET_KEY`, y la CLI no estaba instalada. Por eso aquí **no se ejecutaron** login, link, `supabase migration list` ni `supabase db push`. La migración `supabase/migrations/20261004120000_cuentas_permisos.sql` sí existe en la rama; su aplicación remota está **sin verificar**. La dueña confirmó que ambos MCP funcionan en su entorno web: el agente de **esa sesión** puede verificar y aplicar la migración por Supabase MCP sin cargar token ni contraseña de base. La CLI y sus dos variables son un respaldo **solo si el MCP falla** o si se pide específicamente verificar con `supabase migration list`. En ese caso, cargar las variables en el entorno web personal (ícono de nube sobre el mensaje → engranaje → Environment variables), una línea `.env` por variable, sin pegarlas en chat ni en Windows; iniciar una sesión nueva para usarlas enseguida. [Guía oficial de entornos](https://code.claude.com/docs/en/cloud-environments#set-environment-variables). Usar una versión fijada de la CLI, revisar `migration list` y recién entonces aplicar `db push`. No incluir contraseñas en logs; preferir ingreso interactivo a argumentos visibles del proceso.
- **Deploy observado:** `vercel ls micuaderno --scope trobias-projects --limit 1` y `vercel inspect` mostraron una Preview **Ready** creada el 04/10/2026 a las 20:29 ART: `https://micuaderno-dsysjgjiu-trobias-projects.vercel.app`. El build incluye salidas de Next.js, pero `inspect` no indicó el SHA de Git; además faltan la clave secreta y la migración remota verificada, así que **Ready no acredita funcionamiento de cuentas ni push**. Repetir `vercel ls` después de configurar Supabase y probar la Preview.
- **Pruebas locales del HEAD con base nueva:** `npm run check` pasó con sintaxis de 36 archivos, 99 unitarias y 45/45 E2E Chromium. `test:cloud`, `typecheck` y `build` no se repitieron en este worktree; el commit `c5c705f` documenta sus resultados propios. Ninguna de esas pruebas sustituye la verificación remota con Supabase.

La CLI de Vercel y el MCP usan autenticaciones separadas. Aunque las variables estén configuradas, un deploy anterior no recibe automáticamente la nueva configuración: hay que desplegar y verificar el entorno objetivo.

### 4.2 Verificación desde claude.ai/code (05/10/2026)

**Conectores de la cuenta vs. `.mcp.json`.** Los servidores HTTP de `.mcp.json` (`supabase`, `vercel`) **no conectan** desde este contenedor: el proxy de red responde 403 a `mcp.supabase.com`, `mcp.vercel.com`, `api.supabase.com`, `*.supabase.co`, `vercel.com` y `*.vercel.app`. Los **conectores de claude.ai** (Supabase y Vercel) sí funcionan, porque pasan por el proxy de MCP de Anthropic:
- **Supabase:** llamadas reales a `list_projects` (ve `MICUADERNO`, `lrwfkbuhmgtckjmswrzp`, sa-east-1, `ACTIVE_HEALTHY`), `get_publishable_keys` (la publicable coincide con la de §3.2), `list_tables`, `list_migrations`, `execute_sql` y `get_advisors`.
- **Vercel:** `get_auth_user` responde (usuario `trobias`, plan Hobby, equipo por defecto `trobias-projects`) y `list_projects` lista `micuaderno`. Pero `get_project`, `list_deployments` y `filter_project_envs` del equipo dan **403 “Trying to access resource under scope trobias-projects. You must re-authenticate to this scope”**. Por eso, desde acá **no se pudieron verificar las variables ni los deploys**. Para arreglarlo: claude.ai → Configuración → Conectores → Vercel → Desconectar → Conectar, y en la pantalla de autorización de Vercel elegir el alcance **trobias-projects** (no solo la cuenta personal). Después, abrir una sesión nueva.

**Migración remota (aplicada el 05/10/2026 con el conector de Supabase).**
- Antes: `list_migrations` vacío, `list_tables` vacío, sin esquema `private`.
- `apply_migration` se cortó a los 60 s tres veces sin dejar nada (verificado después de cada intento). El mismo SQL corrió en 0,13 s dentro de `begin … rollback` con `execute_sql`, así que el corte es de la herramienta, no del SQL.
- Se aplicó con `execute_sql`, por partes e idempotente: (1) `sections`, `profiles`, `login_throttle`, `notebook_grants` y `notebook_parts` con RLS y sin permisos para el navegador; (2) `audit_events`, `push_subscriptions`, `push_log` y `keepalive`; (3) esquema `private` con `can_read`, `can_write` e `is_admin`; (4) las 12 políticas y sus permisos, de a pocas sentencias por llamada (los lotes largos también se cortaban, y no quedó nada a medias).
- Comprobado con SQL: 9 tablas con RLS; políticas `sections` 1, `profiles` 1, `notebook_grants` 4, `notebook_parts` 4, `push_subscriptions` 1, `audit_events` 1; `anon` con 0 permisos en tablas y sin uso de `private`; `authenticated` no puede leer `profiles.pin_hash`; 9 secciones; fila de `keepalive`. En remoto también se hizo `revoke … from anon` sobre las funciones `private.*`; ese renglón quedó sumado a la migración del repo.
- **Historial:** como se usó `execute_sql`, `supabase_migrations.schema_migrations` no existe y `list_migrations` sigue vacío. **No hay un equivalente de `supabase migration list` que lo registre**, y no se corrió la CLI. Si más adelante se usa la CLI, registrarla sin volver a correrla: `npx supabase migration repair --status applied 20261004120000`. Correrla de nuevo igual sería inofensivo, porque es idempotente.
- **Asesor de seguridad después:** nuestras funciones ya no aparecen. Quedan (a) INFO “RLS sin políticas” en `keepalive`, `login_throttle` y `push_log`, que es intencional porque solo las usa el servidor con la clave secreta; y (b) WARN por `public.rls_auto_enable()`, una función que **no es de este repo** (venía en el proyecto) y que `anon` y `authenticated` pueden llamar por RPC. Pendiente de la dueña: decidir si se le revoca `EXECUTE` a `anon` y `authenticated`.

**Preview:** la última observada por otra sesión es `https://micuaderno-b4rbk7x3p-trobias-projects.vercel.app` (Ready). Desde este contenedor no se puede abrir (`*.vercel.app` da 403) y con el conector de Vercel sin alcance de equipo tampoco se puede inspeccionar. **No está verificado que entrar, los permisos ni los avisos funcionen ahí.**

### 4.3 Lo que falta hacer a mano (en Vercel, sin pegar nada en un chat)

1. **`SUPABASE_SECRET_KEY`.** En Supabase: Project Settings → API Keys → *Secret keys* → copiar una `sb_secret_…` (o crear una nueva llamada `vercel`). En Vercel: proyecto `micuaderno` → Settings → Environment Variables → Add → Key `SUPABASE_SECRET_KEY`, pegar el valor, marcar **Sensitive** y elegir **Production** y **Preview** → Save. Por CLI, lee el valor por entrada estándar y no lo deja en el historial: `vercel env add SUPABASE_SECRET_KEY production --sensitive` y lo mismo con `preview`.
2. **`SETUP_TOKEN` propio.** Generalo en tu computadora (`openssl rand -base64 24`, o el generador de tu gestor de contraseñas con 32 caracteres) y guardalo en el gestor. En Vercel → Environment Variables → `SETUP_TOKEN` → ⋯ → Edit (o borralo y crealo de nuevo) → pegá el nuevo, Sensitive, Production y Preview. Por CLI: `vercel env rm SETUP_TOKEN production` y `vercel env add SETUP_TOKEN production --sensitive` (lo mismo para `preview`). **No toques `PIN_PEPPER` ni `AUTH_SECRET`.**
3. **Deploy nuevo:** las variables solo valen en deploys posteriores. Vercel → Deployments → el último Preview → ⋯ → **Redeploy**, o empujar un commit a la rama.
4. **Probar el Preview** (sin crear a nadie): `/entrar` se ve; con un usuario inventado, “Ese usuario y PIN no coinciden”; `/preparar` muestra el formulario (hay 0 personas). Recién con tu ok y tus datos: crear a Nicole en `/preparar` con tu `SETUP_TOKEN`, entrar, cambiar el PIN, activar avisos y probar “Probar”.

### 4.4 Vercel con acceso completo (05/10/2026)

Después de que la dueña volvió a autorizar el conector de Vercel para `trobias-projects`:
- **Variables (`filter_project_envs`, sin descifrar):** en **Production y Preview** están `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PIN_PEPPER`, `AUTH_SECRET`, `CRON_SECRET`, `SETUP_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `NEXT_TELEMETRY_DISABLED`. **Falta `SUPABASE_SECRET_KEY`.**
- **`SETUP_TOKEN`:** reemplazado el 05/10 por uno nuevo (Sensitive, Production + Preview, con autorización explícita de la dueña). El valor se le entregó a ella como archivo y no está en el repo. `PIN_PEPPER` y `AUTH_SECRET` no se tocaron.
- **Por qué `SUPABASE_SECRET_KEY` no se pudo cargar sola:** el conector de Supabase solo entrega claves publicables. La integración Supabase instalada en `trobias-projects` (`icfg_iflx…`) no es la dueña del proyecto MICUADERNO: el proyecto está en la organización de Supabase de la otra cuenta de Vercel (`vercel_icfg_uQi3…`, “tarnowskitobiasian-5537's projects”). Por eso no se puede conectar al proyecto de Vercel para que inyecte la clave. Hay que copiarla una vez desde el panel de Supabase al de Vercel (§4.3, paso 1).
- **Deploys:** cada push a la rama genera un Preview. El último es `micuaderno-csovkcvjw-trobias-projects.vercel.app` (commit `77ca844`, READY). Visto con `web_fetch_vercel_url`: responde 200 con CSP, HSTS, `nosniff`, `no-referrer` y `noindex`, y `/preparar` muestra “Todavía falta conectar la base de datos”, que es lo esperado sin `SUPABASE_SECRET_KEY`. Con la clave cargada, hace falta **un deploy nuevo** para que la tome.

### 4.5 Publicado (05/10/2026)

- `main` avanzó hasta `30d9732` (fast-forward desde la rama de trabajo, con el ok explícito de la dueña). Production `micuaderno-c95u1nuei…`, READY; dominio público **https://micuaderno-five.vercel.app**.
- **Protección de deploys:** el proyecto tenía Vercel Authentication en “todo menos dominios propios”, así que hasta `micuaderno-five.vercel.app` pedía iniciar sesión en Vercel. Se pasó a **estándar** (`prod_deployment_urls_and_all_previews`): el dominio de producción queda abierto para Nicole y los Preview y las URL internas de cada deploy siguen protegidos.
- **Verificado sin escribir nada:** `/entrar` responde 200 en el dominio público. `/preparar` muestra el formulario, lo que prueba que `SUPABASE_SECRET_KEY` funciona (consultó la base y hay 0 personas). La primera persona se crea con el link de invitación (§3.2).
- **Sin verificar todavía:** el alta real (crear la cuenta en Supabase Auth), entrar, los permisos y los avisos. Es la primera prueba contra Supabase de verdad. Si falla, mirar los logs de Vercel (`/api/setup`) y la configuración de Auth (correo interno `*.invalid`, proveedor Email habilitado).

## 4.6 Cuadernos compartidos y sincronización (05/10/2026 · D38)

- **Quién tiene cuaderno:** `profiles.has_notebook`. La primera administradora sí. Al sumar a alguien en Mi cuenta → Personas, se elige “Mira mi cuaderno, con los permisos que le dé abajo” (por defecto) o “Tiene su propio cuaderno”.
- **Cómo se comparte:** Mi cuenta → “Quién puede ver mi cuaderno”: por sección, nada / ver / editar. “Ver” deja mirar; “editar” también deja escribir, cambiar y borrar en esa sección.
- **La invitada (por ejemplo, la psicóloga):** entra con su usuario y PIN y se le abre el cuaderno de Nicole, en memoria y sin copia local, con un aviso arriba (“Cuaderno de Nicole · podés editar: …”). Si nadie le compartió nada, Mi cuenta se lo dice. Si le compartieron varios cuadernos, elige cuál abrir en Mi cuenta → “Cuadernos que podés abrir”.
- **Sincronización (`js/sync.js`):** el dispositivo de la dueña sube cada cambio (cola en el store `outbox` de IndexedDB, escrita en la misma transacción que el cambio, NB2/D44; el contenido se lee de IndexedDB al subir; una sola pestaña sincroniza a la vez con Web Locks), y la primera vez sube todo el cuaderno. Trae cada 45 s, al volver a la pestaña y al recuperar la red. `POST /api/sync/push` y `GET /api/sync/pull` (paginado por `updated_at`) usan la sesión de la persona, así que la RLS es la segunda llave.
- **No viaja:** lo de `meta` que no son ajustes (es del dispositivo).
- **Migración remota:** `20261005090000_cuadernos_compartidos.sql` aplicada con el conector de Supabase (`execute_sql`). Verificado: 1 persona, administradora y con cuaderno; columna `updated_by` presente.

## 4.7 Fotos, dibujos y adjuntos en la nube (06/10/2026 · NB1, D43)

- **Cómo viajan (`js/core/media.js`, única fuente para el cuaderno y el servidor):** la ficha de cada imagen o adjunto (`images`, `files`) va por la sincronización de siempre, en la sección `fotos`, **sin** el contenido y con `media = { v, chunks, length }`. El contenido (el data URL) va aparte en pedazos de hasta 3 MB por `PUT /api/media` y vuelve por `GET /api/media?owner&store&id&n`. Pedazos porque Vercel no deja pasar más de ~4,5 MB por pedido; un adjunto de 10 MB son 5 pedazos.
- **Dónde:** bucket privado `cuaderno` de Supabase Storage (`20261006090000_fotos_storage.sql`), objetos `<dueña>/<store>/<id>/<n>`, sin políticas para el navegador. Solo el servidor (clave secreta) lee y escribe, **después** de revisar el permiso de la sección `fotos` (la dueña, o quien recibió ver/editar). El navegador nunca habla con Supabase y la CSP sigue en `connect-src 'self'`.
- **Sin repetir:** `v` es la versión del contenido (`updatedAt` + largo). Cada dispositivo anota qué versión ya subió (`sync.media.<dueña>`) y, al recibir una ficha, conserva su contenido local si es la misma versión.
- **Sin fotos rotas:** si una ficha llega y su contenido todavía no se puede bajar, no se guarda nada: queda en `sync.mediaWait.<dueña>` y se reintenta en cada traída (`GET /api/sync/pull?store&id`).
- **Borrar:** mandar a la papelera viaja como cualquier cambio; borrar del todo borra también los pedazos de Storage.
- **Aplicado el 06/10** con el conector: bucket `cuaderno` privado, límite 3,2 MB por objeto, solo `text/plain`; migración registrada en `supabase_migrations.schema_migrations`.

## 4.8 Historial de migraciones (NB3)

`supabase_migrations.schema_migrations` tiene registradas `20261004120000_cuentas_permisos`, `20261005090000_cuadernos_compartidos` y `20261006090000_fotos_storage` (verificado el 06/10 con el conector). La CLI (`supabase db push`) ya no las vuelve a aplicar. Una migración nueva: el archivo en `supabase/migrations/`, probarla con `npm run test:cloud` y aplicarla (conector o CLI), registrándola en esa tabla.

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

Estructura: `app/` (páginas y `/api`), `lib/` (env, PIN, sesión, personas, avisos, secciones), `proxy.ts`, `next.config.ts`, `vercel.json`, `supabase/migrations/`, `tests/cloud/`, `tools/copy-notebook.mjs`, `js/cloud.js`, `js/core/sections.js` y `js/core/media.js` (con `lib/media.ts` y `app/api/media`).

## 6. Qué falta (en orden)

Lo hecho: despliegue (§4.5), sincronización y cuadernos compartidos (§4.6), entrada eligiendo a la persona (D41), fotos en la nube (§4.7) e historial de migraciones (§4.8). Lo que queda está en `BACKLOG.md`, sección NB:
1. ~~NB2~~ hecho (D44).
2. **NB4** qué hace “abrir una copia” con la nube prendida (espera a la dueña).
3. **NB5** avisos más de una vez por día.
4. Pantalla de `audit_events` para quien administra, y cambiar quién administra sin tocar SQL.
La etapa C (React) está descartada (D42).

## Probar `/entrar` con una Supabase simulada (sin tocar la base real)

La lista de personas se arma en el servidor con `profiles`. Para verla en local sin la base de verdad: un servidor HTTP que responda `GET /rest/v1/profiles…` con un JSON como `[{ "username": "nicole", "display_name": "Nicole", "is_admin": true, "disabled_at": null }]` y 401 a todo lo demás; `npm run build` y `next start` con `NEXT_PUBLIC_SUPABASE_URL` apuntando a ese servidor (y claves inventadas: las `NEXT_PUBLIC_*` se fijan al armar). Después, `npm run build` otra vez sin esas variables para dejar `public/` como estaba.

