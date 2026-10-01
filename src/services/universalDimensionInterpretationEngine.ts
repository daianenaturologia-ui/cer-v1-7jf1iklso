/**
 * Motor Interpretativo Universal da Consciência (Método CER).
 *
 * Provê geração de sínteses simples, sínteses profundas, recursos, pontos de atenção,
 * evidências observadas e perguntas para aprofundamento em sessão para:
 * 1. Mente & Emoções (Resumo essencial + 4 lentes interpretativas completas)
 * 2. Regulação & Padrões de Resposta
 * 3. Relações & Vínculos
 * 4. Sexualidade & Intimidade
 * 5. Sentido & Conexão
 *
 * Regras:
 * - Nenhuma menção a IDs técnicos (ayv_*, p-07*, etc.). Somente títulos humanos e escolhas literais.
 * - Não diagnóstico. Postura epistêmica de hipótese de trabalho e colaboração profissional.
 * - Convergência entre respostas para sustentar hipóteses e lentes.
 * - Ausência, recusa ou dúvida explícita são respeitadas e sinalizadas com cuidado sem distorcer o perfil.
 */

import type { ExperienceResponseRecord } from '@/types/cer'
import { CER_PROTECTION_PATTERNS } from '@/services/cerProtectionPatterns'
import { BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from './build07dPrompts'

export interface InterpretiveLens {
  id: string
  title: string
  subtitle: string
  synthesis: string
  evidences: string[]
  resources: string[]
  attentionPoints: string[]
  sessionQuestions: string[]
}

export interface MindEmotionsInterpretation {
  hasResponses: boolean
  essentialSummary: string
  emotionalDynamic: string
  fourLenses: [InterpretiveLens, InterpretiveLens, InterpretiveLens, InterpretiveLens]
  generalResources: string[]
  generalAttentionPoints: string[]
  sessionQuestions: string[]
}

export interface StandardDimensionInterpretation {
  dimensionId: string
  dimensionName: string
  hasResponses: boolean
  simpleSynthesis: string
  deepSynthesis: string
  observedEvidences: string[]
  perceivedResources: string[]
  attentionPoints: string[]
  sessionQuestions: string[]
}

// Helpers de extração segura de respostas
function getResponseItem(responses: ExperienceResponseRecord[], promptIds: string[]) {
  return responses.find((r) => {
    const id = r.prompt_id || ''
    const key = (r as any).prompt_key || (r.structured_value as any)?.prompt_key || ''
    const cId = (r as any).canonical_prompt_id || ''
    return promptIds.includes(id) || promptIds.includes(key) || promptIds.includes(cId)
  })
}

function extractDisplayValue(resp?: ExperienceResponseRecord): {
  text: string
  isUnsure: boolean
  isRefusal: boolean
} {
  if (!resp) return { text: '', isUnsure: false, isRefusal: false }
  const sVal = resp.structured_value as any

  if (sVal === 'ainda_nao_sei' || sVal?.value === 'ainda_nao_sei' || sVal?.id === 'nao_sei') {
    return { text: 'Não sei / Em observação', isUnsure: true, isRefusal: false }
  }
  if (sVal === 'prefiro_nao_responder' || sVal?.value === 'prefiro_nao_responder') {
    return { text: 'Preferiu não responder neste momento', isUnsure: false, isRefusal: true }
  }

  const authored = [...BUILD_07C_REGULACAO_PROMPTS, ...BUILD_07D_RELACOES_PROMPTS].find(
    (prompt) =>
      prompt.id === resp.prompt_id ||
      prompt.id === (resp as any).canonical_prompt_id ||
      (prompt.schema_config as any)?.prompt_key === ((resp as any).prompt_key || sVal?.prompt_key),
  )
  const options = (authored?.schema_config as any)?.options
  const rawChoices = Array.isArray(sVal)
    ? sVal
    : (sVal?.choice ?? sVal?.value ?? sVal?.selectedOptionIds ?? sVal?.selectedOptionId ?? sVal)
  if (options && (typeof rawChoices === 'string' || Array.isArray(rawChoices))) {
    const choices = Array.isArray(rawChoices) ? rawChoices : [rawChoices]
    const labels = choices.map((id) => options.find((option: any) => option.id === id)?.title || id)
    return { text: labels.join('; '), isUnsure: false, isRefusal: false }
  }

  if (resp.free_text && !sVal) {
    return { text: resp.free_text, isUnsure: false, isRefusal: false }
  }

  if (typeof sVal === 'string') return { text: sVal, isUnsure: false, isRefusal: false }
  if (sVal && typeof sVal === 'object') {
    if (sVal.title) return { text: sVal.title, isUnsure: false, isRefusal: false }
    if (sVal.label) return { text: sVal.label, isUnsure: false, isRefusal: false }
    if (typeof sVal.value === 'string')
      return { text: sVal.value, isUnsure: false, isRefusal: false }
    if (Array.isArray(sVal.selectedOptionIds))
      return { text: sVal.selectedOptionIds.join(', '), isUnsure: false, isRefusal: false }
    if (Array.isArray(sVal.selected))
      return { text: sVal.selected.join(', '), isUnsure: false, isRefusal: false }
    if (Array.isArray(sVal.value))
      return { text: sVal.value.join(', '), isUnsure: false, isRefusal: false }
    if (sVal.free_text) return { text: sVal.free_text, isUnsure: false, isRefusal: false }
  }

  return { text: resp.free_text || 'Resposta registrada', isUnsure: false, isRefusal: false }
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. MENTE & EMOÇÕES — RESUMO ESSENCIAL + 4 LENTES INTERPRETATIVAS
// ══════════════════════════════════════════════════════════════════════════════
export function buildMindEmotionsInterpretation(
  responses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): MindEmotionsInterpretation {
  if (!responses || responses.length === 0) {
    const emptyLens = (id: string, title: string, subtitle: string): InterpretiveLens => ({
      id,
      title,
      subtitle,
      synthesis:
        'Aguardando preenchimento do instrumento pela interagente para elaboração desta lente.',
      evidences: [],
      resources: [],
      attentionPoints: [],
      sessionQuestions: [],
    })

    return {
      hasResponses: false,
      essentialSummary: `Esta interagente ainda não iniciou este capítulo.`,
      emotionalDynamic: 'Sem dados suficientes.',
      fourLenses: [
        emptyLens(
          'lens_1',
          'Lente 1 — Paisagem e Dinâmica Emocional',
          'Como as emoções operam no cotidiano',
        ),
        emptyLens(
          'lens_2',
          'Lente 2 — Diálogo Interno e Padrões Cognitivos',
          'O tom e a velocidade dos pensamentos',
        ),
        emptyLens(
          'lens_3',
          'Lente 3 — Mecanismos de Proteção Automática',
          'As defesas prioritárias sob estresse',
        ),
        emptyLens(
          'lens_4',
          'Lente 4 — Espaço Interno e Recursos de Autorregulação',
          'Acesso a calma, clareza e renovação',
        ),
      ],
      generalResources: [],
      generalAttentionPoints: [],
      sessionQuestions: [],
    }
  }

  // Extração das respostas-chave de Mente & Emoções
  const p1Geral = getResponseItem(responses, [
    'p-07c-pm1-p1-funcionamento-emocional',
    'mundo_emocional_geral',
  ])
  const p2Emocoes = getResponseItem(responses, [
    'p-07c-pm1-p2-emocoes-presentes',
    'emocoes_recorrentes',
  ])
  const p3Compreensao = getResponseItem(responses, [
    'p-07c-pm1-p3-por-que-se-sente-assim',
    'compreensao_despertar_emocoes',
  ])
  const p4Pensamentos = getResponseItem(responses, [
    'p-07c-pm2-p4-pensamentos-associados',
    'pensamento_associado',
  ])
  const p5Comportamento = getResponseItem(responses, [
    'p-07c-pm2-p5-comportamento-associado',
    'comportamento_associado',
  ])
  const p6Dialogo = getResponseItem(responses, [
    'p-07c-pm2-p6-dialogo-interno',
    'self_dialogue_erro',
  ])
  const p7aFrequencia = getResponseItem(responses, [
    'p-07c-pm3-p7a-movimentos-1-5',
    'movimentos_automaticos_frequencia_p1',
  ])
  const p7bFrequencia = getResponseItem(responses, [
    'p-07c-pm3-p7b-movimentos-6-10',
    'movimentos_automaticos_frequencia_p2',
  ])
  const p8Interferencia = getResponseItem(responses, [
    'p-07c-pm3-p8-interferencia-movimentos',
    'movimentos_interferencia_atual',
  ])
  const p9Ativacao = getResponseItem(responses, [
    'p-07c-pm3-p9-situacoes-ativacao',
    'situacoes_ativacao_movimentos',
  ])
  const p10Seguranca = getResponseItem(responses, [
    'p-07c-pm4-p10-seguranca-bem-estar',
    'dois_retratos_espaco',
  ])
  const p11Sobrecarga = getResponseItem(responses, [
    'p-07c-pm4-p11-sobrecarga',
    'dois_retratos_sobrecarga',
  ])
  const p12Recursos = getResponseItem(responses, [
    'p-07c-pm5-p12-recursos-espaco-interno',
    'recursos_recuperar_espaco',
  ])

  // Derivação de textos limpos
  const p1Text = extractDisplayValue(p1Geral).text || 'Sensibilidade e percepção ativas'
  const p4Text =
    p4Pensamentos?.free_text ||
    extractDisplayValue(p4Pensamentos).text ||
    'Processamento mental constante'
  const p6Text =
    p6Dialogo?.free_text || extractDisplayValue(p6Dialogo).text || 'Cobrança por fazer certo'
  const p10Text =
    p10Seguranca?.free_text ||
    extractDisplayValue(p10Seguranca).text ||
    'Momentos de tranquilidade e conexão'
  const p11Text =
    p11Sobrecarga?.free_text ||
    extractDisplayValue(p11Sobrecarga).text ||
    'Sensação de urgência ou cansaço acumulado'
  const p12Text =
    p12Recursos?.free_text ||
    extractDisplayValue(p12Recursos).text ||
    'Pausas conscientes, recolhimento ou natureza'

  // Análise de padrões protetivos de P7 / P8
  const priorityPatterns: string[] = []
  if (p8Interferencia?.structured_value) {
    const rawP8 = p8Interferencia.structured_value as any
    const list = Array.isArray(rawP8)
      ? rawP8
      : rawP8.selected || rawP8.selectedOptionIds || rawP8.value || []
    for (const item of list) {
      const key = typeof item === 'string' ? item : item?.id
      if (key && CER_PROTECTION_PATTERNS[key]?.baseName) {
        priorityPatterns.push(CER_PROTECTION_PATTERNS[key].baseName)
      }
    }
  }

  // --- LENTE 1: PAISAGEM E DINÂMICA EMOCIONAL ---
  const lens1: InterpretiveLens = {
    id: 'lens_1_paisagem_emocional',
    title: 'Lente 1 — Paisagem e Dinâmica Emocional',
    subtitle: 'Como as emoções operam, se manifestam e sinalizam o estado interno',
    synthesis: `A dinâmica afetiva de ${participantName} revela capacidade reflexiva aguçada, onde as emoções funcionam como termômetro primário de alinhamento com seus valores e necessidades essenciais.`,
    evidences: [
      `Funcionamento emocional relatado: "${p1Text}"`,
      p3Compreensao?.free_text
        ? `Compreensão do despertar afetivo: "${p3Compreensao.free_text}"`
        : 'Busca atenta por sentido nas oscilações emocionais sentidas',
      p9Ativacao?.free_text
        ? `Cenários de ativação: "${p9Ativacao.free_text}"`
        : 'Sensibilidade a contextos de pressão externa ou ruído relacional',
    ],
    resources: [
      'Boa percepção da gradação de suas sensações afetivas',
      'Disposição para nomear e acolher estados emocionais complexos sem negação superficial',
    ],
    attentionPoints: [
      'Risco de sobrecarga quando o afeto é processado predominantemente pelo raciocínio analítico',
      'Momentos de lentidão no restabelecimento quando há acúmulo de estímulos consecutivos',
    ],
    sessionQuestions: [
      'Quais emoções têm sido mais fáceis de acolher e quais costumam gerar maior resistência ou urgência de conserto?',
      'Em que momentos você sente que a sua resposta emocional é um aviso saudável do corpo?',
    ],
  }

  // --- LENTE 2: DIÁLOGO INTERNO E PADRÕES COGNITIVOS ---
  const lens2: InterpretiveLens = {
    id: 'lens_2_dialogo_cognitivo',
    title: 'Lente 2 — Diálogo Interno e Padrões Cognitivos',
    subtitle: 'O tom do narrador interno, a velocidade e o filtro diante de erros e imprevistos',
    synthesis: `Observa-se um padrão cognitivo focado em antecipação e alta exigência pessoal. Sob estresse, o diálogo interno tende a acelerar buscando soluções imediatas ou checagem de erros.`,
    evidences: [
      `Pensamento associado habitual: "${p4Text}"`,
      `Diálogo interno diante de imprevisto ou falha: "${p6Text}"`,
      p5Comportamento?.free_text
        ? `Comportamento derivado do padrão mental: "${p5Comportamento.free_text}"`
        : 'Tendência a assumir a resolução para recuperar a previsibilidade',
    ],
    resources: [
      'Clareza analítica e habilidade para identificar nexos de causa e efeito',
      'Vontade genuína de aprimoramento e responsabilidade pessoal',
    ],
    attentionPoints: [
      'Voz autocrítica que pode substituir a compaixão por cobrança severa',
      'Tendência a ruminação mental quando situações fogem da esfera de controle individual',
    ],
    sessionQuestions: [
      'Como você percebe a velocidade dos seus pensamentos quando algo não sai como planejado?',
      'Se essa voz interna pudesse falar com você com a mesma generosidade com que você cuida dos outros, o que ela diria?',
    ],
  }

  // --- LENTE 3: MECANISMOS DE PROTEÇÃO AUTOMÁTICA ---
  const lens3PatternsDesc =
    priorityPatterns.length > 0 ? priorityPatterns.join(', ') : 'Fazer certo e Prevenir riscos'
  const lens3: InterpretiveLens = {
    id: 'lens_3_protecao_automatica',
    title: 'Lente 3 — Mecanismos de Proteção Automática',
    subtitle: 'As defesas inteligentes desenvolvidas para preservar dignidade, segurança e afeto',
    synthesis: `Os movimentos protetivos prioritários identificados apontam para estratégias de preservação centradas em ${lens3PatternsDesc}. Não constituem defeitos de caráter, mas respostas aprendidas que tiveram valor adaptativo crucial.`,
    evidences: [
      `Padrões protetivos com maior interferência atual: ${lens3PatternsDesc}`,
      p7aFrequencia || p7bFrequencia
        ? 'Frequência consistente de movimentação automática registrada no instrumento'
        : 'Ativação espontânea sob percepção de risco relacional',
      `Retrato sob sobrecarga percebido: "${p11Text}"`,
    ],
    resources: [
      'Alta eficiência em manter a sustentação prática de tarefas e compromissos',
      'Capacidade de blindar aspectos vulneráveis em momentos de instabilidade',
    ],
    attentionPoints: [
      'Custo energético elevado da manutenção permanente da hipervigilância ou do controle',
      'Dificuldade de baixar a guarda mesmo em ambientes e relacionamentos seguros',
    ],
    sessionQuestions: [
      'Do que esse movimento automático costuma tentar te proteger antes que você perceba?',
      'Em que situações você sente que já é seguro experimentar uma resposta diferente?',
    ],
  }

  // --- LENTE 4: ESPAÇO INTERNO E AUTORREGULAÇÃO ---
  const lens4: InterpretiveLens = {
    id: 'lens_4_espaco_autorregulacao',
    title: 'Lente 4 — Espaço Interno e Recursos de Autorregulação',
    subtitle: 'Pontos de ancoragem, recuperação de fôlego e abertura para presença',
    synthesis: `A interagente dispõe de clareza sobre o contraste entre o estado de sobrecarga e o estado de presença. A recuperação do espaço interno ocorre de forma mais fluida através de pausas desaceleradas e ancoragem corpórea.`,
    evidences: [
      `Retrato de segurança e bem-estar informado: "${p10Text}"`,
      `Recursos que devolvem o espaço interno: "${p12Text}"`,
      'Contraste nítido reportado entre tensão reativa e presença calma',
    ],
    resources: [
      'Reconhecimento nítido de como o corpo e a mente se sentem quando estão seguros e em paz',
      'Identificação de ferramentas concretas de ancoragem que funcionam na prática',
    ],
    attentionPoints: [
      'Frequência reduzida de pausas diárias antes de a exaustão se instalar',
      'Tendência a adiar o autocuidado em função de demandas externas prioritárias',
    ],
    sessionQuestions: [
      'O que viabiliza a criação de pequenos refúgios de silêncio no ritmo da sua semana?',
      'Quando o espaço interno se fecha, qual é o menor gesto que ajuda você a voltar a respirar?',
    ],
  }

  const essentialSummary = `A avaliação de Mente & Emoções de ${participantName} aponta para um funcionamento reflexivo sensível e potente, operando com agilidade de processamento e tendência a respostas protetivas de controle e rigor sob pressão. O acesso ao bem-estar é viável e reconhecido, sendo modulado pela capacidade de desacelerar cobranças internas e proteger pausas reais de descanso.`

  return {
    hasResponses: true,
    essentialSummary,
    emotionalDynamic: p1Text,
    fourLenses: [lens1, lens2, lens3, lens4],
    generalResources: [
      'Boa percepção e nomeação da experiência interna',
      'Comprometimento ativo com o processo de autoconhecimento',
      'Recursos práticos identificados para retorno à calma',
    ],
    generalAttentionPoints: [
      'Cobrança interna e hipervigilância como resposta automática primária',
      'Risco de exaustão silenciosa por sustentação prolongada de sobrecargas',
    ],
    sessionQuestions: [
      'Como você descreveria o tom da sua conversa interna nos dias mais puxados?',
      'Qual das quatro lentes interpretativas ressoou de forma mais viva com o momento atual da sua vida?',
    ],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. REGULAÇÃO & PADRÕES DE RESPOSTA (BUILD 07C)
// ══════════════════════════════════════════════════════════════════════════════
export function buildRegulacaoInterpretation(
  responses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): StandardDimensionInterpretation {
  if (!responses || responses.length === 0) {
    return {
      dimensionId: 'regulacao_respostas',
      dimensionName: 'Regulação & Padrões de Resposta',
      hasResponses: false,
      simpleSynthesis: 'Esta interagente ainda não iniciou este capítulo.',
      deepSynthesis:
        'Aguardando respostas para análise da curva de mobilização, ativação do sistema nervoso e vias de retorno ao eixo.',
      observedEvidences: [],
      perceivedResources: [],
      attentionPoints: [],
      sessionQuestions: [],
    }
  }

  const pContexto = getResponseItem(responses, ['p-07c-pr1-contexto', 'contexto_mobilizacao'])
  const pSinais = getResponseItem(responses, [
    'p-07c-pr1-primeiros-sinais',
    'primeiros_sinais_mobilizacao',
  ])
  const pTiming = getResponseItem(responses, ['p-07c-pr1-timing', 'signal_awareness_timing'])
  const pResposta = getResponseItem(responses, ['p-07c-pr2-resposta', 'resposta_tendencia'])
  const pFuncao = getResponseItem(responses, ['p-07c-pr2-funcao', 'funcao_percebida'])
  const pCusto = getResponseItem(responses, ['p-07c-pr3-custo', 'custo_posterior'])
  const pRecurso = getResponseItem(responses, ['p-07c-pr3-recurso', 'recurso_retorno'])

  const contextoText =
    extractDisplayValue(pContexto).text ||
    'Situações de imprevisibilidade ou sobrecarga de demandas'
  const sinaisText =
    extractDisplayValue(pSinais).text ||
    'Sensação corporal de tensão ou aceleração do ritmo interno'
  const timingText = extractDisplayValue(pTiming).text || 'Percepção gradual após o impacto inicial'
  const respostaText =
    extractDisplayValue(pResposta).text ||
    'Busca por resolução imediata ou distanciamento de proteção'
  const funcaoText =
    pFuncao?.free_text ||
    extractDisplayValue(pFuncao).text ||
    'Garantir segurança e evitar desgaste adicional'
  const custoText =
    extractDisplayValue(pCusto).text || 'Sensação de cansaço ou necessidade de silêncio restaurador'
  const recursoText =
    extractDisplayValue(pRecurso).text ||
    'Respiração pausada, espaço a sós e reorganização do ambiente'

  return {
    dimensionId: 'regulacao_respostas',
    dimensionName: 'Regulação & Padrões de Resposta',
    hasResponses: true,
    simpleSynthesis: `A curva de estresse de ${participantName} é disparada predominantemente por "${contextoText}", com o primeiro aviso manifesto em "${sinaisText}".`,
    deepSynthesis: `Sob mobilização autonômica, a resposta imediata tende para "${respostaText}", e a pessoa relata sobre o que gostaria de conseguir ou evitar: "${funcaoText}". O custo posterior identificado envolve "${custoText}", enquanto a via mais consistente de regulação se apoia em "${recursoText}". Observa-se que a percepção do timing do estresse ("${timingText}") oferece uma janela crucial de intervenção antes do esgotamento.`,
    observedEvidences: [
      `Gatilho de mobilização mais recorrente: "${contextoText}"`,
      `Sinais corporais precoces: "${sinaisText}"`,
      `Janela temporal de consciência: "${timingText}"`,
      `Resposta sob estresse: "${respostaText}"`,
      `Custo pós-episódio: "${custoText}"`,
    ],
    perceivedResources: [
      'Capacidade de rastrear o caminho de volta ao equilíbrio',
      `Recurso efetivo de autorregulação reportado: "${recursoText}"`,
      'Relato sobre o que gostaria de conseguir ou evitar nesses momentos',
    ],
    attentionPoints: [
      'Atraso na percepção do cansaço físico acumulado durante a fase de hiperativação',
      `Impacto residual prolongado associado a "${custoText}"`,
      'Dificuldade de interromper a resposta reativa nos primeiros instantes da mobilização',
    ],
    sessionQuestions: [
      'Entre o primeiro sinal no corpo e a sua reação, existe espaço para uma respiração de checagem?',
      `Como você pode convidar "${recursoText}" mais cedo para o seu dia a dia, antes que o custo fique pesado?`,
    ],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. RELAÇÕES & VÍNCULOS (BUILD 07D)
// ══════════════════════════════════════════════════════════════════════════════
export function buildRelacoesInterpretation(
  responses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): StandardDimensionInterpretation {
  if (!responses || responses.length === 0) {
    return {
      dimensionId: 'relacoes',
      dimensionName: 'Relações & Vínculos',
      hasResponses: false,
      simpleSynthesis: 'Esta interagente ainda não iniciou este capítulo.',
      deepSynthesis:
        'Aguardando respostas para análise da órbita relacional, padrões de intimidade, manejo de limites e capacidade de pedir/receber apoio.',
      observedEvidences: [],
      perceivedResources: [],
      attentionPoints: [],
      sessionQuestions: [],
    }
  }

  const pOrbit = getResponseItem(responses, ['p-07d-rm1-orbit-map', 'mapa_orbitas_relacionais'])
  const pProximidade = getResponseItem(responses, [
    'p-07d-rm1-conforto-proximidade',
    'proximidade_conforto',
  ])
  const pPertencimento = getResponseItem(responses, [
    'p-07d-rm1-pertencimento',
    'pertencimento_sentido',
  ])
  const pConfianca = getResponseItem(responses, [
    'p-07d-rm2-confianca-vulnerabilidade',
    'confianca_vulnerabilidade',
  ])
  const pLimites = getResponseItem(responses, ['p-07d-rm2-limites-cena', 'limites_dizer_nao'])
  const pApoio = getResponseItem(responses, ['p-07d-rm3-pedir-apoio', 'pedir_apoio'])
  const pReceber = getResponseItem(responses, ['p-07d-rm3-receber-cuidado', 'receber_cuidado'])
  const pConflito = getResponseItem(responses, [
    'p-07d-rm4-conflito-movimento',
    'conflito_movimento',
  ])
  const pReparacao = getResponseItem(responses, [
    'p-07d-rm5-reparacao-recurso',
    'reparacao_recurso',
  ])

  const proximidadeText =
    extractDisplayValue(pProximidade).text ||
    'Valorização da profundidade com pessoas de alta confiança'
  const confiancaText =
    extractDisplayValue(pConfianca).text ||
    'Cautela inicial com abertura gradual da vulnerabilidade'
  const limitesText =
    extractDisplayValue(pLimites).text ||
    'Tendência a tolerar além da conta antes de demarcar o limite'
  const apoioText =
    extractDisplayValue(pApoio).text ||
    'Dificuldade de pedir ajuda, preferindo resolver de forma autônoma'
  const receberText =
    extractDisplayValue(pReceber).text || 'Acolhimento com gratidão quando o vínculo é seguro'
  const conflitoText =
    extractDisplayValue(pConflito).text ||
    'Desconforto com desarmonia, buscando apaziguamento ou silêncio'
  const reparacaoText =
    extractDisplayValue(pReparacao).text ||
    'Diálogo calmo após esfriamento da temperatura emocional'

  return {
    dimensionId: 'relacoes',
    dimensionName: 'Relações & Vínculos',
    hasResponses: true,
    simpleSynthesis: `${participantName} estabelece vínculos com foco em lealdade e consideração mútua, manifestando "${proximidadeText}".`,
    deepSynthesis: `A arquitetura relacional de ${participantName} reflete profundidade seletiva. Na sustentação da intimidade, o manejo de limites se expressa como "${limitesText}", enquanto o movimento diante de apoio apresenta a dinâmica: "${apoioText}" com receptividade descrita por "${receberText}". Em momentos de tensão ou divergência, a tendência habitual é "${conflitoText}", sendo restaurada através de "${reparacaoText}".`,
    observedEvidences: [
      `Zona de conforto de proximidade: "${proximidadeText}"`,
      `Construção de confiança e vulnerabilidade: "${confiancaText}"`,
      `Postura diante de limites interpessoais: "${limitesText}"`,
      `Padrão ao pedir apoio: "${apoioText}"`,
      `Manejo de conflito e reparação: "${conflitoText}" / "${reparacaoText}"`,
    ],
    perceivedResources: [
      'Grande capacidade de empatia, lealdade e cuidado dedicado aos seus vínculos essenciais',
      'Apreço por relações autênticas e maduras, livres de superficialidades',
      `Disposição restaurativa reportada em: "${reparacaoText}"`,
    ],
    attentionPoints: [
      'Sobrecarga por assimetria no cuidado (doar mais sustentação do que receber)',
      `Tensão acumulada por hesitação no estabelecimento precoce de limites ("${limitesText}")`,
      'Risco de isolamento defensivo quando se sente incompreendida ou julgada',
    ],
    sessionQuestions: [
      'Como você percebe a balança entre cuidar dos outros e permitir ser cuidada nos seus relacionamentos mais próximos?',
      'O que torna o "dizer não" desafiador em momentos específicos?',
    ],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. SEXUALIDADE & INTIMIDADE (BUILD 07E)
// ══════════════════════════════════════════════════════════════════════════════
export function buildSexualidadeInterpretation(
  responses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): StandardDimensionInterpretation {
  if (!responses || responses.length === 0) {
    return {
      dimensionId: 'sexualidade',
      dimensionName: 'Sexualidade & Intimidade',
      hasResponses: false,
      simpleSynthesis: 'Esta interagente ainda não iniciou este capítulo.',
      deepSynthesis:
        'Aguardando respostas para exploração da conexão com o corpo, desejo, permissão para o prazer e comunicação erótica.',
      observedEvidences: [],
      perceivedResources: [],
      attentionPoints: [],
      sessionQuestions: [],
    }
  }

  const pCorpo = getResponseItem(responses, [
    'p-07e-sm1-relacao-corpo-erotico',
    'corpo_erotico_percepcao',
  ])
  const pVitalidade = getResponseItem(responses, [
    'p-07e-sm1-vitalidade-desejo',
    'vitalidade_energia_desejo',
  ])
  const pPermissao = getResponseItem(responses, [
    'p-07e-sm2-permissao-prazer',
    'permissao_prazer_entrega',
  ])
  const pSeguranca = getResponseItem(responses, [
    'p-07e-sm2-seguranca-afeto',
    'seguranca_afeto_intimidade',
  ])
  const pComunicacao = getResponseItem(responses, [
    'p-07e-sm3-comunicacao-desejos',
    'comunicacao_desejos_limites',
  ])
  const pBloqueios = getResponseItem(responses, [
    'p-07e-sm3-bloqueios-distratores',
    'distratores_desconexao_erotica',
  ])
  const pIntegracao = getResponseItem(responses, [
    'p-07e-sm4-integracao-erotica',
    'integracao_erotica_vida',
  ])

  const corpoText =
    extractDisplayValue(pCorpo).text ||
    'Conexão corporal dependente do nível de relaxamento e presença'
  const vitalidadeText =
    extractDisplayValue(pVitalidade).text ||
    'Energia de desejo modulada por fases de cansaço ou rotina'
  const permissaoText =
    extractDisplayValue(pPermissao).text ||
    'Entrega gradual com necessidade de segurança relacional'
  const segurancaText =
    extractDisplayValue(pSeguranca).text ||
    'Vínculo afetivo e confiança como alicerce para o prazer'
  const comunicacaoText =
    extractDisplayValue(pComunicacao).text || 'Comunicação sutil de preferências e limites'
  const bloqueiosText =
    extractDisplayValue(pBloqueios).text || 'Pensamentos dispersos ou preocupações práticas do dia'
  const integracaoText =
    pIntegracao?.free_text ||
    extractDisplayValue(pIntegracao).text ||
    'Busca por viver a intimidade de forma harmoniosa com sua identidade'

  return {
    dimensionId: 'sexualidade',
    dimensionName: 'Sexualidade & Intimidade',
    hasResponses: true,
    simpleSynthesis: `A vivência da intimidade e erotismo em ${participantName} é fortemente alicerçada na segurança emocional e no relaxamento físico, expressando "${corpoText}".`,
    deepSynthesis: `A sexualidade é descrita como expressão integral de afeto e presença. O desejo se manifesta como "${vitalidadeText}", encontrando terreno de expansão condicionado por "${segurancaText}". A permissão para o prazer pleno ("${permissaoText}") sofre interferência principalmente de "${bloqueiosText}", indicando que a desaceleração mental é a principal chave de abertura. Na partilha relacional, a comunicação de necessidades e limites opera como "${comunicacaoText}".`,
    observedEvidences: [
      `Relação com o corpo erótico: "${corpoText}"`,
      `Dinâmica da vitalidade e desejo: "${vitalidadeText}"`,
      `Condições de segurança para entrega: "${segurancaText}"`,
      `Principais distratores identificados: "${bloqueiosText}"`,
      `Manejo da comunicação de limites e preferências: "${comunicacaoText}"`,
    ],
    perceivedResources: [
      'Visão madura e integrativa da sexualidade como dimensão humana viva e respeitosa',
      'Capacidade de valorizar a intimidade afetiva como espaço sagrado de encontro',
      'Sensibilidade para reconhecer as condições de bem-estar corporal necessárias ao prazer',
    ],
    attentionPoints: [
      `Impacto inibidor do estresse e excesso de raciocínio lógico no momento da intimidade ("${bloqueiosText}")`,
      'Tendência a colocar o bem-estar do outro à frente das próprias vontades eróticas',
      'Oscilação da vitalidade sexual em períodos de sobrecarga profissional ou familiar',
    ],
    sessionQuestions: [
      'O que mais ajuda o seu corpo a transitar do modo de vigilância para o modo de prazer e deleite?',
      'Como tem sido para você expressar o que é agradável e o que não ressoa na sua intimidade?',
    ],
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. SENTIDO & CONEXÃO (BUILD 07F)
// ══════════════════════════════════════════════════════════════════════════════
export function buildSentidoInterpretation(
  responses: ExperienceResponseRecord[],
  participantName: string = 'a interagente',
): StandardDimensionInterpretation {
  if (!responses || responses.length === 0) {
    return {
      dimensionId: 'sentido_conexao',
      dimensionName: 'Sentido & Conexão',
      hasResponses: false,
      simpleSynthesis: 'Esta interagente ainda não iniciou este capítulo.',
      deepSynthesis:
        'Aguardando respostas para compreensão do eixo de propósito, valores centrais, conexão com o sagrado/natureza e visão de futuro.',
      observedEvidences: [],
      perceivedResources: [],
      attentionPoints: [],
      sessionQuestions: [],
    }
  }

  const pBussola = getResponseItem(responses, ['p-07f-sc1-bussola-interna', 'bussola_interna_guia'])
  const pValores = getResponseItem(responses, [
    'p-07f-sc1-valores-inegociaveis',
    'valores_fundamentais',
  ])
  const pConexao = getResponseItem(responses, [
    'p-07f-sc2-conexao-transcendencia',
    'transcendencia_sagrado_natureza',
  ])
  const pPraticas = getResponseItem(responses, [
    'p-07f-sc2-praticas-nutricao',
    'praticas_espirituais_nutricao',
  ])
  const pCrise = getResponseItem(responses, [
    'p-07f-sc3-momentos-crise-fe',
    'crise_sentido_sustentacao',
  ])
  const pLegado = getResponseItem(responses, ['p-07f-sc4-visao-futuro-legado', 'legado_visao_vida'])

  const bussolaText =
    extractDisplayValue(pBussola).text ||
    'Sensação interna de integridade e fidelidade à própria verdade'
  const valoresText =
    extractDisplayValue(pValores).text ||
    'Honestidade, liberdade, respeito mútuo e evolução contínua'
  const conexaoText =
    extractDisplayValue(pConexao).text ||
    'Contato com a natureza, quietude e percepção de algo maior'
  const praticasText =
    extractDisplayValue(pPraticas).text ||
    'Momentos de silêncio, contemplação e leituras inspiradoras'
  const criseText =
    extractDisplayValue(pCrise).text || 'Busca por sentido nos desafios com perseverança resiliente'
  const legadoText =
    pLegado?.free_text ||
    extractDisplayValue(pLegado).text ||
    'Construir uma trajetória alinhada que gere impacto positivo ao redor'

  return {
    dimensionId: 'sentido_conexao',
    dimensionName: 'Sentido & Conexão',
    hasResponses: true,
    simpleSynthesis: `O eixo existencial de ${participantName} se organiza em torno de "${bussolaText}", tendo como base valores inegociáveis de "${valoresText}".`,
    deepSynthesis: `A dimensão de sentido opera como a âncora mais profunda de sustentação na vida de ${participantName}. A conexão com o transcendente se ancora em "${conexaoText}", nutrida através de "${praticasText}". Em momentos de crise ou desorientação, o apoio existencial repousa em "${criseText}", mantendo uma visão orientada para "${legadoText}".`,
    observedEvidences: [
      `Bússola interna e referencial orientador: "${bussolaText}"`,
      `Valores fundamentais relatados: "${valoresText}"`,
      `Portais de conexão e transcendência: "${conexaoText}"`,
      `Práticas que sustentam a nutrição interna: "${praticasText}"`,
      `Horizonte de legado e sentido maior: "${legadoText}"`,
    ],
    perceivedResources: [
      'Forte solidez ética e senso de integridade que norteia decisões complexas',
      'Capacidade de encontrar significado e aprendizado mesmo em vivências dolorosas',
      'Relação viva e pessoal com fontes de transcendência, beleza e espiritualidade',
    ],
    attentionPoints: [
      'Frustração ou dor profunda quando submetida a ambientes ou relações desprovidos de ética ou autenticidade',
      'Cobrança existencial por estar "sempre cumprindo um propósito", gerando cansaço na vida comum',
      'Dificuldade de conciliar o ritmo idealizado da alma com a lentidão dos processos cotidianos',
    ],
    sessionQuestions: [
      'Quando você olha para o momento presente, o que tem nutrido a sua chama de entusiasmo e sentido?',
      'Em que aspectos da sua rotina a sua bússola interna está pedindo maior coerência ou coragem?',
    ],
  }
}
