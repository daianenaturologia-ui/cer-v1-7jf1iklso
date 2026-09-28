// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import userEvent from '@testing-library/user-event'
import { AyurvedaChapter3Flow } from './AyurvedaChapter3Flow'
import { experienceResponseService } from '@/services/experienceEngine'

describe('Capítulo 3 — contexto de medicamentos e suplementos', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([])
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(
      async (input) =>
        ({
          id: `response-${input.promptId}`,
          enrollment_id: input.enrollmentId,
          experience_id: input.experienceId,
          prompt_id: input.promptId,
          respondent_user_id: input.respondentUserId,
          response_type: input.responseType,
          access_class: input.accessClass || 'shared_care',
          structured_value: input.structuredValue,
          free_text: input.freeText || '',
          prompt_version: input.promptVersion,
          version: 1,
          status: 'saved',
          created: '2026-09-28T12:00:00.000Z',
          updated: '2026-09-28T12:00:00.000Z',
        }) as any,
    )
  })

  afterEach(() => cleanup())

  it('abre detalhes somente quando necessário e exige apenas o nome do item', async () => {
    const user = userEvent.setup()
    render(
      <AyurvedaChapter3Flow
        enrollmentId="enrollment-demo"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="participant-demo"
        onBackToHub={() => {}}
      />,
    )

    await screen.findByText('O que está diferente agora')
    await user.click(screen.getByRole('button', { name: 'Não percebo mudanças importantes agora' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText('Medicamentos e suplementos')).toBeTruthy()
    const reviewButton = screen.getByRole('button', { name: /Revisar/i })
    expect(reviewButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    expect(screen.getByPlaceholderText('Nome do medicamento ou suplemento')).toBeTruthy()
    expect(reviewButton).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Medicamento informado',
    )
    await user.tab()

    await waitFor(() => expect(reviewButton).toBeEnabled())
    await user.click(reviewButton)
    expect(screen.getByText(/Medicamento informado/)).toBeTruthy()
  })
})
