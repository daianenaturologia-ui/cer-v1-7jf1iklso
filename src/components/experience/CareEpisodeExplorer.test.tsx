import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CareEpisodeExplorer } from './CareEpisodeExplorer'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import { careEpisodeInput, emptyCareEpisode } from '@/services/careEpisode'
import type { LifeDirection } from '@/services/lifeDirections'
vi.mock('@/lib/pocketbase/client', () => ({ default: { authStore: { record: { id: 'owner' } } } }))
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
vi.mock('@/services/selfDevelopment', () => ({
  selfDevelopmentService: { list: vi.fn(), save: vi.fn() },
}))
vi.mock('@/components/VoiceInputCapture', () => ({ VoiceInputCapture: () => null }))
vi.mock('./ResourceAgendaForm', () => ({
  ResourceAgendaForm: () => <button>Agenda explícita</button>,
}))
const source: LifeDirection = {
  id: 'direction',
  enrollment_id: 'enrollment',
  kind: 'future',
  horizon: 'open',
  title: 'Expressar limites',
  narrative: '',
  meaning: '',
  resources: '',
  limits: '',
  first_step: '',
  access_class: 'participant_shared',
}
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(selfDevelopmentService.list).mockResolvedValue([])
})
function openDetails(text: string) {
  const details = screen.getByText(text).closest('details')!
  details.open = true
  fireEvent(details, new Event('toggle'))
}
async function start() {
  openDetails('Explorar uma situação desta direção')
  fireEvent.click(await screen.findByRole('button', { name: 'Olhar uma situação' }))
}
it('preserva rascunho e campos depois de falha, sem herdar compartilhamento da direção', async () => {
  vi.mocked(selfDevelopmentService.save).mockRejectedValue(new Error('Falha ao salvar'))
  render(<CareEpisodeExplorer source={source} />)
  await start()
  fireEvent.change(screen.getByLabelText(/O que aconteceu nessa situação/), {
    target: { value: 'Recebi um pedido.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Ceder ou agradar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.change(screen.getByLabelText(/Que resposta quero experimentar/), {
    target: { value: 'Pedir tempo.' },
  })
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Salvar minha situação' }))
  await screen.findByText('Falha ao salvar')
  expect(screen.getByLabelText(/Que resposta quero experimentar/)).toHaveValue('Pedir tempo.')
  expect(
    localStorage.getItem('cer-care-episode-draft-v1:owner:enrollment:direction:new'),
  ).toContain('Recebi um pedido.')
  expect(selfDevelopmentService.save).toHaveBeenCalledWith(
    expect.objectContaining({ direction_id: 'direction', access_class: 'participant_private' }),
    undefined,
  )
})
it('retoma etapa e texto após sair, sem retomar consentimento', async () => {
  const first = render(<CareEpisodeExplorer source={source} />)
  await start()
  fireEvent.change(screen.getByLabelText(/O que aconteceu nessa situação/), {
    target: { value: 'Cena importante' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Quero compreender melhor antes de escolher' }),
  )
  fireEvent.click(screen.getByRole('checkbox'))
  first.unmount()
  render(<CareEpisodeExplorer source={source} />)
  await start()
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(screen.getByLabelText(/Que resposta quero experimentar/)).toHaveValue(
    'Quero compreender esta situação com minha profissional antes de escolher uma ação.',
  )
})
it('filtra matrícula, direção e privacidade na visão profissional sem permitir ação ou edição', async () => {
  const input = careEpisodeInput(
    source,
    { ...emptyCareEpisode(), facts: 'Compartilhada', alternative: 'Uma escolha' },
    true,
  )
  vi.mocked(selfDevelopmentService.list).mockResolvedValue([
    { ...input, id: 'one' },
    { ...input, id: 'private', access_class: 'participant_private' },
    { ...input, id: 'other', direction_id: 'other' },
    { ...input, id: 'foreign', enrollment_id: 'other' },
  ])
  render(<CareEpisodeExplorer source={source} readOnly />)
  openDetails('Situações e escolhas compartilhadas')
  await screen.findByText('Uma situação, um novo caminho')
  expect(screen.getAllByText('Uma situação, um novo caminho')).toHaveLength(1)
  expect(screen.queryByRole('button', { name: 'Revisar esta situação' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Agenda explícita' })).toBeNull()
})
it('limpa somente o rascunho salvo e permite levar a escolha à agenda depois', async () => {
  vi.mocked(selfDevelopmentService.save).mockImplementation(async (v) => ({ ...v, id: 'saved' }))
  render(<CareEpisodeExplorer source={source} />)
  await start()
  fireEvent.change(screen.getByLabelText(/O que aconteceu nessa situação/), {
    target: { value: 'Cena' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Quero compreender melhor antes de escolher' }),
  )
  localStorage.setItem('cer-care-episode-draft-v1:owner:enrollment:other:new', 'Outro rascunho')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar minha situação' }))
  await screen.findByRole('button', { name: 'Agenda explícita' })
  await waitFor(() =>
    expect(
      localStorage.getItem('cer-care-episode-draft-v1:owner:enrollment:direction:new'),
    ).toBeNull(),
  )
  expect(localStorage.getItem('cer-care-episode-draft-v1:owner:enrollment:other:new')).toBe(
    'Outro rascunho',
  )
})
