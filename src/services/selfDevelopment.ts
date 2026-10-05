import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
import { DEVELOPMENT_CATALOG, type DevelopmentResource } from './developmentCatalog'
import { lifeDirectionsService } from './lifeDirections'

export type DevelopmentStatus = 'planned' | 'experimenting' | 'paused' | 'completed' | 'reviewed'
export interface DevelopmentExperiment {
  id: string
  enrollment_id: string
  direction_id: string
  resource_snapshot: DevelopmentResource
  goal: string
  action: string
  context: string
  fallback: string
  signal: string
  scheduled_at: string
  reflection: string
  next_step: string
  status: DevelopmentStatus
  access_class: 'participant_private' | 'participant_shared'
  created?: string
  updated?: string
}
export type DevelopmentInput = Omit<DevelopmentExperiment, 'id' | 'created' | 'updated'>
export interface EditorialResource extends DevelopmentResource {
  author_user_id: string
  status: 'draft' | 'published' | 'archived'
}
const statuses: DevelopmentStatus[] = [
  'planned',
  'experimenting',
  'paused',
  'completed',
  'reviewed',
]
const demoKey = 'cer-demo-self-development-v1'
const editorialKey = 'cer-demo-development-resources-v1'

function assertDemoEnrollment(enrollmentId: string, writing = false) {
  if (
    enrollmentId !== DEMO_ENROLLMENT_ID ||
    (writing && demoAdapter.getActivePersona() !== 'mariana')
  )
    throw new Error('Este registro pertence à interagente desta demonstração.')
}
export function validateDevelopment(value: DevelopmentInput) {
  if (!value.enrollment_id || !statuses.includes(value.status))
    throw new Error('Confira o registro.')
  if (!['participant_private', 'participant_shared'].includes(value.access_class))
    throw new Error('Confira a privacidade.')
  for (const name of [
    'goal',
    'action',
    'context',
    'fallback',
    'signal',
    'reflection',
    'next_step',
  ] as const)
    if (typeof value[name] !== 'string' || value[name].length > 5000)
      throw new Error('Cada texto pode ter até 5.000 caracteres.')
  if (!value.goal.trim() || !value.action.trim() || !value.context.trim())
    throw new Error('Escolha uma direção, um pequeno passo e quando ou em que situação tentará.')
  if (value.scheduled_at && !Number.isFinite(Date.parse(value.scheduled_at)))
    throw new Error('Confira a data escolhida.')
  if (value.status === 'reviewed' && !value.reflection.trim())
    throw new Error('Registre o que aprendeu antes de concluir a revisão.')
  validateResource(value.resource_snapshot)
}
export function validateResource(value: DevelopmentResource) {
  if (
    !value ||
    typeof value.id !== 'string' ||
    !value.id ||
    !value.title?.trim() ||
    value.title.length > 160 ||
    !value.lesson?.trim()
  )
    throw new Error('Informe título e ensinamento.')
  if (
    !Array.isArray(value.instructions) ||
    !value.instructions.length ||
    value.instructions.length > 12 ||
    value.instructions.some((s) => typeof s !== 'string' || !s.trim() || s.length > 1500)
  )
    throw new Error('Escreva de 1 a 12 passos curtos.')
  for (const key of ['lesson', 'fallback', 'reflection', 'theme', 'duration'] as const)
    if (typeof value[key] !== 'string' || value[key].length > 5000)
      throw new Error('Confira os textos do recurso.')
}
export function visibleDevelopment(
  records: DevelopmentExperiment[],
  enrollmentId: string,
  professional: boolean,
) {
  return records.filter(
    (r) =>
      r.enrollment_id === enrollmentId &&
      (!professional || r.access_class === 'participant_shared'),
  )
}
function readDemo(): DevelopmentExperiment[] {
  const values = JSON.parse(localStorage.getItem(demoKey) || '[]')
  if (!Array.isArray(values)) throw new Error('Não foi possível ler seus registros.')
  values.forEach(validateDevelopment)
  return values
}
export const selfDevelopmentService = {
  async list(enrollmentId: string): Promise<DevelopmentExperiment[]> {
    if (demoAdapter.isEnabled()) {
      assertDemoEnrollment(enrollmentId)
      return visibleDevelopment(
        readDemo(),
        enrollmentId,
        demoAdapter.getActivePersona() === 'daiane',
      )
    }
    return pb
      .collection('cer_development_experiments')
      .getFullList<DevelopmentExperiment>({
        filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
        sort: '-created',
        requestKey: null,
      })
  },
  async save(value: DevelopmentInput, id?: string): Promise<DevelopmentExperiment> {
    validateDevelopment(value)
    if (demoAdapter.isEnabled()) assertDemoEnrollment(value.enrollment_id, true)
    if (value.direction_id) {
      const source = (await lifeDirectionsService.list(value.enrollment_id)).find(
        (d) =>
          d.id === value.direction_id &&
          d.enrollment_id === value.enrollment_id &&
          d.kind === 'future',
      )
      if (!source)
        throw new Error('Escolha um futuro desta pessoa ou planeje sem vincular um registro.')
    }
    const payload: DevelopmentInput = {
      enrollment_id: value.enrollment_id,
      direction_id: value.direction_id,
      resource_snapshot: value.resource_snapshot,
      goal: value.goal.trim(),
      action: value.action.trim(),
      context: value.context,
      fallback: value.fallback,
      signal: value.signal,
      scheduled_at: value.scheduled_at,
      reflection: value.reflection,
      next_step: value.next_step,
      status: value.status,
      access_class: value.access_class,
    }
    if (demoAdapter.isEnabled()) {
      const values = readDemo()
      const old = id
        ? values.find((r) => r.id === id && r.enrollment_id === value.enrollment_id)
        : undefined
      if (id && !old) throw new Error('Registro não encontrado. Recarregue e tente novamente.')
      if (!id && value.status !== 'planned') throw new Error('Comece planejando seu passo.')
      if (
        old &&
        (JSON.stringify(old.resource_snapshot) !== JSON.stringify(value.resource_snapshot) ||
          old.direction_id !== value.direction_id)
      )
        throw new Error('A origem e o conteúdo desta tentativa são preservados.')
      if (old?.status === 'reviewed') {
        for (const field of [
          'goal',
          'action',
          'context',
          'fallback',
          'signal',
          'reflection',
          'next_step',
          'scheduled_at',
          'status',
        ] as const)
          if (old[field] !== value[field])
            throw new Error('A revisão concluída é preservada. Crie uma nova tentativa.')
      }
      const now = new Date().toISOString()
      const record: DevelopmentExperiment = {
        ...payload,
        id: id || `demo-development-${crypto.randomUUID()}`,
        created: old?.created || now,
        updated: now,
      }
      localStorage.setItem(
        demoKey,
        JSON.stringify(id ? values.map((r) => (r.id === id ? record : r)) : [record, ...values]),
      )
      return record
    }
    return id
      ? pb.collection('cer_development_experiments').update<DevelopmentExperiment>(id, payload)
      : pb.collection('cer_development_experiments').create<DevelopmentExperiment>(payload)
  },
  async catalog(): Promise<{ resources: DevelopmentResource[]; warning?: string }> {
    try {
      const additions = demoAdapter.isEnabled()
        ? (JSON.parse(localStorage.getItem(editorialKey) || '[]') as EditorialResource[])
        : await pb
            .collection('cer_development_resources')
            .getFullList<EditorialResource>({ filter: 'status = "published"', requestKey: null })
      const published = additions.filter((r) => r.status === 'published')
      published.forEach(validateResource)
      return {
        resources: [
          ...DEVELOPMENT_CATALOG,
          ...published.map(
            ({ id, title, theme, lesson, instructions, fallback, reflection, duration }) => ({
              id,
              title,
              theme,
              lesson,
              instructions,
              fallback,
              reflection,
              duration,
            }),
          ),
        ],
      }
    } catch {
      return {
        resources: DEVELOPMENT_CATALOG,
        warning:
          'O acervo inicial está disponível. Não foi possível carregar os recursos adicionais agora.',
      }
    }
  },
  async editorialList(): Promise<EditorialResource[]> {
    if (demoAdapter.isEnabled()) {
      if (demoAdapter.getActivePersona() !== 'daiane')
        throw new Error('Acesso profissional necessário.')
      return JSON.parse(localStorage.getItem(editorialKey) || '[]')
    }
    const author = pb.authStore.record?.id
    if (!author) throw new Error('Entre na sua conta profissional.')
    return pb
      .collection('cer_development_resources')
      .getFullList<EditorialResource>({
        filter: pb.filter('author_user_id = {:id}', { id: author }),
        sort: '-created',
        requestKey: null,
      })
  },
  async saveResource(
    value: Omit<EditorialResource, 'id' | 'author_user_id'>,
    id?: string,
  ): Promise<EditorialResource> {
    validateResource({ ...value, id: id || 'new-resource' })
    if (!['draft', 'published', 'archived'].includes(value.status))
      throw new Error('Confira o estado do recurso.')
    if (demoAdapter.isEnabled() && demoAdapter.getActivePersona() !== 'daiane')
      throw new Error('Acesso profissional necessário.')
    const old = id ? (await this.editorialList()).find((r) => r.id === id) : undefined
    if (id && (!old || old.status !== 'draft'))
      throw new Error('Crie uma nova versão para preservar o recurso já publicado.')
    const author = demoAdapter.isEnabled()
      ? demoAdapter.getCurrentUser().id
      : pb.authStore.record?.id
    if (!author) throw new Error('Entre na sua conta.')
    if (demoAdapter.isEnabled()) {
      const values = await this.editorialList()
      const record = {
        ...value,
        id: id || `demo-resource-${crypto.randomUUID()}`,
        author_user_id: author,
      }
      localStorage.setItem(
        editorialKey,
        JSON.stringify(id ? values.map((r) => (r.id === id ? record : r)) : [record, ...values]),
      )
      return record
    }
    return id
      ? pb.collection('cer_development_resources').update<EditorialResource>(id, value)
      : pb
          .collection('cer_development_resources')
          .create<EditorialResource>({ ...value, author_user_id: author })
  },
  async archiveResource(id: string): Promise<void> {
    const old = (await this.editorialList()).find((r) => r.id === id)
    if (!old) throw new Error('Recurso não encontrado.')
    if (demoAdapter.isEnabled()) {
      const values = await this.editorialList()
      localStorage.setItem(
        editorialKey,
        JSON.stringify(values.map((r) => (r.id === id ? { ...r, status: 'archived' } : r))),
      )
      return
    }
    await pb.collection('cer_development_resources').update(id, { status: 'archived' })
  },
}
