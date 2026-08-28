# ConectaTech

Plataforma web progressiva de capacitação digital para jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais, pessoas com deficiência e demais pessoas com acesso limitado à tecnologia.

## Executar com Vite

```powershell
npm.cmd install
npm.cmd run dev
```

Acesse `http://127.0.0.1:4173`. Copie `.env.example` para `.env` e preencha a URL e a chave pública do Supabase. O arquivo `.env` não é versionado.

Para gerar a versão de produção:

```powershell
npm.cmd run build
```

O servidor Python/SQLite permanece temporariamente como fallback dos recursos ainda não migrados. Ele pode ser iniciado com `scripts/serve.ps1`.

### Banco Supabase

A migração `supabase/migrations/20260828120000_learning_data.sql` cria progresso, consentimentos e feedback com RLS por pessoa autenticada. Aplique-a pelo SQL Editor do Supabase ou por um ambiente autenticado do Supabase CLI antes de testar a sincronização remota.

Em outro terminal, execute a verificação automatizada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

## Entregas

- Protótipo responsivo e instalável em `index.html`;
- diagnóstico inicial voluntário com recomendação local de trilha;
- conexão opcional com Supabase para dados remotos;
- seção de conta com cadastro, login e logout;
- aula demonstrativa com exercício e conclusão;
- feedback local da experiência;
- persistência de preferências e progresso no navegador;
- API mínima e sincronização de progresso em SQLite;
- cadastro, login e sessões com cookie protegido;
- catálogo persistido, aulas práticas e exercícios;
- registro de feedback e relatos de barreira com protocolo;
- cache offline e aviso de conexão;
- documentação consolidada em `docs/PROJETO.md`;
- apresentação em `docs/APRESENTACAO.md`;
- relatório detalhado em `docs/RELATORIO_DETALHADO.md`;
- plano de administração e dados em `docs/ADMINISTRACAO_E_DADOS.md`;
- guia de configuração Supabase em `docs/SUPABASE_SETUP.md`;
- guia de retomada em outro computador em `docs/RETOMADA_SERVICO.md`;
- checklist de qualidade em `docs/VALIDACAO.md`;
- postagem final para LinkedIn em `docs/POST_LINKEDIN.md`.

## Estrutura

```text
assets/               ícones e recursos visuais
docs/                 projeto, apresentação e validação
docs/RELATORIO_DETALHADO.md  resumo executivo do Canvas
docs/ADMINISTRACAO_E_DADOS.md plano de banco, painel e permissões
docs/SUPABASE_SETUP.md        guia de configuração do Supabase
docs/RETOMADA_SERVICO.md      guia para continuar em outro computador
docs/POST_LINKEDIN.md        postagem persuasiva final
supabase/             schema e seed do banco PostgreSQL/Supabase
supabase-client.js    conexão opcional com Supabase no navegador
supabase-config.js    URL e chave pública anonima do Supabase
app.js                comportamento e dados do protótipo
enhancements.css      estilos dos fluxos de diagnóstico, aula e feedback
index.html            interface semântica
manifest.webmanifest  instalação como PWA
server.py             servidor local, API e persistência SQLite
service-worker.js     cache e funcionamento offline
scripts/              comandos para executar e testar
styles.css            sistema visual responsivo
```

## Privacidade

O modo sem conta armazena progresso e preferências no navegador. Ao criar uma conta, o servidor registra o aceite versionado, mantém separado o consentimento opcional para indicadores, permite exportar e eliminar os dados da pessoa e aplica retenção a feedback e auditoria. Consulte `docs/PRIVACIDADE.md` para os controles implementados e as obrigações adicionais de produção.
