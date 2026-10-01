// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { InteragenteHome } from './InteragenteHome'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import { CER_READING_DIMENSIONS } from '@/services/cerMapReadings'
import { cerJournalService } from '@/services/cerJournalService'
import { featureFlagService } from '@/services/experienceEngine'
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: DEMO_USER_MARIANA,
    person: DEMO_PERSON_MARIANA,
    persona: 'mariana',
    setPersona: vi.fn(),
    logout: vi.fn(),
  }),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  demoAdapter.disableDemo()
  localStorage.clear()
})
it('mostra seis dimensões concluídas no Mapa com o engine desativado', async () => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  vi.spyOn(featureFlagService, 'isEnabled').mockResolvedValue(false)
  vi.spyOn(cerJournalService, 'listParticipantMessages').mockResolvedValue([
    { status: 'approved', created: '2026-10-01', message_text: 'Relato teste' },
  ] as any)
  for (const dimension of CER_READING_DIMENSIONS)
    demoAdapter.updateEnrollmentExperienceProgress(DEMO_ENROLLMENT_ID, dimension.experienceId, {
      completed: true,
    })
  render(
    <MemoryRouter>
      <InteragenteHome />
    </MemoryRouter>,
  )
  fireEvent.click(await screen.findByRole('button', { name: /2\. Consciência/ }))
  fireEvent.click(await screen.findByTestId('ser-integral-map-center'))
  expect(await screen.findByText('Cobertura das dimensões (6 de 6)')).toBeInTheDocument()
})
