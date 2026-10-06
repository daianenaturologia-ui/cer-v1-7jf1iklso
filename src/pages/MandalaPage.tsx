import { CerIntro } from '@/components/CerArtwork'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { JourneyNavigation } from '@/components/JourneyNavigation'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { MandalaStructuredView } from '@/components/MandalaStructuredView'
import { DevelopmentLearningView } from '@/components/DevelopmentLearningView'
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
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoading(true)
      setEnrollment(null)
      setError(false)
      try {
        const active = await enrollmentService.getActiveForUser(user.id)
        setEnrollment(active)
      } catch (err) {
        setError(true)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id, revision])

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </Button>
          <JourneyNavigation />
        </div>

        <CerIntro title="Minha Mandala" variant="waves">
          <p>
            Um olhar para <strong>como você viveu</strong>, com espaço para perceber e aprender.
          </p>
        </CerIntro>
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Carregando Mandala...</div>
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
          <Tabs defaultValue="mandala">
            <TabsList aria-label="Visões da Mandala">
              <TabsTrigger value="mandala">Minha Mandala</TabsTrigger>
              <TabsTrigger value="aprendizados">Aprendizados</TabsTrigger>
            </TabsList>
            <TabsContent value="mandala">
              <MandalaStructuredView enrollmentId={enrollment.id} />
            </TabsContent>
            <TabsContent value="aprendizados">
              <DevelopmentLearningView key={enrollment.id} enrollmentId={enrollment.id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
export default MandalaPage
