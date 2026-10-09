import React, { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MyNextStepWizard, clearMyNextStepDraft } from './MyNextStepWizard'
import type { LifeDirectionInput } from '@/services/lifeDirections'
vi.mock('@/lib/pocketbase/client', () => ({ default: { authStore: { record: { id: 'owner' } } } }))
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
vi.mock('@/components/VoiceInputCapture', () => ({ VoiceInputCapture: () => null }))
const empty: LifeDirectionInput = {
  enrollment_id: 'one',
  kind: 'future',
  horizon: 'open',
  title: '',
  narrative: '',
  meaning: '',
  resources: '',
  limits: '',
  first_step: '',
  access_class: 'participant_private',
}
function Harness({ id = 'one' }: { id?: string }) {
  const [value, setValue] = useState({ ...empty, enrollment_id: id })
  return (
    <MyNextStepWizard
      value={value}
      busy={false}
      strategies={[]}
      onChange={setValue}
      onSave={() => {}}
      onPause={() => {}}
    />
  )
}
beforeEach(() => localStorage.clear())
describe('Rascunho da direção', () => {
  it('retoma texto e etapa após sair, sem retomar consentimento de compartilhamento', () => {
    const first = render(<Harness />)
    fireEvent.change(
      screen.getByLabelText('Conte uma situação que mostre como isso aparece na sua vida hoje.'),
      { target: { value: 'Uma situação importante' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.change(
      screen.getByLabelText('O que gostaria de conseguir viver ou fazer de maneira diferente?'),
      { target: { value: 'Expressar um limite' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    fireEvent.click(screen.getByRole('checkbox'))
    first.unmount()
    render(<Harness />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText('Expressar um limite')).toBeInTheDocument()
    expect(screen.getByText(/Seu rascunho foi retomado/)).toBeInTheDocument()
  })
  it('não usa o rascunho de outra matrícula e limita áreas sem perder o relato', () => {
    localStorage.setItem(
      'cer-next-step-draft-v1:owner:one:new',
      JSON.stringify({ value: { ...empty, narrative: 'Privado da outra pessoa' }, step: 0 }),
    )
    render(<Harness id="two" />)
    expect(
      screen.getByLabelText('Conte uma situação que mostre como isso aparece na sua vida hoje.'),
    ).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: /Corpo e saúde/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Emoções/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Relações/ }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Relações/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
  it('limpa somente o rascunho salvo e preserva o de outra direção', () => {
    localStorage.setItem('cer-next-step-draft-v1:owner:one:new', 'draft')
    localStorage.setItem('cer-next-step-draft-v1:owner:two:new', 'another')
    clearMyNextStepDraft('one')
    expect(localStorage.getItem('cer-next-step-draft-v1:owner:one:new')).toBeNull()
    expect(localStorage.getItem('cer-next-step-draft-v1:owner:two:new')).toBe('another')
  })
})
