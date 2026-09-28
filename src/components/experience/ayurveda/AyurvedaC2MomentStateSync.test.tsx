// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { AyurvedaC2Momento1Hunger } from './AyurvedaC2Momento1Hunger'

describe('Capítulo 2 — sincronização das respostas carregadas', () => {
  it('preenche os cartões quando a revisão ativa chega após a primeira montagem', () => {
    const props = {
      onSaveHungerPattern: vi.fn(),
      onSaveDelayedMeal: vi.fn(),
    }
    const { rerender } = render(<AyurvedaC2Momento1Hunger {...props} />)

    expect(screen.getAllByText(/0\/2/)).toHaveLength(2)

    rerender(
      <AyurvedaC2Momento1Hunger
        {...props}
        hungerPatternChoices={['regular_hours']}
        delayedMealChoices={['can_wait']}
      />,
    )

    expect(screen.getAllByText(/1\/2/)).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: /horários relativamente previsíveis/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
