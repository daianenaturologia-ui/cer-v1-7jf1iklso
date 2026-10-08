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

  it('incorpora as seis áreas atuais em bloco separado "Como meu corpo está agora" (últimos 14 dias)', () => {
    const synthesis = buildChapter4Synthesis([
      response(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
        value: {
          area_key: 'hunger',
          current_states: ['regular_hours', 'sudden_intense'],
          comparison: 'different',
          duration: 'last_week',
          frequency: 'several_days',
          contexts: ['routine', 'stress'],
        },
      }),
      response(AYV_C3_PROMPTS.CURRENT_SLEEP.key, {
        value: {
          area_key: 'sleep',
          current_states: ['light_wakes_easy'],
          comparison: 'same_as_usual',
          // Detalhes que deveriam ser ignorados pois comparison não é different
          duration: 'last_month',
          frequency: 'almost_every_day',
          contexts: ['climate'],
        },
      }),
    ])

    expect(synthesis.currentBody).toBeDefined()
    expect(synthesis.currentBody?.title).toBe('Como meu corpo está agora')
    expect(synthesis.currentBody?.referenceText).toBe('últimos 14 dias')
    expect(synthesis.currentBody?.hasAnyData).toBe(true)

    // Fome com múltiplas seleções e detalhes de different
    const hungerItem = synthesis.currentBody?.items.find((i) => i.areaId === 'hunger')
    expect(hungerItem).toBeDefined()
    expect(hungerItem?.currentStates).toHaveLength(2)
    expect(hungerItem?.currentStates).toContain('Aparece em horários relativamente previsíveis')
    expect(hungerItem?.currentStates).toContain('Surge de repente e pode ficar muito intensa')
    expect(hungerItem?.comparison).toBe('Diferente do meu habitual')
    expect(hungerItem?.duration).toBe('Na última semana')
    expect(hungerItem?.frequency).toBe('Em vários dias')
    expect(hungerItem?.contexts).toContain('Mudança de rotina')
    expect(hungerItem?.contexts).toContain('Estresse ou acontecimentos emocionais')

    // Sono com same_as_usual omite detalhes obsoletos
    const sleepItem = synthesis.currentBody?.items.find((i) => i.areaId === 'sleep')
    expect(sleepItem).toBeDefined()
    expect(sleepItem?.comparison).toBe('Parecido com meu habitual')
    expect(sleepItem?.duration).toBeUndefined()
    expect(sleepItem?.frequency).toBeUndefined()
    expect(sleepItem?.contexts).toHaveLength(0)
    expect(sleepItem?.summaryLines.some((l) => l.label.includes('Duração'))).toBe(false)
  })

  it('mantém integridade para registros legados sem o bloco novo', () => {
    const synthesis = buildChapter4Synthesis([
      response(AYV_C3_PROMPTS.DOMAINS.key, { value: ['sleep'] }),
    ])

    expect(synthesis.currentBody).toBeDefined()
    expect(synthesis.currentBody?.hasAnyData).toBe(false)
    expect(synthesis.currentBody?.items).toEqual([])
  })

  it('Microbloco 4B: consolida convite opcional para dúvidas/recusas nos dados atuais e evita duplicatas genéricas', () => {
    // Caso fictício salvo:
    // fome com 2 estados + comparação different + duração refusal + frequência several + contexto routine;
    // sono dont_know + comparação hard_to_compare
    const mockCase = [
      response(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
        value: {
          area_key: 'hunger',
          current_states: ['regular_hours', 'sudden_intense'],
          comparison: 'different',
          duration: 'refusal',
          frequency: 'several_days',
          contexts: ['routine'],
        },
      }),
      response(AYV_C3_PROMPTS.CURRENT_SLEEP.key, {
        value: {
          area_key: 'sleep',
          current_states: ['dont_know'],
          comparison: 'hard_to_compare',
        },
      }),
    ]

    const synthesis = buildChapter4Synthesis(mockCase)

    // (a) bloco current literal preservado (título, estados, duração "Prefiro não responder" literal, frequência, contexto)
    expect(synthesis.currentBody).toBeDefined()
    expect(synthesis.currentBody?.title).toBe('Como meu corpo está agora')
    const hungerItem = synthesis.currentBody?.items.find((i) => i.areaId === 'hunger')
    expect(hungerItem).toBeDefined()
    expect(hungerItem?.currentStates).toHaveLength(2)
    expect(hungerItem?.currentStates).toContain('Aparece em horários relativamente previsíveis')
    expect(hungerItem?.currentStates).toContain('Surge de repente e pode ficar muito intensa')
    expect(hungerItem?.comparison).toBe('Diferente do meu habitual')
    expect(hungerItem?.duration).toBe('Prefiro não responder')
    expect(hungerItem?.frequency).toBe('Em vários dias')
    expect(hungerItem?.contexts).toContain('Mudança de rotina')

    const sleepItem = synthesis.currentBody?.items.find((i) => i.areaId === 'sleep')
    expect(sleepItem).toBeDefined()
    expect(sleepItem?.currentStates).toContain('Não sei identificar')
    expect(sleepItem?.comparison).toBe('Difícil comparar')

    // (b) EXATAMENTE UM convite opcional com o texto exato, sem duplicação
    const optionalInvites = synthesis.questionsForSession.filter(
      (q) =>
        q.value ===
        'Se quiser, você pode conversar com Daiane sobre as respostas em que marcou dúvida ou preferiu não responder.',
    )
    expect(optionalInvites).toHaveLength(1)

    // (c) nenhum ponto "A interagente não soube identificar" gerado pelos dados atuais
    const genericUnknowns = synthesis.questionsForSession.filter(
      (q) => q.value === 'A interagente não soube identificar.',
    )
    expect(genericUnknowns).toHaveLength(0)

    const genericRefusals = synthesis.questionsForSession.filter(
      (q) => q.value === 'A interagente preferiu não responder.',
    )
    expect(genericRefusals).toHaveLength(0)

    // (d) caso sem nenhuma dúvida/recusa nos dados atuais → nenhum convite
    const cleanCase = [
      response(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
        value: {
          area_key: 'hunger',
          current_states: ['regular_hours'],
          comparison: 'different',
          duration: 'last_week',
          frequency: 'several_days',
          contexts: ['routine'],
        },
      }),
      response(AYV_C3_PROMPTS.CURRENT_SLEEP.key, {
        value: {
          area_key: 'sleep',
          current_states: ['light_wakes_easy'],
          comparison: 'same_as_usual',
        },
      }),
    ]
    const cleanSynthesis = buildChapter4Synthesis(cleanCase)
    expect(
      cleanSynthesis.questionsForSession.some(
        (q) =>
          q.value ===
          'Se quiser, você pode conversar com Daiane sobre as respostas em que marcou dúvida ou preferiu não responder.',
      ),
    ).toBe(false)

    // (e) caso legado sem chaves ayv_c3_current_* → pontos legados inalterados e nenhum convite novo
    const legacyCase = [
      response(
        AYV_C1_PROMPTS.P1_STRUCTURE.key,
        { value: 'dont_know', metadata: { explicit_unsure: true } },
        1,
      ),
      response(AYV_C1_PROMPTS.CHAPTER_COMPLETION.key, { completed: true }, 1),
    ]
    const legacySynthesis = buildChapter4Synthesis(legacyCase)
    expect(legacySynthesis.questionsForSession).toContainEqual({
      title: 'Estrutura corporal habitual',
      value: 'A interagente não soube identificar.',
    })
    expect(
      legacySynthesis.questionsForSession.some(
        (q) =>
          q.value ===
          'Se quiser, você pode conversar com Daiane sobre as respostas em que marcou dúvida ou preferiu não responder.',
      ),
    ).toBe(false)

    // (f) detalhes obsoletos de comparação não-different não geram convite nem ponto
    // Exemplo: comparison é 'same_as_usual', mas duration/frequency ficaram preenchidos com refusal/dont_know
    const obsoleteDetailsCase = [
      response(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
        value: {
          area_key: 'hunger',
          current_states: ['regular_hours'],
          comparison: 'same_as_usual',
          duration: 'refusal',
          frequency: 'dont_know',
          contexts: ['routine'],
        },
      }),
    ]
    const obsoleteSynthesis = buildChapter4Synthesis(obsoleteDetailsCase)
    expect(
      obsoleteSynthesis.questionsForSession.some(
        (q) =>
          q.value ===
          'Se quiser, você pode conversar com Daiane sobre as respostas em que marcou dúvida ou preferiu não responder.',
      ),
    ).toBe(false)
    expect(obsoleteSynthesis.questionsForSession).toHaveLength(0)
  })
})
