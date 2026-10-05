import type { LifeDirection } from './lifeDirections'
import type { CerCarePlanRecord, CerCarePlanPriorityRecord } from '@/types/cer'

/** Sources remain participant-authored. Choosing a source never chooses a goal. */
export function sharedFutureDirections(values: LifeDirection[], enrollmentId: string) {
  return values.filter(v => v.enrollment_id === enrollmentId && v.kind === 'future' &&
    v.access_class === 'participant_shared')
}

export function requireSharedFuture(values: LifeDirection[], enrollmentId: string, id: string) {
  const source = sharedFutureDirections(values, enrollmentId).find(v => v.id === id)
  if (!source) throw new Error('Esta direção não está mais compartilhada. Reabra o plano e escolha uma direção disponível.')
  return source
}

/** Only deliberately shareable priorities enter the editable presentation snapshot. */
export function developmentPresentation(
  plan: Pick<CerCarePlanRecord, 'direction_statement'>,
  priorities: CerCarePlanPriorityRecord[],
) {
  const shared = priorities.filter(p => p.is_possible_now &&
    ['shared_care', 'participant_shared'].includes(p.access_class))
  return `Direção que combinamos: ${plan.direction_statement || ''}\n\nO que queremos cultivar neste ciclo:\n` +
    shared.map(p => `• ${p.title}${p.description ? `\n${p.description}` : ''}`).join('\n\n')
}

export const DEVELOPMENT_REVIEW_PROMPT = 'O que descobriu sobre seu jeito e seu ritmo? O que ajudou ou dificultou? O que consegue conduzir com mais autonomia, que apoio ainda precisa e o que deseja manter, ajustar ou retomar?'
