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
import {
  AYV_C3_PROMPTS,
  AYURVEDA_CHAPTER_3_ID,
  AYURVEDA_CHAPTER_3_VERSION,
  deriveChapter3Status,
  loadChapter3State,
} from '@/services/ayurvedaChapter3'

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
    // Microbloco 1B-c: C2 é funcionamento habitual_adult e não pode virar Vikriti ativa (primaryImbalance indefinido, confidence 'Em observação')
    expect(ayv.vikritiHypothesis.confidence).toBe('Em observação')
    expect(ayv.vikritiHypothesis.primaryImbalance).toBeUndefined()

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

  describe('Regressão Microbloco 3E — Persistência e Recuperação do Capítulo 3 no Cenário QA Ativo', () => {
    const testEnrollmentId = 'demo-enr-01'
    const experienceId = 'exp-corpo-fisiologia-07b'

    it('1) Cenário QA ativo → salvar resposta de C3 via saveExperienceResponse → listExperienceResponses inclui novos prompts com fixture íntegro', () => {
      demoAdapter.setActiveScenario('qa_consciencia_completa')
      const initialResponses = demoAdapter.listExperienceResponses(testEnrollmentId, experienceId)
      const initialCount = initialResponses.length
      expect(initialCount).toBeGreaterThanOrEqual(15)

      // Verificar que antes de salvar, nenhum prompt ayv_c3 existe
      const initialC3 = initialResponses.filter(
        (r) =>
          r.prompt_id.startsWith('ayv_c3_') ||
          (r as any).prompt_key?.startsWith('ayv_c3_') ||
          (r.structured_value as any)?.metadata?.prompt_key?.startsWith('ayv_c3_'),
      )
      expect(initialC3.length).toBe(0)

      // Salva respostas de C3 (caminho curto: sem mudanças atuais)
      const now = new Date().toISOString()
      demoAdapter.saveExperienceResponse({
        enrollmentId: testEnrollmentId,
        experienceId,
        promptId: AYV_C3_PROMPTS.DOMAINS.id,
        respondentUserId: 'user-mariana',
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C3_PROMPTS.DOMAINS.key,
        canonicalPromptId: AYV_C3_PROMPTS.DOMAINS.id,
        stepOrder: AYV_C3_PROMPTS.DOMAINS.step_order,
        accessClass: 'shared_care',
        structuredValue: {
          value: ['no_current_changes'],
          selectedOptionIds: ['no_current_changes'],
          chapter_id: AYURVEDA_CHAPTER_3_ID,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          chapter_revision_number: 1,
          metadata: {
            prompt_key: AYV_C3_PROMPTS.DOMAINS.key,
            canonical_prompt_id: AYV_C3_PROMPTS.DOMAINS.id,
            domain: 'corpo_fisiologia',
            option_ids: ['no_current_changes'],
            time_layer: 'current',
            stability: 'changed',
            source: 'participant_self_report',
            answered_at: now,
            chapter_id: AYURVEDA_CHAPTER_3_ID,
            chapter_revision_number: 1,
          },
        },
      })

      // Salva também resposta de área atual (ex: ayv_c3_current_hunger)
      demoAdapter.saveExperienceResponse({
        enrollmentId: testEnrollmentId,
        experienceId,
        promptId: AYV_C3_PROMPTS.CURRENT_HUNGER.id,
        respondentUserId: 'user-mariana',
        responseType: 'ChoiceCards',
        promptVersion: 1,
        promptKey: AYV_C3_PROMPTS.CURRENT_HUNGER.key,
        canonicalPromptId: AYV_C3_PROMPTS.CURRENT_HUNGER.id,
        stepOrder: AYV_C3_PROMPTS.CURRENT_HUNGER.step_order,
        accessClass: 'shared_care',
        structuredValue: {
          area_key: 'hunger',
          current_states: ['irregular_hunger'],
          chapter_id: AYURVEDA_CHAPTER_3_ID,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          chapter_revision_number: 1,
          metadata: {
            prompt_key: AYV_C3_PROMPTS.CURRENT_HUNGER.key,
            canonical_prompt_id: AYV_C3_PROMPTS.CURRENT_HUNGER.id,
            chapter_revision_number: 1,
          },
        },
      })

      // Salva conclusão explícita
      demoAdapter.saveExperienceResponse({
        enrollmentId: testEnrollmentId,
        experienceId,
        promptId: AYV_C3_PROMPTS.COMPLETION.id,
        respondentUserId: 'user-mariana',
        responseType: 'ChapterCompletion',
        promptVersion: 1,
        promptKey: AYV_C3_PROMPTS.COMPLETION.key,
        canonicalPromptId: AYV_C3_PROMPTS.COMPLETION.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        structuredValue: {
          completed: true,
          completed_at: now,
          chapter_id: AYURVEDA_CHAPTER_3_ID,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          metadata: {
            prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
            answered_at: now,
            chapter_revision_number: 1,
          },
        },
      })

      const updatedResponses = demoAdapter.listExperienceResponses(testEnrollmentId, experienceId)
      // Contém os registros originais do fixture + 3 novos registros de C3
      expect(updatedResponses.length).toBe(initialCount + 3)

      // Fixture íntegro: registros originais de C1/C2 continuam lá e inalterados
      for (const orig of initialResponses) {
        const found = updatedResponses.find((r) => r.id === orig.id)
        expect(found).toBeDefined()
        expect(found?.prompt_id).toBe(orig.prompt_id)
      }

      // Registros ayv_c3 estão presentes
      const c3Saved = updatedResponses.filter(
        (r) =>
          r.prompt_id === AYV_C3_PROMPTS.DOMAINS.id ||
          r.prompt_id === AYV_C3_PROMPTS.CURRENT_HUNGER.id ||
          r.prompt_id === AYV_C3_PROMPTS.COMPLETION.id,
      )
      expect(c3Saved.length).toBe(3)
    })

    it('2) Após salvar, deriveChapter3Status reflete conclusão e loadChapter3State recupera as respostas salvas', () => {
      demoAdapter.setActiveScenario('qa_consciencia_completa')
      const responses = demoAdapter.listExperienceResponses(testEnrollmentId, experienceId)

      const status = deriveChapter3Status(responses)
      expect(status.status).toBe('completed')

      const state = loadChapter3State(responses)
      expect(state.changed_domains).toEqual(['no_current_changes'])
      expect(state.current_hunger?.current_states).toEqual(['irregular_hunger'])
    })

    it('3) Isolamento: respostas salvas de OUTRO enrollment_id não aparecem na listagem', () => {
      demoAdapter.setActiveScenario('qa_consciencia_completa')
      const otherEnrollmentId = 'demo-enr-other-user'

      demoAdapter.saveExperienceResponse({
        enrollmentId: otherEnrollmentId,
        experienceId,
        promptId: 'ayv_c3_domains_other',
        respondentUserId: 'user-other',
        responseType: 'ChoiceCards',
        promptVersion: 1,
        structuredValue: { value: ['sleep'] },
      })

      const marianaResponses = demoAdapter.listExperienceResponses(testEnrollmentId, experienceId)
      const otherInMariana = marianaResponses.filter(
        (r) => r.enrollment_id === otherEnrollmentId || r.prompt_id === 'ayv_c3_domains_other',
      )
      expect(otherInMariana.length).toBe(0)

      // Listagem de otherEnrollmentId não contém dados exclusivos de Mariana
      const otherResponses = demoAdapter.listExperienceResponses(otherEnrollmentId, experienceId)
      const marianaInOther = otherResponses.filter((r) => r.enrollment_id === testEnrollmentId)
      expect(marianaInOther.length).toBe(0)
    })

    it('4) Cenário demo NORMAL (sem QA): comportamento inalterado (leitura do store como antes)', () => {
      demoAdapter.setActiveScenario('default')
      expect(demoAdapter.getActiveScenario()).toBe('default')

      const normalResponses = demoAdapter.listExperienceResponses(testEnrollmentId, experienceId)
      // No cenário default, vem apenas do store — sem fixture injetado
      // Mariana tem as respostas de C3 salvas no store
      const c3InDefault = normalResponses.filter(
        (r) =>
          r.prompt_id === AYV_C3_PROMPTS.DOMAINS.id ||
          r.prompt_id === AYV_C3_PROMPTS.CURRENT_HUNGER.id ||
          r.prompt_id === AYV_C3_PROMPTS.COMPLETION.id,
      )
      expect(c3InDefault.length).toBe(3)

      // Nenhuma resposta de Mente, Regulação, etc. do fixture QA aparece no default
      const menteResps = demoAdapter
        .listExperienceResponses(testEnrollmentId)
        .filter((r) => r.experience_id === 'exp-mente-emocoes-07c')
      expect(menteResps.length).toBe(0)
    })
  })
})
