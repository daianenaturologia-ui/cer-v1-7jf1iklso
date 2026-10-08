import React, { useEffect, useMemo, useState, useRef } from 'react'
import type { CerMapReadingSnapshot, CerResourceInsight } from '@/types/cerMapReadings'
import { integratedResources, resourceMapFingerprint } from '@/services/cerIntegratedResources'
import {
  connectResource,
  emptyResourceExercise,
  resourceExerciseService,
  visibleResourceItems,
  type ResourceExercise,
  type SavedResourceExercise,
} from '@/services/cerResourceExercise'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Link2, Sparkles } from 'lucide-react'
import { ResourceAgendaForm } from './ResourceAgendaForm'

const dimensionNames: Record<string, string> = {
  corpo: 'Corpo',
  mente: 'Mente & Emoções',
  regulacao: 'Regulação',
  relacoes: 'Relações',
  sexualidade: 'Intimidade',
  sentido: 'Sentido',
}
export function IntegratedResourceGame({
  snapshot,
  readOnly = false,
}: {
  snapshot: CerMapReadingSnapshot
  readOnly?: boolean
}) {
  const pool = useMemo(() => integratedResources(snapshot), [snapshot])
  const fingerprint = useMemo(() => resourceMapFingerprint(pool), [pool])
  const fingerprintRef = useRef(fingerprint)
  fingerprintRef.current = fingerprint
  const [exercise, setExercise] = useState<ResourceExercise>(() =>
    emptyResourceExercise(snapshot.enrollmentId, fingerprint),
  )
  const [saved, setSaved] = useState<SavedResourceExercise | null>(null)
  const [loading, setLoading] = useState(!readOnly)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [selected, setSelected] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [newKind, setNewKind] = useState<'strength' | 'difficulty'>('strength')
  const [newLabel, setNewLabel] = useState('')
  const [retry, setRetry] = useState(0)
  const [editing, setEditing] = useState('')
  const [editLabel, setEditLabel] = useState('')
  useEffect(() => {
    let active = true
    setLoading(!readOnly)
    setSaved(null)
    setError('')
    setSelected('')
    setDirty(false)
    setExercise(emptyResourceExercise(snapshot.enrollmentId, fingerprintRef.current))
    if (readOnly)
      return () => {
        active = false
      }
    resourceExerciseService
      .load(snapshot.enrollmentId)
      .then((record) => {
        if (!active) return
        if (record) {
          setSaved(record)
          setExercise(record.data)
        }
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setLoading(false)
          setError(
            'Não foi possível carregar seu exercício. Reabra ou tente novamente para preservar seus registros.',
          )
        }
      })
    return () => {
      active = false
    }
  }, [snapshot.enrollmentId, readOnly, retry])
  // A changed map may remove suggestions, but never silently overwrites personal entries or links.
  const sourceChanged = exercise.sourceFingerprint !== fingerprint
  const items = visibleResourceItems(pool, exercise)
  const itemById = new Map(items.map((i) => [i.id, i]))
  const mutate = (next: ResourceExercise) => {
    setExercise(next)
    setDirty(true)
    setAnnouncement('Alterações ainda não salvas.')
  }
  const attach = (strengthId: string, difficultyId: string) => {
    const next = connectResource(exercise, pool, strengthId, difficultyId)
    if (next === exercise) return
    mutate(next)
    setSelected('')
    setAnnouncement(
      `${itemById.get(strengthId)?.label} conectada a ${itemById.get(difficultyId)?.label}.`,
    )
  }
  const add = () => {
    const label = newLabel.trim()
    if (!label) return
    mutate({
      ...exercise,
      customItems: [
        ...exercise.customItems,
        { id: `personal:${crypto.randomUUID()}`, kind: newKind, label },
      ],
    })
    setNewLabel('')
    setAnnouncement('Seu item foi acrescentado. Salve para guardá-lo.')
  }
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const next = { ...exercise, sourceFingerprint: fingerprint }
      const record = await resourceExerciseService.save(next, saved)
      setSaved(record)
      setExercise(record.data)
      setDirty(false)
      setAnnouncement('Exercício salvo. Você pode voltar a ele depois.')
    } catch {
      setError(
        'Não foi possível salvar. Suas alterações continuam nesta tela; tente novamente. Se outra janela atualizou o exercício, reabra para carregar a versão salva.',
      )
    } finally {
      setSaving(false)
    }
  }
  const describe = (
    item: { id: string; kind: string; label: string },
    origin?: CerResourceInsight,
  ) => (
    <div
      key={item.id}
      className={`rounded-xl border p-3 ${item.kind === 'strength' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20' : 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20'}`}
    >
      <div className="flex items-start gap-2">
        {readOnly ? (
          <p className="font-medium text-sm flex-1">{item.label}</p>
        ) : item.kind === 'strength' ? (
          <button
            type="button"
            disabled={saving}
            draggable={!saving}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/x-cer-strength', item.id)
              e.dataTransfer.effectAllowed = 'copy'
              setSelected(item.id)
            }}
            onClick={() => {
              setSelected(selected === item.id ? '' : item.id)
              setAnnouncement(
                selected === item.id
                  ? 'Seleção desfeita.'
                  : 'Força selecionada. Escolha uma dificuldade para conectar.',
              )
            }}
            aria-pressed={selected === item.id}
            aria-label={`Selecionar força: ${item.label}`}
            className={`text-left text-sm font-medium flex-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected === item.id ? 'ring-2 ring-primary p-1' : ''}`}
          >
            {item.label}
          </button>
        ) : (
          <p className="font-medium text-sm flex-1">{item.label}</p>
        )}
        {!readOnly && (
          <button
            type="button"
            disabled={saving}
            aria-label={`Retirar item: ${item.label}`}
            className="p-1 text-muted-foreground hover:text-foreground"
            onClick={() => {
              mutate({ ...exercise, hiddenIds: [...new Set([...exercise.hiddenIds, item.id])] })
              if (selected === item.id) setSelected('')
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {origin && (
        <details className="text-xs mt-2 text-muted-foreground">
          <summary className="cursor-pointer">De onde vem esta leitura</summary>
          <p className="mt-2 leading-relaxed">{origin.description}</p>
          <ul className="mt-1 space-y-1">
            {origin.origins.map((o, i) => (
              <li key={i}>
                {dimensionNames[o.dimensionId] || o.dimensionId} ·{' '}
                {o.basis === 'reference'
                  ? 'Potencialidade ou custo do referencial'
                  : o.basis === 'professional'
                    ? 'Leitura profissional'
                    : 'Resposta registrada'}{' '}
                · {o.label}
              </li>
            ))}
          </ul>
        </details>
      )}
      {!origin && <span className="text-[11px] text-muted-foreground">Acrescentado por você</span>}
      {!readOnly && !origin && (
        <div className="mt-2">
          {editing === item.id ? (
            <div className="flex gap-2">
              <Input
                aria-label={`Novo texto: ${item.label}`}
                value={editLabel}
                maxLength={240}
                onChange={(e) => setEditLabel(e.target.value)}
              />
              <Button
                size="sm"
                disabled={saving || !editLabel.trim()}
                onClick={() => {
                  mutate({
                    ...exercise,
                    customItems: exercise.customItems.map((i) =>
                      i.id === item.id ? { ...i, label: editLabel.trim() } : i,
                    ),
                  })
                  setEditing('')
                }}
              >
                Aplicar
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs underline"
              onClick={() => {
                setEditing(item.id)
                setEditLabel(item.label)
              }}
            >
              Editar meu item
            </button>
          )}
        </div>
      )}
      {item.kind === 'difficulty' && (
        <div
          className="mt-2 space-y-2"
          onDragOver={(e) => {
            if (!readOnly && !saving) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }
          }}
          onDrop={(e) => {
            if (readOnly || saving) return
            e.preventDefault()
            attach(e.dataTransfer.getData('application/x-cer-strength'), item.id)
          }}
        >
          {!readOnly && (
            <button
              type="button"
              disabled={!selected || saving}
              aria-label={`Conectar força a: ${item.label}`}
              onClick={() => attach(selected, item.id)}
              className="w-full rounded-lg border border-dashed border-amber-400 p-3 text-xs text-left disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Link2 className="inline h-3.5 w-3.5 mr-1" />
              {selected
                ? 'Conectar a força selecionada'
                : 'Arraste uma força aqui ou selecione-a primeiro'}
            </button>
          )}
          {exercise.connections
            .filter((c) => c.difficultyId === item.id && itemById.has(c.strengthId))
            .map((c) => (
              <div key={c.strengthId} className="rounded-lg bg-background border p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs flex-1">{itemById.get(c.strengthId)?.label}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      disabled={saving}
                      aria-label={`Desfazer conexão: ${itemById.get(c.strengthId)?.label} com ${item.label}`}
                      onClick={() =>
                        mutate({
                          ...exercise,
                          connections: exercise.connections.filter((other) => other !== c),
                        })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {!readOnly && (
                  <Textarea
                    className="min-h-16 text-xs"
                    maxLength={2000}
                    aria-label={`Como usar ${itemById.get(c.strengthId)?.label} diante de ${item.label}`}
                    placeholder="Como quero usar essa força em uma situação concreta…"
                    value={c.strategy}
                    disabled={saving}
                    onChange={(e) =>
                      mutate({
                        ...exercise,
                        connections: exercise.connections.map((other) =>
                          other === c ? { ...c, strategy: e.target.value } : other,
                        ),
                      })
                    }
                  />
                )}
                {!readOnly &&
                  c.strategy.trim() &&
                  (dirty || saving ? (
                    <p className="text-xs text-muted-foreground">
                      Salve seu exercício para levar esta estratégia à agenda.
                    </p>
                  ) : (
                    <ResourceAgendaForm
                      enrollmentId={snapshot.enrollmentId}
                      strength={itemById.get(c.strengthId)!.label}
                      difficulty={item.label}
                      strategy={c.strategy}
                    />
                  ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
  if (loading) return <p role="status">Preparando seu exercício…</p>
  if (error && !saved && !dirty)
    return (
      <div role="alert">
        <p>{error}</p>
        <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
          Tentar novamente
        </Button>
      </div>
    )
  return (
    <section aria-label="Minhas forças diante das dificuldades" className="space-y-5">
      <div className="space-y-2">
        <h3 className="font-serif text-lg">Minhas forças diante das dificuldades</h3>
        <p className="text-sm leading-relaxed">
          Suas potencialidades são ferramentas para enfrentar dificuldades e caminhar em direção ao
          que importa. Aqui reunimos os recursos e pontos de atenção disponíveis nas seis dimensões.
          Você pode reconhecer o que faz sentido e ampliar esta leitura com sua experiência.
        </p>
        <p className="text-xs text-muted-foreground">
          Uma força pode ajudar em várias dificuldades, e uma dificuldade pode receber mais de uma
          força. Apoio de outras pessoas, condições do ambiente e capacidades que deseja desenvolver
          também podem entrar na sua lista.
        </p>
      </div>
      {readOnly ? (
        <p className="rounded-lg bg-muted p-3 text-xs">
          Esta é a lista do mapa compartilhado. Os acréscimos e conexões do exercício pessoal ficam
          na visão da interagente.
        </p>
      ) : (
        <p className="rounded-lg bg-primary/5 p-3 text-xs">
          Arraste uma força para uma dificuldade. No celular ou pelo teclado, selecione a força e
          depois use “Conectar” na dificuldade. Retire o que não reconhece e acrescente seus
          próprios itens. Salve ao terminar; este exercício é pessoal.
        </p>
      )}
      {!pool.length && (
        <p className="text-sm text-muted-foreground">
          Ainda não há recursos identificados nesta versão do mapa. Você pode começar pelos que
          reconhece em si.
        </p>
      )}
      {sourceChanged && (
        <p role="status" className="text-xs">
          O mapa foi atualizado. Seus itens pessoais e conexões foram preservados; conexões com
          sugestões que saíram desta versão ficam fora da lista atual.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
            Minhas forças e potencialidades
          </h4>
          {items
            .filter((i) => i.kind === 'strength')
            .map((i) =>
              describe(
                i,
                pool.find((p) => p.id === i.id),
              ),
            )}
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-300">
            O que está difícil para mim
          </h4>
          {items
            .filter((i) => i.kind === 'difficulty')
            .map((i) =>
              describe(
                i,
                pool.find((p) => p.id === i.id),
              ),
            )}
        </div>
      </div>
      {!readOnly && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="resource-kind">
              Tipo do meu item
            </label>
            <select
              id="resource-kind"
              aria-label="Tipo do meu item"
              value={newKind}
              disabled={saving}
              onChange={(e) => setNewKind(e.target.value as 'strength' | 'difficulty')}
              className="rounded-md border p-2 text-sm bg-background"
            >
              <option value="strength">Uma força minha</option>
              <option value="difficulty">Uma dificuldade minha</option>
            </select>
            <Input
              className="flex-1 min-w-40"
              aria-label="Meu novo item"
              maxLength={240}
              value={newLabel}
              disabled={saving}
              placeholder="Acrescente com suas palavras…"
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  add()
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newLabel.trim() || saving || exercise.customItems.length >= 100}
              onClick={add}
            >
              <Plus className="w-4 h-4 mr-1" />
              Acrescentar
            </Button>
          </div>
          {!!exercise.hiddenIds.length && (
            <button
              type="button"
              disabled={saving}
              className="text-xs underline"
              onClick={() => mutate({ ...exercise, hiddenIds: [] })}
            >
              Restaurar itens retirados
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            As conexões podem ajudar a construir estratégias para sua rotina. Depois de salvar o
            exercício, você pode escolher uma estratégia e levá-la à sua agenda.
          </p>
          {error && (
            <p role="alert" className="text-sm">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button disabled={saving || (!dirty && !sourceChanged)} onClick={save}>
              {saving ? 'Salvando…' : 'Salvar meu exercício'}
            </Button>
            <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {announcement || (saved ? 'Exercício salvo.' : 'Seu exercício fica privado.')}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
