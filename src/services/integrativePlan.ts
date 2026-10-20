import {
  newPlanAction,
  newPlanGoal,
  type PlanDocument,
  type PlanGoal,
  type PlanAction,
} from './developmentPlanDocument'
import type { LifeDirection } from './lifeDirections'

/** Dedicated care chapter in the existing versioned document schema. No migration or legacy rewrite. */
export const CARE_CHAPTER_ID = 'cer-integrative-care'
export const isCareChapter = (goal: PlanGoal) => goal.id === CARE_CHAPTER_ID
export const mainPlanGoal = (doc: PlanDocument) => doc.goals.find((g) => !isCareChapter(g))
export const CARE_AREAS = [
  {
    title: 'Alimentação e digestão',
    hint: 'Alimentos indicados e a reduzir/evitar, preparo, condimentos e ajustes de rotina; relacione à avaliação de Prakriti, Vikriti, Agni e Ama.',
  },
  {
    title: 'Fitoterapia',
    hint: 'Indicação individual, planta/produto, preparo, dose, frequência, duração e orientações de uso definidas por você após avaliar condições, medicamentos e contraindicações.',
  },
  {
    title: 'Aromaterapia',
    hint: 'Objetivo, óleo/produto, via, diluição, frequência, duração e cuidados individuais, se esta prática for escolhida.',
  },
  {
    title: 'Cuidado emocional · florais, EFT e PNL',
    hint: 'Necessidade identificada, recurso escolhido, como praticar, quando pausar e como acompanhar a resposta. Inclua florais, EFT ou PNL somente conforme sua avaliação.',
  },
  {
    title: 'Movimento e atividade física',
    hint: 'Atividade, intensidade, duração e progressão possíveis considerando o corpo e a disponibilidade atual.',
  },
  {
    title: 'Sono e recuperação',
    hint: 'Horários de referência, preparação para dormir e ajustes no ambiente e nas demandas.',
  },
  {
    title: 'Yoga, respiração e kriyas',
    hint: 'Prática individualizada, instruções, frequência, duração e adaptações definidas após avaliação.',
  },
  {
    title: 'Relações, limites e apoio',
    hint: 'Condições de vínculo e apoio que podem sustentar o cuidado; inclua limites e pedidos de ajuda possíveis.',
  },
  {
    title: 'Sentido, presença e outros cuidados',
    hint: 'O que ajuda a recuperar presença e qualidade de vida, considerando valores e necessidades da pessoa.',
  },
] as const
export function addCareAction(doc: PlanDocument, title: string): PlanDocument {
  const old = doc.goals.find(isCareChapter)
  const action = { ...newPlanAction(), title }
  const care: PlanGoal = old
    ? { ...old, actions: [...old.actions, action] }
    : {
        id: CARE_CHAPTER_ID,
        title: 'Cuidados para sustentar meu equilíbrio',
        progress: 'Observar conforto, energia e resposta às orientações; revisar nas sessões.',
        actions: [action],
      }
  return { ...doc, goals: [care, ...doc.goals.filter((g) => !isCareChapter(g))] }
}
export function updateCareAction(
  doc: PlanDocument,
  id: string,
  patch: Partial<PlanAction>,
): PlanDocument {
  return {
    ...doc,
    goals: doc.goals.map((g) =>
      isCareChapter(g)
        ? { ...g, actions: g.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)) }
        : g,
    ),
  }
}
export function goalFromLifeDirection(value: LifeDirection): PlanGoal {
  if (value.kind !== 'future' || value.access_class !== 'participant_shared')
    throw new Error('Escolha uma meta futura compartilhada pela interagente.')
  return {
    ...newPlanGoal(),
    title: value.title,
    progress: '',
    actions: value.first_step.trim()
      ? [{ ...newPlanAction(), title: value.first_step, context: '' }]
      : [],
  }
}
