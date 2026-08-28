# Operacao da ConectaTech

## Publicacao

Valide com `npm run check` e publique na Vercel. As variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` devem existir em Preview e Production.

## Banco de dados e administracao

A migracao `20260828193000_product_features.sql` habilita exclusao de conta na Vercel, curriculo, portfolio e administracao protegida.

A migracao `20260828220929_owner_admin_permissions.sql` reforca uma unica permissao administrativa: `admin`. Apos roda-la no SQL Editor, transforme sua conta em administradora substituindo o e-mail:

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

Depois disso, entre no site com essa conta e acesse `/admin.html`. O painel deve mostrar `Administrador conectado`.

## Dominio proprio

Na Vercel, abra Settings > Domains e adicione um dominio que voce possua. Aplique os registros DNS apresentados e inclua a URL em Supabase > Authentication > URL Configuration, em Site URL e Redirect URLs.

## Monitoramento

Builds e implantacoes ficam em Vercel > Deployments. Banco e autenticacao podem ser acompanhados em Supabase > Logs. Nunca registre senhas, tokens ou conteudo de perfis.

## Verificacao

Antes de publicar, teste login, recuperacao de senha, perfil publico/privado, conclusao de aula, curriculo, portfolio, administracao, navegacao por teclado, celular e modo offline.
