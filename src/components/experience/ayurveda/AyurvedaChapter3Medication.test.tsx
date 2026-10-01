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

  it('salva a mudança de início do uso antes de sair do seletor e preserva ao reabrir', async () => {
    const user = userEvent.setup()
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      onBackToHub: () => {},
      initialStep: 5,
    }
    const view = render(<AyurvedaChapter3Flow {...props} />)
    await screen.findByText('Medicamentos e suplementos')
    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Item informado',
    )
    const select = screen.getByLabelText('Como está esse uso?')
    await user.selectOptions(select, 'started_recently')
    const save = vi.mocked(experienceResponseService.saveResponse)
    await waitFor(() =>
      expect(
        save.mock.calls.some(
          ([input]) =>
            input.promptId === 'ayv_c3_medication_details' &&
            (input.structuredValue as any).value[0]?.timing === 'started_recently',
        ),
      ).toBe(true),
    )
    const saved = await Promise.all(save.mock.results.map((result) => result.value))
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue(saved)
    view.unmount()
    render(<AyurvedaChapter3Flow {...props} />)
    await waitFor(() =>
      expect(screen.getByLabelText('Como está esse uso?')).toHaveValue('started_recently'),
    )
    expect(screen.getByPlaceholderText('Nome do medicamento ou suplemento')).toHaveValue(
      'Item informado',
    )
  })

  it('preserva a versão concluída enquanto a correção está em rascunho e publica só ao concluir', async () => {
    const completedResponses = [
      {
        id: 'domains-v1',
        prompt_id: 'ayv_c3_changed_domains',
        structured_value: {
          value: ['no_current_changes'],
          metadata: { prompt_key: 'ayv_c3_changed_domains' },
        },
      },
      {
        id: 'med-status-v1',
        prompt_id: 'ayv_c3_medication_status',
        structured_value: {
          value: 'no_use',
          metadata: { prompt_key: 'ayv_c3_medication_status' },
        },
      },
      {
        id: 'completion-v1',
        prompt_id: 'ayv_c3_chapter_completion',
        structured_value: {
          completed: true,
          metadata: { prompt_key: 'ayv_c3_chapter_completion' },
        },
      },
    ] as any
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue(
      completedResponses,
    )
    const saveSpy = vi.mocked(experienceResponseService.saveResponse)
    const user = userEvent.setup()

    render(
      <AyurvedaChapter3Flow
        enrollmentId="enrollment-demo"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="participant-demo"
        onBackToHub={() => {}}
      />,
    )

    await screen.findByText('Capítulo 3 concluído')
    await user.click(screen.getByRole('button', { name: 'Corrigir minhas respostas' }))
    expect(screen.getByRole('dialog', { name: 'Corrigir respostas do Capítulo 3?' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Começar correção' }))

    expect(screen.getByText(/versão anterior preservada/i)).toBeTruthy()
    expect(saveSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(screen.getByRole('button', { name: 'Uso atualmente' }))
    await user.type(
      screen.getByPlaceholderText('Nome do medicamento ou suplemento'),
      'Medicamento fictício',
    )
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'Revisar' }))

    expect(saveSpy).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Concluir correção' }))

    await waitFor(() =>
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_medication_details',
          changeReason: expect.stringContaining('Correção concluída'),
        }),
      ),
    )
  })
  it('contextualiza pele e cabelo, conserva a escolha salva e a recupera ao reabrir', async () => {
    const user = userEvent.setup()
    const domain = {
      id: 'domain-response',
      prompt_id: 'ayv_c3_changed_domains',
      structured_value: { value: ['skin_hair'] },
    } as any
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue([domain])
    const props = {
      enrollmentId: 'enrollment-demo',
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: 'participant-demo',
      initialStep: 2,
      onBackToHub: () => {},
    }
    const view = render(<AyurvedaChapter3Flow {...props} />)
    const choice = await screen.findByRole('button', {
      name: 'Uma característica da pele ou do cabelo diminuiu',
    })
    expect(
      screen.getByText(/ressecamento, oleosidade, sensibilidade, textura ou queda de cabelo/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Diminuiu ou ficou mais fraco' })).toBeNull()
    await user.click(choice)
    await waitFor(() =>
      expect(experienceResponseService.saveResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          promptId: 'ayv_c3_change_directions',
          structuredValue: expect.objectContaining({ value: { skin_hair: 'decreased' } }),
        }),
      ),
    )
    const results = await Promise.all(
      vi.mocked(experienceResponseService.saveResponse).mock.results.map((r) => r.value),
    )
    view.unmount()
    vi.mocked(experienceResponseService.listResponsesByExperience).mockResolvedValue([
      domain,
      ...results,
    ])
    render(<AyurvedaChapter3Flow {...props} />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Uma característica da pele ou do cabelo diminuiu',
        }),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
  })
})
