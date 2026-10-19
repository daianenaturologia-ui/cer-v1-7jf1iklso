import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('@/lib/pocketbase/client', () => ({ default: { authStore: { record: { id: 'p' } } } }))
const save = vi.fn(),
  share = vi.fn()
vi.mock('@/services/developmentPlanService', () => ({
  developmentPlanService: {
    draft: async () => null,
    versions: async () => [],
    routines: async () => [],
    save: (...args: unknown[]) => save(...args),
    share: (...args: unknown[]) => share(...args),
  },
}))
import { DevelopmentPlanWorkspace } from './DevelopmentPlanWorkspace'
beforeEach(() => {
  cleanup()
  save.mockReset()
  share.mockReset()
  save.mockImplementation(async (enrollment, document, notes, old) => ({
    id: 'd',
    enrollment_id: enrollment,
    document,
    private_notes: notes,
    revision: (old?.revision || 0) + 1,
    author_id: 'p',
  }))
})
it('autosaves incomplete private preparation without publishing or copying notes', async () => {
  render(
    <MemoryRouter>
      <DevelopmentPlanWorkspace enrollmentId="e" professional participantName="Mariana" />
    </MemoryRouter>,
  )
  const moment = await screen.findByLabelText(/Seu momento atual/)
  fireEvent.change(moment, { target: { value: 'Síntese para ler juntas' } })
  fireEvent.change(screen.getByLabelText(/Anotações que não entram/), {
    target: { value: 'Nota exclusivamente profissional' },
  })
  await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2500 })
  expect(share).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Ler juntas'))
  expect(
    screen.getByRole('article', { name: 'Leitura do Plano de Desenvolvimento' }).textContent,
  ).not.toContain('exclusivamente')
  fireEvent.click(screen.getByText('Compartilhar para construir nas sessões'))
  await waitFor(() => expect(share).toHaveBeenCalled())
  expect(share.mock.calls[0][1]).toBe('building')
})
it('keeps participant waiting state simple without exposing preparation fields', async () => {
  render(
    <MemoryRouter>
      <DevelopmentPlanWorkspace enrollmentId="e" />
    </MemoryRouter>,
  )
  await screen.findByText('Vamos construir seu plano juntas')
  expect(screen.queryByText('Acrescentar meta')).toBeNull()
  expect(screen.queryByText('Minhas anotações profissionais · privadas')).toBeNull()
  expect(screen.queryByText('Confirmar rotina no Planner')).toBeNull()
})
