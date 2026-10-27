import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  readQuality,
  reviewFeedback,
  acknowledgeAudit,
  type FeedbackRecord,
  type FeedbackStatus,
  type WeeklyAudit,
} from '@/services/pilotQuality'
import { Button } from '@/components/ui/button'

const incidentLabels: Record<string, string> = {
  ui_exception: 'Falha ao abrir uma tela',
  unhandled_rejection: 'Falha inesperada',
  onboarding_save: 'Acolhimento: dificuldade ao salvar',
  feedback_save: 'Relato: dificuldade ao enviar',
  quality_load: 'Dificuldade ao carregar relatos',
}

function ReviewCard({
  record,
  onSaved,
}: {
  record: FeedbackRecord
  onSaved: (r: FeedbackRecord) => void
}) {
  const [status, setStatus] = useState(record.status)
  const [note, setNote] = useState(record.review_note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  async function save() {
    setBusy(true)
    setError('')
    setSaved(false)
    try {
      onSaved(await reviewFeedback(record.id, status, note))
      setSaved(true)
    } catch {
      setError('Não foi possível salvar a análise. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="rounded-xl border p-5 space-y-3">
      <p className="font-semibold">
        {record.category === 'app' ? 'Uso do app' : 'Processo de acompanhamento'}
      </p>
      <p className="text-sm text-muted-foreground">
        Recebido em {new Date(record.created).toLocaleDateString('pt-BR')}
      </p>
      <p className="whitespace-pre-wrap break-words">{record.message}</p>
      {record.enrollment_id && (
        <Link className="underline" to={`/profissional/participantes/${record.enrollment_id}`}>
          Abrir acompanhamento
        </Link>
      )}
      <label className="block">
        Situação
        <select
          aria-label="Situação do relato"
          disabled={busy}
          className="block border rounded p-2 bg-background"
          value={status}
          onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
        >
          <option value="new">Recebido</option>
          <option value="reviewing">Em análise</option>
          <option value="resolved">Análise concluída</option>
        </select>
      </label>
      <label className="block">
        Anotação interna da revisão
        <textarea
          aria-label="Anotação interna"
          className="block border rounded p-2 w-full bg-background"
          maxLength={1000}
          disabled={busy}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        A interagente acompanha a situação. Esta anotação é interna. Concluir a análise não confirma
        uma correção técnica: registre a evidência do teste quando houver uma falha do app.
      </p>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Análise salva.</p>}
      <Button disabled={busy} onClick={save}>
        {busy ? 'Salvando…' : 'Salvar análise'}
      </Button>
    </article>
  )
}
export default function PilotQuality() {
  const { isProfissional, isDemo } = useAuth()
  const [items, setItems] = useState<FeedbackRecord[]>([])
  const [audits, setAudits] = useState<WeeklyAudit[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [ackBusy, setAckBusy] = useState('')
  useEffect(() => {
    if (!isProfissional || isDemo) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setLoadFailed(false)
    setError('')
    setItems([])
    void Promise.all([
      readQuality<{ items: FeedbackRecord[]; has_more: boolean }>('inbox', { page }),
      readQuality<WeeklyAudit[]>('audits'),
    ])
      .then(([inbox, reports]) => {
        if (active) {
          setItems(inbox.items)
          setHasMore(inbox.has_more)
          setAudits(reports)
        }
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true)
          setError('Não foi possível carregar os relatos e relatórios. Tente atualizar.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isProfissional, isDemo, page, revision])
  async function acknowledge(id: string) {
    setAckBusy(id)
    setError('')
    try {
      await acknowledgeAudit(id)
      setRevision((r) => r + 1)
    } catch {
      setError('Não foi possível confirmar a revisão do relatório.')
    } finally {
      setAckBusy('')
    }
  }
  if (!isProfissional || isDemo)
    return (
      <div className="p-6">
        Este painel está disponível na conta profissional real. <Link to="/">Voltar</Link>
      </div>
    )
  return (
    <div className="w-full max-w-4xl mx-auto p-5 sm:p-8 space-y-6">
      <Link className="underline" to="/profissional">
        Voltar ao painel
      </Link>
      <h1 className="text-2xl font-semibold">Feedbacks e qualidade</h1>
      <p>
        Um espaço para ouvir as interagentes, acompanhar dificuldades e registrar o que foi
        verificado.
      </p>
      <p className="text-sm text-muted-foreground">
        Relatório automático às segundas-feiras, às 8h de Brasília, referente à semana anterior. A
        análise do processo de acompanhamento é sua. Falhas técnicas precisam ser reproduzidas,
        corrigidas e testadas antes de serem consideradas resolvidas.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button variant="outline" disabled={loading} onClick={() => setRevision((r) => r + 1)}>
        Atualizar painel
      </Button>
      {loading ? (
        <p role="status">Carregando…</p>
      ) : loadFailed ? null : (
        <>
          <h2 className="text-xl font-semibold">Relatórios semanais</h2>
          {!audits.length && (
            <p>
              Ainda não há relatório semanal. Relatos novos aparecem abaixo assim que são enviados.
            </p>
          )}
          {audits.map((a) => (
            <article className="rounded-xl border p-4 space-y-2" key={a.id}>
              <h3 className="font-semibold">
                Semana de {new Date(a.week_start + 'T12:00:00').toLocaleDateString('pt-BR')}
              </h3>
              <p>
                App: {a.summary.app_feedback} relatos · Processo: {a.summary.process_feedback}{' '}
                relatos · Ocorrências técnicas: {a.summary.incidents}
              </p>
              <p>Pendentes na geração: {a.summary.pending_review_at_generation}</p>
              <p className="text-sm">
                {Object.entries(a.summary.by_code)
                  .filter(([, count]) => count)
                  .map(
                    ([code, count]) => `${incidentLabels[code] || 'Ocorrência técnica'}: ${count}`,
                  )
                  .join(' · ') || 'Nenhuma ocorrência técnica registrada nesse período.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Contagens registradas não cobrem todas as falhas possíveis. O relatório não altera
                respostas, planos ou código.
              </p>
              {a.reviewed_at ? (
                <p>Revisão do relatório registrada.</p>
              ) : (
                <Button disabled={!!ackBusy} onClick={() => acknowledge(a.id)}>
                  {ackBusy === a.id ? 'Salvando…' : 'Marcar relatório como revisado'}
                </Button>
              )}
            </article>
          ))}
          <h2 className="text-xl font-semibold">Relatos das interagentes</h2>
          {!items.length && <p>Nenhum relato disponível nesta página.</p>}
          {items.map((r) => (
            <ReviewCard
              key={r.id}
              record={r}
              onSaved={(saved) =>
                setItems((old) => old.map((item) => (item.id === saved.id ? saved : item)))
              }
            />
          ))}
          <div className="flex gap-3">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anteriores
            </Button>
            <Button variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
              Próximos
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
