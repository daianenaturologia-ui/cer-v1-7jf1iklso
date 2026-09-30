// @vitest-environment jsdom
import React from 'react'
import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'
const auth = vi.hoisted(() => ({ login: vi.fn(), requestPasswordReset: vi.fn() }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }))
it('traduz falhas de acesso, limpa o erro ao recuperar e orienta a verificar spam', async () => {
  auth.login.mockRejectedValue(new Error('Failed to authenticate'))
  auth.requestPasswordReset.mockResolvedValue(undefined)
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'teste@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'test-only' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByText('Não foi possível entrar. Confira seu e-mail e senha e tente novamente.')
  expect(screen.queryByText('Failed to authenticate')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }))
  expect(
    screen.queryByText('Não foi possível entrar. Confira seu e-mail e senha e tente novamente.'),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar Solicitação' }))
  expect(await screen.findByText(/Confira também Spam e Lixo eletrônico/)).toBeInTheDocument()
})
