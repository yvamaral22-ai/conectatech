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
- persistência de preferências e progresso no navegador;
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
service-worker.js     cache e funcionamento offline
styles.css            sistema visual responsivo
```

## Privacidade

Este protótipo armazena apenas progresso e preferências no próprio navegador. Uma implantação com contas deve aplicar os controles de segurança, consentimento, retenção e anonimização descritos na documentação.
