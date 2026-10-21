import React, { useState } from 'react'
import { libraryCommunity, type LibraryComment } from '@/services/libraryCommunity'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

export function LibraryComments({
  targetKey,
  curator = false,
}: {
  targetKey: string
  curator?: boolean
}) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<LibraryComment[]>([]),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [name, setName] = useState(''),
    [body, setBody] = useState(''),
    [consent, setConsent] = useState(false),
    [removing, setRemoving] = useState(''),
    [reason, setReason] = useState('')
  async function load(next = 1) {
    setBusy(true)
    setError('')
    try {
      const r = await libraryCommunity.comments(targetKey, next)
      setItems((v) => (next === 1 ? r.items : [...v, ...r.items]))
      setPage(next)
      setMore(r.has_more)
      setOpen(true)
    } catch {
      setError('Não foi possível abrir os comentários. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  async function publish() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await libraryCommunity.comment(targetKey, name, body, consent)
      setBody('')
      setConsent(false)
      setNotice('Sua experiência foi publicada nesta prática.')
      await load()
    } catch {
      setError(
        'Não foi possível publicar. Confira o nome, o relato e sua confirmação; tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    setBusy(true)
    setError('')
    try {
      await libraryCommunity.removeComment(removing, reason)
      setItems((v) => v.filter((c) => c.id !== removing))
      setRemoving('')
      setReason('')
      setNotice('Comentário retirado da área compartilhada.')
    } catch {
      setError('Não foi possível retirar o comentário. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label="Experiências compartilhadas nesta prática"
      className="border-t pt-4 space-y-3 text-sm"
    >
      <Button
        variant="ghost"
        disabled={busy}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : load())}
      >
        {open ? 'Fechar experiências' : 'Experiências da comunidade'}
      </Button>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {open && (
        <>
          <h4 className="font-serif text-lg">Como foi experimentar?</h4>
          <p>
            Estes relatos são experiências pessoais. O que ajuda uma pessoa pode ser diferente para
            outra.
          </p>
          {!items.length && (
            <p className="text-muted-foreground">
              Ainda não há relatos nesta prática. Você pode compartilhar o primeiro.
            </p>
          )}
          {items.map((c) => (
            <article key={c.id} className="rounded-xl bg-muted/40 p-3 space-y-2">
              <p className="font-medium">
                {c.display_name}{' '}
                <span className="font-normal text-xs text-muted-foreground">
                  · {new Date(c.created).toLocaleDateString('pt-BR')}
                </span>
              </p>
              <p className="whitespace-pre-wrap break-words">{c.body}</p>
              {(c.mine || curator) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setRemoving(c.id)
                    setReason('')
                  }}
                >
                  {c.mine ? 'Retirar meu comentário' : 'Moderar comentário'}
                </Button>
              )}
              {removing === c.id && (
                <div className="space-y-2">
                  <p>O comentário deixará de aparecer para os usuários.</p>
                  {!c.mine && (
                    <label className="block">
                      Motivo da moderação
                      <Textarea
                        maxLength={2000}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                  )}
                  <Button size="sm" disabled={busy || (!c.mine && !reason.trim())} onClick={remove}>
                    Confirmar retirada
                  </Button>{' '}
                  <Button size="sm" variant="ghost" onClick={() => setRemoving('')}>
                    Cancelar
                  </Button>
                </div>
              )}
            </article>
          ))}
          {more && (
            <Button variant="outline" disabled={busy} onClick={() => load(page + 1)}>
              Ver mais experiências
            </Button>
          )}
          <div className="rounded-xl border p-4 space-y-3">
            <p>
              <strong>Este espaço é compartilhado.</strong> Somente o nome que você escolher e o
              texto abaixo ficarão visíveis aos usuários com acesso ao app. Seu Mapa CER, sua
              história, Mandala, plano e demais registros não são publicados aqui.
            </p>
            <label className="block space-y-1">
              Nome ou apelido para publicar
              <Input
                maxLength={60}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setConsent(false)
                }}
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1">
              Minha experiência com esta prática
              <Textarea
                maxLength={2000}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  setConsent(false)
                }}
                placeholder="O que você experimentou? Como seu corpo e suas emoções responderam?"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Compartilhe somente o que deseja tornar visível. Evite nomes de outras pessoas,
              contatos ou detalhes íntimos que queira preservar. Você pode retirar seu comentário
              depois; Daiane também poderá moderá-lo.
            </p>
            <label className="flex gap-2 items-start">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>Quero publicar este relato para os usuários do app.</span>
            </label>
            <Button disabled={busy || !consent || !name.trim() || !body.trim()} onClick={publish}>
              {busy ? 'Aguarde…' : 'Publicar experiência'}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
