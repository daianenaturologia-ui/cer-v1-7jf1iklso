// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ExperienceEngine } from './ExperienceEngine'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from '@/services/demoAdapter'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'
import { BUILD_07C_MENTE_PROMPTS } from '@/services/build07cPrompts'
import { movementReportValues } from '@/services/movementFrequency'
import { ProtectionPatternsChart } from './ProtectionPatternsChart'
const exp = 'exp-mente-emocoes-07c'
const props = {
  experienceId: exp,
  enrollmentId: DEMO_ENROLLMENT_ID,
  respondentUserId: DEMO_USER_MARIANA.id,
}
const p7a = BUILD_07C_MENTE_PROMPTS.find((p) => p.step_order === 7)!
const p7b = BUILD_07C_MENTE_PROMPTS.find((p) => p.step_order === 8)!
const schema = p7a.schema_config as any
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
async function seedBefore(order: number) {
  for (const p of BUILD_07C_MENTE_PROMPTS.filter(
    (p) => p.step_order < order && p.step_order !== 9,
  )) {
    const cfg = p.schema_config as any
    await experienceResponseService.saveResponse({
      enrollmentId: props.enrollmentId,
      experienceId: exp,
      respondentUserId: props.respondentUserId,
      promptId: p.id,
      promptKey: cfg.prompt_key,
      canonicalPromptId: p.id,
      stepOrder: p.step_order,
      promptVersion: p.version,
      responseType: p.component_type,
      structuredValue: {
        value:
          p.component_type === 'MultiSelectCards'
            ? [cfg.options?.[0]?.id || 'teste']
            : 'Resposta fictícia preservada',
      },
    })
  }
  await enrollmentExperienceService.updateProgress(`demo-enr-exp-${exp}`, {
    enrollmentId: props.enrollmentId,
    progressStatus: 'in_progress',
    stepOrder: order,
  })
}
async function start() {
  await screen.findByRole('button', { name: /Iniciar este momento|Retomar de onde parei/ })
  fireEvent.click(
    screen.getByRole('button', { name: /Iniciar este momento|Retomar de onde parei/ }),
  )
}
function chooseAll(p: typeof p7a, frequent = false) {
  const cfg = p.schema_config as any
  cfg.options.forEach((o: any, i: number) =>
    fireEvent.change(screen.getByLabelText(`Frequência: ${o.title}`), {
      target: { value: cfg.movement_scale_options[frequent && i === 0 ? 2 : 0] },
    }),
  )
}
it('salva frequência parcial ao pausar, reabre sem inventar valores e mantém uma falha de salvamento na tela', async () => {
  await seedBefore(7)
  const close = vi.fn()
  const view = render(<ExperienceEngine {...props} onClose={close} />)
  await start()
  expect(screen.getAllByRole('combobox')).toHaveLength(5)
  expect(screen.getByRole('button', { name: 'Avançar' })).toBeDisabled()
  fireEvent.change(screen.getAllByRole('combobox')[0], {
    target: { value: schema.movement_scale_options[1] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Pausar e Salvar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  view.unmount()
  render(<ExperienceEngine {...props} />)
  await start()
  expect(screen.getAllByRole('combobox')[0]).toHaveValue(schema.movement_scale_options[1])
  expect(screen.getAllByRole('combobox')[1]).toHaveValue('')
  const fail = vi
    .spyOn(experienceResponseService, 'saveResponse')
    .mockRejectedValueOnce(new Error('Teste de falha'))
  fireEvent.click(screen.getByRole('button', { name: 'Pausar e Salvar' }))
  await screen.findByText(/Não foi possível salvar agora/)
  expect(fail).toHaveBeenCalled()
  expect(screen.getAllByRole('combobox')[0]).toHaveValue(schema.movement_scale_options[1])
  chooseAll(p7a)
  fail.mockRejectedValueOnce(new Error('Teste de falha ao avançar'))
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await waitFor(() => expect(fail).toHaveBeenCalledTimes(2))
  expect(screen.getByLabelText(`Frequência: ${schema.options[0].title}`)).toBeInTheDocument()
  expect(
    screen.queryByLabelText(`Frequência: ${(p7b.schema_config as any).options[0].title}`),
  ).toBeNull()
})
it('percorre o complemento antes dos recursos, conta 3 de 3, conclui, reabre e retoma uma correção sem perder escolhas', async () => {
  await seedBefore(7)
  let view = render(<ExperienceEngine {...props} />)
  await start()
  chooseAll(p7a, true)
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByLabelText(`Frequência: ${(p7b.schema_config as any).options[0].title}`)
  expect(
    screen.getAllByRole('combobox').every((select) => (select as HTMLSelectElement).value === ''),
  ).toBe(true)
  chooseAll(p7b)
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Quais desses movimentos mais interferem na sua vida atualmente?')
  expect(screen.getByText(/Pergunta complementar$/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /INSISTENTE — Buscar/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Em quais situações esses movimentos costumam aparecer?')
  expect(screen.getByText(/Etapa 3 de 3$/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Quando estou sob pressão/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText(
    'Como você costuma se sentir e se comportar quando está em segurança e bem-estar?',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Sinto mais calma e tranquilidade.' }))
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('O que muda quando a sobrecarga aumenta?')
  fireEvent.click(screen.getByRole('button', { name: 'Não sei dizer agora' }))
  await screen.findByText('O que ajuda você a recuperar espaço interno?')
  fireEvent.click(screen.getByRole('button', { name: 'Dormir.' }))
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Existe alguma coisa importante que não perguntamos?')
  fireEvent.click(screen.getByRole('button', { name: 'Concluir momento' }))
  await screen.findByText('Momento Concluído')
  view.unmount()
  view = render(<ExperienceEngine {...props} />)
  await screen.findByText('Momento Concluído')
  fireEvent.click(screen.getByRole('button', { name: /Corrigir minhas respostas/ }))
  fireEvent.click(screen.getByRole('button', { name: /Confirmar e corrigir/ }))
  await screen.findByTestId('banner-correcao-mente-emocoes')
  // Walk the correction; already answered later questions must not auto-complete it.
  for (let i = 0; i < 6; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
    await screen.findByText(
      [
        /Momento 1 de 5.*Etapa 2 de 2$/,
        /Momento 1 de 5.*Pergunta complementar$/,
        /Momento 2 de 5.*Etapa 1 de 3$/,
        /Momento 2 de 5.*Etapa 2 de 3$/,
        /Momento 2 de 5.*Etapa 3 de 3$/,
        /Momento 3 de 5.*Etapa 1 de 3$/,
      ][i],
    )
  }
  await screen.findByLabelText(`Frequência: ${schema.options[0].title}`)
  fireEvent.change(screen.getAllByRole('combobox')[0], {
    target: { value: schema.movement_scale_options[3] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Pausar e Salvar' }))
  await waitFor(() =>
    expect(
      demoAdapter
        .listExperienceResponses(props.enrollmentId, exp)
        .find((r) => r.prompt_id === p7a.id)?.structured_value,
    ).toMatchObject({ ratings: { [schema.options[0].id]: schema.movement_scale_options[3] } }),
  )
  view.unmount()
  view = render(<ExperienceEngine {...props} />)
  await start()
  await screen.findByTestId('banner-correcao-mente-emocoes')
  expect(screen.getAllByRole('combobox')[0]).toHaveValue(schema.movement_scale_options[3])
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByLabelText(`Frequência: ${(p7b.schema_config as any).options[0].title}`)
  expect(
    screen
      .getAllByRole('combobox')
      .every((select) => (select as HTMLSelectElement).value === schema.movement_scale_options[0]),
  ).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Quais desses movimentos mais interferem na sua vida atualmente?')
  expect(screen.getByRole('button', { name: /INSISTENTE — Buscar/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Em quais situações esses movimentos costumam aparecer?')
  expect(screen.getByRole('button', { name: /Quando estou sob pressão/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText(
    'Como você costuma se sentir e se comportar quando está em segurança e bem-estar?',
  )
  expect(screen.getByRole('button', { name: 'Sinto mais calma e tranquilidade.' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('O que muda quando a sobrecarga aumenta?')
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('O que ajuda você a recuperar espaço interno?')
  expect(screen.getByRole('button', { name: 'Dormir.' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByText('Existe alguma coisa importante que não perguntamos?')
  fireEvent.click(screen.getByRole('button', { name: 'Concluir momento' }))
  await screen.findByText('Momento Concluído')
  view.unmount()
  render(<ExperienceEngine {...props} />)
  await screen.findByText('Momento Concluído')
  expect(demoAdapter.listExperienceResponseVersions(props.enrollmentId).length).toBeGreaterThan(0)
})
it('preserva marcações antigas como informação sem frequência, sem convertê-las em frequente no gráfico', () => {
  const values = movementReportValues({
    value: ['cartao_1_fazer_certo'],
    selectedOptionIds: ['cartao_1_fazer_certo'],
  })
  expect(values.cartao_1_fazer_certo).toBe('Informação ainda não disponível')
  render(<ProtectionPatternsChart p7Responses={values} />)
  expect(
    screen
      .getAllByRole('listitem')
      .every((item) =>
        item.getAttribute('aria-label')?.includes('frequência ainda não registrada'),
      ),
  ).toBe(true)
})

it('não exige complemento quando nenhum movimento é frequente e mantém o não sei sem sobrescrever a recusa', async () => {
  await seedBefore(7)
  render(<ExperienceEngine {...props} />)
  await start()
  chooseAll(p7a)
  fireEvent.click(screen.getByRole('button', { name: 'Avançar' }))
  await screen.findByLabelText(`Frequência: ${(p7b.schema_config as any).options[0].title}`)
  fireEvent.click(screen.getByRole('button', { name: 'Não sei dizer agora' }))
  await screen.findByText('Em quais situações esses movimentos costumam aparecer?')
  const saved = demoAdapter
    .listExperienceResponses(props.enrollmentId, exp)
    .find((r) => r.prompt_id === p7b.id)
  expect(saved?.structured_value).toMatchObject({
    is_legitimate_skip: true,
    skip_reason: 'nao_sei',
  })
  expect(
    demoAdapter.checkMenteEmocoesCoverage(props.enrollmentId).details.movimentos_interferencia_atual
      .status,
  ).toBe('optional_empty')
})
