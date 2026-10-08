import type { AyurvedaInterpretationResult } from './ayurvedaInterpretationEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import type { AyurvedaBodyReading } from '@/types/cerMapReadings'
import { interpretCurrentBody } from './ayurvedaCurrentInterpretation'
import { AYV_C3_CURRENT_HUNGER_OPTIONS, AYV_C3_CURRENT_POST_MEAL_OPTIONS } from './ayurvedaChapter3'

export function buildAyurvedaBodyReading(
  result: AyurvedaInterpretationResult,
  responses: ExperienceResponseRecord[],
): AyurvedaBodyReading {
  const current = interpretCurrentBody(responses)
  const currentDigestive =
    current.completed && current.hunger.length > 0 && current.postMeal.length > 0
  let agniType: string = result.agniReading.type
  let amaPresence: string = result.amaReading.presence
  let agniSummary = `${result.agniReading.type}: ${result.agniReading.description}`
  let agniEvidence = result.agniReading.evidences
  let amaSummary = `${result.amaReading.presence}: ${result.amaReading.rationale}`
  let amaEvidence = result.amaReading.evidences
  if (currentDigestive) {
    agniEvidence = [
      ...AYV_C3_CURRENT_HUNGER_OPTIONS.filter((o) => current.hunger.includes(o.id)).map(
        (o) => `Fome: ${o.label}.`,
      ),
      ...AYV_C3_CURRENT_POST_MEAL_OPTIONS.filter((o) => current.postMeal.includes(o.id)).map(
        (o) => `Após comer: ${o.label}.`,
      ),
    ]
    const match = (values: string[], options: string[]) => values.some((v) => options.includes(v))
    const irregular =
      match(current.hunger, ['variable_intensity', 'changes_routine_emotion']) ||
      match(current.postMeal, ['bloating_gas', 'unclear_pattern'])
    const slow =
      match(current.hunger, ['light_slow', 'long_without_hunger']) ||
      match(current.postMeal, ['heavy_slow_digestion', 'sleepy_energy_drop'])
    const hot =
      current.hunger.includes('sudden_intense') || current.postMeal.includes('heat_burning_acidity')
    const traits = [
      irregular && 'irregularidade (Vishama)',
      slow && 'lentidão (Manda)',
      hot && 'intensidade/calor (Tikshna)',
    ].filter(Boolean)
    agniType =
      traits.length > 1
        ? 'Agni com sinais mistos'
        : irregular
          ? 'Vishama Agni'
          : slow
            ? 'Manda Agni'
            : hot
              ? 'Tikshna Agni'
              : current.hunger.includes('regular_hours') &&
                  current.postMeal.includes('light_satisfied')
                ? 'Sama Agni'
                : 'Indefinido / Em observação'
    agniSummary =
      traits.length > 1
        ? `Seu Agni apresenta sinais mistos de ${traits.join(' e ')}. Isso significa que a fome e o conforto após comer não seguem um único ritmo: a leitura registra as características que coexistem, em vez de apagar esse resultado com um rótulo genérico.`
        : traits.length
          ? `Seus relatos atuais sugerem um padrão de Agni com ${traits[0]}. ${irregular ? 'A fome ou o conforto digestivo variam, em vez de manter a mesma regularidade.' : slow ? 'O apetite demora a surgir ou a refeição é seguida de peso e digestão percebida como lenta.' : 'A fome se intensifica rapidamente ou há sensação de calor e queimação após comer.'}`
          : current.hunger.includes('regular_hours') && current.postMeal.includes('light_satisfied')
            ? 'Seus relatos atuais sugerem Sama Agni: fome previsível e sensação leve e confortável após comer. Esses dois registros sustentam a leitura tradicional de regularidade digestiva neste período.'
            : 'Seus relatos atuais descrevem fome e digestão, mas não convergem para um padrão único de Agni. As respostas específicas abaixo são o resultado disponível, sem atribuir manifestações que você não relatou.'
    const heavy = match(current.postMeal, ['heavy_slow_digestion', 'sleepy_energy_drop'])
    const sticky = current.elimination.includes('sticky_incomplete')
    amaEvidence = [
      heavy && 'Sensação de peso ou queda de energia após comer.',
      sticky && 'Fezes pegajosas ou sensação de eliminação incompleta.',
    ].filter(Boolean) as string[]
    amaPresence =
      heavy && sticky
        ? 'Sinalizada'
        : amaEvidence.length
          ? 'Possível / Limítrofe'
          : 'Não evidenciada'
    amaSummary =
      heavy && sticky
        ? 'Seus relatos atuais sinalizam Ama na leitura tradicional: peso após as refeições e alteração da eliminação aparecem em duas áreas diferentes. A combinação sugere dificuldade no processamento digestivo nessa lente; não corresponde à detecção de toxinas no organismo.'
        : amaEvidence.length
          ? 'Há um sinal associado a Ama em uma área. Ele merece atenção, mas ainda não há convergência em áreas diferentes para sinalizar esse padrão. Isso descreve o alcance dos registros atuais.'
          : 'Os relatos atuais disponíveis não sinalizam Ama. Isso se refere aos sinais investigados neste período, sem concluir ausência de doença.'
  }
  return {
    currentDigestive,
    agniType,
    amaPresence,
    currentDoshas: current.doshas,
    currentSummary: current.summary,
    currentFacts: current.facts,
    constitutionEvidence: [
      ...result.prakritiHypothesis.evidencesVata,
      ...result.prakritiHypothesis.evidencesPitta,
      ...result.prakritiHypothesis.evidencesKapha,
    ].map((e) => `${e.dosha} · ${e.sourceQuestionTitle}: ${e.literalText}.`),
    agniSummary,
    agniEvidence,
    amaSummary,
    amaEvidence,
    digestiveReference: currentDigestive ? 'Últimos 14 dias' : 'Funcionamento habitual registrado',
  }
}
