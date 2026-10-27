import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  readQuality,
  submitFeedback,
  reportIncident,
  type FeedbackContext,
  type FeedbackRecord,
  type FeedbackCategory,
} from '@/services/pilotQuality'
import { Button } from '@/components/ui/button'

const statusLabel = { new: 'Recebido', reviewing: 'Em análise', resolved: 'Análise concluída' }
export default function PilotFeedback() {
  const { isInteragente, isDemo } = useAuth()
  const [contexts, setContexts] = useState<FeedbackContext[]>([])
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [enrollment, setEnrollment] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('app')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  const request = useRef<{ id: string; signature: string } | null>(null)
  useEffect(() => {
    if (!isInteragente || isDemo) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setLoadFailed(false)
    setError('')
    void Promise.all([
      readQuality<FeedbackContext[]>('context'),
      readQuality<FeedbackRecord[]>('mine'),
    ])
      .then(([ctx, rows]) => {
        if (!active) return
        setContexts(ctx)
        setRecords(rows)
        setEnrollment((old) =>
          ctx.some((c) => c.id === old) ? old : ctx.length === 1 ? ctx[0].id : '',
        )
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true)
          setError('Não foi possível carregar seu espaço. Você pode tentar novamente.')
        }
        reportIncident('quality_load', 'feedback')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isInteragente, isDemo, revision])
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !message.trim() || !enrollment) return
    setBusy(true)
    setError('')
    setNotice('')
    const signature = JSON.stringify([enrollment, category, message.trim()])
    if (request.current?.signature !== signature)
      request.current = { id: crypto.randomUUID(), signature }
    try {
      const saved = await submitFeedback({
        enrollment_id: enrollment,
        category,
        message,
        request_id: request.current.id,
      })
      setRecords((old) => [saved, ...old.filter((r) => r.id !== saved.id)])
      setMessage('')
      request.current = null
      setNotice('Seu relato foi recebido. Obrigada por ajudar a cuidar desta experiência.')
    } catch {
      setError(
        'Não foi possível confirmar o envio. Seu texto continua aqui. Tente novamente para confirmar sem duplicar o mesmo relato.',
      )
      reportIncident('feedback_save', 'feedback')
    } finally {
      setBusy(false)
    }
  }
  if (!isInteragente || isDemo)
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl">Sua experiência no CER</h1>
        <p>Este espaço privado está disponível na conta real da interagente.</p>
        <Link to="/">Voltar ao início</Link>
      </main>
    )
  return (
    <div className="w-full max-w-2xl mx-auto p-5 sm:p-8 space-y-6">
      <Link className="underline" to="/">
        Voltar à jornada
      </Link>
      <h1 className="text-2xl font-semibold">Sua experiência no CER</h1>
      <p>
        O que está ajudando? O que ficou difícil ou poderia ser diferente? Você pode falar sobre o
        app ou sobre seu processo de acompanhamento.
      </p>
      <p className="text-sm text-muted-foreground">
        Seu relato é identificado e privado, acessível a você e à profissional responsável por este
        acompanhamento. Não aparece para outras interagentes. A revisão é semanal; este espaço não é
        acompanhado em tempo real.
      </p>
      <p className="text-sm text-muted-foreground">
        Para melhorar o app, registramos códigos técnicos de erro; o conteúdo das suas respostas não
        é incluído nesses registros.
      </p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">Carregando…</p>
      ) : loadFailed ? null : (
        <>
          {!contexts.length ? (
            <p>Seu acompanhamento ainda não está disponível para receber relatos.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4 rounded-xl border p-5">
              <label className="block">
                Acompanhamento
                <select
                  aria-label="Acompanhamento"
                  className="block w-full border rounded p-2 bg-background"
                  disabled={busy}
                  required
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {contexts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.product} — {c.professional}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Sobre o que você quer falar?
                <select
                  aria-label="Assunto"
                  className="block w-full border rounded p-2 bg-background"
                  disabled={busy}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                >
                  <option value="app">Uso do app</option>
                  <option value="process">Meu processo de acompanhamento</option>
                </select>
              </label>
              <label className="block" htmlFor="pilot-feedback">
                Seu relato
              </label>
              <textarea
                id="pilot-feedback"
                className="block w-full min-h-36 border rounded p-3 bg-background"
                required
                maxLength={3000}
                disabled={busy}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte o que aconteceu, o que ajudou ou o que você gostaria de melhorar. Não inclua senhas."
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/3.000 caracteres. Envie apenas o que deseja compartilhar com sua
                profissional.
              </p>
              <Button type="submit" disabled={busy || !enrollment || !message.trim()}>
                {busy ? 'Enviando…' : 'Enviar meu relato'}
              </Button>
            </form>
          )}
          <h2 className="text-xl font-semibold">Relatos enviados</h2>
          {!records.length && <p>Você ainda não enviou relatos.</p>}
          {records.map((r) => (
            <article key={r.id} className="border rounded-xl p-4 space-y-2">
              <p className="text-sm">
                {r.category === 'app' ? 'Uso do app' : 'Processo de acompanhamento'} ·{' '}
                {statusLabel[r.status]}
              </p>
              <p className="whitespace-pre-wrap break-words">{r.message}</p>
            </article>
          ))}
          {records.length >= 100 && (
            <p className="text-sm">Mostrando os 100 relatos mais recentes.</p>
          )}
        </>
      )}
      <Button
        variant="outline"
        disabled={busy || loading}
        onClick={() => setRevision((r) => r + 1)}
      >
        Atualizar relatos
      </Button>
    </div>
  )
}
