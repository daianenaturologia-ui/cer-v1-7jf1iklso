import { describe, expect, it } from 'vitest'
import type { ExperienceResponseRecord } from '@/types/cer'
import { AYV_C3_PROMPTS, deriveChapter3Status, loadChapter3State } from './ayurvedaChapter3'

const response = (promptKey: string, structuredValue: any): ExperienceResponseRecord =>
  ({
    id: `resp-${promptKey}`,
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
    structured_value: structuredValue,
    created: '2026-09-28T12:00:00.000Z',
    updated: '2026-09-28T12:00:00.000Z',
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
})
