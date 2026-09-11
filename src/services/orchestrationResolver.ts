/**
 * Build 07A — Experience Orchestration Resolver
 * Serviço puro, determinístico e testável para orquestração experiencial no CER V1.
 *
 * Responsabilidades:
 * 1. Calcular prompts elegíveis (essential path + adaptive branches ativados - skip_set).
 * 2. Calcular branchState idempotentemente a partir das respostas do enrollment.
 * 3. Next prompt determinístico & avanço automático de órfãos.
 * 4. Completion check com resolução estrita de branches obrigatórios abertos.
 * 5. Fail-Safe de Runtime: ORCHESTRATION_UNAVAILABLE com reason_code, sem degradação linear.
 * 6. Evidence Currency Layer: derivação determinística em read-model de respostas e evidências correntes.
 */

import pb from '@/lib/pocketbase/client'
import type {
  CerPromptRecord,
  ExperienceResponseRecord,
  OrchestrationConfig,
  OrchestrationRoute,
  OrchestrationCondition,
  CerSignalRecord,
  CerKnowledgeItemRecord,
  CerAssociationRecord,
} from '@/types/cer'

export const FAILSAFE_MICROCOPY =
  'Não conseguimos continuar esta experiência agora. O que você já respondeu está preservado.'

export type OrchestrationFailReason =
  | 'MISSING_PROMPT_KEY'
  | 'TARGET_KEY_NOT_FOUND'
  | 'LOOP_DETECTED'
  | 'UNRESOLVED_FALLBACK'
  | 'INVALID_ORCHESTRATION_SCHEMA'
  | 'UNKNOWN'

export interface OrchestrationResult {
  status: 'AVAILABLE' | 'ORCHESTRATION_UNAVAILABLE'
  reasonCode?: OrchestrationFailReason
  errorMessage?: string
  displayMessage?: string
  // Dados derivados quando status === 'AVAILABLE'
  eligiblePrompts: CerPromptRecord[]
  nextPrompt: CerPromptRecord | null
  currentStepIndex: number
  totalEligibleCount: number
  currentEligibleStepNumber: number
  isCompleted: boolean
  branchState: {
    openSet: Set<string>
    skipSet: Set<string>
    visitedKeys: string[]
  }
}

/**
 * Normaliza o prompt_key estável do prompt
 */
export function getPromptKey(prompt: CerPromptRecord): string {
  const schema = (prompt.schema_config || {}) as Record<string, unknown>
  if (
    schema.prompt_key &&
    typeof schema.prompt_key === 'string' &&
    schema.prompt_key.trim() !== ''
  ) {
    return schema.prompt_key.trim()
  }
  return prompt.id
}

/**
 * Normaliza configuração de orquestração do prompt
 */
export function getPromptOrchestration(prompt: CerPromptRecord): OrchestrationConfig {
  const schema = (prompt.schema_config || {}) as Record<string, unknown>
  const orch = (schema.orchestration || {}) as OrchestrationConfig
  return {
    path_role: orch.path_role || 'essential',
    requires_branch_open: orch.requires_branch_open ?? orch.path_role === 'adaptive',
    routes: Array.isArray(orch.routes) ? orch.routes : [],
    fallback: orch.fallback,
  }
}

/**
 * Avalia uma condição de orquestração contra uma resposta e contexto do enrollment
 */
export function evaluateCondition(
  cond: OrchestrationCondition,
  response: ExperienceResponseRecord | undefined,
  existingConceptKeys: Set<string> = new Set(),
): boolean {
  if (!cond) return false

  // Operador concept_key_exists (reuso ou registro único no enrollment)
  if (cond.operator === 'concept_key_exists' && cond.concept_key) {
    return existingConceptKeys.has(cond.concept_key)
  }

  if (!response) return false

  const structVal = response.structured_value as any
  let extractedVal: any = structVal

  // Se cond.field especificado
  if (cond.field && structVal && typeof structVal === 'object') {
    extractedVal = structVal[cond.field]
  }

  // Operador contains
  if (cond.operator === 'contains') {
    if (Array.isArray(extractedVal)) {
      return extractedVal.includes(cond.value)
    }
    if (typeof extractedVal === 'string' && typeof cond.value === 'string') {
      return extractedVal.includes(cond.value)
    }
    if (extractedVal && typeof extractedVal === 'object' && cond.value) {
      if (extractedVal.selectedOptionId === cond.value) return true
      if (extractedVal.value === cond.value) return true
      if (extractedVal.choice === cond.value) return true
      if (extractedVal.id === cond.value) return true
    }
    return false
  }

  // Operador equals (default)
  const op = cond.operator || 'equals'
  if (op === 'equals') {
    if (cond.field === 'selected_count_gte') {
      const arr = Array.isArray(extractedVal)
        ? extractedVal
        : Array.isArray(structVal?.value)
          ? structVal.value
          : Array.isArray(structVal?.choice)
            ? structVal.choice
            : []
      return arr.length >= Number(cond.value)
    }

    if (cond.field === 'has_dual_overlap') {
      return Boolean(extractedVal || structVal?.has_dual_overlap)
    }

    if (cond.field === 'urge_different_from_enacted') {
      return Boolean(extractedVal || structVal?.urge_different_from_enacted)
    }

    if (extractedVal === cond.value) return true
    if (structVal && typeof structVal === 'object') {
      if (structVal.selectedOptionId === cond.value) return true
      if (structVal.value === cond.value) return true
      if (structVal.choice === cond.value) return true
      if (structVal.id === cond.value) return true
      if (structVal.skip_reason === cond.value) return true
      // Se structured_value for array (ex.: MultiSelectCards) e o cond.value estiver contido
      if (Array.isArray(structVal) && structVal.includes(cond.value)) return true
      if (Array.isArray(structVal.value) && structVal.value.includes(cond.value)) return true
      if (Array.isArray(structVal.choice) && structVal.choice.includes(cond.value)) return true
    }
    if (typeof structVal === 'string' && structVal === cond.value) {
      return true
    }
  }

  return false
}

/**
 * Avalia uma rota de orquestração
 */
export function evaluateRoute(
  route: OrchestrationRoute,
  response: ExperienceResponseRecord | undefined,
  existingConceptKeys: Set<string> = new Set(),
): boolean {
  if (!route.when) return true

  const { any_of, all_of } = route.when

  if (any_of && any_of.length > 0) {
    const matchedAny = any_of.some((c) => evaluateCondition(c, response, existingConceptKeys))
    if (!matchedAny) return false
  }

  if (all_of && all_of.length > 0) {
    const matchedAll = all_of.every((c) => evaluateCondition(c, response, existingConceptKeys))
    if (!matchedAll) return false
  }

  return true
}

/**
 * Emite evento de auditoria mínimo caso a orquestração quebre em runtime
 */
export async function auditRuntimeInvalid(params: {
  actorUserId?: string
  enrollmentId: string
  experienceId: string
  promptVersion?: number
  reasonCode: string
}) {
  try {
    await pb.collection('audit_events').create({
      actor_user_id: params.actorUserId || null,
      action: 'ORCHESTRATION_RUNTIME_INVALID',
      resource_type: 'experience_orchestration',
      resource_id: params.experienceId,
      enrollment_id: params.enrollmentId,
      timestamp: new Date().toISOString(),
      result: 'failure',
      request_context: 'runtime_orchestration_resolver',
      metadata: {
        reason_code: params.reasonCode,
        prompt_version: params.promptVersion || 1,
      },
    })
  } catch {
    // Fail-safe: auditoria não derruba o fluxo
  }
}

/**
 * ORCHESTRATION RESOLVER
 * Função pura e determinística principal
 */
export function resolveExperienceOrchestration(params: {
  prompts: CerPromptRecord[]
  responses: ExperienceResponseRecord[]
  currentStepOrder?: number
  existingConceptKeys?: Set<string>
}): OrchestrationResult {
  const { prompts, responses, currentStepOrder = 1, existingConceptKeys = new Set() } = params

  if (!prompts || prompts.length === 0) {
    return {
      status: 'AVAILABLE',
      eligiblePrompts: [],
      nextPrompt: null,
      currentStepIndex: 0,
      totalEligibleCount: 0,
      currentEligibleStepNumber: 1,
      isCompleted: true,
      branchState: { openSet: new Set(), skipSet: new Set(), visitedKeys: [] },
    }
  }

  // 1. Ordenação canônica por step_order e prompt_order
  const sortedPrompts = [...prompts].sort((a, b) => {
    if (a.step_order !== b.step_order) return a.step_order - b.step_order
    return (a.prompt_order || 1) - (b.prompt_order || 1)
  })

  // Mapear por prompt_key e id
  const promptByKey = new Map<string, CerPromptRecord>()
  const promptById = new Map<string, CerPromptRecord>()
  const promptKeysList: string[] = []

  for (const p of sortedPrompts) {
    const key = getPromptKey(p)
    if (promptByKey.has(key)) {
      // Prompt_key duplicado na mesma versão -> Falha de validação!
      return {
        status: 'ORCHESTRATION_UNAVAILABLE',
        reasonCode: 'MISSING_PROMPT_KEY',
        errorMessage: `prompt_key duplicado detectado: ${key}`,
        displayMessage: FAILSAFE_MICROCOPY,
        eligiblePrompts: [],
        nextPrompt: null,
        currentStepIndex: 0,
        totalEligibleCount: 0,
        currentEligibleStepNumber: 1,
        isCompleted: false,
        branchState: { openSet: new Set(), skipSet: new Set(), visitedKeys: [] },
      }
    }
    promptByKey.set(key, p)
    promptById.set(p.id, p)
    promptKeysList.push(key)
  }

  // Mapear respostas por prompt_id e por prompt_key
  const responseByPromptId = new Map<string, ExperienceResponseRecord>()
  const responseByPromptKey = new Map<string, ExperienceResponseRecord>()
  for (const r of responses) {
    responseByPromptId.set(r.prompt_id, r)
    const prompt = promptById.get(r.prompt_id)
    if (prompt) {
      responseByPromptKey.set(getPromptKey(prompt), r)
    }
  }

  // 2. Validação antecipada de integridade do Grafo de Rotas
  // Alvos inexistentes ou ciclos
  for (const p of sortedPrompts) {
    const orch = getPromptOrchestration(p)
    for (const r of orch.routes || []) {
      const target = r.then.target_prompt_key
      if (target && !promptByKey.has(target)) {
        return {
          status: 'ORCHESTRATION_UNAVAILABLE',
          reasonCode: 'TARGET_KEY_NOT_FOUND',
          errorMessage: `target_prompt_key inexistente: ${target}`,
          displayMessage: FAILSAFE_MICROCOPY,
          eligiblePrompts: [],
          nextPrompt: null,
          currentStepIndex: 0,
          totalEligibleCount: 0,
          currentEligibleStepNumber: 1,
          isCompleted: false,
          branchState: { openSet: new Set(), skipSet: new Set(), visitedKeys: [] },
        }
      }
    }
    if (orch.fallback && orch.fallback.target_prompt_key) {
      const fallbackTarget = orch.fallback.target_prompt_key
      if (!promptByKey.has(fallbackTarget)) {
        return {
          status: 'ORCHESTRATION_UNAVAILABLE',
          reasonCode: 'UNRESOLVED_FALLBACK',
          errorMessage: `fallback target inexistente: ${fallbackTarget}`,
          displayMessage: FAILSAFE_MICROCOPY,
          eligiblePrompts: [],
          nextPrompt: null,
          currentStepIndex: 0,
          totalEligibleCount: 0,
          currentEligibleStepNumber: 1,
          isCompleted: false,
          branchState: { openSet: new Set(), skipSet: new Set(), visitedKeys: [] },
        }
      }
    }
  }

  // 3. Avaliar branchState na ordem das respostas dadas
  const openSet = new Set<string>()
  const skipSet = new Set<string>()
  const visitedKeys: string[] = []
  const visitCount = new Map<string, number>()

  for (const prompt of sortedPrompts) {
    const key = getPromptKey(prompt)
    const resp = responseByPromptKey.get(key)
    const orch = getPromptOrchestration(prompt)

    // Se o prompt foi respondido, avaliar suas rotas
    if (resp) {
      const visits = (visitCount.get(key) || 0) + 1
      visitCount.set(key, visits)
      if (visits > 1) {
        // Segundo encontro do mesmo prompt respondido -> Loop detectado!
        return {
          status: 'ORCHESTRATION_UNAVAILABLE',
          reasonCode: 'LOOP_DETECTED',
          errorMessage: `Loop detectado: prompt_key visitado mais de uma vez (${key})`,
          displayMessage: FAILSAFE_MICROCOPY,
          eligiblePrompts: [],
          nextPrompt: null,
          currentStepIndex: 0,
          totalEligibleCount: 0,
          currentEligibleStepNumber: 1,
          isCompleted: false,
          branchState: { openSet, skipSet, visitedKeys },
        }
      }
      visitedKeys.push(key)

      // Avaliar rotas em ordem declarada
      let routeExecuted = false
      for (const route of orch.routes || []) {
        if (evaluateRoute(route, resp, existingConceptKeys)) {
          const action = route.then.action
          const target = route.then.target_prompt_key

          if (action === 'open_branch') {
            openSet.add(target)
            routeExecuted = true
            break
          } else if (action === 'skip_branch') {
            skipSet.add(target)
            routeExecuted = true
            break
          } else if (action === 'goto') {
            // goto pode saltar ou ativar caminho
            routeExecuted = true
            break
          }
        }
      }

      // Se nenhuma rota disparou e existe fallback
      if (!routeExecuted && orch.fallback) {
        if (orch.fallback.action === 'open_branch') {
          openSet.add(orch.fallback.target_prompt_key)
        } else if (orch.fallback.action === 'skip_branch') {
          skipSet.add(orch.fallback.target_prompt_key)
        }
      }
    }
  }

  // 3.5. Avaliar Regras de Convergência Determinística (ex.: Branch Observacional de Ama — Build 07B)
  // Mínimo de 2 categorias distintas current/confirmed.
  // Contribuintes aprovados:
  // 1. peso/lentidão recorrente pós-refeição (post_meal_heaviness_recurrence)
  // 2. 2+ reações pós-refeição distintas recorrentes (post_meal_reactions)
  // 3. alteração recorrente de eliminação (elimination_recurrent_pattern)
  // 4. sensação relatada de digestão incompleta na narrativa da refeição
  // 5. lentidão/embotamento/cansaço acordando cansada (sleep_heaviness)
  const amaContributors = new Set<string>()

  // Verificar respostas dadas para computar categorias ativas
  const posReacoesResp = responseByPromptKey.get('refeicao_pos_reacoes_a5')
  if (posReacoesResp) {
    const sVal = posReacoesResp.structured_value as any
    const choices: string[] = Array.isArray(sVal)
      ? sVal
      : Array.isArray(sVal?.value)
        ? sVal.value
        : Array.isArray(sVal?.choice)
          ? sVal.choice
          : []

    if (choices.includes('peso_lentidao')) {
      amaContributors.add('cat_post_meal_heaviness')
    }
    if (choices.filter((c) => c !== 'peso_lentidao').length >= 2) {
      amaContributors.add('cat_multiple_post_meal_reactions')
    }
    if (choices.includes('digestao_incompleta')) {
      amaContributors.add('cat_incomplete_digestion')
    }
  }

  const eliminacaoResp = responseByPromptKey.get('refeicao_eliminacao_a6')
  if (eliminacaoResp) {
    const sVal = eliminacaoResp.structured_value as any
    const val =
      sVal?.choice ||
      sVal?.value ||
      sVal?.selectedOptionId ||
      (typeof sVal === 'string' ? sVal : '')
    if (val === 'lento_pesado' || val === 'muito_oscilante') {
      amaContributors.add('cat_elimination_irregularity')
    }
  }

  const descansoResp = responseByPromptKey.get('descanso_status')
  if (descansoResp) {
    const sVal = descansoResp.structured_value as any
    const val =
      sVal?.choice ||
      sVal?.value ||
      sVal?.selectedOptionId ||
      (typeof sVal === 'string' ? sVal : '')
    if (val === 'acorda_cansado') {
      amaContributors.add('cat_morning_heaviness')
    }
  }

  // Convergência Ama: mínimo de 2 categorias distintas ativas
  const hasAmaConvergence = amaContributors.size >= 2
  if (hasAmaConvergence) {
    openSet.add('ama_observacao_lingua')
    openSet.add('ama_observacao_peso_matinal')
  }

  // 3.6. Regras de Orquestração do Build 07C:
  // a) PM1: emocoes_recorrentes com 2+ emoções selecionadas -> abre emocoes_espaco_expressao_branch
  const emocoesRecResp = responseByPromptKey.get('emocoes_recorrentes')
  if (emocoesRecResp) {
    const sVal = emocoesRecResp.structured_value as any
    const list = Array.isArray(sVal)
      ? sVal
      : Array.isArray(sVal?.value)
        ? sVal.value
        : Array.isArray(sVal?.choice)
          ? sVal.choice
          : []
    if (list.length >= 2) {
      openSet.add('emocoes_espaco_expressao_branch')
    }
  }

  // b) PM3: Sobreposição entre mente_movimento_ajuda e mente_movimento_cansa -> abre mente_movimento_profundidade_branch
  const ajudaResp = responseByPromptKey.get('mente_movimento_ajuda')
  const cansaResp = responseByPromptKey.get('mente_movimento_cansa')
  if (ajudaResp && cansaResp) {
    const getItems = (r: ExperienceResponseRecord) => {
      const v = r.structured_value as any
      return Array.isArray(v)
        ? v
        : Array.isArray(v?.value)
          ? v.value
          : Array.isArray(v?.choice)
            ? v.choice
            : []
    }
    const ajudaItems = getItems(ajudaResp)
    const cansaItems = getItems(cansaResp)
    const hasOverlap = ajudaItems.some(
      (item: string) => item !== 'nenhuma_especial' && cansaItems.includes(item),
    )
    if (hasOverlap) {
      openSet.add('mente_movimento_profundidade_branch')
    }
  }

  // c) PR2: resposta_tendencia com urge ≠ enacted não claro -> abre vontade_x_comportamento_r4
  const respTendencia = responseByPromptKey.get('resposta_tendencia')
  if (respTendencia) {
    const sVal = respTendencia.structured_value as any
    if (sVal?.urge_different_from_enacted === true) {
      openSet.add('vontade_x_comportamento_r4')
    }
  }

  // d) PR3: known_return_resource com recurso nomeado -> abre resource_access_under_stress_layer
  const recursoResp = responseByPromptKey.get('known_return_resource')
  if (recursoResp) {
    const sVal = recursoResp.structured_value as any
    const ch =
      sVal?.choice ||
      sVal?.value ||
      sVal?.selectedOptionId ||
      (typeof sVal === 'string' ? sVal : '')
    if (ch && ch !== 'as_vezes_nao_sei' && ch !== 'nao_sei') {
      openSet.add('resource_access_under_stress_layer')
    }
  }

  // 4. Calcular conjunto de prompts elegíveis
  // Regra: prompt ∉ skip_set ∧ (path_role === 'essential' ∨ key ∈ open_set)
  const eligiblePrompts: CerPromptRecord[] = []
  for (const prompt of sortedPrompts) {
    const key = getPromptKey(prompt)
    const orch = getPromptOrchestration(prompt)

    if (skipSet.has(key)) {
      continue
    }

    if (orch.path_role === 'essential') {
      eligiblePrompts.push(prompt)
    } else if (orch.path_role === 'adaptive') {
      if (openSet.has(key)) {
        eligiblePrompts.push(prompt)
      }
    }
  }

  // 5. Completion Check e Próximo Prompt
  // Completion exige:
  // - Todos os prompts elegíveis essenciais estarem ANSWERED ou legitimamente recusados
  // - Branches abertos (open_set) precisam ter todas as suas etapas elegíveis respondidas (não podem ter pendência aberta)
  let nextPrompt: CerPromptRecord | null = null
  let currentStepIndex = 0

  // Encontrar o primeiro prompt elegível com step_order >= currentStepOrder que NÃO esteja respondido
  // Se o currentStepOrder apontar para um órfão (não elegível), avançar automaticamente
  const pendingPrompts = eligiblePrompts.filter((p) => !responseByPromptKey.has(getPromptKey(p)))

  if (pendingPrompts.length > 0) {
    // Buscar o primeiro pendente com step_order >= currentStepOrder
    const forwardPending = pendingPrompts.find((p) => p.step_order >= currentStepOrder)
    nextPrompt = forwardPending || pendingPrompts[0]
  } else {
    nextPrompt = null
  }

  const isCompleted = pendingPrompts.length === 0

  // Se houver próximo prompt, determinar seu índice no array elegível
  if (nextPrompt) {
    currentStepIndex = eligiblePrompts.findIndex((p) => p.id === nextPrompt!.id)
    if (currentStepIndex === -1) currentStepIndex = 0
  } else {
    currentStepIndex = Math.max(0, eligiblePrompts.length - 1)
  }

  return {
    status: 'AVAILABLE',
    eligiblePrompts,
    nextPrompt,
    currentStepIndex,
    totalEligibleCount: eligiblePrompts.length,
    currentEligibleStepNumber: currentStepIndex + 1,
    isCompleted,
    branchState: {
      openSet,
      skipSet,
      visitedKeys,
    },
  }
}

/**
 * EVIDENCE CURRENCY LAYER
 * Derivação determinística em read-model do conjunto de evidências e respostas correntes.
 *
 * Uma resposta é CORRENTE se e somente se:
 * - O prompt que a originou pertence ao grafo de prompts elegíveis da versão atual da experiência.
 *
 * Um Signal ou Evidence derivado é CORRENTE se:
 * - Sua source_response_id pertencer ao conjunto de respostas correntes derivadas.
 */
export interface EvidenceCurrencyResult {
  currentResponseIds: Set<string>
  historicalResponseIds: Set<string>
  currentSignalIds: Set<string>
  historicalSignalIds: Set<string>
}

export function deriveEvidenceCurrency(params: {
  prompts: CerPromptRecord[]
  responses: ExperienceResponseRecord[]
  signals?: CerSignalRecord[]
  currentStepOrder?: number
  existingConceptKeys?: Set<string>
}): EvidenceCurrencyResult {
  const {
    prompts,
    responses,
    signals = [],
    currentStepOrder = 1,
    existingConceptKeys = new Set(),
  } = params

  const orch = resolveExperienceOrchestration({
    prompts,
    responses,
    currentStepOrder,
    existingConceptKeys,
  })

  // Se a orquestração falhar em runtime, nenhuma evidência nova vira corrente (preserva histórico)
  if (orch.status !== 'AVAILABLE') {
    return {
      currentResponseIds: new Set(),
      historicalResponseIds: new Set(responses.map((r) => r.id)),
      currentSignalIds: new Set(),
      historicalSignalIds: new Set(signals.map((s) => s.id)),
    }
  }

  const eligiblePromptIds = new Set(orch.eligiblePrompts.map((p) => p.id))
  const currentResponseIds = new Set<string>()
  const historicalResponseIds = new Set<string>()

  // Build 07C: Se sequence_recognition for "não é bem assim", a evidence de função perde currency
  let functionRejectedInSequence = false
  // Build 07D: Se resposta ao afastamento ou reparação não abrir branch, branches anteriores perdem currency
  for (const resp of responses) {
    const p = prompts.find((pr) => pr.id === resp.prompt_id)
    const pKey = p ? getPromptKey(p) : ''
    if (pKey === 'sequence_recognition') {
      const sVal = resp.structured_value as any
      const choice =
        sVal?.choice ||
        sVal?.value ||
        sVal?.selectedOptionId ||
        (typeof sVal === 'string' ? sVal : '')
      if (choice === 'nao_e_bem_assim') {
        functionRejectedInSequence = true
      }
    }
  }

  for (const resp of responses) {
    const p = prompts.find((pr) => pr.id === resp.prompt_id)
    const pKey = p ? getPromptKey(p) : ''

    if (eligiblePromptIds.has(resp.prompt_id)) {
      // Se a participante rejeitou a sequência em PR4 ("não é bem assim"), a resposta de função perde currency
      if (functionRejectedInSequence && pKey === 'funcao_percebida') {
        historicalResponseIds.add(resp.id)
      } else {
        currentResponseIds.add(resp.id)
      }
    } else {
      historicalResponseIds.add(resp.id)
    }
  }

  const currentSignalIds = new Set<string>()
  const historicalSignalIds = new Set<string>()

  for (const sig of signals) {
    if (!sig.source_response_id) {
      // Signal não originado de resposta individual (ex: observação profissional em sessão)
      currentSignalIds.add(sig.id)
    } else if (currentResponseIds.has(sig.source_response_id)) {
      // Se a função foi rejeitada na sequência e o signal for sobre a função percebida, perde currency
      if (
        functionRejectedInSequence &&
        (sig.concept_key === 'perceived_response_function' ||
          sig.concept_key === 'perceived_short_term_benefit')
      ) {
        historicalSignalIds.add(sig.id)
      } else {
        currentSignalIds.add(sig.id)
      }
    } else {
      // Originado de branch que não é mais elegível -> Mantido historicamente, mas fora do corrente
      historicalSignalIds.add(sig.id)
    }
  }
  return {
    currentResponseIds,
    historicalResponseIds,
    currentSignalIds,
    historicalSignalIds,
  }
}
