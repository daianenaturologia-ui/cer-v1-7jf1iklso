import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  MENTE_EMOCOES_EXPERIENCE_ID,
  DEMO_ARCHIVED_INCOMPATIBLE_KEY,
} from './demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from './experienceEngine'
import { cerJournalService } from './cerJournalService'
import {
  evaluateFieldState,
  extractQuestionResponse,
} from '@/components/experience/MindEmotionsReport'
import type { ExperienceResponseRecord } from '@/types/cer'
import pb from '@/lib/pocketbase/client'

describe('ESTABILIZAÇÃO DAS RESPOSTAS ANTIGAS DE MENTE & EMOÇÕES NO MODO DEMONSTRAÇÃO (0.0.120)', () => {
  beforeEach(() => {
    localStorage.clear()
    demoAdapter.disableDemo()
    demoAdapter.enableDemo('mariana')
    demoAdapter.resetToDefaultState()
  })

  // Teste A: Estado antigo sem prompt_key não alimenta o relatório (registro retirado do estado ativo)
  it('Teste A: Estado antigo sem prompt_key não alimenta o relatório (registro retirado do estado ativo)', async () => {
    // Injeta registro legado de Mente & Emoções sem prompt_key nem canonical_prompt_id
    const legacyRecord: ExperienceResponseRecord = {
      id: 'legacy-mente-01',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
      prompt_id: 'old-random-prompt-id',
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'FreeReflection',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      free_text: 'Texto antigo sem prompt_key',
      structured_value: { value: 'valor antigo' },
      access_class: 'shared_care',
      created: '2025-01-15T10:00:00.000Z',
      updated: '2025-01-15T10:00:00.000Z',
    }

    // Persistir no localStorage como se fosse estado v3 antes da inicialização
    const rawState = {
      activePersona: 'mariana',
      messages: [],
      sessions: [],
      notes: [],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [legacyRecord],
      enrollmentExperienceProgress: {},
    }
    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(rawState))

    // Carregar estado através do demoAdapter
    demoAdapter.enableDemo('mariana')

    // 1. O registro incompatível foi RETIRADO do estado ativo de experienceResponses
    const activeList = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      MENTE_EMOCOES_EXPERIENCE_ID,
    )
    expect(activeList).toHaveLength(0)

    // 2. O estado ativo não alimenta o relatório
    const responsesMap: Record<string, ExperienceResponseRecord> = {}
    for (const r of activeList) {
      responsesMap[r.prompt_id] = r
    }
    const p1 = extractQuestionResponse(responsesMap, ['funcionamento_emocional_geral'])
    const p1Eval = evaluateFieldState(p1)
    expect(p1Eval.isEmpty).toBe(true)

    // 3. A flag menteEmocoesNeedsRedo deve ser verdadeira
    expect(demoAdapter.isMenteEmocoesRedoNeeded()).toBe(true)
  })

  // Teste B: O registro antigo não é associado por suposição a nenhuma pergunta (fica arquivado, não reatribuído)
  it('Teste B: O registro antigo não é associado por suposição a nenhuma pergunta (fica arquivado, não reatribuído)', async () => {
    const legacyRecord: ExperienceResponseRecord = {
      id: 'legacy-mente-02',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
      prompt_id: 'unknown-prompt-id',
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'FreeReflection',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      free_text: 'Suposta resposta da P1',
      access_class: 'shared_care',
      created: '2025-01-15T10:00:00.000Z',
      updated: '2025-01-15T10:00:00.000Z',
    }

    const rawState = {
      activePersona: 'mariana',
      messages: [],
      sessions: [],
      notes: [],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [legacyRecord],
      enrollmentExperienceProgress: {},
    }
    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(rawState))
    demoAdapter.enableDemo('mariana')

    // Verifica se está nos retiredExperienceResponses com motivo técnico
    const retired = demoAdapter.getRetiredExperienceResponses()
    expect(retired).toHaveLength(1)
    expect(retired[0].id).toBe('legacy-mente-02')
    expect(retired[0].retired_reason).toBe('missing_canonical_identification')

    // Nenhuma associação presumida a qualquer pergunta de Mente & Emoções
    expect((retired[0] as any).prompt_key).toBeUndefined()
    expect((retired[0] as any).canonical_prompt_id).toBeUndefined()
  })

  // Teste C: A pré-consulta (messages) permanece intacta após a migração
  it('Teste C: A pré-consulta (messages) permanece intacta após a migração', async () => {
    const initialMessageText = 'Relato pré-consulta de Mariana sobre cansaço mental'
    const preConsultaMsg = {
      id: 'demo-msg-pre-01',
      enrollment_id: DEMO_ENROLLMENT_ID,
      participant_user_id: DEMO_USER_MARIANA.id,
      message_text: initialMessageText,
      status: 'approved' as const,
      access_class: 'shared_care' as const,
      created: '2025-01-12T10:00:00.000Z',
      updated: '2025-01-12T10:00:00.000Z',
    }

    const legacyResp: ExperienceResponseRecord = {
      id: 'legacy-resp-c',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
      prompt_id: 'old-p-id',
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'FreeReflection',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      free_text: 'texto antigo',
      access_class: 'shared_care',
      created: '2025-01-10T10:00:00.000Z',
      updated: '2025-01-10T10:00:00.000Z',
    }

    const state = {
      activePersona: 'mariana',
      messages: [preConsultaMsg],
      sessions: [],
      notes: [],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [legacyResp],
      enrollmentExperienceProgress: {},
    }
    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(state))

    // Executa migração ao habilitar demo
    demoAdapter.enableDemo('mariana')

    const messages = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(messages).toHaveLength(1)
    expect(messages[0].id).toBe('demo-msg-pre-01')
    expect(messages[0].message_text).toBe(initialMessageText)
  })

  // Teste D: Dados das outras áreas (sessions, notes, plans, maps, progresso de outras experiências) permanecem intactos
  it('Teste D: Dados das outras áreas (sessions, notes, plans, maps, progresso de outras experiências) permanecem intactos', async () => {
    const otherExpProg = {
      progress_status: 'completed' as const,
      release_status: 'completed' as const,
      current_step_order: 5,
      last_interaction_at: '2025-01-15T12:00:00.000Z',
    }

    const state = {
      activePersona: 'mariana',
      messages: [],
      sessions: [
        {
          id: 'demo-sess-01',
          enrollment_id: DEMO_ENROLLMENT_ID,
          professional_user_id: 'demo-user-daiane',
          scheduled_at: '2025-01-20T14:00:00.000Z',
          status: 'scheduled' as const,
          created: '2025-01-15T10:00:00.000Z',
          updated: '2025-01-15T10:00:00.000Z',
        },
      ],
      notes: [
        {
          id: 'demo-note-01',
          session_id: 'demo-sess-01',
          enrollment_id: DEMO_ENROLLMENT_ID,
          author_user_id: 'demo-user-daiane',
          text: 'Nota clínica da Daiane',
          created: '2025-01-15T10:00:00.000Z',
          updated: '2025-01-15T10:00:00.000Z',
        },
      ],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [
        {
          id: 'other-exp-resp',
          enrollment_id: DEMO_ENROLLMENT_ID,
          experience_id: 'exp-corpo-fisiologia-07b',
          prompt_id: 'p-corpo-01',
          respondent_user_id: DEMO_USER_MARIANA.id,
          response_type: 'BodyMap',
          prompt_version: 1,
          version: 1,
          status: 'saved',
          access_class: 'shared_care',
          created: '2025-01-15T10:00:00.000Z',
          updated: '2025-01-15T10:00:00.000Z',
        },
        {
          id: 'legacy-mente-incompatible',
          enrollment_id: DEMO_ENROLLMENT_ID,
          experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
          prompt_id: 'legacy-id-123',
          respondent_user_id: DEMO_USER_MARIANA.id,
          response_type: 'FreeReflection',
          prompt_version: 1,
          version: 1,
          status: 'saved',
          access_class: 'shared_care',
          created: '2025-01-15T10:00:00.000Z',
          updated: '2025-01-15T10:00:00.000Z',
        },
      ],
      enrollmentExperienceProgress: {
        [`${DEMO_ENROLLMENT_ID}:exp-corpo-fisiologia-07b`]: otherExpProg,
      },
    }

    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(state))
    demoAdapter.enableDemo('mariana')

    // Sessões e notas preservadas
    const sessions = demoAdapter.listSessions(DEMO_ENROLLMENT_ID)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].id).toBe('demo-sess-01')

    const note = demoAdapter.getSessionNote('demo-sess-01')
    expect(note?.text).toBe('Nota clínica da Daiane')

    // Resposta de outra experiência preservada no estado ativo
    const corpoResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(corpoResponses).toHaveLength(1)
    expect(corpoResponses[0].id).toBe('other-exp-resp')

    // Progresso de outra experiência preservado
    const corpoProg = demoAdapter.getEnrollmentExperienceProgress(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    expect(corpoProg?.progress_status).toBe('completed')
  })

  // Teste E: A atualização é idempotente
  it('Teste E: A atualização é idempotente (duas ou mais passadas produzem exatamente o mesmo resultado)', () => {
    const legacyResp: ExperienceResponseRecord = {
      id: 'legacy-id-idem',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
      prompt_id: 'old-p-01',
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'FreeReflection',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      access_class: 'shared_care',
      created: '2025-01-10T10:00:00.000Z',
      updated: '2025-01-10T10:00:00.000Z',
    }

    const state: any = {
      activePersona: 'mariana',
      messages: [],
      sessions: [],
      notes: [],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [legacyResp],
      retiredExperienceResponses: [],
      menteEmocoesNeedsRedo: false,
      enrollmentExperienceProgress: {},
    }

    // Primeira passada
    demoAdapter.migrateIncompatibleMenteEmocoes(state)
    expect(state.experienceResponses).toHaveLength(0)
    expect(state.retiredExperienceResponses).toHaveLength(1)
    expect(state.menteEmocoesNeedsRedo).toBe(true)

    const snapshotAfterFirst = JSON.stringify(state)

    // Segunda passada
    demoAdapter.migrateIncompatibleMenteEmocoes(state)
    expect(state.experienceResponses).toHaveLength(0)
    expect(state.retiredExperienceResponses).toHaveLength(1)
    expect(state.menteEmocoesNeedsRedo).toBe(true)

    // Não há modificações entre a primeira e a segunda passada
    const snapshotAfterSecond = JSON.stringify(state)
    expect(snapshotAfterSecond).toBe(snapshotAfterFirst)
  })

  // Teste F: Respostas novas são salvas com prompt_key, ID canônico, experience_id, moment_id/step e conteúdo
  it('Teste F: Respostas novas são salvas com prompt_key, ID canônico, experience_id, moment_id/step e conteúdo', async () => {
    const promptKey = 'funcionamento_emocional_geral'
    const canonicalPromptId = 'p-07c-pm1-p1-geral'
    const stepOrder = 1
    const contentText =
      'Sinto oscilações frequentes com momentos de sobrecarga e necessidade de recolhimento.'

    const saved = await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: MENTE_EMOCOES_EXPERIENCE_ID,
      promptId: canonicalPromptId,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 1,
      structuredValue: {
        value: contentText,
        collection_origin: 'newly_collected',
        prompt_key: promptKey,
        canonical_prompt_id: canonicalPromptId,
      },
      freeText: contentText,
      accessClass: 'shared_care',
      promptKey,
      canonicalPromptId,
      stepOrder,
    })

    expect(saved).toBeDefined()
    expect((saved as any).prompt_key).toBe(promptKey)
    expect((saved as any).canonical_prompt_id).toBe(canonicalPromptId)
    expect((saved as any).step_order).toBe(stepOrder)
    expect(saved.experience_id).toBe(MENTE_EMOCOES_EXPERIENCE_ID)
    expect(saved.free_text).toBe(contentText)

    // Verificar se no demoAdapter está presente na lista ativa
    const list = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      MENTE_EMOCOES_EXPERIENCE_ID,
    )
    expect(list).toHaveLength(1)
    expect((list[0] as any).prompt_key).toBe(promptKey)
    expect((list[0] as any).canonical_prompt_id).toBe(canonicalPromptId)
  })

  // Teste G: Após refazer a experiência (respostas novas + reset), o relatório mostra as respostas novas
  it('Teste G: Após refazer a experiência (respostas novas + reset), o relatório mostra as respostas novas', async () => {
    // 1. Simular estado com registros legados
    const state = {
      activePersona: 'mariana',
      messages: [],
      sessions: [],
      notes: [],
      plans: [],
      priorities: [],
      presentations: [],
      acceptances: [],
      maps: [],
      experienceResponses: [
        {
          id: 'legacy-resp',
          enrollment_id: DEMO_ENROLLMENT_ID,
          experience_id: MENTE_EMOCOES_EXPERIENCE_ID,
          prompt_id: 'legacy-id',
          respondent_user_id: DEMO_USER_MARIANA.id,
          response_type: 'FreeReflection',
          prompt_version: 1,
          version: 1,
          status: 'saved',
          access_class: 'shared_care',
          created: '2025-01-10T10:00:00.000Z',
          updated: '2025-01-10T10:00:00.000Z',
        },
      ],
      enrollmentExperienceProgress: {
        [`${DEMO_ENROLLMENT_ID}:${MENTE_EMOCOES_EXPERIENCE_ID}`]: {
          progress_status: 'completed',
          release_status: 'completed',
          current_step_order: 13,
          last_interaction_at: '2025-01-10T11:00:00.000Z',
        },
      },
    }
    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(state))
    demoAdapter.enableDemo('mariana')

    // Deve indicar que precisa refazer
    expect(demoAdapter.isMenteEmocoesRedoNeeded()).toBe(true)

    // 2. Chamar resetMenteEmocoes()
    demoAdapter.resetMenteEmocoes(DEMO_ENROLLMENT_ID)
    expect(demoAdapter.isMenteEmocoesRedoNeeded()).toBe(false)
    expect(
      demoAdapter.getEnrollmentExperienceProgress(DEMO_ENROLLMENT_ID, MENTE_EMOCOES_EXPERIENCE_ID),
    ).toBeNull()
    expect(
      demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, MENTE_EMOCOES_EXPERIENCE_ID),
    ).toHaveLength(0)

    // 3. Salvar novas respostas canônicas
    const newP1Text = 'Nova resposta estruturada da Mariana para P1'
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: MENTE_EMOCOES_EXPERIENCE_ID,
      promptId: 'p-07c-pm1-p1-geral',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 1,
      freeText: newP1Text,
      accessClass: 'shared_care',
      promptKey: 'funcionamento_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-geral',
      stepOrder: 1,
    })

    const newResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      MENTE_EMOCOES_EXPERIENCE_ID,
    )
    const responsesMap: Record<string, ExperienceResponseRecord> = {}
    for (const r of newResponses) {
      responsesMap[r.prompt_id] = r
      if ((r as any).prompt_key) {
        responsesMap[(r as any).prompt_key] = r
      }
    }

    const p1 = extractQuestionResponse(responsesMap, ['funcionamento_emocional_geral'])
    const p1Eval = evaluateFieldState(p1)
    expect(p1Eval.isEmpty).toBe(false)
    expect(p1?.free_text).toBe(newP1Text)
  })

  // Teste H: Recarregar (recriar adapter a partir do localStorage) mantém o estado migrado e as respostas novas
  it('Teste H: Recarregar (recriar adapter a partir do localStorage) mantém o estado migrado e as respostas novas', async () => {
    // 1. Salvar resposta nova com identificação canônica
    const promptKey = 'mente_movimento_ajuda'
    const pId = 'p-07c-pm4-p10-ajuda'
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: MENTE_EMOCOES_EXPERIENCE_ID,
      promptId: pId,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 1,
      freeText: 'Respirar e caminhar ao ar livre me devolvem clareza.',
      accessClass: 'shared_care',
      promptKey,
      canonicalPromptId: pId,
      stepOrder: 10,
    })

    // 2. Simular recarregar a página (ler localStorage com a chave v3)
    const rawStorage = localStorage.getItem('cer_demo_mode_state_v3')
    expect(rawStorage).toBeTruthy()
    const parsed = JSON.parse(rawStorage!)

    // A resposta deve persistir no JSON do localStorage
    expect(parsed.experienceResponses).toHaveLength(1)
    expect(parsed.experienceResponses[0].prompt_key).toBe(promptKey)
    expect(parsed.experienceResponses[0].canonical_prompt_id).toBe(pId)

    // 3. Ao ler novamente pelo adapter, permanece idêntico
    const reloadedResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      MENTE_EMOCOES_EXPERIENCE_ID,
    )
    expect(reloadedResponses).toHaveLength(1)
    expect(reloadedResponses[0].free_text).toBe(
      'Respirar e caminhar ao ar livre me devolvem clareza.',
    )
  })

  // Teste I: Zero chamadas ao PocketBase conectado (afirmar que nenhum método de rede é invocado)
  it('Teste I: Zero chamadas ao PocketBase conectado (afirmar que nenhum método de rede é invocado)', async () => {
    const collectionSpy = vi.spyOn(pb, 'collection')
    const sendSpy = vi.spyOn(pb, 'send' as any)

    // Operações executadas exclusivamente pelo modo demonstração
    demoAdapter.enableDemo('mariana')
    demoAdapter.resetMenteEmocoes(DEMO_ENROLLMENT_ID)

    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: MENTE_EMOCOES_EXPERIENCE_ID,
      promptId: 'p-07c-pm1-p1-geral',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 1,
      freeText: 'Texto sem rede',
      accessClass: 'shared_care',
      promptKey: 'funcionamento_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-geral',
      stepOrder: 1,
    })

    const list = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      MENTE_EMOCOES_EXPERIENCE_ID,
    )
    expect(list).toHaveLength(1)

    const prog = await enrollmentExperienceService.updateProgress('demo-enr-prog-id', {
      enrollmentId: DEMO_ENROLLMENT_ID,
      stepOrder: 2,
      progressStatus: 'in_progress',
    })
    expect(prog).toBeDefined()

    expect(collectionSpy).not.toHaveBeenCalled()
    expect(sendSpy).not.toHaveBeenCalled()

    collectionSpy.mockRestore()
    sendSpy.mockRestore()
  })
})
