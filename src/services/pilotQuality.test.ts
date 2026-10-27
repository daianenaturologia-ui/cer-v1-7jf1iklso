import { beforeEach, describe, expect, it, vi } from 'vitest'
const { send, demo } = vi.hoisted(() => ({ send: vi.fn(), demo: vi.fn(() => false) }))
vi.mock('@/lib/pocketbase/client', () => ({ default: { send, authStore: { isValid: true, record: { id: 'syntheticuser001' } } } }))
vi.mock('./demoAdapter', () => ({ demoAdapter: { isEnabled: demo } }))
import { readQuality, submitFeedback, reportIncident, setQualityEnrollment } from './pilotQuality'
describe('pilot quality safety boundaries', () => {
  beforeEach(() => { send.mockReset(); demo.mockReturnValue(false) })
  it('recovers a transient read once, preserving its scope', async () => {
    send.mockRejectedValueOnce({ status: 503 }).mockResolvedValueOnce([])
    await expect(readQuality('inbox', { page: 2 })).resolves.toEqual([])
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[0]).toEqual(send.mock.calls[1])
  })
  it('never loops on reads or retries denied access', async () => {
    send.mockRejectedValue({ status: 503 })
    await expect(readQuality('mine')).rejects.toEqual({ status: 503 })
    expect(send).toHaveBeenCalledTimes(2)
    send.mockClear(); send.mockRejectedValue({ status: 403 })
    await expect(readQuality('mine')).rejects.toEqual({ status: 403 })
    expect(send).toHaveBeenCalledTimes(1)
  })
  it('does not repeat feedback writes on an uncertain network result', async () => {
    send.mockRejectedValue({ status: 0 })
    await expect(submitFeedback({ enrollment_id: 'syntheticenroll1', category: 'app', message: 'synthetic', request_id: 'synthetic-request-001' })).rejects.toEqual({ status: 0 })
    expect(send).toHaveBeenCalledTimes(1)
  })
  it('does not send demo feedback or telemetry to the server', async () => {
    demo.mockReturnValue(true)
    await expect(readQuality('mine')).rejects.toThrow('conta real')
    await expect(submitFeedback({ enrollment_id: 'demo', category: 'process', message: 'synthetic', request_id: 'synthetic-request-001' })).rejects.toThrow('conta real')
    reportIncident('feedback_save', 'feedback')
    expect(send).not.toHaveBeenCalled()
  })
  it('deduplicates enumerated telemetry and suppresses its own failure', async () => {
    send.mockRejectedValue({ status: 500 })
    setQualityEnrollment('syntheticenroll1')
    reportIncident('ui_exception', 'journey'); reportIncident('ui_exception', 'journey')
    await Promise.resolve()
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][1].body).toEqual({ action: 'incident', code: 'ui_exception', area: 'journey', enrollment_id: 'syntheticenroll1', release: 'pilot-quality-v1' })
  })
})
