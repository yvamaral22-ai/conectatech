-- Corrige cadastro quando o projeto misturou o schema inicial com as
-- migracoes incrementais. O trigger antigo criava profiles sem username,
-- mas a tabela atual exige esse campo.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_new_user_profile();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_username text;
begin
  profile_name := left(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Pessoa ConectaTech'
    ),
    80
  );

  if char_length(profile_name) < 2 then
    profile_name := 'Pessoa ConectaTech';
  end if;

  profile_username := 'user_' || substring(replace(new.id::text, '-', '') from 1 for 12);

  insert into public.profiles (id, username, full_name, display_name)
  values (new.id, profile_username, profile_name, profile_name)
  on conflict (id) do update
  set
    username = coalesce(nullif(public.profiles.username, ''), excluded.username),
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name);

  if to_regclass('public.accessibility_preferences') is not null then
    execute
      'insert into public.accessibility_preferences (user_id) values ($1) on conflict (user_id) do nothing'
    using new.id;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, username, full_name, display_name)
select
  id,
  'user_' || substring(replace(id::text, '-', '') from 1 for 12),
  left(coalesce(nullif(raw_user_meta_data ->> 'name', ''), nullif(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1), 'Pessoa ConectaTech'), 80),
  left(coalesce(nullif(raw_user_meta_data ->> 'name', ''), nullif(raw_user_meta_data ->> 'display_name', ''), split_part(email, '@', 1), 'Pessoa ConectaTech'), 80)
from auth.users
on conflict (id) do nothing;
