import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LifeJourney } from './LifeJourney'
vi.mock('./LifeTimeline', () => ({LifeTimeline: () => <div>Minha história desde o nascimento</div>}))
vi.mock('./LifeDirections', () => ({LifeDirections: ({perspective}: any) => <div>Perspectiva: {perspective}</div>}))
it('entra no passado e mantém objetivo combinado consultável no presente', async () => {
  render(<LifeJourney enrollmentId="enr" unlocked objective={{title:'Nosso foco', summary:'Cuidar do descanso'}} />)
  expect(screen.getByRole('tab', {name:'Passado'})).toHaveAttribute('data-state','active')
  expect(screen.getByText('Minha história desde o nascimento')).toBeInTheDocument()
  expect(screen.queryByText('Perspectiva: future')).toBeNull()
  await userEvent.click(screen.getByRole('tab', {name:'Presente'}))
  await userEvent.click(screen.getByText('Objetivo terapêutico combinado'))
  expect(screen.getByText('Cuidar do descanso')).toBeInTheDocument()
  expect(screen.getByText(/definido e alterado junto com sua profissional/)).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).toBeNull()
  await userEvent.click(screen.getByRole('tab', {name:'Futuro'}))
  expect(screen.getByText('Perspectiva: future')).toBeInTheDocument()
})
