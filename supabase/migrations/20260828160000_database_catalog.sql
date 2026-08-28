create table if not exists public.courses (
  id text primary key,
  icon text not null,
  title text not null,
  level text not null check (level in ('iniciante', 'intermediario')),
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  position integer not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null,
  summary text not null,
  content text not null,
  question text not null,
  answer text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('curso', 'vaga', 'bolsa')),
  title text not null,
  organization text not null,
  source_url text not null,
  description text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  verified_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at >= opens_at)
);

-- Compatibilidade com versões anteriores do catálogo.
alter table public.courses add column if not exists icon text not null default '◇';
alter table public.courses add column if not exists title text not null default 'Trilha';
alter table public.courses add column if not exists level text not null default 'iniciante';
alter table public.courses add column if not exists description text not null default '';
alter table public.courses add column if not exists duration_minutes integer not null default 10;
alter table public.courses add column if not exists position integer not null default 0;
alter table public.courses add column if not exists published boolean not null default false;
alter table public.courses add column if not exists created_at timestamptz not null default now();
alter table public.courses add column if not exists updated_at timestamptz not null default now();

alter table public.lessons add column if not exists course_id text references public.courses(id) on delete cascade;
alter table public.lessons add column if not exists title text not null default 'Aula';
alter table public.lessons add column if not exists position integer not null default 0;
alter table public.lessons add column if not exists summary text not null default '';
alter table public.lessons add column if not exists content text not null default '';
alter table public.lessons add column if not exists question text not null default '';
alter table public.lessons add column if not exists answer text not null default '';
alter table public.lessons add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.lessons add column if not exists published boolean not null default false;
alter table public.lessons add column if not exists created_at timestamptz not null default now();
alter table public.lessons add column if not exists updated_at timestamptz not null default now();

alter table public.opportunities add column if not exists kind text not null default 'curso';
alter table public.opportunities add column if not exists title text not null default 'Oportunidade';
alter table public.opportunities add column if not exists organization text not null default '';
alter table public.opportunities add column if not exists source_url text not null default '';
alter table public.opportunities add column if not exists description text not null default '';
alter table public.opportunities add column if not exists opens_at timestamptz;
alter table public.opportunities add column if not exists closes_at timestamptz;
alter table public.opportunities add column if not exists verified_at timestamptz;
alter table public.opportunities add column if not exists published boolean not null default false;
alter table public.opportunities add column if not exists created_at timestamptz not null default now();
alter table public.opportunities add column if not exists updated_at timestamptz not null default now();

insert into public.courses (id, icon, title, level, description, duration_minutes, position, published)
values
  ('basica', '⌨', 'Informática básica', 'iniciante', 'Use o computador, organize arquivos e navegue com confiança.', 10, 1, true),
  ('seguranca', '◉', 'Segurança digital', 'iniciante', 'Proteja suas contas, reconheça golpes e cuide dos seus dados.', 10, 2, true),
  ('web', '</>', 'Desenvolvimento web', 'intermediario', 'Crie suas primeiras páginas com HTML, CSS e JavaScript.', 15, 3, true),
  ('curriculo', '▤', 'Currículo que se destaca', 'iniciante', 'Apresente suas experiências e habilidades com clareza.', 10, 4, true),
  ('portfolio', '◇', 'Portfólio profissional', 'intermediario', 'Organize seus projetos e mostre o que você sabe fazer.', 10, 5, true),
  ('selecao', '◎', 'Processos seletivos', 'iniciante', 'Prepare-se para candidaturas, entrevistas e dinâmicas.', 10, 6, true)
on conflict (id) do update set
  icon = excluded.icon, title = excluded.title, level = excluded.level,
  description = excluded.description, duration_minutes = excluded.duration_minutes,
  position = excluded.position, published = excluded.published, updated_at = now();

insert into public.lessons (id, course_id, title, position, summary, content, question, answer, options, published)
values
  ('00000000-0000-4000-8000-000000000001', 'basica', 'Conhecendo o computador', 1, 'Identifique as partes básicas do computador e entenda para que cada uma serve.', 'O teclado permite escrever e executar atalhos. O mouse ou touchpad move o ponteiro. Arquivos guardam informações e pastas ajudam a organizá-los.', 'Qual item é usado para organizar arquivos?', 'Pasta', '["Mouse","Pasta","Monitor"]', true),
  ('00000000-0000-4000-8000-000000000002', 'seguranca', 'Criando senhas mais seguras', 1, 'Aprenda a proteger suas contas com senhas fortes e únicas.', 'Use uma senha diferente em cada serviço. Prefira frases longas, ative a verificação em duas etapas e use um gerenciador de senhas confiável.', 'Qual é a prática mais segura?', 'Usar uma senha única por serviço', '["Repetir uma senha curta","Usar uma senha única por serviço","Enviar o código de acesso"]', true),
  ('00000000-0000-4000-8000-000000000003', 'web', 'Sua primeira página HTML', 1, 'Conheça a estrutura que organiza o conteúdo de uma página.', 'HTML descreve a estrutura da página. Títulos, parágrafos e links usam elementos semânticos que também melhoram a acessibilidade.', 'O que o HTML descreve?', 'A estrutura da página', '["A velocidade da internet","A estrutura da página","A senha do usuário"]', true),
  ('00000000-0000-4000-8000-000000000004', 'curriculo', 'Informações essenciais', 1, 'Selecione as informações que ajudam recrutadores a conhecer você.', 'Um currículo claro traz contato, objetivo, formação, experiências e habilidades relevantes. Evite documentos e outros dados desnecessários.', 'Qual dado deve ser evitado no currículo?', 'Número de documento', '["Formação","Número de documento","Habilidades"]', true),
  ('00000000-0000-4000-8000-000000000005', 'portfolio', 'Escolhendo seus projetos', 1, 'Aprenda a selecionar trabalhos que demonstram suas habilidades.', 'Escolha poucos projetos relevantes e explique o problema, sua participação, as ferramentas e o resultado. Projetos de estudo também contam.', 'O que deve acompanhar um projeto?', 'Contexto e sua participação', '["Apenas uma imagem","Contexto e sua participação","Dados pessoais de clientes"]', true),
  ('00000000-0000-4000-8000-000000000006', 'selecao', 'Preparação para entrevistas', 1, 'Organize exemplos das suas experiências e pratique respostas objetivas.', 'Pesquise a organização, revise a vaga e prepare exemplos reais de situações em que aprendeu, colaborou ou resolveu um problema.', 'O que fazer antes da entrevista?', 'Pesquisar a organização', '["Inventar experiências","Pesquisar a organização","Compartilhar suas senhas"]', true)
on conflict (id) do update set
  course_id = excluded.course_id, title = excluded.title, position = excluded.position,
  summary = excluded.summary, content = excluded.content, question = excluded.question,
  answer = excluded.answer, options = excluded.options, published = excluded.published, updated_at = now();

alter table public.course_progress drop constraint if exists course_progress_course_id_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'course_progress_course_fk') then
    alter table public.course_progress add constraint course_progress_course_fk foreign key (course_id) references public.courses(id);
  end if;
end $$;

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.opportunities enable row level security;

revoke all on public.courses, public.lessons, public.opportunities from anon, authenticated;
grant select on public.courses, public.lessons, public.opportunities to anon, authenticated;

drop policy if exists "published_courses_read" on public.courses;
drop policy if exists "published_lessons_read" on public.lessons;
drop policy if exists "verified_opportunities_read" on public.opportunities;
create policy "published_courses_read" on public.courses for select to anon, authenticated using (published);
create policy "published_lessons_read" on public.lessons for select to anon, authenticated using (published);
create policy "verified_opportunities_read" on public.opportunities for select to anon, authenticated
using (published and verified_at is not null and (closes_at is null or closes_at >= now()));

drop function if exists public.platform_metrics();
create function public.platform_metrics()
returns table (
  registered_people bigint,
  active_learners bigint,
  available_courses bigint,
  completion_rate numeric
)
language sql
security definer
stable
set search_path = ''
as $$
  with totals as (
    select count(*)::numeric as course_count from public.courses where published
  ), per_user as (
    select user_id, count(distinct course_id)::numeric as completed
    from public.course_progress group by user_id
  )
  select
    (select count(*) from auth.users)::bigint,
    (select count(*) from per_user)::bigint,
    (select course_count from totals)::bigint,
    case
      when (select count(*) from per_user) = 0 or (select course_count from totals) = 0 then 0
      else round(100 * (select avg(least(completed / (select course_count from totals), 1)) from per_user), 1)
    end;
$$;

revoke all on function public.platform_metrics() from public;
grant execute on function public.platform_metrics() to anon, authenticated;
