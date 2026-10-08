import React, { useState } from 'react'
import { plannerNotesService, validatePlannerNote } from '@/services/plannerNotes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ResourceAgendaForm({
  enrollmentId,
  strength,
  difficulty,
  strategy,
}: {
  enrollmentId: string
  strength: string
  difficulty: string
  strategy: string
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(strategy.trim().slice(0, 160))
  const [goal, setGoal] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [working, setWorking] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  async function schedule() {
    if (working || done) return
    setError('')
    try {
      if (!start || !end) throw new Error('Escolha o início e o fim deste momento.')
      const input = {
        enrollment_id: enrollmentId,
        title: title.trim(),
        note: [
          goal.trim() && `Meu objetivo: ${goal.trim()}`,
          `Força que quero usar: ${strength}`,
          `Dificuldade que desejo cuidar: ${difficulty}`,
          `Minha estratégia: ${strategy}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(end).toISOString(),
        kind: 'life' as const,
        status: 'planned' as const,
      }
      validatePlannerNote(input)
      setWorking(true)
      await plannerNotesService.save(input)
      setDone(true)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível guardar este momento. Seus campos continuam aqui.',
      )
    } finally {
      setWorking(false)
    }
  }
  if (done)
    return (
      <p role="status" className="text-xs text-primary">
        Momento guardado na sua agenda. Você pode ajustar o horário e editar suas anotações por lá.
      </p>
    )
  if (!open)
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={`Levar ${strength} para minha agenda diante de ${difficulty}`}
      >
        Levar para minha agenda
      </Button>
    )
  return (
    <div className="space-y-3 rounded-lg bg-primary/5 p-3" aria-label="Preparar momento na agenda">
      <p className="text-xs">
        Transforme esta estratégia em um pequeno passo possível. O momento fica privado na sua
        agenda e pode ser reorganizado com leveza.
      </p>
      <label className="block text-xs space-y-1">
        Meu pequeno passo
        <Input
          value={title}
          maxLength={160}
          disabled={working}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Meu pequeno passo"
        />
      </label>
      <label className="block text-xs space-y-1">
        Meu objetivo (opcional)
        <Input
          value={goal}
          maxLength={500}
          disabled={working}
          onChange={(e) => setGoal(e.target.value)}
          aria-label="Meu objetivo para este momento"
        />
      </label>
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="block text-xs space-y-1">
          Início
          <Input
            type="datetime-local"
            value={start}
            disabled={working}
            onChange={(e) => setStart(e.target.value)}
            onInput={(e) => setStart(e.currentTarget.value)}
            aria-label="Início do meu momento"
          />
        </label>
        <label className="block text-xs space-y-1">
          Fim
          <Input
            type="datetime-local"
            value={end}
            disabled={working}
            onChange={(e) => setEnd(e.target.value)}
            onInput={(e) => setEnd(e.currentTarget.value)}
            aria-label="Fim do meu momento"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Horários no fuso {Intl.DateTimeFormat().resolvedOptions().timeZone}. A agenda guarda uma
        cópia desta estratégia; mudanças no exercício não alteram o momento já criado.
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={working || !title.trim()} onClick={schedule}>
          {working ? 'Guardando…' : 'Confirmar na minha agenda'}
        </Button>
        <Button size="sm" variant="ghost" disabled={working} onClick={() => setOpen(false)}>
          Voltar ao exercício
        </Button>
      </div>
    </div>
  )
}
