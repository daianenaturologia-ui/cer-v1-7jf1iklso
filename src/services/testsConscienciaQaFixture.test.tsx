import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfessionalConscienciaSection } from '@/components/ProfessionalConscienciaSection'
import { demoAdapter } from '@/services/demoAdapter'
import { buildConscienciaQaFixture } from '@/services/conscienciaQaFixture'
import { buildAyurvedaInterpretation } from '@/services/ayurvedaInterpretationEngine'
import {
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
} from '@/services/universalDimensionInterpretationEngine'

const mockEnrollment: any = {
  id: 'demo-enr-01',
  person_id: 'demo-person-mariana',
  product_id: 'demo-product-01',
  status: 'active',
}

describe('Consciência QA Fixture & Cenário de Demonstração', () => {
  beforeEach(() => {
    demoAdapter.enableDemo()
    demoAdapter.setActiveScenario('default')
  })

  afterEach(() => {
    demoAdapter.setActiveScenario('default')
  })

  it('estado default não inventa interpretações nem respostas nas dimensões vazias', () => {
    expect(demoAdapter.getActiveScenario()).toBe('default')
    const responses = demoAdapter.listExperienceResponses('demo-enr-01')
    // No estado padrão, mente, regulação, relações, sexualidade e sentido estão vazios
    const menteResps = responses.filter((r) => r.experience_id === 'exp-mente-emocoes-07c')
    const regResps = responses.filter((r) => r.experience_id === 'exp-regulacao-respostas-07c')
    const relResps = responses.filter((r) => r.experience_id === 'exp-relacoes-07d')
    const sexResps = responses.filter((r) => r.experience_id === 'exp-sexualidade-07e')
    const senResps = responses.filter((r) => r.experience_id === 'exp-sentido-conexao-07f')

    expect(menteResps.length).toBe(0)
    expect(regResps.length).toBe(0)
    expect(relResps.length).toBe(0)
    expect(sexResps.length).toBe(0)
    expect(senResps.length).toBe(0)

    // Motor universal retorna interpretações vazias/iniciais sem inventar dados
    const emptyReg = buildRegulacaoInterpretation([], 'Mariana')
    expect(emptyReg.hasResponses).toBe(false)
    expect(emptyReg.observedEvidences.length).toBe(0)
  })

  it('fixture ativa gera respostas completas para as seis dimensões da Consciência', () => {
    const fixture = buildConscienciaQaFixture('demo-enr-01')
    expect(fixture.responses.length).toBeGreaterThan(30)
    expect(fixture.responseVersions.length).toBeGreaterThan(0)

    demoAdapter.setActiveScenario('qa_consciencia_completa')
    const allResponses = demoAdapter.listExperienceResponses('demo-enr-01')

    const c1c2Resps = allResponses.filter((r) => r.experience_id === 'exp-corpo-fisiologia-07b')
    const menteResps = allResponses.filter((r) => r.experience_id === 'exp-mente-emocoes-07c')
    const regResps = allResponses.filter((r) => r.experience_id === 'exp-regulacao-respostas-07c')
    const relResps = allResponses.filter((r) => r.experience_id === 'exp-relacoes-07d')
    const sexResps = allResponses.filter((r) => r.experience_id === 'exp-sexualidade-07e')
    const senResps = allResponses.filter((r) => r.experience_id === 'exp-sentido-conexao-07f')

    expect(c1c2Resps.length).toBeGreaterThanOrEqual(15)
    expect(menteResps.length).toBe(13)
    expect(regResps.length).toBeGreaterThanOrEqual(7)
    expect(relResps.length).toBeGreaterThanOrEqual(8)
    expect(sexResps.length).toBeGreaterThanOrEqual(7)
    expect(senResps.length).toBeGreaterThanOrEqual(6)
  })

  it('motor de Ayurveda CER gera Prakriti, Vikriti, Agni e Ama sinalizado com fixture ativa', () => {
    const fixture = buildConscienciaQaFixture('demo-enr-01')
    const c1c2Resps = fixture.responses.filter(
      (r) => r.experience_id === 'exp-corpo-fisiologia-07b',
    )

    const ayv = buildAyurvedaInterpretation(c1c2Resps)

    // Verificação de Prakriti / Vikriti
    expect(ayv.hasCompletedRevision).toBe(true)
    expect(ayv.prakritiHypothesis.primaryTendency).toBe('Vata')
    expect(ayv.vikritiHypothesis.primaryImbalance).toBe('Vata')

    // Verificação de Agni
    expect(ayv.agniReading.type).toBe('Vishama Agni')

    // Verificação de Ama sinalizado (presente em 3 frentes: digestão, evacuação, despertar)
    expect(ayv.amaReading.presence).toBe('Sinalizada')
    expect(ayv.amaReading.categoriesInvolved.length).toBeGreaterThanOrEqual(2)
  })

  it('Ama permanece "Possível/Limítrofe" quando há evidências em apenas 1 categoria', () => {
    const fixture = buildConscienciaQaFixture('demo-enr-01')
    // Filtrar apenas respostas com 1 única categoria de Ama (ex: eliminando evacuação lenta e despertar pesado)
    const filteredResps = fixture.responses
      .filter((r) => r.experience_id === 'exp-corpo-fisiologia-07b')
      .map((r) => {
        const key = (r as any).prompt_key || (r.structured_value as any)?.prompt_key
        if (key === 'ayv_c2_m3_elimination_pattern') {
          return {
            ...r,
            structured_value: {
              ...(r.structured_value as any),
              selectedOptionIds: ['normal'],
              value: 'normal',
            },
          }
        }
        if (key === 'ayv_c2_m5_energy_morning') {
          return {
            ...r,
            structured_value: {
              ...(r.structured_value as any),
              value: 'normal_energy',
            },
          }
        }
        return r
      })

    const ayv = buildAyurvedaInterpretation(filteredResps)
    expect(ayv.amaReading.categoriesInvolved.length).toBe(1)
    expect(ayv.amaReading.presence).toBe('Possível / Limítrofe')
  })

  it('as 4 dimensões universais produzem sínteses, evidências, recursos e perguntas com a fixture', () => {
    const fixture = buildConscienciaQaFixture('demo-enr-01')

    const regResps = fixture.responses.filter(
      (r) => r.experience_id === 'exp-regulacao-respostas-07c',
    )
    const relResps = fixture.responses.filter((r) => r.experience_id === 'exp-relacoes-07d')
    const sexResps = fixture.responses.filter((r) => r.experience_id === 'exp-sexualidade-07e')
    const senResps = fixture.responses.filter((r) => r.experience_id === 'exp-sentido-conexao-07f')

    const regInterp = buildRegulacaoInterpretation(regResps, 'Mariana')
    const relInterp = buildRelacoesInterpretation(relResps, 'Mariana')
    const sexInterp = buildSexualidadeInterpretation(sexResps, 'Mariana')
    const senInterp = buildSentidoInterpretation(senResps, 'Mariana')

    // Cada uma das 4 dimensões deve ter síntese, evidências, recursos e perguntas para a sessão
    for (const interp of [regInterp, relInterp, sexInterp, senInterp]) {
      expect(interp.hasResponses).toBe(true)
      expect(interp.simpleSynthesis.length).toBeGreaterThan(10)
      expect(interp.observedEvidences.length).toBeGreaterThan(0)
      expect(interp.perceivedResources.length).toBeGreaterThan(0)
      expect(interp.attentionPoints.length).toBeGreaterThan(0)
      expect(interp.sessionQuestions.length).toBeGreaterThan(0)
    }
  })

  it('permite alternar o cenário QA pela UI da visão profissional preservando estado original', async () => {
    render(
      <ProfessionalConscienciaSection
        enrollment={mockEnrollment}
        participantName="Mariana Silva"
      />,
    )

    // Inicialmente no estado default
    await waitFor(() => {
      expect(screen.getByTestId('toggle-qa-scenario-btn')).toBeInTheDocument()
    })
    expect(screen.getByText('Ativar Cenário QA (6 Dimensões)')).toBeInTheDocument()

    // Clica para ativar o cenário QA completo
    fireEvent.click(screen.getByTestId('toggle-qa-scenario-btn'))

    await waitFor(() => {
      expect(screen.getByText('Cenário QA Consciência Ativo')).toBeInTheDocument()
    })
    expect(demoAdapter.getActiveScenario()).toBe('qa_consciencia_completa')

    // Clica novamente para desativar e voltar ao estado default
    fireEvent.click(screen.getByTestId('toggle-qa-scenario-btn'))

    await waitFor(() => {
      expect(screen.getByText('Ativar Cenário QA (6 Dimensões)')).toBeInTheDocument()
    })
    expect(demoAdapter.getActiveScenario()).toBe('default')
  })
})
