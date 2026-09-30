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
