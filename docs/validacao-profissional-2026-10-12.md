# Validação independente e leitura profissional — 12/10/2026

Base: app 0.0.350. A checagem `node scripts/check-executor-modules.mjs` passou no Node 24.19.0. A suíte de questionários passou com 214 testes antes deste complemento. Typecheck da aplicação e build Vite também passaram. O bloqueio de testes mutáveis foi exercitado sem rede: loopback com autorização permitido, servidor remoto com autorização recusado, loopback sem autorização recusado. Isso não certifica o servidor gerenciado nem os jobs antigos completos.

## Falha encontrada após a auditoria inicial

`ProfessionalExperienceManager` mantinha respostas da experiência anterior caso a próxima consulta falhasse. Também não invalidava requisições ao trocar matrícula ou fechar a janela. O estado de erro era confundido com ausência de respostas. O renderizador genérico mostrava o objeto estruturado integralmente, inclusive `private_text` legado sem consentimento quando presente em registro compartilhado.

## Correção

- Limpar dados ao iniciar leitura e ao trocar matrícula; ignorar resultados de requisições já substituídas ou de janelas fechadas.
- Exibir erro explícito e ação para tentar novamente, tanto na listagem como na janela de respostas.
- Na visão profissional, exibir somente registros finalizados (`saved`/`revised`), explicitamente compartilhados e pertencentes à matrícula atual.
- Remover `private_text`, `free_text` estruturado e reflexão livre de registros com indicação de texto privado sem consentimento explícito. A tela não informa uma contagem de registros privados inacessíveis.

## Validação

Quatro regressões de componente usam mocks locais sem requisições de rede: isolamento e classificação de registros, texto legado sem consentimento, falha após outra experiência com recuperação, resposta atrasada após troca de matrícula, e distinção entre listagem vazia e falha. Suíte total: 218 testes em 19 arquivos. Typecheck passou. Nenhum registro ou regra do backend foi modificado.

## Limites

Esta é uma defesa de apresentação. O modelo legado de `privacy_split` ainda pode guardar texto privado dentro de `structured_value` de um registro compartilhado; ocultar na tela não constitui segregação no servidor. Revisar esse contrato antes de ativar prompts legados com esse recurso no piloto. As dimensões usam rascunhos `participant_private` e conclusões `shared_care`; a separação no runtime e o comportamento real da conta profissional ainda exigem validação do piloto. Backup e restauração gerenciados permanecem pendentes com o provedor. Não houve publicação em produção.
