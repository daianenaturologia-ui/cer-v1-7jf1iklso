import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Heart,
  Shield,
  Users,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Circle,
  Eye,
  Info,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import type {
  EnrollmentRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
  CerKnowledgeItemRecord,
  CerParticipantRecognitionRecord,
  CerExperienceRecord,
  CerPromptRecord,
} from '@/types/cer'
import { enrollmentExperienceService, experienceResponseService } from '@/services/experienceEngine'
import { cerKnowledgeItemService } from '@/services/cerKnowledge'
import { ProfessionalMapEditor } from '@/components/ProfessionalMapEditor'
import { ProfessionalKnowledgeBuilding } from '@/components/ProfessionalKnowledgeBuilding'

export interface DimensionConfig {
  id: string
  experienceId: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export const SIX_CANONICAL_DIMENSIONS: DimensionConfig[] = [
  {
    id: 'corpo_fisiologia',
    experienceId: 'exp-corpo-fisiologia-07b',
    name: 'Corpo & Fisiologia',
    icon: Activity,
  },
  {
    id: 'mente_emocoes',
    experienceId: 'exp-mente-emocoes-07c',
    name: 'Mente & Emoções',
    icon: Heart,
  },
  {
    id: 'regulacao_respostas',
    experienceId: 'exp-regulacao-respostas-07c',
    name: 'Regulação & Padrões de Resposta',
    icon: Shield,
  },
  {
    id: 'relacoes',
    experienceId: 'exp-relacoes-07d',
    name: 'Relações & Vínculos',
    icon: Users,
  },
  {
    id: 'sexualidade',
    experienceId: 'exp-sexualidade-07e',
    name: 'Sexualidade & Intimidade',
    icon: Flame,
  },
  {
    id: 'sentido_conexao',
    experienceId: 'exp-sentido-conexao-07f',
    name: 'Sentido & Conexão',
    icon: Sparkles,
  },
]

export const INTEGRACAO_EXPERIENCE_ID = 'exp-integracao-consciencia-07g'

const EMPTY_SYNTHESIS_TEXT = 'Ainda não há informações suficientes para uma síntese.'

interface ProfessionalConscienciaSectionProps {
  enrollment: EnrollmentRecord
  participantName: string
}

export const ProfessionalConscienciaSection: React.FC<ProfessionalConscienciaSectionProps> = ({
  enrollment,
  participantName,
}) => {
  const [enrollmentExps, setEnrollmentExps] = useState<EnrollmentExperienceRecord[]>([])
  const [allResponses, setAllResponses] = useState<ExperienceResponseRecord[]>([])
  const [knowledgeItems, setKnowledgeItems] = useState<CerKnowledgeItemRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Painéis expansíveis do Nível 3
  const [expandedDimensions, setExpandedDimensions] = useState<Record<string, boolean>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const { demoAdapter } = await import('@/services/demoAdapter')
      if (demoAdapter.isEnabled()) {
        const demoResponses = demoAdapter.listExperienceResponses(enrollment.id)
        setEnrollmentExps([])
        setAllResponses(Array.isArray(demoResponses) ? demoResponses : [])
        setKnowledgeItems([])
        setLoading(false)
        return
      }

      const [exps, kis, resps] = await Promise.all([
        enrollmentExperienceService.listByEnrollment(enrollment.id),
        cerKnowledgeItemService.listByEnrollment(enrollment.id),
        pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
          filter: `enrollment_id = "${enrollment.id}"`,
          expand: 'prompt_id',
          sort: 'created',
        }),
      ])

      setEnrollmentExps(Array.isArray(exps) ? exps : [])
      setKnowledgeItems(Array.isArray(kis) ? kis : [])
      setAllResponses(Array.isArray(resps) ? resps : [])
    } catch (err) {
      console.error('Erro ao carregar dados da Consciência Profissional:', err)
      setEnrollmentExps([])
      setKnowledgeItems([])
      setAllResponses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enrollment?.id) {
      loadData()
    }
  }, [enrollment?.id])

  const toggleExpand = (dimId: string) => {
    setExpandedDimensions((prev) => ({
      ...prev,
      [dimId]: !prev[dimId],
    }))
  }

  const expandAndScrollTo = (dimId: string) => {
    setExpandedDimensions((prev) => ({
      ...prev,
      [dimId]: true,
    }))
    const el = document.getElementById(`relatorio-${dimId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Helpers de derivação de estado
  const getEnrollmentExpForDim = (experienceId: string): EnrollmentExperienceRecord | undefined => {
    return (enrollmentExps || []).find(
      (e) =>
        e?.experience_id === experienceId ||
        (e?.expand?.experience_id && (e.expand.experience_id as any).id === experienceId),
    )
  }

  const getResponsesForDim = (experienceId: string): ExperienceResponseRecord[] => {
    return (allResponses || []).filter((r) => r?.experience_id === experienceId)
  }

  const getStatusLabel = (
    enrExp?: EnrollmentExperienceRecord,
    responsesCount = 0,
  ): 'Não iniciada' | 'Em andamento' | 'Concluída' => {
    if (!enrExp) {
      return responsesCount > 0 ? 'Em andamento' : 'Não iniciada'
    }
    if (enrExp.progress_status === 'completed' || enrExp.release_status === 'completed') {
      return 'Concluída'
    }
    if (
      enrExp.progress_status === 'in_progress' ||
      enrExp.started_at ||
      responsesCount > 0 ||
      (enrExp.current_step_order && enrExp.current_step_order > 1)
    ) {
      return 'Em andamento'
    }
    return 'Não iniciada'
  }

  const getLastUpdateDate = (
    enrExp?: EnrollmentExperienceRecord,
    responses: ExperienceResponseRecord[] = [],
  ): string | null => {
    const dates: number[] = []
    if (enrExp?.completed_at) dates.push(new Date(enrExp.completed_at).getTime())
    if (enrExp?.updated) dates.push(new Date(enrExp.updated).getTime())
    for (const r of responses) {
      if (r.updated) dates.push(new Date(r.updated).getTime())
      else if (r.created) dates.push(new Date(r.created).getTime())
    }
    if (dates.length === 0) return null
    const max = Math.max(...dates)
    return new Date(max).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getObjectiveSummary = (responses: ExperienceResponseRecord[]): string | null => {
    // Procura por respostas objetivas já produzidas pelo instrumento
    if (responses.length === 0) return null
    // Se houver responses com structured_value claro
    const scoredOrCategorized = responses.filter(
      (r) =>
        r.structured_value !== undefined &&
        r.structured_value !== null &&
        typeof r.structured_value !== 'object',
    )
    if (scoredOrCategorized.length > 0) {
      return `${responses.length} momento(s) respondido(s). Último registro objetivo: ${String(
        scoredOrCategorized[scoredOrCategorized.length - 1].structured_value,
      )}.`
    }
    return `${responses.length} resposta(s) autoral(is) registrada(s).`
  }

  // Integração 07G como síntese complementar
  const integracaoExp = getEnrollmentExpForDim(INTEGRACAO_EXPERIENCE_ID)
  const integracaoResponses = getResponsesForDim(INTEGRACAO_EXPERIENCE_ID)

  return (
    <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════════════════════
          NÍVEL 1 — RESUMO ESSENCIAL (6 CARTÕES)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-3" aria-labelledby="nivel-1-resumo-title">
        <div className="space-y-1 border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              Nível 1
            </span>
            <h2 id="nivel-1-resumo-title" className="text-lg font-bold font-serif text-foreground">
              Resumo essencial
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Visão sintética das seis dimensões da Consciência de {participantName}. Sem conclusões
            inventadas ou dados demonstrativos artificiais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SIX_CANONICAL_DIMENSIONS.map((dim) => {
            const Icon = dim.icon
            const enrExp = getEnrollmentExpForDim(dim.experienceId)
            const responses = getResponsesForDim(dim.experienceId)
            const status = getStatusLabel(enrExp, responses.length)
            const lastUpdate = getLastUpdateDate(enrExp, responses)
            const objectiveSummary = getObjectiveSummary(responses)

            return (
              <Card
                key={dim.id}
                className="border-border/70 hover:border-border transition-colors shadow-none flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-semibold truncate font-serif">
                        {dim.name}
                      </CardTitle>
                    </div>

                    <Badge
                      variant={
                        status === 'Concluída'
                          ? 'secondary'
                          : status === 'Em andamento'
                            ? 'default'
                            : 'outline'
                      }
                      className="text-[10px] font-normal shrink-0"
                    >
                      {status === 'Concluída' && (
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      )}
                      {status === 'Em andamento' && <Clock className="w-3 h-3 mr-1" />}
                      {status === 'Não iniciada' && (
                        <Circle className="w-2.5 h-2.5 mr-1 text-muted-foreground" />
                      )}
                      {status}
                    </Badge>
                  </div>

                  {lastUpdate && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Última atualização: {lastUpdate}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-2.5 rounded-md border border-border/40">
                    {objectiveSummary ? (
                      <span>{objectiveSummary}</span>
                    ) : (
                      <span className="italic text-muted-foreground">{EMPTY_SYNTHESIS_TEXT}</span>
                    )}
                  </div>

                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => expandAndScrollTo(dim.id)}
                      className="w-full text-xs h-8 gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver relatório detalhado</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NÍVEL 2 — MAPA INTEGRATIVO CER
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="space-y-4 pt-4 border-t border-border/50"
        aria-labelledby="nivel-2-mapa-title"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              Nível 2
            </span>
            <h2 id="nivel-2-mapa-title" className="text-lg font-bold font-serif text-foreground">
              Mapa Integrativo CER
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Centro de integração e publicação explícita. Distingue com rigor ético respostas da
            interagente, resultados objetivos dos instrumentos, sínteses do sistema e hipóteses de
            Daiane.
          </p>
        </div>

        {/* Legenda visual com distinção epistêmica obrigatória */}
        <div className="p-3 bg-muted/20 rounded-xl border border-border/60 text-xs space-y-2">
          <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
            Distinção visual do conteúdo:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge variant="outline" className="text-[9px] font-mono">
                respostas da interagente
              </Badge>
              <span className="text-muted-foreground truncate">autoria preservada na íntegra</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge variant="outline" className="text-[9px] font-mono">
                resultados objetivos dos instrumentos
              </Badge>
              <span className="text-muted-foreground truncate">escalas e escolhas canônicas</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge variant="secondary" className="text-[9px] font-mono">
                Síntese organizada pelo sistema
              </Badge>
              <span className="text-muted-foreground truncate">apoio automático organizado</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge
                variant="default"
                className="text-[9px] font-mono bg-primary/20 text-primary border-primary/30"
              >
                observações de Daiane
              </Badge>
              <span className="text-muted-foreground truncate">registro privado de sessão</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-amber-400 text-amber-700 dark:text-amber-300"
              >
                hipóteses profissionais
              </Badge>
              <span className="text-muted-foreground truncate">
                compreensão situada, nunca fato
              </span>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded bg-background border border-border/40">
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-emerald-400 text-emerald-700 dark:text-emerald-300"
              >
                versão publicada para a interagente
              </Badge>
              <span className="text-muted-foreground truncate">apenas por decisão de Daiane</span>
            </div>
          </div>
        </div>

        {/* Editor do Mapa CER com a Trava do Primeiro Encontro integrada */}
        <ProfessionalMapEditor
          enrollmentId={enrollment.id}
          participantName={participantName}
          professionalUserId={pb.authStore.record?.id || ''}
        />

        {/* Conhecimento, Hipóteses e Provenance Clínica */}
        <ProfessionalKnowledgeBuilding
          enrollmentId={enrollment.id}
          participantName={participantName}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          NÍVEL 3 — RELATÓRIOS DETALHADOS POR DIMENSÃO
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="space-y-4 pt-4 border-t border-border/50"
        aria-labelledby="nivel-3-relatorios-title"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
              Nível 3
            </span>
            <h2
              id="nivel-3-relatorios-title"
              className="text-lg font-bold font-serif text-foreground"
            >
              Relatórios detalhados por dimensão
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Aprofundamento dimensão a dimensão. Reaproveita dados existentes sem duplicar
            questionários: respostas originais, classificações, registros espontâneos em texto ou
            voz e observações profissionais em área separada.
          </p>
        </div>

        <div className="space-y-3">
          {SIX_CANONICAL_DIMENSIONS.map((dim) => {
            const Icon = dim.icon
            const isExpanded = Boolean(expandedDimensions[dim.id])
            const enrExp = getEnrollmentExpForDim(dim.experienceId)
            const responses = getResponsesForDim(dim.experienceId)
            const status = getStatusLabel(enrExp, responses.length)
            const lastUpdate = getLastUpdateDate(enrExp, responses)

            return (
              <Card
                key={dim.id}
                id={`relatorio-${dim.id}`}
                className="border-border/70 overflow-hidden shadow-none transition-all scroll-mt-20"
              >
                <div
                  onClick={() => toggleExpand(dim.id)}
                  className="p-4 bg-muted/15 hover:bg-muted/25 cursor-pointer flex items-center justify-between gap-3 border-b border-border/30 select-none transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-card border border-border/50 text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 truncate">
                      <h3 className="text-sm font-semibold text-foreground font-serif">
                        {dim.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{responses.length} resposta(s) registrada(s)</span>
                        {lastUpdate && (
                          <>
                            <span>•</span>
                            <span>Última atualização: {lastUpdate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-4 space-y-4 text-xs">
                    {dim.id === 'corpo_fisiologia' ? (
                      <div className="space-y-4">
                        {/* Visão Especializada do Capítulo 1 de Corpo & Fisiologia */}
                        {React.createElement(
                          React.lazy(
                            () => import('./experience/ayurveda/ProfessionalAyurvedaChapter1View'),
                          ),
                          {
                            responses,
                            participantName,
                          },
                        )}
                      </div>
                    ) : responses.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground italic">
                        Nenhuma resposta registrada ainda nesta dimensão por {participantName}.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {responses.map((resp, idx) => {
                          const prompt = resp.expand?.prompt_id as CerPromptRecord | undefined
                          return (
                            <div
                              key={resp.id || idx}
                              className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                    Momento {prompt?.step_order || idx + 1} • {resp.response_type}
                                  </span>
                                  <p className="font-medium text-foreground text-xs sm:text-sm">
                                    {prompt?.prompt_text || 'Pergunta do momento'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    v{resp.version} ({resp.status})
                                  </Badge>
                                </div>
                              </div>

                              {/* Resposta objetiva do instrumento */}
                              {resp.structured_value !== undefined &&
                                resp.structured_value !== null && (
                                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                                    <span className="text-[10px] font-medium text-muted-foreground block">
                                      Resultado objetivo do instrumento:
                                    </span>
                                    <div className="text-foreground font-mono text-xs break-words">
                                      {typeof resp.structured_value === 'object' ? (
                                        <pre className="whitespace-pre-wrap font-sans text-xs">
                                          {JSON.stringify(resp.structured_value, null, 2)}
                                        </pre>
                                      ) : (
                                        <span>{String(resp.structured_value)}</span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Registro espontâneo em texto ou voz */}
                              {resp.free_text && (
                                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                                  <span className="text-[10px] font-medium text-primary block">
                                    Registro espontâneo da interagente (texto ou voz):
                                  </span>
                                  <p className="text-foreground text-xs italic leading-relaxed">
                                    &ldquo;{resp.free_text}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Data de preenchimento */}
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                                <span>
                                  Preenchido em: {new Date(resp.created).toLocaleString('pt-BR')}
                                </span>
                                <span>Versão do instrumento: {resp.prompt_version}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Observações profissionais em área separada */}
                    <div className="p-3 bg-muted/20 border border-border/50 rounded-lg space-y-1 text-xs">
                      <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
                        Observações profissionais de Daiane (Área Separada):
                      </span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        As impressões clínicas, anotações de sessão e hipóteses desta dimensão são
                        mantidas no Nível 2 (Conhecimento em Construção e Prontuário) e não são
                        expostas diretamente à interagente sem validação explícita.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}

          {/* Integração 07G como Síntese Complementar após as seis dimensões */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-card to-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono border-primary/40 text-primary"
                  >
                    Síntese complementar
                  </Badge>
                  <CardTitle className="text-sm font-semibold font-serif text-foreground">
                    Integração da Consciência
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {getStatusLabel(integracaoExp, integracaoResponses.length)}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Visão transversal pós-avaliações. Não constitui uma sétima dimensão, mas a amarração
                integrativa dos fios identificados nas seis esferas da pessoa humana.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
              {integracaoResponses.length === 0 ? (
                <p className="italic">
                  Nenhum registro de síntese complementar preenchido até o momento.
                </p>
              ) : (
                <p className="text-foreground">
                  {integracaoResponses.length} reflexão(ões) de integração registrada(s).
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
export default ProfessionalConscienciaSection
