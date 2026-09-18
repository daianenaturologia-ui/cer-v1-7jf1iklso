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
  messages: (CerNextSessionMessageRecord & { summary_source?: 'participant' | 'system' })[]
  sessions: CerSessionRecord[]
  notes: CerSessionNoteRecord[]
  plans: CerCarePlanRecord[]
  priorities: CerCarePlanPriorityRecord[]
  presentations: CerCarePlanPresentationRecord[]
  acceptances: CerOperationalAcceptanceRecord[]
}

const STORAGE_KEY = 'cer_demo_mode_state_v2'
const LEGACY_STORAGE_KEY_V1 = 'cer_demo_mode_state_v1'

function getInitialState(): DemoStateStore {
  return {
    activePersona: 'mariana',
    messages: [],
    sessions: [],
    notes: [],
    plans: [
      {
        id: 'demo-plan-seed-1',
        enrollment_id: DEMO_ENROLLMENT_ID,
        revision_number: 1,
        status: 'active',
        direction_mode: 'reused',
        direction_statement: 'Pausa consciente e transição suave ao entardecer',
        professional_context: 'Foco na diminuição da sobrecarga vespertina e ritmo respiratório',
        professional_rationale: 'Fortalecer a autorregulação antes do momento crítico de fadiga',
        created_by_user_id: DEMO_USER_DAIANE.id,
        created: '2025-02-15T09:00:00.000Z',
        updated: '2025-02-15T09:00:00.000Z',
      },
    ],
    priorities: [
      {
        id: 'demo-prio-seed-1',
        plan_id: 'demo-plan-seed-1',
        title: 'Micro-pausa de 5 minutos ao terminar a jornada de trabalho',
        description: 'Três respirações lentas antes de ligar telas de entretenimento',
        status: 'candidate',
        is_therapeutic_priority: true, // IMPORTANTE
        is_possible_now: true, // AGORA
        order_index: 1,
        professional_rationale: 'Ponto de alavanca com menor custo cognitivo para Mariana',
        access_class: 'shared_care',
        created_by_user_id: DEMO_USER_DAIANE.id,
        created: '2025-02-15T09:10:00.000Z',
        updated: '2025-02-15T09:10:00.000Z',
      },
      {
        id: 'demo-prio-seed-2',
        plan_id: 'demo-plan-seed-1',
        title: 'Revisão da iluminação do quarto 1 hora antes de deitar',
        description: 'Luzes indiretas e quentes',
        status: 'candidate',
        is_therapeutic_priority: true, // IMPORTANTE
        is_possible_now: false, // Opcional / Próximo ciclo
        order_index: 2,
        professional_rationale: 'Higiene do sono após consolidar a micro-pausa',
        access_class: 'shared_care',
        created_by_user_id: DEMO_USER_DAIANE.id,
        created: '2025-02-15T09:12:00.000Z',
        updated: '2025-02-15T09:12:00.000Z',
      },
    ],
    presentations: [
      {
        id: 'demo-pres-seed-1',
        plan_id: 'demo-plan-seed-1',
        priority_id: 'demo-prio-seed-1',
        enrollment_id: DEMO_ENROLLMENT_ID,
        status: 'presented',
        participant_title: 'Nosso Próximo Passo: Pausa Consciente no Entardecer',
        participant_summary:
          'Direção de Cuidado: Pausa consciente e transição suave ao entardecer.\n\nFocos combinados:\n• Micro-pausa de 5 minutos ao terminar a jornada de trabalho',
        practical_invitation: 'Experimente por 3 dias e veja como seu corpo responde à pausa.',
        channel: 'app',
        presented_at: '2025-02-15T09:30:00.000Z',
        created_by_user_id: DEMO_USER_DAIANE.id,
        created: '2025-02-15T09:20:00.000Z',
        updated: '2025-02-15T09:30:00.000Z',
      },
    ],
    acceptances: [],
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
      // Remoção explícita do cache v1 para evitar contaminação por sementes antigas
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)

      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn('Falha ao restaurar estado de demonstração:', e)
    }
    return getInitialState()
  }

  private saveState(): void {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
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
    } catch {
      /* ignore */
    }
    this.isDemoEnabled = true
    this.state.activePersona = persona
    this.saveState()
  }

  public disableDemo(): void {
    this.isDemoEnabled = false
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1)
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
    } catch {
      /* ignore */
    }
    this.state = getInitialState()
    this.saveState()
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
    return this.state.activePersona === 'daiane' ? DEMO_PERSON_DAIANE : DEMO_PERSON_MARIANA
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
  public listSessions(enrollmentId: string): CerSessionRecord[] {
    return this.state.sessions
      .filter((s) => s.enrollment_id === enrollmentId)
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
      recentKnowledgeItems: [
        {
          id: 'demo-ki-01',
          statement: 'Pausa ao entardecer favorece a regulação autonômica e o descanso',
          status: 'supported',
          access_class: 'shared_care',
          created: '2025-02-14T10:00:00.000Z',
          updated: '2025-02-14T10:00:00.000Z',
        } as any,
      ],
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
      plan_id: pres?.plan_id || 'demo-plan-seed-1',
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
}

export const demoAdapter = new DemoAdapter()
