import { describe, it, expect } from 'vitest'
import {
  buildProfessionalIntegrativeMap,
  INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER,
} from '@/services/integrativeMapEngine'
import { buildConscienciaQaFixture } from '@/services/conscienciaQaFixture'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('Motor do Mapa Integrativo Profissional da Consciência (integrativeMapEngine)', () => {
  const enrollmentId = 'enr-test-integrativo-123'
  const participantName = 'Maria Clara da Silva'

  it('retorna estado padrão vazio/insuficiente com aviso canônico quando não há respostas', () => {
    const result = buildProfessionalIntegrativeMap([], participantName)

    expect(result.isEmpty).toBe(true)
    expect(result.hasSufficientData).toBe(false)
    expect(result.activeDimensionsCount).toBe(0)
    expect(result.essentialSynthesis.overview).toContain(
      'Esta interagente ainda não iniciou este capítulo.',
    )
    expect(result.crossCuttingResources).toEqual([])
    expect(result.centralConvergences).toEqual([])
    expect(result.protectivePatternsAndTensions).toEqual([])
    expect(result.integrativeHypotheses).toEqual([])
    expect(result.ayurvedaConcise.hasData).toBe(false)
    expect(result.missingDimensions.length).toBe(6)
    expect(result.disclaimer).toBe(INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER)
  })

  it('não infere convergência a partir de uma única dimensão (critério epistêmico estrito)', () => {
    const allFixture = buildConscienciaQaFixture(enrollmentId).responses
    // Apenas respostas de Mente & Emoções
    const singleDimResponses = allFixture.filter((r) => r.experience_id === 'exp-mente-emocoes-07c')

    const result = buildProfessionalIntegrativeMap(singleDimResponses, participantName)

    expect(result.isEmpty).toBe(false)
    expect(result.hasSufficientData).toBe(false)
    expect(result.activeDimensionsCount).toBe(1)
    expect(result.essentialSynthesis.overview).toContain('apenas 1 dimensão')
    expect(result.essentialSynthesis.overview).toContain(
      'não sustenta formulações transversais nem convergências integrativas',
    )
    expect(result.crossCuttingResources).toEqual([])
    expect(result.centralConvergences).toEqual([])
    expect(result.integrativeHypotheses).toEqual([])
    expect(result.missingDimensions.length).toBe(5)
  })

  it('com o cenário QA completo (6 dimensões), produz mapa completo com 8 blocos coerentes', () => {
    const allFixture = buildConscienciaQaFixture(enrollmentId).responses
    const result = buildProfessionalIntegrativeMap(allFixture, participantName)

    expect(result.hasSufficientData).toBe(true)
    expect(result.isEmpty).toBe(false)
    expect(result.activeDimensionsCount).toBe(6)
    expect(result.totalDimensions).toBe(6)
    expect(result.missingDimensions).toEqual([])

    // Bloco 1: Síntese Essencial
    expect(result.essentialSynthesis.overview).toContain(participantName)
    expect(result.essentialSynthesis.confidence).toBe('Alta')
    expect(result.essentialSynthesis.overview.length).toBeGreaterThan(100)

    // Bloco 2: Recursos e Forças Transversais (mínimo 2 dimensões por recurso)
    expect(result.crossCuttingResources.length).toBeGreaterThanOrEqual(2)
    result.crossCuttingResources.forEach((res) => {
      expect(res.dimensionsInvolved.length).toBeGreaterThanOrEqual(2)
      expect(res.evidences.length).toBeGreaterThanOrEqual(2)
      expect(res.title).toBeTruthy()
      expect(res.description).toBeTruthy()
    })

    // Bloco 3: Convergências Centrais (mínimo 2 dimensões)
    expect(result.centralConvergences.length).toBeGreaterThanOrEqual(2)
    result.centralConvergences.forEach((conv) => {
      expect(conv.dimensions.length).toBeGreaterThanOrEqual(2)
      expect(conv.observedEvidences.length).toBeGreaterThanOrEqual(2)
      expect(conv.title).toBeTruthy()
      expect(conv.description).toBeTruthy()
    })

    // Bloco 4: Padrões de Proteção e Tensões
    expect(result.protectivePatternsAndTensions.length).toBeGreaterThanOrEqual(1)
    result.protectivePatternsAndTensions.forEach((prot) => {
      expect(prot.dimensionsInvolved.length).toBeGreaterThanOrEqual(2)
      expect(prot.patternName).toBeTruthy()
      expect(prot.somaticAndPsychologicalManifestation).toBeTruthy()
      expect(prot.perceivedCost).toBeTruthy()
    })

    // Bloco 5: Hipóteses Integrativas CER (≥ 2 dimensões cada, confiança e não diagnóstico)
    expect(result.integrativeHypotheses.length).toBeGreaterThanOrEqual(2)
    result.integrativeHypotheses.forEach((hip) => {
      expect(hip.dimensionsInvolved.length).toBeGreaterThanOrEqual(2)
      expect(hip.evidences.length).toBeGreaterThanOrEqual(2)
      expect(['Alta', 'Moderada', 'Em observação']).toContain(hip.confidence)
      expect(hip.statement).toBeTruthy()
      expect(hip.investigationFocus).toBeTruthy()
      // Cada evidência deve conter citação e dimensão de origem
      hip.evidences.forEach((ev) => {
        expect(ev.dimensionName).toBeTruthy()
        expect(ev.literalText).toBeTruthy()
      })
    })

    // Bloco 6: Bloco Ayurveda Conciso (reutilizando motor sem duplicação de regras)
    expect(result.ayurvedaConcise.hasData).toBe(true)
    expect(result.ayurvedaConcise.prakritiHypothesis).toContain('Vata')
    expect(result.ayurvedaConcise.agniReading.type).toBe('Vishama Agni')
    expect(result.ayurvedaConcise.amaReading.presence).toBeTruthy()
    expect(result.ayurvedaConcise.disclaimer).toContain('Não representa diagnóstico')

    // Bloco 7: Prioridades para a Escuta Profissional (não prescrição) e Perguntas de Sessão
    expect(result.listeningPriorities.length).toBeGreaterThanOrEqual(2)
    result.listeningPriorities.forEach((pri) => {
      expect(pri.theme).toBeTruthy()
      expect(pri.deepeningQuestions.length).toBeGreaterThanOrEqual(2)
      pri.deepeningQuestions.forEach((q) => {
        expect(q.endsWith('?')).toBe(true)
      })
    })

    // Bloco 8: Lacunas de Informação e Limites de Evidência
    expect(result.informationGaps.unansweredDimensions).toEqual([])
    expect(result.informationGaps.partialObservations.length).toBeGreaterThanOrEqual(1)
    expect(result.informationGaps.recommendedExplorations.length).toBeGreaterThanOrEqual(1)

    // Disclaimer Geral
    expect(result.disclaimer).toBe(INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER)
  })

  it('separa categoricamente relato de evidência, hipótese de trabalho e foco de investigação', () => {
    const allFixture = buildConscienciaQaFixture(enrollmentId).responses
    const result = buildProfessionalIntegrativeMap(allFixture, participantName)

    result.integrativeHypotheses.forEach((hip) => {
      // 1. Evidências são relatos da interagente
      expect(hip.evidences.length).toBeGreaterThanOrEqual(2)
      // 2. Hipótese é formulação teórica de trabalho
      expect(hip.statement.toLowerCase()).not.toContain('diagnosticado com')
      expect(hip.statement.toLowerCase()).not.toContain('prescreve-se')
      // 3. Foco de investigação é pergunta ou exploração em sessão
      expect(
        hip.investigationFocus.toLowerCase().includes('investigar') ||
          hip.investigationFocus.toLowerCase().includes('explorar') ||
          hip.investigationFocus.toLowerCase().includes('compreender'),
      ).toBe(true)
    })
  })
})
