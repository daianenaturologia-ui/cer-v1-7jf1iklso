import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlannerPage from '@/pages/PlannerPage'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from '@/services/demoAdapter'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { DEVELOPMENT_CATALOG } from '@/services/developmentCatalog'
const network = vi.hoisted(() =>
  vi.fn(() => {
    throw Error('Unexpected backend in demo')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: network, authStore: {} } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: DEMO_USER_MARIANA }) }))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))
afterEach(cleanup)
it('página real do Planner encontra a matrícula demo e mostra o passo sem consultar o servidor', async () => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  await selfDevelopmentService.save({
    enrollment_id: DEMO_ENROLLMENT_ID,
    direction_id: '',
    resource_snapshot: DEVELOPMENT_CATALOG[0],
    goal: 'Ter espaço',
    action: 'Meu passo deve aparecer no Planner',
    context: 'Depois do almoço',
    fallback: '',
    signal: '',
    scheduled_at: '',
    reflection: '',
    next_step: '',
    status: 'planned',
    access_class: 'participant_private',
  })
  render(
    <MemoryRouter>
      <PlannerPage />
    </MemoryRouter>,
  )
  await screen.findByText('Meu passo deve aparecer no Planner')
  expect(screen.getByRole('button', { name: 'Experimentei' })).toBeTruthy()
  expect(network).not.toHaveBeenCalled()
})
