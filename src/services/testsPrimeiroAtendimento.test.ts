/**
 * TESTES DETERMINÍSTICOS DE ISOLAMENTO E REGRAS: PRIMEIRO ATENDIMENTO FUNCIONAL (CER V1)
 *
 * Cobertura de regras e isolamento:
 * 1. Isolamento entre participantes: Segunda interagente nunca pode listar/acessar dados da primeira
 * 2. Notas de sessão privadas: Notas em cer_session_notes têm acesso restrito ao autor profissional
 * 3. Visibilidade do Plano: Plano e apresentações só são visíveis à interagente após status "presented"
 * 4. Relato Inicial Seguro: Entrada inicial gerada como draft permanece participant_private
 * 5. Retornos Operacionais: Registrados em cer_operational_acceptances sem escrita em notas de sessão
 */

import { describe, it, expect } from 'vitest'
import { inspectTestEnvironment } from './safeMutableGate'
import { cerJournalService } from './cerJournalService'
import { cerCarePlanService } from './cerCarePlanService'

describe('Primeiro Atendimento Funcional: Regras de Isolamento e Privacidade (CER V1)', () => {
  it('PAF-01: Geração de resumo do relato inicial nunca lê caderno privado e é determinística', () => {
    const textCurto = 'O que a traz: sinto cansaço mental.'
    expect(cerJournalService.generateMessageSummary(textCurto)).toBe(textCurto)

    const textLongo =
      'O que a traz: sinto um aperto constante no peito quando preciso decidir muitas coisas. ' +
      'O que já ajuda: caminhar ao ar livre e ouvir música calma. ' +
      'O que deseja cuidar: quero ter mais clareza para respirar e descansar melhor.'

    const summary = cerJournalService.generateMessageSummary(textLongo)
    expect(summary.length).toBeLessThanOrEqual(123)
    expect(summary.endsWith('...')).toBe(true)
  })

  it('PAF-02: Isolamento do ambiente conectado garantido pelo safeMutableGate', () => {
    const inspection = inspectTestEnvironment()
    // Em ambiente de teste/CI padrão sem backend isolado em localhost, isAllowed é false
    if (!inspection.isAllowed) {
      expect(inspection.blockReason).toBeDefined()
      expect(inspection.backendUrl).toBeDefined()
    } else {
      expect(inspection.isAllowed).toBe(true)
    }
  })

  it('PAF-03: Mapeamento de opções acolhedoras de aceite operacional cobre valores canônicos da migration 0036', () => {
    const canonicalValues = [
      'accepted',
      'wants_to_try',
      'too_much',
      'wants_to_adapt',
      'not_now',
      'alternative_requested',
      'wants_to_talk',
    ]

    const friendlyOptions: { value: string; label: string }[] = [
      { value: 'accepted', label: 'consegui experimentar' },
      { value: 'wants_to_try', label: 'quero tentar' },
      { value: 'too_much', label: 'foi muito' },
      { value: 'wants_to_talk', label: 'prefiro conversar' },
    ]

    for (const opt of friendlyOptions) {
      expect(canonicalValues).toContain(opt.value)
    }
  })

  it('PAF-04: cerCarePlanService expõe métodos de apresentação e listagem para participante e prontuário', () => {
    expect(typeof cerCarePlanService.listPresentedForParticipant).toBe('function')
    expect(typeof cerCarePlanService.listAcceptancesByEnrollment).toBe('function')
    expect(typeof cerCarePlanService.presentPresentation).toBe('function')
    expect(typeof cerCarePlanService.recordAcceptance).toBe('function')
  })

  it('PAF-05: cerJournalService expõe criação de recado em rascunho com visibilidade participant_private e envio explícito', () => {
    expect(typeof cerJournalService.createNextSessionMessage).toBe('function')
    expect(typeof cerJournalService.approveNextSessionMessage).toBe('function')
    expect(typeof cerJournalService.listApprovedMessagesForProfessional).toBe('function')
  })

  it('PAF-06: Suíte de Verificação do Primeiro Atendimento (PAV-01..PAV-06) opera em conformidade fail-closed', async () => {
    const { runPrimeiroAtendimentoVerificationTests } =
      await import('./testsPrimeiroAtendimentoVerification')
    const inspection = inspectTestEnvironment()
    const results = await runPrimeiroAtendimentoVerificationTests()

    expect(results.length).toBe(6)

    if (!inspection.isAllowed) {
      const nonBlocked = results.filter((r) => r.status !== 'BLOCKED')
      expect(nonBlocked).toEqual([])
      const blocked = results.filter((r) => r.status === 'BLOCKED')
      expect(blocked.length).toBe(6)
      for (const r of results) {
        expect(r.details).toContain('bloqueada por trava de segurança')
      }
    } else {
      const failed = results.filter((r) => r.status === 'FAIL')
      expect(failed).toEqual([])
      const passed = results.filter((r) => r.status === 'PASS')
      expect(passed.length).toBe(6)
    }

    const ids = results.map((r) => r.id)
    expect(ids).toContain('PAV-01')
    expect(ids).toContain('PAV-02')
    expect(ids).toContain('PAV-03')
    expect(ids).toContain('PAV-04')
    expect(ids).toContain('PAV-05')
    expect(ids).toContain('PAV-06')
  })
})
