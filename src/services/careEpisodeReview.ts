import type { DevelopmentExperiment, DevelopmentInput } from './selfDevelopment'
import type { LifeDirection } from './lifeDirections'
import { readCareEpisode } from './careEpisode'

export const EPISODE_REVIEW_RESOURCE_ID = 'cer-care-episode-review-v1'
export const REVIEW_OUTCOMES = {
  tried: 'Experimentei',
  partial: 'Experimentei em parte',
  not_yet: 'Ainda não comecei',
  paused: 'Precisei pausar',
} as const
export type EpisodeReview = {
  version: 1
  episodeId: string
  outcome: keyof typeof REVIEW_OUTCOMES
  observation: string
  adjustment: string
  support: string
}
export function emptyEpisodeReview(episodeId: string): EpisodeReview {
  return { version: 1, episodeId, outcome: 'not_yet', observation: '', adjustment: '', support: '' }
}
export function validateEpisodeReview(value: unknown): asserts value is EpisodeReview {
  if (!value || typeof value !== 'object') throw new Error('Não foi possível ler este retorno.')
  const v = value as EpisodeReview
  if (
    v.version !== 1 ||
    typeof v.episodeId !== 'string' ||
    !v.episodeId ||
    v.episodeId.length > 160 ||
    !Object.hasOwn(REVIEW_OUTCOMES, v.outcome)
  )
    throw new Error('Confira a situação e como foi sua experiência.')
  for (const field of ['observation', 'adjustment', 'support'] as const)
    if (typeof v[field] !== 'string' || v[field].length > 300)
      throw new Error('Cada trecho pode ter até 300 caracteres.')
}
export function readEpisodeReview(record: DevelopmentExperiment): EpisodeReview | null {
  if (record.resource_snapshot?.id !== EPISODE_REVIEW_RESOURCE_ID) return null
  try {
    const value: unknown = JSON.parse(record.reflection)
    validateEpisodeReview(value)
    return value
  } catch {
    return null
  }
}
export function episodeReviewInput(
  source: LifeDirection,
  parent: DevelopmentExperiment,
  review: EpisodeReview,
  shared: boolean,
): DevelopmentInput {
  validateEpisodeReview(review)
  if (
    !readCareEpisode(parent) ||
    review.episodeId !== parent.id ||
    parent.enrollment_id !== source.enrollment_id ||
    parent.direction_id !== source.id
  )
    throw new Error('Este retorno precisa estar ligado à situação desta direção.')
  if (shared && parent.access_class !== 'participant_shared')
    throw new Error(
      'Compartilhe primeiro a situação para sua profissional acompanhar este retorno junto dela.',
    )
  if (!review.observation.trim())
    throw new Error('Conte o que percebeu, mesmo que ainda não tenha começado.')
  if (!review.adjustment.trim())
    throw new Error('Escolha como deseja seguir, inclusive se precisar pausar.')
  return {
    enrollment_id: source.enrollment_id,
    direction_id: source.id,
    resource_snapshot: {
      id: EPISODE_REVIEW_RESOURCE_ID,
      title: 'Meu caminho na prática',
      theme: 'Experiência e ajuste',
      duration: 'No seu ritmo',
      lesson:
        'Experimentar, perceber e ajustar ajuda a encontrar um caminho que você consiga sustentar.',
      instructions: ['Reconheça como foi.', 'Conte o que percebeu.', 'Escolha um ajuste possível.'],
      fallback: 'Você pode pausar e conversar com sua profissional.',
      reflection: 'O que aprendi e como quero seguir?',
    },
    goal: source.title,
    action: parent.action,
    context: 'Retorno de uma experiência ligada à direção de cuidado.',
    signal: '',
    fallback: review.support,
    reflection: JSON.stringify(review),
    next_step: review.adjustment,
    scheduled_at: '',
    status: 'planned',
    access_class: shared ? 'participant_shared' : 'participant_private',
  }
}
export function episodeReviewReading(review: EpisodeReview) {
  const readings = {
    tried:
      'Você colocou sua escolha em prática. Observar o que ela trouxe ajuda a reconhecer o que vale manter e o que pode ser ajustado; uma tentativa não precisa resolver tudo para ensinar algo.',
    partial:
      'Você encontrou espaço para experimentar uma parte. Esse começo ajuda a descobrir qual tamanho de passo cabe no seu momento e de que apoio precisa para continuar.',
    not_yet:
      'Ainda não ter começado também oferece informação. As condições da sua vida, o tamanho do passo e os apoios disponíveis entram nessa escolha. Ajustar o começo pode torná-lo mais possível.',
    paused:
      'Você reconheceu que precisava pausar. O cuidado pode incluir diminuir a exigência, buscar apoio ou rever o momento de continuar. Sua direção pode permanecer, mesmo que o ritmo mude.',
  }
  return readings[review.outcome]
}
