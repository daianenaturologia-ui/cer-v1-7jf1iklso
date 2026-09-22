import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { enrollmentExperienceService, featureFlagService } from '@/services/experienceEngine'
import { CadernoSection } from '@/components/CadernoSection'
import { CER_FEATURE_FLAGS } from '@/config/features'
import {
  cerKnowledgeItemService,
  cerParticipantRecognitionService,
  cerKnowledgePresentationService,
} from '@/services/cerKnowledge'
import { useNavigate } from 'react-router-dom'
import {
  EnrollmentRecord,
  EnrollmentExperienceRecord,
  CerKnowledgeItemRecord,
  CerKnowledgePresentationRecord,
  RecognitionType,
  CerMapRecord,
  CerMapItemRecord,
  CerPracticeAssignmentRecord,
  CerPlannerItemRecord,
  CapacityResponseValue,
  PROFESSIONAL_DISPLAY_NAME,
  PROFESSIONAL_FIRST_PERSON_SIGNATURE,
  TREATMENT_PREFERENCES,
  TreatmentPreference,
  TREATMENT_PREFERENCE_LABELS,
  TREATMENT_PREFERENCE_DESCRIPTIONS,
} from '@/types/cer'
import { personService } from '@/services/cer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  LogOut,
  User,
  Compass,
  Calendar,
  Layers,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Brain,
  Calendar as CalendarIcon,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { ExperienceEngine } from '@/components/experience'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'
import { cerMapService } from '@/services/cerMapService'
import { cerPracticeAssignmentService } from '@/services/cerPracticeAssignmentService'
import { cerPlannerService } from '@/services/cerPlannerService'
import { cerJournalService } from '@/services/cerJournalService'
import { cerCarePlanService } from '@/services/cerCarePlanService'
import { demoAdapter } from '@/services/demoAdapter'
import type { CerCarePlanPresentationRecord, OperationalAcceptanceResponseType } from '@/types/cer'
import { ExperimentCard } from '@/components/ExperimentCard'
import { MandalaStructuredView } from '@/components/MandalaStructuredView'
import { SerConscienciaMap } from '@/components/SerConscienciaMap'
import { OnboardingFlow } from '@/components/OnboardingFlow'
import { EmptyState } from '@/components/EmptyState'
import pb from '@/lib/pocketbase/client'

export const InteragenteHome: React.FC = () => {
  const navigate = useNavigate()
  const { user, person, logout } = useAuth()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [engineEnabled, setEngineEnabled] = useState(true)
  const [availableExperiences, setAvailableExperiences] = useState<EnrollmentExperienceRecord[]>([])
  // Fase ativa na visão da Interagente:
  // 1: comece_aqui | 2: consciencia | 3: equilibrio | 4: evolucao
  const [activePhase, setActivePhase] = useState<
    'comece_aqui' | 'consciencia' | 'equilibrio' | 'evolucao'
  >('comece_aqui')

  const [activeExperienceId, setActiveExperienceId] = useState<string | null>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<CerKnowledgeItemRecord[]>([])
  const [presentations, setPresentations] = useState<CerKnowledgePresentationRecord[]>([])
  const [currentMap, setCurrentMap] = useState<
    (CerMapRecord & { items: CerMapItemRecord[] }) | null
  >(null)
  const [selectedRecognitions, setSelectedRecognitions] = useState<
    Record<string, { type: RecognitionType; comment: string; saved: boolean }>
  >({})
  const [selectedPresRecognitions, setSelectedPresRecognitions] = useState<
    Record<string, { type: RecognitionType; comment: string; saved: boolean }>
  >({})
  const [submittingRecog, setSubmittingRecog] = useState<string | null>(null)
  const [submittingPresRecog, setSubmittingPresRecog] = useState<string | null>(null)
  const [cadernoEnabled, setCadernoEnabled] = useState(false)
  const [assignments, setAssignments] = useState<CerPracticeAssignmentRecord[]>([])
  const [plannerItems, setPlannerItems] = useState<CerPlannerItemRecord[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeReviewInvite, setActiveReviewInvite] = useState<{ cycleId: string } | null>(null)

  // Preferências de nome e tratamento (Item 2)
  const [preferredNameInput, setPreferredNameInput] = useState('')
  const [treatmentPreferenceInput, setTreatmentPreferenceInput] =
    useState<TreatmentPreference>('neutro')
  const [treatmentCustomInput, setTreatmentCustomInput] = useState('')
  const [savingTreatmentPreference, setSavingTreatmentPreference] = useState(false)
  const [hasCompletedInitialPreference, setHasCompletedInitialPreference] = useState(false)

  // ETAPA 1: Relato inicial acolhedor
  const [initialIntakeWhatBrings, setInitialIntakeWhatBrings] = useState('')
  const [initialIntakeWhatHelps, setInitialIntakeWhatHelps] = useState('')
  const [initialIntakeWhatCares, setInitialIntakeWhatCares] = useState('')
  const [intakeSavingDraft, setIntakeSavingDraft] = useState(false)
  const [intakeSending, setIntakeSending] = useState(false)
  const [intakeSubmittedMessage, setIntakeSubmittedMessage] = useState<string | null>(null)
  const [intakeSentSuccessModal, setIntakeSentSuccessModal] = useState(false)
  const [hasSentIntakeOnce, setHasSentIntakeOnce] = useState(false)
  // ETAPA 4: Plano apresentado e Retorno Operacional
  const [presentedCarePlans, setPresentedCarePlans] = useState<CerCarePlanPresentationRecord[]>([])
  const [selectedPlanResponses, setSelectedPlanResponses] = useState<
    Record<
      string,
      { response_type: OperationalAcceptanceResponseType; shared_comment: string; saved: boolean }
    >
  >({})
  const [submittingPlanResponse, setSubmittingPlanResponse] = useState<string | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    if (!person?.id) {
      setLoading(false)
      return
    }

    try {
      const [activeEnr, isFlagActive, isCadernoActive] = await Promise.all([
        enrollmentService.getByPersonId(person.id),
        featureFlagService.isEnabled('experience_engine'),
        featureFlagService.isEnabled(CER_FEATURE_FLAGS.CADERNO_JOURNAL),
      ])

      setEnrollment(activeEnr)
      setEngineEnabled(isFlagActive)
      setCadernoEnabled(isCadernoActive)

      if (activeEnr?.id && isFlagActive) {
        const [exps, kiList, myRecogs, presList, mapData] = await Promise.all([
          enrollmentExperienceService.listByEnrollment(activeEnr.id),
          cerKnowledgeItemService.listByEnrollment(activeEnr.id),
          cerParticipantRecognitionService.listByEnrollment(activeEnr.id),
          cerKnowledgePresentationService.listPresentedByEnrollment(activeEnr.id),
          cerMapService.getCurrentPublishedMap(activeEnr.id),
        ])
        setAvailableExperiences(exps)
        setKnowledgeItems(kiList)
        setPresentations(presList)
        setCurrentMap(mapData)

        // Verificar se já enviou pré-consulta pelo histórico de recados
        try {
          const { cerJournalService } = await import('@/services/cerJournalService')
          const myMsgs = await cerJournalService.listParticipantMessages(activeEnr.id)
          const hasSent = myMsgs.some((m) => m.status === 'approved')
          setHasSentIntakeOnce(hasSent)
        } catch {
          /* ignore */
        }

        // ETAPA 4: Carregar planos apresentados à participante (status = presented)
        try {
          const presentedPlans = await cerCarePlanService.listPresentedForParticipant(activeEnr.id)
          setPresentedCarePlans(presentedPlans)

          // Carregar aceites operacionais existentes para preencher visualmente se já respondeu
          const existingAcceptances = await cerCarePlanService.listAcceptancesByEnrollment(
            activeEnr.id,
          )
          const respMap: Record<
            string,
            {
              response_type: OperationalAcceptanceResponseType
              shared_comment: string
              saved: boolean
            }
          > = {}
          for (const acc of existingAcceptances) {
            respMap[acc.presentation_id] = {
              response_type: acc.response_type,
              shared_comment: acc.shared_comment || '',
              saved: true,
            }
          }
          setSelectedPlanResponses(respMap)
        } catch {
          /* intentionally ignored */
        }

        const recogMap: Record<string, { type: RecognitionType; comment: string; saved: boolean }> =
          {}
        const presRecogMap: Record<
          string,
          { type: RecognitionType; comment: string; saved: boolean }
        > = {}

        for (const r of myRecogs) {
          recogMap[r.knowledge_item_id] = {
            type: r.recognition_type,
            comment: r.comment || '',
            saved: true,
          }
          if (r.presentation_id) {
            presRecogMap[r.presentation_id] = {
              type: r.recognition_type,
              comment: r.comment || '',
              saved: true,
            }
          }
        }
        setSelectedRecognitions(recogMap)
        setSelectedPresRecognitions(presRecogMap)

        // Build 08D: Carregar assignments e planner items
        try {
          const asgns = await cerPracticeAssignmentService.listByEnrollment(activeEnr.id)
          setAssignments(asgns)
        } catch {
          /* intentionally ignored */
        }

        if (user?.id) {
          try {
            const pItems = await cerPlannerService.listForParticipant(activeEnr.id, user.id)
            setPlannerItems(pItems)
          } catch {
            /* intentionally ignored */
          }
        }

        // Item 22: Verificar convite ativo de Cycle Review (participant_review_invited_at)
        if (!demoAdapter.isEnabled()) {
          try {
            const reviews = await pb.collection('cer_cycle_reviews').getFullList({
              filter: `enrollment_id = "${activeEnr.id}" && participant_review_invited_at != "" && participant_review_completed_at = ""`,
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
        } else {
          setActiveReviewInvite(null)
        }

        // Item 14: Onboarding aparece uma vez no first access apropriado
        // Reutiliza journey_states (current_stage === 'onboarding' ou metadata.onboarding_completed)
        const journeyRecord = activeEnr.expand?.journey_states_via_enrollment_id?.[0]
        const hasCompletedOnboarding =
          journeyRecord?.metadata?.onboarding_completed ||
          journeyRecord?.current_stage === 'consciousness' ||
          journeyRecord?.current_stage === 'equilibrium_realization' ||
          localStorage.getItem(`cer_onboarding_completed_${activeEnr.id}`)

        if (!hasCompletedOnboarding && journeyRecord?.current_stage === 'onboarding') {
          setShowOnboarding(true)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do interagente:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmExperiment = async (assignmentId: string, capacity: CapacityResponseValue) => {
    try {
      await cerPracticeAssignmentService.recordConfirmation(assignmentId, {
        participant_response_type: 'confirmed',
        capacity_response: capacity,
      })
      toast({
        title: 'Experimento acolhido',
        description: 'Sua percepção ajuda a calibrar o ritmo do cuidado.',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Não foi possível confirmar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleCompletePlannerItem = async (itemId: string) => {
    try {
      await cerPlannerService.completeItem(itemId)
      toast({
        title: 'Momento registrado',
        description: 'Seu momento foi registrado com leveza e carinho.',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao registrar momento',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleFinishOnboarding = async () => {
    setShowOnboarding(false)
    if (enrollment?.id) {
      localStorage.setItem(`cer_onboarding_completed_${enrollment.id}`, 'true')
      if (!demoAdapter.isEnabled()) {
        const journeyRecord = enrollment.expand?.journey_states_via_enrollment_id?.[0]
        if (journeyRecord?.id) {
          try {
            await pb.collection('journey_states').update(journeyRecord.id, {
              current_stage: 'consciousness',
              stage_status: 'em_andamento',
              metadata: {
                ...(journeyRecord.metadata || {}),
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString(),
              },
            })
          } catch {
            /* intentionally ignored */
          }
        }
      }
    }
    await loadData()
  }

  useEffect(() => {
    if (person) {
      setPreferredNameInput(person.preferred_name || person.full_name || '')
      setTreatmentPreferenceInput(person.treatment_preference || 'neutro')
      setTreatmentCustomInput(person.treatment_preference_custom || '')
      if (
        person.treatment_preference ||
        localStorage.getItem(`cer_treatment_pref_completed_${person.id}`)
      ) {
        setHasCompletedInitialPreference(true)
      }
    }
    loadData()
  }, [person])

  const handleSaveTreatmentPreference = async () => {
    if (!person?.id) return
    setSavingTreatmentPreference(true)
    try {
      const updated = await personService.updateTreatmentPreference(person.id, {
        preferred_name: preferredNameInput.trim() || undefined,
        treatment_preference: treatmentPreferenceInput,
        treatment_preference_custom:
          treatmentPreferenceInput === 'outro' ? treatmentCustomInput.trim() : undefined,
      })
      localStorage.setItem(`cer_treatment_pref_completed_${person.id}`, 'true')
      setHasCompletedInitialPreference(true)
      toast({
        title: 'Preferências acolhidas',
        description: 'Sua forma de tratamento e nome preferido foram salvos com carinho.',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingTreatmentPreference(false)
    }
  }

  // ETAPA 1: Handlers do Relato Inicial
  const formatIntakeFullText = () => {
    const parts: string[] = []
    if (initialIntakeWhatBrings.trim()) {
      parts.push(`O que a traz:\n${initialIntakeWhatBrings.trim()}`)
    }
    if (initialIntakeWhatHelps.trim()) {
      parts.push(`O que já a ajuda:\n${initialIntakeWhatHelps.trim()}`)
    }
    if (initialIntakeWhatCares.trim()) {
      parts.push(`O que deseja cuidar:\n${initialIntakeWhatCares.trim()}`)
    }
    return parts.join('\n\n')
  }

  const handleSaveIntakeDraft = async () => {
    if (!enrollment?.id) return
    const text = formatIntakeFullText()
    if (!text) {
      toast({
        title: 'Campos em branco',
        description: 'Escreva ao menos um pensamento para salvar seu rascunho.',
      })
      return
    }
    try {
      setIntakeSavingDraft(true)
      await cerJournalService.createNextSessionMessage({
        enrollment_id: enrollment.id,
        message_text: text,
        as_draft: true,
      })
      toast({
        title: 'Rascunho salvo',
        description:
          'Seu relato está guardado de forma privada. Nada foi enviado para a profissional ainda.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIntakeSavingDraft(false)
    }
  }

  const handleSendIntakeToDaiane = async () => {
    if (!enrollment?.id) return
    const text = formatIntakeFullText()
    if (!text) {
      toast({
        title: 'Campos em branco',
        description: 'Escreva seu relato antes de enviar.',
      })
      return
    }
    try {
      setIntakeSending(true)
      await cerJournalService.createNextSessionMessage({
        enrollment_id: enrollment.id,
        message_text: text,
        as_draft: false,
      })
      setHasSentIntakeOnce(true)
      setIntakeSubmittedMessage(
        `Suas respostas foram enviadas para ${PROFESSIONAL_DISPLAY_NAME}. A partir de agora, você pode conhecer as seis dimensões do seu ser e responder às avaliações no seu ritmo.`,
      )
      setIntakeSentSuccessModal(true)
      toast({
        title: `Relato enviado para ${PROFESSIONAL_DISPLAY_NAME}`,
        description:
          'Agradecemos por compartilhar. Você agora pode explorar a fase de Consciência.',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao enviar relato',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIntakeSending(false)
    }
  }

  // ETAPA 4: Handler de Retorno Operacional sobre o Plano Apresentado
  const handleSaveOperationalAcceptance = async (presentationId: string) => {
    const current = selectedPlanResponses[presentationId]
    if (!current?.response_type || !enrollment) return
    setSubmittingPlanResponse(presentationId)
    try {
      await cerCarePlanService.recordAcceptance({
        presentation_id: presentationId,
        response_type: current.response_type,
        shared_comment: current.shared_comment,
      })
      setSelectedPlanResponses((prev) => ({
        ...prev,
        [presentationId]: {
          ...prev[presentationId],
          saved: true,
        },
      }))
      toast({
        title: 'Retorno acolhido',
        description: 'Seu retorno sobre o próximo passo foi compartilhado com Daiane.',
      })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: 'Não conseguimos salvar agora',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingPlanResponse(null)
    }
  }

  // Se precisa de Onboarding inicial
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <OnboardingFlow
          interagenteName={person?.preferred_name || person?.full_name}
          onComplete={handleFinishOnboarding}
        />
      </div>
    )
  }

  // Verificar se a etapa de consciência (todas as experiências ou 07G) foi concluída
  const hasCompletedConsciousness =
    availableExperiences.length > 0 &&
    availableExperiences.every((ee) => ee.release_status === 'completed')

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header com navegação direta sem depender de URL digitada */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight">CER</span>
            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
              Interagente
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/experimentos')}
              className="gap-1.5 text-xs h-8 text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Experimentos</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/planner')}
              className="gap-1.5 text-xs h-8 text-foreground"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
              <span>Planner</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/mandala')}
              className="gap-1.5 text-xs h-8 text-primary border-primary/30 hover:bg-primary/5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Mandala</span>
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline ml-2">
              {person?.preferred_name || person?.full_name || user?.name || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Item 22: CTA de Revisão de Ciclo (Cycle Review) quando ativo */}
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

        {/* Identidade e Acolhimento Humano */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Olá, {person?.preferred_name || person?.full_name?.split(' ')[0] || 'você'}. Parabéns
            por escolher cuidar de si.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este é o seu espaço de acompanhamento no CER. Você não precisa conhecer todo o
            aplicativo agora nem fazer tudo de uma vez. Leia com calma, explore no seu ritmo e, se
            precisar de ajuda, pode me chamar.
          </p>
        </div>

        {/* BARRA DE NAVEGAÇÃO DAS 4 FASES */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/50">
          <Button
            size="sm"
            variant={activePhase === 'comece_aqui' ? 'default' : 'ghost'}
            onClick={() => setActivePhase('comece_aqui')}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>1. Comece aqui</span>
          </Button>

          <Button
            size="sm"
            variant={activePhase === 'consciencia' ? 'default' : 'ghost'}
            onClick={() => setActivePhase('consciencia')}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>2. Consciência</span>
          </Button>

          <Button
            size="sm"
            variant={activePhase === 'equilibrio' ? 'default' : 'ghost'}
            onClick={() => setActivePhase('equilibrio')}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Equilíbrio & Realização</span>
          </Button>

          <Button
            size="sm"
            variant={activePhase === 'evolucao' ? 'default' : 'ghost'}
            onClick={() => setActivePhase('evolucao')}
            className="h-8 text-xs px-3 gap-1.5 shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>4. Evolução</span>
          </Button>
        </div>

        {/* ========================================================
            FASE 1: COMECE AQUI
           ======================================================== */}
        {activePhase === 'comece_aqui' && (
          <div className="space-y-6">
            {/* Modal / Card Inicial de Nome Preferido e Tratamento (Item 2) */}
            {!hasCompletedInitialPreference && (
              <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
                <CardHeader className="pb-3 border-b border-primary/15">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base font-serif font-semibold text-foreground">
                        Como prefere que nos dirijamos a você?
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                      Este formulário acolhedor define apenas a linguagem de tratamento do
                      aplicativo e como Daiane pode chamar você. Ele não pergunta sobre sexo, gênero
                      ou identidade, e você poderá alterá-lo a qualquer momento em &ldquo;Meu
                      perfil&rdquo;.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Como você prefere que chamemos você?
                    </Label>
                    <Input
                      placeholder="Seu nome preferido ou apelido de carinho..."
                      value={preferredNameInput}
                      onChange={(e) => setPreferredNameInput(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground block">
                      Como você prefere que o aplicativo se refira a você?
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setTreatmentPreferenceInput('feminino')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          treatmentPreferenceInput === 'feminino'
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className="font-semibold text-foreground block">No feminino</span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          exemplos: &ldquo;acolhida&rdquo;, &ldquo;juntas&rdquo;
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTreatmentPreferenceInput('masculino')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          treatmentPreferenceInput === 'masculino'
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className="font-semibold text-foreground block">No masculino</span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          exemplos: &ldquo;acolhido&rdquo;, &ldquo;juntos&rdquo;
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTreatmentPreferenceInput('neutro')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          treatmentPreferenceInput === 'neutro'
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className="font-semibold text-foreground block">De forma neutra</span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          evitar palavras marcadas por gênero
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTreatmentPreferenceInput('outro')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          treatmentPreferenceInput === 'outro'
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 bg-card hover:border-primary/40'
                        }`}
                      >
                        <span className="font-semibold text-foreground block">De outro modo</span>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          abre o campo de texto livre
                        </span>
                      </button>
                    </div>
                  </div>

                  {treatmentPreferenceInput === 'outro' && (
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-medium text-foreground">
                        Descreva como prefere o tratamento:
                      </Label>
                      <Input
                        placeholder="Ex.: prefiro ser chamada pelo nome próprio sem adjetivos..."
                        value={treatmentCustomInput}
                        onChange={(e) => setTreatmentCustomInput(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveTreatmentPreference}
                      disabled={savingTreatmentPreference}
                      className="text-xs h-8 px-4 gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {savingTreatmentPreference ? 'Guardando...' : 'Salvar Preferência'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Seção expansível: Entenda como funciona o CER */}
            <Collapsible className="border border-border/60 rounded-lg bg-muted/20 overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 sm:p-5 h-auto hover:bg-muted/30 text-left font-serif font-semibold text-base text-foreground rounded-none"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span>Entenda como funciona o CER</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-5 sm:px-5 space-y-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                <p>
                  O Método CER nasceu da união de muitos anos de estudo, experiência profissional e
                  da minha própria trajetória de vida. Ao longo desse caminho, compreendi que o
                  desenvolvimento humano se torna mais possível quando passamos por três movimentos:
                  Conscientizar, Equilibrar e Realizar.
                </p>

                <p>
                  Na Consciência, vamos conhecer como você funciona de maneira integral: em seu
                  corpo, pensamentos, emoções, padrões de resposta, relações, intimidade, valores e
                  formas de se conectar com a vida. Também vamos reconhecer seus recursos,
                  necessidades e aquilo que você deseja cuidar ou desenvolver.
                </p>

                <p>
                  No Equilíbrio, vamos compreender e cuidar dos processos físicos, mentais e
                  emocionais que dificultam suas ações. Para isso, poderemos utilizar diferentes
                  práticas e recursos, sempre respeitando seu momento, seus limites e o que
                  realmente faz sentido para você.
                </p>

                <p>
                  Na Realização, transformaremos essa compreensão em escolhas e passos possíveis.
                  Vamos reconhecer a direção que você deseja seguir, as mudanças que quer construir
                  e os hábitos que podem ajudá-la a levar esse cuidado para a sua vida. A proposta é
                  criar uma rotina firme o suficiente para sustentar seus objetivos e confortável o
                  suficiente para ser vivida.
                </p>

                <p>
                  Ao longo do caminho, a área Evolução ajudará você a reconhecer sua história,
                  perceber como está agora e acompanhar as mudanças que vão acontecendo — sem pressa
                  e sem a obrigação de ter todas as respostas.
                </p>

                <p>
                  Este aplicativo pode acompanhar atendimentos individuais e também experiências ou
                  cursos de desenvolvimento pessoal. As áreas disponíveis dependerão do percurso que
                  estivermos realizando.
                </p>

                <p>
                  Seu acesso é pessoal. Nas experiências e questionários que fazem parte do
                  acompanhamento individual, suas respostas e resultados poderão chegar ao seu
                  prontuário profissional para que eu possa compreender seu momento e acompanhá-la
                  com mais cuidado. O aplicativo sempre deverá indicar claramente o que está privado
                  e o que será enviado.
                </p>

                <div className="space-y-2 pt-1">
                  <p className="font-medium text-foreground">
                    Ao longo da jornada, e conforme forem adequadas ao momento do acompanhamento,
                    você também poderá encontrar:
                  </p>
                  <ul className="space-y-1.5 pl-3 border-l-2 border-primary/30">
                    <li>
                      <strong className="text-foreground">Meu Mapa CER:</strong> uma síntese
                      integrativa construída a partir do seu percurso, revisada por mim e
                      compartilhada com você.
                    </li>
                    <li>
                      <strong className="text-foreground">Mandala do Cuidado:</strong> uma visão de
                      como suas prioridades, recursos, práticas e movimentos estão se organizando no
                      cotidiano.
                    </li>
                    <li>
                      <strong className="text-foreground">Planner:</strong> um espaço para
                      transformar os cuidados combinados em passos possíveis na sua rotina.
                    </li>
                    <li>
                      <strong className="text-foreground">Experimentos de Cuidado:</strong> práticas
                      e recursos escolhidos para o seu momento, sem cobrança por desempenho.
                    </li>
                    <li>
                      <strong className="text-foreground">Meu Caderno:</strong> um espaço pessoal
                      para registrar percepções por texto ou voz. O que estiver no Caderno
                      permanecerá privado. Caso queira levar algo para o nosso encontro, haverá uma
                      ação separada e explícita para compartilhar um recado comigo.
                    </li>
                  </ul>
                  <p className="text-[11px] text-muted-foreground/90 italic pt-1">
                    Algumas dessas ferramentas aparecerão somente quando estiverem disponíveis e
                    forem adequadas à etapa da sua jornada.
                  </p>
                </div>

                <p className="pt-1">
                  Se tiver dúvidas sobre o aplicativo ou sobre o acompanhamento, você pode falar
                  comigo pelo WhatsApp: (49) 99194-6800.
                </p>

                <p>
                  Em uma situação urgente, envie-me uma mensagem direta, mas procure também um
                  atendimento imediato na sua região, pois nem sempre estarei disponível para
                  responder no mesmo momento.
                </p>

                <p>
                  Sinta que este é um espaço de acolhimento para você. Aqui há lugar para reconhecer
                  sua força, crescer e desenvolver aquilo que deseja — e também para acolher suas
                  vulnerabilidades com respeito. Não precisamos escolher entre força e
                  vulnerabilidade: ambas fazem parte de quem somos.
                </p>

                <div className="pt-2 font-serif text-foreground">
                  <p>Com carinho,</p>
                  <p className="font-semibold">Daia</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Três orientações */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                  Orientações importantes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                    <span className="font-semibold text-foreground block">
                      Responda no seu ritmo
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed block">
                      Você pode começar agora, salvar como rascunho e voltar quando quiser.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                    <span className="font-semibold text-foreground block">
                      Você escolhe quando enviar
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed block">
                      Enquanto estiver como rascunho, ${PROFESSIONAL_DISPLAY_NAME} não verá suas
                      respostas. Elas só serão compartilhadas quando você clicar em &ldquo;Enviar
                      para ${PROFESSIONAL_DISPLAY_NAME}&rdquo;.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                    <span className="font-semibold text-foreground block">
                      O que acontece depois
                    </span>
                    <span className="text-muted-foreground text-[11px] leading-relaxed block">
                      ${PROFESSIONAL_DISPLAY_NAME} utilizará suas respostas para preparar o primeiro
                      encontro. Depois do envio, você poderá seguir para a área Consciência.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seu Espaço Inicial de Acolhimento */}
            <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
              <CardHeader className="pb-3 border-b border-primary/10">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-primary" />
                      <span>Seu Espaço Inicial de Acolhimento</span>
                    </CardTitle>
                    <div className="text-xs space-y-1 pt-0.5">
                      <p className="font-bold text-foreground">Antes do nosso primeiro encontro</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Conte o que você considera importante para que ${PROFESSIONAL_DISPLAY_NAME}{' '}
                        conheça um pouco do seu momento. Não existem respostas certas, e você não
                        precisa contar algo que ainda não sinta segurança para compartilhar. Você
                        pode salvar e continuar depois.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
                    Privado por padrão
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {intakeSubmittedMessage ? (
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-300 text-emerald-950 dark:text-emerald-100 text-xs space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="font-serif text-base">Pré-consulta enviada</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 whitespace-pre-line font-sans">
                        Agora você já pode acessar o próximo passo:{' '}
                        <strong className="text-foreground">Consciência</strong>. Nessa etapa, você
                        encontrará as seis dimensões do Ser Integral e poderá responder às
                        avaliações no seu ritmo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                      <Button
                        size="sm"
                        onClick={() => setActivePhase('consciencia')}
                        className="text-xs h-8 px-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <span>Acessar Consciência</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIntakeSubmittedMessage(null)}
                        className="text-xs h-8 text-muted-foreground hover:text-foreground"
                      >
                        Escrever outro relato
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Pergunta 1 */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        O que motivou sua busca por cuidado e desenvolvimento neste momento?
                      </label>
                      <Textarea
                        placeholder="Conte com suas palavras o que a fez procurar este acompanhamento..."
                        value={initialIntakeWhatBrings}
                        onChange={(e) => setInitialIntakeWhatBrings(e.target.value)}
                        className="text-xs min-h-[75px] resize-y"
                      />
                    </div>

                    {/* Pergunta 2 */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        O que você já reconhece como apoio, recurso ou fonte de cuidado quando
                        precisa?
                      </label>
                      <Textarea
                        placeholder="Coisas simples ou pessoas que já trazem alívio ou sustentação..."
                        value={initialIntakeWhatHelps}
                        onChange={(e) => setInitialIntakeWhatHelps(e.target.value)}
                        className="text-xs min-h-[75px] resize-y"
                      />
                    </div>

                    {/* Pergunta 3 */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        Se pudesse escolher algo para cuidar ou desenvolver ao longo desta jornada,
                        o que seria?
                      </label>
                      <Textarea
                        placeholder="O que no seu ritmo, corpo ou sentimentos pede atenção agora..."
                        value={initialIntakeWhatCares}
                        onChange={(e) => setInitialIntakeWhatCares(e.target.value)}
                        className="text-xs min-h-[75px] resize-y"
                      />
                    </div>

                    {/* Ações Explícitas: Rascunho vs Enviar para Daiane */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground italic">
                        Nada é compartilhado sem seu comando explícito.
                      </span>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSaveIntakeDraft}
                          disabled={intakeSavingDraft || intakeSending}
                          className="text-xs h-8"
                        >
                          {intakeSavingDraft ? 'Guardando rascunho...' : 'Salvar Rascunho'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSendIntakeToDaiane}
                          disabled={intakeSavingDraft || intakeSending}
                          className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>
                            {intakeSending
                              ? 'Enviando...'
                              : `Enviar para ${PROFESSIONAL_DISPLAY_NAME}`}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orientação do próximo passo (conduzir à fase Consciência) */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground text-xs block">
                    {hasSentIntakeOnce
                      ? 'Próximo passo disponível'
                      : 'Pronto para o próximo passo?'}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {hasSentIntakeOnce
                      ? 'Nessa etapa, você encontrará as seis dimensões do Ser Integral e poderá responder às avaliações no seu ritmo.'
                      : 'Depois de enviar seu relato, explore a fase de Consciência para reconhecer seu momento nas seis dimensões.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActivePhase('consciencia')}
                  className="text-xs h-8 px-3 gap-1.5 shrink-0"
                >
                  <span>Acessar Consciência</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>

            {/* Bloco compacto: Meu perfil */}
            <Collapsible className="border border-border/60 rounded-lg bg-card shadow-none overflow-hidden">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 h-auto hover:bg-muted/30 text-left text-xs text-foreground font-medium rounded-none"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="font-semibold">Meu perfil</span>
                    <span className="text-muted-foreground font-normal">
                      · {person?.full_name || 'Registro em estruturação'}
                    </span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 sm:px-5 border-t border-border/40 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-muted/20 border border-border/40 space-y-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3 h-3 text-primary" />
                        Identidade e Tratamento
                      </span>
                      <p className="font-medium text-foreground">
                        {person?.preferred_name
                          ? `${person.preferred_name} (${person.full_name})`
                          : person?.full_name || 'Registro em estruturação'}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {person?.email || user?.email}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-border/40 space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Nome preferido:</Label>
                        <Input
                          value={preferredNameInput}
                          onChange={(e) => setPreferredNameInput(e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Como prefere ser chamada..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Forma de tratamento:
                        </Label>
                        <select
                          value={treatmentPreferenceInput}
                          onChange={(e) =>
                            setTreatmentPreferenceInput(e.target.value as TreatmentPreference)
                          }
                          className="w-full text-xs h-7 rounded border border-input bg-background px-2"
                        >
                          <option value="neutro">
                            De forma neutra (evitar marcação de gênero)
                          </option>
                          <option value="feminino">No feminino (acolhida, juntas)</option>
                          <option value="masculino">No masculino (acolhido, juntos)</option>
                          <option value="outro">De outro modo (personalizado)</option>
                        </select>
                      </div>
                      {treatmentPreferenceInput === 'outro' && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">
                            Especificação:
                          </Label>
                          <Input
                            value={treatmentCustomInput}
                            onChange={(e) => setTreatmentCustomInput(e.target.value)}
                            className="h-7 text-xs"
                            placeholder="Como prefere o tratamento..."
                          />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveTreatmentPreference}
                        disabled={savingTreatmentPreference}
                        className="w-full text-xs h-7 mt-1"
                      >
                        {savingTreatmentPreference ? 'Salvando...' : 'Atualizar preferência'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Compass className="w-3 h-3 text-primary" />
                      Modalidade de cuidado
                    </span>
                    <p className="font-medium text-foreground">
                      {enrollment?.expand?.product_id?.name || 'Acompanhamento Individual CER'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>Vínculo:</span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] h-4 px-1.5 capitalize font-normal"
                      >
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Início:{' '}
                      {enrollment?.created
                        ? new Date(enrollment.created).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-primary" />
                      Etapa atual
                    </span>
                    <p className="font-medium text-foreground capitalize">
                      {hasCompletedConsciousness
                        ? 'Transição e Planejamento'
                        : enrollment?.expand?.journey_states_via_enrollment_id?.[0]
                              ?.current_stage === 'consciousness'
                          ? 'Descoberta e Percepção'
                          : 'Acolhimento'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Status:{' '}
                      {hasCompletedConsciousness ? 'Aguardando próxima etapa' : 'Em andamento'}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic">
                      “O ser humano não funciona em partes.”
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* ========================================================
            FASE 2: CONSCIÊNCIA
           ======================================================== */}
        {activePhase === 'consciencia' && (
          <div className="space-y-6">
            {!hasSentIntakeOnce ? (
              /* ANTES do envio da pré-consulta: orientação central única em vez de 6 cartões bloqueados */
              <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <CardTitle className="font-serif text-lg text-foreground">
                    O primeiro passo começa no &ldquo;Comece aqui&rdquo;
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
                    Antes de abrir a exploração das seis dimensões, convidamos você a compartilhar
                    um breve relato inicial com {PROFESSIONAL_DISPLAY_NAME} na aba{' '}
                    <strong>&ldquo;Comece aqui&rdquo;</strong>. Assim que enviar seu relato, todas
                    as seis dimensões serão liberadas simultaneamente para você responder no seu
                    ritmo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-6 flex justify-center">
                  <Button
                    onClick={() => setActivePhase('comece_aqui')}
                    className="text-xs h-8 px-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <span>Ir para o Comece aqui</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Introdução da Consciência */}
                <Collapsible
                  defaultOpen
                  className="border border-border/60 rounded-lg bg-card shadow-sm overflow-hidden"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between p-4 sm:p-5 h-auto hover:bg-muted/30 text-left font-serif font-semibold text-base text-foreground rounded-none"
                    >
                      <span className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary shrink-0" />
                        <span>Consciência — descobrir como você funciona</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-5 sm:px-5 space-y-3 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                    <p>
                      Nesta etapa, vamos olhar para você como um ser inteiro. As seis dimensões
                      representam diferentes aspectos da sua experiência, mas elas não funcionam
                      separadamente: corpo, pensamentos, emoções, padrões de resposta, relações,
                      intimidade, valores e sentido se influenciam continuamente.
                    </p>
                    <p>
                      Clique em cada dimensão para acessar a experiência que estiver disponível. Não
                      existem respostas certas, e você não precisa concluir tudo de uma vez.
                      Responda no seu ritmo e registre apenas aquilo que fizer sentido compartilhar
                      neste momento.
                    </p>
                    <p>
                      No centro está o seu Mapa CER. Ele será construído aos poucos, a partir das
                      suas respostas, dos nossos encontros e da minha leitura profissional. O
                      aplicativo poderá ajudar a organizar informações, mas nenhuma conclusão será
                      publicada automaticamente. Antes de se tornar uma devolutiva, o Mapa será
                      revisado por mim e conversado com você.
                    </p>
                    <p>
                      O objetivo não é colocar você dentro de uma definição. É ajudar você a
                      reconhecer como funciona, quais recursos já possui, o que precisa de cuidado e
                      quais caminhos deseja construir.
                    </p>
                    <div className="pt-2 font-serif text-foreground">
                      <p>Com carinho,</p>
                      <p className="font-semibold">Daia</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* O Ser em Seis Dimensões + Centro "Meu Mapa CER" (única entrada para o mapa) */}
                <SerConscienciaMap
                  availableExperiences={availableExperiences}
                  hasPublishedMap={Boolean(currentMap)}
                  onSelectExperience={(expId) => setActiveExperienceId(expId)}
                  onOpenMap={() => setShowMapModal(true)}
                />

                {/* Modal / Dialog do Meu Mapa CER para a Interagente */}
                <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Meu Mapa CER</DialogTitle>
                      <DialogDescription>
                        {currentMap
                          ? 'Síntese integrativa deliberadamente compartilhada por Daiane com você.'
                          : 'Seu Mapa CER está em construção conjunta com Daiane.'}
                      </DialogDescription>
                    </DialogHeader>

                    {currentMap ? (
                      <ParticipantMapDisplay map={currentMap} />
                    ) : (
                      <div className="py-8 text-center space-y-3">
                        <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg max-w-md mx-auto text-xs leading-relaxed border border-amber-300">
                          <p className="font-medium text-sm mb-1">Mapa em construção</p>
                          O Mapa CER reúne o que você descobriu ao longo das experiências e é
                          revisado com carinho após seu primeiro encontro com Daiane.
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
            {/* Transição clara Pós-Consciência / Waiting State */}
            {hasCompletedConsciousness && assignments.length === 0 && (
              <Card className="border-primary/40 bg-gradient-to-r from-primary/5 via-card to-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Sparkles className="w-5 h-5" />
                    <span>Etapa de Descoberta Concluída</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p className="text-foreground font-medium text-sm">
                      Sua etapa de descoberta está concluída.
                    </p>
                    <p>
                      Sua profissional vai revisar o que você descobriu ao longo das experiências e
                      dos momentos de percepção.
                    </p>
                    <div className="p-3 rounded-lg bg-card border border-border/60 text-foreground italic">
                      “Na próxima etapa, vocês vão escolher juntas o que faz sentido cuidar agora.”
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivePhase('equilibrio')}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ir para Equilíbrio & Realização</span>
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Precisa de ajuda? Fale com sua profissional.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Percepções apresentadas para reflexão (BUILD 04C) */}
            {presentations.filter((p) => p.channel === 'app').length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Uma percepção para você olhar</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Compartilhamentos trazidos pela sua profissional para refletirmos juntas.
                  </p>
                </div>

                <div className="space-y-3">
                  {presentations
                    .filter((p) => p.channel === 'app')
                    .map((pres) => {
                      const existingPresRecog = selectedPresRecognitions[pres.id]
                      const currentType = existingPresRecog?.type
                      const currentComment = existingPresRecog?.comment || ''

                      const handleSavePresRecognition = async () => {
                        if (!currentType || !enrollment) return
                        setSubmittingPresRecog(pres.id)
                        try {
                          await cerParticipantRecognitionService.createRecognition({
                            enrollment_id: enrollment.id,
                            knowledge_item_id: pres.knowledge_item_id,
                            presentation_id: pres.id,
                            recognition_type: currentType,
                            comment: currentComment,
                          })
                          setSelectedPresRecognitions((prev) => ({
                            ...prev,
                            [pres.id]: {
                              ...prev[pres.id],
                              saved: true,
                            },
                          }))
                          toast({
                            title: 'Sua percepção foi acolhida',
                            description: 'Obrigada por compartilhar.',
                          })
                        } catch (e: unknown) {
                          toast({
                            title: 'Não conseguimos salvar agora',
                            description:
                              e instanceof Error ? e.message : 'Tente novamente em instantes.',
                            variant: 'destructive',
                          })
                        } finally {
                          setSubmittingPresRecog(null)
                        }
                      }

                      return (
                        <Card key={pres.id} className="border-primary/30 shadow-sm bg-card/70">
                          <CardHeader className="py-3 px-4 bg-primary/5 border-b border-primary/15">
                            <span className="text-[11px] font-medium text-primary uppercase">
                              Para conversarmos
                            </span>
                            <p className="text-foreground text-sm font-sans italic pt-1 leading-relaxed">
                              &ldquo;{pres.presentation_text}&rdquo;
                            </p>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <span className="text-xs font-medium text-foreground block">
                              Isso conversa com a sua experiência?
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {[
                                { value: 'makes_sense', label: 'Sim, me reconheço nisso.' },
                                {
                                  value: 'partially_makes_sense',
                                  label: 'Em parte. Tem mais coisa aí.',
                                },
                                { value: 'does_not_recognize', label: 'Não é bem assim para mim.' },
                                { value: 'depends_on_context', label: 'Depende da situação.' },
                                { value: 'wants_to_add', label: 'Quero contar um pouco mais.' },
                              ].map((opt) => (
                                <Button
                                  key={opt.value}
                                  type="button"
                                  variant={currentType === opt.value ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={existingPresRecog?.saved}
                                  onClick={() => {
                                    setSelectedPresRecognitions((prev) => ({
                                      ...prev,
                                      [pres.id]: {
                                        type: opt.value as RecognitionType,
                                        comment: prev[pres.id]?.comment || '',
                                        saved: false,
                                      },
                                    }))
                                  }}
                                  className="justify-start text-xs h-8 px-3 text-left font-normal"
                                >
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              placeholder="Quer contar mais sobre como isso se dá? (Opcional)"
                              value={currentComment}
                              disabled={existingPresRecog?.saved}
                              onChange={(e) => {
                                setSelectedPresRecognitions((prev) => ({
                                  ...prev,
                                  [pres.id]: {
                                    type: prev[pres.id]?.type || 'wants_to_add',
                                    comment: e.target.value,
                                    saved: false,
                                  },
                                }))
                              }}
                              className="text-xs min-h-[60px]"
                            />
                            {!existingPresRecog?.saved && currentType && (
                              <Button
                                size="sm"
                                disabled={submittingPresRecog === pres.id}
                                onClick={handleSavePresRecognition}
                                className="text-xs h-8 px-4"
                              >
                                {submittingPresRecog === pres.id
                                  ? 'Guardando...'
                                  : 'Compartilhar o que sinto'}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            FASE 3: EQUILÍBRIO & REALIZAÇÃO
           ======================================================== */}
        {activePhase === 'equilibrio' && (
          <div className="space-y-6">
            {/* Esclarecimento conceitual importante: Mandala vs Mapa CER */}
            <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground block mb-0.5">
                Acompanhamento Cotidiano com a Mandala & Plano
              </span>
              A <strong>Mandala</strong> acompanha o ritmo vivo do seu cuidado cotidiano, enquanto o{' '}
              <strong>Mapa CER</strong> traz a síntese integrativa estruturada das seis dimensões.
              Elas se complementam sem se substituir.
            </div>

            {/* Próximo Passo do Nosso Cuidado (Plano Compartilhado existente) */}
            {presentedCarePlans.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" />
                    <span>Próximo Passo do Nosso Cuidado</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Este plano e próximo passo foram compartilhados por Daiane. Você pode registrar
                    com leveza como isso soa para você agora.
                  </p>
                </div>

                <div className="space-y-4">
                  {presentedCarePlans.map((planPres) => {
                    const currentResp = selectedPlanResponses[planPres.id]
                    const currentType = currentResp?.response_type
                    const currentComment = currentResp?.shared_comment || ''
                    const isSaved = currentResp?.saved

                    const acceptanceOptions: {
                      value: OperationalAcceptanceResponseType
                      label: string
                    }[] = [
                      { value: 'accepted', label: 'consegui experimentar' },
                      { value: 'wants_to_try', label: 'quero tentar' },
                      { value: 'too_much', label: 'foi muito' },
                      { value: 'wants_to_talk', label: 'prefiro conversar' },
                    ]

                    return (
                      <Card
                        key={planPres.id}
                        className="border-primary/40 bg-card/80 backdrop-blur-sm shadow-sm"
                      >
                        <CardHeader className="py-3 px-4 bg-primary/5 border-b border-primary/15">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-semibold text-primary text-[11px] uppercase tracking-wider">
                              Plano Compartilhado por Daiane
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {planPres.presented_at
                                ? new Date(planPres.presented_at).toLocaleDateString('pt-BR')
                                : 'Recente'}
                            </span>
                          </div>
                          <h4 className="text-base font-serif font-medium text-foreground pt-1">
                            {planPres.participant_title || 'Próximo Passo Proposto'}
                          </h4>
                          {planPres.participant_summary && (
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                              {planPres.participant_summary}
                            </p>
                          )}
                          {planPres.practical_invitation && (
                            <div className="p-2.5 rounded bg-primary/10 border border-primary/20 text-xs text-foreground italic mt-2">
                              &ldquo;{planPres.practical_invitation}&rdquo;
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-foreground block">
                              Como você se sente em relação a este próximo passo?
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {acceptanceOptions.map((opt) => (
                                <Button
                                  key={opt.value}
                                  type="button"
                                  variant={currentType === opt.value ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={isSaved}
                                  onClick={() => {
                                    setSelectedPlanResponses((prev) => ({
                                      ...prev,
                                      [planPres.id]: {
                                        response_type: opt.value,
                                        shared_comment: prev[planPres.id]?.shared_comment || '',
                                        saved: false,
                                      },
                                    }))
                                  }}
                                  className="justify-start text-xs h-9 px-3 text-left font-normal"
                                >
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-medium text-muted-foreground">
                              Quer contar mais alguma percepção sobre esse próximo passo? (Opcional)
                            </label>
                            <Textarea
                              placeholder="Como você imagina tentar, o que pode facilitar ou dificultar..."
                              value={currentComment}
                              disabled={isSaved}
                              onChange={(e) => {
                                setSelectedPlanResponses((prev) => ({
                                  ...prev,
                                  [planPres.id]: {
                                    response_type:
                                      prev[planPres.id]?.response_type || 'wants_to_try',
                                    shared_comment: e.target.value,
                                    saved: false,
                                  },
                                }))
                              }}
                              className="text-xs min-h-[64px]"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                            <span className="text-[11px] text-muted-foreground italic">
                              {isSaved
                                ? '✓ Seu retorno foi acolhido e já está no prontuário de Daiane.'
                                : 'Sua resposta ajuda Daiane a calibrar o ritmo junto com você.'}
                            </span>
                            {!isSaved && currentType && (
                              <Button
                                size="sm"
                                disabled={submittingPlanResponse === planPres.id}
                                onClick={() => handleSaveOperationalAcceptance(planPres.id)}
                                className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                {submittingPlanResponse === planPres.id
                                  ? 'Enviando...'
                                  : 'Enviar retorno para Daiane'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-border/80 bg-muted/10">
                <CardContent className="py-6 text-center space-y-1.5">
                  <Compass className="w-6 h-6 text-muted-foreground mx-auto opacity-50" />
                  <span className="font-medium text-xs text-foreground block">
                    Nenhum plano compartilhado ainda
                  </span>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Quando você e sua profissional combinarem as direções de cuidado, o plano e os
                    próximos passos aparecerão aqui para seu retorno.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Experimentos de Cuidado combinados */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Experimentos de Cuidado</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Práticas combinadas para o seu momento, com foco na experiência e sem notas de
                    desempenho.
                  </p>
                </div>
                {assignments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {assignments.filter((a) => a.status === 'active').length} ativo(s)
                  </Badge>
                )}
              </div>

              {assignments.length > 0 ? (
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
              ) : (
                <EmptyState
                  variant="experiments"
                  title="Experimentos combinados"
                  description="Os experimentos aparecem depois que algo for combinado com sua profissional."
                  actionLabel="Ver detalhes na página de experimentos"
                  onAction={() => navigate('/experimentos')}
                />
              )}
            </div>

            {/* Mandala Estruturada */}
            {enrollment && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" />
                      <span>Sua Mandala de Cuidado Cotidiano</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Acompanhamento cíclico e dinâmico de práticas e recursos.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mandala')}
                    className="text-xs h-7 gap-1"
                  >
                    <span>Página Completa</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
                <MandalaStructuredView enrollmentId={enrollment.id} onRefreshRequested={loadData} />
              </div>
            )}

            {/* Planner da Semana */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Janela do Planner de Cuidados</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Momentos e recursos organizados para apoiar seu ritmo.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/planner')}
                  className="text-xs h-7 gap-1"
                >
                  <span>Abrir Planner</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>

              {plannerItems.filter((p) => p.status !== 'cancelled').length > 0 ? (
                <div className="space-y-2">
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
                          <CardContent className="p-3.5 flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    isCompleted
                                      ? 'line-through text-muted-foreground'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {item.safe_title}
                                </span>
                                <Badge variant="secondary" className="text-[10px] uppercase">
                                  {isContextual
                                    ? 'Recurso Disponível'
                                    : item.daypart || 'Dia a dia'}
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
              ) : (
                <EmptyState
                  variant="planner"
                  title="Janela de práticas"
                  description="Ainda não há nenhum experimento combinado para este momento."
                  actionLabel="Abrir página completa do Planner"
                  onAction={() => navigate('/planner')}
                />
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            FASE 4: EVOLUÇÃO
           ======================================================== */}
        {activePhase === 'evolucao' && (
          <div className="space-y-6">
            {/* Como estou agora? (a partir de informações JÁ registradas, sem novos questionários) */}
            <Card className="border-border/70 bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-3 border-b border-border/40">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
                  Síntese Viva
                </span>
                <CardTitle className="font-serif font-semibold text-base text-foreground">
                  Como estou agora?
                </CardTitle>
                <CardDescription className="text-xs">
                  Leitura reflexiva construída a partir do que você já registrou no seu
                  acompanhamento (sem a necessidade de responder a novos questionários).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-muted-foreground text-[11px] block">
                      Experiências Vivas
                    </span>
                    <span className="text-lg font-bold font-serif text-foreground">
                      {availableExperiences.filter((e) => e.release_status === 'completed').length}{' '}
                      de {availableExperiences.length}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Momentos de percepção concluídos
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-muted-foreground text-[11px] block">
                      Experimentos Práticos
                    </span>
                    <span className="text-lg font-bold font-serif text-foreground">
                      {
                        assignments.filter(
                          (a) =>
                            a.status === 'completed' || a.participant_response_type === 'confirmed',
                        ).length
                      }{' '}
                      de {assignments.length}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Práticas acolhidas no cotidiano
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-border/60 bg-card space-y-1">
                    <span className="text-muted-foreground text-[11px] block">
                      Retornos do Cuidado
                    </span>
                    <span className="text-lg font-bold font-serif text-foreground">
                      {
                        Object.keys(selectedPlanResponses).filter(
                          (k) => selectedPlanResponses[k].saved,
                        ).length
                      }
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Aceites operacionais compartilhados
                    </p>
                  </div>
                </div>

                {/* Percepção consolidada */}
                <div className="p-3.5 rounded-lg bg-card border border-primary/20 text-xs text-foreground space-y-1">
                  <span className="font-semibold text-primary block">Ritmo do Cuidado</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Seu processo está vivo. Cada registro permite que Daiane refine as prioridades e
                    respeite os limites e possibilidades do seu corpo e da sua rotina.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Revisões de Ciclo (Convite existente e histórico) */}
            <Card className="border-border/60">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="font-serif font-semibold text-base text-foreground flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  <span>Revisões de Ciclo</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Momentos combinados com a profissional para olhar para trás, pausar e calibrar as
                  próximas direções.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3">
                {activeReviewInvite ? (
                  <div className="p-4 rounded-xl border border-primary/40 bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground text-sm block">
                        Você tem uma revisão de ciclo aberta
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Sua profissional enviou um convite para você compartilhar suas percepções
                        sobre este ciclo.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/reviews/${activeReviewInvite.cycleId}`)}
                      className="text-xs h-8 px-4 shrink-0 gap-1.5"
                    >
                      <span>Responder Revisão</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/40 text-xs text-muted-foreground text-center">
                    Nenhuma revisão de ciclo pendente no momento. As revisões são abertas pela
                    profissional ao final de cada ciclo de acompanhamento.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Direções Futuras & Recursos em Construção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-dashed border-border/70 bg-muted/10">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-sm text-foreground">
                      Linha da Vida & Minha História
                    </span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Quando disponível
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A reconstituição longitudinal da sua história de vida e dos marcos biográficos
                    será integrada aqui quando o recurso estiver disponível na plataforma.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-border/70 bg-muted/10">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-sm text-foreground">
                      Direções Futuras do Cuidado
                    </span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Quando disponível
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Projeção e sustentação a longo prazo após consolidação dos ciclos de cuidado e
                    da autonomia no cotidiano.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modal / Visão em Tela Cheia do Experience Engine */}
        {activeExperienceId && enrollment && user?.id && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex flex-col justify-start">
            <ExperienceEngine
              experienceId={activeExperienceId}
              enrollmentId={enrollment.id}
              respondentUserId={user.id}
              treatmentVariant={
                person?.treatment_preference === 'feminino' ||
                person?.treatment_preference === 'masculino' ||
                person?.treatment_preference === 'neutro' ||
                person?.treatment_preference === 'outro'
                  ? person.treatment_preference
                  : 'neutro'
              }
              onClose={() => {
                setActiveExperienceId(null)
                loadData()
              }}
              onCompleted={() => {
                loadData()
              }}
            />
          </div>
        )}

        {/* CER V1 — Caderno Privado & Recados para a Próxima Sessão (Gated em features.ts) */}
        {cadernoEnabled && enrollment && (
          <div className="space-y-4">
            <CadernoSection
              enrollmentId={enrollment.id}
              interagenteName={person?.preferred_name || person?.full_name || user?.name}
            />
          </div>
        )}
      </main>
    </div>
  )
}
export default InteragenteHome
