import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { enrollmentExperienceService, featureFlagService } from '@/services/experienceEngine'
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
} from '@/types/cer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
} from 'lucide-react'
import { ExperienceEngine } from '@/components/experience'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'
import { cerMapService } from '@/services/cerMapService'
import { cerPracticeAssignmentService } from '@/services/cerPracticeAssignmentService'
import { cerPlannerService } from '@/services/cerPlannerService'
import { ExperimentCard } from '@/components/ExperimentCard'
import { MandalaStructuredView } from '@/components/MandalaStructuredView'
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
  const [assignments, setAssignments] = useState<CerPracticeAssignmentRecord[]>([])
  const [plannerItems, setPlannerItems] = useState<CerPlannerItemRecord[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeReviewInvite, setActiveReviewInvite] = useState<{ cycleId: string } | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    if (!person?.id) {
      setLoading(false)
      return
    }

    try {
      const [activeEnr, isFlagActive] = await Promise.all([
        enrollmentService.getByPersonId(person.id),
        featureFlagService.isEnabled('experience_engine'),
      ])

      setEnrollment(activeEnr)
      setEngineEnabled(isFlagActive)

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
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [person])

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

        {/* Identidade e Acolhimento Humano (Clean Tech Copy) */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Olá, {person?.preferred_name || person?.full_name || 'Interagente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Este é o seu espaço de acompanhamento contínuo no CER.
          </p>
        </div>

        {/* Informações da Identidade Humana — Tech Copy Cleanup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Seu Perfil</span>
              </div>
              <CardTitle className="text-base font-medium">
                {person?.full_name || 'Registro em estruturação'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>E-mail: {person?.email || user?.email}</p>
              <p className="text-[11px] text-muted-foreground">Acompanhamento ativo e seguro</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Modalidade de Cuidado</span>
              </div>
              <CardTitle className="text-base font-medium">
                {enrollment?.expand?.product_id?.name || 'Acompanhamento Individual CER'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>Vínculo:</span>
                <Badge variant="secondary" className="text-[10px] capitalize font-normal">
                  Ativo
                </Badge>
              </div>
              <p>
                Início:{' '}
                {enrollment?.created
                  ? new Date(enrollment.created).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Etapa Atual</span>
              </div>
              <CardTitle className="text-base font-medium capitalize">
                {hasCompletedConsciousness
                  ? 'Transição e Planejamento'
                  : enrollment?.expand?.journey_states_via_enrollment_id?.[0]?.current_stage ===
                      'consciousness'
                    ? 'Descoberta e Percepção'
                    : 'Acolhimento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>
                Status:{' '}
                <span className="capitalize">
                  {hasCompletedConsciousness ? 'Aguardando próxima etapa' : 'Em andamento'}
                </span>
              </p>
              <p className="text-[11px] italic">“O ser humano não funciona em partes.”</p>
            </CardContent>
          </Card>
        </div>

        {/* Itens 16-17: Transição clara Pós-Consciência / Waiting State */}
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
                  Sua profissional vai revisar o que você descobriu ao longo das experiências e dos
                  momentos de percepção.
                </p>
                <div className="p-3 rounded-lg bg-card border border-border/60 text-foreground italic">
                  “Na próxima etapa, vocês vão escolher juntas o que faz sentido cuidar agora.”
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/mandala')}
                  className="text-xs h-8 gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Ver minha Mandala</span>
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Precisa de ajuda? Fale com sua profissional.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BUILD 06: Meu Mapa CER — Síntese Viva e Reconhecível */}
        {currentMap && (
          <div className="space-y-4">
            <ParticipantMapDisplay map={currentMap} />
          </div>
        )}

        {/* BUILD 02: Banner de Experiência Disponível (UX da Interagente) */}
        {engineEnabled && enrollment && !activeExperienceId && (
          <div className="space-y-4">
            {availableExperiences
              .filter(
                (ee) =>
                  ee.release_status === 'available' ||
                  ee.release_status === 'in_progress' ||
                  ee.release_status === 'completed',
              )
              .map((ee) => {
                const exp = ee.expand?.experience_id
                const isCompleted = ee.release_status === 'completed'
                const isInProgress = ee.release_status === 'in_progress'

                return (
                  <Card
                    key={ee.id}
                    className="border-primary/40 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm hover:border-primary/60 transition-all duration-200"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-primary" />
                          <Badge variant="outline" className="text-[10px] uppercase font-normal">
                            {isCompleted
                              ? 'Experiência Concluída'
                              : isInProgress
                                ? 'Em Andamento'
                                : 'Nova Experiência Disponível'}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            Momento {ee.current_step_order || 1}
                          </span>
                        </div>

                        <h2 className="text-lg font-serif font-semibold text-foreground">
                          {exp?.title || 'Conhecendo meu momento'}
                        </h2>

                        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                          {exp?.subtitle ||
                            'Uma breve pausa para você se perceber e reconhecer seu ritmo de hoje.'}
                        </p>
                      </div>

                      <Button
                        onClick={() => setActiveExperienceId(ee.experience_id)}
                        className="text-xs gap-1.5 shrink-0 self-start sm:self-center h-9 px-4"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isCompleted
                            ? 'Revisitar Experiência'
                            : isInProgress
                              ? 'Continuar de onde parei'
                              : 'Abrir Experiência'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )}

        {/* BUILD 04C: Uma percepção para você olhar (Knowledge Presentations Apresentadas no App) */}
        {presentations.filter((p) => p.channel === 'app').length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Uma percepção para você olhar</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compartilhamentos trazidos com carinho pela sua profissional para refletirmos
                juntas. Sua resposta ajuda a guiar o nosso diálogo.
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
                        description:
                          'Obrigada por compartilhar. Isso ajuda a calibrar nosso diálogo.',
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
                    <Card
                      key={pres.id}
                      className="border-primary/30 shadow-sm bg-card/70 backdrop-blur-sm"
                    >
                      <CardHeader className="py-3.5 px-4 bg-primary/5 border-b border-primary/15">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-primary text-[11px] tracking-wide uppercase">
                            Para conversarmos
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {pres.presented_at
                              ? new Date(pres.presented_at).toLocaleDateString('pt-BR')
                              : 'Recente'}
                          </span>
                        </div>
                        <p className="text-foreground text-sm font-sans italic pt-1.5 leading-relaxed text-balance">
                          &ldquo;{pres.presentation_text}&rdquo;
                        </p>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
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
                              {
                                value: 'does_not_recognize',
                                label: 'Não é bem assim para mim.',
                              },
                              {
                                value: 'depends_on_context',
                                label: 'Depende muito da situação.',
                              },
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
                                className="justify-start text-xs h-9 px-3 text-left font-normal"
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Campo para quer contar mais */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Quer contar um pouco mais sobre como isso se dá no seu dia a dia?
                            (Opcional)
                          </label>
                          <Textarea
                            placeholder="Escreva livremente aqui..."
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
                            className="text-xs min-h-[64px]"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                          <span className="text-[11px] text-muted-foreground italic">
                            {existingPresRecog?.saved
                              ? '✓ Sua percepção foi guardada com carinho e servirá de guia.'
                              : 'O que você responde aqui complementa nossa conversa, sem rotular nada.'}
                          </span>
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
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        )}

        {/* BUILD 03B: Reconhecimento da Participante Legado (Percepções em Construção) */}
        {knowledgeItems.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Percepções em Construção</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reflexões sobre o que fomos notando ao longo da sua jornada. Nenhuma delas é uma
                conclusão fechada sobre você — são pistas para conversarmos.
              </p>
            </div>

            <div className="space-y-3">
              {knowledgeItems.map((ki) => {
                const existingRecog = selectedRecognitions[ki.id]
                const currentType = existingRecog?.type
                const currentComment = existingRecog?.comment || ''

                const handleSaveRecognition = async () => {
                  if (!currentType || !enrollment) return
                  setSubmittingRecog(ki.id)
                  try {
                    await cerParticipantRecognitionService.createRecognition({
                      enrollment_id: enrollment.id,
                      knowledge_item_id: ki.id,
                      recognition_type: currentType,
                      comment: currentComment,
                    })
                    setSelectedRecognitions((prev) => ({
                      ...prev,
                      [ki.id]: {
                        ...prev[ki.id],
                        saved: true,
                      },
                    }))
                    toast({
                      title: 'Sua percepção foi acolhida',
                      description: 'Obrigada por compartilhar. Isso ajuda a calibrar nosso olhar.',
                    })
                  } catch (e: unknown) {
                    toast({
                      title: 'Não conseguimos salvar agora',
                      description: e instanceof Error ? e.message : 'Tente novamente em instantes.',
                      variant: 'destructive',
                    })
                  } finally {
                    setSubmittingRecog(null)
                  }
                }

                return (
                  <Card
                    key={ki.id}
                    className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm"
                  >
                    <CardHeader className="py-3.5 px-4 bg-muted/15 border-b border-border/30">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground text-[11px] tracking-wide uppercase">
                          Olhando mais de perto
                        </span>
                        <span className="text-[11px] text-muted-foreground">Revisão no tempo</span>
                      </div>
                      <p className="text-foreground text-sm font-serif italic pt-1.5 leading-relaxed text-balance">
                        &ldquo;{ki.statement}&rdquo;
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-foreground block">
                          Isso conversa com a sua experiência?
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { value: 'makes_sense', label: 'Sim, me reconheço nisso' },
                            {
                              value: 'partially_makes_sense',
                              label: 'Em parte. Tem mais coisa aí',
                            },
                            { value: 'does_not_recognize', label: 'Não é bem assim para mim' },
                            { value: 'depends_on_context', label: 'Depende muito da situação' },
                            { value: 'wants_to_add', label: 'Quero contar um pouco mais' },
                          ].map((opt) => (
                            <Button
                              key={opt.value}
                              type="button"
                              variant={currentType === opt.value ? 'default' : 'outline'}
                              size="sm"
                              disabled={existingRecog?.saved}
                              onClick={() => {
                                setSelectedRecognitions((prev) => ({
                                  ...prev,
                                  [ki.id]: {
                                    type: opt.value as RecognitionType,
                                    comment: prev[ki.id]?.comment || '',
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

                      {/* Campo opcional humanizado: Quer acrescentar algo? */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Quer contar um pouco mais sobre como isso se dá no seu dia a dia?
                          (Opcional)
                        </label>
                        <Textarea
                          placeholder="Ex.: momentos em que isso acontece com mais frequência, o que ajuda quando pesa..."
                          value={currentComment}
                          disabled={existingRecog?.saved}
                          onChange={(e) => {
                            setSelectedRecognitions((prev) => ({
                              ...prev,
                              [ki.id]: {
                                type: prev[ki.id]?.type || 'wants_to_add',
                                comment: e.target.value,
                                saved: false,
                              },
                            }))
                          }}
                          className="text-xs min-h-[64px]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground italic">
                          {existingRecog?.saved
                            ? '✓ Sua percepção foi guardada com carinho e servirá de guia.'
                            : 'O que você responde aqui complementa nossa conversa, sem rotular nada.'}
                        </span>
                        {!existingRecog?.saved && currentType && (
                          <Button
                            size="sm"
                            disabled={submittingRecog === ki.id}
                            onClick={handleSaveRecognition}
                            className="text-xs h-8 px-4"
                          >
                            {submittingRecog === ki.id
                              ? 'Guardando...'
                              : 'Compartilhar o que sinto'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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

        {/* Experimentos de Cuidado */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Experimentos de Cuidado</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vamos experimentar isso juntos? Práticas desenhadas para o seu momento, sem cobrança
                ou notas de desempenho.
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
              {assignments.map((asgn) => {
                return (
                  <ExperimentCard
                    key={asgn.id}
                    assignment={asgn}
                    onConfirm={handleConfirmExperiment}
                    onResponseRecorded={loadData}
                  />
                )
              })}
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
            <MandalaStructuredView enrollmentId={enrollment.id} onRefreshRequested={loadData} />
          </div>
        )}

        {/* Planner Mínimo da Semana */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Janela do Planner de Cuidados</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Próximos momentos e recursos disponíveis para apoiar o seu ritmo diário.
              </p>
            </div>
            {plannerItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {plannerItems.filter((p) => p.status !== 'cancelled').length} momento(s)
              </Badge>
            )}
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

        {/* Estado Real do Vínculo e Acompanhamento — Clean Tech Copy */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span>Vínculo de Acompanhamento</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Informações sobre seu acompanhamento ativo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground">Carregando dados do vínculo...</p>
            ) : enrollment ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Acompanhamento
                      </span>
                      <span className="font-medium text-foreground">
                        {enrollment.expand?.product_id?.name || 'Acompanhamento Individual CER'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Status do Cuidado
                      </span>
                      <span className="font-medium text-foreground capitalize">Ativo</span>
                    </div>
                  </div>

                  {enrollment.notes && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-muted-foreground block text-[11px]">
                        Combinados iniciais
                      </span>
                      <p className="text-foreground text-xs">{enrollment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/15">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Privacidade respeitada: suas percepções íntimas permanecem resguardadas e sob
                    seu controle.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhum acompanhamento ativo encontrado para este perfil.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Precisa de ajuda? Fale com sua profissional para receber a liberação do seu
                  espaço.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
export default InteragenteHome
