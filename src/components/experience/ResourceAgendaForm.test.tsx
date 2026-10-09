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

it('leva o objetivo da direção para a agenda sem salvar automaticamente', async () => {
  const save = vi.spyOn(plannerNotesService, 'save').mockResolvedValue({ id: 'one' } as any)
  render(
    <ResourceAgendaForm
      enrollmentId="person-a"
      strength="Pedir apoio"
      difficulty="Sobrecarga"
      strategy="Reservar uma pausa"
      initialGoal="Recuperar disposição"
    />,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Levar Pedir apoio para minha agenda diante de Sobrecarga',
    }),
  )
  expect(screen.getByLabelText('Meu objetivo para este momento')).toHaveValue(
    'Recuperar disposição',
  )
  expect(save).not.toHaveBeenCalled()
  dates()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
  await screen.findByRole('status')
  expect(save.mock.calls[0][0].note).toContain('Meu objetivo: Recuperar disposição')
})

it('guarda prazo, ritmo e alternativa da ação junto ao objetivo na agenda', async () => {
  const save = vi.spyOn(plannerNotesService, 'save').mockResolvedValue({ id: 'goal' } as any)
  render(
    <ResourceAgendaForm
      enrollmentId="person-a"
      strength="Organização"
      difficulty="Duas pausas"
      strategy="Pausar dez minutos"
      initialGoal="Recuperar disposição"
      planningContext="Meta: Duas pausas · até 2026-10-23\nRitmo combinado: duas vezes por semana\nEm um dia difícil: dois minutos"
    />,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Levar Organização para minha agenda diante de Duas pausas',
    }),
  )
  dates()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
  await screen.findByRole('status')
  expect(save.mock.calls[0][0].note).toContain('até 2026-10-23')
  expect(save.mock.calls[0][0].note).toContain('Ritmo combinado: duas vezes por semana')
  expect(save.mock.calls[0][0].note).toContain('Em um dia difícil: dois minutos')
})

it('permite distribuir uma ação em outros dias com nova confirmação e datas vazias', async () => {
  const save = vi.spyOn(plannerNotesService, 'save').mockResolvedValue({ id: 'repeat' } as any)
  render(
    <ResourceAgendaForm
      enrollmentId="person-a"
      strength="Organização"
      difficulty="Duas pausas"
      strategy="Pausar"
      repeatable
    />,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Levar Organização para minha agenda diante de Duas pausas',
    }),
  )
  dates()
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Reservar outro momento desta ação' }))
  expect(screen.getByLabelText('Início do meu momento')).toHaveValue('')
  expect(save).toHaveBeenCalledTimes(1)
  fireEvent.input(screen.getByLabelText('Início do meu momento'), {
    target: { value: '2026-10-14T09:00' },
  })
  fireEvent.input(screen.getByLabelText('Fim do meu momento'), {
    target: { value: '2026-10-14T09:10' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar na minha agenda' }))
  await screen.findByRole('status')
  expect(save).toHaveBeenCalledTimes(2)
  expect(save.mock.calls[1][0].starts_at).toBe(new Date('2026-10-14T09:00').toISOString())
})
