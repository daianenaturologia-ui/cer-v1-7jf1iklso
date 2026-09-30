// @vitest-environment jsdom
import React from 'react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ExperienceEngine } from './ExperienceEngine'
import { BUILD_07D_RELACOES_PROMPTS } from '@/services/build07dPrompts'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from '@/services/demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
const exp = 'exp-relacoes-07d'
const props = {
  experienceId: exp,
  enrollmentId: DEMO_ENROLLMENT_ID,
  respondentUserId: DEMO_USER_MARIANA.id,
}
const orbit = [
  { id: 'test-mother', label: 'Mãe (teste)', ring: 'muito_proxima', category: 'familia_origem' },
]
beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  demoAdapter.enableDemo('mariana')
  demoAdapter.resetToDefaultState()
})
afterEach(() => {
  cleanup()
  demoAdapter.disableDemo()
})
async function save(prompt: (typeof BUILD_07D_RELACOES_PROMPTS)[number], value: unknown) {
  await experienceResponseService.saveResponse({
    enrollmentId: props.enrollmentId,
    experienceId: exp,
    respondentUserId: props.respondentUserId,
    promptId: prompt.id,
    promptVersion: prompt.version,
    responseType: prompt.component_type,
    structuredValue: value,
    promptKey: (prompt.schema_config as any).prompt_key,
    canonicalPromptId: prompt.id,
    stepOrder: prompt.step_order,
  })
}
async function start() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Iniciar este momento|Retomar de onde parei/ }),
  )
}
it('mostra o espelho com vínculos e rótulos legíveis, conclui e reabre sem tela branca', async () => {
  for (const p of BUILD_07D_RELACOES_PROMPTS.filter((p) => p.step_order < 14)) {
    await save(
      p,
      p.component_type === 'RelationalOrbitMap'
        ? { value: orbit }
        : p.component_type === 'ChoiceCards'
          ? { choice: (p.schema_config as any).options[0].id }
          : { value: 'Palavras fictícias da participante' },
    )
  }
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${exp}`, {
    enrollmentId: props.enrollmentId,
    progressStatus: 'in_progress',
    stepOrder: 14,
  })
  let view = render(<ExperienceEngine {...props} />)
  await start()
  await screen.findByText(
    'Isso acontece parecido na maior parte das suas relações ou muda bastante dependendo de quem está com você?',
  )
  fireEvent.click(screen.getAllByRole('radio')[3])
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText(
    'Olhando para este panorama das suas relações, isso faz sentido para você neste momento da sua vida?',
  )
  expect(screen.getByText('Mãe (teste) — Muito próxima')).toBeInTheDocument()
  expect(screen.getAllByText('Palavras fictícias da participante').length).toBeGreaterThan(0)
  expect(screen.queryByText(/collection_origin/)).toBeNull()
  fireEvent.click(screen.getAllByRole('radio')[0])
  fireEvent.click(screen.getByRole('button', { name: 'Concluir momento' }))
  await screen.findByText('Momento Concluído')
  view.unmount()
  render(<ExperienceEngine {...props} />)
  await screen.findByText('Momento Concluído')
  expect(screen.getByRole('textbox')).toHaveValue('')
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Anotação fictícia de encerramento' },
  })
  await waitFor(() =>
    expect(
      demoAdapter
        .listExperienceResponses(props.enrollmentId, exp)
        .find((r) => r.prompt_id === BUILD_07D_RELACOES_PROMPTS.at(-1)!.id)?.structured_value,
    ).toMatchObject({
      choice: 'faz_muito_sentido',
      closing_reflection: 'Anotação fictícia de encerramento',
    }),
  )
  cleanup()
  render(<ExperienceEngine {...props} />)
  await screen.findByText('Momento Concluído')
  expect(screen.getByRole('textbox')).toHaveValue('Anotação fictícia de encerramento')
})
it('reabre o mapa salvo e mantém os vínculos após mover, pausar e retomar', async () => {
  await save(BUILD_07D_RELACOES_PROMPTS[0], { value: orbit })
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${exp}`, {
    enrollmentId: props.enrollmentId,
    progressStatus: 'in_progress',
    stepOrder: 1,
  })
  const close = vi.fn()
  let view = render(<ExperienceEngine {...props} onClose={close} />)
  await start()
  await screen.findByRole('button', { name: 'Afastar Mãe (teste) para órbita mais externa' })
  fireEvent.click(
    screen.getByRole('button', { name: 'Afastar Mãe (teste) para órbita mais externa' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Pausar e Salvar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  view.unmount()
  render(<ExperienceEngine {...props} />)
  await start()
  const select = await screen.findByRole('combobox', { name: 'Mudar órbita de Mãe (teste)' })
  expect(select).toHaveTextContent('Próxima')
  expect(
    screen.getByRole('button', { name: 'Aproximar Mãe (teste) para órbita mais interna' }),
  ).toBeEnabled()
})

it('Voltar ignora a pergunta complementar que não se aplica à resposta', async () => {
  for (const p of BUILD_07D_RELACOES_PROMPTS.filter(
    (p) => p.step_order < 14 && p.step_order !== 13,
  )) {
    await save(
      p,
      p.component_type === 'RelationalOrbitMap'
        ? { value: orbit }
        : p.component_type === 'ChoiceCards'
          ? { choice: (p.schema_config as any).options[0].id }
          : { value: 'Teste' },
    )
  }
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${exp}`, {
    enrollmentId: props.enrollmentId,
    progressStatus: 'in_progress',
    stepOrder: 14,
  })
  render(<ExperienceEngine {...props} />)
  await start()
  await screen.findByText(BUILD_07D_RELACOES_PROMPTS.find((p) => p.step_order === 14)!.prompt_text)
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  await screen.findByText(BUILD_07D_RELACOES_PROMPTS.find((p) => p.step_order === 12)!.prompt_text)
  expect(
    screen.queryByText(BUILD_07D_RELACOES_PROMPTS.find((p) => p.step_order === 13)!.prompt_text),
  ).toBeNull()
})
it('serializa a anotação final e mantém a tela aberta se houver falha ao salvar', async () => {
  await save(BUILD_07D_RELACOES_PROMPTS.at(-1)!, { choice: 'faz_muito_sentido' })
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${exp}`, {
    enrollmentId: props.enrollmentId,
    completed: true,
    progressStatus: 'completed',
  })
  const close = vi.fn()
  render(<ExperienceEngine {...props} onClose={close} />)
  const input = await screen.findByRole('textbox', { name: 'Anotação opcional de encerramento' })
  const original = experienceResponseService.saveResponse.bind(experienceResponseService)
  let release!: () => void
  const spy = vi
    .spyOn(experienceResponseService, 'saveResponse')
    .mockImplementationOnce(async (params) => {
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return original(params)
    })
  fireEvent.change(input, { target: { value: 'Primeira versão' } })
  await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
  fireEvent.change(input, { target: { value: 'Versão final completa' } })
  expect(screen.getByRole('button', { name: 'Concluir e Voltar ao Início' })).toBeDisabled()
  expect(spy).toHaveBeenCalledTimes(1)
  release()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Concluir e Voltar ao Início' })).toBeEnabled(),
  )
  expect(
    demoAdapter
      .listExperienceResponses(props.enrollmentId, exp)
      .find((r) => r.prompt_id === BUILD_07D_RELACOES_PROMPTS.at(-1)!.id)?.structured_value,
  ).toMatchObject({ choice: 'faz_muito_sentido', closing_reflection: 'Versão final completa' })
  spy.mockRejectedValueOnce(new Error('Falha fictícia'))
  fireEvent.change(input, { target: { value: 'Texto preservado na tela' } })
  await screen.findByRole('alert')
  expect(input).toHaveValue('Texto preservado na tela')
  expect(screen.getByRole('button', { name: 'Concluir e Voltar ao Início' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar salvar novamente' }))
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Concluir e Voltar ao Início' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Concluir e Voltar ao Início' }))
  expect(close).toHaveBeenCalledOnce()
})
