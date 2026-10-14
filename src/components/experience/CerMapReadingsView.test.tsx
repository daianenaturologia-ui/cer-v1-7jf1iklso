// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapReadingsView } from './CerMapReadingsView'
import { buildCerMapReadings, isCerMapReadingSnapshot } from '@/services/cerMapReadings'
import { createDemoCerMapReading } from '@/services/demoCerMapReading'

async function closeAndRestore(trigger: HTMLElement) {
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(trigger).toHaveFocus())
}

describe('Mapa CER: percurso de leitura e teclado', () => {
  it('apresenta uma visão única identificada com o nome da pessoa', () => {
    render(<CerMapReadingsView snapshot={buildCerMapReadings([], 'enr', 'Lia')} />)
    expect(screen.getByText('Meu Mapa CER · Lia')).toBeVisible()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('explica o mapa e devolve o foco ao fechar, sem abrir dois diálogos', async () => {
    render(<CerMapReadingsView snapshot={buildCerMapReadings([], 'enr', 'Lia')} />)
    const trigger = screen.getByRole('button', {
      name: 'Abrir explicação: Como este mapa ajuda você',
    })
    await userEvent.click(trigger)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Como este mapa ajuda você' })).toBeVisible()
    expect(dialog).toHaveTextContent(/autoconhecimento/)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    await closeAndRestore(trigger)
  })

  it.each([
    ['sem números', []],
    ['soma inválida', ['50%', '30%', '30%']],
    ['número inválido', ['NaN%', '30%', '20%']],
  ])('não fabrica distribuição: %s', (_label, values) => {
    const snapshot = buildCerMapReadings([], 'enr', 'Lia')
    snapshot.dimensions[0].summaryRows = values.map((text, i) => ({
      label: ['Vata percentual', 'Pitta percentual', 'Kapha percentual'][i],
      text,
    }))
    render(<CerMapReadingsView snapshot={snapshot} />)
    expect(screen.queryByTestId('cer-dosha-donut')).not.toBeInTheDocument()
    expect(screen.getByText(/Ela não mede uma porcentagem de doshas/)).toBeVisible()
  })

  it('mostra apenas percentuais explicitamente registrados e válidos', () => {
    const snapshot = buildCerMapReadings([], 'enr', 'Lia')
    snapshot.dimensions[0].summaryRows = ['50%', '30%', '20%'].map((text, i) => ({
      label: ['Vata percentual', 'Pitta percentual', 'Kapha percentual'][i],
      text,
    }))
    render(<CerMapReadingsView snapshot={snapshot} />)
    expect(screen.getByTestId('cer-dosha-donut')).toBeVisible()
    for (const label of ['Vata: 50%', 'Pitta: 30%', 'Kapha: 20%'])
      expect(screen.getByText(label)).toBeVisible()
  })

  it('distingue dúvida explícita de resposta não informada', () => {
    const snapshot = buildCerMapReadings([], 'enr', 'Lia')
    snapshot.dimensions.find((d) => d.id === 'mente')!.detailedRows = [
      { label: 'prestativo', text: 'Ainda não sei dizer' },
    ]
    render(<CerMapReadingsView snapshot={snapshot} />)
    expect(
      screen.getByRole('button', { name: /Prestativo: categoria Ainda não sei dizer/ }),
    ).toHaveTextContent('Ainda não sei')
    expect(
      screen.getByRole('button', { name: /Hipervigilante: categoria Não informado/ }),
    ).toBeVisible()
  })

  it('mantém as dez categorias ordinais do cenário sem transformar comportamentos em percentuais', () => {
    const snapshot = createDemoCerMapReading()
    expect(isCerMapReadingSnapshot(snapshot)).toBe(true)
    render(<CerMapReadingsView snapshot={snapshot} />)
    expect(
      screen.getAllByRole('button', { name: /categoria .*Toque para abrir detalhes/ }),
    ).toHaveLength(10)
    expect(screen.queryAllByRole('button', { name: /categoria Não informado/ })).toHaveLength(0)
    expect(
      screen.getByRole('button', { name: /Prestativo: categoria Aparece com muita força/ }),
    ).toHaveTextContent('Sob pressão')
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reação Luta.*Relatada por você/ })).toBeVisible()
  })

  it.each([
    ['pitta', 'click', 'Dosha Pitta'],
    ['kapha', 'Enter', 'Dosha Kapha'],
    ['vata', ' ', 'Dosha Vata'],
  ])('abre a fatia %s por %s e restaura o foco', async (id, key, title) => {
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    const trigger = screen.getByTestId(`dosha-slice-${id}`)
    if (key === 'click') await userEvent.click(trigger)
    else {
      trigger.focus()
      fireEvent.keyDown(trigger, { key })
    }
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: title })).toBeVisible()
    await closeAndRestore(trigger)
  })

  it('Prestativo e Hipervigilante recebem leituras distintas sem IDs técnicos', async () => {
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    const trigger = screen.getByRole('button', { name: /Prestativo: categoria/ })
    await userEvent.click(trigger)
    const text = (await screen.findByRole('dialog')).textContent!
    expect(text).toContain('Sensibilidade e cuidado')
    expect(text).toContain('Como se conecta ao conjunto')
    expect(text).not.toMatch(/qa-(me|c1|rel)-|hiper_realizador|infância traumática/)
    await closeAndRestore(trigger)
    await userEvent.click(screen.getByRole('button', { name: /Hipervigilante: categoria/ }))
    const next = (await screen.findByRole('dialog')).textContent!
    expect(next).not.toBe(text)
    expect(next).not.toContain('Colocar minhas necessidades depois:')
  })

  it('centro permite escolher a síntese integrada e mantém os objetivos no mapa', async () => {
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    await userEvent.click(
      screen.getByRole('button', { name: /Centro integrador: Pessoa e Objetivos/ }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Meu funcionamento em conjunto' }),
    ).toBeVisible()
    await userEvent.click(within(dialog).getByText('Sua síntese integrada', { exact: true }))
    expect(dialog.querySelector('details')).toHaveAttribute('open')
    expect(dialog).not.toHaveTextContent(/qa-(me|c1|reg)-/)
  })

  it('história sem marcos não inventa acontecimentos familiares', async () => {
    const snapshot = buildCerMapReadings([], 'enr', 'Joana')
    render(<CerMapReadingsView snapshot={snapshot} />)
    const trigger = screen.getByRole('button', {
      name: 'Abrir histórico e conexões da Linha da Vida',
    })
    await userEvent.click(trigger)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Sua história e seu funcionamento hoje')
    expect(dialog).not.toHaveTextContent(/pais rígidos|infância traumática|Mariana/)
    await closeAndRestore(trigger)
  })

  it('Corpo oferece explicação e detalhes sob escolha, sem valores técnicos crus', async () => {
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Corpo' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog.className).toContain('max-w-3xl')
    expect(dialog).toHaveTextContent('Vata–Pitta')
    const trigger = within(dialog).getByRole('button', {
      name: 'Entenda os doshas e suas combinações',
    })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(dialog).toHaveTextContent(/sustentação e .*estabilidade/)
    expect(dialog).not.toHaveTextContent(/light_interrupted|varies_drastically|qa-c1-/)
  })

  it('mapa de outra pessoa preserva seus registros sem receber a leitura fictícia de Mariana', async () => {
    const snapshot = buildCerMapReadings([], 'real', 'Carlos')
    snapshot.dimensions[0].detailedRows = [
      { label: 'Habitualmente · Sono', text: 'Sono profundo e regular.' },
    ]
    render(<CerMapReadingsView snapshot={snapshot} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Interpretação dessa dimensão: Corpo' }),
    )
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Respostas e registros deste mapa' }),
    )
    expect(within(dialog).getByText('Sono profundo e regular.')).toBeVisible()
    expect(dialog).not.toHaveTextContent(/Mariana|Vata–Pitta/)
  })

  it('Sexualidade e Sentido têm leitura própria e não recebem explicação de doshas', async () => {
    render(<CerMapReadingsView snapshot={createDemoCerMapReading()} />)
    for (const title of ['Sexualidade & Intimidade', 'Sentido & Conexão']) {
      const trigger = screen.getByRole('button', { name: `Interpretação dessa dimensão: ${title}` })
      await userEvent.click(trigger)
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByRole('heading', { name: title })).toBeVisible()
      expect(dialog).not.toHaveTextContent(
        /Ainda não há respostas compartilhadas suficientes|Entenda os doshas/,
      )
      const details = within(dialog)
        .getAllByRole('button', { name: /.+/ })
        .filter((b) => b.hasAttribute('aria-expanded'))
      expect(details.length).toBeGreaterThan(0)
      await userEvent.click(details[0])
      expect(details[0]).toHaveAttribute('aria-expanded', 'true')
      await closeAndRestore(trigger)
    }
  })
})

it('mostra as relações revisadas mesmo quando há uma leitura estruturada da história', async () => {
  const snapshot = buildCerMapReadings([], 'enr', 'Lia')
  snapshot.elementReadings = {
    historia: {
      summary: 'Leitura da história',
      observations: [],
      interpretation: '',
      resources: [],
      costs: [],
      connections: [],
      questions: [],
    },
  }
  snapshot.lifeEvents = [
    {
      id: 'event',
      enrollment_id: 'enr',
      title: 'Mudança de escola',
      emotions: ['Medo'],
      narrative: 'Relato fictício',
      time_kind: 'age',
      time_value: '8',
      access_class: 'participant_shared',
    },
  ]
  snapshot.dimensions[1].detailedRows = [
    { label: 'Resposta', text: 'Observo antes de me aproximar', sourceResponseId: 'r' },
  ]
  snapshot.lifeConnections = [
    {
      eventId: 'event',
      responseId: 'r',
      text: 'Relação a explorar',
      question: 'Faz sentido?',
      feeling: 'Medo',
      protection: 'Observar',
      recognition: 'Ainda não sabe',
      resources: 'Professora',
      priority: 'Pedir apoio',
    },
  ]
  render(<CerMapReadingsView snapshot={snapshot} />)
  await userEvent.click(
    screen.getByRole('button', { name: 'Abrir histórico e conexões da Linha da Vida' }),
  )
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Hipótese para conversar')
  expect(dialog).toHaveTextContent('Resposta atual: Observo antes de me aproximar')
  expect(dialog).toHaveTextContent('O que reconhece ou questiona: Ainda não sabe')
  expect(dialog).toHaveTextContent('Prioridade de cuidado: Pedir apoio')
})
