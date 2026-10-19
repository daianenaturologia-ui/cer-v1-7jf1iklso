import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { selfDevelopmentService, type EditorialResource } from '@/services/selfDevelopment'
import {
  EMPTY_MATERIAL,
  MATERIAL_FORMATS,
  filterLibrary,
  type MaterialFormat,
} from '@/services/libraryMaterial'
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
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
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
    setEditing(
      resource
        ? { ...resource, material: { ...EMPTY_MATERIAL, ...resource.material }, status: 'draft' }
        : { ...empty, material: { ...EMPTY_MATERIAL } },
    )
    setSteps(resource?.instructions?.join('\n') || '')
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
          material: editing.material,
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
    if (busy) return
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
        O acervo inicial tem {DEVELOPMENT_CATALOG.length} recursos de texto. Prepare PDFs, áudios,
        vídeos e novos textos aos poucos; rascunhos ficam somente na sua gestão.
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
      {!editing && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1">
            Buscar meus materiais
            <Input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="text-sm space-y-1">
            Estado do material
            <select
              className="w-full rounded-md border bg-background p-2"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="all">Todos os estados</option>
              <option value="draft">Rascunhos</option>
              <option value="published">Publicados</option>
              <option value="archived">Retirados</option>
            </select>
          </label>
        </div>
      )}
      {editing && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void save(false)
          }}
        >
          <p className="text-sm text-muted-foreground">
            Comece pelo nome e salve o rascunho. Complete a apresentação e as instruções antes de
            publicar. Materiais publicados ficam disponíveis às pessoas com acesso ao acervo
            educativo.
          </p>
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
          <fieldset className="border rounded-lg p-3 space-y-3">
            <legend className="px-1 text-sm font-medium">Material e origem</legend>
            <label className="block text-sm space-y-1">
              <span>Formato do material</span>
              <select
                className="w-full rounded-md border bg-background p-2"
                value={editing.material?.format || 'text'}
                onChange={(e) =>
                  setEditing((old) =>
                    old
                      ? {
                          ...old,
                          material: {
                            ...EMPTY_MATERIAL,
                            ...old.material,
                            format: e.target.value as MaterialFormat,
                          },
                        }
                      : old,
                  )
                }
              >
                {Object.entries(MATERIAL_FORMATS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {(['url', 'author', 'references', 'conditions'] as const).map((key) => (
              <label className="block text-sm space-y-1" key={key}>
                <span>
                  {
                    {
                      url: 'Endereço do material (HTTPS)',
                      author: 'Autoria e créditos',
                      references: 'Fontes e referências',
                      conditions: 'Orientações antes de começar',
                    }[key]
                  }
                </span>
                {key === 'url' || key === 'author' ? (
                  <Input
                    maxLength={key === 'url' ? 2000 : 3000}
                    value={editing.material?.[key] || ''}
                    onChange={(e) =>
                      setEditing((old) =>
                        old
                          ? {
                              ...old,
                              material: {
                                ...EMPTY_MATERIAL,
                                ...old.material,
                                [key]: e.target.value,
                              },
                            }
                          : old,
                      )
                    }
                  />
                ) : (
                  <Textarea
                    maxLength={3000}
                    value={editing.material?.[key] || ''}
                    onChange={(e) =>
                      setEditing((old) =>
                        old
                          ? {
                              ...old,
                              material: {
                                ...EMPTY_MATERIAL,
                                ...old.material,
                                [key]: e.target.value,
                              },
                            }
                          : old,
                      )
                    }
                  />
                )}
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Vincule o PDF, áudio ou vídeo já hospedado. Use aqui materiais destinados ao acervo
              educativo; os produtos para venda avulsa serão organizados no site.
            </p>
          </fieldset>
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
        {!records.length && !editing && (
          <p className="text-sm text-muted-foreground">
            Seus novos materiais aparecerão aqui. Você pode prepará-los depois; o acervo inicial e o
            restante do CER continuam disponíveis.
          </p>
        )}
        {records.length > 0 &&
          !filterLibrary(records, query).some(
            (r) => stateFilter === 'all' || r.status === stateFilter,
          ) && <p role="status">Nenhum material encontrado com esses filtros.</p>}
        {filterLibrary(records, query)
          .filter((r) => stateFilter === 'all' || r.status === stateFilter)
          .map((r) => (
            <article className="border rounded-lg p-3 space-y-1" key={r.id}>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-xs text-muted-foreground">
                {MATERIAL_FORMATS[r.material?.format || 'text']}
                {r.theme ? ` · ${r.theme}` : ''}
              </p>
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
