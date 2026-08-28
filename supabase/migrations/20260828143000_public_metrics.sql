create or replace function public.platform_metrics()
returns table (
  registered_people bigint,
  active_learners bigint
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    (select count(*) from auth.users)::bigint,
    (select count(distinct user_id) from public.course_progress)::bigint;
$$;

revoke all on function public.platform_metrics() from public;
grant execute on function public.platform_metrics() to anon, authenticated;

comment on function public.platform_metrics() is
  'Retorna somente contagens agregadas reais, sem expor identidade ou registros individuais.';
