# Administracao, banco de dados e permissoes

## Objetivo

A ConectaTech deve funcionar como uma plataforma administravel: conteudos, usuarios, progresso, oportunidades e indicadores precisam poder ser acompanhados sem editar diretamente o codigo do site.

## Estado atual

O projeto ja possui:

- frontend multipagina com Vite;
- autenticacao pelo Supabase;
- perfil do usuario com foto, capa, bio, cidade e visibilidade;
- progresso, historico e conteudos salvos;
- catalogo de trilhas e aulas vindo do banco;
- oportunidades vindas do banco;
- painel protegido por permissoes `admin` e `teacher`;
- auditoria das alteracoes feitas em trilhas, aulas, paginas, materiais e oportunidades;
- migracoes SQL versionadas;
- fallback local com Python/SQLite para testes.

## Criterios tecnicos

| Criterio | Decisao |
|---|---|
| Seguranca | Supabase Auth, RLS, permissoes por tabela e funcoes `is_admin()` e `can_manage_content()` |
| Gratuito | Plano gratuito do Supabase e Vercel para prototipo e piloto |
| Escalavel | PostgreSQL, storage, build estatico e possibilidade futura de backend proprio |
| Compativel | Funciona com Vite hoje e pode migrar para Next.js depois |

## Permissoes atuais

Nesta fase existem tres papeis:

- `admin`: papel master. Administra usuarios, permissoes, conteudos, oportunidades, auditoria e configuracoes.
- `teacher`: professor. Cria, edita e publica trilhas, aulas, paginas, materiais e oportunidades.
- `student`: aluno. Papel padrao de qualquer usuario cadastrado, com acesso apenas ao proprio perfil, progresso, salvos e conteudos publicados.

O papel `owner` nao sera usado por enquanto para reduzir complexidade. Permissoes podem ser concedidas pelo painel admin ou pelo SQL Editor do Supabase.

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'seu-email@exemplo.com'
on conflict (user_id) do update
set role = 'admin';
```

Para tornar alguem professor:

```sql
insert into public.user_roles (user_id, role)
select id, 'teacher'
from auth.users
where email = 'email-do-professor@exemplo.com'
on conflict (user_id) do update
set role = 'teacher';
```

## Dados administraveis

Ja devem ser administrados pelo painel:

- trilhas;
- aulas;
- paginas de aula;
- materiais de apoio;
- oportunidades;
- status de publicacao.
- usuarios e permissoes, somente por `admin`.

Devem ser adicionados nas proximas entregas:

- edicao de registros existentes;
- exercicios;
- feedbacks;
- relatos de barreira;
- indicadores agregados;
- configuracoes globais do site.

## Rastreabilidade dos recursos

| Recurso | Barreira que resolve |
|---|---|
| Painel admin | Da ao administrador controle da plataforma sem expor chaves secretas. |
| Papel professor | Permite escalar producao de aulas sem liberar controle total de usuarios. |
| Papel aluno | Protege usuarios comuns contra acesso indevido a dados e funcoes internas. |
| Status publicado/rascunho | Permite revisar conteudo antes de exibir ao publico. |
| Trilha e aula no banco | Permite expandir o catalogo sem recriar paginas manualmente. |
| Perfil privado por padrao | Reduz exposicao indevida de dados pessoais. |
| Conteudos salvos | Ajuda quem tem pouco tempo ou conexao instavel a retomar estudos. |
| Historico de aulas | Evita perda de continuidade na aprendizagem. |
| RLS | Garante que usuarios comuns acessem somente seus proprios dados. |
| Auditoria administrativa | Permite identificar quando conteudos foram criados, alterados ou excluidos. |

## Ajustes manuais fora da interface

Algumas partes continuam sendo controladas por arquivos, ambiente ou Supabase Studio:

- variaveis `.env`;
- chaves publicas e configuracao de Auth;
- migracoes SQL;
- politicas RLS;
- regras de storage;
- service worker e cache;
- deploy e dominio.

Esses ajustes devem ser documentados em `docs/OPERACAO.md` e nunca devem expor chave `service_role` no frontend.

## Proximos passos tecnicos

1. Completar edicao e arquivamento no painel admin.
2. Melhorar edicao visual de paginas e materiais.
3. Criar exercicios administraveis.
4. Criar dashboard de progresso e feedbacks.
5. Ampliar auditoria para permissoes e configuracoes.
6. Criar testes de interface com navegador para login, perfil, aula e admin.
7. Avaliar migracao para Next.js quando houver necessidade de backend proprio.
