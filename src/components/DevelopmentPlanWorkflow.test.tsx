import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DevelopmentPlanWorkspace } from './DevelopmentPlanWorkspace'
import { WeeklyAgenda } from './WeeklyAgenda'
import { developmentPlanService } from '@/services/developmentPlanService'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'
import { dayInZone } from '@/services/developmentPlanDocument'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    authStore: { record: { id: 'demo-user-daiane' } },
    collection: () => {
      throw Error('No backend in demo')
    },
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
})
afterEach(cleanup)
it('prepares, shares across sessions and explicitly schedules the agreed action without duplicate routines', async () => {
  render(
    <MemoryRouter>
      <DevelopmentPlanWorkspace
        enrollmentId={DEMO_ENROLLMENT_ID}
        professional
        participantName="Mariana"
      />
    </MemoryRouter>,
  )
  fireEvent.change(await screen.findByLabelText(/Seu momento atual/), {
    target: { value: 'Momento fictício' },
  })
  fireEvent.change(screen.getByLabelText(/Prioridades de equilíbrio e cuidado/), {
    target: { value: 'Prioridade fictícia' },
  })
  fireEvent.click(screen.getByText('Definir meta principal'))
  fireEvent.change(screen.getByLabelText('Mudança que queremos alcançar'), {
    target: { value: 'Ter espaço para descanso' },
  })
  fireEvent.change(screen.getByLabelText('Como perceberemos avanço'), {
    target: { value: 'Observar espaço na semana' },
  })
  fireEvent.click(screen.getByText('Acrescentar ação'))
  fireEvent.change(screen.getByLabelText('O que vamos experimentar'), {
    target: { value: 'Encerrar trabalho com calma' },
  })
  fireEvent.change(screen.getByLabelText('Como isso pode acontecer na vida prática'), {
    target: { value: 'Preparar as pendências antes de sair' },
  })
  fireEvent.click(screen.getByText('Compartilhar para construir nas sessões'))
  await screen.findByText(
    'Versão compartilhada para construir nas sessões. As próximas edições continuam privadas até compartilhar novamente.',
  )
  expect(screen.queryByText('Conferir minha semana')).toBeNull()
  fireEvent.click(
    screen.getByLabelText(
      'Lemos juntas esta versão e combinamos os cuidados, a meta principal e as ações para experimentar.',
    ),
  )
  fireEvent.click(screen.getByText('Compartilhar plano combinado'))
  await screen.findByText('Plano combinado. Agora vocês podem organizar a rotina.')
  cleanup()
  demoAdapter.enableDemo('mariana')
  render(
    <MemoryRouter>
      <DevelopmentPlanWorkspace enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  const organizer = await screen.findByRole('region', { name: 'Organizar minha rotina' })
  fireEvent.click(within(organizer).getByLabelText(/Encerrar trabalho com calma/))
  fireEvent.click(within(organizer).getByLabelText('Seg'))
  fireEvent.change(within(organizer).getByLabelText('A partir de'), {
    target: { value: dayInZone(new Date(), 'America/Sao_Paulo') },
  })
  fireEvent.click(within(organizer).getByText('Conferir minha semana'))
  expect(await developmentPlanService.routines(DEMO_ENROLLMENT_ID)).toHaveLength(0)
  fireEvent.click(within(organizer).getByText('Confirmar rotina no Planner'))
  await screen.findByText(/Rotina organizada. Os horários estão no Planner/)
  expect(await developmentPlanService.routines(DEMO_ENROLLMENT_ID)).toHaveLength(1)
  cleanup()
  render(
    <MemoryRouter>
      <WeeklyAgenda enrollmentId={DEMO_ENROLLMENT_ID} />
    </MemoryRouter>,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Próxima semana' }))
  await screen.findByRole('button', { name: /Encerrar trabalho com calma, / })
})
