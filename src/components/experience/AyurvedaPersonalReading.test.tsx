import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AyurvedaPersonalReading } from './AyurvedaPersonalReading'
import type { CerMapReadingDimension } from '@/types/cerMapReadings'

const dimension: CerMapReadingDimension = {
  id: 'corpo',
  title: 'Corpo & Fisiologia',
  explanation: '',
  summary: '',
  interpretation: '',
  summaryRows: [],
  detailedRows: [],
  referenceIds: [],
}

describe('Leitura pessoal ayurvédica', () => {
  it('não usa percentuais ou exemplos no texto para inventar uma constituição', () => {
    render(
      <AyurvedaPersonalReading
        dimension={{
          ...dimension,
          summary: 'Exemplo Vata–Pitta',
          summaryRows: [{ label: 'Vata percentual', text: '80%' }],
        }}
        participantName="Carlos"
        interpretationTitle="Leitura"
      />,
    )
    expect(screen.getByText(/Ainda precisamos conhecer melhor suas tendências/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sua constituição:/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Mariana/)).not.toBeInTheDocument()
  })

  it.each([
    ['Vata'],
    ['Pitta'],
    ['Kapha'],
    ['Vata', 'Pitta'],
    ['Vata', 'Kapha'],
    ['Pitta', 'Vata'],
    ['Pitta', 'Kapha'],
    ['Kapha', 'Vata'],
    ['Kapha', 'Pitta'],
    ['Vata', 'Pitta', 'Kapha'],
  ] as const)('respeita o perfil explícito %j sem contaminar outros perfis', async (...profile) => {
    const doshas = profile as ('Vata' | 'Pitta' | 'Kapha')[]
    render(
      <AyurvedaPersonalReading
        dimension={{ ...dimension, ayurvedaConstitution: doshas }}
        participantName="Lia"
        interpretationTitle="Leitura"
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: `Sua constituição: conhecendo ${doshas.join('–')}` }),
    )
    const text = screen.getByTestId('ayurveda-personal-reading').textContent || ''
    if (!doshas.includes('Vata'))
      expect(text).not.toContain('Vata é tradicionalmente associado à criatividade')
    if (!doshas.includes('Pitta'))
      expect(text).not.toContain('Pitta é tradicionalmente associado à clareza')
    if (!doshas.includes('Kapha'))
      expect(text).not.toContain('Kapha é tradicionalmente associado à constância')
  })

  it('não atribui Vikriti ausente nem repete perguntas do questionário', async () => {
    render(
      <AyurvedaPersonalReading
        dimension={{ ...dimension, ayurvedaConstitution: ['Vata', 'Pitta'] }}
        participantName="Mariana"
        interpretationTitle="Leitura"
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Seu momento atual: o que mudou e o que pede cuidado' }),
    )
    expect(screen.getByText(/Sem respostas atuais suficientes/)).toBeInTheDocument()
    expect(screen.queryByText(/sua Vikriti é Vata/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: /Trabalho, estudos|rotina possível|O que observar daqui|Sua leitura registrada/,
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Suas forças e potencialidades' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Sua constituição: conhecendo Vata–Pitta' }),
    )
    for (const title of ['Funcionamento físico', 'Funcionamento mental', 'Funcionamento emocional'])
      expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByTestId('ayurveda-personal-reading').textContent).not.toMatch(
      /Sua fome costuma|Você tolera|Quando há tempo|Consegue explicar/,
    )
  })
})
