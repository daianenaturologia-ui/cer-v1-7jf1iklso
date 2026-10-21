import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { LibraryCommunity } from './LibraryCommunity'
import { LibraryComments } from './LibraryComments'
import { libraryCommunity as lib, emptyCommunityPractice } from '@/services/libraryCommunity'
import { demoAdapter } from '@/services/demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    send: vi.fn(() => {
      throw Error('No backend in demonstration')
    }),
  },
}))
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
const p = {
  ...emptyCommunityPractice(),
  title: 'Prática fictícia de presença',
  instructions: 'Olhar uma árvore no seu ritmo.',
  experience: 'Relato fictício de uma pausa.',
  display_name: 'Apelido de teste',
}
it('saves a private draft and sends only after explicit approval of sharing', async () => {
  render(<LibraryCommunity />)
  await screen.findByText(/As primeiras práticas aparecerão/)
  expect(screen.queryByText('Avaliar contribuições')).toBeNull()
  fireEvent.click(screen.getByText('Minhas contribuições'))
  fireEvent.click(await screen.findByText('Criar minha prática de regulação'))
  const form = screen.getByRole('form', { name: 'Minha contribuição para a Biblioteca' })
  fireEvent.change(within(form).getByLabelText('Nome da prática'), { target: { value: p.title } })
  fireEvent.change(within(form).getByLabelText('Como fazer: passo a passo'), {
    target: { value: p.instructions },
  })
  fireEvent.change(within(form).getByLabelText('Minha experiência com esta prática'), {
    target: { value: p.experience },
  })
  fireEvent.change(within(form).getByLabelText('Nome ou apelido para publicar'), {
    target: { value: p.display_name },
  })
  expect(within(form).getByText('Enviar para avaliação de Daiane')).toBeDisabled()
  fireEvent.click(within(form).getByText('Salvar rascunho e continuar depois'))
  await screen.findByText(/Rascunho privado salvo/)
  expect((await lib.feed()).items).toEqual([])
  fireEvent.click(within(form).getByRole('checkbox'))
  fireEvent.click(within(form).getByText('Enviar para avaliação de Daiane'))
  await screen.findByText(/Enviada para Daiane avaliar/)
  expect((await lib.mine()).items[0].status).toBe('pending')
  expect((await lib.feed()).items).toEqual([])
})
it('curator reviews the exact content and confirms before publication', async () => {
  await lib.save(p, true, true)
  demoAdapter.enableDemo('daiane')
  render(<LibraryCommunity />)
  fireEvent.click(await screen.findByText('Avaliar contribuições'))
  await screen.findByText(p.title)
  fireEvent.click(screen.getByText('Aprovar esta prática'))
  expect((await lib.feed()).items).toEqual([])
  fireEvent.click(screen.getByText('Confirmar aprovação e publicar'))
  await screen.findByText(/Aprovada e publicada/)
  expect((await lib.feed()).items[0].payload).toEqual(p)
})
it('comment form explains audience, requires consent and supports withdrawal', async () => {
  render(<LibraryComments targetKey="catalog:cer-ritmo-v1" />)
  fireEvent.click(screen.getByText('Experiências da comunidade'))
  await screen.findByText('Como foi experimentar?')
  expect(screen.getByText(/Seu Mapa CER, sua história/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Nome ou apelido para publicar'), {
    target: { value: 'Apelido' },
  })
  fireEvent.change(screen.getByLabelText('Minha experiência com esta prática'), {
    target: { value: 'Exemplo fictício' },
  })
  expect(screen.getByText('Publicar experiência')).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByText('Publicar experiência'))
  await screen.findByText('Sua experiência foi publicada nesta prática.')
  fireEvent.click(screen.getByText('Retirar meu comentário'))
  expect((await lib.comments('catalog:cer-ritmo-v1')).items).toHaveLength(1)
  fireEvent.click(screen.getByText('Confirmar retirada'))
  await screen.findByText('Comentário retirado da área compartilhada.')
  expect((await lib.comments('catalog:cer-ritmo-v1')).items).toEqual([])
})
it('failed submission preserves the form and never claims publication', async () => {
  vi.spyOn(lib, 'save').mockRejectedValueOnce(
    Error('Falha de conexão; seu formulário continua aqui.'),
  )
  render(<LibraryCommunity />)
  await screen.findByText(/As primeiras práticas aparecerão/)
  fireEvent.click(screen.getByText('Minhas contribuições'))
  fireEvent.click(await screen.findByText('Criar minha prática de regulação'))
  fireEvent.change(screen.getByLabelText('Nome da prática'), { target: { value: 'Meu rascunho' } })
  fireEvent.click(screen.getByText('Salvar rascunho e continuar depois'))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Nome da prática')).toHaveValue('Meu rascunho')
  expect(screen.queryByText(/Rascunho privado salvo/)).toBeNull()
  expect(screen.queryByText(/Enviada para Daiane avaliar/)).toBeNull()
})
it('approved revision warns that edits return to review', async () => {
  const pending = await lib.save(p, true, true)
  demoAdapter.enableDemo('daiane')
  await lib.review(pending, 'approve', '')
  demoAdapter.enableDemo('mariana')
  render(<LibraryCommunity />)
  await screen.findByText(p.title)
  fireEvent.click(screen.getByText('Minhas contribuições'))
  fireEvent.click(await screen.findByText('Revisar minha prática'))
  expect(
    screen.getByText(/Ao salvar alterações, a versão publicada será retirada/),
  ).toBeInTheDocument()
  expect(screen.getByRole('checkbox')).not.toBeChecked()
})
