import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { CycleReviewView } from '@/components/CycleReviewView'
import type { EnrollmentRecord } from '@/types/cer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const CycleReviewPage: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>()
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

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando...</div>
  }

  if (!cycleId || !enrollment) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
        <p>Ciclo ou matrícula não identificados.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="text-xs">
          Voltar ao início
        </Button>
      </div>
    )
  }

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

        <CycleReviewView
          cycleId={cycleId}
          enrollmentId={enrollment.id}
          userId={user?.id || ''}
          isProfessional={false}
          onUpdated={() => {}}
        />
      </div>
    </div>
  )
}
export default CycleReviewPage
