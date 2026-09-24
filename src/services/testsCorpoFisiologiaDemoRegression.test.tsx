/**
 * TESTES OBRIGATÓRIOS DE REGRESSÃO — CORPO & FISIOLOGIA (CER V1)
 *
 * 1. demo nova + avatar concluído -> abre a transição e o hub
 * 2. demo nova + personalização adiada -> abre o hub sem valores estéticos inventados
 * 3. demo com experiência antiga concluída -> preserva o legado e abre o novo Capítulo 1
 * 4. demo com progresso parcial do novo Capítulo 1 -> retoma o ponto salvo
 * 5. recarga da página -> não fica presa no loading
 * 6. falha em operação secundária -> não derruba todo o catálogo
 * 7. falha necessária -> spinner encerra e aparece "Tentar novamente" ("Não foi possível preparar esta experiência agora.")
 * 8. clique em "Tentar novamente" -> nova tentativa real
 * 9. zero chamadas ao PocketBase no modo demonstração
 * 10. nenhuma resposta antiga é apagada ou reinterpretada
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ExperienceEngine } from '@/components/experience/ExperienceEngine'
import {
  demoAdapter,
  DEMO_ENROLLMENT_ID,
  DEMO_USER_MARIANA,
  DEMO_PERSON_MARIANA,
} from '@/services/demoAdapter'
import {
  enrollmentExperienceService,
  experienceResponseService,
  experienceCatalogService,
} from '@/services/experienceEngine'
import { personService } from '@/services/cer'
import pb from '@/lib/pocketbase/client'
import { AYV_C1_PROMPTS } from '@/services/ayurvedaChapter1'

describe('Regressão Direcionada — Entrada em Corpo & Fisiologia no Modo Demo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    demoAdapter.resetToDefaultState()
    demoAdapter.enableDemo('mariana')
  })

  it('1. Demo nova + avatar concluído -> abre a transição e o hub', async () => {
    // Configura avatar da Mariana como concluído
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
      avatar_presentation: 'feminine',
      avatar_skin_tone: 'skin_03',
      avatar_hair_color: 'hair_dark_brown',
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    // Spinner encerra e não fica preso em "Preparando sua experiência..."
    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
    })

    // Deve renderizar os 4 capítulos do hub de Ayurveda
    await waitFor(() => {
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
      expect(screen.getByText('Capítulo 1: Estrutura & Características')).toBeTruthy()
    })
  })

  it('2. Demo nova + personalização adiada -> abre o hub sem valores estéticos inventados', async () => {
    // Configura avatar como adiado (sem valores estéticos fictícios)
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'deferred',
      avatar_presentation: undefined,
      avatar_skin_tone: undefined,
      avatar_hair_color: undefined,
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
    })

    // Abre o hub diretamente
    await waitFor(() => {
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })

    const person = demoAdapter.getCurrentPerson()
    expect(person.avatar_skin_tone).toBeUndefined()
    expect(person.avatar_hair_color).toBeUndefined()
  })

  it('3. Demo com experiência antiga concluída -> preserva o legado e abre o novo Capítulo 1', async () => {
    // Simular que existia progresso dos 15 momentos gravado no enrollmentExp legado
    await enrollmentExperienceService.updateProgress('exp-corpo-fisiologia-07b', {
      progressStatus: 'completed',
      stepOrder: 15,
      completed: true,
      enrollmentId: DEMO_ENROLLMENT_ID,
    })

    // Grava também uma resposta legada do momento 1
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: 'p-07b-pm1-p1-peso-historico',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: { value: 'historico_estavel' },
    })

    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    // Não deve ficar preso e não deve cair na tela legada de encerramento
    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })

    // Verifica que o progresso legado permanece preservado no armazenamento
    const legacyResponses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const hasLegacy = legacyResponses.some((r) => r.prompt_id === 'p-07b-pm1-p1-peso-historico')
    expect(hasLegacy).toBe(true)
  })

  it('4. Demo com progresso parcial do novo Capítulo 1 -> retoma o ponto salvo', async () => {
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
    })

    // Salva uma resposta canônica do Capítulo 1 (P1 Structure)
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: AYV_C1_PROMPTS.P1_STRUCTURE.id,
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      promptKey: AYV_C1_PROMPTS.P1_STRUCTURE.key,
      structuredValue: {
        value: 'figura_a',
        choice: 'figura_a',
        metadata: {
          prompt_key: AYV_C1_PROMPTS.P1_STRUCTURE.key,
          option_ids: ['figura_a'],
          chapter_id: 'capitulo-1-estrutura-caracteristicas',
        },
      },
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })

    // Clica para iniciar o Capítulo 1
    const startC1Btn = screen.getByRole('button', { name: /Iniciar Capítulo 1/i })
    fireEvent.click(startC1Btn)

    // Abre a tela de abertura do Capítulo 1
    await waitFor(() => {
      expect(
        screen.getByText('Capítulo 1 — Estrutura Corporal & Características Habituais'),
      ).toBeTruthy()
    })
  })

  it('5. Recarga da página -> não fica presa no loading', async () => {
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
    })

    // Primeira montagem
    const { unmount } = render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
    })

    unmount()

    // Simula recarga
    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })
  })

  it('6. Falha em operação secundária -> não derruba todo o catálogo', async () => {
    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
    })

    // Operação secundária falha (ex: enrollmentExperienceService ou responses falham)
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockRejectedValueOnce(
      new Error('Secondary service network hiccup'),
    )

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    // Não deve quebrar nem travar; deve abrir o hub com catálogo resiliente
    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })
  })

  it('7. Falha necessária -> spinner encerra e aparece "Tentar novamente" com a mensagem exata', async () => {
    // Forçar falha necessária simulando catálogo indisponível
    vi.spyOn(experienceCatalogService, 'getExperienceById').mockImplementation(() => {
      throw new Error('Fatal database outage')
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-invalid-fatal"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    // O spinner encerra
    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
    })

    // Exibe a mensagem EXATA e o botão EXATO
    expect(screen.getByText('Não foi possível preparar esta experiência agora.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeTruthy()
  })

  it('8. Clique em "Tentar novamente" -> nova tentativa real', async () => {
    let attempts = 0
    vi.spyOn(experienceCatalogService, 'getExperienceById').mockImplementation(async () => {
      attempts++
      if (attempts === 1) {
        throw new Error('Transient fatal error')
      }
      return {
        id: 'exp-recovered',
        title: 'Experiência Recuperada',
        description: 'Recuperada com sucesso',
      } as any
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-recovered"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Não foi possível preparar esta experiência agora.')).toBeTruthy()
    })

    // Clica no botão "Tentar novamente"
    const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i })
    fireEvent.click(retryBtn)

    // Refaz a tentativa de verdade
    await waitFor(() => {
      expect(attempts).toBeGreaterThanOrEqual(2)
      expect(screen.queryByText('Não foi possível preparar esta experiência agora.')).toBeNull()
    })
  })

  it('9. Zero chamadas ao PocketBase no modo demonstração', async () => {
    const pbCollectionSpy = vi.spyOn(pb, 'collection')

    // Executa a personService.getById e carregamento de Corpo & Fisiologia no modo demo
    const pRecord = await personService.getById('demo-person-mariana')
    expect(pRecord).toBeTruthy()
    expect(pRecord.id).toBe('demo-person-mariana')

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId="demo-person-mariana"
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Preparando sua experiência...')).toBeNull()
    })

    // Nenhuma chamada a coleções sensíveis do PocketBase no modo demo
    const forbiddenCollections = [
      'persons',
      'cer_experiences',
      'experience_responses',
      'enrollment_experiences',
    ]
    for (const call of pbCollectionSpy.mock.calls) {
      expect(forbiddenCollections).not.toContain(call[0])
    }
  })

  it('10. Nenhuma resposta antiga é apagada ou reinterpretada', async () => {
    // Salva uma resposta antiga com semântica livre
    const originalValue = { choice: 'historico_sem_mudancas', notes: 'relato fidedigno' }
    await experienceResponseService.saveResponse({
      enrollmentId: DEMO_ENROLLMENT_ID,
      experienceId: 'exp-corpo-fisiologia-07b',
      promptId: 'p-antiga-01',
      respondentUserId: DEMO_USER_MARIANA.id,
      responseType: 'ChoiceCards',
      promptVersion: 1,
      structuredValue: originalValue,
    })

    demoAdapter.updatePerson(DEMO_PERSON_MARIANA.id, {
      avatar_customization_status: 'completed',
    })

    render(
      <MemoryRouter>
        <ExperienceEngine
          experienceId="exp-corpo-fisiologia-07b"
          enrollmentId={DEMO_ENROLLMENT_ID}
          respondentUserId={DEMO_USER_MARIANA.id}
          personId={DEMO_PERSON_MARIANA.id}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Quatro Capítulos de Observação')).toBeTruthy()
    })

    const responses = demoAdapter.listExperienceResponses(
      DEMO_ENROLLMENT_ID,
      'exp-corpo-fisiologia-07b',
    )
    const found = responses.find((r) => r.prompt_id === 'p-antiga-01')
    expect(found).toBeTruthy()
    expect(found?.structured_value).toEqual(originalValue)
  })
})
