-- Estudio de conteudo para administracao de aulas.
-- Permite aulas com video proprio, YouTube, parceiro, secoes/paginas e materiais.

create or replace function public.can_manage_content()
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
      and role in ('admin', 'teacher')
  )
  or exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role::text in ('admin', 'teacher')
      and coalesce(is_active, true)
  );
$$;

grant execute on function public.can_manage_content() to authenticated;

alter table public.lessons
add column if not exists source_type text not null default 'own';

alter table public.lessons
add column if not exists video_provider text not null default 'none';

alter table public.lessons
add column if not exists video_url text;

alter table public.lessons
add column if not exists pdf_url text;

alter table public.lessons
add column if not exists pdf_file_name text;

alter table public.lessons
add column if not exists pdf_file_size bigint;

alter table public.lessons
add column if not exists pdf_mime_type text;

alter table public.lessons
add column if not exists instructor_name text;

alter table public.lessons
add column if not exists partner_name text;

alter table public.lessons
add column if not exists content_format text not null default 'text_video';

alter table public.lessons
add column if not exists page_count integer not null default 1;

alter table public.lessons
add column if not exists learning_objectives text[] not null default '{}';

alter table public.lessons
drop constraint if exists lessons_source_type_check;

alter table public.lessons
add constraint lessons_source_type_check
check (source_type in ('own', 'youtube', 'partner', 'live', 'text'));

alter table public.lessons
drop constraint if exists lessons_video_provider_check;

alter table public.lessons
add constraint lessons_video_provider_check
check (video_provider in ('none', 'youtube', 'supabase_storage', 'external'));

alter table public.lessons
drop constraint if exists lessons_content_format_check;

alter table public.lessons
add constraint lessons_content_format_check
check (content_format in ('text', 'video', 'text_video', 'activity', 'project', 'pdf'));

alter table public.lessons
drop constraint if exists lessons_page_count_check;

alter table public.lessons
add constraint lessons_page_count_check
check (page_count between 1 and 1000);

create table if not exists public.lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  body text not null default '',
  sort_order integer not null default 1,
  estimated_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_sections enable row level security;
grant select on public.lesson_sections to anon, authenticated;
grant insert, update, delete on public.lesson_sections to authenticated;

drop policy if exists "lesson_sections_public_read_published" on public.lesson_sections;
drop policy if exists "lesson_sections_manage_admin" on public.lesson_sections;

create policy "lesson_sections_public_read_published"
on public.lesson_sections
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_sections.lesson_id
      and (l.status = 'published' or (select public.can_manage_content()))
  )
);

create policy "lesson_sections_manage_admin"
on public.lesson_sections
for all
to authenticated
using ((select public.can_manage_content()))
with check ((select public.can_manage_content()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-media',
  'lesson-media',
  false,
  104857600,
  array[
    'video/mp4',
    'video/webm',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'video/mp4',
    'video/webm',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ];

drop policy if exists "lesson_media_admin_manage" on storage.objects;
drop policy if exists "lesson_media_read_authenticated" on storage.objects;

create policy "lesson_media_admin_manage"
on storage.objects
for all
to authenticated
using (bucket_id = 'lesson-media' and (select public.can_manage_content()))
with check (bucket_id = 'lesson-media' and (select public.can_manage_content()));

create policy "lesson_media_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'lesson-media');

drop trigger if exists audit_lesson_sections_changes on public.lesson_sections;
drop trigger if exists audit_materials_changes on public.materials;

create trigger audit_lesson_sections_changes
after insert or update or delete on public.lesson_sections
for each row execute function public.audit_content_change();

create trigger audit_materials_changes
after insert or update or delete on public.materials
for each row execute function public.audit_content_change();

notify pgrst, 'reload schema';
