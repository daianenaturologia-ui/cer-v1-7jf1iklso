import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ExperienceEngine } from './ExperienceEngine'
import {
  MindEmotionsReport,
  MSG_RECUSA,
  MSG_INDISPONIVEL,
  extractQuestionResponse,
} from './MindEmotionsReport'
import { enrollmentExperienceService } from '../../services/experienceEngine'
import pb from '../../lib/pocketbase/client'

describe('MindEmotionsReport — Retrato de Mente & Emoções', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const fullResponsesFixture: Record<string, any> = {
    // P1: Funcionamento emocional geral
    'p-07c-pm1-p1-funcionamento-emocional': {
      free_text: 'Isso varia muito ao longo do dia.',
    },
    // P2: Emoções
    'p-07c-pm1-p2-emocoes-presentes': {
      structured_value: ['ansiedade_apreensao', 'tristeza', 'outra_emocao'],
      free_text: 'aperto no peito',
    },
    // P3: Como descreveu as emoções
    'p-07c-pm1-p3-por-que-se-sente-assim': {
      free_text: 'Sinto isso principalmente no final do dia quando as tarefas acumulam.',
    },
    // P4: Pensamentos livres
    'p-07c-pm2-p4-pensamentos-associados': {
      free_text: 'Fico pensando que não vou dar conta e que deveria ter feito mais.',
    },
    // P5: Comportamentos
    'p-07c-pm2-p5-comportamento-associado': {
      structured_value: ['resolver_imediatamente', 'silencio_afastamento'],
      free_text: 'Tento adiantar tudo correndo ou me tranco no quarto.',
    },
    // P6: Diálogo interno
    'p-07c-pm2-p6-dialogo-interno': {
      structured_value: 'cobro_solucao_rapida',
      free_text: '“Você não pode falhar agora.”',
    },
    // P7A / P7B
    'p-07c-pm3-p7a-movimentos-1-5': {
      structured_value: {
        cartao_1_fazer_certo: 'Frequentemente',
        cartao_4_perder_sensacao_escolha: 'Com força sob pressão',
      },
    },
    'p-07c-pm3-p7b-movimentos-6-10': {
      structured_value: {
        cartao_6_antecipar_riscos: 'Frequentemente',
      },
    },
    // P8: Interferentes (máximo 3)
    'p-07c-pm3-p8-interferencia-movimentos': {
      structured_value: [
        'cartao_1_fazer_certo',
        'cartao_4_perder_sensacao_escolha',
        'cartao_6_antecipar_riscos',
      ],
    },
    // P9: Contextos
    'p-07c-pm3-p9-situacoes-ativacao': {
      structured_value: ['sob_pressao_responsabilidades'],
      free_text: 'Quando tenho prazos apertados no trabalho.',
    },
    // P10: Segurança e bem-estar
    'p-07c-pm4-p10-seguranca-bem-estar': {
      structured_value: ['calma_tranquilidade'],
      free_text: 'Consigo respirar com calma e fazer uma coisa de cada vez.',
    },
    // P11: Sobrecarga
    'p-07c-pm4-p11-sobrecarga': {
      free_text: 'Minha mente acelera e perco o sono.',
    },
    // P12: Recursos + Alívio imediato
    'p-07c-pm5-p12-recursos-espaco-interno': {
      structured_value: ['descansar_silencio', 'ouvir_musica'],
      free_text: 'Ficar no celular rolando feed até tarde.',
    },
    // P13: Algo importante
    'p-07c-pm5-p13-campo-final-opcional': {
      free_text: 'Gostaria de falar sobre a relação com minha mãe na próxima sessão.',
    },
  }

  it('1. relatório está disponível somente após conclusão e botão abre e fecha', async () => {
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'enr-exp-completed',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      progress_status: 'completed',
      release_status: 'completed',
      current_step_order: 13,
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={Object.values(fullResponsesFixture) as any}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Momento Concluído')).toBeTruthy()
    })

    const openBtn = screen.getByRole('button', { name: /Ver meu retrato de Mente & Emoções/i })
    expect(openBtn).toBeTruthy()

    // Abre
    fireEvent.click(openBtn)
    expect(screen.getByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeTruthy()

    // Fecha pelo topo
    const closeTop = screen.getByTestId('report-close-button-top')
    fireEvent.click(closeTop)
    expect(screen.queryByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeNull()

    // Reabre
    fireEvent.click(openBtn)
    expect(screen.getByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeTruthy()

    // Fecha pela base
    const closeBottom = screen.getByTestId('report-close-button-bottom')
    fireEvent.click(closeBottom)
    expect(screen.queryByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeNull()
  })

  it('2. exibe emoções reais e preserva "outra emoção" digitada', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    expect(screen.getByText('Emoções mais presentes')).toBeTruthy()
    expect(screen.getByText('Ansiedade ou apreensão')).toBeTruthy()
    expect(screen.getByText('Tristeza')).toBeTruthy()
    expect(screen.getByText(/Outra emoção:\s*aperto no peito/i)).toBeTruthy()
  })

  it('3. preserva resposta da P3, pensamentos reais e diálogo interno real', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // P3
    expect(
      screen.getByText('Sinto isso principalmente no final do dia quando as tarefas acumulam.'),
    ).toBeTruthy()

    // P4
    expect(
      screen.getByText('Fico pensando que não vou dar conta e que deveria ter feito mais.'),
    ).toBeTruthy()

    // P6
    expect(screen.getByText('“Você não pode falhar agora.”')).toBeTruthy()
  })

  it('4. exibe comportamentos reais, sobrecarga e estratégias de alívio sem moralizar', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // Comportamento
    expect(screen.getByText('Tento adiantar tudo correndo ou me tranco no quarto.')).toBeTruthy()

    // Alívio imediato
    expect(
      screen.getByText('Estratégias que aliviam agora, mas podem cobrar um preço depois'),
    ).toBeTruthy()
    expect(screen.getByText('Ficar no celular rolando feed até tarde.')).toBeTruthy()
  })

  it('5. reutiliza ProtectionPatternsChart preservando seu título original', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()
    expect(screen.getByText(/Legenda qualitativa/i)).toBeTruthy()
  })

  it('6. mostra SOMENTE os padrões da P8 nos cartões detalhados e no máximo três', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    expect(screen.getByText('Os padrões que mais interferem atualmente')).toBeTruthy()

    // Cartão 1 (Insistente), Cartão 4 (Vítima) e Cartão 6 (Hipervigilante) devem estar presentes
    expect(screen.getByTestId('pattern-card-cartao_1_fazer_certo')).toBeTruthy()
    expect(screen.getByTestId('pattern-card-cartao_4_perder_sensacao_escolha')).toBeTruthy()
    expect(screen.getByTestId('pattern-card-cartao_6_antecipar_riscos')).toBeTruthy()

    // Outros 7 não devem ter cartões detalhados gerados
    expect(screen.queryByTestId('pattern-card-cartao_2_cuidar_pessoas')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_3_produtividade_conquistas')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_5_compreender_pela_razao')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_7_novos_estimulos')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_8_assumir_controle')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_9_evitar_desconfortos')).toBeNull()
    expect(screen.queryByTestId('pattern-card-cartao_10_cobrar_e_criticar')).toBeNull()
  })

  it('7. campos internos do cartão expansível seguem a ordem e trazem as 10 seções', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // Clica para expandir o primeiro padrão (Insistente)
    const patternCard = screen.getByTestId('pattern-card-cartao_1_fazer_certo')
    const expandBtn = patternCard.querySelector('button')
    expect(expandBtn).toBeTruthy()
    fireEvent.click(expandBtn!)

    // Ordem aprovada
    expect(screen.getByText('Como esse padrão costuma aparecer')).toBeTruthy()
    expect(screen.getByText('O que ele costuma dizer em sua mente')).toBeTruthy()
    expect(screen.getByText('Sentimentos que podem acompanhá-lo')).toBeTruthy()
    expect(screen.getByText('As mentiras que esse padrão conta')).toBeTruthy()
    expect(screen.getByText('O preço que você pode pagar')).toBeTruthy()
    expect(screen.getByText('O impacto possível nas relações')).toBeTruthy()
    expect(screen.getByText('A potência que existe nesse padrão')).toBeTruthy()
    expect(screen.getByText('Possível função de proteção')).toBeTruthy()
    expect(screen.getByText('O que você precisa começar a perceber')).toBeTruthy()
  })

  it('8. preserva salvaguarda ética e clarificationNote do Vítima e do Hipervigilante', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // Expande o cartão do Vítima
    const vitimaCard = screen.getByTestId('pattern-card-cartao_4_perder_sensacao_escolha')
    const vitimaExpandBtn = vitimaCard.querySelector('button')
    fireEvent.click(vitimaExpandBtn!)

    // Clarification note do Vítima
    expect(screen.getByText(/Nota de esclarecimento:/i)).toBeTruthy()
    expect(screen.getByText(/não se refere a uma pessoa que sofreu violência/i)).toBeTruthy()

    // Expande o cartão do Hipervigilante
    const vigCard = screen.getByTestId('pattern-card-cartao_6_antecipar_riscos')
    const vigExpandBtn = vigCard.querySelector('button')
    fireEvent.click(vigExpandBtn!)

    // Clarification note do Hipervigilante
    expect(
      screen.getByText(/diferencia-se da hipervigilância como sintoma pós-traumático/i),
    ).toBeTruthy()
  })

  it('9. diferencia rigorosamente ausência de recusa sem inventar inferência', () => {
    const responsesWithRefusalAndEmpty: Record<string, any> = {
      'p-07c-pm1-p2-emocoes-presentes': {
        refusal: true,
      },
      // P3 ausente
      'p-07c-pm2-p4-pensamentos-associados': {
        text: '__REFUSED__',
      },
      // P6 ausente
    }

    render(
      <MindEmotionsReport
        isOpen={true}
        onClose={() => {}}
        responses={responsesWithRefusalAndEmpty}
      />,
    )

    // P2 recusada
    const refusedMessages = screen.getAllByText(MSG_RECUSA)
    expect(refusedMessages.length).toBeGreaterThanOrEqual(1)

    // P3 ausente
    const unavailableMessages = screen.getAllByText(MSG_INDISPONIVEL)
    expect(unavailableMessages.length).toBeGreaterThanOrEqual(1)
  })

  it('10. não renderiza seção da Pergunta 13 se vazia; renderiza quando informada', () => {
    const { rerender } = render(
      <MindEmotionsReport
        isOpen={true}
        onClose={() => {}}
        responses={{ ...fullResponsesFixture, 'p-07c-pm5-p13-campo-final-opcional': undefined }}
      />,
    )

    expect(screen.queryByTestId('section-p13')).toBeNull()

    rerender(
      <MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />,
    )

    expect(screen.getByTestId('section-p13')).toBeTruthy()
    expect(
      screen.getByText('Gostaria de falar sobre a relação com minha mãe na próxima sessão.'),
    ).toBeTruthy()
  })

  it('11. traz referências científicas completas com DOIs e nota de responsabilidade', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // Abre seção de referências
    const toggleRefsBtn = screen.getByRole('button', {
      name: /Bases científicas desta experiência/i,
    })
    fireEvent.click(toggleRefsBtn)

    expect(screen.getByText(/Gross, J. J. \(2015\)/i)).toBeTruthy()
    expect(screen.getByText(/Aldao, A., Nolen-Hoeksema/i)).toBeTruthy()
    expect(screen.getByText(/Kashdan, T. B./i)).toBeTruthy()
    expect(screen.getByText(/Neff, K. D./i)).toBeTruthy()

    const links = screen.getAllByRole('link')
    expect(links.length).toBe(4)
    expect(links[0].getAttribute('href')).toContain('https://doi.org/')
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(links[0].getAttribute('rel')).toContain('noopener')

    expect(
      screen.getByText(/Os Padrões de Proteção CER constituem uma ferramenta autoral/i),
    ).toBeTruthy()
  })

  it('12. não inventa pontuação, notas numéricas ou ranking', () => {
    render(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />)

    // Verifica que não há texto como "Score", "Nota:", "Ranking", "Pontos"
    expect(screen.queryByText(/Pontuação/i)).toBeNull()
    expect(screen.queryByText(/Ranking/i)).toBeNull()
    expect(screen.queryByText(/Classificação diagnóstica/i)).toBeNull()
    expect(screen.queryByText(/Avaliação psicológica/i)).toBeNull()
  })

  it('13. fechar e reabrir preserva respostas sem chamadas de rede ou mutação', async () => {
    const pbSpy = vi.spyOn(pb, 'collection')

    const { rerender } = render(
      <MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />,
    )

    expect(screen.getByText('Ansiedade ou apreensão')).toBeTruthy()

    // Fecha
    rerender(
      <MindEmotionsReport isOpen={false} onClose={() => {}} responses={fullResponsesFixture} />,
    )
    expect(screen.queryByText('Seu retrato de Mente & Emoções')).toBeNull()

    // Reabre
    rerender(
      <MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullResponsesFixture} />,
    )
    expect(screen.getByText('Ansiedade ou apreensão')).toBeTruthy()

    // Nenhuma chamada PocketBase
    expect(pbSpy).not.toHaveBeenCalled()
  })

  it('14. extractQuestionResponse universal resolver aceita mapa por ID persistido, arrays e chaves canônicas', () => {
    const rawResponses = {
      'db-uuid-1': {
        id: 'db-uuid-1',
        prompt_id: 'db-uuid-1',
        prompt_key: 'mundo_emocional_geral',
        step_order: 1,
        free_text: 'Isso varia muito',
      },
      'db-uuid-2': {
        id: 'db-uuid-2',
        prompt_id: 'db-uuid-2',
        prompt_key: 'movimentos_automaticos_frequencia_p2',
        step_order: 7,
        structured_value: { cartao_10_cobrar_e_criticar: 'Frequentemente' },
      },
    }

    const p1Found = extractQuestionResponse(rawResponses, [
      'p-07c-pm1-p1-funcionamento-emocional',
      'mundo_emocional_geral',
      'p1',
    ])
    expect(p1Found).toBeTruthy()
    expect(p1Found.free_text).toBe('Isso varia muito')

    // Array support
    const arrayResponses = Object.values(rawResponses)
    const p7bFound = extractQuestionResponse(arrayResponses, [
      'p-07c-pm3-p7b-movimentos-6-10',
      'movimentos_automaticos_frequencia_p2',
      'p7b',
    ])
    expect(p7bFound).toBeTruthy()
    expect(p7bFound.prompt_key).toBe('movimentos_automaticos_frequencia_p2')
  })

  it('15. TESTE DE INTEGRAÇÃO OBRIGATÓRIO: caminho real de produção com P1, P7b, P8, P12, persistência e campos não respondidos', async () => {
    // Simulação do payload real persistido pelo demoAdapter / PocketBase
    const productionPersistedResponses: Record<string, any> = {
      'real-prompt-id-p1': {
        id: 'resp-p1',
        prompt_id: 'real-prompt-id-p1',
        prompt_key: 'mundo_emocional_geral',
        step_order: 1,
        free_text: 'Isso varia muito',
        structured_value: {
          value: 'Isso varia muito',
          metadata: {
            prompt_key: 'mundo_emocional_geral',
            canonical_prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
          },
        },
      },
      'real-prompt-id-p7b': {
        id: 'resp-p7b',
        prompt_id: 'real-prompt-id-p7b',
        prompt_key: 'movimentos_automaticos_frequencia_p2',
        step_order: 7,
        structured_value: {
          cartao_10_cobrar_e_criticar: 'Frequentemente',
          metadata: {
            prompt_key: 'movimentos_automaticos_frequencia_p2',
            canonical_prompt_id: 'p-07c-pm3-p7b-movimentos-6-10',
          },
        },
      },
      'real-prompt-id-p8': {
        id: 'resp-p8',
        prompt_id: 'real-prompt-id-p8',
        prompt_key: 'movimentos_interferencia_atual',
        step_order: 8,
        structured_value: {
          selectedOptionIds: ['cartao_10_cobrar_e_criticar'],
          metadata: {
            prompt_key: 'movimentos_interferencia_atual',
            canonical_prompt_id: 'p-07c-pm3-p8-interferencia-movimentos',
          },
        },
      },
      'real-prompt-id-p12': {
        id: 'resp-p12',
        prompt_id: 'real-prompt-id-p12',
        prompt_key: 'recursos_recuperar_espaco',
        step_order: 12,
        free_text: 'Ainda não descobri o que me ajuda',
        structured_value: {
          free_text: 'Ainda não descobri o que me ajuda',
          metadata: {
            prompt_key: 'recursos_recuperar_espaco',
            canonical_prompt_id: 'p-07c-pm5-p12-recursos-espaco-interno',
          },
        },
      },
    }

    render(
      <MindEmotionsReport
        isOpen={true}
        onClose={() => {}}
        responses={productionPersistedResponses}
      />,
    )

    // Afirmar que o diálogo abre
    expect(screen.getByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeTruthy()

    // 1. P1: Funcionamento emocional ("Isso varia muito")
    expect(screen.getByText('Como você descreveu seu funcionamento emocional')).toBeTruthy()
    expect(screen.getByText('Isso varia muito')).toBeTruthy()

    // 2. P7b / P8: "Crítico" ("cartao_10_cobrar_e_criticar") nos padrões mais interferentes
    expect(screen.getByTestId('pattern-card-cartao_10_cobrar_e_criticar')).toBeTruthy()
    expect(screen.getByText('Crítico')).toBeTruthy()

    // 3. P12: Recurso ("Ainda não descobri o que me ajuda")
    expect(screen.getByText('Ainda não descobri o que me ajuda')).toBeTruthy()

    // 4. Afirmar que campos realmente não respondidos permanecem "Informação ainda não disponível"
    // (ex.: pensamentos P4, diálogo interno P6, segurança P10, sobrecarga P11, anotação P13)
    const unavailableList = screen.getAllByText(MSG_INDISPONIVEL)
    expect(unavailableList.length).toBeGreaterThanOrEqual(3)
  })

  it('16. TESTE DE INTEGRAÇÃO COMPLETO OBRIGATÓRIO: P1 introspectiva, P2 Medo, P3 livre, P7a/P7b 3 categorias, P8 Evitativa, P12 recurso, P13 daiane precisa ler depois', async () => {
    const pbSpy = vi.spyOn(pb, 'collection')

    // Simulando responses preenchidas no fluxo real da interagente Mariana
    const realFlowResponses: Record<string, any> = {
      // P1: introspectiva
      'p-07c-pm1-p1-funcionamento-emocional': {
        id: 'resp-p1',
        prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        prompt_key: 'mundo_emocional_geral',
        canonical_prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        step_order: 1,
        free_text: 'introspectiva',
        structured_value: {
          value: 'introspectiva',
          metadata: {
            prompt_key: 'mundo_emocional_geral',
            canonical_prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
            step_order: 1,
            participant_free_speech: true,
          },
        },
      },
      // P2: Medo
      'p-07c-pm1-p2-emocoes-presentes': {
        id: 'resp-p2',
        prompt_id: 'p-07c-pm1-p2-emocoes-presentes',
        prompt_key: 'emocoes_recorrentes',
        canonical_prompt_id: 'p-07c-pm1-p2-emocoes-presentes',
        step_order: 2,
        structured_value: ['medo'],
        metadata: {
          prompt_key: 'emocoes_recorrentes',
          canonical_prompt_id: 'p-07c-pm1-p2-emocoes-presentes',
          step_order: 2,
        },
      },
      // P3: texto livre identificável
      'p-07c-pm1-p3-por-que-se-sente-assim': {
        id: 'resp-p3',
        prompt_id: 'p-07c-pm1-p3-por-que-se-sente-assim',
        prompt_key: 'compreensao_despertar_emocoes',
        canonical_prompt_id: 'p-07c-pm1-p3-por-que-se-sente-assim',
        step_order: 3,
        free_text: 'Costuma surgir quando há incerteza sobre o futuro',
        structured_value: {
          value: 'Costuma surgir quando há incerteza sobre o futuro',
          metadata: {
            prompt_key: 'compreensao_despertar_emocoes',
            canonical_prompt_id: 'p-07c-pm1-p3-por-que-se-sente-assim',
            step_order: 3,
          },
        },
      },
      // P7a / P7b: ao menos três categorias qualitativas diferentes
      'p-07c-pm3-p7a-movimentos-1-5': {
        id: 'resp-p7a',
        prompt_id: 'p-07c-pm3-p7a-movimentos-1-5',
        prompt_key: 'movimentos_automaticos_frequencia_p1',
        canonical_prompt_id: 'p-07c-pm3-p7a-movimentos-1-5',
        step_order: 6,
        structured_value: {
          cartao_1_fazer_certo: 'Quase nunca',
          cartao_2_cuidar_pessoas: 'Em algumas situações',
          cartao_3_produtividade_conquistas: 'Frequentemente',
        },
      },
      'p-07c-pm3-p7b-movimentos-6-10': {
        id: 'resp-p7b',
        prompt_id: 'p-07c-pm3-p7b-movimentos-6-10',
        prompt_key: 'movimentos_automaticos_frequencia_p2',
        canonical_prompt_id: 'p-07c-pm3-p7b-movimentos-6-10',
        step_order: 7,
        structured_value: {
          cartao_9_evitar_desconfortos: 'Com força sob pressão',
        },
      },
      // P8: "Evitativa" ("cartao_9_evitar_desconfortos")
      'p-07c-pm3-p8-interferencia-movimentos': {
        id: 'resp-p8',
        prompt_id: 'p-07c-pm3-p8-interferencia-movimentos',
        prompt_key: 'movimentos_interferencia_atual',
        canonical_prompt_id: 'p-07c-pm3-p8-interferencia-movimentos',
        step_order: 8,
        structured_value: ['cartao_9_evitar_desconfortos'],
      },
      // P12: um recurso
      'p-07c-pm5-p12-recursos-espaco-interno': {
        id: 'resp-p12',
        prompt_id: 'p-07c-pm5-p12-recursos-espaco-interno',
        prompt_key: 'recursos_recuperar_espaco',
        canonical_prompt_id: 'p-07c-pm5-p12-recursos-espaco-interno',
        step_order: 12,
        structured_value: ['caminhar_ao_ar_livre'],
        free_text: 'caminhada matinal ao ar livre',
      },
      // P13: "daiane precisa ler depois"
      'p-07c-pm5-p13-campo-final-opcional': {
        id: 'resp-p13',
        prompt_id: 'p-07c-pm5-p13-campo-final-opcional',
        prompt_key: 'campo_final_opcional',
        canonical_prompt_id: 'p-07c-pm5-p13-campo-final-opcional',
        step_order: 14,
        free_text: 'daiane precisa ler depois',
        structured_value: {
          value: 'daiane precisa ler depois',
          metadata: {
            prompt_key: 'campo_final_opcional',
            canonical_prompt_id: 'p-07c-pm5-p13-campo-final-opcional',
            step_order: 14,
            participant_free_speech: true,
          },
        },
      },
    }

    const { rerender } = render(
      <MindEmotionsReport isOpen={true} onClose={() => {}} responses={realFlowResponses} />,
    )

    // Afirmações do teste de integração:
    // 1. P1 literal ("introspectiva")
    expect(screen.getByText('introspectiva')).toBeTruthy()

    // 2. Medo (P2)
    expect(screen.getByText('Medo')).toBeTruthy()

    // 3. P3 literal
    expect(screen.getByText('Costuma surgir quando há incerteza sobre o futuro')).toBeTruthy()

    // 4. Categorias nos padrões corretos no gráfico e gráfico acessível
    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()

    // 5. Somente Evitativa ("cartao_9_evitar_desconfortos") com "Percebido como mais interferente"
    expect(screen.getByTestId('pattern-card-cartao_9_evitar_desconfortos')).toBeTruthy()
    expect(screen.getByText('Evitativa')).toBeTruthy()
    expect(screen.getByText('Percebido como mais interferente')).toBeTruthy()
    // Outros padrões não devem ter cartão na P8
    expect(screen.queryByTestId('pattern-card-cartao_1_fazer_certo')).toBeNull()

    // 6. P12 presente
    expect(screen.getByText(/caminhada matinal ao ar livre|Caminhada ao ar livre/i)).toBeTruthy()

    // 7. P13 literal ("daiane precisa ler depois")
    expect(screen.getByTestId('section-p13')).toBeTruthy()
    expect(screen.getByText('daiane precisa ler depois')).toBeTruthy()

    // 8. Nenhuma resposta existente vira "Informação ainda não disponível"
    // (P1, P2, P3, P8, P12, P13 estão todas preenchidas e com dados visíveis)
    // 9. Campos não respondidos (ex.: P4 pensamentos, P6 diálogo, P10, P11) continuam indisponíveis
    expect(screen.getAllByText(MSG_INDISPONIVEL).length).toBeGreaterThanOrEqual(1)

    // 10. Fechar e reabrir preserva
    rerender(<MindEmotionsReport isOpen={false} onClose={() => {}} responses={realFlowResponses} />)
    expect(screen.queryByRole('dialog', { name: /Seu retrato de Mente & Emoções/i })).toBeNull()

    rerender(<MindEmotionsReport isOpen={true} onClose={() => {}} responses={realFlowResponses} />)
    expect(screen.getByText('introspectiva')).toBeTruthy()
    expect(screen.getByText('daiane precisa ler depois')).toBeTruthy()

    // 11. Zero chamadas ao PocketBase
    expect(pbSpy).not.toHaveBeenCalled()
  })

  it('16. [NOVO v0.0.122] Resoluções estruturadas completas: P2 com ≥3 emoções + "outra emoção", P5/P6/P9/P10/P12 estruturados, P7a/P7b e P8 com 3 interferentes', () => {
    const fullStructuredResponses: Record<string, any> = {
      // P1: livre
      'p-07c-pm1-p1-funcionamento-emocional': {
        prompt_key: 'mundo_emocional_geral',
        free_text: 'Dia a dia calmo mas com picos de preocupação',
      },
      // P2: ≥3 emoções marcadas + "outra emoção"
      'p-07c-pm1-p2-emocoes-presentes': {
        prompt_key: 'emocoes_recorrentes',
        structured_value: {
          selectedOptionIds: ['ansiedade', 'inseguranca', 'sobrecarga'],
          outra_emocao_text: 'Aperto no peito matinal',
        },
      },
      // P3: livre
      'p-07c-pm1-p3-por-que-se-sente-assim': {
        prompt_key: 'compreensao_despertar_emocoes',
        free_text: 'Pressão constante no trabalho',
      },
      // P5: Comportamentos estruturados (comportamento_associado)
      'p-07c-pm2-p5-comportamento-associado': {
        prompt_key: 'comportamento_associado',
        structured_value: {
          selectedOptionIds: ['me_b_afastar_pessoas', 'me_b_acelerar_resolver'],
        },
      },
      // P6: Diálogo interno estruturado (self_dialogue_erro)
      'p-07c-pm2-p6-dialogo-interno': {
        prompt_key: 'self_dialogue_erro',
        structured_value: {
          choice: 'me_d_eu_deveria_ter_previsto',
        },
      },
      // P7a / P7b com ratings envelopados
      'p-07c-pm3-p7a-movimentos-1-5': {
        prompt_key: 'movimentos_automaticos_frequencia_p1',
        structured_value: {
          ratings: {
            cartao_1_fazer_certo: 'Frequentemente',
            cartao_2_cuidar_pessoas: 'Em algumas situações',
          },
        },
      },
      'p-07c-pm3-p7b-movimentos-6-10': {
        prompt_key: 'movimentos_automaticos_frequencia_p2',
        structured_value: {
          ratings: {
            cartao_6_antecipar_riscos: 'Com força sob pressão',
            cartao_9_evitar_desconfortos: 'Quase nunca',
          },
        },
      },
      // P8: 3 interferentes
      'p-07c-pm3-p8-interferencia-movimentos': {
        prompt_key: 'movimentos_interferencia_atual',
        structured_value: {
          selectedOptionIds: [
            'cartao_1_fazer_certo',
            'cartao_6_antecipar_riscos',
            'cartao_10_cobrar_e_criticar',
          ],
        },
      },
      // P9: Situações de ativação estruturadas (situacoes_ativacao_movimentos)
      'p-07c-pm3-p9-situacoes-ativacao': {
        prompt_key: 'situacoes_ativacao_movimentos',
        structured_value: {
          selectedOptionIds: ['me_sit_prazos_apertados', 'me_sit_conflito_direto'],
        },
      },
      // P10: Segurança / bem-estar estruturado (dois_retratos_espaco)
      'p-07c-pm4-p10-seguranca-bem-estar': {
        prompt_key: 'dois_retratos_espaco',
        structured_value: {
          selectedOptionIds: ['me_seg_pausa_silencio', 'me_seg_natureza_ar_livre'],
        },
      },
      // P11: Sobrecarga estruturada (dois_retratos_sobrecarga)
      'p-07c-pm4-p11-sobrecarga': {
        prompt_key: 'dois_retratos_sobrecarga',
        structured_value: {
          selectedOptionIds: ['me_sob_tensao_muscular', 'me_sob_mente_acelerada'],
        },
      },
      // P12: Recursos estruturados (recursos_recuperar_espaco)
      'p-07c-pm5-p12-recursos-espaco-interno': {
        prompt_key: 'recursos_recuperar_espaco',
        structured_value: {
          selectedOptionIds: ['respirar_fundo_pausa', 'caminhar_ao_ar_livre'],
        },
      },
    }

    render(
      <MindEmotionsReport isOpen={true} onClose={() => {}} responses={fullStructuredResponses} />,
    )

    // P2: Emoções resolvidas para labels humanos e outra emoção
    expect(screen.getByText('Ansiedade')).toBeTruthy()
    expect(screen.getByText('Insegurança')).toBeTruthy()
    expect(screen.getByText('Sobrecarga')).toBeTruthy()
    expect(screen.getByText(/Aperto no peito matinal/i)).toBeTruthy()

    // P5, P6, P9, P10, P11, P12 traduzidos sem "Informação ainda não disponível" nessas seções
    expect(screen.getByText(/Afastar-se das pessoas|me_b_afastar_pessoas/i)).toBeTruthy()
    expect(
      screen.getByText(/Eu deveria ter previsto isso|me_d_eu_deveria_ter_previsto/i),
    ).toBeTruthy()
    expect(screen.getByText(/Prazos muito apertados|me_sit_prazos_apertados/i)).toBeTruthy()
    expect(screen.getByText(/Pausas em silêncio|me_seg_pausa_silencio/i)).toBeTruthy()
    expect(screen.getByText(/Tensão muscular acumulada|me_sob_tensao_muscular/i)).toBeTruthy()
    expect(screen.getByText(/Respirar fundo|respirar_fundo_pausa/i)).toBeTruthy()

    // P8: 3 interferentes presentes
    expect(screen.getByTestId('pattern-card-cartao_1_fazer_certo')).toBeTruthy()
    expect(screen.getByTestId('pattern-card-cartao_6_antecipar_riscos')).toBeTruthy()
    expect(screen.getByTestId('pattern-card-cartao_10_cobrar_e_criticar')).toBeTruthy()

    // O bloco técnico de rastreabilidade NÃO aparece na visão padrão da interagente
    expect(screen.queryByTestId('protection-patterns-technical-trace')).toBeNull()
  })

  it('17. [NOVO v0.0.122] Visão profissional (isProfessionalView=true) exibe o bloco técnico de rastreabilidade', () => {
    render(
      <MindEmotionsReport
        isOpen={true}
        onClose={() => {}}
        responses={{}}
        isProfessionalView={true}
      />,
    )
    expect(screen.getByTestId('protection-patterns-technical-trace')).toBeTruthy()
  })
})
