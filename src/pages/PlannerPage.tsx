import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { cerPlannerService } from '@/services/cerPlannerService'
import type { EnrollmentRecord, CerPlannerItemRecord } from '@/types/cer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/EmptyState'
import pb from '@/lib/pocketbase/client'

export const PlannerPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [plannerItems, setPlannerItems] = useState<CerPlannerItemRecord[]>([])
  const [activeReviewInvite, setActiveReviewInvite] = useState<{ cycleId: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const activeEnrollment = await enrollmentService.getActiveForUser(user.id)
      setEnrollment(activeEnrollment)
      if (activeEnrollment) {
        const items = await cerPlannerService.listByEnrollment(activeEnrollment.id)
        setPlannerItems(items)

        // CTA de Cycle Review quando participant_review_invited_at ativo
        try {
          const reviews = await pb.collection('cer_cycle_reviews').getFullList({
            filter: `enrollment_id = "${activeEnrollment.id}" && participant_review_invited_at != "" && participant_review_completed_at = ""`,
            sort: '-created',
          })
          if (reviews.length > 0 && reviews[0].care_cycle_id) {
            setActiveReviewInvite({ cycleId: reviews[0].care_cycle_id })
          } else {
            setActiveReviewInvite(null)
          }
        } catch {
          /* intentionally ignored */
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handleCompletePlannerItem = async (itemId: string) => {
    try {
      await cerPlannerService.completeItem(itemId)
      toast({
        title: 'Momento marcado como realizado',
        description: 'Seu cuidado diário com calma e presença.',
      })
      await loadData()
    } catch {
      toast({
        title: 'Erro ao marcar item',
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  Janela de Práticas
                </Badge>
              </div>
              <h1 className="text-xl font-serif font-bold text-foreground mt-0.5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Planner de Práticas e Recursos</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/experimentos')}
              className="text-xs h-8"
            >
              Experimentos
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

        {/* CTA de Cycle Review quando participant_review_invited_at ativo */}
        {activeReviewInvite && (
          <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-card to-card shadow-sm animate-in fade-in">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/20 text-primary uppercase"
                  >
                    Convite de Revisão
                  </Badge>
                  <span className="text-xs text-foreground font-semibold">
                    Revisão de Ciclo com sua Profissional
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sua profissional convidou você para compartilhar suas percepções sobre este ciclo
                  de cuidado.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/reviews/${activeReviewInvite.cycleId}`)}
                className="text-xs h-8 px-4 gap-1.5 shrink-0"
              >
                <span>Responder Revisão</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-12">
            Carregando itens do planner...
          </p>
        ) : plannerItems.filter((p) => p.status !== 'cancelled').length === 0 ? (
          <EmptyState
            variant="planner"
            title="Janela de práticas"
            description="Ainda não há nenhum experimento combinado para este momento."
            actionLabel="Voltar para a página inicial"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="space-y-2.5">
            {plannerItems
              .filter((p) => p.status !== 'cancelled')
              .map((item) => {
                const isContextual = item.item_type === 'contextual_resource'
                const isCompleted = item.status === 'completed'

                return (
                  <Card
                    key={item.id}
                    className={`border-border/60 transition-colors ${
                      isCompleted ? 'bg-muted/20 opacity-80' : ''
                    }`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {item.safe_title}
                          </span>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {isContextual ? 'Recurso Disponível' : item.daypart || 'Dia a dia'}
                          </Badge>
                        </div>
                        {item.safe_summary && (
                          <p className="text-xs text-muted-foreground">{item.safe_summary}</p>
                        )}
                      </div>

                      {!isCompleted && !isContextual && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs shrink-0 text-primary hover:bg-primary/10"
                          onClick={() => handleCompletePlannerItem(item.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1 text-primary" />
                          <span>aconteceu</span>
                        </Button>
                      )}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="text-[11px] text-primary border-primary/30"
                        >
                          aconteceu
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
export default PlannerPage
