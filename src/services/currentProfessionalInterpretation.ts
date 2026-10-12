import { resolveExperienceId } from './experienceEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import type { StandardDimensionInterpretation } from './universalDimensionInterpretationEngine'
import { buildCerMapReadings } from './cerMapReadings'
import { professionalQuestionnaireResponses } from './professionalQuestionnaireRead'

export function currentProfessionalInterpretation(id: string, records: ExperienceResponseRecord[], name: string): StandardDimensionInterpretation {
  const ids: Record<string,string> = { mente_emocoes: 'mente', regulacao_respostas: 'regulacao', relacoes: 'relacoes', sexualidade: 'sexualidade', sentido_conexao: 'sentido' }
  const enrollment = records[0]?.enrollment_id || ''
  const shared = professionalQuestionnaireResponses(records, enrollment).map(r => ({ ...r, experience_id: resolveExperienceId(r.experience_id) }))
  const dimension = buildCerMapReadings(shared, enrollment, name).dimensions.find(d => d.id === ids[id])
  return { dimensionId: id, dimensionName: dimension?.title || '', hasResponses: shared.length > 0,
    simpleSynthesis: dimension?.summary || 'Há registros compartilhados para contextualizar em conversa.',
    deepSynthesis: dimension?.interpretation || 'As respostas literais abaixo permanecem disponíveis. Ainda não há evidências estruturadas suficientes para uma leitura integrada.',
    observedEvidences: (dimension?.detailedRows || []).map(r => r.label + ': ' + r.text),
    perceivedResources: (dimension?.insights || []).filter(i => i.kind === 'strength').map(i => i.label + ': ' + i.description),
    attentionPoints: (dimension?.insights || []).filter(i => i.kind === 'difficulty').map(i => i.label + ': ' + i.description),
    sessionQuestions: [] }
}
