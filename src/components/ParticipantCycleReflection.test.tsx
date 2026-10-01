import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CycleReviewView } from './CycleReviewView'
const mocks = vi.hoisted(() => ({ list: vi.fn(), clinical: vi.fn() }))
vi.mock('@/services/cerCycleInvitationService', () => ({
  cerCycleInvitationService: { list: mocks.list },
}))
vi.mock('@/services/cerCycleReviewService', () => ({
  cerCycleReviewService: { getByCycleId: mocks.clinical },
}))
describe('Revisão da interagente', () => {
  it('mostra apenas convite e percepção, sem consultar a revisão interna', async () => {
    mocks.list.mockResolvedValue([
      {
        id: 'i',
        care_cycle_id: 'c',
        shared_prompt: 'Como foi?',
        participant_reflection: '',
        completed_at: '',
      },
    ])
    render(<CycleReviewView cycleId="c" enrollmentId="e" userId="u" isProfessional={false} />)
    expect(await screen.findByText('Como foi?')).toBeInTheDocument()
    expect(screen.queryByText('Decisão Explícita sobre o Ciclo')).not.toBeInTheDocument()
    expect(screen.queryByText(/Síntese Profissional/)).not.toBeInTheDocument()
    expect(mocks.clinical).not.toHaveBeenCalled()
  })
  it('não oferece formulário para um ciclo sem convite', async () => {
    mocks.list.mockResolvedValue([])
    render(<CycleReviewView cycleId="sem-convite" enrollmentId="e" userId="u" />)
    expect(
      await screen.findByText('Não há convite de revisão para este ciclo.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
