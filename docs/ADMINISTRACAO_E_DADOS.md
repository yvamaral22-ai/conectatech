# Administracao, banco de dados e permissoes

## Objetivo

Depois da validacao do prototipo, a ConectaTech deve evoluir de uma PWA estatica com dados salvos no navegador para uma plataforma administravel, com banco de dados, usuarios, permissoes, conteudos editaveis, indicadores e controle operacional.

O objetivo desta etapa e garantir que o responsavel pelo projeto tenha acesso para administrar o site, acompanhar dados, alterar conteudos e controlar configuracoes importantes com seguranca.

## Estado atual

No prototipo atual:

- o progresso fica salvo no navegador por `localStorage`;
- o diagnostico inicial fica salvo apenas no aparelho;
- feedbacks ficam registrados localmente;
- trilhas, textos e oportunidades estao definidos no codigo;
- nao existe login, painel administrativo, API ou banco remoto.

Esse formato e adequado para demonstracao e validacao inicial, mas nao e suficiente para operacao real.

## Evolucao recomendada

A evolucao deve ser feita em camadas:

1. Criar backend/API para receber, validar e entregar dados.
2. Adicionar banco de dados para usuarios, trilhas, aulas, progresso, feedbacks e oportunidades.
3. Adicionar autenticacao com controle de acesso.
4. Criar painel administrativo para editar conteudos e acompanhar indicadores.
5. Aplicar regras de privacidade, auditoria e seguranca.
6. Migrar gradualmente os dados que hoje estao fixos no codigo para tabelas administraveis.

## Opcao tecnica recomendada

A escolha recomendada para a primeira versao real e usar **Supabase + PostgreSQL**, mantendo compatibilidade com a PWA atual e com uma futura evolucao para Next.js.

Essa escolha atende aos criterios definidos:

- **Seguranca:** autenticacao integrada, RLS, papeis e politicas de acesso.
- **Gratuito:** plano inicial gratuito para prototipo e piloto controlado.
- **Escalavel:** PostgreSQL e possibilidade de evoluir para backend proprio.
- **Compativel:** integra com frontend atual, Vercel, Netlify, GitHub e Next.js.

Arquivos criados para essa etapa:

- `supabase/schema.sql`: estrutura do banco e permissoes.
- `supabase/seed.sql`: dados iniciais da plataforma.
- `docs/SUPABASE_SETUP.md`: guia de configuracao.

## Dados que devem ir para o banco

Tabelas principais:

- `usuarios`: dados basicos da conta.
- `perfis`: informacoes opcionais do publico atendido.
- `preferencias_acessibilidade`: contraste, tamanho de texto e necessidades informadas.
- `diagnosticos`: objetivo, dispositivo, conexao e nivel inicial.
- `trilhas`: nome, nivel, descricao, ordem e status.
- `aulas`: conteudo, duracao, materiais, transcricoes e acessibilidade.
- `exercicios`: perguntas, alternativas e respostas corretas.
- `progresso`: aulas iniciadas, concluidas, datas e pontuacoes.
- `feedbacks`: avaliacoes, sugestoes e dificuldades.
- `relatos_barreiras`: problemas de acessibilidade informados pelos usuarios.
- `oportunidades`: vagas, bolsas, cursos, prazos e links.
- `candidaturas`: interesse do usuario em uma oportunidade.
- `certificados`: conclusoes e emissoes.
- `configuracoes_site`: textos, metas, contatos e parametros editaveis.
- `logs_auditoria`: registro de alteracoes administrativas.

## Permissoes recomendadas

Perfis de acesso:

- **Dono do projeto:** acesso total ao sistema, banco, painel, configuracoes e permissoes.
- **Administrador:** gerencia usuarios, conteudos, oportunidades, feedbacks e indicadores.
- **Editor de conteudo:** cria e altera trilhas, aulas, materiais e exercicios.
- **Mentor/orientador:** acompanha duvidas, feedbacks e orientacoes profissionais.
- **Analista de impacto:** acessa somente dados agregados e anonimizados.
- **Usuario aluno:** acessa suas trilhas, progresso, diagnostico, curriculo e feedbacks.

Permissoes sensiveis, como exclusao de dados, exportacao de relatorios e alteracao de papeis administrativos, devem ficar restritas ao dono do projeto.

## Ajustes editaveis pelo administrador

O painel deve permitir alterar:

- nome, descricao e status das trilhas;
- conteudo das aulas;
- alternativas e respostas dos exercicios;
- materiais para download;
- oportunidades em destaque;
- textos institucionais;
- metas de impacto exibidas no site;
- contatos e links externos;
- mensagens de aviso;
- perguntas do diagnostico;
- criterios de conclusao;
- parametros de acessibilidade;
- usuarios e permissoes;
- feedbacks e relatos de barreiras.

## Ajustes manuais fora da interface

Alguns ajustes podem continuar sendo feitos por arquivos ou ambiente tecnico:

- variaveis de ambiente, como URL da API e chaves de servico;
- regras de cache da PWA;
- politicas de seguranca;
- migracoes do banco;
- scripts de backup;
- configuracoes de hospedagem;
- controle de versao pelo Git.

Mesmo nesses casos, o dono do projeto deve ter acesso documentado e permissao para administrar tudo.

## Seguranca e privacidade

Como o projeto lida com dados de publico vulneravel, a administracao precisa seguir boas praticas:

- usar HTTPS;
- proteger senhas com hash forte;
- aplicar controle de acesso por perfil;
- registrar alteracoes administrativas em logs;
- limitar exportacao de dados pessoais;
- separar dados pessoais de indicadores agregados;
- permitir correcao e exclusao de dados conforme LGPD;
- fazer backups periodicos;
- evitar venda de dados ou publicidade invasiva;
- exibir relatorios publicos apenas com dados anonimizados.

## Painel administrativo minimo

Para uma primeira versao, o painel deve ter:

1. Visao geral com usuarios, conclusoes, feedbacks e uso offline.
2. Cadastro e edicao de trilhas.
3. Cadastro e edicao de aulas.
4. Cadastro e edicao de oportunidades.
5. Consulta de feedbacks e relatos de barreiras.
6. Lista de usuarios com papeis e status.
7. Exportacao de relatorios agregados.
8. Configuracoes gerais do site.

## Ordem sugerida de implementacao

1. Definir a tecnologia do backend e banco.
2. Criar o esquema inicial do banco.
3. Criar autenticacao e papeis de usuario.
4. Migrar trilhas e aulas do `app.js` para o banco.
5. Salvar diagnostico, progresso e feedback remotamente.
6. Criar painel administrativo protegido.
7. Adicionar logs de auditoria e backups.
8. Criar relatorios agregados de impacto.

## Resultado esperado

Ao final dessa etapa, a ConectaTech deixara de ser apenas um prototipo local e passara a ter uma base administravel, com dados reais, conteudos editaveis, permissoes por perfil e controle completo pelo responsavel do projeto.
