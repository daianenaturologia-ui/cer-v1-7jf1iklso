import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ExperienceEngine } from '@/components/experience/ExperienceEngine'
import { ProtectionPatternsChart } from '@/components/experience/ProtectionPatternsChart'
import { ExperienceResponseRecord } from '@/types/cer'
import { CER_PROTECTION_PATTERNS } from '@/services/cerProtectionPatterns'
import { enrollmentExperienceService } from '@/services/experienceEngine'
import pb from '@/lib/pocketbase/client'

describe('CER — Camada 2A: Integração do Gráfico de Padrões de Proteção', () => {
  const p7aMockResponse: ExperienceResponseRecord = {
    id: 'resp-p7a',
    enrollment_id: 'enr-demo',
    experience_id: 'exp-mente-emocoes-07c',
    respondent_user_id: 'user-demo',
    prompt_id: 'p-07c-pm3-p7a-movimentos-1-5',
    response_type: 'MultiSelectCards',
    structured_value: {
      cartao_1_fazer_certo: 'Frequentemente',
      cartao_2_cuidar_pessoas: 'Em algumas situações',
      cartao_3_produtividade_conquistas: 'Quase nunca',
      cartao_4_perder_sensacao_escolha: 'Com força sob pressão',
      cartao_5_compreender_pela_razao: 'Não sei identificar',
    },
    free_text: '',
    access_class: 'participant_shared',
    prompt_version: 2,
    version: 1,
    status: 'saved',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  const p7bMockResponse: ExperienceResponseRecord = {
    id: 'resp-p7b',
    enrollment_id: 'enr-demo',
    experience_id: 'exp-mente-emocoes-07c',
    respondent_user_id: 'user-demo',
    prompt_id: 'p-07c-pm3-p7b-movimentos-6-10',
    response_type: 'MultiSelectCards',
    structured_value: {
      cartao_6_antecipar_riscos: 'Frequentemente',
      cartao_7_novos_estimulos: 'Em algumas situações',
      cartao_8_assumir_controle: 'Quase nunca',
      cartao_9_evitar_desconfortos: 'Com força sob pressão',
      cartao_10_cobrar_e_criticar: 'Frequentemente',
    },
    free_text: '',
    access_class: 'participant_shared',
    prompt_version: 2,
    version: 1,
    status: 'saved',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  const p8MockResponse: ExperienceResponseRecord = {
    id: 'resp-p8',
    enrollment_id: 'enr-demo',
    experience_id: 'exp-mente-emocoes-07c',
    respondent_user_id: 'user-demo',
    prompt_id: 'p-07c-pm3-p8-interferencia-movimentos',
    response_type: 'MultiSelectCards',
    structured_value: ['cartao_1_fazer_certo', 'cartao_10_cobrar_e_criticar'],
    free_text: '',
    access_class: 'participant_shared',
    prompt_version: 2,
    version: 1,
    status: 'saved',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. renderiza os 10 padrões canônicos mesmo sem respostas ("Não sei identificar")', () => {
    render(<ProtectionPatternsChart p7Responses={{}} p8InterferingIds={[]} />)

    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()
    // 10 padrões canônicos aparecem
    const canonicalKeys = [
      'insistente',
      'prestativo',
      'hiper_realizador',
      'vitima',
      'hiper_racional',
      'hipervigilante',
      'inquieto',
      'comandante',
      'evitativo',
      'critico',
    ]
    for (const key of canonicalKeys) {
      const def = CER_PROTECTION_PATTERNS[key]
      expect(screen.getAllByText(new RegExp(def.baseName, 'i')).length).toBeGreaterThan(0)
    }
  })

  it('2. escolhas da Pergunta 8 recebem o destaque "Mais interferente"', () => {
    render(
      <ProtectionPatternsChart
        p7Responses={{
          cartao_1_fazer_certo: 'Frequentemente',
          cartao_10_cobrar_e_criticar: 'Frequentemente',
        }}
        p8InterferingIds={['cartao_1_fazer_certo', 'cartao_10_cobrar_e_criticar']}
      />,
    )

    const badges = screen.getAllByText('Mais interferente')
    expect(badges.length).toBe(2)
  })

  it('3. botão aparece no encerramento de Mente & Emoções com o rótulo EXATO e abre/fecha o gráfico', async () => {
    // Simular enrollment completed para abrir direto no closing
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'enr-exp-completed',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      progress_status: 'completed',
      release_status: 'completed',
      current_step_order: 13,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={[p7aMockResponse, p7bMockResponse, p8MockResponse]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Momento Concluído')).toBeTruthy()
    })

    // Botão com o rótulo EXATO
    const btn = screen.getByRole('button', { name: /Ver meus padrões de funcionamento/i })
    expect(btn).toBeTruthy()

    // O gráfico NÃO está aberto inicialmente
    expect(screen.queryByText('Seus padrões de funcionamento')).toBeNull()

    // Clicar abre o gráfico
    fireEvent.click(btn)
    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()

    // Respostas de P7a/P7b e P8 chegam ao gráfico
    const highlights = screen.getAllByText('Mais interferente')
    expect(highlights.length).toBe(2)

    // Fechar pelo botão X do gráfico
    const closeBtn = screen.getByRole('button', {
      name: /Fechar gráfico de padrões de funcionamento/i,
    })
    fireEvent.click(closeBtn)
    expect(screen.queryByText('Seus padrões de funcionamento')).toBeNull()

    // Reabrir pelo botão do encerramento funciona
    fireEvent.click(screen.getByRole('button', { name: /Ver meus padrões de funcionamento/i }))
    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()
  })

  it('4. botão NÃO aparece no encerramento de outra experiência (ex.: Corpo & Fisiologia)', async () => {
    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'enr-exp-corpo-completed',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-corpo-fisiologia-07b',
      progress_status: 'completed',
      release_status: 'completed',
      current_step_order: 10,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-corpo-fisiologia-07b"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Momento Concluído')).toBeTruthy()
    })

    expect(screen.queryByRole('button', { name: /Ver meus padrões de funcionamento/i })).toBeNull()
  })

  it('5. abrir o gráfico NÃO realiza chamadas ao PocketBase nem altera respostas', async () => {
    const pbSpy = vi.spyOn(pb, 'collection')

    vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({
      id: 'enr-exp-completed',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      progress_status: 'completed',
      release_status: 'completed',
      current_step_order: 13,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as any)

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={[p7aMockResponse, p7bMockResponse, p8MockResponse]}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Momento Concluído')).toBeTruthy()
    })

    const callsBefore = pbSpy.mock.calls.length
    const btn = screen.getByRole('button', { name: /Ver meus padrões de funcionamento/i })
    fireEvent.click(btn)

    // Aberto
    expect(screen.getByText('Seus padrões de funcionamento')).toBeTruthy()
    const callsAfter = pbSpy.mock.calls.length

    // Zero chamadas adicionadas
    expect(callsAfter).toBe(callsBefore)
  })
})
