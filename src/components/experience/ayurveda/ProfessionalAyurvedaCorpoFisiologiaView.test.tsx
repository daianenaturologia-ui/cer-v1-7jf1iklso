// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import userEvent from '@testing-library/user-event'
import { ProfessionalAyurvedaCorpoFisiologiaView } from './ProfessionalAyurvedaCorpoFisiologiaView'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'
import type { ExperienceResponseRecord } from '@/types/cer'
import { demoAdapter } from '@/services/demoAdapter'
import pb from '@/lib/pocketbase/client'

describe('M4A — Visão Profissional Factual dos Capítulos 1 e 2 de Corpo & Fisiologia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    demoAdapter.enableDemo('daiane')
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  const createMockResp = (
    partial: Partial<ExperienceResponseRecord> & { id: string; prompt_id: string },
  ): ExperienceResponseRecord => ({
    enrollment_id: 'enr-mariana-01',
    experience_id: 'exp-corpo-fisiologia-07b',
    respondent_user_id: 'user-mariana',
    access_class: 'shared_care',
    response_type: 'ChoiceCards',
    prompt_version: 1,
    version: 1,
    status: 'saved',
    created: '2025-05-10T10:00:00.000Z',
    updated: '2025-05-10T10:00:00.000Z',
    structured_value: {},
    ...partial,
  })

  // Fixture completa de Capítulo 1 e Capítulo 2 concluídos (Revisão 1)
  const buildMockResponsesRev1 = (): ExperienceResponseRecord[] => [
    // Capítulo 1 - Respostas
    createMockResp({
      id: 'c1-p1',
      prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      structured_value: {
        value: 'light_narrow',
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 1,
        metadata: {
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          historical_confidence: 'high',
          stability: 'lifelong',
        },
      },
    }),
    createMockResp({
      id: 'c1-p1b',
      prompt_id: AYV_C1_PROMPTS.P1_DURATION.id,
      structured_value: {
        value: 'lifelong',
        prompt_key: AYV_C1_PROMPTS.P1_DURATION.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p2',
      prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
      response_type: 'MultiSelectCards',
      structured_value: {
        selectedOptionIds: ['dry_rough'],
        prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p3',
      prompt_id: AYV_C1_PROMPTS.P3_HAIR.id,
      response_type: 'MultiSelectCards',
      structured_value: {
        selectedOptionIds: ['fine_delicate'],
        prompt_key: AYV_C1_PROMPTS.P3_HAIR.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p4',
      prompt_id: AYV_C1_PROMPTS.P4_TEMPERATURE.id,
      structured_value: {
        value: 'cold_easily',
        prompt_key: AYV_C1_PROMPTS.P4_TEMPERATURE.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p5a',
      prompt_id: AYV_C1_PROMPTS.P5_THIRST.id,
      structured_value: {
        value: 'varies_late',
        prompt_key: AYV_C1_PROMPTS.P5_THIRST.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p5b',
      prompt_id: AYV_C1_PROMPTS.P5_DRINK_TEMP.id,
      structured_value: {
        value: 'warm_hot',
        prompt_key: AYV_C1_PROMPTS.P5_DRINK_TEMP.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-p5c',
      prompt_id: AYV_C1_PROMPTS.P5_SWEAT.id,
      structured_value: {
        value: 'sweats_little',
        prompt_key: AYV_C1_PROMPTS.P5_SWEAT.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c1-comp',
      prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
      structured_value: {
        completed: true,
        completed_at: '2025-05-10T10:08:00.000Z',
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
      },
    }),

    // Capítulo 2 - Respostas da Revisão 1
    createMockResp({
      id: 'c2-p1',
      prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:00:00.000Z',
      updated: '2025-05-11T10:00:00.000Z',
      structured_value: {
        selectedOptionIds: ['regular_hours'],
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p2',
      prompt_id: AYV_C2_PROMPTS.P2_DELAYED_MEAL.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:01:00.000Z',
      updated: '2025-05-11T10:01:00.000Z',
      structured_value: {
        selectedOptionIds: ['can_wait'],
        prompt_key: AYV_C2_PROMPTS.P2_DELAYED_MEAL.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p3',
      prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:02:00.000Z',
      updated: '2025-05-11T10:02:00.000Z',
      structured_value: {
        selectedOptionIds: ['light_satisfied'],
        prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p4',
      prompt_id: AYV_C2_PROMPTS.P4_HUNGER_RETURN.id,
      created: '2025-05-11T10:03:00.000Z',
      updated: '2025-05-11T10:03:00.000Z',
      structured_value: {
        value: 'regular_intervals',
        prompt_key: AYV_C2_PROMPTS.P4_HUNGER_RETURN.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p5',
      prompt_id: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:04:00.000Z',
      updated: '2025-05-11T10:04:00.000Z',
      structured_value: {
        selectedOptionIds: ['dairy'],
        prompt_key: AYV_C2_PROMPTS.P5_FOOD_DEMANDS.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p6',
      prompt_id: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.id,
      created: '2025-05-11T10:05:00.000Z',
      updated: '2025-05-11T10:05:00.000Z',
      structured_value: {
        value: 'daily_regular',
        prompt_key: AYV_C2_PROMPTS.P6_BOWEL_RHYTHM.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p7',
      prompt_id: AYV_C2_PROMPTS.P7_STOOL_PATTERN.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:06:00.000Z',
      updated: '2025-05-11T10:06:00.000Z',
      structured_value: {
        selectedOptionIds: ['formed_easy'],
        prompt_key: AYV_C2_PROMPTS.P7_STOOL_PATTERN.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p8',
      prompt_id: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id,
      response_type: 'MultiSelectCards',
      created: '2025-05-11T10:07:00.000Z',
      updated: '2025-05-11T10:07:00.000Z',
      structured_value: {
        selectedOptionIds: ['easy_deep'],
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p9',
      prompt_id: AYV_C2_PROMPTS.P9_WAKING.id,
      created: '2025-05-11T10:08:00.000Z',
      updated: '2025-05-11T10:08:00.000Z',
      structured_value: {
        value: 'rested_ready',
        prompt_key: AYV_C2_PROMPTS.P9_WAKING.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p10',
      prompt_id: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.id,
      created: '2025-05-11T10:09:00.000Z',
      updated: '2025-05-11T10:09:00.000Z',
      structured_value: {
        value: 'stable_throughout',
        prompt_key: AYV_C2_PROMPTS.P10_ENERGY_DISTRIBUTION.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p11',
      prompt_id: AYV_C2_PROMPTS.P11_BODY_PACE.id,
      created: '2025-05-11T10:10:00.000Z',
      updated: '2025-05-11T10:10:00.000Z',
      structured_value: {
        value: 'constant',
        prompt_key: AYV_C2_PROMPTS.P11_BODY_PACE.key,
        revision_number: 1,
      },
    }),
    createMockResp({
      id: 'c2-p12',
      prompt_id: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.id,
      created: '2025-05-11T10:11:00.000Z',
      updated: '2025-05-11T10:11:00.000Z',
      structured_value: {
        value: 'many_years',
        prompt_key: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
        revision_number: 1,
        metadata: {
          prompt_key: AYV_C2_PROMPTS.P12_HISTORICAL_CONFIDENCE.key,
          historical_confidence: 'high',
        },
      },
    }),
    createMockResp({
      id: 'c2-comp',
      prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
      created: '2025-05-11T10:12:00.000Z',
      updated: '2025-05-11T10:12:00.000Z',
      structured_value: {
        completed: true,
        completed_at: '2025-05-11T10:12:00.000Z',
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 1,
      },
    }),
  ]

  // Teste 1: Daiane abre Corpo & Fisiologia da interagente
  it('1. Daiane abre Corpo & Fisiologia com cabeçalho factual e nome da interagente', () => {
    const responses = buildMockResponsesRev1()
    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
        treatmentPreference="feminino"
      />,
    )

    expect(screen.getByRole('heading', { name: /Corpo & Fisiologia/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Mariana Souza/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Prefere linguagem no feminino/i)).toBeInTheDocument()
    expect(screen.getByText(/Última atualização factual/i)).toBeInTheDocument()
    expect(screen.getAllByText(/11\/05\/2025/i).length).toBeGreaterThan(0)
  })

  // Teste 2: Capítulos 1 e 2 aparecem separadamente
  it('2. Capítulos 1 e 2 aparecem separadamente com títulos humanos e sem IDs técnicos', () => {
    const responses = buildMockResponsesRev1()
    const { container } = render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    expect(
      screen.getByText(/Capítulo 1 — Minha estrutura e minhas características/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Capítulo 2 — O ritmo do meu corpo/i)).toBeInTheDocument()

    const text = container.textContent || ''
    expect(text).not.toContain('ayv_c1_')
    expect(text).not.toContain('ayv_c2_')
    expect(text).not.toContain('_rev1')
    expect(text).not.toContain('_rev2')
  })

  // Teste 3: Revisão concluída mais recente abre por padrão
  it('3. revisão concluída mais recente abre por padrão quando existem múltiplas revisões', () => {
    const responses = buildMockResponsesRev1()

    const rev2Resp = createMockResp({
      id: 'c1-p1-rev2',
      prompt_id: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
      version: 2,
      created: '2025-05-15T12:00:00.000Z',
      updated: '2025-05-15T12:00:00.000Z',
      structured_value: {
        value: 'broad_solid',
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
      },
    })
    const rev2Comp = createMockResp({
      id: 'c1-comp-rev2',
      prompt_id: `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
      version: 2,
      created: '2025-05-15T12:10:00.000Z',
      updated: '2025-05-15T12:10:00.000Z',
      structured_value: {
        completed: true,
        completed_at: '2025-05-15T12:10:00.000Z',
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 2,
      },
    })

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[...responses, rev2Resp, rev2Comp]}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Estrutura ampla ou sólida/i)).toBeInTheDocument()
    expect(screen.queryByText(/Estrutura leve ou estreita/i)).toBeNull()
  })

  // Teste 4: Revisão anterior pode ser selecionada
  it('4. revisão anterior pode ser selecionada e alterna as respostas exibidas', async () => {
    const user = userEvent.setup()
    const responses = buildMockResponsesRev1()

    const rev2Resp = createMockResp({
      id: 'c1-p1-rev2',
      prompt_id: `${AYV_C1_PROMPTS.P1_STRUCTURE.id}_rev2`,
      version: 2,
      created: '2025-05-15T12:00:00.000Z',
      updated: '2025-05-15T12:00:00.000Z',
      structured_value: {
        value: 'broad_solid',
        prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
        revision_number: 2,
      },
    })
    const rev2Comp = createMockResp({
      id: 'c1-comp-rev2',
      prompt_id: `${AYV_C1_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
      version: 2,
      created: '2025-05-15T12:10:00.000Z',
      updated: '2025-05-15T12:10:00.000Z',
      structured_value: {
        completed: true,
        completed_at: '2025-05-15T12:10:00.000Z',
        prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 2,
      },
    })

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[...responses, rev2Resp, rev2Comp]}
        participantName="Mariana Souza"
      />,
    )

    const rev1Btns = screen.getAllByRole('button', { name: /Revisão 1/i })
    await user.click(rev1Btns[0])

    expect(screen.getByText(/Estrutura leve ou estreita/i)).toBeInTheDocument()
    expect(screen.queryByText(/Estrutura ampla ou sólida/i)).toBeNull()
  })

  // Teste 5 e 6: Respostas de revisões diferentes nunca são combinadas; revisão anterior permanece intacta
  it('5 e 6. respostas de revisões diferentes nunca são combinadas e a revisão anterior permanece intacta', async () => {
    const user = userEvent.setup()
    const responses = buildMockResponsesRev1()

    const rev2C2Sleep = createMockResp({
      id: 'c2-p8-rev2',
      prompt_id: `${AYV_C2_PROMPTS.P8_SLEEP_PATTERN.id}_rev2`,
      response_type: 'MultiSelectCards',
      version: 2,
      created: '2025-05-16T10:00:00.000Z',
      updated: '2025-05-16T10:00:00.000Z',
      structured_value: {
        selectedOptionIds: ['light_wakes_easy'],
        prompt_key: AYV_C2_PROMPTS.P8_SLEEP_PATTERN.key,
        revision_number: 2,
      },
    })
    const rev2C2Comp = createMockResp({
      id: 'c2-comp-rev2',
      prompt_id: `${AYV_C2_PROMPTS.CHAPTER_COMPLETION.id}_rev2`,
      version: 2,
      created: '2025-05-16T10:05:00.000Z',
      updated: '2025-05-16T10:05:00.000Z',
      structured_value: {
        completed: true,
        completed_at: '2025-05-16T10:05:00.000Z',
        prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
        revision_number: 2,
      },
    })

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[...responses, rev2C2Sleep, rev2C2Comp]}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Meu sono é leve e acordo com facilidade/i)).toBeInTheDocument()
    expect(screen.queryByText(/Adormeço com facilidade e durmo profundamente/i)).toBeNull()

    const rev1Btns = screen.getAllByRole('button', { name: /Revisão 1/i })
    await user.click(rev1Btns[1])

    expect(screen.getByText(/Adormeço com facilidade e durmo profundamente/i)).toBeInTheDocument()
    expect(screen.queryByText(/Meu sono é leve e acordo com facilidade/i)).toBeNull()
  })

  // Teste 7 e 8: Correção ativa aparece separadamente como rascunho e não substitui a última concluída
  it('7 e 8. correção ativa aparece como rascunho com aviso discreto e mantém como referência a última concluída', async () => {
    const user = userEvent.setup()
    const responses = buildMockResponsesRev1()

    const draftResp = createMockResp({
      id: 'c2-p1-rev2-draft',
      prompt_id: `${AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id}_rev2`,
      response_type: 'MultiSelectCards',
      version: 2,
      created: '2025-05-18T14:00:00.000Z',
      updated: '2025-05-18T14:00:00.000Z',
      structured_value: {
        selectedOptionIds: ['sudden_intense'],
        prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
        revision_number: 2,
      },
    })

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[...responses, draftResp]}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Há uma correção em andamento\./i)).toBeInTheDocument()
    expect(screen.getByText(/Aparece em horários relativamente previsíveis/i)).toBeInTheDocument()
    expect(screen.queryByText(/Surge de repente e pode ficar muito intensa/i)).toBeNull()

    const draftBtn = screen.getByRole('button', { name: /Ver rascunho da correção/i })
    await user.click(draftBtn)

    expect(screen.getByText(/Rascunho da correção — ainda não concluído/i)).toBeInTheDocument()
    expect(screen.getByText(/Surge de repente e pode ficar muito intensa/i)).toBeInTheDocument()
  })

  // Teste 9: Respostas literais exibidas sem IDs técnicos
  it('9. exibe textos literais humanos em todos os grupos canônicos', () => {
    const responses = buildMockResponsesRev1()
    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    // Grupos do Capítulo 1
    expect(screen.getByText(/Estrutura corporal habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Pele habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Cabelo habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Temperatura corporal habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Sede habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Preferência de bebidas e temperatura/i)).toBeInTheDocument()
    expect(screen.getByText(/Transpiração habitual/i)).toBeInTheDocument()

    // Grupos do Capítulo 2
    expect(screen.getByText(/Como a fome costuma funcionar/i)).toBeInTheDocument()
    expect(screen.getByText(/Sensação após a refeição habitual/i)).toBeInTheDocument()
    expect(screen.getByText(/Ritmo e regularidade intestinal/i)).toBeInTheDocument()
    expect(screen.getByText(/Padrão habitual do sono/i)).toBeInTheDocument()
    expect(screen.getByText(/Distribuição da energia ao longo do dia/i)).toBeInTheDocument()
    expect(screen.getByText(/Representatividade temporal do padrão relatado/i)).toBeInTheDocument()
  })

  // Teste 10: "Não sei identificar", "Prefiro não responder" e ausência são distintos
  it('10. distingue visualmente e semanticamente "Não sei identificar", "Prefiro não responder" e "Ainda não respondido."', () => {
    const customResponses: ExperienceResponseRecord[] = [
      createMockResp({
        id: 'c1-p1-unsure',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        structured_value: {
          value: 'dont_know',
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          revision_number: 1,
          metadata: { explicit_unsure: true },
        },
      }),
      createMockResp({
        id: 'c1-p2-refusal',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        response_type: 'MultiSelectCards',
        structured_value: {
          selectedOptionIds: ['refusal'],
          prompt_key: AYV_C1_PROMPTS.P2_SKIN.key,
          revision_number: 1,
          metadata: { explicit_refusal: true },
        },
      }),
    ]

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={customResponses}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Não sei identificar\./i)).toBeInTheDocument()
    expect(screen.getByText(/Prefiro não responder\./i)).toBeInTheDocument()
    expect(screen.getAllByText(/Ainda não respondido\./i).length).toBeGreaterThan(0)

    expect(screen.getByText(/Dúvida registrada/i)).toBeInTheDocument()
    expect(screen.getByText(/Recusa explícita/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Pendente/i).length).toBeGreaterThan(0)
  })

  // Teste 11: Baixa confiança histórica só aparece se metadado já existir
  it('11. baixa confiança histórica aparece apenas quando registrada nos metadados ou opção específica', () => {
    const responses = buildMockResponsesRev1()
    responses[0].structured_value = {
      value: 'changed_lot',
      prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      revision_number: 1,
      metadata: { historical_confidence: 'low', contradiction_flag: true },
    }

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Atenção clínica \(Baixa confiança histórica\):/i)).toBeInTheDocument()
  })

  // Teste 12: Nenhuma interpretação de dosha, Prakriti, Vikriti, Agni ou Ama é renderizada
  it('12. separação epistêmica rigorosa: zero menções a Doshas, Prakriti, Vikriti, Agni ou Ama', () => {
    const responses = buildMockResponsesRev1()
    const { container } = render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    const text = container.textContent?.toLowerCase() || ''
    for (const technicalTerm of ['vata', 'pitta', 'kapha', 'prakriti', 'vikriti', 'agni', 'ama']) {
      expect(text).not.toMatch(new RegExp(`\\b${technicalTerm}\\b`))
    }
    expect(text).not.toContain('diagnóstico')
    expect(text).not.toContain('dosha predominante')

    expect(
      screen.getByText(
        /Esta área apresenta as respostas registradas pela interagente\. A interpretação profissional será construída separadamente\./i,
      ),
    ).toBeInTheDocument()
  })

  // Teste 13: Daiane não consegue alterar nenhuma resposta (somente leitura)
  it('13. tela estritamente somente-leitura: zero formulários de edição, botões de publicação ou gravação', () => {
    const responses = buildMockResponsesRev1()
    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('button', { name: /Publicar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Salvar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Concluir/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Alterar/i })).toBeNull()
  })

  // Teste 14: Zero chamadas ao PocketBase no modo demonstração
  it('14. modo demo permanece 100% local com zero chamadas ao PocketBase', () => {
    const pbSpy = vi.spyOn(pb, 'collection')
    expect(demoAdapter.isEnabled()).toBe(true)

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={buildMockResponsesRev1()}
        participantName="Mariana Souza"
      />,
    )

    expect(pbSpy).not.toHaveBeenCalled()
  })

  // Teste 15: Capítulos 1 e 2 da interagente, hub e versionamento permanecem intactos
  it('15. helper retrocompatível ProfessionalAyurvedaChapter1View renderiza a mesma visualização factual sem quebras', async () => {
    const { ProfessionalAyurvedaChapter1View } = await import('./ProfessionalAyurvedaChapter1View')
    render(
      <ProfessionalAyurvedaChapter1View
        responses={buildMockResponsesRev1()}
        participantName="Mariana Souza"
      />,
    )

    expect(
      screen.getByText(/Capítulo 1 — Minha estrutura e minhas características/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Capítulo 2 — O ritmo do meu corpo/i)).toBeInTheDocument()
  })

  // Teste 16: Participante diferente não consegue acessar os dados (isolamento de participante)
  it('16. lista de respostas é isolada por participante / enrollment', () => {
    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[]}
        participantName="Outro Participante"
      />,
    )

    expect(screen.getAllByText(/Esta interagente ainda não iniciou este capítulo\./i)).toHaveLength(
      3,
    )
  })

  // Teste 17: Estado vazio e falha de carregamento são seguros
  it('17. estado vazio e falha de carregamento com "Tentar novamente" funcionam com segurança', async () => {
    const user = userEvent.setup()
    const onRetryMock = vi.fn()

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[]}
        participantName="Mariana Souza"
        loadError={true}
        onRetryLoad={onRetryMock}
      />,
    )

    expect(screen.getByText(/Não foi possível carregar as respostas agora\./i)).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i })
    await user.click(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })

  // Teste 18: Interface não apresenta overflow estrutural em viewport estreito (360px)
  it('18. viewport estreito de 360px: cards flexíveis, classes responsivas e sem overflow estrutural', () => {
    const { container } = render(
      <div style={{ width: '360px' }}>
        <ProfessionalAyurvedaCorpoFisiologiaView
          responses={buildMockResponsesRev1()}
          participantName="Mariana Souza"
        />
      </div>,
    )

    expect(container.querySelector('.w-\\[500px\\]')).toBeNull()
    expect(container.querySelector('.w-\\[800px\\]')).toBeNull()
  })

  it('19. dúvida explícita não é apresentada como baixa confiança histórica', () => {
    const response = createMockResp({
      id: 'c1-sweat-unsure',
      prompt_id: AYV_C1_PROMPTS.P5_SWEAT.id,
      structured_value: {
        value: 'dont_know',
        prompt_key: AYV_C1_PROMPTS.P5_SWEAT.key,
        revision_number: 1,
        metadata: {
          explicit_unsure: true,
          historical_confidence: 'low',
        },
      },
    })

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={[response]}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText(/Não sei identificar\./i)).toBeInTheDocument()
    expect(screen.queryByText(/Atenção clínica \(Baixa confiança histórica\):/i)).toBeNull()
  })

  it('20. revisão concluída selecionada não recebe aviso do rascunho posterior', () => {
    const responses = buildMockResponsesRev1()
    responses.push(
      createMockResp({
        id: 'c1-rev2-draft',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        structured_value: {
          value: 'intermediate',
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          revision_number: 2,
          metadata: { revision_number: 2 },
        },
      }),
    )

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={responses}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getAllByRole('button', { name: /Revisão 1.*Mais recente/i })).toHaveLength(2)
    expect(screen.queryByText(/Este capítulo está em andamento\./i)).toBeNull()
  })

  it('21. Capítulo 3 abre na revisão concluída mais recente e permite consultar a anterior sem misturar respostas', async () => {
    const user = userEvent.setup()
    const c3Responses = [
      createMockResp({
        id: 'c3-domains',
        prompt_id: 'ayv_c3_changed_domains',
        version: 2,
        structured_value: {
          value: ['energy_pace'],
          metadata: { prompt_key: 'ayv_c3_changed_domains', chapter_revision_number: 2 },
        },
      }),
      createMockResp({
        id: 'c3-med-status',
        prompt_id: 'ayv_c3_medication_status',
        version: 2,
        structured_value: {
          value: 'current_use',
          metadata: { prompt_key: 'ayv_c3_medication_status', chapter_revision_number: 2 },
        },
      }),
      createMockResp({
        id: 'c3-med-details',
        prompt_id: 'ayv_c3_medication_details',
        version: 2,
        structured_value: {
          value: [{ id: 'donaren', kind: 'medication', name: 'Donaren' }],
          metadata: { prompt_key: 'ayv_c3_medication_details', chapter_revision_number: 2 },
        },
      }),
      createMockResp({
        id: 'c3-completion',
        prompt_id: 'ayv_c3_chapter_completion',
        version: 2,
        structured_value: {
          completed: true,
          metadata: { prompt_key: 'ayv_c3_chapter_completion', chapter_revision_number: 2 },
        },
      }),
    ]
    const responseVersions = c3Responses.map((response) => ({
      id: `snapshot-${response.id}`,
      response_id: response.id,
      enrollment_id: response.enrollment_id,
      experience_id: response.experience_id,
      prompt_id: response.prompt_id,
      respondent_user_id: response.respondent_user_id,
      response_type: response.response_type,
      access_class: response.access_class,
      structured_value:
        response.prompt_id === 'ayv_c3_medication_status'
          ? {
              value: 'no_use',
              metadata: { prompt_key: response.prompt_id, chapter_revision_number: 1 },
            }
          : response.prompt_id === 'ayv_c3_medication_details'
            ? {
                value: [],
                metadata: { prompt_key: response.prompt_id, chapter_revision_number: 1 },
              }
            : {
                ...(response.structured_value as object),
                metadata: { prompt_key: response.prompt_id, chapter_revision_number: 1 },
              },
      free_text: '',
      version_number: 1,
      prompt_version: 1,
      created: '2025-05-01T10:00:00.000Z',
      updated: '2025-05-01T10:00:00.000Z',
    }))

    render(
      <ProfessionalAyurvedaCorpoFisiologiaView
        responses={c3Responses}
        responseVersions={responseVersions}
        participantName="Mariana Souza"
      />,
    )

    expect(screen.getByText('Donaren')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Revisão 2.*Mais recente/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Revisão 1$/i }))

    expect(screen.getByText('Não uso medicamentos ou suplementos atualmente')).toBeInTheDocument()
    expect(screen.queryByText('Donaren')).toBeNull()
  })
})
