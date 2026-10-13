import React from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfessionalJourneySummary } from './ProfessionalJourneySummary'
vi.mock('@/services/cerCarePlanService', () => ({
  cerCarePlanService: { listAcceptancesByEnrollment: vi.fn(async () => []) },
}))
const fixtures = vi.hoisted(() => ({
  read: vi.fn(),
  steps: vi.fn(),
  directions: vi.fn(async () => [] as any[]),
  roadmap: vi.fn(async (_enrollment: string, _id: string) => null as any),
}))
vi.mock('@/services/goalRoadmap', () => ({ goalRoadmapService: { load: fixtures.roadmap } }))
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
  lifeDirectionsService: { list: fixtures.directions },
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
  await userEvent.click(screen.getByRole('button', { name: /Rotina · 1 passo/ }))
  expect(open).toHaveBeenCalledWith('evolucao', 'planner')
})
it('failed reads show a recoverable error rather than an empty or stable care claim', async () => {
  fixtures.read.mockRejectedValue(new Error('offline'))
  fixtures.steps.mockResolvedValue([])
  render(<ProfessionalJourneySummary enrollmentId="other" name="Lia" onOpen={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível atualizar')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
})

it('o resumo traz o próximo ajuste compartilhado e mantém ajustes privados fora da tela', async () => {
  fixtures.read.mockResolvedValue([])
  fixtures.directions.mockResolvedValue([])
  fixtures.steps.mockResolvedValue([
    {
      id: 'private',
      action: 'PRIVATE_ACTION',
      next_step: 'PRIVATE_ADJUSTMENT',
      status: 'reviewed',
      access_class: 'participant_private',
    },
    {
      id: 'shared',
      action: 'Caminhar cinco minutos',
      reflection: 'Foi possível começar pequeno',
      next_step: 'Preparar o encerramento do expediente',
      status: 'reviewed',
      access_class: 'participant_shared',
    },
  ])
  render(<ProfessionalJourneySummary enrollmentId="enrollment" name="Lia" onOpen={vi.fn()} />)
  expect(
    await screen.findByText(/Próximo ajuste: Preparar o encerramento do expediente/),
  ).toBeVisible()
  expect(screen.getByText('Aprendizado registrado')).toBeVisible()
  expect(screen.queryByText('PRIVATE_ADJUSTMENT')).not.toBeInTheDocument()
})

it('surfaces shared goals while excluding private planning in the overview', async () => {
  fixtures.read.mockResolvedValue([])
  fixtures.steps.mockResolvedValue([])
  fixtures.directions.mockResolvedValue([
    { id: 'visible', enrollment_id: 'enrollment', kind: 'future' },
    { id: 'private-plan', enrollment_id: 'enrollment', kind: 'future' },
  ])
  fixtures.roadmap.mockImplementation(async (_enrollment: string, id: string) => ({
    id,
    enrollment_id: 'enrollment',
    access_class: id === 'visible' ? 'participant_shared' : 'participant_private',
    roadmap: {
      milestones: [
        {
          horizon: 'short',
          title: id === 'visible' ? 'Duas caminhadas possíveis' : 'PRIVATE_PLAN',
          targetDate: '2026-10-26',
          signal: 'Sem acrescentar trabalho à noite',
        },
      ],
    },
  }))
  const open = vi.fn()
  render(<ProfessionalJourneySummary enrollmentId="enrollment" name="Lia" onOpen={open} />)
  expect(await screen.findByText('Duas caminhadas possíveis')).toBeInTheDocument()
  expect(screen.queryByText('PRIVATE_PLAN')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Ver metas e ações' }))
  expect(open).toHaveBeenCalledWith('equilibrio')
})
