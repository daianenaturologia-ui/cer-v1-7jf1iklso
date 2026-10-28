# Editar respostas do acolhimento inicial

O relato já enviado exibia as respostas sem um comando claro para alterá-las. Agora **Editar minhas respostas** abre os três campos com o conteúdo do último relato enviado. A pessoa modifica os campos e confirma o envio para a profissional. O novo envio aparece como o mais recente; o anterior permanece no histórico já existente. Não há atualização silenciosa de informações já compartilhadas.

Abrir o editor ou voltar ao relato não grava nem compartilha nada. Salvar rascunho usa o fluxo privado existente; enviar cria outro relato com a mesma autorização e vínculo de acompanhamento. Campos e ações concorrentes ficam indisponíveis durante uma gravação. Uma falha de envio mantém o texto na tela. Alterações não salvas continuam sujeitas à perda ao fechar ou atualizar o navegador.

Escopo: relato inicial de três perguntas. Não altera respostas de avaliações, planos ou versões concluídas de capítulos. Sem migração, regras ou permissões novas.

Verificação: `VITE_POCKETBASE_URL=http://127.0.0.1:8090 pnpm exec vitest run --config scripts/intake-vitest.config.ts` cobre edição preenchida, cancelamento sem envio, erro e nova tentativa, histórico, leitura profissional e retomada após remontagem em demonstração sem rede; o parser cobre campos ausentes, multilinha e mensagens legadas. `verify-authenticated-backend.py` verifica o fluxo com PocketBase real e contas sintéticas em loopback, incluindo privacidade do rascunho, leitura do novo e do antigo envio e bloqueio a terceiros. Não equivale à homologação visual da implantação Skip.

Situação: mudança preparada para revisão; não implantada na prévia. A sessão do editor e a sessão profissional exigem autenticação novamente. Não solicitar senha por chat nem repetir handoffs que a usuária não consegue acessar.
