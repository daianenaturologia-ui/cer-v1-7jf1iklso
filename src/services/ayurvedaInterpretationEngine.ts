/**
 * Motor de Interpretação Profissional de Corpo & Fisiologia (Ayurveda CER).
 *
 * Princípios e Guardrails:
 * 1. Apresentado estritamente como HIPÓTESE PROFISSIONAL, nunca como diagnóstico.
 * 2. Exigência de CONVERGÊNCIA entre perguntas distintas (uma resposta isolada NÃO gera hipótese).
 * 3. Ama só pode ser sinalizado quando houver convergência de evidências em PELO MENOS DUAS categorias.
 * 4. Dúvida/ausência/recusa NÃO são tratadas como resposta negativa.
 * 5. Nenhuma hipótese gerada se não houver revisão concluída.
 * 6. Zero pontuação numérica ou percentual clínico de doshas.
 * 7. Zero IDs técnicos expostos na interface.
 */

import type { ExperienceResponseRecord } from '@/types/cer'
import {
  migrateLegacyChapter1Responses,
  getChapter1BasePromptId,
  AYV_C1_PROMPTS,
} from '@/services/ayurvedaChapter1'
import {
  migrateLegacyChapter2Responses,
  getChapter2BasePromptId,
  AYV_C2_PROMPTS,
} from '@/services/ayurvedaChapter2'

export interface DoshaEvidence {
  dosha: 'Vata' | 'Pitta' | 'Kapha'
  category: string
  sourceQuestionTitle: string
  literalText: string
  observation: string
}

export interface AgniReading {
  type: 'Sama Agni' | 'Vishama Agni' | 'Tikshna Agni' | 'Manda Agni' | 'Indefinido / Em observação'
  title: string
  description: string
  evidences: string[]
  confidence: 'Alta' | 'Moderada' | 'Em observação'
}

export interface AmaReading {
  presence: 'Sinalizada' | 'Possível / Limítrofe' | 'Não evidenciada'
  categoriesInvolved: string[]
  evidences: string[]
  rationale: string
}

export interface AyurvedaInterpretationResult {
  hasCompletedRevision: boolean
  activeRevisionNumber?: number
  prakritiHypothesis: {
    summary: string
    primaryTendency?: string
    secondaryTendency?: string
    confidence: 'Alta' | 'Moderada' | 'Em observação'
    evidencesVata: DoshaEvidence[]
    evidencesPitta: DoshaEvidence[]
    evidencesKapha: DoshaEvidence[]
  }
  vikritiHypothesis: {
    summary: string
    primaryImbalance?: string
    confidence: 'Alta' | 'Moderada' | 'Em observação'
    evidencesVata: DoshaEvidence[]
    evidencesPitta: DoshaEvidence[]
    evidencesKapha: DoshaEvidence[]
  }
  agniReading: AgniReading
  amaReading: AmaReading
  generalConfidence: 'Alta' | 'Moderada' | 'Em observação'
  perceivedResources: string[]
  attentionPoints: string[]
  sessionQuestions: string[]
  disclaimer: string
}

export const AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER =
  'Esta leitura constitui uma hipótese interpretativa de trabalho baseada no Método CER, elaborada para apoiar o raciocínio profissional e o planejamento do cuidado. Não representa diagnóstico nosológico, médico ou prescritivo definitivo. Todas as hipóteses devem ser validadas e aprofundadas em sessão com a interagente.'

function extractValueAndKey(resp: ExperienceResponseRecord): { value: any; key: string } {
  const structured = resp.structured_value as any
  let value: any = structured
  let key =
    (resp as any).prompt_key ||
    structured?.prompt_key ||
    resp.prompt_id ||
    (resp as any).canonical_prompt_id ||
    ''

  if (structured && typeof structured === 'object') {
    if (structured.value !== undefined) value = structured.value
    else if (structured.selectedOptionId !== undefined) value = structured.selectedOptionId
    else if (structured.choice !== undefined) value = structured.choice
  }
  return { value, key }
}

export function buildAyurvedaInterpretation(
  allResponses: ExperienceResponseRecord[],
): AyurvedaInterpretationResult {
  const emptyResult: AyurvedaInterpretationResult = {
    hasCompletedRevision: false,
    prakritiHypothesis: {
      summary:
        'Aguardando preenchimento e conclusão de revisão canônica para construção de hipótese.',
      confidence: 'Em observação',
      evidencesVata: [],
      evidencesPitta: [],
      evidencesKapha: [],
    },
    vikritiHypothesis: {
      summary:
        'Aguardando preenchimento e conclusão de revisão canônica para leitura de desvios atuais.',
      confidence: 'Em observação',
      evidencesVata: [],
      evidencesPitta: [],
      evidencesKapha: [],
    },
    agniReading: {
      type: 'Indefinido / Em observação',
      title: 'Agni em observação',
      description: 'Sem dados canônicos suficientes para caracterização do fogo digestivo.',
      evidences: [],
      confidence: 'Em observação',
    },
    amaReading: {
      presence: 'Não evidenciada',
      categoriesInvolved: [],
      evidences: [],
      rationale: 'Nenhum acúmulo ou sobrecarga metabólica identificada nos registros.',
    },
    generalConfidence: 'Em observação',
    perceivedResources: [],
    attentionPoints: [],
    sessionQuestions: [],
    disclaimer: AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER,
  }

  if (!allResponses || allResponses.length === 0) {
    return emptyResult
  }

  const migratedC1 = migrateLegacyChapter1Responses(allResponses).migratedResponses
  const migratedC2 = migrateLegacyChapter2Responses(allResponses).migratedResponses

  // Verifica se há pelo menos um capítulo concluído canonicamente
  const c1Completion = migratedC1.find((r) => {
    const bId = getChapter1BasePromptId((r as any).prompt_id || '')
    const bKey = getChapter1BasePromptId((r as any).prompt_key || '')
    return (
      bId === AYV_C1_PROMPTS.CHAPTER_COMPLETION.id || bKey === AYV_C1_PROMPTS.CHAPTER_COMPLETION.key
    )
  })
  const c1Completed = Boolean(
    c1Completion &&
    ((c1Completion.structured_value as any)?.completed === true ||
      (c1Completion.structured_value as any)?.value?.completed === true ||
      (c1Completion.structured_value as any)?.status === 'completed'),
  )

  const c2Completion = migratedC2.find((r) => {
    const bId = getChapter2BasePromptId((r as any).prompt_id || '')
    const bKey = getChapter2BasePromptId((r as any).prompt_key || '')
    return (
      bId === AYV_C2_PROMPTS.CHAPTER_COMPLETION.id || bKey === AYV_C2_PROMPTS.CHAPTER_COMPLETION.key
    )
  })
  const c2Completed = Boolean(
    c2Completion &&
    ((c2Completion.structured_value as any)?.completed === true ||
      (c2Completion.structured_value as any)?.value?.completed === true ||
      (c2Completion.structured_value as any)?.status === 'completed'),
  )

  // Guardrail: Nenhuma interpretação quando não há revisão concluída
  if (!c1Completed && !c2Completed) {
    return emptyResult
  }

  // Mapeamento das respostas literais ativas
  const answersMap = new Map<string, { value: any; freeText?: string }>()
  for (const r of [...migratedC1, ...migratedC2]) {
    const { value, key } = extractValueAndKey(r)
    const baseKey = getChapter1BasePromptId(getChapter2BasePromptId(key))
    if (value !== undefined && value !== null) {
      answersMap.set(baseKey, { value, freeText: r.free_text })
    }
  }

  // Coletores de evidências para Prakriti (natureza habitual / estrutural)
  const prakritiVata: DoshaEvidence[] = []
  const prakritiPitta: DoshaEvidence[] = []
  const prakritiKapha: DoshaEvidence[] = []

  // Coletores de evidências para Vikriti (desequilíbrio / ritmos irregulares)
  const vikritiVata: DoshaEvidence[] = []
  const vikritiPitta: DoshaEvidence[] = []
  const vikritiKapha: DoshaEvidence[] = []

  // 1. Estrutura corporal habitual (Cap 1)
  const p1Structure =
    answersMap.get(AYV_C1_PROMPTS.P1_STRUCTURE.id) ||
    answersMap.get(AYV_C1_PROMPTS.P1_STRUCTURE.key)
  if (p1Structure) {
    const val = String(p1Structure.value)
    if (val === 'slender' || val === 'light_narrow' || val === 'leve_longilinea') {
      prakritiVata.push({
        dosha: 'Vata',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura mais leve, longilínea ou óssea aparente',
        observation: 'Conformação habitual com predomínio de leveza e menor densidade de tecidos.',
      })
    } else if (val === 'medium' || val === 'intermediate' || val === 'moderada_proporcional') {
      prakritiPitta.push({
        dosha: 'Pitta',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura média, proporcional ou musculatura definida',
        observation: 'Conformação habitual equilibrada com moderado desenvolvimento muscular.',
      })
    } else if (val === 'broad' || val === 'broad_solid' || val === 'larga_robusta') {
      prakritiKapha.push({
        dosha: 'Kapha',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura mais larga, densa ou com tendência a reter volume',
        observation: 'Conformação habitual com solidez de base, estabilidade e densidade tecidual.',
      })
    }
  }

  // 2. Pele habitual (Cap 1)
  const p2Skin =
    answersMap.get(AYV_C1_PROMPTS.P2_SKIN.id) || answersMap.get(AYV_C1_PROMPTS.P2_SKIN.key)
  if (p2Skin) {
    const val = String(p2Skin.value)
    if (val === 'dry' || val === 'dry_rough' || val === 'thin_reactive' || val === 'seca_fina') {
      prakritiVata.push({
        dosha: 'Vata',
        category: 'Pele habitual',
        sourceQuestionTitle: 'Pele habitual',
        literalText: 'Tendência ao ressecamento, aspereza ou espessura fina',
        observation: 'Qualidade tátil seca e fria característica de Vata.',
      })
    } else if (val === 'warm' || val === 'warm_sensitive' || val === 'oleosa_sensivel_quente') {
      prakritiPitta.push({
        dosha: 'Pitta',
        category: 'Pele habitual',
        sourceQuestionTitle: 'Pele habitual',
        literalText: 'Tendência a calor, rubor, oleosidade na zona central ou sensibilidade',
        observation: 'Predomínio de vascularização, calor e tendência inflamatória cutânea.',
      })
    } else if (val === 'smooth' || val === 'soft_oily' || val === 'macia_espessa_hidratada') {
      prakritiKapha.push({
        dosha: 'Kapha',
        category: 'Pele habitual',
        sourceQuestionTitle: 'Pele habitual',
        literalText: 'Pele macia, espessa, bem hidratada e fria ao toque',
        observation: 'Lubrificação natural abundante e integridade de barreira.',
      })
    }
  }

  // 3. Cabelo habitual (Cap 1)
  const p3Hair =
    answersMap.get(AYV_C1_PROMPTS.P3_HAIR.id) || answersMap.get(AYV_C1_PROMPTS.P3_HAIR.key)
  if (p3Hair) {
    const val = String(p3Hair.value)
    if (
      val === 'dry_brittle' ||
      val === 'dry_tangled' ||
      val === 'fine_delicate' ||
      val === 'fino_seco'
    ) {
      prakritiVata.push({
        dosha: 'Vata',
        category: 'Cabelo habitual',
        sourceQuestionTitle: 'Cabelo habitual',
        literalText: 'Fios finos, secos ou com tendência ao arrepiado/quebra',
        observation: 'Nutrição periférica variável ou menor oleosidade do couro cabeludo.',
      })
    } else if (val === 'fine_oily' || val === 'oily_roots' || val === 'oleoso_fino_precoce') {
      prakritiPitta.push({
        dosha: 'Pitta',
        category: 'Cabelo habitual',
        sourceQuestionTitle: 'Cabelo habitual',
        literalText:
          'Fios médios a finos, oleosidade rápida ou tendência a clareamento/queda precoce',
        observation: 'Calor metabólico afetando os folículos pilosos.',
      })
    } else if (val === 'thick_wavy' || val === 'thick_dense' || val === 'espesso_abundante') {
      prakritiKapha.push({
        dosha: 'Kapha',
        category: 'Cabelo habitual',
        sourceQuestionTitle: 'Cabelo habitual',
        literalText: 'Fios espessos, abundantes, brilhantes e resistentes',
        observation: 'Força tecidual de sustentação e oleosidade equilibrada de proteção.',
      })
    }
  }

  // 4. Temperatura e sensibilidade ao clima (Cap 1)
  const p4Temp =
    answersMap.get(AYV_C1_PROMPTS.P4_TEMPERATURE.id) ||
    answersMap.get(AYV_C1_PROMPTS.P4_TEMPERATURE.key)
  if (p4Temp) {
    const val = String(p4Temp.value)
    if (val === 'chilly' || val === 'cold_easily' || val === 'sente_frio_facilidade') {
      prakritiVata.push({
        dosha: 'Vata',
        category: 'Regulação térmica',
        sourceQuestionTitle: 'Temperatura corporal habitual',
        literalText: 'Sente frio com facilidade, extremidades frias',
        observation: 'Sensibilidade marcante a temperaturas baixas e vento.',
      })
    } else if (val === 'warm' || val === 'heat_easily' || val === 'sente_calor_intolerancia') {
      prakritiPitta.push({
        dosha: 'Pitta',
        category: 'Regulação térmica',
        sourceQuestionTitle: 'Temperatura corporal habitual',
        literalText: 'Sente calor com facilidade, desconforto em ambientes quentes',
        observation: 'Termogênese basal elevada e desconforto ao calor direto.',
      })
    } else if (val === 'adaptable' || val === 'stable' || val === 'tolera_bem_prefere_calor_seco') {
      prakritiKapha.push({
        dosha: 'Kapha',
        category: 'Regulação térmica',
        sourceQuestionTitle: 'Temperatura corporal habitual',
        literalText: 'Tolera temperaturas com estabilidade, mas desfavorece clima frio e úmido',
        observation: 'Estabilidade térmica com aversão a umidade acumulada.',
      })
    }
  }

  // 5. Fome e Digestão habitual (Cap 2)
  const p1Hunger =
    answersMap.get(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id) ||
    answersMap.get(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key)
  const hungerVal = p1Hunger ? String(p1Hunger.value) : ''
  if (
    hungerVal === 'irregular' ||
    hungerVal === 'variable_intensity' ||
    hungerVal === 'changes_routine_emotion' ||
    hungerVal === 'variavel_imprevisivel'
  ) {
    vikritiVata.push({
      dosha: 'Vata',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome variável, imprevisível ou oscilante ao longo do dia',
      observation: 'Ritmo irregular sugerindo instabilidade de Vata sobre o sistema digestivo.',
    })
  } else if (
    hungerVal === 'intense' ||
    hungerVal === 'sudden_intense' ||
    hungerVal === 'intensa_urgente'
  ) {
    vikritiPitta.push({
      dosha: 'Pitta',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome forte, pontual e que provoca irritação se atrasada',
      observation: 'Agudeza e intensidade no apetite com rápida necessidade de combustível.',
    })
  } else if (
    hungerVal === 'low_stable' ||
    hungerVal === 'light_slow' ||
    hungerVal === 'long_without_hunger' ||
    hungerVal === 'lenta_tardia'
  ) {
    vikritiKapha.push({
      dosha: 'Kapha',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome tardia, pouca necessidade pela manhã, apetite modesto',
      observation: 'Metabolismo basal lento e digestão pesada.',
    })
  }

  // 6. Eliminação intestinal (Cap 2)
  const p6Bowel =
    answersMap.get(AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id) ||
    answersMap.get(AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key)
  const bowelVal = p6Bowel ? String(p6Bowel.value) : ''
  const p7Stool =
    answersMap.get(AYV_C2_PROMPTS.P7_STOOL_PATTERN.id) ||
    answersMap.get(AYV_C2_PROMPTS.P7_STOOL_PATTERN.key)
  const stoolVal = p7Stool ? String(p7Stool.value) : ''

  if (
    bowelVal === 'constipated' ||
    bowelVal === 'skips_days' ||
    bowelVal === 'alternates_constip_loose' ||
    bowelVal === 'irregular' ||
    stoolVal === 'hard_dry' ||
    stoolVal === 'dry_hard_difficult'
  ) {
    vikritiVata.push({
      dosha: 'Vata',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação irregular, espaçada ou fezes secas/ressecadas',
      observation: 'Sinais de secura e motilidade lenta por dispersão de Apana Vayu.',
    })
  }
  if (
    bowelVal === 'loose' ||
    bowelVal === 'multiple_daily' ||
    bowelVal === 'frequent' ||
    stoolVal === 'soft_poorly_formed' ||
    stoolVal === 'very_loose_watery' ||
    stoolVal === 'soft_loose' ||
    stoolVal === 'ardor'
  ) {
    vikritiPitta.push({
      dosha: 'Pitta',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação múltiplas vezes ao dia, fezes amolecidas ou sensação de calor/ardor',
      observation: 'Calor e fluidez aumentada acelerando o trânsito entérico.',
    })
  }
  if (bowelVal === 'sluggish' || stoolVal === 'sticky_incomplete' || stoolVal === 'heavy_sticky') {
    vikritiKapha.push({
      dosha: 'Kapha',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação lenta, sensação de evacuação incompleta ou fezes pesadas',
      observation: 'Lentidão motora, viscosidade e peso nas vias de eliminação.',
    })
  }

  // 7. Sono e Disposição (Cap 2)
  const p8Sleep =
    answersMap.get(AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id) ||
    answersMap.get(AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key)
  const sleepVal = p8Sleep ? String(p8Sleep.value) : ''
  const p9Wake =
    answersMap.get(AYV_C2_PROMPTS.P9_WAKING.id) || answersMap.get(AYV_C2_PROMPTS.P9_WAKING.key)
  const wakeVal = p9Wake ? String(p9Wake.value) : ''

  if (
    sleepVal === 'light_interrupted' ||
    sleepVal === 'light_wakes_easy' ||
    sleepVal === 'difficulty_falling_asleep' ||
    sleepVal === 'wakes_night' ||
    sleepVal === 'insonia_inicial' ||
    wakeVal === 'tired_insufficient' ||
    wakeVal === 'fatigued_unrefreshed'
  ) {
    vikritiVata.push({
      dosha: 'Vata',
      category: 'Sono e ritmo vigília',
      sourceQuestionTitle: 'Padrão do sono e despertar',
      literalText: 'Sono leve, despertares frequentes ou sensação de agitação noturna',
      observation: 'Instabilidade do sistema nervoso impactando a sustentação do repouso.',
    })
  }
  if (
    sleepVal === 'moderate_hot' ||
    sleepVal === 'quick_wake_little_sleep' ||
    sleepVal === 'acorda_calor_pesadelos'
  ) {
    vikritiPitta.push({
      dosha: 'Pitta',
      category: 'Sono e ritmo vigília',
      sourceQuestionTitle: 'Padrão do sono e despertar',
      literalText: 'Despertar com prontidão extrema ou sonhos intensos',
      observation: 'Horário metabólico de Pitta ativando despertares vívidos.',
    })
  }
  if (
    sleepVal === 'deep_excessive' ||
    sleepVal === 'long_sleep_hard_to_wake' ||
    wakeVal === 'heavy_body_slow_start' ||
    wakeVal === 'heavy_groggy'
  ) {
    vikritiKapha.push({
      dosha: 'Kapha',
      category: 'Sono e ritmo vigília',
      sourceQuestionTitle: 'Padrão do sono e despertar',
      literalText:
        'Sono pesado, dificuldade importante para levantar ou lentidão matinal prolongada',
      observation: 'Inércia matinal e excesso do princípio de peso/estabilidade.',
    })
  }

  // --- REGRA DE CONVERGÊNCIA: exigência de CONVERGÊNCIA entre perguntas distintas ---
  // Uma evidência isolada NÃO gera hipótese. Contamos categorias distintas com evidências.
  const countDistinctCategories = (evidences: DoshaEvidence[]) => {
    return new Set(evidences.map((e) => e.category)).size
  }

  const vataPrakritiCategories = countDistinctCategories(prakritiVata)
  const pittaPrakritiCategories = countDistinctCategories(prakritiPitta)
  const kaphaPrakritiCategories = countDistinctCategories(prakritiKapha)

  // Prakriti primária e secundária exigem ≥ 2 categorias para formar hipótese firme
  let primaryPrakriti: string | undefined = undefined
  let secondaryPrakriti: string | undefined = undefined
  let prakritiConfidence: 'Alta' | 'Moderada' | 'Em observação' = 'Em observação'

  const prakritiScores = [
    { dosha: 'Vata', count: vataPrakritiCategories },
    { dosha: 'Pitta', count: pittaPrakritiCategories },
    { dosha: 'Kapha', count: kaphaPrakritiCategories },
  ].sort((a, b) => b.count - a.count)

  if (prakritiScores[0].count >= 2) {
    primaryPrakriti = prakritiScores[0].dosha
    if (prakritiScores[1].count >= 2) {
      secondaryPrakriti = prakritiScores[1].dosha
      prakritiConfidence = 'Alta'
    } else {
      prakritiConfidence = 'Moderada'
    }
  } else {
    prakritiConfidence = 'Em observação'
  }

  let prakritiSummary = ''
  if (!primaryPrakriti) {
    prakritiSummary =
      'Os dados estruturais atuais não apresentaram convergência em pelo menos 2 categorias distintas para sustentar uma hipótese de constituição de base. Manter leitura em observação qualitativa.'
  } else if (secondaryPrakriti) {
    prakritiSummary = `Hipótese bidosha com predominância de ${primaryPrakriti} e presença convergente de ${secondaryPrakriti}, sustentada por evidências cruzadas de estrutura, tecido e regulação habitual.`
  } else {
    prakritiSummary = `Hipótese de tendência primária ${primaryPrakriti}, sustentada por convergência estrutural observada em mais de uma esfera corporal.`
  }

  // Vikriti
  const vataVikritiCategories = countDistinctCategories(vikritiVata)
  const pittaVikritiCategories = countDistinctCategories(vikritiPitta)
  const kaphaVikritiCategories = countDistinctCategories(vikritiKapha)

  const vikritiScores = [
    { dosha: 'Vata', count: vataVikritiCategories },
    { dosha: 'Pitta', count: pittaVikritiCategories },
    { dosha: 'Kapha', count: kaphaVikritiCategories },
  ].sort((a, b) => b.count - a.count)

  let primaryVikriti: string | undefined = undefined
  let vikritiConfidence: 'Alta' | 'Moderada' | 'Em observação' = 'Em observação'

  if (vikritiScores[0].count >= 2) {
    primaryVikriti = vikritiScores[0].dosha
    vikritiConfidence = vikritiScores[0].count >= 3 ? 'Alta' : 'Moderada'
  } else {
    vikritiConfidence = 'Em observação'
  }

  let vikritiSummary = ''
  if (!primaryVikriti) {
    vikritiSummary =
      'Não há convergência suficiente entre as perguntas de ritmo biológico para apontar desequilíbrio ativo significativo. Ritmos em estado relativamente equilibrado ou respostas dispersas.'
  } else {
    vikritiSummary = `Evidências convergentes indicam oscilação funcional ativa no eixo de ${primaryVikriti}, refletida em sintomas congruentes de ritmo fisiológico.`
  }

  // 8. Leitura de Agni (Fogo Digestivo)
  const p3PostMeal =
    answersMap.get(AYV_C2_PROMPTS.P3_POST_MEAL.id) ||
    answersMap.get(AYV_C2_PROMPTS.P3_POST_MEAL.key)
  const postMealVal = p3PostMeal ? String(p3PostMeal.value) : ''
  const p5HeavyFood =
    answersMap.get(AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id) ||
    answersMap.get(AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key)
  const heavyFoodVal = p5HeavyFood ? String(p5HeavyFood.value) : ''

  const agniEvidences: string[] = []
  let agniType: AgniReading['type'] = 'Indefinido / Em observação'
  let agniDesc = ''
  let agniConf: AgniReading['confidence'] = 'Em observação'

  if (
    hungerVal === 'irregular' ||
    hungerVal === 'variable_intensity' ||
    postMealVal === 'bloating_gas' ||
    postMealVal === 'distended_gassy' ||
    postMealVal === 'distensao_gases'
  ) {
    agniType = 'Vishama Agni'
    agniDesc =
      'Agni irregular e oscilante (típico de influência de Vata): ora a digestão é rápida, ora causa gases, distensão e instabilidade.'
    if (hungerVal === 'irregular' || hungerVal === 'variable_intensity') {
      agniEvidences.push('Padrão de fome irregular ou imprevisível')
    }
    if (
      postMealVal === 'bloating_gas' ||
      postMealVal === 'distended_gassy' ||
      postMealVal === 'distensao_gases'
    ) {
      agniEvidences.push('Distensão e gases pós-prandiais')
    }
    agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
  } else if (
    hungerVal === 'intense' ||
    hungerVal === 'sudden_intense' ||
    postMealVal === 'heat_burning_acidity' ||
    postMealVal === 'burning_heartburn' ||
    postMealVal === 'queimacao_refluxo'
  ) {
    agniType = 'Tikshna Agni'
    agniDesc =
      'Agni hiperativo e rápido (típico de influência de Pitta): digestão acelerada com tendência a acidez, azia ou irritação quando há jejum prolongado.'
    if (hungerVal === 'intense' || hungerVal === 'sudden_intense') {
      agniEvidences.push('Fome intensa e necessidade urgente de alimentação')
    }
    if (
      postMealVal === 'heat_burning_acidity' ||
      postMealVal === 'burning_heartburn' ||
      postMealVal === 'queimacao_refluxo'
    ) {
      agniEvidences.push('Sensação de queimação ou refluxo após refeições')
    }
    agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
  } else if (
    hungerVal === 'low_stable' ||
    hungerVal === 'light_slow' ||
    postMealVal === 'heavy_slow_digestion' ||
    postMealVal === 'sleepy_energy_drop' ||
    postMealVal === 'heavy_drowsy' ||
    postMealVal === 'peso_sono'
  ) {
    agniType = 'Manda Agni'
    agniDesc =
      'Agni hipoativo e lento (típico de influência de Kapha): digestão pesada, sonolência acentuada após comer e apetite de início tardio.'
    if (hungerVal === 'low_stable' || hungerVal === 'light_slow') {
      agniEvidences.push('Apetite reduzido ou tardio')
    }
    if (
      postMealVal === 'heavy_slow_digestion' ||
      postMealVal === 'sleepy_energy_drop' ||
      postMealVal === 'heavy_drowsy' ||
      postMealVal === 'peso_sono'
    ) {
      agniEvidences.push('Sensação acentuada de peso e sonolência pós-prandial')
    }
    agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
  } else if (hungerVal && postMealVal) {
    agniType = 'Sama Agni'
    agniDesc =
      'Agni equilibrado: fome regular nos horários habituais e digestão sem desconforto, queimação ou sonolência excessiva.'
    agniEvidences.push('Fome previsível e sensação pós-refeição estável')
    agniConf = 'Moderada'
  }

  // 9. Leitura de Ama (Toxinas / Sobrecarga metabólica)
  // REGRA CRÍTICA: Ama só deve ser sinalizado com evidências em PELO MENOS DUAS categorias.
  const amaCategoryMap = new Map<string, string>()

  if (
    postMealVal === 'heavy_slow_digestion' ||
    postMealVal === 'sleepy_energy_drop' ||
    postMealVal === 'heavy_drowsy' ||
    postMealVal === 'bloating_gas' ||
    heavyFoodVal === 'fatty_heavy' ||
    heavyFoodVal === 'very_heavy'
  ) {
    amaCategoryMap.set(
      'Digestão e sensação pós-refeição',
      'Digestão pesada, gases excessivos ou inércia pós-prandial',
    )
  }
  if (stoolVal === 'sticky_incomplete' || stoolVal === 'heavy_sticky' || stoolVal === 'foul_odor') {
    amaCategoryMap.set(
      'Eliminação intestinal',
      'Fezes com muco, aderentes ao vaso ou com sensação de evacuação incompleta',
    )
  }
  if (
    wakeVal === 'heavy_body_slow_start' ||
    wakeVal === 'tired_insufficient' ||
    wakeVal === 'heavy_groggy' ||
    wakeVal === 'fatigued_unrefreshed'
  ) {
    amaCategoryMap.set(
      'Disposição matinal e energia',
      'Sensação de corpo pesado ao acordar, indisposição que não melhora com sono',
    )
  }

  const amaCategoriesList = Array.from(amaCategoryMap.keys())
  const amaEvidencesList = Array.from(amaCategoryMap.values())

  let amaPresence: AmaReading['presence'] = 'Não evidenciada'
  let amaRationale = ''

  if (amaCategoriesList.length >= 2) {
    amaPresence = 'Sinalizada'
    amaRationale = `Sinais convergentes de sobrecarga e acúmulo identificados em ${amaCategoriesList.length} categorias distintas: ${amaCategoriesList.join(' e ')}.`
  } else if (amaCategoriesList.length === 1) {
    amaPresence = 'Possível / Limítrofe'
    amaRationale = `Evidência isolada em "${amaCategoriesList[0]}". Pelo critério de convergência do Método CER, um achado isolado não sustenta sinalização de Ama, permanecendo sob observação clínica.`
  } else {
    amaPresence = 'Não evidenciada'
    amaRationale =
      'Nenhum sinal clínico de acúmulo ou sobrecarga metabólica evidente nos relatos registrados.'
  }

  // 10. Recursos percebidos e Pontos de atenção
  const perceivedResources: string[] = []
  const attentionPoints: string[] = []
  const sessionQuestions: string[] = []

  if (c1Completed) {
    perceivedResources.push(
      'Percepção corporal habitual clara e registrada com clareza nos aspectos estruturais',
    )
  }
  if (c2Completed) {
    perceivedResources.push(
      'Capacidade de auto-observação dos ritmos de digestão, eliminação e sono',
    )
  }
  if (primaryPrakriti) {
    perceivedResources.push(
      `Identificação de traços funcionais de base compatíveis com ${primaryPrakriti}`,
    )
  }

  if (primaryVikriti) {
    attentionPoints.push(
      `Oscilação em ritmo de ${primaryVikriti} com convergência em múltiplos momentos`,
    )
  }
  if (amaPresence === 'Sinalizada') {
    attentionPoints.push(
      `Indícios de sobrecarga digestiva (Ama) presentes em mais de um sistema biológico`,
    )
  }
  if (agniType === 'Vishama Agni' || agniType === 'Manda Agni') {
    attentionPoints.push(
      `Irregularidade ou lentidão no poder de digestão e assimilação (${agniType})`,
    )
  }

  if (attentionPoints.length === 0) {
    attentionPoints.push('Manter acompanhamento dos ritmos sazonais e variações diárias')
  }

  // 11. Perguntas para aprofundamento na sessão
  if (agniType === 'Vishama Agni') {
    sessionQuestions.push(
      'Como a rotina de trabalho ou horários oscilantes interferem na sua fome no dia a dia?',
    )
  }
  if (amaPresence === 'Sinalizada') {
    sessionQuestions.push(
      'Você percebeu sensação de peso, saburra lingual ou falta de disposição em horários específicos da manhã?',
    )
  }
  if (primaryVikriti) {
    sessionQuestions.push(
      `Quando você sente maior estabilidade em relação aos ritmos de ${primaryVikriti}? O que costuma ajudar?`,
    )
  }
  sessionQuestions.push(
    'De tudo o que você respondeu sobre o ritmo do seu corpo, o que mais chama a sua atenção atualmente?',
  )

  const generalConfidence: 'Alta' | 'Moderada' | 'Em observação' =
    prakritiConfidence === 'Alta' &&
    (vikritiConfidence === 'Alta' || vikritiConfidence === 'Moderada')
      ? 'Alta'
      : prakritiConfidence !== 'Em observação' || vikritiConfidence !== 'Em observação'
        ? 'Moderada'
        : 'Em observação'

  return {
    hasCompletedRevision: true,
    activeRevisionNumber: c1Completed ? 1 : 2,
    prakritiHypothesis: {
      summary: prakritiSummary,
      primaryTendency: primaryPrakriti,
      secondaryTendency: secondaryPrakriti,
      confidence: prakritiConfidence,
      evidencesVata: prakritiVata,
      evidencesPitta: prakritiPitta,
      evidencesKapha: prakritiKapha,
    },
    vikritiHypothesis: {
      summary: vikritiSummary,
      primaryImbalance: primaryVikriti,
      confidence: vikritiConfidence,
      evidencesVata: vikritiVata,
      evidencesPitta: vikritiPitta,
      evidencesKapha: vikritiKapha,
    },
    agniReading: {
      type: agniType,
      title: agniType,
      description: agniDesc,
      evidences: agniEvidences,
      confidence: agniConf,
    },
    amaReading: {
      presence: amaPresence,
      categoriesInvolved: amaCategoriesList,
      evidences: amaEvidencesList,
      rationale: amaRationale,
    },
    generalConfidence,
    perceivedResources,
    attentionPoints,
    sessionQuestions,
    disclaimer: AYURVEDA_NON_DIAGNOSTIC_DISCLAIMER,
  }
}
