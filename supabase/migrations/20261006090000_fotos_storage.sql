-- NB1 (D43): fotos, dibujos y adjuntos en Storage privado. Un solo bucket, privado y sin políticas para
-- anon/authenticated: solo el servidor (clave secreta) lee y escribe, después de revisar el permiso de la
-- sección `fotos` (lib/media.ts). Cada objeto es un pedazo de texto del data URL: `<dueña>/<store>/<id>/<n>`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cuaderno', 'cuaderno', false, 3200000, array['text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
