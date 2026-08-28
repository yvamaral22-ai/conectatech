create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 2 and 80),
  bio text not null default '' check (char_length(bio) <= 280),
  city text not null default '' check (char_length(city) <= 80),
  avatar_path text, is_public boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Compatibilidade com versões anteriores da tabela de perfis.
-- As colunas são acrescentadas sem apagar ou substituir dados existentes.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists city text not null default '';
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists is_public boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles
set username = 'user_' || substring(replace(id::text, '-', '') from 1 for 12)
where username is null or btrim(username) = '';

update public.profiles
set display_name = 'Pessoa ConectaTech'
where display_name is null or btrim(display_name) = '';

alter table public.profiles alter column username set not null;
alter table public.profiles alter column display_name set not null;
create unique index if not exists profiles_username_unique on public.profiles (username);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;
drop policy if exists "profiles_read_visible" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_read_visible" on public.profiles for select to anon, authenticated using (is_public or (select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create or replace function public.handle_new_user_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substring(replace(new.id::text, '-', '') from 1 for 12), coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Pessoa ConectaTech'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.handle_new_user_profile();
insert into public.profiles (id, username, display_name)
select id, 'user_' || substring(replace(id::text, '-', '') from 1 for 12), coalesce(nullif(raw_user_meta_data ->> 'name', ''), 'Pessoa ConectaTech') from auth.users
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=2097152, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "avatars_read_visible" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_read_visible" on storage.objects for select to anon, authenticated using (bucket_id='avatars' and ((select auth.uid())::text=(storage.foldername(name))[1] or exists (select 1 from public.profiles p where p.id::text=(storage.foldername(name))[1] and p.is_public)));
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatars_update_own" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
