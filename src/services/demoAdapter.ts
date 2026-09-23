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

  private loadState(): DemoStateStore {
    try {
      // Remoção explícita dos caches legados para evitar contaminação por sementes antigas
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2)

      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: DemoStateStore = JSON.parse(raw)
        const migrated = this.migrateIncompatibleMenteEmocoes(parsed)
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
      const isMente = r.experience_id === MENTE_EMOCOES_EXPERIENCE_ID
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
    return Boolean(this.state.menteEmocoesNeedsRedo)
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
    const existing = this.state.experienceResponses.find(
      (r) => r.enrollment_id === params.enrollmentId && r.prompt_id === params.promptId,
    )
    if (existing) {
      existing.structured_value = params.structuredValue
      existing.free_text = params.freeText !== undefined ? params.freeText : existing.free_text
      existing.version = (existing.version || 1) + 1
      existing.status = 'revised'
      existing.updated = new Date().toISOString()
      if (params.promptKey) (existing as any).prompt_key = params.promptKey
      if (params.stepOrder !== undefined) (existing as any).step_order = params.stepOrder
      if (params.canonicalPromptId) (existing as any).canonical_prompt_id = params.canonicalPromptId
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
        structured_value: params.structuredValue,
        free_text: params.freeText || '',
        prompt_version: params.promptVersion,
        version: 1,
        status: 'saved',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      if (params.promptKey) (newResp as any).prompt_key = params.promptKey
      if (params.stepOrder !== undefined) (newResp as any).step_order = params.stepOrder
      if (params.canonicalPromptId) (newResp as any).canonical_prompt_id = params.canonicalPromptId
      this.state.experienceResponses.push(newResp)
      this.saveState()
      return newResp
    }
  }
}

export const demoAdapter = new DemoAdapter()
