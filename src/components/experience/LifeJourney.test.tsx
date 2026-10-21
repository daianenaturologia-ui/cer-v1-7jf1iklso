import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LifeJourney } from './LifeJourney'
vi.mock('./EvolutionMapConversation', () => ({
  EvolutionMapConversation: () => <div>Resumo breve e a mesma Linha da Vida</div>,
}))
vi.mock('./LifeTimeline', () => ({
  LifeTimeline: () => <div>Minha história desde o nascimento</div>,
}))
vi.mock('./LifeDirections', () => ({
  LifeDirections: ({ perspective, enableActions }: any) => (
    <div>
      Registros {perspective} {enableActions === false ? 'sem agenda' : ''}
    </div>
  ),
}))
it('conduz o passado de volta ao mapa antes de abrir presente e futuro', () => {
  const change = vi.fn(),
    openMap = vi.fn()
  const view = render(
    <LifeJourney enrollmentId="enr" unlocked onMomentChange={change} onOpenMap={openMap} />,
  )
  expect(screen.getByText('Minha história desde o nascimento')).toBeInTheDocument()
  expect(screen.queryByText('Registros present')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Continuar para História no Mapa CER' }))
  expect(change).toHaveBeenCalledWith('map')
  view.rerender(
    <LifeJourney
      enrollmentId="enr"
      unlocked
      moment="map"
      onMomentChange={change}
      onOpenMap={openMap}
    />,
  )
  expect(screen.getByText('Resumo breve e a mesma Linha da Vida')).toBeInTheDocument()
  expect(openMap).not.toHaveBeenCalled()
  expect(screen.queryByText('Registros present')).toBeNull()
})
it('separa presente e futuro e guarda ações para depois da conversa de cuidado', () => {
  const view = render(<LifeJourney enrollmentId="enr" unlocked moment="present" />)
  expect(screen.getByText('Registros present')).toBeInTheDocument()
  view.rerender(<LifeJourney enrollmentId="enr" unlocked moment="future" />)
  expect(screen.getByText('Registros future sem agenda')).toBeInTheDocument()
  expect(screen.queryByText('Registros present')).toBeNull()
  view.rerender(
    <LifeJourney
      enrollmentId="enr"
      unlocked
      moment="care"
      objective={{ title: 'Nosso foco', summary: 'Cuidar do descanso' }}
    />,
  )
  expect(screen.getByText('Cuidar do descanso')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Ir para Equilíbrio & Realização' }),
  ).toBeInTheDocument()
})
it('não inicia relato antes de concluir as seis dimensões', () => {
  render(<LifeJourney enrollmentId="enr" unlocked={false} />)
  expect(screen.queryByText('Minha história desde o nascimento')).toBeNull()
  expect(screen.queryByRole('button', { name: /Concluir o passado/ })).toBeNull()
})
it('os cinco atalhos abrem seus destinos e respeitam o bloqueio inicial', () => {
  const change = vi.fn(),
    map = vi.fn(),
    care = vi.fn()
  const view = render(
    <LifeJourney
      enrollmentId="enr"
      unlocked
      onMomentChange={change}
      onOpenMap={map}
      onOpenCare={care}
    />,
  )
  for (const [name, target] of [
    ['1. Minha história', 'past'],
    ['2. História no Mapa CER', 'map'],
    ['3. Meu presente', 'present'],
    ['4. Direções para o futuro', 'future'],
    ['5. Equilíbrio & Realização', 'care'],
  ]) {
    fireEvent.click(screen.getByRole('button', { name }))
    expect(change).toHaveBeenLastCalledWith(target)
  }
  expect(map).not.toHaveBeenCalled()
  expect(care).toHaveBeenCalledOnce()
  view.rerender(<LifeJourney enrollmentId="enr" unlocked={false} onMomentChange={change} />)
  expect(screen.getByRole('button', { name: '3. Meu presente' })).toBeDisabled()
})

it('exibe o texto solicitado sem a metáfora da infância', () => {
  render(<LifeJourney enrollmentId="enr" unlocked />)
  expect(
    screen.getByText(
      'A sua história ajudou a modelar a sua forma de pensar, sentir e se comportar. Reconhecer essa história permite perceber o que ainda te sustenta e o que hoje você pode mudar.',
    ),
  ).toBeVisible()
  expect(screen.queryByText(/A infância como terreno da vida/)).toBeNull()
  expect(screen.queryByText(/Lya Luft/)).toBeNull()
})

it('cartas ficam no presente após a história, antes das metas, e saem da etapa de cuidado', () => {
  const view = render(<LifeJourney enrollmentId="enr" unlocked moment="present" />)
  expect(screen.getByRole('region', { name: 'Cartas do próximo capítulo' })).toBeInTheDocument()
  expect(screen.getByLabelText('Crie a sua carta')).toBeInTheDocument()
  view.rerender(<LifeJourney enrollmentId="enr" unlocked moment="care" />)
  expect(screen.queryByRole('region', { name: 'Cartas do próximo capítulo' })).toBeNull()
})
