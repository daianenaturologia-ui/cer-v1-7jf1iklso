import { beforeEach, expect, it, vi } from 'vitest'
import { plannerNotesService, type PlannerNoteInput } from './plannerNotes'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
const network = vi.hoisted(() =>
  vi.fn(() => {
    throw Error('No backend in demo')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: network, authStore: {} } }))
const value: PlannerNoteInput = {
  enrollment_id: DEMO_ENROLLMENT_ID,
  title: 'Uma pausa',
  note: 'Privado',
  starts_at: '2026-10-05T09:00:00Z',
  ends_at: '2026-10-05T09:30:00Z',
  kind: 'rest',
  status: 'planned',
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  network.mockClear()
})
it('salva, ajusta, conclui, arquiva e restaura sem perder notas ou consultar backend', async () => {
  let note = await plannerNotesService.save(value)
  for (const status of ['completed', 'archived', 'planned'] as const)
    note = await plannerNotesService.save({ ...note, status }, note.id)
  expect(await plannerNotesService.list(DEMO_ENROLLMENT_ID)).toEqual([note])
  expect(note.note).toBe('Privado')
  expect(network).not.toHaveBeenCalled()
})
it('notas privadas não aparecem nem podem ser alteradas pela profissional', async () => {
  const note = await plannerNotesService.save(value)
  demoAdapter.setActivePersona('daiane')
  expect(await plannerNotesService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  await expect(plannerNotesService.save({ ...note, title: 'Outro' }, note.id)).rejects.toThrow(
    'interagente',
  )
})
it('recusa agenda de outra pessoa, id inexistente e intervalos inválidos', async () => {
  await expect(plannerNotesService.save({ ...value, enrollment_id: 'other' })).rejects.toThrow()
  await expect(plannerNotesService.save(value, 'missing')).rejects.toThrow()
  await expect(plannerNotesService.save({ ...value, ends_at: value.starts_at })).rejects.toThrow(
    'horário',
  )
  await expect(
    plannerNotesService.save({ ...value, ends_at: '2026-10-07T09:00:00Z' }),
  ).rejects.toThrow('horário')
  await expect(plannerNotesService.save({ ...value, title: ' ' })).rejects.toThrow('nome')
})
