import React from 'react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DevelopmentResourceEditor } from './DevelopmentResourceEditor'
import { SelfDevelopmentJourney } from './SelfDevelopmentJourney'
import { ResourceMaterial } from './ResourceMaterial'
import { demoAdapter, DEMO_ENROLLMENT_ID } from '@/services/demoAdapter'
import { selfDevelopmentService } from '@/services/selfDevelopment'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => {
      throw Error('No backend')
    },
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
})
afterEach(cleanup)
const fill = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } })
it('guarda só o título, retoma, exige completar e publica PDF com origem preservada', async () => {
  render(<DevelopmentResourceEditor />)
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Criar recurso educativo' }))
  fill('Nome do recurso', 'Livro futuro fictício')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
  await screen.findByText('Rascunho salvo.')
  cleanup()
  render(<DevelopmentResourceEditor />)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar rascunho' }))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar no acervo' }))
  await screen.findByRole('alert')
  expect(
    (await selfDevelopmentService.catalog()).resources.some(
      (r) => r.title === 'Livro futuro fictício',
    ),
  ).toBe(false)
  fill('Formato do material', 'pdf')
  fill('Endereço do material (HTTPS)', 'https://example.org/ficticio.pdf')
  fill('Autoria e créditos', 'Autoria fictícia de teste')
  fill('Fontes e referências', 'Referência fictícia')
  fill('O que este recurso ensina?', 'Apresentação educativa fictícia')
  fill('Como experimentar? Um passo por linha, até 12 passos.', 'Leia no seu ritmo.')
  fireEvent.click(screen.getByRole('button', { name: 'Publicar no acervo' }))
  await screen.findByText(/Recurso publicado/)
  cleanup()
  demoAdapter.setActivePersona('mariana')
  render(
    <MemoryRouter>
      <SelfDevelopmentJourney enrollmentId={DEMO_ENROLLMENT_ID} carePlan libraryOnly />
    </MemoryRouter>,
  )
  await screen.findByText('Livro futuro fictício')
  fill('Buscar na Biblioteca', 'livro futuro')
  fill('Formato', 'audio')
  await screen.findByText(/Nenhum recurso encontrado/)
  fill('Formato', 'pdf')
  expect(screen.getAllByRole('button', { name: 'Adicionar ao meu plano' })).toHaveLength(1)
  fireEvent.click(screen.getByText('Conhecer a proposta'))
  expect(screen.getByRole('link', { name: /Abrir PDF/ }).getAttribute('href')).toBe(
    'https://example.org/ficticio.pdf',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao meu plano' }))
  expect(await screen.findByText('Autoria: Autoria fictícia de teste')).toBeTruthy()
})
it('falha de gravação mantém conteúdo aberto e não anuncia publicação', async () => {
  render(<DevelopmentResourceEditor />)
  fireEvent.click(screen.getByRole('button', { name: 'Criar recurso educativo' }))
  fill('Nome do recurso', 'Não perder meu rascunho')
  const spy = vi
    .spyOn(selfDevelopmentService, 'saveResource')
    .mockRejectedValueOnce(Error('Falha simulada'))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }))
  await screen.findByText('Falha simulada')
  expect((screen.getByLabelText('Nome do recurso') as HTMLInputElement).value).toBe(
    'Não perder meu rascunho',
  )
  expect(screen.queryByText('Rascunho salvo.')).toBeNull()
  spy.mockRestore()
})
it('não transforma endereço executável de um snapshot em link', () => {
  render(
    <ResourceMaterial
      material={{
        format: 'pdf',
        url: 'javascript:alert(1)',
        author: '',
        references: '',
        conditions: '',
      }}
    />,
  )
  expect(screen.queryByRole('link')).toBeNull()
})
