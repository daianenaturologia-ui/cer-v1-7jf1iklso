import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { buildCerMapReadings } from '@/services/cerMapReadings'

describe('CerMapReadingsView - Novo Mapa CER Digital Interativo', () => {
  it('renderiza o mapa interativo em visão única sem abas de versão resumida/detalhada', () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    render(<CerMapReadingsView snapshot={snapshot} />)

    expect(screen.getByTestId('cer-map-readings')).toBeInTheDocument()
    expect(screen.getByText('Meu Mapa CER · Lia')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('Versão resumida')).not.toBeInTheDocument()
    expect(screen.queryByText('Versão detalhada')).not.toBeInTheDocument()
  })

  it('controla um único Dialog por vez ao tocar nos alvos', async () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    render(<CerMapReadingsView snapshot={snapshot} />)

    const howBtn = screen.getByRole('button', {
      name: 'Abrir explicação: Como este mapa ajuda você',
    })
    await userEvent.click(howBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Como este mapa ajuda você' })).toBeInTheDocument()
    expect(
      screen.getByText(/O autodesenvolvimento precisa de uma boa porção de autoconhecimento/),
    ).toBeInTheDocument()

    // Fechar dialog com tecla Escape
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // Abrir outro dialog (Dosha Vata)
    const vataBtn = screen.getByRole('button', { name: 'Abrir detalhes do Dosha Vata' })
    await userEvent.click(vataBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dosha Vata' })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('não inventa gráfico de pizza se os percentuais não forem números finitos válidos somando 100', () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    render(<CerMapReadingsView snapshot={snapshot} />)

    expect(
      screen.getByText(
        'A distribuição percentual ainda não está disponível no snapshot publicado.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Distribuição Constitucional Registrada')).not.toBeInTheDocument()
  })

  it('exibe distribuição apenas quando números explícitos válidos existem no snapshot e somam 100', () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    const dimCorpo = snapshot.dimensions.find((d) => d.id === 'corpo')!
    dimCorpo.summaryRows = [
      { label: 'Vata percentual', text: '50%' },
      { label: 'Pitta percentual', text: '30%' },
      { label: 'Kapha percentual', text: '20%' },
    ]
    render(<CerMapReadingsView snapshot={snapshot} />)

    expect(screen.getByText('Distribuição Constitucional Registrada')).toBeInTheDocument()
    expect(screen.getByText('Vata: 50%')).toBeInTheDocument()
    expect(screen.getByText('Pitta: 30%')).toBeInTheDocument()
    expect(screen.getByText('Kapha: 20%')).toBeInTheDocument()
  })

  it('trata resposta desconhecida sem rotular como zero ou ausente', async () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    const dimMente = snapshot.dimensions.find((d) => d.id === 'mente')!
    dimMente.detailedRows = [{ label: 'prestativo', text: 'Ainda não sei dizer' }]
    render(<CerMapReadingsView snapshot={snapshot} />)

    const prestativoBtn = screen.getByRole('button', {
      name: /Prestativo: categoria Ainda não sei dizer/,
    })
    expect(prestativoBtn).toBeInTheDocument()
    expect(prestativoBtn).toHaveTextContent('?')

    await userEvent.click(prestativoBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prestativo' })).toBeInTheDocument()
    expect(screen.getByText(/Talvez você perceba o que o outro precisa/i)).toBeInTheDocument()
    expect(screen.getByText(/Shirzad Chamine/)).toBeInTheDocument()
  })

  it('permite abrir nós do funcionamento em conjunto e histórico com acessibilidade', async () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    render(<CerMapReadingsView snapshot={snapshot} />)

    const centroBtn = screen.getByRole('button', {
      name: /Centro integrador: Pessoa e Objetivos/,
    })
    await userEvent.click(centroBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Meu funcionamento em conjunto' }),
    ).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    const historiaBtn = screen.getByRole('button', {
      name: 'Abrir histórico e conexões da Linha da Vida',
    })
    await userEvent.click(historiaBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sua história e seu funcionamento hoje' }),
    ).toBeInTheDocument()
  })
})
