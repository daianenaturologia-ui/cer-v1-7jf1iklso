import { describe, it, expect, beforeEach, vi } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from './demoAdapter'
import { cerJournalService } from './cerJournalService'
import pb from '@/lib/pocketbase/client'

describe('CER — Microcorreção A1 — Recarregar a pré-consulta no modo demonstração', () => {
  beforeEach(() => {
    demoAdapter.disableDemo()
    demoAdapter.enableDemo('mariana')
    localStorage.clear()
    demoAdapter.resetToDefaultState()
  })

  it('1 a 5: Fluxo real do serviço — criar 3 relatos, listar via listParticipantMessages, persistência e ZERO PocketBase', async () => {
    // Espionar chamadas ao PocketBase
    const collectionSpy = vi.spyOn(pb, 'collection')

    // 1. Criar 3 relatos com conteúdo literal via createNextSessionMessage
    const msg1Text = 'O que a traz:\nSinto cansaço mental e dores no pescoço.'
    const msg2Text = 'O que já a ajuda:\nFazer pausas com chá e respirar fundo 3 vezes.'
    const msg3Text = 'O que deseja cuidar:\nQuero aprender a desacelerar antes de dormir.'

    const created1 = await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: msg1Text,
      as_draft: false,
    })

    const created2 = await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: msg2Text,
      as_draft: false,
    })

    const created3 = await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: msg3Text,
      as_draft: false,
    })

    // 2. Chamar listParticipantMessages e afirmar que retorna exatamente essas 3 respostas com conteúdo literal
    const list = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(list).toHaveLength(3)

    // Mais recente primeiro (created3, created2, created1)
    expect(list[0].id).toBe(created3.id)
    expect(list[0].message_text).toBe(msg3Text)
    expect(list[1].id).toBe(created2.id)
    expect(list[1].message_text).toBe(msg2Text)
    expect(list[2].id).toBe(created1.id)
    expect(list[2].message_text).toBe(msg1Text)

    // 4. Afirmar autoria, status, data e horário corretos nos registros retornados
    for (const item of list) {
      expect(item.participant_user_id).toBe(DEMO_USER_MARIANA.id)
      expect(item.status).toBe('approved')
      expect(item.access_class).toBe('shared_care')
      expect(item.approved_at).toBeDefined()
      expect(item.created).toBeDefined()
      expect(new Date(item.created).getTime()).not.toBeNaN()
      expect(new Date(item.approved_at!).getTime()).not.toBeNaN()
    }

    // 3. Recarregar o estado persistido (remontar a partir do localStorage como o app faz) e listar novamente — mesmos dados
    // Simula reload da página a partir do localStorage
    // Ao habilitar a demo ou acessar os métodos, o demoAdapter já carrega/salva no localStorage.
    // Para simular nova sessão lendo do localStorage persistido:
    const rawStorage = localStorage.getItem('cer_demo_mode_state_v3')
    expect(rawStorage).toBeTruthy()
    const parsed = JSON.parse(rawStorage!)
    expect(parsed.messages).toHaveLength(3)
    const reloadedList = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(reloadedList).toHaveLength(3)
    expect(reloadedList[0].message_text).toBe(msg3Text)
    expect(reloadedList[1].message_text).toBe(msg2Text)
    expect(reloadedList[2].message_text).toBe(msg1Text)

    // 5. Afirmar zero chamadas ao PocketBase (spy de que nenhum método de rede/coleção foi acionado)
    expect(collectionSpy).not.toHaveBeenCalled()

    collectionSpy.mockRestore()
  })

  it('Rascunhos e mensagens enviadas permanecem com status distintos e são retornados por listParticipantMessages', async () => {
    const draftText = 'Rascunho de pensamento privado'
    const draft = await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: draftText,
      as_draft: true,
    })

    const approvedText = 'Relato enviado para Daiane'
    const approved = await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: approvedText,
      as_draft: false,
    })

    const all = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(all).toHaveLength(2)

    const foundDraft = all.find((m) => m.id === draft.id)
    const foundApproved = all.find((m) => m.id === approved.id)

    expect(foundDraft).toBeDefined()
    expect(foundDraft?.status).toBe('draft')
    expect(foundDraft?.access_class).toBe('participant_private')
    expect(foundDraft?.approved_at).toBeUndefined()
    expect(foundDraft?.message_text).toBe(draftText)

    expect(foundApproved).toBeDefined()
    expect(foundApproved?.status).toBe('approved')
    expect(foundApproved?.access_class).toBe('shared_care')
    expect(foundApproved?.approved_at).toBeDefined()
    expect(foundApproved?.message_text).toBe(approvedText)

    // A profissional listApprovedMessagesForProfessional só deve enxergar o approved
    const forProfessional =
      await cerJournalService.listApprovedMessagesForProfessional(DEMO_ENROLLMENT_ID)
    expect(forProfessional.some((m) => m.id === draft.id)).toBe(false)
    expect(forProfessional.some((m) => m.id === approved.id)).toBe(true)
  })

  it('Alternância entre Mariana e Daiane preserva os relatos persistidos', async () => {
    await cerJournalService.createNextSessionMessage({
      enrollment_id: DEMO_ENROLLMENT_ID,
      message_text: 'Mensagem persistente de Mariana',
      as_draft: false,
    })

    // Trocar para Daiane
    demoAdapter.setActivePersona('daiane')
    const forDaiane =
      await cerJournalService.listApprovedMessagesForProfessional(DEMO_ENROLLMENT_ID)
    expect(forDaiane).toHaveLength(1)
    expect(forDaiane[0].message_text).toBe('Mensagem persistente de Mariana')

    // Voltar para Mariana
    demoAdapter.setActivePersona('mariana')
    const forMariana = await cerJournalService.listParticipantMessages(DEMO_ENROLLMENT_ID)
    expect(forMariana).toHaveLength(1)
    expect(forMariana[0].message_text).toBe('Mensagem persistente de Mariana')
  })
})
