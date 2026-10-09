import type { AyurvedaBodyReading } from '@/types/cerMapReadings'
import type { ExperienceResponseRecord } from '@/types/cer'
import { completedCurrentResponses } from './ayurvedaCurrentInterpretation'
import { getResponseAnsweredAt } from './ayurvedaChapter3'

export type CareDirection = { label: string; symbol: string; action: string; reason: string }
/** Decision support within the Ayurvedic framework, never a prescription or a deficiency score. */
export function ayurvedaCareDirections(constitution: string[], reading?: AyurvedaBodyReading) {
  const directions: CareDirection[] = []
  if (!reading) return directions
  for (const dosha of reading.currentDoshas) {
    directions.push({
      label: dosha,
      symbol: '↓',
      action: `Reduzir o agravamento de ${dosha}`,
      reason: `${dosha} aparece nos sinais atuais de alteração em relação ao habitual. ${reading.currentSummary}`,
    })
  }
  const slow =
    reading.currentDigestive &&
    reading.agniEvidence.some((e) =>
      /leve e demorar|sem perceber fome|peso|digestão demorasse|queda de energia/i.test(e),
    )
  const heat =
    reading.currentDigestive &&
    reading.agniEvidence.some((e) => /queimação|acidez|calor|intensa/i.test(e))
  if (
    constitution.includes('Pitta') &&
    reading.currentDoshas.includes('Kapha') &&
    slow &&
    !heat &&
    !reading.currentDoshas.includes('Pitta')
  ) {
    directions.push({
      label: 'Pitta',
      symbol: '↑',
      action: 'Apoiar a função de transformação',
      reason:
        'Hipótese de cuidado: a base inclui Pitta, mas o momento mostra agravamento de Kapha e lentidão digestiva. Considerar favorecer a função de Pitta ao regular Agni, sem estimular calor indiscriminadamente. Isso não mede deficiência de Pitta.',
    })
  }
  directions.push({
    label: 'Agni',
    symbol: reading.currentDigestive ? (slow && !heat ? '↑' : '↔') : '?',
    action: reading.currentDigestive ? 'Regular o ritmo digestivo' : 'Caracterizar Agni atual',
    reason: reading.currentDigestive
      ? `${reading.agniType}. ${reading.agniSummary}`
      : 'O registro disponível descreve o funcionamento habitual; é preciso uma leitura atual para orientar mudanças.',
  })
  const ama = reading.currentDigestive && reading.amaPresence === 'Sinalizada'
  directions.push({
    label: 'Ama',
    symbol: ama ? '↓' : '↔',
    action: ama ? 'Reduzir os sinais de Ama' : 'Acompanhar os sinais de Ama',
    reason: `${reading.amaPresence}. ${reading.amaSummary}${ama ? ' A estratégia de cuidado e eventual abordagem de desintoxicação serão definidas em sessão, considerando condições de saúde e tolerância.' : ''}`,
  })
  return directions
}

/** Rolling 35-day CER review, anchored to the latest completed current-body assessment. */
export function ayurvedaReviewWindow(responses: ExperienceResponseRecord[], now = new Date()) {
  const current = completedCurrentResponses(responses)
  const completed = current.filter((r) => (r.structured_value as any)?.completed === true)
  const last = completed.map(getResponseAnsweredAt).filter(Boolean).sort().at(-1)
  if (!last || Number.isNaN(Date.parse(last))) return undefined
  const due = new Date(Date.parse(last) + 35 * 24 * 60 * 60 * 1000)
  return { assessedAt: last, dueAt: due.toISOString(), due: now.getTime() >= due.getTime() }
}
