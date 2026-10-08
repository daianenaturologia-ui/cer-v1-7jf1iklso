import { describe, expect, it } from 'vitest'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C3_PROMPTS,
  deriveChapter3Status,
  loadChapter3State,
  AYV_C3_CURRENT_HUNGER_OPTIONS,
  AYV_C3_CURRENT_POST_MEAL_OPTIONS,
  AYV_C3_CURRENT_ELIMINATION_OPTIONS,
  AYV_C3_CURRENT_SLEEP_OPTIONS,
  AYV_C3_CURRENT_TEMPERATURE_OPTIONS,
  AYV_C3_CURRENT_SKIN_OPTIONS,
  AYV_C3_COMPARISON_OPTIONS,
  AYV_C3_FREQUENCY_OPTIONS,
  AYV_C3_OPERATIONAL_REFERENCE_TEXT,
  AYV_C3_CONTEXT_PROMPT_INSTRUCTION,
  AYV_C3_AREA_DEFINITIONS,
  AYV_C3_STARTED_OPTIONS,
  AYV_C3_CURRENT_DURATION_OPTIONS,
} from './ayurvedaChapter3'

const response = (
  promptKey: string,
  structuredValue: any,
  options?: { id?: string; answered_at?: string },
): ExperienceResponseRecord =>
  ({
    id: options?.id || `resp-${promptKey}`,
    enrollment_id: 'enrollment-demo',
    experience_id: 'exp-corpo-fisiologia-07b',
    respondent_user_id: 'participant-demo',
    prompt_id: promptKey,
    prompt_key: promptKey,
    canonical_prompt_id: promptKey,
    response_type: 'ChoiceCards',
    prompt_version: 1,
    version: 1,
    status: 'saved',
    access_class: 'shared_care',
    structured_value: {
      ...structuredValue,
      metadata: {
        ...(structuredValue?.metadata || {}),
        answered_at: options?.answered_at || '2026-09-28T12:00:00.000Z',
      },
    },
    created: '2026-09-28T12:00:00.000Z',
    updated: options?.answered_at || '2026-09-28T12:00:00.000Z',
  }) as ExperienceResponseRecord

describe('Capítulo 3 — mudanças atuais', () => {
  it('mantém o capítulo não iniciado sem respostas', () => {
    expect(deriveChapter3Status([]).status).toBe('not_started')
  })

  it('exige direção para cada domínio selecionado', () => {
    const responses = [
      response(AYV_C3_PROMPTS.DOMAINS.key, {
        value: ['sleep', 'energy_pace'],
        metadata: { prompt_key: AYV_C3_PROMPTS.DOMAINS.key },
      }),
      response(AYV_C3_PROMPTS.DIRECTIONS.key, {
        value: { sleep: 'irregular' },
        metadata: { prompt_key: AYV_C3_PROMPTS.DIRECTIONS.key },
      }),
    ]

    const derived = deriveChapter3Status(responses)
    expect(derived.status).toBe('in_progress')
    expect(derived.firstUnansweredStep).toBe(2)
  })

  it('considera pronta a investigação completa sem exigir o registro livre opcional', () => {
    const responses = [
      response(AYV_C3_PROMPTS.DOMAINS.key, {
        value: ['sleep'],
        metadata: { prompt_key: AYV_C3_PROMPTS.DOMAINS.key },
      }),
      response(AYV_C3_PROMPTS.DIRECTIONS.key, {
        value: { sleep: 'irregular' },
        metadata: { prompt_key: AYV_C3_PROMPTS.DIRECTIONS.key },
      }),
      response(AYV_C3_PROMPTS.STARTED_AT.key, {
        value: 'one_to_three_months',
        metadata: { prompt_key: AYV_C3_PROMPTS.STARTED_AT.key },
      }),
      response(AYV_C3_PROMPTS.CONTEXTS.key, {
        value: ['stress'],
        metadata: { prompt_key: AYV_C3_PROMPTS.CONTEXTS.key },
      }),
    ]

    expect(deriveChapter3Status(responses).status).toBe('ready_to_complete')
    expect(loadChapter3State(responses).started_change_at).toBe('one_to_three_months')
  })

  it('preserva não sei, recusa e ausência como estados diferentes', () => {
    const unsure = deriveChapter3Status([
      response(AYV_C3_PROMPTS.DOMAINS.key, {
        value: ['dont_know'],
        metadata: { prompt_key: AYV_C3_PROMPTS.DOMAINS.key, explicit_unsure: true },
      }),
    ])
    const refusal = deriveChapter3Status([
      response(AYV_C3_PROMPTS.DOMAINS.key, {
        value: ['refusal'],
        metadata: { prompt_key: AYV_C3_PROMPTS.DOMAINS.key, explicit_refusal: true },
      }),
    ])

    expect(unsure.status).toBe('ready_to_complete')
    expect(refusal.status).toBe('ready_to_complete')
    expect(deriveChapter3Status([]).state.changed_domains).toBeUndefined()
  })

  it('só marca concluído com confirmação explícita', () => {
    const completed = response(AYV_C3_PROMPTS.COMPLETION.key, {
      completed: true,
      metadata: { prompt_key: AYV_C3_PROMPTS.COMPLETION.key },
    })
    expect(deriveChapter3Status([completed]).status).toBe('completed')
  })

  it('carrega medicamentos estruturados sem inferir causalidade', () => {
    const responses = [
      response(AYV_C3_PROMPTS.MEDICATION_STATUS.key, { value: 'recent_change' }),
      response(AYV_C3_PROMPTS.MEDICATION_DETAILS.key, {
        value: [
          {
            id: 'med-1',
            kind: 'medication',
            name: 'Medicamento informado',
            dose: '10 mg',
            frequency: 'uma vez ao dia',
            timing: 'dose_changed',
            perceived_changes: 'Percebi mais cansaço depois da alteração.',
          },
        ],
      }),
    ]

    const state = loadChapter3State(responses)
    expect(state.medication_status).toBe('recent_change')
    expect(state.medication_items).toHaveLength(1)
    expect(state.medication_items?.[0].perceived_changes).toBe(
      'Percebi mais cansaço depois da alteração.',
    )
    expect(JSON.stringify(state).toLowerCase()).not.toContain('causou')
  })

  describe('Microbloco 3B — Loader determinístico e coletas por área', () => {
    it('loader é invariável à ordem de entrada e deduplica deterministicamente', () => {
      const respOld = response(
        AYV_C3_PROMPTS.DOMAINS.key,
        { value: ['sleep'] },
        { id: 'resp-domains-1', answered_at: '2026-09-28T10:00:00.000Z' },
      )
      const respNew = response(
        AYV_C3_PROMPTS.DOMAINS.key,
        { value: ['sleep', 'hunger_digestion'] },
        { id: 'resp-domains-2', answered_at: '2026-09-28T12:00:00.000Z' },
      )
      const respContext = response(
        AYV_C3_PROMPTS.CONTEXTS.key,
        { value: ['stress'] },
        { id: 'resp-ctx', answered_at: '2026-09-28T11:00:00.000Z' },
      )

      // Ordem A: [respOld, respNew, respContext]
      const stateA = loadChapter3State([respOld, respNew, respContext])
      // Ordem B: [respContext, respNew, respOld]
      const stateB = loadChapter3State([respContext, respNew, respOld])
      // Ordem C: [respNew, respContext, respOld]
      const stateC = loadChapter3State([respNew, respContext, respOld])

      expect(stateA.changed_domains).toEqual(['sleep', 'hunger_digestion'])
      expect(stateB.changed_domains).toEqual(['sleep', 'hunger_digestion'])
      expect(stateC.changed_domains).toEqual(['sleep', 'hunger_digestion'])
      expect(stateA).toEqual(stateB)
      expect(stateB).toEqual(stateC)
    })

    it('preserva registros legados concluídos sem transformar em não concluído', () => {
      const legacyResponses = [
        response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['no_current_changes'] }),
        response(AYV_C3_PROMPTS.COMPLETION.key, { completed: true }),
      ]
      const status = deriveChapter3Status(legacyResponses)
      expect(status.status).toBe('completed')
      expect(status.shortPath).toBe(true)
      expect(status.state.changed_domains).toEqual(['no_current_changes'])
      // As novas coletas opcionais ausentes continuam undefined sem erro
      expect(status.state.current_hunger).toBeUndefined()
    })

    it('coletas opcionais por área: carrega valores estruturados sem alterar completude obrigatória', () => {
      const responses = [
        response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['no_current_changes'] }),
        response(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
          value: {
            area_key: 'hunger',
            current_states: ['sudden_intense', 'variable_intensity'],
            comparison: 'different',
            duration: 'one_to_three_months',
            frequency: 'several_days',
            contexts: ['stress', 'routine'],
          },
        }),
        response(AYV_C3_PROMPTS.CURRENT_TEMPERATURE.key, {
          value: {
            area_key: 'temperature',
            current_states: ['cold_easily'],
            comparison: 'same_as_usual',
          },
        }),
      ]

      const state = loadChapter3State(responses)
      expect(state.current_hunger?.current_states).toEqual(['sudden_intense', 'variable_intensity'])
      expect(state.current_hunger?.comparison).toBe('different')
      expect(state.current_hunger?.duration).toBe('one_to_three_months')
      expect(state.current_hunger?.frequency).toBe('several_days')
      expect(state.current_hunger?.contexts).toEqual(['stress', 'routine'])

      expect(state.current_temperature?.comparison).toBe('same_as_usual')
      expect(state.current_temperature?.current_states).toEqual(['cold_easily'])

      // Não quebra a derivação do status do capítulo (opcional)
      const derived = deriveChapter3Status(responses)
      expect(derived.status).toBe('ready_to_complete')
    })

    it('regras de texto e opções: 14 dias obrigatório, instrução de contexto sem causa e exclusividades', () => {
      expect(AYV_C3_OPERATIONAL_REFERENCE_TEXT).toContain('14 dias')
      expect(AYV_C3_OPERATIONAL_REFERENCE_TEXT).toContain('habitual para você')
      expect(AYV_C3_CONTEXT_PROMPT_INSTRUCTION).toBe(
        'O que estava acontecendo nesse período? Isso registra contexto, sem afirmar causa.',
      )

      // Temperatura e pele têm opções separadas e nunca combinadas
      expect(AYV_C3_AREA_DEFINITIONS.temperature.options).toBe(AYV_C3_CURRENT_TEMPERATURE_OPTIONS)
      expect(AYV_C3_AREA_DEFINITIONS.skin.options).toBe(AYV_C3_CURRENT_SKIN_OPTIONS)
      expect(AYV_C3_CURRENT_TEMPERATURE_OPTIONS).not.toEqual(AYV_C3_CURRENT_SKIN_OPTIONS)

      // Exclusividade de dont_know e refusal em todas as 6 áreas
      for (const area of Object.values(AYV_C3_AREA_DEFINITIONS)) {
        const dk = area.options.find((o) => o.id === 'dont_know')
        const ref = area.options.find((o) => o.id === 'refusal')
        expect(dk?.exclusive).toBe(true)
        expect(ref?.exclusive).toBe(true)
        // Rótulo de opções não deve conter a palavra "habitual" (esta palavra fica só no comparativo)
        for (const opt of area.options) {
          expect(opt.label.toLowerCase()).not.toContain('habitual')
        }
      }

      // Frequências descritivas canônicas
      const freqLabels = AYV_C3_FREQUENCY_OPTIONS.map((f) => f.label)
      expect(freqLabels).toContain('Em poucos dias')
      expect(freqLabels).toContain('Em vários dias')
      expect(freqLabels).toContain('Quase todos os dias')
      expect(freqLabels).toContain('Varia bastante')

      // Comparações canônicas
      const compIds = AYV_C3_COMPARISON_OPTIONS.map((c) => c.id)
      expect(compIds).toContain('same_as_usual')
      expect(compIds).toContain('different')
      expect(compIds).toContain('hard_to_compare')
      expect(compIds).toContain('dont_know')
      expect(compIds).toContain('refusal')
    })

    it('microbloco 3C: opções de duração do novo bloco têm refusal sem alterar AYV_C3_STARTED_OPTIONS legado', () => {
      // AYV_C3_STARTED_OPTIONS legado NÃO possui refusal
      expect(
        (AYV_C3_STARTED_OPTIONS as readonly { id: string }[]).find((o) => o.id === 'refusal'),
      ).toBeUndefined()
      expect(
        (AYV_C3_STARTED_OPTIONS as readonly { id: string }[]).find((o) => o.id === 'dont_know'),
      ).toBeDefined()

      // AYV_C3_CURRENT_DURATION_OPTIONS do novo bloco POSSUI refusal com rótulo 'Prefiro não responder'
      const durRefusal = AYV_C3_CURRENT_DURATION_OPTIONS.find((o) => o.id === 'refusal')
      expect(durRefusal).toBeDefined()
      expect(durRefusal?.label).toBe('Prefiro não responder')
      expect(durRefusal?.exclusive).toBe(true)
      expect(durRefusal?.epistemic).toBe('refusal')
    })
  })
})
