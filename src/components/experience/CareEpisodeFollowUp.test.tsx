import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CareEpisodeFollowUp } from './CareEpisodeFollowUp'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import { careEpisodeInput, emptyCareEpisode } from '@/services/careEpisode'
import { emptyEpisodeReview, episodeReviewInput } from '@/services/careEpisodeReview'
import type { LifeDirection } from '@/services/lifeDirections'
vi.mock('@/lib/pocketbase/client', () => ({ default: { authStore: { record: { id: 'owner' } } } }))
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
vi.mock('@/services/selfDevelopment', () => ({ selfDevelopmentService: { save: vi.fn() } }))
vi.mock('@/components/VoiceInputCapture', () => ({ VoiceInputCapture: () => null }))
vi.mock('./ResourceAgendaForm', () => ({
  ResourceAgendaForm: ({ strategy }: { strategy: string }) => <button>Agendar: {strategy}</button>,
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
const parent: DevelopmentExperiment = {
  ...careEpisodeInput(
    source,
    { ...emptyCareEpisode(), facts: 'Recebi um pedido', alternative: 'Pedir tempo' },
    true,
  ),
  id: 'episode',
}
const value = {
  ...emptyEpisodeReview(parent.id),
  outcome: 'partial' as const,
  observation: 'Consegui pausar',
  adjustment: 'Pedir dez minutos',
  support: 'Organização',
}
const review: DevelopmentExperiment = {
  ...episodeReviewInput(source, parent, value, true),
  id: 'review',
  created: '2026-10-09T10:00:00Z',
}
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(selfDevelopmentService.save).mockImplementation(async (v) => ({ ...v, id: 'saved' }))
})
function fill() {
  fireEvent.click(screen.getByRole('button', { name: 'Contar como foi' }))
  fireEvent.change(screen.getByLabelText(/O que percebi na prática/), {
    target: { value: 'A pausa ajudou' },
  })
  fireEvent.change(screen.getByLabelText(/Como quero seguir agora/), {
    target: { value: 'Reduzir o passo' },
  })
}
it('retoma um rascunho privado após sair e mantém conteúdo quando salvar falha', async () => {
  vi.mocked(selfDevelopmentService.save).mockRejectedValue(new Error('Falha ao salvar'))
  const first = render(
    <CareEpisodeFollowUp source={source} parent={parent} records={[]} onSaved={vi.fn()} />,
  )
  fill()
  fireEvent.click(screen.getByRole('checkbox'))
  first.unmount()
  render(<CareEpisodeFollowUp source={source} parent={parent} records={[]} onSaved={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Contar como foi' }))
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  expect(screen.getByLabelText(/O que percebi na prática/)).toHaveValue('A pausa ajudou')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar meu retorno' }))
  await screen.findByText('Falha ao salvar')
  expect(screen.getByLabelText(/Como quero seguir agora/)).toHaveValue('Reduzir o passo')
  expect(
    localStorage.getItem('cer-episode-review-draft-v1:owner:enrollment:direction:episode'),
  ).toContain('A pausa ajudou')
})
it('salva novo retorno sem alterar a situação ou criar agenda e limpa somente seu rascunho', async () => {
  const onSaved = vi.fn()
  render(<CareEpisodeFollowUp source={source} parent={parent} records={[]} onSaved={onSaved} />)
  fill()
  localStorage.setItem('cer-episode-review-draft-v1:owner:enrollment:direction:other', 'Outro')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar meu retorno' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  expect(selfDevelopmentService.save).toHaveBeenCalledWith(
    expect.objectContaining({
      access_class: 'participant_private',
      action: 'Pedir tempo',
      next_step: 'Reduzir o passo',
      scheduled_at: '',
    }),
  )
  expect(
    localStorage.getItem('cer-episode-review-draft-v1:owner:enrollment:direction:episode'),
  ).toBeNull()
  expect(localStorage.getItem('cer-episode-review-draft-v1:owner:enrollment:direction:other')).toBe(
    'Outro',
  )
})
it('mostra somente retornos compartilhados da situação certa, sem edição ou agenda profissional', () => {
  render(
    <CareEpisodeFollowUp
      source={source}
      parent={parent}
      records={[
        review,
        { ...review, id: 'private', access_class: 'participant_private' },
        { ...review, id: 'foreign', enrollment_id: 'other' },
        { ...review, id: 'other-direction', direction_id: 'other' },
        {
          ...review,
          id: 'other-episode',
          reflection: JSON.stringify({ ...value, episodeId: 'other' }),
        },
      ]}
      readOnly
      onSaved={vi.fn()}
    />,
  )
  expect(screen.getAllByText('Consegui pausar', { exact: false })).toHaveLength(1)
  expect(screen.queryByRole('button')).toBeNull()
})
it('acompanha o último ajuste e preserva retornos anteriores, mesmo que a situação seja editada', () => {
  const newer = {
    ...review,
    id: 'newer',
    action: 'Pedir dez minutos',
    next_step: 'Usar uma frase curta',
    reflection: JSON.stringify({ ...value, adjustment: 'Usar uma frase curta' }),
    created: '2026-10-10T10:00:00Z',
  }
  render(
    <CareEpisodeFollowUp
      source={source}
      parent={{ ...parent, action: 'Escolha editada' }}
      records={[review, newer]}
      onSaved={vi.fn()}
    />,
  )
  expect(screen.getByText('Retornos anteriores (1)')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Contar como foi' }))
  expect(screen.getByText('Usar uma frase curta')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Manter minha escolha' }))
  expect(screen.getByLabelText(/Como quero seguir agora/)).toHaveValue('Usar uma frase curta')
})
it('permite compartilhar um retorno já salvo, sem mudar seus textos', async () => {
  const onSaved = vi.fn()
  render(
    <CareEpisodeFollowUp
      source={source}
      parent={parent}
      records={[{ ...review, access_class: 'participant_private' }]}
      onSaved={onSaved}
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Compartilhar este retorno com minha profissional' }),
  )
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  expect(selfDevelopmentService.save).toHaveBeenCalledWith(
    { ...review, access_class: 'participant_shared' },
    'review',
  )
})
it('pausar não oferece um agendamento e não força uma retomada', () => {
  render(
    <CareEpisodeFollowUp
      source={source}
      parent={parent}
      records={[{ ...review, reflection: JSON.stringify({ ...value, outcome: 'paused' }) }]}
      onSaved={vi.fn()}
    />,
  )
  expect(screen.queryByRole('button', { name: /Agendar/ })).toBeNull()
})
