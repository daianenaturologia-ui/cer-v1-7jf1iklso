# Plano de Desenvolvimento: da sessão à rotina

Decisão de Daiane: o plano escrito reúne sua compreensão do caso, prioridades, metas, sinais de avanço, ações e próximo encontro. A profissional prepara em privado, lê/edita com a interagente durante uma ou mais sessões e só depois organiza a rotina. Mapa e Linha da Vida fundamentam o plano; Biblioteca é apoio, não exige escolher materiais antes de ter uma direção. Produção de e-books comerciais permanece para depois.

## Implementação

- `DevelopmentPlanWorkspace`: rascunho com salvamento automático privado e botão “Salvar e continuar depois”; leitura em documento; anotações profissionais separadas; compartilhamento explícito como “Em construção” ou “Combinado”. Pode permanecer em construção por várias sessões.
- `DevelopmentPlanDocument`: síntese, prioridades, metas com sinais de avanço e ações, apoios opcionais da Biblioteca e próximo encontro. A interagente lê a última versão compartilhada; não recebe o rascunho nem anotações privadas. Edição na sessão é conduzida pela profissional.
- `DevelopmentRoutineOrganizer`: ações já escritas, dias, horário, duração, fuso e início. Confirmação depois da conferência. Agendamento só da versão combinada mais recente; pausas de rotinas anteriores continuam possíveis. Comandos idempotentes evitam duplicação em retries; falha parcial informa o que foi salvo.
- `WeeklyAgenda`: projeta rotinas semanais sem materializar eventos antecipadamente. Revisões explícitas de rotina são anexadas; semanas anteriores permanecem preservadas. Mudanças no documento não reorganizam a agenda. Exportação ICS mantém apenas títulos e horários.
- Registros antigos de cuidado, metas, direções e Planner não são migrados/apagados. Permanecem acessíveis em áreas de histórico. Práticas pessoais da Biblioteca ficam distintas do Plano de Desenvolvimento profissional.

## Persistência e permissões

Migration aditiva `0085_development_plan_document.js`, três novas coleções:

1. `cer_development_plan_drafts`: rascunho JSON e notas privadas; somente autor profissional ativo e com vínculo ativo; UNIQUE matrícula/autor. Número de revisão validado em transação, impedindo sobrescrita por janela desatualizada.
2. `cer_development_plan_versions`: snapshots imutáveis compartilhados explicitamente; titular e profissional ativo/vinculado leem. Servidor copia o documento do rascunho, nunca notas privadas. UNIQUE rascunho/revisão.
3. `cer_development_plan_routines`: comandos de rotina imutáveis, lidos/criados por titular ou profissional ativo/vinculado. Snapshot da ação derivado pelo servidor de uma versão combinada; matrícula e ação conferidas; UNIQUE command_key. Sem edição/exclusão de comandos históricos.

Hook `on_development_plan_document.js`: valida estrutura/tamanhos, acordo completo, IDs, recursos/HTTPS, revisão, origem, dias/horário/duração/fuso e data presente/futura. Não aplicar migrações históricas na instalação hospedada. Preservar os índices e todas as regras. Não instalar somente frontend sem schema/hook. Runtime de referência é distinto da homologação no Skip.

## Verificações

- Suite autenticada completa: 149 cenários por versão PocketBase 0.26.1 e 0.36.0, bases descartáveis e dados sintéticos. Inclui isolamento de rascunhos, snapshots e comandos, revogação de vínculo, validações de origem, impossibilidade de alterar história, concorrência de edição e fluxo legado.
- Testes de componentes/serviços: salvamento, preparo privado, construção, acordo, agendamento explícito e projeção na agenda. Regressões do app e build/typecheck devem passar no head final antes da integração.
- Próxima conferência na prévia: executar o fluxo com conteúdo fictício; recarregar; alternar as visões; testar estado em construção e combinado, rotina recorrente e pausa, conferir celular. Não usar dados pessoais reais.

## Instalação

Integrar após CI final aprovado, sincronizar a prévia, instalar somente 0085 e o hook novo. Conferir schema/índices reais e backup disponível; não criar contas/dados no backend vivo para teste. Preservar `client.ts` canônico (blob `5d859ae11e9bd1c266bd62395547a187da7d41c1`) e `vite-env.d.ts` com apenas duas referências. Sincronização anterior do Skip sobrescreveu o cliente repetidamente; ler o arquivo em disco após QA/deploy e conferir o blob independente. Não publicar produção neste bloco.
