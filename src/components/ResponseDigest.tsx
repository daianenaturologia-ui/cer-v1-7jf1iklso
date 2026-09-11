import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Activity,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  History,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { cerPracticeResponseService } from '@/services/cerPracticeResponseService'
import { cerCycleReviewService, DescriptiveCycleDigest } from '@/services/cerCycleReviewService'
import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeResponseRecord,
  CerPracticeAssignmentRecord,
  CerCareCycleRecord,
  CerCycleReviewRecord,
} from '@/types/cer'

interface ResponseDigestProps {
  enrollmentId: string
  participantName: string
  onOpenCycleReview?: (cycleId: string) => void
  className?: string
}

export const ResponseDigest: React.FC<ResponseDigestProps> = ({
  enrollmentId,
  participantName,
  onOpenCycleReview,
  className = '',
}) => {
  const [responses, setResponses] = useState<CerPracticeResponseRecord[]>([])
  const [digest, setDigest] = useState<DescriptiveCycleDigest | null>(null)
  const [activeCycle, setActiveCycle] = useState<CerCareCycleRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Decisão deliberada no Cycle Review
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [cycleDecision, setCycleDecision] = useState<
    'continue' | 'extend' | 'adapt' | 'close' | 'carry_forward' | 'change_priority' | 'review_plan'
  >('continue')
  const [reviewSummary, setReviewSummary] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const loadResponsesAndDigest = async () => {
    setLoading(true)
    try {
      // 1. Carregar respostas
      const resps = await pb
        .collection('cer_practice_responses')
        .getFullList<CerPracticeResponseRecord>({
          filter: `enrollment_id = "${enrollmentId}" && record_status = "current"`,
          sort: '-created',
          expand: 'assignment_id,practice_version_id',
        })
      setResponses(resps)

      // 2. Carregar ciclo ativo se houver
      const cycles = await pb.collection('cer_care_cycles').getFullList<CerCareCycleRecord>({
        filter: `enrollment_id = "${enrollmentId}" && status = "active"`,
        sort: '-cycle_number',
      })
      const cycle = cycles[0] || null
      setActiveCycle(cycle)

      // 3. Digest descritivo (sem percentuais artificiais de eficácia)
      if (cycle) {
        const descDigest = await cerCycleReviewService.computeDescriptiveDigest(
          cycle.id,
          enrollmentId,
        )
        setDigest(descDigest)
      } else {
        // Digest aproximado do histórico geral
        const helps = resps.filter((r) => r.response_type === 'helped').length
        const difficult = resps.filter(
          (r) => r.response_type === 'difficult' || r.response_type === 'was_too_much',
        ).length
        const neutral = resps.filter((r) => r.response_type === 'neutral').length

        setDigest({
          total_responses: resps.length,
          responses_by_type: { helped: helps, difficult, neutral },
          was_too_much_count: resps.filter((r) => r.response_type === 'was_too_much').length,
          needs_review_count: resps.filter((r) => r.safety_flag === 'needs_review').length,
          escalation_required_count: resps.filter((r) => r.safety_flag === 'escalation_required')
            .length,
          narrative_summary:
            resps.length > 0
              ? `Histórico recente: ${resps.length} registro(s) de prática; ${helps} relataram ajuda; ${difficult} relataram dificuldade/limite; ${neutral} foram neutros.`
              : 'Nenhum registro de prática no ciclo atual.',
        })
      }
    } catch (err) {
      console.error('Erro ao carregar digest de respostas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResponsesAndDigest()
  }, [enrollmentId])

  // Submeter Decisão Deliberada de Cycle Review
  const handleSaveCycleReviewDecision = async () => {
    if (!activeCycle) return
    setActionLoading(true)
    try {
      await cerCycleReviewService.createCycleReview({
        care_cycle_id: activeCycle.id,
        enrollment_id: enrollmentId,
        summary:
          reviewSummary.trim() ||
          `Revisão deliberada do Ciclo #${activeCycle.cycle_number} com decisão de ${cycleDecision}.`,
        next_cycle_decision: cycleDecision,
        assignments_digest: digest?.narrative_summary,
      })
      setFeedbackMsg('Decisão clínica do ciclo registrada com fidelidade.')
      setReviewModalOpen(false)
      setReviewSummary('')
      await loadResponsesAndDigest()
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Erro ao registrar decisão de ciclo.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card className={`border-border/70 ${className}`}>
      <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Digest Descritivo de Respostas & Revisão de Ciclo
              </CardTitle>
              {activeCycle && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Ciclo #{activeCycle.cycle_number}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Síntese qualitativa e descritiva: sem métricas artificiais de eficácia, sem notas
              privadas
            </CardDescription>
          </div>

          {activeCycle && (
            <Button
              size="sm"
              onClick={() => setReviewModalOpen(true)}
              className="h-8 text-xs gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Concluir Revisão de Ciclo</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {feedbackMsg && (
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="underline">
              fechar
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Compilando respostas descritivas...
          </p>
        ) : !digest || digest.total_responses === 0 ? (
          <div className="text-center py-6 space-y-1.5 border border-dashed rounded-lg p-4">
            <Activity className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Ainda não há registros de práticas neste ciclo.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Conforme a participante registrar suas percepções nos experimentos, o resumo
              descritivo será estruturado aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Resumo Descritivo Qualitativo */}
            <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                  Síntese Descritiva do Ciclo
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Total: {digest.total_responses} registro(s)
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {digest.narrative_summary}
              </p>

              {/* Contadores Textuais Qualitativos (NUNCA percentuais de eficácia) */}
              <div className="flex items-center gap-3 pt-2 text-xs flex-wrap border-t border-border/40">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {digest.responses_by_type?.helped || 0} relato(s) de ajuda
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {digest.was_too_much_count} sinalização(ões) de excesso (too much)
                </span>
                {digest.escalation_required_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-red-600 font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {digest.escalation_required_count} protocolo(s) de segurança
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Lista dos Últimos Registros (Apenas autorizados, ZERO private notes) */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Registros Recentes da Participante ({responses.length})
              </h4>
              <div className="space-y-2">
                {responses.slice(0, 5).map((resp) => {
                  const safeTitle =
                    (resp.expand as any)?.assignment_id?.participant_safe_title || 'Experimento'

                  return (
                    <div
                      key={resp.id}
                      className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/15 transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{safeTitle}</span>
                          <Badge
                            variant={
                              resp.response_type === 'helped'
                                ? 'default'
                                : resp.response_type === 'was_too_much'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="text-[10px] capitalize"
                          >
                            {resp.response_type.replace(/_/g, ' ')}
                          </Badge>
                          {resp.safety_flag === 'escalation_required' && (
                            <Badge variant="destructive" className="text-[10px]">
                              Segurança
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(resp.created).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {resp.shared_reflection && (
                        <p className="text-xs text-foreground italic bg-muted/30 p-2 rounded border border-border/40 font-sans">
                          &ldquo;{resp.shared_reflection}&rdquo;
                        </p>
                      )}

                      {/* Anti-Laundering Guarantee: resp.private_notes JAMAIS é renderizado */}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* MODAL: Decisão Deliberada de Cycle Review */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Revisão de Ciclo e Decisão Deliberada
            </DialogTitle>
            <DialogDescription className="text-xs">
              Avalie com a participante os aprendizados do ciclo e decida os próximos passos com
              clareza.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Decisão para o Próximo Ciclo *
              </label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={cycleDecision}
                onChange={(e) => setCycleDecision(e.target.value as any)}
              >
                <option value="continue">Continuar com as práticas atuais</option>
                <option value="extend">Estender o ciclo atual por mais tempo</option>
                <option value="adapt">Adaptar doses ou variantes dos experimentos</option>
                <option value="carry_forward">
                  Transitar para novo ciclo mantendo práticas estáveis (Carry-Forward)
                </option>
                <option value="change_priority">Revisar focos e prioridades terapêuticas</option>
                <option value="review_plan">Revisar integralmente o Plano de Cuidado</option>
                <option value="close">Encerrar este ciclo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Síntese / Devolutiva Compartilhada
              </label>
              <Textarea
                placeholder="Principais percepções dialogadas na sessão..."
                value={reviewSummary}
                onChange={(e) => setReviewSummary(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCycleReviewDecision}
              disabled={actionLoading}
              className="text-xs h-8 gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registrar Decisão</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
