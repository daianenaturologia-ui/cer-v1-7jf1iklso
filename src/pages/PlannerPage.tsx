import { cerCycleInvitationService } from '@/services/cerCycleInvitationService'
import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { cerPlannerService } from '@/services/cerPlannerService'
import { demoAdapter } from '@/services/demoAdapter'
import type { EnrollmentRecord, CerPlannerItemRecord } from '@/types/cer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/EmptyState'

export const PlannerPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [changingItem, setChangingItem] = useState<string | null>(null)
  const [scheduledDates, setScheduledDates] = useState<Record<string, string>>({})
  const [busyItem, setBusyItem] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [plannerItems, setPlannerItems] = useState<CerPlannerItemRecord[]>([])
  const [activeReviewInvite, setActiveReviewInvite] = useState<{ cycleId: string } | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!user?.id) return
    setPlannerItems([])
    setActiveReviewInvite(null)
    setError(false)
    setLoading(true)
    try {
      const activeEnrollment = await enrollmentService.getActiveForUser(user.id)
      setEnrollment(activeEnrollment)
      if (activeEnrollment) {
        const items = await cerPlannerService.listForParticipant(activeEnrollment.id, user.id)
        setPlannerItems(items)

        // CTA de Cycle Review quando participant_review_invited_at ativo
        try {
          const invitations = await cerCycleInvitationService.list(activeEnrollment.id)
          const invitation = invitations.find((i) => !i.completed_at)
          setActiveReviewInvite(invitation ? { cycleId: invitation.care_cycle_id } : null)
        } catch {
          setActiveReviewInvite(null)
        }
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

  const handleCompletePlannerItem = async (itemId: string) => {
    if (busyItem) return
    setBusyItem(itemId)
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
    } finally {
      setBusyItem(null)
    }
  }

  const reschedule = async (itemId: string) => {
    if (busyItem) return
    setBusyItem(itemId)
    try {
      const value = scheduledDates[itemId]
      if (!value || !Number.isFinite(Date.parse(value)))
        throw new Error('Escolha uma data e um horário.')
      await cerPlannerService.rescheduleItem(itemId, {
        scheduled_at: new Date(value).toISOString(),
      })
      setChangingItem(null)
      await loadData()
      toast({ title: 'Momento reagendado', description: 'Seu ritmo foi atualizado no Planner.' })
    } catch (e) {
      toast({
        title: 'Não foi possível reagendar',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setBusyItem(null)
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
        ) : error ? (
          <p role="alert">
            Não foi possível carregar o planner.{' '}
            <Button variant="outline" onClick={loadData}>
              Tentar novamente
            </Button>
          </p>
        ) : plannerItems.filter((p) => p.status !== 'cancelled' && p.status !== 'superseded')
            .length === 0 ? (
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
              .filter((p) => p.status !== 'cancelled' && p.status !== 'superseded')
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
                            {isContextual
                              ? 'Recurso disponível'
                              : {
                                  morning: 'Manhã',
                                  afternoon: 'Tarde',
                                  evening: 'Noite',
                                  any: 'Sem turno fixo',
                                }[item.daypart || 'any']}
                          </Badge>
                        </div>
                        {item.scheduled_at && (
                          <p className="text-xs text-muted-foreground">
                            Momento planejado: {new Date(item.scheduled_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {demoAdapter.isEnabled() &&
                          !isContextual &&
                          ['planned', 'active'].includes(item.status) && (
                            <div className="space-y-2">
                              {changingItem === item.id ? (
                                <>
                                  <label
                                    htmlFor={`planner-date-${item.id}`}
                                    className="block text-xs"
                                  >
                                    Nova data e horário
                                  </label>
                                  <Input
                                    id={`planner-date-${item.id}`}
                                    type="datetime-local"
                                    value={scheduledDates[item.id] || ''}
                                    onChange={(e) =>
                                      setScheduledDates((v) => ({
                                        ...v,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    disabled={!!busyItem}
                                    onClick={() => reschedule(item.id)}
                                  >
                                    Salvar novo momento
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setChangingItem(null)}
                                  >
                                    Cancelar alteração
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!!busyItem}
                                  onClick={() => setChangingItem(item.id)}
                                >
                                  Ajustar momento
                                </Button>
                              )}
                            </div>
                          )}
                        {item.safe_summary && (
                          <p className="text-xs text-muted-foreground">{item.safe_summary}</p>
                        )}
                      </div>

                      {['planned', 'active'].includes(item.status) && !isContextual && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-xs shrink-0 text-primary hover:bg-primary/10"
                          disabled={!!busyItem}
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
