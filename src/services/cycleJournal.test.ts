import { beforeEach, expect, it, vi } from 'vitest'
import {
  cycleJournalService,
  emptyCycleEntry,
  defaultCycleProfile,
  cyclePosition,
  lunarPhase,
  distanceDays,
  addDays,
  validateCycleEntry,
} from './cycleJournal'
import { demoAdapter, DEMO_ENROLLMENT_ID as ID } from './demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw Error('Demo must not call backend')
    },
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
it('persiste por dia, permite editar e retirar compartilhamento sem duplicar', async () => {
  const day = addDays(new Date().toISOString().slice(0, 10), -1)
  const saved = await cycleJournalService.save({
    ...emptyCycleEntry(ID, day),
    energy: 2,
    reflection: 'Privado',
  })
  expect((await cycleJournalService.list(ID))[0].reflection).toBe('Privado')
  demoAdapter.enableDemo('daiane')
  expect(await cycleJournalService.list(ID)).toEqual([])
  await expect(cycleJournalService.profile(ID)).rejects.toThrow('privadas')
  await expect(
    cycleJournalService.save({ ...saved, access_class: 'participant_shared' }),
  ).rejects.toThrow()
  demoAdapter.enableDemo('mariana')
  const shared = await cycleJournalService.save({ ...saved, access_class: 'participant_shared' })
  demoAdapter.enableDemo('daiane')
  expect((await cycleJournalService.list(ID))[0].reflection).toBe('Privado')
  demoAdapter.enableDemo('mariana')
  await cycleJournalService.save({ ...shared, access_class: 'participant_private', energy: 3 })
  expect(await cycleJournalService.list(ID)).toHaveLength(1)
  demoAdapter.enableDemo('daiane')
  expect(await cycleJournalService.list(ID)).toEqual([])
  demoAdapter.enableDemo('mariana')
  await cycleJournalService.remove(saved)
  expect(await cycleJournalService.list(ID)).toEqual([])
})
it('recusa outra matrícula, datas impossíveis, futuro, início sem fluxo e duplicidade', async () => {
  await expect(cycleJournalService.list('other')).rejects.toThrow()
  const day = '2026-01-03'
  const value = emptyCycleEntry(ID, day)
  expect(() => validateCycleEntry({ ...value, day: '2026-02-30' })).toThrow()
  expect(() => validateCycleEntry({ ...value, day: '2099-01-01' })).toThrow()
  expect(() => validateCycleEntry({ ...value, period_start: true, bleeding: 'Escape' })).toThrow()
  await cycleJournalService.save(value)
  await expect(cycleJournalService.save(value)).rejects.toThrow('Já existe')
})
it('fase estimada exige informação e não reaparece por extrapolar ciclos nem em outros momentos', () => {
  const start = { ...emptyCycleEntry(ID, '2026-01-01'), period_start: true, bleeding: 'Leve' }
  const p = { ...defaultCycleProfile(ID), context: 'natural' as const, cycle_length: 30 }
  expect(cyclePosition([start], p, '2026-01-01').estimated).toBe(false)
  expect(cyclePosition([start], p, '2026-01-10').label).toBe('Folicular estimada')
  expect(cyclePosition([start], p, '2026-01-16').label).toContain('ovulatório estimado')
  expect(cyclePosition([start], p, '2026-02-10').label).toBe('Fase não identificada')
  for (const context of ['hormonal', 'menopause', 'postpartum', 'pregnancy'] as const)
    expect(cyclePosition([start], { ...p, context }, '2026-01-16').estimated).toBe(false)
  for (const context of ['irregular', 'perimenopause'] as const)
    expect(cyclePosition([start], { ...p, context }, '2026-01-16').label).toBe(
      'Fase não identificada',
    )
})
it('preferências pessoais persistem sem compartilhar; duração desconhecida permanece desconhecida', async () => {
  const p = await cycleJournalService.saveProfile({
    ...defaultCycleProfile(ID),
    lunar_reflections: true,
  })
  expect(await cycleJournalService.profile(ID)).toEqual(p)
  expect(cyclePosition([], p, '2026-01-10').label).toBe('Fase não identificada')
  expect(p.cycle_length).toBe(0)
})
it('datas atravessam meses e anos sem inferir um ciclo de 28 dias', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  expect(distanceDays('2026-02-01', '2026-03-01')).toBe(28)
})
it('aproxima lua nova e cheia de referência sem usar dados menstruais', () => {
  expect(lunarPhase('2000-01-06').name).toBe('Nova')
  expect(lunarPhase('2000-01-21').name).toBe('Cheia')
  expect(lunarPhase('2026-10-15').fraction).toBeGreaterThan(0)
  expect(lunarPhase('2026-10-15').fraction).toBeLessThan(1)
})
