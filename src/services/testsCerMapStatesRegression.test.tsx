import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { cerSessionService } from './cerSession'
import { cerMapService } from './cerMapService'
import { cerMapCandidateService } from './cerMapCandidateService'
import { enrollmentExperienceService } from './experienceEngine'
import { cerKnowledgeItemService } from './cerKnowledge'
import { ProfessionalMapEditor } from '../components/ProfessionalMapEditor'
import { ProfessionalConscienciaSection } from '../components/ProfessionalConscienciaSection'
import type { EnrollmentRecord } from '@/types/cer'

describe('Regressão dos 6 Estados do Mapa CER e Proteção de Listas Vazias/Undefined', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. cerSessionService.listByEnrollment e listSessionsByEnrollment', () => {
    it('devolve SEMPRE array vazio [] quando não há sessões (nunca undefined/null)', async () => {
      // Mock do PocketBase retornando array vazio
      const pb = (await import('@/lib/pocketbase/client')).default
      vi.spyOn(pb.collection('cer_sessions'), 'getFullList').mockResolvedValue([] as any)

      const result = await cerSessionService.listByEnrollment('enr-empty')
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])

      const aliasResult = await cerSessionService.listSessionsByEnrollment('enr-empty')
      expect(Array.isArray(aliasResult)).toBe(true)
      expect(aliasResult).toEqual([])
    })

    it('preserva o comportamento fail-closed: falha real de rede/serviço lança erro propagado', async () => {
      const pb = (await import('@/lib/pocketbase/client')).default
      vi.spyOn(pb.collection('cer_sessions'), 'getFullList').mockRejectedValue(
        new Error('Network error or server unavailable'),
      )

      await expect(cerSessionService.listByEnrollment('enr-fail')).rejects.toThrow(
        'Network error or server unavailable',
      )

      // E a trava canPublishMap captura e bloqueia publicação
      const check = await cerMapService.canPublishMap('enr-fail')
      expect(check.allowed).toBe(false)
      expect(check.hasError).toBe(true)
      expect(check.reason).toContain('Falha segura ao verificar sessões registradas')
    })
  })

  describe('2. Seis estados do Mapa CER no ProfessionalMapEditor (sem lançar erro)', () => {
    const mockEnrollmentId = 'enr-test-states'
    const mockParticipant = 'Mariana'
    const mockProfUserId = 'usr-daiane'

    it('Estado 1: Nenhum Mapa iniciado (participante nova, sem questionários, sem sessões)', async () => {
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(null)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue([])
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: false,
        reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
        sessionCount: 0,
      })

      const { container } = render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(
          screen.getByText('O Mapa CER ainda não foi iniciado para esta interagente.'),
        ).toBeTruthy()
      })

      expect(screen.getByRole('button', { name: /Iniciar Rascunho V1/i })).toBeTruthy()
      expect(container.querySelector('.text-destructive')).toBeNull()
    })

    it('Estado 2: Nenhum questionário respondido (candidatos vazios, sem draft)', async () => {
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(null)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue([])
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: false,
        reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
        sessionCount: 0,
      })

      render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(
          screen.getByText('O Mapa CER ainda não foi iniciado para esta interagente.'),
        ).toBeTruthy()
      })
    })

    it('Estado 3: Respostas parciais (candidatos existem, rascunho V1 sem itens)', async () => {
      const draftSemItens: any = {
        id: 'draft-map-1',
        enrollment_id: mockEnrollmentId,
        version_number: 1,
        status: 'draft',
        items: [],
      }
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(draftSemItens)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue([
        {
          id: 'cand-1',
          knowledgeItem: {
            id: 'ki-1',
            enrollment_id: mockEnrollmentId,
            concept_key: 'ritmo_vital',
            statement: 'Percepção de ritmo sensível.',
            temporality: 'current',
            status: 'supported',
            version: 1,
          } as any,
          evaluation: {
            isEligibleForCandidate: true,
            recommendedSections: ['minha_natureza'],
          } as any,
          sourceContextSummary: 'Fonte: instrumento',
          eligibilityReason: 'Consistente',
        },
      ])
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: false,
        reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
        sessionCount: 0,
      })

      render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText(/Rascunho Ativo \(Versão 1\)/i)).toBeTruthy()
      })
      expect(
        screen.getByText('Rascunho vazio. Adicione itens acima para compor o Mapa CER.'),
      ).toBeTruthy()
      expect(screen.getByText('Percepção de ritmo sensível.')).toBeTruthy()
    })

    it('Estado 4: Uma dimensão concluída (candidatos disponíveis e draft com itens com sources vazias)', async () => {
      const draftComItens: any = {
        id: 'draft-map-2',
        enrollment_id: mockEnrollmentId,
        version_number: 1,
        status: 'draft',
        items: [
          {
            id: 'item-1',
            map_id: 'draft-map-2',
            section: 'minha_natureza',
            item_text: 'Sensibilidade fisiológica presente.',
            position: 1,
            sources: undefined, // Simula ausência de sources
          },
        ],
      }
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(draftComItens)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue([])
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: false,
        reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
        sessionCount: 0,
      })

      render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('Sensibilidade fisiológica presente.')).toBeTruthy()
      })
    })

    it('Estado 5: Mapa em elaboração com draft.items undefined/nulo simulado (resiliência)', async () => {
      const draftCorrompido: any = {
        id: 'draft-map-3',
        enrollment_id: mockEnrollmentId,
        version_number: 1,
        status: 'draft',
        items: undefined, // Simula retorno sem items
      }
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(draftCorrompido)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(null)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue(
        undefined as any,
      )
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: false,
        reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
        sessionCount: 0,
      })

      // NÃO deve lançar erro
      render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText(/Rascunho Ativo \(Versão 1\)/i)).toBeTruthy()
      })
      expect(
        screen.getByText('Rascunho vazio. Adicione itens acima para compor o Mapa CER.'),
      ).toBeTruthy()
    })

    it('Estado 6: Mapa publicado existente', async () => {
      const publishedMap: any = {
        id: 'pub-map-1',
        enrollment_id: mockEnrollmentId,
        version_number: 1,
        status: 'published',
        published_at: new Date().toISOString(),
        items: [
          {
            id: 'pub-item-1',
            map_id: 'pub-map-1',
            section: 'minha_natureza',
            item_text: 'Mapa publicado consolidado.',
            position: 1,
          },
        ],
      }
      vi.spyOn(cerMapService, 'getDraftMap').mockResolvedValue(null)
      vi.spyOn(cerMapService, 'getCurrentPublishedMap').mockResolvedValue(publishedMap)
      vi.spyOn(cerMapCandidateService, 'listCandidatesForEnrollment').mockResolvedValue([])
      vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
        allowed: true,
        sessionCount: 1,
      })

      render(
        <ProfessionalMapEditor
          enrollmentId={mockEnrollmentId}
          participantName={mockParticipant}
          professionalUserId={mockProfUserId}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText(/Mapa CER Versão 1 Ativo/i)).toBeTruthy()
      })
      expect(screen.getByText(/Criar Próxima Versão/i)).toBeTruthy()
    })
  })

  describe('3. ProfessionalConscienciaSection - normalização contra undefined', () => {
    const mockEnrollment: EnrollmentRecord = {
      id: 'enr-consciencia-test',
      person_id: 'per-1',
      product_id: 'prd-1',
      status: 'active',
      start_date: '2025-01-01',
      created: '2025-01-01',
      updated: '2025-01-01',
    }

    it('renderiza com segurança quando serviços retornam undefined/vazio (estado vazio canônico)', async () => {
      vi.spyOn(enrollmentExperienceService, 'listByEnrollment').mockResolvedValue(undefined as any)
      vi.spyOn(cerKnowledgeItemService, 'listByEnrollment').mockResolvedValue(undefined as any)
      const pb = (await import('@/lib/pocketbase/client')).default
      vi.spyOn(pb.collection('experience_responses'), 'getFullList').mockResolvedValue(
        undefined as any,
      )

      render(
        <ProfessionalConscienciaSection enrollment={mockEnrollment} participantName="Mariana" />,
      )

      await waitFor(() => {
        expect(screen.getByText('Resumo essencial')).toBeTruthy()
      })

      // Deve mostrar o texto canônico de estado vazio sem dados inventados
      const emptyTexts = screen.getAllByText(
        'Ainda não há informações suficientes para uma síntese.',
      )
      expect(emptyTexts.length).toBe(6) // Todas as 6 dimensões
    })
  })
})
