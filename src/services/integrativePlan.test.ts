import { it, expect } from 'vitest'
import {
  addCareAction,
  updateCareAction,
  isCareChapter,
  goalFromLifeDirection,
} from './integrativePlan'
import { emptyPlanDocument, validatePlanDocument } from './developmentPlanDocument'
it('preserva o documento e mantém cuidados separados da meta na estrutura versionada', () => {
  const original = emptyPlanDocument()
  const plan = addCareAction(original, 'Sono e recuperação')
  expect(original.goals).toEqual([])
  expect(plan.goals.filter(isCareChapter)).toHaveLength(1)
  const next = addCareAction(plan, 'Alimentação e digestão')
  expect(next.goals).toHaveLength(1)
  expect(next.goals[0].actions).toHaveLength(2)
  expect(() => validatePlanDocument(next)).not.toThrow()
})
it('não confunde orientações de cuidado com uma meta principal acordada', () => {
  const plan = addCareAction(
    { ...emptyPlanDocument(), moment: 'Momento', priorities: 'Prioridade' },
    'Sono',
  )
  const complete = updateCareAction(plan, plan.goals[0].actions[0].id, {
    context: 'Orientação individual escrita',
  })
  expect(() => validatePlanDocument(complete, 'agreed')).toThrow(/meta/)
})
it('traz apenas a meta e a ação imaginadas pela interagente, sem copiar narrativas privadas para o plano', () => {
  const source = {
    kind: 'future',
    access_class: 'participant_shared',
    title: 'Minha meta',
    first_step: 'Minha ação',
    narrative: 'Relato que não será copiado',
    resources: '',
    limits: '',
  } as any
  const goal = goalFromLifeDirection(source)
  expect(goal.title).toBe('Minha meta')
  expect(goal.actions[0].title).toBe('Minha ação')
  expect(goal.actions[0].context).toBe('')
  expect(JSON.stringify(goal)).not.toContain(source.narrative)
  expect(() => goalFromLifeDirection({ ...source, access_class: 'participant_private' })).toThrow()
})
