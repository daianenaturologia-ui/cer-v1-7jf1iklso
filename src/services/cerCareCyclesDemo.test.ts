import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID as enrollment } from './demoAdapter'
import { cerCareCycleService as cycles } from './cerCareCycleService'
import { cerCycleInvitationService as invitations } from './cerCycleInvitationService'
import { cerCycleReviewService as reviews } from './cerCycleReviewService'
import { cerPlannerService as planner } from './cerPlannerService'
const network = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Backend must not be called in demo')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: network } }))
let planId: string
beforeEach(() => {
  vi.restoreAllMocks()
  network.mockClear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
  const plan = demoAdapter.createDraftPlan({
    enrollment_id: enrollment,
    direction_statement: 'Direção privada',
    direction_mode: 'authored',
  })
  demoAdapter.activatePlan(plan.id)
  planId = plan.id
})
afterEach(() => expect(network).not.toHaveBeenCalled())
async function activeCycle() {
  const cycle = await cycles.create({ plan_id: planId, professional_notes: 'Síntese privada' })
  return cycles.act(cycle.id, 'start')
}
describe('Ciclos e convites da demonstração', () => {
  it('preserva respostas existentes e o histórico; não fixa duração', async () => {
    demoAdapter.saveExperienceResponse({
      enrollmentId: enrollment,
      experienceId: 'teste-preservacao',
      promptId: 'resposta-existente',
      respondentUserId: 'demo-user-mariana',
      responseType: 'text',
      promptVersion: 1,
      freeText: 'Resposta preenchida antes do ciclo',
      promptKey: 'resposta-existente',
    })
    const before = JSON.parse(localStorage.getItem('cer_demo_mode_state_v3')!).experienceResponses
    const cycle = await activeCycle()
    expect(cycle.planned_end_date).toBeUndefined()
    await cycles.act(cycle.id, 'pause')
    await cycles.act(cycle.id, 'resume')
    await cycles.act(cycle.id, 'close')
    expect((await cycles.list(enrollment))[0].status).toBe('closed')
    await expect(cycles.act(cycle.id, 'resume')).rejects.toThrow()
    expect(JSON.parse(localStorage.getItem('cer_demo_mode_state_v3')!).experienceResponses).toEqual(
      before,
    )
  })
  it('impede dois ciclos ativos e ativação com plano inativo', async () => {
    await activeCycle()
    const second = await cycles.create({ plan_id: planId })
    await expect(cycles.act(second.id, 'start')).rejects.toThrow('Já existe')
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000)
    const draft = demoAdapter.createDraftPlan({
      enrollment_id: enrollment,
      direction_mode: 'authored',
    })
    await expect(cycles.create({ plan_id: draft.id })).rejects.toThrow('Ative')
    expect((await cycles.list(enrollment)).filter((c) => c.status === 'active')).toHaveLength(1)
  })
  it('compartilha somente convite/retorno e protege autoria das decisões', async () => {
    const cycle = await activeCycle()
    await reviews.createReview({
      enrollment_id: enrollment,
      care_cycle_id: cycle.id,
      created_by_user_id: demoAdapter.getCurrentUser().id,
      status: 'draft',
      professional_summary: 'Segredo clínico',
    })
    const invite = await invitations.invite(enrollment, cycle.id, 'Como foi seu ciclo?')
    await expect(invitations.respond(invite.id, 'Texto')).rejects.toThrow('interagente')
    demoAdapter.setActivePersona('mariana')
    await expect(reviews.getByCycleId(cycle.id)).rejects.toThrow('profissional')
    await expect(cycles.list(enrollment)).rejects.toThrow('profissional')
    expect(JSON.stringify(await invitations.list(enrollment))).not.toMatch(
      /Segredo|Síntese privada|Direção privada/,
    )
    await invitations.respond(invite.id, 'Preciso de mais tempo')
    await expect(invitations.respond(invite.id, 'Sobrescrever')).rejects.toThrow('já respondido')
    demoAdapter.setActivePersona('daiane')
    expect((await invitations.list(enrollment))[0].participant_reflection).toBe(
      'Preciso de mais tempo',
    )
    expect((await reviews.getByCycleId(cycle.id))?.professional_summary).toBe('Segredo clínico')
    expect((await cycles.list(enrollment))[0].status).toBe('active')
  })
  it('não declara sucesso nem modifica memória quando armazenamento falha', async () => {
    const cycle = await activeCycle()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Sem espaço')
    })
    await expect(cycles.act(cycle.id, 'pause')).rejects.toThrow('Sem espaço')
    expect((await cycles.list(enrollment))[0].status).toBe('active')
  })
  it('recusa convite em ciclo planejado e matrícula diferente', async () => {
    const cycle = await cycles.create({ plan_id: planId })
    await expect(invitations.invite(enrollment, cycle.id, 'Convite')).rejects.toThrow('Inicie')
    await expect(invitations.list('outro')).rejects.toThrow('Matrícula')
  })
  it('planner da interagente não expande registros internos nem acessa backend', async () => {
    const store = demoAdapter.readCareStore()
    store.plannerItems.push({
      id: 'item',
      enrollment_id: enrollment,
      participant_user_id: 'demo-user-mariana',
      status: 'planned',
      safe_title: 'Momento combinado',
      expand: { care_cycle_id: { professional_notes: 'Segredo' } },
    } as any)
    demoAdapter.writeCareStore(store)
    demoAdapter.setActivePersona('mariana')
    expect(
      JSON.stringify(await planner.listForParticipant(enrollment, 'demo-user-mariana')),
    ).not.toContain('Segredo')
    await expect(planner.completeItem('item')).rejects.toThrow('Experimento não encontrado')
    expect((await planner.listForParticipant(enrollment, 'demo-user-mariana'))[0].status).toBe(
      'planned',
    )
    await expect(planner.createItem({} as any)).rejects.toThrow('projetados')
  })
})
