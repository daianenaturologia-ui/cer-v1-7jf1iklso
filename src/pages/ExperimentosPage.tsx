import { CerIntro } from '@/components/CerArtwork'
import { JourneyNavigation } from '@/components/JourneyNavigation'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { cerPracticeAssignmentService } from '@/services/cerPracticeAssignmentService'
import { ExperimentCard } from '@/components/ExperimentCard'
import type {
  EnrollmentRecord,
  CerPracticeAssignmentRecord,
  CapacityResponseValue,
} from '@/types/cer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/EmptyState'

export const ExperimentosPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [assignments, setAssignments] = useState<CerPracticeAssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    setEnrollment(null)
    setAssignments([])
    setError(false)
    try {
      const activeEnrollment = await enrollmentService.getActiveForUser(user.id)
      setEnrollment(activeEnrollment)
      if (activeEnrollment) {
        const asgns = await cerPracticeAssignmentService.listByEnrollment(activeEnrollment.id)
        setAssignments(asgns)
      }
    } catch (err) {
      setError(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handleConfirmExperiment = async (assignmentId: string, capacity: CapacityResponseValue) => {
    try {
      await cerPracticeAssignmentService.recordConfirmation(assignmentId, {
        participant_response_type: 'confirmed',
        capacity_response: capacity,
      })
      toast({
        title: 'Resposta registrada com carinho',
        description: 'Sua percepção sobre o experimento orienta os próximos passos.',
      })
      await loadData()
    } catch {
      toast({
        title: 'Erro ao confirmar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs h-8 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </Button>
            <div>
              <JourneyNavigation />
              <h1 className="text-xl font-serif font-bold text-foreground mt-0.5 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Experimentos de Cuidado</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/planner')}
              className="text-xs h-8"
            >
              Planner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/mandala')}
              className="text-xs h-8"
            >
              Mandala
            </Button>
          </div>
        </div>

        <CerIntro title="Quero experimentar por conta própria" variant="seed">
          <p>
            Escolha recursos educativos, planeje uma tentativa e revise{' '}
            <strong>o que aprendeu</strong>, sem esperar uma liberação.
          </p>
          <Link className="inline-block text-sm underline mt-2" to="/?etapa=evolucao">
            Abrir meu desenvolvimento na Evolução
          </Link>
        </CerIntro>
        <h2 className="font-serif text-lg">Práticas do acompanhamento individual</h2>
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-12">
            Carregando experimentos...
          </p>
        ) : error ? (
          <p role="alert">
            Não foi possível carregar seus experimentos.{' '}
            <Button variant="outline" onClick={loadData}>
              Tentar novamente
            </Button>
          </p>
        ) : assignments.length === 0 ? (
          <EmptyState
            variant="experiments"
            title="Experimentos combinados"
            description="As práticas individuais aparecem quando forem combinadas no acompanhamento. Você pode seguir com os recursos educativos na Evolução."
            actionLabel="Voltar para a página inicial"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asgn) => (
              <ExperimentCard
                key={asgn.id}
                assignment={asgn}
                onConfirm={handleConfirmExperiment}
                onResponseRecorded={loadData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export default ExperimentosPage
