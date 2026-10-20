import { beforeEach, expect, it, vi } from 'vitest'
import { dailyRoutineService, validateDailyRoutine, type DailyRoutineInput } from './dailyRoutine'
import { demoAdapter, DEMO_ENROLLMENT_ID as enrollment_id } from './demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({ default: {} }))
const input = (): DailyRoutineInput => ({
  enrollment_id,
  day_label: 'Um dia de trabalho',
  moments: [
    { time: '07:00', activity: 'Acordo' },
    { time: '00:30', activity: 'Vou dormir' },
  ],
  access_class: 'participant_private',
})
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
it('persiste o dia na ordem narrada, inclusive depois da meia-noite, e atualiza sem duplicar', async () => {
  const first = await dailyRoutineService.save(input())
  const saved = await dailyRoutineService.save({ ...input(), day_label: 'Dia revisto' }, first.id)
  expect(saved.id).toBe(first.id)
  expect((await dailyRoutineService.load(enrollment_id))?.moments.map((m) => m.time)).toEqual([
    '07:00',
    '00:30',
  ])
  expect((await dailyRoutineService.load(enrollment_id))?.day_label).toBe('Dia revisto')
})
it('somente a titular edita e a profissional só recebe conteúdo explicitamente compartilhado', async () => {
  const saved = await dailyRoutineService.save(input())
  demoAdapter.enableDemo('daiane')
  expect(await dailyRoutineService.load(enrollment_id, true)).toBeNull()
  await expect(dailyRoutineService.save(input(), saved.id)).rejects.toThrow('Somente a pessoa')
  demoAdapter.enableDemo('mariana')
  await dailyRoutineService.save({ ...input(), access_class: 'participant_shared' }, saved.id)
  demoAdapter.enableDemo('daiane')
  expect((await dailyRoutineService.load(enrollment_id, true))?.moments).toEqual(input().moments)
  await expect(dailyRoutineService.load('outra-pessoa', true)).rejects.toThrow()
})
it('aceita horário desconhecido e recusa horário impossível, atividade vazia e excesso de momentos', () => {
  expect(() =>
    validateDailyRoutine({
      ...input(),
      moments: [{ time: '', activity: 'Almoço quando consigo' }],
    }),
  ).not.toThrow()
  for (const moments of [
    [],
    [{ time: '25:00', activity: 'Dormir' }],
    [{ time: '08:00', activity: ' ' }],
    Array.from({ length: 65 }, () => ({ time: '', activity: 'Algo' })),
  ])
    expect(() => validateDailyRoutine({ ...input(), moments })).toThrow()
})
