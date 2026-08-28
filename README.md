# ConectaTech

Plataforma web progressiva de capacitação digital para jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais, pessoas com deficiência e demais pessoas com acesso limitado à tecnologia.

## Executar

Por usar Service Worker, a PWA deve ser aberta por um servidor local (não diretamente como arquivo):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\serve.ps1
```

Acesse `http://127.0.0.1:4173`. O servidor utiliza apenas a biblioteca padrão do Python, cria o banco local em `data/conectatech.db` e não exige instalação de pacotes.

Em outro terminal, execute a verificação automatizada:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

## Entregas

- Protótipo responsivo e instalável em `index.html`;
- persistência de preferências e progresso no navegador;
- API mínima e sincronização de progresso em SQLite;
- cadastro, login e sessões com cookie protegido;
- catálogo persistido, aulas práticas e exercícios;
- registro de feedback e relatos de barreira com protocolo;
- cache offline e aviso de conexão;
- documentação consolidada em `docs/PROJETO.md`;
- apresentação em `docs/APRESENTACAO.md`;
- checklist de qualidade em `docs/VALIDACAO.md`.

## Estrutura

```text
assets/               ícones e recursos visuais
docs/                 projeto, apresentação e validação
app.js                comportamento e dados do protótipo
index.html            interface semântica
manifest.webmanifest  instalação como PWA
server.py             servidor local, API e persistência SQLite
service-worker.js     cache e funcionamento offline
scripts/              comandos para executar e testar
styles.css            sistema visual responsivo
```

## Privacidade

Este protótipo armazena apenas progresso e preferências no próprio navegador. Uma implantação com contas deve aplicar os controles de segurança, consentimento, retenção e anonimização descritos na documentação.
