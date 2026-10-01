import React from 'react'
import { it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
vi.mock('@/components/VoiceInputCapture', () => ({ VoiceInputCapture: () => null }))
import { lifeTimelineService } from '@/services/lifeTimeline'
import { LifeTimeline } from './LifeTimeline'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('preserva a história quando o salvamento falha e permite tentar novamente', async () => {
  vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([])
  const save = vi
    .spyOn(lifeTimelineService, 'save')
    .mockRejectedValueOnce(new Error('Falha de rede'))
    .mockImplementationOnce(async (event) => ({ ...event, id: 'new', updated: 'now' }))
  render(<LifeTimeline enrollmentId="enr" />)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Clique na linha/ }))
  await user.type(screen.getByLabelText('Nome do acontecimento'), 'Minha conquista')
  await user.type(screen.getByLabelText('Conte a história como você se lembra'), 'Recebi apoio.')
  await user.click(screen.getByLabelText('Alegria'))
  await user.click(screen.getByLabelText('Gratidão'))
  await user.click(screen.getByRole('button', { name: 'Salvar acontecimento' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede')
  expect(screen.getByLabelText('Conte a história como você se lembra')).toHaveValue('Recebi apoio.')
  expect(save.mock.calls[0][0].access_class).toBe('participant_private')
  await user.click(screen.getByRole('button', { name: 'Salvar acontecimento' }))
  expect(await screen.findByText('Acontecimento salvo.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Minha conquista' })).toBeInTheDocument()
})
it('não oferece gravação ao profissional e impede início antes da conclusão', async () => {
  vi.spyOn(lifeTimelineService, 'list').mockResolvedValue([])
  const { rerender } = render(<LifeTimeline enrollmentId="enr" readOnly />)
  await screen.findByText('Ainda não há histórias compartilhadas.')
  expect(screen.queryByRole('button', { name: /Clique na linha/ })).toBeNull()
  rerender(<LifeTimeline enrollmentId="enr" unlocked={false} />)
  expect(screen.getByText(/Conclua as seis dimensões/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Clique na linha/ })).toBeNull()
})
