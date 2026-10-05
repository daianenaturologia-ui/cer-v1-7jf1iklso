import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { selfDevelopmentService, type EditorialResource } from '@/services/selfDevelopment'
import { DEVELOPMENT_CATALOG } from '@/services/developmentCatalog'

const empty = {
  title: '',
  theme: '',
  duration: '',
  lesson: '',
  instructions: [''],
  fallback: '',
  reflection: '',
  status: 'draft' as const,
}
export function DevelopmentResourceEditor() {
  const [records, setRecords] = useState<EditorialResource[]>([])
  const [editing, setEditing] = useState<Omit<EditorialResource, 'id' | 'author_user_id'> | null>(
    null,
  )
  const [editingId, setEditingId] = useState<string>()
  const [steps, setSteps] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    selfDevelopmentService
      .editorialList()
      .then((values) => {
        if (active) setRecords(values)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar seus recursos adicionais.')
      })
    return () => {
      active = false
    }
  }, [])
  function open(resource?: EditorialResource) {
    setEditingId(resource?.status === 'draft' ? resource.id : undefined)
    setEditing(resource ? { ...resource, status: 'draft' } : empty)
    setSteps(resource?.instructions.join('\n') || '')
    setError('')
    setMessage('')
  }
  async function save(publish: boolean) {
    if (!editing || busy) return
    setBusy(true)
    setError('')
    try {
      const resource = await selfDevelopmentService.saveResource(
        {
          title: editing.title,
          theme: editing.theme,
          duration: editing.duration,
          lesson: editing.lesson,
          fallback: editing.fallback,
          reflection: editing.reflection,
          instructions: steps
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          status: publish ? 'published' : 'draft',
        },
        editingId,
      )
      setRecords((old) =>
        editingId ? old.map((r) => (r.id === editingId ? resource : r)) : [resource, ...old],
      )
      setEditing(null)
      setMessage(
        publish
          ? 'Recurso publicado. As pessoas podem escolhê-lo sem liberações individuais.'
          : 'Rascunho salvo.',
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível salvar. Seu conteúdo continua aberto.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function archive(id: string) {
    setBusy(true)
    setError('')
    try {
      await selfDevelopmentService.archiveResource(id)
      setRecords((old) => old.map((r) => (r.id === id ? { ...r, status: 'archived' } : r)))
      setMessage('Recurso retirado do acervo. As tentativas anteriores preservam seu conteúdo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível retirar o recurso.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="rounded-xl border p-4 space-y-4" aria-label="Acervo educativo">
      <h2 className="font-serif text-xl">Acervo de desenvolvimento</h2>
      <p className="text-sm text-muted-foreground">
        {DEVELOPMENT_CATALOG.length} recursos disponíveis. Publique novos ensinamentos uma vez para
        todos explorarem com autonomia.
      </p>
      <details>
        <summary className="text-sm cursor-pointer">Conhecer o acervo inicial</summary>
        <ul className="list-disc pl-5 text-sm mt-2">
          {DEVELOPMENT_CATALOG.map((r) => (
            <li key={r.id}>
              {r.title} · {r.theme}
            </li>
          ))}
        </ul>
      </details>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {!editing && <Button onClick={() => open()}>Criar recurso educativo</Button>}
      {editing && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void save(false)
          }}
        >
          {(['title', 'theme', 'duration'] as const).map((key) => (
            <label className="block text-sm space-y-1" key={key}>
              <span>
                {{ title: 'Nome do recurso', theme: 'Tema', duration: 'Tempo aproximado' }[key]}
              </span>
              <Input
                maxLength={key === 'title' ? 160 : 5000}
                value={editing[key]}
                onChange={(e) =>
                  setEditing((old) => (old ? { ...old, [key]: e.target.value } : old))
                }
              />
            </label>
          ))}
          <label className="block text-sm space-y-1">
            <span>O que este recurso ensina?</span>
            <Textarea
              maxLength={5000}
              value={editing.lesson}
              onChange={(e) =>
                setEditing((old) => (old ? { ...old, lesson: e.target.value } : old))
              }
            />
          </label>
          <label className="block text-sm space-y-1">
            <span>Como experimentar? Um passo por linha, até 12 passos.</span>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} />
          </label>
          <label className="block text-sm space-y-1">
            <span>Alternativa para um dia difícil</span>
            <Textarea
              maxLength={5000}
              value={editing.fallback}
              onChange={(e) =>
                setEditing((old) => (old ? { ...old, fallback: e.target.value } : old))
              }
            />
          </label>
          <label className="block text-sm space-y-1">
            <span>Pergunta para revisar o aprendizado</span>
            <Textarea
              maxLength={5000}
              value={editing.reflection}
              onChange={(e) =>
                setEditing((old) => (old ? { ...old, reflection: e.target.value } : old))
              }
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} type="submit" variant="outline">
              Salvar rascunho
            </Button>
            <Button disabled={busy} type="button" onClick={() => save(true)}>
              Publicar no acervo
            </Button>
            <Button disabled={busy} type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {records.map((r) => (
          <article className="border rounded-lg p-3 space-y-1" key={r.id}>
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-sm">
              {r.status === 'published'
                ? 'Publicado · uso autônomo'
                : r.status === 'archived'
                  ? 'Retirado do acervo'
                  : 'Rascunho'}
            </p>
            <Button size="sm" variant="outline" onClick={() => open(r)}>
              {r.status === 'draft' ? 'Editar rascunho' : 'Criar nova versão'}
            </Button>
            {r.status !== 'archived' && (
              <Button disabled={busy} size="sm" variant="ghost" onClick={() => archive(r.id)}>
                Retirar do acervo
              </Button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
