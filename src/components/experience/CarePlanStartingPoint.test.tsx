import React from 'react'
import { expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CarePlanStartingPoint } from './CarePlanStartingPoint'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { careEpisodeInput, emptyCareEpisode } from '@/services/careEpisode'

vi.mock('@/services/lifeDirections', () => ({ lifeDirectionsService: { list: vi.fn() } }))
vi.mock('@/services/selfDevelopment', () => ({
  selfDevelopmentService: { list: vi.fn(), save: vi.fn() },
}))
vi.mock('./GoalRoadmapPlanner', () => ({ GoalRoadmapPlanner: () => <p>Metas compartilhadas</p> }))
const source: LifeDirection = {
  id: 'direction',
  enrollment_id: 'enrollment',
  kind: 'future',
  horizon: 'open',
  title: 'Expressar limites',
  narrative: '',
  meaning: '',
  resources: 'Organização',
  limits: 'Uma conversa por semana',
  first_step: '',
  access_class: 'participant_shared',
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(lifeDirectionsService.list).mockResolvedValue([source])
  vi.mocked(selfDevelopmentService.list).mockResolvedValue([
    {
      ...careEpisodeInput(
        source,
        {
          ...emptyCareEpisode(),
          facts: 'Relato da situação',
          alternative: 'Pedir tempo',
          support: 'Respirar',
        },
        true,
      ),
      id: 'episode',
    },
  ])
})
it('só prepara após ação explícita, sem salvar ou agendar, e sem reproduzir fatos', async () => {
  const prepare = vi.fn()
  render(
    <CarePlanStartingPoint enrollmentId="enrollment" directionId="direction" onPrepare={prepare} />,
  )
  const button = await screen.findByRole('button', { name: /Preparar prioridade/ })
  expect(prepare).not.toHaveBeenCalled()
  expect(screen.queryByText('Relato da situação')).not.toBeInTheDocument()
  fireEvent.click(button)
  expect(prepare).toHaveBeenCalledWith({
    title: 'Pedir tempo',
    description: 'Em direção a: Expressar limites\nRecurso ou apoio: Respirar',
  })
  expect(selfDevelopmentService.save).not.toHaveBeenCalled()
})
it('falha sem sugerir ações e permite tentar carregar novamente', async () => {
  vi.mocked(selfDevelopmentService.list).mockRejectedValueOnce(new Error('Offline'))
  render(
    <CarePlanStartingPoint enrollmentId="enrollment" directionId="direction" onPrepare={vi.fn()} />,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível')
  expect(screen.queryByRole('button', { name: /Preparar prioridade/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByRole('button', { name: /Preparar prioridade/ })).toBeInTheDocument()
})
