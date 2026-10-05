import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { WeeklyAgenda } from './WeeklyAgenda'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'
import { plannerNotesService } from '@/services/plannerNotes'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { mondayOf, localDateInput } from '@/services/weeklyAgenda'
import { DEVELOPMENT_CATALOG } from '@/services/developmentCatalog'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw Error('No backend in demo')
    },
    authStore: {},
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
afterEach(cleanup)
function page(readOnly = false) {
  return render(
    <MemoryRouter>
      <WeeklyAgenda enrollmentId={DEMO_ENROLLMENT_ID} readOnly={readOnly} />
    </MemoryRouter>,
  )
}
it('um clique no horário cria nota, persiste após reabrir e permite concluir/arquivar/restaurar', async () => {
  const user = userEvent.setup()
  page()
  await user.click(await screen.findByRole('button', { name: /segunda-feira.*06:00/ }))
  await user.type(screen.getByLabelText('O que cabe aqui?'), 'Pausa gostosa')
  await user.type(screen.getByLabelText('Anotação (opcional)'), 'Tomar café sem pressa')
  const end = screen.getByLabelText('Termina') as HTMLInputElement
  fireEvent.input(end, { target: { value: end.value.slice(0, 11) + '07:00' } })
  await user.click(screen.getByRole('button', { name: 'Guardar momento' }))
  expect(new Date((await plannerNotesService.list(DEMO_ENROLLMENT_ID))[0].ends_at).getHours()).toBe(
    7,
  )
  expect((await plannerNotesService.list(DEMO_ENROLLMENT_ID))[0].note).toBe('Tomar café sem pressa')
  cleanup()
  page()
  await user.click(await screen.findByRole('button', { name: /Pausa gostosa, 06:00/ }))
  await screen.findByText('Tomar café sem pressa')
  await user.click(screen.getByRole('button', { name: 'Aconteceu' }))
  await user.click(await screen.findByRole('button', { name: /Pausa gostosa.*realizado/ }))
  await user.click(screen.getByText('Mais', { exact: true }))
  await user.click(screen.getByRole('button', { name: 'Arquivar momento' }))
  expect(screen.queryByRole('button', { name: /Pausa gostosa, 06:00/ })).toBeNull()
  await user.click(screen.getByRole('tab', { name: 'Sem horário' }))
  await user.click(screen.getByText('Momentos arquivados'))
  await user.click(screen.getByRole('button', { name: 'Restaurar' }))
  expect((await plannerNotesService.list(DEMO_ENROLLMENT_ID))[0].status).toBe('planned')
}, 15000)
it('leva passo sem horário para a semana e registra execução mantendo sua origem', async () => {
  await selfDevelopmentService.save({
    enrollment_id: DEMO_ENROLLMENT_ID,
    direction_id: '',
    resource_snapshot: DEVELOPMENT_CATALOG[0],
    goal: 'Mais tempo',
    action: 'Observar meu ritmo',
    context: 'Depois do café',
    fallback: '',
    signal: '',
    scheduled_at: '',
    reflection: '',
    next_step: '',
    status: 'planned',
    access_class: 'participant_private',
  })
  const user = userEvent.setup()
  page()
  await user.click(await screen.findByRole('tab', { name: /Sem horário/ }))
  await user.click(await screen.findByRole('button', { name: /Observar meu ritmo/ }))
  const start = mondayOf(new Date())
  start.setHours(9)
  const input = screen.getByLabelText('Reservar horário') as HTMLInputElement
  fireEvent.change(input, { target: { value: localDateInput(start) } })
  await user.click(screen.getByRole('button', { name: 'Salvar horário' }))
  await user.click(screen.getByRole('tab', { name: 'Minha semana' }))
  await user.click(await screen.findByRole('button', { name: /Observar meu ritmo, 09:00/ }))
  await user.click(screen.getByRole('button', { name: 'Experimentei' }))
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].status).toBe('completed')
})
it('profissional vê somente compartilhados e não recebe controles de escrita ou notas privadas', async () => {
  await plannerNotesService.save({
    enrollment_id: DEMO_ENROLLMENT_ID,
    title: 'Segredo da agenda',
    note: 'Não compartilhar',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 1800000).toISOString(),
    kind: 'life',
    status: 'planned',
  })
  demoAdapter.setActivePersona('daiane')
  page(true)
  await screen.findByText('Somente os passos que a pessoa escolheu compartilhar.')
  expect(screen.queryByText('Segredo da agenda')).toBeNull()
  expect(screen.queryByRole('tab', { name: 'Google Agenda' })).toBeNull()
  expect(
    (await screen.findByRole('button', { name: /segunda-feira.*06:00/ })).hasAttribute('disabled'),
  ).toBe(true)
})
