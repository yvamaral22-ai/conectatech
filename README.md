# ConectaTech

Plataforma web progressiva de capacitação digital para jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais, pessoas com deficiência e demais pessoas com acesso limitado à tecnologia.

## Executar

Por usar Service Worker, a PWA deve ser aberta por um servidor local (não diretamente como arquivo):

```powershell
npx serve .
```

Acesse o endereço exibido no terminal. A interface não precisa de instalação ou etapa de compilação.

## Entregas

- Protótipo responsivo e instalável em `index.html`;
- diagnóstico inicial voluntário com recomendação local de trilha;
- conexão opcional com Supabase para dados remotos;
- seção de conta com cadastro, login e logout;
- aula demonstrativa com exercício e conclusão;
- feedback local da experiência;
- persistência de preferências e progresso no navegador;
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
service-worker.js     cache e funcionamento offline
styles.css            sistema visual responsivo
```

## Privacidade

Este protótipo armazena apenas progresso e preferências no próprio navegador. Uma implantação com contas deve aplicar os controles de segurança, consentimento, retenção e anonimização descritos na documentação.
