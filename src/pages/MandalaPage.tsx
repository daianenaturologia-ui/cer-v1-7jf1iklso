import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { MandalaStructuredView } from '@/components/MandalaStructuredView'
import type { EnrollmentRecord } from '@/types/cer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'

export const MandalaPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const active = await enrollmentService.getActiveForUser(user.id)
        setEnrollment(active)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Carregando Mandala...</div>
        ) : !enrollment ? (
          <EmptyState
            variant="mandala"
            title="Sua Mandala em formação"
            description="Sua Mandala ganha forma à medida que o cuidado acontece."
            actionLabel="Voltar ao Início"
            onAction={() => navigate('/')}
          />
        ) : (
          <MandalaStructuredView enrollmentId={enrollment.id} />
        )}
      </div>
    </div>
  )
}
export default MandalaPage
