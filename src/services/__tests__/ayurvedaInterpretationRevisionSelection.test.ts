import { describe, it, expect } from 'vitest'
import { buildAyurvedaInterpretation } from '../ayurvedaInterpretationEngine'
import { AYV_C1_PROMPTS } from '../ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '../ayurvedaChapter2'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('MICROBLOCO 1B-a: Seleção Canônica de Revisões no Motor de Interpretação Ayurveda', () => {
  const enrollmentId = 'enr-test-123'
  const experienceId = 'exp-test-ayurveda'
  const respondentUserId = 'user-test-456'

  const makeRecord = (params: {
    id: string
    prompt_id: string
    prompt_key?: string
    revision_number: number
    structured_value: any
    created?: string
    updated?: string
  }): ExperienceResponseRecord => {
    return {
      id: params.id,
      enrollment_id: enrollmentId,
      experience_id: experienceId,
      prompt_id: params.prompt_id,
      prompt_key: params.prompt_key,
      respondent_user_id: respondentUserId,
      response_type: 'ChoiceCards',
      access_class: 'shared_care',
      structured_value: {
        ...params.structured_value,
        revision_number: params.revision_number,
        metadata: {
          prompt_key: params.prompt_key || params.prompt_id,
          revision_number: params.revision_number,
        },
      },
      free_text: '',
      prompt_version: 1,
      version: params.revision_number,
      status: 'saved',
      created: params.created || '2026-03-01T10:00:00.000Z',
      updated: params.updated || '2026-03-01T10:00:00.000Z',
    } as ExperienceResponseRecord
  }

  // 1. C1 rev1 concluída + C1 rev2 parcialmente respondida (sem conclusão)
  // → o resultado usa SOMENTE as respostas da rev1 (respostas da rev2 não aparecem nas evidências).
  it('1. C1 rev1 concluída + C1 rev2 em rascunho: usa exclusivamente respostas da rev1', () => {
    const responses: ExperienceResponseRecord[] = [
      // Rev 1 - Estrutura Vata (slender) e Pele Vata (dry)
      makeRecord({
        id: 'c1-rev1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        id: 'c1-rev1-skin',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
        structured_value: { value: 'dry' },
      }),
      makeRecord({
        id: 'c1-rev1-completion',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
      }),

      // Rev 2 (rascunho parcial) - tenta sobrescrever estrutura com Kapha (broad), SEM conclusão da rev 2
      makeRecord({
        id: 'c1-rev2-struct',
        prompt_id: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
        structured_value: { value: 'broad' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.hasCompletedRevision).toBe(true)
    expect(result.activeRevisionNumber).toBe(1)
    // A estrutura corporal usada deve ser Vata (da rev1), NUNCA Kapha (da rev2 incompleta)
    expect(
      result.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(true)
    expect(
      result.prakritiHypothesis.evidencesKapha.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(false)
  })

  // 2. C2 rev2 concluída (com rev1 anterior concluída) → usa só rev2
  it('2. C2 rev2 concluída com rev1 anterior concluída: seleciona exclusivamente a rev2 mais recente', () => {
    const responses: ExperienceResponseRecord[] = [
      // Rev 1 concluída: Fome irregular (Vata)
      makeRecord({
        id: 'c2-rev1-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'irregular' },
      }),
      makeRecord({
        id: 'c2-rev1-completion',
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
      }),

      // Rev 2 concluída: Fome intensa (Pitta)
      makeRecord({
        id: 'c2-rev2-hunger',
        prompt_id: `${AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id}_rev2`,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 2,
        structured_value: { value: 'intense' },
      }),
      makeRecord({
        id: 'c2-rev2-completion',
        prompt_id: `${AYV_C2_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 2,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.hasCompletedRevision).toBe(true)
    expect(result.activeRevisionNumber).toBe(2)
    // Deve usar a evidência de Pitta da rev2 e não a de Vata da rev1
    expect(
      result.vikritiHypothesis.evidencesPitta.some((e) => e.category === 'Ritmo da fome'),
    ).toBe(true)
    expect(result.vikritiHypothesis.evidencesVata.some((e) => e.category === 'Ritmo da fome')).toBe(
      false,
    )
  })

  // 3. Mesmo conjunto de registros com ordem do array INVERTIDA → mesmo resultado determinístico
  it('3. Invariância à ordem dos registros: array invertido produz exatamente o mesmo resultado', () => {
    const setA: ExperienceResponseRecord[] = [
      makeRecord({
        id: 'c1-rev1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'slender' },
        created: '2026-03-01T10:00:00.000Z',
      }),
      makeRecord({
        id: 'c1-rev1-completion',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
        created: '2026-03-01T10:05:00.000Z',
      }),
      makeRecord({
        id: 'c2-rev1-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'intense' },
        created: '2026-03-01T10:10:00.000Z',
      }),
      makeRecord({
        id: 'c2-rev1-completion',
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
        created: '2026-03-01T10:15:00.000Z',
      }),
      makeRecord({
        id: 'c1-rev2-draft-struct',
        prompt_id: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
        structured_value: { value: 'broad' },
        created: '2026-03-02T10:00:00.000Z',
      }),
    ]

    const setB = [...setA].reverse()

    const resA = buildAyurvedaInterpretation(setA)
    const resB = buildAyurvedaInterpretation(setB)

    expect(resA).toEqual(resB)
  })

  // 4. C1 concluído + C2 apenas rascunho → não produz evidências/leitura de C2
  it('4. C1 concluído + C2 apenas rascunho: C2 não entra e não contamina o resultado', () => {
    const responses: ExperienceResponseRecord[] = [
      // C1 rev1 concluído
      makeRecord({
        id: 'c1-rev1-struct',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'slender' },
      }),
      makeRecord({
        id: 'c1-rev1-completion',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
      }),

      // C2 rascunho (sem completion)
      makeRecord({
        id: 'c2-draft-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'intense' },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.hasCompletedRevision).toBe(true)
    expect(result.activeRevisionNumber).toBe(1)
    // C1 tem evidência
    expect(
      result.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(true)
    // C2 NÃO deve ter gerado evidência alguma
    expect(
      result.vikritiHypothesis.evidencesPitta.some((e) => e.category === 'Ritmo da fome'),
    ).toBe(false)
  })

  // 5. C1 rev2 concluída + C2 rev1 concluída (números diferentes) → activeRevisionNumber omitido
  it('5. C1 rev2 concluída + C2 rev1 concluída: activeRevisionNumber é omitido e revisões operam de forma independente', () => {
    const responses: ExperienceResponseRecord[] = [
      // C1 rev2 concluída
      makeRecord({
        id: 'c1-rev2-struct',
        prompt_id: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
        structured_value: { value: 'broad' },
      }),
      makeRecord({
        id: 'c1-rev2-completion',
        prompt_id: `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 2,
        structured_value: { completed: true },
      }),

      // C2 rev1 concluída
      makeRecord({
        id: 'c2-rev1-hunger',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
        structured_value: { value: 'intense' },
      }),
      makeRecord({
        id: 'c2-rev1-completion',
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
      }),
    ]

    const result = buildAyurvedaInterpretation(responses)

    expect(result.hasCompletedRevision).toBe(true)
    // Como os números diferem (C1=2, C2=1), activeRevisionNumber DEVE ser omitido (undefined)
    expect(result.activeRevisionNumber).toBeUndefined()

    // C1 usa rev2 (Kapha)
    expect(
      result.prakritiHypothesis.evidencesKapha.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(true)
    // C2 usa rev1 (Pitta)
    expect(
      result.vikritiHypothesis.evidencesPitta.some((e) => e.category === 'Ritmo da fome'),
    ).toBe(true)
  })

  // 6. Duplicados da mesma revisão com timestamps/ordem diferentes → desempate determinístico
  it('6. Duplicados da mesma revisão em ordens diferentes produzem resultado idêntico', () => {
    const base: ExperienceResponseRecord[] = [
      makeRecord({
        id: 'c1-comp',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
        structured_value: { completed: true },
        created: '2026-03-01T12:00:00.000Z',
      }),
      // Registro mais antigo com resposta 'slender'
      makeRecord({
        id: 'c1-struct-1',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'slender' },
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      }),
      // Registro duplicado mais recente com resposta 'medium'
      makeRecord({
        id: 'c1-struct-2',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        structured_value: { value: 'medium' },
        created: '2026-03-01T11:00:00.000Z',
        updated: '2026-03-01T11:00:00.000Z',
      }),
    ]

    const inverted = [...base].reverse()

    const res1 = buildAyurvedaInterpretation(base)
    const res2 = buildAyurvedaInterpretation(inverted)

    expect(res1).toEqual(res2)
    // Em ambos, a resposta mais recente (medium -> Pitta) determinística vence
    expect(
      res1.prakritiHypothesis.evidencesPitta.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(true)
    expect(
      res1.prakritiHypothesis.evidencesVata.some((e) => e.category === 'Estrutura corporal'),
    ).toBe(false)
  })
})
