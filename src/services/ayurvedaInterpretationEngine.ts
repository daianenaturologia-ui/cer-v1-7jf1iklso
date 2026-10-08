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
  getChapter1ResponseRevisionNumber,
  AYV_C1_PROMPTS,
} from '@/services/ayurvedaChapter1'
import {
  migrateLegacyChapter2Responses,
  getChapter2BasePromptId,
  getResponseRevisionNumber,
  AYV_C2_PROMPTS,
} from '@/services/ayurvedaChapter2'
import {
  deriveChapter3Status,
  loadChapter3State,
  chapter3Label,
  AYV_C3_DOMAIN_OPTIONS,
  AYV_C3_DIRECTION_OPTIONS,
  AYV_C3_CONTEXT_OPTIONS,
  AYV_C3_MEDICATION_STATUS_OPTIONS,
} from '@/services/ayurvedaChapter3'

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

const EXCLUDED_OPTION_IDS = new Set(['dont_know', 'refusal', 'unknown'])

function extractChoiceValuesAndKey(resp: ExperienceResponseRecord): {
  values: string[]
  key: string
  isExplicitUnsureOrRefusal: boolean
} {
  const structured = resp.structured_value as any
  let key =
    (resp as any).prompt_key ||
    structured?.prompt_key ||
    resp.prompt_id ||
    (resp as any).canonical_prompt_id ||
    ''

  const metadata = structured?.metadata || {}
  const isExplicitUnsureOrRefusal =
    metadata.explicit_unsure === true ||
    metadata.explicit_refusal === true ||
    metadata.unsure === true ||
    metadata.refusal === true ||
    (resp as any).metadata?.explicit_unsure === true ||
    (resp as any).metadata?.explicit_refusal === true

  if (isExplicitUnsureOrRefusal) {
    return { values: [], key, isExplicitUnsureOrRefusal: true }
  }

  const rawCandidates: any[] = []

  if (structured && typeof structured === 'object') {
    if (Array.isArray(structured.selectedOptionIds)) {
      rawCandidates.push(...structured.selectedOptionIds)
    }
    if (Array.isArray(structured.value)) {
      rawCandidates.push(...structured.value)
    } else if (structured.value !== undefined && structured.value !== null) {
      rawCandidates.push(structured.value)
    }
    if (structured.selectedOptionId !== undefined && structured.selectedOptionId !== null) {
      rawCandidates.push(structured.selectedOptionId)
    }
    if (structured.choice !== undefined && structured.choice !== null) {
      if (Array.isArray(structured.choice)) {
        rawCandidates.push(...structured.choice)
      } else {
        rawCandidates.push(structured.choice)
      }
    }
  } else if (structured !== undefined && structured !== null) {
    rawCandidates.push(structured)
  }

  const values: string[] = []
  const seen = new Set<string>()

  for (const item of rawCandidates) {
    if (item === undefined || item === null) continue
    const str = String(item).trim()
    if (!str) continue
    if (EXCLUDED_OPTION_IDS.has(str)) continue
    if (!seen.has(str)) {
      seen.add(str)
      values.push(str)
    }
  }

  return { values, key, isExplicitUnsureOrRefusal: false }
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
      rationale:
        'Dados insuficientes para avaliação clínica de sobrecarga metabólica nos registros.',
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

  // Helper local para obter timestamp numérico determinístico
  const getRecordTimestamp = (r: ExperienceResponseRecord): number => {
    const raw =
      (r as any).updated || (r as any).created || (r as any).structured_value?.metadata?.answered_at
    if (raw) {
      const parsed = Date.parse(raw)
      if (!Number.isNaN(parsed)) return parsed
    }
    return 0
  }

  // Helper local para obter ID determinístico
  const getRecordId = (r: ExperienceResponseRecord): string => {
    return String((r as any).id || (r as any).prompt_id || '')
  }

  // Seleção INDEPENDENTE por capítulo da maior revisão CONCLUÍDA válida (1B-a)
  const getLatestCompletedRevision = (
    responses: ExperienceResponseRecord[],
    completionId: string,
    completionKey: string,
    getRevFn: (r: ExperienceResponseRecord) => number,
    getBaseFn: (s: string) => string,
  ): number | null => {
    const completedRevs = new Set<number>()
    for (const r of responses) {
      const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id || ''
      const promptKey =
        (r as any).prompt_key ||
        (r.structured_value as any)?.metadata?.prompt_key ||
        (r.structured_value as any)?.prompt_key ||
        ''
      const baseId = getBaseFn(promptId)
      const baseKey = getBaseFn(promptKey)

      if (baseId === completionId || baseKey === completionKey) {
        const sVal = (r as any).structured_value
        const isCompleted =
          sVal?.completed === true ||
          sVal?.value?.completed === true ||
          sVal?.status === 'completed'
        if (isCompleted) {
          completedRevs.add(getRevFn(r))
        }
      }
    }
    return completedRevs.size > 0 ? Math.max(...Array.from(completedRevs)) : null
  }

  const selectedC1Rev = getLatestCompletedRevision(
    migratedC1,
    AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
    AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
    getChapter1ResponseRevisionNumber,
    getChapter1BasePromptId,
  )

  const selectedC2Rev = getLatestCompletedRevision(
    migratedC2,
    AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
    AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
    getResponseRevisionNumber,
    getChapter2BasePromptId,
  )

  const c1Completed = selectedC1Rev !== null
  const c2Completed = selectedC2Rev !== null

  // Guardrail: Nenhuma interpretação quando nenhum capítulo possui revisão concluída válida
  if (!c1Completed && !c2Completed) {
    return emptyResult
  }

  // Filtragem estrita: apenas respostas pertencentes à revisão selecionada de cada capítulo
  // Se o capítulo não tem revisão concluída, respostas daquele capítulo NÃO entram.
  const filteredC1Responses = c1Completed
    ? migratedC1.filter((r) => {
        const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id || ''
        const promptKey =
          (r as any).prompt_key || (r.structured_value as any)?.metadata?.prompt_key || ''
        const isC1 =
          (typeof promptId === 'string' && promptId.startsWith('ayv_c1_')) ||
          (typeof promptKey === 'string' && promptKey.startsWith('ayv_c1_'))
        return isC1 && getChapter1ResponseRevisionNumber(r) === selectedC1Rev
      })
    : []

  const filteredC2Responses = c2Completed
    ? migratedC2.filter((r) => {
        const promptId = (r as any).prompt_id || (r as any).canonical_prompt_id || ''
        const promptKey =
          (r as any).prompt_key || (r.structured_value as any)?.metadata?.prompt_key || ''
        const isC2 =
          (typeof promptId === 'string' && promptId.startsWith('ayv_c2_')) ||
          (typeof promptKey === 'string' && promptKey.startsWith('ayv_c2_'))
        return isC2 && getResponseRevisionNumber(r) === selectedC2Rev
      })
    : []

  // Ordenação determinística: mais antigos primeiro (timestamp ascendente, desempate por id)
  // de forma que iterações determinísticas sobrescrevam com registros mais recentes ou preservem ordem idêntica,
  // tornando o resultado estritamente invariante à ordem de entrada no array allResponses.
  const compareDeterministically = (
    a: ExperienceResponseRecord,
    b: ExperienceResponseRecord,
  ): number => {
    const timeDiff = getRecordTimestamp(a) - getRecordTimestamp(b)
    if (timeDiff !== 0) return timeDiff
    return getRecordId(a).localeCompare(getRecordId(b))
  }

  const sortedC1 = [...filteredC1Responses].sort(compareDeterministically)
  const sortedC2 = [...filteredC2Responses].sort(compareDeterministically)

  // Mapeamento das respostas literais ativas
  const answersMap = new Map<
    string,
    { values: string[]; isExplicitUnsureOrRefusal: boolean; freeText?: string }
  >()
  for (const r of [...sortedC1, ...sortedC2]) {
    const { values, key, isExplicitUnsureOrRefusal } = extractChoiceValuesAndKey(r)
    const baseKey = getChapter1BasePromptId(getChapter2BasePromptId(key))
    answersMap.set(baseKey, { values, isExplicitUnsureOrRefusal, freeText: r.free_text })
  }

  const getActiveValues = (promptDef: { id: string; key: string }): string[] => {
    const entry = answersMap.get(promptDef.id) || answersMap.get(promptDef.key)
    if (!entry || entry.isExplicitUnsureOrRefusal) return []
    return entry.values
  }

  const hasAnyMatch = (actual: string[], expected: string[]): boolean => {
    return expected.some((exp) => actual.includes(exp))
  }

  // Coletores de evidências para Prakriti (natureza habitual / estrutural)
  const prakritiVata: DoshaEvidence[] = []
  const prakritiPitta: DoshaEvidence[] = []
  const prakritiKapha: DoshaEvidence[] = []

  // Coletores de evidências para Vikriti (desequilíbrio / ritmos irregulares)
  const vikritiVata: DoshaEvidence[] = []
  const vikritiPitta: DoshaEvidence[] = []
  const vikritiKapha: DoshaEvidence[] = []

  const pushDedupedByCategory = (list: DoshaEvidence[], item: DoshaEvidence) => {
    if (!list.some((existing) => existing.category === item.category)) {
      list.push(item)
    }
  }

  // 1. Estrutura corporal habitual (Cap 1) — qualificada exclusivamente por P1_DURATION
  const p1DurationEntry =
    answersMap.get(AYV_C1_PROMPTS.P1_DURATION.id) || answersMap.get(AYV_C1_PROMPTS.P1_DURATION.key)
  const p1DurationVals =
    p1DurationEntry && !p1DurationEntry.isExplicitUnsureOrRefusal ? p1DurationEntry.values : []
  const p1DurationRaw = p1DurationVals[0]
  const p1DurationUnsureOrRefusal =
    !p1DurationEntry ||
    p1DurationEntry.isExplicitUnsureOrRefusal ||
    p1DurationRaw === 'dont_know' ||
    p1DurationRaw === 'refusal' ||
    !p1DurationRaw

  // Status de qualificação da estrutura
  const isStructureStable = p1DurationRaw === 'lifelong' || p1DurationRaw === 'most_adult'
  const isStructureVariable = p1DurationRaw === 'some_phases' || p1DurationRaw === 'changed_lot'
  // Compatibilidade com dados legados / ausente / não confirmado:
  // Não inventar duração, não afirmar estabilidade como comprovada, mas registrar ponto de atenção.
  const isStructureUnconfirmed =
    p1DurationUnsureOrRefusal || (!isStructureStable && !isStructureVariable)

  const p1Vals = getActiveValues(AYV_C1_PROMPTS.P1_STRUCTURE)

  // A estrutura SOMENTE conta para evidência de dosha se for estável ('lifelong' | 'most_adult')
  // ou se for legado/não confirmado (onde conta sem afirmação de estabilidade comprovada).
  // Se 'some_phases' ou 'changed_lot', a estrutura é EXCLUÍDA da predominância.
  const structureCountsForPredominance = !isStructureVariable

  if (structureCountsForPredominance) {
    if (hasAnyMatch(p1Vals, ['slender', 'light_narrow', 'leve_longilinea'])) {
      pushDedupedByCategory(prakritiVata, {
        dosha: 'Vata',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura mais leve, longilínea ou óssea aparente',
        observation: 'Conformação habitual com predomínio de leveza e menor densidade de tecidos.',
      })
    }
    if (hasAnyMatch(p1Vals, ['medium', 'intermediate', 'moderada_proporcional'])) {
      pushDedupedByCategory(prakritiPitta, {
        dosha: 'Pitta',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura média, proporcional ou musculatura definida',
        observation: 'Conformação habitual equilibrada com moderado desenvolvimento muscular.',
      })
    }
    if (hasAnyMatch(p1Vals, ['broad', 'broad_solid', 'larga_robusta'])) {
      pushDedupedByCategory(prakritiKapha, {
        dosha: 'Kapha',
        category: 'Estrutura corporal',
        sourceQuestionTitle: 'Estrutura corporal habitual',
        literalText: 'Estrutura mais larga, densa ou com tendência a reter volume',
        observation: 'Conformação habitual com solidez de base, estabilidade e densidade tecidual.',
      })
    }
  }

  // 2. Pele habitual (Cap 1)
  const p2Vals = getActiveValues(AYV_C1_PROMPTS.P2_SKIN)
  if (hasAnyMatch(p2Vals, ['dry', 'dry_rough', 'thin_reactive', 'seca_fina'])) {
    pushDedupedByCategory(prakritiVata, {
      dosha: 'Vata',
      category: 'Pele habitual',
      sourceQuestionTitle: 'Pele habitual',
      literalText: 'Tendência ao ressecamento, aspereza ou espessura fina',
      observation: 'Qualidade tátil seca e fria característica de Vata.',
    })
  }
  if (hasAnyMatch(p2Vals, ['warm', 'warm_sensitive', 'oleosa_sensivel_quente'])) {
    pushDedupedByCategory(prakritiPitta, {
      dosha: 'Pitta',
      category: 'Pele habitual',
      sourceQuestionTitle: 'Pele habitual',
      literalText: 'Tendência a calor, rubor, oleosidade na zona central ou sensibilidade',
      observation: 'Predomínio de vascularização, calor e tendência inflamatória cutânea.',
    })
  }
  if (hasAnyMatch(p2Vals, ['smooth', 'soft_oily', 'macia_espessa_hidratada'])) {
    pushDedupedByCategory(prakritiKapha, {
      dosha: 'Kapha',
      category: 'Pele habitual',
      sourceQuestionTitle: 'Pele habitual',
      literalText: 'Pele macia, espessa, bem hidratada e fria ao toque',
      observation: 'Lubrificação natural abundante e integridade de barreira.',
    })
  }

  // 3. Cabelo habitual (Cap 1)
  const p3Vals = getActiveValues(AYV_C1_PROMPTS.P3_HAIR)
  if (hasAnyMatch(p3Vals, ['dry_brittle', 'dry_tangled', 'fine_delicate', 'fino_seco'])) {
    pushDedupedByCategory(prakritiVata, {
      dosha: 'Vata',
      category: 'Cabelo habitual',
      sourceQuestionTitle: 'Cabelo habitual',
      literalText: 'Fios finos, secos ou com tendência ao arrepiado/quebra',
      observation: 'Nutrição periférica variável ou menor oleosidade do couro cabeludo.',
    })
  }
  if (hasAnyMatch(p3Vals, ['fine_oily', 'oily_roots', 'oleoso_fino_precoce'])) {
    pushDedupedByCategory(prakritiPitta, {
      dosha: 'Pitta',
      category: 'Cabelo habitual',
      sourceQuestionTitle: 'Cabelo habitual',
      literalText:
        'Fios médios a finos, oleosidade rápida ou tendência a clareamento/queda precoce',
      observation: 'Calor metabólico afetando os folículos pilosos.',
    })
  }
  if (hasAnyMatch(p3Vals, ['thick_wavy', 'thick_dense', 'espesso_abundante'])) {
    pushDedupedByCategory(prakritiKapha, {
      dosha: 'Kapha',
      category: 'Cabelo habitual',
      sourceQuestionTitle: 'Cabelo habitual',
      literalText: 'Fios espessos, abundantes, brilhantes e resistentes',
      observation: 'Força tecidual de sustentação e oleosidade equilibrada de proteção.',
    })
  }

  // 4. Temperatura e sensibilidade ao clima (Cap 1)
  const p4Vals = getActiveValues(AYV_C1_PROMPTS.P4_TEMPERATURE)
  if (hasAnyMatch(p4Vals, ['chilly', 'cold_easily', 'sente_frio_facilidade'])) {
    pushDedupedByCategory(prakritiVata, {
      dosha: 'Vata',
      category: 'Regulação térmica',
      sourceQuestionTitle: 'Temperatura corporal habitual',
      literalText: 'Sente frio com facilidade, extremidades frias',
      observation: 'Sensibilidade marcante a temperaturas baixas e vento.',
    })
  }
  if (hasAnyMatch(p4Vals, ['warm', 'heat_easily', 'sente_calor_intolerancia'])) {
    pushDedupedByCategory(prakritiPitta, {
      dosha: 'Pitta',
      category: 'Regulação térmica',
      sourceQuestionTitle: 'Temperatura corporal habitual',
      literalText: 'Sente calor com facilidade, desconforto em ambientes quentes',
      observation: 'Termogênese basal elevada e desconforto ao calor direto.',
    })
  }
  if (hasAnyMatch(p4Vals, ['adaptable', 'stable', 'tolera_bem_prefere_calor_seco'])) {
    pushDedupedByCategory(prakritiKapha, {
      dosha: 'Kapha',
      category: 'Regulação térmica',
      sourceQuestionTitle: 'Temperatura corporal habitual',
      literalText: 'Tolera temperaturas com estabilidade, mas desfavorece clima frio e úmido',
      observation: 'Estabilidade térmica com aversão a umidade acumulada.',
    })
  }

  // 5. Fome e Digestão habitual (Cap 2)
  const hungerVals = getActiveValues(AYV_C2_PROMPTS.P1_HUNGER_PATTERN)
  if (
    hasAnyMatch(hungerVals, [
      'irregular',
      'variable_intensity',
      'changes_routine_emotion',
      'variavel_imprevisivel',
    ])
  ) {
    pushDedupedByCategory(vikritiVata, {
      dosha: 'Vata',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome variável, imprevisível ou oscilante ao longo do dia',
      observation: 'Ritmo irregular sugerindo instabilidade de Vata sobre o sistema digestivo.',
    })
  }
  if (hasAnyMatch(hungerVals, ['intense', 'sudden_intense', 'intensa_urgente'])) {
    pushDedupedByCategory(vikritiPitta, {
      dosha: 'Pitta',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome forte, pontual e que provoca irritação se atrasada',
      observation: 'Agudeza e intensidade no apetite com rápida necessidade de combustível.',
    })
  }
  if (
    hasAnyMatch(hungerVals, ['low_stable', 'light_slow', 'long_without_hunger', 'lenta_tardia'])
  ) {
    pushDedupedByCategory(vikritiKapha, {
      dosha: 'Kapha',
      category: 'Ritmo da fome',
      sourceQuestionTitle: 'Padrão da fome habitual',
      literalText: 'Fome tardia, pouca necessidade pela manhã, apetite modesto',
      observation: 'Metabolismo basal lento e digestão pesada.',
    })
  }

  // 6. Eliminação intestinal (Cap 2)
  const bowelVals = getActiveValues(AYV_C2_PROMPTS.P6_BOWEL_RHYTHM)
  const stoolVals = getActiveValues(AYV_C2_PROMPTS.P7_STOOL_PATTERN)

  if (
    hasAnyMatch(bowelVals, [
      'constipated',
      'skips_days',
      'alternates_constip_loose',
      'irregular',
    ]) ||
    hasAnyMatch(stoolVals, ['hard_dry', 'dry_hard_difficult'])
  ) {
    pushDedupedByCategory(vikritiVata, {
      dosha: 'Vata',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação irregular, espaçada ou fezes secas/ressecadas',
      observation: 'Sinais de secura e motilidade lenta por dispersão de Apana Vayu.',
    })
  }
  if (
    hasAnyMatch(bowelVals, ['loose', 'multiple_daily', 'frequent']) ||
    hasAnyMatch(stoolVals, ['soft_poorly_formed', 'very_loose_watery', 'soft_loose', 'ardor'])
  ) {
    pushDedupedByCategory(vikritiPitta, {
      dosha: 'Pitta',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação múltiplas vezes ao dia, fezes amolecidas ou sensação de calor/ardor',
      observation: 'Calor e fluidez aumentada acelerando o trânsito entérico.',
    })
  }
  if (
    hasAnyMatch(bowelVals, ['sluggish']) ||
    hasAnyMatch(stoolVals, ['sticky_incomplete', 'heavy_sticky'])
  ) {
    pushDedupedByCategory(vikritiKapha, {
      dosha: 'Kapha',
      category: 'Eliminação intestinal',
      sourceQuestionTitle: 'Ritmo intestinal e apresentação das fezes',
      literalText: 'Evacuação lenta, sensação de evacuação incompleta ou fezes pesadas',
      observation: 'Lentidão motora, viscosidade e peso nas vias de eliminação.',
    })
  }

  // 7. Sono e Disposição (Cap 2)
  const sleepVals = getActiveValues(AYV_C2_PROMPTS.P8_SLEEP_PATTERN)
  const wakeVals = getActiveValues(AYV_C2_PROMPTS.P9_WAKING)

  if (
    hasAnyMatch(sleepVals, [
      'light_interrupted',
      'light_wakes_easy',
      'difficulty_falling_asleep',
      'wakes_night',
      'insonia_inicial',
    ]) ||
    hasAnyMatch(wakeVals, ['tired_insufficient', 'fatigued_unrefreshed'])
  ) {
    pushDedupedByCategory(vikritiVata, {
      dosha: 'Vata',
      category: 'Sono e ritmo vigília',
      sourceQuestionTitle: 'Padrão do sono e despertar',
      literalText: 'Sono leve, despertares frequentes ou sensação de agitação noturna',
      observation: 'Instabilidade do sistema nervoso impactando a sustentação do repouso.',
    })
  }
  if (
    hasAnyMatch(sleepVals, ['moderate_hot', 'quick_wake_little_sleep', 'acorda_calor_pesadelos'])
  ) {
    pushDedupedByCategory(vikritiPitta, {
      dosha: 'Pitta',
      category: 'Sono e ritmo vigília',
      sourceQuestionTitle: 'Padrão do sono e despertar',
      literalText: 'Despertar com prontidão extrema ou sonhos intensos',
      observation: 'Horário metabólico de Pitta ativando despertares vívidos.',
    })
  }
  if (
    hasAnyMatch(sleepVals, ['deep_excessive', 'long_sleep_hard_to_wake']) ||
    hasAnyMatch(wakeVals, ['heavy_body_slow_start', 'heavy_groggy'])
  ) {
    pushDedupedByCategory(vikritiKapha, {
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

  // Análise de convergência sem hierarquia artificial em caso de empate:
  // Categorias por dosha:
  const doshaCounts = [
    { dosha: 'Vata', count: vataPrakritiCategories },
    { dosha: 'Pitta', count: pittaPrakritiCategories },
    { dosha: 'Kapha', count: kaphaPrakritiCategories },
  ]

  const maxCount = Math.max(
    vataPrakritiCategories,
    pittaPrakritiCategories,
    kaphaPrakritiCategories,
  )
  const topDoshas = doshaCounts.filter((d) => d.count === maxCount && d.count >= 2)

  let prakritiSummary = ''

  if (maxCount < 2) {
    // Nenhuma convergência com ≥ 2 categorias
    prakritiConfidence = 'Em observação'
    prakritiSummary =
      'Os dados estruturais atuais não apresentaram convergência em pelo menos 2 categorias distintas para sustentar uma hipótese de constituição de base. Manter leitura em observação qualitativa.'
  } else if (topDoshas.length === 3) {
    // Triplo empate (ex.: 2/2/2 ou 3/3/3): NÃO converter em constituição tridosha/sama confirmada
    // Sinalizar ambiguidade que requer aprofundamento. Sem primary/secondary artificial.
    prakritiConfidence = 'Em observação'
    prakritiSummary =
      'Convergência equilibrada de respostas entre Vata, Pitta e Kapha, sem predominância separável com os dados atuais. Ambiguidade que requer aprofundamento e contextualização em sessão, sem inferência de constituição tridosha confirmada.'
  } else if (topDoshas.length === 2) {
    // Empate no topo entre 2 doshas (ex.: Vata 2 / Pitta 2)
    // Preservar as convergências por dosha e descrever a dupla sem hierarquia artificial.
    // Ordenar alfabeticamente para garantir invariância à ordem de inserção:
    const sortedDuo = [...topDoshas].sort((a, b) => a.dosha.localeCompare(b.dosha))
    // primary e secondary permanecem indefinidos (omitidos) para não falsificar hierarquia pela ordem do array.
    // NÃO aumentar confiança em caso de empate (permanece Moderada).
    prakritiConfidence = 'Moderada'
    prakritiSummary = `Convergência entre ${sortedDuo[0].dosha} e ${sortedDuo[1].dosha}, sem predominância separável com os dados atuais (maior convergência de respostas em ambos).`
  } else {
    // topDoshas.length === 1 (um dosha claramente com maior contagem, ≥ 2)
    primaryPrakriti = topDoshas[0].dosha

    // Verificar se há segundo lugar com ≥ 2 categorias
    const remaining = doshaCounts
      .filter((d) => d.dosha !== primaryPrakriti)
      .sort((a, b) => b.count - a.count)

    const secondMax = remaining[0].count
    const secondDoshas = remaining.filter((d) => d.count === secondMax && d.count >= 2)

    if (secondDoshas.length === 1) {
      secondaryPrakriti = secondDoshas[0].dosha
      prakritiConfidence = 'Alta'
      prakritiSummary = `Hipótese bidosha com maior convergência de respostas em ${primaryPrakriti} e presença convergente de ${secondaryPrakriti}, sustentada por evidências cruzadas de estrutura, tecido e regulação habitual.`
    } else if (secondDoshas.length === 2) {
      // Empate no segundo lugar (ex.: 3 Vata, 2 Pitta, 2 Kapha)
      const sortedSecondDuo = [...secondDoshas].sort((a, b) => a.dosha.localeCompare(b.dosha))
      prakritiConfidence = 'Moderada'
      prakritiSummary = `Hipótese com maior convergência de respostas em ${primaryPrakriti}, associada a convergências secundárias equivalentes entre ${sortedSecondDuo[0].dosha} e ${sortedSecondDuo[1].dosha}.`
    } else {
      prakritiConfidence = 'Moderada'
      prakritiSummary = `Hipótese com maior convergência de respostas em ${primaryPrakriti}, sustentada por convergência estrutural observada em mais de uma esfera corporal.`
    }
  }

  // Vikriti
  // REGRA DE TEMPORALIDADE (C2 é habitual_adult):
  // 1. Os sinais do Capítulo 2 NÃO podem ser lançados como evidências de Vikriti ATUAL
  //    nem descritos como "oscilação funcional ativa".
  //    Vikriti fica com confidence "Em observação", SEM primaryImbalance e com os arrays
  //    de evidências atuais VAZIOS (evidencesVata: [], evidencesPitta: [], evidencesKapha: []).
  // 2. Resumo da Vikriti distingue 4 estados conforme o Capítulo 3:
  //    - C3 ausente ou incompleto -> "faltam dados atuais"
  //    - C3 concluído com mudanças relatadas -> "mudanças relatadas precisam de detalhamento"
  //    - C3 concluído com no_current_changes -> "não relatou mudança; não afirmar ausência de doença"
  //    - C3 com dont_know/refusal -> "momento atual não caracterizado"

  const c3Derivation = deriveChapter3Status(allResponses)
  const c3IsCompleted = c3Derivation.status === 'completed'
  const c3State = c3IsCompleted ? loadChapter3State(allResponses) : undefined

  let vikritiSummary = ''
  if (!c3IsCompleted) {
    // C3 ausente ou incompleto
    vikritiSummary =
      'Leitura de Vikriti em observação: faltam dados atuais estruturados (Capítulo 3 não preenchido ou incompleto). Os ritmos relatados no Capítulo 2 refletem funcionamento habitual e não caracterizam desvio agudo ativo.'
  } else {
    const domains = c3State?.changed_domains || []
    const hasDontKnowOrRefusal = domains.some((d) => d === 'dont_know' || d === 'refusal')
    const hasNoCurrentChanges = domains.includes('no_current_changes')
    const hasActualChanges = domains.filter(
      (d) => d !== 'no_current_changes' && d !== 'dont_know' && d !== 'refusal',
    )

    if (hasDontKnowOrRefusal) {
      vikritiSummary =
        'Momento atual não caracterizado no Capítulo 3 (opção por não identificar ou não responder). Isto não equivale a equilíbrio ou ausência de desvios; convite a explorar o momento presente em sessão.'
    } else if (hasNoCurrentChanges) {
      vikritiSummary =
        'Participante relatou não perceber mudanças importantes em relação ao padrão habitual no momento atual. Isto reflete ausência relatada de alterações, sem afirmar ausência de doença ou desequilíbrio clínico.'
    } else if (hasActualChanges.length > 0) {
      vikritiSummary =
        'Mudanças relatadas no Capítulo 3 precisam de detalhamento e contextualização clínica em sessão antes de qualquer inferência de dosha ou desequilíbrio ativo.'
    } else {
      vikritiSummary =
        'Leitura de Vikriti em observação: faltam dados atuais estruturados para caracterização de desequilíbrio ativo.'
    }
  }

  // Vikriti ativa não é inferida do C2 habitual:
  const primaryVikriti: string | undefined = undefined
  let vikritiConfidence: 'Alta' | 'Moderada' | 'Em observação' = 'Em observação'
  const currentVikritiVata: DoshaEvidence[] = []
  const currentVikritiPitta: DoshaEvidence[] = []
  const currentVikritiKapha: DoshaEvidence[] = []

  // 8. Leitura de Agni (Fogo Digestivo)
  const postMealVals = getActiveValues(AYV_C2_PROMPTS.P3_POST_MEAL)
  const heavyFoodVals = getActiveValues(AYV_C2_PROMPTS.P5_FOOD_DEMANDS)

  // Sinais de Vishama Agni (Vata)
  const vishamaEvidences: string[] = []
  if (
    hasAnyMatch(hungerVals, [
      'irregular',
      'variable_intensity',
      'changes_routine_emotion',
      'variavel_imprevisivel',
    ])
  ) {
    vishamaEvidences.push('Padrão de fome irregular ou imprevisível')
  }
  if (hasAnyMatch(postMealVals, ['bloating_gas', 'distended_gassy', 'distensao_gases'])) {
    vishamaEvidences.push('Distensão e gases pós-prandiais')
  }

  // Sinais de Tikshna Agni (Pitta)
  const tikshnaEvidences: string[] = []
  if (hasAnyMatch(hungerVals, ['intense', 'sudden_intense', 'intensa_urgente'])) {
    tikshnaEvidences.push('Fome intensa e necessidade urgente de alimentação')
  }
  if (
    hasAnyMatch(postMealVals, ['heat_burning_acidity', 'burning_heartburn', 'queimacao_refluxo'])
  ) {
    tikshnaEvidences.push('Sensação de queimação ou refluxo após refeições')
  }

  // Sinais de Manda Agni (Kapha)
  const mandaEvidences: string[] = []
  if (
    hasAnyMatch(hungerVals, ['low_stable', 'light_slow', 'long_without_hunger', 'lenta_tardia'])
  ) {
    mandaEvidences.push('Apetite reduzido ou tardio')
  }
  if (
    hasAnyMatch(postMealVals, [
      'heavy_slow_digestion',
      'sleepy_energy_drop',
      'heavy_drowsy',
      'peso_sono',
    ])
  ) {
    mandaEvidences.push('Sensação acentuada de peso e sonolência pós-prandial')
  }

  // Sinais de estabilidade / Sama Agni
  const isHungerExplicitlyRegular = hasAnyMatch(hungerVals, [
    'regular_hours',
    'regular',
    'regular_predictable',
    'horarios_regulares',
  ])
  const isPostMealExplicitlyComfortable = hasAnyMatch(postMealVals, [
    'light_comfortable',
    'comfortable_stable',
    'light_good_energy',
    'leve_confortavel',
    'sem_desconforto',
  ])

  const matchingDysfunctionalTypes: Array<{
    type: 'Vishama Agni' | 'Tikshna Agni' | 'Manda Agni'
    name: string
    evidences: string[]
  }> = []

  if (vishamaEvidences.length > 0) {
    matchingDysfunctionalTypes.push({
      type: 'Vishama Agni',
      name: 'Vishama (irregular/Vata)',
      evidences: vishamaEvidences,
    })
  }
  if (tikshnaEvidences.length > 0) {
    matchingDysfunctionalTypes.push({
      type: 'Tikshna Agni',
      name: 'Tikshna (hiperativo/Pitta)',
      evidences: tikshnaEvidences,
    })
  }
  if (mandaEvidences.length > 0) {
    matchingDysfunctionalTypes.push({
      type: 'Manda Agni',
      name: 'Manda (hipoativo/Kapha)',
      evidences: mandaEvidences,
    })
  }

  let agniType: AgniReading['type'] = 'Indefinido / Em observação'
  let agniDesc = ''
  let agniConf: AgniReading['confidence'] = 'Em observação'
  let agniEvidences: string[] = []

  // COERÊNCIA DE AGNI (Linguagem de padrão habitual e conceito tradicional do Ayurveda):
  const hasAgniInputs = hungerVals.length > 0 || postMealVals.length > 0

  if (matchingDysfunctionalTypes.length > 1) {
    agniType = 'Indefinido / Em observação'
    const typeNames = matchingDysfunctionalTypes.map((t) => t.name).join(' e ')
    agniDesc = `Sinais habituais mistos de digestão e apetite combinando características tradicionais de ${typeNames}. A coexistência dessas manifestações no padrão habitual requer observação longitudinal e exploração detalhada em sessão.`
    agniEvidences = Array.from(new Set(matchingDysfunctionalTypes.flatMap((t) => t.evidences)))
    agniConf = 'Em observação'
  } else if (matchingDysfunctionalTypes.length === 1) {
    const single = matchingDysfunctionalTypes[0]
    if (single.type === 'Vishama Agni') {
      agniType = 'Vishama Agni'
      agniDesc =
        'Padrão habitual sugestivo de Vishama Agni (fogo digestivo irregular/Vata no conceito tradicional): apetite oscilante e digestão variável com propensão habitual a gases e distensão.'
      agniEvidences = single.evidences
      agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
    } else if (single.type === 'Tikshna Agni') {
      agniType = 'Tikshna Agni'
      agniDesc =
        'Padrão habitual sugestivo de Tikshna Agni (fogo digestivo agudo/Pitta no conceito tradicional): apetite intenso com digestão acelerada e propensão habitual a calor e acidez pós-prandial.'
      agniEvidences = single.evidences
      agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
    } else if (single.type === 'Manda Agni') {
      agniType = 'Manda Agni'
      agniDesc =
        'Padrão habitual sugestivo de Manda Agni (fogo digestivo lento/Kapha no conceito tradicional): apetite de início tardio e digestão pesada com propensão habitual a sonolência após refeições.'
      agniEvidences = single.evidences
      agniConf = agniEvidences.length >= 2 ? 'Alta' : 'Moderada'
    }
  } else if (
    isHungerExplicitlyRegular &&
    isPostMealExplicitlyComfortable &&
    matchingDysfunctionalTypes.length === 0
  ) {
    agniType = 'Sama Agni'
    agniDesc =
      'Padrão habitual sugestivo de Sama Agni (fogo digestivo equilibrado no conceito tradicional): fome regular nos horários habituais e digestão sem desconforto, queimação ou sonolência excessiva.'
    agniEvidences = ['Fome previsível e sensação pós-refeição estável']
    agniConf = 'Moderada'
  } else if (!hasAgniInputs) {
    agniType = 'Indefinido / Em observação'
    agniDesc =
      'Dados insuficientes para caracterização do padrão habitual do fogo digestivo (Agni).'
    agniEvidences = []
    agniConf = 'Em observação'
  } else {
    agniType = 'Indefinido / Em observação'
    agniDesc =
      'Manifestação de desarmonia digestiva não evidenciada com os dados disponíveis sobre o padrão habitual; relatos não sustentam sinalização específica, sem que isso comprove ausência clínica.'
    agniEvidences = []
    agniConf = 'Em observação'
  }

  // 9. Leitura de Ama (Toxinas / Sobrecarga metabólica)
  // REGRA CRÍTICA: Ama só deve ser sinalizado com evidências em PELO MENOS DUAS categorias.
  const amaCategoryMap = new Map<string, string>()

  if (
    hasAnyMatch(postMealVals, [
      'heavy_slow_digestion',
      'sleepy_energy_drop',
      'heavy_drowsy',
      'bloating_gas',
    ]) ||
    hasAnyMatch(heavyFoodVals, ['fatty_heavy', 'very_heavy'])
  ) {
    amaCategoryMap.set(
      'Digestão e sensação pós-refeição',
      'Digestão pesada, gases excessivos ou inércia pós-prandial',
    )
  }
  if (hasAnyMatch(stoolVals, ['sticky_incomplete', 'heavy_sticky', 'foul_odor'])) {
    amaCategoryMap.set(
      'Eliminação intestinal',
      'Fezes com muco, aderentes ao vaso ou com sensação de evacuação incompleta',
    )
  }
  if (
    hasAnyMatch(wakeVals, [
      'heavy_body_slow_start',
      'tired_insufficient',
      'heavy_groggy',
      'fatigued_unrefreshed',
    ])
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

  const hasAmaInputs =
    postMealVals.length > 0 ||
    heavyFoodVals.length > 0 ||
    stoolVals.length > 0 ||
    wakeVals.length > 0

  if (amaCategoriesList.length >= 2) {
    amaPresence = 'Sinalizada'
    amaRationale = `Sinais habituais convergentes associados ao conceito tradicional de Ama (acúmulo de resíduos digestivos não assimilados) identificados em ${amaCategoriesList.length} categorias distintas: ${amaCategoriesList.join(' e ')}.`
  } else if (amaCategoriesList.length === 1) {
    amaPresence = 'Possível / Limítrofe'
    amaRationale = `Evidência isolada no padrão habitual em "${amaCategoriesList[0]}". Pelo critério tradicional de convergência do Método CER, um achado isolado não sustenta sinalização de Ama, permanecendo como ponto de observação.`
  } else if (!hasAmaInputs) {
    amaPresence = 'Não evidenciada'
    amaRationale =
      'Dados insuficientes para avaliação clínica de sobrecarga digestiva tradicional (Ama).'
  } else {
    amaPresence = 'Não evidenciada'
    amaRationale =
      'Presença de Ama não evidenciada com os dados disponíveis no padrão habitual; relatos não sustentam a sinalização tradicional, o que não prova ausência clínica.'
  }

  // 10. Recursos percebidos e Pontos de atenção
  const perceivedResources: string[] = []
  const attentionPoints: string[] = []
  const sessionQuestions: string[] = []

  // REGRA 6: REMOVER recursos pessoais deduzidos apenas por ter concluído o questionário
  // (ex.: "percepção clara", "capacidade de..."): usar registro literal da pessoa ou convite neutro.
  if (c1Completed) {
    perceivedResources.push('Registro do padrão físico habitual preenchido no Capítulo 1')
  }
  if (c2Completed) {
    perceivedResources.push('Registro de ritmos biológicos cotidianos preenchido no Capítulo 2')
  }
  if (primaryPrakriti) {
    perceivedResources.push(
      `Traços estruturais de base compatíveis com tendência ${primaryPrakriti}`,
    )
  }

  // MICROBLOCO 2B: Registro de qualificação de P1_DURATION nos pontos de atenção
  if (c1Completed) {
    if (isStructureVariable) {
      attentionPoints.push(
        'Estrutura corporal habitual relatada com variações ao longo do tempo — não sustenta hipótese de estrutura constitucional estável; a ser explorada em sessão.',
      )
    } else if (isStructureUnconfirmed) {
      attentionPoints.push(
        'Duração da estrutura corporal habitual não confirmada; estabilidade constitucional não assumida como comprovada.',
      )
    }
  }

  // MICROBLOCO 2B: Opções de variabilidade de C1 entram como "pontos a explorar", nunca como evidência de dosha
  // Opções de variabilidade conhecidas:
  // C1 Tela 1: 'two_figures', 'changed_lot'
  // C1 Tela 2 (Pele): 'varies_region'
  // C1 Tela 3 (Cabelo): 'mixed_varies'
  // C1 Tela 4 (Temperatura): 'alternates', 'varies_climate'
  // C1 Tela 5 (Sede/Bebida/Suor): 'varies_late', 'varies_stress'
  const variabilityOptionsMap: Record<string, string> = {
    two_figures:
      'Estrutura corporal relatando características de duas figuras (variação combinada)',
    varies_region: 'Pele habitual com comportamento que varia conforme região ou estação',
    mixed_varies: 'Cabelo habitual com fios que misturam características ou variam bastante',
    alternates: 'Temperatura habitual com oscilação frequente entre sensação de frio e calor',
    varies_climate: 'Sensibilidade térmica habitual variando conforme o clima, ciclo ou fase',
    varies_late:
      'Sensação de sede com padrão oscilante ou percepção tardia da necessidade de hidratação',
    varies_stress: 'Transpiração habitual variando conforme estresse, clima ou ciclo',
  }

  if (c1Completed) {
    const rawAllC1Values = Array.from(answersMap.entries())
      .filter(([k]) => k.startsWith('ayv_c1_'))
      .flatMap(([, v]) => (v.isExplicitUnsureOrRefusal ? [] : v.values))

    for (const [optKey, optDesc] of Object.entries(variabilityOptionsMap)) {
      if (rawAllC1Values.includes(optKey)) {
        attentionPoints.push(`Ponto a explorar: ${optDesc}.`)
      }
    }
  }

  // P12 do C2: Confiança histórica
  // many_years/mostly_habitual_recent_changes NÃO comprovam desequilíbrio;
  // mainly_present NÃO comprova diferença da constituição.
  // Formular como pergunta/convite, não como conclusão.
  const p12Vals = getActiveValues(AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE)
  if (hasAnyMatch(p12Vals, ['many_years'])) {
    attentionPoints.push(
      'Referência histórica relatada como habitual de muitos anos; convite para explorar em sessão se esse funcionamento de longo prazo sempre foi confortável ou se foi se normalizando ao longo do tempo.',
    )
  } else if (hasAnyMatch(p12Vals, ['mostly_habitual_recent_changes'])) {
    attentionPoints.push(
      'Relato de funcionamento habitual com mudanças recentes; convite para explorar em sessão a linha do tempo dessas alterações sem assumi-las previamente como desequilíbrio.',
    )
    sessionQuestions.push(
      'Quais foram as primeiras coisas que você notou mudando em relação ao seu funcionamento de costume?',
    )
  } else if (hasAnyMatch(p12Vals, ['mainly_present'])) {
    attentionPoints.push(
      'Relato baseado principalmente no momento atual; falta melhor referência histórica comparativa para distinguir a constituição de base (Prakriti) de variações recentes.',
    )
    sessionQuestions.push(
      'Como seu corpo e seus ritmos costumavam funcionar em fases mais estáveis ou anteriores da sua vida?',
    )
  } else if (hasAnyMatch(p12Vals, ['mixture_past_present', 'hard_to_remember'])) {
    attentionPoints.push(
      'Dificuldade ou mistura na delimitação temporal do padrão habitual; recomenda-se construir a linha do tempo em diálogo durante a sessão.',
    )
    sessionQuestions.push(
      'Ao pensar na sua história de vida, você consegue identificar períodos em que seu corpo funcionava de forma diferente de hoje?',
    )
  }

  if (amaPresence === 'Sinalizada') {
    attentionPoints.push(
      'Sinais habituais associados à sobrecarga digestiva tradicional (Ama) identificados em mais de uma categoria',
    )
  }
  if (agniType === 'Vishama Agni' || agniType === 'Manda Agni' || agniType === 'Tikshna Agni') {
    attentionPoints.push(`Padrão habitual do fogo digestivo caracterizado como ${agniType}`)
  }

  // INTEGRAÇÃO CONSERVADORA DO CAPÍTULO 3 (SÓ QUANDO CONCLUÍDO)
  // Regra 4: contexto, domínios, direções e medicação entram como PONTOS PARA CONVERSA / perguntas,
  // nunca como evidência de dosha e nunca com causa medicamentosa inferida.
  if (c3IsCompleted && c3State) {
    const domains = c3State.changed_domains || []
    const hasSpecialExit = domains.some((d) =>
      ['no_current_changes', 'dont_know', 'refusal'].includes(d),
    )

    if (!hasSpecialExit && domains.length > 0) {
      const domainLabels = domains.map((d) => chapter3Label(AYV_C3_DOMAIN_OPTIONS, d))
      attentionPoints.push(
        `Áreas com alterações relatadas no momento atual: ${domainLabels.join(', ')} (ponto para diálogo em sessão, sem inferência dosha automática).`,
      )

      // Direções relatadas
      if (c3State.change_directions) {
        const dirEntries = Object.entries(c3State.change_directions)
        if (dirEntries.length > 0) {
          const dirSummaries = dirEntries.map(([dom, dir]) => {
            const domLabel = chapter3Label(AYV_C3_DOMAIN_OPTIONS, dom)
            const dirLabel = chapter3Label(AYV_C3_DIRECTION_OPTIONS, dir)
            return `${domLabel}: ${dirLabel}`
          })
          attentionPoints.push(
            `Direções percebidas nas mudanças: ${dirSummaries.join('; ')} (ponto de conversa para contextualizar a intensidade).`,
          )
        }
      }

      // Contextos associados relatados
      if (c3State.change_contexts && c3State.change_contexts.length > 0) {
        const contextsNotExcluded = c3State.change_contexts.filter(
          (c) => !['none_identified', 'dont_know', 'refusal'].includes(c),
        )
        if (contextsNotExcluded.length > 0) {
          const ctxLabels = contextsNotExcluded.map((c) => chapter3Label(AYV_C3_CONTEXT_OPTIONS, c))
          attentionPoints.push(
            `Contextos de vida associados às mudanças relatadas: ${ctxLabels.join(', ')} (explorar como esses fatores podem estar modulando a rotina).`,
          )
        }
      }

      sessionQuestions.push(
        `Você mencionou mudanças atuais em ${domainLabels.slice(0, 3).join(', ')}. O que mais se destaca no seu dia a dia quando você observa essas alterações?`,
      )
    }

    // Medicação no C3: entra estritamente como ponto de atenção/conversa, SEM causa medicamentosa inferida
    const medStatus = c3State.medication_status
    if (medStatus && medStatus !== 'no_use') {
      const medStatusLabel = chapter3Label(AYV_C3_MEDICATION_STATUS_OPTIONS, medStatus)
      attentionPoints.push(
        `Uso de medicamentos ou suplementos relatado (${medStatusLabel}); ponto de atenção e conversa para contextualização conjunta, sem inferência de nexo causal.`,
      )

      if (c3State.medication_items && c3State.medication_items.length > 0) {
        const medNames = c3State.medication_items
          .map((m) => m.name)
          .filter(Boolean)
          .join(', ')
        if (medNames) {
          attentionPoints.push(`Substâncias registradas para diálogo em sessão: ${medNames}.`)
        }
      }

      sessionQuestions.push(
        'Você faz uso de medicamentos ou suplementos: como eles se integram à sua rotina atual e aos seus ritmos corporais?',
      )
    }
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
      'Você percebe sensação de peso, saburra lingual ou falta de disposição em horários específicos da manhã?',
    )
  }
  sessionQuestions.push(
    'De tudo o que você respondeu sobre o ritmo do seu corpo, o que mais chama a sua atenção atualmente?',
  )

  const generalConfidence: 'Alta' | 'Moderada' | 'Em observação' =
    prakritiConfidence === 'Alta'
      ? 'Alta'
      : prakritiConfidence !== 'Em observação'
        ? 'Moderada'
        : 'Em observação'

  // Determinação determinística e canônica de activeRevisionNumber (1B-a):
  // Se ambos selecionados têm o MESMO número, usar esse número.
  // Se diferem ou apenas um concluiu, se C1 e C2 diferem omitir o campo (opcional);
  // se apenas um completou, usar o número daquele capítulo concluído.
  let activeRevisionNumber: number | undefined
  if (selectedC1Rev !== null && selectedC2Rev !== null) {
    if (selectedC1Rev === selectedC2Rev) {
      activeRevisionNumber = selectedC1Rev
    } else {
      activeRevisionNumber = undefined
    }
  } else if (selectedC1Rev !== null) {
    activeRevisionNumber = selectedC1Rev
  } else if (selectedC2Rev !== null) {
    activeRevisionNumber = selectedC2Rev
  }

  return {
    hasCompletedRevision: true,
    ...(activeRevisionNumber !== undefined ? { activeRevisionNumber } : {}),
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
      evidencesVata: currentVikritiVata,
      evidencesPitta: currentVikritiPitta,
      evidencesKapha: currentVikritiKapha,
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
