import {
  demoAdapter,
  type DemoCareStore,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_DAIANE,
  DEMO_USER_MARIANA,
} from './demoAdapter'
import type {
  CerPracticeAssignmentRecord,
  CerPracticeResponseRecord,
  CerPracticeResponsePrivateNoteRecord,
  CerPracticeConsentRecord,
  CapacityResponseValue,
  PracticeResponseType,
  PracticeResponseSafetyFlag,
  CerPlannerItemRecord,
} from '@/types/cer'

/** Illustrative catalogue only. These records are never registered as reviewed clinical content. */
export const DEMO_PRACTICE_CATALOG = Object.freeze([
  {
    id: 'demo-small-step-v1',
    title: 'Meu pequeno passo combinado',
    nature: 'practice',
    version: 1,
    status: 'active',
    reviewDueAt: '2026-12-31T23:59:59Z',
    consentRequired: true,
    summary:
      'Escolher com a profissional uma ação simples que faça sentido neste momento. Você pode adaptar, pausar ou decidir não fazer.',
  },
  {
    id: 'demo-support-resource-v1',
    title: 'Meu lembrete de apoio',
    nature: 'resource',
    version: 1,
    status: 'active',
    reviewDueAt: '2026-12-31T23:59:59Z',
    consentRequired: true,
    summary:
      'Registrar um apoio escolhido em conversa com a profissional, para consultar quando fizer sentido.',
  },
] as const)
export interface DemoSafetyCheck {
  id: string
  enrollment_id: string
  practice_version_id: string
  participant_user_id: string
  outcome: string
  professional_rationale: string
  reviewed_by_user_id: string
  record_status: 'current' | 'superseded'
}
export interface DemoPracticeStore {
  assignments: CerPracticeAssignmentRecord[]
  safetyChecks: DemoSafetyCheck[]
  consents: CerPracticeConsentRecord[]
  responses: CerPracticeResponseRecord[]
  privateNotes: CerPracticeResponsePrivateNoteRecord[]
  understandingRequests?: Record<string, 'want_to_ask' | 'did_not_understand'>
  sharedAssignmentIds: string[]
}
export function readDemoPracticeStore(store = demoAdapter.readCareStore()): DemoPracticeStore {
  return (
    store.practiceData || {
      assignments: [],
      safetyChecks: [],
      consents: [],
      responses: [],
      privateNotes: [],
      sharedAssignmentIds: [],
    }
  )
}
function actor(role?: 'daiane' | 'mariana', enrollment = DEMO_ENROLLMENT_ID) {
  if (
    !demoAdapter.isEnabled() ||
    enrollment !== DEMO_ENROLLMENT_ID ||
    (role && demoAdapter.getActivePersona() !== role)
  )
    throw new Error('Esta ação não está disponível para este perfil ou matrícula.')
}
function id(prefix: string) {
  return `demo-${prefix}-${crypto.randomUUID()}`
}
function transaction<T>(change: (data: DemoPracticeStore, store: DemoCareStore) => T): T {
  const store = demoAdapter.readCareStore(),
    data = readDemoPracticeStore(store)
  const result = change(data, store)
  store.practiceData = data
  demoAdapter.writeCareStore(store)
  return result
}
function assignment(data: DemoPracticeStore, assignmentId: string) {
  const item = data.assignments.find(
    (a) =>
      a.id === assignmentId &&
      a.enrollment_id === DEMO_ENROLLMENT_ID &&
      a.participant_user_id === DEMO_USER_MARIANA.id,
  )
  if (!item) throw new Error('Experimento não encontrado nesta matrícula.')
  return item
}
function validate(
  data: DemoPracticeStore,
  store: DemoCareStore,
  a: CerPracticeAssignmentRecord,
  consent = true,
) {
  const version = DEMO_PRACTICE_CATALOG.find((v) => v.id === a.practice_version_id)
  if (!version || version.status !== 'active' || Date.parse(version.reviewDueAt) <= Date.now())
    throw new Error('A versão da prática precisa de revisão vigente.')
  const cycle = store.cycles.find(
    (c) => c.id === a.care_cycle_id && c.enrollment_id === a.enrollment_id,
  )
  const plan = demoAdapter.listPlans(a.enrollment_id).find((p) => p.id === cycle?.plan_id)
  const priority =
    plan && demoAdapter.listPriorities(plan.id).find((p) => p.id === a.care_plan_priority_id)
  if (!cycle || cycle.status !== 'active' || plan?.status !== 'active')
    throw new Error('O ciclo e seu plano precisam estar ativos.')
  if (!priority || !['active', 'active_pending_adaptation'].includes(priority.status))
    throw new Error('Ative a prioridade de cuidado antes de propor a prática.')
  const acceptance = demoAdapter
    .listAcceptancesByEnrollment(a.enrollment_id)
    .find((x) => x.id === a.operational_acceptance_id)
  const presentation = demoAdapter
    .listPresentedForParticipant(a.enrollment_id)
    .find(
      (p) =>
        p.id === acceptance?.presentation_id &&
        p.plan_id === plan.id &&
        p.priority_id === priority.id,
    )
  if (
    !acceptance ||
    !presentation ||
    acceptance.plan_id !== plan.id ||
    acceptance.priority_id !== priority.id ||
    acceptance.participant_user_id !== a.participant_user_id ||
    acceptance.record_status !== 'current' ||
    !['accepted', 'wants_to_try'].includes(acceptance.response_type)
  )
    throw new Error(
      'Esta prioridade precisa ser apresentada e ter aceite operacional atual da interagente.',
    )
  const check = data.safetyChecks.find((s) => s.id === a.safety_check_id)
  if (
    !check ||
    check.record_status !== 'current' ||
    check.practice_version_id !== a.practice_version_id ||
    check.enrollment_id !== a.enrollment_id ||
    check.participant_user_id !== a.participant_user_id ||
    !['eligible', 'eligible_with_caution'].includes(check.outcome) ||
    !check.professional_rationale.trim()
  )
    throw new Error('A checagem profissional desta versão ainda não permite a prática.')
  const latest = data.consents.find(
    (c) =>
      c.practice_version_id === a.practice_version_id &&
      c.enrollment_id === a.enrollment_id &&
      c.participant_user_id === a.participant_user_id &&
      c.record_status !== 'superseded',
  )
  if (
    consent &&
    version.consentRequired &&
    (!latest ||
      latest.record_status !== 'current' ||
      latest.decision !== 'accepted' ||
      latest.understanding_response !== 'understood')
  )
    throw new Error(
      'Mariana precisa compreender e aceitar esta versão da prática antes da ativação.',
    )
  if (consent && data.understandingRequests?.[a.id])
    throw new Error('Mariana pediu esclarecimentos antes de prosseguir.')
  if (consent && a.previous_assignment_id && a.consent_id !== latest?.id)
    throw new Error('Mariana precisa confirmar este novo convite antes da ativação.')
  return latest
}
function cancelFuture(store: DemoCareStore, assignmentId: string) {
  store.plannerItems.forEach((i) => {
    if (i.assignment_id === assignmentId && ['planned', 'active'].includes(i.status)) {
      i.status = 'cancelled'
      i.updated = new Date().toISOString()
    }
  })
}
function project(data: DemoPracticeStore, store: DemoCareStore, a: CerPracticeAssignmentRecord) {
  validate(data, store, a)
  if (
    a.status !== 'active' ||
    a.participant_response_type !== 'confirmed' ||
    a.capacity_response !== 'cabe_bem'
  )
    return []
  const contextual = a.assigned_frequency === 'as_needed'
  const now = new Date(),
    end = new Date(now)
  end.setDate(end.getDate() + 7)
  const existing = store.plannerItems.filter(
    (i) =>
      i.assignment_id === a.id &&
      ['planned', 'active'].includes(i.status) &&
      (contextual || (i.scheduled_at && Date.parse(i.scheduled_at) >= now.getTime())),
  )
  if (contextual && existing.length) return existing
  const result = [...existing]
  const days = contextual ? [0] : a.assigned_frequency === 'twice_a_week' ? [1, 4] : [1, 2, 3]
  for (const day of days) {
    const date = new Date(now)
    date.setDate(date.getDate() + day)
    const dateKey = date.toISOString().slice(0, 10)
    // A completed occurrence is history and never recreated during the same window.
    if (
      !contextual &&
      store.plannerItems.some(
        (i) =>
          i.assignment_id === a.id &&
          i.status !== 'cancelled' &&
          i.status !== 'superseded' &&
          i.scheduled_at?.slice(0, 10) === dateKey,
      )
    )
      continue
    if (result.length >= (contextual ? 1 : 3)) break
    const item: CerPlannerItemRecord = {
      id: id('planner'),
      assignment_id: a.id,
      enrollment_id: a.enrollment_id,
      participant_user_id: a.participant_user_id,
      care_cycle_id: a.care_cycle_id,
      safe_title: a.participant_safe_title,
      safe_summary: a.participant_safe_summary,
      item_type: contextual ? 'contextual_resource' : 'scheduled_action',
      scheduling_mode: contextual ? 'contextual' : 'window',
      scheduled_at: contextual ? undefined : date.toISOString(),
      daypart: 'any',
      timezone_snapshot: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: contextual ? 'active' : 'planned',
      created_by: DEMO_USER_DAIANE.id,
      created: now.toISOString(),
      updated: now.toISOString(),
    }
    store.plannerItems.push(item)
    result.push(item)
  }
  return result
}
/** Explicit safe DTO. Neither safety rationale, internal context nor intimate notes are participant fields. */
export function safeDemoAssignment(a: CerPracticeAssignmentRecord): CerPracticeAssignmentRecord {
  return {
    id: a.id,
    enrollment_id: a.enrollment_id,
    participant_user_id: a.participant_user_id,
    care_plan_priority_id: a.care_plan_priority_id,
    care_cycle_id: a.care_cycle_id,
    practice_version_id: a.practice_version_id,
    safety_check_id: a.safety_check_id,
    previous_assignment_id: a.previous_assignment_id,
    consent_id: a.consent_id,
    operational_acceptance_id: a.operational_acceptance_id,
    assigned_by_user_id: a.assigned_by_user_id,
    internal_title: a.participant_safe_title,
    participant_safe_title: a.participant_safe_title,
    participant_safe_summary: a.participant_safe_summary,
    assigned_duration: a.assigned_duration,
    assigned_frequency: a.assigned_frequency,
    participant_response_type: a.participant_response_type,
    capacity_response: a.capacity_response,
    status: a.status,
    confirmed_at: a.confirmed_at,
    created: a.created,
    updated: a.updated,
  }
}
export const demoPracticeFlow = {
  list(enrollmentId: string) {
    actor(undefined, enrollmentId)
    const store = demoAdapter.readCareStore(),
      data = readDemoPracticeStore(store)
    const records = data.assignments.filter((a) => a.enrollment_id === enrollmentId)
    if (demoAdapter.getActivePersona() === 'daiane') return records
    return records
      .filter((a) => data.sharedAssignmentIds.includes(a.id))
      .map((a) => {
        const safe = safeDemoAssignment(a)
        if (
          safe.status === 'active' &&
          store.cycles.find((c) => c.id === safe.care_cycle_id)?.status === 'paused'
        )
          safe.status = 'paused'
        return safe
      })
  },
  get(assignmentId: string) {
    actor()
    const data = readDemoPracticeStore(),
      a = assignment(data, assignmentId)
    if (demoAdapter.getActivePersona() === 'mariana') {
      if (!data.sharedAssignmentIds.includes(a.id))
        throw new Error('Proposta ainda não compartilhada.')
      return safeDemoAssignment(a)
    }
    return a
  },
  prepare(input: {
    enrollmentId: string
    priorityId: string
    cycleId: string
    versionId: string
    safeTitle: string
    safeSummary: string
    duration: string
    frequency: string
    safetyOutcome: string
    rationale: string
    sharedCautions?: string
    previousAssignmentId?: string
  }) {
    actor('daiane', input.enrollmentId)
    if (!input.safeTitle.trim() || !input.safeSummary.trim())
      throw new Error('Confira o título e as orientações que serão compartilhados.')
    if (/diagn[oó]stic|transtorno|fobia|cid-1[01]|dsm-5|patolog/i.test(input.safeTitle))
      throw new Error('Use um título de cuidado sem termos diagnósticos.')
    if (input.safetyOutcome === 'eligible_with_caution' && !input.sharedCautions?.trim())
      throw new Error('Descreva os cuidados que Mariana precisa conhecer.')
    if (!['daily', 'twice_a_week', 'as_needed'].includes(input.frequency))
      throw new Error('Selecione um ritmo disponível.')
    const acceptance = demoAdapter
      .listAcceptancesByEnrollment(input.enrollmentId)
      .find(
        (a) =>
          a.priority_id === input.priorityId &&
          a.record_status === 'current' &&
          ['accepted', 'wants_to_try'].includes(a.response_type),
      )
    return transaction((data, store) => {
      const now = new Date().toISOString()
      const check: DemoSafetyCheck = {
        id: id('safety'),
        enrollment_id: input.enrollmentId,
        participant_user_id: DEMO_USER_MARIANA.id,
        practice_version_id: input.versionId,
        outcome: input.safetyOutcome,
        professional_rationale: input.rationale.trim(),
        reviewed_by_user_id: DEMO_USER_DAIANE.id,
        record_status: 'current',
      }
      data.safetyChecks.push(check)
      const a: CerPracticeAssignmentRecord = {
        id: id('assignment'),
        enrollment_id: input.enrollmentId,
        participant_user_id: DEMO_USER_MARIANA.id,
        care_plan_priority_id: input.priorityId,
        care_cycle_id: input.cycleId,
        practice_version_id: input.versionId,
        safety_check_id: check.id,
        operational_acceptance_id: acceptance?.id || '',
        assigned_by_user_id: DEMO_USER_DAIANE.id,
        status: 'draft',
        internal_title: input.safeTitle.trim(),
        internal_context: input.rationale.trim(),
        participant_safe_title: input.safeTitle.trim(),
        participant_safe_summary:
          input.safeSummary.trim() +
          (input.sharedCautions?.trim()
            ? '\nCuidados combinados: ' + input.sharedCautions.trim()
            : ''),
        assigned_duration: input.duration.trim(),
        assigned_frequency: input.frequency,
        participant_response_type: 'unconfirmed',
        created: now,
        updated: now,
      }
      validate(data, store, a, false)
      if (input.previousAssignmentId) {
        const previous = assignment(data, input.previousAssignmentId)
        if (previous.care_cycle_id !== a.care_cycle_id) {
          const sourceCycle = store.cycles.find((c) => c.id === previous.care_cycle_id)
          const targetCycle = store.cycles.find((c) => c.id === a.care_cycle_id)
          if (
            sourceCycle?.status !== 'closed' ||
            !(
              previous.status === 'completed' ||
              (previous.status === 'stopped' && previous.stop_reason_code === 'cycle_closed')
            )
          )
            throw new Error('Continue um experimento preservado de um ciclo encerrado.')
          if (!targetCycle || targetCycle.cycle_number <= sourceCycle.cycle_number)
            throw new Error('Escolha um ciclo posterior ao experimento de origem.')
          if (previous.practice_version_id !== a.practice_version_id)
            throw new Error('Para outra versão, prepare uma proposta independente.')
          if (
            data.assignments.some(
              (x) =>
                x.previous_assignment_id === previous.id &&
                x.care_cycle_id === a.care_cycle_id &&
                ['draft', 'active', 'paused'].includes(x.status),
            )
          )
            throw new Error('Já existe uma proposta de continuidade neste ciclo.')
        } else {
          if (!['draft', 'active', 'paused'].includes(previous.status))
            throw new Error('Adapte um experimento disponível deste mesmo ciclo.')
          previous.status = 'superseded'
          previous.updated = now
          cancelFuture(store, previous.id)
        }
        a.previous_assignment_id = previous.id
      }
      data.assignments.push(a)
      data.sharedAssignmentIds.push(a.id)
      return a
    })
  },
  activate(assignmentId: string) {
    actor('daiane')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (!['draft', 'paused'].includes(a.status))
        throw new Error('Apenas uma proposta ou prática pausada pode ser ativada.')
      const consent = validate(data, store, a)
      a.consent_id = consent?.id
      a.status = 'active'
      a.updated = new Date().toISOString()
      project(data, store, a)
      return a
    })
  },
  pause(assignmentId: string, stopped = false) {
    actor('daiane')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (!['active', 'paused', 'draft'].includes(a.status))
        throw new Error('O experimento já está encerrado.')
      a.status = stopped ? 'stopped' : 'paused'
      a.updated = new Date().toISOString()
      cancelFuture(store, a.id)
      return a
    })
  },
  complete(assignmentId: string) {
    actor('daiane')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (!['active', 'paused'].includes(a.status))
        throw new Error('Conclua um experimento em andamento ou pausado.')
      a.status = 'completed'
      a.updated = new Date().toISOString()
      cancelFuture(store, a.id)
      return a
    })
  },
  consent(
    assignmentId: string,
    decision: 'accepted' | 'declined',
    understanding: 'understood' | 'want_to_ask' | 'did_not_understand',
  ) {
    actor('mariana')
    if (
      !['accepted', 'declined'].includes(decision) ||
      !['understood', 'want_to_ask', 'did_not_understand'].includes(understanding)
    )
      throw new Error('Resposta de consentimento inválida.')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (
        !data.sharedAssignmentIds.includes(a.id) ||
        !['draft', 'active', 'paused'].includes(a.status)
      )
        throw new Error('Esta proposta não está disponível para consentimento.')
      data.consents
        .filter(
          (c) => c.practice_version_id === a.practice_version_id && c.record_status === 'current',
        )
        .forEach((c) => {
          c.record_status = 'superseded'
        })
      const now = new Date().toISOString()
      const consent: CerPracticeConsentRecord = {
        id: id('consent'),
        enrollment_id: a.enrollment_id,
        participant_user_id: a.participant_user_id,
        practice_version_id: a.practice_version_id,
        consent_text_version_ref: a.practice_version_id,
        understanding_response: understanding,
        decision,
        questions_opportunity: true,
        record_status: 'current',
        created: now,
        updated: now,
      }
      data.consents.unshift(consent)
      a.consent_id = consent.id
      if (decision === 'accepted' && understanding === 'understood' && data.understandingRequests)
        delete data.understandingRequests[a.id]
      // Refusal/questions cancel future moments without pretending they were performed.
      if (decision !== 'accepted' || understanding !== 'understood') {
        data.assignments
          .filter((x) => x.practice_version_id === a.practice_version_id)
          .forEach((x) => {
            if (x.status === 'active') x.status = 'paused'
            cancelFuture(store, x.id)
          })
      }
      return consent
    })
  },
  question(assignmentId: string, understanding: 'want_to_ask' | 'did_not_understand') {
    actor('mariana')
    if (!['want_to_ask', 'did_not_understand'].includes(understanding))
      throw new Error('Escolha o que precisa esclarecer.')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (
        !data.sharedAssignmentIds.includes(a.id) ||
        !['draft', 'active', 'paused'].includes(a.status)
      )
        throw new Error('Proposta indisponível.')
      data.understandingRequests ||= {}
      data.understandingRequests[a.id] = understanding
      if (a.status === 'active') a.status = 'paused'
      cancelFuture(store, a.id)
    })
  },
  pendingQuestion(assignmentId: string) {
    this.get(assignmentId)
    return readDemoPracticeStore().understandingRequests?.[assignmentId]
  },
  latestConsent(assignmentId: string) {
    const a = this.get(assignmentId)
    return (
      readDemoPracticeStore().consents.find(
        (c) =>
          c.practice_version_id === a.practice_version_id &&
          c.record_status !== 'superseded' &&
          (!a.previous_assignment_id || a.consent_id === c.id),
      ) || null
    )
  },
  withdraw(assignmentId: string) {
    actor('mariana')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId),
        consent = data.consents.find(
          (c) => c.practice_version_id === a.practice_version_id && c.record_status === 'current',
        )
      if (!consent || !data.sharedAssignmentIds.includes(a.id))
        throw new Error('Consentimento atual não encontrado.')
      consent.record_status = 'withdrawn'
      consent.withdrawn_at = new Date().toISOString()
      data.assignments
        .filter((x) => x.practice_version_id === a.practice_version_id)
        .forEach((x) => {
          if (x.status === 'active') x.status = 'paused'
          cancelFuture(store, x.id)
        })
    })
  },
  confirm(assignmentId: string, capacity: CapacityResponseValue) {
    actor('mariana')
    const allowed = [
      'cabe_bem',
      'cabe_se_adaptar',
      'parece_demais',
      'nao_cabe_agora',
      'ainda_nao_sei',
    ]
    if (!allowed.includes(capacity)) throw new Error('Resposta de capacidade inválida.')
    return transaction((data, store) => {
      const a = assignment(data, assignmentId)
      if (
        !data.sharedAssignmentIds.includes(a.id) ||
        !['draft', 'active', 'paused'].includes(a.status)
      )
        throw new Error('Proposta não disponível para confirmar.')
      a.capacity_response = capacity
      a.participant_response_type =
        capacity === 'cabe_bem'
          ? 'confirmed'
          : capacity === 'cabe_se_adaptar'
            ? 'wants_adaptation'
            : capacity === 'parece_demais'
              ? 'too_much_right_now'
              : 'not_now'
      a.confirmed_at = a.updated = new Date().toISOString()
      if (capacity !== 'cabe_bem') {
        cancelFuture(store, a.id)
        if (a.status === 'active') a.status = 'paused'
      } else if (a.status === 'active') project(data, store, a)
      return safeDemoAssignment(a)
    })
  },
  project(assignmentId: string) {
    actor('daiane')
    return transaction((data, store) => project(data, store, assignment(data, assignmentId)))
  },
  completeMoment(itemId: string) {
    actor('mariana')
    return transaction((data, store) => {
      const item = store.plannerItems.find(
        (i) =>
          i.id === itemId &&
          i.participant_user_id === DEMO_USER_MARIANA.id &&
          i.enrollment_id === DEMO_ENROLLMENT_ID,
      )
      if (!item || !['planned', 'active'].includes(item.status))
        throw new Error('Momento indisponível para registro.')
      const a = assignment(data, item.assignment_id)
      validate(data, store, a)
      if (
        a.status !== 'active' ||
        a.participant_response_type !== 'confirmed' ||
        a.capacity_response !== 'cabe_bem'
      )
        throw new Error('Confira o experimento antes de registrar este momento.')
      item.status = 'completed'
      item.updated = new Date().toISOString()
      return item
    })
  },
  reschedule(itemId: string, scheduledAt: string) {
    actor('mariana')
    if (
      !scheduledAt ||
      !Number.isFinite(Date.parse(scheduledAt)) ||
      Date.parse(scheduledAt) < Date.now()
    )
      throw new Error('Escolha um momento futuro válido.')
    return transaction((data, store) => {
      const item = store.plannerItems.find(
        (i) =>
          i.id === itemId &&
          i.participant_user_id === DEMO_USER_MARIANA.id &&
          ['planned', 'active'].includes(i.status),
      )
      if (!item || item.item_type === 'contextual_resource')
        throw new Error('Momento indisponível para reagendamento.')
      const a = assignment(data, item.assignment_id)
      validate(data, store, a)
      if (a.status !== 'active' || a.capacity_response !== 'cabe_bem')
        throw new Error('A prática precisa estar disponível neste momento.')
      item.scheduled_at = scheduledAt
      item.updated = new Date().toISOString()
      return item
    })
  },
  cancel(itemId: string) {
    actor('daiane')
    return transaction((_data, store) => {
      const item = store.plannerItems.find(
        (i) => i.id === itemId && ['planned', 'active'].includes(i.status),
      )
      if (!item) throw new Error('Momento indisponível para cancelamento.')
      item.status = 'cancelled'
      item.updated = new Date().toISOString()
      return item
    })
  },
  responses(enrollmentId: string) {
    actor(undefined, enrollmentId)
    const data = readDemoPracticeStore()
    return data.responses
      .filter((r) => r.enrollment_id === enrollmentId && r.record_status === 'current')
      .map((r) => ({
        ...r,
        expand: { assignment_id: safeDemoAssignment(assignment(data, r.assignment_id)) },
      }))
  },
  recordResponse(input: {
    assignment_id: string
    enrollment_id: string
    participant_user_id: string
    practice_version_id: string
    care_cycle_id: string
    planner_item_id?: string
    response_type: PracticeResponseType
    safety_flag?: PracticeResponseSafetyFlag
    shared_reflection?: string
    private_note_text?: string
    previous_response_id?: string
    [key: string]: unknown
  }) {
    actor('mariana', input.enrollment_id)
    const responseTypes = [
      'helped',
      'helped_a_bit',
      'no_perceived_difference',
      'was_difficult',
      'was_too_much',
      'could_not_do',
      'chose_not_to_do',
      'adapted',
      'did_not_make_sense',
      'wants_to_tell',
    ]
    if (
      input.safety_flag &&
      !['none', 'needs_review', 'escalation_required'].includes(input.safety_flag)
    )
      throw new Error('Sinalização de cuidado inválida.')
    if (!responseTypes.includes(input.response_type))
      throw new Error('Resposta ao experimento inválida.')
    return transaction((data, store) => {
      const a = assignment(data, input.assignment_id)
      if (!data.sharedAssignmentIds.includes(a.id) || a.status !== 'active')
        throw new Error('A prática precisa estar ativa para registrar esta experiência.')
      validate(data, store, a)
      if (
        input.participant_user_id !== a.participant_user_id ||
        input.care_cycle_id !== a.care_cycle_id ||
        input.practice_version_id !== a.practice_version_id
      )
        throw new Error('As referências da resposta não correspondem ao experimento.')
      const item = input.planner_item_id
        ? store.plannerItems.find(
            (i) =>
              i.id === input.planner_item_id &&
              i.assignment_id === a.id &&
              ['planned', 'active'].includes(i.status),
          )
        : undefined
      if (input.planner_item_id && !item)
        throw new Error('Este momento não está disponível no Planner.')
      const previous = input.previous_response_id
        ? data.responses.find(
            (r) =>
              r.id === input.previous_response_id &&
              r.assignment_id === a.id &&
              r.participant_user_id === a.participant_user_id &&
              r.record_status === 'current',
          )
        : undefined
      if (input.previous_response_id && !previous)
        throw new Error('Resposta anterior não encontrada neste experimento.')
      if (previous) previous.record_status = 'superseded'
      const now = new Date().toISOString()
      const flag =
        input.safety_flag && input.safety_flag !== 'none'
          ? input.safety_flag
          : input.response_type === 'was_too_much'
            ? 'needs_review'
            : 'none'
      const response: CerPracticeResponseRecord = {
        id: id('response'),
        assignment_id: a.id,
        enrollment_id: a.enrollment_id,
        participant_user_id: a.participant_user_id,
        practice_version_id: a.practice_version_id,
        care_cycle_id: a.care_cycle_id,
        planner_item_id: item?.id,
        response_type: input.response_type,
        safety_flag: flag,
        shared_reflection: input.shared_reflection?.trim(),
        previous_response_id: previous?.id,
        record_status: 'current',
        created: now,
        updated: now,
      }
      for (const field of [
        'perceived_helpfulness',
        'difficulty',
        'completed_repetitions',
        'completed_cycles',
        'completed_series',
        'actual_duration_seconds',
      ]) {
        const value = input[field]
        if (typeof value === 'number' && Number.isFinite(value))
          (response as unknown as Record<string, unknown>)[field] = Math.max(0, value)
      }
      if (typeof input.adaptation_used === 'string')
        response.adaptation_used = input.adaptation_used.trim()
      if (typeof input.wants_to_continue === 'boolean')
        response.wants_to_continue = input.wants_to_continue
      if (typeof input.ended_early === 'boolean') response.ended_early = input.ended_early
      if (typeof input.stop_reason === 'string') response.stop_reason = input.stop_reason
      if (
        Array.isArray(input.completed_step_ids) &&
        input.completed_step_ids.every((v) => typeof v === 'string')
      )
        response.completed_step_ids = input.completed_step_ids as string[]
      data.responses.unshift(response)
      let privateNote: CerPracticeResponsePrivateNoteRecord | undefined
      if (input.private_note_text?.trim()) {
        privateNote = {
          id: id('private-note'),
          response_id: response.id,
          enrollment_id: a.enrollment_id,
          participant_user_id: a.participant_user_id,
          note_text: input.private_note_text.trim(),
          status: 'current',
          created: now,
          updated: now,
        }
        data.privateNotes.push(privateNote)
      }
      if (item) {
        item.status = 'completed'
        item.updated = now
      }
      return { response, privateNote }
    })
  },
  privateNotes(enrollmentId: string, participantId: string) {
    actor('mariana', enrollmentId)
    if (participantId !== DEMO_USER_MARIANA.id)
      throw new Error('Notas disponíveis somente para a própria interagente.')
    return readDemoPracticeStore().privateNotes.filter(
      (n) => n.enrollment_id === enrollmentId && n.participant_user_id === participantId,
    )
  },
}
