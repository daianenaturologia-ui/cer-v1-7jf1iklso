import pb from '@/lib/pocketbase/client'
import { demoAdapter } from './demoAdapter'

export interface CommunityPractice {
  title: string
  theme: string
  duration: string
  instructions: string
  experience: string
  display_name: string
}
export type ContributionStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'changes_requested'
  | 'withdrawn'
export interface Contribution {
  id: string
  payload: CommunityPractice
  status: ContributionStatus
  revision: number
  review_note: string
  updated: string
}
export interface CommunityPost {
  id: string
  payload: CommunityPractice
  created: string
}
export interface LibraryComment {
  id: string
  display_name: string
  body: string
  created: string
  mine: boolean
}
export interface CommunityPage<T> {
  items: T[]
  has_more: boolean
  page: number
}
export interface ReviewEntry {
  id: string
  decision: string
  note: string
  revision: number
  created: string
}
export const emptyCommunityPractice = (): CommunityPractice => ({
  title: '',
  theme: '',
  duration: '',
  instructions: '',
  experience: '',
  display_name: '',
})
export const contributionLabels: Record<ContributionStatus, string> = {
  draft: 'Rascunho privado',
  pending: 'Aguardando avaliação de Daiane',
  approved: 'Aprovada e publicada',
  changes_requested: 'Revisar antes de reenviar',
  withdrawn: 'Retirada',
}
export function validateCommunityPractice(p: CommunityPractice, complete = false) {
  const limits: Record<keyof CommunityPractice, number> = {
    title: 160,
    theme: 100,
    duration: 100,
    instructions: 6000,
    experience: 3000,
    display_name: 60,
  }
  if (!p || Object.keys(p).some((k) => !(k in limits))) throw Error('Confira sua prática.')
  for (const k of Object.keys(limits) as (keyof CommunityPractice)[]) {
    if (
      typeof p[k] !== 'string' ||
      p[k].length > limits[k] ||
      (complete &&
        ['title', 'instructions', 'experience', 'display_name'].includes(k) &&
        !p[k].trim())
    )
      throw Error(
        'Preencha título, passo a passo, experiência e nome de publicação, respeitando os limites de cada campo.',
      )
  }
}
interface DemoContribution extends Contribution {
  owner: string
  post_id?: string
}
interface DemoComment extends Omit<LibraryComment, 'mine'> {
  owner: string
  target_key: string
  withdrawn: boolean
}
interface DemoReview extends ReviewEntry {
  submission_id: string
}
interface DemoCommunity {
  contributions: DemoContribution[]
  posts: (CommunityPost & { available: boolean })[]
  comments: DemoComment[]
  reviews: DemoReview[]
}
const demoKey = 'cer-demo-library-community-v1'
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v))
const recordDto = ({ owner: _owner, post_id: _post, ...v }: DemoContribution): Contribution =>
  copy(v)
const now = () => new Date().toISOString()
// Isolated fictitious community. No network requests or clinical-data imports in demonstration.
function demoCommand(action: string, b: Record<string, unknown>) {
  const db: DemoCommunity = JSON.parse(
    localStorage.getItem(demoKey) || '{"contributions":[],"posts":[],"comments":[],"reviews":[]}',
  )
  const actor = demoAdapter.getCurrentUser().id,
    curator = demoAdapter.getActivePersona() === 'daiane'
  const persist = () => localStorage.setItem(demoKey, JSON.stringify(db))
  const requireCurator = () => {
    if (!curator) throw Error('Somente Daiane pode avaliar as contribuições.')
  }
  const find = () => {
    const r = db.contributions.find((r) => r.id === b.id)
    if (!r) throw Error('Contribuição não encontrada.')
    return r
  }
  const own = (r: DemoContribution) => {
    if (r.owner !== actor) throw Error('Esta contribuição é de outra pessoa.')
  }
  const revision = (r: DemoContribution) => {
    if (r.revision !== b.revision) throw Error('Esta versão mudou. Atualize antes de continuar.')
  }
  const unpublish = (r: DemoContribution) => {
    const p = db.posts.find((p) => p.id === r.post_id)
    if (p) p.available = false
  }
  const audit = (r: DemoContribution, decision: string, note = '') =>
    db.reviews.unshift({
      id: crypto.randomUUID(),
      submission_id: r.id,
      decision,
      note,
      revision: r.revision,
      created: now(),
    })
  const page = Number(b.page || 1)
  const paginate = <T>(items: T[]): CommunityPage<T> => ({
    items: items.slice((page - 1) * 20, page * 20),
    has_more: items.length > page * 20,
    page,
  })
  const target = () => {
    const key = String(b.target_key || '')
    if (
      key.startsWith('community:') &&
      !db.posts.some((p) => 'community:' + p.id === key && p.available)
    )
      throw Error('Esta prática não está disponível.')
    if (!/^(community|catalog):.+/.test(key)) throw Error('Prática inválida.')
    return key
  }
  if (action === 'access') return { curator }
  if (action === 'feed')
    return paginate(db.posts.filter((p) => p.available).map(({ available: _available, ...p }) => p))
  if (action === 'mine')
    return paginate(db.contributions.filter((r) => r.owner === actor).map(recordDto))
  if (action === 'queue') {
    requireCurator()
    return paginate(
      db.contributions.filter((r) => ['pending', 'approved'].includes(r.status)).map(recordDto),
    )
  }
  if (action === 'history') {
    requireCurator()
    return paginate(
      db.reviews
        .filter((r) => r.submission_id === b.id)
        .map(({ submission_id: _submission, ...r }) => r),
    )
  }
  if (action === 'save') {
    const p = b.payload as CommunityPractice
    validateCommunityPractice(p, b.submit === true)
    if (b.submit === true && b.consent !== true)
      throw Error('Confirme o envio para avaliação e a publicação após aprovação.')
    let r: DemoContribution
    if (b.id) {
      r = find()
      own(r)
      revision(r)
      unpublish(r)
    } else {
      r = {
        id: crypto.randomUUID(),
        owner: actor,
        payload: emptyCommunityPractice(),
        status: 'draft',
        revision: 0,
        review_note: '',
        updated: now(),
      }
      db.contributions.unshift(r)
    }
    r.payload = copy(p)
    r.revision++
    r.status = b.submit === true ? 'pending' : 'draft'
    r.review_note = ''
    r.updated = now()
    audit(r, b.submit === true ? 'submitted' : 'draft_saved')
    persist()
    return recordDto(r)
  }
  if (action === 'withdraw') {
    const r = find()
    own(r)
    revision(r)
    unpublish(r)
    r.status = 'withdrawn'
    r.revision++
    r.updated = now()
    audit(r, 'withdrawn')
    persist()
    return recordDto(r)
  }
  if (action === 'review') {
    requireCurator()
    const r = find()
    revision(r)
    const decision = String(b.decision),
      note = String(b.note || '').trim()
    if (
      !['approve', 'request_changes', 'unpublish'].includes(decision) ||
      (decision === 'unpublish' ? r.status !== 'approved' : r.status !== 'pending')
    )
      throw Error('Atualize a fila antes de avaliar.')
    if (decision !== 'approve' && !note)
      throw Error('Informe o motivo para a pessoa revisar sua prática.')
    unpublish(r)
    if (decision === 'approve') {
      validateCommunityPractice(r.payload, true)
      r.post_id = crypto.randomUUID()
      db.posts.unshift({ id: r.post_id, payload: copy(r.payload), created: now(), available: true })
      r.status = 'approved'
    } else r.status = 'changes_requested'
    r.revision++
    r.review_note = note
    r.updated = now()
    audit(r, decision, note)
    persist()
    return recordDto(r)
  }
  if (action === 'comments') {
    const key = target()
    return paginate(
      db.comments
        .filter((c) => c.target_key === key && !c.withdrawn)
        .map(({ owner, target_key: _target, withdrawn: _withdrawn, ...c }) => ({
          ...c,
          mine: owner === actor,
        })),
    )
  }
  if (action === 'comment') {
    const key = target(),
      name = String(b.display_name || '').trim(),
      body = String(b.body || '').trim()
    if (b.consent !== true || !name || name.length > 60 || !body || body.length > 2000)
      throw Error('Confira seu nome, relato e a confirmação de publicação.')
    const r: DemoComment = {
      id: crypto.randomUUID(),
      owner: actor,
      target_key: key,
      display_name: name,
      body,
      created: now(),
      withdrawn: false,
    }
    db.comments.unshift(r)
    persist()
    return { id: r.id, display_name: name, body, created: r.created, mine: true }
  }
  if (action === 'remove_comment') {
    const r = db.comments.find((r) => r.id === b.id)
    if (!r) throw Error('Comentário não encontrado.')
    if (r.owner !== actor) {
      requireCurator()
      if (!b.note) throw Error('Informe o motivo da moderação.')
    }
    r.withdrawn = true
    persist()
    return { ok: true }
  }
  throw Error('Operação inválida.')
}
async function command<T>(action: string, b: Record<string, unknown> = {}): Promise<T> {
  if (demoAdapter.isEnabled()) return copy(demoCommand(action, b)) as T
  return pb.send<T>('/backend/v1/cer/library', {
    method: 'POST',
    body: { ...b, action },
    requestKey: null,
  })
}
export const libraryCommunity = {
  access: () => command<{ curator: boolean }>('access'),
  feed: (page = 1) => command<CommunityPage<CommunityPost>>('feed', { page }),
  mine: (page = 1) => command<CommunityPage<Contribution>>('mine', { page }),
  queue: (page = 1) => command<CommunityPage<Contribution>>('queue', { page }),
  history: (id: string, page = 1) => command<CommunityPage<ReviewEntry>>('history', { id, page }),
  save: (payload: CommunityPractice, submit: boolean, consent: boolean, current?: Contribution) => {
    validateCommunityPractice(payload, submit)
    return command<Contribution>('save', {
      payload,
      submit,
      consent,
      ...(current ? { id: current.id, revision: current.revision } : {}),
    })
  },
  withdraw: (r: Contribution) =>
    command<Contribution>('withdraw', { id: r.id, revision: r.revision }),
  review: (r: Contribution, decision: 'approve' | 'request_changes' | 'unpublish', note: string) =>
    command<Contribution>('review', { id: r.id, revision: r.revision, decision, note }),
  comments: (target_key: string, page = 1) =>
    command<CommunityPage<LibraryComment>>('comments', { target_key, page }),
  comment: (target_key: string, display_name: string, body: string, consent: boolean) =>
    command<LibraryComment>('comment', { target_key, display_name, body, consent }),
  removeComment: (id: string, note = '') =>
    command<{ ok: boolean }>('remove_comment', { id, note }),
}
