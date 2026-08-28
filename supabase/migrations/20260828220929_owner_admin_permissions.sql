-- Mantem uma unica permissao administrativa: `admin`.
-- Nao cria o papel `owner`.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
grant select on public.user_roles to authenticated;

alter table public.user_roles
drop constraint if exists user_roles_role_check;

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('admin', 'member'));

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  )
  or exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and coalesce(is_active, true)
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.current_admin_role()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (
      select role
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
      limit 1
    ),
    (
      select role::text
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
        and coalesce(is_active, true)
      limit 1
    ),
    'member'
  );
$$;

grant execute on function public.current_admin_role() to authenticated;
