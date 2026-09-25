import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { demoAdapter } from '@/services/demoAdapter'
import { experienceResponseService } from '@/services/experienceEngine'
import pb from '@/lib/pocketbase/client'
import {
  AYURVEDA_CHAPTER_2_ID,
  AYURVEDA_CHAPTER_2_VERSION,
  AYV_C2_PROMPTS,
  AYV_C2_TOTAL_QUESTIONS,
  getChapter2RevisionPromptId,
  getChapter2BasePromptId,
  getPersistedActiveChapter2Revision,
  setPersistedActiveChapter2Revision,
  repairIncompleteChapter2Revision,
  createChapter2Revision,
} from '@/services/ayurvedaChapter2'
import AyurvedaChaptersNavigator from '@/components/experience/ayurveda/AyurvedaChaptersNavigator'
import AyurvedaChapter2Flow from '@/components/experience/ayurveda/AyurvedaChapter2Flow'

const DEMO_PERSON_MARIANA = {
  id: 'person-mariana-demo',
  name: 'Mariana Silva',
  role: 'interagente' as const,
}

const DEMO_USER_MARIANA = {
  id: 'usr-mariana-demo',
  email: 'mariana.demo@exemplo.com',
  name: 'Mariana Silva',
  person_id: DEMO_PERSON_MARIANA.id,
}

const DEMO_ENROLLMENT_ID = 'enr-corpo-fisiologia-07b'
const EXPERIENCE_ID = 'exp-corpo-fisiologia-07b'

describe('M2B - Recuperação idempotente das revisões existentes do Capítulo 2', () => {
  beforeEach(async () => {
    localStorage.clear()
    demoAdapter.enableDemo('mariana')
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
      avatar_presentation: 'feminine',
    })
  })

  // Semente C2 concluído na revisão 1
  const seedC2CompletedRev1 = async (opts?: {
    customResponses?: Record<string, any>
    legacyFormat?: boolean
  }) => {
    const prompts = [
      AYV_C2_PROMPTS.P1_HUNGER_PATTERN,
      AYV_C2_PROMPTS.P2_DELAYED_MEAL,
      AYV_C2_PROMPTS.P3_POST_MEAL,
      AYV_C2_PROMPTS.P4_HUNGER_RETURN,
      AYV_C2_PROMPTS.P5_FOOD_DEMANDS,
      AYV_C2_PROMPTS.P6_BOWEL_RHYTHM,
      AYV_C2_PROMPTS.P7_STOOL_PATTERN,
      AYV_C2_PROMPTS.P8_SLEEP_PATTERN,
      AYV_C2_PROMPTS.P9_WAKING,
      AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION,
      AYV_C2_PROMPTS.P11_BODY_PACE,
      AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE,
    ]

    for (let i = 0; i < prompts.length; i++) {
      const p = prompts[i]
      const custom = opts?.customResponses?.[p.key]
      const defaultVal =
        p.id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id ? ['regular_hours'] : 'opt_sample'
      const val = custom !== undefined ? custom : defaultVal

      const structuredValue = opts?.legacyFormat
        ? {
            value: val,
            choice: typeof val === 'string' ? val : undefined,
            selectedOptionIds: Array.isArray(val) ? val : [val],
          }
        : {
            value: val,
            choice: typeof val === 'string' ? val : undefined,
            selectedOptionIds: Array.isArray(val) ? val : [val],
            revision_number: 1,
            metadata: {
              prompt_key: p.key,
              canonical_prompt_id: p.id,
              revision_number: 1,
              step_order: i + 1,
            },
          }

      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: EXPERIENCE_ID,
        promptId: p.id,
        promptKey: p.key,
        canonicalPromptId: p.id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: Array.isArray(val) ? 'MultiSelectCards' : 'ChoiceCards',
        promptVersion: 1,
        stepOrder: i + 1,
        accessClass: 'shared_care',
        structuredValue,
      })
    }

    // Registro de conclusão canônica de C2
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      promptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
      canonicalPromptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: {
        completed: true,
        completed_at: new Date().toISOString(),
        chapter_id: 'capitulo-2-ritmo-digestao-sono',
        revision_number: 1,
      },
    })
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)
  }

  // 1. Revisão ativa vazia recebe todas as respostas da última revisão concluída
  it('1. Revisão ativa vazia recebe todas as respostas da última revisão concluída', async () => {
    await seedC2CompletedRev1()
    // Revisão ativa apontada para 2, mas sem respostas ainda em rev2
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(result.repaired).toBe(true)
    expect(result.activeRevisionNumber).toBe(2)
    expect(result.recoveredResponses.length).toBe(AYV_C2_TOTAL_QUESTIONS) // 12 perguntas recuperadas

    // Re-ler do armazenamento
    const freshResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev2Saved = freshResponses.filter((r) => r.prompt_id?.endsWith('_rev2'))
    expect(rev2Saved.length).toBe(AYV_C2_TOTAL_QUESTIONS)
  })

  // 2. Revisão ativa parcial recebe somente as ausentes
  it('2. Revisão ativa parcial recebe somente as ausentes', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    // Criar apenas 3 respostas pré-existentes na rev 2
    const partialPrompts = [
      AYV_C2_PROMPTS.P1_HUNGER_PATTERN,
      AYV_C2_PROMPTS.P2_DELAYED_MEAL,
      AYV_C2_PROMPTS.P3_POST_MEAL,
    ]
    for (const p of partialPrompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: EXPERIENCE_ID,
        promptId: getChapter2RevisionPromptId(p.id, 2),
        promptKey: p.key,
        canonicalPromptId: p.id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: 'MultiSelectCards',
        promptVersion: 1,
        structuredValue: {
          value: ['custom_value'],
          revision_number: 2,
        },
      })
    }

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(result.repaired).toBe(true)
    // 12 total - 3 já existentes = 9 recuperadas
    expect(result.recoveredResponses.length).toBe(9)

    // Re-ler do armazenamento
    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev2Total = fresh.filter((r) => r.prompt_id?.endsWith('_rev2'))
    expect(rev2Total.length).toBe(12)
  })

  // 3. Resposta já modificada na revisão ativa não é sobrescrita
  it('3. Resposta já modificada na revisão ativa não é sobrescrita', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    // Pré-existente na revisão 2 com valor modificado
    const modifiedVal = ['modified_hunger_test']
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      promptId: getChapter2RevisionPromptId(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id, 2),
      promptKey: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
      canonicalPromptId: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'MultiSelectCards',
      promptVersion: 1,
      structuredValue: {
        value: modifiedVal,
        selectedOptionIds: modifiedVal,
        revision_number: 2,
      },
    })

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev2Hunger = fresh.find(
      (r) => r.prompt_id === getChapter2RevisionPromptId(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id, 2),
    )
    expect((rev2Hunger?.structured_value as any)?.value).toEqual(modifiedVal)
  })

  // 4. "Não sei identificar" não é tratado como ausência
  it('4. "Não sei identificar" não é tratado como ausência', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    // Usuária respondeu "Não sei identificar" na rev 2
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      promptId: getChapter2RevisionPromptId(AYV_C2_PROMPTS.P2_DELAYED_MEAL.id, 2),
      promptKey: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
      canonicalPromptId: AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: {
        value: 'dont_know',
        choice: 'dont_know',
        dont_know: true,
        revision_number: 2,
      },
    })

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    // P2_DELAYED_MEAL não deve estar na lista de recuperados
    expect(result.missingKeysRecovered).not.toContain(AYV_C2_PROMPTS.P2_DELAYED_MEAL.key)

    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const p2Record = fresh.find(
      (r) => r.prompt_id === getChapter2RevisionPromptId(AYV_C2_PROMPTS.P2_DELAYED_MEAL.id, 2),
    )
    expect((p2Record?.structured_value as any)?.choice).toBe('dont_know')
  })

  // 5. "Prefiro não responder" não é tratado como ausência
  it('5. "Prefiro não responder" não é tratado como ausência', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      promptId: getChapter2RevisionPromptId(AYV_C2_PROMPTS.P3_POST_MEAL.id, 2),
      promptKey: AYV_C2_PROMPTS.P3_POST_MEAL.key,
      canonicalPromptId: AYV_C2_PROMPTS.P3_POST_MEAL.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: {
        value: 'prefer_not_to_say',
        choice: 'prefer_not_to_say',
        prefer_not_to_say: true,
        revision_number: 2,
      },
    })

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(result.missingKeysRecovered).not.toContain(AYV_C2_PROMPTS.P3_POST_MEAL.key)
    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const p3Record = fresh.find(
      (r) => r.prompt_id === getChapter2RevisionPromptId(AYV_C2_PROMPTS.P3_POST_MEAL.id, 2),
    )
    expect((p3Record?.structured_value as any)?.choice).toBe('prefer_not_to_say')
  })

  // 6. Conclusão anterior não é copiada
  it('6. Conclusão anterior não é copiada', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    const completionRecovered = result.recoveredResponses.find((r) =>
      r.prompt_id?.includes(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id),
    )
    expect(completionRecovered).toBeUndefined()

    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev2Completion = fresh.find(
      (r) => r.prompt_id === getChapter2RevisionPromptId(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id, 2),
    )
    expect(rev2Completion).toBeUndefined()
  })

  // 7. Revisão de origem permanece byte a byte inalterada
  it('7. Revisão de origem permanece byte a byte inalterada', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev1BeforeSnapshot = JSON.stringify(
      existingBefore
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev1AfterSnapshot = JSON.stringify(
      reloaded
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    expect(rev1AfterSnapshot).toBe(rev1BeforeSnapshot)
  })

  // 8. Cópias usam os IDs `_revN` corretos
  it('8. Cópias usam os IDs `_revN` corretos', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    for (const r of result.recoveredResponses) {
      expect(r.prompt_id).toMatch(/_rev2$/)
      expect(r.prompt_id).not.toContain('_rev1')
      expect(r.prompt_id).not.toContain('_rev2_rev2')
      expect((r.structured_value as any).revision_number).toBe(2)
      expect((r.structured_value as any).metadata?.revision_number).toBe(2)
    }
  })

  // 9. Executar a recuperação duas vezes não duplica registros (idempotência)
  it('9. Executar a recuperação duas vezes não duplica registros', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    // Primeira execução
    const firstRun = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })
    expect(firstRun.repaired).toBe(true)
    expect(firstRun.recoveredResponses.length).toBe(12)

    // Segunda execução
    const freshResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const secondRun = await repairIncompleteChapter2Revision({
      existingResponses: freshResponses,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(secondRun.repaired).toBe(false)
    expect(secondRun.recoveredResponses.length).toBe(0)

    // Total de registros para rev 2 continua sendo exatamente 12
    const totalRev2 = (
      await experienceResponseService.listResponsesByExperience(DEMO_ENROLLMENT_ID, EXPERIENCE_ID)
    ).filter((r) => r.prompt_id?.endsWith('_rev2'))
    expect(totalRev2.length).toBe(12)
  })

  // 10. Recarregar durante a correção mantém o formulário preenchido
  it('10. Recarregar durante a correção mantém o formulário preenchido', async () => {
    await seedC2CompletedRev1()
    // Simula estado onde a revisão 2 já foi iniciada mas não concluída
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    // Renderiza AyurvedaChapter2Flow em modo 'correcting'
    const { unmount } = render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Na semente foi 'regular_hours'
    const regularHoursBtn = screen
      .getByText(/Aparece em horários relativamente previsíveis/i)
      .closest('button')
    expect(regularHoursBtn).toHaveAttribute('aria-pressed', 'true')

    unmount()

    // "Recarregando" montando novamente
    render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    const regularHoursBtnAfterReload = screen
      .getByText(/Aparece em horários relativamente previsíveis/i)
      .closest('button')
    expect(regularHoursBtnAfterReload).toHaveAttribute('aria-pressed', 'true')
  })

  // 11. Controles permanecem editáveis
  it('11. Controles permanecem editáveis', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Em modo 'correcting', NÃO deve haver banner de somente leitura
    expect(screen.queryByTestId('banner-c2-review-mode')).toBeNull()

    // Botões devem estar habilitados (disabled false)
    const optButtons = screen.getAllByRole('button')
    const cardButtons = optButtons.filter(
      (b) =>
        b.textContent?.includes('Aparece') ||
        b.textContent?.includes('Oscila') ||
        b.textContent?.includes('intensa'),
    )
    for (const btn of cardButtons) {
      expect(btn).toBeEnabled()
    }
  })

  // 12. Clique real com userEvent modifica e persiste uma resposta recuperada
  it('12. Clique real com userEvent modifica e persiste uma resposta recuperada', async () => {
    const user = userEvent.setup()
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Clicar na opção "Oscila muito" para alternar
    const oscilaBtn = screen.getByText(/Oscila muito: às vezes quase não sinto/i).closest('button')
    expect(oscilaBtn).not.toBeNull()

    await user.click(oscilaBtn!)

    // Re-ler do armazenamento para verificar se foi persistido na rev 2
    await waitFor(async () => {
      const responses = await experienceResponseService.listResponsesByExperience(
        DEMO_ENROLLMENT_ID,
        EXPERIENCE_ID,
      )
      const rev2Hunger = responses.find(
        (r) => r.prompt_id === getChapter2RevisionPromptId(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id, 2),
      )
      const selected = (rev2Hunger?.structured_value as any)?.selectedOptionIds || []
      expect(selected).toContain('variable_skips')
    })
  })

  // 13. Falha parcial pode ser retomada sem sobrescrever o que já existe
  it('13. Falha parcial pode ser retomada sem sobrescrever o que já existe', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    let copyCount = 0
    const failFn = async (item: any) => {
      copyCount++
      if (copyCount === 3) {
        throw new Error('Falha simulada na 3ª cópia')
      }
      return await experienceResponseService.saveResponse(item)
    }

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    // Primeira tentativa falha na cópia 3
    await expect(
      repairIncompleteChapter2Revision({
        existingResponses: existingBefore,
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: EXPERIENCE_ID,
        respondentUserId: DEMO_USER_MARIANA.id,
        targetActiveRevision: 2,
        saveResponseFn: failFn,
      }),
    ).rejects.toThrow(/Falha simulada na 3ª cópia/)

    // As duas primeiras cópias foram salvas no adapter
    const partialSaved = (
      await experienceResponseService.listResponsesByExperience(DEMO_ENROLLMENT_ID, EXPERIENCE_ID)
    ).filter((r) => r.prompt_id?.endsWith('_rev2'))
    expect(partialSaved.length).toBe(2)

    // Segunda tentativa retoma com sucesso
    const retryExisting = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const retryResult = await repairIncompleteChapter2Revision({
      existingResponses: retryExisting,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(retryResult.repaired).toBe(true)
    // 12 - 2 já existentes = 10 restantes recuperadas
    expect(retryResult.recoveredResponses.length).toBe(10)

    const finalRev2 = (
      await experienceResponseService.listResponsesByExperience(DEMO_ENROLLMENT_ID, EXPERIENCE_ID)
    ).filter((r) => r.prompt_id?.endsWith('_rev2'))
    expect(finalRev2.length).toBe(12)
  })

  // 14. Ausência de origem válida mostra erro e não abre formulário vazio
  it('14. Ausência de origem válida mostra erro e não abre formulário vazio', async () => {
    // Nenhuma resposta em C2 concluída, mas active revision é colocada em 2
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('c2-recovery-error-banner')).toBeInTheDocument()
    })

    expect(
      screen.getByText('Não foi possível recuperar as respostas anteriores para esta correção.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument()
    // Não deve renderizar o formulário
    expect(screen.queryByText(/Padrão habitual da sua fome/i)).toBeNull()
  })

  // 15. Nenhuma revisão nova é criada ao recuperar
  it('15. Nenhuma revisão nova é criada ao recuperar', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(result.activeRevisionNumber).toBe(2)
    // Nenhuma resposta _rev3 foi criada
    const fresh = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )
    const rev3 = fresh.filter((r) => r.prompt_id?.includes('_rev3'))
    expect(rev3.length).toBe(0)
  })

  // 16. Ponteiro ativo permanece o mesmo
  it('16. Ponteiro ativo permanece o mesmo', async () => {
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(getPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID)).toBe(2)
  })

  // 17. Fixture representando o estado real da 0.0.157
  it('17. Fixture representando o estado real da 0.0.157 (revisão anterior legada sem revision_number e revisão ativa vazia)', async () => {
    // 0.0.157: Usuária Mariana tem respostas legadas de C1 e C2 concluído sem revision_number,
    // e iniciou correção gerando revisão ativa vazia
    await seedC2CompletedRev1({ legacyFormat: true })
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      EXPERIENCE_ID,
    )

    const result = await repairIncompleteChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: EXPERIENCE_ID,
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: async (params) => experienceResponseService.saveResponse(params),
    })

    expect(result.repaired).toBe(true)
    expect(result.recoveredResponses.length).toBe(12)
    for (const r of result.recoveredResponses) {
      expect(r.prompt_id).toMatch(/_rev2$/)
      expect((r.structured_value as any).revision_number).toBe(2)
      expect((r.structured_value as any).metadata?.revision_number).toBe(2)
    }
  })

  // 18. Zero chamadas ao PocketBase no demo
  it('18. Zero chamadas ao PocketBase no demo durante reparo e renderização', async () => {
    const pbSpy = vi.spyOn(pb, 'collection')
    await seedC2CompletedRev1()
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChapter2Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId={EXPERIENCE_ID}
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="correcting"
        onBackToHub={vi.fn()}
        revisionNumber={2}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    const forbiddenCollections = [
      'persons',
      'cer_experiences',
      'experience_responses',
      'enrollment_experiences',
    ]
    for (const call of pbSpy.mock.calls) {
      expect(forbiddenCollections).not.toContain(call[0])
    }
  })
})
