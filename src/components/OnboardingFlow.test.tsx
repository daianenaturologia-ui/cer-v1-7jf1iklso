import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import OnboardingFlow from './OnboardingFlow'

test('the welcome permits review and only completes from its last moment', () => {
  const finish = vi.fn()
  render(<OnboardingFlow interagenteName="Teste" onComplete={finish} />)
  expect(screen.getByText('Momento 1 de 5')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Concluir e Começar' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(screen.getByText('Momento 1 de 5')).toBeInTheDocument()
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
  expect(finish).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Concluir e Começar' }))
  expect(finish).toHaveBeenCalledOnce()
})

test('saving prevents repeated completion and a save error preserves the last moment', () => {
  const finish = vi.fn()
  const view = render(<OnboardingFlow onComplete={finish} />)
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
  view.rerender(<OnboardingFlow onComplete={finish} busy />)
  expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Salvando…' }))
  expect(finish).not.toHaveBeenCalled()
  view.rerender(
    <OnboardingFlow onComplete={finish} error="Não foi possível salvar. Tente novamente." />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Tente novamente')
  expect(screen.getByText('Momento 5 de 5')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Concluir e Começar' })).toBeEnabled()
})
