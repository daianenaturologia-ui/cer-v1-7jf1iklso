import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useQuestionnaireSaving } from './useQuestionnaireSaving'

describe('Saving barrier', () => {
  it('waits for in-flight edits and preserves their order before exiting', async () => {
    const { result } = renderHook(useQuestionnaireSaving)
    let resolve!: () => void
    const first = new Promise<void>(done => { resolve = done })
    const calls: string[] = []
    act(() => {
      result.current.enqueue('one', async () => { await first; calls.push('one') })
      result.current.enqueue('two', async () => { calls.push('two') })
    })
    const leave = vi.fn()
    const pending = result.current.flush().then(leave)
    expect(leave).not.toHaveBeenCalled()
    await act(async () => { resolve(); await pending })
    expect(calls).toEqual(['one', 'two'])
    expect(leave).toHaveBeenCalledOnce()
  })
  it('blocks leaving after a failed save and retries the complete edit', async () => {
    const { result } = renderHook(useQuestionnaireSaving)
    let fail = true
    const action = vi.fn(async () => { if (fail) throw new Error('offline') })
    act(() => result.current.enqueue('structure-and-duration', action))
    await act(async () => { await expect(result.current.flush()).rejects.toThrow('questionnaire_save_failed') })
    expect(result.current.error).toContain('continuam aqui')
    fail = false
    await act(async () => { await result.current.flush() })
    expect(result.current.error).toBeNull()
    expect(action).toHaveBeenCalledTimes(3)
  })
  it('a newer successful answer clears a failed older answer for the same question', async () => {
    const { result } = renderHook(useQuestionnaireSaving)
    act(() => {
      result.current.enqueue('skin', async () => { throw new Error('offline') })
      result.current.enqueue('skin', async () => {})
    })
    await act(async () => { await result.current.flush() })
    expect(result.current.error).toBeNull()
  })
})
