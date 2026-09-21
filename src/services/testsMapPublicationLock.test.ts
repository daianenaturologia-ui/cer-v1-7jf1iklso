import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cerMapService } from './cerMapService'
import { cerSessionService } from './cerSession'

describe('Trava Real de Publicação do Mapa CER (CER V1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. zero sessões registradas → publicação terminantemente bloqueada', async () => {
    vi.spyOn(cerSessionService, 'listSessionsByEnrollment').mockResolvedValue([])

    const check = await cerMapService.canPublishMap('enr-test-123')
    expect(check.allowed).toBe(false)
    expect(check.sessionCount).toBe(0)
    expect(check.reason).toBe(
      'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
    )

    // A função de serviço publishDraft também DEVE bloquear
    await expect(cerMapService.publishDraft('map-123', 'enr-test-123')).rejects.toThrow(
      'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
    )
  })

  it('2. uma sessão registrada → publicação permitida', async () => {
    const mockSession = {
      id: 'sess-1',
      enrollment_id: 'enr-test-123',
      professional_user_id: 'usr-daiane',
      scheduled_at: new Date().toISOString(),
      status: 'completed' as const,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    vi.spyOn(cerSessionService, 'listSessionsByEnrollment').mockResolvedValue([mockSession])

    const check = await cerMapService.canPublishMap('enr-test-123')
    expect(check.allowed).toBe(true)
    expect(check.sessionCount).toBe(1)
    expect(check.reason).toBeUndefined()
  })

  it('3. falha ao consultar sessões → publicação bloqueada de forma segura (fail-closed)', async () => {
    vi.spyOn(cerSessionService, 'listSessionsByEnrollment').mockRejectedValue(
      new Error('PocketBase network error or permission denied'),
    )

    const check = await cerMapService.canPublishMap('enr-test-123')
    expect(check.allowed).toBe(false)
    expect(check.hasError).toBe(true)
    expect(check.sessionCount).toBe(0)
    expect(check.reason).toContain('Falha segura ao verificar sessões registradas')

    // publishDraft deve lançar erro impedindo a mutação
    await expect(cerMapService.publishDraft('map-123', 'enr-test-123')).rejects.toThrow(
      /Falha segura ao verificar sessões registradas/,
    )
  })

  it('4. avaliações concluídas sem sessão → publicação continua bloqueada', async () => {
    // Simula que avaliações estão completas, mas sessões continuam vazias
    vi.spyOn(cerSessionService, 'listSessionsByEnrollment').mockResolvedValue([])

    const check = await cerMapService.canPublishMap('enr-test-with-assessments')
    expect(check.allowed).toBe(false)
    expect(check.sessionCount).toBe(0)
    expect(check.reason).toBe(
      'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
    )

    await expect(
      cerMapService.publishDraft('map-assessments', 'enr-test-with-assessments'),
    ).rejects.toThrow('O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.')
  })
})
