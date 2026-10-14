import { beforeEach, expect, it } from 'vitest'
import {
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
