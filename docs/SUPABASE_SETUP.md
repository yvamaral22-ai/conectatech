# Configuracao do Supabase

## Criterios escolhidos

A escolha do Supabase com PostgreSQL atende aos criterios definidos para a evolucao da ConectaTech:

- **Seguranca:** autenticacao integrada, politicas RLS e controle de papeis.
- **Gratuito:** plano inicial gratuito suficiente para prototipo e piloto controlado.
- **Escalavel:** banco PostgreSQL e estrutura preparada para crescer.
- **Compativel:** funciona bem com a PWA atual, GitHub, Vercel, Netlify e um futuro frontend em Next.js.

## Passo a passo

1. Criar uma conta no Supabase.
2. Criar um novo projeto chamado `conectatech`.
3. Guardar a URL do projeto e a chave anonima publica.
4. Abrir o SQL Editor.
5. Executar `supabase/schema.sql`.
6. Executar `supabase/seed.sql`.
7. Criar o primeiro usuario em Authentication.
8. Alterar o papel desse usuario em `profiles.role` para `owner`.
9. Usar o Supabase Studio como painel administrativo inicial.
10. Depois, criar um painel proprio dentro do site.

## Conectar o prototipo ao Supabase

Depois de executar o banco, abra o arquivo `supabase-config.js` e preencha:

```js
window.CONECTATECH_SUPABASE = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA_CHAVE_PUBLICA_ANON'
};
```

Esses dois valores ficam em:

1. Supabase Dashboard.
2. Project Settings.
3. Data API ou API Keys.
4. Project URL.
5. Public anon key ou publishable key.

Use somente a chave publica anonima no frontend. Nunca use a chave `service_role` no site.

Quando o arquivo estiver preenchido, a PWA tentara:

- carregar trilhas publicadas do banco;
- carregar oportunidades publicadas;
- enviar feedbacks para o banco;
- enviar diagnostico e progresso quando houver usuario autenticado.

Se a conexao falhar, o prototipo continua funcionando com os dados locais.

## Primeiro acesso administrativo

O primeiro usuario criado deve ser definido como dono do projeto:

```sql
update public.profiles
set role = 'owner'
where id = 'COLE_AQUI_O_ID_DO_SEU_USUARIO';
```

Somente o papel `owner` deve ter permissao para:

- alterar papeis administrativos;
- exportar dados sensiveis;
- apagar registros importantes;
- alterar configuracoes globais;
- acessar logs de auditoria completos.

## Dados administraveis

Com o schema inicial, sera possivel administrar:

- usuarios e papeis;
- preferencias de acessibilidade;
- diagnosticos;
- trilhas;
- aulas;
- materiais;
- exercicios;
- progresso;
- feedbacks;
- relatos de barreiras;
- oportunidades;
- candidaturas;
- certificados;
- configuracoes do site;
- indicadores agregados de impacto.

## Proxima etapa tecnica

Depois que o banco estiver criado, a proxima etapa e conectar a PWA ao Supabase:

1. Criar tela de login/cadastro.
2. Salvar diagnostico e progresso vinculados ao usuario autenticado.
3. Criar tela administrativa protegida.
4. Manter fallback local para uso offline.
