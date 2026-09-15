import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeStepRecord,
  PracticeRetentionType,
  PracticeStepType,
  PracticeBreakType,
} from '@/types/cer'

export interface CreatePracticeStepInput {
  practice_version_id: string
  stable_step_id: string
  step_order: number
  step_type: PracticeStepType
  title: string
  participant_instruction: string
  professional_note?: string
  duration_seconds?: number
  target_repetitions?: number
  target_cycles?: number
  target_series?: number
  rest_seconds?: number
  break_type?: PracticeBreakType
  retention_type: PracticeRetentionType
  retention_duration_seconds?: number
  breathing_ratio?: string
  allow_early_stop?: boolean
  stop_signs?: string
  grounding_instruction?: string
  is_optional?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Funções puras de validação estrutural do Lote 3A
 * Garantem determinismo e conformidade antes de qualquer envio ao backend.
 */
export function validateStepOrdering(steps: CerPracticeStepRecord[]): CerPracticeStepRecord[] {
  return [...steps].sort((a, b) => a.step_order - b.step_order)
}

export function validateStepUniqueness(steps: Array<{ stable_step_id: string }>): {
  isValid: boolean
  duplicateIds: string[]
} {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const step of steps) {
    const id = step.stable_step_id?.trim()
    if (!id) continue
    if (seen.has(id)) {
      duplicates.add(id)
    } else {
      seen.add(id)
    }
  }

  return {
    isValid: duplicates.size === 0,
    duplicateIds: Array.from(duplicates),
  }
}

/**
 * Validação semântica e inequívoca da dose
 * Distingue estritamente repetição, ciclo, série, duração, pausa natural e retenção.
 */
export function validateDoseSemantics(step: Partial<CreatePracticeStepInput>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Retenção respiratória é obrigatória e explícita: 'none', 'antara' ou 'bahya'
  if (!step.retention_type || !['none', 'antara', 'bahya'].includes(step.retention_type)) {
    errors.push('retention_type deve ser explicitamente "none", "antara" ou "bahya".')
  }

  // Se retention_type === 'none', retention_duration_seconds deve ser 0 ou ausente
  if (
    step.retention_type === 'none' &&
    step.retention_duration_seconds &&
    step.retention_duration_seconds > 0
  ) {
    errors.push('Retenção "none" não pode ter retention_duration_seconds maior que zero.')
  }

  // Pausa com respiração natural NÃO é retenção
  if (
    step.break_type === 'natural_breathing' &&
    (step.retention_type === 'antara' || step.retention_type === 'bahya')
  ) {
    errors.push(
      'Pausa com respiração natural (natural_breathing) não pode ser classificada como retenção (antara/bahya).',
    )
  }

  // breathing_ratio não deve ser atribuído compulsoriamente
  if (step.breathing_ratio !== undefined && step.breathing_ratio.trim() === '') {
    errors.push(
      'breathing_ratio não deve receber valor vazio padrão; omita o campo se não houver proporção prescrita.',
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const cerPracticeStepService = {
  async listByPracticeVersion(practiceVersionId: string): Promise<CerPracticeStepRecord[]> {
    const rawSteps = await pb.collection('cer_practice_steps').getFullList<CerPracticeStepRecord>({
      filter: `practice_version_id = "${practiceVersionId}"`,
      sort: 'step_order',
    })
    return validateStepOrdering(rawSteps)
  },

  async createStep(input: CreatePracticeStepInput): Promise<CerPracticeStepRecord> {
    const doseValidation = validateDoseSemantics(input)
    if (!doseValidation.isValid) {
      throw new Error(`Validação de dose violada: ${doseValidation.errors.join('; ')}`)
    }

    return await pb.collection('cer_practice_steps').create<CerPracticeStepRecord>({
      ...input,
      allow_early_stop: input.allow_early_stop ?? true,
      is_optional: input.is_optional ?? false,
    })
  },
}
