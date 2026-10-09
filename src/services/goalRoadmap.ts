import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
import { lifeDirectionsService, type LifeDirection } from './lifeDirections'

export const GOAL_HORIZONS = { short: 'Curto prazo', medium: 'Médio prazo', long: 'Longo prazo' }
export type GoalHorizon = keyof typeof GOAL_HORIZONS
export interface GoalMilestone {
  horizon: GoalHorizon
  title: string
  targetDate: string
  signal: string
}
export interface GoalAction {
  id: string
  title: string
  horizon: GoalHorizon
  frequency: string
  resource: string
  fallback: string
}
export interface GoalRoadmap {
  schemaVersion: 1
  objective: string
  capacity: string
  resources: string
  milestones: GoalMilestone[]
  actions: GoalAction[]
}
export interface GoalRoadmapRecord {
  id: string
  enrollment_id: string
  direction_id: string
  owner_id: string
  revision: number
  roadmap: GoalRoadmap
  access_class: 'participant_private' | 'participant_shared'
}
export function emptyGoalRoadmap(source: LifeDirection): GoalRoadmap {
  return {
    schemaVersion: 1,
    objective: source.title,
    capacity: source.limits,
    resources: source.resources,
    milestones: [],
    actions: [],
  }
}
export function validateGoalRoadmap(value: GoalRoadmap) {
  const text = (v: unknown, max = 2000) => typeof v === 'string' && v.length <= max
  if (
    !value ||
    value.schemaVersion !== 1 ||
    !text(value.objective, 160) ||
    !value.objective.trim() ||
    !text(value.capacity, 5000) ||
    !text(value.resources, 5000) ||
    !Array.isArray(value.milestones) ||
    value.milestones.length < 1 ||
    value.milestones.length > 3 ||
    !Array.isArray(value.actions) ||
    value.actions.length > 24
  )
    throw new Error('Escolha uma primeira meta e confira os textos do planejamento.')
  const dates: string[] = []
  const horizons = new Set<string>()
  if (
    value.milestones.some(
      (m) => !m || !Object.prototype.hasOwnProperty.call(GOAL_HORIZONS, m.horizon),
    )
  )
    throw new Error('Confira o horizonte de cada meta.')
  for (const m of [...value.milestones].sort(
    (a, b) =>
      Object.keys(GOAL_HORIZONS).indexOf(a.horizon) - Object.keys(GOAL_HORIZONS).indexOf(b.horizon),
  )) {
    if (
      !m ||
      !(m.horizon in GOAL_HORIZONS) ||
      horizons.has(m.horizon) ||
      !text(m.title, 160) ||
      !m.title.trim() ||
      !text(m.signal) ||
      typeof m.targetDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(m.targetDate) ||
      !Number.isFinite(Date.parse(m.targetDate)) ||
      new Date(m.targetDate).toISOString().slice(0, 10) !== m.targetDate
    )
      throw new Error('Cada meta precisa de um nome e uma data válida, sem repetir o horizonte.')
    horizons.add(m.horizon)
    if (dates.length && m.targetDate < dates[dates.length - 1])
      throw new Error('Organize as datas: curto prazo antes de médio e longo prazo.')
    dates.push(m.targetDate)
  }
  const ids = new Set<string>()
  for (const action of value.actions) {
    if (
      !action ||
      !text(action.id, 200) ||
      !action.id ||
      ids.has(action.id) ||
      !horizons.has(action.horizon) ||
      !text(action.title, 160) ||
      !action.title.trim() ||
      !text(action.frequency, 240) ||
      !text(action.resource) ||
      !text(action.fallback)
    )
      throw new Error('Dê um nome a cada ação e vincule-a a uma meta do planejamento.')
    ids.add(action.id)
  }
}
const key = 'cer-demo-goal-roadmaps-v1'
function demoRecords(): GoalRoadmapRecord[] {
  const values = JSON.parse(localStorage.getItem(key) || '[]')
  if (!Array.isArray(values)) throw new Error('Não foi possível ler o planejamento.')
  values.forEach((r) => validateGoalRoadmap(r.roadmap))
  return values
}
export const goalRoadmapService = {
  async load(enrollmentId: string, directionId: string): Promise<GoalRoadmapRecord | null> {
    if (demoAdapter.isEnabled()) {
      if (enrollmentId !== DEMO_ENROLLMENT_ID)
        throw new Error('Confira a pessoa deste planejamento.')
      const source = (await lifeDirectionsService.list(enrollmentId)).find(
        (d) => d.id === directionId,
      )
      return (
        demoRecords().find(
          (r) =>
            r.enrollment_id === enrollmentId &&
            r.direction_id === directionId &&
            (r.owner_id === demoAdapter.getCurrentUser().id ||
              (r.access_class === 'participant_shared' &&
                source?.access_class === 'participant_shared')),
        ) || null
      )
    }
    const records = await pb.collection('cer_goal_roadmaps').getFullList<GoalRoadmapRecord>({
      filter: pb.filter('enrollment_id = {:enrollment} && direction_id = {:direction}', {
        enrollment: enrollmentId,
        direction: directionId,
      }),
      requestKey: null,
    })
    const result = records[0] || null
    if (result) validateGoalRoadmap(result.roadmap)
    return result
  },
  async save(
    source: LifeDirection,
    roadmap: GoalRoadmap,
    accessClass: GoalRoadmapRecord['access_class'],
    previous?: GoalRoadmapRecord | null,
  ) {
    validateGoalRoadmap(roadmap)
    if (!['participant_private', 'participant_shared'].includes(accessClass))
      throw new Error('Confira o compartilhamento.')
    const demo = demoAdapter.isEnabled()
    const owner = demo ? demoAdapter.getCurrentUser().id : pb.authStore.record?.id
    if (
      !owner ||
      (demo &&
        (demoAdapter.getActivePersona() !== 'mariana' ||
          source.enrollment_id !== DEMO_ENROLLMENT_ID))
    )
      throw new Error('Somente a pessoa pode ajustar seu planejamento.')
    const direction = (await lifeDirectionsService.list(source.enrollment_id)).find(
      (d) => d.id === source.id && d.kind === 'future' && d.enrollment_id === source.enrollment_id,
    )
    if (accessClass === 'participant_shared' && direction?.access_class !== 'participant_shared')
      throw new Error('Compartilhe primeiro a direção para compartilhar suas metas com Daiane.')
    if (!direction) throw new Error('Reabra uma direção disponível desta pessoa.')
    if (
      previous &&
      (previous.owner_id !== owner ||
        previous.direction_id !== source.id ||
        previous.enrollment_id !== source.enrollment_id)
    )
      throw new Error('Este planejamento pertence a outra direção ou pessoa.')
    const current = await this.load(source.enrollment_id, source.id)
    if (
      (current?.id || '') !== (previous?.id || '') ||
      (current?.revision || 0) !== (previous?.revision || 0)
    )
      throw new Error('O planejamento mudou em outra janela. Reabra antes de salvar.')
    const data = {
      enrollment_id: source.enrollment_id,
      direction_id: source.id,
      owner_id: owner,
      revision: (previous?.revision || 0) + 1,
      roadmap,
      access_class: accessClass,
    }
    if (demo) {
      const records = demoRecords()
      const saved = { ...data, id: previous?.id || `demo-roadmap-${crypto.randomUUID()}` }
      localStorage.setItem(
        key,
        JSON.stringify(
          previous ? records.map((r) => (r.id === previous.id ? saved : r)) : [...records, saved],
        ),
      )
      return saved
    }
    return previous
      ? pb.collection('cer_goal_roadmaps').update<GoalRoadmapRecord>(previous.id, data)
      : pb.collection('cer_goal_roadmaps').create<GoalRoadmapRecord>(data)
  },
}
