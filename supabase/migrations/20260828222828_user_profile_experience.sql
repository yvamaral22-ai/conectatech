-- Expande a area do usuario com capa de perfil, conteudos salvos e historico.

alter table public.profiles
add column if not exists cover_path text;

create table if not exists public.saved_lessons (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists saved_lessons_user_created_idx
on public.saved_lessons (user_id, created_at desc);

alter table public.saved_lessons enable row level security;

revoke all on public.saved_lessons from anon;
revoke all on public.saved_lessons from authenticated;
grant select, insert, delete on public.saved_lessons to authenticated;

drop policy if exists "saved_lessons_select_own" on public.saved_lessons;
drop policy if exists "saved_lessons_insert_own" on public.saved_lessons;
drop policy if exists "saved_lessons_delete_own" on public.saved_lessons;

create policy "saved_lessons_select_own"
on public.saved_lessons
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "saved_lessons_insert_own"
on public.saved_lessons
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "saved_lessons_delete_own"
on public.saved_lessons
for delete
to authenticated
using ((select auth.uid()) = user_id);
