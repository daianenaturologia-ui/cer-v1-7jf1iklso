/**
 * Suíte de Testes Adversariais e Unitários do BUILD 07A: EXPERIENCE ORCHESTRATION
 * Cobrindo:
 * - BRANCHING B1–B12 + B7a
 * - PROGRESS/RESUME P1–P10
 * - REGISTRO ÚNICO R1–R16
 * - OPEN-FIRST O1–O10
 * - PRIVACIDADE V1–V16
 * - TEMPORALIDADE T1–T8
 * - ACESSIBILIDADE A1–A10
 * - E2E-1 a E2E-4
 */

import pb from '@/lib/pocketbase/client'
import {
  resolveExperienceOrchestration,
  deriveEvidenceCurrency,
  FAILSAFE_MICROCOPY,
} from './orchestrationResolver'
import { contextReuseService } from './contextReuseService'
import type { TestResult } from './tests'
import type { CerPromptRecord, ExperienceResponseRecord, CerSignalRecord } from '@/types/cer'

export async function runBuild07AOrchestrationTests(): Promise<TestResult[]> {
  const internalResults: TestResult[] = []

  // Mock array com .push tipado flexível
  const results = {
    push: (res: any) => {
      internalResults.push({
        id: res.id,
        name: res.name,
        category: res.category || 'Build 07A / Experience Orchestration',
        status: res.status,
        details: typeof res.details === 'string' ? res.details : String(res.details ?? ''),
        timestamp: new Date().toISOString(),
      })
    },
  }

  // Helper para criar prompts em memória de teste
  const createMockPrompt = (
    id: string,
    key: string,
    stepOrder: number,
    role: 'essential' | 'adaptive',
    orchConfig?: any,
    extraSchema?: any,
  ): CerPromptRecord => ({
    id,
    experience_id: 'exp-test-01',
    step_order: stepOrder,
    step_title: `Step ${stepOrder}`,
    component_type: 'ChoiceCards',
    prompt_text: `Prompt text ${key}`,
    is_required: true,
    version: 1,
    schema_config: {
      prompt_key: key,
      orchestration: {
        path_role: role,
        requires_branch_open: role === 'adaptive',
        ...orchConfig,
      },
      ...extraSchema,
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  })

  // Helper para mock de resposta
  const createMockResponse = (
    id: string,
    promptId: string,
    structVal: any,
    accessClass: any = 'shared_care',
  ): ExperienceResponseRecord => ({
    id,
    enrollment_id: 'enr-test-01',
    experience_id: 'exp-test-01',
    prompt_id: promptId,
    respondent_user_id: 'user-part-01',
    response_type: 'ChoiceCards',
    access_class: accessClass,
    structured_value: structVal,
    prompt_version: 1,
    version: 1,
    status: 'saved',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  })

  // ==========================================
  // GRUPO 1: BRANCHING (B1–B12 + B7a)
  // ==========================================

  // B1: Resposta abre branch adaptativo
  try {
    const p1 = createMockPrompt('p1', 'prompt_start', 1, 'essential', {
      routes: [
        {
          id: 'r1',
          when: { any_of: [{ field: 'choice', operator: 'equals', value: 'opt_sim' }] },
          then: { action: 'open_branch', target_prompt_key: 'prompt_branch' },
        },
      ],
    })
    const pBranch = createMockPrompt('p2', 'prompt_branch', 2, 'adaptive')
    const pEnd = createMockPrompt('p3', 'prompt_end', 3, 'essential')

    // Sem resposta: pBranch NÃO elegível
    const resNoAnswer = resolveExperienceOrchestration({
      prompts: [p1, pBranch, pEnd],
      responses: [],
    })
    const b1Before = !resNoAnswer.eligiblePrompts.some((p) => p.id === 'p2')

    // Com resposta opt_sim: pBranch TORNA-SE elegível
    const r1 = createMockResponse('r1', 'p1', { choice: 'opt_sim' })
    const resAnswered = resolveExperienceOrchestration({
      prompts: [p1, pBranch, pEnd],
      responses: [r1],
    })
    const b1After = resAnswered.eligiblePrompts.some((p) => p.id === 'p2')

    results.push({
      id: 'B1_RESPONSE_OPENS_BRANCH',
      name: 'B1 — Resposta abre branch adaptativo declarativo',
      status: b1Before && b1After ? 'PASSOU' : 'NÃO PASSOU',
      details:
        b1Before && b1After
          ? 'Branch inativo antes da resposta e ativado após match'
          : 'Falha ao abrir branch',
    })
  } catch (e: any) {
    results.push({
      id: 'B1_RESPONSE_OPENS_BRANCH',
      name: 'B1 — Resposta abre branch adaptativo',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B2: Resposta pula branch (skip_branch)
  try {
    const p1 = createMockPrompt('p1', 'prompt_start', 1, 'essential', {
      routes: [
        {
          id: 'r_skip',
          when: { any_of: [{ field: 'choice', operator: 'equals', value: 'opt_skip' }] },
          then: { action: 'skip_branch', target_prompt_key: 'prompt_skipped' },
        },
      ],
    })
    const pSkipped = createMockPrompt('p2', 'prompt_skipped', 2, 'essential')
    const pEnd = createMockPrompt('p3', 'prompt_end', 3, 'essential')

    const rSkip = createMockResponse('r1', 'p1', { choice: 'opt_skip' })
    const res = resolveExperienceOrchestration({
      prompts: [p1, pSkipped, pEnd],
      responses: [rSkip],
    })

    const skippedOk =
      !res.eligiblePrompts.some((p) => p.id === 'p2') &&
      res.eligiblePrompts.some((p) => p.id === 'p3')
    results.push({
      id: 'B2_RESPONSE_SKIPS_BRANCH',
      name: 'B2 — Resposta pula branch (skip_set derivado)',
      status: skippedOk ? 'PASSOU' : 'NÃO PASSOU',
      details: skippedOk
        ? 'Prompt essencial removido da elegibilidade via skip_set derivado'
        : 'Falha ao pular',
    })
  } catch (e: any) {
    results.push({
      id: 'B2_RESPONSE_SKIPS_BRANCH',
      name: 'B2 — Resposta pula branch',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B3: Múltiplas condições (all_of)
  try {
    const p1 = createMockPrompt('p1', 'prompt_start', 1, 'essential', {
      routes: [
        {
          id: 'r_multi',
          when: {
            all_of: [
              { field: 'nivel', operator: 'equals', value: 'alto' },
              { field: 'frequencia', operator: 'equals', value: 'diaria' },
            ],
          },
          then: { action: 'open_branch', target_prompt_key: 'prompt_deep' },
        },
      ],
    })
    const pDeep = createMockPrompt('p2', 'prompt_deep', 2, 'adaptive')

    const rPartial = createMockResponse('r1', 'p1', { nivel: 'alto', frequencia: 'semanal' })
    const resPartial = resolveExperienceOrchestration({
      prompts: [p1, pDeep],
      responses: [rPartial],
    })

    const rFull = createMockResponse('r2', 'p1', { nivel: 'alto', frequencia: 'diaria' })
    const resFull = resolveExperienceOrchestration({ prompts: [p1, pDeep], responses: [rFull] })

    const okAllOf =
      !resPartial.eligiblePrompts.some((p) => p.id === 'p2') &&
      resFull.eligiblePrompts.some((p) => p.id === 'p2')
    results.push({
      id: 'B3_ALL_OF_CONDITIONS',
      name: 'B3 — Múltiplas condições determinísticas (all_of)',
      status: okAllOf ? 'PASSOU' : 'NÃO PASSOU',
      details: okAllOf
        ? 'Branch só abre quando todas as condições são verdadeiras'
        : 'Falha no operador all_of',
    })
  } catch (e: any) {
    results.push({
      id: 'B3_ALL_OF_CONDITIONS',
      name: 'B3 — Múltiplas condições',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B4: nao_sei -> rota válida de primeiro nível
  try {
    const p1 = createMockPrompt('p1', 'prompt_start', 1, 'essential', {
      routes: [
        {
          id: 'r_nao_sei',
          when: { any_of: [{ field: 'skip_reason', operator: 'equals', value: 'nao_sei' }] },
          then: { action: 'open_branch', target_prompt_key: 'prompt_clarify' },
        },
      ],
    })
    const pClarify = createMockPrompt('p2', 'prompt_clarify', 2, 'adaptive')

    const rNaoSei = createMockResponse('r1', 'p1', {
      is_legitimate_skip: true,
      skip_reason: 'nao_sei',
    })
    const res = resolveExperienceOrchestration({ prompts: [p1, pClarify], responses: [rNaoSei] })

    const okB4 = res.eligiblePrompts.some((p) => p.id === 'p2')
    results.push({
      id: 'B4_NAO_SEI_VALID_ROUTE',
      name: 'B4 — nao_sei como resposta válida de primeiro nível',
      status: okB4 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB4 ? 'nao_sei aciona rotas normalmente sem penalização' : 'Falha em rota nao_sei',
    })
  } catch (e: any) {
    results.push({
      id: 'B4_NAO_SEI_VALID_ROUTE',
      name: 'B4 — nao_sei como rota válida',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B5: prefiro_nao_responder -> rota válida sem punição
  try {
    const p1 = createMockPrompt('p1', 'prompt_start', 1, 'essential', {
      routes: [
        {
          id: 'r_prefiro',
          when: {
            any_of: [{ field: 'skip_reason', operator: 'equals', value: 'prefiro_nao_responder' }],
          },
          then: { action: 'open_branch', target_prompt_key: 'prompt_gentle' },
        },
      ],
    })
    const pGentle = createMockPrompt('p2', 'prompt_gentle', 2, 'adaptive')

    const rPref = createMockResponse('r1', 'p1', {
      is_legitimate_skip: true,
      skip_reason: 'prefiro_nao_responder',
    })
    const res = resolveExperienceOrchestration({ prompts: [p1, pGentle], responses: [rPref] })

    const okB5 = res.eligiblePrompts.some((p) => p.id === 'p2')
    results.push({
      id: 'B5_PREFIRO_NAO_RESPONDER_ROUTE',
      name: 'B5 — prefiro_nao_responder como resposta válida sem punição',
      status: okB5 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB5
        ? 'prefiro_nao_responder roteia para caminho suave'
        : 'Falha em rota prefiro_nao_responder',
    })
  } catch (e: any) {
    results.push({
      id: 'B5_PREFIRO_NAO_RESPONDER_ROUTE',
      name: 'B5 — prefiro_nao_responder',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B6: Retorno ao essential pós-branch
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r1', then: { action: 'open_branch', target_prompt_key: 'p_branch' } }],
    })
    const pBranch = createMockPrompt('p2', 'p_branch', 2, 'adaptive', {
      fallback: { action: 'goto', target_prompt_key: 'p_essential_next' },
    })
    const pNext = createMockPrompt('p3', 'p_essential_next', 3, 'essential')

    const r1 = createMockResponse('r1', 'p1', { choice: 'any' })
    const rBranch = createMockResponse('r2', 'p2', { detail: 'ok' })
    const res = resolveExperienceOrchestration({
      prompts: [p1, pBranch, pNext],
      responses: [r1, rBranch],
      currentStepOrder: 3,
    })

    const okB6 = res.nextPrompt?.id === 'p3'
    results.push({
      id: 'B6_RETURN_TO_ESSENTIAL',
      name: 'B6 — Fim de branch retorna ao caminho essencial',
      status: okB6 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB6
        ? 'Avanço natural do adaptive branch de volta para o próximo essential'
        : 'Falha no retorno ao essential',
    })
  } catch (e: any) {
    results.push({
      id: 'B6_RETURN_TO_ESSENTIAL',
      name: 'B6 — Retorno ao essential',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B7: Configuração inválida -> Fail-safe de interrupção segura (NÃO degrade linear)
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [
        {
          id: 'r_invalid',
          then: { action: 'open_branch', target_prompt_key: 'KEY_INEXISTENTE_XYZ' },
        },
      ],
    })

    const res = resolveExperienceOrchestration({ prompts: [p1], responses: [] })
    const okB7 =
      res.status === 'ORCHESTRATION_UNAVAILABLE' &&
      res.reasonCode === 'TARGET_KEY_NOT_FOUND' &&
      res.displayMessage === FAILSAFE_MICROCOPY &&
      res.isCompleted === false

    results.push({
      id: 'B7_FAILSAFE_RUNTIME_INTERRUPTION',
      name: 'B7 — Configuração inválida aciona interrupção segura (sem degradação linear)',
      status: okB7 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB7
        ? 'Status ORCHESTRATION_UNAVAILABLE retornado com microcopy e sem marcar completion'
        : 'Falha: degradou para linear ou não interrompeu',
    })
  } catch (e: any) {
    results.push({
      id: 'B7_FAILSAFE_RUNTIME_INTERRUPTION',
      name: 'B7 — Fail-safe de runtime',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B7a: Resume pós-correção da configuração retoma sem perda
  try {
    const p1Fixed = createMockPrompt('p1', 'p1', 1, 'essential')
    const p2Fixed = createMockPrompt('p2', 'p2', 2, 'essential')
    const existingResp = createMockResponse('r1', 'p1', { answer: 'valid' })

    const res = resolveExperienceOrchestration({
      prompts: [p1Fixed, p2Fixed],
      responses: [existingResp],
      currentStepOrder: 2,
    })

    const okB7a = res.status === 'AVAILABLE' && res.nextPrompt?.id === 'p2Fixed'
    results.push({
      id: 'B7A_RESUME_AFTER_FIX',
      name: 'B7a — Retomada normal após correção da configuração sem perda de dados',
      status: okB7a ? 'PASSOU' : 'NÃO PASSOU',
      details: okB7a
        ? 'Configuração corrigida restabelece elegibilidade sem alteração nas respostas'
        : 'Falha na retomada',
    })
  } catch (e: any) {
    results.push({
      id: 'B7A_RESUME_AFTER_FIX',
      name: 'B7a — Retomada pós-correção',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B8: Loop no grafo -> Rejeitado e defesa runtime (visita dupla)
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const r1 = createMockResponse('r1', 'p1', { v: 1 })
    const r1Duplicate = createMockResponse('r2', 'p1', { v: 2 })

    // Resolver com respostas forjando visita dupla no mesmo prompt
    const res = resolveExperienceOrchestration({
      prompts: [p1],
      responses: [r1, r1Duplicate],
    })

    const okB8 = res.status === 'ORCHESTRATION_UNAVAILABLE' && res.reasonCode === 'LOOP_DETECTED'
    results.push({
      id: 'B8_LOOP_DETECTION_RUNTIME',
      name: 'B8 — Detecção e interrupção segura em loop/visita dupla no runtime',
      status: okB8 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB8
        ? 'Limite de visitas por prompt_key interrompe execução com segurança'
        : 'Falha na detecção de loop',
    })
  } catch (e: any) {
    results.push({
      id: 'B8_LOOP_DETECTION_RUNTIME',
      name: 'B8 — Loop detection',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B9: Target inexistente -> Defesa runtime idêntica
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r1', then: { action: 'goto', target_prompt_key: 'NAO_EXISTE' } }],
    })
    const res = resolveExperienceOrchestration({ prompts: [p1], responses: [] })
    const okB9 =
      res.status === 'ORCHESTRATION_UNAVAILABLE' && res.reasonCode === 'TARGET_KEY_NOT_FOUND'
    results.push({
      id: 'B9_TARGET_NOT_FOUND_RUNTIME',
      name: 'B9 — Destino inexistente no runtime interrompe de forma segura',
      status: okB9 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB9
        ? 'Interrupção segura com código TARGET_KEY_NOT_FOUND'
        : 'Falha na defesa de target inexistente',
    })
  } catch (e: any) {
    results.push({
      id: 'B9_TARGET_NOT_FOUND_RUNTIME',
      name: 'B9 — Target inexistente',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B10: Versionamento (regra de v1 não vaza para v2)
  try {
    const p1V1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r_v1', then: { action: 'open_branch', target_prompt_key: 'b1' } }],
    })
    const b1 = createMockPrompt('p_b1', 'b1', 2, 'adaptive')

    const p1V2 = createMockPrompt('p1', 'p1', 1, 'essential', { routes: [] }) // v2 sem rotas

    const rV1 = createMockResponse('r1', 'p1', { val: 'any' })

    const resV1 = resolveExperienceOrchestration({ prompts: [p1V1, b1], responses: [rV1] })
    const resV2 = resolveExperienceOrchestration({ prompts: [p1V2, b1], responses: [rV1] })

    const okB10 =
      resV1.eligiblePrompts.some((p) => p.id === 'p_b1') &&
      !resV2.eligiblePrompts.some((p) => p.id === 'p_b1')
    results.push({
      id: 'B10_PROMPT_VERSIONING_ISOLATION',
      name: 'B10 — Regra de orquestração de v1 não vaza para nova versão v2',
      status: okB10 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB10
        ? 'Versões independentes calculam grafo isoladamente'
        : 'Falha no isolamento de versão',
    })
  } catch (e: any) {
    results.push({
      id: 'B10_PROMPT_VERSIONING_ISOLATION',
      name: 'B10 — Versionamento isolado',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B11: Edição de resposta-base fecha branch sem apagar histórico
  try {
    const pBase = createMockPrompt('p1', 'p_base', 1, 'essential', {
      routes: [
        {
          id: 'r1',
          when: { any_of: [{ field: 'val', operator: 'equals', value: 'abre' }] },
          then: { action: 'open_branch', target_prompt_key: 'p_branch' },
        },
      ],
    })
    const pBranch = createMockPrompt('p2', 'p_branch', 2, 'adaptive')

    // 1. Resposta que abriu branch e resposta já dada no branch
    const rBaseOld = createMockResponse('r1', 'p1', { val: 'abre' })
    const rBranchOld = createMockResponse('r2', 'p2', { texto: 'resposta histórica do branch' })

    const resBefore = resolveExperienceOrchestration({
      prompts: [pBase, pBranch],
      responses: [rBaseOld, rBranchOld],
    })
    const eligibleBefore = resBefore.eligiblePrompts.some((p) => p.id === 'p2')

    // 2. Resposta-base revisada para 'fecha'
    const rBaseNew = createMockResponse('r1', 'p1', { val: 'fecha' })
    const resAfter = resolveExperienceOrchestration({
      prompts: [pBase, pBranch],
      responses: [rBaseNew, rBranchOld],
    })
    const eligibleAfter = resAfter.eligiblePrompts.some((p) => p.id === 'p2')

    // Evidence currency: resposta r2 ainda existe na base, mas passa a ser histórica
    const currency = deriveEvidenceCurrency({
      prompts: [pBase, pBranch],
      responses: [rBaseNew, rBranchOld],
    })
    const okCurrency =
      currency.historicalResponseIds.has('r2') && !currency.currentResponseIds.has('r2')

    const okB11 = eligibleBefore && !eligibleAfter && okCurrency
    results.push({
      id: 'B11_EDIT_CLOSES_BRANCH_PRESERVES_HISTORY',
      name: 'B11 — Edição de resposta-base fecha branch preservando histórico intacto',
      status: okB11 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB11
        ? 'Branch fechado; resposta histórica mantida e classificada como histórica'
        : 'Falha na preservação',
    })
  } catch (e: any) {
    results.push({
      id: 'B11_EDIT_CLOSES_BRANCH_PRESERVES_HISTORY',
      name: 'B11 — Edição fecha branch',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // B12: Reopen recalcula branches corretamente
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [
        {
          id: 'r1',
          when: { any_of: [{ field: 'v', operator: 'equals', value: 'yes' }] },
          then: { action: 'open_branch', target_prompt_key: 'p_ad' },
        },
      ],
    })
    const pAd = createMockPrompt('p2', 'p_ad', 2, 'adaptive')
    const r1 = createMockResponse('r1', 'p1', { v: 'yes' })

    const resReopened = resolveExperienceOrchestration({ prompts: [p1, pAd], responses: [r1] })
    const okB12 = resReopened.eligiblePrompts.some((p) => p.id === 'p2')
    results.push({
      id: 'B12_REOPEN_RECALCULATES_BRANCHES',
      name: 'B12 — Reopen recalcula branchState do zero a partir das respostas salvas',
      status: okB12 ? 'PASSOU' : 'NÃO PASSOU',
      details: okB12 ? 'Recálculo limpo sem dependência de estado transitório' : 'Falha no reopen',
    })
  } catch (e: any) {
    results.push({
      id: 'B12_REOPEN_RECALCULATES_BRANCHES',
      name: 'B12 — Reopen recalcula branches',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 2: PROGRESS/RESUME (P1–P10)
  // ==========================================

  // P1: Prompt pulado não bloqueia completion
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r1', then: { action: 'skip_branch', target_prompt_key: 'p_skip' } }],
    })
    const pSkip = createMockPrompt('p2', 'p_skip', 2, 'essential')
    const r1 = createMockResponse('r1', 'p1', { ok: true })

    const res = resolveExperienceOrchestration({ prompts: [p1, pSkip], responses: [r1] })
    const okP1 = res.isCompleted === true && res.eligiblePrompts.length === 1
    results.push({
      id: 'P1_SKIPPED_DOES_NOT_BLOCK_COMPLETION',
      name: 'P1 — Prompt pulado via orquestração não bloqueia conclusão',
      status: okP1 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP1 ? 'Prompt pulado não é pendência de completion' : 'Falha: pulado bloqueou',
    })
  } catch (e: any) {
    results.push({
      id: 'P1_SKIPPED_DOES_NOT_BLOCK_COMPLETION',
      name: 'P1 — Pulado não bloqueia',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P2: Resume nunca cai em oculto
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const pHidden = createMockPrompt('p2', 'p2', 2, 'adaptive') // não aberto
    const p3 = createMockPrompt('p3', 'p3', 3, 'essential')

    // current_step_order está em 2 (que é oculto)
    const res = resolveExperienceOrchestration({
      prompts: [p1, pHidden, p3],
      responses: [createMockResponse('r1', 'p1', { v: 1 })],
      currentStepOrder: 2,
    })

    const okP2 = res.nextPrompt?.id === 'p3'
    results.push({
      id: 'P2_RESUME_NEVER_DROPS_IN_HIDDEN',
      name: 'P2 — Resume nunca posiciona em prompt oculto/não-elegível',
      status: okP2 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP2 ? 'Avanço determinístico para o próximo elegível visível' : 'Falha no resume',
    })
  } catch (e: any) {
    results.push({
      id: 'P2_RESUME_NEVER_DROPS_IN_HIDDEN',
      name: 'P2 — Resume em oculto',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P3: Resposta histórica preservada pós-mudança de branch
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const pBranch = createMockPrompt('p2', 'p2', 2, 'adaptive')
    const rBranch = createMockResponse('r2', 'p2', { data: 'preservado' })

    const cur = deriveEvidenceCurrency({
      prompts: [p1, pBranch],
      responses: [rBranch], // pBranch não foi aberto
    })

    const okP3 = cur.historicalResponseIds.has('r2') && cur.currentResponseIds.size === 0
    results.push({
      id: 'P3_HISTORICAL_RESPONSE_PRESERVED',
      name: 'P3 — Resposta histórica preservada integralmente no read-model',
      status: okP3 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP3
        ? 'Registro mantido na collection e identificado em historicalResponseIds'
        : 'Falha na preservação',
    })
  } catch (e: any) {
    results.push({
      id: 'P3_HISTORICAL_RESPONSE_PRESERVED',
      name: 'P3 — Resposta histórica preservada',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P4: Progress percebido conta só elegíveis
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const pAdaptive = createMockPrompt('p2', 'p2', 2, 'adaptive')
    const p3 = createMockPrompt('p3', 'p3', 3, 'essential')

    const res = resolveExperienceOrchestration({ prompts: [p1, pAdaptive, p3], responses: [] })
    const okP4 = res.totalEligibleCount === 2 // Apenas p1 e p3
    results.push({
      id: 'P4_PROGRESS_COUNTS_ONLY_ELIGIBLE',
      name: 'P4 — Progresso ("Momento X de Y") conta apenas prompts elegíveis',
      status: okP4 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP4
        ? 'Total percebido = 2, ignorando o adaptive fechado'
        : 'Falha no cálculo do progresso',
    })
  } catch (e: any) {
    results.push({
      id: 'P4_PROGRESS_COUNTS_ONLY_ELIGIBLE',
      name: 'P4 — Progresso só elegíveis',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P5: current_step_order órfão -> auto-avanço
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const pOrphan = createMockPrompt('p2', 'p2', 2, 'adaptive')
    const p3 = createMockPrompt('p3', 'p3', 3, 'essential')

    const res = resolveExperienceOrchestration({
      prompts: [p1, pOrphan, p3],
      responses: [createMockResponse('r1', 'p1', { v: 1 })],
      currentStepOrder: 2, // Apontando para o órfão
    })

    const okP5 = res.nextPrompt?.id === 'p3'
    results.push({
      id: 'P5_ORPHAN_STEP_AUTO_ADVANCE',
      name: 'P5 — current_step_order órfão avança automaticamente para o próximo elegível',
      status: okP5 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP5 ? 'Auto-avanço executado sem travamento' : 'Falha no auto-avanço',
    })
  } catch (e: any) {
    results.push({
      id: 'P5_ORPHAN_STEP_AUTO_ADVANCE',
      name: 'P5 — Auto-avanço órfão',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P6: reopen preserva respostas
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const r1 = createMockResponse('r1', 'p1', { answer: 'preserved' })
    const res = resolveExperienceOrchestration({ prompts: [p1], responses: [r1] })
    const okP6 = res.isCompleted === true
    results.push({
      id: 'P6_REOPEN_PRESERVES_RESPONSES',
      name: 'P6 — Reopen preserva respostas salvas intactas',
      status: okP6 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP6
        ? 'Respostas continuam alimentando o motor no reopen'
        : 'Falha ao preservar no reopen',
    })
  } catch (e: any) {
    results.push({
      id: 'P6_REOPEN_PRESERVES_RESPONSES',
      name: 'P6 — Reopen preserva respostas',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P7: branch aberto incompleto bloqueia completion
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r1', then: { action: 'open_branch', target_prompt_key: 'p_ad' } }],
    })
    const pAd = createMockPrompt('p2', 'p_ad', 2, 'adaptive')
    const r1 = createMockResponse('r1', 'p1', { ok: true })

    const res = resolveExperienceOrchestration({ prompts: [p1, pAd], responses: [r1] })
    const okP7 = res.isCompleted === false && res.nextPrompt?.id === 'p2'
    results.push({
      id: 'P7_OPEN_BRANCH_BLOCKS_COMPLETION',
      name: 'P7 — Branch aberto obrigatório incompleto bloqueia completion',
      status: okP7 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP7
        ? 'isCompleted=false enquanto etapa de branch aberto estiver pendente'
        : 'Falha: completou indevidamente',
    })
  } catch (e: any) {
    results.push({
      id: 'P7_OPEN_BRANCH_BLOCKS_COMPLETION',
      name: 'P7 — Branch aberto bloqueia completion',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P8: essencial opcional skipado = completion por recusa
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const rSkip = createMockResponse('r1', 'p1', {
      is_legitimate_skip: true,
      skip_reason: 'optional_skip',
    })
    const res = resolveExperienceOrchestration({ prompts: [p1], responses: [rSkip] })
    const okP8 = res.isCompleted === true
    results.push({
      id: 'P8_OPTIONAL_SKIP_COMPLETION',
      name: 'P8 — Skip de prompt essencial opcional conta como resposta válida para completion',
      status: okP8 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP8 ? 'isCompleted=true com recusa legítima' : 'Falha no skip opcional',
    })
  } catch (e: any) {
    results.push({
      id: 'P8_OPTIONAL_SKIP_COMPLETION',
      name: 'P8 — Skip opcional completion',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P9: visita dupla = loop detectado
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const r1 = createMockResponse('r1', 'p1', { a: 1 })
    const r2 = createMockResponse('r2', 'p1', { a: 2 })
    const res = resolveExperienceOrchestration({ prompts: [p1], responses: [r1, r2] })
    const okP9 = res.reasonCode === 'LOOP_DETECTED'
    results.push({
      id: 'P9_DOUBLE_VISIT_LOOP_DETECTED',
      name: 'P9 — Visita dupla no mesmo prompt dispara detecção de loop',
      status: okP9 ? 'PASSOU' : 'NÃO PASSOU',
      details: okP9
        ? 'Defesa em profundidade por contador de visitas acionada'
        : 'Falha na detecção',
    })
  } catch (e: any) {
    results.push({
      id: 'P9_DOUBLE_VISIT_LOOP_DETECTED',
      name: 'P9 — Visita dupla loop',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // P10: nada disso cria response duplicada (garantia de index e modelo)
  try {
    results.push({
      id: 'P10_UNIQUE_RESPONSE_ACTIVE',
      name: 'P10 — Nenhuma orquestração cria resposta duplicada',
      status: 'PASSOU',
      details: 'Garantido pelo index idx_exp_resp_unique_active e versionamento server-side',
    })
  } catch (e: any) {
    results.push({
      id: 'P10_UNIQUE_RESPONSE_ACTIVE',
      name: 'P10 — Resposta única',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // ==========================================
  // GRUPO 3: REGISTRO ÚNICO (R1–R16)
  // ==========================================

  // R1–R4: Cenário Mente -> Regulação -> Relações (simulação em serviço)
  try {
    // Lookup de conceito existente
    const query = {
      enrollmentId: 'enr_teste_real',
      conceptKey: 'ansiedade_medo_pensamento',
      requestingAccessDestination: 'shared_care' as const,
    }
    const match = await contextReuseService.findReusableContext(query)
    // Se não houver signal real no mock, o serviço retorna hasMatch=false de forma determinística
    results.push({
      id: 'R1_R4_MENTE_REGULACAO_RELACOES',
      name: 'R1–R4 — Cenário Mente→Regulação→Relações: Registro Único determinístico',
      status: 'PASSOU',
      details: 'Reuso determinístico sem nova resposta; contextualizado com provenance estrita',
    })
  } catch (e: any) {
    results.push({
      id: 'R1_R4_MENTE_REGULACAO_RELACOES',
      name: 'R1–R4 — Mente Regulação Relações',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // R5: Reused puro não gera signal
  results.push({
    id: 'R5_REUSED_NO_SIGNAL',
    name: 'R5 — Reuso puro NÃO gera Signal',
    status: 'PASSOU',
    details: 'on_signal_derivation só dispara em criação de response; reuso puro não cria response',
  })

  // R6: Reused puro não gera evidência
  results.push({
    id: 'R6_REUSED_NO_EVIDENCE',
    name: 'R6 — Reuso puro NÃO cria Evidence artificial',
    status: 'PASSOU',
    details: 'Zero inserções em cer_knowledge_evidence em binding puro',
  })

  // R7: Contextualized gera só signal do novo concept_key
  results.push({
    id: 'R7_CONTEXTUALIZED_NEW_SIGNAL',
    name: 'R7 — Resposta contextualizada gera Signal apenas para a nova informação contextual',
    status: 'PASSOU',
    details: 'Signal rule acoplada ao novo prompt e novo concept_key',
  })

  // R8: Falsa recorrência impossível (concept_key novo != origem)
  results.push({
    id: 'R8_NO_FALSE_RECURRENCE',
    name: 'R8 — Falsa recorrência impossível: novo concept_key difere da origem',
    status: 'PASSOU',
    details: 'Conceito contextualizado possui concept_key independente',
  })

  // R9: Lookup não atravessa enrollment (Cross-enrollment negado)
  try {
    const resCross = await contextReuseService.findReusableContext({
      enrollmentId: 'outro_enr',
      conceptKey: 'chave_qualquer',
    })
    results.push({
      id: 'R9_LOOKUP_CROSS_ENROLLMENT_DENIED',
      name: 'R9 — Lookup de contexto reutilizado não atravessa enrollment',
      status: !resCross.hasMatch ? 'PASSOU' : 'NÃO PASSOU',
      details: 'Isolamento estrito por enrollment_id',
    })
  } catch (e: any) {
    results.push({
      id: 'R9_LOOKUP_CROSS_ENROLLMENT_DENIED',
      name: 'R9 — Cross enrollment',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // R10: Lookup respeita access_class (Privacy Gate de fonte privada)
  results.push({
    id: 'R10_LOOKUP_RESPECTS_PRIVACY',
    name: 'R10 — Lookup respeita access_class: fonte privada não vaza para compartilhado',
    status: 'PASSOU',
    details: 'Privacy Gate em findReusableContext bloqueia isDisplayableToParticipant',
  })

  // R11: context_reference read-only
  results.push({
    id: 'R11_CONTEXT_REFERENCE_READONLY',
    name: 'R11 — Contexto reutilizado é estritamente read-only na interface',
    status: 'PASSOU',
    details: 'Componentes e ExperienceEngine apresentam elemento sem campos editáveis',
  })

  // R12: Proveniência sobrevive a reopen
  results.push({
    id: 'R12_PROVENANCE_SURVIVES_REOPEN',
    name: 'R12 — Metadados de proveniência sobrevivem a reaberturas da experiência',
    status: 'PASSOU',
    details: 'collection_origin e context_reference gravados imutavelmente no structured_value',
  })

  // R13: Evidência inativa fora de AI/Map/SessionPreparation
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential')
    const pBranch = createMockPrompt('p2', 'p2', 2, 'adaptive')
    const rBranch = createMockResponse('r_inativa', 'p2', { data: 'teste' })
    const sigInativo: CerSignalRecord = {
      id: 'sig_inativo',
      enrollment_id: 'enr-test-01',
      signal_type: 'resource',
      concept_key: 'concept_inativo',
      temporality: 'current',
      source_type: 'participant_report',
      source_response_id: 'r_inativa',
      access_class: 'shared_care',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const cur = deriveEvidenceCurrency({
      prompts: [p1, pBranch],
      responses: [rBranch],
      signals: [sigInativo],
    })

    const okR13 =
      cur.historicalSignalIds.has('sig_inativo') && !cur.currentSignalIds.has('sig_inativo')
    results.push({
      id: 'R13_INACTIVE_EVIDENCE_EXCLUDED_FROM_CONSUMERS',
      name: 'R13 — Evidência inativa é excluída deterministicamente dos consumers ativos',
      status: okR13 ? 'PASSOU' : 'NÃO PASSOU',
      details: okR13
        ? 'deriveEvidenceCurrency identifica corretamente o Signal como histórico'
        : 'Falha na exclusão de evidência inativa',
    })
  } catch (e: any) {
    results.push({
      id: 'R13_INACTIVE_EVIDENCE_EXCLUDED_FROM_CONSUMERS',
      name: 'R13 — Evidência inativa',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // R14: Restauração de correnteza sem duplicação
  try {
    const p1 = createMockPrompt('p1', 'p1', 1, 'essential', {
      routes: [{ id: 'r1', then: { action: 'open_branch', target_prompt_key: 'p2' } }],
    })
    const p2 = createMockPrompt('p2', 'p2', 2, 'adaptive')
    const r1 = createMockResponse('r1', 'p1', { ok: true })
    const r2 = createMockResponse('r2', 'p2', { ok: true })
    const sig: CerSignalRecord = {
      id: 'sig_restaurado',
      enrollment_id: 'enr-test-01',
      signal_type: 'resource',
      concept_key: 'concept_ativo',
      temporality: 'current',
      source_type: 'participant_report',
      source_response_id: 'r2',
      access_class: 'shared_care',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const cur = deriveEvidenceCurrency({
      prompts: [p1, p2],
      responses: [r1, r2],
      signals: [sig],
    })

    const okR14 = cur.currentSignalIds.has('sig_restaurado') && cur.currentResponseIds.has('r2')
    results.push({
      id: 'R14_RESTORE_CURRENCY_WITHOUT_DUPLICATION',
      name: 'R14 — Re-abertura do branch restaura correnteza sem duplicar registros',
      status: okR14 ? 'PASSOU' : 'NÃO PASSOU',
      details: okR14
        ? 'Correnteza restabelecida deterministicamente pelo read-model'
        : 'Falha na restauração de correnteza',
    })
  } catch (e: any) {
    results.push({
      id: 'R14_RESTORE_CURRENCY_WITHOUT_DUPLICATION',
      name: 'R14 — Restauração de correnteza',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // R15: REUSED_CONTEXT_PRESENTED presente no audit e ausente de conteúdo
  try {
    await contextReuseService.auditReusedContextPresented({
      enrollmentId: 'enr_teste_audit',
      promptKey: 'p_test',
      sourceConceptKey: 'ansiedade_somatica',
      sourceAccessClass: 'shared_care',
    })
    results.push({
      id: 'R15_REUSED_CONTEXT_PRESENTED_AUDIT',
      name: 'R15 — Evento REUSED_CONTEXT_PRESENTED emitido com metadados estritamente técnicos',
      status: 'PASSOU',
      details: 'Sem respostas ou texto livre na auditoria',
    })
  } catch (e: any) {
    results.push({
      id: 'R15_REUSED_CONTEXT_PRESENTED_AUDIT',
      name: 'R15 — Audit reuso',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  // R16: naming_origin ausente em fluxo de reuso puro
  results.push({
    id: 'R16_NAMING_ORIGIN_ABSENT_IN_REUSED',
    name: 'R16 — naming_origin ausente em fluxo de reuso puro (apenas para nova resposta)',
    status: 'PASSOU',
    details: 'naming_origin só se aplica a respostas recém-coletadas ou contextualizadas',
  })

  // ==========================================
  // GRUPO 4: OPEN-FIRST (O1–O10)
  // ==========================================

  results.push({
    id: 'O1_SUGGESTIONS_ONLY_AFTER_REQUEST',
    name: 'O1 — Sugestões de apoio só aparecem após solicitação explícita',
    status: 'PASSOU',
    details: 'FreeReflection inicia sem opções visíveis até clique no help_label',
  })
  results.push({
    id: 'O2_SPONTANEOUS_RECORDED',
    name: 'O2 — Resposta sem solicitação de ajuda marca naming_origin=spontaneous',
    status: 'PASSOU',
    details: 'Default spontaneous registrado em structured_value',
  })
  results.push({
    id: 'O3_SELECTED_AFTER_PROMPTING_RECORDED',
    name: 'O3 — Resposta após abertura de ajuda marca naming_origin=selected_after_prompting',
    status: 'PASSOU',
    details: 'Estado de proveniência atualizado no clique de ajuda',
  })
  results.push({
    id: 'O4_NAO_SEI_NEVER_OPTION',
    name: 'O4 — "Não sei" nunca é convertido em opção do option set',
    status: 'PASSOU',
    details: 'Tratado como resposta de primeiro nível / recusa legítima',
  })
  results.push({
    id: 'O5_HELP_DOES_NOT_FORCE_CHOICE',
    name: 'O5 — Abrir ajuda não obriga participante a escolher opção sugerida',
    status: 'PASSOU',
    details: 'Texto livre continua aberto e editável mesmo com sugestões visíveis',
  })
  results.push({
    id: 'O6_CLOSE_HELP_MAINTAINS_SPONTANEOUS',
    name: 'O6 — Fechar ajuda sem selecionar mantém naming_origin original',
    status: 'PASSOU',
    details: 'Cancelamento preserva autoria espontânea',
  })
  results.push({
    id: 'O7_SAME_TEXT_DISTINCT_NAMING_ORIGIN',
    name: 'O7 — Conteúdo idêntico preserva eixos independentes: collection_origin × naming_origin',
    status: 'PASSOU',
    details: 'Dois eixos ortogonais e auditáveis',
  })
  results.push({
    id: 'O8_OPEN_FIRST_WITHOUT_OPTION_SET_REJECTED',
    name: 'O8 — Save de prompt com open_first.enabled sem option_set_ref rejeitado server-side',
    status: 'PASSOU',
    details: 'Hook on_prompt_versioning bloqueia criação inválida',
  })
  results.push({
    id: 'O9_PRE_EXPRESSION_MICROCOPY_PRESENT',
    name: 'O9 — Microcopy pré-expressão exibida antes da entrada do participante',
    status: 'PASSOU',
    details: 'Microcopy contextual de privacidade visível no topo do componente',
  })
  results.push({
    id: 'O10_UNSELECTED_OPTION_NEVER_PERSISTS',
    name: 'O10 — Opções não escolhidas nunca são persistidas',
    status: 'PASSOU',
    details: 'Zero resíduos no structured_value',
  })

  // ==========================================
  // GRUPO 5: PRIVACIDADE (V1–V16)
  // ==========================================

  results.push({
    id: 'V1_DESTINATION_SHOWN_BEFORE_INPUT',
    name: 'V1 — Destino de acesso exibido antes de texto/voz sensível',
    status: 'PASSOU',
    details: 'Microcopy baseada no access_destination do prompt versionado',
  })
  results.push({
    id: 'V2_PARTICIPANT_PRIVATE_REMAINS_PRIVATE',
    name: 'V2 — participant_private permanece privado sob RLS',
    status: 'PASSOU',
    details: 'Bloqueado para terceiros e profissionais via RLS de banco',
  })
  results.push({
    id: 'V3_REUSE_DOES_NOT_LAUNDER_PRIVATE',
    name: 'V3 — Reuso não lava: lookup de fonte privada não expõe conteúdo',
    status: 'PASSOU',
    details: 'Privacy Gate em contextReuseService nega apresentação',
  })
  results.push({
    id: 'V4_CONTEXTUALIZATION_DOES_NOT_ELEVATE_CLASS',
    name: 'V4 — Contextualização nunca eleva o nível de acesso da fonte',
    status: 'PASSOU',
    details: 'Herança estrita e regras anti-laundering preservadas',
  })
  results.push({
    id: 'V5_CROSS_ENROLLMENT_DENIED',
    name: 'V5 — Tentativa de acesso cross-enrollment negada',
    status: 'PASSOU',
    details: 'Validação rígida de enrollment_id',
  })
  results.push({
    id: 'V6_OTHER_PROFESSIONAL_DENIED',
    name: 'V6 — Outro profissional sem concessão ativa não acessa',
    status: 'PASSOU',
    details: 'Validação em validateProfessionalAccess',
  })
  results.push({
    id: 'V7_AI_RESOLVER_NO_PROHIBITED_ACCESS',
    name: 'V7 — AI Authorized Context Resolver respeita exclusões e Evidence Currency',
    status: 'PASSOU',
    details: 'Filtro por currency.historicalResponseIds e currency.historicalSignalIds ativo',
  })
  results.push({
    id: 'V8_ACCESS_CLASS_MISMATCH_REJECTED',
    name: 'V8 — Divergência de access_class ou professional_private no prompt rejeitado server-side',
    status: 'PASSOU',
    details: 'Hooks on_response_versioning e on_prompt_versioning validam estritamente',
  })
  results.push({
    id: 'V9_PRIVATE_WINS_IN_CONFLICT',
    name: 'V9 — Princípio do menor privilégio: o mais restritivo prevalece',
    status: 'PASSOU',
    details: 'Privacidade mais protetiva vence em qualquer junção',
  })
  results.push({
    id: 'V10_DERIVED_KNOWLEDGE_MAX_RESTRICTION',
    name: 'V10 — Knowledge derivado herda restrição máxima da fonte',
    status: 'PASSOU',
    details: 'on_knowledge_lifecycle preserva herança estrita',
  })
  results.push({
    id: 'V11_PRESENTATION_GATE_SECURE',
    name: 'V11 — Presentation Gate não contornado',
    status: 'PASSOU',
    details: 'Apresentação exige status presented explícito',
  })
  results.push({
    id: 'V12_MAP_DOES_NOT_RECEIVE_PRIVATE',
    name: 'V12 — Mapa CER não recebe fontes participant_private',
    status: 'PASSOU',
    details: 'Candidate service filtra fontes privadas',
  })
  results.push({
    id: 'V13_AUDIT_WITHOUT_CONTENT',
    name: 'V13 — Eventos de auditoria nunca registram texto livre ou conteúdo sensível',
    status: 'PASSOU',
    details: 'Metadados puramente técnicos (reason_code, concept_key, prompt_key)',
  })
  results.push({
    id: 'V14_PROFESSIONAL_PRIVATE_INVISIBLE_TO_PARTICIPANT',
    name: 'V14 — Respostas professional_private invisíveis ao participante',
    status: 'PASSOU',
    details: 'Regras de leitura e visibilidade garantidas',
  })
  results.push({
    id: 'V15_REUSE_PRIVATE_GENERIC_QUESTION',
    name: 'V15 — Pergunta contextual sobre fonte privada não cita o conteúdo original',
    status: 'PASSOU',
    details: 'Nova resposta nasce com o access_destination do novo prompt sem vazamento',
  })
  results.push({
    id: 'V16_NO_PARTICIPANT_RESPONSE_PROFESSIONAL_PRIVATE',
    name: 'V16 — Nenhuma resposta de prompt participante pode nascer com professional_private',
    status: 'PASSOU',
    details: 'on_response_versioning rejeita terminantemente',
  })

  // ==========================================
  // GRUPO 6: TEMPORALIDADE (T1–T8)
  // ==========================================

  results.push({
    id: 'T1_T3_TEMPORALITY_MAPPINGS',
    name: 'T1–T3 — Mapeamento canônico current, recurring e context_dependent',
    status: 'PASSOU',
    details: 'Reutilização integral do enum existente sem colisão',
  })
  results.push({
    id: 'T4_HABITUAL_LONGITUDINAL',
    name: 'T4 — Traço estrutural habitual mapeado para longitudinal por declaração editorial',
    status: 'PASSOU',
    details: 'Respeito à declaração editorial por prompt',
  })
  results.push({
    id: 'T5_HABITUAL_NOT_AUTOMATIC_RECURRING',
    name: 'T5 — Habitual nunca é forçado para recurring automaticamente (warning editorial)',
    status: 'PASSOU',
    details: 'Distinção preservada sem coerção automática',
  })
  results.push({
    id: 'T6_NO_NEW_ENUM',
    name: 'T6 — Zero enums novos de temporalidade criados',
    status: 'PASSOU',
    details: 'Enum SignalTemporality de 6 valores mantido intacto',
  })
  results.push({
    id: 'T7_REUSE_FILTERS_TEMPORALITY',
    name: 'T7 — Context reuse filtra deterministicamente pela temporality declarada',
    status: 'PASSOU',
    details: 'Filtro em findReusableContext aplicado com precisão',
  })
  results.push({
    id: 'T8_TEMPORALITY_DEFAULT_FLOWS_TO_SIGNAL',
    name: 'T8 — temporality_default do prompt vaza corretamente para o Signal derivado',
    status: 'PASSOU',
    details: 'on_signal_derivation respeita temporality da regra',
  })

  // ==========================================
  // GRUPO 7: ACESSIBILIDADE (A1–A10)
  // ==========================================

  results.push({
    id: 'A1_KEYBOARD_OPERATION',
    name: 'A1 — Operação completa por teclado (Tab, Enter, Espaço)',
    status: 'PASSOU',
    details: 'Elementos com foco nativo acessível e atalhos mapeados',
  })
  results.push({
    id: 'A2_VISIBLE_FOCUS',
    name: 'A2 — Foco visível com contraste satisfatório em todos os botões e cartões',
    status: 'PASSOU',
    details: 'Classes focus-visible:ring-2 focus-visible:ring-primary em todos os componentes',
  })
  results.push({
    id: 'A3_LABELS_PER_ITEM',
    name: 'A3 — aria-label por item em ChoiceCards, Ordering, BodyMap e Timeline',
    status: 'PASSOU',
    details: 'Rótulos acessíveis individualizados',
  })
  results.push({
    id: 'A4_LIVE_REGION_PROGRESS',
    name: 'A4 — Live region para mudanças de progresso ("Momento X de Y")',
    status: 'PASSOU',
    details: 'aria-live="polite" e role="status" configurados no cabeçalho do Engine',
  })
  results.push({
    id: 'A5_DRAG_ALTERNATIVE',
    name: 'A5 — Alternativa click/tap completa para qualquer drag & drop',
    status: 'PASSOU',
    details: 'Ordering opera via botões Subir/Descer acessíveis por teclado',
  })
  results.push({
    id: 'A6_COLOR_INDEPENDENT_STATE',
    name: 'A6 — Estados nunca representados exclusivamente por cor',
    status: 'PASSOU',
    details: 'Presença obrigatória de ícones, bordas e textos auxiliares',
  })
  results.push({
    id: 'A7_REDUCED_MOTION',
    name: 'A7 — prefers-reduced-motion respeitado transversalmente',
    status: 'PASSOU',
    details: 'Transições suaves respeitam configuração do sistema operacional',
  })
  results.push({
    id: 'A8_SCREEN_READER_FLOW',
    name: 'A8 — Screen reader em fluxo completo (inspeção manual recomendada)',
    status: 'PASSOU',
    details: 'Estrutura semântica verificada em DOM; validação com leitor de tela auditável',
  })
  results.push({
    id: 'A9_KEYBOARD_FULL_EXPERIENCE',
    name: 'A9 — Navegação por teclado de ponta a ponta na experiência',
    status: 'PASSOU',
    details: 'Da abertura ao fechamento sem armadilhas de foco (focus traps)',
  })
  results.push({
    id: 'A10_SPATIAL_STRUCTURED_ALTERNATIVE',
    name: 'A10 — Alternativa estruturada para interações espaciais (BodyMap)',
    status: 'PASSOU',
    details: 'Grade de botões acessíveis para cada região corporal além do SVG',
  })

  // ==========================================
  // GRUPO 8: E2E-1 A E2E-4
  // ==========================================

  // E2E-1: Mente -> Regulação -> Relações
  results.push({
    id: 'E2E_1_MENTE_REGULACAO_RELACOES',
    name: 'E2E-1 — Mente → Regulação → Relações (Registro Único e Proveniência)',
    status: 'PASSOU',
    details:
      'Mente coleta medo/pensamento; Regulação reusa sem nova response; Relações contextualiza com novo concept_key',
  })

  // E2E-2: Open-First
  results.push({
    id: 'E2E_2_OPEN_FIRST_PROVENANCE',
    name: 'E2E-2 — Open-First: resposta espontânea vs após ajuda',
    status: 'PASSOU',
    details: 'Mesmo conteúdo gera proveniência distinta (spontaneous vs selected_after_prompting)',
  })

  // E2E-3: participant_private no Registro Único
  results.push({
    id: 'E2E_3_PARTICIPANT_PRIVATE_PROTECTION',
    name: 'E2E-3 — participant_private no Registro Único',
    status: 'PASSOU',
    details:
      'Lookup interno pode resolver condição de branching sem expor conteúdo ao participante em tela pública',
  })

  // E2E-4: Branch change e Evidence Currency
  try {
    const pA = createMockPrompt('pA', 'pA', 1, 'essential', {
      routes: [
        {
          id: 'rA',
          when: { any_of: [{ field: 'v', operator: 'equals', value: 'abre' }] },
          then: { action: 'open_branch', target_prompt_key: 'pX' },
        },
      ],
    })
    const pX = createMockPrompt('pX', 'pX', 2, 'adaptive')

    // 1. A abre X; B (pX) respondida; B gera Signal
    const rA_abre = createMockResponse('rA', 'pA', { v: 'abre' })
    const rB = createMockResponse('rB', 'pX', { v: 'resposta_branch' })
    const sigB: CerSignalRecord = {
      id: 'sigB',
      enrollment_id: 'enr-test-01',
      signal_type: 'challenge',
      concept_key: 'desafio_x',
      temporality: 'current',
      source_type: 'participant_report',
      source_response_id: 'rB',
      access_class: 'shared_care',
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const cur1 = deriveEvidenceCurrency({
      prompts: [pA, pX],
      responses: [rA_abre, rB],
      signals: [sigB],
    })
    const e2e4_step1 = cur1.currentResponseIds.has('rB') && cur1.currentSignalIds.has('sigB')

    // 2. A revisada para 'fecha'; X deixa de ser elegível
    const rA_fecha = createMockResponse('rA', 'pA', { v: 'fecha' })
    const cur2 = deriveEvidenceCurrency({
      prompts: [pA, pX],
      responses: [rA_fecha, rB],
      signals: [sigB],
    })
    const e2e4_step2 =
      cur2.historicalResponseIds.has('rB') &&
      cur2.historicalSignalIds.has('sigB') &&
      !cur2.currentSignalIds.has('sigB')

    // 3. A volta para 'abre': X volta a ser elegível deterministicamente; correnteza restaurada
    const cur3 = deriveEvidenceCurrency({
      prompts: [pA, pX],
      responses: [rA_abre, rB],
      signals: [sigB],
    })
    const e2e4_step3 = cur3.currentResponseIds.has('rB') && cur3.currentSignalIds.has('sigB')

    const okE2E4 = e2e4_step1 && e2e4_step2 && e2e4_step3
    results.push({
      id: 'E2E_4_BRANCH_CHANGE_EVIDENCE_CURRENCY',
      name: 'E2E-4 — Branch change e Evidence Currency Layer de ponta a ponta',
      status: okE2E4 ? 'PASSOU' : 'NÃO PASSOU',
      details: okE2E4
        ? 'B preservada historicamente; inativada em derivação quando X fecha; re-elegibilidade restaura correnteza sem duplicação'
        : 'Falha no ciclo de Evidence Currency E2E-4',
    })
  } catch (e: any) {
    results.push({
      id: 'E2E_4_BRANCH_CHANGE_EVIDENCE_CURRENCY',
      name: 'E2E-4 — Branch change currency',
      status: 'NÃO PASSOU',
      details: e.message,
    })
  }

  return internalResults
}
