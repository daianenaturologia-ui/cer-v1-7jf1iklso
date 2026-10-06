import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, act } from '@testing-library/react'
import { SharedProfessionalCerMap } from './SharedProfessionalCerMap'
import { cerMapService } from '@/services/cerMapService'
import { buildCerMapReadings } from '@/services/cerMapReadings'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
const map = (id: string, text: string) => {
  const snapshot = buildCerMapReadings([], id, 'Teste')
  snapshot.dimensions[0].summary = text
  return {
    id: 'map-' + id,
    enrollment_id: id,
    status: 'published',
    items: [],
    reading_snapshot: snapshot,
  } as any
}
describe('Documento comum às duas áreas', () => {
  it('mostra a publicação compartilhada em duas versões sem usar respostas novas como interpretação', async () => {
    vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(
      map('a', 'Leitura compartilhada'),
    )
    render(<SharedProfessionalCerMap enrollmentId="a" participantName="Teste" responses={[]} />)
    expect(await screen.findByText('Leitura compartilhada')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Versão resumida' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Versão detalhada' })).toBeInTheDocument()
  })
  it('ignora retorno atrasado de outra pessoa', async () => {
    let resolveA!: (value: any) => void
    const requestA = new Promise<any>((resolve) => {
      resolveA = resolve
    })
    vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockImplementation((id) =>
      id === 'a' ? requestA : Promise.resolve(map('b', 'Leitura de B')),
    )
    const { rerender } = render(
      <SharedProfessionalCerMap enrollmentId="a" participantName="A" responses={[]} />,
    )
    rerender(<SharedProfessionalCerMap enrollmentId="b" participantName="B" responses={[]} />)
    await screen.findByText('Leitura de B')
    await act(async () => {
      resolveA(map('a', 'Leitura de A'))
      await requestA
    })
    await waitFor(() => expect(screen.queryByText('Leitura de A')).not.toBeInTheDocument())
  })
})
