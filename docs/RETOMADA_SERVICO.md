# Retomada no computador do servico

Este guia e para continuar o projeto ConectaTech em outro computador, puxando pelo GitHub e acessando o Supabase pelo navegador.

## 1. O que instalar

Instale ou confirme se ja existe:

- **GitHub Desktop** ou **Git**;
- **Node.js LTS**;
- **Visual Studio Code**;
- navegador atualizado, preferencialmente Chrome, Edge ou Firefox.

Links:

- GitHub Desktop: https://desktop.github.com/
- Git: https://git-scm.com/downloads
- Node.js LTS: https://nodejs.org/
- VS Code: https://code.visualstudio.com/
- Supabase: https://supabase.com/dashboard

## 2. Puxar o projeto pelo GitHub

No GitHub Desktop:

1. Entrar na sua conta do GitHub.
2. Clicar em **File > Clone repository**.
3. Escolher o repositorio da ConectaTech.
4. Escolher uma pasta local.
5. Clicar em **Clone**.
6. Abrir o projeto no VS Code.

Se usar terminal:

```powershell
git clone URL_DO_REPOSITORIO
cd conectatech
```

## 3. Conferir arquivos importantes

Depois de baixar, confirme se estes arquivos existem:

```text
index.html
app.js
styles.css
enhancements.css
service-worker.js
manifest.webmanifest
supabase-config.js
supabase-client.js
supabase/schema.sql
supabase/seed.sql
docs/SUPABASE_SETUP.md
docs/ADMINISTRACAO_E_DADOS.md
```

## 4. Configurar Supabase no projeto local

Abra `supabase-config.js` e confira:

```js
window.CONECTATECH_SUPABASE = {
  url: 'https://oavuxlzxzowryfyhnwgn.supabase.co',
  anonKey: 'sb_publishable_qat9Z4JhWU4IP3OVlnmRSw_j0re-ZPm'
};
```

Use apenas a chave publica/publishable. Nunca coloque `service_role` no frontend.

## 5. Abrir o Supabase pelo navegador

1. Acesse https://supabase.com/dashboard.
2. Entre na sua conta.
3. Abra o projeto ConectaTech.
4. Verifique:
   - **Authentication > Users** para usuarios cadastrados;
   - **Table Editor > profiles** para papeis de usuario;
   - **Table Editor > tracks** para trilhas;
   - **Table Editor > diagnostics** para diagnosticos;
   - **Table Editor > lesson_progress** para progresso;
   - **Table Editor > feedbacks** para feedbacks.

## 6. Rodar o site localmente

No terminal, dentro da pasta do projeto:

```powershell
npx serve .
```

Abra o endereco exibido no terminal, geralmente:

```text
http://localhost:3000
```

Se o comando perguntar para instalar `serve`, aceite.

Alternativa:

```powershell
npx http-server .
```

## 7. Se abrir uma lista de pastas

Isso significa que o servidor foi iniciado na pasta errada.

Pare o servidor com:

```powershell
Ctrl + C
```

Entre na pasta correta:

```powershell
cd CAMINHO_DA_PASTA_DO_PROJETO
npx serve .
```

## 8. Se o site mostrar versao antiga

Pode ser cache da PWA/Service Worker.

Primeiro tente:

```text
Ctrl + F5
```

Se continuar antigo:

1. Aperte `F12`.
2. Abra **Application**.
3. Va em **Service Workers**.
4. Clique em **Unregister**.
5. Va em **Storage**.
6. Clique em **Clear site data**.
7. Recarregue a pagina.

## 9. Fluxo para testar

1. Abrir o site local.
2. Conferir se o topo mostra **Visitante**.
3. Confirmar que **Meu progresso** nao aparece sem login.
4. Ir para **Conta**.
5. Criar conta ou entrar.
6. Confirmar que o topo mostra usuario logado.
7. Confirmar que **Meu progresso** aparece.
8. Preencher diagnostico.
9. Abrir uma trilha.
10. Concluir a aula demonstrativa.
11. Enviar feedback.
12. Conferir os dados no Supabase.

## 10. Tornar seu usuario dono

No Supabase:

1. Abra **Authentication > Users**.
2. Copie o ID do seu usuario.
3. Abra **SQL Editor**.
4. Rode:

```sql
update public.profiles
set role = 'owner'
where id = 'COLE_AQUI_O_ID_DO_SEU_USUARIO';
```

Depois confira em:

```text
Table Editor > profiles
```

## 11. Arquivos para consultar

- `README.md`: visao geral do projeto.
- `docs/SUPABASE_SETUP.md`: configuracao Supabase.
- `docs/ADMINISTRACAO_E_DADOS.md`: plano de banco, painel e permissoes.
- `docs/VALIDACAO.md`: checklist de testes.
- `docs/RELATORIO_DETALHADO.md`: relatorio academico.
- `docs/POST_LINKEDIN.md`: postagem final.

## 12. Proxima etapa recomendada

Ao retomar, a proxima melhoria e criar um painel administrativo dentro do proprio site para o dono editar:

- trilhas;
- aulas;
- oportunidades;
- feedbacks;
- relatos de barreiras;
- configuracoes exibidas no site.

