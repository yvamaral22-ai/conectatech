# ConectaTech

Plataforma web progressiva de capacitacao digital para jovens de baixa renda, pessoas desempregadas, moradores de regioes perifericas ou rurais, pessoas com deficiencia e demais pessoas com acesso limitado a tecnologia.

## Objetivo

Reduzir barreiras de acesso a educacao digital e oportunidades profissionais por meio de uma experiencia gratuita, leve, acessivel, responsiva e integrada a acompanhamento de progresso.

## Funcionalidades

- Cadastro, login e logout com Supabase Auth.
- Perfil do usuario com foto, capa, nome publico, bio, cidade e controle de visibilidade.
- Trilhas de aprendizagem carregadas do Supabase.
- Aulas com leitura, conclusao, historico e conteudos salvos.
- Area de carreira com curriculo, portfolio e oportunidades.
- Painel administrativo para cadastrar trilhas, aulas e oportunidades.
- Persistencia local para preferências e fallback de progresso.
- PWA com manifest, service worker, cache offline e aviso de conexao.
- Documentacao academica, operacional, privacidade, validacao e retomada.

## Stack

- Frontend: HTML semantico, CSS responsivo e JavaScript modular.
- Build/dev server: Vite.
- Banco e autenticacao: Supabase com PostgreSQL, Auth, Storage e RLS.
- Fallback local: Python + SQLite para testes e recursos legados.
- Hospedagem prevista: Vercel.

## Como executar

Instale as dependencias:

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
http://127.0.0.1:4173
```

Gerar build de producao:

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

| Rota | Funcao |
|---|---|
| `/` | Pagina inicial, diagnostico, resumo, login e chamadas principais |
| `/trilhas.html` | Catalogo de trilhas |
| `/aula.html?id=...` | Visualizacao de aula, salvar conteudo e concluir progresso |
| `/carreira.html` | Orientacao profissional |
| `/curriculo.html` | Criador de curriculo |
| `/portfolio.html` | Organizacao de projetos |
| `/oportunidades.html` | Vagas, cursos e bolsas |
| `/perfil.html` | Perfil, capa, foto, progresso, historico e salvos |
| `/impacto.html` | Indicadores e proposta de impacto |
| `/admin.html` | Painel administrativo protegido |

## Banco Supabase

Execute as migracoes em `supabase/migrations` pelo SQL Editor do Supabase, na ordem dos arquivos.

Principais areas do banco:

- `profiles`: perfil publico/privado do usuario.
- `user_roles`: permissao administrativa.
- `tracks`: trilhas.
- `lessons`: aulas.
- `lesson_progress` e `course_progress`: progresso.
- `saved_lessons`: conteudos salvos.
- `opportunities`: oportunidades.
- `feedback`, `feedbacks`, `consents`: experiencia, privacidade e retorno dos usuarios.

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

## Rastreabilidade

Cada recurso deve responder a uma barreira real:

- Download/offline reduz dependencia de conexao.
- Aulas curtas reduzem custo de dados e fadiga cognitiva.
- Perfil e historico ajudam a retomar estudos.
- Painel admin evita conteudo preso no codigo.
- RLS e privacidade reduzem exposicao de dados pessoais.
- Acessibilidade por teclado, contraste e leitores de tela reduz exclusao de pessoas com deficiencia.

Detalhes em `docs/RASTREABILIDADE.md`.

## Estrutura

```text
assets/                icones e recursos visuais
docs/                  documentacao do projeto
supabase/              schema, seed e migracoes PostgreSQL/Supabase
scripts/               scripts de execucao e validacao
app.js                 comportamento da pagina inicial
data-client.js         cliente Supabase para paginas modulares
page-shell.js          cabecalho, menu e mini perfil das paginas internas
admin-page.js          painel administrativo
profile-page.js        area do usuario
aula-page.js           visualizacao e progresso de aula
styles.css             base visual responsiva
modern.css             refinamentos visuais
pages.css              estilos das paginas internas
service-worker.js      cache offline
vite.config.js         configuracao de build multipagina
```

## Privacidade

O modo sem conta armazena progresso e preferencias no navegador. Ao criar conta, os dados passam a ser vinculados ao usuario autenticado e protegidos por RLS no Supabase. O e-mail e dados de conta nao sao exibidos publicamente. Consulte `docs/PRIVACIDADE.md`.

## Proximos incrementos

- Edicao completa de trilhas, aulas e oportunidades no painel admin.
- Upload de materiais didaticos: PDF, imagens, videos e links.
- Exercicios administraveis por aula.
- Dashboard admin com usuarios, progresso, feedbacks e indicadores.
- Logs de auditoria para alteracoes administrativas.
- Testes automatizados de interface com navegador.
- Evolucao futura para Next.js caso sejam necessarias rotas protegidas no servidor, SEO avancado e backend proprio.
