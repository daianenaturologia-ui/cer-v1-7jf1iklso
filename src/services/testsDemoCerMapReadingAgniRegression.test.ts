import { describe, it, expect } from 'vitest'
import { createDemoCerMapReading } from './demoCerMapReading'
import { buildAyurvedaInterpretation } from './ayurvedaInterpretationEngine'
import { AYV_C2_PROMPTS } from './ayurvedaChapter2'
import type { ExperienceResponseRecord } from '@/types/cer'

describe('Regressão de Consistência do Agni no Snapshot Demo CER V1', () => {
  const demoSnapshot = createDemoCerMapReading('demo-enr-01')
  const agni = demoSnapshot.elementReadings?.agni

  it('1. O modal/detalhe Agni do demo NÃO contém "(Vishama Agni)" nem afirma um único tipo de Agni como classificação', () => {
    expect(agni).toBeDefined()
    if (!agni) return

    // Não pode conter "(Vishama Agni)" nem "Vishama" em nenhum dos campos descritivos do Agni demo
    expect(agni.summary).not.toContain('(Vishama Agni)')
    expect(agni.summary).not.toContain('Vishama')
    expect(agni.interpretation).not.toContain('(Vishama Agni)')
    expect(agni.interpretation).not.toContain('Vishama')

    // Nem nas observações, recursos, custos, conexões ou perguntas
    const allText = [
      agni.summary,
      agni.interpretation,
      ...agni.observations,
      ...agni.resources,
      ...agni.costs,
      ...agni.connections,
      ...agni.questions,
    ].join(' ')

    expect(allText).not.toContain('(Vishama Agni)')
    expect(allText).not.toContain('Vishama Agni')
    expect(allText).not.toContain('Tikshna Agni')
    expect(allText).not.toContain('Manda Agni')
    expect(allText).not.toContain('Sama Agni')
  })

  it('2. O texto do Agni demo contém marcações de "sinais mistos"/"mais de um padrão tradicional", "em observação" e "padrão habitual"', () => {
    expect(agni).toBeDefined()
    if (!agni) return

    // summary
    expect(agni.summary).toBe(
      'Fome irregular, apetite variável e digestão pesada no padrão habitual. Esses sinais pedem uma leitura conjunta, sem definir um único tipo de Agni.',
    )

    // interpretation
    expect(agni.interpretation).toBe(
      'Na tradição ayurvédica, Agni representa os processos de digestão e transformação. Neste exemplo, a fome e o retorno do apetite variáveis aparecem junto à digestão pesada. Há sinais associados a mais de um padrão tradicional, por isso a leitura permanece em observação. Precisamos explorar duração, frequência e contexto antes de propor uma hipótese mais específica. Esses relatos habituais não comprovam um desequilíbrio atual nem medem metabolismo ou toxinas.',
    )

    // resources
    expect(agni.resources).toEqual([
      'Você relatou sinais de apetite, digestão e ritmo intestinal que podem ser explorados na conversa.',
    ])

    // observations contêm marcação de habitualidade nos fatos existentes
    expect(agni.observations).toEqual([
      'Fome irregular no padrão habitual',
      'Retorno variável do apetite',
      'Peso habitual após refeições',
      'Alimentos gordurosos/pesados mais exigentes no relato',
      'Eliminação irregular no padrão habitual',
    ])

    // Verifica que os marcadores conceituais chave estão explicitamente presentes
    expect(agni.summary).toContain('padrão habitual')
    expect(agni.summary).toContain('sem definir um único tipo de Agni')
    expect(agni.interpretation).toContain('mais de um padrão tradicional')
    expect(agni.interpretation).toContain('em observação')
    expect(agni.interpretation).toContain('relatos habituais')
  })

  it('3. Consistência com o motor: o resumo/indicador do Agni gerado pelo ayurvedaInterpretationEngine trata como "Indefinido / Em observação"', () => {
    // Cenário equivalente aos sinais do relato demo de Mariana:
    // P1 (Hunger): irregular (Vata / Vishama)
    // P3 (Post Meal): heavy_slow_digestion (Kapha / Manda)
    // Sinais mistos de dois tipos distintos -> motor classifica como 'Indefinido / Em observação'
    const responses: ExperienceResponseRecord[] = [
      {
        id: 'qa-c2-p1',
        enrollment_id: 'demo-enr-01',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.id,
        respondent_user_id: 'demo-user-mariana',
        response_type: 'MultiSelectCards',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
        structured_value: {
          selectedOptionIds: ['irregular'],
          value: 'irregular',
          prompt_key: AYV_C2_PROMPTS.P1_HUNGER_PATTERN.key,
          revision_number: 1,
        },
        created: '2025-05-15T10:00:00.000Z',
        updated: '2025-05-15T10:00:00.000Z',
      },
      {
        id: 'qa-c2-p3',
        enrollment_id: 'demo-enr-01',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C2_PROMPTS.P3_POST_MEAL.id,
        respondent_user_id: 'demo-user-mariana',
        response_type: 'MultiSelectCards',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
        structured_value: {
          selectedOptionIds: ['heavy_slow_digestion'],
          value: 'heavy_slow_digestion',
          prompt_key: AYV_C2_PROMPTS.P3_POST_MEAL.key,
          revision_number: 1,
        },
        created: '2025-05-15T10:00:00.000Z',
        updated: '2025-05-15T10:00:00.000Z',
      },
      {
        id: 'qa-c2-comp',
        enrollment_id: 'demo-enr-01',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C2_PROMPTS.CHAPTER_COMPLETION.id,
        respondent_user_id: 'demo-user-mariana',
        response_type: 'ChoiceCards',
        prompt_version: 1,
        version: 1,
        status: 'saved',
        access_class: 'shared_care',
        structured_value: {
          completed: true,
          prompt_key: AYV_C2_PROMPTS.CHAPTER_COMPLETION.key,
          revision_number: 1,
        },
        created: '2025-05-15T10:00:00.000Z',
        updated: '2025-05-15T10:00:00.000Z',
      },
    ]

    const interpretation = buildAyurvedaInterpretation(responses)

    // O motor classifica como "Indefinido / Em observação"
    expect(interpretation.agniReading.type).toBe('Indefinido / Em observação')
    expect(interpretation.agniReading.confidence).toBe('Em observação')
    expect(interpretation.agniReading.description).toContain('Sinais habituais mistos')

    // O detalhe do Agni no demo é consistente com o motor (sem classificação única fechada de tipo)
    expect(agni?.summary).toContain('sem definir um único tipo de Agni')
    expect(agni?.interpretation).toContain('a leitura permanece em observação')
  })

  it('4. Outros elementos do demo não foram alterados (Luta, Mundo Emocional e outros permanecem intactos)', () => {
    // 1. Elemento Luta das reações de regulação
    const luta = demoSnapshot.elementReadings?.luta
    expect(luta).toBeDefined()
    expect(luta?.summary).toBe(
      'Tendência espontânea relatada: mobilização ativa para intervir, resolver logo e devolver tranquilidade ao ambiente.',
    )
    expect(luta?.observations).toContain(
      'Contexto de ativação: sobrecarga de prazos simultâneos e ruídos de comunicação',
    )
    expect(luta?.resources).toContain(
      'Você identifica sinais e a função que reconhece em sua resposta.',
    )

    // 2. Elemento Prestativo dos padrões de proteção
    const prestativo = demoSnapshot.elementReadings?.prestativo
    expect(prestativo).toBeDefined()
    expect(prestativo?.summary).toBe(
      'Categoria: Aparece com muita força quando estou sob pressão. Movimento de cuidar e assumir a frente para devolver harmonia, hesitando em pedir ajuda.',
    )

    // 3. Elemento Insistente
    const insistente = demoSnapshot.elementReadings?.insistente
    expect(insistente).toBeDefined()
    expect(insistente?.summary).toBe(
      'Categoria no exemplo: Repete-se com frequência. Relato de buscar fazer as coisas do jeito certo e voz interna cobrando antecipação.',
    )

    // 4. Elemento Ama de fisiologia
    const ama = demoSnapshot.elementReadings?.ama
    expect(ama).toBeDefined()
    expect(ama?.summary).toBe(
      'Sensação de digestão pesada, corpo pesado ao despertar e eliminação pegajosa/incompleta relatadas; leitura tradicional de processamento incompleto sem diagnóstico.',
    )

    // 5. Elemento Kapha de fisiologia
    const kapha = demoSnapshot.elementReadings?.kapha
    expect(kapha).toBeDefined()
    expect(kapha?.summary).toBe(
      'Princípio tradicional de estrutura e sustentação; sensação de peso relatada sem validação de constituição fixa. Percentual de 20% ilustrativo.',
    )

    // 6. Dimensão mente - resumo intacto
    const menteDim = demoSnapshot.dimensions.find((d) => d.id === 'mente')
    expect(menteDim?.summary).toBe(
      'Você relata emoções rápidas no corpo, antecipação dos próximos passos, ação para resolver e cobrança severa diante de erros.',
    )
  })
})
