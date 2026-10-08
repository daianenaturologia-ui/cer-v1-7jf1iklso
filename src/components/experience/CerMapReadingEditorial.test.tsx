import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'

describe('Leitura integrada sem avisos repetidos', () => {
  it('reúne limites na explicação geral e preserva evidências na leitura pessoal', async () => {
    const user = userEvent.setup()
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    await user.click(screen.getByRole('button', { name: 'Ver leitura completa da dimensão Corpo' }))
    const body = await screen.findByRole('dialog', { name: 'Corpo & Fisiologia' })
    for (const name of [
      'Entenda os doshas e suas combinações',
      'Entenda Prakriti e Vikriti: sua base e seu momento',
      'Como usamos essa leitura no CER',
      'Sua constituição: conhecendo Vata–Pitta',
      'Suas forças e potencialidades',
      'Seu momento atual: o que mudou e o que pede cuidado',
      'Agni e Ama: o que suas respostas dizem sobre a digestão',
    ])
      await user.click(within(body).getByRole('button', { name }))
    expect(body.textContent).not.toMatch(/diagnóstic|personalidade|toxinas|exame laboratorial/i)
    expect(body.textContent).toContain('complementa Mente & Emoções')
    expect(body.textContent).toContain('de forma estratégica')
    expect(body.textContent).toContain(
      'Às vezes aparece com força e outras vezes quase não aparece',
    )
    expect(body.textContent).toMatch(/mistos.*irregularidade.*lentidão/)
    await user.click(within(body).getByRole('button', { name: 'Fechar' }))
    await user.click(
      screen.getByRole('button', { name: 'Abrir explicação: Como este mapa ajuda você' }),
    )
    const guide = await screen.findByRole('dialog', { name: 'Como este mapa ajuda você' })
    expect(guide.textContent?.match(/não estabelece diagnósticos/g)).toHaveLength(1)
    expect(guide.textContent).toContain('Ama não significa toxinas detectadas')
  })
})
