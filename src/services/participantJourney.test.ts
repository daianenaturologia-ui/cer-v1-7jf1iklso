import { beforeEach, expect, it } from 'vitest'
import {
  careJourneyNextStep,
  readJourneyMoment,
  saveJourneyMoment,
  nextConsciousnessExperience,
} from './participantJourney'
beforeEach(() => localStorage.clear())
it('preserva a retomada por pessoa e matrícula, sem alterar respostas', () => {
  localStorage.setItem('clinical-records', 'original')
  saveJourneyMoment('one', 'enr', 'present')
  expect(readJourneyMoment('one', 'enr')).toBe('present')
  expect(readJourneyMoment('two', 'enr')).toBe('past')
  expect(readJourneyMoment('one', 'other')).toBe('past')
  expect(localStorage.getItem('clinical-records')).toBe('original')
})
it('retoma uma dimensão iniciada antes de outra disponível e respeita conclusão fora de ordem', () => {
  const values = [
    { experienceId: 'one', completed: true, started: true },
    { experienceId: 'two', completed: false, started: false },
    { experienceId: 'three', completed: false, started: true },
  ]
  expect(nextConsciousnessExperience(values)?.experienceId).toBe('three')
  expect(nextConsciousnessExperience(values, 'three')?.experienceId).toBe('two')
  expect(
    nextConsciousnessExperience(values.map((d) => ({ ...d, completed: true }))),
  ).toBeUndefined()
})

it('orienta para combinar o plano antes de recebê-lo e para organizar a semana depois', () => {
  expect(careJourneyNextStep(false).planner).toBe(false)
  expect(careJourneyNextStep(true, 'wants_to_try').planner).toBe(true)
  expect(careJourneyNextStep(true, 'accepted').planner).toBe(true)
})
it.each(['too_much', 'wants_to_talk', 'not_now', 'wants_to_adapt'])(
  'respeita o retorno %s antes de propor agenda',
  (response) => {
    const next = careJourneyNextStep(true, response)
    expect(next.planner).toBe(false)
    expect(next.label).toContain('ajustar o cuidado')
  },
)
