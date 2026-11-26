-- ============================================
--    Supabase — Foto de modelo
--    ============================================

-- Una foto alternativa (el render/wireframe del modelo 3D) para la portada
-- de la ficha (src/views/terrario/terrario.js): si está cargada, reemplaza
-- a `photo` solo ahí — Mi terrario, Colección y el reproductor siguen
-- mostrando la foto real (ver rowToTerrario en utils/catalog.js).
-- Misma convención que `photo`: ruta local (src/assets/…), link completo o
-- ruta dentro del Storage de Supabase.

alter table public.terrarios
  add column model_photo text;
