import { describe, it, expect, beforeEach } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA, DEMO_USER_DAIANE } from './demoAdapter'

describe('Correção do Modo Demonstração CER V1 (Limpeza de Sementes e Autoria Fiel)', () => {
  beforeEach(() => {
    demoAdapter.disableDemo()
    demoAdapter.enableDemo('mariana')
  })

  it('A1: Demonstração nova começa sem mensagens ou relatos fantasmas pré-atribuídos a Mariana', () => {
    const msgs = demoAdapter.listMessages(DEMO_ENROLLMENT_ID)
    expect(msgs).toEqual([])
  })

  it('A2: Demonstração nova começa sem acceptances (aceites de plano) pré-atribuídos', () => {
    const accs = demoAdapter.listAcceptancesByEnrollment(DEMO_ENROLLMENT_ID)
    expect(accs).toEqual([])
  })

  it('A3: Demonstração nova começa sem planos, prioridades ou apresentações pré-atribuídos', () => {
    const plans = demoAdapter.listPlans(DEMO_ENROLLMENT_ID)
    expect(plans).toEqual([])
    const presented = demoAdapter.listPresentedForParticipant(DEMO_ENROLLMENT_ID)
    expect(presented).toEqual([])
  })

  it('A4: Demonstração nova começa sem sessões, notas ou percepções fixas na preparação de sessão', () => {
    const sessions = demoAdapter.listSessions(DEMO_ENROLLMENT_ID)
    expect(sessions).toEqual([])
    const prep = demoAdapter.computeSessionPreparation(DEMO_ENROLLMENT_ID)
    expect(prep.lastCompletedSession).toBeUndefined()
    expect(prep.lastSessionNote).toBeUndefined()
    expect(prep.approvedNextSessionMessages).toEqual([])
    expect(prep.recentKnowledgeItems).toEqual([])
  })

  it('B: Migração de cache limpa as chaves antigas cer_demo_mode_state_v1 e v2 do localStorage', () => {
    localStorage.setItem('cer_demo_mode_state_v1', JSON.stringify({ stale: true }))
    localStorage.setItem('cer_demo_mode_state_v2', JSON.stringify({ stale: true }))
    demoAdapter.resetToDefaultState()
    expect(localStorage.getItem('cer_demo_mode_state_v1')).toBeNull()
    expect(localStorage.getItem('cer_demo_mode_state_v2')).toBeNull()
    expect(localStorage.getItem('cer_demo_mode_state_v3')).toBeTruthy()
  })

  it('C: createNextSessionMessage sem summary_text explícito não grava resumo conferido pelo participante', () => {
    const msg = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Mensagem integral sem resumo prévio da interagente',
    })

    expect(msg.summary_text).toBeUndefined()
    expect(msg.summary_source).toBeUndefined()
    expect(msg.participant_user_id).toBe(DEMO_USER_MARIANA.id)
    expect(msg.message_text).toBe('Mensagem integral sem resumo prévio da interagente')
  })

  it('C2: createNextSessionMessage com summary_text explícito preserva o resumo e indica a origem', () => {
    const msg = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Texto completo do relato com conferência explícita',
      summary_text: 'Resumo validado por Mariana',
      summary_source: 'participant',
    })

    expect(msg.summary_text).toBe('Resumo validado por Mariana')
    expect(msg.summary_source).toBe('participant')
  })

  it('E: Mariana envia 3 respostas consecutivas -> Daiane enxerga exatamente as 3 com autoria correta e persistência', () => {
    const resp1 = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Resposta 1: Relato sobre respiração ao entardecer',
    })
    const resp2 = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Resposta 2: Relato sobre caminhada matinal de 15 minutos',
    })
    const resp3 = demoAdapter.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Resposta 3: Percepção de melhora na transição do sono',
    })

    // Trocar de persona para Daiane (Profissional)
    demoAdapter.setActivePersona('daiane')
    expect(demoAdapter.getActivePersona()).toBe('daiane')
    expect(demoAdapter.getCurrentUser().id).toBe(DEMO_USER_DAIANE.id)

    // Daiane consulta a preparação da sessão
    const prep = demoAdapter.computeSessionPreparation(DEMO_ENROLLMENT_ID)
    const approvedMsgs = prep.approvedNextSessionMessages || []

    expect(approvedMsgs).toHaveLength(3)
    expect(approvedMsgs.map((m) => m.id)).toEqual([resp3.id, resp2.id, resp1.id])
    approvedMsgs.forEach((m) => {
      expect(m.participant_user_id).toBe(DEMO_USER_MARIANA.id)
    })

    // Nenhum relato fantasma ('demo-msg-seed-1') presente
    expect(approvedMsgs.some((m) => m.id === 'demo-msg-seed-1')).toBe(false)
    expect(
      approvedMsgs.some((m) => m.message_text.includes('Sinto cansaço ao final da tarde')),
    ).toBe(false)

    // Simula reload da página através de nova instância lendo o localStorage v2
    const reloadedList = demoAdapter.listMessages(DEMO_ENROLLMENT_ID, true)
    expect(reloadedList).toHaveLength(3)
    expect(reloadedList.map((m) => m.message_text)).toEqual([
      'Resposta 3: Percepção de melhora na transição do sono',
      'Resposta 2: Relato sobre caminhada matinal de 15 minutos',
      'Resposta 1: Relato sobre respiração ao entardecer',
    ])
  })

  it('F: Normalização de experienceId para chave de dimensão mente_emocoes e persistência demo local', async () => {
    const {
      resolveExperienceId,
      experienceCatalogService,
      enrollmentExperienceService,
      experienceResponseService,
    } = await import('./experienceEngine')

    // 1. Normalização do ID canônico
    expect(resolveExperienceId('mente_emocoes')).toBe('exp-mente-emocoes-07c')
    expect(resolveExperienceId('dim-mente_emocoes')).toBe('exp-mente-emocoes-07c')
    expect(resolveExperienceId('demo-enr-exp-exp-mente-emocoes-07c')).toBe('exp-mente-emocoes-07c')

    // 2. Catálogo carrega sem erro usando chave de dimensão mente_emocoes
    const exp = await experienceCatalogService.getExperienceById('mente_emocoes')
    expect(exp.id).toBe('exp-mente-emocoes-07c')
    expect(exp.title).toContain('Mente & Emoções')

    const moments = await experienceCatalogService.listMomentsByExperience('mente_emocoes')
    expect(moments).toHaveLength(5)

    const prompts = await experienceCatalogService.listPromptsByExperience('mente_emocoes')
    expect(prompts.length).toBeGreaterThan(0)

    // 3. Atualizar progresso e verificar persistência sem chamar PocketBase
    const updated = await enrollmentExperienceService.updateProgress(
      'demo-enr-exp-exp-mente-emocoes-07c',
      {
        progressStatus: 'in_progress',
        stepOrder: 2,
      },
    )
    expect(updated.progress_status).toBe('in_progress')
    expect(updated.current_step_order).toBe(2)

    // 4. Salvar resposta demo
    const resp = await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'mente_emocoes',
      promptId: prompts[0].id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: prompts[0].component_type,
      promptVersion: prompts[0].version,
      structuredValue: { value: 'teste' },
      freeText: 'Rascunho de teste',
    })
    expect(resp.prompt_id).toBe(prompts[0].id)
    expect(resp.free_text).toBe('Rascunho de teste')

    // 5. Retomar lista pelo enrollment e confirmar que o status persistiu
    const list = await enrollmentExperienceService.listByEnrollment(DEMO_ENROLLMENT_ID)
    const menteItem = list.find((e) => e.experience_id === 'exp-mente-emocoes-07c')
    expect(menteItem?.progress_status).toBe('in_progress')
    expect(menteItem?.current_step_order).toBe(2)
  })
})
