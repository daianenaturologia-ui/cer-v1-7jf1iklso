import React, { useEffect, useState } from 'react'
import {
  cerCycleInvitationService,
  type CycleInvitation,
} from '@/services/cerCycleInvitationService'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ParticipantCycleReflection({
  cycleId,
  enrollmentId,
}: {
  cycleId: string
  enrollmentId: string
}) {
  const [invitation, setInvitation] = useState<CycleInvitation | null>(null)
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    setInvitation(null)
    setReflection('')
    setError('')
    cerCycleInvitationService
      .list(enrollmentId)
      .then((list) => {
        if (!active) return
        const item = list.find((i) => i.care_cycle_id === cycleId) || null
        setInvitation(item)
        setReflection(item?.participant_reflection || '')
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o convite. Tente novamente mais tarde.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [cycleId, enrollmentId])
  async function share() {
    if (!invitation) return
    setSaving(true)
    setError('')
    try {
      setInvitation(await cerCycleInvitationService.respond(invitation.id, reflection))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível compartilhar sua percepção.')
    } finally {
      setSaving(false)
    }
  }
  if (loading) return <p>Carregando convite...</p>
  if (!invitation)
    return (
      <p role={error ? 'alert' : undefined}>
        {error || 'Não há convite de revisão para este ciclo.'}
      </p>
    )
  return (
    <section className="space-y-4 rounded-xl border p-5" aria-label="Sua percepção do ciclo">
      <h1 className="font-serif text-xl">Sua percepção do ciclo</h1>
      <p className="text-sm">
        O que foi possível, o que ajudou e o que precisa de mais cuidado? Este relato será
        compartilhado com sua profissional.
      </p>
      {invitation.shared_prompt && (
        <details className="rounded-lg border p-3 text-sm">
          <summary>Ideias para colher o aprendizado</summary>
          <p className="mt-2">
            O que descobri sobre meu jeito e meu ritmo? O que quero manter ou ajustar? O que consigo
            conduzir com mais autonomia? Que apoio preciso e como posso retomar quando a vida muda?
          </p>
          <p className="mt-2 text-muted-foreground">
            Conte o que fizer sentido. Uma experiência que não aconteceu também pode ajudar a
            compreender suas condições.
          </p>
        </details>
      )}
      {invitation.shared_prompt && (
        <p className="rounded-lg bg-muted p-3 text-sm">{invitation.shared_prompt}</p>
      )}
      <label className="block text-sm" htmlFor="cycle-reflection">
        O que gostaria de compartilhar?
      </label>
      <Textarea
        id="cycle-reflection"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={6}
        maxLength={5000}
        disabled={!!invitation.completed_at || saving}
      />
      {error && <p role="alert">{error}</p>}
      {invitation.completed_at ? (
        <p role="status">Sua percepção foi compartilhada com a profissional.</p>
      ) : (
        <Button disabled={saving || !reflection.trim()} onClick={share}>
          {saving ? 'Compartilhando...' : 'Compartilhar percepção'}
        </Button>
      )}
    </section>
  )
}
