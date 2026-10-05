import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { sessionMapUpdateService } from '@/services/sessionMapUpdate'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function SessionMapUpdate({
  enrollmentId,
  sessionId,
  participantName,
  onOpenMap,
}: {
  enrollmentId: string
  sessionId: string
  participantName: string
  onOpenMap?: () => void
}) {
  const { user, isProfissional } = useAuth()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setText('')
    setReviewed(false)
    setMessage('')
    setError('')
    setLoading(true)
    if (!isProfissional) {
      setLoading(false)
      return
    }
    sessionMapUpdateService
      .read(enrollmentId, sessionId)
      .then((value) => {
        if (active) setText(value)
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar a atualização deste encontro. Reabra o encontro para tentar novamente.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, sessionId, isProfissional])
  async function save() {
    if (!reviewed || !user || !isProfissional) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await sessionMapUpdateService.save({
        enrollmentId,
        sessionId,
        participantName,
        professionalUserId: user.id,
        summary: text,
      })
      setMessage(
        'Atualização salva no rascunho. Confira as duas versões e publique no Mapa CER quando estiver pronta.',
      )
      setReviewed(false)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível salvar. Seu texto foi preservado.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (!isProfissional) return null
  return (
    <section
      className="rounded-xl border bg-primary/5 p-4 space-y-3"
      aria-label="Atualização do mapa após o encontro"
    >
      <h3 className="font-serif text-lg">O que mudou para o Mapa CER?</h3>
      <p className="text-sm text-muted-foreground">
        Escreva uma síntese para conversar com a pessoa: o que ficou mais claro, o que mudou e o que
        ainda precisa ser explorado. O prontuário continua privado. Esta síntese entra no rascunho e
        só chega à pessoa depois da publicação.
      </p>
      <p className="text-xs text-muted-foreground">
        A análise por IA ainda depende de conectar um provedor ao servidor. Neste momento, a síntese
        é escrita por você.
      </p>
      <label className="block text-sm space-y-1">
        <span>Síntese deste encontro para o mapa</span>
        <Textarea
          value={text}
          disabled={loading || busy || Boolean(error && !text)}
          maxLength={8000}
          rows={4}
          onChange={(e) => {
            setText(e.target.value)
            setReviewed(false)
            setMessage('')
          }}
        />
      </label>
      <label className="flex gap-2 items-start text-sm">
        <input
          type="checkbox"
          checked={reviewed}
          disabled={loading || busy}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        Revisei este texto para compor o mapa da pessoa.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading || busy || !reviewed || !text.trim()} onClick={() => void save()}>
          {busy ? 'Salvando...' : 'Salvar no rascunho do mapa'}
        </Button>
        {onOpenMap && (
          <Button variant="outline" onClick={onOpenMap}>
            Revisar Mapa CER
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
