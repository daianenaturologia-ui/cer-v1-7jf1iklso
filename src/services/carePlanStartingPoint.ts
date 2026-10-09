import type { LifeDirection } from './lifeDirections'
import type { DevelopmentExperiment } from './selfDevelopment'
import { readCareEpisode } from './careEpisode'
import { readEpisodeReview } from './careEpisodeReview'

/** Professional projection: a return only belongs here while its parent is also shared. */
export function carePlanChoices(source: LifeDirection, records: DevelopmentExperiment[]) {
  if (source.kind !== 'future' || source.access_class !== 'participant_shared') return []
  const visible = records.filter(
    (r) =>
      r.enrollment_id === source.enrollment_id &&
      r.direction_id === source.id &&
      r.access_class === 'participant_shared',
  )
  return visible
    .filter((r) => readCareEpisode(r))
    .map((parent) => {
      const latest = visible
        .filter((r) => readEpisodeReview(r)?.episodeId === parent.id)
        .sort(
          (a, b) => (b.created || '').localeCompare(a.created || '') || b.id.localeCompare(a.id),
        )[0]
      const review = latest ? readEpisodeReview(latest) : null
      const episode = readCareEpisode(parent)!
      return {
        id: latest?.id || parent.id,
        action: review ? review.adjustment : episode.alternative,
        support: review ? review.support : episode.support,
        outcome: review?.outcome,
        observation: review?.observation || '',
        needsConversation:
          review?.outcome === 'paused' ||
        /pausar e conversar|compreender melhor juntas|antes de escolher uma ação/i.test(
            review ? review.adjustment : episode.alternative,
          ),
      }
    })
}

export function directionCareContext(source: LifeDirection) {
  return [
    source.resources && `Recursos e apoios: ${source.resources}`,
    source.limits && `Disposição e limites: ${source.limits}`,
    source.first_step && `Primeiro passo escolhido: ${source.first_step}`,
  ]
    .filter(Boolean)
    .join('\n')
}
