import pb from '@/lib/pocketbase/client'
import {
  CANONICAL_REFLECTION_PROMPTS,
  type CerPracticeReflectionRecord,
  type ReflectionTarget,
  type ReflectionVisibility,
} from '@/types/cer'

export interface SaveReflectionInput {
  assignment_id: string
  practice_version_id: string
  participant_user_id: string
  enrollment_id: string
  reflection_target: ReflectionTarget
  reflection_text?: string
  prefer_not_to_answer?: boolean
  visibility?: ReflectionVisibility
  previous_reflection_id?: string
}

export interface ReflectionSubmissionBatch {
  assignment_id: string
  practice_version_id: string
  participant_user_id: string
  enrollment_id: string
  corpo?: {
    text?: string
    preferNotToAnswer?: boolean
    visibility?: ReflectionVisibility
  }
  mente?: {
    text?: string
    preferNotToAnswer?: boolean
    visibility?: ReflectionVisibility
  }
  emocao?: {
    text?: string
    preferNotToAnswer?: boolean
    visibility?: ReflectionVisibility
  }
}

/**
 * Validação pura de ausência de nota de adesão, inferência causal ou diagnóstica
 */
export function validateReflectionNonJudgemental(
  reflection: Partial<CerPracticeReflectionRecord>,
): {
  isClean: boolean
  violations: string[]
} {
  const violations: string[] = []

  // Não pode ter nota de adesão ou pontuação
  if (
    'adherence_score' in reflection ||
    'score' in reflection ||
    'compliance_grade' in reflection
  ) {
    violations.push('Reflexão não permite nota de adesão, pontuação ou grade de compliance.')
  }

  // Não pode ter diagnóstico ou classificação automática
  if (
    'diagnosis' in reflection ||
    'sentiment_classification' in reflection ||
    'clinical_label' in reflection
  ) {
    violations.push('Reflexão proíbe classificação automática, diagnóstico ou inferência clínica.')
  }

  return {
    isClean: violations.length === 0,
    violations,
  }
}

export const cerPracticeReflectionService = {
  async listByAssignment(assignmentId: string): Promise<CerPracticeReflectionRecord[]> {
    return await pb
      .collection('cer_practice_reflections')
      .getFullList<CerPracticeReflectionRecord>({
        filter: `assignment_id = "${assignmentId}" && record_status = "current"`,
        sort: '-created',
        expand: 'practice_version_id,assignment_id',
      })
  },

  async recordSingleReflection(input: SaveReflectionInput): Promise<CerPracticeReflectionRecord> {
    const questionPrompt = CANONICAL_REFLECTION_PROMPTS[input.reflection_target]
    const visibility = input.visibility || 'participant_private'

    return await pb.collection('cer_practice_reflections').create<CerPracticeReflectionRecord>({
      assignment_id: input.assignment_id,
      practice_version_id: input.practice_version_id,
      participant_user_id: input.participant_user_id,
      enrollment_id: input.enrollment_id,
      reflection_target: input.reflection_target,
      question_prompt: questionPrompt,
      reflection_text: input.reflection_text?.trim() || undefined,
      prefer_not_to_answer: input.prefer_not_to_answer ?? false,
      visibility,
      record_status: 'current',
      previous_reflection_id: input.previous_reflection_id,
    })
  },

  /**
   * Salva as 3 reflexões de forma independente e tolerante a omissões.
   * O participante pode responder 0, 1, 2 ou 3 perguntas.
   */
  async recordBatchReflections(
    batch: ReflectionSubmissionBatch,
  ): Promise<CerPracticeReflectionRecord[]> {
    const saved: CerPracticeReflectionRecord[] = []
    const targets: ReflectionTarget[] = ['corpo', 'mente', 'emocao']

    for (const target of targets) {
      const data = batch[target]
      if (!data) continue

      const hasText = data.text !== undefined && data.text.trim().length > 0
      const preferNot = data.preferNotToAnswer === true

      // Salva se houver texto ou se o participante explicitamente marcou "prefiro não responder"
      if (hasText || preferNot) {
        const rec = await this.recordSingleReflection({
          assignment_id: batch.assignment_id,
          practice_version_id: batch.practice_version_id,
          participant_user_id: batch.participant_user_id,
          enrollment_id: batch.enrollment_id,
          reflection_target: target,
          reflection_text: hasText ? data.text?.trim() : undefined,
          prefer_not_to_answer: preferNot,
          visibility: data.visibility || 'participant_private',
        })
        saved.push(rec)
      }
    }

    return saved
  },
}
