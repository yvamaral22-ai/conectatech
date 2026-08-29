# ConectaTech

Plataforma web progressiva de capacitação digital para jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais, pessoas com deficiência e demais pessoas com acesso limitado à tecnologia.

## Objetivo

Reduzir barreiras de acesso à educação digital e oportunidades profissionais por meio de uma experiência gratuita, leve, acessível, responsiva e integrada a acompanhamento de progresso.

## Funcionalidades

- Cadastro, login e logout com Supabase Auth.
- Perfil do usuário com foto, capa, nome público, bio, cidade e controle de visibilidade.
- Trilhas de aprendizagem carregadas do Supabase.
- Aulas com vídeo, leitura em páginas, PDFs página por página, materiais, conclusão, histórico e conteúdos salvos.
- Área de carreira com currículo, portfólio e oportunidades.
- Painel administrativo por ações para cadastrar trilhas, aulas, PDFs, páginas, materiais, oportunidades e permissões.
- Auditoria administrativa para alterações em trilhas, aulas, páginas, materiais e oportunidades.
- Persistência local para preferências e fallback de progresso.
- PWA com manifest, service worker, cache offline e aviso de conexão.
- Documentação acadêmica, operacional, privacidade, validação e retomada.

## Stack

- Frontend: HTML semântico, CSS responsivo e JavaScript modular.
- Build/dev server: Vite.
- Banco e autenticação: Supabase com PostgreSQL, Auth, Storage e RLS.
- Leitura de PDF: PDF.js (`pdfjs-dist`).
- Fallback local: Python + SQLite para testes e recursos legados.
- Hospedagem prevista: Vercel.

## Como Executar

Instale as dependências:

```powershell
npm.cmd install
```

Crie o arquivo `.env` a partir de `.env.example` e preencha:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Rode em desenvolvimento:

```powershell
npm.cmd run dev
```

Acesse:

```text
http://127.0.0.1:5173
```

Gerar build de produção:

```powershell
npm.cmd run build
```

Rodar fallback local com Python:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1
```

Rodar testes locais:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

## Rotas

| Rota | Função |
|---|---|
| `/` | Página inicial, diagnóstico, resumo, login e chamadas principais |
| `/trilhas.html` | Catálogo de trilhas |
| `/aula.html?id=...` | Visualização de aula, PDF, salvar conteúdo e concluir progresso |
| `/carreira.html` | Orientação profissional |
| `/curriculo.html` | Criador de currículo |
| `/portfolio.html` | Organização de projetos |
| `/oportunidades.html` | Vagas, cursos e bolsas |
| `/perfil.html` | Perfil, capa, foto, progresso, histórico e salvos |
| `/impacto.html` | Indicadores e proposta de impacto |
| `/admin.html` | Painel administrativo protegido |

## Banco Supabase

Execute as migrações em `supabase/migrations` pelo SQL Editor do Supabase, na ordem dos arquivos.

Principais áreas do banco:

- `profiles`: perfil público/privado do usuário.
- `user_roles`: papéis `admin`, `teacher` e `student`.
- `tracks`: trilhas.
- `lessons`: aulas, vídeos e PDFs.
- `lesson_sections`: páginas internas das aulas.
- `materials`: materiais de apoio, links e arquivos.
- `lesson_progress` e `course_progress`: progresso.
- `saved_lessons`: conteúdos salvos.
- `opportunities`: oportunidades.
- `feedback`, `feedbacks`, `consents`: experiência, privacidade e retorno dos usuários.
- `audit_logs`: histórico de alterações administrativas.
- `storage.lesson-media`: bucket privado para mídias, PDFs e materiais próprios.

Para tornar uma conta administradora:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'seu-email@exemplo.com'
on conflict (user_id) do update
set role = 'admin';

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'seu-email@exemplo.com'
);
```

Para tornar uma conta professora:

```sql
insert into public.user_roles (user_id, role)
select id, 'teacher'
from auth.users
where email = 'professor@exemplo.com'
on conflict (user_id) do update
set role = 'teacher';
```

Usuários sem papel especial entram como `student`.

## Rastreabilidade

Cada recurso deve responder a uma barreira real:

- Download/offline reduz dependência de conexão.
- Aulas curtas reduzem custo de dados e fadiga cognitiva.
- Perfil e histórico ajudam a retomar estudos.
- Painel admin evita conteúdo preso no código.
- RLS e privacidade reduzem exposição de dados pessoais.
- Acessibilidade por teclado, contraste e leitores de tela reduz exclusão de pessoas com deficiência.
- PDF página por página melhora leitura em celular e evita empilhar páginas longas.

Detalhes em `docs/RASTREABILIDADE.md`.

## Estrutura

```text
assets/                ícones e recursos visuais
docs/                  documentação do projeto
supabase/              schema, seed e migrações PostgreSQL/Supabase
scripts/               scripts de execução e validação
app.js                 comportamento da página inicial
data-client.js         cliente Supabase para páginas modulares
page-shell.js          cabeçalho, menu e mini perfil das páginas internas
admin-page.js          painel administrativo
profile-page.js        área do usuário
aula-page.js           visualização, PDF e progresso de aula
styles.css             base visual responsiva
modern.css             refinamentos visuais
pages.css              estilos das páginas internas
service-worker.js      cache offline
vite.config.js         configuração de build multipágina
```

## Privacidade

O modo sem conta armazena progresso e preferências no navegador. Ao criar conta, os dados passam a ser vinculados ao usuário autenticado e protegidos por RLS no Supabase. O e-mail e dados de conta não são exibidos publicamente. Consulte `docs/PRIVACIDADE.md`.

## Próximos Incrementos

- Edição completa de trilhas, aulas, PDFs, páginas, materiais e oportunidades no painel admin.
- Exercícios administráveis por aula.
- Dashboard admin com usuários, progresso, feedbacks e indicadores.
- Pré-visualização antes da publicação.
- Testes automatizados de interface com navegador.
- Evolução futura para Next.js caso sejam necessárias rotas protegidas no servidor, SEO avançado e backend próprio.
