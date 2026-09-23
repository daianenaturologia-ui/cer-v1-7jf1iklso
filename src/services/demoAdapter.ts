/**
 * ADAPTADOR DE DEMONSTRAÇÃO (CER V1 DEMO MODE)
 *
 * Objetivo:
 * Permitir a demonstração completa e navegável do percurso do Método CER com ZERO chamadas de rede
 * ao backend PocketBase conectado (sem requisições HTTP, sem falhas de login 400/404, sem mutação no live DB).
 *
 * Personas e Contas Fictícias:
 * 1. Daiane (Profissional) -> daiane@cer.local
 * 2. Mariana Silva (Interagente) -> mariana@cer.local
 * Enrollment canônico de demonstração: demo-enr-01
 *
 * Persistência:
 * - Em memória com sincronização em localStorage para sobreviver a recarregamentos de página (F5).
 * - Função clara de reset/sair que limpa completamente o armazenamento.
 */

import type {
  CerCarePlanRecord,
  CerCarePlanPriorityRecord,
  CerCarePlanPresentationRecord,
  CerOperationalAcceptanceRecord,
  CerNextSessionMessageRecord,
  CerSessionRecord,
  CerSessionNoteRecord,
  CerMapRecord,
  CerMapItemRecord,
  CerMapItemSourceRecord,
  ExperienceResponseRecord,
  ExperienceProgressStatus,
  ExperienceReleaseStatus,
  EnrollmentRecord,
  PersonRecord,
  CerProductRecord,
  JourneyStateRecord,
  SessionPreparationData,
} from '@/types/cer'
import { BUILD_07C_MENTE_PROMPTS } from './build07cPrompts'

export interface DemoUserAccount {
  id: string
  email: string
  name: string
  role: 'profissional' | 'interagente'
  person_id: string
  status: 'active'
}

export const DEMO_ENROLLMENT_ID = 'demo-enr-01'

export const DEMO_PERSON_DAIANE: PersonRecord = {
  id: 'demo-person-daiane',
  full_name: 'Daiane Terapeuta',
  preferred_name: 'Daiane',
  email: 'daiane@cer.local',
  notes: 'Profissional responsável pelo acompanhamento',
  created: '2025-01-01T10:00:00.000Z',
  updated: '2025-01-01T10:00:00.000Z',
}

export const DEMO_PERSON_MARIANA: PersonRecord = {
  id: 'demo-person-mariana',
  full_name: 'Mariana Silva',
  preferred_name: 'Mariana',
  treatment_preference: 'feminino',
  email: 'mariana@cer.local',
  notes: 'Interagente em acompanhamento integral no método CER',
  created: '2025-01-10T10:00:00.000Z',
  updated: '2025-01-10T10:00:00.000Z',
}

export const DEMO_USER_DAIANE: DemoUserAccount = {
  id: 'demo-user-daiane',
  email: 'daiane@cer.local',
  name: 'Daiane',
  role: 'profissional',
  person_id: DEMO_PERSON_DAIANE.id,
  status: 'active',
}

export const DEMO_USER_MARIANA: DemoUserAccount = {
  id: 'demo-user-mariana',
  email: 'mariana@cer.local',
  name: 'Mariana Silva',
  role: 'interagente',
  person_id: DEMO_PERSON_MARIANA.id,
  status: 'active',
}

export const DEMO_PRODUCT: CerProductRecord = {
  id: 'demo-product-01',
  code: 'cer_individual',
  name: 'Acompanhamento Individual CER',
  description: 'Percurso de desenvolvimento humano e regulação integrativa',
  is_active: true,
  created: '2025-01-01T10:00:00.000Z',
  updated: '2025-01-01T10:00:00.000Z',
}

export const DEMO_JOURNEY_STATE: JourneyStateRecord = {
  id: 'demo-journey-01',
  enrollment_id: DEMO_ENROLLMENT_ID,
  current_stage: 'consciousness',
  stage_status: 'em_andamento',
  metadata: {
    onboarding_completed: true,
  },
  created: '2025-01-10T10:00:00.000Z',
  updated: '2025-01-10T10:00:00.000Z',
}

export const DEMO_ENROLLMENT: EnrollmentRecord = {
  id: DEMO_ENROLLMENT_ID,
  person_id: DEMO_PERSON_MARIANA.id,
  product_id: DEMO_PRODUCT.id,
  status: 'active',
  notes: 'Matrícula de demonstração guiada',
  created: '2025-01-10T10:00:00.000Z',
  updated: '2025-01-10T10:00:00.000Z',
  expand: {
    person_id: DEMO_PERSON_MARIANA,
    product_id: DEMO_PRODUCT,
    journey_states_via_enrollment_id: [DEMO_JOURNEY_STATE],
  },
}

interface DemoStateStore {
  activePersona: 'mariana' | 'daiane'
  marianaPersonOverride?: Partial<PersonRecord>
  messages: (CerNextSessionMessageRecord & { summary_source?: 'participant' | 'system' })[]
  sessions: CerSessionRecord[]
  maps: (CerMapRecord & { items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[] })[]
  notes: CerSessionNoteRecord[]
  plans: CerCarePlanRecord[]
  priorities: CerCarePlanPriorityRecord[]
  presentations: CerCarePlanPresentationRecord[]
  acceptances: CerOperationalAcceptanceRecord[]
  experienceResponses: ExperienceResponseRecord[]
  retiredExperienceResponses?: (ExperienceResponseRecord & {
    retired_reason?: string
    retired_at?: string
  })[]
  menteEmocoesNeedsRedo?: boolean
  menteEmocoesMigrationMeta?: {
    migrated_at: string
    retired_count: number
  }
  enrollmentExperienceProgress?: Record<
    string,
    {
      progress_status: ExperienceProgressStatus
      release_status: ExperienceReleaseStatus
      current_step_order: number
      started_at?: string
      completed_at?: string
      last_interaction_at: string
    }
  >
  incompatibleLegacyResponses?: ExperienceResponseRecord[]
}

const STORAGE_KEY = 'cer_demo_mode_state_v3'
const LEGACY_STORAGE_KEY_V1 = 'cer_demo_mode_state_v1'
const LEGACY_STORAGE_KEY_V2 = 'cer_demo_mode_state_v2'
export const DEMO_ARCHIVED_INCOMPATIBLE_KEY = 'cer_demo_incompatible_archive_v1'
export const MENTE_EMOCOES_EXPERIENCE_ID = 'exp-mente-emocoes-07c'

function getInitialState(): DemoStateStore {
  return {
    activePersona: 'mariana',
    messages: [],
    sessions: [],
    notes: [],
    plans: [],
    priorities: [],
    presentations: [],
    acceptances: [],
    maps: [],
    experienceResponses: [],
    retiredExperienceResponses: [],
    menteEmocoesNeedsRedo: false,
    enrollmentExperienceProgress: {},
    incompatibleLegacyResponses: [],
  }
}

class DemoAdapter {
  private state: DemoStateStore
  private isDemoEnabled: boolean = false
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.state = this.loadState()
    this.isDemoEnabled = localStorage.getItem('cer_demo_mode_active') === 'true'
  }

  /**
   * Higienização idempotente de ocorrências legadas visíveis de `$Daiane` -> `Daiane` e `$Daia` -> `Daia`.
   * Restrita a textos visíveis, sem alterar IDs, chaves técnicas ou respostas da interagente,
   * sem apagar o estado, e sem mudar textos que já estejam corretos.
   */
  public sanitizeLegacyDaianeText(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') return ''
    if (!text.includes('$Daiane') && !text.includes('$Daia')) return text
    return text.replaceAll('$Daiane', 'Daiane').replaceAll('$Daia', 'Daia')
  }

  public sanitizeVisibleDemoStore(store: DemoStateStore): DemoStateStore {
    if (!store) return store

    // Higienizar mensagens (textos visíveis: message_text, summary_text)
    if (Array.isArray(store.messages)) {
      for (const m of store.messages) {
        if (m.message_text) m.message_text = this.sanitizeLegacyDaianeText(m.message_text)
        if (m.summary_text) m.summary_text = this.sanitizeLegacyDaianeText(m.summary_text)
      }
    }

    // Higienizar sessões (title, summary, notes)
    if (Array.isArray(store.sessions)) {
      for (const s of store.sessions) {
        if (s.title) s.title = this.sanitizeLegacyDaianeText(s.title)
        if (s.summary) s.summary = this.sanitizeLegacyDaianeText(s.summary)
        if (s.notes) s.notes = this.sanitizeLegacyDaianeText(s.notes)
      }
    }

    // Higienizar anotações de sessão (text, synthesis_text)
    if (Array.isArray(store.notes)) {
      for (const n of store.notes) {
        if (n.text) n.text = this.sanitizeLegacyDaianeText(n.text)
        if (n.synthesis_text) n.synthesis_text = this.sanitizeLegacyDaianeText(n.synthesis_text)
      }
    }

    // Higienizar planos de cuidado (title, goal, notes)
    if (Array.isArray(store.plans)) {
      for (const p of store.plans) {
        if (p.title) p.title = this.sanitizeLegacyDaianeText(p.title)
        if (p.goal) p.goal = this.sanitizeLegacyDaianeText(p.goal)
        if (p.notes) p.notes = this.sanitizeLegacyDaianeText(p.notes)
      }
    }

    // Higienizar prioridades de plano de cuidado (label, description)
    if (Array.isArray(store.priorities)) {
      for (const pr of store.priorities) {
        if (pr.label) pr.label = this.sanitizeLegacyDaianeText(pr.label)
        if (pr.description) pr.description = this.sanitizeLegacyDaianeText(pr.description)
      }
    }

    // Higienizar apresentações (presentation_notes, participant_view_content)
    if (Array.isArray(store.presentations)) {
      for (const pres of store.presentations) {
        if (pres.presentation_notes)
          pres.presentation_notes = this.sanitizeLegacyDaianeText(pres.presentation_notes)
        if (pres.participant_view_content)
          pres.participant_view_content = this.sanitizeLegacyDaianeText(
            pres.participant_view_content,
          )
      }
    }

    // Higienizar acceptances (participant_notes)
    if (Array.isArray(store.acceptances)) {
      for (const acc of store.acceptances) {
        if (acc.participant_notes)
          acc.participant_notes = this.sanitizeLegacyDaianeText(acc.participant_notes)
      }
    }

    // Higienizar mapas (title, notes) e seus itens (title, description, notes)
    if (Array.isArray(store.maps)) {
      for (const map of store.maps) {
        if (map.title) map.title = this.sanitizeLegacyDaianeText(map.title)
        if (map.notes) map.notes = this.sanitizeLegacyDaianeText(map.notes)
        if (Array.isArray(map.items)) {
          for (const item of map.items) {
            if (item.title) item.title = this.sanitizeLegacyDaianeText(item.title)
            if (item.description) item.description = this.sanitizeLegacyDaianeText(item.description)
            if (item.notes) item.notes = this.sanitizeLegacyDaianeText(item.notes)
          }
        }
      }
    }

    // Higienizar marianaPersonOverride se houver campos de nome com prefixo incorreto
    if (store.marianaPersonOverride) {
      if (store.marianaPersonOverride.full_name) {
        store.marianaPersonOverride.full_name = this.sanitizeLegacyDaianeText(
          store.marianaPersonOverride.full_name,
        )
      }
      if (store.marianaPersonOverride.preferred_name) {
        store.marianaPersonOverride.preferred_name = this.sanitizeLegacyDaianeText(
          store.marianaPersonOverride.preferred_name,
        )
      }
      if (store.marianaPersonOverride.notes) {
        store.marianaPersonOverride.notes = this.sanitizeLegacyDaianeText(
          store.marianaPersonOverride.notes,
        )
      }
    }

    return store
  }

  private loadState(): DemoStateStore {
    try {
      // Remoção explícita dos caches legados para evitar contaminação por sementes antigas
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)

      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: DemoStateStore = JSON.parse(raw)
        const sanitized = this.sanitizeVisibleDemoStore(parsed)
        const migrated = this.migrateIncompatibleMenteEmocoes(sanitized)
        return migrated
      }
    } catch (e) {
      console.warn('Falha ao restaurar estado de demonstração:', e)
    }
    return getInitialState()
  }

  /**
   * Migração versionada e idempotente:
   * Para cada registro em `experienceResponses` cujo `experience_id` seja `exp-mente-emocoes-07c`
   * E que não possua `prompt_key` E não possua `canonical_prompt_id`, move de `experienceResponses`
   * para `retiredExperienceResponses`, anotando motivo técnico:
   * `retired_reason: 'missing_canonical_identification'`.
   * Define `menteEmocoesNeedsRedo = true` quando pelo menos um registro for retirado.
   * Totalmente idempotente.
   * NÃO toca em messages, sessions, notes, plans, priorities, presentations, acceptances, maps,
   * marianaPersonOverride ou enrollmentExperienceProgress de outras experiências.
   */
  public migrateIncompatibleMenteEmocoes(store: DemoStateStore): DemoStateStore {
    if (!Array.isArray(store.experienceResponses)) {
      store.experienceResponses = []
      return store
    }

    if (!Array.isArray(store.retiredExperienceResponses)) {
      store.retiredExperienceResponses = []
    }

    const activeResponses: ExperienceResponseRecord[] = []
    const toRetire: (ExperienceResponseRecord & {
      retired_reason?: string
      retired_at?: string
    })[] = []

    for (const r of store.experienceResponses) {
      const isMente =
        r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID ||
        r.experience_id === 'mente_emocoes' ||
        r.experience_id === 'mente_emocoes_cer'
      const rAny = r as any
      const sMeta =
        r.structured_value && typeof r.structured_value === 'object'
          ? (r.structured_value as Record<string, any>).metadata
          : undefined
      const hasPromptKey = Boolean(rAny.prompt_key || sMeta?.prompt_key)
      const hasCanonicalPromptId = Boolean(rAny.canonical_prompt_id || sMeta?.canonical_prompt_id)

      if (isMente && !hasPromptKey && !hasCanonicalPromptId) {
        toRetire.push({
          ...r,
          retired_reason: 'missing_canonical_identification',
          retired_at: new Date().toISOString(),
        })
      } else {
        activeResponses.push(r)
      }
    }

    if (toRetire.length > 0) {
      store.experienceResponses = activeResponses
      store.retiredExperienceResponses = [...(store.retiredExperienceResponses || []), ...toRetire]
      store.menteEmocoesNeedsRedo = true
      store.menteEmocoesMigrationMeta = {
        migrated_at: new Date().toISOString(),
        retired_count: (store.menteEmocoesMigrationMeta?.retired_count || 0) + toRetire.length,
      }

      // Regra 6 e 7: Se uma migração arquivar respostas incompatíveis, o progresso antigo
      // NÃO pode continuar como `completed`. Falha fechado: remove status completed!
      if (store.enrollmentExperienceProgress) {
        for (const expKey of [
          `${DEMO_ENROLLMENT_ID}:${MENTE_EMOCOES_EXPERIENCE_ID}`,
          `${DEMO_ENROLLMENT_ID}:mente_emocoes`,
          `${DEMO_ENROLLMENT_ID}:mente_emocoes_cer`,
        ]) {
          const prog = store.enrollmentExperienceProgress[expKey]
          if (
            prog &&
            (prog.progress_status === 'completed' || prog.release_status === 'completed')
          ) {
            prog.progress_status = 'in_progress'
            prog.release_status = 'in_progress'
            delete prog.completed_at
          }
        }
      }

      // Salva também no arquivo técnico separado DEMO_ARCHIVED_INCOMPATIBLE_KEY
      try {
        let existingArchived: ExperienceResponseRecord[] = []
        const rawArchived = localStorage.getItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
        if (rawArchived) {
          existingArchived = JSON.parse(rawArchived)
        }
        const combined = [...existingArchived]
        for (const inc of toRetire) {
          if (!combined.some((x) => x.id === inc.id)) {
            combined.push(inc)
          }
        }
        localStorage.setItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY, JSON.stringify(combined))
      } catch (err) {
        console.warn('Erro ao arquivar registros incompatíveis:', err)
      }

      // Persistir o estado migrado no localStorage de forma limpa e idempotente
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      } catch {
        /* ignore */
      }
    }

    // Regra B: Verificação Canônica de Coerência do status completed
    // Se o progresso indicar completed, mas as obrigatórias canônicas não estiverem cobertas
    // (ex.: após arquivamento ou respostas incompatíveis/ausentes), falhar fechado imediatamente.
    if (store.enrollmentExperienceProgress) {
      for (const expKey of [
        `${DEMO_ENROLLMENT_ID}:${MENTE_EMOCOES_EXPERIENCE_ID}`,
        `${DEMO_ENROLLMENT_ID}:mente_emocoes`,
        `${DEMO_ENROLLMENT_ID}:mente_emocoes_cer`,
      ]) {
        const prog = store.enrollmentExperienceProgress[expKey]
        if (prog && (prog.progress_status === 'completed' || prog.release_status === 'completed')) {
          // Checar cobertura usando o store atual
          const requiredCanonicalKeys = [
            'mundo_emocional_geral',
            'emocoes_recorrentes',
            'compreensao_despertar_emocoes',
            'pensamento_associado',
            'comportamento_associado',
            'self_dialogue_erro',
            'movimentos_automaticos_frequencia_p1',
            'movimentos_automaticos_frequencia_p2',
            'movimentos_interferencia_atual',
            'situacoes_ativacao_movimentos',
            'dois_retratos_espaco',
            'dois_retratos_sobrecarga',
            'recursos_recuperar_espaco',
          ]
          const menteResponses = store.experienceResponses.filter(
            (r) =>
              r.enrollment_id === DEMO_ENROLLMENT_ID &&
              (r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID ||
                r.experience_id === 'mente_emocoes' ||
                r.experience_id === 'mente_emocoes_cer'),
          )
          const allRequiredPresent = requiredCanonicalKeys.every((rk) => {
            return menteResponses.some((r) => {
              const rAny = r as any
              const sMeta =
                r.structured_value && typeof r.structured_value === 'object'
                  ? (r.structured_value as any).metadata
                  : undefined
              const keyMatches = rAny.prompt_key === rk || sMeta?.prompt_key === rk
              if (!keyMatches) return false
              const sVal = r.structured_value as any
              if (
                sVal?.is_legitimate_skip ||
                sVal?.metadata?.is_legitimate_skip ||
                sVal?.skip_reason ||
                r.response_type === ('prefiro_nao_responder' as any) ||
                r.response_type === ('nao_sei' as any)
              ) {
                return true
              }
              if (typeof r.free_text === 'string' && r.free_text.trim().length > 0) return true
              if (sVal !== undefined && sVal !== null) {
                if (typeof sVal === 'string' && sVal.trim().length > 0) return true
                if (typeof sVal === 'number') return true
                if (Array.isArray(sVal) && sVal.length > 0) return true
                if (typeof sVal === 'object') {
                  const keys = Object.keys(sVal).filter(
                    (k) =>
                      k !== 'metadata' &&
                      k !== 'collection_origin' &&
                      k !== 'naming_origin' &&
                      Boolean(sVal[k]),
                  )
                  if (keys.length > 0) return true
                }
              }
              return false
            })
          })

          if (!allRequiredPresent) {
            prog.progress_status = 'in_progress'
            prog.release_status = 'in_progress'
            delete prog.completed_at
            store.menteEmocoesNeedsRedo = true
          }
        }
      }
    }

    return store
  }

  private saveState(): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
      localStorage.setItem('cer_demo_mode_active', this.isDemoEnabled ? 'true' : 'false')
      this.notify()
    } catch (e) {
      console.warn('Falha ao persistir estado de demonstração:', e)
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (err) {
        console.error('Erro em listener do DemoAdapter:', err)
      }
    }
  }

  public isEnabled(): boolean {
    return this.isDemoEnabled
  }

  public enableDemo(persona: 'mariana' | 'daiane' = 'mariana'): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)
    } catch {
      /* ignore */
    }
    this.isDemoEnabled = true
    this.state.activePersona = persona
    this.migrateIncompatibleMenteEmocoes(this.state)
    this.saveState()
  }

  public disableDemo(): void {
    this.isDemoEnabled = false
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)
      localStorage.removeItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
      localStorage.removeItem('cer_demo_mode_active')
    } catch {
      /* ignore */
    }
    this.state = getInitialState()
    this.notify()
  }

  public resetToDefaultState(): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)
    } catch {
      /* ignore */
    }
    this.state = getInitialState()
    this.saveState()
  }

  /**
   * Verifica se há registros legados incompatíveis arquivados ou detectados para Mente & Emoções.
   */
  public hasIncompatibleMenteEmocoesDemo(): boolean {
    if (
      this.state.incompatibleLegacyResponses &&
      this.state.incompatibleLegacyResponses.length > 0
    ) {
      return true
    }
    try {
      const archived = localStorage.getItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
      if (archived) {
        const parsed = JSON.parse(archived)
        return Array.isArray(parsed) && parsed.length > 0
      }
    } catch {
      /* ignore */
    }
    return false
  }

  /**
   * Reinicia SOMENTE as experienceResponses de exp-mente-emocoes-07c (ativas e arquivadas dessa experiência)
   * e a entrada correspondente de enrollmentExperienceProgress (chave `${DEMO_ENROLLMENT_ID}:exp-mente-emocoes-07c`),
   * limpa menteEmocoesNeedsRedo, e mantém TODO o resto intacto (messages, sessions, notes, plans, priorities,
   * presentations, acceptances, maps, marianaPersonOverride, outras experiências).
   */
  public resetMenteEmocoes(enrollmentId: string = DEMO_ENROLLMENT_ID): void {
    this.state.experienceResponses = this.state.experienceResponses.filter((r) => {
      const isMente =
        r.enrollment_id === enrollmentId &&
        (r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID ||
          r.experience_id === 'mente_emocoes' ||
          r.experience_id === 'mente_emocoes_cer')
      return !isMente
    })

    if (Array.isArray(this.state.retiredExperienceResponses)) {
      this.state.retiredExperienceResponses = this.state.retiredExperienceResponses.filter((r) => {
        const isMente =
          r.enrollment_id === enrollmentId &&
          (r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID ||
            r.experience_id === 'mente_emocoes' ||
            r.experience_id === 'mente_emocoes_cer')
        return !isMente
      })
    }

    if (Array.isArray(this.state.incompatibleLegacyResponses)) {
      this.state.incompatibleLegacyResponses = this.state.incompatibleLegacyResponses.filter(
        (r) => {
          const isMente =
            r.enrollment_id === enrollmentId &&
            (r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID ||
              r.experience_id === 'mente_emocoes' ||
              r.experience_id === 'mente_emocoes_cer')
          return !isMente
        },
      )
    }

    if (this.state.enrollmentExperienceProgress) {
      delete this.state.enrollmentExperienceProgress[
        `${enrollmentId}:${MENTE_EMOCOES_EXPERIENCE_ID}`
      ]
      delete this.state.enrollmentExperienceProgress[`${enrollmentId}:mente_emocoes`]
      delete this.state.enrollmentExperienceProgress[`${enrollmentId}:mente_emocoes_cer`]
    }

    this.state.menteEmocoesNeedsRedo = false

    // Limpar arquivo técnico específico desta experiência se existir
    try {
      localStorage.removeItem(DEMO_ARCHIVED_INCOMPATIBLE_KEY)
    } catch {
      /* ignore */
    }

    this.saveState()
  }

  /**
   * Alias retrocompatível para resetMenteEmocoes
   */
  public resetMenteEmocoesExperience(enrollmentId: string = DEMO_ENROLLMENT_ID): void {
    this.resetMenteEmocoes(enrollmentId)
  }

  /**
   * Retorna se a experiência Mente & Emoções requer ser refeita devido a registros antigos incompatíveis.
   */
  public isMenteEmocoesRedoNeeded(): boolean {
    if (this.state.menteEmocoesNeedsRedo) return true
    // Verificação canônica de integridade: se não tem cobertura canônica de Mente & Emoções
    const coverage = this.checkMenteEmocoesCoverage()
    if (!coverage.isCoverageComplete && this.isMenteEmocoesCompleted()) {
      return true
    }
    return false
  }

  public isMenteEmocoesCompleted(): boolean {
    const key = `${DEMO_ENROLLMENT_ID}:${MENTE_EMOCOES_EXPERIENCE_ID}`
    const progress = this.state.enrollmentExperienceProgress?.[key]
    return progress?.progress_status === 'completed' || progress?.release_status === 'completed'
  }

  public checkMenteEmocoesCoverage(enrollmentId: string = DEMO_ENROLLMENT_ID): {
    isCoverageComplete: boolean
    answeredCount: number
    totalRequiredCount: number
    missingKeys: string[]
    details: Record<
      string,
      {
        status: 'answered' | 'legitimate_skip' | 'optional_empty' | 'missing_or_incompatible'
        reason?: string
      }
    >
  } {
    // 13 perguntas canônicas de Mente & Emoções
    // P1: mundo_emocional_geral (required)
    // P2: emocoes_recorrentes (required)
    // P3: compreensao_despertar_emocoes (required)
    // P4: pensamento_associado (required)
    // P5: comportamento_associado (required)
    // P6: self_dialogue_erro (required)
    // P7a: movimentos_automaticos_frequencia_p1 (required)
    // P7b: movimentos_automaticos_frequencia_p2 (required)
    // P8: movimentos_interferencia_atual (required)
    // P9: situacoes_ativacao_movimentos (required)
    // P10: dois_retratos_espaco (required)
    // P11: dois_retratos_sobrecarga (required)
    // P12: recursos_recuperar_espaco (required)
    // P13: campo_final_opcional (optional)
    const requiredCanonicalKeys = [
      { key: 'mundo_emocional_geral', promptId: 'p-07c-pm1-p1-funcionamento-emocional', order: 1 },
      { key: 'emocoes_recorrentes', promptId: 'p-07c-pm1-p2-emocoes-presentes', order: 2 },
      {
        key: 'compreensao_despertar_emocoes',
        promptId: 'p-07c-pm1-p3-por-que-se-sente-assim',
        order: 3,
      },
      { key: 'pensamento_associado', promptId: 'p-07c-pm2-p4-pensamentos-associados', order: 4 },
      {
        key: 'comportamento_associado',
        promptId: 'p-07c-pm2-p5-comportamento-associado',
        order: 5,
      },
      { key: 'self_dialogue_erro', promptId: 'p-07c-pm2-p6-dialogo-interno', order: 6 },
      {
        key: 'movimentos_automaticos_frequencia_p1',
        promptId: 'p-07c-pm3-p7a-movimentos-1-5',
        order: 7,
      },
      {
        key: 'movimentos_automaticos_frequencia_p2',
        promptId: 'p-07c-pm3-p7b-movimentos-6-10',
        order: 8,
      },
      {
        key: 'movimentos_interferencia_atual',
        promptId: 'p-07c-pm3-p8-interferencia-movimentos',
        order: 9,
      },
      {
        key: 'situacoes_ativacao_movimentos',
        promptId: 'p-07c-pm3-p9-situacoes-ativacao',
        order: 10,
      },
      { key: 'dois_retratos_espaco', promptId: 'p-07c-pm4-p10-seguranca-bem-estar', order: 11 },
      { key: 'dois_retratos_sobrecarga', promptId: 'p-07c-pm4-p11-sobrecarga', order: 12 },
      {
        key: 'recursos_recuperar_espaco',
        promptId: 'p-07c-pm5-p12-recursos-espaco-interno',
        order: 13,
      },
    ]

    const responses = this.listExperienceResponses(enrollmentId, MENTE_EMOCOES_EXPERIENCE_ID)
    const details: Record<
      string,
      {
        status: 'answered' | 'legitimate_skip' | 'optional_empty' | 'missing_or_incompatible'
        reason?: string
      }
    > = {}
    const missingKeys: string[] = []
    let answeredCount = 0

    for (const req of requiredCanonicalKeys) {
      const resp = responses.find((r) => {
        const rAny = r as any
        const sMeta =
          r.structured_value && typeof r.structured_value === 'object'
            ? (r.structured_value as any).metadata
            : undefined
        return (
          r.prompt_id === req.promptId ||
          rAny.canonical_prompt_id === req.promptId ||
          rAny.prompt_key === req.key ||
          sMeta?.prompt_key === req.key ||
          sMeta?.canonical_prompt_id === req.promptId
        )
      })

      if (!resp) {
        details[req.key] = { status: 'missing_or_incompatible', reason: 'not_found' }
        missingKeys.push(req.key)
        continue
      }

      const sVal = resp.structured_value as any
      const isLegitSkip =
        sVal?.is_legitimate_skip ||
        sVal?.metadata?.is_legitimate_skip ||
        sVal?.skip_reason === 'nao_sei' ||
        sVal?.skip_reason === 'prefiro_nao_responder' ||
        resp.response_type === ('prefiro_nao_responder' as any) ||
        resp.response_type === ('nao_sei' as any)

      if (isLegitSkip) {
        details[req.key] = {
          status: 'legitimate_skip',
          reason: sVal?.skip_reason || 'legitimate_skip',
        }
        answeredCount++
        continue
      }

      // Checar se há dados reais
      let hasData = false
      if (typeof resp.free_text === 'string' && resp.free_text.trim().length > 0) hasData = true
      if (sVal !== undefined && sVal !== null) {
        if (typeof sVal === 'string' && sVal.trim().length > 0) hasData = true
        else if (typeof sVal === 'number') hasData = true
        else if (Array.isArray(sVal) && sVal.length > 0) hasData = true
        else if (typeof sVal === 'object') {
          if (typeof sVal.value === 'string' && sVal.value.trim().length > 0) hasData = true
          else if (typeof sVal.choice === 'string' && sVal.choice.trim().length > 0) hasData = true
          else if (Array.isArray(sVal.choice) && sVal.choice.length > 0) hasData = true
          else if (Array.isArray(sVal.value) && sVal.value.length > 0) hasData = true
          else if (Array.isArray(sVal.selectedOptionIds) && sVal.selectedOptionIds.length > 0)
            hasData = true
          else {
            const keys = Object.keys(sVal).filter(
              (k) =>
                k !== 'metadata' &&
                k !== 'collection_origin' &&
                k !== 'naming_origin' &&
                Boolean(sVal[k]),
            )
            if (keys.length > 0) hasData = true
          }
        }
      }

      if (hasData) {
        details[req.key] = { status: 'answered' }
        answeredCount++
      } else {
        details[req.key] = { status: 'missing_or_incompatible', reason: 'empty_required' }
        missingKeys.push(req.key)
      }
    }

    // P13 opcional (p-07c-pm5-p13-campo-final-opcional)
    const p13Resp = responses.find((r) => {
      const rAny = r as any
      const sMeta =
        r.structured_value && typeof r.structured_value === 'object'
          ? (r.structured_value as any).metadata
          : undefined
      return (
        r.prompt_id === 'p-07c-pm5-p13-campo-final-opcional' ||
        rAny.canonical_prompt_id === 'p-07c-pm5-p13-campo-final-opcional' ||
        rAny.prompt_key === 'campo_final_opcional' ||
        sMeta?.prompt_key === 'campo_final_opcional' ||
        rAny.step_order === 14 ||
        rAny.step_order === 13
      )
    })
    if (!p13Resp) {
      details['campo_final_opcional'] = { status: 'optional_empty' }
    } else {
      const sVal = p13Resp.structured_value as any
      const hasContent =
        (typeof p13Resp.free_text === 'string' && p13Resp.free_text.trim().length > 0) ||
        (typeof sVal === 'string' && sVal.trim().length > 0) ||
        (sVal &&
          typeof sVal === 'object' &&
          typeof sVal.value === 'string' &&
          sVal.value.trim().length > 0)
      if (hasContent) {
        details['campo_final_opcional'] = { status: 'answered' }
      } else {
        details['campo_final_opcional'] = { status: 'optional_empty' }
      }
    }

    return {
      isCoverageComplete: missingKeys.length === 0,
      answeredCount,
      totalRequiredCount: requiredCanonicalKeys.length,
      missingKeys,
      details,
    }
  }

  /**
   * Retorna os registros retirados/arquivados da experiência Mente & Emoções.
   */
  public getRetiredExperienceResponses(): (ExperienceResponseRecord & {
    retired_reason?: string
  })[] {
    return this.state.retiredExperienceResponses || []
  }

  public getActivePersona(): 'mariana' | 'daiane' {
    return this.state.activePersona
  }

  public setActivePersona(persona: 'mariana' | 'daiane'): void {
    this.state.activePersona = persona
    this.saveState()
  }

  public getCurrentUser(): DemoUserAccount {
    return this.state.activePersona === 'daiane' ? DEMO_USER_DAIANE : DEMO_USER_MARIANA
  }

  public getCurrentPerson(): PersonRecord {
    if (this.state.activePersona === 'daiane') {
      return DEMO_PERSON_DAIANE
    }
    return {
      ...DEMO_PERSON_MARIANA,
      ...(this.state.marianaPersonOverride || {}),
    }
  }

  public getPersonById(id: string): PersonRecord {
    if (id === DEMO_PERSON_DAIANE.id) return DEMO_PERSON_DAIANE
    return {
      ...DEMO_PERSON_MARIANA,
      ...(this.state.marianaPersonOverride || {}),
    }
  }

  public updatePerson(id: string, data: Partial<PersonRecord>): PersonRecord {
    if (id === DEMO_PERSON_MARIANA.id || this.state.activePersona === 'mariana') {
      this.state.marianaPersonOverride = {
        ...(this.state.marianaPersonOverride || {}),
        ...data,
      }
      this.saveState()
      return this.getCurrentPerson()
    }
    return DEMO_PERSON_DAIANE
  }

  // =========================================================================
  // OPERAÇÕES DO PERCURSO DEMO (ZERO REDE)
  // =========================================================================

  // 1. Relatos / Recados (cerJournalService)
  public listMessages(enrollmentId: string, onlyApproved = false): CerNextSessionMessageRecord[] {
    return this.state.messages
      .filter((m) => {
        if (m.enrollment_id !== enrollmentId) return false
        if (onlyApproved) return m.status === 'approved' && m.access_class === 'shared_care'
        return true
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }

  public createNextSessionMessage(input: {
    enrollment_id: string
    message_text: string
    summary_text?: string
    summary_source?: 'participant' | 'system'
    as_draft?: boolean
  }): CerNextSessionMessageRecord & { summary_source?: 'participant' | 'system' } {
    const isDraft = input.as_draft ?? false
    const cleanText = input.message_text.trim()
    const hasExplicitSummary = Boolean(input.summary_text && input.summary_text.trim().length > 0)
    const summary = hasExplicitSummary ? input.summary_text!.trim() : undefined
    const summarySource: 'participant' | 'system' | undefined = hasExplicitSummary
      ? (input.summary_source ?? 'participant')
      : undefined

    const newRecord: CerNextSessionMessageRecord & { summary_source?: 'participant' | 'system' } = {
      id: `demo-msg-${Date.now()}`,
      enrollment_id: input.enrollment_id,
      participant_user_id: DEMO_USER_MARIANA.id,
      message_text: cleanText,
      summary_text: summary,
      summary_source: summarySource,
      status: isDraft ? 'draft' : 'approved',
      access_class: isDraft ? 'participant_private' : 'shared_care',
      approved_at: isDraft ? undefined : new Date().toISOString(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    this.state.messages.unshift(newRecord)
    this.saveState()
    return newRecord
  }

  // 2. Encontros / Sessões (cerSessionService & cerSessionNoteService)
  public listSessions(enrollmentId?: string): CerSessionRecord[] {
    if (!Array.isArray(this.state.sessions)) {
      return []
    }
    return this.state.sessions
      .filter((s) => (!enrollmentId ? true : s.enrollment_id === enrollmentId))
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }

  public createScheduledSession(enrollmentId: string, scheduledAt?: string): CerSessionRecord {
    const newSession: CerSessionRecord = {
      id: `demo-sess-${Date.now()}`,
      enrollment_id: enrollmentId,
      professional_user_id: DEMO_USER_DAIANE.id,
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: 'scheduled',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    this.state.sessions.unshift(newSession)
    this.saveState()
    return newSession
  }

  public startSession(sessionId: string): CerSessionRecord {
    const session = this.state.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error('Sessão não encontrada no modo demo')
    session.status = 'in_progress'
    session.started_at = new Date().toISOString()
    session.updated = new Date().toISOString()
    this.saveState()
    return { ...session }
  }

  public completeSession(sessionId: string): CerSessionRecord {
    const session = this.state.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error('Sessão não encontrada no modo demo')
    session.status = 'completed'
    session.completed_at = new Date().toISOString()
    session.updated = new Date().toISOString()
    this.saveState()
    return { ...session }
  }

  public cancelSession(sessionId: string): CerSessionRecord {
    const session = this.state.sessions.find((s) => s.id === sessionId)
    if (!session) throw new Error('Sessão não encontrada no modo demo')
    session.status = 'cancelled'
    session.updated = new Date().toISOString()
    this.saveState()
    return { ...session }
  }

  public getSessionNote(sessionId: string): CerSessionNoteRecord | null {
    const note = this.state.notes.find((n) => n.session_id === sessionId)
    return note ? { ...note } : null
  }

  public createOrUpdateNote(sessionId: string, text: string): CerSessionNoteRecord {
    let note = this.state.notes.find((n) => n.session_id === sessionId)
    if (note) {
      note.text = text
      note.updated = new Date().toISOString()
    } else {
      note = {
        id: `demo-note-${Date.now()}`,
        session_id: sessionId,
        enrollment_id: DEMO_ENROLLMENT_ID,
        author_user_id: DEMO_USER_DAIANE.id,
        text,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      this.state.notes.unshift(note)
    }
    this.saveState()
    return { ...note }
  }

  // 3. Preparação do Encontro ("Para nosso encontro")
  public computeSessionPreparation(enrollmentId: string): SessionPreparationData {
    const approvedMsgs = this.listMessages(enrollmentId, true)
    const completedSessions = this.state.sessions
      .filter((s) => s.enrollment_id === enrollmentId && s.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.completed_at || b.created).getTime() -
          new Date(a.completed_at || a.created).getTime(),
      )

    const lastCompleted = completedSessions[0]
    const lastNote = lastCompleted ? this.getSessionNote(lastCompleted.id) || undefined : undefined

    return {
      enrollment: DEMO_ENROLLMENT,
      participantName: DEMO_PERSON_MARIANA.preferred_name || DEMO_PERSON_MARIANA.full_name,
      lastCompletedSession: lastCompleted,
      lastSessionNote: lastNote,
      recentKnowledgeItems: [],
      recentRecognitions: [],
      recentCompletedExperiences: [],
      recentPresentations: [],
      continuityHighlights: {
        criticalRecognitions: [],
        supportiveRecognitions: [],
      },
      approvedNextSessionMessages: approvedMsgs,
    }
  }

  // 4. Planos de Cuidado, Prioridades e Apresentação
  public listPlans(enrollmentId: string): CerCarePlanRecord[] {
    return this.state.plans
      .filter((p) => p.enrollment_id === enrollmentId)
      .sort((a, b) => b.revision_number - a.revision_number)
  }

  public createDraftPlan(input: {
    enrollment_id: string
    direction_mode: any
    direction_statement?: string
    professional_context?: string
    professional_rationale?: string
    created_by_user_id?: string
  }): CerCarePlanRecord {
    const nextRevision =
      this.state.plans.length > 0
        ? Math.max(...this.state.plans.map((p) => p.revision_number)) + 1
        : 1

    const newPlan: CerCarePlanRecord = {
      id: `demo-plan-${Date.now()}`,
      enrollment_id: input.enrollment_id,
      revision_number: nextRevision,
      status: 'draft',
      direction_mode: input.direction_mode || 'reused',
      direction_statement: input.direction_statement || '',
      professional_context: input.professional_context || '',
      professional_rationale: input.professional_rationale || '',
      created_by_user_id: DEMO_USER_DAIANE.id,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    this.state.plans.unshift(newPlan)
    this.saveState()
    return newPlan
  }

  public activatePlan(planId: string): CerCarePlanRecord {
    const plan = this.state.plans.find((p) => p.id === planId)
    if (!plan) throw new Error('Plano demo não encontrado')
    // Desativa outros planos
    for (const p of this.state.plans) {
      if (p.id !== planId && p.status === 'active') {
        p.status = 'superseded'
      }
    }
    plan.status = 'active'
    plan.updated = new Date().toISOString()
    this.saveState()
    return { ...plan }
  }

  public listPriorities(planId: string): CerCarePlanPriorityRecord[] {
    return this.state.priorities
      .filter((p) => p.plan_id === planId)
      .sort((a, b) => a.order_index - b.order_index)
  }

  public addPriority(input: {
    plan_id: string
    title: string
    description?: string
    is_therapeutic_priority?: boolean
    is_possible_now?: boolean
    professional_rationale?: string
  }): CerCarePlanPriorityRecord {
    const newPrio: CerCarePlanPriorityRecord = {
      id: `demo-prio-${Date.now()}`,
      plan_id: input.plan_id,
      title: input.title,
      description: input.description || '',
      status: 'candidate',
      is_therapeutic_priority: input.is_therapeutic_priority ?? true,
      is_possible_now: input.is_possible_now ?? true,
      order_index: this.state.priorities.length + 1,
      professional_rationale: input.professional_rationale || '',
      access_class: 'shared_care',
      created_by_user_id: DEMO_USER_DAIANE.id,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    this.state.priorities.push(newPrio)
    this.saveState()
    return newPrio
  }

  public createPresentation(input: {
    plan_id: string
    priority_id?: string
    participant_title: string
    participant_summary?: string
    practical_invitation?: string
    channel?: 'app' | 'session'
  }): CerCarePlanPresentationRecord {
    const newPres: CerCarePlanPresentationRecord = {
      id: `demo-pres-${Date.now()}`,
      plan_id: input.plan_id,
      priority_id: input.priority_id || '',
      enrollment_id: DEMO_ENROLLMENT_ID,
      status: 'draft',
      participant_title: input.participant_title,
      participant_summary: input.participant_summary || '',
      practical_invitation: input.practical_invitation || '',
      channel: input.channel || 'app',
      created_by_user_id: DEMO_USER_DAIANE.id,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    this.state.presentations.unshift(newPres)
    this.saveState()
    return newPres
  }

  public presentPresentation(presentationId: string): CerCarePlanPresentationRecord {
    const pres = this.state.presentations.find((p) => p.id === presentationId)
    if (!pres) throw new Error('Apresentação demo não encontrada')
    pres.status = 'presented'
    pres.presented_at = new Date().toISOString()
    pres.updated = new Date().toISOString()
    this.saveState()
    return { ...pres }
  }

  public listPresentedForParticipant(enrollmentId: string): CerCarePlanPresentationRecord[] {
    return this.state.presentations
      .filter((p) => p.enrollment_id === enrollmentId && p.status === 'presented')
      .sort(
        (a, b) =>
          new Date(b.presented_at || b.created).getTime() -
          new Date(a.presented_at || a.created).getTime(),
      )
  }

  public listAcceptancesByEnrollment(enrollmentId: string): CerOperationalAcceptanceRecord[] {
    return this.state.acceptances
      .filter((a) => a.enrollment_id === enrollmentId)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }

  public recordAcceptance(input: {
    presentation_id: string
    response_type: any
    shared_comment?: string
    private_note?: string
  }): CerOperationalAcceptanceRecord {
    const pres = this.state.presentations.find((p) => p.id === input.presentation_id)
    const newAcc: CerOperationalAcceptanceRecord = {
      id: `demo-acc-${Date.now()}`,
      presentation_id: input.presentation_id,
      plan_id: pres?.plan_id || '',
      priority_id: pres?.priority_id || '',
      enrollment_id: DEMO_ENROLLMENT_ID,
      participant_user_id: DEMO_USER_MARIANA.id,
      response_type: input.response_type,
      shared_comment: input.shared_comment || '',
      access_class: 'shared_care',
      record_status: 'current',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    this.state.acceptances.unshift(newAcc)
    this.saveState()
    return newAcc
  }

  // 5. Mapas CER Demo (cerMapService)
  public getCurrentPublishedMap(
    enrollmentId: string,
  ): (CerMapRecord & { items: CerMapItemRecord[] }) | null {
    const pub = this.state.maps.find(
      (m) => m.enrollment_id === enrollmentId && m.status === 'published',
    )
    if (!pub) return null
    return {
      ...pub,
      items: pub.items.map((it) => ({
        id: it.id,
        map_id: it.map_id,
        section: it.section,
        item_text: it.item_text,
        position: it.position,
        created_by_user_id: it.created_by_user_id,
        created: it.created,
        updated: it.updated,
      })),
    }
  }

  public getDraftMap(
    enrollmentId: string,
  ):
    | (CerMapRecord & { items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[] })
    | null {
    const draft = this.state.maps.find(
      (m) => m.enrollment_id === enrollmentId && m.status === 'draft',
    )
    return draft ? { ...draft } : null
  }

  public listAllMaps(enrollmentId: string): CerMapRecord[] {
    return this.state.maps.filter((m) => m.enrollment_id === enrollmentId)
  }

  public createInitialDraft(enrollmentId: string, userId: string): CerMapRecord {
    const newMap: CerMapRecord & {
      items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[]
    } = {
      id: `demo-map-${Date.now()}`,
      enrollment_id: enrollmentId,
      version_number: 1,
      status: 'draft',
      created_by_user_id: userId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      items: [
        {
          id: `demo-map-item-${Date.now()}`,
          map_id: `demo-map-${Date.now()}`,
          section: 'minha_natureza',
          item_text: 'Ritmo sensível que busca clareza e acolhimento nas pausas.',
          position: 1,
          created_by_user_id: userId,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          sources: [],
        },
      ],
    }
    this.state.maps.unshift(newMap)
    this.saveState()
    return newMap
  }

  public addMapItem(
    input: { map_id: string; section: any; item_text: string; position: number },
    userId: string,
  ): CerMapItemRecord {
    const map = this.state.maps.find((m) => m.id === input.map_id)
    const newItem: CerMapItemRecord & { sources?: CerMapItemSourceRecord[] } = {
      id: `demo-map-item-${Date.now()}`,
      map_id: input.map_id,
      section: input.section,
      item_text: input.item_text,
      position: input.position,
      created_by_user_id: userId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      sources: [],
    }
    if (map) {
      map.items.push(newItem)
      map.updated = new Date().toISOString()
      this.saveState()
    }
    return newItem
  }

  public reorderItems(items: { id: string; position: number }[]): void {
    for (const it of items) {
      for (const map of this.state.maps) {
        const found = map.items.find((x) => x.id === it.id)
        if (found) {
          found.position = it.position
        }
      }
    }
    this.saveState()
  }

  public linkSource(input: any): CerMapItemSourceRecord {
    const src: CerMapItemSourceRecord = {
      id: `demo-src-${Date.now()}`,
      map_item_id: input.map_item_id,
      source_type: input.source_type,
      knowledge_item_id: input.knowledge_item_id,
      recognition_id: input.recognition_id,
      presentation_id: input.presentation_id,
      knowledge_version_number: input.knowledge_version_number,
      knowledge_version_id: input.knowledge_version_id,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    for (const map of this.state.maps) {
      const it = map.items.find((x) => x.id === input.map_item_id)
      if (it) {
        if (!it.sources) it.sources = []
        it.sources.push(src)
      }
    }
    this.saveState()
    return src
  }

  public publishDraft(mapId: string): CerMapRecord {
    const map = this.state.maps.find((m) => m.id === mapId)
    if (!map) throw new Error('Mapa não encontrado no modo demo')
    // Supersede outros publicados
    for (const m of this.state.maps) {
      if (m.id !== mapId && m.enrollment_id === map.enrollment_id && m.status === 'published') {
        m.status = 'superseded'
      }
    }
    map.status = 'published'
    map.published_at = new Date().toISOString()
    map.published_by_user_id = DEMO_USER_DAIANE.id
    map.updated = new Date().toISOString()
    this.saveState()
    return { ...map }
  }

  public discardDraft(mapId: string): CerMapRecord {
    const map = this.state.maps.find((m) => m.id === mapId)
    if (!map) throw new Error('Mapa não encontrado no modo demo')
    map.status = 'discarded'
    map.updated = new Date().toISOString()
    this.saveState()
    return { ...map }
  }

  public createNextDraftFromPublished(publishedMapId: string, userId: string): CerMapRecord {
    const pub = this.state.maps.find((m) => m.id === publishedMapId)
    if (!pub) throw new Error('Mapa publicado não encontrado no modo demo')
    const newDraft: CerMapRecord & {
      items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[]
    } = {
      id: `demo-map-${Date.now()}`,
      enrollment_id: pub.enrollment_id,
      version_number: pub.version_number + 1,
      status: 'draft',
      created_by_user_id: userId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      items: pub.items.map((it) => ({
        ...it,
        id: `demo-map-item-${Date.now()}-${Math.random()}`,
        map_id: `demo-map-${Date.now()}`,
      })),
    }
    this.state.maps.unshift(newDraft)
    this.saveState()
    return newDraft
  }

  // 6. Respostas de Experiências da Consciência e Progresso de Enrollment (Demo)
  public getEnrollmentExperienceProgress(enrollmentId: string, experienceId: string) {
    if (!this.state.enrollmentExperienceProgress) {
      this.state.enrollmentExperienceProgress = {}
    }
    const key = `${enrollmentId}:${experienceId}`
    return this.state.enrollmentExperienceProgress[key] || null
  }

  public updateEnrollmentExperienceProgress(
    enrollmentId: string,
    experienceId: string,
    params: {
      stepOrder?: number
      progressStatus?: ExperienceProgressStatus
      releaseStatus?: ExperienceReleaseStatus
      completed?: boolean
    },
  ) {
    if (!this.state.enrollmentExperienceProgress) {
      this.state.enrollmentExperienceProgress = {}
    }
    const key = `${enrollmentId}:${experienceId}`
    const current = this.state.enrollmentExperienceProgress[key] || {
      progress_status: 'not_started',
      release_status: 'available',
      current_step_order: 1,
      last_interaction_at: new Date().toISOString(),
    }

    const now = new Date().toISOString()
    const updated = { ...current, last_interaction_at: now }

    if (typeof params.stepOrder === 'number') {
      updated.current_step_order = params.stepOrder
    }
    if (params.progressStatus) {
      updated.progress_status = params.progressStatus
      if (params.progressStatus === 'in_progress') {
        updated.release_status = 'in_progress'
        if (!updated.started_at) updated.started_at = now
      }
    }
    if (params.releaseStatus) {
      updated.release_status = params.releaseStatus
    }
    if (params.completed) {
      updated.progress_status = 'completed'
      updated.release_status = 'completed'
      updated.completed_at = now
    }

    this.state.enrollmentExperienceProgress[key] = updated
    this.saveState()
    return updated
  }

  // Respostas de Experiências da Consciência (Demo)
  public listExperienceResponses(
    enrollmentId?: string,
    experienceId?: string,
  ): ExperienceResponseRecord[] {
    return this.state.experienceResponses.filter((r) => {
      if (enrollmentId && r.enrollment_id !== enrollmentId) return false
      if (experienceId && r.experience_id !== experienceId) return false
      return true
    })
  }

  public saveExperienceResponse(params: {
    enrollmentId: string
    experienceId: string
    promptId: string
    respondentUserId: string
    responseType: any
    promptVersion: number
    structuredValue?: unknown
    freeText?: string
    accessClass?: any
    promptKey?: string
    canonicalPromptId?: string
    stepOrder?: number
  }): ExperienceResponseRecord {
    // Resolução canônica universal defensiva:
    const sObj =
      typeof params.structuredValue === 'object' && params.structuredValue !== null
        ? (params.structuredValue as any)
        : null
    const meta = sObj?.metadata || {}

    let effectivePromptKey = params.promptKey || meta.prompt_key || sObj?.prompt_key
    let effectiveCanonicalPromptId =
      params.canonicalPromptId ||
      meta.canonical_prompt_id ||
      sObj?.canonical_prompt_id ||
      params.promptId
    let effectiveStepOrder = params.stepOrder ?? meta.step_order ?? sObj?.step_order

    // Fallback por catálogo de Mente & Emoções se não identificado
    if (!effectivePromptKey || effectiveStepOrder === undefined) {
      const allPrompts = BUILD_07C_MENTE_PROMPTS
      const matched = allPrompts.find(
        (p) => p.id === params.promptId || p.id === effectiveCanonicalPromptId,
      )
      if (matched) {
        if (!effectivePromptKey) effectivePromptKey = (matched.schema_config as any)?.prompt_key
        if (effectiveStepOrder === undefined) effectiveStepOrder = matched.step_order
        if (!effectiveCanonicalPromptId) effectiveCanonicalPromptId = matched.id
      }
    }

    // Se structuredValue for string/primitivo ou não tiver metadata, envolver defensivamente garantindo metadata
    let enrichedStructuredValue = params.structuredValue
    if (
      typeof params.structuredValue === 'string' ||
      typeof params.structuredValue === 'number' ||
      typeof params.structuredValue === 'boolean'
    ) {
      enrichedStructuredValue = {
        value: params.structuredValue,
        prompt_key: effectivePromptKey,
        canonical_prompt_id: effectiveCanonicalPromptId,
        collection_origin: 'newly_collected',
        metadata: {
          prompt_key: effectivePromptKey,
          canonical_prompt_id: effectiveCanonicalPromptId,
          step_order: effectiveStepOrder,
          participant_free_speech: typeof params.structuredValue === 'string',
        },
      }
    } else if (sObj && !sObj.metadata) {
      enrichedStructuredValue = {
        ...sObj,
        prompt_key: effectivePromptKey || sObj.prompt_key,
        canonical_prompt_id: effectiveCanonicalPromptId || sObj.canonical_prompt_id,
        metadata: {
          prompt_key: effectivePromptKey || sObj.prompt_key,
          canonical_prompt_id: effectiveCanonicalPromptId || sObj.canonical_prompt_id,
          step_order: effectiveStepOrder,
        },
      }
    }

    const existing = this.state.experienceResponses.find(
      (r) => r.enrollment_id === params.enrollmentId && r.prompt_id === params.promptId,
    )
    if (existing) {
      existing.structured_value = enrichedStructuredValue
      existing.free_text = params.freeText !== undefined ? params.freeText : existing.free_text
      existing.version = (existing.version || 1) + 1
      existing.status = 'revised'
      existing.updated = new Date().toISOString()
      if (effectivePromptKey) (existing as any).prompt_key = effectivePromptKey
      if (effectiveStepOrder !== undefined) (existing as any).step_order = effectiveStepOrder
      if (effectiveCanonicalPromptId)
        (existing as any).canonical_prompt_id = effectiveCanonicalPromptId
      this.saveState()
      return { ...existing }
    } else {
      const newResp: ExperienceResponseRecord = {
        id: `demo-resp-${Date.now()}-${Math.random()}`,
        enrollment_id: params.enrollmentId,
        experience_id: params.experienceId,
        prompt_id: params.promptId,
        respondent_user_id: params.respondentUserId,
        response_type: params.responseType,
        access_class: params.accessClass || 'shared_care',
        structured_value: enrichedStructuredValue,
        free_text: params.freeText || '',
        prompt_version: params.promptVersion,
        version: 1,
        status: 'saved',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      if (effectivePromptKey) (newResp as any).prompt_key = effectivePromptKey
      if (effectiveStepOrder !== undefined) (newResp as any).step_order = effectiveStepOrder
      if (effectiveCanonicalPromptId)
        (newResp as any).canonical_prompt_id = effectiveCanonicalPromptId
      this.state.experienceResponses.push(newResp)
      this.saveState()
      return newResp
    }
  }
}

export const demoAdapter = new DemoAdapter()
