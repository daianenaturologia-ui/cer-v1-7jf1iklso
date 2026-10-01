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
  RefreshCw,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import type {
  EnrollmentRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
  ExperienceResponseVersionRecord,
  CerPromptRecord,
} from '@/types/cer'
import { enrollmentExperienceService } from '@/services/experienceEngine'
import { ProfessionalMapEditor } from '@/components/ProfessionalMapEditor'
import { ProfessionalKnowledgeBuilding } from '@/components/ProfessionalKnowledgeBuilding'
import { ProfessionalAyurvedaCorpoFisiologiaView } from '@/components/experience/ayurveda/ProfessionalAyurvedaCorpoFisiologiaView'
import { ProfessionalAyurvedaInterpretationView } from '@/components/experience/ayurveda/ProfessionalAyurvedaInterpretationView'
import { ProfessionalMindEmotionsView } from '@/components/experience/ProfessionalMindEmotionsView'
import { ProfessionalDimensionReportView } from '@/components/experience/ProfessionalDimensionReportView'
import { ProfessionalIntegrativeMapView } from '@/components/experience/ProfessionalIntegrativeMapView'
import {
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
} from '@/services/universalDimensionInterpretationEngine'
import { isChapter4Completed } from '@/services/ayurvedaChapter4'

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

interface ProfessionalConscienciaSectionProps {
  enrollment: EnrollmentRecord
  participantName: string
  treatmentPreference?: string
  treatmentPreferenceCustom?: string
}

export const getDimensionStatusLabel = (
  dimensionId: string,
  enrExp: EnrollmentExperienceRecord | undefined,
  responses: ExperienceResponseRecord[],
): 'Não iniciada' | 'Em andamento' | 'Concluída' => {
  if (dimensionId === 'corpo_fisiologia' && isChapter4Completed(responses)) {
    return 'Concluída'
  }
  if (!enrExp) {
    return responses.length > 0 ? 'Em andamento' : 'Não iniciada'
  }
  if (enrExp.progress_status === 'completed' || enrExp.release_status === 'completed') {
    return 'Concluída'
  }
  if (
    enrExp.progress_status === 'in_progress' ||
    enrExp.started_at ||
    responses.length > 0 ||
    (enrExp.current_step_order && enrExp.current_step_order > 1)
  ) {
    return 'Em andamento'
  }
  return 'Não iniciada'
}

export const ProfessionalConscienciaSection: React.FC<ProfessionalConscienciaSectionProps> = ({
  enrollment,
  participantName,
  treatmentPreference,
  treatmentPreferenceCustom,
}) => {
  const [enrollmentExps, setEnrollmentExps] = useState<EnrollmentExperienceRecord[]>([])
  const [allResponses, setAllResponses] = useState<ExperienceResponseRecord[]>([])
  const [allResponseVersions, setAllResponseVersions] = useState<ExperienceResponseVersionRecord[]>(
    [],
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showProfessionalMap, setShowProfessionalMap] = useState(false)

  // Painéis expansíveis do Nível 3
  const [expandedDimensions, setExpandedDimensions] = useState<Record<string, boolean>>({})
  const [corpoActiveTab, setCorpoActiveTab] = useState<'factual' | 'interpretacao'>('factual')
  const [isDemoQaScenarioActive, setIsDemoQaScenarioActive] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { demoAdapter } = await import('@/services/demoAdapter')
      if (demoAdapter.isEnabled()) {
        setIsDemoQaScenarioActive(demoAdapter.getActiveScenario() === 'qa_consciencia_completa')
        const demoResponses = demoAdapter.listExperienceResponses(enrollment.id)
        const demoVersions = demoAdapter.listExperienceResponseVersions(enrollment.id)
        setEnrollmentExps([])
        setAllResponses(Array.isArray(demoResponses) ? demoResponses : [])
        setAllResponseVersions(Array.isArray(demoVersions) ? demoVersions : [])
        setLoading(false)
        return
      }

      const [exps, resps, versions] = await Promise.all([
        enrollmentExperienceService.listByEnrollment(enrollment.id),
        pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
          filter: `enrollment_id = "${enrollment.id}"`,
          expand: 'prompt_id',
          sort: 'created',
        }),
        pb.collection('experience_response_versions').getFullList<ExperienceResponseVersionRecord>({
          filter: `enrollment_id = "${enrollment.id}"`,
          sort: 'created',
        }),
      ])

      setEnrollmentExps(Array.isArray(exps) ? exps : [])
      setAllResponses(Array.isArray(resps) ? resps : [])
      setAllResponseVersions(Array.isArray(versions) ? versions : [])
    } catch (err) {
      console.error('Erro ao carregar dados da Consciência Profissional:', err)
      setLoadError(true)
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
    setExpandedDimensions((prev) => ({ [dimId]: !prev[dimId] }))
  }

  const expandAndScrollTo = (dimId: string) => {
    setExpandedDimensions({ [dimId]: true })
    requestAnimationFrame(() => {
      document
        .getElementById(`relatorio-${dimId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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

  // Integração 07G como síntese complementar
  const integracaoExp = getEnrollmentExpForDim(INTEGRACAO_EXPERIENCE_ID)
  const integracaoResponses = getResponsesForDim(INTEGRACAO_EXPERIENCE_ID)

  const handleToggleQaScenario = async () => {
    try {
      const { demoAdapter } = await import('@/services/demoAdapter')
      if (demoAdapter.isEnabled()) {
        const nextScenario =
          demoAdapter.getActiveScenario() === 'qa_consciencia_completa'
            ? 'default'
            : 'qa_consciencia_completa'
        demoAdapter.setActiveScenario(nextScenario)
        setIsDemoQaScenarioActive(nextScenario === 'qa_consciencia_completa')
        await loadData()
      }
    } catch (e) {
      console.error('Erro ao alternar cenário de demonstração:', e)
    }
  }

  return (
    <div className="space-y-10">
      {/* ═══════════════════════════════════════════════════════════════════
          NÍVEL 1 — RESUMO ESSENCIAL (6 CARTÕES)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-3" aria-labelledby="dimensoes-title">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 id="dimensoes-title" className="text-lg font-bold font-serif">
              Consciência de {participantName}
            </h2>
            <p className="text-xs text-muted-foreground">
              Escolha uma dimensão para ler as respostas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isDemoQaScenarioActive ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleToggleQaScenario}
              className="text-xs border-dashed gap-1"
              data-testid="toggle-qa-scenario-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                {isDemoQaScenarioActive
                  ? 'Cenário QA Consciência Ativo'
                  : 'Ativar Cenário QA (6 Dimensões)'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar respostas
            </Button>
          </div>
        </div>
        {loadError && (
          <p role="alert" className="p-3 rounded-lg border border-destructive/40 text-sm">
            Não foi possível atualizar agora. As informações anteriores foram mantidas.
          </p>
        )}
        <div className="rounded-xl border border-border/70 divide-y divide-border/50">
          {SIX_CANONICAL_DIMENSIONS.map((dim) => {
            const enrExp = getEnrollmentExpForDim(dim.experienceId)
            const responses = getResponsesForDim(dim.experienceId)
            const lastUpdate = getLastUpdateDate(enrExp, responses)
            return (
              <div key={dim.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <h3 className="text-sm font-semibold">{dim.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {responses.length ? 'Há respostas registradas' : 'Ainda sem respostas'}
                    {lastUpdate ? ` · ${lastUpdate}` : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => expandAndScrollTo(dim.id)}
                >
                  Ver respostas
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      {Object.values(expandedDimensions).some(Boolean) && (
        <section
          className="space-y-4 pt-4 border-t border-border/50"
          aria-labelledby="nivel-3-relatorios-title"
        >
          <h2 id="nivel-3-relatorios-title" className="text-base font-semibold font-serif">
            Respostas por dimensão
          </h2>

          <div className="space-y-3">
            {SIX_CANONICAL_DIMENSIONS.filter((dim) => expandedDimensions[dim.id]).map((dim) => {
              const Icon = dim.icon
              const isExpanded = Boolean(expandedDimensions[dim.id])
              const enrExp = getEnrollmentExpForDim(dim.experienceId)
              const responses = getResponsesForDim(dim.experienceId)
              const status = getDimensionStatusLabel(dim.id, enrExp, responses)
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
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
                        <div className="space-y-4" data-testid="corpo-fisiologia-container">
                          {/* Alternador entre Visão Factual e Interpretação Profissional */}
                          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-muted/30 border border-border/50 max-w-fit">
                            <Button
                              type="button"
                              size="sm"
                              variant={corpoActiveTab === 'factual' ? 'default' : 'ghost'}
                              className="h-7 text-xs px-3"
                              onClick={() => setCorpoActiveTab('factual')}
                            >
                              Visão Factual (Capítulos 1, 2 e 3)
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={corpoActiveTab === 'interpretacao' ? 'default' : 'ghost'}
                              className="h-7 text-xs px-3"
                              onClick={() => setCorpoActiveTab('interpretacao')}
                            >
                              Interpretação Profissional (Ayurveda CER)
                            </Button>
                          </div>

                          {corpoActiveTab === 'factual' ? (
                            /* Visão Especializada Factual dos Capítulos 1 e 2 de Corpo & Fisiologia (M4A) */
                            <ProfessionalAyurvedaCorpoFisiologiaView
                              responses={responses}
                              responseVersions={allResponseVersions.filter(
                                (version) => version.experience_id === dim.experienceId,
                              )}
                              participantName={participantName}
                              treatmentPreference={treatmentPreference}
                              treatmentPreferenceCustom={treatmentPreferenceCustom}
                              loadError={loadError}
                              onRetryLoad={loadData}
                            />
                          ) : (
                            /* Nova Seção: Interpretação Profissional (Prakriti, Vikriti, Agni, Ama) */
                            <ProfessionalAyurvedaInterpretationView
                              responses={responses}
                              participantName={participantName}
                            />
                          )}
                        </div>
                      ) : dim.id === 'mente_emocoes' ? (
                        <ProfessionalMindEmotionsView
                          responses={responses}
                          participantName={participantName}
                          loadError={loadError}
                          onRetryLoad={loadData}
                        />
                      ) : dim.id === 'regulacao_respostas' ? (
                        <ProfessionalDimensionReportView
                          interpretation={buildRegulacaoInterpretation(responses, participantName)}
                          responses={responses}
                          participantName={participantName}
                          icon={Shield}
                          loadError={loadError}
                          onRetryLoad={loadData}
                        />
                      ) : dim.id === 'relacoes' ? (
                        <ProfessionalDimensionReportView
                          interpretation={buildRelacoesInterpretation(responses, participantName)}
                          responses={responses}
                          participantName={participantName}
                          icon={Users}
                          loadError={loadError}
                          onRetryLoad={loadData}
                        />
                      ) : dim.id === 'sexualidade' ? (
                        <ProfessionalDimensionReportView
                          interpretation={buildSexualidadeInterpretation(
                            responses,
                            participantName,
                          )}
                          responses={responses}
                          participantName={participantName}
                          icon={Flame}
                          loadError={loadError}
                          onRetryLoad={loadData}
                        />
                      ) : dim.id === 'sentido_conexao' ? (
                        <ProfessionalDimensionReportView
                          interpretation={buildSentidoInterpretation(responses, participantName)}
                          responses={responses}
                          participantName={participantName}
                          icon={Sparkles}
                          loadError={loadError}
                          onRetryLoad={loadData}
                        />
                      ) : responses.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground italic">
                          Esta interagente ainda não iniciou este capítulo.
                        </div>
                      ) : null}
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
                    {getDimensionStatusLabel('integracao', integracaoExp, integracaoResponses)}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Visão transversal pós-avaliações. Não constitui uma sétima dimensão, mas a
                  amarração integrativa dos fios identificados nas seis esferas da pessoa humana.
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
      )}
      <section
        className="border-t border-border/50 pt-5 space-y-4"
        data-testid="professional-integrative-map-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold font-serif">
              Mapa e interpretação profissional
            </h2>
            <p className="text-xs text-muted-foreground">
              Prepare, revise e compartilhe as versões resumida e aprofundada das seis dimensões.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowProfessionalMap((current) => !current)}
              aria-expanded={showProfessionalMap}
            >
              {showProfessionalMap ? 'Ocultar ferramentas avançadas' : 'Ferramentas avançadas'}
            </Button>
          </div>
        </div>

        <ProfessionalIntegrativeMapView
          responses={allResponses}
          participantName={participantName}
          onSelectDimension={expandAndScrollTo}
        />
        <ProfessionalMapEditor
          enrollmentId={enrollment.id}
          participantName={participantName}
          professionalUserId={pb.authStore.record?.id || ''}
          responses={allResponses}
        />

        {showProfessionalMap && (
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-0.5">
                Ferramentas Editoriais e Provenance
              </span>
              Espaço reservado para anotações manuais de sessão e edição de mapa legado.
            </div>
            {/* Conhecimento, Hipóteses e Provenance Clínica */}
            <ProfessionalKnowledgeBuilding
              enrollmentId={enrollment.id}
              participantName={participantName}
            />
          </div>
        )}
      </section>
    </div>
  )
}
export default ProfessionalConscienciaSection
