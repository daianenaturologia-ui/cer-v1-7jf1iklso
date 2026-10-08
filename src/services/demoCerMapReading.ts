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
          'Mariana, seu relato corporal descreve uma estrutura leve habitual e sensibilidade ao frio, combinadas no momento atual com sono entrecortado, fome irregular e estufamento pós-prandial.',
        interpretation:
          'Seu histórico de compleição física estreita, pele seca e intolerância ao frio aponta para uma tendência de base (Prakriti) de características leves e ágeis. No entanto, a irregularidade no apetite, os gases ocasionais e a oscilação de vitalidade ao longo do dia representam o seu estado atual (Vikriti).\n\nEsses sinais digestivos e de sono coocorrem com um ritmo de exigência profissional elevada e pensamentos em loop descritos por você. É importante não afirmar uma causalidade direta e única — não sabemos se o desgaste corporal gera a aceleração mental ou se a sobrecarga de demandas desregula o corpo, mas ambos se sustentam mutuamente no seu momento de vida.\n\nNa tradição ayurvédica, acolher esse funcionamento convida a investigar rotinas de aconchego, refeições mornas e previsibilidade de horários, sem transformá-los em prescrições rígidas.',
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
          'A intimidade e o desejo emergem em momentos de desaceleração, segurança relacional e descanso corporal, sendo bloqueados pelo acúmulo de tarefas mentais.',
        interpretation:
          'Sua experiência da intimidade corporal e do desejo está diretamente atrelada ao descanso e à ausência de cansaço acumulado. Quando o corpo está descansado e há cumplicidade afetiva, você se percebe à vontade e aberta ao prazer como uma celebração do vínculo a dois.\n\nEm contrapartida, quando a rotina está sobrecarregada com tarefas pendentes, prazos e pensamentos em loop sobre o dia seguinte, o ruído mental compete diretamente com a presença necessária para a intimidade. Não há qualquer evidência de trauma ou disfunção biológica descrita, mas sim um reflexo fiel de como o cansaço do dia a dia drena a energia erótica.\n\nProteger tempos protegidos de desaceleração mútua e comunicar desejos e limites com clareza surgem como caminhos naturais de nutrição dessa dimensão.',
      }
    }

    if (dim.id === 'sentido') {
      return {
        ...dim,
        summary:
          'Bússola interna assentada na coerência ética, verdade e generosidade, nutrida pelo silêncio contemplativo e pela conexão com a natureza.',
        interpretation:
          'O sentido de direção da sua vida é fortemente guiado por uma bússola moral de dignidade humana, lealdade e verdade. Momentos na natureza, silêncio reflexivo e meditação já foram citados por você como fontes reais de reabastecimento da alma e retorno à paz de consciência.\n\nContudo, quando essa generosidade essencial se confunde com uma exigência interna de estar sempre disponível e sendo útil a terceiros, seus momentos de contemplação acabam sendo sacrificados em nome das obrigações imediatas.\n\nDar espaço ao descanso, ao chá em silêncio e ao caminhar descalço no jardim não é afastar-se do seu propósito ético, mas justamente criar as condições vitais para que seus valores mais nobres se manifestem sem exaustão.',
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
        'Sinais de leveza, sensibilidade térmica e variabilidade digestiva conectados à lente tradicional do princípio de Vata.',
      observations: [
        'Estrutura física leve e estreita reconhecida desde jovem (qa-c1-p1)',
        'Pele seca frequente e necessidade de hidratação contínua (qa-c1-p2)',
        'Tendência fácil ao frio em mãos e pés (qa-c1-p4)',
        'Fome e ritmo digestivo com horários variáveis no cotidiano (qa-c2-p1)',
      ],
      interpretation:
        'Na tradição ayurvédica, o princípio Vata rege os movimentos, o fluxo de pensamentos e a velocidade de percepção. Os sinais de secura, sensibilidade ao frio e oscilação de fome relatados por você se alinham com essa qualidade de movimento e leveza. O percentual de 45% exibido no gráfico é uma representação didática de demonstração visual e não deve ser lido como um cálculo biológico fechado nem como uma definição rígida de quem você é.',
      resources: [
        'Rapidez para captar nuances e mudanças de ambiente',
        'Facilidade para se conectar com novas ideias e projetos',
      ],
      costs: [
        'Vulnerabilidade ao cansaço rápido quando não há previsibilidade',
        'Tendência a reter tensão e ressecar mucosas em fases frias ou agitadas',
      ],
      connections: [
        'Conecta-se ao hábito mental de planejar antecipadamente para conter imprevistos',
        'Coocorre com a dificuldade de relaxar o corpo ao final de dias muito atribulados',
      ],
      questions: [
        'Em quais momentos da semana você percebe seu corpo pedindo calor, quietude ou pausas mais regulares?',
      ],
      sourceResponseIds: ['qa-c1-p1', 'qa-c1-p2', 'qa-c1-p4', 'qa-c2-p1'],
    },

    pitta: {
      summary:
        'Capacidade de foco, organização e discernimento rápido; percentual gráfico demonstrativo de 35% sem validação de excesso.',
      observations: [
        'Ação rápida e resolutiva para solucionar pendências de equipe (qa-me-p5)',
        'Sensibilidade ao calor em refeições muito condimentadas ou apressadas (qa-c2-p5)',
        'Transpiração equilibrada sem extremos declarados (qa-c1-p5c)',
      ],
      interpretation:
        'O princípio Pitta relaciona-se à digestão, ao metabolismo e à agudeza do intelecto. Sua clareza para analisar cenários e sua iniciativa para resolver problemas mostram esse fogo transformador ativo como recurso. No entanto, o valor de 35% no gráfico é apenas parte do exemplo ilustrativo: não há dados na sua autoavaliação que comprovem um excesso inflamatório ou hiperacidez crônica.',
      resources: [
        'Capacidade de organização e entrega em momentos decisivos',
        'Discernimento lúcido para distinguir prioridades quando está descansada',
      ],
      costs: [
        'Risco de converter foco produtivo em cobrança perfeccionista consigo mesma',
        'Irritabilidade interna passageira quando planos falham por desatenção alheia',
      ],
      connections: [
        'Apoia sua resposta de mobilização ativa frente a prazos de trabalho',
        'Pode intensificar a voz autocrítica quando algo sai imperfeito',
      ],
      questions: [
        'Quando a sua exigência por excelência deixa de ser recurso e passa a gerar estresse desnecessário?',
      ],
      sourceResponseIds: ['qa-me-p5', 'qa-c2-p5', 'qa-c1-p5c'],
    },

    kapha: {
      summary:
        'Capacidade de sustentação de vínculos e consistência; 20% demonstrativo sem rotular lentidão como constituição fixa.',
      observations: [
        'Dedicação fiel e de longo prazo ao círculo íntimo de relações (qa-rel-p1)',
        'Sensação de peso corporal e despertar matinal por vezes arrastado (qa-c2-p9)',
        'Busca por ancoragem e acolhimento nos momentos difíceis (qa-sen-p5)',
      ],
      interpretation:
        'Kapha representa estabilidade, nutrição de tecidos e resistência relacional. Sua capacidade de ser leal e oferecer ancoragem amorosa expressa esse princípio de sustentação. O peso matinal relatado ao acordar reflete a fadiga acumulada de noites entrecortadas, não devendo ser confundido com lentidão constitucional inata.',
      resources: [
        'Capacidade de manter compromissos profundos com consistência',
        'Espaço afetivo caloroso para quem compartilha a vida com você',
      ],
      costs: [
        'Dificuldade para sair da inércia após períodos intensos de estafa',
        'Tendência a engolir desconfortos para preservar a estabilidade dos ambientes',
      ],
      connections: [
        'Sustenta sua lealdade afetiva e a dificuldade de dizer não',
        'Coexiste com a necessidade de repouso restaurador em silêncio',
      ],
      questions: [
        'Como equilibrar seu desejo natural de estabilidade com a permissão para renovar rotinas cansativas?',
      ],
      sourceResponseIds: ['qa-rel-p1', 'qa-c2-p9', 'qa-sen-p5'],
    },

    agni: {
      summary:
        'Digestão com ritmo variável, fome oscilante e sensibilidade a refeições tardias, sugerindo Vishama Agni na tradição.',
      observations: [
        'Apetite que varia entre dias de fome viva e dias de pouco apetite (qa-c2-p1)',
        'Desconforto ou estufamento quando come correndo ou sob estresse (qa-c2-p3)',
        'Ritmo intestinal que oscila de acordo com viagens ou alterações de horário (qa-c2-p6)',
      ],
      interpretation:
        'Na medicina ayurvédica, Agni é o fogo digestivo que transforma o que ingerimos e vivenciamos. Quando há alternância entre fome forte e ausência de apetite, a tradição chama esse estado de Vishama Agni (digestão irregular), frequentemente associado à agitação e à falta de rotina horária. Isso não representa uma patologia comprovada por exames, mas um convite a cultivar previsibilidade e calma nas refeições.',
      resources: [
        'Sensibilidade rápida do corpo aos alimentos frescos e leves',
        'Boa resposta fisiológica a momentos em que consegue comer com calma',
      ],
      costs: [
        'Gases, sensação de peso ou distensão após comer com pressa',
        'Queda de energia à tarde quando pula refeições ou come atrasada',
      ],
      connections: [
        'Diretamente conectado ao ritmo de trabalho acelerado e prazos simultâneos',
        'Influencia a qualidade do sono e a facilidade para despertar descansada',
      ],
      questions: [
        'Que pequenas âncoras de horário você gostaria de testar para almoçar sem telas ou pressa?',
      ],
      sourceResponseIds: ['qa-c2-p1', 'qa-c2-p3', 'qa-c2-p6'],
    },

    ama: {
      summary:
        'Sinais de processamento incompleto (gases, despertar pesado e língua esbranquiçada), lidos sem mito de intoxicação patológica.',
      observations: [
        'Sensação de peso e lentidão após refeições noturnas mais densas (qa-c2-p3)',
        'Despertar matinal sem sensação imediata de frescor ou clareza (qa-c2-p9)',
        'Tendência a estufamento abdominal em semanas de estresse prolongado (qa-c2-p3)',
      ],
      interpretation:
        'Ama é o conceito ayurvédico para digestão ou assimilação incompleta de alimentos e estímulos mentais. Não equivale a toxinas químicas detectadas em exames toxicológicos nem exige dietas punitivas de "desintoxicação". Na visão integrativa, reflete apenas que o sistema esteve sobrecarregado e pede simplificação da dieta, infusões digestivas quentes e redução do ritmo para se recuperar.',
      resources: [
        'Sinalizador corporal nítido que avisa com rapidez quando o ritmo passou do limite',
        'Capacidade de recuperação com hidratação morna e repouso',
      ],
      costs: [
        'Lentidão mental passageira após almoços pesados',
        'Aperto ou desconforto abdominal que rouba foco nas atividades',
      ],
      connections: [
        'Reflete a coocorrência de noites mal dormidas e preocupações antecipadas',
        'Pode ser aliviado quando você consegue fazer a pausa para o chá em silêncio',
      ],
      questions: [
        'Você nota diferença na sua disposição matinal quando janta mais cedo e de forma leve?',
      ],
      sourceResponseIds: ['qa-c2-p3', 'qa-c2-p9'],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 10 PADRÕES DE PROTEÇÃO
    // ═════════════════════════════════════════════════════════════════════════
    insistente: {
      summary:
        'Categoria: Repete-se com frequência. Busca fazer tudo do jeito certo, sustentando excelência mas gerando dificuldade de fechar tarefas.',
      observations: [
        'Marcado com frequência alta na avaliação de movimentos automáticos (qa-me-p7a)',
        'Selecionado entre os padrões que mais interferem na rotina: "fazer tudo impecavelmente certo" (qa-me-p8)',
        'Alinhado à voz que cobra não falhar com ninguém no planejamento (qa-me-p4)',
      ],
      interpretation:
        'O padrão Insistente (Perfeccionista no modelo de Shirzad Chamine) nasce de uma busca honesta por integridade, qualidade e respeito aos compromissos. Ele assegura padrões altos e consistência, mas cobra um preço severo quando não tolera o "suficientemente bom". Não afirmamos aqui uma causa familiar na infância, mas investigamos como essa exigência atual pode dificultar o encerramento sereno de ciclos.',
      resources: [
        'Organização meticulosa e padrão técnico exemplar',
        'Confiabilidade absoluta em projetos entregues sob sua supervisão',
      ],
      costs: [
        'Dificuldade de delegar e sensação de que se não fizer pessoalmente sairá errado',
        'Adiamento do descanso até que tudo esteja rigorosamente impecável',
      ],
      connections: [
        'Alimenta o hábito de assumir demandas além do limite na equipe',
        'Reforça o padrão Crítico quando qualquer detalhe sai fora do padrão',
      ],
      questions: [
        'Em qual projeto desta semana seria seguro e libertador praticar o critério de "bom o bastante"?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p8', 'qa-me-p4'],
    },

    prestativo: {
      summary:
        'Categoria: Aparece com muita força quando estou sob pressão. Movimento de cuidar e assumir a frente para devolver harmonia, hesitando em pedir ajuda.',
      observations: [
        'Declarado sob pressão no snapshot e "às vezes" na matriz de frequência (qa-me-p7b)',
        'Relato espontâneo: "Assumo a frente para resolver logo e devolver a tranquilidade ao ambiente" (qa-me-p5)',
        'Hesitação em dizer não por receio de sobrecarregar ou ferir outrem (qa-rel-p4)',
        'Costuma esgotar as próprias forças antes de solicitar suporte externo (qa-rel-p5)',
      ],
      interpretation:
        'Talvez você perceba o que o outro precisa antes de perceber seu próprio cansaço. Este movimento não é fraqueza nem submissão passiva: é uma estratégia protetiva ativa para manter a harmonia dos vínculos e garantir que ninguém se sinta desamparado. Note a nuance entre a resposta sob pressão e o cotidiano: a urgência de cuidar cresce quando o ambiente fica tenso. Não inferimos abandono infantil; investigamos como resgatar a si mesma no centro do cuidado.',
      resources: [
        'Empatia acolhedora, sensibilidade às carências do ambiente e calor humano',
        'Capacidade de acolher genuinamente e gerar confiança recíproca',
      ],
      costs: [
        'Esgotamento físico e mental por adiar as próprias necessidades básicas',
        'Sentimento velado de solidão por sentir que dá conta de todos, mas ninguém percebe sua fadiga',
      ],
      connections: [
        'Conecta-se diretamente à resposta de Luta (mobilizar-se para resolver tudo)',
        'Limita o espaço para o descanso, a intimidade e a espontaneidade',
      ],
      questions: [
        'O que você teme que aconteça se, diante de uma demanda externa, você pausar e não assumir a tarefa de imediato?',
      ],
      sourceResponseIds: ['qa-me-p7b', 'qa-me-p5', 'qa-rel-p4', 'qa-rel-p5'],
    },

    hiper_realizador: {
      summary:
        'Categoria: Aparece em algumas situações. Foco resolutivo e ação orientada a resultados como forma de combater a incerteza.',
      observations: [
        'Marcado na categoria intermediária de frequência nas respostas (qa-me-p7a)',
        'Relatada iniciativa para solucionar pendências e devolver estabilidade (qa-me-p5)',
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
        'Categoria: Quase nunca acontece comigo. Postura proativa e protagonista, sem que isso anule o cansaço real que você vivencia.',
      observations: [
        'Classificado como quase nunca presente na escala de comportamentos (qa-me-p7a)',
        'Ausência de narrativas de imobilidade ou vitimização passiva nos relatos livres (qa-me-p5)',
      ],
      interpretation:
        'Você raramente se coloca em postura de resignação, passividade ou lamento diante das dificuldades da vida; sua inclinação predominante é a ação e a responsabilidade. É importante ressaltar que marcar "quase nunca" não significa ausência de tristeza ou imunidade ao cansaço, mas apenas que seu movimento espontâneo busca sempre saídas resolutivas.',
      resources: [
        'Autonomia psicológica e postura construtiva perante adversidades',
        'Clareza para buscar soluções sem estagnar em queixas infrutíferas',
      ],
      costs: [
        'Risco de não se permitir expressar vulnerabilidade ou tristeza quando o fardo fica pesado demais',
        'Pode cobrar dos outros a mesma prontidão para superar problemas rapidamente',
      ],
      connections: [
        'Reforça a preferência por mobilizar-se na Luta em vez de paralisar',
        'Dificulta pedir colo ou apoio desarmado em momentos de exaustão',
      ],
      questions: [
        'Quando continuar com força total perde o sentido e o que você realmente precisa é apenas de acolhimento?',
      ],
      sourceResponseIds: ['qa-me-p7a', 'qa-me-p5'],
    },

    hiper_racional: {
      summary:
        'Categoria: Repete-se com frequência. Cálculo preventivo dos próximos passos para organizar cenários e evitar surpresas.',
      observations: [
        'Marcado com frequência expressiva na matriz de proteção (qa-me-p7a)',
        'Citação textual: "Fico calculando os próximos passos para não deixar nada desmoronar nem falhar com ninguém" (qa-me-p4)',
        'Identificação clara de gatilhos profissionais e relacionais de sobrecarga (qa-me-p3)',
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
        'Marcado sob pressão nos comportamentos automáticos (qa-me-p7b)',
        'Selecionado como padrão prioritário: "Antecipar e prevenir qualquer risco" (qa-me-p8)',
        'Retrato corporal sob sobrecarga: "Tensão na mandíbula, pensamentos acelerados em loop e urgência de controlar tudo" (qa-me-p11)',
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
        'Marcado em frequência intermediária nas respostas (qa-me-p7b)',
        'Emoção de "Entusiasmo" assinalada como recorrente ao lado da ansiedade (qa-me-p2)',
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
        'Frequência quase nunca apontada na escala ordinal (qa-me-p7b)',
        'Postura resolutiva voltada ao bem coletivo: resolver logo para devolver a paz ao ambiente (qa-me-p5)',
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
        'Marcado explicitamente como "Ainda não sei dizer" na matriz dos padrões (qa-me-p7b)',
        'Nos conflitos: "Recuo reflexivo temporário para organizar as ideias antes do confronto" (qa-rel-p7)',
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
        'Frequência alta assinalada no questionário de mente e padrões (qa-me-p7b)',
        'Diálogo interno literal diante do erro: "Quando cometo um erro, uma voz me cobra severamente que eu deveria ter previsto isso" (qa-me-p6)',
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
        'Contexto de ativação: sobrecarga de prazos simultâneos e ruídos de comunicação (qa-reg-p1)',
        'Primeiros sinais: aceleração do batimento cardíaco, ombros contraídos e respiração superficial (qa-reg-p2)',
        'Resposta declarada: mobilização hiperativa para resolver tudo imediatamente sem pedir auxílio (qa-reg-p4)',
        'Função percebida: evitar sensação de desamparo/incompetência e garantir previsibilidade profissional (qa-reg-p5)',
        'Custo: estafa mental profunda e dificuldade para relaxar à noite (qa-reg-p6)',
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
        'A reação predominante declarada no questionário foi a Luta (qa-reg-p4)',
        'O recuo relatado nas relações ocorre de forma ponderada antes da conversa reflexiva (qa-rel-p7)',
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
        'Seu funcionamento imediato perante a pressão é resolutivo e hiperativo (qa-reg-p4, qa-me-p5)',
        'A lentidão só aparece posteriormente como custo de estafa após a entrega (qa-reg-p6)',
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
        'Você relata hesitação em dizer não por cuidado com o outro (qa-rel-p4)',
        'Porém, sua resposta perante desafios de trabalho é firme e resolutiva, não de submissão passiva (qa-me-p5, qa-reg-p4)',
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
        'Nó Corpo & Ritmo: estrutura leve, sensibilidade ao frio, digestão irregular e sono entrecortado em diálogo com a rotina.',
      observations: [
        'Estrutura leve e sensível habitual associada a Vata (qa-c1-p1, qa-c1-p4)',
        'Digestão Vishama com gases e sensação de peso pós-prandial (qa-c2-p1, qa-c2-p3)',
        'Sono leve com despertares noturnos e cansaço acumulado (qa-c2-p8, qa-c2-p9)',
      ],
      interpretation:
        'O nó do Corpo é o solo onde todas as suas experiências acontecem. As flutuações de fome, o sono leve e os momentos de estafa física coexistem com a intensidade das suas jornadas de trabalho. Cuidar deste nó passa por cultivar pequenos ritmos de aconchego, refeições quentes e regulares e pausas respiratórias, ancorando a fisiologia na calma.',
      resources: [
        'Percepção precoce de quando o ritmo externo agride o corpo',
        'Boa resposta biológica ao contato com o sol, calor e silêncio',
      ],
      costs: [
        'Oscilação de vitalidade física ao longo da semana',
        'Retenção de tensão nos ombros, costas e mandíbula',
      ],
      connections: [
        'Alimenta e sofre diretamente com os pensamentos de antecipação preventiva',
        'Impacta a disponibilidade erótica e a leveza nas relações íntimas',
      ],
      questions: [
        'Qual o primeiro sinal físico que seu corpo costuma dar quando um dia de trabalho passou da conta?',
      ],
      sourceResponseIds: ['qa-c1-p1', 'qa-c1-p4', 'qa-c2-p1', 'qa-c2-p3', 'qa-c2-p8', 'qa-c2-p9'],
    },

    pensamentos: {
      summary:
        'Nó Pensamentos: antecipação preventiva de cenários, planejamento contínuo e diálogo interno exigente.',
      observations: [
        'Cálculo de passos futuros para não falhar nem deixar desmoronar (qa-me-p4)',
        'Voz autocrítica que repreende enganos afirmando que deveria ter previsto (qa-me-p6)',
        'Pensamentos acelerados em loop em momentos de alta pressão (qa-me-p11)',
      ],
      interpretation:
        'Sua mente é um instrumento poderoso de organização e lucidez. Sob pressão, entretanto, seus pensamentos tendem a acelerar e construir cenários preventivos contínuos, buscando controlar todas as variáveis para afastar a sensação de falha. Reconhecer esse loop como um movimento de proteção ajuda a desarmar a culpa e recuperar o espaço de quietude.',
      resources: [
        'Visão estratégica lúcida e capacidade rápida de estruturar saídas',
        'Preocupação honesta com o bem-estar e o alinhamento coletivo',
      ],
      costs: [
        'Insônia inicial ou despertar noturno com pensamentos em torno do trabalho',
        'Exaustão cognitiva por manter planos alternativos permanentemente ligados',
      ],
      connections: [
        'Dispara a tensão muscular na mandíbula e a aceleração dos batimentos',
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
        'Emoções vividas com intensidade e rapidez corporal imediata (qa-me-p1)',
        'Ansiedade, entusiasmo e preocupação identificados como sentimentos frequentes (qa-me-p2)',
        'Sensação de peito aberto e respiração livre nos momentos de harmonia e segurança (qa-me-p10)',
      ],
      interpretation:
        'Seu universo emocional é rico e dinâmico: você não reprime o que sente, mas percebe no próprio corpo o fluxo vibrante dos sentimentos. Quando há segurança e ausência de pressa, sua afetividade se manifesta em escuta calorosa e peito aberto. Quando surgem prazos e ruídos relacionais, a ansiedade se conecta à preocupação e busca a ação rápida como antídoto.',
      resources: [
        'Capacidade de empatia sincera e escuta atenta sem julgamentos',
        'Entusiasmo contagiante diante de projetos que dialogam com seus valores',
      ],
      costs: [
        'Impacto imediato das tensões emocionais na digestão e na respiração',
        'Dificuldade de filtrar a ansiedade quando as pessoas ao redor estão inseguras',
      ],
      connections: [
        'Conecta-se à necessidade de reciprocidade e verdade nos vínculos',
        'Nutre sua sensibilidade artística, contemplativa e o contato com a natureza',
      ],
      questions: [
        'Como você acolhe o entusiasmo sem deixar que ele acelere o seu corpo além do seu limite de energia?',
      ],
      sourceResponseIds: ['qa-me-p1', 'qa-me-p2', 'qa-me-p10'],
    },

    protecao: {
      summary:
        'Nó Proteção: estratégias sábias de defesa e adaptação que garantiram sua integridade até aqui.',
      observations: [
        'Padrões Insistente e Crítico ativos para assegurar retidão e excelência (qa-me-p7a, qa-me-p7b)',
        'Prestativo ativado sob pressão para recompor a harmonia dos ambientes (qa-me-p7b, qa-me-p5)',
        'Função percebida: proteger a integridade profissional e evitar desamparo (qa-reg-p5)',
      ],
      interpretation:
        'Seus padrões de proteção não são defeitos de personalidade ou traumas insolúveis; são recursos adaptativos inteligentes desenvolvidos ao longo da sua história para cuidar de você e daqueles que você ama. Eles foram indispensáveis para que você construísse a competência e a lealdade que possui hoje. O trabalho integrativo não busca destruí-los, mas devolver-lhes flexibilidade para que não precisem governar todas as horas do seu dia.',
      resources: [
        'Lealdade protetora inabalável aos vínculos e compromissos assumidos',
        'Prontidão e coragem para intervir quando situações exigem liderança',
      ],
      costs: [
        'Rigidez na autocobrança e dificuldade de aceitar a própria imperfeição',
        'Adiamento constante do autocuidado e da diversão descompromissada',
      ],
      connections: [
        'Sustenta a resposta de mobilização de Luta diante de prazos apertados',
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
        'Círculo íntimo seleto com alto nível de dedicação e lealdade profunda (qa-rel-p1)',
        'Hesitação em dizer não e demora em solicitar auxílio (qa-rel-p4, qa-rel-p5)',
        'Acolhimento sincero e comoção ao receber cuidado desinteressado (qa-rel-p6)',
        'Reparação de conflitos através de conversa franca e escuta atenta (qa-rel-p8)',
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
        'Coerência ética e paz de consciência como bússola interna permanente (qa-sen-p1)',
        'Valores fundamentais de verdade, generosidade e respeito à dignidade humana (qa-sen-p2)',
        'Nutrição pela natureza, meditação, silêncio e caminhada descalça no jardim (qa-sen-p3, qa-me-p12)',
        'Desejo e erotismo conectados ao descanso e à ausência de fadiga (qa-sex-p1, qa-sex-p2)',
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
        'Confere significado nobre a todos os seus esforços e projetos profissionais',
        'Oferece os recursos mais poderosos de retorno ao eixo: chá em silêncio, jardim e respiração',
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
        'Sensibilidade viva para perceber nuances corporais e relacionais (qa-me-p1, qa-rel-p2)',
        'Iniciativa ágil para planejar, prevenir falhas e resolver pendências (qa-me-p4, qa-me-p5)',
        'Sinais físicos de sobrecarga e autocobrança severa perante erros (qa-me-p6, qa-reg-p2)',
        'Recursos relatados de retorno ao eixo: respiração, alongamento, chá em silêncio e natureza (qa-reg-p7, qa-me-p12)',
      ],
      interpretation:
        'Mariana, suas respostas mostram capacidade de perceber nuances, planejar e cuidar. Sob pressão, esses mesmos recursos parecem perder flexibilidade: você tenta prever, assume a frente e cobra de si que nada falhe. Isso pode trazer alívio imediato, mas você relata estafa e dificuldade para desacelerar. A direção a explorar não é deixar de ser responsável; é ampliar suas opções para que responsabilidade, apoio e descanso possam coexistir.\n\nComo hipótese explícita de compreensão desse ciclo conjunto — distinguindo seu relato factual das inferências integrativas —, podemos observar a seguinte sequência em momentos desafiadores: demandas profissionais e imprevisibilidade no ambiente disparam a antecipação mental preventiva e a autocobrança; o corpo responde com contração física nos ombros e mandíbula, levando você a agir imediatamente sem solicitar ajuda; o apoio só é buscado tardiamente quando as forças estão no limite; como resultado, instala-se um desgaste acumulado que restringe o espaço para o descanso, a intimidade e o prazer.\n\nVocê já conta com recursos preciosos relatados por você mesma: sua escuta atenta quando está tranquila, a capacidade de notar os sinais da sobrecarga, o contato com a natureza e o jardim, as pausas respiratórias, a gratidão ao receber cuidado sincero e uma bússola ética generosa.\n\nPara transformar esse ciclo, os caminhos não são imposições terapêuticas rígidas, mas experiências a escolher no seu cotidiano: notar os primeiros sinais no corpo antes de assumir mais uma tarefa; perguntar-se com gentileza "isto é realmente minha responsabilidade agora?"; experimentar pedir apoio antes de atingir o limite; tolerar o resultado "suficientemente bom" em vez de exigir o impecável; e proteger pequenas pausas em silêncio ao longo da semana.',
      resources: [
        'Escuta acolhedora e sensível quando está em um ambiente tranquilo',
        'Capacidade demonstrada de reconhecer seus próprios padrões de funcionamento',
        'Contato restaurador com a natureza, silêncio e chá morno',
        'Prática de respiração lenta em 4 tempos e alongamento físico já conhecidos',
        'Sensibilidade para acolher cuidado sincero e capacidade honesta de reparação',
        'Bússola moral assentada na verdade, dignidade humana e generosidade',
      ],
      costs: [
        'Estafa mental ao final do dia e sono interrompido por preocupações',
        'Acúmulo de tarefas individuais por hesitar em dizer não e pedir suporte',
        'Autocrítica pesada diante de desvios e imprevistos na rotina',
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
        'História e Linha da Vida: distinção entre características corporais habituais e uma história relacional que ainda será narrada em conjunto.',
      observations: [
        'Características corporais habituais conhecidas desde jovem (estrutura estreita, sensibilidade térmica) (qa-c1-p1, qa-c1-p4)',
        'Funcionamento atual de alto engajamento profissional e cuidado relacional (qa-me-p5, qa-rel-p1)',
        'Ausência intencional de marcos preenchidos na Linha da Vida neste snapshot inicial',
      ],
      interpretation:
        'Até aqui, há características corporais reconhecidas há anos e relatos do seu funcionamento atual. Ainda faltam marcos compartilhados da Linha da Vida para relacionar esse retrato a acontecimentos específicos. Não sabemos quando você aprendeu a assumir tantas demandas, o que ajudou ou o que foi difícil.\n\nÉ fundamental não pressupor uma infância traumática nem deduzir padrões atuais a partir de hipóteses sobre pais rígidos ou eventos familiares não narrados. Suas tendências constitucionais leves (Prakriti) expressam uma biologia de base, enquanto os padrões de proteção e a dedicação ao trabalho foram moldados ao longo de experiências e contextos de vida que vocês aprofundarão no momento oportuno.\n\nQuando houver uma história real compartilhada entre você e a profissional, essa dimensão será atualizada de forma dialógica e cuidadosa, sem automações que antecipem conclusões sobre a sua vida.',
      resources: [
        'Respeito absoluto à sua autonomia e ao seu tempo para compartilhar memórias',
        'Discernimento para não misturar tendências corporais com histórias relacionais não contadas',
      ],
      costs: [
        'Ainda não dispor de conexões entre vivências do passado e os gatilhos da sobrecarga atual',
      ],
      connections: [
        'Alimentará as conexões entre a Linha da Vida e as escolhas de autocuidado no futuro',
        'Dará suporte a um plano de cuidado verdadeiramente individualizado',
      ],
      questions: [
        'Quando você começou a sentir que precisava dar conta de tudo?',
        'Em quais contextos da sua vida assumir a frente mais ajudou você?',
        'Houve relações em que pedir ajuda foi uma experiência segura e possível?',
        'Que experiências do seu percurso ampliaram sua confiança e seus recursos mais bonitos?',
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
