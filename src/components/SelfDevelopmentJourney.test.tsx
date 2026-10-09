import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SelfDevelopmentJourney } from './SelfDevelopmentJourney'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { careEpisodeInput, emptyCareEpisode } from '@/services/careEpisode'
import { lifeDirectionsService } from '@/services/lifeDirections'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw Error('No backend in demo')
    },
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
afterEach(cleanup)
it('uma situação explorada não vira tarefa no Planner nem exibe metadados do exercício', async () => {
  const source = await lifeDirectionsService.save({ enrollment_id: DEMO_ENROLLMENT_ID, kind: 'future', horizon: 'open', title: 'Minha direção', narrative: '', meaning: '', resources: '', limits: '', first_step: '', access_class: 'participant_private' })
  await selfDevelopmentService.save(careEpisodeInput(source, { ...emptyCareEpisode(), facts: 'Minha cena privada', alternative: 'Alternativa ainda não agendada' }, false))
  render(<MemoryRouter><SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} mode="play" /></MemoryRouter>)
  await waitFor(() => expect(screen.queryByText('Carregando seus passos…')).toBeNull())
  expect(screen.queryByText('Alternativa ainda não agendada')).toBeNull()
  expect(screen.queryByText(/"version":1/)).toBeNull()
})
it('a pessoa escolhe recurso, planeja no seu ritmo, executa no Planner e revisa sem intervenção profissional', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher meu primeiro recurso' }))
  await user.click(screen.getAllByRole('button', { name: 'Quero experimentar' })[0])
  await user.type(screen.getByLabelText('Que vida quero cultivar?'), 'Ter tempo livre')
  await user.type(screen.getByLabelText('Meu pequeno passo'), 'Observar minha concentração')
  await user.type(
    screen.getByLabelText('Quando isso cabe na minha vida?'),
    'Depois do almoço de terça',
  )
  await user.click(screen.getByRole('button', { name: 'Salvar meu passo' }))
  await screen.findByText('Observar minha concentração')
  cleanup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} mode="play" />
    </MemoryRouter>,
  )
  await user.click(await screen.findByText('Mais opções'))
  await user.click(screen.getByRole('button', { name: 'Experimentei' }))
  await screen.findByText(/tentativa\(s\) pronta/)
  cleanup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('tab', { name: /Aprendizados/ }))
  await user.click(screen.getByRole('button', { name: 'Revisar o que aprendi' }))
  await user.type(
    screen.getByLabelText('O que percebi e aprendi?'),
    'Depois do almoço preciso reduzir o bloco',
  )
  await user.click(screen.getByRole('button', { name: 'Guardar meu aprendizado' }))
  await screen.findByText('Aprendizado registrado · Só meu')
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].status).toBe('reviewed')
})
it('visão profissional não mostra privados nem oferece ações de autoria da pessoa', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  await user.click(await screen.findByRole('button', { name: 'Escolher meu primeiro recurso' }))
  await user.click(screen.getAllByRole('button', { name: 'Quero experimentar' })[0])
  await user.type(screen.getByLabelText('Que vida quero cultivar?'), 'Um desejo privado')
  await user.type(screen.getByLabelText('Meu pequeno passo'), 'Uma ação privada')
  await user.type(screen.getByLabelText('Quando isso cabe na minha vida?'), 'Na terça')
  await user.click(screen.getByRole('button', { name: 'Salvar meu passo' }))
  await screen.findByText('Uma ação privada')
  cleanup()
  demoAdapter.setActivePersona('daiane')
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} readOnly />
    </MemoryRouter>,
  )
  await screen.findByText('Nenhum passo educativo foi compartilhado ainda.')
  expect(screen.queryByText('Uma ação privada')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Começar' })).toBeNull()
})
