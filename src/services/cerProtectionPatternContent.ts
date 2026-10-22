import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'
import { protectionPatternExplanations } from './cerProtectionPatternReading'
/**
 * cerProtectionPatternContent.ts
 *
 * Conteúdo autoral dos 10 Padrões de Proteção do Método CER (Camada 2B1).
 *
 * Princípios editoriais e epistêmicos do Método CER:
 * - Direto, firme, acolhedor e lúcido;
 * - Ausência de diagnósticos, transtornos, rótulos ontológicos ("você é assim") ou psicometria;
 * - Ausência de infância inventada ou causas presumidas; todas as funções protetivas
 *   são formuladas como possibilidades a serem investigadas conjuntamente com a
 *   Linha da Vida, a escuta de Daiane e o reconhecimento da própria interagente;
 * - Cuidados especiais:
 *   1. Vítima: nota expressa de que não invalida violências, abusos ou injustiças reais;
 *   2. Hipervigilante: diferenciação entre padrão cognitivo de antecipação e estado fisiológico;
 *   3. Comandante: diferenciação nítida entre liderança saudável e controle protetivo.
 */

export interface CerProtectionPatternContentItem {
  id: string
  canonicalKey: string
  baseName: string
  movementDescription: string
  shortDescription: string
  characteristics: string[]
  commonThoughts: string[]
  associatedFeelings: string[]
  patternLies: string[]
  costToSelf: string[]
  costToRelationships: string[]
  strengths: string[]
  possibleProtectiveFunctions: string
  wakeUpCalls: string[]
  clarificationNote?: string
}

const notes: Record<string, string> = {
  vitima:
    'O padrão Vítima não invalida situações reais de violência, abuso, abandono, desigualdade ou injustiça; aqui, o nome descreve momentos em que a pessoa perde o acesso à própria potência e passa a perceber poucas possibilidades de escolha ou ação.',
  hipervigilante:
    'O padrão Hipervigilante abordado aqui diz respeito a uma estratégia cognitiva e mental de antecipação recorrente de riscos e desfechos desfavoráveis. Ele se diferencia do estado fisiológico de hipervigilância decorrente de ativação autonômica involuntária, cuja investigação pertence à dimensão de Regulação e Padrões de Resposta.',
  comandante:
    'É útil diferenciar liderança saudável de controle protetivo: a liderança madura organiza responsabilidades e considera a autonomia das pessoas. Em algumas situações, assumir o controle pode ser uma tentativa de reduzir a vulnerabilidade e a incerteza. Confira o contexto e os efeitos antes de atribuir essa função.',
}
const originalContent = Object.fromEntries(
  [
    'insistente',
    'prestativo',
    'hiper_realizador',
    'vitima',
    'hiper_racional',
    'hipervigilante',
    'inquieto',
    'comandante',
    'evitativo',
    'critico',
  ].map((key) => {
    const definition = CER_PROTECTION_PATTERNS[key]
    return [
      key,
      {
        id: key,
        canonicalKey: key,
        baseName: definition.baseName,
        movementDescription: definition.movementDescription,
        clarificationNote: notes[key],
      },
    ]
  }),
) as Record<
  string,
  Pick<
    CerProtectionPatternContentItem,
    'id' | 'canonicalKey' | 'baseName' | 'movementDescription' | 'clarificationNote'
  >
>

/** Educational possibilities are distinct from a personal attribution or frequency. */
export const CER_PROTECTION_PATTERN_CONTENT: Record<string, CerProtectionPatternContentItem> =
  Object.fromEntries(
    Object.entries(originalContent).map(([key, original]) => {
      const paragraphs = protectionPatternExplanations[key]
      const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean)
      const effects = sentences(paragraphs[2])
      const resources = sentences(paragraphs[4])
      return [
        key,
        {
          ...original,
          shortDescription: paragraphs[0],
          characteristics: sentences(paragraphs[0]),
          commonThoughts: [paragraphs[1]],
          associatedFeelings: [
            'As emoções variam conforme a situação. Observe quais sentimentos você reconhece nesse movimento e quais não fazem parte da sua experiência.',
          ],
          patternLies: [
            'Uma estratégia pode ajudar em uma situação e trazer desgaste em outra. Confira no seu cotidiano quando essa forma de responder amplia suas escolhas e quando as restringe.',
          ],
          costToSelf: effects.slice(0, Math.ceil(effects.length / 2)),
          costToRelationships: effects.slice(Math.ceil(effects.length / 2)).length
            ? effects.slice(Math.ceil(effects.length / 2))
            : [paragraphs[2]],
          strengths: resources.slice(0, 1),
          possibleProtectiveFunctions: `Uma possibilidade a ser investigada no seu contexto: ${paragraphs[3]}`,
          wakeUpCalls: resources.slice(1).length ? resources.slice(1) : [paragraphs[4]],
        },
      ]
    }),
  )

/**
 * Retorna o conteúdo de um padrão a partir do seu id ou do seu canonicalKey.
 * Mapeia também aliases se necessários.
 */
export function getCerProtectionPatternContent(
  patternId: string,
): CerProtectionPatternContentItem | undefined {
  if (!patternId) return undefined

  // Consulta direta
  if (CER_PROTECTION_PATTERN_CONTENT[patternId]) {
    return CER_PROTECTION_PATTERN_CONTENT[patternId]
  }

  // Tenta mapear cartao_* para canonicalKey
  const canonicalMap: Record<string, string> = {
    cartao_1_fazer_certo: 'insistente',
    cartao_2_cuidar_pessoas: 'prestativo',
    cartao_3_produtividade_conquistas: 'hiper_realizador',
    cartao_4_perder_sensacao_escolha: 'vitima',
    cartao_5_compreender_pela_razao: 'hiper_racional',
    cartao_6_antecipar_riscos: 'hipervigilante',
    cartao_7_novos_estimulos: 'inquieto',
    cartao_8_assumir_controle: 'comandante',
    cartao_9_evitar_desconfortos: 'evitativo',
    cartao_10_cobrar_e_criticar: 'critico',
  }

  const mapped = canonicalMap[patternId]
  if (mapped && CER_PROTECTION_PATTERN_CONTENT[mapped]) {
    return CER_PROTECTION_PATTERN_CONTENT[mapped]
  }

  return undefined
}
