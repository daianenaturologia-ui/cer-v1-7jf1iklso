import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionMapUpdateService } from './sessionMapUpdate'
import { cerMapService } from './cerMapService'
import { cerSessionService } from './cerSession'
import { buildCerMapReadings } from './cerMapReadings'
vi.mock('./cerMapService', () => ({
  cerMapService: {
    listAllMaps: vi.fn(),
    createNextDraftFromPublished: vi.fn(),
    createInitialDraft: vi.fn(),
    saveReadingSnapshot: vi.fn(),
  },
}))
vi.mock('./cerSession', () => ({ cerSessionService: { getById: vi.fn() } }))
const params = {
  enrollmentId: 'mine',
  sessionId: 'session',
  participantName: 'Pessoa',
  professionalUserId: 'professional',
  summary: 'Reconhecemos uma possibilidade de cuidado, ainda em exploração.',
}
const document = () => ({
  ...buildCerMapReadings([], 'mine', 'Pessoa'),
  integration: 'Leitura anterior',
  reviewedBy: 'professional',
  reviewedAt: '2026-10-01',
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(cerSessionService.getById).mockResolvedValue({
    id: 'session',
    enrollment_id: 'mine',
    professional_user_id: 'professional',
    status: 'completed',
    created: '2026-10-05',
  } as any)
  vi.mocked(cerMapService.saveReadingSnapshot).mockResolvedValue({ id: 'draft' } as any)
})
describe('Atualizações de encontro preservam publicação e privacidade', () => {
  it('cria uma nova versão e salva apenas texto revisado explicitamente, retirando revisão global', async () => {
    const original = document()
    vi.mocked(cerMapService.listAllMaps).mockResolvedValue([
      {
        id: 'published',
        enrollment_id: 'mine',
        status: 'published',
        version_number: 2,
        reading_snapshot: original,
      },
    ] as any)
    vi.mocked(cerMapService.createNextDraftFromPublished).mockResolvedValue({
      id: 'draft',
      reading_snapshot: structuredClone(original),
    } as any)
    await sessionMapUpdateService.save(params)
    expect(cerMapService.createNextDraftFromPublished).toHaveBeenCalledWith(
      'published',
      'professional',
    )
    const [id, enrollment, saved, reviewed] = vi.mocked(cerMapService.saveReadingSnapshot).mock
      .calls[0]
    expect([id, enrollment, reviewed]).toEqual(['draft', 'mine', false])
    expect(saved.reviewedAt).toBeUndefined()
    expect(saved.integration).toBe('Leitura anterior')
    expect(saved.sessionUpdates?.[0].summary).toBe(params.summary)
    expect(original.sessionUpdates).toBeUndefined()
    expect(original.reviewedAt).toBe('2026-10-01')
  })
  it('substitui atualização do mesmo encontro sem duplicá-la e preserva outras sessões', async () => {
    const initial = document()
    initial.sessionUpdates = ['session', 'old'].map((sessionId) => ({
      sessionId,
      sessionDate: '2026-10-01',
      summary: 'Anterior',
      preparedBy: 'professional',
      preparedAt: '2026-10-01',
    }))
    vi.mocked(cerMapService.listAllMaps).mockResolvedValue([
      { id: 'draft', enrollment_id: 'mine', status: 'draft', reading_snapshot: initial },
    ] as any)
    await sessionMapUpdateService.save(params)
    const updates = vi.mocked(cerMapService.saveReadingSnapshot).mock.calls[0][2].sessionUpdates!
    expect(updates.map((x) => x.sessionId)).toEqual(['old', 'session'])
    expect(cerMapService.createNextDraftFromPublished).not.toHaveBeenCalled()
  })
  it('recusa encontro de outra pessoa, outro profissional e cancelado sem escrever mapa', async () => {
    for (const override of [
      { enrollment_id: 'other' },
      { professional_user_id: 'other' },
      { status: 'cancelled' },
    ]) {
      vi.mocked(cerSessionService.getById).mockResolvedValue({
        enrollment_id: 'mine',
        professional_user_id: 'professional',
        status: 'completed',
        ...override,
      } as any)
      await expect(sessionMapUpdateService.save(params)).rejects.toThrow()
    }
    expect(cerMapService.listAllMaps).not.toHaveBeenCalled()
    expect(cerMapService.saveReadingSnapshot).not.toHaveBeenCalled()
  })
  it('falha de consulta não cria uma versão vazia nem comunica sucesso', async () => {
    vi.mocked(cerMapService.listAllMaps).mockRejectedValue(new Error('offline'))
    await expect(sessionMapUpdateService.save(params)).rejects.toThrow('offline')
    expect(cerMapService.createInitialDraft).not.toHaveBeenCalled()
    expect(cerMapService.saveReadingSnapshot).not.toHaveBeenCalled()
  })
})
