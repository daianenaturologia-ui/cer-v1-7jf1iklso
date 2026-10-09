import type { ExperienceResponseRecord } from '@/types/cer'
import { buildCerMapReadings } from './cerMapReadings'
import { ayurvedaCareDirections, ayurvedaReviewWindow } from './ayurvedaCareReasoning'
import { completedCurrentResponses } from './ayurvedaCurrentInterpretation'

export interface AyurvedaCarePriority {
  id: string
  title: string
  description: string
  directions: string[]
  evidence: string[]
  monitoring: string[]
  professionalRationale: string
}

/** Private, editable planning support; no prescriptions or changes to an existing plan. */
export function buildAyurvedaCarePriorities(
  responses: ExperienceResponseRecord[],
  enrollmentId: string,
  participantName: string,
) {
  const records = responses.filter((r) => r.enrollment_id === enrollmentId)
  const snapshot = buildCerMapReadings(records, enrollmentId, participantName, {
    literalOnly: true,
  })
  const body = snapshot.dimensions.find((d) => d.id === 'corpo')
  const reading = body?.ayurvedaReading
  const review = ayurvedaReviewWindow(records)
  const priorities: AyurvedaCarePriority[] = []
  if (!reading) return { priorities, review }
  const directions = ayurvedaCareDirections(body?.ayurvedaConstitution || [], reading)
  const add = (
    id: string,
    title: string,
    description: string,
    labels: string[],
    evidence: string[],
    monitoring: string[],
  ) => {
    const selected = directions.filter((d) => labels.includes(d.label))
    if (!selected.length || !evidence.length) return
    const rows = selected.map((d) => `${d.label} ${d.symbol}: ${d.action}`)
    priorities.push({
      id,
      title,
      description,
      directions: rows,
      evidence: [...new Set(evidence)],
      monitoring,
      professionalRationale: [
        `Ayurveda · Base: ${body?.ayurvedaConstitution?.join('–') || 'Em observação'} · Momento: ${reading.currentDoshas.join('–') || 'Em observação'}`,
        ...rows,
        ...selected.map((d) => d.reason),
        `Respostas que sustentam esta prioridade: ${[...new Set(evidence)].join(' | ')}`,
        `Acompanhar em 35 dias: ${monitoring.join('; ')}`,
        review
          ? `Avaliação concluída em ${review.assessedAt}. Reavaliar a partir de ${review.dueAt}.`
          : 'Data da avaliação atual ainda não registrada.',
        `Respostas de origem do mapa: ${completedCurrentResponses(records)
          .map((r) => r.id)
          .join(', ')}`,
      ].join('\n'),
    })
  }
  if (reading.currentDoshas.length)
    add(
      'ayurveda-ritmo',
      'Recuperar um ritmo corporal mais estável',
      'Construir um ritmo cotidiano que favoreça disposição e estabilidade, aproximando seu funcionamento atual das suas tendências de base.',
      ['Vata', 'Pitta', 'Kapha'],
      reading.currentFacts,
      [
        'Mudanças nos sinais atuais registrados abaixo',
        'Disposição e recuperação ao longo do dia',
        'Tolerância e viabilidade dos cuidados na rotina',
      ],
    )
  if (reading.currentDigestive)
    add(
      'ayurveda-agni',
      'Regular fome e digestão',
      'Favorecer uma digestão mais confortável e um ritmo de fome mais estável, respeitando os sinais do seu corpo.',
      ['Agni'],
      reading.agniEvidence,
      [
        'Ritmo da fome',
        'Conforto e tempo percebido da digestão',
        'Energia após as refeições',
        'Persistência ou surgimento de calor, queimação ou acidez',
      ],
    )
  if (reading.currentDigestive && reading.amaPresence === 'Sinalizada')
    add(
      'ayurveda-ama',
      'Diminuir os sinais de processamento incompleto',
      'Acompanhar a redução dos sinais atuais de processamento incompleto e recuperar conforto e disposição, com cuidados que você consiga sustentar.',
      ['Ama'],
      reading.amaEvidence,
      [
        'Frequência e intensidade dos sinais de Ama registrados abaixo',
        'Conforto digestivo e eliminação',
        'Disposição e tolerância ao cuidado',
      ],
    )
  return { priorities, review }
}
