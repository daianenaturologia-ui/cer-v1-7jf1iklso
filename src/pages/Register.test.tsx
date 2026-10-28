import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
const mocks = vi.hoisted(() => ({ info: vi.fn(), register: vi.fn(), resend: vi.fn() }))
vi.mock('@/services/selfRegistration', () => ({ selfRegistration: mocks }))
import Register from './Register'
beforeEach(() => {
  vi.resetAllMocks()
  mocks.info.mockResolvedValue({
    professionalName: 'Profissional de teste',
    productName: 'Acompanhamento CER',
  })
})
function page() {
  render(
    <MemoryRouter initialEntries={['/cadastro/link-de-teste']}>
      <Link to="/cadastro/other">Outro convite</Link>
      <Routes>
        <Route path="/cadastro/:slug" element={<Register />} />
      </Routes>
    </MemoryRouter>,
  )
}
async function form() {
  page()
  await screen.findByLabelText('Nome completo')
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Pessoa de Teste' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.invalid' } })
  fireEvent.change(screen.getByLabelText('Crie sua senha'), {
    target: { value: 'Fixture-only-123' },
  })
  fireEvent.change(screen.getByLabelText('Repita sua senha'), {
    target: { value: 'Fixture-only-123' },
  })
  fireEvent.click(screen.getByRole('checkbox'))
}
it('link indisponível não oferece cadastro nem seleciona outra profissional', async () => {
  mocks.info.mockRejectedValue(new Error('invalid'))
  page()
  expect(await screen.findByRole('alert')).toHaveTextContent('Confira o link')
  expect(screen.queryByRole('button', { name: 'Criar minha conta' })).toBeNull()
})
it('explica o vínculo, exige escolha e recusa senhas diferentes sem enviar', async () => {
  await form()
  fireEvent.change(screen.getByLabelText('Repita sua senha'), {
    target: { value: 'Different-123' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Criar minha conta' }).closest('form')!)
  expect(await screen.findByRole('alert')).toHaveTextContent('As senhas precisam ser iguais')
  expect(mocks.register).not.toHaveBeenCalled()
})
it('depois do envio orienta confirmar e-mail antes de entrar, sem guardar senha', async () => {
  mocks.register.mockResolvedValue({ next: 'check_email' })
  await form()
  fireEvent.submit(screen.getByRole('button', { name: 'Criar minha conta' }).closest('form')!)
  expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Crie sua senha')).toBeNull()
  expect(screen.getByRole('link', { name: 'Já confirmei meu e-mail · Entrar' })).toHaveAttribute(
    'href',
    '/login',
  )
  expect(mocks.register.mock.calls[0][0]).toMatchObject({ slug: 'link-de-teste', acceptLink: true })
  expect(localStorage.length).toBe(0)
})
it('falha de envio preserva nome e e-mail, limpa senhas e permite reenviar confirmação', async () => {
  mocks.register.mockRejectedValue(new Error('offline'))
  mocks.resend.mockResolvedValue(true)
  await form()
  fireEvent.submit(screen.getByRole('button', { name: 'Criar minha conta' }).closest('form')!)
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Nome completo')).toHaveValue('Pessoa de Teste')
  expect(screen.getByLabelText('Crie sua senha')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Reenviar confirmação' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Se houver uma conta')
  expect(mocks.resend).toHaveBeenCalledWith('pessoa@example.invalid')
})

it('trocar de convite descarta o formulário e ignora confirmação atrasada do anterior', async () => {
  let finish: (value: unknown) => void = () => {}
  mocks.register.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  await form()
  fireEvent.submit(screen.getByRole('button', { name: 'Criar minha conta' }).closest('form')!)
  mocks.info.mockResolvedValue({
    professionalName: 'Outra profissional',
    productName: 'Outro acompanhamento',
  })
  fireEvent.click(screen.getByRole('link', { name: 'Outro convite' }))
  await screen.findByText('Outra profissional', { exact: true })
  await act(async () => {
    finish({ next: 'check_email' })
  })
  expect(screen.queryByRole('heading', { name: 'Confira seu e-mail' })).toBeNull()
  expect(screen.getByLabelText('Nome completo')).toHaveValue('')
  expect(screen.getByLabelText('Crie sua senha')).toHaveValue('')
})
