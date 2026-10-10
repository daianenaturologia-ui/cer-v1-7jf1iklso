import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AyurvedaChapter1Flow } from './AyurvedaChapter1Flow'
import { AyurvedaTela1Structure } from './AyurvedaTela1Structure'
import { categorizeChapter1Responses, AYV_TELA1_DURATION_OPTIONS, AYV_TELA2_SKIN_OPTIONS, AYV_TELA3_HAIR_OPTIONS, AYV_TELA4_TEMPERATURE_OPTIONS, AYV_TELA5_THIRST_OPTIONS, AYV_TELA5_DRINK_TEMP_OPTIONS, AYV_TELA5_SWEAT_OPTIONS } from '@/services/ayurvedaChapter1'
import { experienceResponseService, enrollmentExperienceService } from '@/services/experienceEngine'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  vi.spyOn(enrollmentExperienceService, 'getByEnrollmentAndExperience').mockResolvedValue({ id: 'realprogress123', current_step_order: 1 } as any)
  vi.spyOn(enrollmentExperienceService, 'updateProgress').mockResolvedValue({ id: 'realprogress123' } as any)
  vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockResolvedValue([])
})

const flow = (extra = {}) => <AyurvedaChapter1Flow enrollmentId="realenroll12345" experienceId="exp-corpo-fisiologia-07b" respondentUserId="realuser1234567" mode="answering" initialStep={1} {...extra} />

describe('Two-figure answer', () => {
  it('persists both selections and restores both without a duplicate summary label', () => {
    const save = vi.fn()
    const view = render(<AyurvedaTela1Structure structureChoice="two_figures" onSave={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Figura feminina — estrutura leve ou estreita' }))
    fireEvent.click(screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' }))
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ primaryStructureChoice: 'light_narrow', secondaryStructureChoice: 'intermediate' }))
    view.rerender(<AyurvedaTela1Structure structureChoice="two_figures" primaryStructureChoice="light_narrow" secondaryStructureChoice="intermediate" onSave={save} />)
    expect(screen.getByRole('button', { name: 'Figura feminina — estrutura leve ou estreita' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' })).toHaveAttribute('aria-pressed', 'true')
    const summary = categorizeChapter1Responses({ structure_choice: 'two_figures', primary_structure_choice: 'light_narrow', secondary_structure_choice: 'intermediate' })
    expect(JSON.stringify(summary).match(/Reconheço características de duas figuras/g)).toHaveLength(1)
  })
  it('blocks advancing with zero or one figure', async () => {
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async p => ({ prompt_id: p.promptId, structured_value: p.structuredValue } as any))
    render(flow())
    await screen.findByRole('button', { name: 'Avançar para Pele' })
    fireEvent.click(screen.getByRole('button', { name: /Reconheço características de duas figuras/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Pele' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione as duas figuras')
    fireEvent.click(screen.getByRole('button', { name: 'Figura feminina — estrutura leve ou estreita' }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Pele' }))
    expect(enrollmentExperienceService.updateProgress).not.toHaveBeenCalled()
  })
})

describe('Live failures preserve the chapter', () => {
  it('saves eight answers, exits, restores the chapter and completes it after returning', async () => {
    let stored: any[] = []
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockImplementation(async () => [...stored])
    vi.spyOn(experienceResponseService, 'saveResponse').mockImplementation(async p => {
      const record = { id: 'real-' + p.promptId, prompt_id: p.promptId, experience_id: p.experienceId, structured_value: p.structuredValue, response_type: p.responseType }
      stored = [...stored.filter(r => r.prompt_id !== p.promptId), record]
      return record as any
    })
    const exit = vi.fn()
    const view = render(flow({ onExitToHub: exit }))
    await screen.findByRole('button', { name: 'Avançar para Pele' })
    fireEvent.click(screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' }))
    fireEvent.click(screen.getByText(AYV_TELA1_DURATION_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Pele' }))
    fireEvent.click(await screen.findByText(AYV_TELA2_SKIN_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Cabelo' }))
    fireEvent.click(await screen.findByText(AYV_TELA3_HAIR_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Temperatura' }))
    fireEvent.click(await screen.findByText(AYV_TELA4_TEMPERATURE_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Hábitos' }))
    fireEvent.click(await screen.findByText(AYV_TELA5_THIRST_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByText(AYV_TELA5_DRINK_TEMP_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByText(AYV_TELA5_SWEAT_OPTIONS[0].label, { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Ir para Encerramento' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar e continuar depois' }))
    await waitFor(() => expect(exit).toHaveBeenCalledOnce())
    expect(stored).toHaveLength(8)
    view.unmount()
    const complete = vi.fn()
    render(flow({ mode: 'ready_to_complete', onCompleted: complete }))
    fireEvent.click(await screen.findByRole('button', { name: 'Concluir este capítulo' }))
    await waitFor(() => expect(complete).toHaveBeenCalledOnce())
    expect(stored.filter(r => r.response_type === 'ChapterCompletion')).toHaveLength(1)
    expect(enrollmentExperienceService.updateProgress).toHaveBeenLastCalledWith('realprogress123', { progressStatus: 'completed', stepOrder: 5 })
  })

  it('does not advance or clear the chosen structure when persistence fails', async () => {
    vi.spyOn(experienceResponseService, 'saveResponse').mockRejectedValue(new Error('server refused'))
    render(flow())
    await screen.findByRole('button', { name: 'Avançar para Pele' })
    fireEvent.click(screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' }))
    fireEvent.click(screen.getByRole('button', { name: 'Avançar para Pele' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('continuam aqui'))
    expect(enrollmentExperienceService.updateProgress).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Figura feminina — estrutura intermediária' })).toHaveAttribute('aria-pressed', 'true')
  })
  it('does not show an unanswered form when reading stored answers fails', async () => {
    vi.spyOn(experienceResponseService, 'listResponsesByExperience').mockRejectedValue(new Error('offline'))
    render(flow())
    expect(await screen.findByRole('alert')).toHaveTextContent('recuperar suas respostas')
    expect(screen.queryByRole('button', { name: 'Avançar para Pele' })).not.toBeInTheDocument()
  })
})
