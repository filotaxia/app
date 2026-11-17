-- ============================================
--    Supabase — Eliminar terrarios
--    ============================================

-- Hasta acá "nada se borra" (admin_panel.sql, 20261021005228_terrarios.sql):
-- retirar (status = 'retirado') era la única baja, justamente porque borrar
-- deja sin dueño al QR impreso en la base del terrario para siempre.
-- El panel ahora ofrece "Eliminar" como acción aparte, detrás de un paso de
-- seguridad (escribir el código del terrario) — irreversible a propósito.
-- Los archivos que tenía en Storage no se tocan (igual que el resto, nunca
-- se borran); solo desaparece la fila.

grant delete on public.terrarios to authenticated;

create policy "Terrarios: un admin puede eliminar"
  on public.terrarios
  for delete
  using (public.is_admin());
