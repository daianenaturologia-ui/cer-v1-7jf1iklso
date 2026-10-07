import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { buildCerMapReadings, isCerMapReadingSnapshot } from '@/services/cerMapReadings'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'

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

    // O foco deve retornar ao botão acionador
    expect(document.activeElement).toBe(howBtn)

    // Abrir outro dialog (Dosha Vata)
    const vataBtn = screen.getByRole('button', { name: 'Abrir detalhes do Dosha Vata' })
    await userEvent.click(vataBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dosha Vata' })).toBeInTheDocument()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)

    // Fechar Vata com tecla Escape e verificar retorno de foco
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(vataBtn)
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
    expect(document.activeElement).toBe(centroBtn)

    const historiaBtn = screen.getByRole('button', {
      name: 'Abrir histórico e conexões da Linha da Vida',
    })
    await userEvent.click(historiaBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sua história e seu funcionamento hoje' }),
    ).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(historiaBtn)
  })

  it('restaura o foco ao botão acionador ao fechar por Escape para alvos de padrão (ex: Prestativo) e Agni', async () => {
    const snapshot = buildCerMapReadings([], 'enr-1', 'Lia')
    render(<CerMapReadingsView snapshot={snapshot} />)

    const agniBtn = screen.getByRole('button', { name: 'Abrir detalhes sobre Agni' })
    await userEvent.click(agniBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(agniBtn)

    const prestativoBtn = screen.getByRole('button', {
      name: /Prestativo: categoria ausente\. Toque para abrir detalhes\./,
    })
    await userEvent.click(prestativoBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(prestativoBtn)
  })

  it('renderiza o snapshot demo gerado por createDemoCerMapReading com doshas, 10 comportamentos preenchidos e reação destacada', () => {
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    expect(isCerMapReadingSnapshot(demoSnapshot)).toBe(true)

    render(<CerMapReadingsView snapshot={demoSnapshot} />)

    // 1. Doshas preenchidos sem aviso de indisponibilidade
    expect(
      screen.queryByText(
        'A distribuição percentual ainda não está disponível no snapshot publicado.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Distribuição Constitucional Registrada')).toBeInTheDocument()
    expect(screen.getByText('Vata: 45%')).toBeInTheDocument()
    expect(screen.getByText('Pitta: 35%')).toBeInTheDocument()
    expect(screen.getByText('Kapha: 20%')).toBeInTheDocument()

    // 2. Todos os 10 comportamentos preenchidos (nenhum "Não informado" ou categoria ausente)
    const ausenteButtons = screen.queryAllByRole('button', {
      name: /categoria Não informado|categoria ausente/,
    })
    expect(ausenteButtons).toHaveLength(0)

    // Confere que comportamentos canônicos específicos aparecem com suas categorias ordinais
    expect(
      screen.getByRole('button', {
        name: /Insistente: categoria Repete-se com frequência/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Prestativo: categoria Aparece com muita força quando estou sob pressão/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Realizador incansável: categoria Aparece em algumas situações/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Desencorajado: categoria Quase nunca acontece comigo/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Esquivo: categoria Ainda não sei dizer/i,
      }),
    ).toBeInTheDocument()

    // 3. Ao menos uma reação de regulação destacada como "Relatada no percurso"
    expect(screen.getByText('Relatada no percurso')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Reação Luta.*Relatada por você/i,
      }),
    ).toBeInTheDocument()

    // 4. Rótulos visíveis dos comportamentos exibem categorias curtas e NÃO exibem '%'
    expect(screen.getByText('Quase nunca')).toBeInTheDocument()
    expect(screen.getByText('Algumas situações')).toBeInTheDocument()
    expect(screen.getByText('Frequente')).toBeInTheDocument()
    expect(screen.getByText('Sob pressão')).toBeInTheDocument()
    expect(screen.getByText('Ainda não sei')).toBeInTheDocument()

    // Comportamentos não devem ter rótulos de porcentagem (25%, 50%, 75%, 100%)
    expect(screen.queryByText('25%')).not.toBeInTheDocument()
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
    expect(screen.queryByText('75%')).not.toBeInTheDocument()
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
  })
})
