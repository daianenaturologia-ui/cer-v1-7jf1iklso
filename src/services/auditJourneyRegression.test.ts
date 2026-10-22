import { afterEach, beforeEach, expect, it } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID as enrollment } from './demoAdapter'
import { developmentPlanService } from './developmentPlanService'
import { cerCarePlanService } from './cerCarePlanService'
import { cerCareCycleService } from './cerCareCycleService'
import { routineEvents, validateRoutine, type PlanDocument } from './developmentPlanDocument'
import { cerEvolutionBrief } from './cerEvolutionBrief'
import { createDemoCerMapReading } from './demoCerMapReading'
import { formatPromptResponse } from '@/components/experience/formatPromptResponse'
const doc: PlanDocument = {
  title: 'Meu plano',
  moment: 'Retomar meu ritmo',
  priorities: 'Descanso',
  next_session: '',
  goals: [
    {
      id: 'goal',
      title: 'Encerrar o trabalho',
      progress: 'Ter espaço para conviver',
      actions: [
        {
          id: 'action',
          title: 'Anotar próximo passo',
          context: 'Antes das 19h',
          fallback: 'Um dia possível',
        },
      ],
    },
  ],
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
})
afterEach(() => demoAdapter.disableDemo())
it('cria um ciclo a partir do plano combinado sem exigir um segundo preenchimento', async () => {
  const draft = await developmentPlanService.save(enrollment, doc, 'PRIVADO', null)
  await developmentPlanService.share(draft, 'agreed')
  const plan = await cerCarePlanService.ensureForCycle(enrollment)
  expect(await cerCarePlanService.ensureForCycle(enrollment)).toMatchObject({ id: plan.id })
  expect(JSON.stringify(plan)).not.toContain('PRIVADO')
  const cycle = await cerCareCycleService.create({ plan_id: plan.id })
  expect((await cerCareCycleService.act(cycle.id, 'start')).status).toBe('active')
})
it('não ativa ciclo usando plano em construção ou usuário interagente', async () => {
  const draft = await developmentPlanService.save(enrollment, doc, 'PRIVADO', null)
  await developmentPlanService.share(draft, 'building')
  await expect(cerCarePlanService.ensureForCycle(enrollment)).rejects.toThrow('combinada')
  demoAdapter.setActivePersona('mariana')
  await expect(cerCarePlanService.ensureForCycle(enrollment)).rejects.toThrow('profissional')
})
it('diferencia pergunta vazia de recusa explícita e de não saber', () => {
  expect(
    formatPromptResponse(undefined, { structured_value: { value: [] }, free_text: '' } as any),
  ).toBe('Não respondida')
  expect(
    formatPromptResponse(undefined, {
      structured_value: { is_legitimate_skip: true, skip_reason: 'prefiro_nao_responder' },
    } as any),
  ).toBe('Prefiro não responder')
  expect(
    formatPromptResponse(undefined, {
      structured_value: { is_legitimate_skip: true, skip_reason: 'nao_sei' },
    } as any),
  ).toBe('Não sei dizer agora')
})
it('prioriza os padrões escolhidos pela pessoa no resumo da história', () => {
  const snapshot = createDemoCerMapReading(),
    mind = snapshot.dimensions.find((d) => d.id === 'mente')!
  mind.declaredPatternKeys = ['prestativo', 'hiper_realizador', 'evitativo']
  mind.detailedRows = ['prestativo', 'hiper_realizador', 'evitativo', 'insistente'].map(
    (label) => ({
      label,
      text: label === 'insistente' ? 'Com muita força sob pressão' : 'Repete-se com frequência',
    }),
  )
  expect(cerEvolutionBrief(snapshot).protection).toEqual([
    'Prestativo',
    'Hiper-realizador',
    'Evitativo',
  ])
})
it('encerra a recorrência na data escolhida e mantém as ocorrências anteriores', () => {
  const schedule = {
    days: [1, 2, 3, 4, 5],
    time: '18:50',
    duration: 10,
    timezone: 'UTC',
    until: '2026-10-23',
  }
  expect(() => validateRoutine(schedule, '2026-10-26')).toThrow('data final')
  const routine: any = {
    id: 'r',
    action_id: 'a',
    enabled: true,
    effective_day: '2026-10-19',
    created: '2026-10-19',
    schedule,
    snapshot: { goal: 'Descansar', progress: 'Ter espaço', action: doc.goals[0].actions[0] },
  }
  expect(routineEvents([routine], new Date('2026-10-19T00:00:00Z'))).toHaveLength(5)
  expect(routineEvents([routine], new Date('2026-10-26T00:00:00Z'))).toHaveLength(0)
})
