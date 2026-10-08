import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { buildCerMapReadings, isCerMapReadingSnapshot } from '@/services/cerMapReadings'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'
import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'

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

  it('renderiza o SVG circular com três segmentos táteis dos doshas quando há percentuais válidos e permite abrir dialogs com teclado e clique', async () => {
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    render(<CerMapReadingsView snapshot={demoSnapshot} />)

    // SVG donut deve existir no DOM com role="img" e testid
    const donutSvg = screen.getByTestId('cer-dosha-donut')
    expect(donutSvg).toBeInTheDocument()

    // Três fatias com seus respectivos testids e roles
    const vataSlice = screen.getByTestId('dosha-slice-vata')
    const pittaSlice = screen.getByTestId('dosha-slice-pitta')
    const kaphaSlice = screen.getByTestId('dosha-slice-kapha')

    expect(vataSlice).toBeInTheDocument()
    expect(pittaSlice).toBeInTheDocument()
    expect(kaphaSlice).toBeInTheDocument()

    expect(vataSlice).toHaveAttribute('aria-label', expect.stringContaining('Dosha Vata'))
    expect(pittaSlice).toHaveAttribute('aria-label', expect.stringContaining('Dosha Pitta'))
    expect(kaphaSlice).toHaveAttribute('aria-label', expect.stringContaining('Dosha Kapha'))

    // 1. Interação via clique no segmento Pitta abre o mesmo modal do Pitta
    await userEvent.click(pittaSlice)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dosha Pitta' })).toBeInTheDocument()
    expect(screen.getByText(/Transformação e calor/i)).toBeInTheDocument()

    // Fechar por Escape e verificar devolução de foco para o segmento Pitta
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(pittaSlice)

    // 2. Interação via teclado Enter no segmento Kapha abre o modal do Kapha
    fireEvent.keyDown(kaphaSlice, { key: 'Enter', code: 'Enter' })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dosha Kapha' })).toBeInTheDocument()
    expect(screen.getByText(/Sustentação e estabilidade/i)).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(kaphaSlice)

    // 3. Interação via teclado Espaço no segmento Vata abre o modal do Vata
    fireEvent.keyDown(vataSlice, { key: ' ', code: 'Space' })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dosha Vata' })).toBeInTheDocument()
    expect(screen.getByText(/Movimento e variabilidade/i)).toBeInTheDocument()

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })
    expect(document.activeElement).toBe(vataSlice)
  })

  it('exibe a interpretação personalizada e blocos curtos integrados no modal ao clicar em Prestativo sem vazar para Hipervigilante', async () => {
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    render(<CerMapReadingsView snapshot={demoSnapshot} />)

    // 1. Clicar no botão do padrão Prestativo
    const prestativoBtn = screen.getByRole('button', {
      name: /Prestativo: categoria Aparece com muita força quando estou sob pressão/i,
    })
    await userEvent.click(prestativoBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prestativo' })).toBeInTheDocument()

    // 2. Verifica blocos curtos estruturados
    expect(screen.getByText('Exemplo fictício para explorar o Mapa CER')).toBeInTheDocument()
    expect(screen.getByText('O que aparece nas suas respostas')).toBeInTheDocument()
    expect(screen.getByText('Uma leitura possível')).toBeInTheDocument()
    expect(screen.getByText('Recursos e pontos de atenção')).toBeInTheDocument()
    expect(screen.getByText('Como se conecta ao conjunto')).toBeInTheDocument()
    expect(screen.getByText('Para explorar na conversa')).toBeInTheDocument()

    // 3. Verifica conteúdo específico e acolhedor de Prestativo
    expect(
      screen.getByText(
        /Talvez você perceba o que o outro precisa antes de perceber seu próprio cansaço/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /O que você teme que aconteça se, diante de uma demanda externa, você pausar e não assumir a tarefa de imediato\?/i,
      ),
    ).toBeInTheDocument()

    // 4. NÃO vazar conteúdo de Hipervigilante (ex: mandíbula/prevenir qualquer risco)
    expect(screen.queryByText(/Tensão na mandíbula/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Antecipar e prevenir qualquer risco/i)).not.toBeInTheDocument()

    // Fechar modal
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 5. Agora clicar no Hipervigilante e verificar que recebe o conteúdo próprio dele
    const hipervigilanteBtn = screen.getByRole('button', {
      name: /Hipervigilante: categoria Aparece com muita força quando estou sob pressão/i,
    })
    await userEvent.click(hipervigilanteBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hipervigilante' })).toBeInTheDocument()
    expect(
      screen.getByText(/radar de segurança que se ativa em ambientes de pressão/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Como você pode diferenciar hoje um risco real e iminente de uma antecipação/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        /Talvez você perceba o que o outro precisa antes de perceber seu próprio cansaço/i,
      ),
    ).not.toBeInTheDocument()
  })

  it('exibe a síntese/ciclo integrativo no Centro e conteúdo específico diferenciado em cada nó', async () => {
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    render(<CerMapReadingsView snapshot={demoSnapshot} />)

    // 1. Abrir o Centro ("Meu funcionamento em conjunto")
    const centroBtn = screen.getByRole('button', {
      name: /Meu funcionamento em conjunto\. Toque para abrir síntese/i,
    })
    await userEvent.click(centroBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Meu funcionamento em conjunto' }),
    ).toBeInTheDocument()

    // Conteúdo da síntese e ciclo integrativo com distinção entre relato e hipótese
    expect(
      screen.getByText(
        /Mariana, suas respostas mostram capacidade de perceber nuances, planejar e cuidar/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Mariana, em qual ponto desse ciclo você mais se reconhece — e qual parte dele não descreve a sua experiência real\?/i,
      ),
    ).toBeInTheDocument()

    // Fechar por Escape
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 2. Abrir o Nó "Pensamentos" e verificar conteúdo específico (não o mesmo texto genérico)
    const pensamentosBtn = screen.getByRole('button', {
      name: /Nó Pensamentos\. Toque para abrir leitura individual/i,
    })
    await userEvent.click(pensamentosBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nó Pensamentos' })).toBeInTheDocument()
    expect(
      screen.getByText(/Cálculo de passos futuros para não falhar nem deixar desmoronar/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Sua mente é um instrumento poderoso de organização e lucidez/i),
    ).toBeInTheDocument()

    // Fechar por Escape
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 3. Abrir o Nó "Relações & Vínculos" e verificar conteúdo específico
    const relacoesBtn = screen.getByRole('button', {
      name: /Nó Relações & Vínculos\. Toque para abrir leitura individual/i,
    })
    await userEvent.click(relacoesBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nó Relações & Vínculos' })).toBeInTheDocument()
    expect(
      screen.getByText(/Círculo íntimo seleto com alto nível de dedicação e lealdade profunda/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Aprender a pedir ajuda antes do esgotamento e praticar o dizer "não"/i),
    ).toBeInTheDocument()
  })

  it('explicita ausência de marcos na História sem inventar traumas ou infância, e preserva fallback em mapas sem elementReadings', async () => {
    // 1. Snapshot Demo com História cuidadosa
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    const { unmount } = render(<CerMapReadingsView snapshot={demoSnapshot} />)

    const historiaBtn = screen.getByRole('button', {
      name: /Sua história e seu funcionamento hoje\. Toque para abrir conexões/i,
    })
    await userEvent.click(historiaBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sua história e seu funcionamento hoje' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Até aqui, há características corporais reconhecidas há anos e relatos do seu funcionamento atual/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Ainda faltam marcos compartilhados da Linha da Vida para relacionar esse retrato a acontecimentos específicos/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Não sabemos quando você aprendeu a assumir tantas demandas/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Quando você começou a sentir que precisava dar conta de tudo\?/i),
    ).toBeInTheDocument()

    // Não inventa traumas familiares
    expect(screen.queryByText(/pais rígidos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/infância traumática/i)).not.toBeInTheDocument()

    unmount()

    // 2. Snapshot Legado/Real SEM elementReadings: preserva comportamento anterior e NUNCA vaza os dados de Mariana
    const legacySnapshot: CerMapReadingSnapshot = {
      schemaVersion: 1,
      enrollmentId: 'real-enr-99',
      participantName: 'Joana Silva',
      generatedAt: '2025-05-01T10:00:00Z',
      sourceResponseIds: ['resp-01'],
      overview: 'Mapa consolidado real.',
      integration: 'Integração real personalizada.',
      history: 'Histórico pessoal registrado em sessão.',
      dimensions: [
        {
          id: 'corpo',
          title: 'Corpo & Fisiologia',
          explanation: 'Conceito da dimensão corpo.',
          summary: 'Resumo corpo real.',
          interpretation: 'Interpretação corpo real.',
          summaryRows: [],
          detailedRows: [],
          referenceIds: [],
        },
        {
          id: 'mente',
          title: 'Mente & Emoções',
          explanation: 'Conceito da dimensão mente.',
          summary: 'Resumo mente real.',
          interpretation: 'Interpretação mente real.',
          summaryRows: [],
          detailedRows: [
            {
              label: 'prestativo',
              text: 'Repete-se com frequência',
            },
          ],
          referenceIds: [],
        },
      ],
      references: [],
      // elementReadings ausente intencionalmente!
    }

    render(<CerMapReadingsView snapshot={legacySnapshot} />)

    // Clicar em Prestativo no mapa legado
    const legacyPrestativoBtn = screen.getByRole('button', {
      name: /Prestativo: categoria Repete-se com frequência/i,
    })
    await userEvent.click(legacyPrestativoBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // Não pode conter aviso fictício nem o texto interpretativo de Mariana
    expect(screen.queryByText('Exemplo fictício para explorar o Mapa CER')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        /Talvez você perceba o que o outro precisa antes de perceber seu próprio cansaço/i,
      ),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/O que aparece nas suas respostas/i)).not.toBeInTheDocument()

    // Preserva o conteúdo padrão conceitual existente
    expect(screen.getByText(/Pensamentos comuns quando ativo/i)).toBeInTheDocument()
  })

  it('valida que modais com elementReadings limpos não vazam IDs técnicos nem blocos duplicados e exibem textos refinados', async () => {
    const demoSnapshot = createDemoCerMapReading('demo-enr-01')
    render(<CerMapReadingsView snapshot={demoSnapshot} />)

    // 1. Abrir Prestativo
    const prestativoBtn = screen.getByRole('button', {
      name: /Prestativo: categoria Aparece com muita força quando estou sob pressão/i,
    })
    await userEvent.click(prestativoBtn)

    const prestativoDialog = await screen.findByRole('dialog')
    expect(prestativoDialog).toBeInTheDocument()
    const prestativoText = prestativoDialog.textContent || ''

    // IDs técnicos NÃO devem vazar no texto visível
    expect(prestativoText).not.toMatch(/qa-(me|rel|reg|c1|c2|sex|sen)-/)
    expect(prestativoText).not.toMatch(/hiper_realizador|evitativo/)

    // NÃO exibe bloco antigo duplicado quando há elemento personalizado
    expect(prestativoText).not.toContain('PENSAMENTOS COMUNS QUANDO ATIVO')
    expect(prestativoText).not.toContain('SUA RESPOSTA DECLARADA')

    // NÃO contém afirmação causal de 'solidão' nem 'Não inferimos abandono infantil'
    expect(prestativoText).not.toContain('Sentimento velado de solidão')
    expect(prestativoText).not.toContain('Não inferimos abandono infantil')
    expect(prestativoText).toContain('Como é para você perceber que também precisa de cuidado?')
    expect(prestativoText).toContain('Vale investigar como o contexto muda sua experiência')

    // Fechar modal
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 1b. Abrir "Meu mundo emocional"
    const mundoEmocionalBtn = screen.getByRole('button', {
      name: /Abrir: Meu mundo emocional/i,
    })
    await userEvent.click(mundoEmocionalBtn)

    const mundoEmocionalDialog = await screen.findByRole('dialog')
    expect(mundoEmocionalDialog).toBeInTheDocument()
    const mundoEmocionalText = mundoEmocionalDialog.textContent || ''

    // Leitura própria do elementReading presente (conteúdo específico de mundo emocional)
    expect(mundoEmocionalText).toContain(
      'vivacidade afetiva sentida no corpo, ansiedade e entusiasmo',
    )
    expect(mundoEmocionalText).toContain('Seu universo emocional é rico e dinâmico')

    // Aviso demo presente
    expect(mundoEmocionalText).toContain('Exemplo fictício para explorar o Mapa CER')
    expect(mundoEmocionalText).toContain('Uma leitura possível')

    // Ausência de IDs técnicos crus visíveis
    expect(mundoEmocionalText).not.toContain('hiper_realizador')
    expect(mundoEmocionalText).not.toContain('evitativo')
    expect(mundoEmocionalText).not.toContain('vitima')
    expect(mundoEmocionalText).not.toContain('hiper_racional')
    expect(mundoEmocionalText).not.toContain('critico')

    // Ausência de título falso de revisão no snapshot demo não revisado
    expect(mundoEmocionalText).not.toContain('Interpretação revisada em conversa')

    // Sem duplicação de blocos genéricos
    expect(mundoEmocionalText).not.toContain('Como compreender esta dimensão')
    expect(mundoEmocionalText).not.toContain('Respostas compartilhadas nesta versão')

    // Fechar modal
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 2. Abrir Centro
    const centroBtn = screen.getByRole('button', {
      name: /Meu funcionamento em conjunto\. Toque para abrir síntese/i,
    })
    await userEvent.click(centroBtn)

    const centroDialog = await screen.findByRole('dialog')
    expect(centroDialog).toBeInTheDocument()
    const centroText = centroDialog.textContent || ''

    // IDs técnicos NÃO devem vazar no Centro
    expect(centroText).not.toMatch(/qa-(me|rel|reg|c1|c2|sex|sen)-/)
    // Novo texto de hipótese e custo suavizado
    expect(centroText).toContain('Uma hipótese a explorar reúne demandas e imprevisibilidade')
    expect(centroText).toContain(
      'Você relatou os elementos; as relações entre eles precisam ser reconhecidas ou corrigidas por você.',
    )
    expect(centroText).toContain(
      'Você relata sono interrompido e dificuldade de relaxar; a relação com as preocupações merece ser explorada.',
    )

    // Fechar modal
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 3. Abrir História
    const historiaBtn = screen.getByRole('button', {
      name: /Sua história e seu funcionamento hoje\. Toque para abrir conexões/i,
    })
    await userEvent.click(historiaBtn)

    const historiaDialog = await screen.findByRole('dialog')
    expect(historiaDialog).toBeInTheDocument()
    const historiaText = historiaDialog.textContent || ''

    // IDs técnicos NÃO devem vazar na História
    expect(historiaText).not.toMatch(/qa-(me|rel|reg|c1|c2|sex|sen)-/)
    // Novo texto Prakriti cuidadoso sem causa biológica/genética fechada
    expect(historiaText).toContain(
      'As características corporais que você reconhece há mais tempo são consideradas pela lente tradicional da Prakriti. Isso não mede sua genética nem explica sozinho os movimentos aprendidos ao longo da vida. Ainda precisamos conhecer sua história para explorar essas relações.',
    )
    expect(historiaText).not.toContain('expressam uma biologia de base')
  })

  it('não renderiza rows cruas/bloco de respostas na dimensão Corpo do demo e não exibe mensagem vazia falsa em Sexualidade', async () => {
    const demo = createDemoCerMapReading()
    render(<CerMapReadingsView snapshot={demo} />)

    // 1. Abrir dimensão Corpo pelo botão "Ver leitura completa da dimensão Corpo"
    const corpoBtn = screen.getByRole('button', {
      name: /Ver leitura completa da dimensão Corpo/i,
    })
    await userEvent.click(corpoBtn)

    const corpoDialog = await screen.findByRole('dialog')
    expect(corpoDialog).toBeInTheDocument()
    const corpoText = corpoDialog.textContent || ''

    // Presença da leitura e síntese personalizadas e explicação global leiga de Corpo
    expect(corpoText).toContain('Exemplo fictício para explorar o Mapa CER')
    expect(corpoText).toContain('Como compreender esta dimensão')
    expect(corpoText).toContain('O Ayurveda é uma tradição de cuidado que observa')
    expect(corpoText).toContain('Entenda os doshas e suas combinações')
    expect(corpoText).toContain('Vata — movimento e variabilidade')
    expect(corpoText).toContain('Pitta — transformação e calor')
    expect(corpoText).toContain('Kapha — sustentação e estabilidade')
    expect(corpoText).toContain('Sete combinações básicas')
    expect(corpoText).toContain('Vata–Pitta, Vata–Kapha, Pitta–Kapha')
    expect(corpoText).toContain('Prakriti — seu ponto de partida')
    expect(corpoText).toContain('Vikriti — seu momento atual')
    expect(corpoText).toContain('Agni observa, pela lente tradicional')
    expect(corpoText).toContain(
      'Mariana, neste exemplo fictício, o gráfico ilustra uma combinação Vata–Pitta',
    )
    expect(corpoText).toContain(
      'Os percentuais são ilustrativos, não foram calculados a partir de uma avaliação real',
    )
    expect(corpoText).toContain('Síntese da leitura')
    expect(corpoText).toContain('Uma leitura possível')

    // Afirmar AUSÊNCIA do bloco "Respostas compartilhadas nesta versão" e de IDs técnicos / valores crus
    expect(corpoText).not.toContain('Respostas compartilhadas nesta versão')
    expect(corpoText).not.toContain('Ainda não há respostas compartilhadas suficientes')
    expect(corpoText).not.toContain('light_interrupted')
    expect(corpoText).not.toContain('varies_drastically')
    expect(corpoText).not.toContain('fluctuates')
    expect(corpoText).not.toContain('irregular')
    expect(corpoText).not.toContain('variable')

    // Fechar diálogo do Corpo
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 2. Abrir dimensão Sexualidade
    const sexualidadeBtn = screen.getByRole('button', {
      name: /Abrir dimensão: Sexualidade & Intimidade/i,
    })
    await userEvent.click(sexualidadeBtn)

    const sexDialog = await screen.findByRole('dialog')
    expect(sexDialog).toBeInTheDocument()
    const sexText = sexDialog.textContent || ''

    // Afirmar AUSÊNCIA da mensagem vazia falsa e do bloco de rows
    expect(sexText).not.toContain('Ainda não há respostas compartilhadas suficientes')
    expect(sexText).not.toContain('Respostas compartilhadas nesta versão')

    // Afirmar PRESENÇA da síntese, interpretação e aviso de exemplo fictício
    expect(sexText).toContain('Exemplo fictício para explorar o Mapa CER')
    expect(sexText).toContain('Sexualidade & Intimidade')
    expect(sexText).toContain('A intimidade e a disponibilidade para o afeto aparecem nos relatos')
    expect(sexText).toContain('Uma leitura possível')

    // Fechar diálogo de Sexualidade
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 3. Abrir dimensão Sentido
    const sentidoBtn = screen.getByRole('button', {
      name: /Abrir dimensão: Sentido & Conexão/i,
    })
    await userEvent.click(sentidoBtn)

    const sentidoDialog = await screen.findByRole('dialog')
    expect(sentidoDialog).toBeInTheDocument()
    const sentidoText = sentidoDialog.textContent || ''

    // Afirmar AUSÊNCIA da mensagem vazia falsa e do bloco de rows
    expect(sentidoText).not.toContain('Ainda não há respostas compartilhadas suficientes')
    expect(sentidoText).not.toContain('Respostas compartilhadas nesta versão')

    // Afirmar PRESENÇA da síntese, interpretação e aviso de exemplo fictício
    expect(sentidoText).toContain('Exemplo fictício para explorar o Mapa CER')
    expect(sentidoText).toContain('Sentido & Conexão')
    expect(sentidoText).toContain('Bússola interna orientada por coerência ética')
  })

  it('exibe explicação leiga dos doshas SOMENTE na dimensão Corpo e nunca em outras dimensões', async () => {
    const demo = createDemoCerMapReading()
    render(<CerMapReadingsView snapshot={demo} />)

    // 1. Abrir Sexualidade
    const sexualidadeBtn = screen.getByRole('button', {
      name: /Abrir dimensão: Sexualidade & Intimidade/i,
    })
    await userEvent.click(sexualidadeBtn)
    const sexDialog = await screen.findByRole('dialog')
    const sexText = sexDialog.textContent || ''

    expect(sexText).not.toContain('Entenda os doshas e suas combinações')
    expect(sexText).not.toContain('Vata — movimento e variabilidade')
    expect(sexText).not.toContain('Sete combinações básicas')

    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape', code: 'Escape' })

    // 2. Abrir Corpo e validar presença
    const corpoBtn = screen.getByRole('button', {
      name: /Ver leitura completa da dimensão Corpo/i,
    })
    await userEvent.click(corpoBtn)
    const corpoDialog = await screen.findByRole('dialog')
    const corpoText = corpoDialog.textContent || ''

    expect(corpoText).toContain('Entenda os doshas e suas combinações')
    expect(corpoText).toContain('Vata — movimento e variabilidade')
    expect(corpoText).toContain('Pitta — transformação e calor')
    expect(corpoText).toContain('Kapha — sustentação e estabilidade')
    expect(corpoText).toContain('Sete combinações básicas')
  })

  it('no mapa real (não-demo), exibe explicação global sem atribuir o perfil Mariana e preserva fallback de rows', async () => {
    const realSnapshot = {
      schemaVersion: 1,
      enrollmentId: 'real-enr-42',
      participantName: 'Carlos Eduardo',
      generatedAt: '2025-05-01T10:00:00Z',
      sourceResponseIds: ['resp-corpo-01'],
      overview: 'Mapa consolidado de Carlos.',
      integration: '',
      history: '',
      dimensions: [
        {
          id: 'corpo',
          title: 'Corpo & Fisiologia',
          explanation: 'Conceito da dimensão corpo no modelo CER.',
          summary: 'Síntese real do participante Carlos.',
          interpretation: 'Leitura elaborada para Carlos.',
          summaryRows: [],
          detailedRows: [
            {
              label: 'Habitualmente · Sono',
              text: 'Sono profundo e regular.',
            },
          ],
          referenceIds: [],
        },
      ],
      references: [],
    }

    render(<CerMapReadingsView snapshot={realSnapshot as any} />)

    const corpoBtn = screen.getByRole('button', {
      name: /Ver leitura completa da dimensão Corpo/i,
    })
    await userEvent.click(corpoBtn)

    const dialog = await screen.findByRole('dialog')
    const text = dialog.textContent || ''

    // Explicação global leiga e doshas presentes
    expect(text).toContain('O Ayurveda é uma tradição de cuidado que observa')
    expect(text).toContain('Entenda os doshas e suas combinações')
    expect(text).toContain('Sete combinações básicas')
    expect(text).toContain('Prakriti — seu ponto de partida')
    expect(text).toContain('Vikriti — seu momento atual')

    // Conteúdo próprio de Carlos presente
    expect(text).toContain('Síntese real do participante Carlos.')
    expect(text).toContain('Leitura elaborada para Carlos.')

    // NÃO deve conter o texto personalizado de Mariana
    expect(text).not.toContain('Mariana, neste exemplo fictício')
    expect(text).not.toContain('Exemplo fictício para explorar o Mapa CER')

    // Preserva fallback de respostas compartilhadas para dados reais
    expect(text).toContain('Respostas compartilhadas nesta versão')
    expect(text).toContain('Habitualmente · Sono')
    expect(text).toContain('Sono profundo e regular.')
  })
})
