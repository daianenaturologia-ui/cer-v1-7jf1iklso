// @vitest-environment jsdom

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ExperienceEngine } from './ExperienceEngine'
import { enrollmentExperienceService, experienceResponseService } from '@/services/experienceEngine'
import { demoAdapter } from '@/services/demoAdapter'

describe('Correção de Mente & Emoções', () => {
  beforeEach(() => {
    localStorage.clear()
    demoAdapter.disableDemo()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('abre correção confirmada, preserva a resposta atual e retorna o progresso a em andamento', async () => {
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'enr-exp-completed',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      progress_status: 'completed',
      release_status: 'completed',
      current_step_order: 14,
    } as any)
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([
      {
        id: 'response-p1',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        respondent_user_id: 'user-demo',
        response_type: 'FreeReflection',
        access_class: 'shared_care',
        structured_value: {
          value: 'Isso varia muito ao longo do dia.',
          prompt_key: 'mundo_emocional_geral',
        },
        free_text: 'Isso varia muito ao longo do dia.',
        prompt_version: 1,
        version: 2,
        status: 'revised',
        created: '2026-09-28T12:00:00.000Z',
        updated: '2026-09-28T13:00:00.000Z',
      } as any,
    ])
    const updateProgressSpy = vi
      .spyOn(enrollmentExperienceService, 'updateProgress')
      .mockResolvedValue({
        id: 'enr-exp-completed',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-mente-emocoes-07c',
        progress_status: 'in_progress',
        release_status: 'in_progress',
        current_step_order: 1,
      } as any)

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Momento Concluído')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /Corrigir minhas respostas/i }))
    expect(
      screen.getByRole('alertdialog', { name: /Corrigir respostas de Mente & Emoções/i }),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByTestId('banner-correcao-mente-emocoes')).toBeTruthy()
    })
    expect(updateProgressSpy).toHaveBeenCalledWith('enr-exp-completed', {
      progressStatus: 'in_progress',
      stepOrder: 1,
      enrollmentId: 'enr-demo',
    })
    expect(screen.getByDisplayValue('Isso varia muito ao longo do dia.')).toBeTruthy()
  })
})
