# ConectaTech — Documento do projeto

## 1. Resumo executivo

A ConectaTech é uma plataforma web responsiva de capacitação digital criada para reduzir desigualdades no acesso à educação tecnológica e ao mercado de trabalho. Instalada como PWA, reúne formação, prática, orientação profissional e oportunidades em uma experiência leve, acessível e capaz de funcionar em conexões lentas ou intermitentes.

O público prioritário inclui jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais, pessoas com deficiência e usuários que dependem de equipamentos antigos ou utilizam apenas o celular. A proposta de valor integra capacitação, acessibilidade, baixo consumo de dados e preparação para oportunidades profissionais, sem pressupor internet rápida, computador moderno ou experiência digital prévia.

O produto será operado como negócio social de impacto. Os conteúdos essenciais permanecerão gratuitos ao público vulnerável e a receita virá de editais, doações, patrocínios, parcerias públicas e sociais, serviços institucionais, certificações opcionais e mentoria. Dados pessoais não serão vendidos e publicidade invasiva não fará parte do modelo.

## 2. Problema e público

Barreiras de custo, conectividade, equipamentos antigos, acessibilidade e falta de orientação afastam grupos socialmente vulneráveis da educação e do mercado de tecnologia. Essas dificuldades são especialmente presentes entre jovens de baixa renda, pessoas desempregadas, moradores de regiões periféricas ou rurais e pessoas com deficiência. A solução atende diferentes níveis de escolaridade, aparelhos e condições de conexão, sem exigir familiaridade prévia com plataformas educacionais.

## 3. Proposta de valor

- Formação digital gratuita, prática e em linguagem simples;
- aulas curtas, organizadas por dificuldade, com exercícios;
- materiais baixáveis e conteúdos já acessados disponíveis offline;
- acompanhamento de evolução e recomendações personalizadas;
- currículo, portfólio, orientação e oportunidades no mesmo ambiente;
- acessibilidade tratada como requisito contínuo de qualidade;
- baixo consumo de dados, bateria e processamento.

## 4. Escopo funcional

### Produto mínimo viável

1. Cadastro, autenticação compatível com gerenciadores de senha e diagnóstico inicial voluntário.
2. Catálogo, busca e filtros de trilhas.
3. Trilhas de informática básica, segurança digital, desenvolvimento web, currículo, portfólio e processos seletivos.
4. Aulas com texto, vídeo em resoluções alternativas, legenda, transcrição, audiodescrição e exercícios.
5. Progresso local e remoto, retomada da aula e certificados.
6. Download de textos e exercícios e cache de conteúdos acessados.
7. Criador de currículo e portfólio.
8. Área de oportunidades e orientação profissional.
9. Avaliação do conteúdo, envio de dúvidas e relato acessível de barreiras.
10. Painel pessoal e painel institucional com dados agregados.

### Evoluções posteriores

- Recomendações baseadas em objetivos, diagnóstico e comportamento, com critérios transparentes;
- mentoria, turmas patrocinadas e integração com parceiros;
- sincronização otimizada em segundo plano;
- relatório público de impacto e exportação de dados agregados.

## 5. Requisitos não funcionais

| Área | Requisito verificável |
|---|---|
| Acessibilidade | Conformidade WCAG 2.2 AA, combinando testes automáticos, manuais e com pessoas com deficiência |
| Desempenho | Conteúdo essencial utilizável em aparelhos com pouca memória e conexões lentas; orçamento inicial de até 200 KB transferidos na primeira visita, exceto mídia |
| Offline | Aulas acessadas e materiais escolhidos disponíveis sem rede; progresso local em fila para sincronização |
| Responsividade | Operação a partir de 320 px sem rolagem horizontal ou perda de conteúdo |
| Compatibilidade | Melhoria progressiva; conteúdo principal disponível quando recursos avançados falharem |
| Segurança | HTTPS, senhas com hash forte, proteção contra abuso, menor privilégio e atualizações regulares |
| Privacidade | Minimização, finalidade clara, consentimento quando aplicável, retenção definida e direitos da LGPD |
| Disponibilidade | Meta inicial de 99,5% ao mês para os fluxos essenciais |
| Manutenibilidade | Código documentado, componentes consistentes, testes automatizados e observabilidade |

## 6. Arquitetura proposta

```text
Navegador/PWA
  ├─ interface semântica e responsiva
  ├─ cache de aplicação e materiais
  └─ fila local de progresso
           │ HTTPS / sincronização idempotente
API de aplicação
  ├─ identidade e consentimentos
  ├─ catálogo, aulas e exercícios
  ├─ progresso, certificados e feedback
  ├─ carreira e oportunidades
  └─ agregação de indicadores
           │
Banco relacional + armazenamento de objetos
  ├─ usuários, inscrições, progresso e avaliações
  ├─ conteúdos e metadados acessíveis
  └─ currículos, portfólios e certificados
```

A interface pode ser distribuída por CDN. A API deve ser stateless para permitir escalonamento conforme a demanda. Vídeos e materiais ficam em armazenamento de objetos, com variantes compactadas. O Service Worker usa cache versionado; a sincronização envia eventos com identificador único para evitar duplicidade. Funções essenciais têm fallback baseado em HTML e formulários comuns.

### Entidades principais

`Usuario`, `PerfilAcessibilidade`, `Consentimento`, `Diagnostico`, `Trilha`, `Modulo`, `Aula`, `Material`, `Matricula`, `Progresso`, `TentativaExercicio`, `Avaliacao`, `Certificado`, `Curriculo`, `Portfolio`, `Oportunidade`, `Candidatura`, `Feedback` e `RelatoBarreira`.

Dados de identidade devem ficar separados dos dados analíticos. Painéis utilizam identificadores pseudonimizados, regras de tamanho mínimo de grupo e supressão de combinações capazes de reidentificar participantes.

## 7. Acessibilidade — WCAG 2.2 AA

### Perceptível

- Texto alternativo para imagens informativas; imagens decorativas ignoradas por tecnologias assistivas.
- Legendas, transcrições e descrição de informação visual relevante em vídeos.
- Contraste mínimo de 4,5:1 para texto comum e 3:1 para texto grande e elementos gráficos essenciais.
- Ampliação a 200% e reformatação a 320 CSS px sem perda; significado nunca depende apenas de cor, som ou imagem.

### Operável

- Todos os fluxos por teclado, foco visível e não oculto, ordem lógica e ausência de armadilhas.
- Alvos de interação de pelo menos 24 × 24 CSS px; preferência de projeto por 44 × 44 px.
- Sem flashes, limites desnecessários ou gestos complexos obrigatórios.
- Link para pular conteúdo, títulos estruturados, regiões semânticas, menus e links descritivos.

### Compreensível

- Linguagem simples, navegação consistente e instruções próximas da ação.
- Rótulos persistentes, erros associados ao campo, sugestão de correção e resumo quando útil.
- Revisão antes de ações importantes e prevenção de perda de dados.
- Autenticação sem testes cognitivos; colagem e gerenciadores de senha permitidos.

### Robusta

- HTML semântico; nome, função, valor e estado programaticamente identificáveis.
- ARIA apenas quando a semântica nativa não resolve.
- Mensagens dinâmicas anunciadas sem mover o foco indevidamente.
- Testes com leitores de tela, teclado, navegadores e dispositivos móveis reais.

## 8. Privacidade, ética e segurança

O diagnóstico é voluntário e explica finalidade e uso. O sistema coleta apenas o necessário, permite acesso, correção e eliminação conforme as bases legais aplicáveis e define prazos de retenção. Informações de deficiência e vulnerabilidade exigem proteção reforçada. Relatórios usam dados agregados e anonimizados. Recomendações não devem excluir oportunidades ou inferir atributos sensíveis.

Controles mínimos: autenticação segura, limitação de tentativas, sessões protegidas, criptografia em trânsito e repouso, registros de auditoria, backups testados, gestão de incidentes e revisão periódica de acessos administrativos.

## 9. Funcionamento offline e baixo consumo

- Cache do shell da aplicação e de conteúdos acessados; download explícito de materiais.
- Textos como formato prioritário, imagens modernas e responsivas e vídeo sem reprodução automática.
- Vídeos em várias resoluções e indicação do tamanho antes do download.
- Progresso salvo localmente, fila de alterações e sincronização após retorno da rede.
- Resolução de conflito previsível, mantendo eventos e a versão mais recente sem descartar atividade.
- Carregamento progressivo, poucos scripts, redução de animações e tarefas em segundo plano.
- Limpeza controlada de caches antigos e arquivos sem finalidade, sem apagar downloads sem aviso.

## 10. Impacto e metas do primeiro ano

| Dimensão | Indicador/meta |
|---|---|
| Adoção | 1.000 pessoas cadastradas, regiões atendidas |
| Atividade | Pelo menos 500 usuários ativos |
| Educação | 60% de conclusão das trilhas iniciadas; 70% com melhora entre avaliações |
| Carreira | 40% dos concluintes com currículo ou portfólio |
| Oportunidades | 20% em processo seletivo, curso avançado ou oportunidade após a formação |
| Inclusão | Acessos móveis, uso offline, downloads e participação de pessoas com deficiência |
| Acessibilidade | Barreiras, severidade, prazo de correção e conformidade WCAG 2.2 AA |
| Satisfação | Avaliação dos conteúdos e percepção de autonomia |

O diagnóstico inicial registra, de forma voluntária, conhecimento, dispositivo, conexão e objetivos. A avaliação final mede evolução. Questionários após três e seis meses acompanham continuidade dos estudos e inserção profissional. O painel trimestral exibe dados anonimizados e pode comparar gênero, faixa etária, deficiência e região com salvaguardas contra reidentificação.

Semestralmente, uma equipe multidisciplinar revisa indicadores, acessibilidade e dados. Anualmente, será publicado relatório de impacto, preferencialmente analisado por parceiro independente. Desvios geram plano corretivo com responsável, prazo e nova avaliação.

## 11. Modelo de sustentabilidade

### Econômica e institucional

- Editais, doações, patrocínios e parcerias com governos e organizações sociais;
- financiamento de turmas, bolsas e conteúdo por empresas e instituições;
- painéis institucionais somente com dados agregados;
- serviços para instituições de ensino, certificação opcional e mentoria;
- gratuidade garantida a pessoas em situação de vulnerabilidade;
- conselho com usuários e especialistas em tecnologia, educação e acessibilidade.

### Técnica

Equipe enxuta, documentação, testes, manutenção preventiva e arquitetura simples. Partes não sensíveis podem ser código aberto para contribuições de universidades e comunidades.

### Ambiental

Páginas leves, cache, compressão, formatos eficientes e escalonamento por demanda. Preferência por infraestrutura que divulgue indicadores ambientais e use energia renovável. Compatibilidade com aparelhos antigos prolonga a vida útil e reduz resíduos eletrônicos. Indicadores: dados por aula, armazenamento, disponibilidade, custo por usuário e estimativas de energia/emissões.

## 12. Roadmap sugerido

| Fase | Duração | Resultado |
|---|---:|---|
| Descoberta e cocriação | 4 semanas | Pesquisa, jornadas, riscos, conteúdo piloto e métricas-base |
| Protótipo testável | 4 semanas | Fluxos de entrada, trilha, aula, progresso e carreira validados |
| MVP técnico | 10–12 semanas | Contas, CMS, PWA offline, avaliações, certificados e feedback |
| Piloto assistido | 8 semanas | 100–200 participantes, testes inclusivos e correções |
| Lançamento | 4 semanas | Operação, suporte, painel e comunicação |
| Evolução contínua | Trimestral | Novas trilhas, parcerias e planos corretivos |

## 13. Critérios de sucesso do MVP

- Um usuário consegue iniciar e concluir uma aula por teclado e leitor de tela.
- Uma aula acessada continua legível offline e o progresso sincroniza sem duplicidade.
- Conteúdo essencial funciona em tela de 320 px e aparelho de baixo desempenho.
- Cada vídeo possui alternativa acessível e opções de qualidade.
- Usuário cria e exporta currículo sem pagar.
- Relato de barreira gera protocolo e pode ser acompanhado.
- Painel institucional não expõe dados individuais ou pequenos grupos.
- Auditorias automáticas não têm violações críticas e a avaliação manual cobre todos os fluxos essenciais.

## 14. Estado atual do protótipo

A fundação funcional já inclui servidor sem dependências externas, banco SQLite, catálogo persistido, uma aula inicial por trilha, exercícios, progresso anônimo ou associado à conta, cadastro, login, sessões em cookie `HttpOnly`, feedback com protocolo, cache offline e testes de integração. Antes de produção ainda são necessários recuperação de senha, confirmação de e-mail, consentimentos, painel editorial, conteúdo completo, proteção contra abuso, HTTPS e revisão independente de segurança e acessibilidade.
