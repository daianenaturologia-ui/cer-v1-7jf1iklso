import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('./demoAdapter', () => ({
  demoAdapter: { isEnabled: () => true, getActivePersona: () => persona },
  DEMO_ENROLLMENT_ID: 'demo-enr-01',
  DEMO_USER_DAIANE: { id: 'demo-professional' },
}))
vi.mock('@/lib/pocketbase/client', () => ({
  default: { authStore: { record: { id: 'demo-professional' } } },
}))
import { developmentPlanService as service } from './developmentPlanService'
import {
  emptyPlanDocument,
  routineEvents,
  validatePlanDocument,
  zonedInstant,
  type PlanDocument,
  type PlanRoutine,
} from './developmentPlanDocument'
let persona = 'daiane'
const document = (): PlanDocument => ({
  ...emptyPlanDocument(),
  moment: 'Síntese compartilhável',
  priorities: 'Prioridade',
  goals: [
    {
      id: 'goal-1',
      title: 'Descansar',
      progress: 'Ter espaço na semana',
      actions: [
        {
          id: 'action-1',
          title: 'Encerrar o trabalho',
          context: 'Preparar pendências',
          fallback: 'Um dia de cada vez',
        },
      ],
    },
  ],
})
beforeEach(() => {
  localStorage.clear()
  persona = 'daiane'
})
describe('written development plan', () => {
  it('keeps preparation private and freezes explicitly shared versions', async () => {
    const draft = await service.save('demo-enr-01', document(), 'NOTA PROFISSIONAL PRIVADA', null)
    persona = 'mariana'
    await expect(service.draft('demo-enr-01')).rejects.toThrow()
    expect(await service.versions('demo-enr-01')).toEqual([])
    persona = 'daiane'
    await service.share(draft, 'building')
    const next = await service.save(
      'demo-enr-01',
      { ...document(), moment: 'Nova revisão privada' },
      'Outra nota',
      draft,
    )
    persona = 'mariana'
    expect((await service.versions('demo-enr-01'))[0].document.moment).toBe(
      'Síntese compartilhável',
    )
    expect(JSON.stringify(await service.versions('demo-enr-01'))).not.toContain('PRIVADA')
    await expect(service.save('demo-enr-01', document(), '', next)).rejects.toThrow()
  })
  it('rejects stale edits, partial agreement and duplicate identifiers', async () => {
    const first = await service.save('demo-enr-01', document(), '', null)
    await service.save('demo-enr-01', document(), '', first)
    await expect(service.save('demo-enr-01', document(), '', first)).rejects.toThrow('outra janela')
    expect(() => validatePlanDocument(emptyPlanDocument(), 'agreed')).toThrow()
    const value = document()
    value.goals[0].actions[0].id = 'goal-1'
    expect(() => validatePlanDocument(value, 'agreed')).toThrow('única')
  })
  it('keeps routine retries idempotent and new versions out of the agenda until explicit scheduling', async () => {
    const draft = await service.save('demo-enr-01', document(), '', null),
      version = await service.share(draft, 'agreed')
    persona = 'mariana'
    const schedule = { days: [1, 3], time: '09:00', duration: 20, timezone: 'America/Sao_Paulo' }
    const first = await service.schedule(
      version,
      'action-1',
      schedule,
      '2026-10-19',
      true,
      'same-command',
    )
    expect(
      (await service.schedule(version, 'action-1', schedule, '2026-10-19', true, 'same-command'))
        .id,
    ).toBe(first.id)
    expect(await service.routines('demo-enr-01')).toHaveLength(1)
    persona = 'daiane'
    await service.save('demo-enr-01', { ...document(), goals: [] }, '', draft)
    expect(await service.routines('demo-enr-01')).toHaveLength(1)
  })
})
describe('weekly recurring routines', () => {
  const routine = (
    id: string,
    effective: string,
    time: string,
    created: string,
    enabled = true,
  ): PlanRoutine => ({
    id,
    enrollment_id: 'e',
    version_id: 'v',
    action_id: 'a',
    effective_day: effective,
    enabled,
    schedule: { days: [1, 3], time, duration: 20, timezone: 'America/Sao_Paulo' },
    snapshot: {
      goal: 'Meta',
      progress: 'Sinal',
      action: { id: 'a', title: 'Minha ação', context: 'Contexto', fallback: '' },
    },
    command_key: id,
    created,
  })
  it('uses timezone offsets and preserves weeks before an explicit change', () => {
    expect(zonedInstant('2026-10-19', '09:00', 'America/Sao_Paulo')).toBe(
      '2026-10-19T12:00:00.000Z',
    )
    const values = [
      routine('r1', '2026-10-01', '09:00', '2026-10-01'),
      routine('r2', '2026-10-21', '10:00', '2026-10-20'),
    ]
    const current = routineEvents(values, new Date('2026-10-18T00:00:00Z'))
    expect(current.map((e) => e.start)).toEqual([
      '2026-10-19T12:00:00.000Z',
      '2026-10-21T13:00:00.000Z',
    ])
    expect(
      routineEvents(
        [...values, routine('r3', '2026-10-22', '10:00', '2026-10-22', false)],
        new Date('2026-10-25T00:00:00Z'),
      ),
    ).toEqual([])
    expect(zonedInstant('2026-03-08', '02:30', 'America/New_York')).toBeNull()
  })
})
