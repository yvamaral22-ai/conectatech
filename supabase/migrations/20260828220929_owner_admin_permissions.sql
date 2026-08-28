-- Mantem permissoes simples: `admin`, `teacher` e `student`.
-- Nao cria o papel `owner`.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    if to_regtype('public.app_role') is not null then
      alter table public.profiles
      add column role public.app_role not null default 'student';
    else
      alter table public.profiles
      add column role text not null default 'student';
    end if;
  end if;
end;
$$;

alter table public.profiles
add column if not exists is_active boolean not null default true;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.user_roles enable row level security;
grant select on public.user_roles to authenticated;

alter table public.user_roles
drop constraint if exists user_roles_role_check;

update public.user_roles
set role = 'student'
where role = 'member';

alter table public.user_roles
alter column role set default 'student';

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('admin', 'teacher', 'student'));

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
        and role in ('admin', 'teacher')
      limit 1
    ),
    (
      select role::text
      from public.profiles
      where id = (select auth.uid())
        and role::text in ('admin', 'teacher')
        and coalesce(is_active, true)
      limit 1
    ),
    'student'
  );
$$;

grant execute on function public.current_admin_role() to authenticated;
