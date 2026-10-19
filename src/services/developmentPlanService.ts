import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE } from './demoAdapter'
import {
  validatePlanDocument,
  validateRoutine,
  type PlanDocument,
  type PlanDraft,
  type PlanVersion,
  type PlanRoutine,
  type RoutineSchedule,
} from './developmentPlanDocument'

const key = 'cer-demo-development-plan-document-v1'
interface DemoStore {
  drafts: PlanDraft[]
  versions: PlanVersion[]
  routines: PlanRoutine[]
}
function read(): DemoStore {
  return JSON.parse(localStorage.getItem(key) || '{"drafts":[],"versions":[],"routines":[]}')
}
function write(store: DemoStore) {
  localStorage.setItem(key, JSON.stringify(store))
}
function demoScope(enrollment: string, professional = false) {
  if (
    enrollment !== DEMO_ENROLLMENT_ID ||
    (professional && demoAdapter.getActivePersona() !== 'daiane')
  )
    throw new Error('Acesso não permitido a este plano.')
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const developmentPlanService = {
  async draft(enrollmentId: string): Promise<PlanDraft | null> {
    if (demoAdapter.isEnabled()) {
      demoScope(enrollmentId, true)
      return clone(read().drafts.find((v) => v.enrollment_id === enrollmentId) || null)
    }
    const values = await pb
      .collection('cer_development_plan_drafts')
      .getFullList<PlanDraft>({
        filter: pb.filter('enrollment_id = {:id} && author_id = {:author}', {
          id: enrollmentId,
          author: pb.authStore.record?.id || '',
        }),
        requestKey: null,
      })
    return values[0] || null
  },
  async save(
    enrollmentId: string,
    document: PlanDocument,
    privateNotes: string,
    old: PlanDraft | null,
  ): Promise<PlanDraft> {
    validatePlanDocument(document)
    if (typeof privateNotes !== 'string' || privateNotes.length > 20000)
      throw new Error('Use até 20.000 caracteres nas notas privadas.')
    if (old && old.enrollment_id !== enrollmentId) throw new Error('Reabra o plano desta pessoa.')
    const value = {
      enrollment_id: enrollmentId,
      author_id: pb.authStore.record?.id || '',
      revision: (old?.revision || 0) + 1,
      document,
      private_notes: privateNotes,
    }
    if (demoAdapter.isEnabled()) {
      demoScope(enrollmentId, true)
      const store = read(),
        current = store.drafts.find((v) => v.enrollment_id === enrollmentId)
      if ((current?.revision || 0) !== (old?.revision || 0))
        throw new Error('Este plano foi alterado em outra janela. Recarregue antes de editar.')
      const record = clone({
        ...value,
        id: current?.id || crypto.randomUUID(),
        author_id: DEMO_USER_DAIANE.id,
      })
      store.drafts = [...store.drafts.filter((v) => v.id !== current?.id), record]
      write(store)
      return record
    }
    return old
      ? pb.collection('cer_development_plan_drafts').update<PlanDraft>(old.id, value)
      : pb.collection('cer_development_plan_drafts').create<PlanDraft>(value)
  },
  async share(draft: PlanDraft, stage: PlanVersion['stage']): Promise<PlanVersion> {
    validatePlanDocument(draft.document, stage)
    if (demoAdapter.isEnabled()) {
      demoScope(draft.enrollment_id, true)
      const store = read(),
        current = store.drafts.find((v) => v.id === draft.id)
      if (!current || current.revision !== draft.revision)
        throw new Error('Recarregue a versão atual antes de compartilhar.')
      const old = store.versions.find(
        (v) => v.draft_id === draft.id && v.revision === draft.revision,
      )
      if (old)
        throw new Error(
          'Esta versão já foi compartilhada. Salve uma nova revisão para atualizar o combinado.',
        )
      const version = clone({
        id: crypto.randomUUID(),
        draft_id: draft.id,
        enrollment_id: draft.enrollment_id,
        revision: draft.revision,
        stage,
        document: draft.document,
        created: new Date().toISOString(),
      })
      store.versions.push(version)
      write(store)
      return version
    }
    // Server supplies the document snapshot; private_notes are never transmitted here.
    return pb
      .collection('cer_development_plan_versions')
      .create<PlanVersion>({
        draft_id: draft.id,
        enrollment_id: draft.enrollment_id,
        revision: draft.revision,
        stage,
      })
  },
  async versions(enrollmentId: string): Promise<PlanVersion[]> {
    if (demoAdapter.isEnabled()) {
      demoScope(enrollmentId)
      return clone(
        read()
          .versions.filter((v) => v.enrollment_id === enrollmentId)
          .sort((a, b) => b.created.localeCompare(a.created) || b.revision - a.revision),
      )
    }
    return pb
      .collection('cer_development_plan_versions')
      .getFullList<PlanVersion>({
        filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
        sort: '-created,-revision',
        requestKey: null,
      })
  },
  async routines(enrollmentId: string): Promise<PlanRoutine[]> {
    if (demoAdapter.isEnabled()) {
      demoScope(enrollmentId)
      return clone(read().routines.filter((v) => v.enrollment_id === enrollmentId))
    }
    return pb
      .collection('cer_development_plan_routines')
      .getFullList<PlanRoutine>({
        filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
        sort: '-created',
        requestKey: null,
      })
  },
  async schedule(
    version: PlanVersion,
    actionId: string,
    schedule: RoutineSchedule,
    effectiveDay: string,
    enabled: boolean,
    commandKey: string,
  ): Promise<PlanRoutine> {
    validateRoutine(schedule, effectiveDay)
    if (version.stage !== 'agreed')
      throw new Error('Combinem as metas e ações antes de organizar a rotina.')
    const goal = version.document.goals.find((g) => g.actions.some((a) => a.id === actionId)),
      action = goal?.actions.find((a) => a.id === actionId)
    if (!goal || !action) throw new Error('Esta ação não pertence à versão combinada.')
    const payload = {
      enrollment_id: version.enrollment_id,
      version_id: version.id,
      action_id: actionId,
      schedule,
      effective_day: effectiveDay,
      enabled,
      command_key: commandKey,
    }
    if (demoAdapter.isEnabled()) {
      demoScope(version.enrollment_id)
      const store = read(),
        stored = store.versions.find((v) => v.id === version.id)
      if (!stored || stored.stage !== 'agreed') throw new Error('Versão não encontrada.')
      const latest = [...store.versions]
        .filter((v) => v.enrollment_id === version.enrollment_id)
        .sort((a, b) => b.created.localeCompare(a.created) || b.revision - a.revision)[0]
      if (enabled && latest?.id !== version.id)
        throw new Error(
          'O plano foi atualizado. Reabra a versão mais recente antes de organizar a rotina.',
        )
      const prior = store.routines.find((v) => v.command_key === commandKey)
      if (prior) return clone(prior)
      const record = clone({
        ...payload,
        id: crypto.randomUUID(),
        snapshot: { goal: goal.title, progress: goal.progress, action },
        created: new Date().toISOString(),
      })
      store.routines.push(record)
      write(store)
      return record
    }
    try {
      return await pb.collection('cer_development_plan_routines').create<PlanRoutine>(payload)
    } catch (error) {
      // Retry after a lost response returns the one immutable command, rather than duplicating it.
      const previous = await pb
        .collection('cer_development_plan_routines')
        .getFullList<PlanRoutine>({
          filter: pb.filter('command_key = {:key} && enrollment_id = {:id}', {
            key: commandKey,
            id: version.enrollment_id,
          }),
          requestKey: null,
        })
      if (previous[0]) return previous[0]
      throw error
    }
  },
}
