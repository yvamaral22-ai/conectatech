create extension if not exists pgcrypto;

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in ('basica', 'seguranca', 'web', 'curriculo', 'portfolio', 'selecao')),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('terms', 'analytics')),
  version text not null,
  granted boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, purpose, version)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 40),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists course_progress_user_idx on public.course_progress(user_id);
create index if not exists consents_user_idx on public.consents(user_id);
create index if not exists feedback_user_created_idx on public.feedback(user_id, created_at desc);

alter table public.course_progress enable row level security;
alter table public.consents enable row level security;
alter table public.feedback enable row level security;

revoke all on public.course_progress, public.consents, public.feedback from anon;
revoke all on public.course_progress, public.consents, public.feedback from authenticated;
grant select, insert, update, delete on public.course_progress, public.consents to authenticated;
grant select, insert, delete on public.feedback to authenticated;

drop policy if exists "course_progress_select_own" on public.course_progress;
drop policy if exists "course_progress_insert_own" on public.course_progress;
drop policy if exists "course_progress_update_own" on public.course_progress;
drop policy if exists "course_progress_delete_own" on public.course_progress;
create policy "course_progress_select_own" on public.course_progress for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "course_progress_insert_own" on public.course_progress for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "course_progress_update_own" on public.course_progress for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "course_progress_delete_own" on public.course_progress for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "consents_select_own" on public.consents;
drop policy if exists "consents_insert_own" on public.consents;
drop policy if exists "consents_update_own" on public.consents;
drop policy if exists "consents_delete_own" on public.consents;
create policy "consents_select_own" on public.consents for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "consents_insert_own" on public.consents for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "consents_update_own" on public.consents for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "consents_delete_own" on public.consents for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "feedback_select_own" on public.feedback;
drop policy if exists "feedback_insert_own" on public.feedback;
drop policy if exists "feedback_delete_own" on public.feedback;
create policy "feedback_select_own" on public.feedback for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "feedback_insert_own" on public.feedback for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "feedback_delete_own" on public.feedback for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
