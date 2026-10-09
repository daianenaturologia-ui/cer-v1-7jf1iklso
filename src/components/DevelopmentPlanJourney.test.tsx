import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CarePlanEditor } from './CarePlanEditor'
const fns = vi.hoisted(() => ({
  create: vi.fn(async (input) => ({ ...input, id: 'p', status: 'draft', revision_number: 1 })),
  list: vi.fn(),
}))
vi.mock('@/lib/pocketbase/client', () => ({ default: { authStore: {} } }))
vi.mock('@/services/demoAdapter', () => ({
  demoAdapter: {
    isEnabled: () => true,
    listPlans: () => [],
    listExperienceResponses: () => [],
    listPresentedForParticipant: () => [],
    listAcceptancesByEnrollment: () => [],
  },
}))
vi.mock('@/services/cerCarePlanService', () => ({
  cerCarePlanService: { createDraftPlan: fns.create, listPriorities: async () => [] },
}))
vi.mock('@/services/lifeDirections', () => ({ lifeDirectionsService: { list: fns.list } }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
it('permite vincular futuro compartilhado, sem oferecer registros privados, e envia origem no plano', async () => {
  fns.list.mockResolvedValue([
    {
      id: 'f',
      enrollment_id: 'e',
      kind: 'future',
      access_class: 'participant_shared',
      title: 'Um tempo para mim',
    },
    {
      id: 'private',
      enrollment_id: 'e',
      kind: 'future',
      access_class: 'participant_private',
      title: 'Segredo',
    },
  ])
  render(<CarePlanEditor enrollmentId="e" participantName="Mariana" />)
  const user = userEvent.setup()
  await screen.findByText('Nenhum Plano de Cuidado formulado ainda.')
  await user.click(screen.getByRole('button', { name: 'Novo Plano' }))
  const select = await screen.findByRole('combobox', {
    name: 'Direção compartilhada na Linha da Vida',
  })
  await screen.findByRole('option', { name: 'Um tempo para mim' })
  expect(screen.queryByRole('option', { name: 'Segredo' })).toBeNull()
  await user.selectOptions(select, 'f')
  await user.click(screen.getByRole('button', { name: 'Salvar Rascunho' }))
  await waitFor(() =>
    expect(fns.create).toHaveBeenCalledWith(
      expect.objectContaining({
        direction_source_id: 'f',
        direction_mode: 'reused',
        direction_statement: 'Um tempo para mim',
      }),
    ),
  )
})
