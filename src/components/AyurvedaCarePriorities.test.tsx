import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AyurvedaCarePriorities } from './AyurvedaCarePriorities'
import { buildIntegratedAyurvedaQaFixture } from '@/services/conscienciaQaFixture'
const state = vi.hoisted(() => ({ responses: [] as any[], list: vi.fn() }))
vi.mock('@/services/demoAdapter', () => ({
  demoAdapter: { isEnabled: () => true, listExperienceResponses: () => state.list() },
}))
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: vi.fn(() => {
      throw new Error('No database access in demo')
    }),
  },
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
it('abre respostas e acompanhamento e prepara apenas por ação explícita, sem salvar', async () => {
  state.list.mockReturnValue(buildIntegratedAyurvedaQaFixture().responses)
  const prepare = vi.fn()
  render(
    <AyurvedaCarePriorities
      enrollmentId="demo-enr-01"
      participantName="Mariana"
      canPrepare
      onPrepare={prepare}
    />,
  )
  const user = userEvent.setup()
  await screen.findByText('Recuperar um ritmo corporal mais estável')
  expect(prepare).not.toHaveBeenCalled()
  await user.click(screen.getByText('Recuperar um ritmo corporal mais estável'))
  expect(screen.getAllByText('Respostas que sustentam esta prioridade')[0]).toBeVisible()
  await user.click(
    screen.getByRole('button', {
      name: 'Revisar prioridade: Recuperar um ritmo corporal mais estável',
    }),
  )
  expect(prepare).toHaveBeenCalledOnce()
  expect(prepare.mock.calls[0][0].professionalRationale).toContain('Kapha ↓')
})
it('bloqueia preparação sem plano e oferece recuperação de falha sem mostrar sinais antigos', async () => {
  state.list
    .mockImplementationOnce(() => {
      throw new Error('offline')
    })
    .mockReturnValue(buildIntegratedAyurvedaQaFixture().responses)
  render(
    <AyurvedaCarePriorities
      enrollmentId="demo-enr-01"
      participantName="Mariana"
      canPrepare={false}
      onPrepare={vi.fn()}
    />,
  )
  const user = userEvent.setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
  await user.click(screen.getByRole('button', { name: 'Atualizar leitura' }))
  await screen.findByText('Recuperar um ritmo corporal mais estável')
  await user.click(screen.getByText('Recuperar um ritmo corporal mais estável'))
  expect(
    screen.getByRole('button', {
      name: 'Revisar prioridade: Recuperar um ritmo corporal mais estável',
    }),
  ).toBeDisabled()
})
