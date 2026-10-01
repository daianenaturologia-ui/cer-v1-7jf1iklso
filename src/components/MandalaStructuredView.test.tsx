// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MandalaStructuredView } from './MandalaStructuredView'
import { cerMandalaReadModelService } from '@/services/cerMandalaService'
vi.mock('@/services/cerMandalaService', () => ({
  cerMandalaReadModelService: { getMandalaProjection: vi.fn() },
}))
const projection = (id: string, statement: string) => ({
  enrollment_id: id,
  direction: { mode: 'reused' as const, statement },
  active_priorities: [],
  active_experiments: [],
  recognized_resources: [],
  current_capacity: { summary: 'Sem registro de capacidade' },
  recent_movement: {
    total_recorded_responses: 0,
    descriptive_digest: 'Sem retornos',
    recent_responses: [],
  },
  evolution_highlights: [],
})
beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)
describe('Mandala: pessoa, papel e falha de carregamento', () => {
  it('uma resposta atrasada da pessoa anterior não substitui a pessoa atual', async () => {
    let resolveOld!: (value: ReturnType<typeof projection>) => void
    vi.mocked(cerMandalaReadModelService.getMandalaProjection)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValueOnce(projection('b', 'Direção da nova pessoa'))
    const view = render(<MandalaStructuredView enrollmentId="a" audience="professional" />)
    view.rerender(<MandalaStructuredView enrollmentId="b" audience="professional" />)
    await screen.findByText('Direção da nova pessoa')
    resolveOld(projection('a', 'Conteúdo da pessoa anterior'))
    await waitFor(() => expect(screen.queryByText('Conteúdo da pessoa anterior')).toBeNull())
    expect(screen.getByText('Direção da nova pessoa')).toBeTruthy()
  })
  it('trocar o papel recarrega a projeção correta e remove conteúdo profissional', async () => {
    vi.mocked(cerMandalaReadModelService.getMandalaProjection)
      .mockResolvedValueOnce(projection('a', 'Direção profissional'))
      .mockResolvedValueOnce(projection('a', 'Texto compartilhado'))
    const view = render(<MandalaStructuredView enrollmentId="a" audience="professional" />)
    await screen.findByText('Direção profissional')
    view.rerender(<MandalaStructuredView enrollmentId="a" audience="participant" />)
    expect(screen.queryByText('Direção profissional')).toBeNull()
    await screen.findByText('Texto compartilhado')
    expect(cerMandalaReadModelService.getMandalaProjection).toHaveBeenLastCalledWith(
      'a',
      'participant',
    )
  })
  it('mostra a falha e permite tentar novamente sem mascará-la como vazio', async () => {
    vi.mocked(cerMandalaReadModelService.getMandalaProjection)
      .mockRejectedValueOnce(new Error('Falha de leitura'))
      .mockResolvedValueOnce(projection('a', 'Direção recuperada'))
    render(<MandalaStructuredView enrollmentId="a" />)
    await screen.findByText('Não foi possível carregar a Mandala agora.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await screen.findByText('Direção recuperada')
  })
})
