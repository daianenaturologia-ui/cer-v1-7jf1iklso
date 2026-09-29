import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Compass,
  Sparkles,
  Layers,
  ShieldAlert,
  GitBranch,
  Flame,
  Ear,
  HelpCircle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  BookOpen,
} from 'lucide-react'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  buildProfessionalIntegrativeMap,
  INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER,
  type ProfessionalIntegrativeMapResult,
  type IntegrativeCerHypothesis,
  type CrossCuttingResource,
  type ProtectionPatternAndTension,
} from '@/services/integrativeMapEngine'

interface ProfessionalIntegrativeMapViewProps {
  responses: ExperienceResponseRecord[]
  participantName: string
  onSelectDimension?: (dimensionId: string) => void
}

export const ProfessionalIntegrativeMapView: React.FC<ProfessionalIntegrativeMapViewProps> = ({
  responses,
  participantName,
  onSelectDimension,
}) => {
  const mapData: ProfessionalIntegrativeMapResult = buildProfessionalIntegrativeMap(
    responses,
    participantName,
  )

  const [expandedHypotheses, setExpandedHypotheses] = useState<Record<string, boolean>>({
    'hip-1-somato-cognitiva': true,
  })
  const [showCoverageDetail, setShowCoverageDetail] = useState(false)

  const toggleHypothesis = (id: string) => {
    setExpandedHypotheses((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO VAZIO / INSUFICIENTE: CANÔNICO, SEM FABRICAÇÃO DE SÍNTESE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!mapData.hasSufficientData) {
    return (
      <div className="space-y-4" data-testid="professional-integrative-map-empty">
        <Card className="border-border/70 shadow-none bg-muted/10">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <CardTitle className="text-base sm:text-lg font-serif">
                  Mapa Integrativo Profissional da Consciência
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Área Exclusiva da Profissional · Somente Leitura
              </Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Síntese transversal determinística das seis dimensões humanas do Método CER.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4 text-xs">
            {mapData.isEmpty ? (
              <div className="py-8 text-center text-muted-foreground italic text-xs sm:text-sm space-y-2">
                <FileQuestion className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p className="font-medium text-foreground">
                  Esta interagente ainda não iniciou este capítulo.
                </p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  O Mapa Integrativo Profissional aguarda o preenchimento de pelo menos duas
                  dimensões para traçar convergências fundamentadas e hipóteses clínicas seguras.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Dados Insuficientes para Síntese Transversal (1 de 6 Dimensões)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {mapData.essentialSynthesis.overview}
                </p>
              </div>
            )}

            {/* Painel de Cobertura das Dimensões */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Cobertura Atual das Dimensões ({mapData.activeDimensionsCount} de 6)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {mapData.coverageList.map((cov) => (
                  <div
                    key={cov.dimensionId}
                    className="p-2.5 rounded-lg border border-border/50 bg-card flex flex-col justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        {cov.dimensionName}
                      </span>
                      <Badge
                        variant={cov.hasResponses ? 'default' : 'secondary'}
                        className="text-[9px] px-1.5 py-0 shrink-0"
                      >
                        {cov.hasResponses ? 'Iniciada' : 'Não iniciada'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[10px] line-clamp-2">{cov.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Não Diagnóstico */}
            <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{INTEGRATIVE_NON_DIAGNOSTIC_DISCLAIMER}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO COMPLETO / COERENTE: 8 BLOCOS CANÔNICOS RESPONSIVOS E LEGÍVEIS
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6" data-testid="professional-integrative-map-complete">
      {/* ── CABEÇALHO DO MAPA INTEGRATIVO ──────────────────────────────────── */}
      <Card className="border-border/70 shadow-none bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-serif">
                  Mapa Integrativo Profissional da Consciência
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Síntese transversal determinística · {participantName}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/40 text-primary"
              >
                {mapData.activeDimensionsCount} de 6 Dimensões Ativas
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Somente Leitura · Sem Prescrição
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── BLOCO 1: SÍNTESE ESSENCIAL DA PESSOA E DO MOMENTO ATUAL ─────────── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                1. Síntese Essencial da Pessoa e do Momento Atual
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Confiança: {mapData.essentialSynthesis.confidence}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Visão panorâmica articulando funcionamento, recursos e desafios prioritários.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3 text-xs sm:text-sm text-foreground leading-relaxed">
          <p>{mapData.essentialSynthesis.overview}</p>
        </CardContent>
      </Card>

      {/* ── BLOCO 2: RECURSOS E FORÇAS QUE ATRAVESSAM DIFERENTES DIMENSÕES ───── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-semibold font-serif">
                2. Recursos e Forças Transversais
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {mapData.crossCuttingResources.length} recurso(s) multi-dimensional(ais)
            </span>
          </div>
          <CardDescription className="text-xs">
            Pontos de apoio internos e relacionais identificados em mais de uma dimensão.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mapData.crossCuttingResources.map((res: CrossCuttingResource) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {res.title}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                    {res.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-500/10 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-emerald-700 dark:text-emerald-400 font-semibold block">
                    Dimensões sustentantes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {res.dimensionsInvolved.map((dim, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      >
                        {dim}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 3: CONVERGÊNCIAS CENTRAIS ENTRE AS SEIS DIMENSÕES ─────────── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                3. Convergências Centrais entre as Dimensões
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Interseção Epistêmica CER
            </span>
          </div>
          <CardDescription className="text-xs">
            Articulações onde o estado de uma dimensão ressoa e condiciona diretamente as demais.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="space-y-3">
            {mapData.centralConvergences.map((conv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/15 text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-xs sm:text-sm font-serif">
                    {conv.title}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {conv.dimensions.map((dim, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                        {dim}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs">{conv.description}</p>
                <div className="p-2.5 rounded-lg bg-card border border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold block">
                    Evidências Concretas Observadas:
                  </span>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    {conv.observedEvidences.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 4: PADRÕES DE PROTEÇÃO E TENSÕES ──────────────────────────── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-sm font-semibold font-serif">
                4. Padrões de Proteção e Tensões que Dificultam o Movimento
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              Preservação Funcional
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Defesas inteligentes aprendidas que protegem a integridade, mas cobram custo de energia.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mapData.protectivePatternsAndTensions.map((prot: ProtectionPatternAndTension) => (
              <div
                key={prot.id}
                className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs sm:text-sm block">
                    {prot.patternName}
                  </span>
                  <div className="space-y-1 text-muted-foreground text-[11px] sm:text-xs">
                    <p>
                      <strong className="text-foreground">Manifestação:</strong>{' '}
                      {prot.somaticAndPsychologicalManifestation}
                    </p>
                    <p>
                      <strong className="text-amber-800 dark:text-amber-300">
                        Custo percebido:
                      </strong>{' '}
                      {prot.perceivedCost}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/10 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-amber-700 dark:text-amber-400 font-semibold block">
                    Dimensões impactadas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {prot.dimensionsInvolved.map((dim, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                      >
                        {dim}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 5: HIPÓTESES INTEGRATIVAS CER (≥ 2 DIMENSÕES CADA) ─────────── */}
      <Card className="border-primary/40 shadow-none bg-gradient-to-b from-card via-card to-primary/5">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm sm:text-base font-semibold font-serif">
                5. Hipóteses Integrativas CER (Formulação Clínica Transversal)
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-primary/30 text-primary"
            >
              Mínimo 2 Dimensões por Hipótese · Não Diagnóstico
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Formulação profissional ligada a evidências explícitas de pelo menos duas dimensões.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          <div className="space-y-3">
            {mapData.integrativeHypotheses.map((hip: IntegrativeCerHypothesis) => {
              const isExpanded = Boolean(expandedHypotheses[hip.id])
              return (
                <Card
                  key={hip.id}
                  className="border-border/70 shadow-none overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleHypothesis(hip.id)}
                    className="p-3.5 bg-muted/15 hover:bg-muted/25 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors border-b border-border/20"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground font-serif">
                          {hip.title}
                        </h4>
                        <Badge
                          variant={hip.confidence === 'Alta' ? 'default' : 'secondary'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          Confiança: {hip.confidence}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                        <span>Dimensões:</span>
                        {hip.dimensionsInvolved.map((dim, i) => (
                          <span key={i} className="font-medium text-foreground">
                            {dim}
                            {i < hip.dimensionsInvolved.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <CardContent className="p-4 space-y-3 text-xs">
                      {/* Enunciado da Hipótese */}
                      <div className="p-3 rounded-lg bg-card border border-border/50 text-foreground leading-relaxed">
                        <strong className="text-primary block text-[11px] uppercase tracking-wider mb-1">
                          Enunciado da Hipótese de Trabalho:
                        </strong>
                        <p>{hip.statement}</p>
                      </div>

                      {/* Tabela de Evidências Multi-Dimensionais */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold block">
                          Evidências Cruzadas que Sustentam a Hipótese:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {hip.evidences.map((ev, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-1 text-[11px]"
                            >
                              <div className="flex items-center justify-between text-primary font-semibold text-[10px]">
                                <span>{ev.dimensionName}</span>
                              </div>
                              <p className="text-foreground italic">
                                &ldquo;{ev.literalText}&rdquo;
                              </p>
                              {ev.clinicalNote && (
                                <p className="text-muted-foreground text-[10px]">
                                  <strong>Nota:</strong> {ev.clinicalNote}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Foco de Investigação na Sessão */}
                      <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[11px] flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Foco de Validação em Sessão:</strong> {hip.investigationFocus}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-[10px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              Aviso epistemológico: Nenhuma hipótese integrativa é diagnóstica. Todas constituem
              formulações de trabalho para direcionar a escuta colaborativa e devem ser checadas com
              a interagente.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 6: BLOCO AYURVEDA CONCISO ─────────────────────────────────── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-sm font-semibold font-serif">
                6. Bloco Ayurveda Conciso (Corpo & Fisiologia)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Reutilização Determinística do Motor Ayurveda CER
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Prakriti, Vikriti, Agni e Ama preservando limites de evidência e níveis de confiança.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3 text-xs">
          {mapData.ayurvedaConcise.hasData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prakriti */}
                <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                      Hipótese de Prakriti
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {mapData.ayurvedaConcise.prakritiConfidence}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {mapData.ayurvedaConcise.prakritiHypothesis}
                  </p>
                </div>

                {/* Vikriti */}
                <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                      Hipótese de Vikriti
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {mapData.ayurvedaConcise.vikritiConfidence}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {mapData.ayurvedaConcise.vikritiHypothesis}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Agni */}
                <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                      Leitura de Agni: {mapData.ayurvedaConcise.agniReading.title}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {mapData.ayurvedaConcise.agniReading.confidence}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {mapData.ayurvedaConcise.agniReading.description}
                  </p>
                </div>

                {/* Ama */}
                <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                      Leitura de Ama (Sobrecarga)
                    </span>
                    <Badge
                      variant={
                        mapData.ayurvedaConcise.amaReading.presence === 'Sinalizada'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-[9px]"
                    >
                      {mapData.ayurvedaConcise.amaReading.presence}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {mapData.ayurvedaConcise.amaReading.rationale}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                {mapData.ayurvedaConcise.disclaimer}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic py-2">
              Capítulo de Corpo & Fisiologia ainda não possui revisão canônica concluída.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── BLOCO 7: PRIORIDADES PARA A ESCUTA PROFISSIONAL (NÃO PRESCRIÇÃO) ── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ear className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                7. Prioridades Possíveis para a Escuta Profissional (Não Prescrição)
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Orientação Dialógica em Sessão
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Focos prioritários de escuta e perguntas abertas para aprofundamento colaborativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mapData.listeningPriorities.map((pri) => (
              <div
                key={pri.id}
                className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <span className="font-semibold text-primary block text-xs sm:text-sm">
                    {pri.theme}
                  </span>
                  <p className="text-muted-foreground text-[11px]">{pri.context}</p>
                </div>

                <div className="pt-2 border-t border-primary/10 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-primary font-semibold block">
                    Perguntas para a Sessão:
                  </span>
                  <ul className="space-y-1 text-foreground/90 italic text-[11px]">
                    {pri.deepeningQuestions.map((q, i) => (
                      <li key={i}>&ldquo;{q}&rdquo;</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── BLOCO 8: LACUNAS DE INFORMAÇÃO E DIMENSÕES NÃO RESPONDIDAS ───────── */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold font-serif">
                8. Lacunas de Informação e Limites de Evidência
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={() => setShowCoverageDetail((v) => !v)}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              {showCoverageDetail ? 'Ocultar matriz' : 'Ver matriz de cobertura'}
            </Button>
          </div>
          <CardDescription className="text-xs">
            Transparência epistêmica sobre o que ainda não foi respondido ou permanece em
            observação.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1.5">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
                Observações de Cobertura e Lacunas
              </span>
              <ul className="space-y-1 text-muted-foreground text-[11px]">
                {mapData.informationGaps.partialObservations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg border border-border/50 bg-card space-y-1.5">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">
                Recomendações para a Condução Profissional
              </span>
              <ul className="space-y-1 text-muted-foreground text-[11px]">
                {mapData.informationGaps.recommendedExplorations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Matriz Completa de Cobertura das 6 Dimensões */}
          {showCoverageDetail && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider block">
                Status das Seis Dimensões Canônicas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {mapData.coverageList.map((cov) => (
                  <div
                    key={cov.dimensionId}
                    className="p-2.5 rounded-lg border border-border/40 bg-muted/15 flex flex-col justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{cov.dimensionName}</span>
                      <Badge
                        variant={cov.hasResponses ? 'default' : 'secondary'}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {cov.hasResponses ? 'Concluída / Em andamento' : 'Não iniciada'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[10px] line-clamp-2">{cov.summary}</p>
                    {onSelectDimension && cov.hasResponses && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-[10px] text-primary self-start mt-1"
                        onClick={() => onSelectDimension(cov.dimensionId)}
                      >
                        Ver relatório específico &rarr;
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aviso Legal de Encerramento */}
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{mapData.disclaimer}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessionalIntegrativeMapView
