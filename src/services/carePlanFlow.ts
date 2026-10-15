import type { CerPracticeRecord, CerPracticeVersionRecord } from '@/types/cer'
import type { DevelopmentResource } from './developmentCatalog'
import type { DevelopmentExperiment } from './selfDevelopment'

export const CARE_CATEGORIES = [
  'Alimentação',
  'Condimentos',
  'Fitoterápicos',
  'Óleos essenciais',
  'Florais de Bach',
  'Atividades físicas',
  'Hábitos e rotinas',
  'Kriyas',
  'Respiração e regulação do sistema nervoso',
  'Mindfulness e meditação',
  'Autoconhecimento e liberação emocional',
  'Cartas e orações',
  'Outros cuidados',
] as const
export type CareCategory = (typeof CARE_CATEGORIES)[number]
export type CareOrigin = 'existing_routine' | 'library' | 'professional_plan'
export interface CareMetadata {
  category: CareCategory
  origin: CareOrigin
}
export const CARE_ORIGINS: Record<CareOrigin, string> = {
  existing_routine: 'Cuidado que já faço',
  library: 'Escolhido na Biblioteca CER',
  professional_plan: 'Organizado a partir do plano da profissional',
}
export function isPersonalCare(record: DevelopmentExperiment) {
  return !!record.resource_snapshot.care_plan
}
export function personalCareResource(): DevelopmentResource {
  return {
    id: 'cer-personal-care-v1',
    title: 'Cuidado que já faço',
    theme: 'Hábitos e rotinas',
    lesson:
      'Registro pessoal de um cuidado que já faz parte da minha vida, para compreender e conversar sobre minha rotina.',
    instructions: ['Descreva o cuidado, como ele acontece e o que você percebe ao realizá-lo.'],
    fallback: '',
    reflection: 'O que percebi com este cuidado?',
    duration: 'No meu ritmo',
    care_plan: { category: 'Hábitos e rotinas', origin: 'existing_routine' },
  }
}
export function libraryCareResource(resource: DevelopmentResource): DevelopmentResource {
  return {
    ...resource,
    care_plan: { category: 'Autoconhecimento e liberação emocional', origin: 'library' },
  }
}
export function carePrioritySource(resource: DevelopmentResource, record?: DevelopmentExperiment) {
  const category = resource.care_plan?.category || resource.theme
  return {
    category,
    title: (record?.action || resource.title).slice(0, 160),
    description: [
      `Categoria: ${category}`,
      record
        ? `Cuidado relatado: ${record.action}\nIntenção: ${record.goal}\nNa rotina: ${record.context}`
        : resource.lesson,
      !record || resource.care_plan?.origin !== 'existing_routine'
        ? resource.instructions.join('\n')
        : '',
      record?.fallback || resource.fallback
        ? `Alternativa: ${record?.fallback || resource.fallback}`
        : '',
      resource.duration ? `Tempo: ${resource.duration}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    source: record
      ? `Origem: cuidado compartilhado pela pessoa (${record.id}); recurso ${resource.id}. Rever a adequação antes de indicar.`
      : `Origem: Biblioteca CER, recurso ${resource.id}. Conteúdo preservado para revisão individual.`,
  }
}

export function sharedPlanCareResource(plan: {
  id: string
  participant_title?: string
  participant_summary?: string
  practical_invitation?: string
}): DevelopmentResource {
  const invitation =
    plan.practical_invitation ||
    'Escolha com Daiane um cuidado deste plano para organizar na sua rotina.'
  return {
    id: `cer-shared-plan-${plan.id}`,
    title: (plan.participant_title || 'Cuidado combinado com Daiane').slice(0, 160),
    theme: 'Plano compartilhado',
    lesson: plan.participant_summary || 'Cuidado combinado com minha profissional.',
    instructions: invitation.match(/[\s\S]{1,1500}/g) || [invitation],
    duration: 'Conforme combinado',
    fallback: '',
    reflection: 'Como esse cuidado coube na minha vida?',
    care_plan: { category: 'Outros cuidados', origin: 'professional_plan' },
  }
}

export function clinicalCarePrioritySource(
  practice: CerPracticeRecord,
  version: CerPracticeVersionRecord,
) {
  const fields: [string, string | undefined][] = [
    ['Proposta', version.participant_summary],
    ['Preparação', version.preparation],
    ['Como realizar', version.instructions],
    ['Quando interromper', version.stop_conditions],
    ['Aterramento', version.grounding],
    ['Integração', version.integration],
    ['Duração', version.duration],
    ['Frequência', version.frequency],
    ['Repetições', version.repetitions],
    ['Quantidade', version.quantity],
    ['Horário', version.time_window],
    ['Progressão', version.progression],
    ['Descanso', version.rest],
    ['Limite de exposição', version.max_exposure],
    ['Acompanhamento necessário', version.guidance_requirements],
  ]
  return {
    category: 'Outros cuidados',
    title: version.participant_title || practice.participant_facing_name_base,
    description: fields
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n\n'),
    source: `Origem: Biblioteca clínica CER; prática ${practice.id}; versão ${version.id} (v${version.version_number}). Indicação a ser individualizada pela profissional.`,
  }
}
