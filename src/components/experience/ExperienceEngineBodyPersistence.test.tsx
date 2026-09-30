// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ExperienceEngine } from './ExperienceEngine'
import { demoAdapter } from '@/services/demoAdapter'

const lifecycle = vi.hoisted(() => ({ mounts: vi.fn(), unmounts: vi.fn() }))
vi.mock('./ayurveda/AyurvedaChaptersNavigator', () => ({
  default: function NavigatorDraft() {
    const [value, setValue] = React.useState('Uso contínuo')
    React.useEffect(() => {
      lifecycle.mounts()
      return () => {
        lifecycle.unmounts()
      }
    }, [])
    return (
      <input
        aria-label="Resposta em edição"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    )
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  vi.spyOn(demoAdapter, 'getCurrentPerson').mockReturnValue({
    avatar_customization_status: 'deferred',
  } as any)
  lifecycle.mounts.mockClear()
  lifecycle.unmounts.mockClear()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  demoAdapter.disableDemo()
})
it('preserva a tela e a resposta em edição quando o pai atualiza após um salvamento', async () => {
  const props = {
    experienceId: 'exp-corpo-fisiologia-07b',
    enrollmentId: 'enr-demo',
    respondentUserId: 'user-demo',
  }
  const view = render(<ExperienceEngine {...props} onCompleted={() => {}} />)
  const input = await screen.findByRole('textbox', { name: 'Resposta em edição' })
  fireEvent.change(input, { target: { value: 'Comecei recentemente' } })
  view.rerender(<ExperienceEngine {...props} onCompleted={() => {}} />)
  expect(screen.queryByTestId('chapter1-loading-spinner')).not.toBeInTheDocument()
  await act(async () => {})
  expect(await screen.findByRole('textbox', { name: 'Resposta em edição' })).toBe(input)
  expect(input).toHaveValue('Comecei recentemente')
  expect(lifecycle.mounts).toHaveBeenCalledTimes(1)
  expect(lifecycle.unmounts).not.toHaveBeenCalled()
})
