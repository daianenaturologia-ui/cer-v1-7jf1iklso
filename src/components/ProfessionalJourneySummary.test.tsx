import React from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfessionalJourneySummary } from './ProfessionalJourneySummary'
const fixtures = vi.hoisted(() => ({ read: vi.fn(), steps: vi.fn() }))
vi.mock('@/services/experienceEngine', () => ({
  experienceResponseService: { listResponsesByExperience: fixtures.read },
  enrollmentExperienceService: { listByEnrollment: vi.fn(async () => []) },
  resolveExperienceId: (id: string) => id,
}))
vi.mock('@/services/lifeTimeline', () => ({
  lifeTimelineService: { list: vi.fn(async () => []) },
  sharedLifeEvents: (x: any) => x,
}))
vi.mock('@/services/lifeDirections', () => ({
  lifeDirectionsService: { list: vi.fn(async () => []) },
  sharedLifeDirections: (x: any) => x,
}))
vi.mock('@/services/selfDevelopment', () => ({
  selfDevelopmentService: { list: fixtures.steps },
  visibleDevelopment: (x: any) => x.filter((r: any) => r.access_class === 'participant_shared'),
}))
it('only shared steps reach the overview and its agenda shortcut is specific', async () => {
  fixtures.read.mockResolvedValue([])
  fixtures.steps.mockResolvedValue([
    { id: 'private', action: 'PRIVATE_CONTROL', access_class: 'participant_private' },
    {
      id: 'shared',
      action: 'Caminhar 15 minutos',
      access_class: 'participant_shared',
      status: 'completed',
    },
  ])
  const open = vi.fn()
  render(<ProfessionalJourneySummary enrollmentId="enrollment" name="Lia" onOpen={open} />)
  expect(await screen.findByText('Caminhar 15 minutos')).toBeInTheDocument()
  expect(screen.queryByText('PRIVATE_CONTROL')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Rotina · 1 passos/ }))
  expect(open).toHaveBeenCalledWith('evolucao', 'planner')
})
it('failed reads show a recoverable error rather than an empty or stable care claim', async () => {
  fixtures.read.mockRejectedValue(new Error('offline'))
  fixtures.steps.mockResolvedValue([])
  render(<ProfessionalJourneySummary enrollmentId="other" name="Lia" onOpen={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível atualizar')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
})
