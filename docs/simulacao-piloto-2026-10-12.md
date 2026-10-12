# Simulação do percurso CER — 12/10/2026

Prévia observada: 0.0.351. Conta local de demonstração Mariana; todas as respostas inseridas nesta rodada são fictícias. Este teste não representa login autenticado, persistência entre dispositivos ou homologação do servidor vivo.

## Cenário e percurso exercitado na interface

Funcionamento habitual com pele/cabelo secos, frio, fome e digestão variáveis, intestino mais preso, sono leve, energia oscilante. Sobrecarga há dois meses por novo projeto; aceleração e cuidado excessivo, culpa ao descansar; irmã, caminhada e natureza como apoios. Foram preenchidos C1 (a partir de etapa 2 existente), C2, C3 e C4, e todas as perguntas disponíveis de Mente, Regulação, Relações, Sexualidade e Sentido, incluindo ramificações. A primeira estrutura corporal intermediária era do teste anterior e foi mantida explicitamente; não houve reset da conta.

Pausa e recarga em Mente preservaram o ponto e as opções. As sínteses literais de Corpo, Regulação e Relações acompanharam as respostas. O mapa reconheceu Vata, Vishama Agni e as frequências declaradas; manteve Vikriti em observação por falta de dados atuais convergentes. A leitura de Ama é uma hipótese tradicional sinalizada a partir de gases/distensão e cansaço ao acordar; merece revisão clínica no piloto e não equivale a diagnóstico biomédico.

Foi conectada uma força a uma dificuldade, escrita uma estratégia e criado um momento privado no Planner. Foram registrados um marco compartilhado (ano aproximado) e outro privado (época desconhecida), uma direção compartilhada, um recurso educativo ligado à direção, horário, execução simulada e reagendamento. Recarga manteve os itens. Na visão profissional, o marco e a direção compartilhados apareceram; o marco e o momento pessoais permaneceram fora. Um plano fictício, com nota profissional de controle, foi criado, ativado e apresentado. Sua entrega à participante foi bloqueada por uma configuração antiga e motivou correção.

## Falhas encontradas e correções

- Sair da demonstração removia o estado principal: preservar respostas, versões, planos e histórico na saída; reinício continua explícito. Os dados locais pertencem ao navegador/origem e não são uma conta sincronizada.
- C1 marcava a dimensão como concluída, C4 não atualizava o progresso geral: C1 mantém em andamento; C4 grava a conclusão da dimensão. Cobertura com respostas corporais exige o marco final.
- A seção profissional principal lia dados demo sem filtro, exibindo respostas privadas de Sexualidade; centralizar filtragem de classe, estado, matrícula e texto privado legado, inclusive histórico demo. A defesa de tela não substitui a migration 0082 do PR27, ainda separada deste bloco.
- Relatórios antigos de Sexualidade e outras dimensões usavam frases padrão sem evidências do instrumento atual: conectar os relatórios ao motor atual do Mapa CER, com perguntas e opções humanas; sem IDs técnicos como resposta.
- Progresso demo profissional era sempre vazio: carregar o progresso real da demonstração.
- Escolhas de movimentos mais interferentes eram ignoradas em empates: priorizá-las na narrativa, mantendo todas as frequências no gráfico.
- Plano compartilhado só era carregado com flag do motor antigo ativa: carregar plano e retornos independentemente da flag.
- Entrada profissional apresentava painéis longos, sem visão do cotidiano: nova Visão geral com dimensões, marcos, direção, condições, passos compartilhados e atalhos específicos. As áreas completas ficam nas abas.

## Verificação técnica independente

226 testes de questionários em 21 arquivos; 79 testes focados em 15 arquivos (mapa, leitura, demo, privacidade, Linha da Vida, práticas e resumo); 17 testes do Planner em 6 arquivos. Tipos e build Vite passaram. Nenhuma chamada ou alteração de conteúdo real foi feita por esses testes.

A suíte antiga initial-map teve três expectativas de apresentação ainda incompatíveis com a leitura atual (linhas literais expostas e textos anteriores). Não foi declarada verde. As regras de publicação imutável e a revisão completa dessa suíte permanecem necessárias. Uma quarta expectativa de cobertura foi identificada durante a mudança e preservada para estado concluído sem respostas carregadas; cobertura com respostas de C1 não confunde capítulo com dimensão.

## Limites e pendências da simulação

A data exata na Linha da Vida foi retestada com entrada pelo teclado e salva em 12/08/2026. A recusa inicial era do preenchimento da automação, não um defeito confirmado do campo. Ditado de voz, autenticação/e-mail, conta real, servidor gerenciado, restauração de backup e Google Agenda externa não foram homologados. Não foi feita reinicialização da demonstração nem exclusão de dados. Não houve publicação em produção.

## Reteste na prévia 0.0.352 e complemento

Sincronização direta pelo botão GitHub do Skip: build 0.0.352 concluído com sucesso. Na interface atualizada, a Visão geral mostrou 6/6 dimensões, 1 marco compartilhado e 1 passo com aprendizado; respostas profissionais de Sexualidade passaram de 13 para 10 e ficaram concluídas. Nem os textos privados de controle nem os valores técnicos das opções apareceram, incluindo com as respostas literais abertas. Sair da demonstração, reentrar e recarregar preservou respostas e plano; o plano apresentado passou a aparecer em Evolução > Acompanhamento. Foi enviado um retorno fictício “quero tentar”.

Um reteste rápido detectou colisão entre prioridades criadas no mesmo milissegundo: a identificação demo usava Date.now(). O complemento usa UUID para planos, prioridades e apresentações, com regressão de criação simultânea. Também acrescenta o retorno atual compartilhado à Visão geral, ajusta singular/plural dos cartões, conta somente as seis dimensões na síntese de acompanhamento e remove o identificador técnico de direção da Mandala. Checagem de C4 confirma que a conclusão geral espera a gravação final.

## Fechamento do reteste

A sincronização intermediária do builder perdeu complementos apesar de build bem sucedido; foram reaplicados sobre a main atual. A conferência da interface confirmou singular dos cartões e “Retorno sobre nosso foco”, com resposta “Quero tentar” e comentário fictício. Não confundir sucesso do build com presença da funcionalidade.

A investigação das três falhas restantes da suíte initial-map confirmou que o layout não disponibilizava detailedRows dos snapshots. Foi adicionado aprofundamento “Respostas e registros deste mapa” sob clique, sem reconstruir o mapa publicado a partir de respostas novas. Testes cobrem conteúdo publicado estável, texto legado acessível sob clique, exclusão de outras pessoas e rascunhos profissionais. Reteste completo: 46 testes / 11 arquivos passaram. Typecheck e build Vite também passaram após o ajuste.

Os seis instrumentos e recursos educativos, linha, direção, agenda interna, plano compartilhado e retorno foram exercitados na UI. O ciclo clínico completo de práticas prescritas foi verificado por testes de serviço/componentes, não encerrado pela interface. A rodada não certifica voz, login real, sincronização entre dispositivos, Google Agenda, backup ou segregação no servidor. Não há evidência de restauração das respostas antigas da conta da usuária.

Prévia final: 0.0.358, build concluído com sucesso em 12/10 às 15:19, observado no Inspetor de Build. Conferido na UI: botão “Respostas e registros deste mapa” abre os registros atuais da simulação. Integração da Consciência também preenchida em oito momentos, encerrada e status Concluída confirmado. A área Práticas foi aberta: estado vazio contextualizado, remetendo ao desenvolvimento educativo, pois não havia prática clínica prescrita.
