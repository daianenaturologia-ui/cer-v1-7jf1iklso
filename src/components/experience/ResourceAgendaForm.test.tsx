import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ResourceAgendaForm } from './ResourceAgendaForm'
import { plannerNotesService } from '@/services/plannerNotes'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
function setup() {
  render(
    <ResourceAgendaForm
      enrollmentId="person-a"
      strength="Discernimento"
      difficulty="Dispersão"
      strategy="Escolher uma prioridade"
    />,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Levar Discernimento para minha agenda diante de Dispersão',
    }),
  )
}
function dates() {
  fireEvent.change(screen.getByLabelText('Início do meu momento'), {
    target: { value: '2026-10-12T09:00' },
  })
  fireEvent.change(screen.getByLabelText('Fim do meu momento'), {
    target: { value: '2026-10-12T09:30' },
  })
}
describe('Estratégia para agenda privada', () => {
  it('só cria após confirmação e mantém origem e objetivo na anotação', async () => {
    const save = vi.spyOn(plannerNotesService, 'save').mockResolvedValue({ id: 'one' } as never)
    setup()
    expect(save).not.toHaveBeenCalled()
    dates()
    fireEvent.change(screen.getByLabelText('Meu objetivo para este momento'), {
      target: { value: 'Trabalhar com leveza' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    await screen.findByRole('status')
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][0]).toMatchObject({
      enrollment_id: 'person-a',
      title: 'Escolher uma prioridade',
      kind: 'life',
      status: 'planned',
      starts_at: new Date('2026-10-12T09:00').toISOString(),
    })
    expect(save.mock.calls[0][0].note).toContain('Meu objetivo: Trabalhar com leveza')
    expect(save.mock.calls[0][0].note).toContain('Dificuldade que desejo cuidar: Dispersão')
    expect(screen.queryByRole('button', { name: 'Confirmar na minha agenda' })).toBeNull()
  })
  it('rejeita datas ausentes ou fim anterior sem enviar nada', async () => {
    const save = vi.spyOn(plannerNotesService, 'save')
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Escolha o início')
    dates()
    fireEvent.change(screen.getByLabelText('Fim do meu momento'), {
      target: { value: '2026-10-12T08:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('horário final')
    expect(save).not.toHaveBeenCalled()
  })
  it('preserva campos em falha e bloqueia novo envio enquanto salva', async () => {
    let finish!: (x: never) => void
    const save = vi
      .spyOn(plannerNotesService, 'save')
      .mockRejectedValueOnce(new Error('Falha de conexão'))
      .mockImplementationOnce(() => new Promise((r) => (finish = r)))
    setup()
    dates()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('Meu pequeno passo')).toHaveValue('Escolher uma prioridade')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(screen.getByLabelText('Início do meu momento')).toBeDisabled()
    finish({ id: 'two' } as never)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('guardado'))
    expect(save).toHaveBeenCalledTimes(2)
  })
  it('permite voltar sem criar compromisso', () => {
    const save = vi.spyOn(plannerNotesService, 'save')
    setup()
    dates()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao exercício' }))
    expect(save).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Início do meu momento')).toBeNull()
  })
  it('captura preenchimento via evento input nos campos datetime-local', async () => {
    const save = vi.spyOn(plannerNotesService, 'save').mockResolvedValue({ id: 'three' } as never)
    setup()
    fireEvent.input(screen.getByLabelText('Início do meu momento'), {
      target: { value: '2026-10-12T09:00' },
    })
    fireEvent.input(screen.getByLabelText('Fim do meu momento'), {
      target: { value: '2026-10-12T09:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
    await screen.findByRole('status')
    expect(save).toHaveBeenCalledTimes(1)
  })
})
