# Plano de validação

## Checklist acadêmico da experiência prática

- [x] Definição clara do problema e mapeamento assertivo do público-alvo afetado pelas desigualdades digitais.
- [x] Apresentação estruturada da solução tecnológica e formulação de uma proposta de valor diferencial.
- [x] Aplicação detalhada dos princípios de inclusão e acessibilidade digital, contemplando as diretrizes WCAG.
- [x] Estabelecimento de métricas lógicas para avaliar a projeção de impacto social esperado.
- [x] Definição consistente dos parâmetros organizacionais de sustentabilidade financeira e ambiental do projeto.
- [x] Consolidação de todas as partes do Canvas no relatório/resumo executivo.
- [x] Criação finalizada de uma postagem persuasiva voltada para a rede corporativa LinkedIn.

## Checklist manual do protótipo

- [ ] Navegar por toda a página usando apenas Tab, Shift+Tab, Enter, Espaço e Esc.
- [ ] Confirmar foco visível e ordem lógica em menu, filtros, cartões e modal.
- [ ] Testar ampliação do navegador em 200% e viewport de 320 × 568 px.
- [ ] Verificar contraste normal e modo de alto contraste.
- [ ] Confirmar hierarquia de títulos, regiões e nomes acessíveis no leitor de tela.
- [ ] Alternar filtros e confirmar atualização compreensível dos cartões.
- [ ] Preencher o diagnóstico inicial e confirmar recomendação de trilha.
- [ ] Abrir uma aula, responder o exercício e confirmar mensagem de correção.
- [ ] Iniciar uma trilha, recarregar e confirmar persistência do progresso.
- [ ] Enviar feedback da aula e confirmar mensagem de registro local.
- [ ] Instalar a PWA, abrir uma vez online e recarregar sem rede.
- [ ] Confirmar aviso offline e acesso ao conteúdo previamente armazenado.
- [ ] Ativar preferência de movimento reduzido no sistema.

## Matriz mínima antes do piloto

| Cenário | Cobertura |
|---|---|
| Leitor de tela | NVDA + Firefox/Chrome; TalkBack + Chrome; VoiceOver + Safari |
| Teclado | Todos os fluxos essenciais, sem mouse |
| Mobile | Android de entrada, tela pequena e pouca memória; iPhone suportado |
| Navegadores | Chrome, Firefox, Edge e Safari em versões atuais e anteriores definidas pela análise do público |
| Conexão | Offline, 2G/3G simulado, alta latência e interrupção durante exercício |
| Cognição | Linguagem simples, compreensão de instruções, erros e retomada |
| Motricidade | Alvos, espaçamento, orientação e ausência de gestos obrigatórios |
| Visão | Zoom, reflow, contraste, cores, leitor de tela e modo escuro quando implementado |
| Audição | Legenda, transcrição, identificação de sons e controle de mídia |

## Ferramentas automatizadas sugeridas

- axe-core ou axe DevTools para regras WCAG;
- Lighthouse para acessibilidade, desempenho e PWA;
- Playwright para fluxos, teclado e viewports;
- HTML Validator para estrutura;
- testes unitários para progresso, sincronização e regras de certificado.

Automação não substitui avaliação humana. Nenhum selo automatizado equivale, sozinho, à conformidade WCAG.

## Critérios de liberação

- Zero erro crítico ou bloqueador de acessibilidade nos fluxos essenciais.
- Todos os defeitos graves corrigidos ou com mitigação aceita pelo conselho de acessibilidade.
- Progresso preservado após perda e retorno da conexão.
- Conteúdo principal disponível mesmo quando scripts não essenciais falharem.
- Termos, consentimentos, direitos da LGPD e retenção revisados por profissional qualificado.
- Teste com participantes representativos concluído, remunerado e documentado.
