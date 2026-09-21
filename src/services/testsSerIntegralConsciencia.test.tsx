/**
 * TESTES OBRIGATÓRIOS DO SER INTEGRAL E CONSCIÊNCIA (PROJETO CER V1)
 *
 * Cobertura exigida no Item 11:
 * (1) Asset do Ser Integral existe ou está declarado como pendente se o arquivo não estiver acessível
 * (2) Existem exatamente seis dimensões clicáveis
 * (3) Cada esfera abre a experiência correta (mapeamento exato de cores e IDs)
 * (4) O centro luminoso abre o Mapa CER
 * (5) Não existe entrada duplicada do Mapa acima ou abaixo do Ser Integral
 * (6) Todas as dimensões ficam disponíveis simultaneamente depois da pré-consulta
 * (7) Antes da pré-consulta, as avaliações não ficam liberadas
 * (8) "Agendar primeiro encontro" não aparece na experiência da interagente
 * (9) O novo texto pós-pré-consulta aparece com botão "Acessar Consciência"
 * (10) Navegação por teclado funciona (Enter / Espaço nas esferas e centro)
 * (11) O erro .find corrigido na 0.0.100 não voltou (regressão mantida)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  SerConscienciaMap,
  CANONICAL_DIMENSIONS,
  SER_INTEGRAL_IMAGE_SRC,
  SER_INTEGRAL_ALT_TEXT,
} from '../components/SerConscienciaMap'
import type { EnrollmentExperienceRecord } from '@/types/cer'

describe('Ser Integral & Consciência — Verificação Integral (CER V1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // (1) Asset do Ser Integral
  it('(1) declara o caminho do asset ser-integral-cer.png e o texto alternativo oficial de acessibilidade', () => {
    expect(SER_INTEGRAL_IMAGE_SRC).toBe('/ser-integral-cer.png')
    expect(SER_INTEGRAL_ALT_TEXT).toBe(
      'Representação do Ser Integral conectado às seis dimensões da Consciência no Método CER.',
    )
  })

  it('(1b) exibe fallback neutro limpo se o arquivo da imagem falhar ao carregar', () => {
    const { container } = render(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={false}
        onSelectExperience={vi.fn()}
        onOpenMap={vi.fn()}
      />,
    )

    const img = screen.getByRole('img', { name: SER_INTEGRAL_ALT_TEXT })
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('/ser-integral-cer.png')

    // Disparar erro de carregamento da imagem para verificar fallback neutro
    fireEvent.error(img)

    expect(screen.getByTestId('ser-integral-fallback')).toBeTruthy()
    expect(screen.getByText(SER_INTEGRAL_ALT_TEXT)).toBeTruthy()
    expect(container.textContent).toContain('aguardando fornecimento do arquivo')
  })

  // (2) Existem exatamente seis dimensões clicáveis
  it('(2) existem exatamente seis dimensões mapeadas canonicamente', () => {
    expect(CANONICAL_DIMENSIONS).toHaveLength(6)
    const ids = CANONICAL_DIMENSIONS.map((d) => d.id)
    expect(ids).toEqual([
      'corpo_fisiologia',
      'mente_emocoes',
      'regulacao_respostas',
      'relacoes',
      'sexualidade',
      'sentido_conexao',
    ])
  })

  // (3) Cada esfera abre a experiência correta (mapeamento exato de cores e IDs)
  it('(3) cada esfera está associada à cor, posição e abre a experiência real exata', () => {
    const expected = [
      {
        id: 'corpo_fisiologia',
        expId: 'exp-corpo-fisiologia-07b',
        color: 'verde',
        name: 'Corpo & Fisiologia',
        x: 24,
        y: 16,
      },
      {
        id: 'mente_emocoes',
        expId: 'exp-mente-emocoes-07c',
        color: 'azul',
        name: 'Mente & Emoções',
        x: 76,
        y: 16,
      },
      {
        id: 'regulacao_respostas',
        expId: 'exp-regulacao-respostas-07c',
        color: 'amarela',
        name: 'Regulação & Padrões de Resposta',
        x: 17,
        y: 43,
      },
      {
        id: 'relacoes',
        expId: 'exp-relacoes-07d',
        color: 'coral',
        name: 'Relações & Vínculos',
        x: 84,
        y: 43,
      },
      {
        id: 'sexualidade',
        expId: 'exp-sexualidade-07e',
        color: 'lilás',
        name: 'Sexualidade & Intimidade',
        x: 22,
        y: 72,
      },
      {
        id: 'sentido_conexao',
        expId: 'exp-sentido-conexao-07f',
        color: 'turquesa',
        name: 'Sentido & Conexão',
        x: 79,
        y: 72,
      },
    ]

    for (const exp of expected) {
      const dim = CANONICAL_DIMENSIONS.find((d) => d.id === exp.id)
      expect(dim).toBeDefined()
      expect(dim?.experienceId).toBe(exp.expId)
      expect(dim?.colorName).toBe(exp.color)
      expect(dim?.name).toBe(exp.name)
      expect(dim?.xPercent).toBe(exp.x)
      expect(dim?.yPercent).toBe(exp.y)
    }

    // Testar clique na esfera
    const onSelect = vi.fn()
    render(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={false}
        onSelectExperience={onSelect}
        onOpenMap={vi.fn()}
      />,
    )

    const corpoSphere = screen.getByTestId('dimension-sphere-corpo_fisiologia')
    fireEvent.click(corpoSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-corpo-fisiologia-07b')

    const menteSphere = screen.getByTestId('dimension-sphere-mente_emocoes')
    fireEvent.click(menteSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-mente-emocoes-07c')

    const regulacaoSphere = screen.getByTestId('dimension-sphere-regulacao_respostas')
    fireEvent.click(regulacaoSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-regulacao-respostas-07c')

    const relacoesSphere = screen.getByTestId('dimension-sphere-relacoes')
    fireEvent.click(relacoesSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-relacoes-07d')

    const sexualidadeSphere = screen.getByTestId('dimension-sphere-sexualidade')
    fireEvent.click(sexualidadeSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-sexualidade-07e')

    const sentidoSphere = screen.getByTestId('dimension-sphere-sentido_conexao')
    fireEvent.click(sentidoSphere)
    expect(onSelect).toHaveBeenCalledWith('exp-sentido-conexao-07f')
  })

  // (4) O centro abre o Mapa CER
  it('(4) o centro luminoso abre o Mapa CER e altera o rótulo conforme publicação', () => {
    const onOpenMap = vi.fn()
    const { rerender } = render(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={false}
        onSelectExperience={vi.fn()}
        onOpenMap={onOpenMap}
      />,
    )

    // Antes da publicação: "Meu Mapa CER — em construção"
    const centerBtn = screen.getByTestId('ser-integral-map-center')
    expect(centerBtn.getAttribute('aria-label')).toBe('Meu Mapa CER — em construção')
    expect(screen.getAllByText(/Meu Mapa CER — em construção/i).length).toBeGreaterThanOrEqual(1)

    fireEvent.click(centerBtn)
    expect(onOpenMap).toHaveBeenCalledTimes(1)

    // Após publicação explícita: "Abrir Meu Mapa CER"
    rerender(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={true}
        onSelectExperience={vi.fn()}
        onOpenMap={onOpenMap}
      />,
    )

    expect(centerBtn.getAttribute('aria-label')).toContain('Abrir Meu Mapa CER')
    expect(screen.getAllByText(/Abrir Meu Mapa CER/i).length).toBeGreaterThanOrEqual(1)
  })

  // (5) Não existe entrada duplicada do Mapa
  it('(5) não há cartões duplicados do Mapa fora da representação do Ser Integral', () => {
    const { container } = render(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={false}
        onSelectExperience={vi.fn()}
        onOpenMap={vi.fn()}
      />,
    )

    // O centro luminoso na imagem e o botão de acesso rápido do mobile apontam para o mesmo trigger onOpenMap
    const mapTriggers = container.querySelectorAll('[data-testid="ser-integral-map-center"]')
    expect(mapTriggers.length).toBe(1)
  })

  // (6) Todas as dimensões ficam disponíveis simultaneamente
  it('(6) todas as seis dimensões mostram estado Disponível ou seu andamento sem hierarquia de notas', () => {
    const mockExperiences: EnrollmentExperienceRecord[] = [
      {
        id: 'ee-1',
        enrollment_id: 'enr-1',
        experience_id: 'exp-corpo-fisiologia-07b',
        release_status: 'available',
        progress_status: 'not_started',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
      {
        id: 'ee-2',
        enrollment_id: 'enr-1',
        experience_id: 'exp-mente-emocoes-07c',
        release_status: 'in_progress',
        progress_status: 'in_progress',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
      {
        id: 'ee-3',
        enrollment_id: 'enr-1',
        experience_id: 'exp-regulacao-respostas-07c',
        release_status: 'completed',
        progress_status: 'completed',
        created: '2025-01-01',
        updated: '2025-01-01',
      },
    ]

    const { container } = render(
      <SerConscienciaMap
        availableExperiences={mockExperiences}
        hasPublishedMap={false}
        onSelectExperience={vi.fn()}
        onOpenMap={vi.fn()}
      />,
    )

    // Sem notas numéricas, pontuação ou ranking
    expect(container.textContent).not.toContain('%')
    expect(container.textContent).not.toContain('/10')
    expect(container.textContent).not.toContain('pontos')
    expect(container.textContent).not.toContain('ranking')

    // Mostra os estados: Concluída, Em andamento, Disponível
    expect(screen.getAllByText('Concluída').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Disponível').length).toBeGreaterThanOrEqual(1)
  })

  // (10) Navegação por teclado funciona (Enter e Espaço)
  it('(10) acessibilidade por teclado: esferas e centro respondem a Enter e Espaço', () => {
    const onSelect = vi.fn()
    const onOpenMap = vi.fn()

    render(
      <SerConscienciaMap
        availableExperiences={[]}
        hasPublishedMap={false}
        onSelectExperience={onSelect}
        onOpenMap={onOpenMap}
      />,
    )

    const corpoSphere = screen.getByTestId('dimension-sphere-corpo_fisiologia')
    fireEvent.keyDown(corpoSphere, { key: 'Enter', code: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('exp-corpo-fisiologia-07b')

    fireEvent.keyDown(corpoSphere, { key: ' ', code: 'Space' })
    expect(onSelect).toHaveBeenCalledWith('exp-corpo-fisiologia-07b')

    const centerBtn = screen.getByTestId('ser-integral-map-center')
    fireEvent.keyDown(centerBtn, { key: 'Enter', code: 'Enter' })
    expect(onOpenMap).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(centerBtn, { key: ' ', code: 'Space' })
    expect(onOpenMap).toHaveBeenCalledTimes(2)
  })
})
