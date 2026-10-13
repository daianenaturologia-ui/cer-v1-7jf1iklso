import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfessionalSessionManager } from './ProfessionalSessionManager'
import {
  cerSessionService,
  cerSessionNoteService,
  cerSessionObservationService,
  computeSessionPreparation,
} from '@/services/cerSession'
vi.mock('./SessionMapUpdate', () => ({ SessionMapUpdate: () => <div>Revisão do mapa</div> }))
vi.mock('@/services/cerSession', () => ({
  cerSessionService: {
    listByEnrollment: vi.fn(),
    createScheduled: vi.fn(),
    startSession: vi.fn(),
    completeSession: vi.fn(),
    updateScheduledDate: vi.fn(),
  },
  cerSessionNoteService: { getBySessionId: vi.fn(), update: vi.fn(), create: vi.fn() },
  cerSessionObservationService: { listBySession: vi.fn() },
  computeSessionPreparation: vi.fn(),
}))
const session = {
  id: 's',
  enrollment_id: 'mine',
  professional_user_id: 'professional',
  status: 'in_progress',
  created: '2026-10-05',
} as any
const note = {
  id: 'n',
  session_id: 's',
  enrollment_id: 'mine',
  text: 'Texto privado anterior',
} as any
beforeEach(() => {
  vi.mocked(cerSessionService.listByEnrollment).mockResolvedValue([session])
  vi.mocked(computeSessionPreparation).mockResolvedValue({} as any)
  vi.mocked(cerSessionNoteService.getBySessionId).mockResolvedValue(note)
  vi.mocked(cerSessionObservationService.listBySession).mockResolvedValue([])
  vi.mocked(cerSessionNoteService.update).mockResolvedValue({ ...note, text: '' })
  vi.mocked(cerSessionService.completeSession).mockResolvedValue({
    ...session,
    status: 'completed',
  })
})
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})
describe('Registro e fechamento do encontro', () => {
  it('salva inclusive o apagamento intencional da nota antes de concluir', async () => {
    render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
    await userEvent.clear(screen.getByPlaceholderText(/Espaço livre/))
    await userEvent.click(screen.getByRole('button', { name: 'Concluir Encontro' }))
    expect(cerSessionNoteService.update).toHaveBeenCalledWith('n', '')
    expect(cerSessionService.completeSession).toHaveBeenCalledWith('s')
    expect(vi.mocked(cerSessionNoteService.update).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(cerSessionService.completeSession).mock.invocationCallOrder[0],
    )
  })
  it('erro de leitura não vira nota vazia editável nem permite concluir', async () => {
    vi.mocked(cerSessionNoteService.getBySessionId).mockRejectedValue(new Error('offline'))
    render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
    expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Concluir Encontro' })).toBeDisabled()
    expect(screen.getByText(/edição foi bloqueada/)).toBeInTheDocument()
    expect(cerSessionNoteService.update).not.toHaveBeenCalled()
  })
  it('novo encontro abre escolha de horário em vez de criar registro imediatamente', async () => {
    render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Novo Encontro' }))
    expect(screen.getByLabelText('Data e horário')).toBeInTheDocument()
    expect(cerSessionService.createScheduled).not.toHaveBeenCalled()
    vi.mocked(cerSessionService.createScheduled).mockResolvedValue({
      ...session,
      status: 'scheduled',
    })
    fireEvent.input(screen.getByLabelText('Data e horário'), {
      target: { value: '2026-10-06T15:00' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar horário' }))
    expect(cerSessionService.createScheduled).toHaveBeenCalledWith(
      'mine',
      new Date('2026-10-06T15:00').toISOString(),
    )
  })
})

describe('Continuidade da nota profissional', () => {
  it('mantém o rascunho ao consultar outro encontro e voltar', async () => {
    const second = { ...session, id: 'second', status: 'scheduled', created: '2026-10-06' }
    vi.mocked(cerSessionService.listByEnrollment).mockResolvedValue([session, second])
    vi.mocked(cerSessionNoteService.getBySessionId).mockImplementation(async (id) =>
      id === 's' ? note : null,
    )
    render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
    await userEvent.clear(screen.getByRole('textbox', { name: 'Nota profissional privada' }))
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Nota profissional privada' }),
      'Rascunho ainda não salvo',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Histórico (2)' }))
    await userEvent.click(screen.getAllByRole('button', { name: 'Visualizar' })[1])
    expect(await screen.findByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
      '',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Histórico (2)' }))
    await userEvent.click(screen.getAllByRole('button', { name: 'Visualizar' })[0])
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
        'Rascunho ainda não salvo',
      ),
    )
    expect(cerSessionNoteService.update).not.toHaveBeenCalled()
  })

  it('não substitui a nota de outra matrícula por um salvamento atrasado', async () => {
    let resolveSave!: (value: any) => void
    vi.mocked(cerSessionNoteService.update).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }),
    )
    const view = render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
    await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nota profissional privada' }), {
      target: { value: 'Nota anterior em envio' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Anotação' }))
    expect(screen.getByRole('button', { name: 'Novo Encontro' })).toBeDisabled()
    const other = { ...session, id: 'other-session', enrollment_id: 'other' }
    const otherNote = {
      ...note,
      id: 'other-note',
      session_id: other.id,
      enrollment_id: 'other',
      text: 'Nota da nova matrícula',
    }
    vi.mocked(cerSessionService.listByEnrollment).mockResolvedValue([other])
    vi.mocked(cerSessionNoteService.getBySessionId).mockResolvedValue(otherNote)
    view.rerender(<ProfessionalSessionManager enrollmentId="other" participantName="Outra" />)
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
        'Nota da nova matrícula',
      ),
    )
    await act(async () => {
      resolveSave({ ...note, text: 'Nota anterior em envio' })
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Nota profissional privada' }), {
      target: { value: 'Nova edição' },
    })
    vi.mocked(cerSessionNoteService.update).mockResolvedValue({ ...otherNote, text: 'Nova edição' })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Anotação' }))
    expect(cerSessionNoteService.update).toHaveBeenLastCalledWith('other-note', 'Nova edição')
  })
})

it('mantém a nota e não conclui quando o salvamento falha', async () => {
  vi.mocked(cerSessionNoteService.update).mockRejectedValue(new Error('Falha de conexão ao salvar'))
  render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
  await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Nota profissional privada' }), {
    target: { value: 'Rascunho para recuperar' },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Concluir Encontro' }))
  await screen.findByText('Falha de conexão ao salvar')
  expect(cerSessionService.completeSession).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
    'Rascunho para recuperar',
  )
  vi.mocked(cerSessionNoteService.update).mockResolvedValue({
    ...note,
    text: 'Rascunho para recuperar',
  })
  await userEvent.click(screen.getByRole('button', { name: 'Salvar Anotação' }))
  await screen.findByText('Nota profissional salva com sucesso.')
  expect(screen.queryByText(/Alterações ainda não salvas/)).toBeNull()
})

it('interrompe o fechamento pendente quando a matrícula muda', async () => {
  let resolveSave!: (value: any) => void
  vi.mocked(cerSessionNoteService.update).mockReturnValue(
    new Promise((resolve) => {
      resolveSave = resolve
    }),
  )
  const view = render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
  await userEvent.click(await screen.findByRole('button', { name: /^Encontro Atual/ }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Nota profissional privada' }), {
    target: { value: 'Nota antiga' },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Concluir Encontro' }))
  const other = { ...session, id: 'other-session', enrollment_id: 'other' }
  vi.mocked(cerSessionService.listByEnrollment).mockResolvedValue([other])
  vi.mocked(cerSessionNoteService.getBySessionId).mockResolvedValue({
    ...note,
    session_id: other.id,
    enrollment_id: 'other',
    text: 'Nota atual',
  })
  view.rerender(<ProfessionalSessionManager enrollmentId="other" participantName="Outra" />)
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
      'Nota atual',
    ),
  )
  await act(async () => {
    resolveSave({ ...note, text: 'Nota antiga' })
  })
  expect(cerSessionService.completeSession).not.toHaveBeenCalled()
  expect(screen.getByRole('textbox', { name: 'Nota profissional privada' })).toHaveValue(
    'Nota atual',
  )
})

it('mostra o horário combinado no histórico e distingue encontro sem horário', async () => {
  vi.mocked(cerSessionService.listByEnrollment).mockResolvedValue([
    { ...session, scheduled_at: new Date('2026-10-15T14:00').toISOString() },
    { ...session, id: 'unscheduled', status: 'scheduled' },
  ])
  render(<ProfessionalSessionManager enrollmentId="mine" participantName="Pessoa" />)
  await userEvent.click(await screen.findByRole('button', { name: 'Histórico (2)' }))
  expect(screen.getByText(/Encontro em 15 de outubro de 2026.*14:00/)).toBeInTheDocument()
  expect(screen.getByText('Encontro sem horário definido')).toBeInTheDocument()
})
