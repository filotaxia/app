-- ============================================
--    Supabase — Terrarios
--    ============================================

-- El catálogo de terrarios. Una fila por terrario.
--
-- La regla más importante: el QR impreso en la base de cada terrario lleva
-- https://app.filotaxia.com/t/<qr_code>, así que `qr_code` se genera una vez
-- (lo pone la base al crear la fila) y NUNCA cambia: un trigger lo impide.
-- Un terrario tampoco se borra: se retira (status = 'retirado') y su QR
-- sigue abriendo su ficha.


-- Código del QR: 6 caracteres de un alfabeto sin los que se confunden
-- (sin 0 o 1 l i). 31^6 ≈ 887 millones de combinaciones: difícil de adivinar.
-- Los bytes al azar vienen de pgcrypto (no de random()). El módulo 31 tiene
-- un sesgo mínimo hacia las primeras letras; no importa para esto.
create or replace function public.gen_qr_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 31) + 1, 1);
  end loop;
  return code;
end;
$$;


create table public.terrarios (
  id            text primary key check (id ~ '^\d{2,3}$'),     -- "01", "07": rutas, colección, bitácora
  qr_code       text not null unique default public.gen_qr_code()
                  check (qr_code ~ '^[a-hjkmnp-z2-9]{6}$'),     -- el del QR impreso: no cambia nunca
  model         text not null,                                  -- el código visible: "TR07"
  status        text not null default 'borrador'
                  check (status in ('borrador', 'publicado', 'retirado')),
  recorded      date,                                           -- el día en que empezó a sonar
  duration      integer,                                        -- largo de la pieza, en segundos
  story         text,
  photo         text,       -- ruta local (src/assets/…) o ruta en Storage
  video         text,
  midi_plantas  text,       -- Biodata 02 (suculentas)
  midi_sustrato text,       -- Biodata 01 (sustrato, gravas, piedra pómez y ambient)
  specs         jsonb,      -- { ecosistema, recipiente, medidas }
  plants        text[],     -- nombres de content/plantas.js
  waves         text[],     -- "triangle", "sine"…
  care          jsonb not null,  -- { riego_days, ventilacion_days, humidity, temp, light, light_hours }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- Candado del QR + fecha de la última edición
create or replace function public.terrarios_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.qr_code is distinct from old.qr_code then
    raise exception 'qr_code no se puede cambiar';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger terrarios_before_update
  before update on public.terrarios
  for each row execute function public.terrarios_before_update();


-- Permisos. Cualquiera (la app, sin login) lee los publicados y los retirados;
-- los borradores solo se ven en el panel (Plan 2 agrega los permisos del admin).
-- Nadie puede borrar.
alter table public.terrarios enable row level security;

create policy "Terrarios: lectura pública de publicados y retirados"
  on public.terrarios
  for select
  to anon, authenticated
  using (status in ('publicado', 'retirado'));

revoke insert, update, delete, truncate on public.terrarios from anon;
revoke delete, truncate on public.terrarios from authenticated;
