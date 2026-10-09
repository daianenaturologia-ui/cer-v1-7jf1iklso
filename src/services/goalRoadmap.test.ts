import { beforeEach, expect, it, vi } from 'vitest'
import { emptyGoalRoadmap, goalRoadmapService, validateGoalRoadmap } from './goalRoadmap'
import { lifeDirectionsService } from './lifeDirections'
import type { LifeDirection } from './lifeDirections'
const persona = vi.hoisted(() => ({ value: 'mariana' }))
vi.mock('./demoAdapter', () => ({
  DEMO_ENROLLMENT_ID: 'enr',
  demoAdapter: {
    isEnabled: () => true,
    getActivePersona: () => persona.value,
    getCurrentUser: () => ({ id: persona.value }),
  },
}))
const source = {
  id: 'future',
  enrollment_id: 'enr',
  kind: 'future',
  title: 'Recuperar disposição',
  limits: 'Duas pausas',
  resources: 'Organização',
  access_class: 'participant_private',
} as LifeDirection
const roadmap = () => ({
  ...emptyGoalRoadmap(source),
  milestones: [
    {
      horizon: 'short' as const,
      title: 'Pausar duas vezes',
      targetDate: '2026-10-23',
      signal: 'Mais espaço para recuperação',
    },
  ],
  actions: [
    {
      id: 'a',
      title: 'Reservar uma pausa',
      horizon: 'short' as const,
      frequency: '2 vezes por semana',
      resource: 'Organização para proteger um horário',
      fallback: 'Uma pausa de dois minutos',
    },
  ],
})
beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  persona.value = 'mariana'
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([source])
})
it('preserva metas, recursos, ritmo e alternativa depois de reler; impede gravação com revisão antiga', async () => {
  const saved = await goalRoadmapService.save(source, roadmap(), 'participant_private')
  expect(await goalRoadmapService.load('enr', 'future')).toEqual(saved)
  const updated = await goalRoadmapService.save(
    source,
    { ...roadmap(), capacity: 'Uma pausa inicialmente' },
    'participant_private',
    saved,
  )
  expect(updated.revision).toBe(2)
  await expect(
    goalRoadmapService.save(source, roadmap(), 'participant_private', saved),
  ).rejects.toThrow('outra janela')
  expect(await goalRoadmapService.load('enr', 'future')).toEqual(updated)
})
it('mantém privado para a profissional, requer compartilhar a direção e permite revogar acesso', async () => {
  const saved = await goalRoadmapService.save(source, roadmap(), 'participant_private')
  persona.value = 'daiane'
  expect(await goalRoadmapService.load('enr', 'future')).toBeNull()
  await expect(
    goalRoadmapService.save(source, roadmap(), 'participant_private', saved),
  ).rejects.toThrow('Somente')
  persona.value = 'mariana'
  await expect(
    goalRoadmapService.save(source, roadmap(), 'participant_shared', saved),
  ).rejects.toThrow('primeiro')
  vi.mocked(lifeDirectionsService.list).mockResolvedValue([
    { ...source, access_class: 'participant_shared' },
  ])
  const shared = await goalRoadmapService.save(source, roadmap(), 'participant_shared', saved)
  persona.value = 'daiane'
  expect(await goalRoadmapService.load('enr', 'future')).toEqual(shared)
  vi.mocked(lifeDirectionsService.list).mockResolvedValue([source])
  expect(await goalRoadmapService.load('enr', 'future')).toBeNull()
  await expect(goalRoadmapService.load('other', 'future')).rejects.toThrow('pessoa')
})
it('rejeita calendário inválido, metas invertidas, horizontes desconhecidos e ações sem meta', () => {
  const r = roadmap()
  expect(() => validateGoalRoadmap(r)).not.toThrow()
  expect(() =>
    validateGoalRoadmap({ ...r, milestones: [{ ...r.milestones[0], targetDate: '2026-02-30' }] }),
  ).toThrow()
  expect(() =>
    validateGoalRoadmap({
      ...r,
      milestones: [
        r.milestones[0],
        { ...r.milestones[0], horizon: 'medium', targetDate: '2026-10-01' },
      ],
    }),
  ).toThrow('datas')
  for (const bad of [null, { ...r.milestones[0], horizon: 'toString' }])
    expect(() => validateGoalRoadmap({ ...r, milestones: [bad] } as any)).toThrow('horizonte')
  expect(() =>
    validateGoalRoadmap({ ...r, actions: [{ ...r.actions[0], horizon: 'long' }] }),
  ).toThrow('ação')
})
it('erro de armazenamento mantém a versão anterior', async () => {
  const saved = await goalRoadmapService.save(source, roadmap(), 'participant_private')
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  await expect(
    goalRoadmapService.save(source, roadmap(), 'participant_private', saved),
  ).rejects.toThrow('quota')
  spy.mockRestore()
  expect(await goalRoadmapService.load('enr', 'future')).toEqual(saved)
})
