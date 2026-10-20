import React from 'react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { DailyRoutineDay } from './DailyRoutineDay'
import { dailyRoutineService } from '@/services/dailyRoutine'
import { demoAdapter, DEMO_ENROLLMENT_ID as ID } from '@/services/demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({ default: {} }))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
async function fillDay() {
  await screen.findByRole('form', { name: 'Um dia da minha vida' })
  fireEvent.change(screen.getByLabelText('Horário 1'), { target: { value: '07:00' } })
  fireEvent.change(screen.getByLabelText('O que faço nesse momento 1'), {
    target: { value: 'Acordo e preparo o café' },
  })
  fireEvent.click(screen.getByText('Adicionar momento do dia'))
  fireEvent.change(screen.getByLabelText('Horário 2'), { target: { value: '23:00' } })
  fireEvent.change(screen.getByLabelText('O que faço nesse momento 2'), {
    target: { value: 'Vou dormir' },
  })
}
it('continuar depois retoma o dia sem compartilhar nem enviar para o Planner', async () => {
  const save = vi.spyOn(dailyRoutineService, 'save')
  const view = render(<DailyRoutineDay enrollmentId={ID} />)
  await fillDay()
  fireEvent.click(screen.getByText('Continuar depois'))
  expect(save).not.toHaveBeenCalled()
  view.unmount()
  render(<DailyRoutineDay enrollmentId={ID} />)
  expect(await screen.findByDisplayValue('Vou dormir')).toBeVisible()
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(screen.queryByText('Vincular a um futuro da Linha da Vida (opcional)')).toBeNull()
})
it('salva, reabre e apresenta à profissional apenas depois da escolha explícita', async () => {
  const view = render(<DailyRoutineDay enrollmentId={ID} />)
  await fillDay()
  fireEvent.click(screen.getByText('Salvar minha rotina'))
  await screen.findByText('Rotina salva. Por enquanto, só você pode acessá-la.')
  view.unmount()
  demoAdapter.enableDemo('daiane')
  const pro = render(<DailyRoutineDay enrollmentId={ID} readOnly />)
  await screen.findByText('A pessoa ainda não compartilhou um dia da sua rotina.')
  pro.unmount()
  demoAdapter.enableDemo('mariana')
  const owner = render(<DailyRoutineDay enrollmentId={ID} />)
  await screen.findByDisplayValue('Vou dormir')
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByText('Salvar minha rotina'))
  await screen.findByText('Rotina salva e compartilhada para os encontros.')
  owner.unmount()
  demoAdapter.enableDemo('daiane')
  render(<DailyRoutineDay enrollmentId={ID} readOnly />)
  expect(await screen.findByText('Acordo e preparo o café')).toBeVisible()
  expect(screen.queryByText('Salvar minha rotina')).toBeNull()
})
it('falha ao salvar preserva o que foi escrito e permite tentar novamente', async () => {
  vi.spyOn(dailyRoutineService, 'save').mockRejectedValueOnce(new Error('Falha de rede'))
  render(<DailyRoutineDay enrollmentId={ID} />)
  await fillDay()
  fireEvent.click(screen.getByText('Salvar minha rotina'))
  await screen.findByText('Falha de rede')
  expect(screen.getByLabelText('O que faço nesse momento 2')).toHaveValue('Vou dormir')
  fireEvent.click(screen.getByText('Salvar minha rotina'))
  await screen.findByText('Rotina salva. Por enquanto, só você pode acessá-la.')
})
it('erro de carregamento exige tentar novamente antes de criar outro registro', async () => {
  vi.spyOn(dailyRoutineService, 'load').mockRejectedValueOnce(new Error('rede'))
  render(<DailyRoutineDay enrollmentId={ID} />)
  fireEvent.click(await screen.findByText('Tentar novamente'))
  await screen.findByRole('form', { name: 'Um dia da minha vida' })
})
it('uma resposta atrasada não passa de uma pessoa para outra', async () => {
  let resolve: (value: null) => void = () => {}
  vi.spyOn(dailyRoutineService, 'load')
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    .mockResolvedValueOnce(null)
  const view = render(<DailyRoutineDay enrollmentId="primeira" readOnly />)
  view.rerender(<DailyRoutineDay enrollmentId="segunda" readOnly />)
  await screen.findByText('A pessoa ainda não compartilhou um dia da sua rotina.')
  resolve(null)
  await waitFor(() => expect(screen.queryByText('Carregando sua rotina…')).toBeNull())
})
