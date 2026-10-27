-- ============================================
--    Supabase — Backups
--    ============================================

-- Una copia de los datos por semana, guardada en la misma base.
--
-- El plan gratis no deja descargar los backups de Supabase, así que la base
-- se hace los suyos: cada lunes a las 06:00 (03:00 en Argentina) guarda en
-- `backups` todas las filas de `terrarios` (también los borradores) y la
-- lista de `admins`. Desde el panel (/admin/#/backups) se ven, se descargan
-- en JSON y se puede hacer uno en el momento.
--
-- Sirve para recuperar lo que había antes de una edición equivocada. Los
-- archivos (fotos, videos, MIDI) no se copian: cada fila guarda su ruta, y
-- en Storage nunca se pisan ni se borran. Como todo en este proyecto, un
-- backup no se borra nunca (cada uno pesa unos pocos KB).
--
-- Ojo: esto NO evita que Supabase pause el proyecto. Lo que cuenta es la
-- actividad que llega desde afuera (.github/workflows/catalogo.yml consulta
-- dos veces por día), y con el proyecto pausado esta tarea tampoco corre.


create table public.backups (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('semanal', 'manual')),
  row_count   integer not null,   -- cuántos terrarios tiene (para la lista del panel)
  data        jsonb not null      -- { terrarios: [...filas], admins: [...emails] }
);

alter table public.backups enable row level security;

-- Solo un admin los ve. Escribir, nadie desde la API: los crea la función de abajo.
create policy "Backups: solo un admin puede verlos"
  on public.backups
  for select
  to authenticated
  using (public.is_admin());

revoke insert, update, delete, truncate on public.backups from anon, authenticated;


-- Hace un backup y devuelve sus datos (sin `data`, que es lo pesado).
-- La llama la tarea semanal; desde la API no se puede llamar.
create or replace function public.take_backup(backup_kind text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  insert into public.backups (kind, row_count, data)
  select
    backup_kind,
    (select count(*) from public.terrarios),
    jsonb_build_object(
      'terrarios', coalesce((select jsonb_agg(to_jsonb(t) order by t.id) from public.terrarios t), '[]'::jsonb),
      'admins',    coalesce((select jsonb_agg(a.email order by a.email) from public.admins a), '[]'::jsonb)
    )
  returning jsonb_build_object('id', id, 'created_at', created_at, 'kind', kind, 'row_count', row_count);
$$;

revoke execute on function public.take_backup(text) from public, anon, authenticated;


-- El botón "Hacer backup ahora" del panel: solo para un admin.
create or replace function public.make_backup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'solo un admin puede hacer un backup' using errcode = '42501';
  end if;
  return public.take_backup('manual');
end;
$$;

revoke execute on function public.make_backup() from public, anon;
grant execute on function public.make_backup() to authenticated;


-- La tarea semanal (Supabase Cron = la extensión pg_cron). Se ve en el
-- dashboard: Integrations → Cron. Volver a correr esto la reemplaza, no la duplica.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'backup-semanal',
  '0 6 * * 1',   -- lunes 06:00 UTC
  $$ select public.take_backup('semanal') $$
);


-- Para recuperar un terrario como estaba en un backup (SQL Editor; cambiar
-- el número de backup y el id). El qr_code y el id no cambian, así que el
-- candado de la tabla lo deja pasar; un publicado no vuelve a borrador.
--
--   update public.terrarios t
--   set (model, status, recorded, duration, story, photo, video, midi_plantas,
--        midi_sustrato, specs, plants, waves, care)
--     = (copia.model, copia.status, copia.recorded, copia.duration, copia.story, copia.photo, copia.video,
--        copia.midi_plantas, copia.midi_sustrato, copia.specs, copia.plants, copia.waves, copia.care)
--   from public.backups b,
--        jsonb_populate_record(null::public.terrarios,
--          (select r from jsonb_array_elements(b.data -> 'terrarios') r where r ->> 'id' = '07')) copia
--   where b.id = 12 and t.id = copia.id;
