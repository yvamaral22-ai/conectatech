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
- painel administrativo protegido por permissao `admin`;
- migracoes SQL versionadas;
- fallback local com Python/SQLite para testes.

## Criterios tecnicos

| Criterio | Decisao |
|---|---|
| Seguranca | Supabase Auth, RLS, permissoes por tabela e funcao `is_admin()` |
| Gratuito | Plano gratuito do Supabase e Vercel para prototipo e piloto |
| Escalavel | PostgreSQL, storage, build estatico e possibilidade futura de backend proprio |
| Compativel | Funciona com Vite hoje e pode migrar para Next.js depois |

## Permissoes atuais

Nesta fase existem apenas dois papeis:

- `member`: usuario comum.
- `admin`: pessoa autorizada a administrar conteudos.

O papel `owner` nao sera usado por enquanto para reduzir complexidade. A permissao administrativa deve ser concedida no SQL Editor do Supabase.

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'seu-email@exemplo.com'
on conflict (user_id) do update
set role = 'admin';
```

## Dados administraveis

Ja devem ser administrados pelo painel:

- trilhas;
- aulas;
- oportunidades;
- status de publicacao.

Devem ser adicionados nas proximas entregas:

- edicao de registros existentes;
- materiais das aulas;
- exercicios;
- usuarios e permissoes;
- feedbacks;
- relatos de barreira;
- indicadores agregados;
- configuracoes globais do site.

## Rastreabilidade dos recursos

| Recurso | Barreira que resolve |
|---|---|
| Painel admin | Evita depender de desenvolvedor para alterar conteudos. |
| Status publicado/rascunho | Permite revisar conteudo antes de exibir ao publico. |
| Trilha e aula no banco | Permite expandir o catalogo sem recriar paginas manualmente. |
| Perfil privado por padrao | Reduz exposicao indevida de dados pessoais. |
| Conteudos salvos | Ajuda quem tem pouco tempo ou conexao instavel a retomar estudos. |
| Historico de aulas | Evita perda de continuidade na aprendizagem. |
| RLS | Garante que usuarios comuns acessem somente seus proprios dados. |

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
2. Criar upload e listagem de materiais por aula.
3. Criar exercicios administraveis.
4. Criar dashboard de usuarios, progresso e feedbacks.
5. Registrar logs de auditoria para mudancas administrativas.
6. Criar testes de interface com navegador para login, perfil, aula e admin.
7. Avaliar migracao para Next.js quando houver necessidade de backend proprio.
