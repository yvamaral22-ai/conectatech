# Estúdio de Conteúdo ConectaTech

Este documento define como a administração de conteúdos deve funcionar na ConectaTech.

## Objetivo

Transformar o painel administrativo em um ambiente parecido com um LMS moderno: administradores e professores criam trilhas, publicam aulas, organizam páginas internas, registram a origem do vídeo, adicionam PDFs, materiais de apoio e acompanham alterações por auditoria.

## Estrutura Recomendada

1. Trilha: representa uma área de aprendizagem, como informática básica, segurança digital ou desenvolvimento web.
2. Aula: representa uma unidade de estudo dentro da trilha.
3. PDF: representa uma aula de leitura, exibida página por página dentro do site.
4. Páginas da aula: dividem o conteúdo em partes menores para celular, leitura offline e acessibilidade.
5. Materiais: links, PDFs, imagens, textos ou arquivos de apoio.
6. Auditoria: registra criação, edição e exclusão de conteúdos.

## Origem do Conteúdo

- Aula própria: vídeo, texto ou PDF produzido pela equipe da ConectaTech.
- YouTube: aula hospedada no YouTube, exibida por embed quando possível.
- Parceiro: conteúdo de uma instituição apoiadora, sempre com nome do parceiro e fonte oficial.
- Aula ao vivo: conteúdo associado a encontro remoto, mentoria ou transmissão.
- Texto: aula sem vídeo, priorizando baixo consumo de dados.

## Critérios de Publicação

Uma aula só deve ser publicada quando tiver:

- título claro;
- resumo curto;
- origem definida;
- conteúdo principal, vídeo ou PDF;
- pelo menos uma orientação prática;
- linguagem simples;
- transcrição ou apoio textual quando houver vídeo;
- materiais com fontes confiáveis;
- status `published`.

## Padrão Editorial

O painel aplica uma revisão automática básica antes de salvar:

- remove espaços duplicados;
- ajusta espaços antes e depois de pontuação;
- coloca letra maiúscula no início de frases;
- preserva termos técnicos e marcas como HTML, CSS, JavaScript, GitHub, Supabase, YouTube, LGPD e WCAG;
- corrige acentuações comuns do projeto, como conteúdo, currículo, informática, página, programação, segurança, usuário e vídeo.

Essa revisão automática ajuda, mas não substitui leitura humana. Antes de publicar, revise clareza, acentuação, pontuação, maiúsculas/minúsculas e padrão ABNT2 quando o texto for usado em entregas acadêmicas.

## Como Cadastrar Conteúdo

1. Escolha uma ação no painel: Trilha, Aula, PDF, Página, Material, Oportunidade, Publicação, Auditoria ou Usuários.
2. Crie ou escolha uma trilha.
3. Cadastre a aula com título, formato, origem, URL do vídeo, instrutor/parceiro, objetivos e resumo.
4. Para PDF, envie o arquivo pelo painel ou informe uma URL/caminho existente.
5. Se a aula for própria, envie o arquivo de vídeo pelo campo de upload ou informe um caminho já existente no Storage.
6. Se a aula vier do YouTube ou de parceiro, informe a URL oficial.
7. Adicione páginas internas quando o conteúdo precisar ser dividido em partes curtas.
8. Adicione materiais de apoio por link externo ou upload.
9. Marque como publicada somente depois de revisar.

## Leitura de PDF

O PDF é salvo como aula com `content_format = 'pdf'` e o caminho do arquivo em `lessons.pdf_url`.

Na visualização da aula, o arquivo é exibido por um leitor responsivo:

- uma página por vez;
- botões de página anterior e próxima;
- indicação “Página X de Y”;
- largura adaptada ao celular ou computador;
- botão para abrir o PDF em nova aba quando necessário.

## Banco de Dados

As aulas ficam em `lessons`.
As páginas internas ficam em `lesson_sections`.
Os materiais ficam em `materials`.
Arquivos próprios devem ficar no bucket `lesson-media`.
Vídeos externos podem ficar apenas como URL em `lessons.video_url`.
PDFs podem ficar no Supabase Storage ou em uma URL externa registrada em `lessons.pdf_url`.

## Segurança

Usuários com permissão `admin` ou `teacher` podem criar, editar, publicar e excluir conteúdos educacionais. Apenas `admin` pode administrar usuários e permissões. Alunos e visitantes leem apenas o que estiver publicado.

## Próximos Incrementos

- edição completa de conteúdos já cadastrados;
- editor visual com pré-visualização antes de publicar;
- rascunho, revisão e publicação em etapas;
- duplicar aulas;
- ordenar páginas por arrastar e soltar;
- histórico detalhado por aula;
- painel de desempenho por conteúdo;
- busca interna por aula, trilha, professor e tipo de material.
