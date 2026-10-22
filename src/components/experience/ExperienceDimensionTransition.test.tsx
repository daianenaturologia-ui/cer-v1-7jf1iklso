import React from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ExperienceEngine } from './ExperienceEngine'
import { demoAdapter } from '@/services/demoAdapter'
import { enrollmentExperienceService, experienceResponseService } from '@/services/experienceEngine'
beforeEach(() => {
  localStorage.clear()
  demoAdapter.disableDemo()
  vi.restoreAllMocks()
})
it('não leva conclusão e modo de revisão da dimensão anterior para uma dimensão vazia', async () => {
  vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockImplementation(
    async (_enrollment, id) =>
      ({
        id: 'progress-' + id,
        enrollment_id: 'e',
        experience_id: id,
        progress_status: id === 'exp-mente-emocoes-07c' ? 'completed' : 'not_started',
        current_step_order: 1,
      }) as any,
  )
  vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([])
  const props = { enrollmentId: 'e', respondentUserId: 'u' }
  const view = render(<ExperienceEngine {...props} experienceId="exp-mente-emocoes-07c" />)
  await screen.findByText('Momento Concluído')
  view.rerender(<ExperienceEngine {...props} experienceId="exp-regulacao-respostas-07c" />)
  await waitFor(() => expect(screen.queryByText('Momento Concluído')).not.toBeInTheDocument())
  await screen.findByRole('button', { name: /Iniciar|Começar|Continuar/i })
  expect(screen.queryByRole('button', { name: /Rever Minhas Respostas/i })).not.toBeInTheDocument()
})
