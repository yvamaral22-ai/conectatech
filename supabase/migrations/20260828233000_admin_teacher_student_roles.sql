-- Modelo de permissoes da ConectaTech.
-- admin: controla toda a plataforma.
-- teacher: cria, edita e publica conteudos dentro do escopo educacional.
-- student: papel padrao de qualquer usuario cadastrado.

do $$
begin
  if to_regtype('public.app_role') is not null then
    alter type public.app_role add value if not exists 'teacher';
  end if;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

alter table public.user_roles
drop constraint if exists user_roles_role_check;

update public.user_roles
set role = 'student'
where role in ('member', 'aluno');

alter table public.user_roles
alter column role set default 'student';

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('admin', 'teacher', 'student'));

insert into public.user_roles (user_id, role)
select
  u.id,
  case
    when p.role::text in ('admin', 'teacher', 'student') then p.role::text
    else 'student'
  end
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (user_id) do nothing;

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;

create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();

revoke all on function public.handle_new_user_role() from public;

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon;
revoke all on public.user_roles from authenticated;
grant select on public.user_roles to authenticated;

create or replace function public.current_app_role()
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
        and role in ('admin', 'teacher', 'student')
      limit 1
    ),
    (
      select role::text
      from public.profiles
      where id = (select auth.uid())
        and coalesce(is_active, true)
      limit 1
    ),
    'student'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'teacher', false);
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin', 'teacher'), false);
$$;

create or replace function public.can_manage_users()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.current_admin_role()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select public.current_app_role();
$$;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.can_manage_content() to authenticated;
grant execute on function public.can_manage_users() to authenticated;
grant execute on function public.current_admin_role() to authenticated;

drop policy if exists "roles_read_own" on public.user_roles;
drop policy if exists "roles_admin_read_all" on public.user_roles;
drop policy if exists "roles_admin_manage_all" on public.user_roles;

create policy "roles_read_own"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "roles_admin_read_all"
on public.user_roles
for select
to authenticated
using ((select public.is_admin()));

create policy "roles_admin_manage_all"
on public.user_roles
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "admin_manage_tracks" on public.tracks;
drop policy if exists "admin_manage_lessons" on public.lessons;
drop policy if exists "admin_manage_opportunities" on public.opportunities;
drop policy if exists "tracks_manage_content" on public.tracks;
drop policy if exists "lessons_manage_content" on public.lessons;
drop policy if exists "opportunities_manage_content" on public.opportunities;

create policy "tracks_manage_content"
on public.tracks
for all
to authenticated
using ((select public.can_manage_content()))
with check ((select public.can_manage_content()));

create policy "lessons_manage_content"
on public.lessons
for all
to authenticated
using ((select public.can_manage_content()))
with check ((select public.can_manage_content()));

create policy "opportunities_manage_content"
on public.opportunities
for all
to authenticated
using ((select public.can_manage_content()))
with check ((select public.can_manage_content()));

drop policy if exists "profiles_admin_read_all" on public.profiles;
drop policy if exists "profiles_admin_update_all" on public.profiles;

create policy "profiles_admin_read_all"
on public.profiles
for select
to authenticated
using ((select public.is_admin()));

create policy "profiles_admin_update_all"
on public.profiles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  username text,
  role text,
  is_active boolean,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    p.display_name,
    p.username,
    coalesce(r.role, p.role::text, 'student') as role,
    coalesce(p.is_active, true) as is_active,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.user_roles r on r.user_id = u.id
  where (select public.is_admin())
  order by u.created_at desc;
$$;

create or replace function public.admin_set_user_role(
  target_user_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem alterar permissoes.';
  end if;

  if target_role not in ('admin', 'teacher', 'student') then
    raise exception 'Permissao invalida.';
  end if;

  if target_user_id = (select auth.uid()) and target_role <> 'admin' then
    raise exception 'Voce nao pode remover sua propria permissao de administrador.';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id) do update
  set role = excluded.role;

  if to_regtype('public.app_role') is not null then
    if target_role in ('admin', 'teacher', 'student') then
      execute 'update public.profiles set role = $1::public.app_role where id = $2'
      using target_role, target_user_id;
    end if;
  else
    update public.profiles
    set role = target_role
    where id = target_user_id;
  end if;
end;
$$;

create or replace function public.admin_set_user_active(
  target_user_id uuid,
  active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem alterar usuarios.';
  end if;

  update public.profiles
  set is_active = active
  where id = target_user_id;
end;
$$;

create or replace function public.admin_delete_user(
  target_user_id uuid,
  confirmation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem remover usuarios.';
  end if;

  if confirmation <> 'EXCLUIR' then
    raise exception 'Confirmacao invalida.';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'Um administrador nao pode remover a propria conta por este painel.';
  end if;

  delete from auth.users
  where id = target_user_id;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_set_user_role(uuid, text) from public;
revoke all on function public.admin_set_user_active(uuid, boolean) from public;
revoke all on function public.admin_delete_user(uuid, text) from public;

grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_user(uuid, text) to authenticated;
