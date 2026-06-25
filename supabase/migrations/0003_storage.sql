-- ============================================================================
-- CrisisHub — Almacenamiento de fotos (Supabase Storage)
-- Bucket público "fotos": lectura abierta (CDN), subida abierta (la app
-- comprime/valida antes), y borrado/edición solo para staff.
-- Organización sugerida de rutas:
--   fotos/desaparecidos/<id>.jpg · fotos/tips/<id>.jpg · fotos/marcadores/<id>.jpg
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos', 'fotos', true,
  5242880,  -- 5 MB máximo por archivo
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de objetos del bucket "fotos".
drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

-- Subida abierta al bucket "fotos" (anti-abuso en la capa de aplicación).
drop policy if exists "fotos subida publica" on storage.objects;
create policy "fotos subida publica" on storage.objects
  for insert with check (bucket_id = 'fotos');

-- Actualizar/borrar solo staff.
drop policy if exists "fotos update staff" on storage.objects;
create policy "fotos update staff" on storage.objects
  for update using (bucket_id = 'fotos' and public.is_staff())
  with check (bucket_id = 'fotos' and public.is_staff());

drop policy if exists "fotos delete staff" on storage.objects;
create policy "fotos delete staff" on storage.objects
  for delete using (bucket_id = 'fotos' and public.is_staff());
