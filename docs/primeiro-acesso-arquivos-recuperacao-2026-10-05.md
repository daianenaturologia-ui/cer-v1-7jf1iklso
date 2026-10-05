# CER — primeiro acesso, recuperação de conta e arquivos protegidos

Continuação do checkpoint remoto `ebb87cf`. Foram examinadas as telas do projeto CER V1 no Skip Cloud, sem editar registros, credenciais ou permissões. A lista carregada exibiu 51 APIs/gatilhos, incluindo `on_user_status_guard` e `on_reset_access` com data de 11/09/2026. Não foi localizado nas telas de banco/configurações examinadas um ambiente separado de homologação ou um mecanismo para comprovar backup e restauração integral. A opção de duplicação descreve cópia completa; não foi acionada porque seu alcance sobre dados pessoais não foi comprovado.

Isso não prova inexistência de backups do fornecedor. Significa que falta evidência utilizável para a instalação/recuperação neste projeto. Não foram instaladas as migrações 0075/0076 nem os novos hooks no banco vivo. Sincronizar arquivos do GitHub não deve ser confundido com aplicar migrações no backend.

## Verificação independente e correções

A matriz REST de referência foi ampliada para **68 cenários aprovados**, com 65 migrações do produto, uma migração temporária de fixtures, 52 hooks e PocketBase 0.26.1 em loopback.

Problemas reproduzidos na referência:

- `on_reset_access` consultava o primeiro vínculo do acompanhamento, recusando a colaboradora ativa quando outro vínculo encontrado antes estava revogado. Agora consulta especificamente o vínculo ativo da profissional solicitante.
- A rota de redefinição não exigia conta ativa do ator, permitindo chamada por profissional suspensa com papel ainda ativo. Foi acrescentada essa exigência. Também foi bloqueada a reativação de participante suspensa/desabilitada por esse mecanismo; redefinição não substitui decisão administrativa de reativação.
- O campo de arquivo era protegido, mas a regra de leitura da coleção não exigia conta ativa. Uma profissional suspensa conseguia baixar o arquivo fictício com token de arquivo emitido anteriormente. A migração 0076 acrescenta status ativo às operações existentes de `cer_practice_version_assets`, mantendo o campo protegido e a política de biblioteca existente.

As correções foram executadas/testadas no código reconstruído. Não são alegações de exploração ou falha demonstrada na instância viva do Skip.

## Evidências adicionais

- Profissional revogada, participante e chamada anônima não redefinem acesso alheio; colaboradora ativa consegue fazê-lo no escopo adequado.
- Redefinição persiste `invited`, invalida a senha anterior e impede acesso ao diário enquanto convidada.
- Primeiro acesso recusa senha curta e confirmação divergente; ativa somente a própria conta, mesmo com alvo diferente no payload; conta ativa não repete a ativação.
- Eventos de redefinição e primeiro acesso estão presentes, sem senha original ou temporária nas entradas recuperadas da auditoria fictícia.
- Arquivo fictício é enviado à bancada por multipart. Sem token ou com token de participante não destinatária, o download é negado. Profissional ativa da biblioteca baixa os bytes esperados; a suspensa com token anterior não baixa.
- Backup/restauração preserva arquivo e conteúdo, bloqueio de download anônimo, diário, histórico, autenticação, privacidade da Linha da Vida e revogação.

Dados, senhas e tokens de bancada são gerados em execução, não registrados no repositório nem enviados ao Skip. Os processos e arquivos temporários são descartados ao terminar.

## Reprodução

```bash
CER_POCKETBASE_BINARY=/caminho/absoluto/pocketbase python scripts/verify-authenticated-backend.py
```

Também foi verificada a sintaxe do hook e da migração com `node --check`. Não houve alteração de frontend nesta etapa.

## Próximo checkpoint e limites

A criação inicial do convite e do acompanhamento no frontend não foi homologada ponta a ponta neste bloco. A ordem atual de criação de papel antes do acompanhamento deve ser verificada em ambiente separado, assim como reutilização de cadastro e associação indevida de convite. O ensaio de redefinição/primeiro acesso não equivale à aprovação desse fluxo inteiro.

A matriz não cobre todos os recursos sensíveis, todas as coleções, a revogação de cada indicação/atribuição de prática, nem o armazenamento gerenciado real. Não certifica conformidade, MFA, criptografia de infraestrutura ou contrato com operadores. A IA clínica permanece desligada.

O próximo passo de instalação continua condicionado à identificação do runtime gerenciado e à recuperação comprovada de seu banco/arquivos. Enquanto isso, pode-se ampliar testes isolados da criação de convite, papéis e acompanhamento; não copiar a base clínica para projeto duplicado sem conhecer o que é copiado. Nenhum pedido foi enviado ao suporte.
