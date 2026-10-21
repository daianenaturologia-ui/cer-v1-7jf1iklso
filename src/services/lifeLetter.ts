import type { LifeDirection } from './lifeDirections'
export const LIFE_LETTER_TITLE = 'Minha carta para o próximo capítulo'
export const LIFE_LETTER_HEADER = 'Cartas do próximo capítulo'
export function isLifeLetter(value: LifeDirection) {
  return (
    value.kind === 'present' &&
    !value.archived &&
    (value.title === LIFE_LETTER_TITLE ||
      value.title === 'O que escolho levar da minha história' ||
      value.narrative.startsWith(LIFE_LETTER_HEADER + '\n'))
  )
}
export function addLetterToPriorities(priorities: string, letter: LifeDirection) {
  const text = `Carta · ${letter.title}\n${letter.narrative}`
  if (priorities.includes(text)) return priorities
  const next = priorities.trim() ? `${priorities.trim()}\n\n${text}` : text
  if (next.length > 10000)
    throw new Error(
      'As prioridades já estão extensas. Resuma o texto antes de acrescentar a carta.',
    )
  return next
}
