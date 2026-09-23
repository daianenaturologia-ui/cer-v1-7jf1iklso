import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_ARCHIVED_INCOMPATIBLE_KEY,
} from './demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from './experienceEngine'
import { cerJournalService } from './cerJournalService'
import {
  MindEmotionsReport,
  MSG_INDISPONIVEL,
  extractQuestionResponse,
} from '@/components/experience/MindEmotionsReport'
import { ExperienceEngine } from '@/components/experience/ExperienceEngine'
import pb from '@/lib/pocketbase/client'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('Estabilização dos Dados de Mente & Emoções no Modo Demonstração (Versão 0.0.120)', () => {
  beforeEach(() => {
    localStorage.clear()
    demoAdapter.disableDemo()
    demoAdapter.enableDemo('mariana')
    demoAdapter.resetToDefaultState()
  })

  // Teste A: Estado antigo sem prompt_key não alimenta o relatório
  it('A: Estado antigo sem prompt_key não alimenta o relatório (exibe Informação ainda não disponível)', () => {
    // Inserir registro antigo simulado (pré-0.0.118: sem prompt_key, com ID autogerado genérico)
    const legacyResponses = [
      {
        id: 'legacy-resp-1',
        prompt_id: 'auto-id-12345',
        enrollment_id: DEMO_ENROLLMENT_ID,
        experience_id: 'exp-mente-emocoes-07c',
        respondent_user_id: DEMO_USER_MARIANA.id,
        response_type: 'FreeReflection',
        access_class: 'shared_care',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        free_text: 'Texto antigo sem prompt_key',
        created: '2025-01-01T00:00:00.000Z',
        updated: '2025-01-01T00:00:00.000Z',
      } as ExperienceResponseRecord,
    ]

    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={legacyResponses} />)

    // O texto legado não deve aparecer no relatório
    expect(screen.queryByText('Texto antigo sem prompt_key')).toBeNull()

    // O relatório exibe "Informação ainda não disponível" para os campos
    const unavailableMessages = screen.getAllByText(MSG_INDISPONIVEL)
    expect(unavailableMessages.length).toBeGreaterThanOrEqual(1)
  })

  // Teste B: O registro antigo não é associado por suposição a nenhuma pergunta
  it('B: O registro antigo não é associado por suposição a nenhuma pergunta', () => {
    const legacyRecord: ExperienceResponseRecord = {
      id: 'legacy-resp-p1',
      prompt_id: 'auto-uuid-999',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'FreeReflection',
      access_class: 'shared_care',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      free_text: 'Sinto ansiedade nas segundas-feiras',
      created: '2025-01-01T00:00:00.000Z',
      updated: '2025-01-01T00:00:00.000Z',
    }

    // O resolvedor não deve associar esse registro a 'mundo_emocional_geral' nem a 'p-07c-pm1-p1-funcionamento-emocional'
    const resolvedP1 = extractQuestionResponse(
      [legacyRecord],
      ['p-07c-pm1-p1-funcionamento-emocional', 'mundo_emocional_geral', 'me_p1', 'p1'],
    )
    expect(resolvedP1).toBeUndefined()

    const resolvedP4 = extractQuestionResponse(
      [legacyRecord],
      ['p-07c-pm2-p4-pensamentos-associados', 'pensamento_associado', 'p4'],
    )
    expect(resolvedP4).toBeUndefined()
  })

  // Teste C: A pré-consulta permanece intacta
  it('C: A pré-consulta permanece intacta após a higienização do estado demo', async () => {
    // 1. Criar mensagens na pré-consulta
    const msg1 = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Pré-consulta: cansaço físico e dores musculares',
      as_draft: false,
    })
    const msg2 = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Pré-consulta: quero focar na respiração consciente',
      as_draft: false,
    })

    // 2. Simular injeção de registro legado incompatível no localStorage
    const rawState = localStorage.getItem('cer_demo_mode_state_v3')
    expect(rawState).toBeTruthy()
    const parsedState = JSON.parse(rawState!)
    parsedState.experienceResponses = [
      {
        id: 'legacy-mente-old',
        enrollment_id: DEMO_ENROLLMENT_ID,
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'generic-uuid-1',
        free_text: 'Texto incompatível',
      },
    ]
    localStorage.setItem('cer_demo_mode_state_v3', JSON.stringify(parsedState))

    // 3. Reinstanciar / higienizar chamando sanitização
    const sanitized = demoAdapter.sanitizeStateStore(parsedState)

    // 4. Afirmar que as mensagens da pré-consulta permanecem rigorosamente idênticas
    expect(sanitized.messages).toHaveLength(2)
    expect(sanitized.messages[0].message_text).toBe(
      'Pré-consulta: quero focar na respiração consciente',
    )
    expect(sanitized.messages[1].message_text).toBe(
      'Pré-consulta: cansaço físico e dores musculares',
    )

    const journalMsgs = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(journalMsgs).toHaveLength(2)
  })

  // Teste D: Dados das outras áreas permanecem intactos
  it('D: Dados das outras áreas (sessões, notas, planos, mapas e outras experiências) permanecem intactos', () => {
    // Criar dados em várias áreas
    const session = demoAdapter.createScheduledSession(DEMO_ENROLLMENT_ID, '2025-02-15T10:00:00Z')
    demoAdapter.createOrUpdateNote(session.id, 'Nota confidencial da sessão de alinhamento')
    const plan = demoAdapter.createDraftPlan({
      enrollment_id: DEMO_ENROLLMENT_ID,
      direction_mode: 'reused',
      direction_statement: 'Autonomia no ritmo diário',
    })
    demoAdapter.addPriority({
      plan_id: plan.id,
      title: 'Prioridade 1: Pausas regulares',
    })

    // Resposta de OUTRA experiência (Corpo e Fisiologia)
    const corpoResponse: ExperienceResponseRecord = {
      id: 'resp-corpo-1',
      enrollment_id: DEMO_ENROLLMENT_ID,
      experience_id: 'exp-corpo-fisiologia-07b',
      prompt_id: 'p-07b-pm1-p1-ritmo',
      prompt_key: 'ritmo_vital_geral',
      step_order: 1,
      respondent_user_id: DEMO_USER_MARIANA.id,
      response_type: 'ChoiceCards',
      access_class: 'shared_care',
      prompt_version: 1,
      version: 1,
      status: 'saved',
      structured_value: { choice: 'moderado' },
      created: '2025-01-10T00:00:00.000Z',
      updated: '2025-01-10T00:00:00.000Z',
    }

    // Injetar resposta de outra experiência + resposta legada incompatível de Mente
    const state = JSON.parse(localStorage.getItem('cer_demo_mode_state_v3')!)
    state.experienceResponses = [
      corpoResponse,
      {
        id: 'legacy-mente-incompatible',
        enrollment_id: DEMO_ENROLLMENT_ID,
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'some-random-id',
        free_text: 'incompativel sem prompt_key',
      },
    ]

    const sanitized = demoAdapter.sanitizeStateStore(state)

    // Apenas a resposta incompatível foi removida; corpoResponse permaneceu intacta
    expect(sanitized.experienceResponses).toHaveLength(1)
    expect(sanitized.experienceResponses[0].id).toBe('resp-corpo-1')
    expect(sanitized.experienceResponses[0].experience_id).toBe('exp-corpo-fisiologia-07b')

    // Sessões, notas e planos permanecem intactos
    expect(sanitized.sessions).toHaveLength(1)
    expect(sanitized.notes).toHaveLength(1)
    expect(sanitized.plans).toHaveLength(1)
    expect(sanitized.priorities).toHaveLength(1)
  })

  // Teste E: A atualização é idempotente (rodar duas vezes não muda nada)
  it('E: A atualização é idempotente (rodar duas vezes não muda nada)', () => {
    const rawState = {
      activePersona: 'mariana' as const,
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
          id: 'legacy-mente-incompatible-1',
          enrollment_id: DEMO_ENROLLMENT_ID,
          experience_id: 'exp-mente-emocoes-07c',
          prompt_id: 'bad-id',
          free_text: 'legado',
        } as any,
      ],
      enrollmentExperienceProgress: {},
    }

    // Rodada 1
    const pass1 = demoAdapter.sanitizeStateStore(rawState)
    expect(pass1.experienceResponses).toHaveLength(0)
    expect(pass1.incompatibleLegacyResponses).toHaveLength(1)
    const archivedJson1 = localStorage.getItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
    expect(archivedJson1).toBeTruthy()

    // Rodada 2 com o resultado da rodada 1
    const pass2 = demoAdapter.sanitizeStateStore(pass1)
    expect(pass2.experienceResponses).toHaveLength(0)
    expect(pass2.incompatibleLegacyResponses).toHaveLength(1)
    const archivedJson2 = localStorage.getItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
    expect(archivedJson2).toBe(archivedJson1)
  })

  // Teste F: Respostas novas são salvas com todos os identificadores canônicos
  it('F: Respostas novas são salvas com prompt_key, canonicalPromptId, stepOrder e conteúdo correto', async () => {
    const saved = await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-mente-emocoes-07c',
      promptId: 'p-07c-pm1-p1-funcionamento-emocional',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 2,
      structuredValue: { value: 'Reconheço rapidamente o que sinto.' },
      freeText: 'Reconheço rapidamente o que sinto.',
      accessClass: 'participant_shared',
      promptKey: 'mundo_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-funcionamento-emocional',
      stepOrder: 1,
    })

    expect(saved).toBeDefined()
    expect((saved as any).prompt_key).toBe('mundo_emocional_geral')
    expect((saved as any).canonical_prompt_id).toBe('p-07c-pm1-p1-funcionamento-emocional')
    expect((saved as any).step_order).toBe(1)
    expect(saved.experience_id).toBe('exp-mente-emocoes-07c')
    expect(saved.free_text).toBe('Reconheço rapidamente o que sinto.')

    // Verificar na lista persistida
    const list = demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, 'exp-mente-emocoes-07c')
    expect(list).toHaveLength(1)
    expect((list[0] as any).prompt_key).toBe('mundo_emocional_geral')
  })

  // Teste G: Após refazer a experiência, o relatório mostra as respostas novas
  it('G: Após refazer a experiência, o relatório mostra as respostas novas canonicamente identificadas', () => {
    const freshResponses = [
      {
        id: 'new-resp-p1',
        prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        prompt_key: 'mundo_emocional_geral',
        canonical_prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        step_order: 1,
        enrollment_id: DEMO_ENROLLMENT_ID,
        experience_id: 'exp-mente-emocoes-07c',
        respondent_user_id: DEMO_USER_MARIANA.id,
        response_type: 'FreeReflection',
        access_class: 'participant_shared',
        prompt_version: 2,
        version: 1,
        status: 'saved',
        free_text: 'Meu funcionamento é calmo e atento.',
        created: '2025-02-01T00:00:00.000Z',
        updated: '2025-02-01T00:00:00.000Z',
      } as ExperienceResponseRecord,
      {
        id: 'new-resp-p2',
        prompt_id: 'p-07c-pm1-p2-emocoes-presentes',
        prompt_key: 'emocoes_recorrentes',
        canonical_prompt_id: 'p-07c-pm1-p2-emocoes-presentes',
        step_order: 2,
        enrollment_id: DEMO_ENROLLMENT_ID,
        experience_id: 'exp-mente-emocoes-07c',
        respondent_user_id: DEMO_USER_MARIANA.id,
        response_type: 'MultiSelectCards',
        access_class: 'participant_shared',
        prompt_version: 2,
        version: 1,
        status: 'saved',
        structured_value: ['alegria', 'calma'],
        created: '2025-02-01T00:00:00.000Z',
        updated: '2025-02-01T00:00:00.000Z',
      } as ExperienceResponseRecord,
    ]

    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={freshResponses} />)

    // Respostas novas são perfeitamente consumidas pelo relatório
    expect(screen.getByText('Meu funcionamento é calmo e atento.')).toBeTruthy()
    expect(screen.getByText('Alegria')).toBeTruthy()
    expect(screen.getByText('Calma')).toBeTruthy()
  })

  // Teste H: Recarregar, sair e voltar mantém as respostas e o relatório
  it('H: Recarregar, sair e voltar mantém as respostas e o relatório', async () => {
    // 1. Salvar resposta nova de Mariana
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-mente-emocoes-07c',
      promptId: 'p-07c-pm1-p1-funcionamento-emocional',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 2,
      freeText: 'Texto persistente após reload',
      promptKey: 'mundo_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-funcionamento-emocional',
      stepOrder: 1,
    })

    // 2. Alternar para Daiane e voltar para Mariana (sair e voltar)
    demoAdapter.setActivePersona('daiane')
    expect(demoAdapter.getActivePersona()).toBe('daiane')

    demoAdapter.setActivePersona('mariana')
    expect(demoAdapter.getActivePersona()).toBe('mariana')

    // 3. Simular reload (ler diretamente do localStorage onde o demoAdapter persiste)
    const rawStorage = localStorage.getItem('cer_demo_mode_state_v3')
    expect(rawStorage).toBeTruthy()
    const parsed = JSON.parse(rawStorage!)
    expect(parsed.experienceResponses).toHaveLength(1)
    expect(parsed.experienceResponses[0].free_text).toBe('Texto persistente após reload')

    const responses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-mente-emocoes-07c',
    )
    expect(responses).toHaveLength(1)
    expect(responses[0].free_text).toBe('Texto persistente após reload')
  })

  // Teste I: Zero chamadas ao PocketBase conectado
  it('I: Zero chamadas ao PocketBase conectado em todo o fluxo', async () => {
    const pbCollectionSpy = vi.spyOn(pb, 'collection')

    // Operações realizadas via demoAdapter e experienceResponseService
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-mente-emocoes-07c',
      promptId: 'p-07c-pm1-p1-funcionamento-emocional',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 2,
      freeText: 'Verificação sem rede',
      promptKey: 'mundo_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-funcionamento-emocional',
      stepOrder: 1,
    })

    const list = await experienceResponseService.listResponsesByExperience(
      DEMO_ENROLLMENT_ID,
      'exp-mente-emocoes-07c',
    )
    expect(list).toHaveLength(1)

    // Resetar experiência
    demoAdapter.resetMenteEmocoesExperience(DEMO_ENROLLMENT_ID)
    const listAfterReset = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-mente-emocoes-07c',
    )
    expect(listAfterReset).toHaveLength(0)

    // Confirmar zero chamadas ao PocketBase
    expect(pbCollectionSpy).not.toHaveBeenCalled()
    pbCollectionSpy.mockRestore()
  })

  // Mensagem e Botão exatos na interface
  it('Banner exibe mensagem e botão com os textos literais exigidos', () => {
    const onRetakeMock = vi.fn()

    render(
      <MindEmotionsReport
        isOpen={true}
        onClose={() => {}}
        responses={[]}
        hasIncompatibleDemoData={true}
        onRetakeExperience={onRetakeMock}
      />,
    )

    // Texto EXATO exigido: "Esta demonstração foi atualizada. Para construir seu retrato com segurança, responda novamente à experiência Mente & Emoções."
    expect(
      screen.getByText(
        'Esta demonstração foi atualizada. Para construir seu retrato com segurança, responda novamente à experiência Mente & Emoções.',
      ),
    ).toBeTruthy()

    // Botão com texto EXATO: "Refazer Mente & Emoções"
    const retakeBtn = screen.getByRole('button', { name: /Refazer Mente & Emoções/i })
    expect(retakeBtn).toBeTruthy()

    fireEvent.click(retakeBtn)
    expect(onRetakeMock).toHaveBeenCalledTimes(1)
  })

  // Reinício de Mente & Emoções no ExperienceEngine limpa e retorna à introdução
  it('Refazer Mente & Emoções reinicia apenas a dimensão sem afetar outras áreas', async () => {
    // Preparar estado com mensagem na pré-consulta e resposta de Mente
    demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Mensagem de pré-consulta intacta',
    })

    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-mente-emocoes-07c',
      promptId: 'p-07c-pm1-p1-funcionamento-emocional',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'FreeReflection',
      promptVersion: 2,
      freeText: 'Resposta anterior',
      promptKey: 'mundo_emocional_geral',
      canonicalPromptId: 'p-07c-pm1-p1-funcionamento-emocional',
      stepOrder: 1,
    })

    expect(
      demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, 'exp-mente-emocoes-07c'),
    ).toHaveLength(1)

    // Executar reinício exclusivo
    demoAdapter.resetMenteEmocoesExperience(DEMO_ENROLLMENT_ID)

    // Respostas de Mente & Emoções limpas
    expect(
      demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID, 'exp-mente-emocoes-07c'),
    ).toHaveLength(0)

    // Pré-consulta intacta
    const msgs = demoAdapter.listMessages(DEMO_ENROLLMENT_ID)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].message_text).toBe('Mensagem de pré-consulta intacta')
  })
})
