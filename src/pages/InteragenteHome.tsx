import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import { enrollmentExperienceService, featureFlagService } from '@/services/experienceEngine'
import { cerKnowledgeItemService, cerParticipantRecognitionService } from '@/services/cerKnowledge'
import type {
  EnrollmentRecord,
  EnrollmentExperienceRecord,
  CerKnowledgeItemRecord,
  RecognitionType,
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
} from 'lucide-react'
import { ExperienceEngine } from '@/components/experience'

export const InteragenteHome: React.FC = () => {
  const { user, person, logout } = useAuth()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [engineEnabled, setEngineEnabled] = useState(true)
  const [availableExperiences, setAvailableExperiences] = useState<EnrollmentExperienceRecord[]>([])
  const [activeExperienceId, setActiveExperienceId] = useState<string | null>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<CerKnowledgeItemRecord[]>([])
  const [selectedRecognitions, setSelectedRecognitions] = useState<
    Record<string, { type: RecognitionType; comment: string; saved: boolean }>
  >({})
  const [submittingRecog, setSubmittingRecog] = useState<string | null>(null)
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
        const [exps, kiList, myRecogs] = await Promise.all([
          enrollmentExperienceService.listByEnrollment(activeEnr.id),
          cerKnowledgeItemService.listByEnrollment(activeEnr.id),
          cerParticipantRecognitionService.listByEnrollment(activeEnr.id),
        ])
        setAvailableExperiences(exps)
        setKnowledgeItems(kiList)

        const recogMap: Record<string, { type: RecognitionType; comment: string; saved: boolean }> =
          {}
        for (const r of myRecogs) {
          recogMap[r.knowledge_item_id] = {
            type: r.recognition_type,
            comment: r.comment || '',
            saved: true,
          }
        }
        setSelectedRecognitions(recogMap)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do interagente:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [person])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Provisório */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight">CER</span>
            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
              Interagente
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
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
        {/* Identidade e Acolhimento */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Olá, {person?.preferred_name || person?.full_name || 'Interagente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Este é o seu espaço de acompanhamento contínuo no CER.
          </p>
        </div>

        {/* Informações da Identidade Humana (PERSON) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Identidade (PERSON)</span>
              </div>
              <CardTitle className="text-base font-medium">
                {person?.full_name || 'Registro em estruturação'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>E-mail: {person?.email || user?.email}</p>
              <p>
                ID Humano: <span className="font-mono text-[10px]">{person?.id || '—'}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Produto & Modalidade</span>
              </div>
              <CardTitle className="text-base font-medium">
                {enrollment?.expand?.product_id?.name || 'Acompanhamento Individual CER'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant="secondary" className="text-[10px] capitalize font-normal">
                  {enrollment?.status || 'invited'}
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
                <span>Estado da Jornada</span>
              </div>
              <CardTitle className="text-base font-medium capitalize">
                {enrollment?.expand?.journey_states_via_enrollment_id?.[0]?.current_stage?.replace(
                  '_',
                  ' ',
                ) || 'onboarding'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>
                Etapa:{' '}
                <span className="capitalize">
                  {enrollment?.expand?.journey_states_via_enrollment_id?.[0]?.stage_status?.replace(
                    '_',
                    ' ',
                  ) || 'Em andamento'}
                </span>
              </p>
              <p className="text-[11px] italic">“O ser humano não funciona em partes.”</p>
            </CardContent>
          </Card>
        </div>

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

        {/* BUILD 03B: Reconhecimento da Participante — DIRETRIZ: BACKEND PRECISO, FRONTEND HUMANO */}
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

        {/* Estado Real do Vínculo e Acompanhamento */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span>Vínculo de Acompanhamento</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Dados reais sincronizados da sua matrícula (ENROLLMENT)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {enrollment?.id ? `ID: ${enrollment.id.slice(0, 8)}...` : 'Sem matrícula'}
              </Badge>
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
                      <span className="text-muted-foreground block text-[11px]">Produto CER</span>
                      <span className="font-medium text-foreground">
                        {enrollment.expand?.product_id?.name || 'Acompanhamento Individual CER'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Status do Acompanhamento
                      </span>
                      <span className="font-medium text-foreground capitalize">
                        {enrollment.status}
                      </span>
                    </div>
                  </div>

                  {enrollment.notes && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-muted-foreground block text-[11px]">
                        Anotação inicial
                      </span>
                      <p className="text-foreground text-xs">{enrollment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/15">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Privacy by Design: suas informações preservam autoria, contexto e visibilidade
                    estrita por perfil.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhum acompanhamento ativo encontrado para este perfil.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Entre em contato com sua profissional para receber o convite de vinculação.
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
