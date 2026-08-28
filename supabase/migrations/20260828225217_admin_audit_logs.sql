-- Auditoria administrativa para alteracoes de conteudo.
-- Registra inserts, updates e deletes feitos em trilhas, aulas e oportunidades.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id text,
  record_title text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists actor_id uuid references auth.users(id) on delete set null;
alter table public.audit_logs add column if not exists action text;
alter table public.audit_logs add column if not exists table_name text;
alter table public.audit_logs add column if not exists record_id text;
alter table public.audit_logs add column if not exists record_title text;
alter table public.audit_logs add column if not exists before_data jsonb;
alter table public.audit_logs add column if not exists after_data jsonb;
alter table public.audit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists created_at timestamptz not null default now();

create index if not exists audit_logs_created_idx
on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_idx
on public.audit_logs (actor_id, created_at desc);

alter table public.audit_logs enable row level security;

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
grant select on public.audit_logs to authenticated;

drop policy if exists "audit_logs_admin_read" on public.audit_logs;
drop policy if exists "audit_logs_no_public_write" on public.audit_logs;
drop policy if exists "audit_read_owner_admin" on public.audit_logs;
drop policy if exists "audit_insert_staff" on public.audit_logs;

create policy "audit_logs_admin_read"
on public.audit_logs
for select
to authenticated
using ((select public.can_manage_content()));

create policy "audit_logs_no_public_write"
on public.audit_logs
for all
to authenticated
using (false)
with check (false);

create or replace function public.audit_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_id text;
  changed_title text;
  before_row jsonb;
  after_row jsonb;
begin
  before_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  after_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

  if tg_op = 'DELETE' then
    changed_id := before_row ->> 'id';
    changed_title := coalesce(
      before_row ->> 'title',
      before_row ->> 'slug',
      before_row ->> 'file_url',
      before_row ->> 'id'
    );
  else
    changed_id := after_row ->> 'id';
    changed_title := coalesce(
      after_row ->> 'title',
      after_row ->> 'slug',
      after_row ->> 'file_url',
      after_row ->> 'id'
    );
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    table_name,
    record_id,
    record_title,
    before_data,
    after_data,
    metadata
  )
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    changed_id,
    changed_title,
    before_row,
    after_row,
    jsonb_build_object('schema', tg_table_schema)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_tracks_changes on public.tracks;
drop trigger if exists audit_lessons_changes on public.lessons;
drop trigger if exists audit_opportunities_changes on public.opportunities;

create trigger audit_tracks_changes
after insert or update or delete on public.tracks
for each row execute function public.audit_content_change();

create trigger audit_lessons_changes
after insert or update or delete on public.lessons
for each row execute function public.audit_content_change();

create trigger audit_opportunities_changes
after insert or update or delete on public.opportunities
for each row execute function public.audit_content_change();
