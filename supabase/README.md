# Supabase

Esta pasta guarda os arquivos de banco de dados da ConectaTech.

## Arquivos

- `schema.sql`: cria tabelas, tipos, funcoes, gatilhos, permissoes RLS e view de impacto.
- `seed.sql`: adiciona trilhas, aula demonstrativa, exercicio, oportunidades e configuracoes iniciais.

## Como aplicar

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute todo o conteudo de `schema.sql`.
4. Execute todo o conteudo de `seed.sql`.
5. Crie seu usuario em **Authentication**.
6. No **Table Editor**, abra `profiles` e altere seu `role` para `owner`.
7. Preencha `supabase-config.js` com a URL do projeto e a chave publica anonima.

Depois disso, voce tera acesso de dono do projeto no banco.

## Observacao de seguranca

Nunca coloque no frontend a chave `service_role`. O site publico deve usar somente a URL do projeto e a chave anonima publica. A chave administrativa fica restrita ao ambiente seguro do backend ou ao painel do Supabase.
