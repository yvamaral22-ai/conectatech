# Estudio de Conteudo ConectaTech

Este documento define como a administracao de conteudos deve funcionar na ConectaTech.

## Objetivo

Transformar o painel administrativo em um ambiente parecido com um LMS moderno: administradores e professores criam trilhas, publicam aulas, organizam paginas internas, registram a origem do video, adicionam materiais e acompanham alteracoes por auditoria.

## Estrutura Recomendada

1. Trilha: representa uma area de aprendizagem, como informatica basica, seguranca digital ou desenvolvimento web.
2. Aula: representa uma unidade de estudo dentro da trilha.
3. Paginas da aula: dividem o conteudo em partes menores para celular, leitura offline e acessibilidade.
4. Materiais: links, PDFs, imagens, textos ou arquivos de apoio.
5. Auditoria: registra criacao, edicao e exclusao de conteudos.

## Origem Do Conteudo

- Aula propria: video ou texto produzido pela equipe da ConectaTech.
- YouTube: aula hospedada no YouTube, exibida por embed quando possivel.
- Parceiro: conteudo de uma instituicao apoiadora, sempre com nome do parceiro e fonte oficial.
- Aula ao vivo: conteudo associado a encontro remoto, mentoria ou transmissao.
- Texto: aula sem video, priorizando baixo consumo de dados.

## Criterios De Publicacao

Uma aula so deve ser publicada quando tiver:

- titulo claro;
- resumo curto;
- origem definida;
- conteudo principal ou video;
- pelo menos uma orientacao pratica;
- linguagem simples;
- transcricao ou apoio textual quando houver video;
- materiais com fontes confiaveis;
- status `published`.

## Padrao Editorial

O painel aplica uma revisao automatica basica antes de salvar:

- remove espacos duplicados;
- ajusta espacos antes e depois de pontuacao;
- coloca letra maiuscula no inicio de frases;
- preserva termos tecnicos e marcas como HTML, CSS, JavaScript, GitHub, Supabase, YouTube, LGPD e WCAG;
- corrige acentuacoes comuns do projeto, como conteúdo, currículo, informática, página, programação, segurança, usuário e vídeo.

Essa revisao automatica ajuda, mas nao substitui leitura humana. Antes de publicar, revise clareza, acentuacao, pontuacao, maiusculas/minusculas e padrao ABNT2 quando o texto for usado em entregas academicas.

## Como Cadastrar Uma Aula

1. Crie ou escolha uma trilha.
2. Cadastre a aula com titulo, formato, origem, URL do video, instrutor/parceiro, objetivos e resumo.
3. Se a aula for propria, envie o arquivo de video pelo campo de upload ou informe um caminho ja existente no Storage.
4. Se a aula vier do YouTube ou de parceiro, informe a URL oficial.
5. Adicione paginas na area "Paginas e materiais".
6. Adicione materiais de apoio por link externo ou upload.
7. Marque como publicada somente depois de revisar.

## Banco De Dados

As aulas ficam em `lessons`.
As paginas internas ficam em `lesson_sections`.
Os materiais ficam em `materials`.
Arquivos proprios devem ficar no bucket `lesson-media`.
Videos externos podem ficar apenas como URL em `lessons.video_url`.

## Seguranca

Usuarios com permissao `admin` ou `teacher` podem criar, editar, publicar e excluir conteudos educacionais. Apenas `admin` pode administrar usuarios e permissoes. Alunos e visitantes leem apenas o que estiver publicado.

## Proximos Incrementos

- editor visual com pre-visualizacao antes de publicar;
- upload direto para o Supabase Storage pelo painel;
- rascunho, revisao e publicacao em etapas;
- duplicar aulas;
- ordenar paginas por arrastar e soltar;
- historico detalhado por aula;
- painel de desempenho por conteudo.
