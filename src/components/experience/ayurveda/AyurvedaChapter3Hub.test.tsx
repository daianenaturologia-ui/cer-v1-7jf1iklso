// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import userEvent from '@testing-library/user-event'
import { AyurvedaChaptersHub } from './AyurvedaChaptersHub'

describe('Hub — liberação do Capítulo 3', () => {
  afterEach(cleanup)

  it('mantém o Capítulo 3 bloqueado antes da conclusão do Capítulo 2', () => {
    render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        chapter2Status="in_progress"
        chapter3Status="not_started"
      />,
    )
    expect(screen.getByText(/Conclua o Capítulo 2 para liberar este capítulo/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Começar Capítulo 3/i })).toBeNull()
  })

  it('libera uma ação clara quando o Capítulo 2 foi concluído', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        chapter2Status="completed"
        chapter3Status="not_started"
        onStartChapter3={onStart}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Começar Capítulo 3/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('libera a síntese somente depois da conclusão do Capítulo 3', async () => {
    const user = userEvent.setup()
    const onStartChapter4 = vi.fn()
    const { rerender } = render(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        chapter2Status="completed"
        chapter3Status="in_progress"
        onStartChapter4={onStartChapter4}
      />,
    )
    expect(screen.getByText(/Conclua o Capítulo 3 para liberar sua síntese/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver minha síntese/i })).toBeNull()

    rerender(
      <AyurvedaChaptersHub
        chapter1Status="completed"
        chapter2Status="completed"
        chapter3Status="completed"
        onStartChapter4={onStartChapter4}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Ver minha síntese/i }))
    expect(onStartChapter4).toHaveBeenCalledTimes(1)
  })
})
