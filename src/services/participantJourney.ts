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
