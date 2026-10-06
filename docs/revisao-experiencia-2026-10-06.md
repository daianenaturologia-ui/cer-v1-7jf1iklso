# CER — revisão da experiência antes dos testes manuais

Autorizada por Daiane em 06/10/2026. Escopo: navegação, clareza, leitura, controles e fluxos em demonstração. Sem mudança de backend, permissões, IA ou registros reais; sem publicação em produção.

## Achados e correções preparadas

- Práticas tinha três botões que repetiam os destinos da navegação. O cabeçalho passa a usar título “Minhas práticas” e a navegação comum, com quebra de linha. O estado vazio aponta para a Evolução em vez de devolver a pessoa à página inicial.
- Mandala tinha retorno ao início duplicado e rótulos técnicos “Read-Model”, “Zero Score” e “Projeção Viva”. Simplificada a apresentação com texto sobre prioridades, práticas e recursos, preservando a projeção e a separação por pessoa/papel.
- Navegação comum com texto de 14px, área mínima de 44px de altura e quebra de linha. Botões de fechamento de Dialog/Sheet com área de 44×44px. Sheet com limite em dvh e rolagem.
- Texto branco em terracota tinha contraste calculado de 2,64:1 (tema claro) e 3,17:1 (escuro). A cor escura preparada eleva para 5,46:1 e 4,55:1, respectivamente, nas cores sólidas nominais. Isso não constitui auditoria de todas as combinações de cores, hover ou transparências.
- Estados de carregamento e erro da Mandala anunciados por status/alert. Mensagens de espera/práticas com linguagem inclusiva e sem sugerir que recursos autônomos dependem de autorização.

## Verificações

- Prévia vigente 0.0.260: navegação Práticas → Evolução → Planejar → acervo educativo observada em demonstração. Nenhum recurso foi escolhido/gravação feita. Linha da Vida observada bloqueada conforme a Consciência incompleta. Revisão anterior já conferiu agenda, diálogo mobile, Mandala e painel profissional.
- Sete testes aprovados em três arquivos: `MandalaStructuredView.test.tsx`, `WeeklyAgenda.test.tsx` e `SelfDevelopmentPlannerPage.test.tsx`, usando `scripts/ux-review-vitest.config.ts`. Incluem resposta atrasada da pessoa anterior, mudança de papel e recuperação de erro. Não foram adicionados testes que apenas repetem textos.
- `tsc --noEmit -p tsconfig.app.json`, build e `git diff --check` aprovados. Persistem avisos anteriores de chunks e imports dinâmicos.
- Roteiro curto de testes entregue em PDF, uma página, orientado à demonstração.

## Estado da instalação

Reconexão segura ao Skip concluída. Aplicado o patch de oito arquivos de interface, conciliado com o workspace vigente. O commit do Skip também atualizou o metadado de build e somente a data generatedAt do snapshot de schema; não houve diferença nas coleções nesse snapshot. A prévia foi atualizada para 0.0.261 (commit `80f2ba2`; implementação `e0e04d3`). O Skip informou oxlint, TypeScript, build e os três arquivos de testes aprovados. O fetch do GitHub confirmou os commits; o auto-commit posterior `4a51d9b` mudou somente `.skip.config.json`.

A inspeção após instalação confirmou no builder mobile: cabeçalho “Minhas práticas” sem botões duplicados, navegação legível, Mandala sem os badges técnicos e diálogo “Um momento para mim” com desenho botânico e todos os campos/botão visíveis. A página de Práticas apresentou largura do conteúdo igual à largura do corpo (387px), sem transbordamento horizontal nessa superfície. Escape fechou o diálogo; nenhum momento foi salvo. A prévia externa foi recarregada e conferida.

A base com alterações de segurança pendentes permanece preservada em `cer-art-20261006` (`4429b5dd673ce63fac30935df48524da6f1f464f`); esta rodada também está salva em `cer-ux-20261006`. Essa branch não foi sincronizada inteira ao Skip. As pendências de suporte — backup/restauração e ambiente de backend isolado — permanecem separadas desta revisão.

Não declarar revisão de todos os estados, conformidade legal, restauração ou validação do banco com base em testes de interface. Não houve publicação em produção nesta rodada.
