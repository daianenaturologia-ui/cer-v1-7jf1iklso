import { describe, it, expect } from 'vitest'
import {
  CER_PROTECTION_PATTERN_CONTENT,
  getCerProtectionPatternContent,
  CerProtectionPatternContentItem,
} from './cerProtectionPatternContent'
import { CER_PROTECTION_PATTERNS } from './cerProtectionPatterns'

describe('cerProtectionPatternContent - Camada 2B1', () => {
  const REQUIRED_IDS = [
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
  ]

  const REQUIRED_FIELDS: (keyof CerProtectionPatternContentItem)[] = [
    'shortDescription',
    'characteristics',
    'commonThoughts',
    'associatedFeelings',
    'patternLies',
    'costToSelf',
    'costToRelationships',
    'strengths',
    'possibleProtectiveFunctions',
    'wakeUpCalls',
  ]

  const ARRAY_FIELDS: (keyof CerProtectionPatternContentItem)[] = [
    'characteristics',
    'commonThoughts',
    'associatedFeelings',
    'patternLies',
    'costToSelf',
    'costToRelationships',
    'strengths',
    'wakeUpCalls',
  ]

  it('1. todos os dez IDs canônicos existentes possuem conteúdo e nenhum ficou ausente', () => {
    expect(Object.keys(CER_PROTECTION_PATTERN_CONTENT)).toHaveLength(10)

    for (const id of REQUIRED_IDS) {
      expect(CER_PROTECTION_PATTERN_CONTENT[id]).toBeDefined()
      expect(CER_PROTECTION_PATTERN_CONTENT[id].id).toBe(id)
      expect(CER_PROTECTION_PATTERN_CONTENT[id].canonicalKey).toBe(id)
      expect(CER_PROTECTION_PATTERNS[id]).toBeDefined()
      expect(CER_PROTECTION_PATTERN_CONTENT[id].baseName).toBe(CER_PROTECTION_PATTERNS[id].baseName)
    }
  })

  it('2. getCerProtectionPatternContent resolve tanto por ID canônico quanto por cartao_*', () => {
    for (const id of REQUIRED_IDS) {
      const item = getCerProtectionPatternContent(id)
      expect(item).toBeDefined()
      expect(item?.canonicalKey).toBe(id)
    }

    const cardMappings = [
      { card: 'cartao_1_fazer_certo', expected: 'insistente' },
      { card: 'cartao_2_cuidar_pessoas', expected: 'prestativo' },
      { card: 'cartao_3_produtividade_conquistas', expected: 'hiper_realizador' },
      { card: 'cartao_4_perder_sensacao_escolha', expected: 'vitima' },
      { card: 'cartao_5_compreender_pela_razao', expected: 'hiper_racional' },
      { card: 'cartao_6_antecipar_riscos', expected: 'hipervigilante' },
      { card: 'cartao_7_novos_estimulos', expected: 'inquieto' },
      { card: 'cartao_8_assumir_controle', expected: 'comandante' },
      { card: 'cartao_9_evitar_desconfortos', expected: 'evitativo' },
      { card: 'cartao_10_cobrar_e_criticar', expected: 'critico' },
    ]

    for (const { card, expected } of cardMappings) {
      const item = getCerProtectionPatternContent(card)
      expect(item).toBeDefined()
      expect(item?.canonicalKey).toBe(expected)
    }
  })

  it('3. todos os dez padrões possuem os dez campos estruturais obrigatórios', () => {
    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      for (const field of REQUIRED_FIELDS) {
        expect(item[field], `Padrão ${id} campo ${field} não deve ser indefinido`).toBeDefined()
      }
    }
  })

  it('4. todos os arrays obrigatórios não estão vazios e possuem itens bem desenvolvidos', () => {
    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      for (const field of ARRAY_FIELDS) {
        const arr = item[field] as string[]
        expect(Array.isArray(arr), `Padrão ${id} campo ${field} deve ser array`).toBe(true)
        expect(
          arr.length,
          `Padrão ${id} campo ${field} deve ter ao menos 3 itens`,
        ).toBeGreaterThanOrEqual(3)
        for (const str of arr) {
          expect(typeof str).toBe('string')
          expect(str.trim().length).toBeGreaterThan(15)
        }
      }

      expect(typeof item.shortDescription).toBe('string')
      expect(item.shortDescription.trim().length).toBeGreaterThan(80)

      expect(typeof item.possibleProtectiveFunctions).toBe('string')
      expect(item.possibleProtectiveFunctions.trim().length).toBeGreaterThan(80)
    }
  })

  it('5. Vítima possui nota explícita de não invalidação de violências ou abusos reais', () => {
    const vitima = CER_PROTECTION_PATTERN_CONTENT['vitima']
    expect(vitima.clarificationNote).toBeDefined()
    expect(vitima.clarificationNote).toContain(
      'O padrão Vítima não invalida situações reais de violência, abuso, abandono, desigualdade ou injustiça',
    )
    expect(vitima.clarificationNote).toContain(
      'aqui, o nome descreve momentos em que a pessoa perde o acesso à própria potência',
    )
  })

  it('6. Hipervigilante possui a distinção explícita entre padrão mental e estado fisiológico', () => {
    const hipervigilante = CER_PROTECTION_PATTERN_CONTENT['hipervigilante']
    expect(hipervigilante.clarificationNote).toBeDefined()
    expect(hipervigilante.clarificationNote).toContain('estratégia cognitiva e mental')
    expect(hipervigilante.clarificationNote).toContain('estado fisiológico de hipervigilância')
    expect(hipervigilante.clarificationNote).toContain('Regulação e Padrões de Resposta')
  })

  it('7. Comandante diferencia liderança saudável de controle protetivo', () => {
    const comandante = CER_PROTECTION_PATTERN_CONTENT['comandante']
    expect(comandante.clarificationNote).toBeDefined()
    expect(comandante.clarificationNote).toContain('diferenciar liderança saudável de controle')
    expect(comandante.clarificationNote).toContain('liderança madura organiza')
    expect(comandante.clarificationNote).toContain('reduzir a vulnerabilidade e a incerteza')
  })

  it('8. todas as funções protetivas usam linguagem de possibilidade e condicional', () => {
    const conditionalMarkers = [
      'pode ter ajudado',
      'pode funcionar como',
      'em algumas histórias',
      'uma possibilidade a ser investigada',
    ]

    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      const text = item.possibleProtectiveFunctions.toLowerCase()

      const hasMarker = conditionalMarkers.some((marker) => text.includes(marker))
      expect(
        hasMarker,
        `Padrão ${id} deve conter formulação condicional em possibleProtectiveFunctions`,
      ).toBe(true)
    }
  })

  it('9. ausência rigorosa de termos diagnósticos ou de transtorno', () => {
    const forbiddenTerms = [
      /\btranstorno\b/i,
      /\bdiagnóstico\b/i,
      /\bdiagnostico\b/i,
      /\bpatologia\b/i,
      /\bvocê é assim\b/i,
      /\bsua personalidade é\b/i,
      /\btrauma presumido\b/i,
    ]

    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      const fullText = JSON.stringify(item)

      for (const term of forbiddenTerms) {
        expect(fullText).not.toMatch(term)
      }
    }
  })

  it('10. ausência de pontuação, porcentagem e ranking', () => {
    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      const fullText = JSON.stringify(item)

      expect(fullText).not.toMatch(/%/)
      expect(fullText).not.toMatch(/\bscore\b/i)
      expect(fullText).not.toMatch(/\branking\b/i)
      expect(fullText).not.toMatch(/\bpercentil\b/i)
      expect(fullText).not.toMatch(/\bpontuação\b/i)
    }
  })

  it('11. ausência de nomes internos como "Cartão 1" no conteúdo visível', () => {
    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      const fullText = JSON.stringify(item)

      expect(fullText).not.toMatch(/Cartão\s*\d+/i)
      expect(fullText).not.toMatch(/cartao_\d+/i)
    }
  })

  it('12. ausência de causalidade biográfica afirmada ou infância inventada', () => {
    const forbiddenBiographicClaims = [
      /isso surgiu porque/i,
      /seus pais fizeram/i,
      /na infância aconteceu/i,
      /esse é o seu trauma/i,
      /essa é a causa/i,
    ]

    for (const id of REQUIRED_IDS) {
      const item = CER_PROTECTION_PATTERN_CONTENT[id]
      const fullText = JSON.stringify(item)

      for (const pattern of forbiddenBiographicClaims) {
        expect(fullText).not.toMatch(pattern)
      }
    }
  })
})
