import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'
describe('Leitura do funcionamento no mapa', () => {
  it('exibe conexões e não as observações literais no nó emocional', async () => {
    const s = createDemoCerMapReading()
    s.elementReadings!.emocoes.observations = ['RESPOSTA LITERAL NÃO PUBLICAR']
    render(<CerMapReadingsView snapshot={s} />)
    await userEvent.click(screen.getByRole('button', { name: /Nó Emoções/ }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('necessidades e riscos cedo')
    expect(dialog.textContent).not.toContain('RESPOSTA LITERAL NÃO PUBLICAR')
    expect(dialog.textContent).not.toMatch(/Você registrou:|Sua resposta declarada/)
  })
  it('abre a leitura aprofundada no comportamento externo, preservando a conexão com o conjunto', async () => {
    const s = createDemoCerMapReading()
    render(<CerMapReadingsView snapshot={s} />)
    await userEvent.click(screen.getByRole('button', { name: /Prestativo: categoria/ }))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Como esse movimento organiza seu funcionamento')).toBeVisible()
    expect(dialog.getByText('Pensamentos e emoções que ele pode alimentar')).toBeVisible()
    expect(dialog.getByText('Como isso repercute na rotina e nos vínculos')).toBeVisible()
    expect(dialog.getByText('O que esse movimento procura proteger')).toBeVisible()
    expect(dialog.getByText('Como usar suas forças a favor dos seus objetivos')).toBeVisible()
    expect(dialog.getByText(/necessidades e riscos cedo/)).toBeVisible()
    expect(dialog.queryByText('Sua resposta declarada')).toBeNull()
  })
  it('preserva uma leitura revisada por Daiane ao abrir o comportamento', async () => {
    const s = createDemoCerMapReading()
    s.reviewedAt = '2026-10-09'
    s.reviewedBy = 'Daiane'
    s.elementReadings!.prestativo = {
      summary: '',
      observations: [],
      interpretation: 'Leitura aprovada e individualizada.',
      resources: [],
      costs: [],
      connections: [],
      questions: [],
    }
    render(<CerMapReadingsView snapshot={s} />)
    await userEvent.click(screen.getByRole('button', { name: /Prestativo: categoria/ }))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText('Leitura aprovada e individualizada.')).toBeVisible()
    expect(dialog.queryByText('Como esse movimento organiza seu funcionamento')).toBeNull()
  })
})

it('padroniza os seis acessos e abre uma interpretação pessoal com três padrões', async () => {
  render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
  expect(screen.getAllByRole('button', { name: /^Interpretação dessa dimensão:/ })).toHaveLength(6)
  await userEvent.click(
    screen.getByRole('button', { name: 'Interpretação dessa dimensão: Mente e Emoções' }),
  )
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Como você funciona nesta dimensão' }))
  expect(dialog.textContent).toContain('Mariana, vamos olhar com carinho')
  expect(dialog.textContent).toContain('Prestativo, Hipervigilante e Analítico')
  expect(dialog.textContent).not.toContain('Insistente')
})
