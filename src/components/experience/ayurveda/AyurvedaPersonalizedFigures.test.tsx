import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AyurvedaTela1Structure } from './AyurvedaTela1Structure'
import { ExperienceEngine } from '../ExperienceEngine'
import { demoAdapter } from '@/services/demoAdapter'
import { renderAvatarToCanvas } from '@/services/avatarCompositor'
vi.mock('@/services/avatarCompositor', async () => ({
  ...(await vi.importActual('@/services/avatarCompositor')),
  renderAvatarToCanvas: vi.fn(),
}))
vi.mock('./AyurvedaChaptersNavigator', () => ({
  default: (props: any) => (
    <div data-testid="received-avatar">
      {props.userPresentation} {props.userSkinTone} {props.userHairColor}
    </div>
  ),
}))
beforeEach(() => {
  vi.mocked(renderAvatarToCanvas).mockReset().mockResolvedValue(undefined)
})
describe('Figuras corporais com a representação escolhida', () => {
  it('aplica pele e cabelo às três estruturas sem criar resposta clínica', async () => {
    const save = vi.fn()
    render(
      <AyurvedaTela1Structure
        userPresentation="feminine"
        userSkinTone="skin_06"
        userHairColor="hair_red"
        onSave={save}
      />,
    )
    await waitFor(() => expect(renderAvatarToCanvas).toHaveBeenCalledTimes(3))
    expect(vi.mocked(renderAvatarToCanvas).mock.calls.map(([c]) => c)).toEqual(
      ['light_narrow', 'intermediate', 'broad_solid'].map((structure) => ({
        presentation: 'feminine',
        structure,
        skinTone: 'skin_06',
        hairColor: 'hair_red',
      })),
    )
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: 'Figura feminina — estrutura leve ou estreita' }),
    )
    expect(save).toHaveBeenLastCalledWith({
      structureChoice: 'light_narrow',
      primaryStructureChoice: undefined,
      secondaryStructureChoice: undefined,
      durationChoice: undefined,
    })
  })
  it('mantém as mesmas cores nas figuras alternativas', async () => {
    render(
      <AyurvedaTela1Structure
        userPresentation="masculine"
        userSkinTone="skin_05"
        userHairColor="hair_blonde"
        onSave={vi.fn()}
      />,
    )
    await waitFor(() => expect(renderAvatarToCanvas).toHaveBeenCalledTimes(3))
    fireEvent.click(screen.getByRole('button', { name: 'Ver as outras figuras' }))
    await waitFor(() => expect(renderAvatarToCanvas).toHaveBeenCalledTimes(6))
    expect(
      vi
        .mocked(renderAvatarToCanvas)
        .mock.calls.every(([c]) => c.skinTone === 'skin_05' && c.hairColor === 'hair_blonde'),
    ).toBe(true)
    expect(
      vi.mocked(renderAvatarToCanvas).mock.calls.filter(([c]) => c.presentation === 'feminine'),
    ).toHaveLength(3)
  })
  it('atualiza todas as figuras quando a personalização muda', async () => {
    const props = { userPresentation: 'feminine' as const, onSave: vi.fn() }
    const view = render(
      <AyurvedaTela1Structure {...props} userSkinTone="skin_01" userHairColor="hair_black" />,
    )
    await waitFor(() => expect(renderAvatarToCanvas).toHaveBeenCalledTimes(3))
    view.rerender(
      <AyurvedaTela1Structure {...props} userSkinTone="skin_06" userHairColor="hair_gray_white" />,
    )
    await waitFor(() => expect(renderAvatarToCanvas).toHaveBeenCalledTimes(6))
    expect(
      vi
        .mocked(renderAvatarToCanvas)
        .mock.calls.slice(-3)
        .every(([c]) => c.skinTone === 'skin_06' && c.hairColor === 'hair_gray_white'),
    ).toBe(true)
  })
  it('não substitui a figura personalizada por uma figura de outras cores em caso de falha', async () => {
    vi.mocked(renderAvatarToCanvas).mockRejectedValue(new Error('asset indisponível'))
    const view = render(
      <AyurvedaTela1Structure userSkinTone="skin_06" userHairColor="hair_red" onSave={vi.fn()} />,
    )
    await screen.findAllByText('Não foi possível carregar esta figura.')
    expect(view.container.querySelectorAll('img')).toHaveLength(0)
  })
})

it('repassa as escolhas salvas da pessoa ao abrir Corpo & Fisiologia', async () => {
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  demoAdapter.updatePerson('demo-person-mariana', {
    avatar_customization_status: 'completed',
    avatar_presentation: 'masculine',
    avatar_skin_tone: 'skin_06',
    avatar_hair_color: 'hair_red',
  })
  render(
    <ExperienceEngine
      experienceId="exp-corpo-fisiologia-07b"
      enrollmentId="demo-enr-01"
      respondentUserId="demo-user-mariana"
      personId="demo-person-mariana"
    />,
  )
  expect(await screen.findByTestId('received-avatar')).toHaveTextContent(
    'masculine skin_06 hair_red',
  )
})
