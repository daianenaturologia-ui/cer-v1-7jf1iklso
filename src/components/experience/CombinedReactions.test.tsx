// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChoiceCards } from './ChoiceCards'
import { ExperienceEngine } from './ExperienceEngine'
import { formatPromptResponse } from './formatPromptResponse'
import { BUILD_07C_REGULACAO_PROMPTS } from '@/services/build07cPrompts'
import { BUILD_07D_RELACOES_PROMPTS } from '@/services/build07dPrompts'
import { buildRegulacaoInterpretation } from '@/services/universalDimensionInterpretationEngine'
import { evaluateCondition } from '@/services/orchestrationResolver'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from '@/services/demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'

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

it('permite duas escolhas, desmarcar, substituir e usar uma resposta exclusiva', () => {
  function Harness() {
    const [value, setValue] = useState<string | string[]>('a')
    return (
      <ChoiceCards
        config={{
          options: ['a', 'b', 'c', 'none'].map((id) => ({ id, title: id })),
          maxSelect: 2,
          exclusive_options: ['none'],
        }}
        value={value}
        onChange={setValue}
        onMultiChange={setValue}
      />
    )
  }
  render(<Harness />)
  expect(screen.getByRole('checkbox', { name: 'a' })).toBeChecked()
  fireEvent.click(screen.getByRole('checkbox', { name: 'b' }))
  expect(screen.getByRole('checkbox', { name: 'c' })).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: 'a' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'c' }))
  expect(screen.getByRole('checkbox', { name: 'b' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'c' })).toBeChecked()
  fireEvent.click(screen.getByRole('checkbox', { name: 'none' }))
  expect(screen.getByRole('checkbox', { name: 'b' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'c' })).not.toBeChecked()
  fireEvent.click(screen.getByRole('checkbox', { name: 'a' }))
  expect(screen.getByRole('checkbox', { name: 'none' })).not.toBeChecked()
})

it.each([
  [BUILD_07C_REGULACAO_PROMPTS, 'resposta_tendencia'],
  [BUILD_07D_RELACOES_PROMPTS, 'conflito_movimento_inicial'],
] as const)('salva e retoma ambas as reações em %s / %s', async (prompts, key) => {
  const prompt = prompts.find((p) => (p.schema_config as any).prompt_key === key)!
  const options = (prompt.schema_config as any).options
  const props = {
    experienceId: prompt.experience_id,
    enrollmentId: DEMO_ENROLLMENT_ID,
    respondentUserId: DEMO_USER_MARIANA.id,
  }
  await experienceResponseService.saveResponse({
    ...props,
    promptId: prompt.id,
    promptVersion: 1,
    responseType: 'ChoiceCards',
    structuredValue: { choice: options[0].id },
    promptKey: key,
    canonicalPromptId: prompt.id,
    stepOrder: prompt.step_order,
  })
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${prompt.experience_id}`, {
    enrollmentId: DEMO_ENROLLMENT_ID,
    progressStatus: 'in_progress',
    stepOrder: prompt.step_order,
  })
  const close = vi.fn()
  let view = render(<ExperienceEngine {...props} onClose={close} />)
  fireEvent.click(
    await screen.findByRole('button', { name: /Iniciar este momento|Retomar de onde parei/ }),
  )
  await screen.findByText(prompt.prompt_text)
  expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
  fireEvent.click(screen.getAllByRole('checkbox')[1])
  fireEvent.click(screen.getByRole('button', { name: 'Pausar e Salvar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  const response = demoAdapter
    .listExperienceResponses(DEMO_ENROLLMENT_ID, prompt.experience_id)
    .find((r) => r.prompt_id === prompt.id)!
  expect((response.structured_value as any).value).toEqual([options[0].id, options[1].id])
  expect(formatPromptResponse(prompt, response)).toBe(`${options[0].title}; ${options[1].title}`)
  if (key === 'resposta_tendencia') {
    const report = buildRegulacaoInterpretation([response])
    expect(report.deepSynthesis).toContain(options[0].title)
    expect(report.deepSynthesis).toContain(options[1].title)
  }
  view.unmount()
  render(<ExperienceEngine {...props} />)
  fireEvent.click(
    await screen.findByRole('button', { name: /Iniciar este momento|Retomar de onde parei/ }),
  )
  await screen.findByText(prompt.prompt_text)
  expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
  expect(screen.getAllByRole('checkbox')[1]).toBeChecked()
})

it('abre a pergunta complementar quando a segunda escolha satisfaz a rota', () => {
  const response = {
    structured_value: {
      value: ['alivio_ou_espaco', 'preocupada_ou_ansiosa'],
      selectedOptionIds: ['alivio_ou_espaco', 'preocupada_ou_ansiosa'],
    },
  } as any
  expect(
    evaluateCondition(
      { field: 'choice', operator: 'equals', value: 'preocupada_ou_ansiosa' },
      response,
    ),
  ).toBe(true)
})
