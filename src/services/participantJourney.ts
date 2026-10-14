/** Navigation acknowledgements only. Clinical answers remain in their original services. */
export type JourneyMoment = 'past' | 'map' | 'present' | 'future' | 'care'
export const JOURNEY_MOMENTS: JourneyMoment[] = ['past', 'map', 'present', 'future', 'care']
const key = (owner: string, enrollment: string) => `cer-journey-position-v1:${owner}:${enrollment}`
export function readJourneyMoment(owner: string, enrollment: string): JourneyMoment {
  try {
    const value = localStorage.getItem(key(owner, enrollment))
    return JOURNEY_MOMENTS.includes(value as JourneyMoment) ? (value as JourneyMoment) : 'past'
  } catch {
    return 'past'
  }
}
export function saveJourneyMoment(owner: string, enrollment: string, moment: JourneyMoment) {
  if (!owner || !enrollment || !JOURNEY_MOMENTS.includes(moment))
    throw new Error('Confira a etapa da jornada.')
  localStorage.setItem(key(owner, enrollment), moment)
}
export function nextConsciousnessExperience<
  T extends { experienceId: string; completed: boolean; started: boolean },
>(dimensions: T[], exclude?: string) {
  return (
    dimensions.find((d) => d.experienceId !== exclude && !d.completed && d.started) ||
    dimensions.find((d) => d.experienceId !== exclude && !d.completed)
  )
}

export function careJourneyNextStep(hasPresentedPlan: boolean, responseType?: string) {
  if (!hasPresentedPlan)
    return {
      label: 'Combinar o cuidado em Equilíbrio & Realização',
      button: 'Retomar meu percurso',
      planner: false,
    }
  if (
    ['too_much', 'wants_to_talk', 'wants_to_adapt', 'not_now', 'alternative_requested'].includes(
      responseType || '',
    )
  )
    return {
      label: 'Conversar com Daiane e ajustar o cuidado antes de seguir',
      button: 'Rever meu plano e meu retorno',
      planner: false,
    }
  return {
    label: 'Escolher como meu plano de cuidado cabe nesta semana',
    button: 'Levar meu cuidado para o Planner',
    planner: true,
  }
}
