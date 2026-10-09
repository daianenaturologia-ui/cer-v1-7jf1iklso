import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { GoalRoadmapPlanner } from './GoalRoadmapPlanner'
import { goalRoadmapService } from '@/services/goalRoadmap'
import { plannerNotesService } from '@/services/plannerNotes'
const source: any = {
  id: 'd',
  enrollment_id: 'e',
  title: 'Recuperar disposição',
  limits: 'Duas pausas',
  resources: 'Organização',
  access_class: 'participant_private',
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function open() {
  const details = screen.getByText('Metas, ações e meu ritmo').closest('details')!
  details.open = true
  fireEvent(details, new Event('toggle', { bubbles: true }))
}
it('cria metas e ações privadas só ao confirmar e não ocupa a agenda automaticamente', async () => {
  vi.spyOn(goalRoadmapService, 'load').mockResolvedValue(null)
  const save = vi
    .spyOn(goalRoadmapService, 'save')
    .mockImplementation(async (s, r, a) => ({
      id: 'x',
      enrollment_id: 'e',
      direction_id: 'd',
      owner_id: 'u',
      revision: 1,
      roadmap: r,
      access_class: a,
    }))
  const agenda = vi.spyOn(plannerNotesService, 'save')
  render(
    <GoalRoadmapPlanner
      source={source}
      strategies={['Usar organização para reservar uma pausa']}
    />,
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Construir minhas metas' }))
  expect(screen.getByLabelText('Meu ritmo possível')).toHaveValue('Duas pausas')
  fireEvent.change(screen.getByLabelText('Meta de curto prazo'), {
    target: { value: 'Reservar duas pausas' },
  })
  fireEvent.input(screen.getByLabelText('Prazo de curto prazo'), {
    target: { value: '2026-10-23' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Acrescentar uma ação' }))
  fireEvent.change(screen.getByLabelText('Ação 1'), { target: { value: 'Pausa de dez minutos' } })
  fireEvent.click(screen.getByRole('button', { name: 'Usar organização para reservar uma pausa' }))
  expect(save).not.toHaveBeenCalled()
  expect(agenda).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Compartilhar estas metas e ações com Daiane')).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar metas e ações' }))
  await screen.findByText(/Metas e ações guardadas/)
  expect(save.mock.calls[0][2]).toBe('participant_private')
  expect(save.mock.calls[0][1].actions[0].resource).toBe('Usar organização para reservar uma pausa')
  expect(screen.getByText('Até 23/10/2026')).toBeInTheDocument()
  expect(agenda).not.toHaveBeenCalled()
})
it('profissional vê apenas leitura de metas carregadas, sem edição ou agenda privada', async () => {
  vi.spyOn(goalRoadmapService, 'load').mockResolvedValue({
    id: 'x',
    revision: 1,
    access_class: 'participant_shared',
    roadmap: {
      schemaVersion: 1,
      objective: 'Recuperar disposição',
      capacity: 'Uma pausa',
      resources: 'Organização',
      milestones: [
        { horizon: 'short', title: 'Pausar', targetDate: '2026-10-23', signal: 'Mais disposição' },
      ],
      actions: [],
    },
  } as any)
  render(<GoalRoadmapPlanner source={{ ...source, access_class: 'participant_shared' }} readOnly />)
  open()
  await screen.findByText('Até 23/10/2026')
  expect(screen.queryByRole('button', { name: /Construir|Ajustar|Levar/ })).toBeNull()
})
