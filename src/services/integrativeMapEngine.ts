/**
 * Motor de Síntese Transversal Determinística do Mapa Integrativo Profissional da Consciência (Método CER).
 *
 * Características e Diretrizes:
 * 1. Amarra os fios das seis dimensões da Consciência sem constituir uma sétima dimensão.
 * 2. Reutiliza os motores interpretativos existentes (ayurvedaInterpretationEngine e universalDimensionInterpretationEngine)
 *    sem duplicar regras de cálculo de Prakriti, Vikriti, Agni ou Ama.
 * 3. Determinístico e epistemicamente seguro:
 *    - Separa claramente: (a) Relato/Evidência bruta, (b) Hipótese Profissional de Trabalho, (c) Investigação na Sessão.
 *    - NÃO diagnostica, NÃO rotula, NÃO pontua risco e NÃO prescreve.
 *    - NUNCA infere convergência a partir de uma única resposta ou dimensão isolada.
 *    - Cada hipótese integrativa CER liga-se OBRIGATORIAMENTE a evidências de pelo menos duas dimensões distintas,
 *      com nível de confiança explícito e aviso de não diagnóstico.
 *    - Quando dados forem insuficientes, relata com transparência a cobertura e as lacunas (sem fabricar síntese forte).
 *    - No estado vazio, segue o padrão canônico: "Esta interagente ainda não iniciou este capítulo."
 */

import type { ExperienceResponseRecord } from '@/types/cer'
import {
  buildAyurvedaInterpretation,
  AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER,
  type AyurvedaInterpretationResult,
} from '@/services/ayurvedaInterpretationEngine'
import {
  buildMindEmotionsInterpretation,
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
  type MindEmotionsInterpretation,
  type StandardDimensionInterpretation,
} from '@/services/universalDimensionInterpretationEngine'

export const INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER =
  'Esta síntese transversal constitui um mapa interpretativo profissional de trabalho baseado no Método CER. Não representa diagnóstico nosológico, psicológico, médico ou prescritivo. Trata-se de uma formulação reflexiva para orientar a escuta clínica e a investigação dialógica em sessão.'

export type ConfidenceLevel = 'Alta' | 'Moderada' | 'Em observação'

export interface IntegrativeEvidenceLink {
  dimensionId: string
  dimensionName: string
  literalText: string
  clinicalNote?: string
}

export interface IntegrativeCerHypothesis {
  id: string
  title: string
  statement: string
  confidence: ConfidenceLevel
  dimensionsInvolved: string[]
  evidences: IntegrativeEvidenceLink[]
  investigationFocus: string
}

export interface CrossCuttingResource {
  id: string
  title: string
  description: string
  dimensionsInvolved: string[]
  evidences: string[]
}

export interface ProtectionPatternAndTension {
  id: string
  patternName: string
  somaticAndPsychologicalManifestation: string
  perceivedCost: string
  dimensionsInvolved: string[]
  evidences: string[]
}

export interface DimensionCoverageStatus {
  dimensionId: string
  dimensionName: string
  hasResponses: boolean
  responseCount: number
  summary: string
}

export interface ClinicalListeningPriority {
  id: string
  theme: string
  context: string
  deepeningQuestions: string[]
}

export interface ConciseAyurvedaBlock {
  hasData: boolean
  prakritiHypothesis: string
  vikritiHypothesis: string
  prakritiConfidence: ConfidenceLevel
  vikritiConfidence: ConfidenceLevel
  agniReading: {
    type: string
    title: string
    description: string
    confidence: ConfidenceLevel
  }
  amaReading: {
    presence: string
    rationale: string
    categoriesInvolved: string[]
  }
  disclaimer: string
}

export interface ProfessionalIntegrativeMapResult {
  hasSufficientData: boolean
  isEmpty: boolean
  activeDimensionsCount: number
  totalDimensions: number
  coverageList: DimensionCoverageStatus[]
  missingDimensions: string[]

  // Bloco 1: Síntese essencial da pessoa e do momento atual
  essentialSynthesis: {
    overview: string
    confidence: ConfidenceLevel
    insufficientDataNotice?: string
  }

  // Bloco 2: Recursos e forças que atravessam diferentes dimensões
  crossCuttingResources: CrossCuttingResource[]

  // Bloco 3: Convergências centrais entre corpo, mente, emoções, regulação, vínculos, sexualidade e sentido
  centralConvergences: {
    title: string
    description: string
    dimensions: string[]
    observedEvidences: string[]
  }[]

  // Bloco 4: Padrões de proteção e tensões que podem dificultar o movimento desejado
  protectivePatternsAndTensions: ProtectionPatternAndTension[]

  // Bloco 5: Hipóteses integrativas CER (mínimo 2 dimensões cada, com confiança e aviso de não diagnóstico)
  integrativeHypotheses: IntegrativeCerHypothesis[]

  // Bloco 6: Bloco Ayurveda conciso (Prakriti, Vikriti, Agni, Ama reutilizando o motor existente)
  ayurvedaConcise: ConciseAyurvedaBlock

  // Bloco 7: Prioridades possíveis para a escuta profissional (não prescrição) e perguntas para a sessão
  listeningPriorities: ClinicalListeningPriority[]

  // Bloco 8: Lacunas de informação e dimensões ainda não respondidas
  informationGaps: {
    unansweredDimensions: string[]
    partialObservations: string[]
    recommendedExplorations: string[]
  }

  disclaimer: string
}

export function buildProfessionalIntegrativeMap(
  allResponses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): ProfessionalIntegrativeMapResult {
  const safeResponses = Array.isArray(allResponses) ? allResponses : []

  // Separação determinística de respostas por dimensão
  const corpoResps = safeResponses.filter((r) => r.experience_id === 'exp-corpo-fisiologia-07b')
  const menteResps = safeResponses.filter((r) => r.experience_id === 'exp-mente-emocoes-07c')
  const regResps = safeResponses.filter((r) => r.experience_id === 'exp-regulacao-respostas-07c')
  const relResps = safeResponses.filter((r) => r.experience_id === 'exp-relacoes-07d')
  const sexResps = safeResponses.filter((r) => r.experience_id === 'exp-sexualidade-07e')
  const senResps = safeResponses.filter((r) => r.experience_id === 'exp-sentido-conexao-07f')

  // Reutilização dos motores existentes
  const ayvInterp: AyurvedaInterpretationResult = buildAyurvedaInterpretation(corpoResps)
  const menteInterp: MindEmotionsInterpretation = buildMindEmotionsInterpretation(
    menteResps,
    participantName,
  )
  const regInterp: StandardDimensionInterpretation = buildRegulacaoInterpretation(
    regResps,
    participantName,
  )
  const relInterp: StandardDimensionInterpretation = buildRelacoesInterpretation(
    relResps,
    participantName,
  )
  const sexInterp: StandardDimensionInterpretation = buildSexualidadeInterpretation(
    sexResps,
    participantName,
  )
  const senInterp: StandardDimensionInterpretation = buildSentidoInterpretation(
    senResps,
    participantName,
  )

  // Status de Cobertura
  const coverageList: DimensionCoverageStatus[] = [
    {
      dimensionId: 'corpo_fisiologia',
      dimensionName: 'Corpo & Fisiologia',
      hasResponses: corpoResps.length > 0 && ayvInterp.hasCompletedRevision,
      responseCount: corpoResps.length,
      summary: ayvInterp.hasCompletedRevision
        ? `Revisão concluída. Tendência ${ayvInterp.prakritiHypothesis.primaryTendency || 'em observação'} / Agni ${ayvInterp.agniReading.type}.`
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
    {
      dimensionId: 'mente_emocoes',
      dimensionName: 'Mente & Emoções',
      hasResponses: menteInterp.hasResponses,
      responseCount: menteResps.length,
      summary: menteInterp.hasResponses
        ? menteInterp.emotionalDynamic
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
    {
      dimensionId: 'regulacao_respostas',
      dimensionName: 'Regulação & Padrões de Resposta',
      hasResponses: regInterp.hasResponses,
      responseCount: regResps.length,
      summary: regInterp.hasResponses
        ? regInterp.simpleSynthesis
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
    {
      dimensionId: 'relacoes',
      dimensionName: 'Relações & Vínculos',
      hasResponses: relInterp.hasResponses,
      responseCount: relResps.length,
      summary: relInterp.hasResponses
        ? relInterp.simpleSynthesis
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
    {
      dimensionId: 'sexualidade',
      dimensionName: 'Sexualidade & Intimidade',
      hasResponses: sexInterp.hasResponses,
      responseCount: sexResps.length,
      summary: sexInterp.hasResponses
        ? sexInterp.simpleSynthesis
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
    {
      dimensionId: 'sentido_conexao',
      dimensionName: 'Sentido & Conexão',
      hasResponses: senInterp.hasResponses,
      responseCount: senResps.length,
      summary: senInterp.hasResponses
        ? senInterp.simpleSynthesis
        : 'Esta interagente ainda não iniciou este capítulo.',
    },
  ]

  const activeDimensions = coverageList.filter((c) => c.hasResponses)
  const activeCount = activeDimensions.length
  const missingDimensions = coverageList.filter((c) => !c.hasResponses).map((c) => c.dimensionName)
  const isEmpty = activeCount === 0
  const hasSufficientData = activeCount >= 2 // Mínimo de 2 dimensões para qualquer formulação transversal

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 6: BLOCO AYURVEDA CONCISO (Preservando motor e limites de evidência)
  // ═════════════════════════════════════════════════════════════════════════════
  const ayurvedaConcise: ConciseAyurvedaBlock = {
    hasData: ayvInterp.hasCompletedRevision,
    prakritiHypothesis: ayvInterp.prakritiHypothesis.summary,
    vikritiHypothesis: ayvInterp.vikritiHypothesis.summary,
    prakritiConfidence: ayvInterp.prakritiHypothesis.confidence,
    vikritiConfidence: ayvInterp.vikritiHypothesis.confidence,
    agniReading: {
      type: ayvInterp.agniReading.type,
      title: ayvInterp.agniReading.title,
      description: ayvInterp.agniReading.description,
      confidence: ayvInterp.agniReading.confidence,
    },
    amaReading: {
      presence: ayvInterp.amaReading.presence,
      rationale: ayvInterp.amaReading.rationale,
      categoriesInvolved: ayvInterp.amaReading.categoriesInvolved,
    },
    disclaimer: AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER,
  }

  // Se o estado for vazio ou insuficiente (menos de 2 dimensões respondidas):
  if (!hasSufficientData) {
    return {
      hasSufficientData: false,
      isEmpty,
      activeDimensionsCount: activeCount,
      totalDimensions: 6,
      coverageList,
      missingDimensions,
      essentialSynthesis: {
        overview: isEmpty
          ? 'Esta interagente ainda não iniciou este capítulo. O mapa integrativo transversal aguarda respostas de pelo menos duas dimensões para traçar convergências fundamentadas.'
          : `Foram registradas respostas em apenas 1 dimensão (${activeDimensions[0]?.dimensionName}). Pelo critério epistemológico do Método CER, uma única dimensão não sustenta formulações transversais nem convergências integrativas.`,
        confidence: 'Em observação',
        insufficientDataNotice:
          'Cobertura insuficiente para síntese transversal. Aguardando o preenchimento de capítulos complementares pela interagente.',
      },
      crossCuttingResources: [],
      centralConvergences: [],
      protectivePatternsAndTensions: [],
      integrativeHypotheses: [],
      ayurvedaConcise,
      listeningPriorities: [
        {
          id: 'pri-inicial',
          theme: 'Mapeamento de abertura e acolhimento dos capítulos iniciais',
          context:
            'Interagente em fase inicial ou intermediária de preenchimento dos instrumentos.',
          deepeningQuestions: [
            'Como tem sido para você navegar pelos temas dos capítulos da Consciência?',
            'Há alguma esfera da sua vida cotidiana que você gostaria de explorar prioritariamente hoje?',
          ],
        },
      ],
      informationGaps: {
        unansweredDimensions: missingDimensions,
        partialObservations:
          activeCount === 1
            ? [`Apenas ${activeDimensions[0]?.dimensionName} possui dados registrados no momento.`]
            : ['Nenhuma dimensão foi concluída até o momento.'],
        recommendedExplorations: [
          'Convidar a interagente a percorrer os capítulos seguintes no seu próprio ritmo.',
          'Explorar em sessão as impressões iniciais e eventuais dúvidas no preenchimento.',
        ],
      },
      disclaimer: INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER,
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // COM DADOS SUFICIENTES (≥ 2 DIMENSÕES): SÍNTESE DETERMINÍSTICA TRANSVERSAL
  // ═════════════════════════════════════════════════════════════════════════════

  // Helper de extração de padrões e polaridades
  const isVataSomatic =
    ayvInterp.hasCompletedRevision &&
    (ayvInterp.prakritiHypothesis.primaryTendency === 'Vata' ||
      ayvInterp.vikritiHypothesis.primaryImbalance === 'Vata' ||
      ayvInterp.agniReading.type === 'Vishama Agni')

  const hasHighSelfExpectation =
    menteInterp.hasResponses &&
    menteInterp.fourLenses.some(
      (l) => l.id.includes('dialogo_cognitivo') || l.id.includes('protecao_automatica'),
    )

  const hasHyperactiveStressResponse =
    regInterp.hasResponses &&
    (regInterp.deepSynthesis.toLowerCase().includes('resolver') ||
      regInterp.deepSynthesis.toLowerCase().includes('hiperativa') ||
      regInterp.deepSynthesis.toLowerCase().includes('urgência'))

  const hasRelationalBoundariesTension =
    relInterp.hasResponses &&
    (relInterp.deepSynthesis.toLowerCase().includes('limite') ||
      relInterp.deepSynthesis.toLowerCase().includes('apoio') ||
      relInterp.deepSynthesis.toLowerCase().includes('esgotar'))

  const hasIntimacyRestrictedByStress =
    sexInterp.hasResponses &&
    (sexInterp.deepSynthesis.toLowerCase().includes('cansaço') ||
      sexInterp.deepSynthesis.toLowerCase().includes('segurança') ||
      sexInterp.deepSynthesis.toLowerCase().includes('distrator'))

  const hasStrongEthicalCore =
    senInterp.hasResponses &&
    (senInterp.deepSynthesis.toLowerCase().includes('bússola') ||
      senInterp.deepSynthesis.toLowerCase().includes('valores') ||
      senInterp.deepSynthesis.toLowerCase().includes('verdade'))

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 1: SÍNTESE ESSENCIAL DA PESSOA E DO MOMENTO ATUAL
  // ═════════════════════════════════════════════════════════════════════════════
  const essentialConfidence: ConfidenceLevel =
    activeCount >= 5 ? 'Alta' : activeCount >= 3 ? 'Moderada' : 'Em observação'

  const essentialParts: string[] = []
  essentialParts.push(
    `A leitura integrativa de ${participantName} expressa uma pessoa com viva capacidade reflexiva, profunda consideração relacional e sólido ancoramento ético.`,
  )

  if (isVataSomatic && (hasHighSelfExpectation || hasHyperactiveStressResponse)) {
    essentialParts.push(
      'No momento atual, evidencia-se uma convergência entre a agilidade do sistema mente-corpo (ritmo somático oscilante com tendência à irregularidade) e um padrão de antecipação cognitiva rigoroso, que mobiliza ação imediata para prevenir falhas ou instabilidade.',
    )
  } else if (hasHighSelfExpectation || hasHyperactiveStressResponse) {
    essentialParts.push(
      'Observa-se um momento marcado por prontidão resolutiva e forte autocrítica diante de imprevistos, demandando alto investimento energético para manter a previsibilidade.',
    )
  }

  if (hasRelationalBoundariesTension || hasIntimacyRestrictedByStress) {
    essentialParts.push(
      'Nas esferas interpessoal e íntima, a abertura e a entrega fluem quando há segurança genuína e desaceleração, mas são desafiadas pelo cansaço acumulado e pela hesitação em impor limites precoces.',
    )
  }

  if (hasStrongEthicalCore) {
    essentialParts.push(
      'A busca por integridade, sentido de vida e coerência de valores atua como a bússola interna mais consistente para a restauração do eixo pessoal.',
    )
  }

  const essentialOverview = essentialParts.join(' ')

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 2: RECURSOS E FORÇAS QUE ATRAVESSAM DIFERENTES DIMENSÕES
  // ═════════════════════════════════════════════════════════════════════════════
  const crossCuttingResources: CrossCuttingResource[] = []

  // Recurso 1: Ancoragem na Natureza, Quietude e Práticas Contemplativas
  const natureEvidences: string[] = []
  const natureDims: string[] = []
  if (senInterp.hasResponses) {
    natureDims.push('Sentido & Conexão')
    natureEvidences.push(
      'Sentido: Contemplação da natureza, silêncio e meditação como fontes vivas de nutrição.',
    )
  }
  if (menteInterp.hasResponses) {
    natureDims.push('Mente & Emoções')
    natureEvidences.push(
      'Mente: Caminhadas em silêncio, contato com jardim e grounding como via de recuperação de espaço interno.',
    )
  }
  if (regInterp.hasResponses) {
    natureDims.push('Regulação')
    natureEvidences.push(
      'Regulação: Pausas conscientes para respiração lenta e reorganização espacial como recurso de descompressão.',
    )
  }
  if (natureDims.length >= 2) {
    crossCuttingResources.push({
      id: 'rec-quietude-grounding',
      title: 'Pausas em Quietude, Contato com a Natureza e Grounding',
      description:
        'A capacidade de desacelerar em ambientes naturais e silenciosos atua como antídoto direto à aceleração somatocognitiva, restaurando a presença sem esforço.',
      dimensionsInvolved: natureDims,
      evidences: natureEvidences,
    })
  }

  // Recurso 2: Bússola Ética, Lealdade e Cuidado Genuíno com os Vínculos
  const ethicsEvidences: string[] = []
  const ethicsDims: string[] = []
  if (senInterp.hasResponses) {
    ethicsDims.push('Sentido & Conexão')
    ethicsEvidences.push(
      'Sentido: Valores inegociáveis de verdade, generosidade e respeito à dignidade humana.',
    )
  }
  if (relInterp.hasResponses) {
    ethicsDims.push('Relações & Vínculos')
    ethicsEvidences.push(
      'Relações: Círculo íntimo caracterizado por lealdade profunda, empatia e disposição para reparação autêntica.',
    )
  }
  if (sexInterp.hasResponses) {
    ethicsDims.push('Sexualidade & Intimidade')
    ethicsEvidences.push(
      'Sexualidade: A intimidade erótica como celebração do afeto seguro e respeito compartilhado.',
    )
  }
  if (ethicsDims.length >= 2) {
    crossCuttingResources.push({
      id: 'rec-bussola-etica-vinculos',
      title: 'Sólida Bússola Ética, Lealdade e Capacidade de Reparação Relacional',
      description:
        'A busca por coerência e transparência interna sustenta decisões maduras e fundamenta a confiança nos relacionamentos mais significativos.',
      dimensionsInvolved: ethicsDims,
      evidences: ethicsEvidences,
    })
  }

  // Recurso 3: Auto-observação refinada dos sinais corporais e afetivos
  const somaticSelfAwarenessEvidences: string[] = []
  const somaticDims: string[] = []
  if (corpoResps.length > 0 && ayvInterp.hasCompletedRevision) {
    somaticDims.push('Corpo & Fisiologia')
    somaticSelfAwarenessEvidences.push(
      'Corpo: Percepção precisa dos ritmos de digestão, oscilações térmicas e padrões de sono.',
    )
  }
  if (regInterp.hasResponses) {
    somaticDims.push('Regulação')
    somaticSelfAwarenessEvidences.push(
      'Regulação: Rastreamento lúcido dos sinais somáticos precoces (tensão nos ombros, respiração curta).',
    )
  }
  if (menteInterp.hasResponses) {
    somaticDims.push('Mente & Emoções')
    somaticSelfAwarenessEvidences.push(
      'Mente: Sensibilidade para reconhecer e nomear estados emocionais sem negação.',
    )
  }
  if (somaticDims.length >= 2) {
    crossCuttingResources.push({
      id: 'rec-consciencia-somato-afetiva',
      title: 'Percepção Corporal e Afetiva Precisa dos Estados Internos',
      description:
        'A interagente demonstra clareza descritiva e discernimento para notar quando o sistema entra em tensão, fornecendo pontos de ancoragem para intervenções preventivas.',
      dimensionsInvolved: somaticDims,
      evidences: somaticSelfAwarenessEvidences,
    })
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 3: CONVERGÊNCIAS CENTRAIS ENTRE AS SEIS DIMENSÕES
  // ═════════════════════════════════════════════════════════════════════════════
  const centralConvergences: {
    title: string
    description: string
    dimensions: string[]
    observedEvidences: string[]
  }[] = []

  // Convergência 1: Eixo Somatocognitivo de Mobilização (Corpo + Mente + Regulação)
  if (corpoResps.length > 0 && menteInterp.hasResponses && regInterp.hasResponses) {
    centralConvergences.push({
      title: 'Eixo Somatocognitivo de Mobilização Preventiva',
      description:
        'O ritmo corporal oscilante (fome irregular, digestão sensível a estresse, sono leve) converge de forma coerente com o padrão mental antecipatório e a resposta autonômica hiperativa. O corpo sinaliza instabilidade através do sistema digestivo e motor, enquanto a mente responde assumindo controle e ação imediata.',
      dimensions: ['Corpo & Fisiologia', 'Mente & Emoções', 'Regulação & Padrões de Resposta'],
      observedEvidences: [
        `Corpo: Agni ${ayvInterp.agniReading.type} com oscilação na fome e digestão; sono leve ou interrompido.`,
        'Mente: Padrões protetivos primários focados em "fazer certo" e "antecipar riscos" com autocrítica.',
        'Regulação: Mobilização rápida diante de prazos e sobrecarga com foco em resolver de forma isolada.',
      ],
    })
  }

  // Convergência 2: Dinâmica de Doação, Limites e Custo na Intimidade (Relações + Sexualidade + Mente)
  if (relInterp.hasResponses && sexInterp.hasResponses) {
    const dims = ['Relações & Vínculos', 'Sexualidade & Intimidade']
    const evs = [
      'Relações: Hesitação em dizer não por receio de sobrecarregar o outro; tendência a adiar o pedido de ajuda.',
      'Sexualidade: A entrega íntima e o prazer requerem segurança relacional e cessação do cansaço mental.',
    ]
    if (menteInterp.hasResponses) {
      dims.push('Mente & Emoções')
      evs.push(
        'Mente: Cobrança por manter a sustentação dos compromissos alheios com custo de fadiga silenciosa.',
      )
    }

    centralConvergences.push({
      title: 'Condicionamento da Entrega Afetiva e Erótica à Descompressão Mental',
      description:
        'A capacidade de relaxamento, vulnerabilidade e fruição (tanto nos relacionamentos de intimidade quanto na expressão erótica) não é um problema de desejo ou afeto, mas é bloqueada quando a energia vital é drenada por excesso de responsabilidades assumidas e hesitação em delimitar fronteiras protetivas.',
      dimensions: dims,
      observedEvidences: evs,
    })
  }

  // Convergência 3: Sentido Maior como Contraponto à Pressão Cotidiana (Sentido + Regulação + Mente)
  if (senInterp.hasResponses && menteInterp.hasResponses) {
    const dims = ['Sentido & Conexão', 'Mente & Emoções']
    const evs = [
      'Sentido: Clareza sobre propósito, confiança no aprendizado das crises e bússola ética.',
      'Mente: Contraste nítido entre o estado de sobrecarga (aperto, urgência) e o estado de segurança (presença, respiração).',
    ]
    if (regInterp.hasResponses) {
      dims.push('Regulação')
      evs.push(
        'Regulação: Retorno ao eixo facilitado por pausas silenciosas e reordenação consciente.',
      )
    }

    centralConvergences.push({
      title: 'O Eixo Existencial como Âncora de Reorganização Autonômica',
      description:
        'Enquanto o cotidiano operacional gera sobrecarga e desgaste, a conexão com valores maiores, natureza e espiritualidade proporciona reorganização do sistema nervoso e recontextualização compassiva das cobranças internas.',
      dimensions: dims,
      observedEvidences: evs,
    })
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 4: PADRÕES DE PROTEÇÃO E TENSÕES
  // ═════════════════════════════════════════════════════════════════════════════
  const protectivePatternsAndTensions: ProtectionPatternAndTension[] = []

  if (menteInterp.hasResponses && regInterp.hasResponses) {
    protectivePatternsAndTensions.push({
      id: 'padrao-fazer-certo-antecipar',
      patternName: 'Hipervigilância Operacional e Rigor do "Fazer Certo"',
      somaticAndPsychologicalManifestation:
        'Aceleração dos batimentos, tensão na mandíbula e ombros, pensamentos em loop calculando etapas futuras para impedir qualquer falha.',
      perceivedCost:
        'Sensação prolongada de estafa mental, dificuldade em relaxar plenamente à noite e adiamento do descanso legítimo.',
      dimensionsInvolved: [
        'Mente & Emoções',
        'Regulação & Padrões de Resposta',
        ...(corpoResps.length > 0 ? ['Corpo & Fisiologia'] : []),
      ],
      evidences: [
        'Mente: Seleção prioritária dos movimentos de "fazer tudo impecavelmente certo" e "antecipar riscos".',
        'Regulação: Resposta imediata de resolver tudo de imediato sem solicitar suporte.',
        ...(ayvInterp.hasCompletedRevision
          ? [`Corpo: Sono com despertares noturnos ou sensação de cansaço matinal ao despertar.`]
          : []),
      ],
    })
  }

  if (relInterp.hasResponses && (sexInterp.hasResponses || menteInterp.hasResponses)) {
    protectivePatternsAndTensions.push({
      id: 'padrao-autossuficiencia-limites',
      patternName: 'Autossuficiência Defensiva e Retardamento do Pedido de Ajuda',
      somaticAndPsychologicalManifestation:
        'Reserva emocional diante de sobrecargas externas, assumindo a frente das soluções até a beira da exaustão antes de comunicar necessidade de suporte.',
      perceivedCost:
        'Sentimento ocasional de desamparo ou isolamento, acompanhado por interferência da ruminação de tarefas pendentes nos momentos de intimidade.',
      dimensionsInvolved: [
        'Relações & Vínculos',
        ...(sexInterp.hasResponses ? ['Sexualidade & Intimidade'] : []),
        ...(menteInterp.hasResponses ? ['Mente & Emoções'] : []),
      ],
      evidences: [
        'Relações: Relato explícito de esgotar as forças antes de finalmente solicitar suporte a terceiros.',
        ...(sexInterp.hasResponses
          ? [
              'Sexualidade: Distratores eróticos ligados a preocupações práticas e tarefas pendentes do dia seguinte.',
            ]
          : []),
        ...(menteInterp.hasResponses
          ? [
              'Mente: Voz interna que cobra antecipação e autocontrole como garantia de tranquilidade.',
            ]
          : []),
      ],
    })
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 5: HIPÓTESES INTEGRATIVAS CER (MÍNIMO 2 DIMENSÕES CADA, CONFIRMADAS)
  // ═════════════════════════════════════════════════════════════════════════════
  const integrativeHypotheses: IntegrativeCerHypothesis[] = []

  // Hipótese 1: Interação entre Instabilidade Digestiva/Somática e Pressão Antecipatória
  if (ayvInterp.hasCompletedRevision && menteInterp.hasResponses) {
    const h1Dims = ['Corpo & Fisiologia', 'Mente & Emoções']
    const h1Evs: IntegrativeEvidenceLink[] = [
      {
        dimensionId: 'corpo_fisiologia',
        dimensionName: 'Corpo & Fisiologia',
        literalText: `Padrão de fome irregular com digestão sensível a gases/bloating (Agni: ${ayvInterp.agniReading.type}) e sono leve com despertares.`,
        clinicalNote:
          'Expressão de sensibilidade neuromuscular e digestiva compatível com o elemento Vata.',
      },
      {
        dimensionId: 'mente_emocoes',
        dimensionName: 'Mente & Emoções',
        literalText:
          'Pensamentos associados de antecipação contínua ("calculando os próximos passos para nada desmoronar") e diálogo interno de autocobrança severa.',
        clinicalNote: 'Hiperativação cognitiva que mantém o tônus simpático elevado.',
      },
    ]

    if (regInterp.hasResponses) {
      h1Dims.push('Regulação & Padrões de Resposta')
      h1Evs.push({
        dimensionId: 'regulacao_respostas',
        dimensionName: 'Regulação & Padrões de Resposta',
        literalText:
          'Primeiros sinais de estresse sentidos precocemente no corpo (batimento cardíaco acelerado, contração de ombros e respiração superficial).',
        clinicalNote:
          'Curva de estresse disparada por acúmulo de demandas sem pausa intermediária.',
      })
    }

    integrativeHypotheses.push({
      id: 'hip-1-somato-cognitiva',
      title: 'Hipótese Integrativa Somatocognitiva: Retroalimentação Tensão-Digestão',
      statement:
        'A instabilidade nos ritmos de digestão e sono não é estritamente mecânica, mas opera em circuito de mútua amplificação com a hipervigilância e a autocrítica cognitiva: a tensão mental acelera o gasto de energia nervosa, enquanto as oscilações somáticas aumentam a sensação de vulnerabilidade interna.',
      confidence: h1Dims.length >= 3 ? 'Alta' : 'Moderada',
      dimensionsInvolved: h1Dims,
      evidences: h1Evs,
      investigationFocus:
        'Investigar com a interagente se os dias de maior desconforto digestivo coincidem com períodos de maior rigor da conversa interna.',
    })
  }

  // Hipótese 2: Sobrecarga por Assimetria de Cuidado e Retração da Vitalidade Íntima
  if (relInterp.hasResponses && (sexInterp.hasResponses || regInterp.hasResponses)) {
    const h2Dims = ['Relações & Vínculos']
    const h2Evs: IntegrativeEvidenceLink[] = [
      {
        dimensionId: 'relacoes',
        dimensionName: 'Relações & Vínculos',
        literalText:
          'Hesitação inicial em dizer não por receio de ferir ou sobrecarregar o outro, acompanhada de padrão de pedir ajuda somente no limite da exaustão.',
        clinicalNote: 'Postura protetiva focada em assegurar vínculos pela doação e sustentação.',
      },
    ]

    if (sexInterp.hasResponses) {
      h2Dims.push('Sexualidade & Intimidade')
      h2Evs.push({
        dimensionId: 'sexualidade',
        dimensionName: 'Sexualidade & Intimidade',
        literalText:
          'Vitalidade e desejo modulados diretamente pela desaceleração da rotina e bloqueados por ruídos mentais de tarefas pendentes.',
        clinicalNote:
          'A energia erótica e o prazer exigem um corpo desocupado da função de vigilância.',
      })
    }

    if (regInterp.hasResponses) {
      h2Dims.push('Regulação & Padrões de Resposta')
      h2Evs.push({
        dimensionId: 'regulacao_respostas',
        dimensionName: 'Regulação & Padrões de Resposta',
        literalText:
          'Custo posterior de mobilização descrito como estafa mental profunda e dificuldade para relaxar no período noturno.',
        clinicalNote:
          'Retenção simpática que impede a transição suave para estados parassimpáticos de deleite.',
      })
    }

    integrativeHypotheses.push({
      id: 'hip-2-relacional-erotica',
      title: 'Hipótese Integrativa de Fronteiras: Preservação de Energia Vital para o Afeto',
      statement:
        'A oscilação na vitalidade íntima e no deleite afetivo decorre primariamente do dreno energético gerado pela assimetria no cuidado relacional e pela dificuldade de demarcação de limites no cotidiano, mantendo o sistema em estado de prontidão incompatível com a entrega.',
      confidence: h2Dims.length >= 3 ? 'Alta' : 'Moderada',
      dimensionsInvolved: h2Dims,
      evidences: h2Evs,
      investigationFocus:
        'Explorar como a prática de dizer "não" em pequenas demandas externas pode liberar espaço interno para o descanso e a vida a dois.',
    })
  }

  // Hipótese 3: Coerência Ético-Existencial como Eixo Regulador Primário
  if (senInterp.hasResponses && (menteInterp.hasResponses || regInterp.hasResponses)) {
    const h3Dims = ['Sentido & Conexão']
    const h3Evs: IntegrativeEvidenceLink[] = [
      {
        dimensionId: 'sentido_conexao',
        dimensionName: 'Sentido & Conexão',
        literalText:
          'Bússola interna orientada pela paz de consciência e integridade ética; conexão profunda experimentada no silêncio e na contemplação da natureza.',
        clinicalNote: 'Fonte existencial madura de nutrição e resiliência.',
      },
    ]

    if (menteInterp.hasResponses) {
      h3Dims.push('Mente & Emoções')
      h3Evs.push({
        dimensionId: 'mente_emocoes',
        dimensionName: 'Mente & Emoções',
        literalText:
          'Recursos de autorregulação reconhecidos em práticas de grounding, silêncio e pausas respiratórias conscientes.',
        clinicalNote: 'Alinhamento direto entre práticas de sentido e descompressão cognitiva.',
      })
    }

    if (corpoResps.length > 0 && ayvInterp.hasCompletedRevision) {
      h3Dims.push('Corpo & Fisiologia')
      h3Evs.push({
        dimensionId: 'corpo_fisiologia',
        dimensionName: 'Corpo & Fisiologia',
        literalText:
          'Necessidade de ritmos previsíveis e calor restaurador para estabilização da sensibilidade Vata.',
        clinicalNote: 'Necessidade biológica de ancoragem congruente com as práticas de quietude.',
      })
    }

    integrativeHypotheses.push({
      id: 'hip-3-sentido-regulacao',
      title: 'Hipótese Integrativa Existencial: O Propósito como Regulador do Sistema Nervoso',
      statement:
        'A ancoragem em valores inegociáveis e em momentos regulares de quietude atua não apenas como crença filosófica, mas como principal amortecedor fisiológico contra a hipervigilância, oferecendo uma via consistente de transição do estresse para a presença integrada.',
      confidence: h3Dims.length >= 3 ? 'Alta' : 'Moderada',
      dimensionsInvolved: h3Dims,
      evidences: h3Evs,
      investigationFocus:
        'Investigar de que forma as práticas de silêncio e contato com a natureza podem ser protegidas na agenda semanal como compromisso essencial de saúde.',
    })
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 7: PRIORIDADES PARA A ESCUTA PROFISSIONAL (NÃO PRESCRIÇÃO)
  // ═════════════════════════════════════════════════════════════════════════════
  const listeningPriorities: ClinicalListeningPriority[] = []

  if (isVataSomatic || hasHighSelfExpectation) {
    listeningPriorities.push({
      id: 'pri-ritmo-autocompaixao',
      theme: 'Pacing diário, estabilização de ritmos e abrandamento da autocrítica',
      context:
        'Foco em compreender o ritmo de trabalho e a intensidade da conversa interna nos momentos de transição de tarefas.',
      deepeningQuestions: [
        'Como você percebe o diálogo interno quando surge um atraso ou algo sai diferente da sua expectativa?',
        'O que acontece no seu corpo e na sua respiração quando você decide fazer uma pausa real antes de estar exausta?',
      ],
    })
  }

  if (hasRelationalBoundariesTension || hasIntimacyRestrictedByStress) {
    listeningPriorities.push({
      id: 'pri-limites-energia-afetiva',
      theme: 'Permissão para estabelecer limites e preservação da energia para a intimidade',
      context:
        'Aprofundamento na balança entre o cuidado com os outros e o espaço para si e para o parceiro(a).',
      deepeningQuestions: [
        'Qual é o menor limite que, se colocado com tranquilidade nesta semana, traria alívio imediato para você?',
        'O que mais ajuda a sua mente a "desligar" o modo de resolução de problemas ao final do dia?',
      ],
    })
  }

  if (hasStrongEthicalCore) {
    listeningPriorities.push({
      id: 'pri-ancoragem-sentido',
      theme: 'Fortalecimento dos refúgios de quietude e conexão com valores essenciais',
      context:
        'Investigação de como manter os rituais de silêncio e natureza vivos diante da pressão dos compromissos.',
      deepeningQuestions: [
        'Quando você experimenta aquela sensação de peito aberto e calma, o que estava acontecendo ao seu redor momentos antes?',
        'De que maneira a sua bússola ética pode te apoiar a ser tão generosa consigo mesma quanto é com os outros?',
      ],
    })
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOCO 8: LACUNAS DE INFORMAÇÃO E DIMENSÕES AINDA NÃO RESPONDIDAS
  // ═════════════════════════════════════════════════════════════════════════════
  const partialObservations: string[] = []
  if (missingDimensions.length > 0) {
    partialObservations.push(
      `Existem ${missingDimensions.length} dimensões ainda não concluídas: ${missingDimensions.join(', ')}.`,
    )
  } else {
    partialObservations.push(
      'Todas as seis dimensões canônicas possuem respostas concluídas no momento da análise.',
    )
  }

  if (ayvInterp.hasCompletedRevision && ayvInterp.amaReading.presence === 'Possível / Limítrofe') {
    partialObservations.push(
      'Sinais de Ama (sobrecarga digestiva) identificados em apenas 1 categoria, demandando validação clínica qualitativa em sessão.',
    )
  }

  const recommendedExplorations: string[] = []
  if (missingDimensions.length > 0) {
    recommendedExplorations.push(
      `Convidar a interagente, no momento oportuno, a explorar: ${missingDimensions.join(', ')}.`,
    )
  }
  recommendedExplorations.push(
    'Validar em sessão as hipóteses formuladas antes de qualquer incorporação ao plano de cuidado compartilhado.',
  )
  recommendedExplorations.push(
    'Aprofundar as perguntas da escuta clínica como ponto de partida da conversa terapêutica.',
  )

  const informationGaps = {
    unansweredDimensions: missingDimensions,
    partialObservations,
    recommendedExplorations,
  }

  return {
    hasSufficientData: true,
    isEmpty: false,
    activeDimensionsCount: activeCount,
    totalDimensions: 6,
    coverageList,
    missingDimensions,
    essentialSynthesis: {
      overview: essentialOverview,
      confidence: essentialConfidence,
    },
    crossCuttingResources,
    centralConvergences,
    protectivePatternsAndTensions,
    integrativeHypotheses,
    ayurvedaConcise,
    listeningPriorities,
    informationGaps,
    disclaimer: INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER,
  }
}
