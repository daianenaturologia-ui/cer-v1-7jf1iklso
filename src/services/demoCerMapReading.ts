import type { CerMapReadingSnapshot } from '../types/cerMapReadings';

/**
 * Fixture de demonstração com snapshot estruturado completo de Leituras do Mapa CER.
 * Dados 100% fictícios para validação interativa dos gráficos e visualizações no modo demo.
 */
export const DEMO_CER_MAP_READING_SNAPSHOT: CerMapReadingSnapshot = {
  version: '1.0.0',
  generatedAt: '2025-01-15T10:00:00.000Z',
  isDemo: true,
  disclaimer: 'Exemplo fictício para demonstração interativa de leitura do Mapa CER.',
  
  dimensions: {
    corpoFisiologia: {
      id: 'corpo_fisiologia',
      label: 'Corpo & Fisiologia (Exemplo Fictício)',
      status: 'complete',
      summary: 'Equilíbrio funcional demonstrativo com predomínio metabólico Pitta-Vata estável.',
      score: 78,
      details: {
        doshas: {
          prakriti: { vata: 35, pitta: 45, kapha: 20 },
          vikriti: { vata: 40, pitta: 45, kapha: 15 },
          predominantPrakriti: 'Pitta-Vata',
          predominantVikriti: 'Pitta-Vata',
          balanceNote: 'Exemplo demonstrativo: Vikriti próximo a Prakriti com leve agravo Vata sazonal.',
        },
        metabolism: {
          agni: 'mandagni',
          agniLabel: 'Digestão irregular com sensibilidade vespertina (fictício)',
          ama: 'low',
          amaLabel: 'Sinais mínimos de acúmulo funcional (fictício)',
        },
        sleepEnergy: {
          sleepQuality: 'Moderada, despertar espontâneo matinal',
          energyLevel: 75,
        },
      },
    },
    menteEmocoes: {
      id: 'mente_emocoes',
      label: 'Mente & Emoções (Exemplo Fictício)',
      status: 'complete',
      summary: 'Clareza mental ativa, capacidade de discernimento e auto-observação emocional.',
      score: 82,
      details: {
        mentalState: 'Sattva predominante com oscilações pontuais de Rajas em momentos de cobrança.',
        emotionalTones: ['Entusiasmo', 'Reflexão', 'Dedicação cuidadosa'],
      },
    },
    relacoes: {
      id: 'relacoes',
      label: 'Relações & Vínculos (Exemplo Fictício)',
      status: 'complete',
      summary: 'Vínculos significativos colaborativos e busca de limites saudáveis no trabalho.',
      score: 70,
      details: {
        orbitCounts: { intimidade: 3, confianca: 6, participacao: 12 },
        relationalStyle: 'Disponibilidade empática com exercício ativo de escuta e clareza de acordos.',
      },
    },
    trajetoriaVida: {
      id: 'trajetoria_vida',
      label: 'Trajetória de Vida (Exemplo Fictício)',
      status: 'complete',
      summary: 'Marcos de transição vocacional bem integrados e ressignificados.',
      score: 85,
      details: {
        milestonesCount: 5,
        narrativeArc: 'Ciclo de consolidação profissional e expansão do autocuidado integral.',
      },
    },
    estiloVida: {
      id: 'estilo_vida',
      label: 'Estilo de Vida (Exemplo Fictício)',
      status: 'complete',
      summary: 'Rotinas diárias estruturadas com pausas conscientes e alimentação regular.',
      score: 74,
      details: {
        dinacharyaAlignment: 72,
        rhythmScore: 76,
      },
    },
    propositoSentido: {
      id: 'proposito_sentido',
      label: 'Propósito & Sentido (Exemplo Fictício)',
      status: 'complete',
      summary: 'Forte senso de contribuição social, alinhamento vocacional e realização ética.',
      score: 90,
      details: {
        ikigaiAlignment: 'Alto alinhamento entre valores pessoais, competências e atuação diária.',
      },
    },
  },

  ayurveda: {
    doshas: {
      prakriti: { vata: 35, pitta: 45, kapha: 20 },
      vikriti: { vata: 40, pitta: 45, kapha: 15 },
    },
    agni: {
      state: 'vishama',
      label: 'Digestão variável / sensível (exemplo)',
      description: 'Tendência a variações no apetite e velocidade digestiva conforme nível de estresse.',
    },
    ama: {
      presence: 'leve',
      label: 'Leve acúmulo funcional matinal (exemplo)',
      description: 'Presença branda de saburra lingual sem sinais sistêmicos relevantes.',
    },
    interpretation: 'Constituição Pitta-Vata em fase de estabilização fisiológica e rotinas favoráveis.',
  },

  protectionPatterns: {
    scale: 'categorical_frequency',
    disclaimer: 'Padrões de sobrevivência observados para autoconhecimento (valores demonstrativos fictícios).',
    patterns: [
      {
        id: 'insistent',
        name: 'Insistente',
        category: 'Repete-se com frequência',
        frequencyScore: 68,
        description: 'Tendência a persistir além do limite necessário antes de pedir suporte.',
        isDominant: false,
      },
      {
        id: 'helper',
        name: 'Prestativo',
        category: 'Aparece com muita força quando estou sob pressão',
        frequencyScore: 88,
        description: 'Priorização das demandas alheias em detrimento das próprias pausas.',
        isDominant: true,
      },
      {
        id: 'realizador',
        name: 'Realizador Incansável',
        category: 'Repete-se com frequência',
        frequencyScore: 74,
        description: 'Senso de urgência em produzir resultados contínuos como validação.',
        isDominant: false,
      },
      {
        id: 'desencorajado',
        name: 'Desencorajado',
        category: 'Quase nunca acontece comigo',
        frequencyScore: 12,
        description: 'Sensação transitória de que o esforço não terá o retorno esperado.',
        isDominant: false,
      },
      {
        id: 'analitico',
        name: 'Analítico',
        category: 'Repete-se com frequência',
        frequencyScore: 72,
        description: 'Busca minuciosa de previsibilidade e dados antes de decisões simples.',
        isDominant: false,
      },
      {
        id: 'hipervigilante',
        name: 'Hipervigilante',
        category: 'Aparece em algumas situações',
        frequencyScore: 42,
        description: 'Atenção redobrada a sinais de desconforto ou discordância no ambiente.',
        isDominant: false,
      },
      {
        id: 'inquieto',
        name: 'Inquieto',
        category: 'Aparece em algumas situações',
        frequencyScore: 48,
        description: 'Necessidade de movimentar múltiplos projetos concomitantemente.',
        isDominant: false,
      },
      {
        id: 'comandante',
        name: 'Comandante',
        category: 'Aparece em algumas situações',
        frequencyScore: 38,
        description: 'Assunção automática do controle em cenários de desorganização coletiva.',
        isDominant: false,
      },
      {
        id: 'esquivo',
        name: 'Esquivo',
        category: 'Quase nunca acontece comigo',
        frequencyScore: 16,
        description: 'Adiamento de conversas difíceis ou confrontos necessários.',
        isDominant: false,
      },
      {
        id: 'critico',
        name: 'Crítico',
        category: 'Ainda não sei dizer',
        frequencyScore: null,
        description: 'Autoavaliação e julgamento interno sobre o padrão de perfeição.',
        isDominant: false,
      },
    ],
  },

  regulation: {
    mode: 'percentage',
    disclaimer: 'Distribuição dos modos de resposta ao estresse (valores percentuais somando 100%).',
    responses: {
      luta: {
        id: 'luta',
        label: 'Luta / Confronto Construtivo',
        percentage: 30,
        description: 'Mobilização ativa para solucionar impasses.',
      },
      fuga: {
        id: 'fuga',
        label: 'Fuga / Racionalização',
        percentage: 45,
        description: 'Direcionamento da energia para hiperatividade ou planejamento compensatório.',
      },
      paralisacao: {
        id: 'paralisacao',
        label: 'Paralisação / Sobrecarga',
        percentage: 15,
        description: 'Sensação de lentidão temporária em picos agudos de estresse.',
      },
      submissao: {
        id: 'submissao',
        label: 'Submissão / Acomodação Rápida',
        percentage: 10,
        description: 'Ceder prematuramente para evitar atrito desnecessário.',
      },
    },
    totalPercentage: 100,
  },

  lifeTimeline: {
    disclaimer: 'Linha do tempo demonstrativa com marcos integrados e conexões hipotéticas.',
    milestones: [
      {
        id: 'm1',
        year: 2012,
        title: 'Início da Formação Universitária (Exemplo Fictício)',
        category: 'educacao',
        impactScore: 8,
      },
      {
        id: 'm2',
        year: 2016,
        title: 'Mudança de Cidade e Primeiro Emprego (Exemplo Fictício)',
        category: 'carreira',
        impactScore: 9,
      },
      {
        id: 'm3',
        year: 2019,
        title: 'Crise de Esgotamento Funcional (Exemplo Fictício)',
        category: 'saude',
        impactScore: 7,
      },
      {
        id: 'm4',
        year: 2021,
        title: 'Início do Acompanhamento Integrativo (Exemplo Fictício)',
        category: 'saude',
        impactScore: 9,
      },
      {
        id: 'm5',
        year: 2024,
        title: 'Transição para Trabalho Autônomo e Família (Exemplo Fictício)',
        category: 'pessoal',
        impactScore: 8,
      },
    ],
    connections: [
      {
        fromId: 'm2',
        toId: 'm3',
        type: 'stress_trigger',
        label: 'Hipótese clínica: sobrecarga adaptativa',
        isHypothesis: true,
        style: 'dashed',
      },
      {
        fromId: 'm3',
        toId: 'm4',
        type: 'turning_point',
        label: 'Hipótese clínica: busca de regulação',
        isHypothesis: true,
        style: 'dashed',
      },
      {
        fromId: 'm4',
        toId: 'm5',
        type: 'integration',
        label: 'Hipótese clínica: consolidação de escolhas',
        isHypothesis: true,
        style: 'dashed',
      },
    ],
  },
};

export function getDemoCerMapReadingSnapshot(): CerMapReadingSnapshot {
  return JSON.parse(JSON.stringify(DEMO_CER_MAP_READING_SNAPSHOT));
}
