# Operação da ConectaTech

## Publicação

Valide com `npm run check` e publique na Vercel. As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` devem existir em Preview e Production.

## Banco de dados e administração

A migração `20260828193000_product_features.sql` habilita exclusão de conta na Vercel, currículo, portfólio e administração protegida. Para tornar uma conta administradora, execute no SQL Editor, substituindo o e-mail:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'seu-email@exemplo.com'
on conflict (user_id) do update set role = 'admin';
```

## Domínio próprio

Na Vercel, abra Settings > Domains e adicione um domínio que você possua. Aplique os registros DNS apresentados e inclua a URL em Supabase > Authentication > URL Configuration, em Site URL e Redirect URLs.

## Monitoramento

Builds e implantações ficam em Vercel > Deployments. Banco e autenticação podem ser acompanhados em Supabase > Logs. Nunca registre senhas, tokens ou conteúdo de perfis.

## Verificação

Antes de publicar, teste login, recuperação de senha, perfil público/privado, conclusão de aula, currículo, portfólio, administração, navegação por teclado, celular e modo offline.
