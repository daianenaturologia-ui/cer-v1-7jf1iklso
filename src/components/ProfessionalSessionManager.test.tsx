import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
  })
})
