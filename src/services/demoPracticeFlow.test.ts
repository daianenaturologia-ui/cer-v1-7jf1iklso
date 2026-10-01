import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID as enrollment } from './demoAdapter'
import {
  demoPracticeFlow as flow,
  readDemoPracticeStore,
  DEMO_PRACTICE_CATALOG,
} from './demoPracticeFlow'
import { cerCareCycleService as cycles } from './cerCareCycleService'
import { cerPlannerService as planner } from './cerPlannerService'
import { cerPracticeAssignmentService as assignments } from './cerPracticeAssignmentService'
import { cerPracticeResponseService as responses } from './cerPracticeResponseService'
import { getDemoMandalaProjection } from './cerMandalaService'
const network = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('No backend calls for demo')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: network } }))
let plan: any, priority: any, cycle: any, presentation: any
beforeEach(async () => {
  vi.restoreAllMocks()
  network.mockClear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
  plan = demoAdapter.createDraftPlan({
    enrollment_id: enrollment,
    direction_mode: 'authored',
    direction_statement: 'Direção interna',
    professional_rationale: 'Segredo profissional',
  })
  demoAdapter.activatePlan(plan.id)
  priority = demoAdapter.addPriority({
    plan_id: plan.id,
    title: 'Foco interno',
    professional_rationale: 'Fundamento privado',
  })
  demoAdapter.updateDemoPriorityStatus(priority.id, 'active')
  presentation = demoAdapter.createPresentation({
    plan_id: plan.id,
    priority_id: priority.id,
    participant_title: 'Foco conferido',
    participant_summary: 'Direção compartilhada',
  })
  demoAdapter.presentPresentation(presentation.id)
  demoAdapter.setActivePersona('mariana')
  demoAdapter.recordAcceptance({ presentation_id: presentation.id, response_type: 'wants_to_try' })
  demoAdapter.setActivePersona('daiane')
  cycle = await cycles.create({ plan_id: plan.id, focus_summary: 'Foco profissional privado' })
  await cycles.act(cycle.id, 'start')
})
afterEach(() => expect(network).not.toHaveBeenCalled())
function prepare(extra = {}) {
  return flow.prepare({
    enrollmentId: enrollment,
    priorityId: priority.id,
    cycleId: cycle.id,
    versionId: DEMO_PRACTICE_CATALOG[0].id,
    safeTitle: 'Pequeno passo',
    safeSummary: 'Uma ação escolhida em conversa. Pode pausar.',
    duration: 'Tempo possível',
    frequency: 'daily',
    safetyOutcome: 'eligible',
    rationale: 'Checagem profissional interna',
    ...extra,
  })
}
function agree(a: any) {
  demoAdapter.setActivePersona('mariana')
  flow.consent(a.id, 'accepted', 'understood')
  flow.confirm(a.id, 'cabe_bem')
  demoAdapter.setActivePersona('daiane')
  flow.activate(a.id)
}
function response(a: any, extra = {}) {
  return responses.recordResponse({
    assignment_id: a.id,
    enrollment_id: enrollment,
    participant_user_id: 'demo-user-mariana',
    care_cycle_id: cycle.id,
    practice_version_id: a.practice_version_id,
    response_type: 'helped',
    ...extra,
  })
}
describe('Fluxo integrado de experimentos fictícios', () => {
  it('exige foco aceito, ciclo ativo e checagem explícita; falhas não deixam propostas parciais', async () => {
    for (const outcome of [
      'insufficient_information',
      'requires_professional_review',
      'requires_supervision',
      'not_currently_indicated',
    ])
      expect(() => prepare({ safetyOutcome: outcome })).toThrow('checagem')
    expect(() => prepare({ rationale: '' })).toThrow('checagem')
    expect(() => prepare({ safetyOutcome: 'eligible_with_caution' })).toThrow('cuidados')
    demoAdapter.setActivePersona('mariana')
    demoAdapter.recordAcceptance({ presentation_id: presentation.id, response_type: 'not_now' })
    demoAdapter.setActivePersona('daiane')
    expect(() => prepare()).toThrow('aceite')
    expect(readDemoPracticeStore().assignments).toHaveLength(0)
    await cycles.act(cycle.id, 'pause')
    expect(() => prepare()).toThrow('ciclo')
  })
  it('bloqueia ativação sem consentimento desta versão e não cria momentos antes da capacidade', () => {
    const a = prepare()
    expect(() => flow.activate(a.id)).toThrow('compreender')
    demoAdapter.setActivePersona('mariana')
    flow.consent(a.id, 'accepted', 'want_to_ask')
    demoAdapter.setActivePersona('daiane')
    expect(() => flow.activate(a.id)).toThrow('compreender')
    demoAdapter.setActivePersona('mariana')
    flow.consent(a.id, 'accepted', 'understood')
    demoAdapter.setActivePersona('daiane')
    flow.activate(a.id)
    expect(demoAdapter.readCareStore().plannerItems).toHaveLength(0)
    demoAdapter.setActivePersona('mariana')
    flow.confirm(a.id, 'cabe_bem')
    expect(demoAdapter.readCareStore().plannerItems).toHaveLength(3)
  })
  it('projeta até três momentos, respeita frequência e não duplica ocorrências ou histórico', async () => {
    const a = prepare({ frequency: 'twice_a_week' })
    agree(a)
    const first = demoAdapter.readCareStore().plannerItems
    expect(first).toHaveLength(2)
    expect(
      Math.round(
        (Date.parse(first[1].scheduled_at!) - Date.parse(first[0].scheduled_at!)) / 86400000,
      ),
    ).toBe(3)
    flow.project(a.id)
    expect(demoAdapter.readCareStore().plannerItems).toHaveLength(2)
    demoAdapter.setActivePersona('mariana')
    await planner.completeItem(first[0].id)
    demoAdapter.setActivePersona('daiane')
    flow.project(a.id)
    expect(demoAdapter.readCareStore().plannerItems).toHaveLength(2)
    expect(demoAdapter.readCareStore().plannerItems[0].status).toBe('completed')
  })
  it('recurso contextual permanece único e não inventa data de execução', () => {
    const a = prepare({ versionId: DEMO_PRACTICE_CATALOG[1].id, frequency: 'as_needed' })
    agree(a)
    flow.project(a.id)
    const items = demoAdapter.readCareStore().plannerItems
    expect(items).toHaveLength(1)
    expect(items[0].item_type).toBe('contextual_resource')
    expect(items[0].scheduled_at).toBeUndefined()
  })
  it('retirar consentimento pausa todas as práticas desta versão e preserva os momentos realizados', async () => {
    const a = prepare()
    agree(a)
    const b = prepare()
    flow.activate(b.id)
    const first = demoAdapter.readCareStore().plannerItems[0]
    demoAdapter.setActivePersona('mariana')
    await planner.completeItem(first.id)
    flow.withdraw(a.id)
    expect(flow.list(enrollment).every((a) => a.status === 'paused')).toBe(true)
    expect(demoAdapter.readCareStore().plannerItems.find((i) => i.id === first.id)?.status).toBe(
      'completed',
    )
    expect(
      demoAdapter
        .readCareStore()
        .plannerItems.filter((i) => ['planned', 'active'].includes(i.status)),
    ).toHaveLength(0)
    await expect(response(a)).rejects.toThrow('ativa')
  })
  it('percepção e notas íntimas têm destinos separados; Mandala e resposta profissional usam só campos compartilhados', async () => {
    const a = prepare()
    agree(a)
    demoAdapter.setActivePersona('mariana')
    const saved = await response(a, {
      shared_reflection: 'Foi possível',
      private_note_text: 'Meu segredo íntimo',
      response_type: 'was_too_much',
    })
    expect(saved.response.safety_flag).toBe('needs_review')
    expect((await assignments.listByEnrollment(enrollment))[0].internal_context).toBeUndefined()
    expect(JSON.stringify(getDemoMandalaProjection(enrollment, 'participant'))).not.toMatch(
      /Segredo profissional|Fundamento privado|Checagem profissional interna|Foco profissional privado|Meu segredo íntimo/,
    )
    expect(
      getDemoMandalaProjection(enrollment, 'participant').recent_movement.total_recorded_responses,
    ).toBe(1)
    expect(
      (await responses.listParticipantPrivateNotes(enrollment, 'demo-user-mariana'))[0].note_text,
    ).toBe('Meu segredo íntimo')
    demoAdapter.setActivePersona('daiane')
    await expect(
      responses.listParticipantPrivateNotes(enrollment, 'demo-user-mariana'),
    ).rejects.toThrow('perfil')
    expect(JSON.stringify(await responses.listByEnrollment(enrollment))).not.toMatch(
      /Meu segredo íntimo|Checagem profissional interna/,
    )
  })
  it('recusa papéis trocados, referências de outro experimento e mantém memória em falha de salvamento', async () => {
    const a = prepare()
    agree(a)
    expect(() => flow.confirm(a.id, 'cabe_bem')).toThrow('perfil')
    demoAdapter.setActivePersona('mariana')
    expect(() => flow.activate(a.id)).toThrow('perfil')
    await expect(response(a, { practice_version_id: 'outra-versao' })).rejects.toThrow(
      'referências',
    )
    const before = localStorage.getItem('cer_demo_mode_state_v3')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Sem espaço')
    })
    await expect(response(a)).rejects.toThrow('Sem espaço')
    expect(readDemoPracticeStore().responses).toHaveLength(0)
    expect(localStorage.getItem('cer_demo_mode_state_v3')).toBe(before)
  })
  it('pausar ou encerrar o ciclo bloqueia execução, preserva histórico e exige reprojeção explícita', async () => {
    const a = prepare()
    agree(a)
    demoAdapter.setActivePersona('mariana')
    await response(a)
    demoAdapter.setActivePersona('daiane')
    await cycles.act(cycle.id, 'pause')
    demoAdapter.setActivePersona('mariana')
    await expect(response(a)).rejects.toThrow('ciclo')
    demoAdapter.setActivePersona('daiane')
    await cycles.act(cycle.id, 'resume')
    flow.project(a.id)
    await cycles.act(cycle.id, 'close')
    expect(flow.list(enrollment)[0].status).toBe('stopped')
    expect(readDemoPracticeStore().responses).toHaveLength(1)
    expect(
      demoAdapter
        .readCareStore()
        .plannerItems.filter((i) => ['planned', 'active'].includes(i.status)),
    ).toHaveLength(0)
  })
  it('reagendamento respeita autoria e não cria resposta nem altera as respostas dos questionários', async () => {
    demoAdapter.saveExperienceResponse({
      enrollmentId: enrollment,
      experienceId: 'existing-test',
      promptId: 'existing',
      respondentUserId: 'demo-user-mariana',
      responseType: 'text',
      promptVersion: 1,
      freeText: 'Preenchida antes dos experimentos',
    })
    const before = JSON.parse(localStorage.getItem('cer_demo_mode_state_v3')!).experienceResponses
    const a = prepare()
    agree(a)
    const item = demoAdapter.readCareStore().plannerItems[0]
    demoAdapter.setActivePersona('mariana')
    await planner.rescheduleItem(item.id, {
      scheduled_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    demoAdapter.setActivePersona('daiane')
    flow.project(a.id)
    expect(
      demoAdapter
        .readCareStore()
        .plannerItems.filter((i) => ['planned', 'active'].includes(i.status)),
    ).toHaveLength(3)
    expect(readDemoPracticeStore().responses).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem('cer_demo_mode_state_v3')!).experienceResponses).toEqual(
      before,
    )
  })
  it('adaptação material mantém proveniência e histórico e exige novo retorno de capacidade', async () => {
    const original = prepare()
    agree(original)
    const first = demoAdapter.readCareStore().plannerItems[0]
    demoAdapter.setActivePersona('mariana')
    await planner.completeItem(first.id)
    demoAdapter.setActivePersona('daiane')
    const adapted = prepare({
      previousAssignmentId: original.id,
      safeSummary: 'Passo menor, conferido novamente.',
      duration: 'Menos tempo',
    })
    expect(adapted.previous_assignment_id).toBe(original.id)
    expect(flow.get(original.id).status).toBe('superseded')
    expect(demoAdapter.readCareStore().plannerItems.find((i) => i.id === first.id)?.status).toBe(
      'completed',
    )
    expect(() => flow.activate(adapted.id)).toThrow('novo convite')
    demoAdapter.setActivePersona('mariana')
    flow.consent(adapted.id, 'accepted', 'understood')
    demoAdapter.setActivePersona('daiane')
    flow.activate(adapted.id)
    expect(
      demoAdapter.readCareStore().plannerItems.filter((i) => i.assignment_id === adapted.id),
    ).toHaveLength(0)
    demoAdapter.setActivePersona('mariana')
    flow.confirm(adapted.id, 'cabe_bem')
    expect(
      demoAdapter.readCareStore().plannerItems.filter((i) => i.assignment_id === adapted.id),
    ).toHaveLength(3)
  })
  it('conclusão é explícita e não é inferida das ocorrências realizadas', async () => {
    const a = prepare()
    agree(a)
    demoAdapter.setActivePersona('mariana')
    for (const item of demoAdapter.readCareStore().plannerItems) await planner.completeItem(item.id)
    demoAdapter.setActivePersona('daiane')
    expect(flow.get(a.id).status).toBe('active')
    flow.complete(a.id)
    expect(flow.get(a.id).status).toBe('completed')
    expect(() => flow.activate(a.id)).toThrow('proposta')
  })
})

describe('Continuidade entre ciclos', () => {
  async function nextCycle() {
    await cycles.act(cycle.id, 'close')
    const next = await cycles.create({ plan_id: plan.id, focus_summary: 'Novo foco interno' })
    await cycles.act(next.id, 'start')
    return next
  }
  it('preserva a origem e exige novo convite e capacidade antes de novos momentos', async () => {
    const original = prepare()
    agree(original)
    demoAdapter.setActivePersona('mariana')
    const first = demoAdapter.readCareStore().plannerItems[0]
    await planner.completeItem(first.id)
    demoAdapter.setActivePersona('daiane')
    const next = await nextCycle()
    const before = flow.get(original.id)
    const continued = prepare({ cycleId: next.id, previousAssignmentId: original.id })
    expect(flow.get(original.id)).toEqual(before)
    expect(continued.previous_assignment_id).toBe(original.id)
    expect(continued.safety_check_id).not.toBe(original.safety_check_id)
    expect(continued.participant_response_type).toBe('unconfirmed')
    expect(() => flow.activate(continued.id)).toThrow('novo convite')
    demoAdapter.setActivePersona('mariana')
    expect(flow.latestConsent(continued.id)).toBeNull()
    flow.consent(continued.id, 'accepted', 'understood')
    demoAdapter.setActivePersona('daiane')
    flow.activate(continued.id)
    expect(
      demoAdapter.readCareStore().plannerItems.filter((i) => i.assignment_id === continued.id),
    ).toHaveLength(0)
    demoAdapter.setActivePersona('mariana')
    flow.confirm(continued.id, 'cabe_bem')
    const items = demoAdapter.readCareStore().plannerItems
    expect(
      items.filter((i) => i.assignment_id === continued.id && i.care_cycle_id === next.id),
    ).toHaveLength(3)
    expect(items.find((i) => i.id === first.id)?.status).toBe('completed')
    expect(
      items.filter((i) => i.assignment_id === original.id && i.status === 'cancelled'),
    ).toHaveLength(2)
  })
  it('recusa origem pausada, repetição, outra versão e checagem incompleta sem gravação parcial', async () => {
    const original = prepare()
    agree(original)
    await cycles.act(cycle.id, 'pause')
    const next = await cycles.create({ plan_id: plan.id })
    await cycles.act(next.id, 'start')
    expect(() => prepare({ cycleId: next.id, previousAssignmentId: original.id })).toThrow(
      'encerrado',
    )
    await cycles.act(cycle.id, 'close')
    expect(() =>
      prepare({
        cycleId: next.id,
        previousAssignmentId: original.id,
        versionId: DEMO_PRACTICE_CATALOG[1].id,
      }),
    ).toThrow('outra versão')
    expect(() =>
      prepare({ cycleId: next.id, previousAssignmentId: original.id, rationale: '' }),
    ).toThrow('checagem')
    const continued = prepare({ cycleId: next.id, previousAssignmentId: original.id })
    expect(() => prepare({ cycleId: next.id, previousAssignmentId: original.id })).toThrow(
      'Já existe',
    )
    expect(readDemoPracticeStore().assignments.map((a) => a.id)).toEqual([
      original.id,
      continued.id,
    ])
  })
  it('recusa continuidade de interrompido por decisão própria e actor indevido', async () => {
    const original = prepare()
    flow.pause(original.id, true)
    const next = await nextCycle()
    expect(() => prepare({ cycleId: next.id, previousAssignmentId: original.id })).toThrow(
      'encerrado',
    )
    demoAdapter.setActivePersona('mariana')
    expect(() => prepare({ cycleId: next.id, previousAssignmentId: original.id })).toThrow('perfil')
  })
  it('serviço exige revisão explícita e não transporta aceite de outra prioridade', async () => {
    const original = prepare()
    const next = await nextCycle()
    await expect(
      assignments.carryForwardToNewCycle(original.id, next.id, priority.id, 'demo-user-daiane'),
    ).rejects.toThrow('checagem')
    const other = demoAdapter.addPriority({ plan_id: plan.id, title: 'Outro foco' })
    demoAdapter.updateDemoPriorityStatus(other.id, 'active')
    expect(() =>
      prepare({ cycleId: next.id, priorityId: other.id, previousAssignmentId: original.id }),
    ).toThrow('aceite')
    const continued = await assignments.carryForwardToNewCycle(
      original.id,
      next.id,
      priority.id,
      'demo-user-daiane',
      {
        safeTitle: 'Passo conferido',
        safeSummary: 'Orientações atuais',
        duration: 'Tempo possível',
        frequency: 'daily',
        safetyOutcome: 'eligible',
        rationale: 'Nova checagem explícita',
      },
    )
    expect(continued.status).toBe('draft')
    expect(continued.care_cycle_id).toBe(next.id)
  })
})
