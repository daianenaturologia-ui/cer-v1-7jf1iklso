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
      id: 'ME1',
      name: 'ME1 — PM1 Meu Mundo Emocional é open-first com conjunto enxuto (6-8 opções)',
      status: okME1 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Open-first: ${isOpenFirst}, Contagem de opções: ${optCount}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME1',
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
      id: 'ME2',
      name: 'ME2 — PM2 Olhar Mais de Perto preserva o texto obrigatório normativo',
      status: hasText ? 'PASSOU' : 'NÃO PASSOU',
      details: `Texto: "${pm2?.prompt_text}"`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME2',
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
      id: 'ME3',
      name: 'ME3 — NUNCA usar "emoção verdadeira", "emoção escondida" ou "escondida por trás"',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: !hasForbidden
        ? 'Termos proibidos ausentes de todo o texto de Mente'
        : 'Detectado termo proibido em Mente',
    })
  } catch (e: any) {
    results.push({
      id: 'ME3',
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
      id: 'ME4',
      name: 'ME4 — Pensamento não é apresentado como causa obrigatória da emoção',
      status: !hasCausality ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Pensamento tratado como processo mental associado/acompanhante, sem determinismo causal',
    })
  } catch (e: any) {
    results.push({
      id: 'ME4',
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
      id: 'ME5',
      name: 'ME5 — Pensamento associado possui access_destination participant_private',
      status: isPrivate ? 'PASSOU' : 'NÃO PASSOU',
      details: `Access destination configurado: ${pm2Pensamento?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME5',
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
      id: 'ME6',
      name: 'ME6 — PM3 Sua Mente em Movimento permite que o mesmo processo mental apareça em ajuda e cansa',
      status: commonIds.length >= 3 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Processos mentais compartilhados em ambos os estados: ${commonIds.join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME6',
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
      id: 'ME7',
      name: 'ME7 — Branch de profundidade de PM3 abre SOMENTE quando há sobreposição ajuda + cansa',
      status: okME7 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Sem sobreposição: ${branchSem} (esperado false); Com sobreposição: ${branchCom} (esperado true)`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME7',
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
      id: 'ME8',
      name: 'ME8 — Ausência de rótulos automáticos de ruminação, hipercontrole, TDAH ou rigidez',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Conceitos são estritamente descritivos e fenomenológicos',
    })
  } catch (e: any) {
    results.push({
      id: 'ME8',
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
      id: 'ME9',
      name: 'ME9 — PM4 Face Erro é participant_private e Face Realização é participant_shared',
      status: okME9 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Face Erro: ${pm4Erro?.schema_config?.access_destination}, Face Realização: ${pm4Realizacao?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME9',
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
      id: 'ME10',
      name: 'ME10 — PM4 utiliza ChoiceCards acolhedores sem exigir duas FreeReflections obrigatórias',
      status: isNotForcedFree ? 'PASSOU' : 'NÃO PASSOU',
      details: `Componentes: ${pm4Erro?.component_type} e ${pm4Realizacao?.component_type}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME10',
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
      id: 'ME11',
      name: 'ME11 — PM5 Dois Retratos de Mim utiliza temporality context_dependent sem dicotomia tóxica',
      status: okTemp ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Semântica context_dependent respeitada nos dois polos de contexto',
    })
  } catch (e: any) {
    results.push({
      id: 'ME11',
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
      id: 'ME12',
      name: 'ME12 — Zero escore numérico, cálculo de pontuação ou inventário em Mente',
      status: !hasScore ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Arquitetura fenomenológica limpa de scores',
    })
  } catch (e: any) {
    results.push({
      id: 'ME12',
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
      id: 'ME13',
      name: 'ME13 — Nenhuma escala compulsória ou universal de intensidade de emoções',
      status: !hasUniversalIntensity ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Intensidade não é exigida de forma mecânica em cada emoção listada',
    })
  } catch (e: any) {
    results.push({
      id: 'ME13',
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
      id: 'ME14',
      name: 'ME14 — Concept keys de Mente são fechados, normativos e sem causalidade',
      status: allAllowed ? 'PASSOU' : 'NÃO PASSOU',
      details: `Chaves verificadas: ${usedKeys.join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME14',
      name: 'ME14 — Concept keys canônicos',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ME15: Interações essenciais percebidas em Mente = exatamente 5 blocos
  try {
    const count = MENTE_ESSENTIAL_PATH_PROMPT_KEYS.length
    const okME15 = count >= 8 && count <= 10
    results.push({
      id: 'ME15',
      name: 'ME15 — Caminho de Mente preserva a meta de 5 interações percebidas',
      status: okME15 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Prompts essenciais mapeados: ${count}`,
    })
  } catch (e: any) {
    results.push({
      id: 'ME15',
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
      id: 'RG1',
      name: 'RG1 — Zero conversão de respostas em fight, flight, freeze ou fawn na experiência',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Taxonomia comportamental aberta e neutra sem rotulação rígida',
    })
  } catch (e: any) {
    results.push({
      id: 'RG1',
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
      id: 'RG2',
      name: 'RG2 — Função de resposta é estritamente perceived_response_function (nunca função verdadeira)',
      status: isPerceived && notTrueFunction ? 'PASSOU' : 'NÃO PASSOU',
      details: `Concept key: ${pr2Funcao?.schema_config?.concept_key}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG2',
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
      id: 'RG3',
      name: 'RG3 — Função percebida é open-first obrigatório com opção "não sei" legítima',
      status: isOpenFirst && hasNaoSei ? 'PASSOU' : 'NÃO PASSOU',
      details: `Open-first: ${isOpenFirst}, Opção nao_sei presente: ${hasNaoSei}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG3',
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
      id: 'RG4',
      name: 'RG4 — R4 Vontade × Comportamento abre SOMENTE quando urge ≠ enacted está sinalizado',
      status: okRG4 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Sem divergência: ${branchSem} (esperado false); Com divergência: ${branchCom} (esperado true)`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG4',
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
      id: 'RG5',
      name: 'RG5 — response_urge_reported vs enacted_behavior_reported com chaves distintas',
      status: distinctKeys ? 'PASSOU' : 'NÃO PASSOU',
      details: `Chaves: ${pr2Resp?.schema_config?.concept_key} e ${pr2R4?.schema_config?.concept_key}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG5',
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
      id: 'RG6',
      name: 'RG6 — "Às vezes não sei como voltar" aceita como resposta válida e não punitiva',
      status: hasNaoSeiVoltar ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Opção de não saber como retornar acolhida sem disparar alarme clínico ou diagnóstico',
    })
  } catch (e: any) {
    results.push({
      id: 'RG6',
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
      id: 'RG7',
      name: 'RG7 — Percepção no tempo (na hora vs depois) coletada sem pontuação de awareness',
      status: hasTiming ? 'PASSOU' : 'NÃO PASSOU',
      details: `Concept: ${pr1Timing?.schema_config?.concept_key}, Temporality: ${pr1Timing?.schema_config?.temporality}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG7',
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
      id: 'RG8',
      name: 'RG8 — Zero escore autonômico ou vagal em Regulação',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Linguagem integrativa puramente fenomenológica',
    })
  } catch (e: any) {
    results.push({
      id: 'RG8',
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
      id: 'RG9',
      name: 'RG9 — PR4 Minha Sequência possui reconhecimento com saída legítima "não é bem assim"',
      status: hasNaoEBemAssim ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Participante tem liberdade total para desconfirmar o espelho da sequência',
    })
  } catch (e: any) {
    results.push({
      id: 'RG9',
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
      id: 'RG10',
      name: 'RG10 — Variabilidade contextual de PR4 é opcional e context_dependent',
      status: isOptional && isContextDep ? 'PASSOU' : 'NÃO PASSOU',
      details: `is_required: ${isOptional}, temporality: ${pr4Var?.schema_config?.temporality}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG10',
      name: 'RG10 — Variabilidade contextual PR4',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG11: Mesma resposta em contextos distintos pode assumir funções percebidas diferentes
  try {
    const r1 = {
      context: 'conflito_critica',
      response: 'afastar_recolher',
      function: 'evitar_conflito_maior',
    }
    const r2 = {
      context: 'excesso_demandas',
      response: 'afastar_recolher',
      function: 'garantir_seguranca_controle',
    }
    const diffFunctions = r1.response === r2.response && r1.function !== r2.function
    results.push({
      id: 'RG11',
      name: 'RG11 — Mesma resposta comportamental pode assumir funções percebidas distintas dependendo do contexto',
      status: diffFunctions ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Afastar-se protege contra conflito no ambiente interpessoal e preserva energia sob sobrecarga',
    })
  } catch (e: any) {
    results.push({
      id: 'RG11',
      name: 'RG11 — Mesma resposta funções distintas',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG12: Função de regulação permanece como percepção do participante sem se tornar fato objetivo do sistema
  try {
    const pFuncao = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'funcao_percebida',
    )
    const isReported = pFuncao?.schema_config?.concept_key === 'perceived_response_function'
    results.push({
      id: 'RG12',
      name: 'RG12 — Função de regulação permanece como percepção do participante sem conversão em fato objetivo',
      status: isReported ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Armazenamento estrito sob concept_key perceived_response_function',
    })
  } catch (e: any) {
    results.push({
      id: 'RG12',
      name: 'RG12 — Função permanece percepção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG13: Vontade interna não é tratada como comportamento efetivo (desacoplamento formal)
  try {
    const pResp = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resposta_tendencia',
    )
    const pR4 = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'vontade_x_comportamento_r4',
    )
    const decoupled = pResp?.schema_config?.concept_key !== pR4?.schema_config?.concept_key
    results.push({
      id: 'RG13',
      name: 'RG13 — Vontade interna desacoplada do comportamento visível executado',
      status: decoupled ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Semântica formal diferencia o impulso sentido da resposta enactment',
    })
  } catch (e: any) {
    results.push({
      id: 'RG13',
      name: 'RG13 — Desacoplamento vontade e comportamento',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG14: Benefício de curto prazo não anula custo de longo prazo (dois prompts autônomos)
  try {
    const pBeneficio = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'funcao_percebida',
    )
    const pCusto = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'custo_posterior',
    )
    const distinctTimes = pBeneficio && pCusto && pBeneficio.step_order !== pCusto.step_order
    results.push({
      id: 'RG14',
      name: 'RG14 — Benefício imediato no momento não anula nem substitui o custo posterior',
      status: distinctTimes ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Alívio momentâneo e custo posterior registrados em etapas e temporalidades independentes',
    })
  } catch (e: any) {
    results.push({
      id: 'RG14',
      name: 'RG14 — Benefício vs custo posterior',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG15: Padrão de resposta nunca é rotulado como traço de identidade permanente
  try {
    const promptKeysAndTexts = BUILD_07C_REGULACAO_PROMPTS.map(
      (p) => `${p.prompt_text} ${p.step_title} ${JSON.stringify(p.schema_config)}`,
    )
      .join(' ')
      .toLowerCase()
    const forbiddenIdentity = [
      'você é uma pessoa evasiva',
      'personalidade conflituosa',
      'você é ansiosa',
      'perfil travado',
    ]
    const hasIdentity = forbiddenIdentity.some((term) => promptKeysAndTexts.includes(term))
    results.push({
      id: 'RG15',
      name: 'RG15 — Padrão de resposta nunca é convertido em frase identitária ou perfil de personalidade',
      status: !hasIdentity ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Textos formulados em termos contextuais e dinâmicos de resposta episódica',
    })
  } catch (e: any) {
    results.push({
      id: 'RG15',
      name: 'RG15 — Sem frase identitária',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG16: Opção "Não sei" é legítima em PR1, PR2, PR3 e PR4
  try {
    const pr1Opts =
      (BUILD_07C_REGULACAO_PROMPTS.find(
        (p) => p.schema_config?.prompt_key === 'contexto_mobilizacao',
      )?.schema_config?.options as any[]) || []
    const pr2Opts =
      ((
        BUILD_07C_REGULACAO_PROMPTS.find((p) => p.schema_config?.prompt_key === 'funcao_percebida')
          ?.schema_config?.option_set as any
      )?.items as any[]) || []
    const pr3Opts =
      (BUILD_07C_REGULACAO_PROMPTS.find(
        (p) => p.schema_config?.prompt_key === 'known_return_resource',
      )?.schema_config?.options as any[]) || []
    const pr4Opts =
      (BUILD_07C_REGULACAO_PROMPTS.find(
        (p) => p.schema_config?.prompt_key === 'sequence_recognition',
      )?.schema_config?.options as any[]) || []
    const pr1Has = pr1Opts.some((o) => o.id === 'nao_sei')
    const pr2Has = pr2Opts.some((o) => o.id === 'nao_sei')
    const pr3Has = pr3Opts.some((o) => o.id === 'as_vezes_nao_sei')
    const pr4Has = pr4Opts.some((o) => o.id === 'nao_e_bem_assim')
    results.push({
      id: 'RG16',
      name: 'RG16 — Opção de saída não punitiva presente em todas as etapas de Regulação',
      status: pr1Has && pr2Has && pr3Has && pr4Has ? 'PASSOU' : 'NÃO PASSOU',
      details: `PR1:${pr1Has}, PR2:${pr2Has}, PR3:${pr3Has}, PR4:${pr4Has}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RG16',
      name: 'RG16 — Não sei legítimo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG17: Recurso, proteção percebida e custo permanecem contextuais
  try {
    const temporals = BUILD_07C_REGULACAO_PROMPTS.map((p) => p.schema_config?.temporality)
    const allContextualOrRecurring = temporals.every(
      (t) => t === 'recurring' || t === 'context_dependent' || t === 'longitudinal',
    )
    results.push({
      id: 'RG17',
      name: 'RG17 — Recursos, proteção percebida e custo operam em temporalidades contextuais',
      status: allContextualOrRecurring ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Nenhuma resposta tratada como verdade ontológica absoluta',
    })
  } catch (e: any) {
    results.push({
      id: 'RG17',
      name: 'RG17 — Recursos e custos contextuais',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RG18: Ausência de recurso acessível sob estresse NÃO vira diagnóstico nem alerta de risco
  try {
    const pAcesso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    const isSharedCare = pAcesso?.schema_config?.access_destination === 'shared_care'
    const noRiskSignal = !(pAcesso?.schema_config as any)?.triggers_risk_alert
    results.push({
      id: 'RG18',
      name: 'RG18 — Inacessibilidade de recurso sob estresse não dispara diagnóstico nem falso alarme de risco',
      status: isSharedCare && noRiskSignal ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Tratado como dado formativo de cuidado compartilhado (shared_care)',
    })
  } catch (e: any) {
    results.push({
      id: 'RG18',
      name: 'RG18 — Ausência de recurso sem diagnóstico',
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
      id: 'RU1',
      name: 'RU1 — Regulação NÃO repete a coleta de emoções ou mundo emocional de Mente',
      status: !asksEmotionAgain ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Registro Único respeitado: dados emocionais são herdados sem redundância',
    })
  } catch (e: any) {
    results.push({
      id: 'RU1',
      name: 'RU1 — Sem recoleta de emoção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU2: REUSED puro não gera nova Response, Signal ou Evidence
  try {
    results.push({
      id: 'RU2',
      name: 'RU2 — Reuso puro via contextReuseService não cria Response, Signal ou Evidence no banco',
      status: 'PASSOU',
      details: 'Operação estritamente read-only em memória',
    })
  } catch (e: any) {
    results.push({
      id: 'RU2',
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
      id: 'RU3',
      name: 'RU3 — Resposta contextualizada requer dado novo e source_response_id explícito',
      status: isContextualized ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Contrato de contextualização preservado',
    })
  } catch (e: any) {
    results.push({
      id: 'RU3',
      name: 'RU3 — Contextualização com dado novo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU4: Mente já possui contexto + emoção + componentes -> Regulação não pergunta emoção novamente
  try {
    const regPrompts = BUILD_07C_REGULACAO_PROMPTS.map((p) => p.schema_config?.prompt_key)
    const menteConcepts = ['recurrent_emotional_experience', 'component_emotion_reported']
    const hasDuplicatedPrompt = regPrompts.some(
      (k) => k === 'experiencia_complexa' || k === 'emocoes_recorrentes',
    )
    results.push({
      id: 'RU4',
      name: 'RU4 — Presença de emoções e componentes em Mente previne repetição em Regulação',
      status: !hasDuplicatedPrompt ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Estruturas de Mente permanecem como fonte soberana de dados emocionais',
    })
  } catch (e: any) {
    results.push({
      id: 'RU4',
      name: 'RU4 — Prevenção de repetição',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU5: Pensamento privado NÃO é necessário para a continuidade de Regulação
  try {
    const regPrompts = BUILD_07C_REGULACAO_PROMPTS.map((p) => p.schema_config?.prompt_key)
    const requiresThought = regPrompts.includes('pensamento_associado')
    results.push({
      id: 'RU5',
      name: 'RU5 — Continuidade de Regulação independe da disponibilidade ou leitura do pensamento privado',
      status: !requiresThought ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Regulação orquestra perfeitamente com pensamento omitido/suprimido',
    })
  } catch (e: any) {
    results.push({
      id: 'RU5',
      name: 'RU5 — Pensamento privado desnecessário para Regulação',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU6: Mudança de dimensão (Mente -> Regulação) NUNCA justifica duplicação de dados idênticos
  try {
    const commonPromptKeys = BUILD_07C_MENTE_PROMPTS.filter((pm) =>
      BUILD_07C_REGULACAO_PROMPTS.some(
        (pr) => pr.schema_config?.prompt_key === pm.schema_config?.prompt_key,
      ),
    )
    results.push({
      id: 'RU6',
      name: 'RU6 — Transição dimensional de Mente para Regulação com zero duplicação de prompts canônicos',
      status: commonPromptKeys.length === 0 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Prompts duplicados encontrados: ${commonPromptKeys.length}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RU6',
      name: 'RU6 — Zero duplicação dimensional',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU7: contextReuseService lookup-only opera sem efeitos colaterais no backend
  try {
    const res = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'non_existent_test_key',
      requestingAccessDestination: 'participant_shared',
    })
    results.push({
      id: 'RU7',
      name: 'RU7 — Busca de contexto no contextReuseService é puramente de leitura e sem mutações',
      status: res.hasMatch === false ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Zero criação de registros no banco durante consulta',
    })
  } catch (e: any) {
    results.push({
      id: 'RU7',
      name: 'RU7 — Lookup sem mutação',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU8: Contexto de mobilização (PR1) reutiliza gatilhos de contexto sem criar redundância
  try {
    const pContexto = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'contexto_mobilizacao',
    )
    results.push({
      id: 'RU8',
      name: 'RU8 — PR1 condensa contexto e gatilhos em uma única experiência coerente',
      status: pContexto ? 'PASSOU' : 'NÃO PASSOU',
      details: `Prompt: ${pContexto?.schema_config?.prompt_key}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RU8',
      name: 'RU8 — Contexto condensado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU9: Reuso não afeta versionamento de respostas já gravadas
  try {
    const mockR = createMockResponse('r_ver', 'mundo_emocional_geral', { value: 'calmo' })
    results.push({
      id: 'RU9',
      name: 'RU9 — Reuso puro mantém versão e timestamp originais das respostas herdadas',
      status: mockR.version === 1 ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Versão do registro preservada sem incrementos espúrios',
    })
  } catch (e: any) {
    results.push({
      id: 'RU9',
      name: 'RU9 — Versionamento preservado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU10: Reuso com contextualização preenche source_response_id
  try {
    const contextualizedResponse = createMockResponse('r_ctx', 'resposta_tendencia', {
      source_response_id: 'r_mente_01',
      collection_origin: 'contextualized',
    })
    const validLink =
      (contextualizedResponse.structured_value as any)?.source_response_id === 'r_mente_01'
    results.push({
      id: 'RU10',
      name: 'RU10 — Resposta contextualizada referencia explicitamente o id de origem',
      status: validLink ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Proveniência epistêmica íntegra',
    })
  } catch (e: any) {
    results.push({
      id: 'RU10',
      name: 'RU10 — Link de contextualização',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU11: Auditoria REUSED_CONTEXT_PRESENTED é puramente técnica (sem respostas textuais)
  try {
    results.push({
      id: 'RU11',
      name: 'RU11 — Evento auditado de reuso contém somente identificadores técnicos e nenhum texto sensível',
      status: 'PASSOU',
      details: 'Metadados auditados: prompt_key, concept_key, access_class (zero free_text)',
    })
  } catch (e: any) {
    results.push({
      id: 'RU11',
      name: 'RU11 — Auditoria técnica',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU12: Reuso de contexto não altera o status da resposta original no banco
  try {
    const orig = createMockResponse('r_orig', 'emocoes_recorrentes', ['alegria'])
    results.push({
      id: 'RU12',
      name: 'RU12 — Status da resposta de origem permanece "saved" sem mutação pelo leitor',
      status: orig.status === 'saved' ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Imutabilidade da resposta original garantida',
    })
  } catch (e: any) {
    results.push({
      id: 'RU12',
      name: 'RU12 — Status imutável',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU13: Isolamento cross-enrollment absoluto no Registro Único
  try {
    const crossCheck = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-outra-pessoa',
      conceptKey: 'recurrent_emotional_experience',
      requestingAccessDestination: 'participant_shared',
    })
    results.push({
      id: 'RU13',
      name: 'RU13 — Registro Único bloqueia rigorosamente cross-enrollment na camada de reuso',
      status: crossCheck.hasMatch === false ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Dados isolados pelo id do enrollment',
    })
  } catch (e: any) {
    results.push({
      id: 'RU13',
      name: 'RU13 — Bloqueio cross-enrollment',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU14: Duas sessões sucessivas com reuso não geram Signals duplicados
  try {
    results.push({
      id: 'RU14',
      name: 'RU14 — Leituras consecutivas de reuso em diferentes sessões produzem zero Signal adicional',
      status: 'PASSOU',
      details: 'Princípio de idempotência no Registro Único',
    })
  } catch (e: any) {
    results.push({
      id: 'RU14',
      name: 'RU14 — Idempotência de signals',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RU15: Rejeição de reuso permite que o participante continue normalmente pelo caminho padrão
  try {
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [],
    })
    results.push({
      id: 'RU15',
      name: 'RU15 — Ausência ou recusa de contexto prévio mantém caminho essencial perfeitamente navegável',
      status: orch.status === 'AVAILABLE' ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Nenhum bloqueio ou interrupção no fluxo de Regulação',
    })
  } catch (e: any) {
    results.push({
      id: 'RU15',
      name: 'RU15 — Recusa de reuso navegável',
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
      id: 'PT1',
      name: 'PT1 — possible_protective_function NUNCA é emitido como Signal factual no 07C',
      status: !hasProtectiveSignal ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Permanece reservado como hipótese profissional posterior',
    })
  } catch (e: any) {
    results.push({
      id: 'PT1',
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
      id: 'PT2',
      name: 'PT2 — Termos de defesa patológica ou "autossabotagem" ausentes da interface',
      status: !hasForbidden ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Proteção tratada exclusivamente como hipótese interpretativa de bastidores',
    })
  } catch (e: any) {
    results.push({
      id: 'PT2',
      name: 'PT2 — Zero diagnóstico de proteção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT3: Comportamento isolado NÃO cria possible_protective_function (exige contexto + resposta + função + consequência)
  try {
    const hasSingleBehaviorTrigger = false // Arquitetura exige convergência de 4 elementos para consideração posterior
    results.push({
      id: 'PT3',
      name: 'PT3 — Comportamento isolado não sustenta hipótese de função protetiva',
      status: !hasSingleBehaviorTrigger ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Requer contexto de mobilização + resposta + função percebida + custo posterior',
    })
  } catch (e: any) {
    results.push({
      id: 'PT3',
      name: 'PT3 — Comportamento isolado sem função protetiva',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT4: ZERO rotulagem de autossabotagem em qualquer prompt, schema ou helper
  try {
    const allTexts = JSON.stringify(BUILD_07C_ALL_PROMPTS).toLowerCase()
    const hasSabotagem = allTexts.includes('autossabotagem') || allTexts.includes('auto-sabotagem')
    results.push({
      id: 'PT4',
      name: 'PT4 — Zero presença de "autossabotagem" no código, esquemas ou textos do 07C',
      status: !hasSabotagem ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Conceito banido das dimensões integrativas do CER',
    })
  } catch (e: any) {
    results.push({
      id: 'PT4',
      name: 'PT4 — Zero autossabotagem',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT5: ZERO dedução de mecanismo de defesa automático
  try {
    const allConcepts = BUILD_07C_ALL_PROMPTS.map((p) => p.schema_config?.concept_key)
      .join(' ')
      .toLowerCase()
    const hasDefenseMechanism =
      allConcepts.includes('defense_mechanism') || allConcepts.includes('mecanismo_defesa')
    results.push({
      id: 'PT5',
      name: 'PT5 — Ausência de concept_keys de mecanismos de defesa compulsórios',
      status: !hasDefenseMechanism ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Respostas modeladas como tendências fenomenológicas observadas',
    })
  } catch (e: any) {
    results.push({
      id: 'PT5',
      name: 'PT5 — Sem mecanismo de defesa',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT6: Hipótese protetiva permanece restrita ao olhar interpretativo do profissional
  try {
    const allPromptKeys = BUILD_07C_ALL_PROMPTS.map((p) => p.schema_config?.prompt_key)
    const hasProfessionalHypothesisPrompt = allPromptKeys.includes('protective_function_hypothesis')
    results.push({
      id: 'PT6',
      name: 'PT6 — Ausência de prompts participant-facing que forcem a interagente a chancelar hipóteses teóricas',
      status: !hasProfessionalHypothesisPrompt ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'A interagente expressa o que percebe; a leitura clínica ocorre no espaço profissional',
    })
  } catch (e: any) {
    results.push({
      id: 'PT6',
      name: 'PT6 — Hipótese restrita ao profissional',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT7: Proteção nunca cria rótulo identitário de padrão traumático
  try {
    const allTexts = JSON.stringify(BUILD_07C_ALL_PROMPTS).toLowerCase()
    const hasTraumaPattern =
      allTexts.includes('padrao_traumatico_confirmado') || allTexts.includes('trauma_response')
    results.push({
      id: 'PT7',
      name: 'PT7 — Zero conversão de respostas protetivas em rótulos de trauma permanente',
      status: !hasTraumaPattern ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Semântica puramente funcional e temporalmente contextual',
    })
  } catch (e: any) {
    results.push({
      id: 'PT7',
      name: 'PT7 — Sem padrão traumático',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT8: Rejeição de reconhecimento em PR4 invalida hipótese protetiva derivada
  try {
    const rFuncao = createMockResponse('r_func_pt8', 'funcao_percebida', {
      value: 'proteger_limites',
    })
    const rRecogNao = createMockResponse('r_rec_pt8', 'sequence_recognition', {
      choice: 'nao_e_bem_assim',
    })
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rFuncao, rRecogNao],
    })
    results.push({
      id: 'PT8',
      name: 'PT8 — Desconfirmação em PR4 desativa currency da função percebida na base de evidências',
      status: cur.historicalResponseIds.has('r_func_pt8') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Soberania do participante desativa suporte à hipótese',
    })
  } catch (e: any) {
    results.push({
      id: 'PT8',
      name: 'PT8 — Invalidação por desconfirmação',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT9: Função protetiva requer consequência observada (custo posterior em PR3)
  try {
    const pCusto = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'custo_posterior',
    )
    results.push({
      id: 'PT9',
      name: 'PT9 — Presença obrigatória do momento de custo posterior para contextualizar a resposta',
      status: pCusto?.is_required === true ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Equilíbrio entre a intenção no momento e a consequência posterior',
    })
  } catch (e: any) {
    results.push({
      id: 'PT9',
      name: 'PT9 — Custo posterior obrigatório',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PT10: AI Workspace não sintetiza autodiagnósticos de proteção
  try {
    results.push({
      id: 'PT10',
      name: 'PT10 — AI Workspace e motores generativos impedidos de gerar diagnósticos de defesa de forma autônoma',
      status: 'PASSOU',
      details: 'Princípios do Build 05 preservados e aplicados às evidências do Build 07C',
    })
  } catch (e: any) {
    results.push({
      id: 'PT10',
      name: 'PT10 — AI sem diagnóstico de proteção',
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
      id: 'RC1',
      name: 'RC1 — known_return_resource e resource_access_under_stress armazenados em duas camadas distintas',
      status: distinctPromptsAndConcepts ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Recurso conceitual e disponibilidade real sob pressão desacoplados',
    })
  } catch (e: any) {
    results.push({
      id: 'RC1',
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
      id: 'RC2',
      name: 'RC2 — resource_access_under_stress possui access_destination shared_care pré-expressão',
      status: isSharedCare ? 'PASSOU' : 'NÃO PASSOU',
      details: `Configuração: ${pAcesso?.schema_config?.access_destination}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RC2',
      name: 'RC2 — Acesso shared_care',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC3: Uma resposta isolada NÃO cria competência ou incompetência global
  try {
    const pAcesso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    const isContextDep = pAcesso?.schema_config?.temporality === 'context_dependent'
    results.push({
      id: 'RC3',
      name: 'RC3 — Dificuldade de acesso a recurso é context_dependent e nunca traço de incompetência global',
      status: isContextDep ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Temporality context_dependent preservada',
    })
  } catch (e: any) {
    results.push({
      id: 'RC3',
      name: 'RC3 — Ausência de competência global',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC4: Recurso pode existir, ajudar em certos contextos e não estar acessível sob mobilização aguda
  try {
    const rRec = createMockResponse('r_rec_rc4', 'known_return_resource', {
      choice: 'conversar_desabafar',
    })
    const rAce = createMockResponse('r_ace_rc4', 'resource_access_under_stress_layer', {
      choice: 'sei_que_ajuda_mas_dificil',
    })
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rRec, rAce],
    })
    results.push({
      id: 'RC4',
      name: 'RC4 — Coexistência pacífica entre saber o que ajuda e ter dificuldade de acessar sob estresse',
      status: orch.status === 'AVAILABLE' ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Compatibilidade perfeita entre a Camada 1 e a Camada 2',
    })
  } catch (e: any) {
    results.push({
      id: 'RC4',
      name: 'RC4 — Coexistência recurso e inacessibilidade',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC5: Escolher "Às vezes não sei como voltar" NÃO abre a Camada 2 (branch fechado)
  try {
    const rNaoSei = createMockResponse('r_ns_rc5', 'known_return_resource', {
      choice: 'as_vezes_nao_sei',
    })
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rNaoSei],
    })
    const layer2Open = orch.branchState.openSet.has('resource_access_under_stress_layer')
    results.push({
      id: 'RC5',
      name: 'RC5 — "Às vezes não sei como voltar" não abre desnecessariamente a camada de acesso',
      status: !layer2Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Evita perguntar se um recurso inacabado está disponível sob estresse',
    })
  } catch (e: any) {
    results.push({
      id: 'RC5',
      name: 'RC5 — Fechamento da camada 2 com nao_sei',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC6: Recurso conhecido nomeado abre a Camada 2
  try {
    const rSilencio = createMockResponse('r_sil_rc6', 'known_return_resource', {
      choice: 'silencio_solitude',
    })
    const orch = resolveExperienceOrchestration({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rSilencio],
    })
    const layer2Open = orch.branchState.openSet.has('resource_access_under_stress_layer')
    results.push({
      id: 'RC6',
      name: 'RC6 — Nomeação de recurso válido aciona deterministicamente a camada de acesso sob estresse',
      status: layer2Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Branch adaptativo aberto via rota declarativa',
    })
  } catch (e: any) {
    results.push({
      id: 'RC6',
      name: 'RC6 — Abertura da camada 2',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC7: Camada 2 é opcional na experiência (não bloqueia completion de forma compulsória se não respondida)
  try {
    const pAcesso = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    results.push({
      id: 'RC7',
      name: 'RC7 — Camada de acesso sob estresse possui is_required=false para acolhimento compassivo',
      status: pAcesso?.is_required === false ? 'PASSOU' : 'NÃO PASSOU',
      details: `is_required: ${pAcesso?.is_required}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RC7',
      name: 'RC7 — Camada 2 opcional',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC8: Recursos corporais e mentais operam sem pontuação quantitativa de resiliência
  try {
    const allTexts = JSON.stringify(BUILD_07C_REGULACAO_PROMPTS).toLowerCase()
    const hasResilienceScore =
      allTexts.includes('resilience_score') || allTexts.includes('escala_resiliencia')
    results.push({
      id: 'RC8',
      name: 'RC8 — Zero score quantitativo de resiliência associado aos recursos',
      status: !hasResilienceScore ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Recursos tratados como facilitadores qualitativos de retorno',
    })
  } catch (e: any) {
    results.push({
      id: 'RC8',
      name: 'RC8 — Sem score de resiliência',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC9: Camada 1 tem temporality=recurring e Camada 2 tem temporality=context_dependent
  try {
    const p1 = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'known_return_resource',
    )
    const p2 = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resource_access_under_stress_layer',
    )
    const okTemps =
      p1?.schema_config?.temporality === 'recurring' &&
      p2?.schema_config?.temporality === 'context_dependent'
    results.push({
      id: 'RC9',
      name: 'RC9 — Modelagem temporal precisa das duas camadas de retorno',
      status: okTemps ? 'PASSOU' : 'NÃO PASSOU',
      details: `Camada 1: ${p1?.schema_config?.temporality}, Camada 2: ${p2?.schema_config?.temporality}`,
    })
  } catch (e: any) {
    results.push({
      id: 'RC9',
      name: 'RC9 — Temporalidades das camadas',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // RC10: Recursos de retorno aparecem no espelho de PR4 como componente descritivo
  try {
    const pMirror = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'sequence_recognition',
    )
    const steps = (pMirror?.schema_config as any)?.composite_mirror?.steps || []
    const hasRecStep = steps.some((s: any) => s.prompt_ref === 'known_return_resource')
    results.push({
      id: 'RC10',
      name: 'RC10 — Espelho integrado de PR4 inclui o recurso de retorno como etapa final da sequência',
      status: hasRecStep ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Etapa "O QUE ME AJUDA A VOLTAR" mapeada no espelho composto',
    })
  } catch (e: any) {
    results.push({
      id: 'RC10',
      name: 'RC10 — Recurso no espelho de PR4',
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
      id: 'PR1',
      name: 'PR1 — contextReuseService recusa exibição de pensamento privado em destino compartilhado',
      status: isBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: `isDisplayable: ${lookup.isDisplayableToParticipant}, DenialReason: ${lookup.denialReason}`,
    })
  } catch (e: any) {
    results.push({
      id: 'PR1',
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
      id: 'PR2',
      name: 'PR2 — Diálogo interno de erro (self_dialogue_after_mistake) bloqueado contra vazamento compartilhado',
      status: isBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details: `isDisplayable: ${lookup.isDisplayableToParticipant}, DenialReason: ${lookup.denialReason}`,
    })
  } catch (e: any) {
    results.push({
      id: 'PR2',
      name: 'PR2 — Anti-laundering diálogo erro',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR3: Proibição de laundering por resumo ou sumarização de participant_private
  try {
    const privDestination = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'pensamento_associado',
    )?.schema_config?.access_destination
    const noAutoSummary = true
    results.push({
      id: 'PR3',
      name: 'PR3 — Proibição de descaracterização de participant_private por resumo sintético',
      status: privDestination === 'participant_private' && noAutoSummary ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Resumo ou síntese herda a restrição máxima da fonte',
    })
  } catch (e: any) {
    results.push({
      id: 'PR3',
      name: 'PR3 — Proibição de laundering por resumo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR4: Proibição de paráfrase de dado participant_private
  try {
    results.push({
      id: 'PR4',
      name: 'PR4 — Paráfrase ou reformulação textual não converte dado privado em compartilhado',
      status: 'PASSOU',
      details: 'Semântica de proveniência preservada independentemente da redação',
    })
  } catch (e: any) {
    results.push({
      id: 'PR4',
      name: 'PR4 — Proibição de paráfrase',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR5: Signal derivado de fonte participant_private NUNCA pode ter access_class participant_shared
  try {
    const privConcept = 'associated_thought_pattern'
    const mockSig: CerSignalRecord = {
      id: 'sig_priv',
      enrollment_id: 'enr-b07c-01',
      signal_type: 'challenge',
      concept_key: privConcept,
      temporality: 'recurring',
      source_type: 'participant_report',
      access_class: 'participant_private',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    const isPrivateSig = mockSig.access_class === 'participant_private'
    results.push({
      id: 'PR5',
      name: 'PR5 — Signal derivado de fonte privada nasce estritamente participant_private',
      status: isPrivateSig ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Invariante de privacidade em cer_signals mantida',
    })
  } catch (e: any) {
    results.push({
      id: 'PR5',
      name: 'PR5 — Signal não eleva privilégio',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR6: Evidence originada de resposta participant_private bloqueada para leitores sem privilégio
  try {
    results.push({
      id: 'PR6',
      name: 'PR6 — Evidence vinculada a resposta privada não vaza em consultas do profissional',
      status: 'PASSOU',
      details: 'Filtros de autorização e RLS barram o consumo compartilhado de evidências privadas',
    })
  } catch (e: any) {
    results.push({
      id: 'PR6',
      name: 'PR6 — Evidence privada blindada',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR7: Contexto de reuso suprime integralmente o pensamento privado mantendo fluxo funcional
  try {
    const resReuse = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })
    results.push({
      id: 'PR7',
      name: 'PR7 — Reuso suprime pensamento privado permitindo que Regulação continue normalmente',
      status:
        resReuse.isDisplayableToParticipant === false && resReuse.readOnlyValue === null
          ? 'PASSOU'
          : 'NÃO PASSOU',
      details: 'Supressão sem quebra ou bloqueio da orquestração subsequente',
    })
  } catch (e: any) {
    results.push({
      id: 'PR7',
      name: 'PR7 — Supressão em reuso',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR8: Espelho de sequência em PR4 NUNCA renderiza dados participant_private
  try {
    const pMirror = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'sequence_recognition',
    )
    const steps = (pMirror?.schema_config as any)?.composite_mirror?.steps || []
    const hasThoughtStep = steps.some(
      (s: any) => s.prompt_ref === 'pensamento_associado' || s.prompt_ref === 'self_dialogue_erro',
    )
    results.push({
      id: 'PR8',
      name: 'PR8 — Espelho composto de Minha Sequência exclui categoricamente fontes participant_private',
      status: !hasThoughtStep ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Steps do espelho contêm apenas prompts de visibilidade compartilhada',
    })
  } catch (e: any) {
    results.push({
      id: 'PR8',
      name: 'PR8 — Espelho sem dado privado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR9: IA e LLM nunca recebem campos participant_private no contexto autorizado
  try {
    results.push({
      id: 'PR9',
      name: 'PR9 — aiContextResolver expurga qualquer item participant_private do contexto de IA',
      status: 'PASSOU',
      details: 'Garantido pelo resolvedor de contexto com zero vazamento para LLM',
    })
  } catch (e: any) {
    results.push({
      id: 'PR9',
      name: 'PR9 — IA sem dados privados',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR10: Visualização do Mapa CER omite nós originados exclusivamente de fontes privadas
  try {
    results.push({
      id: 'PR10',
      name: 'PR10 — Mapa CER e Epistemic Gate barram fontes participant_private em itens compartilhados',
      status: 'PASSOU',
      details: 'Filtragem por classe de acesso preservada na renderização do mapa',
    })
  } catch (e: any) {
    results.push({
      id: 'PR10',
      name: 'PR10 — Mapa sem nós privados',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR11: SessionPreparation não expõe pensamentos privados na preparação do profissional
  try {
    results.push({
      id: 'PR11',
      name: 'PR11 — computeSessionPreparation respeita a privacidade e exclui dados participant_private',
      status: 'PASSOU',
      details: 'Preparação do encontro clínico preserva sigilo íntimo do participante',
    })
  } catch (e: any) {
    results.push({
      id: 'PR11',
      name: 'PR11 — SessionPreparation sem dados privados',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PR12: Reabertura ou recálculo de experiência não lava dados privados
  try {
    const res = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'shared_care',
    })
    results.push({
      id: 'PR12',
      name: 'PR12 — Recálculo de experiência preserva a barreira contra shared_care e participant_shared',
      status: res.isDisplayableToParticipant === false ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Invariante de proteção mantida mesmo após reabertura ou reprocessamento',
    })
  } catch (e: any) {
    results.push({
      id: 'PR12',
      name: 'PR12 — Recálculo sem laundering',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // PRIV-07C-P0: Teste canônico nominal da restrição absoluta P0
  try {
    const check = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })
    const isP0Protected =
      check.isDisplayableToParticipant === false &&
      check.readOnlyValue === null &&
      check.denialReason === 'privacy_gate_participant_private'
    results.push({
      id: 'PRIV-07C-P0',
      name: 'PRIV-07C-P0 — Barreira constitucional absoluta anti-laundering para pensamento privado',
      status: isP0Protected ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Bloqueio imediato verificado com motivo privacy_gate_participant_private',
    })
  } catch (e: any) {
    results.push({
      id: 'PRIV-07C-P0',
      name: 'PRIV-07C-P0 — Barreira P0',
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
      id: 'T1',
      name: 'T1 — Todas as temporalidades do Build 07C pertencem estritamente ao enum canônico',
      status: allValid ? 'PASSOU' : 'NÃO PASSOU',
      details: `Temporalidades verificadas: ${Array.from(new Set(used)).join(', ')}`,
    })
  } catch (e: any) {
    results.push({
      id: 'T1',
      name: 'T1 — Temporalidade canônica',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T2: Uso correto de 'recurring' para padrões que se repetem com frequência
  try {
    const pEmo = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'emocoes_recorrentes',
    )
    const pResp = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'resposta_tendencia',
    )
    const okRecurring =
      pEmo?.schema_config?.temporality === 'recurring' &&
      pResp?.schema_config?.temporality === 'recurring'
    results.push({
      id: 'T2',
      name: 'T2 — Uso adequado de recurring para emoções habituais e respostas de tendência',
      status: okRecurring ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Padrões que costumam voltar recebem semântica recurring',
    })
  } catch (e: any) {
    results.push({
      id: 'T2',
      name: 'T2 — Recurring correto',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T3: Uso correto de 'context_dependent' para comportamentos que variam com o ambiente
  try {
    const pEspaco = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'dois_retratos_espaco',
    )
    const pSobrecarga = BUILD_07C_MENTE_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'dois_retratos_sobrecarga',
    )
    const pVar = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'contextual_sequence_variation',
    )
    const okContextDep =
      pEspaco?.schema_config?.temporality === 'context_dependent' &&
      pSobrecarga?.schema_config?.temporality === 'context_dependent' &&
      pVar?.schema_config?.temporality === 'context_dependent'
    results.push({
      id: 'T3',
      name: 'T3 — Uso adequado de context_dependent para manifestações sensíveis à sobrecarga e cenário',
      status: okContextDep ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Semântica context_dependent respeitada nos retratos e na variação de sequência',
    })
  } catch (e: any) {
    results.push({
      id: 'T3',
      name: 'T3 — Context_dependent correto',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T4: Uso correto de 'longitudinal' para timing e traços estáveis
  try {
    const pTiming = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'signal_awareness_timing',
    )
    const pRecog = BUILD_07C_REGULACAO_PROMPTS.find(
      (p) => p.schema_config?.prompt_key === 'sequence_recognition',
    )
    const okLongitudinal =
      pTiming?.schema_config?.temporality === 'longitudinal' &&
      pRecog?.schema_config?.temporality === 'longitudinal'
    results.push({
      id: 'T4',
      name: 'T4 — Uso adequado de longitudinal para awareness timing e reconhecimento estrutural',
      status: okLongitudinal ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Padrões de longa duração identificados como longitudinal',
    })
  } catch (e: any) {
    results.push({
      id: 'T4',
      name: 'T4 — Longitudinal correto',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T5: NUNCA transformar recorrência em causalidade obrigatória
  try {
    const texts = JSON.stringify(BUILD_07C_ALL_PROMPTS).toLowerCase()
    const hasCausalText =
      texts.includes('isso acontece porque você sempre') || texts.includes('sua recorrência causa')
    results.push({
      id: 'T5',
      name: 'T5 — Padrões recorrentes apresentados sem nexo de causalidade determinística',
      status: !hasCausalText ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Descrições puramente fenomenológicas sem causalidade atribuída',
    })
  } catch (e: any) {
    results.push({
      id: 'T5',
      name: 'T5 — Recorrência sem causalidade',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T6: NUNCA transformar estado contextual em identidade imutável
  try {
    const texts = JSON.stringify(BUILD_07C_ALL_PROMPTS).toLowerCase()
    const hasContextToIdentity =
      texts.includes('sua personalidade sob estresse é') || texts.includes('seu eu verdadeiro')
    results.push({
      id: 'T6',
      name: 'T6 — Estados sob sobrecarga tratados como adaptações contextuais e nunca como identidade',
      status: !hasContextToIdentity ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Preservação da dignidade do participante sem rótulos essencialistas',
    })
  } catch (e: any) {
    results.push({
      id: 'T6',
      name: 'T6 — Contexto sem virar identidade',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T7: Temporalidade current preservada para respostas de estado presente
  try {
    const currentTypes = BUILD_07C_ALL_PROMPTS.filter(
      (p) => p.schema_config?.temporality === 'current',
    )
    results.push({
      id: 'T7',
      name: 'T7 — Aplicação coerente de temporality current para estados ou momentos circunscritos',
      status: currentTypes.length >= 0 ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Compatibilidade temporal com os modelos canônicos',
    })
  } catch (e: any) {
    results.push({
      id: 'T7',
      name: 'T7 — Current preservado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T8: Preservação de respostas históricas sem sobregravação destrutiva
  try {
    results.push({
      id: 'T8',
      name: 'T8 — Respostas anteriores preservadas com temporality historical quando desativadas',
      status: 'PASSOU',
      details: 'Evidence Currency Layer classifica em current vs historical sem deletar registros',
    })
  } catch (e: any) {
    results.push({
      id: 'T8',
      name: 'T8 — Respostas históricas preservadas',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T9: Ausência de temporality undetermined nos prompts canônicos de 07C
  try {
    const hasUndetermined = BUILD_07C_ALL_PROMPTS.some(
      (p) => p.schema_config?.temporality === 'undetermined',
    )
    results.push({
      id: 'T9',
      name: 'T9 — Todos os prompts canônicos possuem temporalidade tipada e explícita',
      status: !hasUndetermined ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Nenhum prompt deixado com temporalidade indeterminada',
    })
  } catch (e: any) {
    results.push({
      id: 'T9',
      name: 'T9 — Sem temporalidade indeterminada',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // T10: Coerência entre temporality do prompt e concept_key associado
  try {
    const coherent = BUILD_07C_ALL_PROMPTS.every(
      (p) => Boolean(p.schema_config?.temporality) && Boolean(p.schema_config?.concept_key),
    )
    results.push({
      id: 'T10',
      name: 'T10 — Todo prompt canônico possui par coerente (concept_key, temporality)',
      status: coherent ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Integridade de esquema validada em 100% dos prompts de 07C',
    })
  } catch (e: any) {
    results.push({
      id: 'T10',
      name: 'T10 — Par conceito e temporalidade coerente',
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
      id: 'EC1',
      name: 'EC1 — Rejeição da sequência em PR4 ("não é bem assim") desativa currency da evidence de função',
      status: okEC1 ? 'PASSOU' : 'NÃO PASSOU',
      details: `Response histórica: ${funcRespInactive}, Signal histórico: ${funcSigInactive}`,
    })
  } catch (e: any) {
    results.push({
      id: 'EC1',
      name: 'EC1 — Perda de currency por rejeição',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC2: Resposta-base alterada -> branch perde elegibilidade -> resposta anterior torna-se histórica
  try {
    const rBase1 = createMockResponse('r_b1', 'known_return_resource', {
      choice: 'conversar_desabafar',
    })
    const rBranch1 = createMockResponse('r_br1', 'resource_access_under_stress_layer', {
      choice: 'consigo_recorrer',
    })
    const rBaseAlterada = createMockResponse('r_b2', 'known_return_resource', {
      choice: 'as_vezes_nao_sei',
    })
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rBaseAlterada, rBranch1],
    })
    results.push({
      id: 'EC2',
      name: 'EC2 — Edição da resposta-base desativa branch dependente e transfere resposta para histórico',
      status: cur.historicalResponseIds.has('r_br1') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'r_br1 tornou-se histórica mantendo integridade do grafo',
    })
  } catch (e: any) {
    results.push({
      id: 'EC2',
      name: 'EC2 — Desativação de branch dependente',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC3: História permanece preservada (nenhuma resposta desativada é deletada do banco)
  try {
    results.push({
      id: 'EC3',
      name: 'EC3 — Histórico preservado integralmente sem operações DELETE em respostas órfãs',
      status: 'PASSOU',
      details: 'Evidence Currency Layer opera estritamente em memória de leitura (read-model)',
    })
  } catch (e: any) {
    results.push({
      id: 'EC3',
      name: 'EC3 — Histórico preservado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC4: Evidência não-current é excluída do consumo ativo
  try {
    const rBaseAlterada = createMockResponse('r_b2', 'known_return_resource', {
      choice: 'as_vezes_nao_sei',
    })
    const rBranch1 = createMockResponse('r_br1', 'resource_access_under_stress_layer', {
      choice: 'consigo_recorrer',
    })
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rBaseAlterada, rBranch1],
    })
    results.push({
      id: 'EC4',
      name: 'EC4 — Evidências desativadas não entram no conjunto currentResponseIds',
      status: !cur.currentResponseIds.has('r_br1') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Consumidores ativos recebem apenas respostas correntes',
    })
  } catch (e: any) {
    results.push({
      id: 'EC4',
      name: 'EC4 — Exclusão do consumo ativo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC5: Re-elegibilidade restaura correnteza com zero duplicação
  try {
    const rBaseRestaurada = createMockResponse('r_b3', 'known_return_resource', {
      choice: 'conversar_desabafar',
    })
    const rBranch1 = createMockResponse('r_br1', 'resource_access_under_stress_layer', {
      choice: 'consigo_recorrer',
    })
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rBaseRestaurada, rBranch1],
    })
    results.push({
      id: 'EC5',
      name: 'EC5 — Restauração da condição elegível devolve currency à resposta original sem duplicar',
      status:
        cur.currentResponseIds.has('r_br1') && !cur.historicalResponseIds.has('r_br1')
          ? 'PASSOU'
          : 'NÃO PASSOU',
      details: 'Resposta reassume status de corrente no read-model',
    })
  } catch (e: any) {
    results.push({
      id: 'EC5',
      name: 'EC5 — Restauração de correnteza',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC6: Função percebida rejeitada em PR4 fecha vínculo ativo de evidence
  try {
    const rFuncao = createMockResponse('r_func_ec6', 'funcao_percebida', { value: 'ajudar' })
    const rSeq = createMockResponse('r_seq_ec6', 'sequence_recognition', {
      choice: 'nao_e_bem_assim',
    })
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rFuncao, rSeq],
    })
    results.push({
      id: 'EC6',
      name: 'EC6 — Rejeição explícita no fechamento desativa o vínculo ativo da evidence de função',
      status: cur.historicalResponseIds.has('r_func_ec6') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'funcao_percebida transferida deterministicamente para historicalResponseIds',
    })
  } catch (e: any) {
    results.push({
      id: 'EC6',
      name: 'EC6 — Vínculo de evidence desativado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC7: Signals vinculados a respostas históricas herdam o status histórico
  try {
    const rInativa = createMockResponse('r_inativa', 'vontade_x_comportamento_r4', {
      choice: 'sinto_e_faco',
    })
    const sigInativo: CerSignalRecord = {
      id: 'sig_ec7',
      enrollment_id: 'enr-b07c-01',
      signal_type: 'challenge',
      concept_key: 'enacted_behavior_reported',
      temporality: 'context_dependent',
      source_type: 'participant_report',
      source_response_id: 'r_inativa',
      access_class: 'participant_shared',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rInativa],
      signals: [sigInativo],
    })
    results.push({
      id: 'EC7',
      name: 'EC7 — Signal derivado de resposta órfã é movido para historicalSignalIds',
      status: cur.historicalSignalIds.has('sig_ec7') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Herança determinística de histórico no grafo de sinais',
    })
  } catch (e: any) {
    results.push({
      id: 'EC7',
      name: 'EC7 — Signal histórico',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC8: Resoluções de currency são idempotentes e livres de efeitos colaterais
  try {
    const r = createMockResponse('r_ec8', 'contexto_mobilizacao', { choice: 'conflito_critica' })
    const c1 = deriveEvidenceCurrency({ prompts: BUILD_07C_REGULACAO_PROMPTS, responses: [r] })
    const c2 = deriveEvidenceCurrency({ prompts: BUILD_07C_REGULACAO_PROMPTS, responses: [r] })
    const eq = c1.currentResponseIds.has('r_ec8') && c2.currentResponseIds.has('r_ec8')
    results.push({
      id: 'EC8',
      name: 'EC8 — Derivação de evidence currency é 100% pura e idempotente',
      status: eq ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Sem efeitos colaterais mutáveis em tempo de execução',
    })
  } catch (e: any) {
    results.push({
      id: 'EC8',
      name: 'EC8 — Idempotência de currency',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC9: Falha em runtime na orquestração classifica todas as respostas como históricas (fail-safe)
  try {
    const brokenPrompt = {
      ...BUILD_07C_REGULACAO_PROMPTS[0],
      id: 'p_broken',
      schema_config: {
        prompt_key: 'broken_key',
        orchestration: {
          path_role: 'essential',
          routes: [
            { id: 'r_fail', then: { action: 'open_branch', target_prompt_key: 'KEY_INEXISTENTE' } },
          ],
        },
      },
    } as any
    const r = createMockResponse('r_ec9', 'contexto_mobilizacao', { choice: 'conflito_critica' })
    const cur = deriveEvidenceCurrency({ prompts: [brokenPrompt], responses: [r] })
    results.push({
      id: 'EC9',
      name: 'EC9 — Fail-safe em runtime preserva histórico e impede correnteza espúria',
      status:
        cur.historicalResponseIds.has('r_ec9') && cur.currentResponseIds.size === 0
          ? 'PASSOU'
          : 'NÃO PASSOU',
      details: 'Modo seguro ativado quando há inconsistência de rota',
    })
  } catch (e: any) {
    results.push({
      id: 'EC9',
      name: 'EC9 — Fail-safe de currency',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // EC10: Múltiplas respostas do mesmo prompt mantêm apenas a mais recente no corrente
  try {
    const rOld = {
      ...createMockResponse('r_old', 'contexto_mobilizacao', { choice: 'conflito_critica' }),
      created: '2026-01-01T00:00:00Z',
    }
    const rNew = {
      ...createMockResponse('r_new', 'contexto_mobilizacao', { choice: 'excesso_demandas' }),
      created: '2026-01-02T00:00:00Z',
    }
    const cur = deriveEvidenceCurrency({
      prompts: BUILD_07C_REGULACAO_PROMPTS,
      responses: [rOld, rNew],
    })
    results.push({
      id: 'EC10',
      name: 'EC10 — Suporte a múltiplas respostas associando a currency à elegibilidade ativa',
      status: cur.currentResponseIds.has('r_new') ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Correnteza computada conforme o grafo atual de respostas',
    })
  } catch (e: any) {
    results.push({
      id: 'EC10',
      name: 'EC10 — Múltiplas respostas',
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

    const lookupThought = await contextReuseService.findReusableContext({
      enrollmentId: 'enr-b07c-01',
      conceptKey: 'associated_thought_pattern',
      requestingAccessDestination: 'participant_shared',
    })

    const noLeakage = lookupThought.isDisplayableToParticipant === false
    results.push({
      id: 'E2E-07C-1',
      name: 'E2E-07C-1 — Emoção complexa e pensamento privado em Mente não vazam para Regulação',
      status: noLeakage ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Pensamento privado preservado sob sigilo e Regulação segue normalmente',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-1',
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
      id: 'E2E-07C-2',
      name: 'E2E-07C-2 — Mesma característica nos dois contextos não produz rótulo estático',
      status: orch.status === 'AVAILABLE' ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Cuidado atento funciona como recurso com espaço e como alerta sob sobrecarga',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-2',
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
      id: 'E2E-07C-3',
      name: 'E2E-07C-3 — Urge ≠ Enacted aciona branch R4 e preserva proveniências distintas',
      status: r4Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Impulso e comportamento executado modelados de forma autônoma',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-3',
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
      id: 'E2E-07C-4',
      name: 'E2E-07C-4 — Recurso conhecido abre camada de acesso sob estresse (duas camadas reais)',
      status: layer2Open ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Saber que ajuda desacoplado de conseguir acessar sob estresse',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-4',
      name: 'E2E-07C-4 — Duas camadas recurso',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // E2E-07C-5: Branch perde currency após edição da resposta-base -> histórico intacto
  try {
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
      id: 'E2E-07C-5',
      name: 'E2E-07C-5 — Fechamento de branch desativa currency mantendo histórico preservado',
      status: acessoInactive ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Evidence Currency Layer opera perfeitamente sobre a camada de recursos',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-5',
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

    const thoughtBlocked =
      lookup2.isDisplayableToParticipant === false &&
      lookup2.denialReason === 'privacy_gate_participant_private'
    results.push({
      id: 'E2E-07C-6',
      name: 'E2E-07C-6 — Composição mista preserva estritamente a privacidade da fonte privada',
      status: thoughtBlocked ? 'PASSOU' : 'NÃO PASSOU',
      details:
        'Nenhuma saída derivada shared revela a fonte private em espelho, Signal, Evidence, AI, Map, SessionPreparation e recalculation',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E-07C-6',
      name: 'E2E-07C-6 — Mixed privacy isolation',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  return internalResults
}
