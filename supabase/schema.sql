-- ConectaTech - esquema inicial Supabase/PostgreSQL
-- Execute este arquivo no SQL Editor do Supabase depois de criar o projeto.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('owner', 'admin', 'editor', 'mentor', 'analyst', 'student');
create type public.course_level as enum ('iniciante', 'intermediario');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.progress_status as enum ('started', 'completed');
create type public.opportunity_type as enum ('curso', 'vaga', 'bolsa');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accessibility_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  large_text boolean not null default false,
  high_contrast boolean not null default false,
  screen_reader boolean not null default false,
  captions boolean not null default false,
  reduced_motion boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null,
  device text not null,
  connection_quality text not null,
  accessibility_support text[] not null default '{}',
  recommended_track_id uuid,
  created_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  level public.course_level not null default 'iniciante',
  icon text,
  estimated_minutes integer not null default 0,
  lesson_count integer not null default 0,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnostics
  add constraint diagnostics_recommended_track_fk
  foreign key (recommended_track_id) references public.tracks(id) on delete set null;

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  body text not null,
  transcript text,
  audio_description text,
  estimated_minutes integer not null default 0,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, slug)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  size_kb integer,
  is_downloadable boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option text not null,
  explanation text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.progress_status not null default 'started',
  score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  rating text not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.barrier_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  status text not null default 'open',
  severity text not null default 'to_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  type public.opportunity_type not null,
  title text not null,
  organization text,
  description text not null,
  location text,
  deadline date,
  url text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'interested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, track_id)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger accessibility_preferences_touch_updated_at before update on public.accessibility_preferences
  for each row execute function public.touch_updated_at();
create trigger tracks_touch_updated_at before update on public.tracks
  for each row execute function public.touch_updated_at();
create trigger lessons_touch_updated_at before update on public.lessons
  for each row execute function public.touch_updated_at();
create trigger lesson_progress_touch_updated_at before update on public.lesson_progress
  for each row execute function public.touch_updated_at();
create trigger barrier_reports_touch_updated_at before update on public.barrier_reports
  for each row execute function public.touch_updated_at();
create trigger opportunities_touch_updated_at before update on public.opportunities
  for each row execute function public.touch_updated_at();
create trigger applications_touch_updated_at before update on public.applications
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  insert into public.accessibility_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('owner', 'admin', 'editor', 'mentor', 'analyst'), false);
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('owner', 'admin', 'editor'), false);
$$;

create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('owner', 'admin'), false);
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'owner', false);
$$;

alter table public.profiles enable row level security;
alter table public.accessibility_preferences enable row level security;
alter table public.diagnostics enable row level security;
alter table public.tracks enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.exercises enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.feedbacks enable row level security;
alter table public.barrier_reports enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.certificates enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.can_manage_users());
create policy "profiles_update_own_basic" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_role());
create policy "profiles_manage_by_admin" on public.profiles
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "accessibility_own_or_staff" on public.accessibility_preferences
  for select using (user_id = auth.uid() or public.is_staff());
create policy "accessibility_update_own" on public.accessibility_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accessibility_manage_staff" on public.accessibility_preferences
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "diagnostics_own_or_staff" on public.diagnostics
  for select using (user_id = auth.uid() or public.is_staff());
create policy "diagnostics_insert_own" on public.diagnostics
  for insert with check (user_id = auth.uid());
create policy "diagnostics_manage_staff" on public.diagnostics
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "tracks_public_read_published" on public.tracks
  for select using (status = 'published' or public.can_manage_content());
create policy "tracks_manage_content" on public.tracks
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "lessons_public_read_published" on public.lessons
  for select using (status = 'published' or public.can_manage_content());
create policy "lessons_manage_content" on public.lessons
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "materials_public_read" on public.materials
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = materials.lesson_id
      and (l.status = 'published' or public.can_manage_content())
    )
  );
create policy "materials_manage_content" on public.materials
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "exercises_public_read" on public.exercises
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = exercises.lesson_id
      and (l.status = 'published' or public.can_manage_content())
    )
  );
create policy "exercises_manage_content" on public.exercises
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "progress_own_or_staff" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_staff());
create policy "progress_insert_own" on public.lesson_progress
  for insert with check (user_id = auth.uid());
create policy "progress_update_own" on public.lesson_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress_manage_staff" on public.lesson_progress
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "feedback_insert_own" on public.feedbacks
  for insert with check (user_id = auth.uid() or user_id is null);
create policy "feedback_read_staff" on public.feedbacks
  for select using (public.is_staff() or user_id = auth.uid());
create policy "feedback_manage_staff" on public.feedbacks
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "barriers_insert_own" on public.barrier_reports
  for insert with check (user_id = auth.uid() or user_id is null);
create policy "barriers_read_own_or_staff" on public.barrier_reports
  for select using (user_id = auth.uid() or public.is_staff());
create policy "barriers_manage_staff" on public.barrier_reports
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "opportunities_public_read_published" on public.opportunities
  for select using (status = 'published' or public.can_manage_content());
create policy "opportunities_manage_content" on public.opportunities
  for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "applications_own_or_staff" on public.applications
  for select using (user_id = auth.uid() or public.is_staff());
create policy "applications_insert_own" on public.applications
  for insert with check (user_id = auth.uid());
create policy "applications_update_own" on public.applications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "applications_manage_staff" on public.applications
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "certificates_own_or_staff" on public.certificates
  for select using (user_id = auth.uid() or public.is_staff());
create policy "certificates_manage_staff" on public.certificates
  for all using (public.can_manage_users()) with check (public.can_manage_users());

create policy "settings_public_read" on public.site_settings
  for select using (true);
create policy "settings_owner_admin_write" on public.site_settings
  for all using (public.current_role() in ('owner', 'admin')) with check (public.current_role() in ('owner', 'admin'));

create policy "audit_read_owner_admin" on public.audit_logs
  for select using (public.current_role() in ('owner', 'admin'));
create policy "audit_insert_staff" on public.audit_logs
  for insert with check (public.is_staff());

create view public.impact_summary as
select
  (select count(*) from public.profiles where role = 'student') as total_students,
  (select count(distinct user_id) from public.lesson_progress) as active_students,
  (select count(*) from public.lesson_progress where status = 'completed') as completed_lessons,
  (select count(*) from public.feedbacks) as feedback_count,
  (select count(*) from public.barrier_reports) as barrier_report_count,
  (select count(*) from public.certificates) as certificate_count;

grant select on public.impact_summary to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.tracks to anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant select on public.materials to anon, authenticated;
grant select on public.exercises to anon, authenticated;
grant select on public.opportunities to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.impact_summary to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.accessibility_preferences to authenticated;
grant select, insert on public.diagnostics to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert on public.feedbacks to anon, authenticated;
grant select, insert on public.barrier_reports to anon, authenticated;
grant select, insert, update on public.applications to authenticated;
grant select on public.certificates to authenticated;

grant insert, update, delete on public.tracks to authenticated;
grant insert, update, delete on public.lessons to authenticated;
grant insert, update, delete on public.materials to authenticated;
grant insert, update, delete on public.exercises to authenticated;
grant insert, update, delete on public.opportunities to authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant insert on public.audit_logs to authenticated;
grant select on public.audit_logs to authenticated;
