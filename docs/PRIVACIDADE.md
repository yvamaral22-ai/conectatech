# Privacidade e proteção de dados

Versão do aviso: **2026-08-28**.

## Dados e finalidades

- Conta: nome, e-mail e senha protegida por hash, usados para autenticação e sincronização.
- Progresso: trilhas iniciadas/concluídas, usado para continuar os estudos.
- Feedback: categoria, mensagem e data, usado para atendimento e correção de barreiras.
- Indicadores de impacto: uso opcional, condicionado a consentimento separado e revogável. Relatórios devem usar apenas grupos agregados e suprimir grupos pequenos.

Não vendemos dados pessoais. O serviço não deve inferir atributos sensíveis nem usá-los para excluir oportunidades.

## Controles implementados neste projeto

- aceite versionado do aviso no cadastro e consentimento opcional separado para indicadores;
- consulta e download dos dados pessoais pela interface;
- revogação do consentimento opcional;
- eliminação autenticada da conta, sessões, progresso, consentimentos e feedback;
- senhas com PBKDF2, tokens de sessão armazenados somente como hash e cookies `HttpOnly`/`SameSite=Strict`;
- limite de cinco tentativas de login em quinze minutos;
- cabeçalhos de segurança, proteção das requisições mutáveis e auditoria com ator pseudonimizado;
- expurgo de feedback após 365 dias e de auditoria após 730 dias. Os prazos podem ser configurados por `CONECTATECH_FEEDBACK_RETENTION_DAYS` e `CONECTATECH_AUDIT_RETENTION_DAYS`.

## Exigências para produção

Este servidor local não substitui uma infraestrutura de produção. A implantação deve usar HTTPS, definir `CONECTATECH_COOKIE_SECURE=1`, criptografar banco e backups em repouso, restringir acessos administrativos por menor privilégio, testar restaurações, manter plano de incidentes e revisar periodicamente acessos e prazos legais. Relatórios agregados devem impor tamanho mínimo de grupo e supressão contra reidentificação antes de serem disponibilizados.

Pedidos de correção que ainda não estejam automatizados devem ser encaminhados ao canal de privacidade definido pela organização responsável antes da publicação do serviço.
