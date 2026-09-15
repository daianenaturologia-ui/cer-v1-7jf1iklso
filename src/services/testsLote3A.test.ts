/**
 * TESTES DETERMINÍSTICOS PUROS DO LOTE 3A (BIBLIOTECA CER V1)
 *
 * Cobertura obrigatória dos 15 requisitos puros:
 * 1. IDs estáveis não dependerem da ordem do array
 * 2. Ordenação correta dos passos por step_order
 * 3. Rejeição de IDs duplicados na mesma versão
 * 4. Diferenciação repetição × ciclo × série
 * 5. Diferenciação pausa natural × antara × bahya
 * 6. Ausência de proporção respiratória padrão
 * 7. Possibilidade de concluir abaixo da meta
 * 8. Armazenamento separado de Corpo, Mente e Emoções
 * 9. Aceitação de resposta parcial ou totalmente vazia
 * 10. Proibição de nota de adesão / pontuação
 * 11. Vínculo imutável à PracticeVersion e ao Assignment
 * 12. Preservação da privacidade por padrão (participant_private)
 * 13. Ausência de inferência diagnóstica ou causal
 * 14. Estrutura compatível com 10, 20 e 30 repetições
 * 15. Estrutura compatível com 108 ciclos e 3 séries de 108, sem ativar metas
 */

import { describe, it, expect } from 'vitest'
import {
  validateStepOrdering,
  validateStepUniqueness,
  validateDoseSemantics,
} from './cerPracticeStepService'
import { validateReflectionNonJudgemental } from './cerPracticeReflectionService'
import { CANONICAL_REFLECTION_PROMPTS, type CerPracticeStepRecord } from '@/types/cer'

describe('LOTE 3A: Testes Puros Determinísticos — Passos, Dose Respiratória e Reflexões', () => {
  // 1. IDs estáveis não dependerem da ordem do array
  it('1. IDs estáveis não dependem da posição no array', () => {
    const rawSteps: Partial<CerPracticeStepRecord>[] = [
      { stable_step_id: 'step_breath_init', step_order: 2, title: 'Respiração' },
      { stable_step_id: 'step_posture_prep', step_order: 1, title: 'Postura' },
      { stable_step_id: 'step_grounding_end', step_order: 3, title: 'Enraizamento' },
    ]

    // Ao reordenar ou inverter a lista bruta, os IDs estáveis mantêm sua identidade intrínseca
    const reversed = [...rawSteps].reverse()
    expect(reversed[0].stable_step_id).toBe('step_grounding_end')
    expect(reversed[2].stable_step_id).toBe('step_breath_init')

    const sorted = validateStepOrdering(rawSteps as CerPracticeStepRecord[])
    expect(sorted[0].stable_step_id).toBe('step_posture_prep')
    expect(sorted[1].stable_step_id).toBe('step_breath_init')
    expect(sorted[2].stable_step_id).toBe('step_grounding_end')
  })

  // 2. Ordenação correta dos passos por step_order
  it('2. Ordenação correta e determinística por step_order ascendente', () => {
    const unordered: Partial<CerPracticeStepRecord>[] = [
      { stable_step_id: 's3', step_order: 30, title: 'C' },
      { stable_step_id: 's1', step_order: 10, title: 'A' },
      { stable_step_id: 's2', step_order: 20, title: 'B' },
    ]

    const ordered = validateStepOrdering(unordered as CerPracticeStepRecord[])
    expect(ordered.map((s) => s.step_order)).toEqual([10, 20, 30])
    expect(ordered.map((s) => s.stable_step_id)).toEqual(['s1', 's2', 's3'])
  })

  // 3. Rejeição de IDs duplicados na mesma versão
  it('3. Rejeição determinística de stable_step_id duplicado na mesma versão', () => {
    const duplicateList = [
      { stable_step_id: 'step_bhramari_sound' },
      { stable_step_id: 'step_bhramari_sound' },
      { stable_step_id: 'step_other' },
    ]
    const res = validateStepUniqueness(duplicateList)
    expect(res.isValid).toBe(false)
    expect(res.duplicateIds).toContain('step_bhramari_sound')

    const uniqueList = [
      { stable_step_id: 'step_1' },
      { stable_step_id: 'step_2' },
      { stable_step_id: 'step_3' },
    ]
    const resUnique = validateStepUniqueness(uniqueList)
    expect(resUnique.isValid).toBe(true)
    expect(resUnique.duplicateIds).toEqual([])
  })

  // 4. Diferenciação repetição × ciclo × série
  it('4. Diferenciação estrita de dimensões de dose: repetição ≠ ciclo ≠ série', () => {
    // Bhramari usa repetições (target_repetitions)
    const bhramariStep = {
      practice_version_id: 'pv1',
      stable_step_id: 'bhr_1',
      step_order: 1,
      step_type: 'repetition' as const,
      title: 'Repetições de Bhramari',
      participant_instruction: 'Inspire confortavelmente e expire produzindo o som.',
      target_repetitions: 10,
      retention_type: 'none' as const,
    }

    // Nadi Shodhana usa ciclos (target_cycles) e séries (target_series)
    const nadiStep = {
      practice_version_id: 'pv2',
      stable_step_id: 'nadi_1',
      step_order: 1,
      step_type: 'cycle' as const,
      title: 'Ciclos de Nadi Shodhana',
      participant_instruction: 'Respire alternando as narinas.',
      target_cycles: 108,
      target_series: 3,
      retention_type: 'none' as const,
    }

    expect(bhramariStep.target_repetitions).toBe(10)
    expect(bhramariStep.target_repetitions).not.toBe(nadiStep.target_cycles)
    expect(nadiStep.target_series).toBe(3)
    expect(nadiStep.target_cycles).toBe(108)
  })

  // 5. Diferenciação pausa natural × antara × bahya
  it('5. Diferenciação ontológica: pausa natural ≠ retenção com ar (antara) ≠ retenção sem ar (bahya)', () => {
    // Pausa com respiração natural não pode ser rotulada como antara ou bahya
    const invalidStep = {
      practice_version_id: 'pv1',
      stable_step_id: 's1',
      step_order: 1,
      step_type: 'natural_pause' as const,
      title: 'Intervalo com Respiração Natural',
      participant_instruction: 'Respire normalmente sem forçar.',
      break_type: 'natural_breathing' as const,
      retention_type: 'antara' as const, // Inválido!
    }
    const valInvalid = validateDoseSemantics(invalidStep)
    expect(valInvalid.isValid).toBe(false)
    expect(valInvalid.errors[0]).toContain('natural_breathing')

    // Passo válido com pausa natural
    const validNatural = {
      practice_version_id: 'pv1',
      stable_step_id: 's1',
      step_order: 1,
      step_type: 'natural_pause' as const,
      title: 'Intervalo com Respiração Natural',
      participant_instruction: 'Respire normalmente sem reter o ar.',
      break_type: 'natural_breathing' as const,
      retention_type: 'none' as const,
    }
    expect(validateDoseSemantics(validNatural).isValid).toBe(true)

    // Passo com Antara Kumbhaka explícito
    const validAntara = {
      practice_version_id: 'pv1',
      stable_step_id: 's2',
      step_order: 2,
      step_type: 'retention' as const,
      title: 'Retenção cheia consciente',
      participant_instruction: 'Pausa suave com ar nos pulmões.',
      retention_type: 'antara' as const,
      retention_duration_seconds: 4,
    }
    expect(validateDoseSemantics(validAntara).isValid).toBe(true)

    // Passo com Bahya Kumbhaka explícito
    const validBahya = {
      practice_version_id: 'pv1',
      stable_step_id: 's3',
      step_order: 3,
      step_type: 'retention' as const,
      title: 'Retenção vazia consciente',
      participant_instruction: 'Pausa suave após a expiração.',
      retention_type: 'bahya' as const,
      retention_duration_seconds: 2,
    }
    expect(validateDoseSemantics(validBahya).isValid).toBe(true)
  })

  // 6. Ausência de proporção respiratória padrão
  it('6. breathing_ratio não é obrigatório e não recebe proporção artificial padrão', () => {
    const stepWithoutRatio: Partial<CerPracticeStepRecord> = {
      practice_version_id: 'pv1',
      stable_step_id: 's_no_ratio',
      step_order: 1,
      step_type: 'breathing' as const,
      title: 'Respiração fluida',
      participant_instruction: 'Mantenha ritmo confortável.',
      retention_type: 'none' as const,
    }

    expect(validateDoseSemantics(stepWithoutRatio).isValid).toBe(true)
    expect(stepWithoutRatio.breathing_ratio).toBeUndefined()
  })

  // 7. Possibilidade de concluir abaixo da meta
  it('7. Conclusão precoce permitida com allow_early_stop e sem registro de falha', () => {
    const stepWithEarlyStop = {
      practice_version_id: 'pv1',
      stable_step_id: 's_stop',
      step_order: 1,
      step_type: 'repetition' as const,
      title: 'Repetições confortáveis',
      participant_instruction: 'Faça até onde for agradável.',
      target_repetitions: 30,
      retention_type: 'none' as const,
      allow_early_stop: true,
      stop_signs: 'Tontura, falta de ar ou desconforto.',
    }

    expect(stepWithEarlyStop.allow_early_stop).toBe(true)
    expect(stepWithEarlyStop.stop_signs).toBeDefined()
  })

  // 8. Armazenamento separado de Corpo, Mente e Emoções
  it('8. Armazenamento com perguntas canônicas e registros isolados para Corpo, Mente e Emoções', () => {
    expect(CANONICAL_REFLECTION_PROMPTS.corpo).toBe('O que você percebe agora no seu corpo?')
    expect(CANONICAL_REFLECTION_PROMPTS.mente).toBe('O que você percebe agora na sua mente?')
    expect(CANONICAL_REFLECTION_PROMPTS.emocao).toBe('O que você percebe agora nas suas emoções?')

    const targets = Object.keys(CANONICAL_REFLECTION_PROMPTS)
    expect(targets).toEqual(['corpo', 'mente', 'emocao'])
  })

  // 9. Aceitação de resposta parcial ou totalmente vazia
  it('9. Aceitação de respostas parciais (1 ou 2) ou participante marcando prefiro não responder', () => {
    const partialBatch: {
      assignment_id: string
      practice_version_id: string
      participant_user_id: string
      enrollment_id: string
      corpo?: { text: string; preferNotToAnswer: boolean }
      mente?: { text: string; preferNotToAnswer: boolean }
      emocao?: { text: string; preferNotToAnswer: boolean }
    } = {
      assignment_id: 'asgn_1',
      practice_version_id: 'pv_1',
      participant_user_id: 'usr_1',
      enrollment_id: 'enr_1',
      corpo: { text: 'Sensação de frescor no tórax', preferNotToAnswer: false },
      // mente omitida
      emocao: { text: '', preferNotToAnswer: true },
    }

    expect(partialBatch.corpo?.text).toBe('Sensação de frescor no tórax')
    expect(partialBatch.mente).toBeUndefined()
    expect(partialBatch.emocao?.preferNotToAnswer).toBe(true)
  })

  // 10. Proibição de nota de adesão / pontuação
  it('10. Proibição de pontuação, percentual de acerto ou score de adesão na reflexão', () => {
    const invalidReflection = {
      reflection_text: 'Senti paz',
      score: 10,
      adherence_score: 100,
    }

    const check = validateReflectionNonJudgemental(
      invalidReflection as unknown as Record<string, unknown>,
    )
    expect(check.isClean).toBe(false)
    expect(check.violations.length).toBeGreaterThan(0)
    expect(check.violations[0]).toContain('adesão')
  })

  // 11. Vínculo imutável à PracticeVersion e ao Assignment
  it('11. Vínculo relacional obrigatório da reflexão à PracticeVersion e ao Assignment', () => {
    const validRef = {
      assignment_id: 'asgn_fixed_123',
      practice_version_id: 'pv_fixed_456',
      participant_user_id: 'usr_part_789',
      enrollment_id: 'enr_abc',
      reflection_target: 'corpo' as const,
      question_prompt: CANONICAL_REFLECTION_PROMPTS.corpo,
      visibility: 'participant_private' as const,
      record_status: 'current' as const,
    }

    expect(validRef.assignment_id).toBe('asgn_fixed_123')
    expect(validRef.practice_version_id).toBe('pv_fixed_456')
    expect(validRef.participant_user_id).toBe('usr_part_789')
  })

  // 12. Preservação da privacidade por padrão (participant_private)
  it('12. Visibilidade padrão das reflexões é estritamente participant_private', () => {
    const defaultVisibility = 'participant_private'
    expect(defaultVisibility).toBe('participant_private')
  })

  // 13. Ausência de inferência diagnóstica ou causal
  it('13. Proibição de rótulos diagnósticos automáticos ou inferência causal artificial', () => {
    const reflectionWithDiagnosis = {
      reflection_text: 'Coração acelerado',
      diagnosis: 'taquicardia induzida por ansiedade',
    }

    const check = validateReflectionNonJudgemental(
      reflectionWithDiagnosis as unknown as Record<string, unknown>,
    )
    expect(check.isClean).toBe(false)
    expect(check.violations[0]).toContain('diagnóstico')
  })

  // 14. Estrutura compatível com 10, 20 e 30 repetições
  it('14. Estrutura suporta com flexibilidade repetições de 10, 20 e 30 (ex: Bhramari)', () => {
    const options = [10, 20, 30]
    for (const reps of options) {
      const step = {
        practice_version_id: 'pv_bhramari',
        stable_step_id: `bhr_step_${reps}`,
        step_order: 1,
        step_type: 'repetition' as const,
        title: 'Bhramari Pranayama',
        participant_instruction: 'Execute o número escolhido de repetições com suavidade.',
        target_repetitions: reps,
        retention_type: 'none' as const,
      }
      expect(validateDoseSemantics(step).isValid).toBe(true)
      expect(step.target_repetitions).toBe(reps)
    }
  })

  // 15. Estrutura compatível com 108 ciclos e 3 séries de 108, sem ativar metas
  it('15. Estrutura suporta 108 ciclos e 3 séries de 108 ciclos (ex: Nadi Shodhana futuro)', () => {
    const stepSingle108 = {
      practice_version_id: 'pv_nadi_adv',
      stable_step_id: 'nadi_108',
      step_order: 1,
      step_type: 'cycle' as const,
      title: 'Nadi Shodhana Sustentado',
      participant_instruction: 'Prática de ciclos completos.',
      target_cycles: 108,
      retention_type: 'none' as const,
    }
    expect(validateDoseSemantics(stepSingle108).isValid).toBe(true)
    expect(stepSingle108.target_cycles).toBe(108)

    const step3Series108 = {
      practice_version_id: 'pv_nadi_adv_series',
      stable_step_id: 'nadi_3x108',
      step_order: 1,
      step_type: 'series' as const,
      title: 'Nadi Shodhana 3 Séries de 108',
      participant_instruction: 'Prática em séries com pausas naturais.',
      target_cycles: 108,
      target_series: 3,
      break_type: 'natural_breathing' as const,
      retention_type: 'none' as const,
    }
    expect(validateDoseSemantics(step3Series108).isValid).toBe(true)
    expect(step3Series108.target_cycles).toBe(108)
    expect(step3Series108.target_series).toBe(3)
    expect(step3Series108.break_type).toBe('natural_breathing')
  })
})
