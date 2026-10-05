import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { cerPlannerService } from '@/services/cerPlannerService'
import { cerCycleInvitationService } from '@/services/cerCycleInvitationService'
import { WeeklyAgenda } from '@/components/WeeklyAgenda'
import { JourneyNavigation } from '@/components/JourneyNavigation'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type { EnrollmentRecord, CerPlannerItemRecord } from '@/types/cer'
export const PlannerPage: React.FC = () => {
  const { user } = useAuth()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [items, setItems] = useState<CerPlannerItemRecord[]>([])
  const [invite, setInvite] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    setEnrollment(null)
    setItems([])
    setInvite(undefined)
    setLoading(true)
    setError(false)
    async function load() {
      if (!user?.id) {
        if (active) setLoading(false)
        return
      }
      try {
        const e = await enrollmentService.getActiveForUser(user.id)
        if (!e) return
        const records = await cerPlannerService.listForParticipant(e.id, user.id)
        if (active) {
          setEnrollment(e)
          setItems(records)
        }
        try {
          const invitations = await cerCycleInvitationService.list(e.id)
          if (active) setInvite(invitations.find((i) => !i.completed_at)?.care_cycle_id)
        } catch {
          /* O convite não bloqueia a agenda. */
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [user?.id, revision])
  async function complete(id: string) {
    await cerPlannerService.completeItem(id)
    if (enrollment && user)
      setItems(await cerPlannerService.listForParticipant(enrollment.id, user.id))
  }
  async function reschedule(id: string, iso: string) {
    await cerPlannerService.rescheduleItem(id, { scheduled_at: iso })
    if (enrollment && user)
      setItems(await cerPlannerService.listForParticipant(enrollment.id, user.id))
  }
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6">
      <main className="max-w-6xl mx-auto space-y-5">
        <header className="flex flex-wrap gap-3 items-center justify-between">
          <h1 className="font-serif text-2xl flex gap-2 items-center">
            <Calendar className="w-5 h-5 text-primary" />
            Minha agenda
          </h1>
          <JourneyNavigation />
        </header>
        {loading ? (
          <p role="status">Carregando agenda…</p>
        ) : error ? (
          <p role="alert">
            Não foi possível carregar seu acompanhamento.{' '}
            <Button variant="outline" onClick={() => setRevision((v) => v + 1)}>
              Tentar novamente
            </Button>
          </p>
        ) : enrollment ? (
          <WeeklyAgenda
            key={enrollment.id}
            enrollmentId={enrollment.id}
            careItems={items}
            onCompleteCare={complete}
            onRescheduleCare={reschedule}
          />
        ) : (
          <p>
            Seu acompanhamento ainda não está disponível.{' '}
            <Link className="underline" to="/">
              Voltar à jornada
            </Link>
          </p>
        )}
        {invite && (
          <Link
            className="block rounded-xl border p-3 text-sm text-primary"
            to={`/reviews/${invite}`}
          >
            Você tem uma revisão de ciclo disponível →
          </Link>
        )}
      </main>
    </div>
  )
}
export default PlannerPage
