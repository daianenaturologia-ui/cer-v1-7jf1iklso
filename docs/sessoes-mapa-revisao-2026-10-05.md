# Sessões e atualização revisada do mapa — 05/10/2026

Bloco preparatório para análise longitudinal do prontuário. Não representa análise por IA concluída.

Achado: src/services/aiProviderAdapter.ts implementa CerModelAdapter com respostas determinísticas e textos fixos. Nenhum provedor LLM, rota autenticada de análise de prontuário ou configuração de modelo foi encontrado. Não renomear esse comportamento como análise real de IA. A ativação depende de selecionar e conectar um provedor ao servidor; não inserir credenciais no frontend ou no repositório público. Notas clínicas não foram enviadas a nenhum provedor.

Entregue: escolha de data e horário para novo encontro e remarcação; correção do vínculo entre edição da nota e sessão no modo demonstração; matrícula da nota deriva da sessão; registros fechados não podem ser reabertos para edição; observações de demonstração preservadas localmente, sem consulta indevida ao backend real; erros na leitura das notas bloqueiam edição em vez de tratar falha como ausência de nota; respostas tardias de outra sessão/pessoa são descartadas.

Fluxo de revisão: seção "O que mudou para o Mapa CER?" nas sessões. A profissional escreve uma formulação destinada à pessoa, confirma a revisão desse texto e salva no rascunho. A nota privada nunca é lida/copied por esse fluxo. Uma nova versão deriva da publicação corrente; versões publicadas permanecem intactas. Cada encontro aparece uma única vez na síntese, sem duplicar ao salvar novamente. Qualquer alteração retira a revisão global e exige conferir as duas profundidades antes de publicar. A seção "O que construímos nos encontros" aparece nas duas profundidades do mapa publicado.

Guarda no servidor: tipo/limite/duplicidade dos registros, vínculo entre sessão e matrícula, autoria humana profissional e encontro não cancelado. Hook novo entregue no repositório; implantação real e teste autenticado ainda precisam ser conferidos no ambiente do servidor. Testes de hook executados em simulação de eventos, não em PocketBase autenticado.

Validação local: 27 testes em 7 arquivos afetados, typecheck tsconfig.app.json e build de produção aprovados. Código submetido no commit 04f122afb6da16a54ee277502197d89b14fcee5f. Conferência visual da prévia em andamento.

Próxima etapa: conexão segura do provedor de IA; rota autenticada por autor e matrícula que lê somente as notas autorizadas; propostas privadas com origem, incerteza e indicação das mudanças em relação ao mapa corrente; revisão da profissional e publicação explícita. O módulo atual de proposals proíbe session_note: esse contrato precisa de atualização deliberada ou de um fluxo dedicado antes da integração. Não copiar o prontuário para o mapa, não inventar inferências e não publicar hipóteses automaticamente.
