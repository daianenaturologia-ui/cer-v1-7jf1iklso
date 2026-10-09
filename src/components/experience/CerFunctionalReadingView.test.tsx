import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
