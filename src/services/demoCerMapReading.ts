import { buildCerMapReadings } from './cerMapReadings'
import { buildConscienciaQaFixture } from './conscienciaQaFixture'
import type { CerMapReadingSnapshot, CerMapElementReading } from '@/types/cerMapReadings'

export function createDemoCerMapReading(enrollmentId = 'demo-enr-01'): CerMapReadingSnapshot {
  const snapshot = buildCerMapReadings(
    buildConscienciaQaFixture(enrollmentId).responses,
    enrollmentId,
    'Mariana',
  )

  // 10 comportamentos canônicos com categorias variadas da escala ordinal existente
  const behaviorRows = [
    {
      label: 'insistente',
      text: 'Repete-se com frequência',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
      sourceResponseId: 'qa-me-p7a',
    },
    {
      label: 'prestativo',
      text: 'Aparece com muita força quando estou sob pressão',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
      sourceResponseId: 'qa-me-p7b',
    },
    {
      label: 'hiper_realizador',
      text: 'Aparece em algumas situações',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
      sourceResponseId: 'qa-me-p5',
    },
    {
      label: 'vitima',
      text: 'Quase nunca acontece comigo',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
      sourceResponseId: 'qa-me-p7b',
    },
    {
      label: 'hiper_racional',
      text: 'Repete-se com frequência',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p1',
      sourceResponseId: 'qa-me-p4',
    },
    {
      label: 'hipervigilante',
      text: 'Aparece com muita força quando estou sob pressão',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
      sourceResponseId: 'qa-me-p8',
    },
    {
      label: 'inquieto',
      text: 'Aparece em algumas situações',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
      sourceResponseId: 'qa-me-p2',
    },
    {
      label: 'comandante',
      text: 'Quase nunca acontece comigo',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
      sourceResponseId: 'qa-me-p5',
    },
    {
      label: 'evitativo',
      text: 'Ainda não sei dizer',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
      sourceResponseId: 'qa-rel-p7',
    },
    {
      label: 'critico',
      text: 'Repete-se com frequência',
      sourcePromptKey: 'movimentos_automaticos_frequencia_p2',
      sourceResponseId: 'qa-me-p6',
    },
  ]

  // Reação de regulação em destaque: Luta
  const regulationRows = [
    {
      label: 'Resposta de tendência frente à sobrecarga',
      text: 'Luta: Tentar resolver e controlar imediatamente; falar firme, agir rápido.',
      sourcePromptKey: 'resposta_tendencia',
      sourceResponseId: 'qa-reg-p4',
    },
  ]

  const doshaRows = [
    { label: 'Vata percentual', text: '45%' },
    { label: 'Pitta percentual', text: '35%' },
    { label: 'Kapha percentual', text: '20%' },
  ]

  // Dimensões com summary e interpretation aprofundados
  const dimensions = snapshot.dimensions.map((dim) => {
    if (dim.id === 'corpo') {
      return {
        ...dim,
        summary:
          'Mariana, seu relato corporal descreve características habituais de estrutura leve, sensibilidade ao frio em mãos e pés, fome irregular, digestão pesada e sono leve ou interrompido.',
        interpretation:
          'Seu relato reúne características corporais habituais reconhecidas ao longo de muitos anos — compleição física estreita, pele seca ou áspera, cabelo fino, frio em mãos e pés, fome irregular, digestão pesada e sono leve ou interrompido. Como o percurso de aprofundamento do Capítulo 3 ainda não foi iniciado neste cenário, não há dados para afirmar uma diferença comprovada entre estado basal e atual.\n\nSinais de tensão na mandíbula ou nos ombros e respiração superficial descritos sob momentos de sobrecarga pertencem a dimensões distintas da sua experiência. Embora possam coincidir no tempo, cabe investigar em conjunto como essas percepções dialogam, sem concluir uma causalidade direta entre corpo e mente.\n\nNa perspectiva integrativa, o convite é explorar com a profissional formas de acolher esse ritmo habitual, investigando o que traz conforto e previsibilidade sem regras rígidas.',
        summaryRows: [...doshaRows, ...dim.summaryRows],
        detailedRows: [...doshaRows, ...dim.detailedRows],
      }
    }

    if (dim.id === 'mente') {
      return {
        ...dim,
        summary:
          'Você relata emoções rápidas no corpo, antecipação dos próximos passos, ação para resolver e cobrança severa diante de erros.',
        interpretation:
          'Podemos distinguir quatro partes do seu relato: o que você sente, o que pensa, como age e como fala consigo. Sob pressão, ansiedade e preocupação aparecem junto à antecipação e à urgência de resolver; depois, você relata cansaço e dificuldade de desacelerar. Essa reunião de elementos é uma hipótese de funcionamento, não uma sequência comprovada.\n\nVocê também descreve uma experiência diferente quando está tranquila: respiração fluida, peito aberto e escuta sem pressa. Natureza, chá em silêncio e respiração calma já aparecem como recursos. A conversa pode explorar como ampliar suas opções antes de chegar à sobrecarga.',
        detailedRows: [...behaviorRows, ...dim.detailedRows],
      }
    }

    if (dim.id === 'regulacao') {
      return {
        ...dim,
        summary:
          'Frente à sobrecarga e prazos simultâneos, seu sistema dispara uma mobilização resolutiva ativa (Luta), buscando dar conta de tudo antes que a situação se desestabilize.',
        interpretation:
          'A sequência relatada é clara: em momentos de pressão e prazos acumulados, surgem batimentos acelerados, ombros contraídos e respiração superficial, percebidos alguns minutos depois. Como resposta espontânea, você assume uma postura de ação rápida e resolução autônoma, sem solicitar ajuda externa.\n\nEssa mobilização cumpre uma função nobre e compreensível, reconhecida por você mesma: afastar sentimentos de desamparo ou incompetência e preservar sua integridade profissional. Não se trata de rigidez de caráter ou agressividade, mas de uma estratégia adaptativa de defesa que garantiu segurança até aqui.\n\nO custo expresso é a estafa mental profunda ao final do dia e a dificuldade de relaxar. Abrir espaço para pausas respiratórias antes do limite e exercitar o pedido antecipado de auxílio são caminhos que ampliam seu repertório de regulação.',
        detailedRows: [...regulationRows, ...dim.detailedRows],
      }
    }

    if (dim.id === 'relacoes') {
      return {
        ...dim,
        summary:
          'Círculo íntimo seleto, lealdade profunda e dedicação dedicada, com hesitação inicial em impor limites ou pedir auxílio antes da exaustão.',
        interpretation:
          'Seus vínculos íntimos são vividos com grande generosidade, profundidade e busca por reciprocidade real. Você valoriza relações estáveis e constrói confiança aos poucos, prestando atenção à consistência e à verdade das pessoas ao seu redor.\n\nAo mesmo tempo, aparece uma dificuldade em separar o cuidar genuíno de um sentimento de sobre-responsabilização pelas necessidades de todos. O receio de ferir ou sobrecarregar quem você ama faz com que você hesite em dizer "não" e demore para manifestar cansaço ou pedir ajuda.\n\nPor outro lado, quando recebe cuidado espontâneo e desinteressado, você relata comoção e acolhimento sincero. Em conflitos, seu movimento reflexivo de recuo antes da conversa serve para organizar ideias e buscar uma reparação honesta, o que constitui um valioso recurso relacional.',
      }
    }

    if (dim.id === 'sexualidade') {
      return {
        ...dim,
        summary:
          'A intimidade e a disponibilidade para o afeto aparecem nos relatos associadas a momentos de desaceleração, segurança relacional e descanso, em contraste com períodos de cansaço e pendências acumuladas.',
        interpretation:
          'Nas suas respostas, momentos de descanso corporal e cumplicidade afetiva são descritos junto a uma maior sensação de abertura e presença para a intimidade e a celebração do vínculo.\n\nPor outro lado, quando o cotidiano acumula tarefas pendentes, prazos e pensamentos em loop sobre o dia seguinte, você relata cansaço e menor disponibilidade para o contato íntimo. Essa coocorrência pode ser investigada como parte do ritmo das suas semanas.\n\nEspaços de desaceleração mútua, segurança no vínculo, respeito a limites e comunicação gradual surgem nos seus relatos como recursos a valorizar.',
      }
    }

    if (dim.id === 'sentido') {
      return {
        ...dim,
        summary:
          'Bússola interna orientada por coerência ética, verdade e generosidade, acompanhada por momentos relatados de contemplação da natureza, silêncio, meditação e leitura.',
        interpretation:
          'O sentido de direção nos seus relatos apoia-se em valores fundamentais de dignidade humana, lealdade, verdade e generosidade. Momentos de contato com a natureza, silêncio reflexivo, meditação e leitura foram relatados por você como experiências de reabastecimento e retorno à serenidade.\n\nA generosidade aparece como um valor central; uma conexão possível a investigar na conversa é se uma autocobrança de manter-se sempre útil ou disponível pode, em certas fases, concorrer com o tempo dedicado à quietude e à contemplação.\n\nAbrir espaço para o silêncio e o descanso pode ser compreendido como uma forma de honrar esses mesmos valores no cuidado com a própria vida.',
      }
    }

    return dim
  })

  // Dicionário tipado de elementReadings com chaves estáveis
  const elementReadings: Record<string, CerMapElementReading> = {
    // ═════════════════════════════════════════════════════════════════════════
    // DOSHAS / AGNI / AMA
    // ═════════════════════════════════════════════════════════════════════════
    vata: {
      summary:
        'Características corporais habituais relatadas (estrutura leve, pele seca, sensibilidade ao frio, fome e eliminação irregulares) lidas à luz tradicional de Vata. Percentual de 45% puramente ilustrativo.',
      observations: [
        'Estrutura física leve e estreita reconhecida desde a juventude',
        'Pele seca ou áspera e cabelo fino relatados habitualmente',
        'Sensibilidade ao frio com mãos e pés frios frequentes',
        'Fome irregular e eliminação intestinal com ritmo variável',
      ],
      interpretation:
        'Na tradição ayurvédica, o princípio Vata representa movimento, leveza e variabilidade. Os sinais relatados — constituição estreita habitual, pele seca, pés e mãos frios, fome oscilante e eliminação irregular — alinham-se conceitualmente a essas qualidades tradicionais. O percentual de 45% apresentado no gráfico é unicamente um exemplo visual demonstrativo, e não um cálculo laboratorial, medição biológica ou diagnóstico clínico. Não se deve associar traços de personalidade ou talentos intelectuais a um dosha.',
      resources: [
        'Capacidade de perceber e descrever com nitidez características corporais habituais',
      ],
      costs: [
        'Sono leve ou interrompido relatado na autoavaliação',
        'Oscilação na disposição e na energia ao longo dos dias',
      ],
      connections: [
        'Uma conexão possível a explorar com a profissional é se o ritmo de atividades atual dialoga com essa oscilação de sono e energia, sem estabelecer causalidade direta.',
      ],
      questions: [
        'Olhando para a sua rotina, quais dessas características você percebe como habituais de muitos anos e o que você sente que mudou mais recentemente?',
      ],
      sourceResponseIds: ['qa-c1-p1', 'qa-c1-p2', 'qa-c1-p4', 'qa-c2-p1'],
    },

    pitta: {
      summary:
        'Princípio tradicional de calor e transformação; dados da autoavaliação insuficientes para diagnosticar constituição ou excesso. Percentual de 35% ilustrativo.',
      observations: [
        'Transpira pouco segundo o relato da autoavaliação',
        'Prefere bebidas mornas ou quentes e sente frio em extremidades',
        'Consegue esperar uma refeição sem grande desconforto imediato',
      ],
      interpretation:
        'Na tradição ayurvédica, Pitta corresponde aos processos metabólicos, digestivos e de transformação térmica. O percentual de 35% exibido no gráfico é meramente didático e ilustrativo. Os dados relatados nesta autoavaliação — que registram pouca transpiração e ausência de queixas clássicas de queimação — são insuficientes para validar constituição predominante ou apontar excesso de Pitta. Características como foco ou irritabilidade não devem ser explicadas por causalidade humoral sem base empírica.',
      resources: ['Atenção às respostas corporais de digestão e temperatura quando questionada'],
      costs: [
        'Dados insuficientes no relato atual para mapear custos corporais específicos ligados a calor',
      ],
      connections: [
        'Permanece como dimensão aberta a ser acompanhada caso surjam sinais digestivos ou térmicos em outras fases',
      ],
      questions: [
        'Você nota no seu corpo algum sinal relacionado a calor, queimação ou alterações digestivas que ainda não tenha descrito?',
      ],
      sourceResponseIds: ['qa-me-p5', 'qa-c2-p5', 'qa-c1-p5c'],
    },

    kapha: {
      summary:
        'Princípio tradicional de estrutura e sustentação; sensação de peso relatada sem validação de constituição fixa. Percentual de 20% ilustrativo.',
      observations: [
        'Sensação relatada de digestão pesada após determinadas refeições',
        'Sensação de corpo pesado ao despertar em alguns períodos',
        'Reconhecimento de ritmos habituais mantidos ao longo de muitos anos',
      ],
      interpretation:
        'No Ayurveda, Kapha simboliza estabilidade, coesão estrutural e lubrificação dos tecidos. O percentual de 20% no gráfico compõe apenas o exemplo visual de navegação. A sensação de peso após refeições e o corpo pesado ao despertar foram descritos no seu relato, mas não validam um diagnóstico de constituição Kapha. Traços relacionais, como lealdade ou dificuldade de dizer não, não devem ser atribuídos ao dosha; da mesma forma, o peso matinal é uma percepção a ser investigada sem inferir causa definitiva.',
      resources: ['Percepção dos próprios ritmos e atenção às sensações corporais ao longo do dia'],
      costs: ['Sensação de peso corporal relatada ao despertar e após refeições mais densas'],
      connections: [
        'A relação entre a qualidade do sono e a sensação de peso ao acordar pode ser explorada na conversa como uma possibilidade a compreender, sem afirmar causa fechada.',
      ],
      questions: [
        'A sensação de peso após refeições ou ao acordar é algo habitual de muitos anos ou costuma variar em determinados períodos do mês?',
      ],
      sourceResponseIds: ['qa-rel-p1', 'qa-c2-p9', 'qa-sen-p5'],
    },

    agni: {
      summary:
        'Digestão pesada, fome irregular e retorno de apetite variável relatados, lidos na tradição como irregularidade do fogo digestivo a explorar em conversa.',
      observations: [
        'Fome irregular no cotidiano',
        'Retorno da fome variável entre as refeições',
        'Digestão percebida como pesada',
        'Alimentos gordurosos ou pesados exigem mais do organismo',
        'Eliminação intestinal com ritmo irregular',
      ],
      interpretation:
        'Na visão ayurvédica, Agni representa a capacidade digestiva e de assimilação de nutrientes e estímulos. A alternância entre fome imprevisível, retorno de apetite variável e digestão pesada é tradicionalmente descrita como uma dinâmica irregular de Agni (Vishama Agni). Essa leitura não constitui um diagnóstico clínico nem uma prescrição de conduta, servindo como ponto de partida para dialogar com a profissional sobre sua experiência alimentar.',
      resources: [
        'Capacidade de descrever com clareza os sinais corporais de apetite, digestão e ritmo intestinal',
      ],
      costs: [
        'Sensação de peso pós-refeição relatada',
        'Ritmo digestivo e eliminatório variável no cotidiano',
      ],
      connections: [
        'Pode ser investigada a forma como os períodos de maior exigência na rotina coincidem ou não com essa variabilidade digestiva, sem presumir causalidade direta.',
      ],
      questions: [
        'Em quais contextos do seu dia a dia você percebe que a digestão flui com mais leveza ou com maior peso?',
      ],
      sourceResponseIds: ['qa-c2-p1', 'qa-c2-p3', 'qa-c2-p6'],
    },

    ama: {
      summary:
        'Sensação de digestão pesada, corpo pesado ao despertar e eliminação pegajosa/incompleta relatadas; leitura tradicional de processamento incompleto sem diagnóstico.',
      observations: [
        'Digestão percebida como pesada',
        'Eliminação intestinal descrita como pegajosa ou incompleta',
        'Sensação de corpo pesado ao despertar',
      ],
      interpretation:
        'Ama é uma categoria tradicional do Ayurveda que descreve sinais de processamento ou assimilação incompleta no trato digestivo. Não equivale a toxinas laboratoriais mensuráveis nem autoriza diagnósticos médicos ou protocolos prescritivos. Trata-se de uma chave de reflexão sobre como o organismo vem processando a rotina e os alimentos, a ser explorada de forma colaborativa com a profissional.',
      resources: [
        'Observação atenta de variações corporais ao longo do tempo para revisar conjuntamente com a profissional',
      ],
      costs: [
        'Desconforto associado à digestão pesada e eliminação pegajosa ou incompleta',
        'Corpo pesado ao despertar em certos dias',
      ],
      connections: [
        'Vale investigar se essas sensações se intensificam em períodos de sono mais entrecortado ou dias com menor regularidade alimentar, como hipótese a confirmar.',
      ],
      questions: [
        'Quando você percebe mais nitidamente esses sinais de peso e quais condições de rotina ou alimentação parecem acompanhar esses momentos?',
      ],
      sourceResponseIds: ['qa-c2-p3', 'qa-c2-p9'],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 10 PADRÕES DE PROTEÇÃO
    // ═════════════════════════════════════════════════════════════════════════
    insistente: {
      summary:
        'Categoria no exemplo: Repete-se com frequência. Relato de buscar fazer as coisas do jeito certo e voz interna cobrando antecipação.',
      observations: [
        'Marcado na categoria "Repete-se com frequência" na escala do questionário de demonstração',
        'Relatada a busca por "fazer tudo impecavelmente certo"',
        'Diálogo interno relatado diante de imprevistos ou falhas: "deveria ter previsto isso"',
      ],
      interpretation:
        'O padrão Insistente reflete um cuidado atento com a qualidade, organização e responsabilidade diante de compromissos assumidos. Como hipótese a explorar na conversa, vale investigar se a busca por fazer impecavelmente certo pode, em certos momentos, sustentar consistência, mas também dificultar a finalização de tarefas ou o fechamento de ciclos.',
      resources: [
        'Cuidado com a organização e atenção à qualidade dos processos',
        'Senso de compromisso e dedicação às entregas',
      ],
      costs: [
        'Como hipótese a investigar: sensação de sobrecarga ao tentar garantir que nada escape ao controle',
        'Possível adiamento do descanso enquanto restarem detalhes percebidos como pendentes',
      ],
      connections: [
        'Pode dialogar com a autocrítica relatada diante de erros imprevistos',
        'Vale observar na conversa se dificulta o compartilhamento de tarefas na rotina',
      ],
      questions: [
        'Em quais situações você sente que buscar o impecável ajuda você, e quando essa mesma busca parece tornar o fechamento de uma tarefa mais pesado?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p8', 'qa-me-p4'],
    },

    prestativo: {
      summary:
        'Categoria: Aparece com muita força quando estou sob pressão. Movimento de cuidar e assumir a frente para devolver harmonia, hesitando em pedir ajuda.',
      observations: [
        'Na demonstração, este movimento aparece sob pressão; em outro registro, você o marcou como às vezes. Vale investigar como o contexto muda sua experiência.',
        'Relato espontâneo: "Assumo a frente para resolver logo e devolver a tranquilidade ao ambiente"',
        'Hesitação em dizer não por receio de sobrecarregar ou ferir outrem',
        'Costuma esgotar as próprias forças antes de solicitar suporte externo',
      ],
      interpretation:
        'Você relata assumir a frente para devolver tranquilidade ao ambiente, hesitar em dizer não e pedir apoio apenas quando já está cansada. Uma hipótese é que cuidar e resolver ajudem a preservar o vínculo, enquanto suas necessidades recebem atenção mais tarde. Isso precisa ser reconhecido ou corrigido por você.\n\nReceber cuidado sincero já aparece como uma experiência significativa. Podemos explorar como oferecer e receber apoio podem coexistir, sem concluir que você precisa cuidar de todos.',
      resources: [
        'Você reconhece o valor da reciprocidade e se emociona ao receber cuidado sincero.',
        'Conversa franca, escuta e reparação são recursos relatados nas relações.',
      ],
      costs: [
        'Você relata esgotar as forças antes de solicitar ajuda.',
        'Vale observar se hesitar em dizer não deixa menos espaço para suas necessidades.',
      ],
      connections: [
        'A ação imediata também aparece na regulação sob pressão; a relação entre cuidar e resolver merece conversa.',
        'Você descreve descanso e desaceleração junto a maior disponibilidade para intimidade.',
      ],
      questions: [
        'O que ajudaria você a pedir apoio antes de chegar ao limite?',
        'Quando cuidar é uma escolha sua e quando passa a ser uma responsabilidade que você gostaria de dividir?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p5', 'qa-rel-p4', 'qa-rel-p5'],
    },

    hiper_realizador: {
      summary:
        'Categoria: Aparece em algumas situações. Foco resolutivo e ação orientada a resultados como forma de combater a incerteza.',
      observations: [
        'Marcado na categoria intermediária de frequência nas respostas',
        'Relatada iniciativa para solucionar pendências e devolver estabilidade',
      ],
      interpretation:
        'A categoria do exemplo é “aparece em algumas situações”. Você relata tomar a frente para resolver pendências, especialmente sob pressão. Isso permite explorar sua mobilização para agir, mas não comprova produtividade constante, eficiência extraordinária ou que seu valor pessoal dependa das entregas.\n\nUma hipótese é que a ação ofereça previsibilidade no curto prazo e que a recuperação receba menos espaço. O cansaço e a dificuldade de relaxar foram relatados; a ligação deles com esse movimento precisa ser investigada.',
      resources: [
        'Iniciativa para resolver situações práticas, descrita por você.',
        'Capacidade de reconhecer cansaço e notar seus movimentos.',
      ],
      costs: [
        'Estafa mental e dificuldade para relaxar foram relatadas na regulação.',
        'Vale investigar como esforço e recuperação se alternam nos seus dias.',
      ],
      connections: [
        'Pode dialogar com assumir tarefas sem pedir apoio e com antecipar riscos.',
        'A relação com descanso e intimidade permanece uma hipótese a explorar.',
      ],
      questions: [
        'Em que situações agir logo ajuda você, e quando dividir ou adiar uma tarefa seria mais útil?',
        'Como você percebe que já fez o suficiente por hoje?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p5'],
    },

    vitima: {
      summary:
        'Categoria no exemplo: Quase nunca acontece comigo. Cansaço relatado não equivale a desesperança ou passividade.',
      observations: [
        'Marcado na categoria "Quase nunca acontece comigo" no questionário de demonstração',
        'Relatos apontam disposição para intervir e resolver situações práticas',
      ],
      interpretation:
        'A marcação de "quase nunca acontece comigo" faz parte das opções da escala do exemplo de demonstração. Nos relatos, seu movimento espontâneo tende mais à ação diante de problemas do que à inércia. É essencial pontuar que sentir cansaço físico ou mental não equivale a desesperança ou vitimização; trata-se de um sinal corporal compreensível frente à sobrecarga.',
      resources: [
        'Disposição para agir diante de dificuldades práticas',
        'Reconhecimento da própria capacidade de buscar caminhos possíveis',
      ],
      costs: [
        'Hipótese a verificar na conversa: se a tendência a seguir agindo pode dificultar reconhecer momentos em que o corpo pede apenas pausa e acolhimento',
      ],
      connections: [
        'Dialoga com a preferência relatada por agir rápido sob sobrecarga',
        'Pode ser explorado em relação ao tempo que leva para pedir apoio externo',
      ],
      questions: [
        'Quando continuar agindo com força total perde o sentido e o que o momento realmente pede é pausa e acolhimento?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p5'],
    },

    hiper_racional: {
      summary:
        'Categoria: Repete-se com frequência. Cálculo preventivo dos próximos passos para organizar cenários e evitar surpresas.',
      observations: [
        'Marcado com frequência expressiva na avaliação dos padrões de proteção',
        'Citação textual: "Fico calculando os próximos passos para não deixar nada desmoronar nem falhar com ninguém"',
        'Identificação clara de gatilhos profissionais e relacionais de sobrecarga',
      ],
      interpretation:
        'Você descreve calcular os próximos passos para evitar falhas e pensamentos acelerados em loop quando a pressão aumenta. Planejar pode ajudar a organizar incertezas; vale explorar quando ele permanece útil e quando continua mesmo sem uma decisão concreta a tomar.\n\nNão sabemos se isso afasta você das emoções. Você também relata sentir rapidamente no corpo e escutar com mais tranquilidade quando está bem. Uma possibilidade de conversa é integrar planejamento e percepção corporal antes de agir.',
      resources: [
        'Você consegue descrever o que passa pela mente e reconhecer situações de pressão.',
        'Respiração tranquila e contato com a natureza são recursos relatados.',
      ],
      costs: [
        'Pensamentos em loop e dificuldade de relaxar constam nos relatos.',
        'A relação com o sono interrompido merece investigação; a causa não foi estabelecida.',
      ],
      connections: [
        'Antecipação também aparece em Hipervigilante e autocobrança em Crítico.',
        'Sinais corporais e pensamentos podem ser observados juntos sem concluir direção causal.',
      ],
      questions: [
        'Quando o planejamento resolve uma questão e quando apenas repete a preocupação?',
        'O que você percebe no corpo antes de decidir o próximo passo?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p4', 'qa-me-p3'],
    },

    hipervigilante: {
      summary:
        'Categoria: Aparece com muita força quando estou sob pressão. Tensão corporal e prontidão para detectar riscos antes que se concretizem.',
      observations: [
        'Marcado sob pressão nos comportamentos automáticos',
        'Selecionado como padrão prioritário: "Antecipar e prevenir qualquer risco"',
        'Retrato corporal sob sobrecarga: "Tensão na mandíbula, pensamentos acelerados em loop e urgência de controlar tudo"',
      ],
      interpretation:
        'Na demonstração, este movimento aparece com força sob pressão. Você relatou antecipar riscos, tensão na mandíbula, ombros contraídos, respiração superficial e pensamentos em loop. A busca de previsibilidade pode ser uma função desse movimento, especialmente diante de prazos simultâneos e ruídos de comunicação.\n\nO material não demonstra prontidão permanente, crises iminentes ou uma condição clínica. Podemos explorar quando antecipar protege de um risco concreto e quando aumenta o esforço sem ampliar suas opções.',
      resources: [
        'Você reconhece os contextos de pressão e identifica sinais alguns minutos depois.',
        'Pausas respiratórias e alongamento são recursos relatados.',
      ],
      costs: ['Tensão corporal, estafa mental e dificuldade para relaxar à noite foram relatadas.'],
      connections: [
        'A resposta de resolver tudo imediatamente também aparece em Luta.',
        'A relação entre antecipação, tensão e descanso precisa ser reconhecida ou corrigida por você.',
      ],
      questions: [
        'Que risco concreto está presente nesta situação e o que é uma possibilidade antecipada?',
        'Que sinal poderia ajudar você a perceber a tensão um pouco antes?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p8', 'qa-me-p11'],
    },

    inquieto: {
      summary:
        'Categoria do exemplo: aparece em algumas situações. Entusiasmo foi relatado; ainda faltam exemplos para compreender mudanças de foco.',
      observations: [
        'Marcado em frequência intermediária nas respostas',
        'Emoção de "Entusiasmo" assinalada como recorrente ao lado da ansiedade',
      ],
      interpretation:
        'Você marcou entusiasmo entre as emoções frequentes, e a categoria do exemplo é “aparece em algumas situações”. Isso não basta para afirmar múltiplos interesses, criatividade, dispersão ou fuga por distração.\n\nUma possibilidade é investigar momentos em que mudar de atividade atende a uma prioridade real, oferece uma pausa ou adia um desconforto. O significado desse movimento depende da situação e da sua experiência; não será deduzido de um dosha.',
      resources: [
        'Você consegue nomear emoções presentes, incluindo entusiasmo.',
        'Reconhecer a situação antes de mudar de foco pode ser uma possibilidade a experimentar.',
      ],
      costs: [
        'Este material não estabelece um custo específico de mudar de atividade.',
        'Vale perguntar se abrir novas tarefas aumenta ou reduz a pressão em alguma situação.',
      ],
      connections: [
        'Entusiasmo, energia oscilante e pressão foram descritos; a relação entre eles permanece aberta.',
      ],
      questions: ['Quando você muda de atividade, o que estava acontecendo e o que muda depois?'],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p2'],
    },

    comandante: {
      summary:
        'Categoria do exemplo: quase nunca acontece comigo. Assumir a frente para resolver não permite concluir como você exerce controle sobre outras pessoas.',
      observations: [
        'Frequência quase nunca apontada na escala de respostas',
        'Postura resolutiva voltada ao bem coletivo: resolver logo para devolver a paz ao ambiente',
      ],
      interpretation:
        'Você relata tomar a frente para resolver e devolver tranquilidade ao ambiente. A categoria “quase nunca” não comprova ausência de controle, nem autoriza atribuir um perfil de liderança.\n\nVale diferenciar assumir uma tarefa, coordenar uma decisão e decidir por outras pessoas. Podemos investigar se há espaço para colaboração e como você negocia limites, sem antecipar que sua conduta seja impositiva ou sempre respeitosa.',
      resources: [
        'Iniciativa para resolver foi relatada.',
        'Conversa franca e escuta são recursos descritos nas relações.',
      ],
      costs: [
        'Você relata agir sem pedir apoio e pedir ajuda depois de se esgotar.',
        'É uma hipótese a explorar se assumir a frente concentra responsabilidades.',
      ],
      connections: ['Pode ser conversado junto à mobilização de Luta e aos limites nas relações.'],
      questions: [
        'Quando você assume a frente, como as outras pessoas participam das escolhas e das tarefas?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p5'],
    },

    evitativo: {
      summary:
        'Categoria do exemplo: ainda não sei dizer. Você relata recuar para organizar as ideias; ainda precisamos conhecer o que acontece depois em cada situação.',
      observations: [
        'Marcado explicitamente como "Ainda não sei dizer" na avaliação dos padrões',
        'Nos conflitos: "Recuo reflexivo temporário para organizar as ideias antes do confronto"',
      ],
      interpretation:
        'A categoria mantém sua incerteza. Você relata um recuo temporário nos conflitos para organizar ideias e descreve conversa franca, escuta e pedido de desculpas como formas de reparação. Isso não demonstra que sempre retorne à conversa nem que evite intimidade.\n\nUma pausa pode dar espaço à reflexão ou adiar um assunto. O que diferencia essas possibilidades é a experiência concreta: como você se sente, quanto dura o intervalo e se a questão pode ser retomada.',
      resources: [
        'Você reconhece a necessidade de organizar ideias antes de conversar.',
        'Escuta, diálogo e reparação aparecem nos relatos.',
      ],
      costs: [
        'Não há relato suficiente para estabelecer um custo específico da esquiva.',
        'Vale investigar se algum assunto fica pendente após o intervalo.',
      ],
      connections: [
        'Confiança gradual e negociação de limites podem ajudar a contextualizar esses recuos.',
      ],
      questions: [
        'Depois de se afastar, você costuma retomar a conversa? O que ajuda ou dificulta esse retorno?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-rel-p7'],
    },

    critico: {
      summary:
        'Categoria do exemplo: repete-se com frequência. Você relata uma voz interna severa cobrando que deveria ter previsto o erro.',
      observations: [
        'Frequência alta assinalada no questionário de mente e padrões',
        'Diálogo interno literal diante do erro: "Quando cometo um erro, uma voz me cobra severamente que eu deveria ter previsto isso"',
      ],
      interpretation:
        'Diante de um erro, você relata uma voz que cobra severamente que deveria ter previsto. Essa cobrança pode tentar prevenir novas falhas, mas sua utilidade e seus efeitos precisam ser explorados, sem concluir que ela define sua autoestima ou seu caráter.\n\nPodemos distinguir avaliar o que aconteceu de exigir que você antecipasse tudo. Uma resposta mais justa ao erro pode considerar o que era possível saber, o que merece reparação e o que já foi aprendido.',
      resources: [
        'Você consegue reconhecer e descrever o diálogo interno.',
        'Reconhecer erros e conversar sobre reparação aparece nas relações.',
      ],
      costs: [
        'Cobrança severa diante de erros foi relatada.',
        'A conexão com cansaço e tensão é uma hipótese a explorar.',
      ],
      connections: [
        'Fazer tudo certo e antecipar riscos aparecem em outros movimentos do mapa.',
        'Vale perguntar como essa cobrança muda quando você está mais descansada.',
      ],
      questions: [
        'O que era possível prever naquela situação e o que só ficou claro depois?',
        'Que resposta ao erro seria firme e justa com você?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p6'],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 4 REAÇÕES DE REGULAÇÃO
    // ═════════════════════════════════════════════════════════════════════════
    luta: {
      summary:
        'Tendência espontânea relatada: mobilização ativa para intervir, resolver logo e devolver tranquilidade ao ambiente.',
      observations: [
        'Contexto de ativação: sobrecarga de prazos simultâneos e ruídos de comunicação',
        'Primeiros sinais: aceleração do batimento cardíaco, ombros contraídos e respiração superficial',
        'Resposta declarada: mobilização hiperativa para resolver tudo imediatamente sem pedir auxílio',
        'Função percebida: evitar sensação de desamparo/incompetência e garantir previsibilidade profissional',
        'Custo: estafa mental profunda e dificuldade para relaxar à noite',
      ],
      interpretation:
        'Você relata prazos simultâneos e ruídos de comunicação, seguidos de coração acelerado, ombros contraídos e respiração superficial. Sua resposta descrita é tentar resolver imediatamente sem pedir auxílio; você reconhece a função de evitar desamparo ou incompetência e proteger a integridade profissional.\n\nNeste material, Luta nomeia essa mobilização para resolver. O relato não permite concluir como você age em todos os conflitos. Podemos explorar outras opções ao lado da ação, sobretudo porque você descreve estafa e dificuldade de relaxar depois.',
      resources: [
        'Você identifica sinais e a função que reconhece em sua resposta.',
        'Respiração lenta e alongamento são recursos relatados.',
      ],
      costs: [
        'Ombros contraídos, respiração superficial, estafa mental e dificuldade de relaxar foram relatados.',
      ],
      connections: [
        'Antecipação e autocobrança aparecem no mesmo material; suas relações precisam ser exploradas.',
        'Pedir apoio tarde é um ponto de conversa nas relações.',
      ],
      questions: [
        'Quando percebe a tensão, o que ajudaria você a avaliar se precisa agir sozinha, dividir a tarefa ou negociar a demanda?',
      ],
      sourceResponseIds: ['qa-reg-p1', 'qa-reg-p2', 'qa-reg-p4', 'qa-reg-p5', 'qa-reg-p6'],
    },

    fuga: {
      summary:
        'Não destacada no exemplo. O material não permite concluir presença, ausência ou intensidade dessa reação em outros contextos.',
      observations: [
        'A resposta descrita diante de sobrecarga foi resolver imediatamente.',
        'Nas relações, você relata um recuo temporário para organizar ideias.',
      ],
      interpretation:
        'Fuga descreve aqui o movimento de criar distância diante de uma situação percebida como difícil. Como não foi destacada nesta demonstração, não sabemos como aparece em outros contextos.\n\nO recuo nas relações não comprova Fuga: pode ter diferentes funções, que precisam ser compreendidas por você. Podemos investigar o que acontece antes, durante e depois de um afastamento, sem classificá-lo de antemão.',
      resources: [
        'Possibilidade a explorar: um intervalo pode oferecer espaço para avaliar a situação.',
        'Não foi estabelecido um recurso pessoal específico dessa reação.',
      ],
      costs: [
        'Não há custo individual estabelecido no material.',
        'Como possibilidade, vale observar se o afastamento ajuda a retomar ou deixa algo pendente.',
      ],
      connections: [
        'Pode ser conversado junto ao recuo reflexivo nas relações, sem equivalência automática.',
      ],
      questions: ['Em que situação afastar-se ajuda você e como decide quando retomar?'],
      sourceResponseIds: ['qa-reg-p4', 'qa-rel-p7'],
    },

    paralisacao: {
      summary:
        'Não destacada no exemplo. Cansaço e peso ao despertar não comprovam essa reação, nem permitem excluir sua presença em outros contextos.',
      observations: [
        'A resposta descrita sob pressão foi ação imediata.',
        'Você relata estafa mental posteriormente; isso não estabelece Paralisação.',
      ],
      interpretation:
        'Paralisação nomeia aqui situações em que agir ou responder parece difícil ou suspenso. Não foi destacada neste exemplo, mas essa informação não determina como você reage em todas as situações.\n\nCansaço, sono interrompido e peso ao despertar foram relatados em outras partes do mapa. Não equivalem a Paralisação e não serão explicados como fadiga muscular comprovada. Se você reconhecer momentos de ficar sem ação, podemos explorar seu contexto.',
      resources: [
        'Possibilidade a explorar: reconhecer e nomear um momento de suspensão pode ampliar escolhas.',
        'O material não estabelece um recurso individual dessa reação.',
      ],
      costs: ['Não há custo específico dessa reação estabelecido no relato.'],
      connections: [
        'Distinguir dificuldade de agir, pausa escolhida e cansaço ajuda a compreender situações concretas.',
      ],
      questions: [
        'Você reconhece algum momento em que queria agir ou falar e não conseguia? Como foi para você?',
      ],
      sourceResponseIds: ['qa-reg-p4', 'qa-me-p5', 'qa-reg-p6'],
    },

    submissao: {
      summary:
        'Não destacada no exemplo. Hesitar em dizer não não comprova essa reação; sua função precisa ser compreendida em cada situação.',
      observations: [
        'Você relata hesitar em dizer não por receio de ferir ou sobrecarregar outra pessoa.',
        'Diante da sobrecarga, a resposta descrita foi tentar resolver imediatamente.',
      ],
      interpretation:
        'Submissão ou apaziguamento nomeia aqui ceder ou concordar para reduzir atrito. Não foi destacada no exemplo e o material não permite afirmar presença, ausência ou intensidade em outras situações.\n\nSua hesitação em dizer não pode ter mais de uma função. Podemos explorar quando uma concessão é uma escolha que você deseja fazer e quando sente pouca liberdade para negociar, sem atribuir ressentimento ou habilidade diplomática não relatados.',
      resources: [
        'Conversa franca e escuta são recursos descritos nas relações.',
        'Negociar limites é uma possibilidade a explorar, não uma habilidade presumida.',
      ],
      costs: [
        'Hesitação em dizer não e pedido tardio de apoio foram relatados.',
        'Não foi estabelecido um custo específico dessa reação.',
      ],
      connections: [
        'Relaciona-se como pergunta aos limites e à reciprocidade; não é uma classificação automática do seu cuidado.',
      ],
      questions: [
        'Em que situações você sente liberdade para concordar, discordar ou propor outra possibilidade?',
      ],
      sourceResponseIds: ['qa-rel-p4', 'qa-me-p5', 'qa-reg-p4'],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 6 NÓS DO FUNCIONAMENTO EM CONJUNTO
    // ═════════════════════════════════════════════════════════════════════════
    corpo: {
      summary:
        'Nó Corpo & Ritmo: características corporais, digestivas e de sono habituais reconhecidas ao longo de muitos anos, em diálogo com o ritmo do cotidiano.',
      observations: [
        'Estrutura corporal leve e estreita desde a juventude',
        'Pele seca ou áspera, cabelo fino e frio habitual em mãos e pés',
        'Fome irregular, retorno da fome variável e digestão pesada',
        'Eliminação irregular e pegajosa ou incompleta',
        'Sono leve ou interrompido e sensação de corpo pesado ao despertar',
      ],
      interpretation:
        'O nó do Corpo reúne características habituais que você reconhece em si há muitos anos. Como o percurso de aprofundamento do Capítulo 3 ainda não foi iniciado neste cenário, não há dados para contrastar um estado basal comprovado com alterações atuais. Além disso, as tensões de mandíbula e ombros e a alteração respiratória relatadas sob pressão provêm da dimensão de regulação emocional; distingui-las de traços fisiológicos habituais ajuda a não presumir causalidade direta e única entre corpo e mente.',
      resources: [
        'Percepção da tensão corporal alguns minutos depois de sua instalação',
        'Práticas de respiração lenta, alongamento, silêncio e contato com a natureza relatadas como úteis para reencontrar o eixo',
      ],
      costs: [
        'Oscilação de vitalidade e energia ao longo dos dias',
        'Sono leve ou interrompido com sensação de corpo pesado ao despertar',
      ],
      connections: [
        'Pode ser explorado na conversa como a oscilação de energia dialoga com momentos de sobrecarga ou cobrança mental, como hipótese aberta.',
        'Vale acompanhar como o descanso corporal influencia a disposição para a convivência e a intimidade.',
      ],
      questions: [
        'Como você poderia experimentar notar a tensão corporal um pouco antes, como uma escolha consciente no seu cotidiano?',
      ],
      sourceResponseIds: ['qa-c1-p1', 'qa-c1-p4', 'qa-c2-p1', 'qa-c2-p3', 'qa-c2-p8', 'qa-c2-p9'],
    },

    pensamentos: {
      summary:
        'Nó Pensamentos: antecipação preventiva de cenários, planejamento contínuo e diálogo interno exigente.',
      observations: [
        'Cálculo de passos futuros para não falhar nem deixar desmoronar',
        'Voz autocrítica que repreende enganos afirmando que deveria ter previsto',
        'Pensamentos acelerados em loop em momentos de alta pressão',
      ],
      interpretation:
        'Você relata antecipar próximos passos, cobrar de si que deveria ter previsto erros e perceber pensamentos em loop sob pressão. Uma hipótese é que planejar busque previsibilidade, enquanto a cobrança aumenta a exigência de não falhar.\n\nAinda não sabemos quando esses pensamentos ocorrem em relação ao sono. Podemos explorar situações concretas em que planejar ajuda e outras em que a repetição continua sem produzir uma nova escolha.',
      resources: [
        'Você reconhece pensamentos, diálogo interno e situações que costumam acioná-los.',
        'Pausas em silêncio e respiração são recursos relatados.',
      ],
      costs: [
        'Pensamentos em loop e estafa mental constam nos relatos.',
        'Sono interrompido também foi relatado; sua relação com os pensamentos não foi estabelecida.',
      ],
      connections: [
        'Coocorre no material com tensão corporal e ação imediata; não determina uma sequência causal.',
      ],
      questions: [
        'Como você percebe a diferença entre um plano útil e uma preocupação que está se repetindo?',
      ],
      sourceResponseIds: ['qa-me-p4', 'qa-me-p6', 'qa-me-p11'],
    },

    emocoes: {
      summary:
        'Nó Emoções: vivacidade afetiva sentida no corpo, ansiedade e entusiasmo caminhando lado a lado.',
      observations: [
        'Emoções vividas com intensidade e rapidez corporal imediata',
        'Ansiedade, entusiasmo e preocupação identificados como sentimentos frequentes',
        'Sensação de peito aberto e respiração livre nos momentos de harmonia e segurança',
      ],
      interpretation:
        'Você descreve emoções rápidas e intensas no corpo, incluindo ansiedade, entusiasmo e preocupação. Quando está tranquila, relata peito aberto, respiração fluida e escuta sem pressa. Esses contrastes ajudam a observar sua experiência sem concluir que você sempre expressa ou reprime emoções.\n\nDemandas no trabalho e conversas inacabadas aparecem como contextos importantes. Podemos explorar o que cada emoção sinaliza e como você escolhe agir, sem atribuir seus sinais digestivos a uma causa emocional.',
      resources: [
        'Você consegue nomear emoções e descrever sinais no corpo.',
        'Natureza, silêncio e respiração calma foram relatados como úteis.',
      ],
      costs: [
        'Ansiedade, preocupação e tensão corporal constam nos relatos.',
        'Não foi estabelecido um efeito emocional específico sobre a digestão.',
      ],
      connections: [
        'Pensamentos antecipatórios e mobilização para resolver aparecem nas mesmas situações de pressão.',
        'Reciprocidade e segurança relacional ajudam a contextualizar as experiências, sem explicar tudo.',
      ],
      questions: [
        'O que você sente primeiro numa situação de pressão e o que precisa antes de agir?',
      ],
      sourceResponseIds: ['qa-me-p1', 'qa-me-p2', 'qa-me-p10'],
    },

    protecao: {
      summary:
        'Movimentos atuais de antecipar, cobrar de si e resolver sob pressão. Suas origens ainda não foram contextualizadas pela Linha da Vida.',
      observations: [
        'Busca relatada por fazer tudo impecavelmente certo e antecipar riscos.',
        'Ação imediata para resolver diante de sobrecarga.',
        'Função reconhecida por você: evitar desamparo ou incompetência e proteger a integridade profissional.',
      ],
      interpretation:
        'Você descreve movimentos que buscam previsibilidade e integridade profissional. Podemos explorar como eles ajudam em certos contextos e como ficam mais exigentes sob pressão. Isso não permite afirmar quando surgiram ou qual papel tiveram na construção da sua competência.\n\nA direção possível é ampliar escolhas: agir, pedir apoio, negociar uma demanda ou fazer uma pausa, conforme a situação. Sua história poderá ajudar a contextualizar esses movimentos quando você desejar compartilhá-la.',
      resources: [
        'Você consegue identificar movimentos e a função que percebe neles.',
        'Respiração e alongamento já são recursos conhecidos.',
      ],
      costs: [
        'Estafa mental, tensão e dificuldade de relaxar foram relatadas.',
        'Vale investigar quando a ação imediata deixa pouco espaço para apoio.',
      ],
      connections: [
        'Luta, antecipação e autocobrança aparecem como movimentos a explorar em conjunto.',
        'Ainda faltam marcos de vida para relacionar esse retrato a acontecimentos específicos.',
      ],
      questions: [
        'Em que situação esse movimento ajuda e em qual você gostaria de ter outra opção?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p7b', 'qa-me-p5', 'qa-reg-p5'],
    },

    relacoes: {
      summary:
        'Nó Relações: dedicação profunda a laços autênticos, reciprocidade e o desafio de delimitar fronteiras de responsabilidade.',
      observations: [
        'Círculo íntimo seleto com alto nível de dedicação e lealdade profunda',
        'Hesitação em dizer não e demora em solicitar auxílio',
        'Acolhimento sincero e comoção ao receber cuidado desinteressado',
        'Reparação de conflitos através de conversa franca e escuta atenta',
      ],
      interpretation:
        'Você descreve vínculos seletos, reciprocidade, confiança gradual e emoção ao receber cuidado sincero. Também relata hesitar em dizer não e pedir apoio quando já está esgotada. Uma hipótese é que cuidar dos vínculos e expressar suas necessidades nem sempre encontrem o mesmo espaço.\n\nPodemos investigar como dividir responsabilidades antes do limite, sem presumir isolamento, obrigação de ser a mais forte ou que você absorva tarefas alheias em todas as relações.',
      resources: [
        'Conversa franca, escuta e pedido de desculpas foram relatados como caminhos de reparação.',
        'Você reconhece e valoriza o cuidado sincero recebido.',
      ],
      costs: ['Hesitação em dizer não e esgotamento antes de pedir ajuda foram relatados.'],
      connections: [
        'Segurança e cumplicidade também aparecem na intimidade.',
        'Generosidade e dignidade são valores relatados; a ligação deles com disponibilidade constante é uma hipótese.',
      ],
      questions: [
        'Em qual relação você poderia conversar sobre uma necessidade sua sem esperar chegar ao limite?',
      ],
      sourceResponseIds: ['qa-rel-p1', 'qa-rel-p4', 'qa-rel-p5', 'qa-rel-p6', 'qa-rel-p8'],
    },

    vida_cotidiana: {
      summary:
        'Nó Vida Cotidiana & Sentido: coerência ética, contemplação da natureza, intimidade e o equilíbrio entre servir e descansar.',
      observations: [
        'Coerência ética e paz de consciência são referências relatadas.',
        'Verdade, generosidade e dignidade humana são valores importantes para você.',
        'Natureza, silêncio, meditação e leitura aparecem como experiências de conexão.',
        'Você descreve maior disponibilidade para intimidade com afeto, desaceleração e menos cansaço.',
      ],
      interpretation:
        'Você encontra direção em valores de verdade, generosidade e dignidade, e descreve natureza, silêncio, meditação e leitura como experiências significativas. Na intimidade, afeto e desaceleração aparecem junto a maior disponibilidade.\n\nUma conexão possível é explorar como suas responsabilidades deixam espaço para essas experiências. Não sabemos se você sente culpa ao descansar ou se o lazer foi sacrificado. O descanso pode ser discutido como uma escolha que também respeita o que importa para você.',
      resources: [
        'Valores que você consegue nomear e experiências de conexão já reconhecidas.',
        'Jardim, silêncio e respiração calma foram relatados como recursos cotidianos.',
      ],
      costs: [
        'Cansaço e distração por pendências foram descritos na intimidade.',
        'Vale investigar se demandas e quietude disputam espaço em certos períodos.',
      ],
      connections: [
        'Relaciona valores, rotina, vínculos e disponibilidade para intimidade como campos de conversa.',
      ],
      questions: [
        'Como você gostaria que seus valores aparecessem também no cuidado com o seu tempo e seu descanso?',
      ],
      sourceResponseIds: [
        'qa-sen-p1',
        'qa-sen-p2',
        'qa-sen-p3',
        'qa-me-p12',
        'qa-sex-p1',
        'qa-sex-p2',
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // CENTRO / INTEGRAÇÃO
    // ═════════════════════════════════════════════════════════════════════════
    centro: {
      summary:
        'Síntese integrativa do Método CER: equilíbrio entre capacidade de realização, cuidado relacional e espaço protegido para o descanso.',
      observations: [
        'Sensibilidade para perceber nuances corporais e relacionais',
        'Iniciativa para planejar, prevenir falhas e resolver pendências práticas',
        'Sinais físicos de sobrecarga e autocrítica diante de erros relatados',
        'Recursos relatados de retorno ao eixo: respiração, alongamento, chá em silêncio e natureza',
      ],
      interpretation:
        'Mariana, suas respostas mostram capacidade de perceber nuances, planejar e cuidar. Sob pressão, esses mesmos recursos parecem perder flexibilidade: você tenta prever, assume a frente e cobra de si que nada falhe. Isso pode trazer alívio imediato, mas você relata estafa e dificuldade para desacelerar. A direção a explorar não é deixar de ser responsável; é ampliar suas opções para que responsabilidade, apoio e descanso possam coexistir.\n\nUma hipótese a explorar reúne demandas e imprevisibilidade; antecipação e autocobrança; tensão e ação imediata; apoio tardio; desgaste e menor disponibilidade para descanso/prazer. Você relatou os elementos; as relações entre eles precisam ser reconhecidas ou corrigidas por você.\n\nVocê já conta com recursos relatados por você mesma: sua escuta atenta quando está tranquila, a capacidade de notar os sinais da sobrecarga, o contato com a natureza e o jardim, as pausas respiratórias, a gratidão ao receber cuidado sincero e uma bússola ética generosa.\n\nSe fizer sentido para você, podemos explorar pequenas experiências: notar os primeiros sinais no corpo antes de assumir mais uma tarefa; perguntar-se com gentileza "isto é realmente minha responsabilidade agora?"; experimentar pedir apoio antes de atingir o limite; tolerar o resultado "suficientemente bom" em vez de exigir o impecável; e proteger pequenas pausas em silêncio ao longo da semana.',
      resources: [
        'Escuta acolhedora e sensível quando está em um ambiente tranquilo',
        'Capacidade demonstrada de reconhecer seus próprios padrões de funcionamento',
        'Contato restaurador com a natureza, silêncio e chá morno',
        'Prática de respiração lenta em 4 tempos e alongamento físico relatadas',
        'Sensibilidade para acolher cuidado sincero e capacidade de reparação honesta',
        'Bússola moral assentada na verdade, dignidade humana e generosidade',
      ],
      costs: [
        'Sono interrompido e dificuldade de relaxar relatados; a relação com as preocupações pode ser explorada na conversa',
        'Acúmulo de tarefas individuais por hesitar em dizer não e pedir suporte',
        'Autocrítica pesada relatada diante de desvios e imprevistos na rotina',
      ],
      connections: [
        'Articula todas as seis dimensões do CER em uma rede viva e interdependente',
        'Permite que a mente ágil e o corpo sensível encontrem ritmo e harmonia',
      ],
      questions: [
        'Mariana, em qual ponto desse ciclo você mais se reconhece — e qual parte dele não descreve a sua experiência real?',
      ],
      sourceResponseIds: [
        'qa-me-p1',
        'qa-me-p4',
        'qa-me-p5',
        'qa-me-p6',
        'qa-me-p12',
        'qa-reg-p1',
        'qa-reg-p2',
        'qa-reg-p4',
        'qa-reg-p5',
        'qa-reg-p6',
        'qa-reg-p7',
        'qa-rel-p1',
        'qa-rel-p4',
        'qa-rel-p5',
      ],
    },

    meu_mundo_emocional: {
      summary:
        'Você relata emoções rápidas no corpo, antecipação dos próximos passos, ação para resolver e cobrança severa diante de erros.',
      observations: [
        'Ansiedade, entusiasmo e preocupação com o futuro foram relatados.',
        'Cobranças no trabalho e conversas inacabadas aparecem como contextos importantes.',
        'Você calcula próximos passos e assume a frente para devolver tranquilidade.',
        'Diante de um erro, relata a voz interna “deveria ter previsto isso”.',
        'Quando tranquila, descreve peito aberto, respiração fluida e escuta sem pressa.',
      ],
      interpretation:
        'Podemos distinguir quatro partes do seu relato: o que você sente, o que pensa, como age e como fala consigo. Sob pressão, ansiedade e preocupação aparecem junto à antecipação e à urgência de resolver; depois, você relata cansaço e dificuldade de desacelerar. Essa reunião de elementos é uma hipótese de funcionamento, não uma sequência comprovada.\n\nVocê também descreve uma experiência diferente quando está tranquila: respiração fluida, peito aberto e escuta sem pressa. Natureza, chá em silêncio e respiração calma já aparecem como recursos. A conversa pode explorar como ampliar suas opções antes de chegar à sobrecarga.',
      resources: [
        'Você consegue nomear emoções, pensamentos, sinais corporais e recursos.',
        'Natureza, silêncio, respiração e alongamento foram relatados como úteis.',
      ],
      costs: ['Tensão, pensamentos em loop, cobrança severa e estafa constam nos relatos.'],
      connections: [
        'Dialoga com os padrões e a regulação sem transformar categorias em traços fixos.',
        'Descanso, apoio e disponibilidade para intimidade são campos de conexão a investigar.',
      ],
      questions: [
        'Qual dessas partes você percebe primeiro quando a pressão aumenta?',
        'O que neste retrato descreve sua experiência e o que você mudaria?',
      ],
      sourceResponseIds: ['qa-me-p1', 'qa-me-p2', 'qa-me-p4', 'qa-me-p5', 'qa-me-p6', 'qa-me-p10'],
    },

    mundo_emocional: {
      summary:
        'Você relata emoções rápidas no corpo, antecipação dos próximos passos, ação para resolver e cobrança severa diante de erros.',
      observations: [
        'Ansiedade, entusiasmo e preocupação com o futuro foram relatados.',
        'Cobranças no trabalho e conversas inacabadas aparecem como contextos importantes.',
        'Você calcula próximos passos e assume a frente para devolver tranquilidade.',
        'Diante de um erro, relata a voz interna “deveria ter previsto isso”.',
        'Quando tranquila, descreve peito aberto, respiração fluida e escuta sem pressa.',
      ],
      interpretation:
        'Podemos distinguir quatro partes do seu relato: o que você sente, o que pensa, como age e como fala consigo. Sob pressão, ansiedade e preocupação aparecem junto à antecipação e à urgência de resolver; depois, você relata cansaço e dificuldade de desacelerar. Essa reunião de elementos é uma hipótese de funcionamento, não uma sequência comprovada.\n\nVocê também descreve uma experiência diferente quando está tranquila: respiração fluida, peito aberto e escuta sem pressa. Natureza, chá em silêncio e respiração calma já aparecem como recursos. A conversa pode explorar como ampliar suas opções antes de chegar à sobrecarga.',
      resources: [
        'Você consegue nomear emoções, pensamentos, sinais corporais e recursos.',
        'Natureza, silêncio, respiração e alongamento foram relatados como úteis.',
      ],
      costs: ['Tensão, pensamentos em loop, cobrança severa e estafa constam nos relatos.'],
      connections: [
        'Dialoga com os padrões e a regulação sem transformar categorias em traços fixos.',
        'Descanso, apoio e disponibilidade para intimidade são campos de conexão a investigar.',
      ],
      questions: [
        'Qual dessas partes você percebe primeiro quando a pressão aumenta?',
        'O que neste retrato descreve sua experiência e o que você mudaria?',
      ],
      sourceResponseIds: ['qa-me-p1', 'qa-me-p2', 'qa-me-p4', 'qa-me-p5', 'qa-me-p6', 'qa-me-p10'],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // HISTÓRIA / LINHA DA VIDA
    // ═════════════════════════════════════════════════════════════════════════
    historia: {
      summary:
        'História e Linha da Vida: distinção entre características corporais habituais e uma história relacional que ainda poderá ser narrada em diálogo.',
      observations: [
        'Características corporais habituais reconhecidas desde jovem (estrutura estreita, sensibilidade térmica)',
        'Funcionamento atual de engajamento profissional e cuidado relacional',
        'Ausência de marcos preenchidos na Linha da Vida neste cenário inicial',
      ],
      interpretation:
        'Até aqui, constam características corporais reconhecidas há muitos anos e relatos do seu funcionamento atual. Ainda faltam marcos compartilhados da Linha da Vida para relacionar esse retrato a acontecimentos específicos do seu percurso.\n\nAs características corporais que você reconhece há mais tempo são consideradas pela perspectiva tradicional da Prakriti. Elas representam tendências habituais e não determinam sozinhas os movimentos aprendidos ao longo da sua trajetória. É importante distinguir essas características corporais de uma história relacional que ainda não foi narrada.\n\nQuando houver memórias ou marcos compartilhados entre você e a profissional no momento oportuno, essa dimensão poderá ser construída de forma dialógica e cuidadosa na conversa.',
      resources: [
        'Autonomia para compartilhar memórias e vivências no seu próprio tempo',
        'Experiências e marcos significativos que ainda poderão ser narrados em diálogo',
      ],
      costs: [
        'Lacuna de marcos na Linha da Vida para contextualizar vivências do passado em relação a desafios atuais',
      ],
      connections: [
        'Poderá enriquecer a compreensão entre a história de vida e escolhas de autocuidado futuras',
        'Oferece base para um diálogo individualizado na conversa com a profissional',
      ],
      questions: [
        'Quando você começou a sentir que precisava dar conta de tantas coisas?',
        'Em quais momentos ou contextos da sua história assumir a frente mais fez sentido ou ajudou você?',
        'Houve relações ou fases em que pedir ajuda foi uma experiência possível e acolhedora?',
      ],
      sourceResponseIds: ['qa-c1-p1', 'qa-c1-p4', 'qa-me-p5', 'qa-rel-p1'],
    },
  }

  // Texto base aprofundado para overview, integration e history
  const overviewText =
    'DADOS FICTÍCIOS — demonstração do Mapa CER interativo. Mariana, este retrato reúne a leitura das suas respostas aos percursos de Consciência, articulando sinais do corpo, movimentos da mente, padrões de regulação, vínculos, intimidade e sentido. As conclusões são hipóteses para serem conversadas e investigadas na sua experiência, sem se converterem em rótulos definitivos.'

  const integrationText =
    'Mariana, suas respostas mostram capacidade de perceber nuances, planejar e cuidar. Sob pressão, esses mesmos recursos parecem perder flexibilidade: você tenta prever, assume a frente e cobra de si que nada falhe. Isso pode trazer alívio imediato, mas você relata estafa e dificuldade para desacelerar. A direção a explorar não é deixar de ser responsável; é ampliar suas opções para que responsabilidade, apoio e descanso possam coexistir. O ciclo conjunto investiga a ligação entre demandas externas, antecipação preventiva, ação imediata de Luta, solicitação tardia de suporte e exaustão subsequente. Em qual ponto desse ciclo você mais se reconhece — e qual parte não descreve sua experiência?'

  const historyText =
    'Até aqui, há características corporais reconhecidas há anos e relatos do seu funcionamento atual. Ainda faltam marcos compartilhados da Linha da Vida para relacionar esse retrato a acontecimentos específicos. Não sabemos quando você aprendeu a assumir tantas demandas, o que ajudou ou o que foi difícil. Tendências corporais históricas não equivalem a uma história relacional já contada, e os marcos significativos serão explorados no tempo certo em diálogo.'

  return {
    ...snapshot,
    overview: overviewText,
    integration: integrationText,
    history: historyText,
    elementReadings,
    dimensions,
  }
}
