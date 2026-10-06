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

As correções estão preparadas e verificadas localmente. A nova sessão do navegador não tem autenticação Skip: o builder redirecionou para login. Não se afirma que essas mudanças foram instaladas na prévia. Solicitar reconexão segura somente após salvar a entrega. Aplicar apenas o diff desta rodada de src/, conciliando o workspace vigente; nunca sincronizar a branch inteira ou instalar código de segurança pendente no backend. A base preservada é `cer-art-20261006` em `4429b5dd673ce63fac30935df48524da6f1f464f`.

O ambiente mobile atual não pôde ser reaberto pelo builder antes da reconexão. As melhorias de tamanho/rolagem novas requerem inspeção visual após a instalação. Não declarar revisão de todos os estados, conformidade legal, restauração ou validação de banco com base nestes testes de interface.
