import { describe, expect, it } from 'vitest'
import type { ExperienceResponseRecord } from '@/types/cer'
import { AYV_C1_PROMPTS } from './ayurvedaChapter1'
import { AYV_C2_PROMPTS } from './ayurvedaChapter2'
import { AYV_C3_PROMPTS } from './ayurvedaChapter3'
import { AYV_C4_COMPLETION, buildChapter4Synthesis, isChapter4Completed } from './ayurvedaChapter4'

const response = (promptKey: string, value: any, revisionNumber?: number) =>
  ({
    id: `${promptKey}-${revisionNumber || 1}`,
    enrollment_id: 'enrollment-demo',
    experience_id: 'exp-corpo-fisiologia-07b',
    respondent_user_id: 'participant-demo',
    prompt_id: promptKey,
    prompt_key: promptKey,
    canonical_prompt_id: promptKey,
    response_type: 'ChoiceCards',
    prompt_version: 1,
    version: revisionNumber || 1,
    revision_number: revisionNumber,
    status: 'saved',
    access_class: 'shared_care',
    structured_value: {
      ...value,
      revision_number: revisionNumber,
      metadata: { prompt_key: promptKey, revision_number: revisionNumber, ...value.metadata },
    },
    created: '2026-09-28T12:00:00.000Z',
    updated: '2026-09-28T12:00:00.000Z',
  }) as ExperienceResponseRecord

describe('Capítulo 4 — síntese descritiva', () => {
  const fixture = [
    response(AYV_C1_PROMPTS.P1_STRUCTURE.key, { value: 'intermediate' }, 1),
    response(AYV_C1_PROMPTS.CHAPTER_COMPLETION.key, { completed: true }, 1),
    response(AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key, { value: ['regular_hours'] }, 1),
    response(AYV_C2_PROMPTS.CHAPTER_COMPLETION.key, { completed: true }, 1),
    response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['sleep'] }),
    response(AYV_C3_PROMPTS.DIRECTIONS.key, { value: { sleep: 'irregular' } }),
    response(AYV_C3_PROMPTS.STARTED_AT.key, { value: 'one_to_three_months' }),
    response(AYV_C3_PROMPTS.CONTEXTS.key, { value: ['stress'] }),
  ]

  it('separa características antigas, ritmos habituais e mudanças atuais', () => {
    const synthesis = buildChapter4Synthesis(fixture)
    expect(synthesis.historical).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Estrutura corporal habitual' })]),
    )
    expect(synthesis.habitual).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Fome habitual' })]),
    )
    expect(synthesis.current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Sono e recuperação',
          value: 'Ficou mais irregular ou variável',
        }),
      ]),
    )
  })

  it('não produz dosha, porcentagem, diagnóstico ou prescrição', () => {
    const text = JSON.stringify(buildChapter4Synthesis(fixture)).toLowerCase()
    for (const forbidden of ['vata', 'pitta', 'kapha', 'diagnóstico', 'prescrição', '%']) {
      expect(text).not.toContain(forbidden)
    }
  })

  it('exige conclusão explícita da síntese', () => {
    expect(isChapter4Completed(fixture)).toBe(false)
    expect(
      isChapter4Completed([...fixture, response(AYV_C4_COMPLETION.key, { completed: true })]),
    ).toBe(true)
  })

  it('usa somente a revisão concluída mais recente e mantém títulos humanos', () => {
    const synthesis = buildChapter4Synthesis([
      response(
        AYV_C1_PROMPTS.P1_STRUCTURE.key,
        { value: 'dont_know', metadata: { explicit_unsure: true } },
        1,
      ),
      response(AYV_C1_PROMPTS.CHAPTER_COMPLETION.key, { completed: true }, 1),
      response(AYV_C1_PROMPTS.P1_STRUCTURE.key, { value: 'intermediate' }, 2),
      response(AYV_C1_PROMPTS.CHAPTER_COMPLETION.key, { completed: true }, 2),
    ])

    expect(synthesis.historical).toContainEqual({
      title: 'Estrutura corporal habitual',
      value: 'Estrutura intermediária',
    })
    expect(synthesis.questionsForSession).toEqual([])
    expect(JSON.stringify(synthesis)).not.toContain('ayv_c1_')
  })

  it('preserva literalmente a ausência percebida de mudanças atuais', () => {
    const synthesis = buildChapter4Synthesis([
      response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['no_current_changes'] }),
    ])

    expect(synthesis.current).toEqual([
      {
        title: 'Mudanças atuais',
        value: 'Não percebo mudanças importantes agora',
      },
    ])
  })

  it('leva o contexto medicamentoso factual para a síntese e para a conversa profissional', () => {
    const synthesis = buildChapter4Synthesis([
      response(AYV_C3_PROMPTS.MEDICATION_STATUS.key, { value: 'recent_change' }),
      response(AYV_C3_PROMPTS.MEDICATION_DETAILS.key, {
        value: [
          {
            id: 'med-1',
            kind: 'medication',
            name: 'Medicamento informado',
            dose: '10 mg',
            timing: 'started_recently',
            perceived_changes: 'Sono mais leve desde então.',
          },
        ],
      }),
    ])

    expect(synthesis.current).toEqual(
      expect.arrayContaining([
        {
          title: 'Medicamentos e suplementos',
          value: 'Comecei, parei ou alterei algo recentemente',
        },
        expect.objectContaining({ title: 'Medicamento informado' }),
      ]),
    )
    expect(synthesis.questionsForSession).toContainEqual({
      title: 'Percepção após mudança em Medicamento informado',
      value: 'Sono mais leve desde então.',
    })
    expect(JSON.stringify(synthesis).toLowerCase()).not.toContain('efeito colateral confirmado')
  })
  it('apresenta a mudança de pele ou cabelo na síntese sem inventar qual sintoma mudou', () => {
    const synthesis = buildChapter4Synthesis([
      response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['skin_hair'] }),
      response(AYV_C3_PROMPTS.DIRECTIONS.key, { value: { skin_hair: 'decreased' } }),
    ])
    expect(synthesis.current).toContainEqual({
      title: 'Pele ou cabelo',
      value: 'Uma característica da pele ou do cabelo diminuiu',
    })
    expect(JSON.stringify(synthesis.current)).not.toMatch(/ressecamento|oleosidade|queda/)
  })
})
