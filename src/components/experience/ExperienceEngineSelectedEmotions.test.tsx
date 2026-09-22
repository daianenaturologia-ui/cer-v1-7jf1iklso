import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ExperienceEngine,
  EMOTION_ID_TO_LABEL,
  formatSelectedEmotionsPhrase,
} from '@/components/experience/ExperienceEngine'
import { BUILD_07C_MENTE_PROMPTS } from '@/services/build07cPrompts'
import { ExperienceResponseRecord } from '@/types/cer'
import React from 'react'

describe('Pergunta 3 de Mente & Emoções — Resolução Dinâmica de Emoções Selecionadas', () => {
  it('mapeia corretamente todos os IDs canônicos para seus rótulos humanos', () => {
    expect(EMOTION_ID_TO_LABEL['medo']).toBe('medo')
    expect(EMOTION_ID_TO_LABEL['ansiedade_apreensao']).toBe('ansiedade ou apreensão')
    expect(EMOTION_ID_TO_LABEL['tristeza']).toBe('tristeza')
    expect(EMOTION_ID_TO_LABEL['apatia_desanimo']).toBe('apatia ou desânimo')
    expect(EMOTION_ID_TO_LABEL['raiva']).toBe('raiva')
    expect(EMOTION_ID_TO_LABEL['alegria']).toBe('alegria')
    expect(EMOTION_ID_TO_LABEL['calma']).toBe('calma')
    expect(EMOTION_ID_TO_LABEL['culpa']).toBe('culpa')
    expect(EMOTION_ID_TO_LABEL['vergonha']).toBe('vergonha')
  })

  it('formata frase exata para 1 escolha: "Você selecionou: ansiedade ou apreensão."', () => {
    const phrase = formatSelectedEmotionsPhrase(['ansiedade ou apreensão'])
    expect(phrase).toBe('Você selecionou: ansiedade ou apreensão.')
  })

  it('formata frase exata para 2 escolhas: "Você selecionou: ansiedade ou apreensão e tristeza."', () => {
    const phrase = formatSelectedEmotionsPhrase(['ansiedade ou apreensão', 'tristeza'])
    expect(phrase).toBe('Você selecionou: ansiedade ou apreensão e tristeza.')
  })

  it('formata frase exata para 3 escolhas: "Você selecionou: ansiedade ou apreensão, tristeza e raiva."', () => {
    const phrase = formatSelectedEmotionsPhrase(['ansiedade ou apreensão', 'tristeza', 'raiva'])
    expect(phrase).toBe('Você selecionou: ansiedade ou apreensão, tristeza e raiva.')
  })

  it('formata frase exata para 4 escolhas: "Você selecionou: medo, ansiedade ou apreensão, tristeza e raiva."', () => {
    const phrase = formatSelectedEmotionsPhrase([
      'medo',
      'ansiedade ou apreensão',
      'tristeza',
      'raiva',
    ])
    expect(phrase).toBe('Você selecionou: medo, ansiedade ou apreensão, tristeza e raiva.')
  })

  it('trata outra_emocao com o texto digitado livremente', () => {
    const phrase = formatSelectedEmotionsPhrase(['ansiedade ou apreensão', 'angústia no peito'])
    expect(phrase).toBe('Você selecionou: ansiedade ou apreensão e angústia no peito.')
  })

  it('retorna string vazia quando não há escolhas disponíveis', () => {
    expect(formatSelectedEmotionsPhrase([])).toBe('')
    expect(formatSelectedEmotionsPhrase(['   '])).toBe('')
  })

  it('renderiza dinamicamente na P3 em tempo de render com 1 escolha', () => {
    const mockP2Response: ExperienceResponseRecord = {
      id: 'resp-p2',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: 'user-demo',
      prompt_id: 'p-07c-pm1-p2-emocoes-recorrentes',
      response_type: 'MultiSelectCards',
      structured_value: ['ansiedade_apreensao'],
      free_text: '',
      access_class: 'participant_shared',
      prompt_version: 2,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={[mockP2Response]}
      />,
    )

    // O ExperienceEngine avança ou renderiza os prompts de BUILD_07C
    // Verificamos a presença de "Você selecionou: <rótulos>" e ausência de IDs internos ou marcador cru
    const containerText = document.body.textContent || ''
    expect(containerText).toContain('Você selecionou: ansiedade ou apreensão.')
    expect(containerText).not.toContain('ansiedade_apreensao')
    expect(containerText).not.toContain('apatia_desanimo')
    expect(containerText).not.toContain('{{emocoes_selecionadas}}')
  })

  it('afirma que nenhum {{emocoes_selecionadas}} cru permanece no DOM na P3 e na P4', () => {
    const mockP2Response: ExperienceResponseRecord = {
      id: 'resp-p2',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: 'user-demo',
      prompt_id: 'p-07c-pm1-p2-emocoes-recorrentes',
      response_type: 'MultiSelectCards',
      structured_value: ['medo', 'raiva'],
      free_text: '',
      access_class: 'participant_shared',
      prompt_version: 2,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const mockP3Response: ExperienceResponseRecord = {
      id: 'resp-p3',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: 'user-demo',
      prompt_id: 'p-07c-pm1-p3-por-que-se-sente-assim',
      response_type: 'FreeReflection',
      structured_value: { value: 'Texto de teste' },
      free_text: 'Texto de teste',
      access_class: 'participant_shared',
      prompt_version: 2,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={[mockP2Response, mockP3Response]}
      />,
    )

    const containerText = document.body.textContent || ''
    expect(containerText).not.toContain('{{emocoes_selecionadas}}')
    // Na P4 ou em qualquer tela, o marcador foi substituído pelo texto das emoções
    expect(containerText).toContain('medo, raiva')
  })

  it('normaliza a frase sem vírgula órfã nem marcador quando não há emoções selecionadas', () => {
    const mockP2ResponsePrefiroNao: ExperienceResponseRecord = {
      id: 'resp-p2-skip',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: 'user-demo',
      prompt_id: 'p-07c-pm1-p2-emocoes-recorrentes',
      response_type: 'MultiSelectCards',
      structured_value: { skip_reason: 'prefiro_nao_responder' },
      free_text: 'Prefiro não responder',
      access_class: 'participant_shared',
      prompt_version: 2,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    const mockP3Response: ExperienceResponseRecord = {
      id: 'resp-p3',
      enrollment_id: 'enr-demo',
      experience_id: 'exp-mente-emocoes-07c',
      respondent_user_id: 'user-demo',
      prompt_id: 'p-07c-pm1-p3-por-que-se-sente-assim',
      response_type: 'FreeReflection',
      structured_value: { value: 'Texto' },
      free_text: 'Texto',
      access_class: 'participant_shared',
      prompt_version: 2,
      version: 1,
      status: 'saved',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    render(
      <ExperienceEngine
        experienceId="exp-mente-emocoes-07c"
        enrollmentId="enr-demo"
        respondentUserId="user-demo"
        initialResponses={[mockP2ResponsePrefiroNao, mockP3Response]}
      />,
    )

    const containerText = document.body.textContent || ''
    expect(containerText).not.toContain('{{emocoes_selecionadas}}')
    expect(containerText).not.toContain('Ao sentir ,')
    expect(containerText).not.toContain(' ,')
    expect(containerText).not.toContain('  ')
  })
})
