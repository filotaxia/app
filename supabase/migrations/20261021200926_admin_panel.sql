-- ============================================
--    Supabase — Panel de carga
--    ============================================

-- Lo que le faltaba a la base para que el panel (/admin/) funcione:

-- 1. Un admin ve TODOS los terrarios, también los borradores (el público
--    sigue viendo solo publicados y retirados). Sin esto el panel no podría
--    listar ni editar un borrador.
create policy "Terrarios: un admin ve todos"
  on public.terrarios
  for select
  to authenticated
  using (public.is_admin());


-- 2. Archivos (bucket "terrarios": una carpeta por terrario, "07/foto-….jpg").
--    El bucket es público para leer (la app muestra fotos y lee los MIDI con
--    su link). Subir: solo un admin. Pisar o borrar: nadie; cada archivo
--    nuevo lleva la hora en el nombre, así nunca se reemplaza uno viejo.
--    Tope de 50 MB por archivo (el máximo del plan gratis) y solo fotos,
--    videos MP4/WebM y MIDI.
--    (El bucket se creó desde el dashboard; para rehacerlo desde cero:
--    insert into storage.buckets (id, name, public) values ('terrarios', 'terrarios', true);)
update storage.buckets
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/midi']
where id = 'terrarios';

create policy "Terrarios (archivos): un admin puede subir"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'terrarios' and public.is_admin());


-- 3. La tabla admins no se toca desde la API: se edita en el SQL Editor.
--    (RLS ya lo impedía; esto lo deja dicho también en los permisos.)
revoke insert, update, delete, truncate on public.admins from anon, authenticated;
