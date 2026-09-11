import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  cerCycleReviewService,
  type DescriptiveCycleDigest,
} from '@/services/cerCycleReviewService'
import { cerPracticeResponseService } from '@/services/cerPracticeResponseService'
import type {
  CerCycleReviewRecord,
  CycleReviewDecision,
  CerPracticeResponseRecord,
} from '@/types/cer'
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react'

interface CycleReviewViewProps {
  cycleId: string
  enrollmentId: string
  userId: string
  isProfessional?: boolean
  onUpdated?: () => void
}

export const CycleReviewView: React.FC<CycleReviewViewProps> = ({
  cycleId,
  enrollmentId,
  userId,
  isProfessional = false,
  onUpdated,
}) => {
  const [review, setReview] = useState<CerCycleReviewRecord | null>(null)
  const [responses, setResponses] = useState<CerPracticeResponseRecord[]>([])
  const [digest, setDigest] = useState<DescriptiveCycleDigest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<CycleReviewDecision | ''>('')
  const [professionalSummary, setProfessionalSummary] = useState('')
  const [participantHighlights, setParticipantHighlights] = useState('')
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      const [existingReview, respList] = await Promise.all([
        cerCycleReviewService.getByCycleId(cycleId),
        cerPracticeResponseService.listByEnrollment(enrollmentId),
      ])

      const cycleResponses = respList.filter((r) => r.care_cycle_id === cycleId)
      setResponses(cycleResponses)
      setDigest(cerCycleReviewService.generateDescriptiveDigest(cycleResponses))

      if (existingReview) {
        setReview(existingReview)
        setSelectedDecision(existingReview.decision || '')
        setProfessionalSummary(existingReview.professional_summary || '')
        setParticipantHighlights(existingReview.participant_highlights || '')
      }
    } catch (err) {
      console.error('Erro ao carregar Cycle Review:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [cycleId])

  const handleSaveReview = async (completed: boolean = false) => {
    setSubmitting(true)
    try {
      if (!review) {
        // Criar novo review
        const created = await cerCycleReviewService.createReview({
          enrollment_id: enrollmentId,
          care_cycle_id: cycleId,
          created_by_user_id: userId,
          status: completed ? 'completed' : 'draft',
          decision: selectedDecision ? (selectedDecision as CycleReviewDecision) : undefined,
          professional_summary: professionalSummary.trim() || undefined,
          participant_highlights: participantHighlights.trim() || undefined,
        })
        setReview(created)
      } else {
        // Atualizar review existente
        const updated = await cerCycleReviewService.updateReview(review.id, {
          status: completed ? 'completed' : review.status,
          decision: selectedDecision ? (selectedDecision as CycleReviewDecision) : undefined,
          professional_summary: professionalSummary.trim() || undefined,
          participant_highlights: participantHighlights.trim() || undefined,
        })
        setReview(updated)
      }

      toast({
        title: completed ? 'Revisão de Ciclo Concluída' : 'Rascunho de Revisão Salvo',
        description: 'Decisão e síntese registradas com rastreabilidade clínica.',
      })

      if (onUpdated) onUpdated()
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Não foi possível salvar a revisão',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const decisionOptions: Array<{ id: CycleReviewDecision; title: string; desc: string }> = [
    {
      id: 'continue',
      title: 'Continuar no ritmo atual',
      desc: 'Manter os experimentos e prioridades em curso.',
    },
    {
      id: 'extend',
      title: 'Estender janela do ciclo',
      desc: 'Mais tempo para consolidar percepções antes de novas mudanças.',
    },
    {
      id: 'adapt',
      title: 'Adaptar práticas/experimentos',
      desc: 'Ajustar doses, variantes ou contexto sem romper o foco.',
    },
    {
      id: 'carry_forward',
      title: 'Transportar práticas (Carry-Forward)',
      desc: 'Levar experimentos bem-sucedidos para o próximo ciclo.',
    },
    {
      id: 'change_priority',
      title: 'Mudar prioridade de cuidado',
      desc: 'Realinhar com uma nova prioridade necessária do momento.',
    },
    {
      id: 'review_plan',
      title: 'Revisar plano de cuidado global',
      desc: 'Necessidade de nova revisão de intenção ou direção terapêutica.',
    },
    {
      id: 'close',
      title: 'Fechar ciclo com síntese',
      desc: 'Consolidar aprendizados e preparar transição.',
    },
  ]

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Carregando dados da Revisão de Ciclo...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase font-mono">
            Cycle Review (Build 08E)
          </Badge>
          {review?.status && (
            <Badge
              variant={review.status === 'completed' ? 'default' : 'secondary'}
              className="text-[10px] capitalize"
            >
              {review.status === 'completed' ? 'Revisão Concluída' : 'Rascunho de Revisão'}
            </Badge>
          )}
        </div>
        <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Revisão e Compreensão do Ciclo de Cuidado</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          O calendário não dirige a decisão clínica. Compreenda o ciclo antes de fechar ou alterar
          direções.
        </p>
      </div>

      {/* Cycle Digest Descritivo (Read-Model On-Demand, Zero Tabela, Zero Score) */}
      <Card className="border-border/70 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Síntese Descritiva dos Experimentos do Ciclo</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Agregação descritiva transparente baseada nas respostas operacionais registradas (sem
            scores de eficácia ou adesão).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
            <p className="font-medium text-foreground">{digest?.summary_text}</p>
            <p className="text-[11px] text-muted-foreground">
              Total de registros analisados:{' '}
              <span className="font-mono">{digest?.total_responses || 0}</span>
            </p>
          </div>

          {digest && digest.safety_flags_count.needs_review > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
              <span>Sinalizações de revisão (needs_review):</span>
              <Badge variant="outline" className="font-mono text-amber-700 dark:text-amber-300">
                {digest.safety_flags_count.needs_review} momento(s)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decisão Clínica Explícita (Humana) */}
      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Decisão Explícita sobre o Ciclo</span>
          </CardTitle>
          <CardDescription className="text-xs">
            A decisão humana orienta os próximos passos. A revisão não altera o ciclo
            automaticamente — o lifecycle é executado pela ação subsequente correspondente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {decisionOptions.map((opt) => {
              const isSelected = selectedDecision === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDecision(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs space-y-1 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                      : 'border-border/70 hover:border-border hover:bg-muted/20 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{opt.title}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                </button>
              )
            })}
          </div>

          {/* Destaques do Interagente */}
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <span className="text-xs font-medium text-foreground block">
              Destaques e Percepções Compartilhadas pelo Interagente:
            </span>
            <Textarea
              value={participantHighlights}
              onChange={(e) => setParticipantHighlights(e.target.value)}
              placeholder="O que o interagente compartilhou sobre facilidades, descobertas e limites..."
              rows={3}
              className="text-xs"
            />
          </div>

          {/* Síntese Profissional (Humana e Revisada) */}
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <span className="text-xs font-medium text-foreground block">
              Síntese Profissional do Ciclo (Persistida apenas quando validada por humano):
            </span>
            <Textarea
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              placeholder="Síntese clínica sobre evolução, recursos integrados e recomendações para o próximo ciclo..."
              rows={4}
              className="text-xs"
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => handleSaveReview(false)}
              className="text-xs h-8"
            >
              Salvar como Rascunho
            </Button>
            <Button
              size="sm"
              disabled={!selectedDecision || submitting}
              onClick={() => handleSaveReview(true)}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir Revisão de Ciclo</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
