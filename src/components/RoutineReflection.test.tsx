import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RoutineReflection } from './RoutineReflection'
const api = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn() }))
vi.mock('@/services/selfDevelopment', () => ({ selfDevelopmentService: api }))
const routine: any = {
  id: 'r',
  snapshot: {
    goal: 'Descansar',
    progress: 'Mais espaço',
    action: {
      title: 'Encerrar o trabalho',
      context: 'Antes das 19h',
      fallback: 'Um próximo passo',
    },
  },
}
beforeEach(() => {
  api.list.mockReset().mockResolvedValue([])
  api.save
    .mockReset()
    .mockImplementation(async (value, id) => ({ ...value, id: id || 'experience' }))
})
it('guarda a experiência privada e só compartilha quando escolhido', async () => {
  const saved = vi.fn()
  render(
    <RoutineReflection
      enrollmentId="e"
      routine={routine}
      occurrence="routine:r:2026-10-22"
      start="2026-10-22T21:50:00Z"
      onSaved={saved}
    />,
  )
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'Adaptei para o meu momento' },
  })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Encerrei com ajuda' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar experiência' }))
  await screen.findByText('Experiência guardada só para você.')
  expect(api.save.mock.calls[0][0].access_class).toBe('participant_private')
  expect(api.save.mock.calls[1][0]).toMatchObject({
    status: 'reviewed',
    access_class: 'participant_private',
    reflection: 'Adaptei para o meu momento — Encerrei com ajuda',
  })
  expect(saved).toHaveBeenCalledOnce()
})
it('preserva a tentativa privada se a conclusão falhar e reutiliza o registro ao tentar de novo', async () => {
  api.save
    .mockResolvedValueOnce({
      id: 'created',
      ...{ enrollment_id: 'e', resource_snapshot: { id: 'routine:r:day' } },
    })
    .mockRejectedValueOnce(new Error('Sem conexão'))
    .mockResolvedValueOnce({ id: 'created', status: 'reviewed' })
  render(
    <RoutineReflection
      enrollmentId="e"
      routine={routine}
      occurrence="routine:r:day"
      start="2026-10-22T21:50:00Z"
      onSaved={() => {}}
    />,
  )
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar experiência' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar experiência' }))
  await screen.findByText('Experiência guardada e compartilhada com sua profissional.')
  expect(api.save).toHaveBeenCalledTimes(3)
  expect(api.save.mock.calls[2][1]).toBe('created')
  expect(api.save.mock.calls[2][0].access_class).toBe('participant_shared')
})
it('não duplica uma ocorrência que já tem relato concluído', async () => {
  api.list.mockResolvedValue([
    { id: 'done', resource_snapshot: { id: 'routine:r:day' }, status: 'reviewed' },
  ])
  render(
    <RoutineReflection
      enrollmentId="e"
      routine={routine}
      occurrence="routine:r:day"
      start="2026-10-22T21:50:00Z"
      onSaved={() => {}}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guardar experiência' }))
  await screen.findByRole('status')
  expect(api.save).not.toHaveBeenCalled()
})
