import pb from '@/lib/pocketbase/client'
import { cerCarePlanService, type CreateCareCycleInput } from './cerCarePlanService'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE } from './demoAdapter'
import type { CerCareCycleRecord } from '@/types/cer'

function professional(enrollmentId: string) {
  if (enrollmentId !== DEMO_ENROLLMENT_ID || demoAdapter.getActivePersona() !== 'daiane')
    throw new Error('Esta ação requer a profissional responsável.')
}

export const cerCareCycleService = {
  async list(enrollmentId: string): Promise<CerCareCycleRecord[]> {
    if (demoAdapter.isEnabled()) {
      professional(enrollmentId)
      return demoAdapter
        .readCareStore()
        .cycles.filter((c) => c.enrollment_id === enrollmentId)
        .sort((a, b) => b.cycle_number - a.cycle_number)
    }
    return pb.collection('cer_care_cycles').getFullList({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      sort: '-cycle_number',
    })
  },
  async create(input: CreateCareCycleInput): Promise<CerCareCycleRecord> {
    if (!demoAdapter.isEnabled()) return cerCarePlanService.createCycle(input)
    const plan = demoAdapter.listPlans(DEMO_ENROLLMENT_ID).find((p) => p.id === input.plan_id)
    professional(plan?.enrollment_id || '')
    if (!plan || plan.status !== 'active') throw new Error('Ative o plano antes de criar um ciclo.')
    const store = demoAdapter.readCareStore()
    const now = new Date().toISOString()
    const cycle: CerCareCycleRecord = {
      ...input,
      id: `demo-cycle-${crypto.randomUUID()}`,
      enrollment_id: plan.enrollment_id,
      cycle_number: Math.max(0, ...store.cycles.map((c) => c.cycle_number)) + 1,
      status: 'planned',
      review_event_type: input.review_event_type || 'participant_checkin',
      created_by_user_id: DEMO_USER_DAIANE.id,
      created: now,
      updated: now,
    }
    store.cycles.push(cycle)
    demoAdapter.writeCareStore(store)
    return cycle
  },
  async act(
    id: string,
    action: 'start' | 'pause' | 'resume' | 'close' | 'extend',
    until?: string,
  ): Promise<CerCareCycleRecord> {
    if (action === 'extend' && (!until || !Number.isFinite(Date.parse(until))))
      throw new Error('Escolha uma data válida para a janela do ciclo.')
    if (!demoAdapter.isEnabled()) {
      if (action === 'extend') return cerCarePlanService.extendCycle(id, until!)
      return {
        start: () => cerCarePlanService.startCycle(id),
        pause: () => cerCarePlanService.pauseCycle(id),
        resume: () => cerCarePlanService.resumeCycle(id),
        close: () => cerCarePlanService.closeCycle(id),
      }[action]()
    }
    const store = demoAdapter.readCareStore()
    const cycle = store.cycles.find((c) => c.id === id)
    professional(cycle?.enrollment_id || '')
    if (!cycle || cycle.status === 'closed') throw new Error('Ciclo fechado ou não encontrado.')
    const allowed = {
      start: ['planned'],
      pause: ['active'],
      resume: ['paused'],
      close: ['active', 'paused'],
      extend: ['active', 'paused'],
    }
    if (!allowed[action].includes(cycle.status))
      throw new Error('Esta ação não está disponível neste estado do ciclo.')
    if (action === 'start' || action === 'resume') {
      const plan = demoAdapter.listPlans(cycle.enrollment_id).find((p) => p.id === cycle.plan_id)
      if (plan?.status !== 'active') throw new Error('O plano precisa estar ativo.')
      if (
        store.cycles.some(
          (c) => c.id !== id && c.enrollment_id === cycle.enrollment_id && c.status === 'active',
        )
      )
        throw new Error('Já existe um ciclo ativo. Pause ou encerre esse ciclo primeiro.')
      cycle.status = 'active'
      cycle.start_date ||= new Date().toISOString()
    }
    if (action === 'pause') cycle.status = 'paused'
    if (action === 'close') {
      cycle.status = 'closed'
      cycle.closed_at = new Date().toISOString()
      store.plannerItems.forEach((item) => {
        if (item.care_cycle_id === id && ['planned', 'active'].includes(item.status))
          item.status = 'cancelled'
      })
    }
    if (action === 'extend') cycle.extended_until = until
    cycle.updated = new Date().toISOString()
    demoAdapter.writeCareStore(store)
    return cycle
  },
}
