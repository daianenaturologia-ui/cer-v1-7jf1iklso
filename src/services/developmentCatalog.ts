export interface DevelopmentResource {
  id: string
  title: string
  theme: string
  lesson: string
  instructions: string[]
  fallback: string
  reflection: string
  duration: string
}

// Conteúdo educativo de desenvolvimento. Sem diagnóstico, tratamento ou prescrição.
export const DEVELOPMENT_CATALOG: DevelopmentResource[] = [
  {
    id: 'cer-ritmo-v1',
    title: 'Meu ritmo, minhas pistas',
    theme: 'Autoconhecimento',
    duration: '3 minutos de observação',
    lesson:
      'Uma rotina possível começa por observar a vida que você já tem. Seus horários, compromissos e disposição oferecem pistas; não precisam virar um rótulo fixo.',
    instructions: [
      'Escolha uma atividade comum do seu dia.',
      'Observe em que momento foi mais fácil começar e se concentrar, e o que ajudou ou interrompeu.',
      'Anote uma pista que deseja considerar na próxima tentativa. Compare dias diferentes antes de concluir.',
    ],
    fallback: 'Observe apenas um momento, sem tentar mudar a rotina inteira.',
    reflection: 'Que condição tornou esta atividade mais possível para mim?',
  },
  {
    id: 'cer-foco-v1',
    title: 'Uma coisa de cada vez',
    theme: 'Foco',
    duration: 'Um bloco escolhido por você',
    lesson:
      'Foco pode ser uma escolha pequena: saber o que merece atenção agora e o que pode esperar. Um bloco útil também precisa ter um fim.',
    instructions: [
      'Escolha uma tarefa e defina o que seria suficiente neste bloco.',
      'Escolha um tempo compatível com sua disposição e um horário de encerramento.',
      'Prepare o que precisa e reduza uma interrupção que esteja ao seu alcance.',
      'Ao terminar, registre o que avançou e decida se quer continuar em outro momento.',
    ],
    fallback: 'Prepare apenas o primeiro material ou faça a menor parte da tarefa.',
    reflection: 'O tamanho do bloco combinou com meu ritmo? O que ajustarei?',
  },
  {
    id: 'cer-margem-v1',
    title: 'Deixar espaço para a vida',
    theme: 'Rotina',
    duration: '5 minutos para planejar',
    lesson:
      'Um calendário cheio nem sempre representa uma vida bem cuidada. Planejar também é reconhecer deslocamentos, imprevistos, vínculos e descanso.',
    instructions: [
      'Olhe um dia da sua semana e identifique os compromissos que já existem.',
      'Escolha uma prioridade possível para esse dia.',
      'Reserve uma margem entre duas atividades. Considere um momento para descansar ou fazer algo de que gosta.',
      'Se tudo não couber, escolha o que reduzir, adiar ou negociar.',
    ],
    fallback: 'Abra uma pequena margem em apenas um dia.',
    reflection: 'O que coube de verdade? Onde precisei de mais espaço?',
  },
  {
    id: 'cer-encerrar-v1',
    title: 'O trabalho tem hora de acabar',
    theme: 'Limites',
    duration: '3 minutos para encerrar',
    lesson:
      'Encerrar pode ser uma habilidade a praticar. Seu trabalho faz parte da vida; o fim do expediente precisa considerar suas responsabilidades e as condições reais do dia.',
    instructions: [
      'Escolha um horário de encerramento possível.',
      'Perto desse horário, anote o próximo passo das tarefas que ficaram abertas.',
      'Guarde ou feche um material de trabalho e sinalize o encerramento da forma que fizer sentido.',
      'Observe o que facilitou ou dificultou respeitar esse limite.',
    ],
    fallback: 'Encerre apenas uma tarefa ou negocie uma redução possível hoje.',
    reflection: 'O que me faz prolongar o trabalho? Que condição posso ajustar?',
  },
  {
    id: 'cer-apoio-v1',
    title: 'Não preciso carregar tudo',
    theme: 'Apoios',
    duration: '5 minutos para preparar uma conversa',
    lesson:
      'Autonomia inclui reconhecer quando um apoio pode ajudar. Pedir ajuda não garante uma resposta, mas pode esclarecer possibilidades e limites.',
    instructions: [
      'Escolha uma dificuldade cotidiana que não precise resolver sozinha.',
      'Identifique uma pessoa ou recurso que poderia ajudar, considerando a segurança e a qualidade desse vínculo.',
      'Prepare um pedido específico: o que precisa, quando e quais alternativas existem.',
      'Decida se deseja fazer o pedido ou buscar outra possibilidade.',
    ],
    fallback: 'Escreva o pedido sem enviar. Você decide se e quando conversar.',
    reflection: 'Que apoio fez diferença? O que continua sob minha responsabilidade?',
  },
  {
    id: 'cer-desejo-v1',
    title: 'O que é viver gostosamente para mim?',
    theme: 'Sentido',
    duration: '5 minutos de escrita',
    lesson:
      'Uma vida desejada não precisa caber na imagem de sucesso de outra pessoa. Desejos, valores e condições ajudam a escolher uma direção que faça sentido para você.',
    instructions: [
      'Imagine uma semana que seria boa de viver, considerando suas condições atuais.',
      'Escolha uma coisa que deseja manter, uma que deseja mudar e uma que deseja cultivar.',
      'Observe o que essa escolha representa para você.',
      'Escolha uma pequena aproximação que queira experimentar, sem transformar tudo em obrigação.',
    ],
    fallback: 'Complete apenas: nesta semana, eu gostaria de ter um pouco mais de…',
    reflection: 'Esta escolha se aproximou da vida que quero ou veio de uma expectativa externa?',
  },
  {
    id: 'cer-pequeno-v1',
    title: 'Pequeno o bastante para começar',
    theme: 'Realização',
    duration: '5 minutos para definir o passo',
    lesson:
      'Um desejo amplo pode ganhar uma primeira ação observável. A experiência serve para aprender sobre suas condições, não para provar seu valor.',
    instructions: [
      'Escolha um desejo ou uma direção da sua Linha da Vida.',
      'Defina uma ação que esteja ao seu alcance e diga o que fará concretamente.',
      'Escolha em que situação tentará e que recurso já possui.',
      'Prepare uma versão menor para um dia difícil e um sinal simples de que a tentativa aconteceu.',
    ],
    fallback: 'Faça apenas a preparação do primeiro passo.',
    reflection: 'O passo ficou possível? Que habilidade ou apoio preciso desenvolver?',
  },
  {
    id: 'cer-retomar-v1',
    title: 'Retomar sem começar do zero',
    theme: 'Aprendizado',
    duration: '5 minutos para revisar',
    lesson:
      'Uma tentativa interrompida ainda pode ensinar. Retomar permite aproveitar o que funcionou e mudar o que não combinou com a vida real.',
    instructions: [
      'Escolha uma tentativa recente, mesmo que não tenha sido concluída.',
      'Anote o que ajudou e uma dificuldade concreta, sem resumir tudo a falta de vontade.',
      'Decida se quer manter, diminuir, mudar ou deixar esse objetivo para outro momento.',
      'Se quiser retomar, escolha um próximo passo menor e possível.',
    ],
    fallback: 'Registre apenas uma coisa que aprendeu.',
    reflection: 'O que consigo fazer com mais autonomia? Onde preciso de apoio?',
  },
]
