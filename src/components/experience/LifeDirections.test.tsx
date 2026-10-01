import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LifeDirections } from './LifeDirections'
import { lifeDirectionsService } from '@/services/lifeDirections'
vi.mock('@/services/lifeDirections', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/lifeDirections')>()),
  lifeDirectionsService: { list: vi.fn(), save: vi.fn() },
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
