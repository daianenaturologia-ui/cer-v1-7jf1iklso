import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

/** Keeps the latest failed edits available for retry; leaving waits for all writes. */
export function useQuestionnaireSaving() {
  const chain = useRef<Promise<void>>(Promise.resolve())
  const running = useRef(0)
  const pending = useRef(new Map<string, () => Promise<unknown>>())
  const mounted = useRef(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    mounted.current = true
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current.size) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => { mounted.current = false; window.removeEventListener('beforeunload', warn) }
  }, [])
  const reportError = useCallback(() => {
    if (mounted.current) setError('Não foi possível salvar suas respostas. Suas escolhas continuam aqui. Tente salvar novamente antes de sair.')
  }, [])
  const enqueue = useCallback((key: string, action: () => Promise<unknown>) => {
    if (key !== 'completion') pending.current.delete('completion')
    pending.current.set(key, action)
    running.current++
    if (mounted.current) setBusy(true)
    const write = async () => {
      try {
        await action()
        if (pending.current.get(key) === action) pending.current.delete(key)
        if (!pending.current.size && mounted.current) setError(null)
      } catch { reportError() }
      finally { running.current--; if (mounted.current) setBusy(running.current > 0) }
    }
    chain.current = chain.current.then(write, write)
  }, [reportError])
  const flush = useCallback(async () => {
    await chain.current
    // Retry the latest complete edit, including multi-record answers such as structure/duration.
    for (const [key, action] of [...pending.current]) {
      try {
        await action()
        if (pending.current.get(key) === action) pending.current.delete(key)
      } catch { reportError(); throw new Error('questionnaire_save_failed') }
    }
    if (pending.current.size) { reportError(); throw new Error('questionnaire_save_pending') }
    if (mounted.current) { setError(null); setBusy(false) }
  }, [reportError])
  const status = <div aria-live="polite">
    {error ? <div role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm space-y-2">
      <p>{error}</p><Button variant="outline" onClick={() => { void flush().catch(() => {}) }}>Tentar salvar novamente</Button>
    </div> : busy ? <p className="text-sm text-muted-foreground">Salvando suas respostas…</p> : null}
  </div>
  return { enqueue, flush, reportError, status, busy, error }
}
