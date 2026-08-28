# Rastreabilidade de decisoes

Este documento conecta problema, recurso e resultado esperado. A ideia e deixar claro por que cada parte da ConectaTech existe.

| Barreira identificada | Recurso da plataforma | Como resolve |
|---|---|---|
| Internet instavel ou cara | PWA, cache e materiais salvos | Reduz dependencia de conexao constante e evita baixar o mesmo conteudo varias vezes. |
| Uso predominante de celular | Layout responsivo e aulas curtas | Permite estudar em telas pequenas e em intervalos breves. |
| Falta de computador proprio | Ferramentas web sem instalacao pesada | Evita depender de maquina moderna ou software pago. |
| Baixa familiaridade digital | Linguagem simples, trilhas iniciais e diagnostico | Diminui a barreira de entrada e recomenda um caminho adequado ao momento do usuario. |
| Alto custo de cursos | Conteudos gratuitos e acesso aberto ao catalogo | Amplia acesso a capacitacao sem pagamento inicial. |
| Barreiras para pessoas com deficiencia | Contraste, teclado, textos alternativos, legendas e leitores de tela | Torna os fluxos perceptiveis, operaveis, compreensiveis e robustos. |
| Falta de orientacao profissional | Areas de carreira, curriculo, portfolio e oportunidades | Conecta aprendizagem com passos concretos para buscar trabalho ou cursos avancados. |
| Perda de continuidade nos estudos | Perfil, progresso, historico e conteudos salvos | Ajuda o usuario a retomar de onde parou e organizar prioridades. |
| Risco de exposicao de dados pessoais | Login, RLS, privacidade do perfil e dados agregados | Protege informacoes individuais e evita expor dados sensiveis no front-end. |
| Conteudo desatualizado ou fixo no codigo | Painel administrativo conectado ao Supabase | Permite cadastrar, publicar e remover trilhas, aulas e oportunidades sem alterar arquivos. |
| Falta de controle do projeto | Permissao `admin`, SQL documentado e Supabase Studio | Garante administracao manual e por interface, com rastreio tecnico das mudancas. |

## Relato curto do projeto

Problema: jovens e pessoas em situacao de vulnerabilidade enfrentam barreiras de acesso a capacitacao digital e oportunidades de tecnologia.

Hipotese: uma plataforma leve, gratuita, acessivel e conectada a orientacao profissional pode reduzir parte dessas barreiras.

Solucao: a ConectaTech combina trilhas, aulas, progresso, perfil, curriculo, portfolio, oportunidades e painel administrativo em uma PWA integrada ao Supabase.

Resultado esperado: mais autonomia digital, melhor preparacao profissional, acompanhamento de impacto e uma base tecnica capaz de evoluir para operacao real.
