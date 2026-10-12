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

225 testes de questionários em 21 arquivos; 77 testes focados em 14 arquivos (mapa, leitura, demo, privacidade, Linha da Vida, práticas e resumo); 17 testes do Planner em 6 arquivos. Tipos e build Vite passaram. Nenhuma chamada ou alteração de conteúdo real foi feita por esses testes.

A suíte antiga initial-map teve três expectativas de apresentação ainda incompatíveis com a leitura atual (linhas literais expostas e textos anteriores). Não foi declarada verde. As regras de publicação imutável e a revisão completa dessa suíte permanecem necessárias. Uma quarta expectativa de cobertura foi identificada durante a mudança e preservada para estado concluído sem respostas carregadas; cobertura com respostas de C1 não confunde capítulo com dimensão.

## Limites e pendências da simulação

A data exata na Linha da Vida foi recusada pela automação, embora o campo DOM estivesse preenchido; ano aproximado funcionou. Necessário distinguir evento de entrada do navegador automatizado e bug do app em teste dedicado. Ditado de voz, autenticação/e-mail, conta real, servidor gerenciado, restauração de backup e Google Agenda externa não foram homologados. Não foi feita reinicialização da demonstração nem exclusão de dados. Não houve publicação em produção.
