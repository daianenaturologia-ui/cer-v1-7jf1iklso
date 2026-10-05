import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  sharedFutureDirections,
  requireSharedFuture,
  developmentPresentation,
} from './developmentPlanning'
import { lifeDirectionsService, type LifeDirection } from './lifeDirections'
import { cerCarePlanService } from './cerCarePlanService'
import { getDemoMandalaProjection } from './cerMandalaService'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
import type { CerCarePlanPriorityRecord } from '@/types/cer'
const network = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Unexpected backend call')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: network, authStore: {} } }))
const source: LifeDirection = {
  id: 'future',
  enrollment_id: DEMO_ENROLLMENT_ID,
  kind: 'future',
  horizon: 'open',
  title: 'Meu projeto',
  narrative: 'Quero espaço',
  meaning: '',
  resources: 'Rede de apoio',
  limits: '',
  first_step: '',
  access_class: 'participant_shared',
}
beforeEach(() => {
  vi.restoreAllMocks()
  network.mockClear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
})
describe('Direção, plano e recursos do desenvolvimento', () => {
  it('oferece somente futuro compartilhado desta pessoa', () => {
    const values = [
      source,
      { ...source, id: 'private', access_class: 'participant_private' as const },
      { ...source, id: 'other', enrollment_id: 'other' },
      { ...source, id: 'present', kind: 'present' as const, horizon: 'now' as const },
    ]
    expect(sharedFutureDirections(values, DEMO_ENROLLMENT_ID)).toEqual([source])
    expect(() => requireSharedFuture(values, DEMO_ENROLLMENT_ID, 'private')).toThrow()
  })
  it('reconfere compartilhamento antes de salvar; recusa fonte revogada sem escrever plano', async () => {
    vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([
      { ...source, access_class: 'participant_private' },
    ])
    const before = demoAdapter.listPlans(DEMO_ENROLLMENT_ID)
    await expect(
      cerCarePlanService.createDraftPlan({
        enrollment_id: DEMO_ENROLLMENT_ID,
        direction_source_id: source.id,
        direction_mode: 'reused',
        direction_statement: 'Combinada',
      }),
    ).rejects.toThrow('compartilhada')
    expect(demoAdapter.listPlans(DEMO_ENROLLMENT_ID)).toEqual(before)
    expect(network).not.toHaveBeenCalled()
  })
  it('persiste a origem sem escolher ou substituir o enunciado combinado', async () => {
    vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([source])
    const plan = await cerCarePlanService.createDraftPlan({
      enrollment_id: DEMO_ENROLLMENT_ID,
      direction_source_id: source.id,
      direction_mode: 'reused',
      direction_statement: 'Um pequeno espaço possível',
    })
    expect(plan.direction_source_id).toBe(source.id)
    expect(
      demoAdapter.listPlans(DEMO_ENROLLMENT_ID).find((p) => p.id === plan.id)?.direction_statement,
    ).toBe('Um pequeno espaço possível')
    expect(network).not.toHaveBeenCalled()
  })
  it('a prévia leva detalhes do plano compartilhável e exclui prioridades e fundamentos privados', () => {
    const priority = {
      title: 'Reservar tempo',
      description: 'Habilidade: negociar. Alternativa: reduzir.',
      is_possible_now: true,
      access_class: 'shared_care',
      professional_rationale: 'segredo',
    } as CerCarePlanPriorityRecord
    const text = developmentPresentation({ direction_statement: 'Meu projeto' }, [
      priority,
      {
        ...priority,
        title: 'privado',
        description: 'confidencial',
        access_class: 'professional_private',
      },
    ])
    expect(text).toContain(priority.description)
    expect(text).not.toMatch(/segredo|privado|confidencial/)
  })
  it('a Mandala lê recursos compartilhados; exclui privados e outra pessoa nas duas visões', () => {
    const values = [
      source,
      {
        ...source,
        id: 'private',
        resources: 'segredo',
        access_class: 'participant_private' as const,
      },
      { ...source, enrollment_id: 'other', resources: 'outro' },
    ]
    for (const audience of ['professional', 'participant'] as const) {
      const projection = getDemoMandalaProjection(DEMO_ENROLLMENT_ID, audience, values)
      expect(projection.recognized_resources).toHaveLength(1)
      expect(projection.recognized_resources[0].statement).toContain('Rede de apoio')
      expect(JSON.stringify(projection.recognized_resources)).not.toMatch(/segredo|outro/)
    }
  })
})
