# CER — próximo bloco: fluxos autenticados na reconstrução completa

Continuação do checkpoint `b6cef36` e de `continuacao-seguranca-sem-suporte-2026-10-05.md`. Executado o bloco ali previsto: requisições autenticadas com a estrutura completa reconstruída, diário, histórico, recados, sessões, gatilhos e restauração. Não foram refeitas nem alteradas as regras salvas no painel vivo.

## Evidência entregue

`scripts/verify-authenticated-backend.py` aplica as 63 migrações do repositório, acrescenta uma migração temporária de fixtures e inicia os 52 hooks com PocketBase 0.26.1 em loopback. As fixtures usam quatro contas novas com endereços `example.invalid` e senha aleatória. Não consulta o banco vivo, não usa tokens do Skip, não chama provedor de IA. Diretório, credenciais e backup fictício são descartados ao finalizar, inclusive se ocorrer falha.

**24 cenários aprovados**, com requisições REST de usuários comuns:

- Diário criado e persistido; paciente B e profissionais vinculados ou não vinculados não conseguem ler a anotação de A.
- Edição preserva a versão anterior privada; profissional não lista o histórico; tentativa de vincular diário ao acompanhamento de B é recusada. Tentativa de mudar a classificação de acesso durante a edição é normalizada pelo hook.
- Recado em rascunho fica invisível à profissional. Aprovação carimba data e permite leitura pela vinculada; profissional sem vínculo continua bloqueada. Retirada bloqueia leitura com o token já emitido, e reaprovação é recusada.
- Sessão e nota profissional persistem. Participante não lê sessão; conclusão carimba data e bloqueia alteração da nota.
- Eventos de diário, nota, conclusão e retirada são produzidos; os marcadores textuais privados testados não aparecem nos eventos recuperados.
- Revogação de vínculo persiste e bloqueia sessão e nota com token emitido anteriormente.
- Backup do banco fictício completo é produzido, validado e extraído em outro diretório. Uma segunda execução do servidor restaura login, diário, histórico, retirada de recado e revogação de vínculo.

O ensaio também verifica ausência dos padrões ReferenceError, SyntaxError e TypeError nos logs das duas execuções. Isso não constitui verificação exaustiva de todo erro possível. A criação das fixtures ocorre antes de carregar os hooks; os fluxos de diário, mensagens e sessões são executados com os hooks carregados.

## Reprodução

```bash
CER_POCKETBASE_BINARY=/caminho/absoluto/pocketbase python scripts/verify-authenticated-backend.py
```

Binário oficial de referência exigido: versão 0.26.1. A migração temporária não é instalada nem versionada como migração de produção. O script exige confirmar a quantidade de arquivos aplicados e não aceita somente o exit code do comando de migração como evidência de sucesso.

## Limites e próximo checkpoint

Este bloco prova comportamento dos fluxos especificados na referência reconstruída. **Não homologa o runtime vivo do Skip nem comprova migração de uma base clínica.** Não houve alteração no aplicativo publicado ou no banco vivo neste bloco.

Ainda faltam testes autenticados equivalentes na instância gerenciada com contas fictícias em ambiente apropriado; exportação e recuperação de dados e arquivos do Skip; fluxos de convite completos, suspensão em todas as coleções, múltiplos vínculos simultâneos, arquivos protegidos, Linha da Vida e rotas customizadas além dos cenários já documentados. O ensaio não cobre todos os 52 hooks apenas por carregá-los.

A integração clínica de IA permanece desativada. As condições de tratamento, retenção e transferências pelo fornecedor continuam sem comprovação contratual. A liberação para dados reais não foi declarada.

Próxima ação técnica: ampliar a matriz autenticada para suspensão de contas, múltiplos vínculos e Linha da Vida antes de transportar esses ensaios ao ambiente gerenciado. As pendências externas continuam registradas no documento anterior; nenhum contato foi enviado ao fornecedor.
