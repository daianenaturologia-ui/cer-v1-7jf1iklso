// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CANONICAL_DIMENSIONS, SerConscienciaMap } from './SerConscienciaMap'
import type { EnrollmentExperienceRecord } from '@/types/cer'
afterEach(cleanup)
it('sugere a dimensão seguinte, prioriza a pausada e não pede para reiniciar após concluir', () => {
  const onSelectExperience = vi.fn()
  const props = { hasPublishedMap: false, onSelectExperience, onOpenMap: vi.fn() }
  const records = CANONICAL_DIMENSIONS.map((d, index) => ({
    experience_id: d.experienceId,
    release_status: 'available',
    progress_status: index < 4 ? 'completed' : 'not_started',
  })) as EnrollmentExperienceRecord[]
  const view = render(<SerConscienciaMap {...props} availableExperiences={records} />)
  fireEvent.click(screen.getByRole('button', { name: 'Abrir Sexualidade & Intimidade' }))
  expect(onSelectExperience).toHaveBeenLastCalledWith('exp-sexualidade-07e')
  const paused = records.map((r) =>
    r.experience_id === 'exp-sentido-conexao-07f'
      ? { ...r, progress_status: 'in_progress' as const }
      : r,
  )
  view.rerender(<SerConscienciaMap {...props} availableExperiences={paused} />)
  fireEvent.click(screen.getByRole('button', { name: 'Retomar Sentido & Conexão' }))
  expect(onSelectExperience).toHaveBeenLastCalledWith('exp-sentido-conexao-07f')
  view.rerender(
    <SerConscienciaMap
      {...props}
      availableExperiences={records.map((r) => ({ ...r, progress_status: 'completed' }))}
    />,
  )
  expect(screen.getByText('As seis dimensões estão concluídas')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^Abrir Corpo/ })).toBeNull()
})
