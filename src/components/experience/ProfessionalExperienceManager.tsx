import React, { useState, useEffect } from 'react'
import {
  enrollmentExperienceService,
  experienceResponseService,
  experienceCatalogService,
} from '@/services/experienceEngine'
import type {
  EnrollmentRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
  CerExperienceRecord,
} from '@/types/cer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Lock,
  Eye,
  Calendar,
  Layers,
  Clock,
  History,
} from 'lucide-react'

interface ProfessionalExperienceManagerProps {
  enrollment: EnrollmentRecord
}

export const ProfessionalExperienceManager: React.FC<ProfessionalExperienceManagerProps> = ({
  enrollment,
}) => {
  const [experiences, setExperiences] = useState<EnrollmentExperienceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpForResponses, setSelectedExpForResponses] =
    useState<EnrollmentExperienceRecord | null>(null)
  const [responses, setResponses] = useState<ExperienceResponseRecord[]>([])
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false)

  const loadExperiences = async () => {
    setLoading(true)
    try {
      const list = await enrollmentExperienceService.listByEnrollment(enrollment.id)
      setExperiences(list)
    } catch (err) {
      console.error('Erro ao carregar experiências do enrollment:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enrollment?.id) {
      loadExperiences()
    }
  }, [enrollment?.id])

  const handleTogglePause = async (enrExp: EnrollmentExperienceRecord) => {
    try {
      const nextStatus = enrExp.release_status === 'paused' ? 'available' : 'paused'
      await enrollmentExperienceService.updateReleaseStatus(enrExp.id, nextStatus)
      await loadExperiences()
    } catch (err) {
      console.error('Falha ao pausar/retomar experiência:', err)
    }
  }

  const handleReopen = async (enrExp: EnrollmentExperienceRecord) => {
    try {
      await enrollmentExperienceService.updateReleaseStatus(enrExp.id, 'available')
      await loadExperiences()
    } catch (err) {
      console.error('Falha ao reabrir experiência:', err)
    }
  }

  const handleViewResponses = async (enrExp: EnrollmentExperienceRecord) => {
    setSelectedExpForResponses(enrExp)
    setIsResponsesModalOpen(true)
    setLoadingResponses(true)
    try {
      const resps = await experienceResponseService.listResponsesByExperience(
        enrollment.id,
        enrExp.experience_id,
      )
      setResponses(resps)
    } catch (err) {
      console.error('Erro ao carregar respostas da interagente:', err)
    } finally {
      setLoadingResponses(false)
    }
  }

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-medium">
                Experiências da Consciência (Progressive Release)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Libere, pause, reabra e acompanhe as respostas registradas pela interagente
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {experiences.length} vinculada(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            Carregando experiências...
          </p>
        ) : experiences.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Nenhuma experiência vinculada a esta interagente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {experiences.map((ee) => {
              const expData = ee.expand?.experience_id
              const isLocked = ee.release_status === 'locked'
              const isAvailable = ee.release_status === 'available'
              const isInProgress = ee.release_status === 'in_progress'
              const isPaused = ee.release_status === 'paused'
              const isCompleted = ee.release_status === 'completed'

              return (
                <div
                  key={ee.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {expData?.title || 'Experiência'}
                      </span>
                      <Badge
                        variant={
                          isCompleted
                            ? 'secondary'
                            : isPaused
                              ? 'destructive'
                              : isLocked
                                ? 'outline'
                                : 'default'
                        }
                        className="text-[10px] capitalize font-normal"
                      >
                        {ee.release_status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        (progresso: {ee.progress_status})
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {expData?.subtitle || 'Módulo da fase Consciência'}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                      {ee.started_at && (
                        <span>Início: {new Date(ee.started_at).toLocaleDateString('pt-BR')}</span>
                      )}
                      {ee.completed_at && (
                        <span>
                          Conclusão: {new Date(ee.completed_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {ee.current_step_order && (
                        <span>Último momento acessado: {ee.current_step_order}</span>
                      )}
                    </div>
                  </div>

                  {/* Ações da Profissional (Liberar / Pausar / Reabrir / Ver Respostas) */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponses(ee)}
                      className="text-xs h-8 px-2.5 gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Respostas</span>
                    </Button>

                    {isPaused ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePause(ee)}
                        className="text-xs h-8 px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Reativar</span>
                      </Button>
                    ) : isAvailable || isInProgress ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePause(ee)}
                        className="text-xs h-8 px-2 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </Button>
                    ) : null}

                    {isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReopen(ee)}
                        className="text-xs h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Modal: Visualizar Respostas da Interagente */}
      <Dialog open={isResponsesModalOpen} onOpenChange={setIsResponsesModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Respostas Registradas — {selectedExpForResponses?.expand?.experience_id?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro canônico autoral da interagente (Build 02 — sem interpretação ou score)
            </DialogDescription>
          </DialogHeader>

          {loadingResponses ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Carregando respostas canônicas...
            </p>
          ) : responses.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-muted-foreground">
                Nenhuma resposta foi registrada pela interagente ainda nesta experiência.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 py-2">
              {responses.map((resp) => {
                const promptData = resp.expand?.prompt_id

                return (
                  <div
                    key={resp.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground">
                          Momento {promptData?.step_order || '—'} • {resp.response_type}
                        </span>
                        <p className="font-medium text-foreground text-sm">
                          {promptData?.prompt_text || 'Pergunta do momento'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        v{resp.version} ({resp.status})
                      </Badge>
                    </div>

                    {/* Exibição do Valor Estruturado */}
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Valor estruturado registrado:
                      </span>
                      <div className="text-foreground font-mono text-[11px] break-words">
                        {typeof resp.structured_value === 'object' &&
                        resp.structured_value !== null ? (
                          <pre className="whitespace-pre-wrap font-sans text-xs">
                            {JSON.stringify(resp.structured_value, null, 2)}
                          </pre>
                        ) : (
                          <span>{String(resp.structured_value ?? '—')}</span>
                        )}
                      </div>
                    </div>

                    {/* Texto Livre quando houver */}
                    {resp.free_text && (
                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Reflexão em texto livre:
                        </span>
                        <p className="text-foreground text-xs italic bg-background p-2 rounded border border-border/40 mt-0.5">
                          “{resp.free_text}”
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1 border-t border-border/30">
                      <span>Registrado em: {new Date(resp.created).toLocaleString('pt-BR')}</span>
                      <span>Versão do Prompt: {resp.prompt_version}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
