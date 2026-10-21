// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResetPassword } from './ResetPassword'
import pb from '@/lib/pocketbase/client'

vi.mock('@/lib/pocketbase/client', () => {
  const confirmPasswordResetMock = vi.fn()
  return {
    default: {
      collection: vi.fn(() => ({
        confirmPasswordReset: confirmPasswordResetMock,
      })),
      autoCancellation: vi.fn(),
    },
    getPocketBaseUrl: () => 'http://127.0.0.1:8090',
  }
})

describe('ResetPassword Page', () => {
  const mockConfirmPasswordReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
    window.history.replaceState(null, '', '/reset-password')
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)
  })

  it('1. Ausência de token: exibe alerta de link ausente/inválido e botão de retorno sem permitir formulário', async () => {
    window.location.hash = ''

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Link de recuperação ausente ou inválido/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nova Senha/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar ao login/i })).toBeInTheDocument()
  })

  it('2. Mismatch de senha: exibe erro de divergência sem chamar pb.collection("users").confirmPasswordReset', async () => {
    window.location.hash = '#token=fake_mock_token_123'

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    // Fragmento #token= foi removido do endereço após leitura
    expect(window.location.hash).toBe('')

    const pwdInput = await screen.findByLabelText(/^Nova Senha$/i)
    const confirmInput = screen.getByLabelText(/^Confirmar Nova Senha$/i)
    const submitBtn = screen.getByRole('button', { name: /Salvar nova senha/i })

    fireEvent.change(pwdInput, { target: { value: 'senhaForte123' } })
    fireEvent.change(confirmInput, { target: { value: 'senhaDiferente456' } })
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/As senhas informadas não conferem/i)).toBeInTheDocument()
    expect(mockConfirmPasswordReset).not.toHaveBeenCalled()
  })

  it('3. Validação de tamanho mínimo: rejeita senha menor que 8 caracteres sem chamar PocketBase', async () => {
    window.location.hash = '#token=fake_mock_token_123'

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    const pwdInput = await screen.findByLabelText(/^Nova Senha$/i)
    const confirmInput = screen.getByLabelText(/^Confirmar Nova Senha$/i)
    const submitBtn = screen.getByRole('button', { name: /Salvar nova senha/i })

    fireEvent.change(pwdInput, { target: { value: '123' } })
    fireEvent.change(confirmInput, { target: { value: '123' } })
    fireEvent.click(submitBtn)

    expect(
      await screen.findByText(/A nova senha deve ter pelo menos 8 caracteres/i),
    ).toBeInTheDocument()
    expect(mockConfirmPasswordReset).not.toHaveBeenCalled()
  })

  it('4. Sucesso: envia token em memória, confirma reset sem autenticar automaticamente e orienta voltar ao login', async () => {
    window.location.hash = '#token=fake_mock_token_abc_xyz'
    mockConfirmPasswordReset.mockResolvedValueOnce(true)

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    const pwdInput = await screen.findByLabelText(/^Nova Senha$/i)
    const confirmInput = screen.getByLabelText(/^Confirmar Nova Senha$/i)
    const submitBtn = screen.getByRole('button', { name: /Salvar nova senha/i })

    fireEvent.change(pwdInput, { target: { value: 'novaSenhaSegura999' } })
    fireEvent.change(confirmInput, { target: { value: 'novaSenhaSegura999' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledTimes(1)
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'fake_mock_token_abc_xyz',
        'novaSenhaSegura999',
        'novaSenhaSegura999',
      )
    })

    expect(await screen.findByText(/Senha redefinida com sucesso/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir para o login/i })).toBeInTheDocument()
  })

  it('5. Erro no token (inválido ou expirado): orienta a solicitar novo e-mail', async () => {
    window.location.hash = '#token=fake_expired_token'
    mockConfirmPasswordReset.mockRejectedValueOnce(new Error('Invalid token'))

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    const pwdInput = await screen.findByLabelText(/^Nova Senha$/i)
    const confirmInput = screen.getByLabelText(/^Confirmar Nova Senha$/i)
    const submitBtn = screen.getByRole('button', { name: /Salvar nova senha/i })

    fireEvent.change(pwdInput, { target: { value: 'senhaValida123' } })
    fireEvent.change(confirmInput, { target: { value: 'senhaValida123' } })
    fireEvent.click(submitBtn)

    expect(
      await screen.findByText(
        /O link de recuperação é inválido ou expirou\. Solicite um novo e-mail/i,
      ),
    ).toBeInTheDocument()
  })

  it('6. Preservação de token em rerender: mesmo após limpeza do hash na URL, re-renderizações mantêm o token em memória', async () => {
    window.location.hash = '#token=fake_preserved_token'
    mockConfirmPasswordReset.mockResolvedValueOnce(true)

    const { rerender } = render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    // O fragmento do hash já foi consumido e limpo
    expect(window.location.hash).toBe('')

    // Disparar re-render do componente
    rerender(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    )

    const pwdInput = await screen.findByLabelText(/^Nova Senha$/i)
    const confirmInput = screen.getByLabelText(/^Confirmar Nova Senha$/i)
    const submitBtn = screen.getByRole('button', { name: /Salvar nova senha/i })

    fireEvent.change(pwdInput, { target: { value: 'minhaNovaSenha2026' } })
    fireEvent.change(confirmInput, { target: { value: 'minhaNovaSenha2026' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledTimes(1)
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'fake_preserved_token',
        'minhaNovaSenha2026',
        'minhaNovaSenha2026',
      )
    })
  })
})
