# CER — proposta de desenvolvimento individual e auditoria de implementação

Escopo: auditoria estática do código e implantação somente do texto de recepção aprovado na conversa (bloco 95317). Base remota verificada: 75963b77c8181d7abfdbdb5dd695eb1c5384b552. InteragenteHome tinha blob idêntico à base local. Não altera questionários, interpretação, dados, consentimento ou permissões. Não é homologação de backend real nem validação de eficácia do método.

## Percurso proposto (sem novas fases ou dimensões)

1. Acolher e pactuar: momento, expectativas, necessidades, limites e o que a pessoa deseja desenvolver.
2. Compreender o funcionamento: seis dimensões, recursos, padrões, história e reconhecimento participativo do Mapa CER.
3. Escolher uma direção: valores e desejos; selecionar uma prioridade possível e esclarecer como reconhecer uma mudança significativa.
4. Preparar condições e desenvolver habilidades: identificar conhecimento/habilidade, energia, motivação, apoios e condições do ambiente. Equilíbrio e Realização são simultâneos; não criar requisito de estar totalmente regulado para agir.
5. Experimentar na vida: pequena ação combinada, contexto/momento de realização, alternativa quando não couber; capacidade e consentimento explícitos.
6. Perceber e ajustar: comparar intenção e vivência sem cobrança; reconhecer aprendizado, dificuldades, condições externas e mudanças desejadas.
7. Sustentar autonomia: reconhecer o que consegue conduzir, apoios necessários, plano de retomada e decisão compartilhada sobre continuar, espaçar ou encerrar acompanhamento. Evolução acompanha todo percurso, não é fase final.

## Evidências da auditoria

| Necessidade                                          | Evidência no código                                                                        | Estado/ajuste mínimo proposto                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acolhimento e consentimento de envio                 | InteragenteHome, OnboardingFlow e relato inicial privado/compartilhado                     | Existe; recepção atualizada.                                                                                                                                                                                                                    |
| Autoconhecimento integral                            | Seis experiências, cerMapReadings, Mapa resumido/aprofundado, LifeTimeline                 | Existe; não alterar doshas/questionários neste bloco.                                                                                                                                                                                           |
| Desejos, direção, recursos, limites e primeiro passo | experience/LifeDirections e services/lifeDirections                                        | Existe como narrativa, com horizontes e compartilhamento explícito.                                                                                                                                                                             |
| Plano e foco pactuado                                | CarePlanEditor, cerCarePlanService, tipos CerCarePlanRecord/CerCarePlanPriorityRecord      | Existe; direção hoje digitada manualmente. UI fixa direction_mode='reused' sem selecionar fonte. Falta ligação explícita, autorizada e rastreável entre registro de futuro e plano; não copiar conteúdo privado.                                |
| Objetivo observável/habilidade a desenvolver         | description da prioridade, practical_invitation da apresentação, shared_prompt de revisão  | Texto livre pode apoiar já. Não há objetivo de aprendizagem ou critério observável dedicado. Propor orientação opcional nos campos existentes antes de criar schema; não adicionar score.                                                       |
| Capacidade, barreiras e alternativas                 | DemoPracticeWorkspace, DemoExperimentCard, QuickResponseFlow                               | Gates e opções de barreiras existem. Falta formular preventivamente apoio/barreira/alternativa da ação; pode caber nas orientações compartilhadas inicialmente.                                                                                 |
| Experimentação e planejamento                        | demoPracticeFlow, cerPlannerService, PlannerPage                                           | Fluxo demo conectado; acervo ilustrativo de duas versões. Conteúdo de ensino/práticas reais e editor editorial completo ainda precisam de conclusão/revisão.                                                                                    |
| Percepção e revisão                                  | cerMandalaService, ParticipantCycleReflection, CycleReviewView, cerCycleInvitationService  | Existe; shared_prompt permite perguntas de aprendizagem. Não inventar campos/metas adicionais nem copiar reflexão para síntese profissional.                                                                                                    |
| Reconhecimento de recursos na Mandala demo           | getDemoMandalaProjection: recognized_resources: []                                         | Lacuna concreta. Recursos de LifeDirections/Mapa não são reunidos automaticamente na demo; integrar apenas fontes compartilhadas/reconhecidas, respeitando finalidade.                                                                          |
| Continuidade e autonomia                             | cerCareCycleService, revisão close/continue/adapt, demoPracticeFlow previous_assignment_id | Ciclos/continuidade existem; plano explícito de manutenção/retomada/encerramento do acompanhamento ainda não tem experiência própria. Pode começar como síntese compartilhada da revisão; encerrar ciclo não significa encerrar acompanhamento. |
| Uso real e escola                                    | Serviços PB, separação de perfis, práticas reais existentes                                | Fluxo autenticado, autorização, persistência e acervo real continuam sem homologação completa. Não apresentar app pronto para dados reais. Turmas, aulas, matrículas educacionais e professor/aluno não foram auditados/implementados.          |

## Complementos priorizados para discutir com Daiane

A. Conectar direção compartilhada ao plano com origem rastreável e seleção explícita.
B. Explicitar foco, habilidade/ação, sinal descritivo de mudança, apoio/barreira e alternativa, reaproveitando campos existentes quando possível.
C. Nas revisões, perguntar o que aprendeu e consegue conduzir; produzir síntese compartilhada de manutenção e retomada, separada de notas privadas.
D. Integrar recursos reconhecidos na Mandala demo por fontes autorizadas, sem classificar potencial/fragi­lidade como perfil fixo.
E. Concluir acervo real/editor e validar fluxo real antes de piloto individual. Escola permanece horizonte, sem novos módulos agora.

Esses complementos são propostas, não foram silenciosamente instalados. Não requerem novo app para testar desenvolvimento individual. Reuso futuro na escola depende de necessidades de aprendizagem, separação de dados e permissões; não há decisão de arquitetura neste bloco.

## Fundamentação e limites

O COM-B sugere observar capacidade, oportunidade e motivação ao planejar mudança (Michie et al., 2011, https://link.springer.com/article/10.1186/1748-5908-6-42). A teoria da autodeterminação orienta apoio à autonomia, competência e vínculos na aprendizagem (https://selfdeterminationtheory.org/topics/application-education/). São referências para o desenho do percurso, não provas de eficácia do CER. A aplicação clínica/educacional do método precisa de avaliação própria.

## Recepção

CerWelcome contém integralmente o texto aprovado, começando com “Comece aqui — Parabéns por escolher iniciar essa jornada” e terminando com “Bora começar?”. O nome continua dinâmico no cabeçalho. A recepção aparece apenas na aba Comece aqui, aberta inicialmente e recolhível. Removido somente o parágrafo antigo duplicado sobre a origem do método de “Entenda como funciona o CER”; orientações funcionais preservadas. Não há gravação de novo estado.

Verificação: TypeScript do app, build Vite e diff --check passaram. Não foram escritos testes espelho de copy nem repetida a bateria anterior. Publicação/observação do preview devem ser registradas ao concluir; não confundir commit GitHub com preview atualizado.

## Entrega e retomada

Recepção publicada inicialmente em 0801d6ab30a060486c99b1611992f9df1d29d64c. A conferência da integração revelou transferência truncada de InteragenteHome; corrigida em 5043bc8a0778bac16c02a2c2cbe552294145088d com o arquivo integral compilado localmente. Blob remoto corrigido 3acb01e2d4f7453dcb877682dcca64e1145bee0f idêntico ao local. CerWelcome remoto também corresponde ao local (beaa372a1b0297836c9557c9c660433c556e08ab).

Após sincronização e compilação subsequente, o preview com identificador 3c15cb5 mostrou o texto integral em Comece aqui, saudação dinâmica “Olá, Mariana.”, formulários preservados e recolher/reabrir funcionando. Página verificada: https://cer-v1-1444e--preview.goskip.app/ . Captura cer-recepcao.jpg, libfile_f75e272c49c481918838afbd2d07096d. Não semeados nem resetados dados/questionários. Não repetida bateria antiga. A versão indicada nas configurações permaneceu 0.0.226; o identificador de compilação e a observação direta documentam a entrega.

Próxima etapa: discutir os complementos A–E com Daiane e implementar somente o escopo definido. Nenhum deles foi aplicado junto com a recepção. Validação do fluxo autenticado e acervo real permanece necessária antes do piloto individual.
