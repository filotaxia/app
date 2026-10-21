-- ============================================
--    Supabase — Candado de id y estado
--    ============================================

-- Además del qr_code, una vez creado un terrario tampoco se puede:
-- - cambiar su id ("03"): cada teléfono guarda su colección, Mi terrario y
--   la bitácora con ese id; cambiarlo los deja apuntando a la nada;
-- - devolverlo a borrador si ya se publicó: los borradores no se leen desde
--   la app, así que su QR impreso diría "No encontramos este terrario".
--   Para sacarlo de circulación está 'retirado', que sigue abriendo su QR.

create or replace function public.terrarios_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.qr_code is distinct from old.qr_code then
    raise exception 'qr_code no se puede cambiar';
  end if;
  if new.id is distinct from old.id then
    raise exception 'el id de un terrario no se puede cambiar';
  end if;
  if old.status <> 'borrador' and new.status = 'borrador' then
    raise exception 'un terrario publicado no vuelve a borrador (usá retirado)';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
