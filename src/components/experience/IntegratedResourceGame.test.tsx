import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegratedResourceGame } from './IntegratedResourceGame'
import { buildCerMapReadings } from '@/services/cerMapReadings'
import { resourceExerciseService } from '@/services/cerResourceExercise'
import { demoAdapter } from '@/services/demoAdapter'
function snapshot(id = 'a') {
  const s = buildCerMapReadings([], id, 'Lia')
  s.dimensions[1].insights = [
    {
      id: 'strength:criatividade',
      kind: 'strength',
      label: 'Criatividade',
      description: 'Criar caminhos',
      origins: [
        { dimensionId: 'mente', label: 'Resposta', basis: 'reference', sourceResponseIds: [] },
      ],
    },
    {
      id: 'difficulty:comecar',
      kind: 'difficulty',
      label: 'Começar',
      description: 'Um primeiro passo',
      origins: [
        { dimensionId: 'mente', label: 'Resposta', basis: 'reference', sourceResponseIds: [] },
      ],
    },
  ]
  return s
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.enableDemo('mariana')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
describe('Jogo de conexões', () => {
  it('seleciona por toque/teclado, conecta, acrescenta, edita, salva e retorna', async () => {
    const user = userEvent.setup()
    const s = snapshot()
    const { unmount } = render(<IntegratedResourceGame snapshot={s} />)
    const force = await screen.findByRole('button', { name: 'Selecionar força: Criatividade' })
    force.focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Conectar força a: Começar' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
      'Dividir em um passo pequeno',
    )
    await user.type(screen.getByRole('textbox', { name: 'Meu novo item' }), 'Pedir ajuda')
    await user.click(screen.getByRole('button', { name: 'Acrescentar' }))
    await user.click(screen.getByRole('button', { name: 'Editar meu item' }))
    const input = screen.getByRole('textbox', { name: 'Novo texto: Pedir ajuda' })
    await user.clear(input)
    await user.type(input, 'Buscar apoio')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar meu exercício' }))
    await screen.findByText('Exercício salvo. Você pode voltar a ele depois.')
    unmount()
    render(<IntegratedResourceGame snapshot={s} />)
    expect(
      await screen.findByRole('button', { name: 'Selecionar força: Buscar apoio' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
    ).toHaveValue('Dividir em um passo pequeno')
  })
  it('aceita arrastar e soltar, permite desfazer e restaurar itens sem perder a conexão', async () => {
    const user = userEvent.setup()
    render(<IntegratedResourceGame snapshot={snapshot()} />)
    const force = await screen.findByRole('button', { name: 'Selecionar força: Criatividade' })
    const values: Record<string, string> = {}
    const transfer = {
      setData: (k: string, v: string) => (values[k] = v),
      getData: (k: string) => values[k] || '',
      effectAllowed: '',
      dropEffect: '',
    }
    fireEvent.dragStart(force, { dataTransfer: transfer })
    fireEvent.drop(screen.getByRole('button', { name: 'Conectar força a: Começar' }), {
      dataTransfer: transfer,
    })
    expect(
      await screen.findByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retirar item: Criatividade' }))
    expect(
      screen.queryByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
    ).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Restaurar itens retirados' }))
    expect(
      screen.getByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Desfazer conexão: Criatividade com Começar' }),
    )
    expect(
      screen.queryByRole('textbox', { name: 'Como usar Criatividade diante de Começar' }),
    ).toBeNull()
  })
  it('trocar de pessoa ignora resposta tardia e não traz o exercício anterior', async () => {
    let resolve: any
    vi.spyOn(resourceExerciseService, 'load').mockImplementation((id) =>
      id === 'a' ? new Promise((r) => (resolve = r)) : Promise.resolve(null),
    )
    const { rerender } = render(<IntegratedResourceGame snapshot={snapshot('a')} />)
    rerender(<IntegratedResourceGame snapshot={snapshot('b')} />)
    await screen.findByRole('button', { name: 'Selecionar força: Criatividade' })
    resolve({
      id: 'a',
      revision: 1,
      data: {
        schemaVersion: 1,
        enrollmentId: 'a',
        sourceFingerprint: 'v',
        customItems: [{ id: 'personal:x', kind: 'strength', label: 'EXERCÍCIO ANTERIOR' }],
        hiddenIds: [],
        connections: [],
      },
    })
    await waitFor(() => expect(screen.queryByText('EXERCÍCIO ANTERIOR')).toBeNull())
  })
  it('visão profissional não carrega nem modifica o exercício privado', () => {
    const load = vi.spyOn(resourceExerciseService, 'load')
    render(<IntegratedResourceGame snapshot={snapshot()} readOnly />)
    expect(load).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText(/ficam na visão da interagente/)).toBeInTheDocument()
  })
  it('falha no carregamento bloqueia edição; erro ao salvar conserva as alterações', async () => {
    const user = userEvent.setup()
    const load = vi
      .spyOn(resourceExerciseService, 'load')
      .mockRejectedValueOnce(new Error('offline'))
    render(<IntegratedResourceGame snapshot={snapshot()} />)
    await screen.findByRole('alert')
    expect(screen.queryByRole('textbox')).toBeNull()
    load.mockResolvedValue(null)
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await screen.findByRole('button', { name: 'Selecionar força: Criatividade' })
    vi.spyOn(resourceExerciseService, 'save').mockRejectedValue(new Error('offline'))
    await user.type(screen.getByRole('textbox', { name: 'Meu novo item' }), 'Apoio')
    await user.click(screen.getByRole('button', { name: 'Acrescentar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar meu exercício' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Selecionar força: Apoio' })).toBeInTheDocument()
  })
})
