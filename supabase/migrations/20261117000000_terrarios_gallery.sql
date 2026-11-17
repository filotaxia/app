-- ============================================
--    Supabase — Galería de Características
--    ============================================

-- Fotos propias del terrario para la sección "Características" de su ficha
-- (src/views/terrario/terrario-secciones.js): si tiene alguna cargada,
-- reemplazan a las tres tarjetas genéricas (Recipiente, QR, Composición).
-- Mismas rutas de Storage que `photo` (ver utils/catalog.js, storagePath);
-- igual que el resto de los archivos, no se borran: sacar una foto de acá
-- solo la quita de la lista, el archivo sigue en Storage.

alter table public.terrarios
  add column gallery text[] not null default '{}';
