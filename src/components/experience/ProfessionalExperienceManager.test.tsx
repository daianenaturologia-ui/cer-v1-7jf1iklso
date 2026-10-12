import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalExperienceManager } from './ProfessionalExperienceManager'

const services = vi.hoisted(() => ({ list: vi.fn(), responses: vi.fn() }))
vi.mock('@/services/experienceEngine', () => ({
  enrollmentExperienceService: { listByEnrollment: services.list },
  experienceResponseService: { listResponsesByExperience: services.responses },
  experienceCatalogService: {},
}))
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) =>
    open ? (
      <section role="dialog">
        <button onClick={() => onOpenChange(false)}>Fechar</button>
        {children}
      </section>
    ) : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}))
const experience = (id: string) =>
  ({
    id,
    experience_id: id,
    release_status: 'completed',
    progress_status: 'completed',
    expand: { experience_id: { title: id } },
  }) as any
const response = (text: string, extra = {}) =>
  ({
    id: text,
    enrollment_id: 'A',
    access_class: 'shared_care',
    status: 'saved',
    structured_value: text,
    created: '2026-01-01',
    ...extra,
  }) as any
const deferred = () => {
  let resolve!: (value: any) => void
  const promise = new Promise<any>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.resetAllMocks()
  services.list.mockResolvedValue([experience('Primeira'), experience('Segunda')])
})
describe('Leitura profissional de respostas compartilhadas', () => {
  it('exibe apenas finalizadas compartilhadas da matrícula atual e oculta texto sem consentimento', async () => {
    services.responses.mockResolvedValue([
      response('Compartilhada'),
      response('Privada', { access_class: 'participant_private' }),
      response('Rascunho', { status: 'draft' }),
      response('Outra matrícula', { enrollment_id: 'B' }),
      response('Sem classificação', { access_class: undefined }),
      response('Split', {
        structured_value: {
          choice: 'Escolha pública',
          private_text: 'Texto confidencial',
          free_text: 'Texto confidencial',
          share_private_text_with_professional: false,
        },
        free_text: 'Texto confidencial',
      }),
    ])
    render(<ProfessionalExperienceManager enrollment={{ id: 'A' } as any} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Ver Respostas' }))[0])
    expect(await screen.findByText('Compartilhada')).toBeInTheDocument()
    for (const text of [
      'Privada',
      'Rascunho',
      'Outra matrícula',
      'Sem classificação',
      'Texto confidencial',
    ])
      expect(screen.queryByText(text, { exact: false })).not.toBeInTheDocument()
    expect(screen.getByText(/Escolha pública/)).toBeInTheDocument()
  })
  it('limpa respostas anteriores e mostra erro com recuperação em vez de conteúdo de outra experiência', async () => {
    services.responses
      .mockResolvedValueOnce([response('Anterior')])
      .mockRejectedValueOnce(new Error('Falha simulada'))
      .mockResolvedValueOnce([response('Recuperada')])
    render(<ProfessionalExperienceManager enrollment={{ id: 'A' } as any} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Ver Respostas' }))[0])
    await screen.findByText('Anterior')
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver Respostas' })[1])
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as respostas.',
    )
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Recuperada')).toBeInTheDocument()
  })
  it('ignora resposta atrasada após troca de matrícula', async () => {
    const delayed = deferred()
    services.responses.mockReturnValue(delayed.promise)
    const { rerender } = render(<ProfessionalExperienceManager enrollment={{ id: 'A' } as any} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Ver Respostas' }))[0])
    rerender(<ProfessionalExperienceManager enrollment={{ id: 'B' } as any} />)
    await act(async () => {
      delayed.resolve([response('Resposta de A')])
      await delayed.promise
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Resposta de A')).not.toBeInTheDocument()
  })
  it('diferencia falha da listagem de ausência de experiências e permite repetir', async () => {
    services.list.mockRejectedValueOnce(new Error('Falha simulada')).mockResolvedValueOnce([])
    render(<ProfessionalExperienceManager enrollment={{ id: 'A' } as any} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as experiências.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() =>
      expect(
        screen.getByText('Nenhuma experiência vinculada a esta interagente.'),
      ).toBeInTheDocument(),
    )
  })
})
