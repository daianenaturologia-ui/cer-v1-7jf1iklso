import { describe, expect, it } from 'vitest'
import { normalizeLiveResponse } from './liveQuestionnaire'
import { professionalQuestionnaireResponses } from './professionalQuestionnaireRead'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('identidade das respostas persistidas', () => {
  it('normaliza metadata sem perder IDs físicos ao normalizar novamente', () => {
    const source = {
      experience_id: 'physical-exp',
      prompt_id: 'physical-prompt',
      structured_value: {
        choice: 'warm_hot',
        metadata: { canonical_prompt_id: 'ayv_c1_drink_temperature' },
      },
    }
    const once = normalizeLiveResponse(source)
    expect(once.prompt_id).toBe('ayv_c1_drink_temperature')
    expect(once).toMatchObject({
      backend_prompt_id: 'physical-prompt',
      backend_experience_id: 'physical-exp',
    })
    expect(normalizeLiveResponse(once)).toEqual(once)
    expect(source.prompt_id).toBe('physical-prompt')
    expect(once.structured_value).toBe(source.structured_value)
  })

  it('resolve catálogo expandido quando a resposta antiga não tem metadata', () => {
    const source = {
      experience_id: 'physical-exp',
      prompt_id: 'physical-prompt',
      expand: {
        prompt_id: { schema_config: { cer_logical_prompt_id: 'ayv_c3_chapter_completion' } },
      },
    }
    expect(normalizeLiveResponse(source).prompt_id).toBe('ayv_c3_chapter_completion')
  })

  it('mantém os filtros de privacidade, matrícula e estado antes da leitura profissional', () => {
    const shared = {
      id: 'response',
      enrollment_id: 'test-enrollment',
      experience_id: 'physical-exp',
      prompt_id: 'physical-prompt',
      status: 'saved',
      access_class: 'shared_care',
      structured_value: {
        choice: 'warm_hot',
        metadata: { canonical_prompt_id: 'ayv_c1_drink_temperature' },
      },
    } as ExperienceResponseRecord
    const records = [
      shared,
      { ...shared, access_class: 'participant_private' },
      { ...shared, enrollment_id: 'another-enrollment' },
      { ...shared, status: 'draft' },
      {
        ...shared,
        structured_value: { private_text: 'private', share_private_text_with_professional: false },
      },
    ] as ExperienceResponseRecord[]
    const visible = professionalQuestionnaireResponses(records, 'test-enrollment')
    expect(visible).toHaveLength(1)
    expect(visible[0].prompt_id).toBe('ayv_c1_drink_temperature')
  })
})
