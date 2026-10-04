-- MI CUADERNO · etapa B (base): personas con PIN, permisos por sección, partes del cuaderno con RLS,
-- avisos push y latido para que el proyecto no se pause. Ver DECISIONS.md D36–D37 y docs/NUBE.md.
--
-- Reglas:
--  * RLS en todas las tablas. El navegador nunca habla con Supabase: lo hace el servidor (Next.js) con la
--    sesión de la persona (publishable key + su JWT) o, para lo administrativo, con la clave secreta.
--  * El PIN nunca se guarda ni se usa como contraseña de Supabase: el servidor guarda Argon2id(PIN + pepper)
--    en `profiles.pin_hash` (columna que ningún rol del navegador puede leer) y entra a Supabase Auth con una
--    contraseña derivada por HMAC que solo conoce el servidor.
--  * Los permisos se dan por sección y nivel ('ver' | 'editar'). Sin fila = sin acceso.
--  * “Solo para mí” (`private`) no lo ve nadie más que quien escribió, aunque tenga permiso.

create extension if not exists pgcrypto;

-- Secciones del cuaderno: la misma lista que js/core/sections.js (un test compara las dos).
create table if not exists public.sections (
  id text primary key,
  label text not null,
  sort int not null
);
insert into public.sections (id, label, sort) values
  ('semana', 'Semana', 1),
  ('actividades', 'Actividades', 2),
  ('emociones', 'Emociones', 3),
  ('escritura', 'Escritura', 4),
  ('hojas', 'Hojas', 5),
  ('repeticiones', 'Repeticiones', 6),
  ('fotos', 'Fotos y adjuntos', 7),
  ('anio', 'Mi año', 8),
  ('ajustes', 'Ajustes', 9)
on conflict (id) do update set label = excluded.label, sort = excluded.sort;

-- Una persona del cuaderno. `id` es el mismo que su usuario de Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  pin_hash text not null,
  is_admin boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  pin_changed_at timestamptz not null default now(),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  constraint profiles_username_ok check (username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  constraint profiles_name_ok check (char_length(display_name) between 1 and 60)
);
create unique index if not exists profiles_username_key on public.profiles (username);

-- Demoras progresivas al equivocarse de PIN (por usuario y por IP). Solo la usa el servidor.
create table if not exists public.login_throttle (
  key text primary key,
  failed_count int not null default 0,
  next_try_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Permisos: `owner_id` comparte la sección `section` de su cuaderno con `grantee_id`.
create table if not exists public.notebook_grants (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  grantee_id uuid not null references public.profiles (id) on delete cascade,
  section text not null references public.sections (id),
  level text not null check (level in ('ver', 'editar')),
  granted_at timestamptz not null default now(),
  primary key (owner_id, grantee_id, section),
  constraint grants_not_self check (owner_id <> grantee_id)
);
create index if not exists notebook_grants_grantee on public.notebook_grants (grantee_id);

-- El cuaderno partido por sección: cada registro de IndexedDB se guarda en tantas partes como secciones
-- toque (js/core/sections.js decide qué campo va a qué sección). `data` es JSON: las formas de A6/A7 pueden
-- cambiar sin migrar esta tabla.
create table if not exists public.notebook_parts (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  store text not null check (store ~ '^[a-z]{2,20}$'),
  record_id text not null check (char_length(record_id) between 1 and 160),
  section text not null references public.sections (id),
  data jsonb not null,
  private boolean not null default false,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (owner_id, store, record_id, section)
);
create index if not exists notebook_parts_owner_section on public.notebook_parts (owner_id, section);

-- Registro de seguridad: quién creó a quién, cambios de permisos, PIN cambiados. Nunca contenido.
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_id uuid references public.profiles (id) on delete set null,
  detail jsonb not null default '{}'::jsonb
);

-- Avisos push (Web Push con VAPID). Una persona puede tener varios dispositivos.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  morning time,
  evening time,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

-- Entrega idempotente: un aviso de cada tipo por persona y por día local.
create table if not exists public.push_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  day date not null,
  primary key (user_id, kind, day)
);

-- Latido: una fila que el cron diario actualiza para que el proyecto gratuito no se pause por inactividad.
create table if not exists public.keepalive (
  id int primary key default 1 check (id = 1),
  beat_at timestamptz not null default now()
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- ---------- funciones de permiso (security definer: leen grants sin abrir la tabla) ----------
create or replace function public.can_read(owner uuid, sec text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() = owner or exists (
    select 1 from public.notebook_grants g
    join public.profiles p on p.id = g.grantee_id and p.disabled_at is null
    where g.owner_id = owner and g.grantee_id = auth.uid() and g.section = sec
  );
$$;

create or replace function public.can_write(owner uuid, sec text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() = owner or exists (
    select 1 from public.notebook_grants g
    join public.profiles p on p.id = g.grantee_id and p.disabled_at is null
    where g.owner_id = owner and g.grantee_id = auth.uid() and g.section = sec and g.level = 'editar'
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin and disabled_at is null);
$$;

revoke all on function public.can_read(uuid, text), public.can_write(uuid, text), public.is_admin() from public;
grant execute on function public.can_read(uuid, text), public.can_write(uuid, text), public.is_admin() to authenticated;

-- ---------- RLS ----------
alter table public.sections enable row level security;
alter table public.profiles enable row level security;
alter table public.login_throttle enable row level security;
alter table public.notebook_grants enable row level security;
alter table public.notebook_parts enable row level security;
alter table public.audit_events enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_log enable row level security;
alter table public.keepalive enable row level security;

-- Nada para `anon`: sin sesión no se lee ni se escribe nada.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on public.sections to authenticated;
drop policy if exists sections_read on public.sections;
create policy sections_read on public.sections for select to authenticated using (true);

-- Perfiles: cada quien ve el suyo; quien administra ve a todas las personas; quien recibió un permiso ve
-- el nombre de quien se lo dio. Las columnas del PIN no se pueden leer desde el navegador.
grant select (id, username, display_name, is_admin, created_at, disabled_at, timezone) on public.profiles to authenticated;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin()
  or exists (select 1 from public.notebook_grants g where g.owner_id = profiles.id and g.grantee_id = auth.uid())
  or exists (select 1 from public.notebook_grants g where g.grantee_id = profiles.id and g.owner_id = auth.uid())
);
-- Altas, bajas y PIN: solo el servidor (clave secreta), después de comprobar que quien pide es admin.

-- Permisos: la dueña o el dueño los administra; quien los recibe los puede ver.
grant select, insert, update, delete on public.notebook_grants to authenticated;
drop policy if exists grants_read on public.notebook_grants;
create policy grants_read on public.notebook_grants for select to authenticated
  using (owner_id = auth.uid() or grantee_id = auth.uid());
drop policy if exists grants_insert on public.notebook_grants;
create policy grants_insert on public.notebook_grants for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists grants_update on public.notebook_grants;
create policy grants_update on public.notebook_grants for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists grants_delete on public.notebook_grants;
create policy grants_delete on public.notebook_grants for delete to authenticated using (owner_id = auth.uid());

-- Partes del cuaderno: leer y escribir según la sección; “Solo para mí” solo para quien lo escribió.
grant select, insert, update, delete on public.notebook_parts to authenticated;
drop policy if exists parts_read on public.notebook_parts;
create policy parts_read on public.notebook_parts for select to authenticated
  using (owner_id = auth.uid() or (not private and public.can_read(owner_id, section)));
drop policy if exists parts_insert on public.notebook_parts;
create policy parts_insert on public.notebook_parts for insert to authenticated
  with check (owner_id = auth.uid() or (not private and public.can_write(owner_id, section)));
drop policy if exists parts_update on public.notebook_parts;
create policy parts_update on public.notebook_parts for update to authenticated
  using (owner_id = auth.uid() or (not private and public.can_write(owner_id, section)))
  with check (owner_id = auth.uid() or (not private and public.can_write(owner_id, section)));
drop policy if exists parts_delete on public.notebook_parts;
create policy parts_delete on public.notebook_parts for delete to authenticated using (owner_id = auth.uid());

-- Avisos: cada quien maneja sus dispositivos.
grant select, insert, update, delete on public.push_subscriptions to authenticated;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Registro de seguridad: solo admin lo lee; lo escribe el servidor.
grant select on public.audit_events to authenticated;
drop policy if exists audit_admin on public.audit_events;
create policy audit_admin on public.audit_events for select to authenticated using (public.is_admin());

-- login_throttle, push_log y keepalive: sin políticas para authenticated (solo el servidor con clave secreta).
