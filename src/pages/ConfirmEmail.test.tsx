import { StrictMode } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import ConfirmEmail from './ConfirmEmail'

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), resend: vi.fn() }))
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: () => ({ confirmVerification: mocks.confirm, requestVerification: mocks.resend }) } }))
beforeEach(() => { vi.clearAllMocks(); window.history.replaceState({}, '', '/confirmar-email') })
const open = () => render(<StrictMode><MemoryRouter><ConfirmEmail /></MemoryRouter></StrictMode>)

test('removes token from history and waits for explicit confirmation', async () => {
  window.history.replaceState({}, '', '/confirmar-email#token=synthetic-token')
  open()
  expect(window.location.hash).toBe('')
  expect(mocks.confirm).not.toHaveBeenCalled()
  expect(document.body.textContent).not.toContain('synthetic-token')
  mocks.confirm.mockResolvedValueOnce(true)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar meu e-mail' }))
  await screen.findByRole('heading', { name: 'E-mail confirmado' })
  expect(mocks.confirm).toHaveBeenCalledExactlyOnceWith('synthetic-token', { requestKey: null })
  expect(screen.getByRole('link', { name: 'Entrar na minha jornada' })).toHaveAttribute('href', '/login')
  expect(localStorage.length).toBe(0)
})

test('invalid token shows recovery and never claims confirmation', async () => {
  window.history.replaceState({}, '', '/confirmar-email#token=expired-synthetic')
  mocks.confirm.mockRejectedValueOnce(new Error('invalid'))
  open()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar meu e-mail' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível confirmar')
  expect(screen.queryByRole('heading', { name: 'E-mail confirmado' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Confirmar meu e-mail' })).not.toBeInTheDocument()
})

test('missing link permits native resend without password or account creation', async () => {
  mocks.resend.mockResolvedValueOnce(true)
  open()
  expect(mocks.confirm).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('E-mail usado no cadastro'), { target: { value: 'test@example.invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar nova confirmação' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Se houver uma conta aguardando confirmação')
  expect(mocks.resend).toHaveBeenCalledExactlyOnceWith('test@example.invalid', { requestKey: null })
})

test('resend failure does not claim that a message was sent', async () => {
  mocks.resend.mockRejectedValueOnce(new Error('transport'))
  open()
  fireEvent.change(screen.getByLabelText('E-mail usado no cadastro'), { target: { value: 'test@example.invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar nova confirmação' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível solicitar'))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
