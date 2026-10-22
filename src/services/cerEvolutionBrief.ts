import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'
import { strongestMindPatterns } from './cerMindConversation'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'

const concise = (text: string) => {
  const sentence = text.trim().split(/(?<=[.!?])\s+/)[0] || ''
  if (sentence.length <= 240) return sentence
  return sentence.slice(0, 237).replace(/\s+\S*$/, '') + '…'
}
const names: Record<string, string> = {}
export function cerEvolutionBrief(snapshot: CerMapReadingSnapshot) {
  const dimension = (id: string) => snapshot.dimensions.find((d) => d.id === id)
  const body = dimension('corpo')
  const mind = dimension('mente')
  const protection = strongestMindPatterns(mind, mind?.declaredPatternKeys)
  const reaction =
    dimension('regulacao')
      ?.detailedRows.find(
        (row) =>
          row.sourcePromptKey === 'resposta_tendencia' ||
          /resposta.*tendência|resposta.*tendencia/i.test(row.label),
      )
      ?.text.toLowerCase() || ''
  const survival = [
    { name: 'Luta', matches: ['tentar resolver e controlar imediatamente', 'luta:'] },
    {
      name: 'Fuga / recolhimento',
      matches: ['me afastar, calar ou buscar distância física', 'fuga:'],
    },
    { name: 'Paralisação', matches: ['ficar em dúvida, paralisada', 'paralisação:'] },
    { name: 'Ceder / agradar', matches: ['ceder, concordar ou tentar acalmar', 'submissão:'] },
    { name: 'Outro modo de reagir', matches: ['tenho outro jeito específico de reagir'] },
  ].filter((item) => item.matches.some((phrase) => reaction.includes(phrase)))
  const summary = (id: string) => {
    const d = dimension(id)
    return (
      concise(d?.interpretation || d?.personalSections?.[0]?.text || d?.summary || '') ||
      'Ainda sem leitura disponível.'
    )
  }
  return {
    dosha: body?.ayurvedaConstitution?.length
      ? body.ayurvedaConstitution.join('–')
      : 'Constituição ainda em observação',
    currentDosha: body?.ayurvedaReading?.currentDoshas.join('–') || '',
    agni: body?.ayurvedaReading?.agniType || 'Ainda em observação',
    agniDetail:
      body?.ayurvedaReading?.agniType === 'Agni com sinais mistos'
        ? concise(body.ayurvedaReading.agniSummary)
        : '',
    ama: body?.ayurvedaReading?.amaPresence || 'Ainda em observação',
    protection: protection.keys.map(
      (key) => names[key] || CER_PROTECTION_PATTERNS[key]?.baseName || key,
    ),
    protectionTie: protection.tied,
    survival: survival.length <= 2 ? survival.map((item) => item.name) : [],
    relationships: summary('relacoes'),
    sexuality: summary('sexualidade'),
    connection: summary('sentido'),
  }
}
