import React, { useEffect, useState } from 'react'
import { SelfDevelopmentJourney } from '@/components/SelfDevelopmentJourney'
import { Button } from '@/components/ui/button'
import { cerPlannerService } from '@/services/cerPlannerService'
import type { CerPlannerItemRecord } from '@/types/cer'

const statusLabels: Record<CerPlannerItemRecord['status'], string> = {
  planned: 'Planejado',
  active: 'Em andamento',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  superseded: 'Substituído',
}

/** Leitura profissional do planejamento desta pessoa; não altera a agenda da interagente. */
export const ProfessionalPlannerView: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
  const [items, setItems] = useState<CerPlannerItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setItems([])
    setLoading(true)
    setError(false)
    cerPlannerService
      .listByEnrollment(enrollmentId)
      .then((result) => {
        if (active) setItems(result)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, revision])

  return (
    <section className="space-y-3" aria-label="Planner da interagente">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-semibold">Planner</h2>
          <p className="text-xs text-muted-foreground">
            Execução cotidiana do plano construído na Evolução, para revisar em sessão.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRevision((value) => value + 1)}>
          Atualizar
        </Button>
      </div>
      <SelfDevelopmentJourney
        key={`development-planner-${enrollmentId}`}
        enrollmentId={enrollmentId}
        mode="play"
        readOnly
      />
      <h3 className="font-serif">Práticas do acompanhamento individual</h3>
      {loading ? (
        <p className="text-sm">Carregando planner...</p>
      ) : error ? (
        <p role="alert" className="text-sm">
          Não foi possível carregar o planner agora.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum item planejado para esta interagente.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border/70 p-3 text-sm">
              <strong>{item.safe_title}</strong>
              {item.safe_summary && (
                <p className="text-xs text-muted-foreground">{item.safe_summary}</p>
              )}
              <span className="block text-xs text-muted-foreground">
                {item.scheduled_at
                  ? new Date(item.scheduled_at).toLocaleString('pt-BR')
                  : 'Sem horário definido'}{' '}
                · {statusLabels[item.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
