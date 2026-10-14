import { expect, it } from 'vitest'
import { professionalJourneyTab } from './professionalJourneyNavigation'

it.each([
  ['evolucao', 'plano', 'equilibrio'],
  ['evolucao', 'planner', 'equilibrio'],
  ['equilibrio', 'plano', 'equilibrio'],
  ['evolucao', 'linha', 'evolucao'],
  ['evolucao', null, 'evolucao'],
  ['revisao', null, 'evolucao'],
  ['consciencia', null, 'consciencia'],
  ['sessoes', null, 'sessoes'],
  [null, null, 'resumo'],
])('preserva o destino da URL %s/%s como %s', (tab, tool, expected) => {
  expect(professionalJourneyTab(tab, tool)).toBe(expected)
})
