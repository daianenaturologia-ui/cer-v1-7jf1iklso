// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE } from './demoAdapter'
import { cerMapService } from './cerMapService'
import { buildCerMapReadings } from './cerMapReadings'
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
})
afterEach(() => {
  vi.restoreAllMocks()
  demoAdapter.disableDemo()
  localStorage.clear()
})
describe('Salvar, revisar e publicar as duas versões', () => {
  it('bloqueia uma leitura não revisada e mantém a trava do encontro', async () => {
    const draft = await cerMapService.createInitialDraft(DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE.id)
    const document = buildCerMapReadings([], DEMO_ENROLLMENT_ID, 'Teste')
    await cerMapService.saveReadingSnapshot(draft.id, DEMO_ENROLLMENT_ID, document)
    await expect(cerMapService.publishDraft(draft.id, DEMO_ENROLLMENT_ID)).rejects.toThrow(
      'Revise e salve',
    )
    const reviewed = await cerMapService.saveReadingSnapshot(
      draft.id,
      DEMO_ENROLLMENT_ID,
      document,
      true,
    )
    expect(reviewed.reading_snapshot?.reviewedBy).toBe(DEMO_USER_DAIANE.id)
    vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({
      allowed: false,
      sessionCount: 0,
      reason: 'Registre o primeiro encontro',
    })
    await expect(cerMapService.publishDraft(draft.id, DEMO_ENROLLMENT_ID)).rejects.toThrow(
      'primeiro encontro',
    )
    expect(demoAdapter.getDraftMap(DEMO_ENROLLMENT_ID)?.status).toBe('draft')
  })
  it('publica o documento salvo, cria nova versão sem revisão e preserva a antiga', async () => {
    vi.spyOn(cerMapService, 'canPublishMap').mockResolvedValue({ allowed: true, sessionCount: 1 })
    const draft = await cerMapService.createInitialDraft(DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE.id)
    const document = buildCerMapReadings([], DEMO_ENROLLMENT_ID, 'Teste')
    document.integration = 'Texto revisado'
    await cerMapService.saveReadingSnapshot(draft.id, DEMO_ENROLLMENT_ID, document, true)
    const published = await cerMapService.publishDraft(draft.id, DEMO_ENROLLMENT_ID)
    const next = await cerMapService.createNextDraftFromPublished(published.id, DEMO_USER_DAIANE.id)
    expect(next.reading_snapshot?.reviewedAt).toBeUndefined()
    document.integration = 'Novo texto'
    await cerMapService.saveReadingSnapshot(next.id, DEMO_ENROLLMENT_ID, document)
    expect(
      (await cerMapService.getCurrentPublishedMap(DEMO_ENROLLMENT_ID))?.reading_snapshot
        ?.integration,
    ).toBe('Texto revisado')
    await expect(
      cerMapService.saveReadingSnapshot(published.id, DEMO_ENROLLMENT_ID, document),
    ).rejects.toThrow('rascunho')
    await expect(cerMapService.saveReadingSnapshot(next.id, 'outra', document)).rejects.toThrow(
      'inválida',
    )
  })
})
