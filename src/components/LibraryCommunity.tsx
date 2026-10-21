import React, { useEffect, useState } from 'react'
import {
  libraryCommunity,
  emptyCommunityPractice,
  contributionLabels,
  type Contribution,
  type CommunityPractice,
  type CommunityPost,
  type ReviewEntry,
} from '@/services/libraryCommunity'
import type { DevelopmentResource } from '@/services/developmentCatalog'
import { LibraryComments } from './LibraryComments'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

function PracticeText({ p }: { p: CommunityPractice }) {
  return (
    <div className="space-y-3 text-sm break-words">
      <p className="text-primary text-xs">
        {p.theme || 'Regulação no cotidiano'}
        {p.duration ? ` · ${p.duration}` : ''}
      </p>
      <h4 className="font-serif text-xl">{p.title || 'Prática em criação'}</h4>
      <p className="text-xs">Contribuição de {p.display_name || 'nome ainda não escolhido'}</p>
      <div>
        <h5 className="font-medium">Como experimentar</h5>
        <p className="whitespace-pre-wrap">{p.instructions}</p>
      </div>
      <div>
        <h5 className="font-medium">A experiência de quem criou</h5>
        <p className="whitespace-pre-wrap">{p.experience}</p>
      </div>
    </div>
  )
}
function CommunityReview({ r, onChanged }: { r: Contribution; onChanged: () => Promise<void> }) {
  const [note, setNote] = useState(''),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [history, setHistory] = useState<ReviewEntry[]>([]),
    [more, setMore] = useState(false),
    [historyPage, setHistoryPage] = useState(0)
  async function review(decision: 'approve' | 'request_changes' | 'unpublish') {
    setBusy(true)
    setError('')
    try {
      await libraryCommunity.review(r, decision, note)
      await onChanged()
    } catch {
      setError(
        'Não foi possível concluir. A versão pode ter mudado; atualize a fila antes de avaliar novamente.',
      )
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }
  async function readHistory(page = 1) {
    setBusy(true)
    setError('')
    try {
      const v = await libraryCommunity.history(r.id, page)
      setHistory((old) => (page === 1 ? v.items : [...old, ...v.items]))
      setMore(v.has_more)
      setHistoryPage(page)
    } catch {
      setError('Não foi possível abrir a auditoria. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <article className="rounded-2xl border p-5 bg-card space-y-4">
      <p className="text-sm font-medium">
        {contributionLabels[r.status]} · versão {r.revision}
      </p>
      <PracticeText p={r.payload} />
      <label className="block text-sm space-y-1">
        Devolutiva da avaliação
        <Textarea
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Explique o que precisa ser ajustado ou o motivo de retirar a publicação."
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {r.status === 'pending' && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => setConfirm(true)}>
            Aprovar esta prática
          </Button>
          <Button
            variant="outline"
            disabled={busy || !note.trim()}
            onClick={() => review('request_changes')}
          >
            Solicitar ajustes
          </Button>
        </div>
      )}
      {r.status === 'approved' && (
        <Button
          variant="outline"
          disabled={busy || !note.trim()}
          onClick={() => review('unpublish')}
        >
          Retirar da biblioteca e solicitar revisão
        </Button>
      )}
      {confirm && (
        <div className="rounded-xl border border-primary p-4 space-y-2 text-sm">
          <p>
            Você revisou os passos, a experiência e a adequação desta versão? A aprovação publicará
            exatamente o conteúdo acima para os usuários do app.
          </p>
          <Button disabled={busy} onClick={() => review('approve')}>
            Confirmar aprovação e publicar
          </Button>{' '}
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Cancelar aprovação
          </Button>
        </div>
      )}
      <Button variant="ghost" disabled={busy} onClick={() => readHistory()}>
        Ver auditoria desta prática
      </Button>
      {history.map((h) => (
        <p key={h.id} className="text-xs border-l pl-3">
          {new Date(h.created).toLocaleString('pt-BR')} · versão {h.revision} ·{' '}
          {(
            {
              submitted: 'Enviada para avaliação',
              draft_saved: 'Rascunho salvo',
              approve: 'Aprovada e publicada',
              request_changes: 'Ajustes solicitados',
              unpublish: 'Publicação retirada',
              withdrawn: 'Retirada pela pessoa',
            } as Record<string, string>
          )[h.decision] || h.decision}
          {h.note ? ` — ${h.note}` : ''}
        </p>
      ))}
      {more && (
        <Button variant="ghost" disabled={busy} onClick={() => readHistory(historyPage + 1)}>
          Ver mais decisões
        </Button>
      )}
    </article>
  )
}
export function LibraryCommunity({
  onAccess,
  onAddToPlan,
}: {
  onAccess?: (curator: boolean) => void
  onAddToPlan?: (r: DevelopmentResource) => void
}) {
  const [tab, setTab] = useState<'feed' | 'mine' | 'queue'>('feed'),
    [curator, setCurator] = useState(false),
    [feed, setFeed] = useState<CommunityPost[]>([]),
    [mine, setMine] = useState<Contribution[]>([]),
    [queue, setQueue] = useState<Contribution[]>([]),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(false),
    [current, setCurrent] = useState<Contribution | undefined>(),
    [value, setValue] = useState(emptyCommunityPractice),
    [consent, setConsent] = useState(false),
    [withdrawing, setWithdrawing] = useState('')
  useEffect(() => {
    let live = true
    libraryCommunity
      .access()
      .then((r) => {
        if (live) {
          setCurator(r.curator)
          onAccess?.(r.curator)
        }
      })
      .catch(() => {
        if (live) {
          setCurator(false)
          onAccess?.(false)
        }
      })
    return () => {
      live = false
    }
  }, [onAccess])
  // Keyed loads prevent a late response from showing another tab's data.
  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    const request =
      tab === 'feed'
        ? libraryCommunity.feed()
        : tab === 'mine'
          ? libraryCommunity.mine()
          : libraryCommunity.queue()
    request
      .then((r) => {
        if (!live) return
        if (tab === 'feed') setFeed(r.items as CommunityPost[])
        else if (tab === 'mine') setMine(r.items as Contribution[])
        else setQueue(r.items as Contribution[])
        setMore(r.has_more)
        setPage(1)
      })
      .catch(() => {
        if (live) setError('Esta área da Biblioteca não pôde ser carregada. Tente atualizar.')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [tab])
  async function load(next = 1) {
    setBusy(true)
    setError('')
    try {
      if (tab === 'feed') {
        const r = await libraryCommunity.feed(next)
        setFeed((v) => (next === 1 ? r.items : [...v, ...r.items]))
        setMore(r.has_more)
      } else if (tab === 'mine') {
        const r = await libraryCommunity.mine(next)
        setMine((v) => (next === 1 ? r.items : [...v, ...r.items]))
        setMore(r.has_more)
      } else {
        const r = await libraryCommunity.queue(next)
        setQueue((v) => (next === 1 ? r.items : [...v, ...r.items]))
        setMore(r.has_more)
      }
      setPage(next)
    } catch {
      setError('Não foi possível atualizar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  function edit(r?: Contribution) {
    setCurrent(r)
    setValue(r ? { ...r.payload } : emptyCommunityPractice())
    setConsent(false)
    setEditing(true)
    setNotice('')
  }
  async function save(submit: boolean) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const r = await libraryCommunity.save(value, submit, consent, current)
      setCurrent(r)
      setValue(r.payload)
      setConsent(false)
      setNotice(
        submit
          ? 'Enviada para Daiane avaliar. Outros usuários só verão a prática se ela for aprovada.'
          : 'Rascunho privado salvo. Você pode continuar depois.',
      )
      if (submit) setEditing(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  async function withdraw(r: Contribution) {
    setBusy(true)
    setError('')
    try {
      await libraryCommunity.withdraw(r)
      setWithdrawing('')
      if (current?.id === r.id) setEditing(false)
      setNotice('Contribuição retirada da avaliação e da área compartilhada.')
      await load()
    } catch {
      setError('Não foi possível retirar. Atualize antes de tentar novamente.')
    } finally {
      setBusy(false)
    }
  }
  function field(k: keyof CommunityPractice, next: string) {
    setValue((v) => ({ ...v, [k]: next }))
    setConsent(false)
    setNotice('')
  }
  return (
    <section
      aria-label="Comunidade da Biblioteca CER"
      className="rounded-2xl border bg-primary/5 p-4 sm:p-6 space-y-5"
    >
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-primary">
          Descobertas que podem inspirar outras pessoas
        </p>
        <h3 className="font-serif text-2xl">Uma biblioteca que cresce com a gente</h3>
        <p className="text-sm leading-relaxed">
          A Biblioteca CER está em construção. Você também pode enriquecê-la: crie uma prática de
          regulação, conte como foi experimentá-la e envie para Daiane avaliar. Antes de aparecer
          para os outros usuários, toda prática passa pela aprovação dela.
        </p>
        <p className="text-sm leading-relaxed">
          Esta é a área compartilhada do app: práticas aprovadas e comentários publicados por
          escolha de cada pessoa. Seus registros pessoais do CER permanecem nos espaços privados.
          Você escolhe o nome ou apelido que aparecerá aqui.
        </p>
      </header>
      <div role="group" aria-label="Escolher área da comunidade" className="flex flex-wrap gap-2">
        <Button
          aria-pressed={tab === 'feed'}
          variant={tab === 'feed' ? 'default' : 'outline'}
          disabled={busy}
          onClick={() => setTab('feed')}
        >
          Práticas da comunidade
        </Button>
        <Button
          aria-pressed={tab === 'mine'}
          variant={tab === 'mine' ? 'default' : 'outline'}
          disabled={busy}
          onClick={() => setTab('mine')}
        >
          Minhas contribuições
        </Button>
        {curator && (
          <Button
            aria-pressed={tab === 'queue'}
            variant={tab === 'queue' ? 'default' : 'outline'}
            disabled={busy}
            onClick={() => setTab('queue')}
          >
            Avaliar contribuições
          </Button>
        )}
        <Button variant="ghost" disabled={busy || loading} onClick={() => load()}>
          Atualizar esta área
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status">Abrindo contribuições…</p>
      ) : (
        <>
          {tab === 'feed' && (
            <>
              {!feed.length && !error && (
                <p className="text-sm">
                  As primeiras práticas aparecerão aqui após a avaliação de Daiane. Suas descobertas
                  podem fazer parte deste acervo.
                </p>
              )}
              {feed.map((p) => (
                <article key={p.id} className="rounded-2xl border bg-card p-5 space-y-4">
                  <p className="text-xs text-primary">
                    Prática da comunidade · aprovada por Daiane
                  </p>
                  <PracticeText p={p.payload} />
                  {onAddToPlan && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        onAddToPlan({
                          id: 'community:' + p.id,
                          title: p.payload.title,
                          theme: p.payload.theme,
                          duration: p.payload.duration,
                          lesson: p.payload.experience,
                          instructions: p.payload.instructions.match(/[\s\S]{1,1500}/g) || [],
                          fallback: 'Adapte ao seu momento e converse nos encontros.',
                          reflection: '',
                        })
                      }
                    >
                      Acrescentar ao plano de cuidado
                    </Button>
                  )}
                  <LibraryComments targetKey={'community:' + p.id} curator={curator} />
                </article>
              ))}
            </>
          )}
          {tab === 'mine' && (
            <>
              <Button disabled={busy || editing} onClick={() => edit()}>
                Criar minha prática de regulação
              </Button>
              {editing && (
                <form
                  aria-label="Minha contribuição para a Biblioteca"
                  onSubmit={(e) => e.preventDefault()}
                  className="rounded-2xl border bg-card p-5 space-y-4"
                >
                  <h4 className="font-serif text-xl">Uma prática que nasce da sua experiência</h4>
                  {current?.status === 'approved' && (
                    <p className="text-sm">
                      Ao salvar alterações, a versão publicada será retirada. O novo texto precisará
                      passar por outra aprovação de Daiane.
                    </p>
                  )}
                  <label className="block text-sm space-y-1">
                    Nome da prática
                    <Input
                      maxLength={160}
                      value={value.title}
                      onChange={(e) => field('title', e.target.value)}
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block text-sm space-y-1">
                      Tema (opcional)
                      <Input
                        maxLength={100}
                        value={value.theme}
                        onChange={(e) => field('theme', e.target.value)}
                        placeholder="Presença, movimento, descanso…"
                      />
                    </label>
                    <label className="block text-sm space-y-1">
                      Duração aproximada (opcional)
                      <Input
                        maxLength={100}
                        value={value.duration}
                        onChange={(e) => field('duration', e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="block text-sm space-y-1">
                    Como fazer: passo a passo
                    <Textarea
                      maxLength={6000}
                      value={value.instructions}
                      onChange={(e) => field('instructions', e.target.value)}
                      placeholder="Explique de um jeito simples para alguém experimentar. Conte também como adaptar ou quando preferir pausar."
                    />
                  </label>
                  <label className="block text-sm space-y-1">
                    Minha experiência com esta prática
                    <Textarea
                      maxLength={3000}
                      value={value.experience}
                      onChange={(e) => field('experience', e.target.value)}
                      placeholder="Como você descobriu essa prática? O que percebeu no corpo e nas emoções?"
                    />
                  </label>
                  <label className="block text-sm space-y-1">
                    Nome ou apelido para publicar
                    <Input
                      maxLength={60}
                      autoComplete="off"
                      value={value.display_name}
                      onChange={(e) => field('display_name', e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Somente o conteúdo deste formulário e o nome escolhido poderão ser publicados.
                    Evite dados de outras pessoas e detalhes que queira manter privados. Enviar não
                    garante aprovação: Daiane pode solicitar ajustes. Você poderá retirar sua
                    contribuição depois.
                  </p>
                  <label className="flex gap-2 items-start text-sm">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Quero enviar esta prática e meu relato para Daiane avaliar e autorizo a
                      publicação para os usuários do app após a aprovação dela.
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={busy} variant="outline" onClick={() => save(false)}>
                      Salvar rascunho e continuar depois
                    </Button>
                    <Button disabled={busy || !consent} onClick={() => save(true)}>
                      Enviar para avaliação de Daiane
                    </Button>
                    <Button disabled={busy} variant="ghost" onClick={() => setEditing(false)}>
                      Fechar formulário
                    </Button>
                  </div>
                </form>
              )}
              {!mine.length && !error && (
                <p className="text-sm">
                  Suas contribuições e as devolutivas de Daiane aparecerão aqui.
                </p>
              )}
              {mine.map((r) => (
                <article key={r.id} className="rounded-2xl border bg-card p-4 space-y-3">
                  <p className="font-medium">{r.payload.title || 'Minha prática em criação'}</p>
                  <p className="text-sm">{contributionLabels[r.status]}</p>
                  {r.review_note && (
                    <p className="text-sm whitespace-pre-wrap">
                      Devolutiva de Daiane: {r.review_note}
                    </p>
                  )}
                  <details className="text-sm">
                    <summary className="cursor-pointer min-h-10">Ver minha contribuição</summary>
                    <PracticeText p={r.payload} />
                  </details>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={busy || editing} onClick={() => edit(r)}>
                      Revisar minha prática
                    </Button>
                    {r.status !== 'withdrawn' && (
                      <Button variant="ghost" disabled={busy} onClick={() => setWithdrawing(r.id)}>
                        Retirar contribuição
                      </Button>
                    )}
                  </div>
                  {withdrawing === r.id && (
                    <div className="text-sm space-y-2">
                      <p>Esta prática deixará de aparecer para os usuários e sairá da avaliação.</p>
                      <Button disabled={busy} onClick={() => withdraw(r)}>
                        Confirmar retirada da contribuição
                      </Button>{' '}
                      <Button variant="ghost" onClick={() => setWithdrawing('')}>
                        Cancelar retirada
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
          {tab === 'queue' && (
            <>
              <p className="text-sm">
                Confira a clareza dos passos, os cuidados para experimentar e a adequação ao acervo.
                Somente a versão aprovada será publicada. Novas edições voltam para avaliação.
              </p>
              {!queue.length && !error && (
                <p className="text-sm">
                  Nenhuma prática aguardando avaliação ou publicada pela comunidade.
                </p>
              )}
              {queue.map((r) => (
                <CommunityReview key={r.id + ':' + r.revision} r={r} onChanged={() => load()} />
              ))}
            </>
          )}
          {more && (
            <Button disabled={busy} variant="outline" onClick={() => load(page + 1)}>
              Carregar mais contribuições
            </Button>
          )}
        </>
      )}
    </section>
  )
}
