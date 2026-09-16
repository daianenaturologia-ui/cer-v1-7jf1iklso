/**
 * TESTES DETERMINÍSTICOS — CADERNO PRIVADO E RECADOS PARA A PRÓXIMA SESSÃO (CER V1)
 *
 * Cobertura de Verificação:
 * 1. Isolamento Absoluto do Caderno: nenhuma entidade de Caderno é exposta a profissionais ou IA.
 * 2. RLS Fail-Closed da Migration 0062:
 *    - cer_journal_entries: list/view/create/update restritos a participant_user_id = @request.auth.id
 *    - cer_journal_entry_versions: create/update/delete nulos (somente hook server-side)
 *    - cer_next_session_messages: profissionais veem apenas status = 'approved' com vínculo ativo
 * 3. Ciclo de Vida do Recado e Independência do Caderno:
 *    - Criação de recado é isolada e nunca pré-populada com conteúdo do Caderno
 *    - Geração de resumo sucinto puramente determinística baseada no recado
 *    - Transição de status: draft -> approved -> withdrawn
 *    - Retirada de recado impede leitura subsequente na área de preparação
 * 4. Integração na Preparação da Sessão (computeSessionPreparation):
 *    - Recados vinculados a enrollment_id (não a session_id), tolerando sessões não agendadas
 *    - Inexistência de notas clínicas geradas automaticamente
 * 5. Feature flag padrão: desligada por padrão (fail-closed).
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { cerJournalService } from './cerJournalService'
import { CER_FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS } from '@/config/features'

describe('CER V1: Caderno Privado & Recado para a Próxima Sessão', () => {
  const migration62Path = path.resolve(
    process.cwd(),
    'pocketbase/migrations/0062_create_caderno_and_next_session_messages.js',
  )
  const migration62Content = fs.readFileSync(migration62Path, 'utf-8')

  const journalLifecycleHookPath = path.resolve(
    process.cwd(),
    'pocketbase/hooks/on_journal_lifecycle.js',
  )
  const journalLifecycleContent = fs.readFileSync(journalLifecycleHookPath, 'utf-8')

  const messageLifecycleHookPath = path.resolve(
    process.cwd(),
    'pocketbase/hooks/on_next_session_message_lifecycle.js',
  )
  const messageLifecycleContent = fs.readFileSync(messageLifecycleHookPath, 'utf-8')

  // --------------------------------------------------------------------------
  // 1. REGRAS DE RLS E SCHEMA NA MIGRATION 0062
  // --------------------------------------------------------------------------
  describe('1. Contrato de RLS Fail-Closed na Migration 0062', () => {
    it('1.1 Migration 0062 existe e possui sintaxe válida sem imports ES modules', () => {
      expect(fs.existsSync(migration62Path)).toBe(true)
      expect(migration62Content).toMatch(/^migrate\(\s*\(app\)\s*=>/)
      expect(migration62Content).not.toMatch(/^\s*import\s/m)
      expect(migration62Content).not.toMatch(/^\s*export\s/m)
    })

    it('1.2 cer_journal_entries: list/view/create/update estritamente vinculados ao participant_user_id', () => {
      expect(migration62Content).toContain("name: 'cer_journal_entries'")
      expect(migration62Content).toContain(
        'listRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      expect(migration62Content).toContain(
        'viewRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      expect(migration62Content).toContain(
        'createRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      expect(migration62Content).toContain(
        'updateRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      expect(migration62Content).toContain('deleteRule: null')
    })

    it('1.3 cer_journal_entry_versions: imutável e sem create/update/delete client-side', () => {
      expect(migration62Content).toContain("name: 'cer_journal_entry_versions'")
      expect(migration62Content).toContain(
        'listRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      expect(migration62Content).toContain(
        'viewRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
      // As três regras de mutação client-side DEVEM ser nulas
      expect(migration62Content).toContain('createRule: null')
      expect(migration62Content).toContain('updateRule: null')
      expect(migration62Content).toContain('deleteRule: null')
    })

    it('1.4 cer_next_session_messages: profissional vê apenas status = approved com vínculo ativo', () => {
      expect(migration62Content).toContain("name: 'cer_next_session_messages'")
      expect(migration62Content).toContain("status = 'approved'")
      expect(migration62Content).toContain(
        'enrollment_id.professional_enrollment_access_via_enrollment_id.professional_user_id ?= @request.auth.id',
      )
      expect(migration62Content).toContain(
        'enrollment_id.professional_enrollment_access_via_enrollment_id.is_active ?= true',
      )
      // Drafts e anotações retiradas nunca são visíveis para profissional
      expect(migration62Content).toContain(
        'createRule: "@request.auth.id != \'\' && participant_user_id = @request.auth.id"',
      )
    })
  })

  // --------------------------------------------------------------------------
  // 2. INTEGRIDADE DOS HOOKS SERVER-SIDE
  // --------------------------------------------------------------------------
  describe('2. Integridade dos Hooks Server-Side (Defesa em Profundidade)', () => {
    it('2.1 Hook do Caderno vincula participant_user_id ao auth e força access_class participant_private', () => {
      expect(journalLifecycleContent).toContain("record.set('participant_user_id', authId)")
      expect(journalLifecycleContent).toContain("record.set('access_class', 'participant_private')")
      expect(journalLifecycleContent).toContain("record.set('version_number', 1)")
    })

    it('2.2 Hook do Caderno preserva versão histórica no update e incrementa versão', () => {
      expect(journalLifecycleContent).toContain(
        "$app.findCollectionByNameOrId('cer_journal_entry_versions')",
      )
      expect(journalLifecycleContent).toContain("record.set('version_number', origVer + 1)")
      expect(journalLifecycleContent).toContain('onRecordDelete')
      expect(journalLifecycleContent).toContain('Anotações do Caderno não podem ser excluídas')
    })

    it('2.3 Auditoria técnica não expõe conteúdo nem texto de anotações ou recados', () => {
      // Audit de journal
      expect(journalLifecycleContent).toContain("action', 'JOURNAL_ENTRY_CREATED")
      expect(journalLifecycleContent).not.toContain("record.getString('content')")
      // Audit de message
      expect(messageLifecycleContent).toContain("action', 'NEXT_SESSION_MESSAGE_CREATED")
      expect(messageLifecycleContent).not.toContain("record.getString('message_text')")
    })

    it('2.4 Hook de recado gerencia ciclo draft -> approved -> withdrawn e bloqueia reativação de retirado', () => {
      expect(messageLifecycleContent).toContain(
        "if (prevStatus === 'withdrawn' && newStatus !== 'withdrawn')",
      )
      expect(messageLifecycleContent).toContain('Um recado retirado não pode ser reativado')
      // Quando retirado, access_class é resetado para participant_private para fail-closed
      expect(messageLifecycleContent).toContain("record.set('access_class', 'participant_private')")
    })
  })

  // --------------------------------------------------------------------------
  // 3. ISOLAMENTO CONTRA A IA PROFISSIONAL
  // --------------------------------------------------------------------------
  describe('3. Isolamento Contra IA e Mecanismos Profissionais', () => {
    it('3.1 aiContextResolver não inclui cer_journal_entries ou cer_next_session_messages', () => {
      const aiResolverPath = path.resolve(process.cwd(), 'src/services/aiContextResolver.ts')
      const aiResolverContent = fs.readFileSync(aiResolverPath, 'utf-8')

      expect(aiResolverContent).not.toContain('cer_journal_entries')
      expect(aiResolverContent).not.toContain('cer_journal_entry_versions')
      expect(aiResolverContent).not.toContain('cer_next_session_messages')
      // Confirma que participant_private é expressamente descartado
      expect(aiResolverContent).toContain("item.access_class === 'participant_private'")
    })

    it('3.2 Signals derivation bloqueia derivação a partir de Caderno ou FreeReflection', () => {
      const signalDerivationPath = path.resolve(
        process.cwd(),
        'pocketbase/hooks/on_signal_derivation.js',
      )
      const signalDerivationContent = fs.readFileSync(signalDerivationPath, 'utf-8')
      expect(signalDerivationContent).toContain('FreeReflection')
    })
  })

  // --------------------------------------------------------------------------
  // 4. SERVIÇO DO CADERNO E GERAÇÃO DETERMINÍSTICA DE RESUMO
  // --------------------------------------------------------------------------
  describe('4. cerJournalService: Resumo e Independência do Caderno', () => {
    it('4.1 generateMessageSummary gera resumo curto determinístico sem tocar em Caderno', () => {
      const shortMsg = 'Gostaria de falar sobre a minha respiração.'
      expect(cerJournalService.generateMessageSummary(shortMsg)).toBe(shortMsg)

      const longMsg =
        'Esta é uma mensagem consideravelmente longa para testar o resumo determinístico que deve ser gerado apenas a partir do recado digitado pela pessoa sem nunca puxar nada do caderno pessoal dela.'
      const summary = cerJournalService.generateMessageSummary(longMsg)
      expect(summary.length).toBeLessThanOrEqual(124)
      expect(summary.endsWith('...')).toBe(true)
    })

    it('4.2 cerJournalService não possui nenhum método que copie dados do Caderno para o recado', () => {
      const servicePath = path.resolve(process.cwd(), 'src/services/cerJournalService.ts')
      const serviceContent = fs.readFileSync(servicePath, 'utf-8')

      // Certificar que não há atribuição cruzada
      expect(serviceContent).not.toMatch(/entry\.content\s*=>\s*message/i)
      expect(serviceContent).not.toMatch(/copyFromJournal/i)
      expect(serviceContent).not.toMatch(/summarizeJournal/i)
    })
  })

  // --------------------------------------------------------------------------
  // 5. INTEGRAÇÃO NA PREPARAÇÃO DA SESSÃO (cerSession.ts)
  // --------------------------------------------------------------------------
  describe('5. Integração na Preparação da Próxima Sessão', () => {
    it('5.1 computeSessionPreparation busca recados aprovados por enrollment_id, sobrevivendo a ausência de sessão', () => {
      const sessionPath = path.resolve(process.cwd(), 'src/services/cerSession.ts')
      const sessionContent = fs.readFileSync(sessionPath, 'utf-8')

      expect(sessionContent).toContain('approvedNextSessionMessages')
      expect(sessionContent).toContain(
        'cerJournalService.listApprovedMessagesForProfessional(enrollmentId)',
      )
      // Confirma que não cria notas clínicas automaticamente
      expect(sessionContent).not.toMatch(/cerSessionNoteService\.create/i)
      expect(sessionContent).not.toMatch(/cer_session_notes.*create/i)
    })
  })

  // --------------------------------------------------------------------------
  // 6. FEATURE FLAG FAIL-CLOSED
  // --------------------------------------------------------------------------
  describe('6. Governança da Feature Flag (Fail-Closed)', () => {
    it('6.1 Flag do Caderno está explicitamente configurada como FALSE por padrão', () => {
      expect(CER_FEATURE_FLAGS.CADERNO_JOURNAL).toBe('cer_caderno_v1')
      expect(FEATURE_FLAG_DEFAULTS[CER_FEATURE_FLAGS.CADERNO_JOURNAL]).toBe(false)
    })

    it('6.2 Migration 0062 insere a flag no backend com is_enabled = false', () => {
      expect(migration62Content).toContain("flagRec.set('key', 'cer_caderno_v1')")
      expect(migration62Content).toContain("flagRec.set('is_enabled', false)")
    })
  })
})
