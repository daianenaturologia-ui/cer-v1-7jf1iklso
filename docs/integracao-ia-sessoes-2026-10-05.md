# Integração de IA para sessões — preparação técnica

Estado: código de integração entregue, NÃO ativado no servidor vivo. Nenhuma chamada a provedor foi executada nesta entrega. Nenhum prontuário foi enviado. O app continua usando a síntese manual revisada da etapa anterior; o cliente novo ainda não está ligado a um botão ou gatilho de salvamento. Não anunciar atualização automática como concluída.

## Escopo deste bloco

Rota POST `/backend/v1/cer/session-map-proposal`, implementada em `pocketbase/hooks/on_session_ai_proposal.js`. Recebe apenas `sessionId`. O servidor resolve o usuário autenticado, papel profissional ativo, vínculo ativo com a matrícula, autor da sessão e autor da nota. Não permite encontro cancelado, fonte fornecida pelo cliente ou nota de outro autor. Repete a autorização após a chamada e rejeita nota alterada ou nova publicação do mapa durante a análise.

Contexto: a nota salva desse encontro e a leitura do último mapa publicado, incluindo os marcos de vida que já constem nessa leitura. Não consulta diretamente respostas, diários particulares, marcos ainda não incorporados ao mapa ou notas das outras sessões. Portanto ainda não oferece análise longitudinal completa do prontuário. Uma ampliação futura precisa resolver cada fonte autorizada explicitamente, sem abrir acesso genérico às coleções.

Resultado efêmero e privado: síntese sugerida, até seis mudanças com fonte e incerteza média/alta, até cinco perguntas, versões técnicas e identificadores das fontes. Sem persistência automática da proposta, sem alteração de mapas, notas ou publicações. Prompt exige diferenciar relatos e hipóteses, evitar diagnóstico/prescrição/causalidade atribuída à infância, detalhes identificadores e cópia literal das notas. Essas orientações não substituem a revisão humana da qualidade e privacidade de cada saída.

Adapter inicial para OpenAI Chat Completions com Structured Outputs, `store: false`, URL fixa oficial, limite de saída e timeout de 45 segundos. Modelo e chave somente no ambiente do servidor, sem escolha por usuário nem credenciais no browser. `store: false` não é garantia de retenção zero nem de anonimização: o texto da nota pode conter dados identificadores. A configuração deve ser compatível com os termos e controles de dados contratados para o uso pretendido antes de dados reais.

Auditoria registra somente metadados de invocação, não texto nem chave. O resultado `success` no evento `SESSION_AI_REQUESTED` significa que a invocação foi registrada, não que o modelo concluiu a análise. Intervalo de um minuto por autor verificado via auditoria antes da chamada; não substitui limitação de concorrência/quota no gateway do servidor. Falha de configuração, conexão, recusa, truncamento, JSON inválido, fonte inválida ou mudança de contexto mantém o mapa intacto. A demonstração nunca aciona o provedor.

## Ativação pendente

1. Identificar a versão real do servidor PocketBase e o mecanismo do Skip para instalar rotas/hooks. A versão do SDK cliente não determina a versão do servidor. Em PocketBase nativo, instalar este arquivo com extensão `.pb.js` dentro do diretório de hooks configurado; apenas copiar um `.js` comum não garante carregamento.
2. Configurar os segredos no servidor, nunca no repositório público ou em variáveis `VITE_`: `CER_SESSION_AI_OPENAI_API_KEY`, `CER_SESSION_AI_MODEL` (modelo compatível com Structured Outputs) e `CER_SESSION_AI_ENABLED=true`. A flag fica ausente/desligada até os termos de processamento e a configuração do provedor estarem definidos. Não solicitar chave na conversa.
3. Configurar limite de concorrência/quota no servidor e verificar auditoria, papel/vínculo e autoria contra o backend real. Instalar a rota em ambiente de testes e chamar com notas fictícias; conferir escopos cruzados, revogação, erro de provedor e alteração das fontes. Só então integrar a interface de proposta/revisão e o gatilho após salvar a nota, com proteção contra repetição e resposta tardia.
4. Preservar publicação explícita após revisão da profissional. A proposta gerada não é o mapa compartilhado. O caminho geral `aiContextResolver`/`cer_ai_proposals` continua proibindo `session_note`; esta rota é um contrato separado e não relaxa essas permissões.

## Validação

Testes automatizados simulam eventos PocketBase e o transporte, sem rede. Não há binário PocketBase nem acesso administrativo ao runtime/segredos do servidor nesta sessão, portanto não houve teste integrado autenticado ou ativação em produção. 25 testes novos aprovados, além dos 27 testes anteriores aprovados na bateria inicial deste bloco (um caso adicional foi incluído e os dois arquivos novos foram reexecutados). Typecheck `tsconfig.app.json`, lint dos três arquivos TypeScript novos e build Vite aprovados; avisos preexistentes de tamanho de chunk e imports dinâmicos permanecem. O serviço `sessionAiProposal.ts` serve como ponto de integração futuro e verifica o vínculo da resposta com o encontro solicitado.

Referências primárias consultadas em 05/10/2026:
- https://pocketbase.io/docs/js-routing/
- https://pocketbase.io/docs/js-sending-http-requests/
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://developers.openai.com/api/docs/guides/migrate-to-responses
