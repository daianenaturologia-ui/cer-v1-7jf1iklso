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
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { cerPracticeAssignmentService } from '@/services/cerPracticeAssignmentService'
import { cerPracticeService } from '@/services/cerPracticeService'
import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeAssignmentRecord,
  CerPracticeRecord,
  CerPracticeVersionRecord,
  CerPracticeVariantRecord,
  CerPracticeSafetyCheckRecord,
  CerPracticeConsentRecord,
  CerCarePlanPriorityRecord,
} from '@/types/cer'

interface AssignmentEditorProps {
  enrollmentId: string
  participantName: string
  selectedPractice?: CerPracticeRecord | null
  selectedVersion?: CerPracticeVersionRecord | null
  onAssignmentCreated?: () => void
  className?: string
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({
  enrollmentId,
  participantName,
  selectedPractice: initialPractice,
  selectedVersion: initialVersion,
  onAssignmentCreated,
  className = '',
}) => {
  const [assignments, setAssignments] = useState<CerPracticeAssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Prioridades ativas para vinculação
  const [priorities, setPriorities] = useState<CerCarePlanPriorityRecord[]>([])
  const [selectedPriorityId, setSelectedPriorityId] = useState<string>('')

  // Estado de montagem de nova Assignment
  const [practice, setPractice] = useState<CerPracticeRecord | null>(initialPractice || null)
  const [version, setVersion] = useState<CerPracticeVersionRecord | null>(initialVersion || null)
  const [variants, setVariants] = useState<CerPracticeVariantRecord[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')

  // Safety Check do fluxo de Assignment
  const [safetyCheck, setSafetyCheck] = useState<CerPracticeSafetyCheckRecord | null>(null)
  const [safetyChecking, setSafetyChecking] = useState(false)
  const [missingDataAnswers, setMissingDataAnswers] = useState<Record<string, any>>({})

  // Consent Status da participante
  const [consentRecord, setConsentRecord] = useState<CerPracticeConsentRecord | null>(null)

  // Parâmetros de Dose e Schedule
  const [safeTitle, setSafeTitle] = useState('')
  const [safeSummary, setSafeSummary] = useState('')
  const [doseUnit, setDoseUnit] = useState('minutos')
  const [doseQuantity, setDoseQuantity] = useState<number>(10)
  const [frequencyInterval, setFrequencyInterval] = useState('diario')
  const [scheduleIntent, setScheduleIntent] = useState('flexivel')

  // Modais
  const [newAssignmentModalOpen, setNewAssignmentModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [adaptationModalOpen, setAdaptationModalOpen] = useState(false)
  const [adaptingAssignment, setAdaptingAssignment] = useState<CerPracticeAssignmentRecord | null>(
    null,
  )
  const [adaptationReason, setAdaptationReason] = useState<string>('participant_request')
  const [adaptationNotes, setAdaptationNotes] = useState('')

  useEffect(() => {
    if (initialPractice && initialVersion) {
      setPractice(initialPractice)
      setVersion(initialVersion)
      setSafeTitle(
        initialVersion.participant_title ||
          initialPractice.participant_facing_name_base ||
          initialPractice.internal_name,
      )
      setSafeSummary(initialVersion.instructions || initialVersion.participant_summary || '')
      loadVariantsAndSafety(initialVersion.id)
    }
  }, [initialPractice, initialVersion])

  const loadAssignmentsData = async () => {
    setLoading(true)
    try {
      const list = await pb
        .collection('cer_practice_assignments')
        .getFullList<CerPracticeAssignmentRecord>({
          filter: `enrollment_id = "${enrollmentId}"`,
          sort: '-created',
          expand: 'practice_version_id,variant_id,priority_id',
        })
      setAssignments(list)

      // Carregar prioridades ativas
      const prioList = await pb
        .collection('cer_care_plan_priorities')
        .getFullList<CerCarePlanPriorityRecord>({
          filter: `enrollment_id = "${enrollmentId}" && is_possible_now = true`,
        })
      setPriorities(prioList)
      if (prioList.length > 0 && !selectedPriorityId) {
        setSelectedPriorityId(prioList[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar atribuições de práticas:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadVariantsAndSafety = async (verId: string) => {
    try {
      const vars = await cerPracticeService.listVariantsForVersion(verId)
      setVariants(vars)

      // Verificar Safety Check recente
      setSafetyChecking(true)
      const checks = await pb
        .collection('cer_practice_safety_checks')
        .getFullList<CerPracticeSafetyCheckRecord>({
          filter: `enrollment_id = "${enrollmentId}" && practice_version_id = "${verId}" && record_status = "current"`,
          sort: '-created',
        })
      if (checks.length > 0) {
        setSafetyCheck(checks[0])
      } else {
        const authUser = pb.authStore.model
        const evaluated = await cerPracticeService.recordSafetyCheck({
          enrollment_id: enrollmentId,
          practice_version_id: verId,
          outcome: 'eligible',
          reviewed_by_user_id: authUser?.id || '',
          professional_rationale: 'Checagem clínica preliminar automatizada',
          metadata: { evaluated_safety_inputs: [] },
        })
        setSafetyCheck(evaluated)
      }

      // Verificar consentimento ativo
      const consents = await pb
        .collection('cer_practice_consents')
        .getFullList<CerPracticeConsentRecord>({
          filter: `enrollment_id = "${enrollmentId}" && practice_version_id = "${verId}" && record_status = "current"`,
          sort: '-created',
        })
      setConsentRecord(consents[0] || null)
    } catch (err) {
      console.error('Erro ao preparar checagem de segurança:', err)
    } finally {
      setSafetyChecking(false)
    }
  }

  useEffect(() => {
    loadAssignmentsData()
  }, [enrollmentId])

  // Abertura do fluxo de nova atribuição
  const handleOpenNewAssignment = () => {
    if (!practice || !version) {
      setErrorMsg('Selecione primeiro uma prática na Biblioteca.')
      return
    }
    setNewAssignmentModalOpen(true)
  }

  // Resolução de dados faltantes de segurança
  const handleAnswerMissingInput = async (ruleId: string, value: any) => {
    if (!version) return
    const updatedInputs = { ...missingDataAnswers, [ruleId]: value }
    setMissingDataAnswers(updatedInputs)

    try {
      setSafetyChecking(true)
      const authUser = pb.authStore.model
      const reevaluated = await cerPracticeService.recordSafetyCheck({
        enrollment_id: enrollmentId,
        practice_version_id: version.id,
        outcome: 'eligible',
        reviewed_by_user_id: authUser?.id || '',
        professional_rationale: 'Checagem com dados complementares resolvidos em sessão',
        metadata: { dynamic_inputs_used: updatedInputs },
      })
      setSafetyCheck(reevaluated)
    } catch (err) {
      console.error('Erro ao reavaliar checagem:', err)
    } finally {
      setSafetyChecking(false)
    }
  }

  // Validação do Safety Outcome para ativação
  const isSafetyBlocking =
    !safetyCheck ||
    safetyCheck.outcome === 'requires_professional_review' ||
    safetyCheck.outcome === 'not_currently_indicated' ||
    safetyCheck.outcome === 'insufficient_information'

  // Validação de Consentimento
  const isConsentBlocking =
    consentRecord &&
    (consentRecord.record_status === 'withdrawn' ||
      consentRecord.decision === 'declined' ||
      consentRecord.understanding_response === 'want_to_ask' ||
      consentRecord.understanding_response === 'did_not_understand')

  // Ativar Atribuição após Preview
  const handleConfirmAndActivateAssignment = async () => {
    if (!version) return
    if (isSafetyBlocking) {
      setErrorMsg(
        'A checagem de segurança impede a ativação. Resolva as pendências clínicas antes de seguir.',
      )
      return
    }

    setActionLoading(true)
    setErrorMsg(null)
    try {
      const authUser = pb.authStore.model
      const enrollment = await pb
        .collection('enrollments')
        .getOne<{ participant_user_id: string }>(enrollmentId)
      await cerPracticeAssignmentService.createAssignment({
        enrollment_id: enrollmentId,
        participant_user_id: enrollment?.participant_user_id || '',
        care_plan_priority_id: selectedPriorityId || undefined,
        care_cycle_id: undefined,
        practice_version_id: version.id,
        variant_id: selectedVariantId || undefined,
        safety_check_id: safetyCheck?.id,
        operational_acceptance_id: undefined,
        assigned_by_user_id: authUser?.id || '',
        internal_title: version.participant_title,
        participant_safe_title: safeTitle.trim() || version.participant_title,
        participant_safe_summary:
          safeSummary.trim() || version.instructions || version.participant_summary || '',
        assigned_quantity: String(doseQuantity),
        assigned_duration: doseUnit,
        assigned_frequency: frequencyInterval,
        assigned_time_window: scheduleIntent,
      } as any)

      setSuccessMsg('Experimento atribuído com sucesso. Disponível para a participante.')
      setPreviewModalOpen(false)
      setNewAssignmentModalOpen(false)
      await loadAssignmentsData()
      onAssignmentCreated?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atribuir prática.')
    } finally {
      setActionLoading(false)
    }
  }

  // Executar Adaptação Material
  const handleExecuteMaterialAdaptation = async () => {
    if (!adaptingAssignment) return
    setActionLoading(true)
    setErrorMsg(null)
    try {
      const authUser = pb.authStore.model
      await cerPracticeAssignmentService.adaptMaterially({
        previous_assignment_id: adaptingAssignment.id,
        assigned_by_user_id: authUser?.id || '',
        internal_title:
          adaptingAssignment.internal_title || adaptingAssignment.participant_safe_title,
        participant_safe_title: adaptingAssignment.participant_safe_title,
        participant_safe_summary: adaptingAssignment.participant_safe_summary,
        assigned_quantity: String(doseQuantity),
        assigned_duration: doseUnit,
        assigned_frequency: frequencyInterval,
        reason: adaptationReason,
      })
      setSuccessMsg(
        'Experimento adaptado materialmente. Nova versão gerada e cronograma reprojetado.',
      )
      setAdaptationModalOpen(false)
      setAdaptingAssignment(null)
      await loadAssignmentsData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao adaptar experimento.')
    } finally {
      setActionLoading(false)
    }
  }

  // Pausar / Parar Atribuição
  const handlePauseAssignment = async (asgnId: string) => {
    setActionLoading(true)
    try {
      await cerPracticeAssignmentService.pauseAssignment(asgnId)
      await loadAssignmentsData()
    } catch (err) {
      console.error('Erro ao pausar:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResumeAssignment = async (asgnId: string) => {
    setActionLoading(true)
    try {
      await cerPracticeAssignmentService.resumeAssignment(asgnId)
      await loadAssignmentsData()
    } catch (err) {
      console.error('Erro ao reativar:', err)
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
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Experimentos & Práticas Atribuídas: {participantName}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {assignments.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Ciclo de Atribuição Segura: Dosagem cuidadosa, Checagem de Segurança, Consentimento e
              Adaptação
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {practice && version ? (
              <Button size="sm" onClick={handleOpenNewAssignment} className="h-8 text-xs gap-1.5">
                <Play className="w-3.5 h-3.5" />
                <span>
                  Atribuir: {practice.participant_facing_name_base || practice.internal_name}
                </span>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Selecione uma prática na Biblioteca abaixo para atribuir
              </p>
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
            Carregando experimentos atribuídos...
          </p>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 space-y-2 border border-dashed rounded-lg p-6">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Nenhum experimento ou prática atribuída no momento.
            </p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Utilize o seletor da Biblioteca para escolher uma prática compatível com as
              prioridades atuais da participante.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((asgn) => {
              const isPaused = asgn.status === 'paused'
              const isCompleted = asgn.status === 'completed'
              const isSuperseded = asgn.status === 'superseded'

              return (
                <div
                  key={asgn.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                    isPaused
                      ? 'border-amber-300 bg-amber-500/5'
                      : isSuperseded
                        ? 'border-border/40 bg-muted/10 opacity-75'
                        : 'border-border/70 bg-card hover:bg-muted/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {asgn.participant_safe_title}
                        </span>

                        <Badge
                          variant={
                            asgn.status === 'active'
                              ? 'default'
                              : asgn.status === 'paused'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-[10px] font-mono capitalize"
                        >
                          {asgn.status === 'active'
                            ? 'Ativo'
                            : asgn.status === 'paused'
                              ? 'Pausado'
                              : asgn.status}
                        </Badge>

                        {asgn.expand?.practice_version_id?.version_number !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            v{asgn.expand.practice_version_id.version_number}
                          </span>
                        )}

                        {asgn.participant_response_type && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-primary/10 text-primary border-primary/30"
                          >
                            Aceite: {asgn.participant_response_type}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {asgn.participant_safe_summary}
                      </p>
                    </div>

                    {/* Ações da Profissional */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdaptingAssignment(asgn)
                          const qty = asgn.assigned_quantity ? Number(asgn.assigned_quantity) : 10
                          setDoseQuantity(isNaN(qty) ? 10 : qty)
                          setDoseUnit(asgn.assigned_duration || 'minutos')
                          setFrequencyInterval(asgn.assigned_frequency || 'diario')
                          setAdaptationModalOpen(true)
                        }}
                        className="h-7 text-xs px-2 gap-1 border-primary/40 hover:bg-primary/10 text-primary"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Adaptar</span>
                      </Button>

                      {asgn.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePauseAssignment(asgn.id)}
                          className="h-7 text-xs px-2 gap-1 text-amber-600 hover:bg-amber-50"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pausar</span>
                        </Button>
                      )}

                      {asgn.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResumeAssignment(asgn.id)}
                          className="h-7 text-xs px-2 gap-1 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Play className="w-3 h-3" />
                          <span>Reativar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Informações Operacionais e Parâmetros */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40 flex-wrap">
                    <span className="flex items-center gap-1 text-foreground/80">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Dose: {asgn.assigned_quantity || '10'} {asgn.assigned_duration || 'minutos'} (
                      {asgn.assigned_frequency || 'diário'})
                    </span>
                    <span>•</span>
                    <span>Janela: {asgn.assigned_time_window || 'flexível'}</span>
                    {asgn.confirmed_at && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">
                          ✓ Confirmado pela participante em{' '}
                          {new Date(asgn.confirmed_at).toLocaleDateString('pt-BR')}
                        </span>
                      </>
                    )}
                  </div>{' '}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* MODAL 1: Montagem de Atribuição com Safety Check e Consent Panel */}
      <Dialog open={newAssignmentModalOpen} onOpenChange={setNewAssignmentModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {practice && version && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Atribuir Experimento:{' '}
                  {practice.participant_facing_name_base || practice.internal_name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ajuste a dosagem, avalie as checagens de segurança e garanta a clareza para a
                  participante.
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 space-y-4 text-xs">
                {/* 1. Vinculação com Prioridade do Plano */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Vinculação com Prioridade Terapêutica
                  </label>
                  <select
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={selectedPriorityId}
                    onChange={(e) => setSelectedPriorityId(e.target.value)}
                  >
                    <option value="">Sem vinculação direta a prioridade</option>
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (importante: {p.is_therapeutic_priority ? 'sim' : 'não'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Seleção de Variante Modular */}
                {variants.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Variante da Prática
                    </label>
                    <select
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                    >
                      <option value="">Versão padrão da prática</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title} ({v.variant_type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. SafetyCheckPanel Integrado */}
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Checagem de Segurança Clínica (Build 08C)</span>
                    </div>
                    {safetyCheck && (
                      <Badge
                        variant={
                          safetyCheck.outcome === 'eligible'
                            ? 'default'
                            : safetyCheck.outcome === 'eligible_with_caution'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {safetyCheck.outcome}
                      </Badge>
                    )}
                  </div>

                  {safetyChecking ? (
                    <p className="text-muted-foreground text-center py-2">
                      Verificando perfil de segurança e contraindicações...
                    </p>
                  ) : safetyCheck ? (
                    <div className="space-y-2 text-xs">
                      {safetyCheck.outcome === 'eligible' && (
                        <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ Participante elegível para esta prática nos parâmetros atuais.
                        </p>
                      )}

                      {safetyCheck.outcome === 'eligible_with_caution' && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-300 text-amber-900 dark:text-amber-200">
                          <span className="font-semibold block">Atenção a precauções:</span>
                          <p className="text-[11px]">{safetyCheck.professional_rationale}</p>
                        </div>
                      )}

                      {safetyCheck.outcome === 'insufficient_information' && (
                        <div className="p-2.5 rounded bg-blue-500/10 border border-blue-300 text-blue-900 dark:text-blue-200 space-y-2">
                          <span className="font-semibold block">
                            Informações clínicas pendentes para segurança:
                          </span>
                          <p className="text-[11px]">
                            Precisamos revisar algumas informações pontuais antes de ativar este
                            experimento:
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-background border text-xs">
                              <span className="font-medium text-foreground">
                                Condição somática atual
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAnswerMissingInput('somatic_check', true)}
                                  className="h-6 text-[10px] px-2"
                                >
                                  Verificado / Estável
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {isSafetyBlocking && safetyCheck.outcome !== 'insufficient_information' && (
                        <div className="p-2.5 rounded bg-red-500/10 border border-red-300 text-red-900 dark:text-red-200 text-xs">
                          <span className="font-semibold block">
                            Ativação Bloqueada por Segurança:
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {safetyCheck.professional_rationale ||
                              'A prática não é recomendada no momento sob estas condições clínicas.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* 4. ConsentPanel Integrado */}
                {consentRecord && (
                  <div className="p-3 rounded-lg border border-border/70 bg-muted/15 space-y-1.5">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                      Status de Consentimento da Participante
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Compreensão: {consentRecord.understanding_response}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Decisão: {consentRecord.decision}
                      </Badge>
                      <Badge
                        variant={
                          consentRecord.record_status === 'current' ? 'default' : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {consentRecord.record_status}
                      </Badge>
                    </div>

                    {consentRecord.understanding_response === 'want_to_ask' && (
                      <p className="text-amber-800 dark:text-amber-300 text-xs">
                        A participante solicitou esclarecimentos antes de iniciar. O experimento
                        fica suspenso até a conversa em sessão.
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Parâmetros de Dose e Frequência */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Dose Combinada (Quantidade e Unidade)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={doseQuantity}
                        onChange={(e) => setDoseQuantity(Number(e.target.value))}
                        className="h-8 text-xs w-20"
                        min={1}
                      />
                      <Input
                        value={doseUnit}
                        onChange={(e) => setDoseUnit(e.target.value)}
                        className="h-8 text-xs"
                        placeholder="minutos, respirações..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Frequência / Ritmo
                    </label>
                    <select
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={frequencyInterval}
                      onChange={(e) => setFrequencyInterval(e.target.value)}
                    >
                      <option value="diario">Diário</option>
                      <option value="3x_semana">3 vezes por semana</option>
                      <option value="semanal">Semanal</option>
                      <option value="conforme_necessidade">Conforme necessidade (SOS)</option>
                    </select>
                  </div>
                </div>

                {/* 6. Textos Seguros Participant-Facing */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Título Seguro para o Participante
                    </label>
                    <Input
                      value={safeTitle}
                      onChange={(e) => setSafeTitle(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Orientações e Instruções Participant-Facing
                    </label>
                    <Textarea
                      value={safeSummary}
                      onChange={(e) => setSafeSummary(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewAssignmentModalOpen(false)}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={isSafetyBlocking || isConsentBlocking}
                  className="text-xs h-8 gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualizar Prévia Obrigatória</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AssignmentPreview Obrigatória ("É isso que a participante verá.") */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              É isso que a participante verá
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conferência final anti-laundering: garanta que apenas instruções e títulos seguros
              estejam expostos.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Cartão de Experimento da Participante
              </span>

              <h4 className="text-sm font-semibold text-foreground">{safeTitle}</h4>

              <div className="p-2.5 rounded bg-background border border-border/50 text-xs text-foreground leading-relaxed font-sans">
                {safeSummary}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                <span>
                  Dose: {doseQuantity} {doseUnit}
                </span>
                <span>•</span>
                <span>Ritmo: {frequencyInterval}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
              ✓ Nenhuma anotação privada, rationale de segurança interno ou diagnóstico confidencial
              está presente nesta prévia.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
              className="text-xs h-8"
            >
              Voltar e Ajustar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAndActivateAssignment}
              disabled={actionLoading}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar e Atribuir</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Adaptação Material (Material Adaptation Flow) */}
      <Dialog open={adaptationModalOpen} onOpenChange={setAdaptationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Adaptação Material do Experimento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reduza a dose, altere a variante ou ajuste o ritmo. Uma nova versão do experimento
              será gerada e o cronograma será reprojetado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">Motivo da Adaptação</label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={adaptationReason}
                onChange={(e) => setAdaptationReason(e.target.value)}
              >
                <option value="participant_request">Solicitação expressa da participante</option>
                <option value="too_much">A prática foi excessiva no momento (was too much)</option>
                <option value="dose_reduction">
                  Redução deliberada de dose para sustentabilidade
                </option>
                <option value="variant_minimal">Migração para variante minimal</option>
                <option value="schedule_change">Ajuste de ritmo e dias da semana</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Nova Dose</label>
                <Input
                  type="number"
                  value={doseQuantity}
                  onChange={(e) => setDoseQuantity(Number(e.target.value))}
                  className="h-8 text-xs"
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Novo Ritmo</label>
                <select
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={frequencyInterval}
                  onChange={(e) => setFrequencyInterval(e.target.value)}
                >
                  <option value="diario">Diário</option>
                  <option value="3x_semana">3 vezes por semana</option>
                  <option value="semanal">Semanal</option>
                  <option value="conforme_necessidade">SOS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground">
                Notas Clínicas da Adaptação (Privadas)
              </label>
              <Textarea
                value={adaptationNotes}
                onChange={(e) => setAdaptationNotes(e.target.value)}
                rows={2}
                placeholder="Fundamentação clínica para a alteração..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdaptationModalOpen(false)}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteMaterialAdaptation}
              disabled={actionLoading}
              className="text-xs h-8"
            >
              Salvar Nova Versão Adaptada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
