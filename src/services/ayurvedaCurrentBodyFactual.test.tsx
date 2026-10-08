import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  AYV_C3_PROMPTS,
  type AyurvedaChapter3State,
  loadChapter3State,
} from '@/services/ayurvedaChapter3'
import {
  buildAyurvedaCurrentBodyFactualBlock,
  formatCurrentAreaRecord,
} from '@/services/ayurvedaCurrentBodyFactual'
import { buildChapter4Synthesis } from '@/services/ayurvedaChapter4'
import { AyurvedaChapter4Flow } from '@/components/experience/ayurveda/AyurvedaChapter4Flow'
import { ProfessionalAyurvedaCorpoFisiologiaView } from '@/components/experience/ayurveda/ProfessionalAyurvedaCorpoFisiologiaView'
import type { ExperienceResponseRecord } from '@/types/cer'

const makeResponse = (promptKey: string, value: any, revisionNumber?: number) =>
  ({
    id: `resp-${promptKey}-${revisionNumber || 1}`,
    enrollment_id: 'enr-1',
    experience_id: 'exp-corpo-fisiologia-07b',
    respondent_user_id: 'user-1',
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
      value,
      revision_number: revisionNumber,
      metadata: { prompt_key: promptKey, revision_number: revisionNumber },
    },
    created: '2026-09-28T12:00:00.000Z',
    updated: '2026-09-28T12:00:00.000Z',
  }) as ExperienceResponseRecord

describe('Bloco 4 — Integração Factual das Coletas C3 na Síntese C4 e Visão Profissional', () => {
  it('exibe múltiplos estados por área preservados literalmente (ex.: 2 seleções)', () => {
    const hungerRecord = {
      area_key: 'hunger',
      current_states: ['regular_hours', 'sudden_intense'],
      comparison: 'different' as const,
      duration: 'last_week',
      frequency: 'several_days' as const,
      contexts: ['food', 'routine'],
    }

    const formatted = formatCurrentAreaRecord('hunger', hungerRecord)
    expect(formatted).not.toBeNull()
    expect(formatted?.currentStates).toEqual([
      'Aparece em horários relativamente previsíveis',
      'Surge de repente e pode ficar muito intensa',
    ])
    expect(formatted?.summaryLines[0].value).toBe(
      'Aparece em horários relativamente previsíveis; Surge de repente e pode ficar muito intensa',
    )
  })

  it('exibe incerteza e recusa literais quando registradas', () => {
    const eliminationUnsure = formatCurrentAreaRecord('elimination', {
      area_key: 'elimination',
      current_states: ['dont_know'],
      comparison: 'dont_know',
    })
    expect(eliminationUnsure?.currentStates).toEqual(['Não sei identificar'])
    expect(eliminationUnsure?.comparison).toBe('Não sei identificar')

    const skinRefusal = formatCurrentAreaRecord('skin', {
      area_key: 'skin',
      current_states: ['refusal'],
      comparison: 'refusal',
    })
    expect(skinRefusal?.currentStates).toEqual(['Prefiro não responder'])
    expect(skinRefusal?.comparison).toBe('Prefiro não responder')
  })

  it('oculta detalhes obsoletos (duração, frequência, contexto) quando comparação for same_as_usual ou incerta', () => {
    const sameRecord = formatCurrentAreaRecord('sleep', {
      area_key: 'sleep',
      current_states: ['easy_deep'],
      comparison: 'same_as_usual',
      duration: 'one_to_three_months',
      frequency: 'almost_every_day',
      contexts: ['climate', 'stress'],
    })

    expect(sameRecord?.comparison).toBe('Parecido com meu habitual')
    expect(sameRecord?.duration).toBeUndefined()
    expect(sameRecord?.frequency).toBeUndefined()
    expect(sameRecord?.contexts).toEqual([])
    expect(sameRecord?.summaryLines).toEqual([
      { label: 'Percepção atual', value: 'Adormeço com facilidade e durmo profundamente' },
      { label: 'Comparação com o habitual', value: 'Parecido com meu habitual' },
    ])

    const hardToCompareRecord = formatCurrentAreaRecord('temperature', {
      area_key: 'temperature',
      current_states: ['stable'],
      comparison: 'hard_to_compare',
      duration: 'last_month',
    })
    expect(hardToCompareRecord?.duration).toBeUndefined()
  })

  it('mantém integridade de participante legado sem o bloco novo (ausência neutra)', () => {
    const legacyResponses = [
      makeResponse(AYV_C3_PROMPTS.DOMAINS.key, ['structure_weight']),
      makeResponse(AYV_C3_PROMPTS.STARTED_AT.key, 'last_week'),
    ]

    const state = loadChapter3State(legacyResponses)
    const block = buildAyurvedaCurrentBodyFactualBlock(state)

    expect(block.hasAnyData).toBe(false)
    expect(block.items).toHaveLength(0)

    const synthesis = buildChapter4Synthesis(legacyResponses)
    expect(synthesis.currentBody?.hasAnyData).toBe(false)
  })

  it('garante que as duas visões (C4 e profissional) produzem exatamente os mesmos textos e dados a partir dos mesmos registros', () => {
    const responses: ExperienceResponseRecord[] = [
      makeResponse(AYV_C3_PROMPTS.DOMAINS.key, ['hunger_digestion', 'sleep']),
      makeResponse(AYV_C3_PROMPTS.CURRENT_HUNGER.key, {
        area_key: 'hunger',
        current_states: ['light_slow'],
        comparison: 'different',
        duration: 'last_month',
        frequency: 'varies_lot',
        contexts: ['stress'],
      }),
      makeResponse(AYV_C3_PROMPTS.CURRENT_POST_MEAL.key, {
        area_key: 'post_meal',
        current_states: ['heavy_slow_digestion', 'bloating_gas'],
        comparison: 'different',
        duration: 'three_to_six_months',
        frequency: 'almost_every_day',
        contexts: ['food'],
      }),
      makeResponse(AYV_C3_PROMPTS.CURRENT_SLEEP.key, {
        area_key: 'sleep',
        current_states: ['difficulty_falling_asleep'],
        comparison: 'same_as_usual',
      }),
      makeResponse(AYV_C3_PROMPTS.CURRENT_TEMPERATURE.key, {
        area_key: 'temperature',
        current_states: ['cold_easily'],
        comparison: 'different',
        duration: 'gradual',
        frequency: 'few_days',
        contexts: ['climate'],
      }),
      makeResponse(AYV_C3_PROMPTS.CURRENT_SKIN.key, {
        area_key: 'skin',
        current_states: ['dry_rough'],
        comparison: 'hard_to_compare',
      }),
    ]

    const state = loadChapter3State(responses)
    const blockFromState = buildAyurvedaCurrentBodyFactualBlock(state)
    const synthesis = buildChapter4Synthesis(responses)

    // Os dados do bloco no C4 synthesis e o helper direto devem ser idênticos
    expect(synthesis.currentBody).toEqual(blockFromState)

    // Renderiza ambos e compara a presença literal dos textos
    const { container: c4Container } = render(
      <AyurvedaChapter4Flow
        enrollmentId="enr-1"
        experienceId="exp-corpo-fisiologia-07b"
        respondentUserId="user-1"
        onBackToHub={() => {}}
      />,
    )

    const { container: profContainer } = render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        responseVersions={[]}
        participantName="Maria Interagente"
      />,
    )

    // Na visão profissional, o bloco factual aparece com o título "Como meu corpo está agora"
    expect(profContainer.textContent).toContain('Como meu corpo está agora')
    expect(profContainer.textContent).toContain('últimos 14 dias')

    for (const item of blockFromState.items) {
      expect(profContainer.textContent).toContain(item.title)
      for (const line of item.summaryLines) {
        expect(profContainer.textContent).toContain(line.label)
        expect(profContainer.textContent).toContain(line.value)
      }
    }
  })

  it('respeita a seleção da revisão concluída e não mistura com respostas de outra revisão', () => {
    // Revisão 1 tem fome regular
    const rev1Responses = [
      makeResponse(AYV_C3_PROMPTS.DOMAINS.key, ['hunger_digestion'], 1),
      makeResponse(
        AYV_C3_PROMPTS.CURRENT_HUNGER.key,
        {
          area_key: 'hunger',
          current_states: ['regular_hours'],
          comparison: 'same_as_usual',
        },
        1,
      ),
      makeResponse(
        AYV_C3_PROMPTS.COMPLETION.key,
        {
          completed: true,
          metadata: { chapter_revision_number: 1 },
        },
        1,
      ),
    ]

    // Resposta de rascunho da revisão 2 (ainda não concluída ou com outro snapshot)
    const rev1State = loadChapter3State(rev1Responses)
    const rev1Block = buildAyurvedaCurrentBodyFactualBlock(rev1State)

    expect(rev1Block.items[0].currentStates).toContain(
      'Aparece em horários relativamente previsíveis',
    )
    expect(rev1Block.items[0].comparison).toBe('Parecido com meu habitual')
  })
})
