# CER — segurança, privacidade e independência

Atualização posterior: cinco regras de identidade foram aplicadas diretamente no painel vivo, sem atendimento do suporte. A reconstrução de todas as migrações e inicialização dos hooks também foram verificadas localmente. Ver `continuacao-seguranca-sem-suporte-2026-10-05.md` para o alcance exato; o estado abaixo descreve a etapa inicial e não representa mais ausência total de aplicação.

Revisão de 05/10/2026. Escopo: código disponível, snapshot de permissões de 01/10/2026, metadados do painel Skip e documentação pública. Não é certificação LGPD, teste de invasão, parecer jurídico ou auditoria exaustiva do ambiente em produção. Não foram consultados prontuários, enviados dados clínicos a IA, ativados serviços pagos ou alterados segredos. As correções abaixo estão preparadas no código; não foram instaladas no servidor vivo.

## Resultado e prioridade

Não considerar concluída a preparação para dados reais. A prioridade é testar isolamento entre pacientes e profissionais no backend real, esclarecer operadores/contratos e estabelecer direitos, retenção e recuperação de dados. A aparência de confiança precisa corresponder a controles verificados.

| Achado | Evidência | Correção ou próximo passo |
| --- | --- | --- |
| Leitura ampla de cadastros pessoais | Snapshot permite listar/ver pessoas para qualquer conta ativa | Migração 0074 preparada para restringir ao próprio titular ou profissional com vínculo ativo; validar parser e associação no servidor |
| Criação pública de usuários | Regra `users.create` vazia no snapshot | Migração preparada para limitar a profissionais ativos e status de convite; testar também associação indevida a cadastro existente |
| Texto sensível em auditoria | Motivo livre de retirada de consentimento era duplicado no log | Hook passa a registrar somente presença do motivo; registros anteriores não foram alterados |
| IA sem revisão operacional concluída | Adapter externo preparado anteriormente | Nova trava de processamento e verificação da conta ativa; nenhuma ativação |
| MFA não implementado | Estado explícito no contexto de autenticação | Implementar e testar proteção reforçada para profissionais e administração |
| Política geral e exercício de direitos incompletos | Não localizada política geral com controlador, contato e fluxo de solicitações nas telas examinadas | Definir informações reais e publicar política/fluxo antes do piloto clínico |
| Backups e criptografia de infraestrutura não verificados | Código frontend não comprova esses controles | Confirmar com o operador e testar restauração isolada |

O snapshot contém 70 coleções; o painel vivo mostrou 74. Portanto o arquivo exportado não prova as permissões atualmente aplicadas. No PocketBase, superusuários ignoram regras de coleção: uma informação “privada” na interface não significa inacessível à administração técnica.

## Correções entregues neste bloco

- `0074_harden_identity_access.js`: restrições de identidade preparadas. O teste simula a migração e inspeciona as regras; não valida a execução do filtro pelo PocketBase. A reversão recusa restaurar automaticamente permissões amplas.
- `on_consent_lifecycle.js`: remove a cópia do motivo de retirada do evento de auditoria. O motivo continua na sua fonte original, sujeito à política de acesso e retenção.
- `on_session_ai_proposal.js`: conta suspensa é recusada antes e depois do processamento; `CER_SESSION_AI_PROCESSING_APPROVED` é exigida adicionalmente à habilitação técnica. A flag administrativa não substitui obrigações perante o titular.
- `audit-security-inventory.mjs`: inventário local das regras exportadas e busca heurística de padrões de segredo em arquivos rastreados. Não encontrou os padrões pesquisados; não cobre histórico Git, todos os tipos de credencial ou infraestrutura.
- Testes simulados: 29 aprovados em três arquivos direcionados; a bateria completa de sessões/mapa aprovou 56 testes em dez arquivos. Typecheck do app, lint dos arquivos TypeScript alterados e build aprovados, com avisos preexistentes de chunks e imports dinâmicos. Não houve rede nos testes de IA, e seu conteúdo é fictício. A autorização no servidor real continua pendente.

Não instalar a migração diretamente em produção. Primeiro identificar a versão do runtime, obter backup restaurável e verificar em ambiente isolado: titular A não lê/altera B; profissional sem vínculo não lê B; vínculo revogado bloqueia imediatamente; profissional vinculado acessa somente o necessário; conta suspensa não processa IA; convite não permite escolher cadastro alheio nem autoelevar papel; arquivos, histórico e rotas customizadas respeitam o mesmo isolamento. Conferir também troca de conta e respostas tardias no frontend. Algumas dessas verificações exigem ajustes adicionais, especialmente o fluxo de convite.

## IA nativa do Skip

O painel oferece a área **Agentes**, atualmente sem agente criado. Foram observados 51 APIs/gatilhos, incluindo a atualização manual do mapa por sessão. A rota nova de proposta por IA não consta nesse inventário. O arquivo `src/lib/skipAi.ts` contém auxiliares de transporte para `$ai.chat` e `$ai.agent`, mas isso não comprova uma integração em uso: não foi encontrado um chamador no fluxo clínico examinado. O adapter determinístico existente também não prova geração por modelo.

A investigação seguinte localizou a Central de Ajuda oficial da Adapta. A nota de atualização de maio informa que os Micro-Agents consomem créditos da organização, sem configurar LLM externa. Isso confirma uma alternativa à contratação de API separada, mas não informa uma tarifa de inferência aplicável ao CER. O formulário observado oferece Fast e Reasoning, sem identificar o modelo subjacente; foi fechado sem criar agente. Subprocessadores, retenção, treinamento e efeitos do cancelamento ainda precisam de confirmação contratual.

O guia oficial informa hospedagem em AWS nos EUA, criptografia em disco e backups operacionais restaurados pelo suporte; permite exportação de tabelas via API, sem exportação integral/restauração self-service. Também recomenda avaliação com suporte para dados sensíveis. São declarações do fornecedor, não testes da instância CER. A localização fora do Brasil demanda avaliar o mecanismo de transferência aplicável; não significa automaticamente proibição pela LGPD.

Antes de escolher provedor: confirmar por escrito essas condições, obter contrato de processamento e avaliar transferências internacionais. Em seguida criar uma prova técnica somente com notas fictícias. Preservar autorização por sessão, minimização de fontes, revisão humana e publicação explícita do mapa. Um agente conversacional genérico não deve ganhar acesso irrestrito às coleções.

Não é necessário contratar uma API OpenAI agora. A integração anterior é uma opção técnica desativada. Existe inferência nativa debitada em créditos, mas ainda não se comprovou o custo do fluxo pretendido nem a possibilidade de transportar o agente para outra hospedagem.

## Propriedade e manutenção

O frontend React/Vite e os hooks/migrações disponíveis estão versionados no repositório da proprietária. Isso facilita manutenção por outra equipe e exportação; a titularidade jurídica depende também dos termos contratados e licenças. Ter o código não equivale a ter uma cópia operacional de todo o serviço.

Para provar saída do Skip: exportar banco e arquivos com procedimento protegido, preservar identidades/autenticação conforme suporte do fornecedor, reproduzir permissões e hooks num servidor independente compatível e testar login, convite, mapa, linha da vida, prontuário, compartilhamento, backup e restauração. Credenciais permanecem fora do GitHub. Uma eventual IA `$ai` do Skip precisará de adapter substituível. Somente depois de homologar esse ambiente é possível planejar cancelamento com segurança.

Operar fora do Skip ainda exige hospedagem, armazenamento, backups, monitoramento, atualizações e manutenção; IA pode acrescentar consumo. Não foram cotados nem contratados esses serviços. Não há confirmação de que o app continuará hospedado após cancelamento da assinatura.

## Normas e experiência de confiança

A LGPD trata dados de saúde como sensíveis. É necessário definir finalidade e base legal por tratamento, informação ao titular, direitos, segurança e retenção com suas exceções legais. Consentimento genérico não resolve todos esses pontos. Avaliar também as regras profissionais e a classificação regulatória conforme as funções e alegações efetivamente oferecidas pelo CER, sem presumir enquadramento.

Pendências concretas: identificar controlador e canal de privacidade; mapear operadores e destinatários; documentar processamento por IA e transferências; estabelecer prazos por categoria, inclusive backups e logs; atender acesso/correção e demais direitos; definir resposta a incidentes segundo a regulamentação aplicável; treinar administradores e limitar privilégios; comprovar restauração. As regras atuais que bloqueiam exclusão não justificam retenção indefinida por si só.

Na interface, publicar informações confirmadas: quem consegue acessar cada conteúdo, diferença entre diário e mapa compartilhado, quando a IA será usada, como revisar/solicitar correção e onde exercer direitos. Explicar o caráter evolutivo do Mapa CER e a revisão profissional. Evitar promessas como “100% seguro”, “ninguém mais pode ver” ou “dados nunca saem do app” sem evidência. A política definitiva depende de dados reais do controlador e dos contratos; não foi inventada nem publicada nesta entrega.

## Referências primárias

- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Orientações ANPD: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte
- Incidentes: https://www.gov.br/anpd/pt-br/assuntos/incidente-de-seguranca
- Transferências internacionais, Resolução 19: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024
- Regras PocketBase: https://pocketbase.io/docs/api-rules-and-filters/
- Skip: https://goskip.dev/ e https://docs.goskip.dev/

Referências não comprovam a configuração ou o contrato particular do CER. Relatório sem dados de pacientes e sem valores de credenciais.

## Continuação: ensaio executado com servidor local real

Foi baixado o binário oficial PocketBase 0.26.1, versão fixada pela bancada já existente no projeto; isso não identifica a versão nem a implementação do Skip Cloud. `scripts/verify-identity-access.mjs` cria somente uma estrutura mínima de identidade (cinco coleções), aplica a migração 0074, gera contas fictícias e testa requisições REST com tokens de usuários comuns. A credencial de superusuário local serve somente para preparar/verificar fixtures e produzir o backup. Todos os processos escutam exclusivamente em loopback, e os diretórios gerados são descartados ao finalizar.

O primeiro ensaio encontrou bloqueio indevido à edição do próprio cadastro na condição de e-mail. A condição foi corrigida para permitir omissão ou manutenção do e-mail e impedir sua troca por essa rota. Foi acrescentado índice único de vinculação pessoa/conta para bloquear um segundo convite ao cadastro já reivindicado. Em uma base existente, duplicidades devem ser revisadas antes da aplicação; a migração não apaga nem mescla cadastros.

Resultado final: 15 cenários aprovados, incluindo isolamento A/B por listagem, leitura e alteração; escopo entre profissionais com vínculos distintos; conta suspensa; correção legítima; criação de contas e convites; bloqueio de duplicidade; revogação e suspensão com token previamente emitido. O ensaio também criou backup pelo servidor, extraiu esse arquivo numa segunda instância local e confirmou login e isolamento após restauração. Os dois testes simulados de auditoria/migração foram reexecutados e aprovados.

Limite: esse ensaio NÃO testou o backend vivo do Skip, o conjunto completo de migrações/hooks, arquivos clínicos, MFA ou todas as coleções do CER. No painel atual não foi identificado um ambiente de homologação separado nem uma ferramenta de recuperação integral self-service. Não foram criadas contas no banco vivo nem efetuadas alterações de permissões nele. Portanto o teste autenticado no Skip e a saída completa da plataforma continuam bloqueados pela falta desse ambiente/procedimento; não basta validar no frontend em demonstração.

Referências adicionais localizadas nesta continuação:
- https://adaptaorg.zendesk.com/hc/pt-br/articles/50834940639131-16-04-08-05-2026
- https://adaptaorg.zendesk.com/hc/pt-br/articles/50834905374619-Dominando-o-Skip-Cloud-Banco-de-Dados-e-Autentica%C3%A7%C3%A3o

As perguntas contratuais e operacionais estão em `perguntas-skip-seguranca-2026-10-05.md`. Nenhuma solicitação foi enviada ao fornecedor.
