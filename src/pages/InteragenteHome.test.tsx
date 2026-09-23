import '@testing-library/jest-dom/vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { InteragenteHome } from './InteragenteHome'
import { demoAdapter } from '@/services/demoAdapter'
import { cerJournalService } from '@/services/cerJournalService'
import pb from '@/lib/pocketbase/client'

// Mock useAuth
const mockUser = {
  id: 'usr_mariana_01',
  email: 'mariana@cer.local',
  role: 'interagente',
  person_id: 'person_mariana_01',
}

const mockPerson = {
  id: 'person_mariana_01',
  full_name: 'Mariana Silva',
  preferred_name: 'Mariana',
  email: 'mariana@cer.local',
  treatment_preference: 'feminino',
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    person: mockPerson,
    persona: 'mariana',
    setPersona: vi.fn(),
    logout: vi.fn(),
  }),
}))

describe('Correção Executiva 1 de 2: Pré-consulta visível e Daiane sem prefixo $', () => {
  beforeEach(() => {
    localStorage.clear()
    demoAdapter.setEnabled(true)
    // Reset state in demoAdapter to known initial state
    ;(demoAdapter as any).state.messages = []
  })

  it('Cenários A a F, H, I, J: Ciclo completo da pré-consulta na tela InteragenteHome', async () => {
    // Espionar chamadas ao PocketBase para confirmar zero chamadas (Cenário J)
    const pbSendSpy = vi.spyOn(pb, 'send')
    const pbCollectionSpy = vi.spyOn(pb, 'collection')

    // 1. Renderiza a tela
    const { unmount } = render(
      <MemoryRouter>
        <InteragenteHome />
      </MemoryRouter>,
    )

    // Aguardar carregar
    await waitFor(() => {
      expect(screen.getByText(/Seu Espaço Inicial de Acolhimento/i)).toBeInTheDocument()
    })

    // Confirmar que $Daiane não aparece em lugar algum (Cenário I)
    const textNodes = document.body.textContent || ''
    expect(textNodes).not.toContain('$Daiane')
    expect(textNodes).not.toContain('$Daia')

    // Cenário A: Preencher as três perguntas
    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBeGreaterThanOrEqual(3)

    const ans1 = 'Busco compreender minhas oscilações de energia'
    const ans2 = 'Minha respiração e caminhadas ao ar livre'
    const ans3 = 'Gostaria de cuidar da qualidade do meu sono'

    fireEvent.change(textareas[0], { target: { value: ans1 } })
    fireEvent.change(textareas[1], { target: { value: ans2 } })
    fireEvent.change(textareas[2], { target: { value: ans3 } })

    // Cenário B: Salvar como rascunho
    const btnDraft = screen.getByRole('button', { name: /Salvar Rascunho/i })
    fireEvent.click(btnDraft)

    await waitFor(() => {
      const draftMsg = (demoAdapter as any).state.messages.find((m: any) => m.status === 'draft')
      expect(draftMsg).toBeDefined()
      expect(draftMsg?.message_text).toContain(ans1)
      expect(draftMsg?.message_text).toContain(ans2)
      expect(draftMsg?.message_text).toContain(ans3)
    })

    // Cenário C: Recarregar / remontar e confirmar retomada do rascunho
    unmount()

    const { unmount: unmount2 } = render(
      <MemoryRouter>
        <InteragenteHome />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
      expect(inputs[0].value).toBe(ans1)
      expect(inputs[1].value).toBe(ans2)
      expect(inputs[2].value).toBe(ans3)
    })

    // Cenário D: Enviar para Daiane
    const btnSend = screen.getByRole('button', { name: /Enviar para Daiane/i })
    fireEvent.click(btnSend)

    // Cenário E: Confirmar que o bloco "Enviado para Daiane" mostra literalmente as três respostas
    await waitFor(() => {
      expect(screen.getByTestId('bloco-enviado-para-daiane')).toBeInTheDocument()
    })

    const bloco = screen.getByTestId('bloco-enviado-para-daiane')
    expect(bloco.textContent).toContain(ans1)
    expect(bloco.textContent).toContain(ans2)
    expect(bloco.textContent).toContain(ans3)
    // Título ou badge explicitamente "Enviado para Daiane"
    expect(screen.getAllByText(/Enviado para Daiane/i).length).toBeGreaterThanOrEqual(1)

    // Confirmar persistência no demoAdapter
    const approved = (demoAdapter as any).state.messages.filter((m: any) => m.status === 'approved')
    expect(approved.length).toBe(1)
    expect(approved[0].author_type).toBe('participant')

    // Cenário F: Recarregar / remontar e confirmar que o bloco continua visível
    unmount2()

    render(
      <MemoryRouter>
        <InteragenteHome />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('bloco-enviado-para-daiane')).toBeInTheDocument()
    })

    const blocoRecarregado = screen.getByTestId('bloco-enviado-para-daiane')
    expect(blocoRecarregado.textContent).toContain(ans1)
    expect(blocoRecarregado.textContent).toContain(ans2)
    expect(blocoRecarregado.textContent).toContain(ans3)

    // Cenário H: Iniciar novo relato sem apagar o primeiro
    const btnNovo = screen.getByRole('button', { name: /Enviar novo relato/i })
    fireEvent.click(btnNovo)

    // Formulário reaparece limpo
    await waitFor(() => {
      const newInputs = screen.getAllByRole('textbox') as HTMLTextAreaElement[]
      expect(newInputs[0].value).toBe('')
    })

    const ans1Novo = 'Segunda mensagem complementar sobre ansiedade matinal'
    const newTextareas = screen.getAllByRole('textbox')
    fireEvent.change(newTextareas[0], { target: { value: ans1Novo } })

    const btnSendNovo = screen.getByRole('button', { name: /Enviar para Daiane/i })
    fireEvent.click(btnSendNovo)

    await waitFor(() => {
      const blocoAtualizado = screen.getByTestId('bloco-enviado-para-daiane')
      expect(blocoAtualizado.textContent).toContain(ans1Novo)
      // O histórico preserva o primeiro relato
      expect(screen.getByText(/Envios anteriores/i)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(ans1))).toBeInTheDocument()
    })

    // Cenário J: Zero chamadas ao backend PocketBase conectado
    expect(pbSendSpy).not.toHaveBeenCalled()
    expect(pbCollectionSpy).not.toHaveBeenCalled()
  })

  it('Cenário G: Alternar para Daiane e confirmar que ela recebe o relato com autoria correta', async () => {
    // Configura mensagem aprovada no demoAdapter
    const createdMsg = await cerJournalService.createNextSessionMessage({
      enrollment_id: 'enr_mariana_demo_01',
      message_text: 'O que a traz:\nDor lombar e cansaço',
      as_draft: false,
    })

    expect(createdMsg.status).toBe('approved')
    expect(createdMsg.author_type).toBe('participant')

    // Daiane consulta as mensagens como profissional
    const messagesForProf = await cerJournalService.listApprovedMessagesForProfessional('enr_mariana_demo_01')
    expect(messagesForProf.length).toBeGreaterThanOrEqual(1)
    const profViewMsg = messagesForProf.find((m) => m.id === createdMsg.id)
    expect(profViewMsg).toBeDefined()
    expect(profViewMsg?.author_type).toBe('participant')
    expect(profViewMsg?.message_text).toContain('Dor lombar e cansaço')
  })
})
