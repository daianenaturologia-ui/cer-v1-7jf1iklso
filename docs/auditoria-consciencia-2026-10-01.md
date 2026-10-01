# Consciência e Mapa CER — auditoria de 1 de outubro de 2026

A implementação preserva as correções anteriores e acrescenta as mudanças confirmadas nos vídeos finais. Não contém transcrições ou dados pessoais dos testes gravados.

| Dimensão ou etapa | Correção mantida ou concluída |
| --- | --- |
| Entrada na Consciência | Nomes e sequência das esferas; indicação da próxima dimensão; progresso preservado ao retornar. |
| Corpo & Fisiologia | Revisão do capítulo 2, retorno e persistência; distinção de histórico, habitual e atual; opções de pele/cabelo contextualizadas no capítulo 3 e seus resumos. |
| Mente & Emoções | Frequências dos movimentos preservadas; relatos e nomes dos movimentos apresentados sem inventar frequência para registros antigos. |
| Regulação | Até duas escolhas nas perguntas pertinentes, exclusividade das respostas incompatíveis, rotas que consideram a segunda escolha e pergunta mais concreta sobre o resultado desejado. |
| Relações | Até duas escolhas nas perguntas pertinentes; órbitas e nomes mais visíveis; representação legível dos vínculos; encerramento e navegação preservados. |
| Sexualidade | Texto livre equivalente não aparece duplicado; respostas privadas excluídas do documento compartilhado. O vídeo final percorre as etapas até o panorama. |
| Sentido & Conexão | O vídeo final percorre as etapas até o panorama; a leitura não pressupõe religião ou espiritualidade específica. |
| Mapa CER | Cobertura usa respostas e progresso, inclusive com o engine desativado; conclusão das dimensões não equivale a publicação profissional. |

## Duas versões do Mapa

- Resumida: panorama por dimensão, respostas selecionadas, síntese profissional, explicação dos conceitos e referências acessíveis.
- Aprofundada: respostas compartilhadas em detalhe, bases das leituras de corpo, interpretação profissional, integração entre dimensões, espaço para história explorada em conversa e fundamentos.
- A publicação mostra um documento salvo, sem recalcular interpretações a partir de respostas posteriores.
- Preparar, salvar, revisar e publicar são ações distintas. Edição ou atualização das respostas exige nova revisão. A próxima versão preserva o documento publicado anterior e não herda sua aprovação.
- Mapas legados permanecem literais; não recebem uma nova interpretação automática.
- As fontes distinguem pesquisa, tradição ayurvédica, instituições e conteúdo autoral do Método CER; explicam conceitos, sem validar conclusões individuais.

## Validação

50 testes direcionados passaram em 11 arquivos: documento, privacidade, revisão, publicação, hooks, progresso na Home com engine desativado, duas reações, Relações, interpretações universais e relatórios profissionais. TypeScript foi verificado com `tsc -p tsconfig.app.json --noEmit`; build Vite passou.

Os testes dos hooks executam suas funções com registros e aplicação simulados. Não substituem a verificação em um servidor PocketBase real após aplicar a migração. A suíte completa não foi declarada aprovada: as seis falhas antigas identificadas em testes de resiliência/fixture em rodadas anteriores não fazem parte deste resultado.

## Atualização no ambiente

Aplicar a migração `0068_add_cer_map_reading_snapshot.js` e carregar os hooks atualizados junto com o frontend. O salvamento informa falha se o servidor ainda não persistir as duas versões. A etapa de atualização e verificação no Skip está bloqueada pela sessão na tela de login; não foi declarada concluída.

O envio deste bloco ao GitHub também foi rejeitado pela revisão automática, que exigiu autorização explícita no transcript atual para exportar o código ao destino. A autorização anterior para o mesmo repositório foi recuperada e apresentada, mas a segunda tentativa continuou bloqueada. Nenhum envio deste bloco foi confirmado e a `main` não foi atualizada por estas tentativas. As alterações estão preservadas em commit local; a confirmação do destino deve preceder a continuação da publicação.
