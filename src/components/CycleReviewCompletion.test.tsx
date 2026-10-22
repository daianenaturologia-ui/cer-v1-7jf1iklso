import React from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CycleReviewView } from './CycleReviewView'
vi.mock('@/services/cerCycleReviewService', () => ({
  cerCycleReviewService: {
    getByCycleId: vi.fn(async () => ({
      id: 'review',
      status: 'completed',
      decision: 'adapt',
      professional_summary: 'Síntese preservada',
    })),
    generateDescriptiveDigest: () => ({
      total_responses: 0,
      safety_flags_count: { needs_review: 0 },
      summary_text: 'Sem relatos de experimentos.',
    }),
  },
}))
vi.mock('@/services/cerPracticeResponseService', () => ({
  cerPracticeResponseService: { listByEnrollment: vi.fn(async () => []) },
}))
vi.mock('@/services/selfDevelopment', () => ({
  selfDevelopmentService: { list: vi.fn(async () => []) },
  visibleDevelopment: (r: any[]) => r,
}))
it('exibe uma revisão concluída como histórico e impede nova conclusão', async () => {
  render(<CycleReviewView cycleId="cycle" enrollmentId="e" userId="u" isProfessional />)
  await screen.findByDisplayValue('Síntese preservada')
  expect(screen.getByRole('button', { name: 'Concluir Revisão de Ciclo' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Salvar como Rascunho' })).toBeDisabled()
  expect(screen.getByText(/Revisão concluída. A decisão/)).toBeInTheDocument()
})
