-- ============================================
--    Supabase — Admins
--    ============================================

-- Quién puede cargar y editar terrarios desde el panel (/admin/).
--
-- El público de la app no tiene cuentas. El panel sí: se entra con email y
-- contraseña (Supabase Auth), y solo los emails de esta tabla pueden escribir.
-- Una cuenta que no está acá puede entrar, pero no puede cambiar nada.
--
-- Esta migración se aplicó a mano desde el SQL Editor antes de existir este
-- archivo; acá queda escrita tal cual está en la base, para poder rehacerla
-- desde cero. Lo que le faltaba al panel está en la siguiente (admin_panel).


create table public.admins (
  email text primary key
);

alter table public.admins enable row level security;


-- ¿El que hace el pedido es admin? Lee el email del token (JWT) del que
-- entró al panel y lo busca en la tabla. Sin login, da false.
-- security definer: corre con los permisos del dueño, así puede leer
-- `admins` aunque el que pregunta no pueda.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where email = auth.jwt() ->> 'email'
  );
$$;


-- Un admin puede crear y editar terrarios. Borrar, nadie (no hay política).
create policy "Terrarios: un admin puede crear"
  on public.terrarios
  for insert
  with check (public.is_admin());

create policy "Terrarios: un admin puede editar"
  on public.terrarios
  for update
  using (public.is_admin())
  with check (public.is_admin());


-- La lista de admins solo la ve un admin
create policy "Admins: solo un admin puede verse"
  on public.admins
  for select
  using (public.is_admin());
