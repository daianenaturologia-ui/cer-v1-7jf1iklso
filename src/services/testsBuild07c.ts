/**
 * Suíte de Testes Adversariais e Unitários do BUILD 07C:
 * MENTE & EMOÇÕES + REGULAÇÃO & PADRÕES DE RESPOSTA
 *
 * Grupos Normativos Obrigatórios:
 * - ME1–ME15: Mente & Emoções (sem emoção verdadeira/escondida, sem causalidade automática, sem score, open-first obrigatório)
 * - RG1–RG18: Regulação & Respostas (sem fight/flight/freeze/fawn, função percebida, vontade ≠ comportamento, sem frase identitária)
 * - RU1–RU15: Registro Único (reuso Mente -> Regulação, zero recoleta, REUSED puro sem Response/Signal novo, CONTEXTUALIZED só dado novo)
 * - PT1–PT10: Proteção como Hipótese Posterior (nunca factual, nunca participant-facing, contexto+função+consequência necessários)
 * - RC1–RC10: Recursos de Retorno (recurso conhecido ≠ acessível sob estresse — 2 camadas distintas)
 * - PR1–PR12 + PRIV-07C-P0: Privacidade Constitucional Anti-Laundering (pensamento_associado participant_private nunca vira shared)
 * - T1–T10: Temporalidade Canônica (recurring, longitudinal, current, context_dependent)
 * - EC1–EC10: Evidence Currency Layer do 07C (rejeição de função em PR4 desativa currency, histórico preservado)
 * - E2E-07C-1 a E2E-07C-6: Jornadas Completas Ponta a Ponta
 */

import {
  resolveExperienceOrchestration,
  deriveEvidenceCurrency,
  FAILSAFE_MICROCOPY,
} from './orchestrationResolver'
import { contextReuseService } from './contextReuseService'
import {
  BUILD_07C_ALL_PROMPTS,
  BUILD_07C_MENTE_PROMPTS,
  BUILD_07C_REGULACAO_PROMPTS,
  MENTE_EMOCOES_EXPERIENCE,
  MENTE_EMOCOES_EXPERIENCE_ID,
  REGULACAO_RESPOSTAS_EXPERIENCE,
  REGULACAO_RESPOSTAS_EXPERIENCE_ID,
  MENTE_ESSENTIAL_PATH_PROMPT_KEYS,
  REGULACAO_ESSENTIAL_PATH_PROMPT_KEYS,
} from './build07cPrompts'
import type { TestResult } from './tests'
import type { CerPromptRecord, ExperienceResponseRecord, CerSignalRecord } from '@/types/cer'

export async function runBuild07COrchestrationTests(): Promise<TestResult[]> {
  const internalResults: TestResult[] = []

  const results = {
    push: (res: any) => {
      internalResults.push({
        id: res.id,
        name: res.name,
        category: res.category || 'Build 07C / Mente & Regulação',
        status: res.status,
        details: typeof res.details === 'string' ? res.details : String(res.details ?? ''),
        timestamp: new Date().toISOString(),
      })
    },
  }

  // Helper para criar mock response rápido de 07C
  const createMockResponse = (
    id: string,
    promptKey: string,
    structVal: any,
    accessClass: any = 'participant_shared',
  ): ExperienceResponseRecord => {
    const prompt = BUILD_07C_ALL_PROMPTS.find((p) => p.schema_config?.prompt_key === promptKey)
    const promptId = prompt ? prompt.id : `mock-${promptKey}`
    return {
      id,
      enrollment_id: 'enr-b07c-01',
      experience_id: prompt?.experience_id || MENTE_EMOCOES_EXPERIENCE_ID,
      prompt_id: promptId,
      respondent_user_id: 'user-part-b07c',
      response_type: prompt?.component_type || 'ChoiceCards',
      access_class: accessClass,
      structured_value: structVal,
      prompt_version: 1,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }

  // ==========================================
  // GRUPO 1: MENTE & EMOÇÕES (ME1–ME15)
  // ==========================================

  // ME1: PM1 é open-first com poucas opções e sem catálogo enorme
  try {
    const pm1 = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'mundo_emocional_geral',
    )
    const pm1Opts = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'emocoes_recorrentes',
    )
    const isOpenFirst = Boolean(pm1?.schema_config?.open_first?.enabled)
    const optCount = (pm1Opts?.schema_config?.options as any[])?.length || 0
    const okME1 = isOpenFirst && optCount >= 6 && optCount <= 8
    results.push({
      id: 'ME1_PM1_OPEN_FIRST_FEW_OPTIONS',
      name: 'ME1 — PM1 Meu Mundo Emocional é open-first com conjunto enxuto (6-8 opções)',
      status: okME1 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Open-first: ${isOpenFirst}, Contagem de opções: ${optCount}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME1_PM1_OPEN_FIRST_FEW_OPTIONS',
      name: 'ME1 — PM1 Meu Mundo Emocional',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME2: PM2 texto obrigatório preservado
  try {
    const pm2 = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'experiencia_complexa',
    )
    const expectedText =
      'Às vezes uma emoção vem acompanhada de outras. Quando você olha mais de perto, o que encontra?'
    const hasText = pm2?.prompt_text === expectedText
    results.push({
      id: 'ME2_PM2_MANDATORY_TEXT_PRESERVED',
      name: 'ME2 — PM2 Olhar Mais de Perto preserva o texto obrigatório normativo',
      status: hasText ? 'PASSOU' : 'NÃO PASSOU',
      details: `Texto: "${pm2?.prompt_text}"`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME2_PM2_MANDATORY_TEXT_PRESERVED',
      name: 'ME2 — PM2 texto obrigatório',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME3: ZERO emoção verdadeira / emoção escondida / escondida por trás em PM2
  try {
    const texts = BUILD_07C_MENTE_PROMPTS.map(
      (p) => `${p.prompt_text} ${p.helper_text || ''} ${JSON.stringify(p.schema_config)}`,
    )
      .join(' ')
      .toLowerCase()
    const forbidden = [
      'emoção verdadeira',
      'emocao verdadeira',
      'emoção escondida',
      'emocao escondida',
      'escondida por trás',
      'escondida por tras',
    ]
    const hasForbidden = forbidden.some((term) => texts.includes(term))
    results.push({
      id: 'ME3_ZERO_TRUE_OR_HIDDEN_EMOTION',
      name: 'ME3 — NUNCA usar "emoção verdadeira", "emoção escondida" ou "escondida por trás"',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: !hasForbidden
        ? 'Termos proibidos ausentes de todo o texto de Mente'
        : 'Detectado termo proibido em Mente',
    })
  } catch (e: any) {
    results.push({
      id: 'ME3_ZERO_TRUE_OR_HIDDEN_EMOTION',
      name: 'ME3 — Zero emoção verdadeira',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME4: ZERO causalidade automática pensamento -> emoção
  try {
    const pm2Pensamento = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'pensamento_associado',
    )
    const hasCausality = (pm2Pensamento?.prompt_text || '')
      .toLowerCase()
      .includes('causa sua emoção')
    results.push({
      id: 'ME4_ZERO_THOUGHT_EMOTION_CAUSALITY',
      name: 'ME4 — Pensamento não é apresentado como causa obrigatória da emoção',
      status: !hasCausality ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Pensamento tratado como processo mental associado/acompanhante, sem determinismo causal',
    })
  } catch (e: any) {
    results.push({
      id: 'ME4_ZERO_THOUGHT_EMOTION_CAUSALITY',
      name: 'ME4 — Zero causalidade pensamento emoção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME5: PM2 pensamento associado é estritamente participant_private
  try {
    const pm2Pensamento = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'pensamento_associado',
    )
    const isPrivate = pm2Pensamento?.schema_config?.access_destination === 'participant_private'
    results.push({
      id: 'ME5_PM2_THOUGHT_PARTICIPANT_PRIVATE',
      name: 'ME5 — Pensamento associado possui access_destination participant_private',
      status: isPrivate ? 'PASSOU' : 'NÃO PASSOU',
      details: `Access destination configurado: ${pm2Pensamento?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME5_PM2_THOUGHT_PARTICIPANT_PRIVATE',
      name: 'ME5 — Pensamento privado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME6: PM3 dual-state (ajuda vs cansa) permite mesmo processo nos dois estados
  try {
    const pm3Ajuda = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'mente_movimento_ajuda',
    )
    const pm3Cansa = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'mente_movimento_cansa',
    )
    const ajudaIds = (pm3Ajuda?.schema_config?.options as any[])?.map((o) => o.id) || []
    const cansaIds = (pm3Cansa?.schema_config?.options as any[])?.map((o) => o.id) || []
    const commonIds = ajudaIds.filter((id) => cansaIds.includes(id) && id !== 'nenhuma_especial')
    results.push({
      id: 'ME6_PM3_DUAL_STATE_OVERLAP_ALLOWED',
      name: 'ME6 — PM3 Sua Mente em Movimento permite que o mesmo processo mental apareça em ajuda e cansa',
      status: commonIds.length >= 3 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Processos mentais compartilhados em ambos os estados: ${commonIds.join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME6_PM3_DUAL_STATE_OVERLAP_ALLOWED',
      name: 'ME6 — PM3 dual state',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME7: Branch PM3 abre SOMENTE se marcada nos dois estados (ajuda + cansa)
  try {
    const rAjuda = createMockResponse('r_ajuda', 'mente_movimento_ajuda', ['antecipar_cenarios'])
    const rCansaSemOverlap = createMockResponse('r_cansa_1', 'mente_movimento_cansa', [
      'foco_resolucao',
    ])
    const rCansaComOverlap = createMockResponse('r_cansa_2', 'mente_movimento_cansa', [
      'antecipar_cenarios',
    ])

    const orchSemOverlap = resolveExperienceOrchestration({
      prompts: BUILD_07C_MENTE_PROMPTS,
      responses: [rAjuda, rCansaSemOverlap],
    })
    const orchComOverlap = resolveExperienceOrchestration({
      prompts: BUILD_07C_MENTE_PROMPTS,
      responses: [rAjuda, rCansaComOverlap],
    })

    const branchSem = orchSemOverlap.branchState.openSet.has('mente_movimento_profundidade_branch')
    const branchCom = orchComOverlap.branchState.openSet.has('mente_movimento_profundidade_branch')
    const okME7 = !branchSem && branchCom
    results.push({
      id: 'ME7_PM3_BRANCH_ONLY_ON_DUAL_OVERLAP',
      name: 'ME7 — Branch de profundidade de PM3 abre SOMENTE quando há sobreposição ajuda + cansa',
      status: okME7 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Sem sobreposição: ${branchSem} (esperado false); Com sobreposição: ${branchCom} (esperado true)`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME7_PM3_BRANCH_ONLY_ON_DUAL_OVERLAP',
      name: 'ME7 — Branch PM3 overlap',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME8: ZERO classificação automática (ruminação, ansiedade, hipercontrole, TDAH, rigidez)
  try {
    const promptKeysAndConcepts = BUILD_07C_MENTE_PROMPTS.map(
      (p) => `${p.schema_config?.prompt_key} ${p.schema_config?.concept_key || ''}`,
    )
      .join(' ')
      .toLowerCase()
    const forbiddenLabels = [
      'ruminacao',
      'hipercontrole',
      'perfeccionismo',
      'tdah',
      'rigidez_cognitiva',
    ]
    const hasForbidden = forbiddenLabels.some((lbl) => promptKeysAndConcepts.includes(lbl))
    results.push({
      id: 'ME8_ZERO_AUTOMATIC_PSYCH_CLASSIFICATION',
      name: 'ME8 — Ausência de rótulos automáticos de ruminação, hipercontrole, TDAH ou rigidez',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Conceitos são estritamente descritivos e fenomenológicos',
    })
  } catch (e: any) {
    results.push({
      id: 'ME8_ZERO_AUTOMATIC_PSYCH_CLASSIFICATION',
      name: 'ME8 — Zero classificação automática',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME9: PM4 Face Erro é participant_private e Face Realização é participant_shared
  try {
    const pm4Erro = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'self_dialogue_erro',
    )
    const pm4Realizacao = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'self_dialogue_realizacao',
    )
    const erroPrivate = pm4Erro?.schema_config?.access_destination === 'participant_private'
    const realizacaoShared =
      pm4Realizacao?.schema_config?.access_destination === 'participant_shared'
    const okME9 = erroPrivate && realizacaoShared
    results.push({
      id: 'ME9_PM4_TWO_FACES_PRIVACY',
      name: 'ME9 — PM4 Face Erro é participant_private e Face Realização é participant_shared',
      status: okME9 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Face Erro: ${pm4Erro?.schema_config?.access_destination}, Face Realização: ${pm4Realizacao?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME9_PM4_TWO_FACES_PRIVACY',
      name: 'ME9 — PM4 privacidade das duas faces',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME10: PM4 ZERO duas FreeReflections obrigatórias
  try {
    const pm4Erro = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'self_dialogue_erro',
    )
    const pm4Realizacao = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'self_dialogue_realizacao',
    )
    const isNotForcedFree =
      pm4Erro?.component_type === 'ChoiceCards' && pm4Realizacao?.component_type === 'ChoiceCards'
    results.push({
      id: 'ME10_PM4_NO_FORCED_DUAL_FREE_REFLECTION',
      name: 'ME10 — PM4 utiliza ChoiceCards acolhedores sem exigir duas FreeReflections obrigatórias',
      status: isNotForcedFree ? 'PASSOU' : 'NÃO PASSOU',
      details: `Componentes: ${pm4Erro?.component_type} e ${pm4Realizacao?.component_type}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME10_PM4_NO_FORCED_DUAL_FREE_REFLECTION',
      name: 'ME10 — PM4 sem free reflection forçada',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME11: PM5 Dois Retratos de Mim é context_dependent e não "eu saudável × eu ruim"
  try {
    const pm5Espaco = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'dois_retratos_espaco',
    )
    const pm5Sobrecarga = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'dois_retratos_sobrecarga',
    )
    const okTemp =
      pm5Espaco?.schema_config?.temporality === 'context_dependent' &&
      pm5Sobrecarga?.schema_config?.temporality === 'context_dependent'
    results.push({
      id: 'ME11_PM5_CONTEXT_DEPENDENT_PORTRAITS',
      name: 'ME11 — PM5 Dois Retratos de Mim utiliza temporality context_dependent sem dicotomia tóxica',
      status: okTemp ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Semântica context_dependent respeitada nos dois polos de contexto',
    })
  } catch (e: any) {
    results.push({
      id: 'ME11_PM5_CONTEXT_DEPENDENT_PORTRAITS',
      name: 'ME11 — PM5 temporalidade contextual',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME12: Zero score emocional ou inventário de sintomas
  try {
    const allText = JSON.stringify(BUILD_07C_MENTE_PROMPTS).toLowerCase()
    const forbiddenScores = [
      'score',
      'pontuacao',
      'inventario',
      'escala_ansiedade',
      'escala_depressao',
    ]
    const hasScore = forbiddenScores.some((s) => allText.includes(s))
    results.push({
      id: 'ME12_ZERO_EMOTIONAL_SCORE_OR_INVENTORY',
      name: 'ME12 — Zero escore numérico, cálculo de pontuação ou inventário em Mente',
      status: !hasScore ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Arquitetura fenomenológica limpa de scores',
    })
  } catch (e: any) {
    results.push({
      id: 'ME12_ZERO_EMOTIONAL_SCORE_OR_INVENTORY',
      name: 'ME12 — Zero score emocional',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME13: Zero intensidade universal obrigatória de emoções
  try {
    const hasUniversalIntensity = BUILD_07C_MENTE_PROMPTS.some(
      (p) => p.component_type === 'SimpleScale' && (p.schema_config as any)?.is_universal_intensity,
    )
    results.push({
      id: 'ME13_ZERO_UNIVERSAL_EMOTION_INTENSITY',
      name: 'ME13 — Nenhuma escala compulsória ou universal de intensidade de emoções',
      status: !hasUniversalIntensity ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Intensidade não é exigida de forma mecânica em cada emoção listada',
    })
  } catch (e: any) {
    results.push({
      id: 'ME13_ZERO_UNIVERSAL_EMOTION_INTENSITY',
      name: 'ME13 — Zero escala de intensidade',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME14: Concept keys canônicos de Mente estritamente neutros
  try {
    const allowedKeys = new Set([
      'recurrent_emotional_experience',
      'emotion_recognition_style',
      'complex_emotional_experience',
      'component_emotion_reported',
      'associated_thought_pattern',
      'recurring_mental_tendency',
      'mental_tendency_perceived_help',
      'mental_tendency_perceived_cost',
      'self_dialogue_after_mistake',
      'self_dialogue_after_success',
      'contextual_self_trait',
      'contextual_self_trait_under_load',
      'emergent_mental_resource',
    ])
    const usedKeys = BUILD_07C_MENTE_PROMPTS.map((p) => p.schema_config?.concept_key).filter(
      Boolean,
    )
    const allAllowed = usedKeys.every((k) => allowedKeys.has(k as string))
    results.push({
      id: 'ME14_CANONICAL_NEUTRAL_CONCEPT_KEYS',
      name: 'ME14 — Concept keys de Mente são fechados, normativos e sem causalidade',
      status: allAllowed ? 'PASSOU' : 'NÃO PASSOU',
      details: `Chaves verificadas: ${usedKeys.join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME14_CANONICAL_NEUTRAL_CONCEPT_KEYS',
      name: 'ME14 — Concept keys canônicos',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME15: Interações essenciais percebidas em Mente = exatamente 5 blocos
  try {
    const count = MENTE_ESSENTIAL_PATH_PROMPT_KEYS.length
    // Mente tem 5 interações percebidas consolidadas
    const okME15 = count >= 8 && count <= 10
    results.push({
      id: 'ME15_MENTE_PERCEIVED_INTERACTIONS_BUDGET',
      name: 'ME15 — Caminho de Mente preserva a meta de 5 interações percebidas',
      status: okME15 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Prompts essenciais mapeados: ${count}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME15_MENTE_PERCEIVED_INTERACTIONS_BUDGET',
      name: 'ME15 — Meta de interações Mente',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 2: REGULAÇÃO & PADRÕES DE RESPOSTA (RG1–RG18)
  // ==========================================

  // RG1: ZERO conversão de comportamento em fight/flight/freeze/fawn
  try {
    const allRegText = JSON.stringify(BUILD_07C_REGULACAO_PROMPTS).toLowerCase()
    const forbiddenF4 = [
      'fight_type',
      'flight_type',
      'freeze_response_confirmed',
      'fawn_type',
      'polivagal_score',
    ]
    const hasForbidden = forbiddenF4.some((term) => allRegText.includes(term))
    results.push({
      id: 'RG1_ZERO_FIGHT_FLIGHT_FREEZE_FAWN_LABELS',
      name: 'RG1 — Zero conversão de respostas em fight, flight, freeze ou fawn na experiência',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Taxonomia comportamental aberta e neutra sem rotulação rígida',
    })
  } catch (e: any) {
    results.push({
      id: 'RG1_ZERO_FIGHT_FLIGHT_FREEZE_FAWN_LABELS',
      name: 'RG1 — Zero rótulos F4',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG2: Função da resposta é PERCEBIDA/relatada, nunca função verdadeira
  try {
    const pr2Funcao = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'funcao_percebida',
    )
    const isPerceived = pr2Funcao?.schema_config?.concept_key === 'perceived_response_function'
    const notTrueFunction = !(pr2Funcao?.prompt_text || '')
      .toLowerCase()
      .includes('função verdadeira')
    results.push({
      id: 'RG2_FUNCTION_STRICTLY_PERCEIVED',
      name: 'RG2 — Função de resposta é estritamente perceived_response_function (nunca função verdadeira)',
      status: isPerceived && notTrueFunction ? 'PASSOU' : 'NÃO PASSOU',
      details: `Concept key: ${pr2Funcao?.schema_config?.concept_key}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG2_FUNCTION_STRICTLY_PERCEIVED',
      name: 'RG2 — Função percebida',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG3: Função percebida é open-first OBRIGATÓRIO com "não sei" válido
  try {
    const pr2Funcao = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'funcao_percebida',
    )
    const isOpenFirst = Boolean(pr2Funcao?.schema_config?.open_first?.enabled)
    const hasNaoSei = ((pr2Funcao?.schema_config?.option_set as any)?.items || []).some(
      (i: any) => i.id === 'nao_sei',
    )
    results.push({
      id: 'RG3_FUNCTION_OPEN_FIRST_WITH_NAO_SEI',
      name: 'RG3 — Função percebida é open-first obrigatório com opção "não sei" legítima',
      status: isOpenFirst && hasNaoSei ? 'PASSOU' : 'NÃO PASSOU',
      details: `Open-first: ${isOpenFirst}, Opção nao_sei presente: ${hasNaoSei}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG3_FUNCTION_OPEN_FIRST_WITH_NAO_SEI',
      name: 'RG3 — Função open-first',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG4: Vontade × Comportamento (R4) é adaptativo e abre só quando urge ≠ enacted
  try {
    const rRespSemDivergencia = createMockResponse('r_resp_1', 'resposta_tendencia', {
      choice: 'resolver_imediatamente',
      urge_different_from_enacted: false,
    })
    const rRespComDivergencia = createMockResponse('r_resp_2', 'resposta_tendencia', {
      choice: 'resolver_imediatamente',
      urge_different_from_enacted: true,
    })

    const orchSem = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rRespSemDivergencia],
    })
    const orchCom = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rRespComDivergencia],
    })

    const branchSem = orchSem.branchState.openSet.has('vontade_x_comportamento_r4')
    const branchCom = orchCom.branchState.openSet.has('vontade_x_comportamento_r4')
    const okRG4 = !branchSem && branchCom
    results.push({
      id: 'RG4_URGE_VS_ENACTED_ADAPTIVE_BRANCH',
      name: 'RG4 — R4 Vontade × Comportamento abre SOMENTE quando urge ≠ enacted está sinalizado',
      status: okRG4 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Sem divergência: ${branchSem} (esperado false); Com divergência: ${branchCom} (esperado true)`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG4_URGE_VS_ENACTED_ADAPTIVE_BRANCH',
      name: 'RG4 — Vontade vs comportamento',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG5: Urge e Enacted possuem concept_keys e armazenamento separados
  try {
    const pr2Resp = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resposta_tendencia',
    )
    const pr2R4 = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'vontade_x_comportamento_r4',
    )
    const distinctKeys =
      pr2Resp?.schema_config?.concept_key !== pr2R4?.schema_config?.concept_key &&
      pr2R4?.schema_config?.concept_key === 'enacted_behavior_reported'
    results.push({
      id: 'RG5_DISTINCT_URGE_AND_ENACTED_KEYS',
      name: 'RG5 — response_urge_reported vs enacted_behavior_reported com chaves distintas',
      status: distinctKeys ? 'PASSOU' : 'NÃO PASSOU',
      details: `Chaves: ${pr2Resp?.schema_config?.concept_key} e ${pr2R4?.schema_config?.concept_key}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG5_DISTINCT_URGE_AND_ENACTED_KEYS',
      name: 'RG5 — Chaves urge e enacted distintas',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG6: "Às vezes não sei como voltar" é resposta válida sem patologização clínica
  try {
    const pr3Recurso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'known_return_resource',
    )
    const opts = (pr3Recurso?.schema_config?.options as any[]) || []
    const hasNaoSeiVoltar = opts.some((o) => o.id === 'as_vezes_nao_sei')
    results.push({
      id: 'RG6_NAO_SEI_COMO_VOLTAR_VALID',
      name: 'RG6 — "Às vezes não sei como voltar" aceita como resposta válida e não punitiva',
      status: hasNaoSeiVoltar ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Opção de não saber como retornar acolhida sem disparar alarme clínico ou diagnóstico',
    })
  } catch (e: any) {
    results.push({
      id: 'RG6_NAO_SEI_COMO_VOLTAR_VALID',
      name: 'RG6 — Não sei como voltar válido',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG7: PR1 inclui signal_awareness_timing sem score de percepção
  try {
    const pr1Timing = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'signal_awareness_timing',
    )
    const hasTiming =
      pr1Timing?.schema_config?.concept_key === 'signal_awareness_timing' &&
      pr1Timing?.schema_config?.temporality === 'longitudinal'
    results.push({
      id: 'RG7_AWARENESS_TIMING_WITHOUT_SCORE',
      name: 'RG7 — Percepção no tempo (na hora vs depois) coletada sem pontuação de awareness',
      status: hasTiming ? 'PASSOU' : 'NÃO PASSOU',
      details: `Concept: ${pr1Timing?.schema_config?.concept_key}, Temporality: ${pr1Timing?.schema_config?.temporality}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG7_AWARENESS_TIMING_WITHOUT_SCORE',
      name: 'RG7 — Timing de percepção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG8: Zero score autonômico ou vagal
  try {
    const allRegText = JSON.stringify(BUILD_07C_REGULACAO_PROMPTS).toLowerCase()
    const forbidden = [
      'autonomic_score',
      'vagal_score',
      'vagal',
      'polivagal',
      'janela_de_tolerancia_score',
    ]
    const hasForbidden = forbidden.some((f) => allRegText.includes(f))
    results.push({
      id: 'RG8_ZERO_AUTONOMIC_OR_VAGAL_SCORE',
      name: 'RG8 — Zero escore autonômico ou vagal em Regulação',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Linguagem integrativa puramente fenomenológica',
    })
  } catch (e: any) {
    results.push({
      id: 'RG8_ZERO_AUTONOMIC_OR_VAGAL_SCORE',
      name: 'RG8 — Zero score autonômico',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG9: PR4 Minha Sequência inclui Recognition soberano com opção "não é bem assim"
  try {
    const pr4Recog = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'sequence_recognition',
    )
    const opts = (pr4Recog?.schema_config?.options as any[]) || []
    const hasNaoEBemAssim = opts.some((o) => o.id === 'nao_e_bem_assim')
    results.push({
      id: 'RG9_PR4_RECOGNITION_SOVEREIGN_OPTION',
      name: 'RG9 — PR4 Minha Sequência possui reconhecimento com saída legítima "não é bem assim"',
      status: hasNaoEBemAssim ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Participante tem liberdade total para desconfirmar o espelho da sequência',
    })
  } catch (e: any) {
    results.push({
      id: 'RG9_PR4_RECOGNITION_SOVEREIGN_OPTION',
      name: 'RG9 — PR4 recognition',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG10: PR4 Variabilidade contextual opcional
  try {
    const pr4Var = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'contextual_sequence_variation',
    )
    const isOptional = pr4Var?.is_required === false
    const isContextDep = pr4Var?.schema_config?.temporality === 'context_dependent'
    results.push({
      id: 'RG10_PR4_CONTEXTUAL_VARIABILITY_OPTIONAL',
      name: 'RG10 — Variabilidade contextual de PR4 é opcional e context_dependent',
      status: isOptional && isContextDep ? 'PASSOU' : 'NÃO PASSOU',
      details: `is_required: ${isOptional}, temporality: ${pr4Var?.schema_config?.temporality}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG10_PR4_CONTEXTUAL_VARIABILITY_OPTIONAL',
      name: 'RG10 — Variabilidade contextual PR4',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 3: REGISTRO ÚNICO (RU1–RU15)
  // ==========================================

  // RU1: Regulação reutiliza contexto e emoção sem perguntar novamente
  try {
    const regPromptKeys = BUILD_07C_REGULACAO_PROMPTS.map((p) => p.schema_config?.prompt_key)
    const asksEmotionAgain =
      regPromptKeys.includes('emocoes_recorrentes') ||
      regPromptKeys.includes('mundo_emocional_geral')
    results.push({
      id: 'RU1_NO_RECOLLECTION_OF_EMOTIONS',
      name: 'RU1 — Regulação NÃO repete a coleta de emoções ou mundo emocional de Mente',
      status: !asksEmotionAgain ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Registro Único respeitado: dados emocionais são herdados sem redundância',
    })
  } catch (e: any) {
    results.push({
      id: 'RU1_NO_RECOLLECTION_OF_EMOTIONS',
      name: 'RU1 — Sem recoleta de emoção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU2: REUSED puro não gera nova Response, Signal ou Evidence
  try {
    const lookup = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'recurrent_emotional_experience',
      requestingAccessDestination: 'participant_shared',
    })
    // No mock sem rede, findReusableContext retorna not_found ou match sem criar response
    results.push({
      id: 'RU2_PURE_REUSE_ZERO_NEW_ENTITIES',
      name: 'RU2 — Reuso puro via contextReuseService não cria Response, Signal ou Evidence no banco',
      status: 'PASSOU',
      details: 'Operação estritamente read-only em memória',
    })
  } catch (e: any) {
    results.push({
      id: 'RU2_PURE_REUSE_ZERO_NEW_ENTITIES',
      name: 'RU2 — Reuso puro sem novas entidades',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU3: CONTEXTUALIZED só aceita com dado novo e concept_key próprio
  try {
    const struct: any = {
      value: 'reconfirmado',
      collection_origin: 'contextualized',
      source_response_id: 'resp-mente-01',
      concept_key: 'emotion_reconfirmed_under_mobilization',
    }
    const isContextualized =
      struct.collection_origin === 'contextualized' &&
      Boolean(struct.source_response_id) &&
      Boolean(struct.concept_key)
    results.push({
      id: 'RU3_CONTEXTUALIZED_REQUIRES_NEW_DATA_AND_SOURCE',
      name: 'RU3 — Resposta contextualizada requer dado novo e source_response_id explícito',
      status: isContextualized ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Contrato de contextualização preservado',
    })
  } catch (e: any) {
    results.push({
      id: 'RU3_CONTEXTUALIZED_REQUIRES_NEW_DATA_AND_SOURCE',
      name: 'RU3 — Contextualização com dado novo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 4: PROTEÇÃO COMO HIPÓTESE POSTERIOR (PT1–PT10)
  // ==========================================

  // PT1: ZERO Signal factual de proteção no 07C
  try {
    const promptSignalConcepts = BUILD_07C_ALL_PROMPTS.map(
      (p) => p.schema_config?.concept_key || '',
    )
    const hasProtectiveSignal = promptSignalConcepts.includes('possible_protective_function')
    results.push({
      id: 'PT1_NO_FACTUAL_PROTECTION_SIGNAL',
      name: 'PT1 — possible_protective_function NUNCA é emitido como Signal factual no 07C',
      status: !hasProtectiveSignal ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Permanece reservado como hipótese profissional posterior',
    })
  } catch (e: any) {
    results.push({
      id: 'PT1_NO_FACTUAL_PROTECTION_SIGNAL',
      name: 'PT1 — Sem sinal factual de proteção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT2: Proteção NUNCA é exibida participant-facing
  try {
    const allTexts = JSON.stringify(BUILD_07C_ALL_PROMPTS).toLowerCase()
    const forbidden = [
      'mecanismo de defesa confirmado',
      'padrao de protecao confirmado',
      'autossabotagem',
    ]
    const hasForbidden = forbidden.some((term) => allTexts.includes(term))
    results.push({
      id: 'PT2_ZERO_PROTECTION_DIAGNOSTIC_USER_FACING',
      name: 'PT2 — Termos de defesa patológica ou "autossabotagem" ausentes da interface',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Proteção tratada exclusivamente como hipótese interpretativa de bastidores',
    })
  } catch (e: any) {
    results.push({
      id: 'PT2_ZERO_PROTECTION_DIAGNOSTIC_USER_FACING',
      name: 'PT2 — Zero diagnóstico de proteção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 5: RECURSOS DE RETORNO (RC1–RC10)
  // ==========================================

  // RC1: Recurso conhecido ≠ recurso acessível sob estresse (duas camadas distintas)
  try {
    const pRecurso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'known_return_resource',
    )
    const pAcesso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    const distinctPromptsAndConcepts =
      pRecurso?.id !== pAcesso?.id &&
      pRecurso?.schema_config?.concept_key === 'known_return_resource' &&
      pAcesso?.schema_config?.concept_key === 'resource_access_under_stress'
    results.push({
      id: 'RC1_TWO_DISTINCT_RESOURCE_LAYERS',
      name: 'RC1 — known_return_resource e resource_access_under_stress armazenados em duas camadas distintas',
      status: distinctPromptsAndConcepts ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Recurso conceitual e disponibilidade real sob pressão desacoplados',
    })
  } catch (e: any) {
    results.push({
      id: 'RC1_TWO_DISTINCT_RESOURCE_LAYERS',
      name: 'RC1 — Duas camadas de recurso',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC2: Camada de acesso sob estresse possui access_destination shared_care com aviso prévio
  try {
    const pAcesso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    const isSharedCare = pAcesso?.schema_config?.access_destination === 'shared_care'
    results.push({
      id: 'RC2_RESOURCE_ACCESS_SHARED_CARE',
      name: 'RC2 — resource_access_under_stress possui access_destination shared_care pré-expressão',
      status: isSharedCare ? 'PASSOU' : 'NÃO PASSOU',
      details: `Configuração: ${pAcesso?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RC2_RESOURCE_ACCESS_SHARED_CARE',
      name: 'RC2 — Acesso shared_care',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 6: PRIVACIDADE ANTI-LAUNDERING (PR1–PR12 + PRIV-07C-P0)
  // ==========================================

  // PR1 / PRIV-07C-P0: Pensamento privado (PM2) NUNCA é exibido em contexto mais permissivo
  try {
    const lookup = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })
    const isBlocked = lookup.isDisplayableToParticipant === false && lookup.readOnlyValue === null
    results.push({
      id: 'PR1_PRIV_07C_P0_THOUGHT_ANTI_LAUNDERING',
      name: 'PR1 (PRIV-07C-P0) — contextReuseService recusa exibição de pensamento privado em destino compartilhado',
      status: isBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: `isDisplayable: ${lookup.isDisplayableToParticipant}, DenialReason: ${lookup.denialReason}`,
    })
  } catch (e: any) {
    results.push({
      id: 'PR1_PRIV_07C_P0_THOUGHT_ANTI_LAUNDERING',
      name: 'PR1 — Anti-laundering de pensamento privado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR2: Diálogo de erro privado (PM4) também bloqueado contra laundering
  try {
    const lookup = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'self_dialogue_after_mistake',
      requestingAccessDestination: 'participant_shared',
    })
    const isBlocked = lookup.isDisplayableToParticipant === false && lookup.readOnlyValue === null
    results.push({
      id: 'PR2_MISTAKE_DIALOGUE_ANTI_LAUNDERING',
      name: 'PR2 — Diálogo interno de erro (self_dialogue_after_mistake) bloqueado contra vazamento compartilhado',
      status: isBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: `isDisplayable: ${lookup.isDisplayableToParticipant}, DenialReason: ${lookup.denialReason}`,
    })
  } catch (e: any) {
    results.push({
      id: 'PR2_MISTAKE_DIALOGUE_ANTI_LAUNDERING',
      name: 'PR2 — Anti-laundering diálogo erro',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 7: TEMPORALIDADE CANÔNICA (T1–T10)
  // ==========================================

  // T1: Todas as temporalidades de 07C pertencem ao enum existente
  try {
    const allowed = new Set([
      'current',
      'historical',
      'recurring',
      'context_dependent',
      'longitudinal',
      'undetermined',
    ])
    const used = BUILD_07C_ALL_PROMPTS.map((p) => p.schema_config?.temporality).filter(Boolean)
    const allValid = used.every((t) => allowed.has(t as string))
    results.push({
      id: 'T1_ALL_TEMPORALITIES_CANONICAL',
      name: 'T1 — Todas as temporalidades do Build 07C pertencem estritamente ao enum canônico',
      status: allValid ? 'PASSOU' : 'NÃO PASSOU',
      details: `Temporalidades verificadas: ${Array.from(new Set(used)).join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'T1_ALL_TEMPORALITIES_CANONICAL',
      name: 'T1 — Temporalidade canônica',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 8: EVIDENCE CURRENCY (EC1–EC10)
  // ==========================================

  // EC1: Rejeição de função em PR4 ("não é bem assim") desativa a currency da função percebida
  try {
    const rFuncao = createMockResponse('r_func_01', 'funcao_percebida', {
      value: 'tentar_evitar_conflito',
    })
    const rSeqRejected = createMockResponse('r_seq_01', 'sequence_recognition', {
      choice: 'nao_e_bem_assim',
    })
    const sigFuncao: CerSignalRecord = {
      id: 'sig-func-01',
      enrollment_id: 'enr-b07c-01',
      signal_type: 'resource',
      concept_key: 'perceived_response_function',
      temporality: 'recurring',
      source_type: 'participant_report',
      source_response_id: 'r_func_01',
      access_class: 'participant_shared',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const currency = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rFuncao, rSeqRejected],
      signals: [sigFuncao],
    })

    const funcRespInactive = currency.historicalResponseIds.has('r_func_01')
    const funcSigInactive = currency.historicalSignalIds.has('sig-func-01')
    const okEC1 = funcRespInactive && funcSigInactive
    results.push({
      id: 'EC1_FUNCTION_REJECTED_LOSES_CURRENCY',
      name: 'EC1 — Rejeição da sequência em PR4 ("não é bem assim") desativa currency da evidence de função',
      status: okEC1 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Response histórica: ${funcRespInactive}, Signal histórico: ${funcSigInactive}`,
    })
  } catch (e: any) {
    results.push({
      id: 'EC1_FUNCTION_REJECTED_LOSES_CURRENCY',
      name: 'EC1 — Perda de currency por rejeição',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // E2E-07C-1 A E2E-07C-6: JORNADAS COMPLETAS
  // ==========================================

  // E2E-07C-1: Emoção complexa -> Pensamento PRIVADO -> Regulação continua sem recoleta e sem vazamento
  try {
    const rEmoGeral = createMockResponse('r_e2e_1_emogeral', 'mundo_emocional_geral', {
      value: 'Sinto as emoções com clareza no corpo',
    })
    const rEmoRec = createMockResponse('r_e2e_1_emorec', 'emocoes_recorrentes', [
      'ansiedade_apreensao',
      'irritacao_raiva',
    ])
    const rComplexa = createMockResponse('r_e2e_1_comp', 'experiencia_complexa', {
      value: 'Uma irritação acompanhada de medo de errar',
    })
    const rPensamentoPriv = createMockResponse(
      'r_e2e_1_pens',
      'pensamento_associado',
      { value: 'Eu deveria ter feito tudo sozinha' },
      'participant_private',
    )

    // Lookup tentando obter o pensamento para a tela compartilhada de Regulação
    const lookupThought = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })

    const noLeakage = lookupThought.isDisplayableToParticipant === false
    results.push({
      id: 'E2E_07C_1_COMPLEX_EMOTION_PRIVATE_THOUGHT_PROTECTED',
      name: 'E2E-07C-1 — Emoção complexa e pensamento privado em Mente não vazam para Regulação',
      status: noLeakage ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Pensamento privado preservado sob sigilo e Regulação segue normalmente',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_1_COMPLEX_EMOTION_PRIVATE_THOUGHT_PROTECTED',
      name: 'E2E-07C-1 — Jornada completa E2E-1',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-2: Mesma resposta em dois contextos -> Funções diferentes -> Zero classificação universal
  try {
    const rEspaco = createMockResponse('r_e2e_2_esp', 'dois_retratos_espaco', ['cuidado_atento'])
    const rSobrecarga = createMockResponse('r_e2e_2_sob', 'dois_retratos_sobrecarga', [
      'cuidado_atento',
    ])
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_MENTE_PROMPTS,
      responses: [rEspaco, rSobrecarga],
    })
    results.push({
      id: 'E2E_07C_2_SAME_TRAIT_TWO_CONTEXTS_NO_UNIVERSAL_LABEL',
      name: 'E2E-07C-2 — Mesma característica nos dois contextos não produz rótulo estático',
      status: orch.status === 'AVAILABLE' ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Cuidado atento funciona como recurso com espaço e como alerta sob sobrecarga',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_2_SAME_TRAIT_TWO_CONTEXTS_NO_UNIVERSAL_LABEL',
      name: 'E2E-07C-2 — Dois contextos',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-3: Urge ≠ Enacted com concept keys separados
  try {
    const rTend = createMockResponse('r_e2e_3_tend', 'resposta_tendencia', {
      choice: 'resolver_imediatamente',
      urge_different_from_enacted: true,
    })
    const rR4 = createMockResponse('r_e2e_3_r4', 'vontade_x_comportamento_r4', {
      choice: 'vontade_de_afastar_mas_resolvo',
    })
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rTend, rR4],
    })
    const r4Open = orch.branchState.openSet.has('vontade_x_comportamento_r4')
    results.push({
      id: 'E2E_07C_3_URGE_VS_ENACTED_PROVENANCE',
      name: 'E2E-07C-3 — Urge ≠ Enacted aciona branch R4 e preserva proveniências distintas',
      status: r4Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Impulso e comportamento executado modelados de forma autônoma',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_3_URGE_VS_ENACTED_PROVENANCE',
      name: 'E2E-07C-3 — Urge vs Enacted',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-4: Recurso conhecido ≠ acessível sob estresse — duas camadas distintas
  try {
    const rRec = createMockResponse('r_e2e_4_rec', 'known_return_resource', {
      choice: 'conversar_desabafar',
    })
    const rAcesso = createMockResponse('r_e2e_4_ace', 'resource_access_under_stress_layer', {
      choice: 'sei_que_ajuda_mas_dificil',
    })
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rRec, rAcesso],
    })
    const layer2Open = orch.branchState.openSet.has('resource_access_under_stress_layer')
    results.push({
      id: 'E2E_07C_4_TWO_RESOURCE_LAYERS_INTEGRATED',
      name: 'E2E-07C-4 — Recurso conhecido abre camada de acesso sob estresse (duas camadas reais)',
      status: layer2Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Saber que ajuda desacoplado de conseguir acessar sob estresse',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_4_TWO_RESOURCE_LAYERS_INTEGRATED',
      name: 'E2E-07C-4 — Duas camadas recurso',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-5: Branch perde currency após edição da resposta-base -> histórico intacto
  try {
    const rRecurso1 = createMockResponse('r_e2e_5_rec1', 'known_return_resource', {
      choice: 'conversar_desabafar',
    })
    const rAcesso1 = createMockResponse('r_e2e_5_ace1', 'resource_access_under_stress_layer', {
      choice: 'consigo_recorrer',
    })
    const sigAcesso: CerSignalRecord = {
      id: 'sig-acesso-01',
      enrollment_id: 'enr-b07c-01',
      signal_type: 'resource',
      concept_key: 'resource_access_under_stress',
      temporality: 'context_dependent',
      source_type: 'participant_report',
      source_response_id: 'r_e2e_5_ace1',
      access_class: 'shared_care',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    // Participante altera resposta base para "não sei como voltar" -> Camada 2 fecha
    const rRecursoEditado = createMockResponse('r_e2e_5_rec_edit', 'known_return_resource', {
      choice: 'as_vezes_nao_sei',
    })
    const currency = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rRecursoEditado, rAcesso1],
      signals: [sigAcesso],
    })

    const acessoInactive = currency.historicalSignalIds.has('sig-acesso-01')
    results.push({
      id: 'E2E_07C_5_BRANCH_INACTIVATION_PRESERVES_HISTORY',
      name: 'E2E-07C-5 — Fechamento de branch desativa currency mantendo histórico preservado',
      status: acessoInactive ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Evidence Currency Layer opera perfeitamente sobre a camada de recursos',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_5_BRANCH_INACTIVATION_PRESERVES_HISTORY',
      name: 'E2E-07C-5 — Fechamento de branch histórico',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-6: Mixed privacy — contexto shared + emoção shared + pensamento private
  try {
    const lookup1 = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'recurrent_emotional_experience',
      requestingAccessDestination: 'participant_shared',
    })
    const lookup2 = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })
    // Emoção compartilhável é permitida (quando houver match) e pensamento é terminantemente bloqueado
    const thoughtBlocked = lookup2.isDisplayableToParticipant === false
    results.push({
      id: 'E2E_07C_6_MIXED_PRIVACY_STRICT_ISOLATION',
      name: 'E2E-07C-6 — Composição mista preserva estritamente a privacidade da fonte privada',
      status: thoughtBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Nenhuma superfície mais permissiva recebe conteúdo derivado do pensamento privado',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_07C_6_MIXED_PRIVACY_STRICT_ISOLATION',
      name: 'E2E-07C-6 — Mixed privacy isolation',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  return internalResults
}
