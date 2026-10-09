import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LifeDirections } from './LifeDirections'
import { resourceExerciseService } from '@/services/cerResourceExercise'
import { lifeDirectionsService } from '@/services/lifeDirections'
vi.mock('@/services/lifeDirections', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/lifeDirections')>()),
  lifeDirectionsService: { list: vi.fn(), save: vi.fn() },
}))
vi.mock('@/services/cerResourceExercise', () => ({
  resourceExerciseService: { load: vi.fn().mockResolvedValue(null) },
}))
vi.mock('@/components/VoiceInputCapture', () => ({ VoiceInputCapture: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(lifeDirectionsService.list).mockResolvedValue([])
})
describe('Presente e futuro', () => {
  it('abre com privacidade padrão e mantém texto quando salvar falha', async () => {
    vi.mocked(lifeDirectionsService.save).mockRejectedValue(new Error('Falha ao salvar'))
    render(<LifeDirections enrollmentId="mariana" />)
    fireEvent.click(await screen.findByRole('button', { name: /Uma direção/ }))
    const title = screen.getByLabelText('Nome deste registro')
    fireEvent.change(title, { target: { value: 'Um desejo' } })
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }))
    await screen.findByText('Falha ao salvar')
    expect(title).toHaveValue('Um desejo')
    expect(lifeDirectionsService.save).toHaveBeenCalledWith(
      expect.objectContaining({ access_class: 'participant_private', horizon: 'open' }),
      undefined,
    )
  })
  it('visão profissional filtra fontes privadas e não permite editar', async () => {
    vi.mocked(lifeDirectionsService.list).mockResolvedValue([
      {
        id: 'p',
        enrollment_id: 'mariana',
        kind: 'present',
        horizon: 'now',
        title: 'Privado',
        narrative: '',
        meaning: '',
        resources: '',
        limits: '',
        first_step: '',
        access_class: 'participant_private',
      },
      {
        id: 's',
        enrollment_id: 'mariana',
        kind: 'future',
        horizon: 'short',
        title: 'Compartilhado',
        narrative: '',
        meaning: '',
        resources: '',
        limits: '',
        first_step: '',
        access_class: 'participant_shared',
      },
    ])
    render(<LifeDirections enrollmentId="mariana" readOnly />)
    await screen.findByText('Compartilhado')
    expect(screen.queryByText('Privado')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar registro' })).toBeNull()
  })
  it('troca de pessoa descarta resultados de carregamento atrasado', async () => {
    let resolve!: (values: any[]) => void
    vi.mocked(lifeDirectionsService.list).mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    const view = render(<LifeDirections enrollmentId="antiga" />)
    view.rerender(<LifeDirections enrollmentId="nova" />)
    await waitFor(() => expect(screen.queryByText('Carregando registros…')).toBeNull())
    resolve([{ id: 'x', kind: 'present', title: 'Da pessoa anterior' }])
    await waitFor(() => expect(screen.queryByText('Da pessoa anterior')).toBeNull())
  })
})

it('salva uma direção pelos três passos sem exigir clareza pronta', async () => {
  vi.mocked(lifeDirectionsService.save).mockImplementation(async (value) => ({
    ...value,
    id: 'new',
  }))
  render(<LifeDirections enrollmentId="mariana" planning />)
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher minha primeira direção' }))
  fireEvent.change(
    screen.getByLabelText('Conte uma situação que mostre como isso aparece na sua vida hoje.'),
    { target: { value: 'Não consigo desligar do trabalho.' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ainda não tenho clareza da mudança' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.change(screen.getByLabelText('As condições que meu plano precisa respeitar'), {
    target: { value: 'Duas pausas por semana. Alimentação ainda não cabe.' },
  })
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Salvar minha direção' }))
  await screen.findByText(/Direção salva/)
  expect(lifeDirectionsService.save).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Compreender o que está me causando angústia',
      kind: 'future',
      horizon: 'open',
      narrative: 'Não consigo desligar do trabalho.',
      limits: 'Duas pausas por semana. Alimentação ainda não cabe.',
      access_class: 'participant_private',
    }),
    undefined,
  )
})
it('reaproveita o presente e preserva suas condições sem modificar o original', async () => {
  const old = {
    id: 'old',
    enrollment_id: 'mariana',
    kind: 'present',
    horizon: 'now',
    title: 'Meu momento',
    narrative: 'Cansaço',
    resources: 'Apoio',
    meaning: 'Valores',
    limits: 'Pouco tempo',
    first_step: '',
    access_class: 'participant_private',
  } as any
  vi.mocked(lifeDirectionsService.list).mockResolvedValue([old])
  render(<LifeDirections enrollmentId="mariana" planning />)
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher minha primeira direção' }))
  expect(
    screen.getByLabelText('Conte uma situação que mostre como isso aparece na sua vida hoje.'),
  ).toHaveValue('Cansaço')
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  expect(screen.getByLabelText('As condições que meu plano precisa respeitar')).toHaveValue(
    'Pouco tempo',
  )
  expect(old.kind).toBe('present')
  expect(lifeDirectionsService.save).not.toHaveBeenCalled()
})
it('inclui uma estratégia do jogo apenas por escolha e mantém textos se salvar falhar', async () => {
  vi.mocked(resourceExerciseService.load).mockResolvedValue({
    id: 'game',
    revision: 1,
    data: { connections: [{ strategy: 'Pedir apoio antes de assumir mais uma tarefa.' }] },
  } as any)
  vi.mocked(lifeDirectionsService.save).mockRejectedValue(new Error('Falha ao salvar'))
  render(<LifeDirections enrollmentId="mariana" planning />)
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher minha primeira direção' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  const input = screen.getByLabelText('Meu começo e os apoios que quero usar')
  expect(input).toHaveValue('')
  fireEvent.click(
    await screen.findByRole('button', { name: 'Pedir apoio antes de assumir mais uma tarefa.' }),
  )
  expect(input).toHaveValue('Pedir apoio antes de assumir mais uma tarefa.')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar minha direção' }))
  await screen.findByText('Falha ao salvar')
  expect(input).toHaveValue('Pedir apoio antes de assumir mais uma tarefa.')
})
it('profissional não carrega o exercício privado do jogo', async () => {
  render(<LifeDirections enrollmentId="mariana" planning readOnly />)
  await screen.findAllByText('Ainda não há registros compartilhados deste momento.')
  expect(resourceExerciseService.load).not.toHaveBeenCalled()
})
