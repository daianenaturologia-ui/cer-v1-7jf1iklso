// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { ProfessionalConscienciaSection } from './ProfessionalConscienciaSection'
import { demoAdapter, DEMO_ENROLLMENT } from '@/services/demoAdapter'

describe('Navegação profissional da Consciência', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('abre Corpo & Fisiologia a partir da lista compacta e mantém o Mapa separado', async () => {
    demoAdapter.enableDemo('daiane')
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => callback(0))
    Element.prototype.scrollIntoView = vi.fn()
    const user = userEvent.setup()

    render(
      <ProfessionalConscienciaSection enrollment={DEMO_ENROLLMENT} participantName="Mariana" />,
    )

    expect(screen.getByRole('heading', { name: 'Consciência de Mariana' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fechar mapa' })).toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'Ver respostas' })[0])

    expect(screen.getAllByRole('heading', { name: 'Corpo & Fisiologia' }).length).toBeGreaterThan(1)
    expect(screen.getAllByText(/Capítulo 1 — Minha estrutura/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Capítulo 2 — O ritmo do meu corpo/i).length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', { name: 'Mapa e interpretação profissional' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mapa Integrativo Profissional da Consciência')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Ver respostas' })[1])
    expect(screen.queryByText(/Capítulo 1 — Minha estrutura/i)).toBeNull()
    expect(
      (await screen.findAllByText('Esta interagente ainda não iniciou este capítulo.'))[0],
    ).toBeInTheDocument()
  })
})
