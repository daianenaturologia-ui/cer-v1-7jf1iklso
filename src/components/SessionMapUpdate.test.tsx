import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionMapUpdate } from './SessionMapUpdate'
import { sessionMapUpdateService } from '@/services/sessionMapUpdate'
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user:{id:'professional'},isProfissional:true})}))
vi.mock('@/services/sessionMapUpdate', () => ({sessionMapUpdateService:{read:vi.fn(),save:vi.fn()}}))
afterEach(() => {cleanup();vi.resetAllMocks()})
describe('Revisão explícita da síntese do encontro', () => {
  it('exige revisão e envia apenas a formulação humana ao rascunho', async () => {
    vi.mocked(sessionMapUpdateService.read).mockResolvedValue('')
    vi.mocked(sessionMapUpdateService.save).mockResolvedValue({} as any)
    render(<SessionMapUpdate enrollmentId="mine" sessionId="session" participantName="Pessoa" />)
    await screen.findByText(/A análise por IA ainda depende/)
    const text = screen.getByRole('textbox')
    await userEvent.type(text, 'Uma hipótese para conversarmos.')
    const save = screen.getByRole('button',{name:'Salvar no rascunho do mapa'})
    expect(save).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(save)
    expect(sessionMapUpdateService.save).toHaveBeenCalledWith(expect.objectContaining({summary:'Uma hipótese para conversarmos.',sessionId:'session',enrollmentId:'mine'}))
    expect(await screen.findByRole('status')).toHaveTextContent('Atualização salva no rascunho')
  })
  it('rejeita resposta tardia de outro encontro', async () => {
    let resolveOld!: (value:string) => void
    vi.mocked(sessionMapUpdateService.read).mockReturnValueOnce(new Promise(r => {resolveOld=r})).mockResolvedValueOnce('Novo encontro')
    const view=render(<SessionMapUpdate enrollmentId="mine" sessionId="old" participantName="Pessoa" />)
    view.rerender(<SessionMapUpdate enrollmentId="other" sessionId="new" participantName="Outra" />)
    await act(async () => { await Promise.resolve(); resolveOld('Texto confidencial antigo') })
    expect(screen.getByRole('textbox')).toHaveValue('Novo encontro')
    expect(screen.queryByText('Texto confidencial antigo')).toBeNull()
  })
})
