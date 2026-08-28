-- ConectaTech - dados iniciais de trilhas, aulas, exercicio, oportunidades e configuracoes.
-- Execute depois de `schema.sql`.

insert into public.tracks (slug, title, description, level, icon, estimated_minutes, lesson_count, sort_order, status)
values
  ('informatica-basica', 'Informática básica', 'Use o computador, organize arquivos e navegue com confiança.', 'iniciante', '⌨', 100, 8, 1, 'published'),
  ('seguranca-digital', 'Segurança digital', 'Proteja suas contas, reconheça golpes e cuide dos seus dados.', 'iniciante', '◉', 70, 6, 2, 'published'),
  ('desenvolvimento-web', 'Desenvolvimento web', 'Crie suas primeiras páginas com HTML, CSS e JavaScript.', 'intermediario', '</>', 200, 12, 3, 'published'),
  ('curriculo-profissional', 'Currículo que se destaca', 'Apresente suas experiências e habilidades com clareza.', 'iniciante', '▤', 55, 5, 4, 'published'),
  ('portfolio-profissional', 'Portfólio profissional', 'Organize seus projetos e mostre o que você sabe fazer.', 'intermediario', '◇', 90, 7, 5, 'published'),
  ('processos-seletivos', 'Processos seletivos', 'Prepare-se para candidaturas, entrevistas e dinâmicas.', 'iniciante', '●', 75, 6, 6, 'published')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  icon = excluded.icon,
  estimated_minutes = excluded.estimated_minutes,
  lesson_count = excluded.lesson_count,
  sort_order = excluded.sort_order,
  status = excluded.status;

insert into public.lessons (track_id, slug, title, summary, body, transcript, audio_description, estimated_minutes, sort_order, status)
select
  id,
  'proteja-sua-conta',
  'Proteja sua conta',
  'Aula demonstrativa sobre senhas seguras e verificação em duas etapas.',
  'Uma senha segura deve ser longa, difícil de adivinhar e diferente para cada serviço. Sempre que possível, ative a verificação em duas etapas para impedir acessos indevidos mesmo se a senha for descoberta.',
  'Nesta aula, explicamos como proteger contas digitais usando senhas longas, senhas diferentes para cada serviço e verificação em duas etapas.',
  'Conteúdo textual com lista de cuidados básicos de segurança digital.',
  12,
  1,
  'published'
from public.tracks
where slug = 'seguranca-digital'
on conflict (track_id, slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  transcript = excluded.transcript,
  audio_description = excluded.audio_description,
  estimated_minutes = excluded.estimated_minutes,
  sort_order = excluded.sort_order,
  status = excluded.status;

insert into public.exercises (lesson_id, question, options, correct_option, explanation, sort_order)
select
  l.id,
  'Qual atitude aumenta a segurança de uma conta?',
  '[
    {"id":"reuse","text":"Usar a mesma senha em todos os sites."},
    {"id":"two-factor","text":"Ativar verificação em duas etapas."},
    {"id":"share","text":"Enviar a senha para uma pessoa conferir."}
  ]'::jsonb,
  'two-factor',
  'A verificação em duas etapas adiciona uma segunda barreira de proteção além da senha.',
  1
from public.lessons l
join public.tracks t on t.id = l.track_id
where t.slug = 'seguranca-digital' and l.slug = 'proteja-sua-conta';

insert into public.opportunities (type, title, organization, description, location, deadline, url, status)
values
  ('curso', 'Introdução à programação', 'ConectaTech Parceiros', 'Formação online para iniciar em lógica e programação.', 'Online', null, null, 'published'),
  ('vaga', 'Jovem aprendiz - Suporte', 'Empresa parceira', 'Oportunidade híbrida sem exigência de experiência anterior.', 'Híbrido', null, null, 'published'),
  ('bolsa', 'Bolsa de estudos em tecnologia', 'Instituição parceira', 'Programa com 100 bolsas para cursos introdutórios de tecnologia.', 'Online', null, null, 'published');

insert into public.site_settings (key, value, description)
values
  ('impact_goals', '{"users":1000,"active_users":500,"completion_rate":60,"knowledge_improvement":70,"career_assets":40,"opportunity_progress":20}'::jsonb, 'Metas de impacto exibidas no projeto'),
  ('accessibility_standard', '{"standard":"WCAG","version":"2.2","level":"AA"}'::jsonb, 'Meta de acessibilidade da plataforma'),
  ('project_owner_role', '{"role":"owner","description":"Dono do projeto com acesso total"}'::jsonb, 'Papel administrativo principal')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

