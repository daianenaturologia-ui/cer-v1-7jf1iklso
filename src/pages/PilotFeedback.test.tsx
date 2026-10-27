import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const { read, submit, report } = vi.hoisted(() => ({ read: vi.fn(), submit: vi.fn(), report: vi.fn() }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isInteragente: true, isDemo: false }) }))
vi.mock('@/services/pilotQuality', () => ({ readQuality: read, submitFeedback: submit, reportIncident: report }))
import PilotFeedback from './PilotFeedback'
beforeEach(() => {
  vi.clearAllMocks()
  read.mockImplementation(async (action) => action === 'context' ? [{ id: 'syntheticenroll1', professional: 'Profissional fictícia', product: 'Piloto' }] : [])
})
it('retains an uncertain feedback and retries the same idempotency key; success requires server', async () => {
  submit.mockRejectedValueOnce({ status: 0 }).mockResolvedValueOnce({ id: 'feedback1', category: 'app', message: 'Relato fictício', status: 'new', created: '2026-10-27' })
  render(<MemoryRouter><PilotFeedback /></MemoryRouter>)
  await screen.findByRole('button', { name: 'Enviar meu relato' })
  fireEvent.change(screen.getByLabelText('Seu relato'), { target: { value: 'Relato fictício' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar meu relato' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Seu relato')).toHaveValue('Relato fictício')
  expect(screen.queryByText(/Seu relato foi recebido/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar meu relato' }))
  await screen.findByText(/Seu relato foi recebido/)
  expect(submit.mock.calls[0][0].request_id).toEqual(submit.mock.calls[1][0].request_id)
  expect(screen.getByLabelText('Seu relato')).toHaveValue('')
  expect(screen.getByText('Relato fictício')).toBeInTheDocument()
})
it('shows failed loading with explicit retry and never claims an empty inbox is confirmed', async () => {
  read.mockRejectedValueOnce({ status: 500 })
  render(<MemoryRouter><PilotFeedback /></MemoryRouter>)
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar relatos' }))
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Enviar meu relato' })).toBeInTheDocument()
})
