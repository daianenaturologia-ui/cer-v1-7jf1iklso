# Linha da Vida, cuidado integrativo e Mandala — 20/10/2026

## O percurso da interagente

Passado, presente e futuro recebem textos curtos e autorais sobre reconhecer a história, compreender respostas de proteção e ampliar escolhas. A infância como terreno da vida aparece como inspiração em Lya Luft, sem transformar a metáfora em determinismo. Não atribuímos a Jung a frase sobre o que fazemos com o que aconteceu: a autoria não foi confirmada. O e-book Linha da Vida está indicado como **em preparação**, sem arquivo ou link fictício. Seu conteúdo aprofundado ainda será elaborado.

O fechamento da Linha da Vida oferece “Cartas do próximo capítulo”: acolhimento, luto, vínculos, expectativas, perdão opcional, recursos, cuidado e escolhas futuras. É possível passar, voltar e nomear um vínculo ou situação. Não há pontuação, inferência de trauma ou obrigação de perdão/reconciliação. Só há gravação ao escolher salvar; a reflexão vai para um registro do presente, privado por padrão, com compartilhamento explícito.

O futuro distingue meta, motivo, primeira ação, recursos e limites. O botão passa a “Salvar como meta principal”. A meta não pode ficar sem nome: o assistente retorna à etapa correta e mostra a validação. O texto ilustrativo nunca é gravado como se fosse uma resposta. Erros de persistência aparecem junto ao salvamento e o conteúdo permanece preenchido.

A escolha principal na própria lista corresponde à meta futura salva/reconfirmada mais recentemente, com ordenação estável. As demais continuam registradas. Para a profissional, a lista mostra a meta **compartilhada mais recente**, sem alegar conhecer uma escolha privada posterior. A profissional traz uma meta compartilhada por ação explícita e confirma o foco na sessão; não há importação silenciosa de narrativas.

## Preparar o cuidado, combinar e organizar a rotina

O Plano de Desenvolvimento contém um capítulo próprio de cuidado, separado visualmente da meta principal. Áreas disponíveis: alimentação/digestão; fitoterapia; aromaterapia; cuidado emocional (florais/EFT/PNL conforme avaliação); movimento; sono; yoga/respiração/kriyas; relações/apoio; sentido e outros cuidados.

As orientações são escritas pela profissional. Campos orientam registro de indicação individual, forma de uso, dose quando aplicável, duração, adaptações e acompanhamento. Nada é prescrito automaticamente pelo mapa. O cuidado pode ocorrer enquanto a pessoa avança; não é exigido um estado de equilíbrio perfeito antes de viver ou realizar.

O capítulo de cuidado usa o ID reservado `cer-integrative-care` dentro da estrutura de documento já versionada, preservando o contrato do servidor, as cópias compartilhadas e as rotinas imutáveis. Uma versão combinada exige uma meta principal real e permite vários cuidados de apoio. O frontend e os quatro validadores correspondentes no hook aplicam a mesma regra. Documentos antigos permanecem legíveis; uma revisão com várias metas precisa escolher um foco antes de gerar novo acordo. Rotinas anteriores e snapshots não são apagados.

Materiais da Biblioteca entram no rascunho profissional por escolha explícita, com isolamento de matrícula, prevenção de duplicação e limite de orientações. Leitura em sessão, confirmação e organização de horários continuam sendo passos separados. As orientações e as ações da meta podem ser distribuídas no Planner só após o acordo. O painel da semana oferece impressão de datas, títulos e horários, sem notas profissionais ou relatos clínicos.

## Biblioteca e autonomia

A entrada passa a ser uma galeria com áreas ilustradas por ícones, cartões, busca e materiais realmente disponíveis. Não exige ativar um plano antigo para explorar o acervo. Os controles do fluxo anterior permanecem recolhidos, preservando acesso ao histórico.

A introdução distingue compreender de experimentar, acolhe a dificuldade de praticar e convida a observar corpo e emoções antes e depois da prática. A pessoa pode variar ou repetir conforme o que ajuda e criar seus próprios cuidados. As escolhas da interagente são identificadas como práticas pessoais, separadas das orientações de tratamento preparadas pela profissional; usam o fluxo existente de registro, privacidade e Planner.

## Mandala

A pétala abre diretamente um diálogo do dia selecionado, por clique, Enter ou espaço. A interagente edita e salva; a profissional consulta apenas dias compartilhados. O seletor redundante “Consultar dia” foi removido. Há atalho para hoje, campos visíveis de pensamentos e acontecimento importante, emoções, corpo, sono, cuidado, resposta à prática, fluxo e primeiro dia menstrual. A aparência da mandala foi conservada; a grade se ajustou ao editor que agora abre em diálogo.

“TPM percebida” e “Sinais de ovulação percebidos” são registros da percepção, não confirmação de fase ou ovulação. O histórico mostra os inícios menstruais, intervalos observados e variação. Em ciclos espontâneos, pode oferecer uma referência pela duração habitual informada (provisória) ou pela mediana de até seis intervalos após ao menos três ciclos completos. Dados muito variáveis, contexto irregular/hormonal/gestação/pós-parto/perimenopausa/menopausa não geram previsão. Datas passadas não são avançadas artificialmente sem novo início registrado. Alterar/retirar um início recalcula a leitura.

A estimativa é um cálculo descritivo de calendário, não uma IA diagnóstica. Não confirma ovulação, fertilidade ou regularidade clínica, nem serve para decisões contraceptivas ou para tentar engravidar. O painel profissional não usa preferências privadas nem completa lacunas com dados não compartilhados.

## Instalação e validação

Dependência: integração do PR51 (síntese viva do Mapa SER). Instalação desta revisão: frontend; `on_development_plan_document.js`; `on_cycle_journal.js`; e **somente a migration aditiva 0086_cycle_day_observations.js**, após verificar se o ordinal está livre. Cria apenas `thoughts` (texto opcional até 5.000) e `cycle_signs` (seleção opcional) na coleção existente `cer_cycle_entries`. Não altera regras, dados, contas ou índices. Rollback se recusa a retirar observações existentes.

Preservar `src/lib/pocketbase/client.ts` canônico com `getPocketBaseUrl`, guard literal de `process`, trim e falha sem URL configurada; manter as duas referências de `vite-env.d.ts`. Não reaplicar migrations históricas. Conferir arquivo em disco depois de sincronizar e compilar, pois o Skip já apresentou regressão nesse ponto.

Validação local: 434 testes em 58 arquivos passaram. TypeScript, lint do código alterado e build Vite passaram. Os testes REST autenticados das versões oficiais PocketBase 0.26.1 e 0.36.0 passaram, incluindo capítulo de cuidado no plano compartilhado/rotina, recusa de acordo sem meta principal ou com múltiplas metas, persistência de pensamentos/sinais, isolamento por pessoa e retirada de compartilhamento. Nenhum teste usou o backend vivo do Skip. A conferência visual da prévia e do diálogo de impressão ainda depende da instalação autorizada no editor.

## Referências para o desenvolvimento editorial

- Lya Luft. *Perdas e ganhos*. Record. Catálogo da editora: https://www.record.com.br/products/perdas-e-ganhos-1
- SAMHSA. *Concept of Trauma and Guidance for a Trauma-Informed Approach* (2014): segurança, colaboração, escolha e autonomia. https://library.samhsa.gov/sites/default/files/sma14-4884.pdf
- ACOG. *Fertility Awareness-Based Methods of Family Planning*: diferenças entre acompanhamento de calendário e métodos de percepção de fertilidade. https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning
- ACOG. *Trying to Get Pregnant? Here’s When to Have Sex*: início de um ciclo e limitações de prever ovulação em ciclos irregulares. https://www.acog.org/womens-health/experts-and-stories/the-latest/trying-to-get-pregnant-heres-when-to-have-sex

Estas fontes apoiam a curadoria e os limites do produto; não validam clinicamente o algoritmo nem substituem a revisão profissional dos conteúdos e dos cuidados.

## Estado da entrega

Implementação preservada no commit local `d73186f` da branch `codex/linha-vida-plano-integrativo`, baseada no código do PR51. A criação do commit remoto foi rejeitada pela revisão automática por exigir autorização explícita para publicar código/documentação no repositório público. Não foi criado novo PR; não houve merge ou instalação desta revisão no Skip. A árvore remota sem referência criada antes da rejeição não equivale a um commit, branch, PR ou entrega instalada. Próximo passo: autorização para enviar código/testes/notas ao repositório do projeto, integrar a versão e instalar somente na prévia; então conferir a UI real, a impressão e a disponibilidade do ordinal 0086 antes de aplicá-lo.
