import React, { useEffect, useState } from 'react'
import { WeeklyAgenda } from '@/components/WeeklyAgenda'
import { Button } from '@/components/ui/button'
import { cerPlannerService } from '@/services/cerPlannerService'
import type { CerPlannerItemRecord } from '@/types/cer'
export const ProfessionalPlannerView: React.FC<{ enrollmentId: string }> = ({ enrollmentId }) => {
  const [items, setItems] = useState<CerPlannerItemRecord[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    setItems([])
    setError(false)
    setLoading(true)
    cerPlannerService
      .listByEnrollment(enrollmentId)
      .then((r) => {
        if (active) setItems(r)
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
    <section aria-label="Planner da interagente">
      {loading ? (
        <p>Carregando agenda…</p>
      ) : error ? (
        <p role="alert">
          Não foi possível carregar a agenda.{' '}
          <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </p>
      ) : (
        <WeeklyAgenda
          key={`${enrollmentId}-${revision}`}
          enrollmentId={enrollmentId}
          careItems={items}
          readOnly
        />
      )}
    </section>
  )
}
