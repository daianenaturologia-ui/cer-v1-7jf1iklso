# CER: avanço direto sem atendimento do fornecedor

## Mudança no ambiente vivo

Foi possível administrar as regras pelo painel já autenticado do Skip, sem ler prontuários ou extrair credenciais. As permissões amplas de `persons` e a criação pública de `users` foram confirmadas na aba Regras; deixaram de ser apenas achados no snapshot antigo.

Foram salvas diretamente:

- `persons.list` e `persons.view`: titular ativo ou profissional/admin com papel ativo e vínculo ativo ao acompanhamento correspondente.
- `persons.update`: mesmo escopo, com bloqueio de alteração do e-mail por essa rota. Não bloqueia atualização do nome quando permitida.
- `persons.create`: conta ativa com papel profissional/admin ativo.
- `users.create`: conta ativa com papel profissional/admin ativo, pessoa associada e status de convite. Listagem, leitura, atualização e exclusão de `users` não foram alteradas.

As expressões correspondem às preparadas em `0074_harden_identity_access.js`. A configuração de `persons` foi conferida novamente após recarregar o builder; a regra de convite foi conferida reabrindo o painel. A interface do fornecedor mantém o formulário anterior ao trocar somente a coleção; foi necessário desmontar/reabrir a aba para evitar salvar regras de uma coleção em outra. Não foi editado nenhum registro pessoal.

As cinco regras verificadas foram reconciliadas no snapshot versionado para evitar orientar uma futura alteração pelas permissões antigas. A data original do snapshot foi preservada; `manualRuleOverrides` identifica essa atualização parcial. Isso não constitui nova exportação das demais coleções. A versão observada nas configurações do builder foi 0.0.257; nenhum número foi alterado manualmente.

Isso NÃO significa aplicação integral da migração 0074: o índice único de vínculo pessoa/conta continua preparado apenas no código e na bancada local. Também não foram instaladas nesta operação as alterações de hooks de auditoria ou a rota nova de IA. A validação autenticada de contas A/B no ambiente vivo continua pendente; configuração persistida e teste local são evidências diferentes.

## Ensaios independentes do fornecedor

Além dos 15 cenários anteriores de identidade e backup/restauração, foi aplicado o conjunto completo de 63 arquivos de migração disponíveis em uma base local vazia. O servidor de referência PocketBase 0.26.1 iniciou com os 52 arquivos de hooks, copiados com extensão `.pb.js`. A rota de proposta de IA negou a requisição anônima com HTTP 401, sem invocação de provedor.

O procedimento é reproduzível em `scripts/verify-backend-portability.py`. Usa somente código e fixtures presentes no repositório, sem exportar o banco vivo. Escuta em loopback e descarta a bancada ao finalizar. O procedimento antigo foi corrigido para não inferir a versão do servidor pelo SDK e para usar a extensão de hooks exigida pelo PocketBase.

Limites: inicialização não comprova a execução de todos os gatilhos, autorização por requisição em todos os fluxos, integridade dos arquivos ou compatibilidade completa com o runtime gerenciado do Skip. A reconstrução prova a estrutura disponível no código; não constitui transferência de uma base clínica nem prova definitiva de operação fora do fornecedor.

## Contato direto com a API

A API viva respondeu ao health check. Foram feitas leituras anônimas com filtro deliberadamente sem correspondência e projeção apenas de identificador em quatro coleções. Nenhum registro foi retornado. Esse filtro vazio por construção não prova isolamento e não foi tratado como teste de autorização A/B. Não se reutilizaram tokens administrativos fora do navegador.

## O que ainda depende de evidência externa

As regras do app podem ser corrigidas diretamente. Já condições contratuais de tratamento, subprocessadores, retenção de IA, acesso operacional e recuperação dos backups mantidos pelo Skip não podem ser comprovadas por uma mudança de código. O app pode avançar tecnicamente sem aguardar suporte; usar dados sensíveis exige esclarecer essas condições ou homologar outra infraestrutura sob controle da proprietária.

Próximo bloco técnico: executar os fluxos autenticados completos com a estrutura real reconstruída e verificar gatilhos, diário, sessões e compartilhamento. Não copiar dados pessoais para um projeto duplicado até determinar o que essa função copia. Não cancelar a assinatura nem migrar produção com base apenas nesses ensaios.
