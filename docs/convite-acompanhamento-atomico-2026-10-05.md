# CER — convite e acompanhamento em uma transação

Continuação do commit remoto `4a3ffd8`. Esta etapa modifica o código do convite e valida a referência isolada. Não instala mudanças no Skip vivo nem envia convites por e-mail.

## Mudança

O serviço frontend `createEnrollmentWithInteragente` realizava seis operações separadas, atribuía papel antes de existir acompanhamento e ocultava falhas de concessão profissional. A senha padrão era gerada com Math.random. Agora usa uma única rota autenticada `/backend/v1/cer/invite-participant`.

A rota cria pessoa, conta convidada, acompanhamento, vínculo profissional, papel, estado inicial e auditoria em uma transação. Valida conta/papel ativos e produto ativo, atribui o vínculo à profissional autenticada e não permite usar outra profissional no payload. A senha provisória padrão é gerada no servidor por `$security.randomString(24)`, não registrada na auditoria e retornada somente na criação inicial. O e-mail não é marcado como verificado sem verificação.

Repetição pelo mesmo profissional para o mesmo produto/acompanhamento ativo reutiliza o registro, preserva a credencial e não retorna outra senha. Cadastro já existente só é reutilizado quando está no escopo ativo do ator e tem papel de interagente ativo e identidade consistente. Conta suspensa, cadastro fora de escopo e pessoa existente sem conta exigem revisão administrativa; não são vinculados silenciosamente.

A migração 0077 bloqueia criação direta de contas por clientes comuns. Precisa ser instalada junto à nova rota e ao chamador frontend após homologação; não instalar só a migração. Não foi bloqueada a preparação interna/privilegiada de fixtures.

Os guards de papel foram movidos para eventos de requisição, que transportam autenticação do ator. Exigem conta ativa e consultam o vínculo correspondente ao ator, sem usar somente o primeiro vínculo do acompanhamento. Mantêm bloqueio de autoatribuição/promoção e de transferência de papel. A transação autorizada cria o papel internamente; chamadas REST comuns continuam passando pelo guard.

Na tela de conclusão, acompanhamento reutilizado informa que o acesso foi preservado; não exibe senha vazia ou botão para copiar credenciais inexistentes.

## Validação

**86 cenários REST aprovados** no PocketBase 0.26.1 com todas as migrações e hooks do repositório, contas fictícias e loopback. Inclui os 68 anteriores e os novos casos de criação, repetição, escopo, suspensão, papel e primeiro acesso.

Foi acrescentado um hook de falha exclusivamente na bancada descartável: ele recusa o estado de jornada para um e-mail fictício específico na última etapa da transação. O teste confirma que a requisição falha e que as contagens de pessoa, conta, acompanhamento, papel, vínculo e jornada permanecem iguais às anteriores. Esse hook não faz parte dos hooks do produto.

Confirmados: ausência de convite anônimo/pela participante; recusa de produto inválido, e-mail inválido, senha curta e profissional diferente; convite persistido com conta invited, papel e vínculo corretos; conta convidada consegue ativar e ler seu acompanhamento; repetição sem duplicação; outra profissional não reivindica o cadastro; suspensão bloqueia convite com token anterior; cliente não contorna a rota criando conta diretamente; profissional não promove participante a admin; manutenção de papel permitida somente no escopo apropriado; senha provisória ausente da auditoria recuperada.

Typecheck real do aplicativo e build de produção passaram. Build conserva avisos de chunks/imports já existentes. Não houve publicação no Skip. Não foram efetuadas chamadas ao backend vivo, envio de e-mail ou leitura de pacientes nos ensaios.

## Instalação pendente

A nova rota, o guard de papéis, a migração 0077 e o frontend precisam de instalação coordenada no runtime gerenciado, com backup/restauração verificáveis e homologação. Sincronização GitHub não prova instalação de hooks/migrações. As correções 0075/0076 também continuam pendentes no ambiente vivo conforme os registros anteriores.

O ensaio valida a referência reconstruída, não equivalência com Skip Cloud ou conformidade integral. Reutilização de uma identidade que não esteja no escopo não é automatizada; transferência entre profissionais continua exigindo um fluxo legítimo separado. Não há disparo de e-mail, entrega de credencial ou contratação de serviço neste bloco. A IA clínica continua desligada.
