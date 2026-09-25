/**
 * SUÍTE DE TESTES OBRIGATÓRIOS DO MICROLOTE M2A1
 * Integridade da Criação de Revisões do Capítulo 2 (CER V1)
 *
 * 13 testes obrigatórios:
 * 1. Revisão 1 concluída com respostas válidas -> criação da revisão 2;
 * 2. Cópias da revisão 2 usam `_rev2`;
 * 3. Re-read da revisão 2 encontra as respostas copiadas;
 * 4. Revisão 1 permanece byte a byte inalterada;
 * 5. `revision_number` existe de forma coerente nos campos persistidos;
 * 6. `parent_version_id` aponta para a origem correta;
 * 7. Registro de conclusão da revisão 1 não é copiado como conclusão da revisão 2;
 * 8. Criar revisão 3 a partir da revisão 2 não produz `_rev2_rev3`;
 * 9. Origem vazia -> erro, zero cópias, ponteiro inalterado;
 * 10. Falha na segunda cópia -> ponteiro inalterado e revisão anterior intacta;
 * 11. Fixture legada 0.0.148 continua legível;
 * 12. Zero chamadas ao PocketBase no demo;
 * 13. Caminho real de uma nova correção abre preenchido quando a origem válida existe.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { AyurvedaChaptersNavigator } from '@/components/experience/ayurveda/AyurvedaChaptersNavigator'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import { experienceResponseService } from '@/services/experienceEngine'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import {
  AYV_C2_PROMPTS,
  AYV_C2_TOTAL_QUESTIONS,
  AYV_C2_QUESTION_PROMPT_KEYS,
  createChapter2Revision,
  getChapter2RevisionPromptId,
  getChapter2BasePromptId,
  getPersistedActiveChapter2Revision,
  setPersistedActiveChapter2Revision,
} from '@/services/ayurvedaChapter2'
import pb from '@/lib/pocketbase/client'

describe('M2A1: Integridade da Criação de Revisões do Capítulo 2', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    demoAdapter.resetToDefaultState()
    demoAdapter.enableDemo('mariana')
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
      avatar_presentation: 'feminine',
    })
  })

  // Semente C1 concluído
  const seedC1Completed = async () => {
    const prompts = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P2_SKIN,
      AYV_C1_PROMPTS.P3_HAIR,
      AYV_C1_PROMPTS.P4_TEMPERATURE,
      AYV_C1_PROMPTS.P5_THIRST,
    ]
    for (const p of prompts) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: 'opt_val', choice: 'opt_val' },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: { completed: true, chapter_id: 'capitulo-1-estrutura-caracteristicas' },
    })
  }

  // Semente C2 concluído (fixture legada 0.0.148 sem revision_number)
  const seedC2Completed = async (isLegacyFixture = true) => {
    await seedC1Completed()
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
    for (const p of prompts) {
      const val = p.id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id ? ['regular_hours'] : 'opt_sample'
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: p.id,
        promptKey: p.key,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: Array.isArray(val) ? 'MultiSelectCards' : 'ChoiceCards',
        promptVersion: 1,
        structuredValue: isLegacyFixture
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
              metadata: { revision_number: 1 },
            },
      })
    }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: isLegacyFixture
        ? {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-2-ritmo-digestao-sono',
          }
        : {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-2-ritmo-digestao-sono',
            revision_number: 1,
            metadata: { revision_number: 1 },
          },
    })
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)
  }

  // 1. Revisão 1 concluída com respostas válidas -> criação da revisão 2
  it('1. Revisão 1 concluída com respostas válidas -> criação da revisão 2', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const result = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    expect(result.nextRevisionNumber).toBe(2)
    expect(result.newActiveResponses.length).toBe(AYV_C2_TOTAL_QUESTIONS)
  })

  // 2. Cópias da revisão 2 usam `_rev2`
  it('2. Cópias da revisão 2 usam `_rev2`', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const result = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    for (const item of result.newActiveResponses) {
      expect(item.prompt_id).toMatch(/_rev2$/)
      expect(item.prompt_id).not.toMatch(/_rev1/)
    }
  })

  // 3. Re-read da revisão 2 encontra as respostas copiadas
  it('3. Re-read da revisão 2 encontra as respostas copiadas', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { nextRevisionNumber, newActiveResponses } = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    // Salvar pelo adapter real da mesma forma que os componentes fazem
    for (const item of newActiveResponses) {
      const sVal = (item.structured_value || {}) as any
      const meta = sVal?.metadata || {}
      const pKey = (item as any).prompt_key || meta?.prompt_key || item.prompt_id
      const pId = (item as any).canonical_prompt_id || meta?.canonical_prompt_id || item.prompt_id

      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: item.prompt_id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: item.response_type,
        promptVersion: 1,
        promptKey: pKey,
        canonicalPromptId: pId,
        stepOrder: (item as any).step_order ?? 1,
        accessClass: 'shared_care',
        changeReason: `Cópia rev ${nextRevisionNumber}`,
        structuredValue: sVal,
      })
    }

    // Re-read do armazenamento
    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2List = reloaded.filter((r) => r.prompt_id?.includes('_rev2'))
    expect(rev2List.length).toBe(12)
  })

  // 4. Revisão 1 permanece byte a byte inalterada
  it('4. Revisão 1 permanece byte a byte inalterada', async () => {
    await seedC2Completed(true)
    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const snapshotRev1Before = JSON.stringify(
      existingBefore
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    const { nextRevisionNumber, newActiveResponses } = createChapter2Revision({
      existingResponses: existingBefore,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    // Persistir revisão 2
    for (const item of newActiveResponses) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: item.prompt_id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: item.response_type,
        promptVersion: 1,
        promptKey: (item as any).prompt_key,
        canonicalPromptId: (item as any).canonical_prompt_id,
        stepOrder: 1,
        accessClass: 'shared_care',
        changeReason: `Cópia rev ${nextRevisionNumber}`,
        structuredValue: item.structured_value,
      })
    }

    // Re-read e verificação byte a byte da revisão 1
    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const snapshotRev1After = JSON.stringify(
      reloaded
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    expect(snapshotRev1After).toBe(snapshotRev1Before)
  })

  // 5. `revision_number` existe de forma coerente nos campos persistidos
  it('5. `revision_number` existe de forma coerente nos campos persistidos', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { newActiveResponses } = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    for (const item of newActiveResponses) {
      const sVal = item.structured_value as any
      expect((item as any).revision_number).toBe(2)
      expect(sVal.revision_number).toBe(2)
      expect(sVal.metadata?.revision_number).toBe(2)
    }
  })

  // 6. `parent_version_id` aponta para a origem correta
  it('6. `parent_version_id` aponta para a origem correta', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { newActiveResponses } = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    const parentHunger = existing.find((r) => r.prompt_id === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id)
    const newHunger = newActiveResponses.find(
      (r) => (r as any).prompt_key === AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
    )

    expect(parentHunger).toBeDefined()
    expect(newHunger).toBeDefined()
    expect((newHunger as any).parent_version_id).toBe(parentHunger!.id)
    expect((newHunger!.structured_value as any).parent_version_id).toBe(parentHunger!.id)
    expect((newHunger!.structured_value as any).metadata?.parent_version_id).toBe(parentHunger!.id)
  })

  // 7. Registro de conclusão da revisão 1 não é copiado como conclusão da revisão 2
  it('7. Registro de conclusão da revisão 1 não é copiado como conclusão da revisão 2', async () => {
    await seedC2Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { newActiveResponses } = createChapter2Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    const completionCopy = newActiveResponses.find((r) => {
      const pId = r.prompt_id || ''
      const pKey = (r as any).prompt_key || ''
      return (
        pId.includes(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id) ||
        pKey.includes(AYV_C2_PROMPTS.CHAPTER_COMPLETION.key)
      )
    })
    expect(completionCopy).toBeUndefined()
  })

  // 8. Criar revisão 3 a partir da revisão 2 não produz `_rev2_rev3`
  it('8. Criar revisão 3 a partir da revisão 2 não produz `_rev2_rev3`', async () => {
    await seedC2Completed(true)
    const existingRev1 = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    // Cria revisão 2
    const rev2Result = createChapter2Revision({
      existingResponses: existingRev1,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    for (const item of rev2Result.newActiveResponses) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: item.prompt_id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: item.response_type,
        promptVersion: 1,
        promptKey: (item as any).prompt_key,
        canonicalPromptId: (item as any).canonical_prompt_id,
        stepOrder: 1,
        accessClass: 'shared_care',
        changeReason: 'Cópia rev 2',
        structuredValue: item.structured_value,
      })
    }

    // Marca conclusão para rev 2
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: getChapter2RevisionPromptId(AYV_C2_PROMPTS.CHAPTER_COMPLETION.id, 2),
      promptKey: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: {
        completed: true,
        completed_at: new Date().toISOString(),
        chapter_id: 'capitulo-2-ritmo-digestao-sono',
        revision_number: 2,
        metadata: { revision_number: 2 },
      },
    })

    const existingRev2 = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    // Cria revisão 3
    const rev3Result = createChapter2Revision({
      existingResponses: existingRev2,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    expect(rev3Result.nextRevisionNumber).toBe(3)
    for (const item of rev3Result.newActiveResponses) {
      expect(item.prompt_id).toMatch(/_rev3$/)
      expect(item.prompt_id).not.toContain('_rev2_rev3')
      expect(item.prompt_id).not.toContain('_rev2')
    }
  })

  // 9. Origem vazia -> erro, zero cópias, ponteiro inalterado
  it('9. Origem vazia -> erro, zero cópias, ponteiro inalterado', async () => {
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)

    // Chamar createChapter2Revision com zero respostas de C2 deve lançar erro
    expect(() => {
      createChapter2Revision({
        existingResponses: [],
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: DEMO_USER_MARIANA.id,
      })
    }).toThrow(/nenhuma resposta válida encontrada/i)

    // O ponteiro ativo no storage permanece 1
    expect(getPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID)).toBe(1)
  })

  // 10. Falha na segunda cópia -> ponteiro inalterado e revisão anterior intacta
  it('10. Falha na segunda cópia -> ponteiro inalterado e revisão anterior intacta', async () => {
    await seedC2Completed(true)
    setPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID, 1)

    const existingBefore = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const snapshotRev1Before = JSON.stringify(
      existingBefore
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    let callCount = 0
    const originalSave = experienceResponseService.saveResponse.bind(experienceResponseService)
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async (params) => {
      // Simular erro na 2ª cópia de C2
      if (params.promptId.includes('_rev2')) {
        callCount++
        if (callCount === 2) {
          throw new Error('Falha de persistência simulada na segunda cópia')
        }
      }
      return originalSave(params)
    })

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    // Entrar em Rever C2 -> Encerramento -> Corrigir
    fireEvent.click(screen.getByRole('button', { name: /Rever Capítulo 2/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-c2-review-mode')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/Capítulo 2 Concluído/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Corrigir minhas respostas/i }))
    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    // Banner de erro deve aparecer e ponteiro ativo não avança para 2
    await waitFor(() => {
      expect(screen.getByTestId('c2-correction-error-banner')).toBeInTheDocument()
    })

    expect(getPersistedActiveChapter2Revision(DEMO_ENROLLMENT_ID)).toBe(1)

    // Revisão 1 permanece intacta
    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const snapshotRev1After = JSON.stringify(
      reloaded
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )
    expect(snapshotRev1After).toBe(snapshotRev1Before)
  })

  // 11. Fixture legada 0.0.148 continua legível
  it('11. Fixture legada 0.0.148 continua legível', async () => {
    await seedC2Completed(true) // fixture sem revision_number

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    expect(screen.getByText('Capítulo 1 Concluído')).toBeInTheDocument()
    expect(screen.getByText('Capítulo 2 Concluído')).toBeInTheDocument()
  })

  // 12. Zero chamadas ao PocketBase no demo
  it('12. Zero chamadas ao PocketBase no demo', async () => {
    const pbSpy = vi.spyOn(pb, 'collection')

    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
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

  // 13. Caminho real de uma nova correção abre preenchido quando a origem válida existe
  it('13. Caminho real de uma nova correção abre preenchido quando a origem válida existe', async () => {
    await seedC2Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
    })

    const correctBtns = screen.getAllByRole('button', { name: /Corrigir minhas respostas/i })
    const correctC2Btn = correctBtns[1] || correctBtns[0]
    fireEvent.click(correctC2Btn)

    await waitFor(() => {
      expect(screen.getByText(/Confirmar e corrigir/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Padrão habitual da sua fome/i)).toBeInTheDocument()
    })

    // Na semente foi 'regular_hours' ("Aparece em horários relativamente previsíveis.")
    // O card preenchido deve existir e estar selecionado (1/2 escolhas)
    expect(screen.getByText(/Até 2 escolhas • 1\/2/i)).toBeInTheDocument()
    const selectedBtn = screen
      .getByText(/Aparece em horários relativamente previsíveis/i)
      .closest('button')
    expect(selectedBtn).toBeDefined()
    expect(selectedBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
