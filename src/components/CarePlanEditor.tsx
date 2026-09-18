import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FileText,
  Plus,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  History,
  ShieldAlert,
  ArrowRight,
  Target,
  Clock,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react'
import {
  cerCarePlanService,
  CreateCarePlanInput,
  CreatePriorityInput,
  CreatePlanPresentationInput,
} from '@/services/cerCarePlanService'
import pb from '@/lib/pocketbase/client'
import type {
  CerCarePlanRecord,
  CerCarePlanPriorityRecord,
  CerCarePlanPresentationRecord,
  CerOperationalAcceptanceRecord,
  CerAiProposalRecord,
} from '@/types/cer'

interface CarePlanEditorProps {
  enrollmentId: string
  participantName: string
  onPlanUpdated?: () => void
  className?: string
}

export const CarePlanEditor: React.FC<CarePlanEditorProps> = ({
  enrollmentId,
  participantName,
  onPlanUpdated,
  className = '',
}) => {
  const [plans, setPlans] = useState<CerCarePlanRecord[]>([])
  const [selectedPlan, setSelectedPlan] = useState<CerCarePlanRecord | null>(null)
  const [priorities, setPriorities] = useState<CerCarePlanPriorityRecord[]>([])
  const [presentations, setPresentations] = useState<CerCarePlanPresentationRecord[]>([])
  const [acceptances, setAcceptances] = useState<CerOperationalAcceptanceRecord[]>([])
  const [aiProposals, setAiProposals] = useState<CerAiProposalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modais
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false)
  const [createPriorityDialogOpen, setCreatePriorityDialogOpen] = useState(false)
  const [presentationPreviewDialogOpen, setPresentationPreviewDialogOpen] = useState(false)
  const [previewPerspective, setPreviewPerspective] = useState<'PROFESSIONAL' | 'PARTICIPANT'>(
    'PARTICIPANT',
  )

  // Formulário de novo plano
  const [newPlanDirection, setNewPlanDirection] = useState('')
  const [newPlanIntent, setNewPlanIntent] = useState('')
  const [newPlanRationale, setNewPlanRationale] = useState('')

  // Formulário de nova prioridade
  const [prioTitle, setPrioTitle] = useState('')
  const [prioDescription, setPrioDescription] = useState('')
  const [prioTherapeutic, setPrioTherapeutic] = useState(true) // IMPORTANTE
  const [prioPossibleNow, setPrioPossibleNow] = useState(true) // AGORA
  const [prioCapacityEstimate, setPrioCapacityEstimate] = useState<'baixa' | 'moderada' | 'alta'>(
    'moderada',
  )
  const [prioProfessionalRationale, setPrioProfessionalRationale] = useState('')

  // Formulário de Apresentação
  const [presentationSummary, setPresentationSummary] = useState('')
  const [presentationChannel, setPresentationChannel] = useState<'app' | 'session'>('session')

  const loadPlanData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const planRecords = await pb.collection('cer_care_plans').getFullList<CerCarePlanRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
        sort: '-revision_number',
      })
      setPlans(planRecords)

      // Seleciona o plano ativo ou o último draft
      const active = planRecords.find((p) => p.status === 'active') || planRecords[0] || null
      setSelectedPlan(active)

      if (active) {
        await loadPlanDetails(active.id)
      } else {
        setPriorities([])
        setPresentations([])
        setAcceptances([])
      }

      // Buscar sugestões de IA para prioridades (priority_suggestion)
      try {
        const proposals = await pb.collection('cer_ai_proposals').getFullList<CerAiProposalRecord>({
          filter: `enrollment_id = "${enrollmentId}" && proposal_type = "priority_suggestion" && status = "pending"`,
          sort: '-created',
        })
        setAiProposals(proposals)
      } catch {
        setAiProposals([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar planos de cuidado:', err)
      setErrorMsg('Não foi possível carregar o plano de cuidado da participante.')
    } finally {
      setLoading(false)
    }
  }

  const loadPlanDetails = async (planId: string) => {
    try {
      const [prios, presList, accList] = await Promise.all([
        cerCarePlanService.listPriorities(planId),
        pb.collection('cer_care_plan_presentations').getFullList<CerCarePlanPresentationRecord>({
          filter: `plan_id = "${planId}"`,
          sort: '-created',
        }),
        pb.collection('cer_operational_acceptances').getFullList<CerOperationalAcceptanceRecord>({
          filter: `enrollment_id = "${enrollmentId}"`,
          sort: '-created',
        }),
      ])
      setPriorities(prios)
      setPresentations(presList)
      setAcceptances(accList)
    } catch (err) {
      console.error('Erro ao carregar detalhes do plano:', err)
    }
  }

  useEffect(() => {
    loadPlanData()
  }, [enrollmentId])

  // Contagem de prioridades "AGORA"
  const possibleNowCount = priorities.filter((p) => p.is_possible_now).length

  // Criar Novo Rascunho de Plano
  const handleCreatePlan = async () => {
    if (!newPlanDirection.trim()) {
      setErrorMsg('Informe a direção de cuidado.')
      return
    }
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const authUser = pb.authStore.record
      const newPlan = await cerCarePlanService.createDraftPlan({
        enrollment_id: enrollmentId,
        created_by_user_id: authUser?.id || '',
        direction_mode: 'reused',
        direction_statement: newPlanDirection.trim(),
        professional_context: newPlanIntent.trim() || undefined,
        professional_rationale: newPlanRationale.trim() || undefined,
      })
      setSuccessMsg('Rascunho de Plano de Cuidado criado com sucesso.')
      setCreatePlanDialogOpen(false)
      setNewPlanDirection('')
      setNewPlanIntent('')
      setNewPlanRationale('')
      await loadPlanData()
      setSelectedPlan(newPlan)
      onPlanUpdated?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar plano.')
    } finally {
      setActionLoading(false)
    }
  }

  // Ativar Plano
  const handleActivatePlan = async (planId: string) => {
    setActionLoading(true)
    setErrorMsg(null)
    try {
      await cerCarePlanService.activatePlan(planId)
      setSuccessMsg('Plano de Cuidado ativado com sucesso.')
      await loadPlanData()
      onPlanUpdated?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao ativar plano.')
    } finally {
      setActionLoading(false)
    }
  }

  // Criar Prioridade
  const handleCreatePriority = async () => {
    if (!selectedPlan || !prioTitle.trim()) {
      setErrorMsg('Título da prioridade é obrigatório.')
      return
    }
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const authUser = pb.authStore.record
      await cerCarePlanService.addPriority({
        plan_id: selectedPlan.id,
        created_by_user_id: authUser?.id || '',
        title: prioTitle.trim(),
        description: prioDescription.trim() || undefined,
        is_therapeutic_priority: prioTherapeutic,
        is_possible_now: prioPossibleNow,
        professional_rationale: prioProfessionalRationale.trim() || undefined,
      })
      setSuccessMsg('Prioridade adicionada ao plano.')
      setCreatePriorityDialogOpen(false)
      setPrioTitle('')
      setPrioDescription('')
      setPrioProfessionalRationale('')
      await loadPlanDetails(selectedPlan.id)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar prioridade.')
    } finally {
      setActionLoading(false)
    }
  }

  // Aceitar / Rejeitar sugestão de IA
  const handleAcceptAiSuggestion = (proposal: CerAiProposalRecord) => {
    let parsedTitle = 'Prioridade sugerida'
    let parsedDescription = proposal.edited_text || proposal.proposal_text || ''

    try {
      if (proposal.proposal_text && proposal.proposal_text.trim().startsWith('{')) {
        const json = JSON.parse(proposal.proposal_text)
        if (json.title) parsedTitle = json.title
        if (json.description) parsedDescription = json.description
      }
    } catch {
      // Se não for JSON, o texto da proposta é a descrição
    }

    setPrioTitle(parsedTitle)
    setPrioDescription(parsedDescription)
    setPrioTherapeutic(true)
    setPrioPossibleNow(true)
    setPrioProfessionalRationale('Origem da sugestão: Proposta de IA revisada clinicamente.')
    setCreatePriorityDialogOpen(true)
  }

  const handleDismissAiSuggestion = async (proposalId: string) => {
    try {
      await pb.collection('cer_ai_proposals').update(proposalId, {
        status: 'dismissed',
        decided_at: new Date().toISOString(),
      })
      setAiProposals((prev) => prev.filter((p) => p.id !== proposalId))
    } catch (err) {
      console.error('Erro ao dispensar sugestão:', err)
    }
  }

  // Abrir Modal de Apresentação com Preview Obrigatório
  const handleOpenPresentation = () => {
    if (!selectedPlan) return
    const activePrios = priorities.filter((p) => p.is_possible_now)
    const prioSummary = activePrios.map((p) => `• ${p.title}`).join('\n')
    setPresentationSummary(
      `Direção de Cuidado: ${selectedPlan.direction_statement || ''}\n\nFocos combinados para este momento:\n${prioSummary}`,
    )
    setPreviewPerspective('PARTICIPANT')
    setPresentationPreviewDialogOpen(true)
  }

  // Apresentar Plano para Participante
  const handleExecutePresentation = async () => {
    if (!selectedPlan || !presentationSummary.trim()) return
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const activePrios = priorities.filter((p) => p.is_possible_now)
      const pres = await cerCarePlanService.createPresentation({
        plan_id: selectedPlan.id,
        priority_id: activePrios[0]?.id || undefined,
        participant_title: 'Plano de Cuidado Compartilhado',
        participant_summary: presentationSummary.trim(),
        channel: presentationChannel,
      })
      await cerCarePlanService.presentPresentation(pres.id)
      setSuccessMsg('Plano de Cuidado apresentado para a participante com sucesso.')
      setPresentationPreviewDialogOpen(false)
      await loadPlanDetails(selectedPlan.id)
      onPlanUpdated?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao apresentar plano.')
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
              <Target className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Plano de Cuidado e Prioridades: {participantName}
              </CardTitle>
              {selectedPlan && (
                <Badge
                  variant={selectedPlan.status === 'active' ? 'default' : 'secondary'}
                  className="text-[10px] font-mono"
                >
                  {selectedPlan.status === 'active' ? 'Plano Ativo' : 'Rascunho'} (v
                  {selectedPlan.revision_number})
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Direção terapêutica pactuada, priorização realista de capacidade e preview obrigatório
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreatePlanDialogOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Plano</span>
            </Button>

            {selectedPlan && selectedPlan.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleActivatePlan(selectedPlan.id)}
                disabled={actionLoading}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ativar Plano</span>
              </Button>
            )}

            {selectedPlan && (
              <Button
                size="sm"
                onClick={handleOpenPresentation}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compartilhar plano com {participantName}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Feedback visual */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-red-500/10 border border-red-300 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="underline">
              fechar
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="underline">
              fechar
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Carregando Plano de Cuidado...
          </p>
        ) : !selectedPlan ? (
          <div className="text-center py-8 space-y-2 border border-dashed rounded-lg p-6">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Nenhum Plano de Cuidado formulado ainda.
            </p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Após a conclusão da Consciência e do Mapa, formule o primeiro rascunho com a direção
              clínica integrada.
            </p>
            <Button
              size="sm"
              onClick={() => setCreatePlanDialogOpen(true)}
              className="text-xs h-8 mt-2"
            >
              Criar Primeiro Plano de Cuidado
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bloco de Direção Clínica */}
            <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                  Direção Clínica do Plano
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Criado em {new Date(selectedPlan.created).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {selectedPlan.direction_statement || 'Direção em formulação'}
              </p>
              {selectedPlan.professional_context && (
                <p className="text-xs text-muted-foreground italic">
                  Contexto clínico: {selectedPlan.professional_context}
                </p>
              )}
            </div>

            {/* Warning Qualitativo de Capacidade (> 2 prioridades "AGORA") */}
            {possibleNowCount > 2 && (
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Atenção à capacidade da participante</span>
                  <p className="text-xs leading-relaxed">
                    Você selecionou {possibleNowCount} prioridades marcadas como &quot;AGORA&quot;.
                    Recomendamos focar em no máximo 1 ou 2 focos ativos simultâneos para preservar a
                    sustentabilidade e evitar sobrecarga cognitiva ou emocional.
                  </p>
                </div>
              </div>
            )}

            {/* Sugestões de IA para Revisar (Priority Proposals) */}
            {aiProposals.length > 0 && (
              <div className="p-3.5 rounded-lg border border-purple-200 bg-purple-500/5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                    Sugestões de IA para Revisar ({aiProposals.length})
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Propostas geradas a partir da síntese epistemológica. Decisão clínica
                  exclusivamente humana: a IA nunca ativa prioridades autonomamente.
                </p>
                <div className="space-y-2">
                  {aiProposals.map((prop) => {
                    let propTitle = 'Sugestão de Prioridade'
                    let propDescription =
                      prop.edited_text || prop.proposal_text || prop.proposal_type

                    try {
                      if (prop.proposal_text && prop.proposal_text.trim().startsWith('{')) {
                        const json = JSON.parse(prop.proposal_text)
                        if (json.title) propTitle = json.title
                        if (json.description) propDescription = json.description
                      }
                    } catch {
                      // Usar fallback de texto
                    }

                    return (
                      <div
                        key={prop.id}
                        className="p-2.5 rounded border border-purple-200/80 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground">{propTitle}</span>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {propDescription}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptAiSuggestion(prop)}
                            className="h-7 text-xs border-purple-300 hover:bg-purple-50 text-purple-700"
                          >
                            Aceitar / Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissAiSuggestion(prop.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Dispensar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Lista de Prioridades */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prioridades Formuladas ({priorities.length})
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {possibleNowCount} ativa(s) para agora
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreatePriorityDialogOpen(true)}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Prioridade</span>
                </Button>
              </div>

              {priorities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg">
                  Nenhuma prioridade formulada ainda neste plano.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {priorities.map((prio) => {
                    // Verificar se há aceites operacionais associados
                    const prioAccs = acceptances.filter((a) => a.priority_id === prio.id)

                    return (
                      <div
                        key={prio.id}
                        className="p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/15 transition-colors space-y-2 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">
                                {prio.title}
                              </span>

                              {/* Distinção visual clara: IMPORTANTE vs AGORA */}
                              <Badge
                                variant={prio.is_therapeutic_priority ? 'default' : 'outline'}
                                className="text-[10px]"
                              >
                                {prio.is_therapeutic_priority
                                  ? '★ IMPORTANTE (Terapêutico)'
                                  : 'Complementar'}
                              </Badge>

                              <Badge
                                variant={prio.is_possible_now ? 'secondary' : 'outline'}
                                className={`text-[10px] ${
                                  prio.is_possible_now
                                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-semibold'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {prio.is_possible_now
                                  ? '● AGORA (No ciclo)'
                                  : '○ Depois (Diferido)'}
                              </Badge>
                            </div>

                            {prio.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                                {prio.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rationale Clínico Privado do Profissional (Seguro) */}
                        {prio.professional_rationale && (
                          <div className="p-2 rounded bg-muted/30 border border-border/40 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Olhar Clínico Privado:{' '}
                            </span>
                            <span>{prio.professional_rationale}</span>
                          </div>
                        )}

                        {/* Devolutivas Operacionais da Participante (7 estados reais, sem private notes) */}
                        {prioAccs.length > 0 && (
                          <div className="pt-2 border-t border-border/40 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-primary block">
                              Devolutiva da Participante:
                            </span>
                            {prioAccs.map((acc) => (
                              <div
                                key={acc.id}
                                className="p-2 rounded bg-primary/5 border border-primary/20 text-[11px] space-y-0.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {acc.response_type}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    Registrado em{' '}
                                    {new Date(acc.created).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                {acc.shared_comment && (
                                  <p className="text-foreground italic font-sans">
                                    &ldquo;{acc.shared_comment}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Histórico de Apresentações do Plano */}
            {presentations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Apresentações Feitas à Participante ({presentations.length})
                </h4>
                <div className="space-y-2">
                  {presentations.map((pres) => (
                    <div
                      key={pres.id}
                      className="p-2.5 rounded border border-border/60 bg-muted/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground">
                          Canal: {pres.channel === 'session' ? 'Em Sessão' : 'Pelo Aplicativo'}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(pres.presented_at || pres.created).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-muted-foreground italic font-serif">
                        &ldquo;{pres.participant_summary}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* MODAL 1: Criar Novo Plano */}
      <Dialog open={createPlanDialogOpen} onOpenChange={setCreatePlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Formular Novo Plano de Cuidado
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina a direção terapêutica unificada a partir da síntese da Consciência e do Mapa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Direção Clínica Principal *
              </label>
              <Input
                placeholder="Ex: Fortalecimento de auto-regulação e limites relacionais"
                value={newPlanDirection}
                onChange={(e) => setNewPlanDirection(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Intenção Terapêutica (Opcional)
              </label>
              <Input
                placeholder="Ex: Proporcionar estabilidade somática antes de aprofundamentos"
                value={newPlanIntent}
                onChange={(e) => setNewPlanIntent(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Rationale Profissional Privado
              </label>
              <Textarea
                placeholder="Notas clínicas de fundamentação (visíveis apenas para profissionais autorizados)"
                value={newPlanRationale}
                onChange={(e) => setNewPlanRationale(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatePlanDialogOpen(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePlan}
              disabled={actionLoading || !newPlanDirection.trim()}
              className="text-xs h-8"
            >
              Salvar Rascunho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Adicionar Prioridade com interruptores IMPORTANTE vs AGORA */}
      <Dialog open={createPriorityDialogOpen} onOpenChange={setCreatePriorityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Adicionar Prioridade ao Plano
            </DialogTitle>
            <DialogDescription className="text-xs">
              Distinga claramente entre o que é terapeuticamente importante e o que é viável para
              agora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Título do Foco / Prioridade *
              </label>
              <Input
                placeholder="Ex: Práticas de regulação do ritmo respiratório"
                value={prioTitle}
                onChange={(e) => setPrioTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Descrição para o Plano
              </label>
              <Textarea
                placeholder="Detalhes ou contextualização do foco"
                value={prioDescription}
                onChange={(e) => setPrioDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Os dois interruptores visuais: IMPORTANTE vs AGORA */}
            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    1. Relevância Terapêutica
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Fundamental para a direção clínica geral
                  </span>
                </div>
                <Button
                  size="sm"
                  type="button"
                  variant={prioTherapeutic ? 'default' : 'outline'}
                  onClick={() => setPrioTherapeutic(!prioTherapeutic)}
                  className="h-7 text-xs px-3"
                >
                  {prioTherapeutic ? 'IMPORTANTE' : 'Opcional'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    2. Viabilidade Temporal
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    A participante tem capacidade de focar nisto neste ciclo
                  </span>
                </div>
                <Button
                  size="sm"
                  type="button"
                  variant={prioPossibleNow ? 'default' : 'outline'}
                  onClick={() => setPrioPossibleNow(!prioPossibleNow)}
                  className={`h-7 text-xs px-3 ${
                    prioPossibleNow ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  {prioPossibleNow ? 'AGORA (Ativo)' : 'DEPOIS (Diferido)'}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Estimativa de Demanda de Capacidade
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['baixa', 'moderada', 'alta'] as const).map((cap) => (
                  <Button
                    key={cap}
                    size="sm"
                    type="button"
                    variant={prioCapacityEstimate === cap ? 'default' : 'outline'}
                    onClick={() => setPrioCapacityEstimate(cap)}
                    className="h-7 text-xs capitalize"
                  >
                    {cap}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Fundamentação Clínica Privada
              </label>
              <Textarea
                placeholder="Rationale confidencial da profissional"
                value={prioProfessionalRationale}
                onChange={(e) => setPrioProfessionalRationale(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatePriorityDialogOpen(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePriority}
              disabled={actionLoading || !prioTitle.trim()}
              className="text-xs h-8"
            >
              Adicionar Prioridade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CarePlanPresentationPreview (Preview Obrigatório e Dupla Perspectiva) */}
      <Dialog open={presentationPreviewDialogOpen} onOpenChange={setPresentationPreviewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Preview Obrigatório de Apresentação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Verifique exatamente o que será comunicado à participante antes do envio deliberado.
            </DialogDescription>
          </DialogHeader>

          {/* Seletor de Perspectiva (Interno vs Participante) */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
            <Button
              size="sm"
              variant={previewPerspective === 'PARTICIPANT' ? 'default' : 'outline'}
              onClick={() => setPreviewPerspective('PARTICIPANT')}
              className="h-7 text-xs px-3"
            >
              O Que a Participante Verá
            </Button>
            <Button
              size="sm"
              variant={previewPerspective === 'PROFESSIONAL' ? 'secondary' : 'outline'}
              onClick={() => setPreviewPerspective('PROFESSIONAL')}
              className="h-7 text-xs px-3"
            >
              Visão Interna Profissional
            </Button>
          </div>

          <div className="py-2 space-y-3 text-xs max-h-[60vh] overflow-y-auto">
            {previewPerspective === 'PARTICIPANT' ? (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Perspectiva da Participante
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Texto de Apresentação Editável:
                  </label>
                  <Textarea
                    value={presentationSummary}
                    onChange={(e) => setPresentationSummary(e.target.value)}
                    rows={5}
                    className="text-xs bg-background leading-relaxed font-sans"
                  />
                </div>

                <div className="p-3 rounded-lg bg-background border border-border/60 space-y-2">
                  <span className="text-[11px] font-semibold text-foreground block">
                    Focos selecionados para este ciclo:
                  </span>
                  <div className="space-y-1.5">
                    {priorities
                      .filter((p) => p.is_possible_now)
                      .map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-foreground">{p.title}</span>
                          {p.description && (
                            <span className="text-muted-foreground">— {p.description}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  Garantia Anti-Laundering: Nenhum rationale privado ou nota confidencial é exibido
                  para a participante.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-foreground">
                  Visão Interna da Profissional (Fundamentação & Proveniência)
                </span>

                <div className="p-2.5 rounded bg-background border border-border/60 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Rationale do Plano:
                  </span>
                  <p className="text-xs text-foreground">
                    {selectedPlan?.professional_rationale || 'Nenhum rationale registrado.'}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-background border border-border/60 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Prioridades com Rationale Clínico:
                  </span>
                  <div className="space-y-1.5 pt-1">
                    {priorities.map((p) => (
                      <div key={p.id} className="text-xs space-y-0.5">
                        <span className="font-semibold text-foreground">• {p.title}</span>
                        {p.professional_rationale && (
                          <p className="text-[11px] text-muted-foreground italic pl-3">
                            Rationale: {p.professional_rationale}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-300 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                  <span className="font-semibold block">
                    Regra Estrita de Privacidade (Anti-Laundering):
                  </span>
                  <p>
                    A visão interna permite visualizar rationales clínicos autorizados. Porém, notas
                    privadas de consentimento, anotações estritamente privadas da participante e
                    paráfrases derivadas de conteúdo confidencial permanecem RIGOROSAMENTE
                    INACESSÍVEIS.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-medium text-foreground">
                Canal de Compartilhamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant={presentationChannel === 'session' ? 'default' : 'outline'}
                  onClick={() => setPresentationChannel('session')}
                  className="h-7 text-xs"
                >
                  Em Sessão (Diálogo Presencial/Online)
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={presentationChannel === 'app' ? 'default' : 'outline'}
                  onClick={() => setPresentationChannel('app')}
                  className="h-7 text-xs"
                >
                  Pelo Aplicativo (Disponibilizar no App)
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresentationPreviewDialogOpen(false)}
              className="text-xs h-8"
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleExecutePresentation}
              disabled={actionLoading || !presentationSummary.trim()}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compartilhar plano com {participantName}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
