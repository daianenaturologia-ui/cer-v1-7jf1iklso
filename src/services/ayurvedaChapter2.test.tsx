import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import {
  deriveChapter2Status,
  buildChapter2LiteralSummary,
  createChapter2Revision,
  migrateLegacyChapter2Responses,
  getPersistedActiveChapter2Revision,
  setPersistedActiveChapter2Revision,
  clearPersistedActiveChapter2Revision,
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

  // -------------------------------------------------------------------------
  // TESTES OBRIGATÓRIOS DA CORREÇÃO VERSIONADA DO CAPÍTULO 2 (14 REQUISITOS)
  // -------------------------------------------------------------------------
  describe('Fluxo Completo de Correção Versionada do Capítulo 2', () => {
    const buildCanonicalC2CompletedResponses = (rev = 1) => {
      const promptMap: Record<string, any> = {
        [AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key]: ['regular_hours'],
        [AYV_C2_PROMPTS.P2_DELAYED_MEAL.key]: ['irritation'],
        [AYV_C2_PROMPTS.P3_POST_MEAL.key]: ['light_satisfied'],
        [AYV_C2_PROMPTS.P4_HUNGER_RETURN.key]: 'returns_quickly',
        [AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key]: ['dairy'],
        [AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key]: 'daily_regular',
        [AYV_C2_PROMPTS.P7_STOOL_PATTERN.key]: ['formed_easy'],
        [AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key]: ['easy_deep'],
        [AYV_C2_PROMPTS.P9_WAKING.key]: 'rested_ready',
        [AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key]: 'stable_throughout',
        [AYV_C2_PROMPTS.P11_BODY_PACE.key]: 'constant',
        [AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key]: 'many_years',
      }

      const list: any[] = []
      for (const [key, val] of Object.entries(promptMap)) {
        list.push({
          id: `resp-v${rev}-${key}`,
          enrollment_id: 'enr-demo',
          experience_id: 'exp-corpo-fisiologia-07b',
          prompt_id: rev > 1 ? `${key}_rev${rev}` : key,
          prompt_key: key,
          canonical_prompt_id: key,
          respondent_user_id: 'usr-mariana',
          response_type: Array.isArray(val) ? 'MultiSelectCards' : 'ChoiceCards',
          version: rev,
          revision_number: rev,
          created: '2025-05-10T10:00:00Z',
          updated: '2025-05-10T10:00:00Z',
          structured_value: {
            value: val,
            selectedOptionIds: Array.isArray(val) ? val : [val],
            revision_number: rev,
            metadata: {
              prompt_key: key,
              canonical_prompt_id: key,
              revision_number: rev,
              domain: 'ayurveda',
              chapter_id: 'capitulo-2-ritmo-corpo',
            },
          },
        })
      }

      // Registro explícito de conclusão da rev
      list.push({
        id: `resp-v${rev}-completion`,
        enrollment_id: 'enr-demo',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id:
          rev > 1
            ? `${AYV_C2_PROMPTS.CHAPTER_COMPLETION.id}_rev${rev}`
            : AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        canonical_prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        respondent_user_id: 'usr-mariana',
        response_type: 'ChapterCompletion',
        version: rev,
        revision_number: rev,
        created: '2025-05-10T11:00:00Z',
        updated: '2025-05-10T11:00:00Z',
        structured_value: {
          completed: true,
          completed_at: '2025-05-10T11:00:00Z',
          revision_number: rev,
          metadata: {
            prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
            canonical_prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
            completed: true,
            completed_at: '2025-05-10T11:00:00Z',
            revision_number: rev,
          },
        },
      })

      return list
    }

    it('1 a 7: carregar Capítulo 2 concluído → clicar "Corrigir minhas respostas" → "Confirmar e corrigir" → encerramento deixa de ser exibido, abre fluxo editável pré-preenchido, altera resposta, conclui novamente com resumo atualizado e versão anterior preservada', async () => {
      const persistedStorage: any[] = buildCanonicalC2CompletedResponses(1)

      vi.spyOn(enrollmentExperienceService, 'listByEnrollment').mockResolvedValue([])
      vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockImplementation(
        async () => [...persistedStorage],
      )
      vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(
        async (params: any) => {
          const rev =
            params.structuredValue?.revision_number ||
            params.structuredValue?.metadata?.revision_number ||
            1
          const record = {
            id: `saved-${params.promptId}-${Date.now()}-${Math.random()}`,
            enrollment_id: params.enrollmentId,
            experience_id: params.experienceId,
            prompt_id: params.promptId,
            prompt_key: params.promptKey,
            canonical_prompt_id: params.canonicalPromptId || params.promptId,
            respondent_user_id: params.respondentUserId,
            response_type: params.responseType,
            structured_value: params.structuredValue,
            version: rev,
            revision_number: rev,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          }
          const existingIdx = persistedStorage.findIndex(
            (r) =>
              r.prompt_id === params.promptId &&
              (r.revision_number === rev || r.structured_value?.revision_number === rev),
          )
          if (existingIdx >= 0) {
            persistedStorage[existingIdx] = record
          } else {
            persistedStorage.push(record)
          }
          return record as any
        },
      )

      render(
        <AyurvedaChapter2Flow
          enrollmentId="enr-demo"
          experienceId="exp-corpo-fisiologia-07b"
          respondentUserId="usr-mariana"
          treatmentVariant="feminino"
          onBackToHub={vi.fn()}
        />,
      )

      // Inicialmente está concluído (v1) e exibe o encerramento com título de conclusão
      await waitFor(() => {
        expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
      })
      expect(screen.getByText('Corrigir minhas respostas')).toBeInTheDocument()

      // 1. Clicar em "Corrigir minhas respostas"
      fireEvent.click(screen.getByText('Corrigir minhas respostas'))
      expect(screen.getByText('Confirmar abertura de correção do Capítulo 2')).toBeInTheDocument()

      // Confirmar "Confirmar e corrigir"
      fireEvent.click(screen.getByText('Confirmar e corrigir'))

      // 1 & 2. O encerramento deixa de ser exibido imediatamente e o fluxo editável é aberto no Momento 1 (Fome)
      await waitFor(() => {
        expect(screen.queryByText('Capítulo 2 concluído')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Momento 1 de 5 — Fome')).toBeInTheDocument()

      // 3. Respostas anteriores pré-preenchidas na tela
      const optRegular = screen.getByText('Aparece em horários relativamente previsíveis.')
      const optRegularButton = optRegular.closest('button')
      expect(optRegularButton).toHaveAttribute('aria-pressed', 'true')

      // 4. Alterar pelo menos uma resposta no Momento 1 (P1): adicionar 'sudden_intense'
      const optSudden = screen.getByText('Surge de repente e pode ficar muito intensa.')
      fireEvent.click(optSudden)

      // Avançar pelos momentos até o encerramento para concluir a nova versão
      fireEvent.click(screen.getByText('Avançar para Digestão'))
      await waitFor(() => {
        expect(screen.getByText('Momento 2 de 5 — Digestão')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Avançar para Eliminação'))
      await waitFor(() => {
        expect(screen.getByText('Momento 3 de 5 — Eliminação')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Avançar para Sono'))
      await waitFor(() => {
        expect(screen.getByText('Momento 4 de 5 — Sono')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Avançar para Energia'))
      await waitFor(() => {
        expect(screen.getByText('Momento 5 de 5 — Energia')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Ir para Encerramento'))
      await waitFor(() => {
        expect(screen.getByText('O ritmo que você observou no seu corpo')).toBeInTheDocument()
      })

      // 5. Concluir novamente: botão "Concluir Capítulo 2" está disponível
      const completeBtn = screen.getByText('Concluir Capítulo 2')
      fireEvent.click(completeBtn)

      // 6. Novo resumo exibe a resposta alterada ("Surge de repente e pode ficar muito intensa.")
      await waitFor(() => {
        expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
      })
      expect(screen.getByText('Surge de repente e pode ficar muito intensa.')).toBeInTheDocument()

      // 7. Versão anterior (v1) preservada integralmente no armazenamento
      const v1Records = persistedStorage.filter(
        (r) =>
          r.revision_number === 1 ||
          r.structured_value?.revision_number === 1 ||
          r.structured_value?.metadata?.revision_number === 1,
      )
      const v2Records = persistedStorage.filter(
        (r) =>
          r.revision_number === 2 ||
          r.structured_value?.revision_number === 2 ||
          r.structured_value?.metadata?.revision_number === 2,
      )

      expect(v1Records.length).toBeGreaterThanOrEqual(13) // 12 perguntas + 1 completion
      expect(v2Records.length).toBeGreaterThanOrEqual(13) // 12 perguntas + 1 completion

      // O registro da v1 original NÃO continha sudden_intense
      const v1P1 = v1Records.find(
        (r) =>
          r.prompt_key === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key ||
          r.prompt_id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
      )
      expect(v1P1.structured_value.value).not.toContain('sudden_intense')

      // O registro da v2 contém a alteração e aponta parent_version_id para a v1
      const v2P1 = v2Records.find(
        (r) =>
          r.prompt_key === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key ||
          r.prompt_id.startsWith(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id),
      )
      expect(v2P1.structured_value.value).toContain('sudden_intense')
      expect(v2P1.structured_value.metadata.parent_version_id).toBeTruthy()
    })

    it('8. Recarregar → nova versão permanece ativa ou concluída corretamente', () => {
      const persistedStorage = [
        ...buildCanonicalC2CompletedResponses(1),
        ...buildCanonicalC2CompletedResponses(2),
      ]

      // Ao derivar status sem parâmetro ativo, deve adotar a maior revisão (v2) e manter-se completed
      const derived = deriveChapter2Status(persistedStorage)
      expect(derived.activeRevisionNumber).toBe(2)
      expect(derived.status).toBe('completed')
      expect(derived.hasCompletionRecord).toBe(true)
    })

    it('9. Cancelar no painel de confirmação sem mutação', async () => {
      const persistedStorage = buildCanonicalC2CompletedResponses(1)
      const saveSpy = vi.fn()
      vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue(
        persistedStorage,
      )
      vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(saveSpy)

      render(
        <AyurvedaChapter2Flow
          enrollmentId="enr-demo"
          experienceId="exp-corpo-fisiologia-07b"
          respondentUserId="usr-mariana"
          onBackToHub={vi.fn()}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Corrigir minhas respostas'))
      expect(screen.getByText('Confirmar abertura de correção do Capítulo 2')).toBeInTheDocument()

      // Clicar em Cancelar
      fireEvent.click(screen.getByText('Cancelar'))

      // Diálogo fechou, tela de conclusão continua visível, zero chamadas de salvamento
      expect(
        screen.queryByText('Confirmar abertura de correção do Capítulo 2'),
      ).not.toBeInTheDocument()
      expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
      expect(saveSpy).not.toHaveBeenCalled()
    })

    it('10. Duas correções sucessivas produzem revisões distintas (v1 → v2 → v3)', () => {
      const v1List = buildCanonicalC2CompletedResponses(1)
      const v2Creation = createChapter2Revision({
        existingResponses: v1List,
        enrollmentId: 'enr-demo',
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: 'usr-mariana',
      })
      expect(v2Creation.nextRevisionNumber).toBe(2)

      // Simular conclusão da v2
      const v2Completed = [
        ...v2Creation.allResponses,
        {
          id: 'v2-completion',
          prompt_id: `${AYV_C2_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
          prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
          structured_value: {
            completed: true,
            completed_at: '2025-05-11T10:00:00Z',
            revision_number: 2,
            metadata: { revision_number: 2 },
          },
        },
      ]

      // Segunda correção sucessiva
      const v3Creation = createChapter2Revision({
        existingResponses: v2Completed,
        enrollmentId: 'enr-demo',
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: 'usr-mariana',
      })
      expect(v3Creation.nextRevisionNumber).toBe(3)
      expect(v3Creation.newActiveResponses.length).toBe(12)
      expect(
        v3Creation.newActiveResponses.every(
          (r) => (r.structured_value as any)?.revision_number === 3,
        ),
      ).toBe(true)
    })

    it('11. Conclusão antiga NÃO força a nova revisão para "completed"', () => {
      // Cria v1 completa com conclusão
      const v1Responses = buildCanonicalC2CompletedResponses(1)
      expect(deriveChapter2Status(v1Responses).status).toBe('completed')

      // Cria v2 ativa em andamento/sem conclusão
      const { allResponses } = createChapter2Revision({
        existingResponses: v1Responses,
        enrollmentId: 'enr-demo',
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: 'usr-mariana',
      })

      // Derivar o status para a revisão ativa 2
      const derivedV2 = deriveChapter2Status(allResponses, 2)
      // Como a v2 recém criada ainda não possui registro de conclusão para a rev 2,
      // seu status deve ser 'ready_to_complete' (todas as 12 copiadas) e NÃO 'completed'
      expect(derivedV2.hasCompletionRecord).toBe(false)
      expect(derivedV2.status).toBe('ready_to_complete')
      expect(derivedV2.status).not.toBe('completed')
    })

    it('12. Capítulo 1 permanece intacto durante o ciclo do Capítulo 2', () => {
      const mixedResponses = [
        // Resposta do Capítulo 1
        {
          id: 'c1-resp',
          prompt_id: 'ayv_c1_structure',
          prompt_key: 'ayv_c1_structure',
          structured_value: { choice: 'figura_a' },
        },
        ...buildCanonicalC2CompletedResponses(1),
      ]

      const { allResponses } = createChapter2Revision({
        existingResponses: mixedResponses,
        enrollmentId: 'enr-demo',
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: 'usr-mariana',
      })

      const c1Preserved = allResponses.find((r) => (r as any).prompt_key === 'ayv_c1_structure')
      expect(c1Preserved).toBeDefined()
      expect((c1Preserved as any).structured_value.choice).toBe('figura_a')
    })

    it('13 & 14: Demais dados da demonstração permanecem intactos e zero chamadas ao PocketBase', async () => {
      const pb = (await import('@/lib/pocketbase/client')).default
      const pbCollectionSpy = vi.spyOn(pb, 'collection')
      const { demoAdapter } = await import('@/services/demoAdapter')
      demoAdapter.enableDemo('mariana')

      // Verificar persona e person intactas
      expect(demoAdapter.getActivePersona()).toBe('mariana')
      const person = demoAdapter.getCurrentPerson()
      expect(person.preferred_name).toBe('Mariana')

      // Nenhuma chamada PocketBase
      expect(pbCollectionSpy).not.toHaveBeenCalled()
    })

    describe('TESTES DE REGRESSÃO E RESILIÊNCIA: DADOS LEGADOS DA 0.0.148 E CORREÇÃO ROBUSTA', () => {
      beforeEach(() => {
        localStorage.clear()
      })

      it('15. Migração idempotente: registros legados da 0.0.148 (sem revision_number) passam à revisão 1 sem alterar dados nem apagar nada', () => {
        const legacyFixture = [
          {
            id: 'legacy-c2-p1',
            enrollment_id: 'enr-demo',
            experience_id: 'exp-corpo-fisiologia-07b',
            prompt_id: 'ayv_c2_hunger_pattern',
            prompt_key: 'ayv_c2_hunger_pattern',
            structured_value: {
              value: ['regular_hours'],
              selectedOptionIds: ['regular_hours'],
              // sem revision_number e sem metadata
            },
            status: 'saved',
            created: '2025-05-10T12:00:00.000Z',
          },
          {
            id: 'legacy-c2-completion',
            enrollment_id: 'enr-demo',
            experience_id: 'exp-corpo-fisiologia-07b',
            prompt_id: 'ayv_c2_chapter_completion',
            prompt_key: 'ayv_c2_chapter_completion',
            structured_value: {
              completed: true,
              completed_at: '2025-05-10T12:30:00.000Z',
              // sem revision_number
            },
            status: 'saved',
            created: '2025-05-10T12:30:00.000Z',
          },
          {
            id: 'legacy-c1-resp',
            enrollment_id: 'enr-demo',
            experience_id: 'exp-corpo-fisiologia-07b',
            prompt_id: 'ayv_c1_structure',
            prompt_key: 'ayv_c1_structure',
            structured_value: { choice: 'figura_a' },
            status: 'saved',
          },
        ]

        // 1ª execução da migração
        const run1 = migrateLegacyChapter2Responses(legacyFixture)
        expect(run1.modifiedCount).toBe(2) // 2 do C2 migrados, C1 intocado
        expect(run1.migratedResponses.length).toBe(3)

        const c2P1 = run1.migratedResponses.find((r) => r.id === 'legacy-c2-p1')
        expect((c2P1 as any).revision_number).toBe(1)
        expect((c2P1 as any).structured_value.revision_number).toBe(1)
        expect((c2P1 as any).structured_value.metadata.revision_number).toBe(1)
        expect((c2P1 as any).structured_value.value).toEqual(['regular_hours']) // valor literal intacto
        expect((c2P1 as any).created).toBe('2025-05-10T12:00:00.000Z') // data intacta

        const c2Comp = run1.migratedResponses.find((r) => r.id === 'legacy-c2-completion')
        expect((c2Comp as any).revision_number).toBe(1)
        expect((c2Comp as any).structured_value.revision_number).toBe(1)
        expect((c2Comp as any).structured_value.completed).toBe(true)

        const c1 = run1.migratedResponses.find((r) => r.id === 'legacy-c1-resp')
        expect((c1 as any).structured_value.choice).toBe('figura_a')
        expect((c1 as any).revision_number).toBeUndefined()

        // 2ª execução (idempotência total: zero alterações adicionais)
        const run2 = migrateLegacyChapter2Responses(run1.migratedResponses)
        expect(run2.modifiedCount).toBe(0)
        expect(run2.migratedResponses).toEqual(run1.migratedResponses)
      })

      it('16. CAMINHO REAL DOS BOTÕES COM FIXTURE LEGADO DA 0.0.148: Clicar Corrigir → Confirmar → Momento 1 editável com respostas preenchidas → Alterar resposta → Concluir de novo → Revisão 1 preservada', async () => {
        // Criar fixture das 12 respostas + conclusão legada da 0.0.148 (sem revision_number e sem metadata)
        const legacyResponses: any[] = []
        const now = '2025-05-10T12:00:00.000Z'

        const baseChoices: Record<string, string[]> = {
          ayv_c2_hunger_pattern: ['regular_hours'],
          ayv_c2_delayed_meal_response: ['can_wait'],
          ayv_c2_post_meal: ['light_satisfied'],
          ayv_c2_hunger_return: ['regular_intervals'],
          ayv_c2_food_demands: ['digests_variety'],
          ayv_c2_bowel_rhythm: ['daily_regular'],
          ayv_c2_stool_pattern: ['formed_easy'],
          ayv_c2_sleep_pattern: ['easy_deep'],
          ayv_c2_waking: ['rested_ready'],
          ayv_c2_energy_distribution: ['stable_throughout'],
          ayv_c2_body_pace: ['constant'],
          ayv_c2_historical_confidence: ['many_years'],
        }

        for (const [key, val] of Object.entries(baseChoices)) {
          legacyResponses.push({
            id: `legacy-${key}`,
            enrollment_id: 'enr-demo',
            experience_id: 'exp-corpo-fisiologia-07b',
            prompt_id: key,
            prompt_key: key,
            response_type:
              Array.isArray(val) && val.length > 1 ? 'MultiSelectCards' : 'ChoiceCards',
            structured_value: {
              value:
                val.length === 1 && !key.includes('pattern') && !key.includes('demands')
                  ? val[0]
                  : val,
              selectedOptionIds: val,
              // propositalmente SEM revision_number e SEM metadata (formato v0.0.148)
            },
            status: 'saved',
            created: now,
            updated: now,
          })
        }

        // Conclusão legada
        legacyResponses.push({
          id: 'legacy-completion-148',
          enrollment_id: 'enr-demo',
          experience_id: 'exp-corpo-fisiologia-07b',
          prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
          prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
          structured_value: {
            completed: true,
            completed_at: now,
            // propositalmente SEM revision_number
          },
          status: 'saved',
          created: now,
        })

        let backendResponses = [...legacyResponses]
        const saveCalls: any[] = []

        vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockImplementation(
          async () => {
            return [...backendResponses]
          },
        )
        vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(
          async (params: any) => {
            saveCalls.push(params)
            const newRecord: any = {
              id: `saved-${params.promptId}-${Date.now()}`,
              enrollment_id: params.enrollmentId,
              experience_id: params.experienceId,
              prompt_id: params.promptId,
              prompt_key: params.promptKey,
              structured_value: params.structuredValue,
              response_type: params.responseType,
              status: 'saved',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
            }
            backendResponses.push(newRecord)
            return newRecord
          },
        )

        render(
          <AyurvedaChapter2Flow
            enrollmentId="enr-demo"
            experienceId="exp-corpo-fisiologia-07b"
            respondentUserId="usr-mariana"
            onBackToHub={vi.fn()}
          />,
        )

        // 1. App inicializa e detecta estado concluído da revisão 1
        await waitFor(() => {
          expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
        })
        expect(
          screen.getByText('Aparece em horários relativamente previsíveis.'),
        ).toBeInTheDocument()

        // 2. Clicar em "Corrigir minhas respostas"
        const btnCorrect = screen.getByText('Corrigir minhas respostas')
        fireEvent.click(btnCorrect)

        expect(screen.getByText('Confirmar abertura de correção do Capítulo 2')).toBeInTheDocument()

        // 3. Clicar em "Confirmar e corrigir"
        const btnConfirm = screen.getByText('Confirmar e corrigir')
        fireEvent.click(btnConfirm)

        // 4. Encerramento antigo desaparece e Momento 1 editável aparece
        await waitFor(() => {
          expect(screen.queryByText('Capítulo 2 concluído')).not.toBeInTheDocument()
          expect(screen.getByText(/Momento 1 de 5 — Fome/i)).toBeInTheDocument()
        })

        // 5. As 12 respostas foram salvas como revisão 2
        const rev2Saves = saveCalls.filter((c) => c.changeReason?.includes('revisão 2'))
        expect(rev2Saves.length).toBe(12)

        // 6. Resposta anterior "Aparece em horários relativamente previsíveis." está preenchida/selecionada
        expect(
          screen.getByText('Aparece em horários relativamente previsíveis.'),
        ).toBeInTheDocument()

        // 7. Alterar uma resposta: adicionar "Surge de repente e pode ficar muito intensa."
        const newOption = screen.getByText('Surge de repente e pode ficar muito intensa.')
        fireEvent.click(newOption)

        // 8. Avançar momentos até o encerramento
        fireEvent.click(screen.getByText('Avançar para Digestão'))
        await waitFor(() =>
          expect(screen.getByText(/Momento 2 de 5 — Digestão/i)).toBeInTheDocument(),
        )

        fireEvent.click(screen.getByText('Avançar para Eliminação'))
        await waitFor(() =>
          expect(screen.getByText(/Momento 3 de 5 — Eliminação/i)).toBeInTheDocument(),
        )

        fireEvent.click(screen.getByText('Avançar para Sono'))
        await waitFor(() => expect(screen.getByText(/Momento 4 de 5 — Sono/i)).toBeInTheDocument())

        fireEvent.click(screen.getByText('Avançar para Energia'))
        await waitFor(() =>
          expect(screen.getByText(/Momento 5 de 5 — Energia/i)).toBeInTheDocument(),
        )

        fireEvent.click(screen.getByText('Ir para Encerramento'))
        await waitFor(() => expect(screen.getByText('Concluir Capítulo 2')).toBeInTheDocument())

        // 9. Concluir de novo explicitamente a revisão 2
        fireEvent.click(screen.getByText('Concluir Capítulo 2'))

        await waitFor(() => {
          expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
        })

        // O novo resumo agora reflete a alteração (ambas as opções na revisão 2)
        expect(screen.getByText('Surge de repente e pode ficar muito intensa.')).toBeInTheDocument()

        // 10. A revisão 1 original permanece intacta nos registros legados
        const rev1Completion = backendResponses.find((r) => r.id === 'legacy-completion-148')
        expect((rev1Completion as any).structured_value.completed).toBe(true)
      })

      it('17. Tratamento de falha sem silêncio: se qualquer gravação falhar ao abrir correção, exibe mensagem "Não foi possível abrir a correção agora. Tente novamente." com botão e permanece no encerramento anterior', async () => {
        const persistedStorage = buildCanonicalC2CompletedResponses(1)
        vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue(
          persistedStorage,
        )

        // Simular falha de gravação (ex.: rede/metadados/exceção)
        vi.spyOn(experienceResponseService, 'saveResponse').mockRejectedValue(
          new Error('Simulated network error during correction creation'),
        )

        render(
          <AyurvedaChapter2Flow
            enrollmentId="enr-demo"
            experienceId="exp-corpo-fisiologia-07b"
            respondentUserId="usr-mariana"
            onBackToHub={vi.fn()}
          />,
        )

        await waitFor(() => {
          expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Corrigir minhas respostas'))
        fireEvent.click(screen.getByText('Confirmar e corrigir'))

        // Falhou: não pode abrir momento1, deve exibir o aviso com botão "Tentar novamente"
        await waitFor(() => {
          expect(
            screen.getByText('Não foi possível abrir a correção agora. Tente novamente.'),
          ).toBeInTheDocument()
        })

        expect(screen.getByText('Capítulo 2 concluído')).toBeInTheDocument()
        expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
        expect(screen.queryByText(/Momento 1 de 5 — Fome/i)).not.toBeInTheDocument()
      })
    })
  })
})
