// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT } from '@/services/demoAdapter'
import { ProfessionalConscienciaSection } from '@/components/ProfessionalConscienciaSection'
import { ProfessionalAyurvedaInterpretationView } from '@/components/experience/ayurveda/ProfessionalAyurvedaInterpretationView'
import { ProfessionalMindEmotionsView } from '@/components/experience/ProfessionalMindEmotionsView'
import { ProfessionalDimensionReportView } from '@/components/experience/ProfessionalDimensionReportView'
import {
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
} from '@/services/universalDimensionInterpretationEngine'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'
import { AYV_C2_PROMPTS } from '@/services/ayurvedaChapter2'

describe('Telas Profissionais da Dimensão Consciência', () => {
  beforeEach(() => {
    demoAdapter.enableDemo('daiane')
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => cb(0))
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('1. renderiza a nova seção interpretativa de Ayurveda com hipóteses de Prakriti, Vikriti, Agni e Ama sem IDs técnicos', () => {
    const responses = [
      {
        id: 'c1-comp',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C1_PROMPTS.CHAPTER_COMPLETION.id,
        respondent_user_id: 'u1',
        response_type: 'choice',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { completed: true, prompt_key: AYV_C1_PROMPTS.CHAPTER_COMPLETION.key },
      },
      {
        id: 'c1-p1',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C1_PROMPTS.P1_STRUCTURE.id,
        respondent_user_id: 'u1',
        response_type: 'choice',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { value: 'slender', prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key },
      },
      {
        id: 'c1-p3',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-corpo-fisiologia-07b',
        prompt_id: AYV_C1_PROMPTS.P2_SKIN.id,
        respondent_user_id: 'u1',
        response_type: 'choice',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { value: 'dry', prompt_key: AYV_C1_PROMPTS.P2_SKIN.key },
      },
    ] as any

    const { container } = render(
      <ProfessionalAyurvedaInterpretationView responses={responses} participantName="Mariana" />,
    )

    expect(
      screen.queryByText(/Hipótese Profissional de Trabalho \(Não-Diagnóstica\)/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Hipótese de Prakriti/i)).toBeInTheDocument()
    expect(screen.getByText(/Hipótese de Vikriti/i)).toBeInTheDocument()
    expect(screen.getByText(/Leitura de Agni/i)).toBeInTheDocument()
    expect(screen.getByText(/Leitura de Ama/i)).toBeInTheDocument()

    // Seções obrigatórias
    expect(screen.getByText(/Recursos Percebidos/i)).toBeInTheDocument()
    expect(screen.getByText(/Pontos de Atenção/i)).toBeInTheDocument()
    expect(screen.getByText(/Perguntas para a Sessão/i)).toBeInTheDocument()

    // Regra: nunca mostrar IDs técnicos
    const text = container.textContent || ''
    expect(text).not.toContain('ayv_c1_')
    expect(text).not.toContain('p-07b-')
  })

  it('2. Mente & Emoções exibe resumo essencial e 4 lentes sem JSON bruto', () => {
    const responses = [
      {
        id: 'me-1',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-mente-emocoes-07c',
        prompt_id: 'p-07c-pm1-p1-funcionamento-emocional',
        respondent_user_id: 'u1',
        response_type: 'choice',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { title: 'Sentimento intenso e rápido' },
      },
    ] as any

    const { container } = render(
      <ProfessionalMindEmotionsView responses={responses} participantName="Mariana" />,
    )

    expect(screen.getByText(/Resumo Essencial — Mente & Emoções/i)).toBeInTheDocument()
    expect(screen.getByText(/Lente 1 — Paisagem e Dinâmica Emocional/i)).toBeInTheDocument()
    expect(screen.getByText(/Lente 2 — Diálogo Interno e Padrões Cognitivos/i)).toBeInTheDocument()
    expect(screen.getByText(/Lente 3 — Mecanismos de Proteção Automática/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Lente 4 — Espaço Interno e Recursos de Autorregulação/i),
    ).toBeInTheDocument()

    // Não deve haver JSON cru de resposta como relatório
    expect(container.textContent).not.toContain('{"title":')
    expect(container.textContent).not.toContain('{"prompt_key":')
  })

  it('3. Relatórios das 4 dimensões (Regulação, Relações, Sexualidade, Sentido) renderizam com seções canônicas', () => {
    const responses = [
      {
        id: 'r-1',
        enrollment_id: 'enr-demo',
        experience_id: 'exp-reg',
        prompt_id: 'p-reg-1',
        respondent_user_id: 'u1',
        response_type: 'choice',
        access_class: 'participant_shared',
        version: 1,
        prompt_version: 1,
        created: '2025-05-01',
        updated: '2025-05-01',
        structured_value: { title: 'Situação de teste' },
      },
    ] as any

    const interp = buildRegulacaoInterpretation(responses, 'Mariana')
    render(
      <ProfessionalDimensionReportView
        interpretation={interp}
        responses={responses}
        participantName="Mariana"
      />,
    )

    expect(
      screen.getByText(/Relatório Profissional — Regulação & Padrões de Resposta/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Síntese Simples', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/Síntese Profunda & Convergências/i)).toBeInTheDocument()
    expect(screen.getByText(/Evidências Observadas/i)).toBeInTheDocument()
    expect(screen.getByText(/Recursos Percebidos/i)).toBeInTheDocument()
    expect(screen.getByText(/Pontos de Atenção/i)).toBeInTheDocument()
    expect(screen.getByText(/Perguntas para a Sessão/i)).toBeInTheDocument()
  })

  it('4. todas as 6 áreas profissionais renderizam na navegação do ProfessionalConscienciaSection', async () => {
    const user = userEvent.setup()

    render(
      <ProfessionalConscienciaSection enrollment={DEMO_ENROLLMENT} participantName="Mariana" />,
    )

    // Os 6 botões "Ver respostas" existem
    const buttons = screen.getAllByRole('button', { name: 'Ver respostas' })
    expect(buttons).toHaveLength(6)

    // O Mapa Integrativo Profissional está presente na seção (área de leitura)
    expect(screen.getByText('Mapa Integrativo Profissional da Consciência')).toBeInTheDocument()

    // Clicando em cada dimensão para abrir
    for (const btn of buttons) {
      await user.click(btn)
    }

    // Nenhuma chamada a PocketBase no modo demo
    const pbSpy = vi.spyOn(pb, 'collection')
    expect(pbSpy).not.toHaveBeenCalled()
  })

  it('5. estados vazios e somente-leitura estritos: sem botões de publicação ou edição', () => {
    const emptyInterp = buildRegulacaoInterpretation([], 'Mariana')
    render(
      <ProfessionalDimensionReportView
        interpretation={emptyInterp}
        responses={[]}
        participantName="Mariana"
      />,
    )

    expect(
      screen.getByText(/Esta interagente ainda não iniciou este capítulo\./i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /Publicar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Salvar/i })).toBeNull()
  })

  it('6. falha de carregamento oferece "Tentar novamente" seguro', async () => {
    const user = userEvent.setup()
    const onRetryMock = vi.fn()

    render(
      <ProfessionalMindEmotionsView
        responses={[]}
        participantName="Mariana"
        loadError={true}
        onRetryLoad={onRetryMock}
      />,
    )

    expect(screen.getByText(/Não foi possível carregar as respostas agora\./i)).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i })
    await user.click(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })
})
