import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  isEnabled: vi.fn(() => true),
  getActivePersona: vi.fn(() => 'daiane'),
  listPlans: vi.fn(),
  listPriorities: vi.fn(),
  listPresentedForParticipant: vi.fn(),
}))
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: mocks.collection } }))
vi.mock('./demoAdapter', () => ({ demoAdapter: mocks }))
import { cerMandalaReadModelService } from './cerMandalaService'

const draft = {
  id: 'plan-a',
  enrollment_id: 'a',
  status: 'draft',
  direction_mode: 'reused',
  direction_statement: 'Direção interna',
  professional_rationale: 'Fundamento privado',
}
const shared = {
  id: 'presentation-a',
  enrollment_id: 'a',
  plan_id: 'plan-a',
  status: 'presented',
  participant_title: 'Nosso cuidado',
  participant_summary: 'Texto conferido e compartilhado',
  practical_invitation: 'Conversar sobre o próximo passo',
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.isEnabled.mockReturnValue(true)
  mocks.getActivePersona.mockReturnValue('daiane')
  mocks.listPlans.mockImplementation((id) => (id === 'a' ? [draft] : []))
  mocks.listPresentedForParticipant.mockImplementation((id) => (id === 'a' ? [shared] : []))
  mocks.listPriorities.mockReturnValue([
    { id: 'p1', status: 'active', title: 'Prioridade interna', professional_rationale: 'Segredo' },
    { id: 'p2', status: 'candidate', title: 'Ainda em discussão' },
    { id: 'p3', status: 'archived', title: 'Histórica' },
  ])
})
describe('Mandala de demonstração com registros existentes', () => {
  it('lê direção e prioridades profissionais sem chamar servidor', async () => {
    const result = await cerMandalaReadModelService.getMandalaProjection('a', 'professional')
    expect(result.direction?.statement).toBe('Direção interna')
    expect(result.active_priorities.map((value) => value.title)).toEqual(['Prioridade interna'])
    expect(JSON.stringify(result)).not.toContain('Fundamento privado')
    expect(JSON.stringify(result)).not.toContain('Segredo')
    expect(mocks.collection).not.toHaveBeenCalled()
  })
  it('participante recebe somente a apresentação conferida, sem ler prioridades internas', async () => {
    mocks.getActivePersona.mockReturnValue('mariana')
    const result = await cerMandalaReadModelService.getMandalaProjection('a')
    expect(result.direction?.statement).toBe('Texto conferido e compartilhado')
    expect(result.evolution_highlights).toEqual(['Conversar sobre o próximo passo'])
    expect(JSON.stringify(result)).not.toContain('Direção interna')
    expect(mocks.listPriorities).not.toHaveBeenCalled()
    expect(mocks.collection).not.toHaveBeenCalled()
  })
  it('ativar um plano não equivale a compartilhá-lo', async () => {
    mocks.listPlans.mockReturnValue([{ ...draft, status: 'active' }])
    mocks.listPresentedForParticipant.mockReturnValue([])
    const result = await cerMandalaReadModelService.getMandalaProjection('a')
    expect(result.direction).toBeUndefined()
    expect(result.active_priorities).toEqual([])
  })
  it('não usa apresentações retiradas ou de outra revisão do plano', async () => {
    mocks.listPresentedForParticipant.mockReturnValue([
      { ...shared, status: 'withdrawn' },
      { ...shared, plan_id: 'plan-anterior' },
    ])
    const result = await cerMandalaReadModelService.getMandalaProjection('a')
    expect(result.direction).toBeUndefined()
  })
  it('outra matrícula recebe um estado vazio honesto', async () => {
    const result = await cerMandalaReadModelService.getMandalaProjection('b')
    expect(result.direction).toBeUndefined()
    expect(result.active_priorities).toEqual([])
    expect(result.active_experiments).toEqual([])
    expect(result.recent_movement.total_recorded_responses).toBe(0)
    expect(mocks.collection).not.toHaveBeenCalled()
  })
  it('interagente não pode pedir projeção profissional na demonstração', async () => {
    mocks.getActivePersona.mockReturnValue('mariana')
    await expect(
      cerMandalaReadModelService.getMandalaProjection('a', 'professional'),
    ).rejects.toThrow('visão profissional')
    expect(mocks.listPlans).not.toHaveBeenCalled()
    expect(mocks.collection).not.toHaveBeenCalled()
  })
  it('não altera os registros usados para a projeção', async () => {
    const original = JSON.stringify({ draft, shared })
    await cerMandalaReadModelService.getMandalaProjection('a')
    await cerMandalaReadModelService.getMandalaProjection('a', 'professional')
    expect(JSON.stringify({ draft, shared })).toBe(original)
  })
})
