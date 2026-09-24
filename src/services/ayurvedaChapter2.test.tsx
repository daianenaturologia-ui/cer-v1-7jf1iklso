import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import {
  deriveChapter2Status,
  buildChapter2LiteralSummary,
  AYV_C2_PROMPTS,
  AYV_C2_QUESTION_PROMPT_KEYS,
  AYV_C2_TOTAL_MOMENTS,
  AYV_C2_TOTAL_QUESTIONS,
  AYV_C2_TEXTS,
  AYV_C2_P1_HUNGER_OPTIONS,
  getAyvC2P2Options,
  getAyvC2P3Options,
  AYV_C2_P4_HUNGER_RETURN_OPTIONS,
  AYV_C2_P5_FOOD_DEMANDS_OPTIONS,
  AYV_C2_P6_BOWEL_RHYTHM_OPTIONS,
  AYV_C2_P7_STOOL_OPTIONS,
  AYV_C2_P8_SLEEP_OPTIONS,
  AYV_C2_P9_WAKING_OPTIONS,
  AYV_C2_P10_ENERGY_OPTIONS,
  AYV_C2_P11_BODY_PACE_OPTIONS,
  AYV_C2_P12_CONFIDENCE_OPTIONS,
} from './ayurvedaChapter2'
import { AyurvedaChaptersHub } from '@/components/experience/ayurveda/AyurvedaChaptersHub'
import { AyurvedaChapter2Flow } from '@/components/experience/ayurveda/AyurvedaChapter2Flow'
import { AyurvedaChapter2Closing } from '@/components/experience/ayurveda/AyurvedaChapter2Closing'
import { AyurvedaC2Momento1Hunger } from '@/components/experience/ayurveda/AyurvedaC2Momento1Hunger'
import { AyurvedaC2Momento2Digestion } from '@/components/experience/ayurveda/AyurvedaC2Momento2Digestion'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'

describe('Ayurveda Capítulo 2A — O Ritmo do Meu Corpo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1 & 2. Bloqueio e Liberação no Hub baseados na conclusão do Capítulo 1
  // -------------------------------------------------------------------------
  describe('Hub de Capítulos: Bloqueio e Liberação do Capítulo 2', () => {
    it('mantém o Capítulo 2 bloqueado antes da conclusão canônica do Capítulo 1', () => {
      render(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          chapter1Status="in_progress"
          isChapter1Completed={false}
        />,
      )

      expect(
        screen.getByText('Conclua o Capítulo 1 para liberar este capítulo.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Bloqueado (aguarda Capítulo 1)')).toBeInTheDocument()
      expect(screen.queryByText('Começar Capítulo 2')).not.toBeInTheDocument()
    })

    it('libera o Capítulo 2 assim que o Capítulo 1 estiver canonicamente concluído', () => {
      render(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          onStartChapter2={vi.fn()}
          chapter1Status="completed"
          isChapter1Completed={true}
          chapter2Status="not_started"
        />,
      )

      expect(screen.getByText('O ritmo do meu corpo')).toBeInTheDocument()
      expect(screen.getByText('Fome, digestão, eliminação, sono e energia')).toBeInTheDocument()
      expect(screen.getByText('Começar Capítulo 2')).toBeInTheDocument()
    })

    it('exibe os quatro estados do hub para o Capítulo 2 conforme status canônico', () => {
      // 1. Not started
      const { rerender } = render(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          chapter1Status="completed"
          chapter2Status="not_started"
        />,
      )
      expect(screen.getByText('Começar Capítulo 2')).toBeInTheDocument()

      // 2. In progress
      rerender(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          chapter1Status="completed"
          chapter2Status="in_progress"
          chapter2Progress={40}
          answeredMomentsCountC2={2}
        />,
      )
      expect(screen.getByText('Retomar Capítulo 2')).toBeInTheDocument()
      expect(screen.getByText(/2 de 5 momentos respondidos/)).toBeInTheDocument()

      // 3. Ready to complete
      rerender(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          chapter1Status="completed"
          chapter2Status="ready_to_complete"
        />,
      )
      expect(screen.getByText('Revisar e concluir')).toBeInTheDocument()

      // 4. Completed
      rerender(
        <AyurvedaChaptersHub
          onStartChapter1={vi.fn()}
          chapter1Status="completed"
          chapter2Status="completed"
        />,
      )
      expect(screen.getByText('Rever Capítulo 2')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // 3 & 4. Limite de escolhas, zero pré-seleção e exclusividades
  // -------------------------------------------------------------------------
  describe('Interações e Regras de Escolha nos Momentos', () => {
    it('garante zero respostas pré-selecionadas por padrão', () => {
      render(<AyurvedaC2Momento1Hunger onSaveHungerPattern={vi.fn()} onSaveDelayedMeal={vi.fn()} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('aplica limite de até 2 escolhas no Momento 1 (P1)', () => {
      const onSaveP1 = vi.fn()
      render(
        <AyurvedaC2Momento1Hunger onSaveHungerPattern={onSaveP1} onSaveDelayedMeal={vi.fn()} />,
      )

      const opt1 = screen.getByText(AYV_C2_P1_HUNGER_OPTIONS[0].label)
      const opt2 = screen.getByText(AYV_C2_P1_HUNGER_OPTIONS[1].label)
      const opt3 = screen.getByText(AYV_C2_P1_HUNGER_OPTIONS[2].label)

      fireEvent.click(opt1)
      expect(onSaveP1).toHaveBeenLastCalledWith([AYV_C2_P1_HUNGER_OPTIONS[0].id])

      fireEvent.click(opt2)
      expect(onSaveP1).toHaveBeenLastCalledWith([
        AYV_C2_P1_HUNGER_OPTIONS[0].id,
        AYV_C2_P1_HUNGER_OPTIONS[1].id,
      ])

      // Ao clicar na 3ª, desloca para manter no máximo 2 escolhas
      fireEvent.click(opt3)
      expect(onSaveP1).toHaveBeenLastCalledWith([
        AYV_C2_P1_HUNGER_OPTIONS[1].id,
        AYV_C2_P1_HUNGER_OPTIONS[2].id,
      ])
    })

    it('assegura exclusividade mútua de "Não sei identificar" e "Prefiro não responder"', () => {
      const onSaveP1 = vi.fn()
      render(
        <AyurvedaC2Momento1Hunger onSaveHungerPattern={onSaveP1} onSaveDelayedMeal={vi.fn()} />,
      )

      const optRegular = screen.getByText(AYV_C2_P1_HUNGER_OPTIONS[0].label)
      const optUnsure = screen.getByText('Não sei identificar.')
      const optRefusal = screen.getByText('Prefiro não responder.')

      // Seleciona uma opção comum
      fireEvent.click(optRegular)
      expect(onSaveP1).toHaveBeenLastCalledWith([AYV_C2_P1_HUNGER_OPTIONS[0].id])

      // Clicar em "Não sei identificar" limpa a comum e mantém só ela
      fireEvent.click(optUnsure)
      expect(onSaveP1).toHaveBeenLastCalledWith(['dont_know'])

      // Clicar em comum limpa "Não sei identificar"
      fireEvent.click(optRegular)
      expect(onSaveP1).toHaveBeenLastCalledWith([AYV_C2_P1_HUNGER_OPTIONS[0].id])

      // Clicar em recusa
      fireEvent.click(optRefusal)
      expect(onSaveP1).toHaveBeenLastCalledWith(['refusal'])
    })

    it('aplica exclusividade para as opções especiais de alimentos exigentes (P5)', () => {
      const onSaveFood = vi.fn()
      render(
        <AyurvedaC2Momento2Digestion
          onSavePostMeal={vi.fn()}
          onSaveHungerReturn={vi.fn()}
          onSaveFoodDemands={onSaveFood}
        />,
      )

      const optFatty = screen.getByText(AYV_C2_P5_FOOD_DEMANDS_OPTIONS[0].label)
      const optVariety = screen.getByText(
        'Consigo digerir uma grande variedade sem desconforto frequente.',
      )

      fireEvent.click(optFatty)
      expect(onSaveFood).toHaveBeenLastCalledWith([AYV_C2_P5_FOOD_DEMANDS_OPTIONS[0].id])

      // Clicar em digere variedade desmarca alimentos específicos
      fireEvent.click(optVariety)
      expect(onSaveFood).toHaveBeenLastCalledWith(['digests_variety'])
    })
  })

  // -------------------------------------------------------------------------
  // 5, 6 & 7. Derivação canônica, 12 perguntas, persistência e retomada
  // -------------------------------------------------------------------------
  describe('Derivação canônica de status e persistência', () => {
    it('deriva 5 momentos e 12 perguntas canônicas no modelo', () => {
      expect(AYV_C2_TOTAL_MOMENTS).toBe(5)
      expect(AYV_C2_TOTAL_QUESTIONS).toBe(12)
      expect(AYV_C2_QUESTION_PROMPT_KEYS.length).toBe(12)
    })

    it('deriva status "not_started" quando não há respostas', () => {
      const result = deriveChapter2Status([])
      expect(result.status).toBe('not_started')
      expect(result.progress).toBe(0)
      expect(result.hasCompletionRecord).toBe(false)
      expect(result.firstUnansweredMoment).toBe(1)
    })

    it('deriva status "in_progress" e retoma no primeiro momento pendente', () => {
      const partialResponses = [
        {
          prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
          prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
          structured_value: { value: ['regular_hours'], selectedOptionIds: ['regular_hours'] },
        },
        {
          prompt_id: AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
          prompt_key: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
          structured_value: { value: ['irritation'], selectedOptionIds: ['irritation'] },
        },
      ]

      const result = deriveChapter2Status(partialResponses)
      expect(result.status).toBe('in_progress')
      expect(result.answeredMomentsCount).toBe(1) // Momento 1 completo
      expect(result.firstUnansweredMoment).toBe(2) // Retoma no Momento 2
    })

    it('deriva status "ready_to_complete" quando as 12 perguntas estão respondidas mas sem conclusão explícita', () => {
      const allResponses = AYV_C2_QUESTION_PROMPT_KEYS.map((key) => ({
        prompt_id: key,
        prompt_key: key,
        structured_value: { value: 'resp_test', selectedOptionIds: ['resp_test'] },
      }))

      const result = deriveChapter2Status(allResponses)
      expect(result.status).toBe('ready_to_complete')
      expect(result.answeredCount).toBe(12)
      expect(result.answeredMomentsCount).toBe(5)
      expect(result.hasCompletionRecord).toBe(false)
    })

    it('deriva status "completed" SOMENTE quando há registro explícito ayv_c2_chapter_completion', () => {
      const allResponses = AYV_C2_QUESTION_PROMPT_KEYS.map((key) => ({
        prompt_id: key,
        prompt_key: key,
        structured_value: { value: 'resp_test', selectedOptionIds: ['resp_test'] },
      }))

      const withCompletion = [
        ...allResponses,
        {
          prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
          prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
          structured_value: {
            completed: true,
            completed_at: '2025-05-10T12:00:00Z',
          },
        },
      ]

      const result = deriveChapter2Status(withCompletion)
      expect(result.status).toBe('completed')
      expect(result.progress).toBe(100)
      expect(result.hasCompletionRecord).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // 8 & 9. Resumo literal e ausência total de dosha/Agni/diagnóstico
  // -------------------------------------------------------------------------
  describe('Resumo literal canônico e ausência epistêmica de doshas', () => {
    it('constrói as 6 seções literais obrigatórias a partir do estado', () => {
      const state = {
        hunger_pattern: ['regular_hours'],
        delayed_meal_response: ['irritation'],
        post_meal: ['light_satisfied'],
        hunger_return: 'returns_quickly',
        food_demands: ['dairy'],
        bowel_rhythm: 'daily_regular',
        stool_pattern: ['formed_easy'],
        sleep_pattern: ['easy_deep'],
        waking: 'rested_ready',
        energy_distribution: 'stable_throughout',
        body_pace: 'constant',
        historical_confidence: 'many_years',
      }

      const summary = buildChapter2LiteralSummary(state, 'neutro')
      expect(summary.length).toBe(6)
      expect(summary[0].title).toBe('Meu ritmo de fome')
      expect(summary[1].title).toBe('Como costumo digerir')
      expect(summary[2].title).toBe('Meu ritmo intestinal')
      expect(summary[3].title).toBe('Como costumo dormir e acordar')
      expect(summary[4].title).toBe('Como minha energia se distribui')
      expect(summary[5].title).toBe('Segurança da memória sobre esse padrão')

      // Verificar que nenhum termo proibido aparece no resumo
      const allText = JSON.stringify(summary).toLowerCase()
      expect(allText).not.toContain('dosha')
      expect(allText).not.toContain('agni')
      expect(allText).not.toContain('vata')
      expect(allText).not.toContain('pitta')
      expect(allText).not.toContain('kapha')
      expect(allText).not.toContain('diagnóstico')
      expect(allText).not.toContain('score')
      expect(allText).not.toContain('ranking')
    })

    it('renderiza o encerramento com o resumo literal e sem mutação direta', () => {
      render(
        <AyurvedaChapter2Closing
          state={{
            hunger_pattern: ['regular_hours'],
            delayed_meal_response: ['can_wait'],
          }}
          isCompleted={false}
          onSaveAndContinueLater={vi.fn()}
          onCompleteChapter={vi.fn()}
          onReviewResponses={vi.fn()}
          onStartCorrection={vi.fn()}
        />,
      )

      expect(screen.getByText('O ritmo que você observou no seu corpo')).toBeInTheDocument()
      expect(screen.getByText('Concluir Capítulo 2')).toBeInTheDocument()
      expect(screen.getByText('Salvar e continuar depois')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // 10. Revisão e Correção
  // -------------------------------------------------------------------------
  describe('Revisão e Correção do Capítulo 2', () => {
    it('abre modo somente-leitura com banner e botão único de retorno ao encerramento', async () => {
      vi.spyOn(enrollmentExperienceService, 'listByEnrollment').mockResolvedValue([])
      vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([
        {
          id: 'r1',
          prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
          prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
          structured_value: { completed: true, completed_at: '2025-05-10T12:00:00Z' },
        } as any,
      ])

      render(
        <AyurvedaChapter2Flow
          enrollmentId="enr-1"
          experienceId="exp-corpo-fisiologia-07b"
          respondentUserId="usr-1"
          initialStage="review"
          onBackToHub={vi.fn()}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
      })
      expect(screen.getByText(AYV_C2_TEXTS.REVISION_RETURN_CMD)).toBeInTheDocument()

      // Os cartões devem estar com tabIndex -1 ou desabilitados para mutação
      const cardButtons = screen.getAllByRole('button', { pressed: false })
      expect(cardButtons[0]).toHaveAttribute('aria-disabled', 'true')
    })

    it('exige diálogo de confirmação ao acionar "Corrigir minhas respostas"', () => {
      render(
        <AyurvedaChapter2Closing
          state={{}}
          isCompleted={true}
          onSaveAndContinueLater={vi.fn()}
          onCompleteChapter={vi.fn()}
          onReviewResponses={vi.fn()}
          onStartCorrection={vi.fn()}
        />,
      )

      const correctBtn = screen.getByText('Corrigir minhas respostas')
      fireEvent.click(correctBtn)

      expect(screen.getByText('Confirmar abertura de correção do Capítulo 2')).toBeInTheDocument()
      expect(screen.getByText('Confirmar e corrigir')).toBeInTheDocument()
    })
  })
})
