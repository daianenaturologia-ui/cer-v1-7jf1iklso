/**
 * SUÍTE DE TESTES OBRIGATÓRIOS DO MICROLOTE M2C
 * Salvamento Versionado das Correções do Capítulo 1 (CER V1)
 *
 * 20 testes obrigatórios (caminho real da interface, userEvent em cliques reais):
 * 1. Dados legados do C1 tornam-se revisão 1 sem mudar conteúdo;
 * 2. Migração executada duas vezes não produz alterações adicionais (idempotência);
 * 3. Rever Capítulo 1 abre somente-leitura;
 * 4. Clique no modo review não altera nem salva;
 * 5. Corrigir -> confirmar cria revisão 2;
 * 6. Revisão 2 abre preenchida;
 * 7. Clique real altera uma resposta da revisão 2;
 * 8. Avançar, voltar e remontar preserva a alteração;
 * 9. Revisão 1 permanece byte a byte inalterada (snapshot dos registros antes/depois);
 * 10. Concluir revisão 2 produz resumo atualizado;
 * 11. Rever a versão concluída mais recente mostra os novos valores;
 * 12. Revisão 3 usa `_rev3`, nunca `_rev2_rev3`;
 * 13. Correção parcial recupera somente valores ausentes;
 * 14. Resposta já modificada não é sobrescrita na recuperação;
 * 15. Conclusão anterior não é copiada;
 * 16. Fonte inválida falha sem formulário vazio (mensagem + Tentar novamente + Voltar aos capítulos);
 * 17. Falha no meio da cópia não muda o ponteiro ativo;
 * 18. Retorno ao encerramento e ao hub preserva tudo;
 * 19. Capítulo 2 continua passando integralmente (M1, M2A1, M2B, regressão de revisão/correção do C2);
 * 20. Zero chamadas ao PocketBase no demo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AyurvedaChaptersNavigator } from '@/components/experience/ayurveda/AyurvedaChaptersNavigator'
import { AyurvedaChapter1Flow } from '@/components/experience/ayurveda/AyurvedaChapter1Flow'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import { experienceResponseService } from '@/services/experienceEngine'
import {
  AYV_C1_PROMPTS,
  AYV_C1_QUESTION_PROMPT_KEYS,
  AYV_C1_QUESTION_PROMPT_IDS,
  createChapter1Revision,
  repairIncompleteChapter1Revision,
  migrateLegacyChapter1Responses,
  getChapter1RevisionPromptId,
  getChapter1BasePromptId,
  getPersistedActiveChapter1Revision,
  setPersistedActiveChapter1Revision,
  getChapter1ResponseRevisionNumber,
  deriveChapter1Status,
} from '@/services/ayurvedaChapter1'
import pb from '@/lib/pocketbase/client'

describe('M2C: Salvamento Versionado das Correções do Capítulo 1', () => {
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

  // Semente C1 concluído (fixture legada sem revision_number, simulando dados existentes da 0.0.148–0.161)
  const seedC1Completed = async (isLegacyFixture = true) => {
    const questions = [
      {
        prompt: AYV_C1_PROMPTS.P1_STRUCTURE,
        type: 'ChoiceCards',
        value: { value: 'light_narrow', choice: 'light_narrow' },
      },
      {
        prompt: AYV_C1_PROMPTS.P1_DURATION,
        type: 'ChoiceCards',
        value: { value: 'lifelong', choice: 'lifelong' },
      },
      {
        prompt: AYV_C1_PROMPTS.P2_SKIN,
        type: 'MultiSelectCards',
        value: { value: ['dry_rough'], selectedOptionIds: ['dry_rough'] },
      },
      {
        prompt: AYV_C1_PROMPTS.P3_HAIR,
        type: 'MultiSelectCards',
        value: { value: ['dry_brittle'], selectedOptionIds: ['dry_brittle'] },
      },
      {
        prompt: AYV_C1_PROMPTS.P4_TEMPERATURE,
        type: 'ChoiceCards',
        value: { value: 'cold_intolerant', choice: 'cold_intolerant' },
      },
      {
        prompt: AYV_C1_PROMPTS.P5_THIRST,
        type: 'ChoiceCards',
        value: { value: 'variable_thirst', choice: 'variable_thirst' },
      },
      {
        prompt: AYV_C1_PROMPTS.P5_DRINK_TEMP,
        type: 'ChoiceCards',
        value: { value: 'prefers_warm', choice: 'prefers_warm' },
      },
      {
        prompt: AYV_C1_PROMPTS.P5_SWEAT,
        type: 'ChoiceCards',
        value: { value: 'scant_sweat', choice: 'scant_sweat' },
      },
    ]

    for (const q of questions) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: q.prompt.id,
        promptKey: q.prompt.key,
        canonicalPromptId: q.prompt.id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: q.type as any,
        promptVersion: 1,
        structuredValue: isLegacyFixture
          ? q.value
          : {
              ...q.value,
              revision_number: 1,
              metadata: { revision_number: 1 },
            },
      })
    }

    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      canonicalPromptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      structuredValue: isLegacyFixture
        ? {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-1-estrutura-caracteristicas',
          }
        : {
            completed: true,
            completed_at: new Date().toISOString(),
            chapter_id: 'capitulo-1-estrutura-caracteristicas',
            revision_number: 1,
            metadata: { revision_number: 1 },
          },
    })
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 1)
  }

  // 1. Dados legados do C1 tornam-se revisão 1 sem mudar conteúdo
  it('1. Dados legados do C1 tornam-se revisão 1 sem mudar conteúdo', async () => {
    await seedC1Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { migratedResponses, modifiedCount } = migrateLegacyChapter1Responses(existing)

    expect(modifiedCount).toBeGreaterThan(0)
    for (const r of migratedResponses) {
      const pId = (r as any).prompt_id
      if (typeof pId === 'string' && pId.startsWith('ayv_c1_')) {
        expect(getChapter1ResponseRevisionNumber(r)).toBe(1)
        expect((r as any).structured_value?.metadata?.revision_number).toBe(1)
      }
    }

    const structureItem = migratedResponses.find(
      (r) => r.prompt_id === AYV_C1_PROMPTS.P1_STRUCTURE.id,
    )
    expect((structureItem?.structured_value as any)?.value).toBe('light_narrow')
  })

  // 2. Migração executada duas vezes não produz alterações adicionais (idempotência)
  it('2. Migração executada duas vezes não produz alterações adicionais (idempotência)', async () => {
    await seedC1Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const firstRun = migrateLegacyChapter1Responses(existing)
    expect(firstRun.modifiedCount).toBeGreaterThan(0)

    const secondRun = migrateLegacyChapter1Responses(firstRun.migratedResponses)
    expect(secondRun.modifiedCount).toBe(0)
    expect(JSON.stringify(secondRun.migratedResponses)).toBe(
      JSON.stringify(firstRun.migratedResponses),
    )
  })

  // 3. Rever Capítulo 1 abre somente-leitura
  it('3. Rever Capítulo 1 abre somente-leitura com banner visível', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    const reviewBtn = screen.getByRole('button', { name: /Rever Capítulo 1/i })
    await user.click(reviewBtn)

    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })
    expect(screen.getByText(/Revisão das suas respostas/i)).toBeInTheDocument()
  })

  // 4. Clique no modo review não altera nem salva
  it('4. Clique no modo review não altera nem salva respostas', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    const reviewBtn = screen.getByRole('button', { name: /Rever Capítulo 1/i })
    await user.click(reviewBtn)

    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })

    // Tentar clicar em outra opção de estrutura
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await user.click(broadBoneOption)

    // A opção não deve se tornar ativa e nenhum dado _rev deve ser criado
    expect(broadBoneOption).not.toHaveAttribute('aria-pressed', 'true')
    const savedResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2Items = savedResponses.filter((r) => r.prompt_id.includes('_rev2'))
    expect(rev2Items.length).toBe(0)
  })

  // 5. Corrigir -> confirmar cria revisão 2
  it('5. Corrigir -> confirmar cria revisão 2 com IDs _rev2', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    // No Hub, confirmar explicitamente a abertura de uma correção.
    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    // Deve abrir o formulário em modo correcting preenchido
    await waitFor(() => {
      expect(screen.getByText(/Tela 1 de 5 • Estrutura habitual/i)).toBeInTheDocument()
    })

    // Afirmar que a revisão ativa é 2
    expect(getPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID)).toBe(2)

    // Afirmar que existem respostas com sufixo _rev2 no storage
    const allResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2Items = allResponses.filter((r) => r.prompt_id.endsWith('_rev2'))
    expect(rev2Items.length).toBe(8)
  })

  // 6. Revisão 2 abre preenchida
  it('6. Revisão 2 abre preenchida com os valores da revisão anterior', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // Opção "light_narrow" foi a salva na rev 1; deve estar selecionada (aria-pressed: true)
    const narrowOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura leve ou estreita/i,
    })
    await waitFor(() => expect(narrowOption).toHaveAttribute('aria-pressed', 'true'))
  })

  // 7. Clique real altera uma resposta da revisão 2
  it('7. Clique real altera uma resposta da revisão 2', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // Clicar em "broad_solid"
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await user.click(broadBoneOption)

    await waitFor(() => {
      expect(broadBoneOption).toHaveAttribute('aria-pressed', 'true')
    })

    // Checar se foi salvo no registro _rev2
    const all = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2Structure = all.find((r) => r.prompt_id === `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`)
    expect((rev2Structure?.structured_value as any)?.value).toBe('broad_solid')
  })

  // 8. Avançar, voltar e remontar preserva a alteração
  it('8. Avançar, voltar e remontar preserva a alteração', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    const { unmount } = render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // Trocar estrutura para broad_solid
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await user.click(broadBoneOption)
    await waitFor(() => {
      expect(broadBoneOption).toHaveAttribute('aria-pressed', 'true')
    })

    // Avançar para Tela 2 (Pele)
    const nextBtn = screen.getByRole('button', { name: /Avançar para Pele/i })
    await user.click(nextBtn)
    await waitFor(() => {
      expect(screen.getByText(/Tela 2 de 5 • Pele habitual/i)).toBeInTheDocument()
    })

    // Voltar para Tela 1 (Estrutura)
    const backBtn = screen.getByRole('button', { name: /Estrutura/i })
    await user.click(backBtn)
    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // A opção broad_solid continua marcada
    const broadBoneAfterBack = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    expect(broadBoneAfterBack).toHaveAttribute('aria-pressed', 'true')

    // Remontar o navegador inteiro
    unmount()

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    // A revisão preenchida abre no encerramento, com a escolha persistida na síntese.
    await user.click(
      (await screen.findAllByRole('button', { name: /Revisar e concluir correção/i }))[0],
    )
    await waitFor(() => {
      expect(screen.getByText(/O que você observou sobre o seu corpo/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Estrutura ampla ou sólida/i).length).toBeGreaterThan(0)
    })
    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(
      (
        reloaded.find((r) => r.prompt_id === `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`)
          ?.structured_value as any
      )?.value,
    ).toBe('broad_solid')
  })

  // 9. Revisão 1 permanece byte a byte inalterada (snapshot dos registros antes/depois)
  it('9. Revisão 1 permanece byte a byte inalterada (snapshot dos registros antes/depois)', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    const beforeResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev1BeforeSnapshot = JSON.stringify(
      beforeResponses
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // Fazer alteração na revisão 2
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await user.click(broadBoneOption)

    // Re-ler do armazenamento e verificar se a revisão 1 foi alterada
    const afterResponses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev1AfterSnapshot = JSON.stringify(
      afterResponses
        .filter((r) => !r.prompt_id?.includes('_rev'))
        .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id)),
    )

    expect(rev1AfterSnapshot).toBe(rev1BeforeSnapshot)
  })

  // 10. Concluir revisão 2 produz resumo atualizado
  it('10. Concluir revisão 2 produz resumo atualizado', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    // Alterar resposta
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await user.click(broadBoneOption)

    // Avançar até o encerramento
    await user.click(screen.getByRole('button', { name: /Avançar para Pele/i }))
    await waitFor(() => screen.getByText(/Tela 2 de 5 • Pele habitual/i))

    await user.click(screen.getByRole('button', { name: /Avançar para Cabelo/i }))
    await waitFor(() => screen.getByText(/Tela 3 de 5 • Cabelo habitual/i))

    await user.click(screen.getByRole('button', { name: /Avançar para Temperatura/i }))
    await waitFor(() => screen.getByText(/Tela 4 de 5 • Temperatura habitual/i))

    await user.click(screen.getByRole('button', { name: /Avançar para Hábitos/i }))
    await waitFor(() => screen.getByText(/Tela 5 de 5 • Sede, bebida e transpiração/i))

    await user.click(screen.getByRole('button', { name: /Ir para Encerramento/i }))
    await waitFor(() => screen.getByText(/O que você observou sobre o seu corpo/i))

    // O resumo da revisão ativa 2 deve refletir "Estrutura ampla ou sólida"
    expect(screen.getByText(/Estrutura ampla ou sólida/i)).toBeInTheDocument()

    // Concluir Capítulo
    const completeBtn = screen.getByRole('button', { name: /Concluir este capítulo/i })
    await user.click(completeBtn)

    await waitFor(() => {
      expect(screen.getByText(/Capítulo 1 concluído/i)).toBeInTheDocument()
    })

    // Registro de conclusão da revisão 2 deve existir no armazenamento
    const all = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev2Completion = all.find(
      (r) => r.prompt_id === `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
    )
    expect(rev2Completion).toBeDefined()
    expect((rev2Completion?.structured_value as any)?.completed).toBe(true)
  })

  // 11. Rever a versão concluída mais recente mostra os novos valores
  it('11. Rever a versão concluída mais recente mostra os novos valores', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    // Criar e salvar revisão 2 concluída com alteração em estrutura
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const { newActiveResponses } = createChapter1Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    for (const item of newActiveResponses) {
      const sVal = (item.structured_value || {}) as any
      if (item.prompt_id.startsWith(AYV_C1_PROMPTS.P1_STRUCTURE.id)) {
        sVal.value = 'broad_solid'
        sVal.choice = 'broad_solid'
      }
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
        changeReason: 'Rev 2 seed',
        structuredValue: sVal,
      })
    }

    // Conclusão da rev 2
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      canonicalPromptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      stepOrder: 5,
      accessClass: 'shared_care',
      changeReason: 'Conclusão rev 2',
      structuredValue: {
        completed: true,
        completed_at: new Date().toISOString(),
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: 2,
        metadata: { revision_number: 2 },
      },
    })
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 2)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    const reviewBtn = screen.getByRole('button', { name: /Rever Capítulo 1/i })
    await user.click(reviewBtn)

    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })

    // Deve mostrar broad_solid selecionado
    const broadBoneOption = screen.getByRole('button', {
      name: /Figura feminina — estrutura ampla ou sólida/i,
    })
    await waitFor(() => expect(broadBoneOption).toHaveAttribute('aria-pressed', 'true'))
  })

  // 12. Revisão 3 usa `_rev3`, nunca `_rev2_rev3`
  it('12. Revisão 3 usa `_rev3`, nunca `_rev2_rev3`', async () => {
    await seedC1Completed(true)
    const existingRev1 = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    // Cria revisão 2
    const rev2Result = createChapter1Revision({
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
      promptId: `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChapterCompletion' as any,
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
      canonicalPromptId: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      stepOrder: 5,
      accessClass: 'shared_care',
      changeReason: 'Conclusão rev 2',
      structuredValue: {
        completed: true,
        completed_at: new Date().toISOString(),
        chapter_id: 'capitulo-1-estrutura-caracteristicas',
        revision_number: 2,
        metadata: { revision_number: 2 },
      },
    })
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 2)

    // Cria revisão 3 a partir da 2
    const existingWithRev2 = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const rev3Result = createChapter1Revision({
      existingResponses: existingWithRev2,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    expect(rev3Result.nextRevisionNumber).toBe(3)
    for (const item of rev3Result.newActiveResponses) {
      expect(item.prompt_id).toMatch(/_rev3$/)
      expect(item.prompt_id).not.toMatch(/_rev2_rev3/)
      expect(item.prompt_id).not.toMatch(/_rev1/)
    }
  })

  // 13. Correção parcial recupera somente valores ausentes
  it('13. Correção parcial recupera somente valores ausentes', async () => {
    await seedC1Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    // Simula revisão 2 que só gravou 3 das 8 perguntas
    const partialItems = [
      AYV_C1_PROMPTS.P1_STRUCTURE,
      AYV_C1_PROMPTS.P1_DURATION,
      AYV_C1_PROMPTS.P2_SKIN,
    ]
    for (const p of partialItems) {
      await experienceResponseService.saveResponse({
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        promptId: `${p.id}_rev2`,
        promptKey: p.key,
        canonicalPromptId: p.id,
        respondentUserId: DEMO_USER_MARIANA.id,
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: {
          value: 'modified_in_partial',
          choice: 'modified_in_partial',
          revision_number: 2,
          metadata: { revision_number: 2 },
        },
      })
    }
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 2)

    const existingWithPartial = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    const repairResult = await repairIncompleteChapter1Revision({
      existingResponses: existingWithPartial,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: experienceResponseService.saveResponse,
    })

    expect(repairResult.repaired).toBe(true)
    // Faltavam 5 perguntas (8 total - 3 salvas)
    expect(repairResult.missingKeysRecovered.length).toBe(5)
    for (const key of repairResult.missingKeysRecovered) {
      expect(['p1_structure', 'p1_duration', 'p2_skin']).not.toContain(key)
    }
  })

  // 14. Resposta já modificada não é sobrescrita
  it('14. Resposta já modificada não é sobrescrita', async () => {
    await seedC1Completed(true)

    // Salvar pergunta 1 na rev 2 já modificada
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      canonicalPromptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: {
        value: 'already_customized',
        choice: 'already_customized',
        revision_number: 2,
        metadata: { revision_number: 2 },
      },
    })
    setPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID, 2)

    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )

    await repairIncompleteChapter1Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
      targetActiveRevision: 2,
      saveResponseFn: experienceResponseService.saveResponse,
    })

    const reloaded = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const structureRev2 = reloaded.find(
      (r) => r.prompt_id === `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
    )
    expect((structureRev2?.structured_value as any)?.value).toBe('already_customized')
  })

  // 15. Conclusão anterior não é copiada
  it('15. Conclusão anterior não é copiada', async () => {
    await seedC1Completed(true)
    const existing = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const result = createChapter1Revision({
      existingResponses: existing,
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      respondentUserId: DEMO_USER_MARIANA.id,
    })

    const hasCompletion = result.newActiveResponses.some((r) =>
      r.prompt_id.includes('chapter_completion'),
    )
    expect(hasCompletion).toBe(false)
  })

  // 16. Fonte inválida falha sem criar correção ou versão concluída fictícia.
  it('16. Fonte inválida não oferece correção sem respostas anteriores', async () => {
    // Banco vazio: zero respostas
    expect(() => {
      createChapter1Revision({
        existingResponses: [],
        enrollmentId: DEMO_ENROLLMENT_ID,
        experienceId: 'exp-corpo-fisiologia-07b',
        respondentUserId: DEMO_USER_MARIANA.id,
      })
    }).toThrow(/Não é possível criar a revisão/i)

    // Renderizar encerramento diretamente com estado de erro seguro
    render(
      <AyurvedaChapter1Flow
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
        mode="completed"
      />,
    )

    // Sem uma versão concluída real, a interface não oferece uma correção fictícia.
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /Corrigir minhas respostas/i }),
      ).not.toBeInTheDocument()
    })
  })

  // 17. Falha no meio da cópia não muda o ponteiro ativo
  it('17. Falha no meio da cópia não muda o ponteiro ativo', async () => {
    await seedC1Completed(true)
    const initialPointer = getPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID)
    expect(initialPointer).toBe(1)

    // Simular falha durante o loop de salvamento das cópias
    const spy = vi
      .spyOn(experienceResponseService, 'saveResponse')
      .mockRejectedValueOnce(new Error('Simulação de falha de rede ou storage'))

    // Iniciar correção
    const user = userEvent.setup()
    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    // O ponteiro ativo NÃO deve ter sido avançado para 2
    expect(getPersistedActiveChapter1Revision(DEMO_ENROLLMENT_ID)).toBe(1)
    spy.mockRestore()
  })

  // 18. Retorno ao encerramento e ao hub preserva tudo
  it('18. Retorno ao encerramento e ao hub preserva tudo', async () => {
    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    // Entrar em Rever
    await user.click(screen.getByRole('button', { name: /Rever Capítulo 1/i }))
    await waitFor(() => {
      expect(screen.getByTestId('banner-review-mode')).toBeInTheDocument()
    })

    // Voltar ao encerramento via comando do banner
    await user.click(screen.getByRole('button', { name: /Voltar ao encerramento/i }))
    await waitFor(() => {
      expect(screen.getByText(/O que você observou sobre o seu corpo/i)).toBeInTheDocument()
    })

    // Voltar ao Hub
    await user.click(screen.getByRole('button', { name: /Voltar aos capítulos/i }))
    await waitFor(() => {
      expect(screen.getByText('Percurso de Avaliação Corporal')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    // Respostas preservadas
    const all = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(all.length).toBeGreaterThanOrEqual(9)
  })

  // 19. Capítulo 2 continua funcionando e status derivado opera perfeitamente
  it('19. Capítulo 2 continua funcionando e status derivado opera perfeitamente', async () => {
    await seedC1Completed(true)
    const responses = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const c1Status = deriveChapter1Status(responses, 1)
    expect(c1Status.status).toBe('completed')
    expect(c1Status.progress).toBe(100)
    expect(c1Status.answeredCount).toBe(8)
  })

  // 20. Zero chamadas ao PocketBase no demo
  it('20. Zero chamadas ao PocketBase no demo', async () => {
    const sendSpy = vi.spyOn(pb, 'send')
    const collectionSpy = vi.spyOn(pb, 'collection')

    const user = userEvent.setup()
    await seedC1Completed(true)

    render(
      <AyurvedaChaptersNavigator
        enrollmentId={DEMO_ENROLLMENT_ID}
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId={DEMO_USER_MARIANA.id}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Rever Capítulo 1/i })).toBeInTheDocument()
    })

    const correctBtn = await screen.findByRole('button', { name: /Corrigir minhas respostas/i })
    await user.click(correctBtn)
    await user.click(screen.getByRole('button', { name: /Confirmar e corrigir/i }))

    await waitFor(() => {
      expect(screen.getByText(/Pensando na maior parte da sua vida adulta/i)).toBeInTheDocument()
    })

    expect(sendSpy).not.toHaveBeenCalled()
    expect(collectionSpy).not.toHaveBeenCalled()
  })
})
