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
          'Sensibilidade vívida no corpo frente às emoções, mente ágil no planejamento preventivo e forte autocrítica interna diante de imprevistos ou erros.',
        interpretation:
          'Suas respostas revelam uma agudeza perceptiva notável: diante de estímulos do ambiente, seu corpo sente de forma rápida e intensa emoções como ansiedade, entusiasmo e preocupação. No nível do pensamento, isso se traduz no hábito de calcular os próximos passos para evitar falhas ou desamparo coletivo.\n\nNo campo da ação, você relata tomar a frente imediatamente para devolver a harmonia ao ambiente. Contudo, quando algo sai do planejado, surge um diálogo interno severo afirmando que "você deveria ter previsto tudo". Esse ciclo consome grande energia psíquica e muscular.\n\nA chave a investigar é como proteger a sua inteligência de planejamento e o seu discernimento autêntico sem permitir que a autocrítica agressiva assuma o comando da sua experiência interna.',
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
        'Talvez você perceba o que o outro precisa antes de perceber seu próprio cansaço. Este movimento não é fraqueza nem submissão passiva: pode funcionar como uma estratégia protetiva ativa para manter a harmonia dos vínculos. Note a nuance entre a resposta sob pressão e o cotidiano: a urgência de cuidar parece crescer quando o ambiente fica tenso. Investigamos como resgatar a si mesma no centro do cuidado.',
      resources: [
        'Empatia acolhedora, sensibilidade às necessidades do ambiente e capacidade de gerar confiança recíproca',
      ],
      costs: ['Esgotamento físico e mental por adiar as próprias necessidades básicas'],
      connections: [
        'Uma conexão a explorar com a resposta de Luta (mobilizar-se para resolver tudo)',
        'Vale observar se reduz o espaço para o descanso, a intimidade e a espontaneidade',
      ],
      questions: [
        'Como é para você perceber que também precisa de cuidado?',
        'O que você teme que aconteça se, diante de uma demanda externa, você pausar e não assumir a tarefa de imediato?',
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
        'A capacidade de colocar ideias em prática e resolver problemas concretos é uma força inquestionável do seu perfil. Este padrão, contudo, pode em algumas ocasiões vincular o seu valor pessoal exclusivamente ao volume de coisas produzidas no dia. Investigar essa tendência ajuda a separar sua dignidade humana do seu rendimento de trabalho.',
      resources: [
        'Eficiência operacional e clareza para destravar gargalos',
        'Entusiasmo com realizações e projetos concretos',
      ],
      costs: [
        'Dificuldade de desfrutar do tempo ocioso sem culpa de "não estar produzindo"',
        'Desconexão passageira com os ritmos naturais do corpo',
      ],
      connections: [
        'Atua em parceria com o Analítico para construir planos práticos',
        'Pode mascarar a fadiga corporal em prol de cumprir um prazo acordado',
      ],
      questions: [
        'Você consegue reconhecer seu valor mesmo em um dia em que quase nada da lista de afazeres foi concluído?',
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
        'Sua mente possui grande capacidade analítica, compreendendo dinâmicas complexas e organizando passos com rapidez. Esse recurso traz previsibilidade valiosa. O custo surge quando a razão tenta processar emoções corporais profundas como se fossem problemas matemáticos a serem solucionados, afastando você da escuta sutil do que o corpo sente.',
      resources: [
        'Visão estratégica lúcida e facilidade para antecipar variáveis',
        'Capacidade de trazer clareza para equipes em momentos confusos',
      ],
      costs: [
        'Pensamentos em loop durante a noite que impedem o relaxamento mental',
        'Distanciamento temporário da espontaneidade afetiva',
      ],
      connections: [
        'Alimenta a hipervigilância preventiva em contextos de pressão',
        'Compete com a entrega corporal e o descanso na vida íntima',
      ],
      questions: [
        'O que acontece no seu corpo quando você substitui "o que eu preciso fazer agora" por "o que eu estou sentindo agora"?',
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
        'A hipervigilância é um radar de segurança que se ativa em ambientes de pressão ou quando há incerteza ao redor. Ela ajuda a prevenir problemas concretos e proteger quem está perto. Contudo, manter o corpo em prontidão permanente produz contratura muscular na mandíbula e ombros, além de um desgaste neurovegetativo intenso. Não é sintoma de patologia crônica, mas um estado de alerta que pede segurança relacional.',
      resources: [
        'Percepção aguçada de riscos sutis no ambiente de trabalho',
        'Cuidado protetivo cuidadoso com as pessoas sob sua responsabilidade',
      ],
      costs: [
        'Contratura na mandíbula e respiração curta sob pressão',
        'Sensação constante de estar no limiar de uma crise iminente',
      ],
      connections: [
        'Trabalha em sintonia direta com os primeiros sinais de mobilização de Luta',
        'Dificulta a entrega relaxada no sono e na intimidade',
      ],
      questions: [
        'Como você pode diferenciar hoje um risco real e iminente de uma antecipação gerada apenas pela ansiedade?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p8', 'qa-me-p11'],
    },

    inquieto: {
      summary:
        'Categoria: Aparece em algumas situações. Mobilidade e entusiasmo com novidades, sem relato de dispersão crônica ou fuga patológica.',
      observations: [
        'Marcado em frequência intermediária nas respostas',
        'Emoção de "Entusiasmo" assinalada como recorrente ao lado da ansiedade',
      ],
      interpretation:
        'O movimento inquieto reflete energia viva, curiosidade intelectual e capacidade de transitar entre múltiplos interesses. Não há nos seus relatos sinais de desatenção desregulada ou dispersão involuntária (sem qualquer correlação com diagnósticos como TDAH). Vale investigar se mudar de atividade em certos momentos é uma escolha deliberada ou uma tentativa de aliviar o desconforto de tarefas monótonas.',
      resources: [
        'Versatilidade, flexibilidade para novas ideias e vivacidade de espírito',
        'Capacidade de trazer frescor e motivação para novos inícios',
      ],
      costs: [
        'Risco de abrir muitas frentes simultâneas e sobrecarregar o cronograma pessoal',
        'Dificuldade de permanecer no tédio produtivo necessário para descansar',
      ],
      connections: [
        'Dialoga com o entusiasmo do mundo emocional e com o princípio Vata',
        'Pode acelerar o ritmo diário antes que o corpo tenha tempo de se recuperar',
      ],
      questions: [
        'Mudar de atividade traz um respiro criativo genuíno ou está sendo um atalho para evitar um desconforto temporário?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p2'],
    },

    comandante: {
      summary:
        'Categoria: Quase nunca acontece comigo. Liderança baseada em resolver e proteger, sem perfil impositivo ou autoritário.',
      observations: [
        'Frequência quase nunca apontada na escala de respostas',
        'Postura resolutiva voltada ao bem coletivo: resolver logo para devolver a paz ao ambiente',
      ],
      interpretation:
        'Assumir a linha de frente para resolver problemas difíceis não significa querer controlar os outros por autoritarismo. Suas respostas indicam que você não busca impor sua vontade nem intimidar equipes; seu movimento resolutivo nasce da responsabilidade ética de cuidar e garantir que nada desmorone.',
      resources: [
        'Firmeza respeitosa e disposição para assumir riscos em benefício do grupo',
        'Facilidade para colaborar com transparência sem jogos de poder',
      ],
      costs: [
        'Risco de sobrecarregar a si mesma para poupar as pessoas de conflitos',
        'Hesitação em colocar limites assertivos quando teme parecer dura',
      ],
      connections: [
        'Sua resposta de Luta é focada na tarefa e no cuidado, não em dominar pessoas',
        'Coerente com a busca de verdade e dignidade na dimensão do Sentido',
      ],
      questions: [
        'Como exercer sua firmeza com tranquilidade, sem receio de que posicionar seus limites seja interpretado como agressão?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p5'],
    },

    evitativo: {
      summary:
        'Categoria: Ainda não sei dizer. Manutenção da incerteza sobre esquivar-se; recuo em conflitos funciona como reflexão e não fuga.',
      observations: [
        'Marcado explicitamente como "Ainda não sei dizer" na avaliação dos padrões',
        'Nos conflitos: "Recuo reflexivo temporário para organizar as ideias antes do confronto"',
      ],
      interpretation:
        'Reconhecer que você ainda não tem certeza sobre este padrão é uma demonstração valiosa de sinceridade. Afastar-se temporariamente de uma discussão acalorada para respirar e organizar as palavras não significa evitar a intimidade ou fugir de conversas difíceis. Ao contrário, seu relato mostra que você retorna para conversar com calma e desculpas sinceras, o que diferencia um recuo reflexivo de uma esquiva crônica.',
      resources: [
        'Ponderação e prudência para não falar coisas duras no calor da emoção',
        'Disposição para reatar laços e reparar desentendimentos com serenidade',
      ],
      costs: [
        'Possibilidade de guardar mágoas caladas se o retorno à conversa demorar',
        'Insegurança sobre quando o silêncio é sábio ou quando é adiamento de uma decisão',
      ],
      connections: [
        'Relaciona-se ao timing cuidadoso que você adota na confiança interpessoal',
        'Serve como amortecedor para não entrar em conflitos desnecessários',
      ],
      questions: [
        'Quando você recua em uma conversa difícil, você sente que está cuidando da relação ou apenas adiando um desconforto inevitável?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-rel-p7'],
    },

    critico: {
      summary:
        'Categoria: Repete-se com frequência. Voz interna exigente que cobra antecipação total ("deveria ter previsto isso") após qualquer erro.',
      observations: [
        'Frequência alta assinalada no questionário de mente e padrões',
        'Diálogo interno literal diante do erro: "Quando cometo um erro, uma voz me cobra severamente que eu deveria ter previsto isso"',
      ],
      interpretation:
        'O padrão Crítico opera como um auditor interno vigilante. Seu discernimento refinado é uma ferramenta extraordinária quando colocado a serviço da aprendizagem e do crescimento. Contudo, quando se transforma em autoflagelo após qualquer falha cotidiana, ele desgasta a autoestima e multiplica o cansaço. Erros não comprovam falta de capacidade; são a forma como humanos navegam na incerteza.',
      resources: [
        'Capacidade de autoavaliação honesta e busca genuína por aprimoramento',
        'Sensibilidade ética para reconhecer deslizes e oferecer reparações honestas',
      ],
      costs: [
        'Cobrança desproporcional que transforma pequenos erros em falhas graves de caráter',
        'Tensão interna contínua decorrente do medo de errar perante os outros',
      ],
      connections: [
        'Amplifica o padrão Insistente e a necessidade de controlar cenários',
        'Interfere na capacidade de descansar mesmo quando tudo deu certo',
      ],
      questions: [
        'Qual seria a resposta de uma amiga verdadeiramente bondosa e justa com você na última vez em que você cometeu um engano?',
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
        'Sua resposta de Luta não representa agressividade interpessoal, violência verbal ou ataque aos outros; é uma mobilização neurofisiológica altamente resolutiva de enfretamento direto. Diante da sensação de perigo ou de que as demandas podem desmoronar, seu corpo entra em ação firme e rápida para restaurar a segurança. Esta resposta foi sua grande guardiã até aqui, mas o custo relatado de estafa mostra que o repertório pode ser expandido com apoio e pausas.',
      resources: [
        'Coragem para enfrentar problemas complexos sem fugir da responsabilidade',
        'Velocidade para articular soluções e desatar nós operacionais',
      ],
      costs: [
        'Contrações musculares sustentadas e respiração curta',
        'Dificuldade de desligar a mente à noite por manter o estado de alerta',
      ],
      connections: [
        'Integra-se ao padrão Hipervigilante e à agudeza do planejamento preventivo',
        'Bloqueia temporariamente o pedido precoce de ajuda e colaboração',
      ],
      questions: [
        'Quando a urgência de agir surge no corpo, é viável respirar fundo 3 vezes antes de começar a responder aos e-mails?',
      ],
      sourceResponseIds: ['qa-reg-p1', 'qa-reg-p2', 'qa-reg-p4', 'qa-reg-p5', 'qa-reg-p6'],
    },

    fuga: {
      summary:
        'Não marcada como tendência imediata no momento de sobrecarga; movimento adaptativo de afastamento e recolhimento protetivo.',
      observations: [
        'A reação predominante declarada no questionário foi a Luta',
        'O recuo relatado nas relações ocorre de forma ponderada antes da conversa reflexiva',
      ],
      interpretation:
        'A Fuga é uma resposta que busca criar distância espacial ou silêncio para permitir que o sistema nervoso se reorganize longe do perigo. Em seu mapa atual, você não recorreu à fuga automática diante de prazos; seu impulso imediato foi intervir. Explicitar que a Fuga não está destacada é reconhecer que ela é um recurso preservado para momentos em que colocar distância for a escolha mais sábia.',
      resources: [
        'Capacidade de colocar limites físicos ou temporais quando a invasão for excessiva',
        'Preservação da integridade interna pelo afastamento consciente de ambientes nocivos',
      ],
      costs: [
        'Se usada por automatismo excessivo, pode distanciar de conversas necessárias',
        'Pode ser confundida com indiferença por pessoas próximas',
      ],
      connections: [
        'Pode coexistir com o recuo reflexivo que você utiliza para organizar ideias antes de confrontos',
        'Não deve ser rotulada como covardia nem como desinteresse',
      ],
      questions: [
        'Em quais momentos colocar um intervalo ou afastar-se fisicamente de um ambiente seria um ato de respeito consigo mesma?',
      ],
      sourceResponseIds: ['qa-reg-p4', 'qa-rel-p7'],
    },

    paralisacao: {
      summary:
        'Não marcada como tendência imediata; resposta de suspensão ou compasso de espera frente ao excesso de estímulos.',
      observations: [
        'Seu funcionamento imediato perante a pressão é resolutivo e hiperativo',
        'A lentidão só aparece posteriormente como custo de estafa após a entrega',
      ],
      interpretation:
        'A Paralisação ocorre quando a sobrecarga ou a incerteza é tão intensa que o organismo suspende a ação para avaliar o cenário com cautela. Você não tende a travar ou ficar sem ação no ápice da pressão. Reconhecer essa ausência no relato ajuda a desmistificar a ideia de fraqueza: sua tendência é o movimento, e o cansaço que você sente decorre do excesso de ação, não de imobilidade.',
      resources: [
        'Pausa protetiva que impede reações precipitadas diante de risco iminente',
        'Economia de energia quando nenhuma ação imediata for eficaz',
      ],
      costs: [
        'Sensação angustiante de impotência ou confusão mental quando ativada',
        'Dificuldade de dar o primeiro passo para destravar tarefas',
      ],
      connections: [
        'O peso corporal relatado ao acordar é fadiga muscular acumulada, não congelamento afetivo',
        'Diferencia-se da serenidade contemplativa que você experimenta na natureza',
      ],
      questions: [
        'Se você sentisse o corpo desacelerar de forma involuntária, como poderia acolher esse sinal como um pedido urgente de descanso?',
      ],
      sourceResponseIds: ['qa-reg-p4', 'qa-me-p5', 'qa-reg-p6'],
    },

    submissao: {
      summary:
        'Não marcada como tendência imediata; apaziguamento como estratégia relacional de preservação do vínculo.',
      observations: [
        'Você relata hesitação em dizer não por cuidado com o outro',
        'Porém, sua resposta perante desafios de trabalho é firme e resolutiva, não de submissão passiva',
      ],
      interpretation:
        'A resposta de Submissão ou apaziguamento busca acalmar o outro e ceder para conter atritos imediatos. Embora você hesite em dizer "não" para poupar pessoas queridas de mágoas, seu funcionamento diante da sobrecarga não é de submissão nem de anulação da sua voz. O cuidado em não ferir quem você ama é uma expressão de sensibilidade empática, e não uma postura de subordinação sistemática.',
      resources: [
        'Habilidade diplomática para acalmar tensões e buscar harmonia grupal',
        'Flexibilidade para negociar e encontrar pontos de convergência',
      ],
      costs: [
        'Risco de concordar com prazos inviáveis por medo de desapontar quem pediu',
        'Acúmulo silencioso de ressentimento quando suas concessões não são reconhecidas',
      ],
      connections: [
        'Dialoga com o receio de sobrecarregar terceiros e com a hesitação em pedir suporte',
        'Não deve ser confundida com fraqueza de caráter nem com dependência afetiva',
      ],
      questions: [
        'Como distinguir uma concessão generosa que você quer fazer de um recuo que machuca sua própria dignidade?',
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
        'Sua mente é um instrumento poderoso de organização e lucidez. Sob pressão, entretanto, seus pensamentos tendem a acelerar e construir cenários preventivos contínuos, buscando controlar variáveis para afastar a sensação de falha. Reconhecer esse movimento de proteção ajuda a desarmar a culpa e recuperar o espaço de quietude.',
      resources: [
        'Visão estratégica lúcida e capacidade rápida de estruturar saídas',
        'Preocupação honesta com o bem-estar e o alinhamento coletivo',
      ],
      costs: [
        'Insônia inicial ou despertar noturno com pensamentos em torno do trabalho',
        'Exaustão cognitiva por manter planos alternativos permanentemente ligados',
      ],
      connections: [
        'Coocorre com a tensão muscular na mandíbula e a aceleração dos batimentos',
        'Dificulta a presença relaxada no momento presente e no lazer despretensioso',
      ],
      questions: [
        'Quando a mente começa a planejar em loop, o que acontece se você simplesmente anotar em um papel e dizer a si mesma "amanhã eu cuido disso"?',
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
        'Seu universo emocional é rico e dinâmico: você não reprime o que sente, mas percebe no próprio corpo o fluxo vibrante dos sentimentos. Quando há segurança e ausência de pressa, sua afetividade se manifesta em escuta calorosa e peito aberto. Quando surgem prazos e ruídos relacionais, a ansiedade se conecta à preocupação e busca a ação rápida como antídoto.',
      resources: [
        'Capacidade de empatia sincera e escuta atenta sem julgamentos',
        'Entusiasmo contagiante diante de projetos que dialogam com seus valores',
      ],
      costs: [
        'Impacto de tensões emocionais na digestão e na respiração',
        'Dificuldade de filtrar a ansiedade quando as pessoas ao redor estão inseguras',
      ],
      connections: [
        'Conecta-se à busca de reciprocidade e verdade nos vínculos',
        'Nutre sua sensibilidade artística, contemplativa e o contato com a natureza',
      ],
      questions: [
        'Como você acolhe o entusiasmo sem deixar que ele acelere o seu corpo além do seu limite de energia?',
      ],
      sourceResponseIds: ['qa-me-p1', 'qa-me-p2', 'qa-me-p10'],
    },

    protecao: {
      summary:
        'Nó Proteção: estratégias de defesa e adaptação compreendidas no contexto da sua história.',
      observations: [
        'Movimentos ativos para assegurar retidão e excelência',
        'Ação rápida sob pressão para recompor a harmonia dos ambientes',
        'Função percebida: proteger a integridade profissional e evitar desamparo',
      ],
      interpretation:
        'Seus movimentos de proteção não são defeitos de personalidade; são formas de adaptação que buscaram cuidar de você e daqueles ao seu redor. Eles participaram da construção da sua competência e dedicação. O trabalho integrativo não busca eliminá-los, mas devolver-lhes flexibilidade para que não governem todas as situações da sua rotina.',
      resources: [
        'Lealdade protetora aos vínculos e compromissos assumidos',
        'Prontidão e coragem para intervir quando situações exigem liderança',
      ],
      costs: [
        'Rigidez na autocobrança e dificuldade de aceitar a própria imperfeição',
        'Adiamento constante do autocuidado e da diversão descompromissada',
      ],
      connections: [
        'Coocorre com a resposta de mobilização de Luta diante de prazos apertados',
        'Pode ser suavizado pela prática de pequenos passos de permissão e descanso',
      ],
      questions: [
        'Qual parte dessas defesas você pode agradecer hoje por ter cuidado de você, ao mesmo tempo em que a convida a relaxar um pouco?',
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
        'Seus relacionamentos são alicerçados em respeito, verdade e generosidade. Você oferece um porto seguro para quem caminha com você. O ponto sensível reside em cuidar tanto das demandas alheias a ponto de esquecer de expressar seus próprios cansaços e necessidades. Aprender a pedir ajuda antes do esgotamento e praticar o dizer "não" com amorosidade fortalece ainda mais os laços que você preza.',
      resources: [
        'Profundidade nos encontros e capacidade de sustentar conversas de reparação',
        'Sensibilidade para reconhecer e valorizar o carinho sincero recebido',
      ],
      costs: [
        'Sobrecarga por absorver responsabilidades que caberiam a outras pessoas',
        'Sentimento de isolamento temporário por achar que precisa ser a mais forte sempre',
      ],
      connections: [
        'Sustenta a segurança necessária para a entrega na vida afetiva e erótica',
        'Espelha os valores fundamentais de generosidade e dignidade humana',
      ],
      questions: [
        'Quem é uma pessoa no seu círculo de confiança para quem você poderia pedir uma ajuda simples ainda esta semana?',
      ],
      sourceResponseIds: ['qa-rel-p1', 'qa-rel-p4', 'qa-rel-p5', 'qa-rel-p6', 'qa-rel-p8'],
    },

    vida_cotidiana: {
      summary:
        'Nó Vida Cotidiana & Sentido: coerência ética, contemplação da natureza, intimidade e o equilíbrio entre servir e descansar.',
      observations: [
        'Coerência ética e paz de consciência como bússola interna permanente',
        'Valores fundamentais de verdade, generosidade e respeito à dignidade humana',
        'Nutrição pela natureza, meditação, silêncio e caminhada descalça no jardim',
        'Desejo e erotismo conectados ao descanso e à ausência de fadiga',
      ],
      interpretation:
        'Este nó integra o sentido maior da sua existência com a rotina dos seus dias. Quando seus valores de generosidade são vividos com serenidade, você desfruta da vida com contemplação, poesia e presença. A armadilha é quando o senso de utilidade se torna uma obrigação contínua de servir, roubando o silêncio e o prazer da intimidade. Proteger pequenas pausas é um ato ético de respeito à sua própria vida.',
      resources: [
        'Bússola moral firme que orienta escolhas difíceis com integridade',
        'Conexão viva com o sagrado presente na natureza e na contemplação',
      ],
      costs: [
        'Sacrifício de momentos de lazer e descanso por excesso de deveres',
        'Culpa passageira quando se permite não ser útil ou produtiva',
      ],
      connections: [
        'Confere significado aos seus esforços e projetos profissionais',
        'Oferece caminhos de retorno ao eixo: chá em silêncio, jardim e respiração',
      ],
      questions: [
        'De que maneira o silêncio e o descanso podem se tornar aliados — e não concorrentes — dos seus valores de generosidade?',
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
