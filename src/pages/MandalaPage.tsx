import { JourneyNavigation } from '@/components/JourneyNavigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { CycleMandala } from '@/components/CycleMandala'
import { CerIntro } from '@/components/CerArtwork'
import type { EnrollmentRecord } from '@/types/cer'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'

export const MandalaPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) {
        setEnrollment(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setEnrollment(null)
      setError(false)
      try {
        const current = await enrollmentService.getActiveForUser(user.id)
        if (active) setEnrollment(current)
      } catch (err) {
        if (active) setError(true)
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [user?.id, revision])

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-end border-b border-border/40 pb-4">
          <JourneyNavigation />
        </div>

        <CerIntro title="Meu ciclo, meu ritmo" variant="waves">
          <p>
            Um espaço para escutar seu corpo, perceber suas emoções e se conectar com a natureza.
          </p>
        </CerIntro>

        {loading ? (
          <div role="status" className="p-8 text-center text-sm text-muted-foreground">
            Carregando Mandala...
          </div>
        ) : error ? (
          <p role="alert">
            Não foi possível carregar seu acompanhamento.{' '}
            <Button variant="outline" onClick={() => setRevision((value) => value + 1)}>
              Tentar novamente
            </Button>
          </p>
        ) : !enrollment ? (
          <EmptyState
            variant="mandala"
            title="Sua Mandala em formação"
            description="Sua Mandala ganha forma à medida que o cuidado acontece."
            actionLabel="Voltar ao Início"
            onAction={() => navigate('/')}
          />
        ) : (
          <CycleMandala key={enrollment.id} enrollmentId={enrollment.id} />
        )}
      </div>
    </div>
  )
}
export default MandalaPage
