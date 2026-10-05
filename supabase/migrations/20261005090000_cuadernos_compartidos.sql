-- MI CUADERNO · etapa B5 (sincronización y cuadernos compartidos). Ver DECISIONS.md D38 y docs/NUBE.md.
--  * `profiles.has_notebook`: quien tiene cuaderno propio. Las personas que suma la administradora, por
--    defecto, no: entran a ver (o editar) el cuaderno de quien les dio permiso.
--  * `notebook_parts.updated_by`: quién escribió cada parte, para que el dispositivo de la dueña traiga solo
--    lo que cambiaron otras personas (y no vuelva a aplicar lo propio).

alter table public.profiles add column if not exists has_notebook boolean not null default false;
-- Quien administraba al aplicar esta migración (la primera persona) tiene su cuaderno.
update public.profiles set has_notebook = true where is_admin and not has_notebook;
grant select (has_notebook) on public.profiles to authenticated;

alter table public.notebook_parts add column if not exists updated_by uuid references public.profiles (id) on delete set null;
create index if not exists notebook_parts_owner_updated on public.notebook_parts (owner_id, updated_at);
