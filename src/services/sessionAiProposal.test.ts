import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestSessionAiProposal } from './sessionAiProposal'
import pb from '@/lib/pocketbase/client'
import { demoAdapter } from './demoAdapter'
vi.mock('@/lib/pocketbase/client', () => ({ default: { send: vi.fn() } }))
vi.mock('./demoAdapter', () => ({ demoAdapter: { isEnabled: vi.fn(() => false) } }))
const sessionId = 'session00000001'
const output = {
  sessionId,
  enrollmentId: 'mine',
  status: 'pending_review',
  summary: 'Revisar',
  changes: [],
  questions: [],
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(demoAdapter.isEnabled).mockReturnValue(false)
  vi.mocked(pb.send).mockResolvedValue(output)
})
describe('Private session proposal client', () => {
  it('sends only saved session id and does not publish', async () => {
    await expect(requestSessionAiProposal(sessionId, 'mine')).resolves.toEqual(output)
    expect(pb.send).toHaveBeenCalledWith('/backend/v1/cer/session-map-proposal', {
      method: 'POST',
      body: { sessionId },
    })
  })
  it('keeps demo offline', async () => {
    vi.mocked(demoAdapter.isEnabled).mockReturnValue(true)
    await expect(requestSessionAiProposal(sessionId, 'mine')).rejects.toThrow('demonstração')
    expect(pb.send).not.toHaveBeenCalled()
  })
  it('rejects proposals for another person', async () => {
    vi.mocked(pb.send).mockResolvedValue({ ...output, enrollmentId: 'other' })
    await expect(requestSessionAiProposal(sessionId, 'mine')).rejects.toThrow('proposta válida')
  })
  it('never exposes raw backend errors', async () => {
    vi.mocked(pb.send).mockRejectedValue({ status: 502, response: { message: 'KEY_OR_NOTE' } })
    await expect(requestSessionAiProposal(sessionId, 'mine')).rejects.toThrow('preservados')
  })
  it('explains missing server configuration', async () => {
    vi.mocked(pb.send).mockRejectedValue({ status: 503, response: { code: 'ai_not_configured' } })
    await expect(requestSessionAiProposal(sessionId, 'mine')).rejects.toThrow('configurada')
  })
})
