import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { EvolutionMapConversation } from './EvolutionMapConversation'
import { cerMapService } from '@/services/cerMapService'
import { experienceResponseService } from '@/services/experienceEngine'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'
import { LifeTimeline } from './LifeTimeline'
vi.mock('./LifeTimeline', () => ({
  LifeTimeline: vi.fn(({ enrollmentId, readOnly }: any) => (
    <div data-testid="same-timeline">
      {enrollmentId} · {readOnly ? 'shared' : 'own'}
    </div>
  )),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('mostra o resumo publicado antes da mesma linha da vida, sem cruzar narrativas', async () => {
  const snapshot = createDemoCerMapReading('enr')
  snapshot.history = 'NARRATIVA ANTIGA FORA DO RESUMO'
  const before = JSON.stringify(snapshot)
  vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue({
    enrollment_id: 'enr',
    status: 'published',
    reading_snapshot: snapshot,
    items: [],
  } as any)
  render(<EvolutionMapConversation enrollmentId="enr" participantName="Mariana" responses={[]} />)
  expect(await screen.findByText('Meu Mapa CER em poucas palavras')).toBeVisible()
  expect(screen.getByText('Vata–Pitta')).toBeVisible()
  expect(screen.queryByText('NARRATIVA ANTIGA FORA DO RESUMO')).toBeNull()
  expect(
    screen
      .getByText('Meu Mapa CER em poucas palavras')
      .compareDocumentPosition(screen.getByTestId('same-timeline')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(JSON.stringify(snapshot)).toBe(before)
  expect(vi.mocked(LifeTimeline).mock.calls.at(-1)?.[0]).toMatchObject({
    enrollmentId: 'enr',
    readOnly: false,
  })
})
it('profissional usa somente as dimensões lidas no acompanhamento e a linha compartilhada', async () => {
  vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
  const read = vi
    .spyOn(experienceResponseService, 'listResponsesByExperience')
    .mockResolvedValue([])
  render(<EvolutionMapConversation enrollmentId="enr" participantName="Pessoa" readOnly />)
  await screen.findByText('Meu Mapa CER em poucas palavras')
  expect(read).toHaveBeenCalledTimes(6)
  expect(vi.mocked(LifeTimeline).mock.calls.at(-1)?.[0]).toMatchObject({
    enrollmentId: 'enr',
    readOnly: true,
  })
  expect(screen.getAllByText('Ainda sem leitura disponível.')).toHaveLength(3)
})
it('não apresenta publicação de outra pessoa', async () => {
  vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue({
    enrollment_id: 'other',
    status: 'published',
    reading_snapshot: createDemoCerMapReading('other'),
  } as any)
  render(<EvolutionMapConversation enrollmentId="enr" responses={[]} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o resumo')
  expect(screen.queryByText('Meu Mapa CER em poucas palavras')).toBeNull()
})
it('descarta retorno atrasado quando muda a pessoa', async () => {
  let resolve!: (value: any) => void
  vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockImplementation((id) =>
    id === 'first'
      ? new Promise((r) => {
          resolve = r
        })
      : Promise.resolve(null),
  )
  const responses: any[] = []
  const view = render(<EvolutionMapConversation enrollmentId="first" responses={responses} />)
  view.rerender(<EvolutionMapConversation enrollmentId="second" responses={responses} />)
  await screen.findByText('Meu Mapa CER em poucas palavras')
  resolve({
    enrollment_id: 'first',
    status: 'published',
    reading_snapshot: createDemoCerMapReading('first'),
  })
  await waitFor(() => expect(screen.getByTestId('same-timeline')).toHaveTextContent('second'))
  expect(screen.queryByText('Vata–Pitta')).toBeNull()
})
