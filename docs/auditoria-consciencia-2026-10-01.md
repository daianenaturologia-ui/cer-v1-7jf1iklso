# Consciência e Mapa CER — auditoria de 1 de outubro de 2026

A implementação preserva as correções anteriores e acrescenta as mudanças confirmadas nos vídeos finais. Não contém transcrições ou dados pessoais dos testes gravados.

| Dimensão ou etapa      | Correção mantida ou concluída                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada na Consciência | Nomes e sequência das esferas; indicação da próxima dimensão; progresso preservado ao retornar.                                                                                     |
| Corpo & Fisiologia     | Revisão do capítulo 2, retorno e persistência; distinção de histórico, habitual e atual; opções de pele/cabelo contextualizadas no capítulo 3 e seus resumos.                       |
| Mente & Emoções        | Frequências dos movimentos preservadas; relatos e nomes dos movimentos apresentados sem inventar frequência para registros antigos.                                                 |
| Regulação              | Até duas escolhas nas perguntas pertinentes, exclusividade das respostas incompatíveis, rotas que consideram a segunda escolha e pergunta mais concreta sobre o resultado desejado. |
| Relações               | Até duas escolhas nas perguntas pertinentes; órbitas e nomes mais visíveis; representação legível dos vínculos; encerramento e navegação preservados.                               |
| Sexualidade            | Texto livre equivalente não aparece duplicado; respostas privadas excluídas do documento compartilhado. O vídeo final percorre as etapas até o panorama.                            |
| Sentido & Conexão      | O vídeo final percorre as etapas até o panorama; a leitura não pressupõe religião ou espiritualidade específica.                                                                    |
| Mapa CER               | Cobertura usa respostas e progresso, inclusive com o engine desativado; conclusão das dimensões não equivale a publicação profissional.                                             |

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

Após autorização explícita, o bloco foi enviado à main do repositório `daianenaturologia-ui/cer-v1-7jf1iklso`. A sincronização no Skip concluiu as quatro etapas; o campo JSON `reading_snapshot` foi verificado em `cer_maps` e o hook `on_cer_map_reading_snapshot` está listado no ambiente.

O editor e as duas leituras foram conferidos no preview com conta fictícia. A conferência identificou e corrigiu a apresentação de respostas legadas que guardavam o texto em `title` ou o nome da alternativa em `selected`. Mais 19 testes direcionados passaram após esse ajuste, assim como TypeScript e build. A demonstração contém fixtures antigas sem correspondência com alguns prompts atuais; o documento mantém ausência de dados explícita, sem inventar respostas.

A verificação dos hooks em servidor com um ciclo real de salvamento, revisão e publicação permanece distinta dos testes simulados e da confirmação de sua instalação. Nenhum mapa de participante real foi publicado durante a auditoria.
