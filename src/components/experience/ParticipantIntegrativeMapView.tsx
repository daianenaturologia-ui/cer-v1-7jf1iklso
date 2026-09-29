import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Compass,
  Sparkles,
  Heart,
  Shield,
  Users,
  Flame,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  Eye,
  Maximize2,
  FileQuestion,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ExperienceResponseRecord, CerMapRecord, CerMapItemRecord } from '@/types/cer'
import { buildProfessionalIntegrativeMap } from '@/services/integrativeMapEngine'
import { buildAyurvedaInterpretation } from '@/services/ayurvedaInterpretationEngine'
import {
  buildMindEmotionsInterpretation,
  buildRegulacaoInterpretation,
  buildRelacoesInterpretation,
  buildSexualidadeInterpretation,
  buildSentidoInterpretation,
} from '@/services/universalDimensionInterpretationEngine'
import { ParticipantMapDisplay } from '@/components/ParticipantMapDisplay'

interface ParticipantIntegrativeMapViewProps {
  responses: ExperienceResponseRecord[]
  participantName?: string
  currentMap?: (CerMapRecord & { items: CerMapItemRecord[] }) | null
  onClose?: () => void
}

/**
 * Helper para traduzir confiança/cobertura interna em linguagem gentil e humana:
 * "NUNCA expor número/técnica/confiança interna" -> "baseado em várias respostas" vs "baseado em poucas respostas"
 */
function humanEvidenceNotice(confidence: string): string {
  if (confidence === 'Alta') {
    return 'Baseado em várias respostas suas'
  }
  if (confidence === 'Moderada') {
    return 'Baseado em algumas respostas suas'
  }
  return 'Baseado em poucas respostas até aqui'
}

export const ParticipantIntegrativeMapView: React.FC<ParticipantIntegrativeMapViewProps> = ({
  responses,
  participantName = 'você',
  currentMap,
}) => {
  const [readingDepth, setReadingDepth] = useState<'essencial' | 'profundidade'>('essencial')
  const [activeDimensionTab, setActiveDimensionTab] = useState<string>('corpo')
  const [showEditorialMap, setShowEditorialMap] = useState<boolean>(false)

  const safeResponses = Array.isArray(responses) ? responses : []

  // Derivações determinísticas utilizando os mesmos motores analíticos canônicos
  const mapData = buildProfessionalIntegrativeMap(safeResponses, participantName)

  // As respostas precedem a devolutiva. Só apresentar a leitura integrativa
  // depois da publicação profissional do Mapa CER.
  if (mapData.hasSufficientData && currentMap?.status !== 'published') {
    return (
      <Card className="border-border/70 shadow-none bg-muted/10" data-testid="participant-integrative-map-awaiting-publication">
        <CardHeader>
          <CardTitle className="font-serif">Meu Mapa CER está em construção</CardTitle>
          <CardDescription>
            Suas respostas já ajudam a compor o mapa. A leitura será compartilhada depois de ser
            revisada pela profissional e conversada com você.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO VAZIO / INSUFICIENTE: CANÔNICO, SEM FABRICAÇÃO DE SÍNTESE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!mapData.hasSufficientData) {
    return (
      <div className="space-y-4" data-testid="participant-integrative-map-empty">
        <Card className="border-border/70 shadow-none bg-muted/10">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <CardTitle className="text-base sm:text-lg font-serif">Meu Mapa CER</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Seu Espaço de Consciência
              </Badge>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Uma síntese viva e acolhedora de como você funciona e se cuida.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4 text-xs">
            {mapData.isEmpty ? (
              <div className="py-8 text-center text-muted-foreground italic text-xs sm:text-sm space-y-2">
                <FileQuestion className="w-8 h-8 mx-auto text-muted-foreground/60" />
                <p className="font-medium text-foreground">
                  Você ainda não iniciou as descobertas das dimensões.
                </p>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Ao responder às experiências de cada dimensão, seu mapa essencial começará a se
                  formar aqui com seus recursos, sinais do corpo e pontos de atenção.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Em construção com suas primeiras descobertas (1 de 6 dimensões iniciada)
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Para que o seu mapa mostre como as diferentes partes da sua vida se conversam,
                  convidamos você a continuar explorando as demais dimensões no seu próprio ritmo.
                </p>
              </div>
            )}

            {/* Painel de Cobertura das Dimensões com convite gentil */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <span className="font-semibold text-foreground text-xs uppercase tracking-wider block">
                Cobertura das dimensões ({mapData.activeDimensionsCount} de 6)
              </span>
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
                        {cov.hasResponses ? 'Iniciada' : 'Ainda não iniciada'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-[10px] line-clamp-2">
                      {cov.hasResponses
                        ? 'Respostas registradas com carinho'
                        : 'Aguardando seu momento'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mapa editorial complementar se existir */}
            {currentMap && (
              <div className="pt-4 border-t border-border/40 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditorialMap((v) => !v)}
                  className="w-full text-xs justify-between"
                >
                  <span>Ver mapa compartilhado em conversa</span>
                  {showEditorialMap ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                {showEditorialMap && <ParticipantMapDisplay map={currentMap} />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRAÇÃO DAS RESPOSTAS POR DIMENSÃO (MESMOS MOTORES DA VISÃO PROFISSIONAL)
  // ═══════════════════════════════════════════════════════════════════════════
  const corpoResps = safeResponses.filter((r) => r.experience_id === 'exp-corpo-fisiologia-07b')
  const menteResps = safeResponses.filter((r) => r.experience_id === 'exp-mente-emocoes-07c')
  const regResps = safeResponses.filter((r) => r.experience_id === 'exp-regulacao-respostas-07c')
  const relResps = safeResponses.filter((r) => r.experience_id === 'exp-relacoes-07d')
  const sexResps = safeResponses.filter((r) => r.experience_id === 'exp-sexualidade-07e')
  const senResps = safeResponses.filter((r) => r.experience_id === 'exp-sentido-conexao-07f')

  const ayvInterp = buildAyurvedaInterpretation(corpoResps)
  const menteInterp = buildMindEmotionsInterpretation(menteResps, participantName)
  const regInterp = buildRegulacaoInterpretation(regResps, participantName)
  const relInterp = buildRelacoesInterpretation(relResps, participantName)
  const sexInterp = buildSexualidadeInterpretation(sexResps, participantName)
  const senInterp = buildSentidoInterpretation(senResps, participantName)

  // Faixa superior:
  // - Cobertura das dimensões
  // - Até 3 recursos pessoais (apenas sustentados)
  // - Até 3 pontos de atenção (gentis, sem jargão clínico)
  // - Até 3 formas de proteção ativas (apenas sustentadas)
  const topPersonalResources = mapData.crossCuttingResources.slice(0, 3)
  const topActiveAttentions: string[] = []
  if (menteInterp.hasResponses && menteInterp.generalAttentionPoints.length > 0) {
    topActiveAttentions.push(menteInterp.generalAttentionPoints[0])
  }
  if (regInterp.hasResponses && regInterp.attentionPoints.length > 0) {
    topActiveAttentions.push(regInterp.attentionPoints[0])
  }
  if (relInterp.hasResponses && relInterp.attentionPoints.length > 0) {
    topActiveAttentions.push(relInterp.attentionPoints[0])
  }
  const topProtections = mapData.protectivePatternsAndTensions.slice(0, 3)

  // Status de história de vida
  const hasLifeHistoryEvents = safeResponses.some(
    (r) =>
      r.experience_id?.includes('historia') ||
      r.experience_id?.includes('timeline') ||
      (r as any).prompt_key?.includes('historia') ||
      (r as any).prompt_key?.includes('marco'),
  )

  // Função para abrir diretamente uma dimensão na Profundidade 2
  const openDeepDimension = (dimensionKey: string) => {
    setActiveDimensionTab(dimensionKey)
    setReadingDepth('profundidade')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SÍNTESES CURTAS PARA OS CARDS DO "MEU MAPA ESSENCIAL" (SEM RESPOSTAS BRUTAS)
  // ═══════════════════════════════════════════════════════════════════════════

  // Dimensão 1: Corpo & Fisiologia / Ayurveda
  const prakritiText = ayvInterp.prakritiHypothesis.primaryTendency
    ? `${ayvInterp.prakritiHypothesis.primaryTendency} (sua base e tendência constitucional habitual)`
    : 'Base constitucional em observação'
  const vikritiText = ayvInterp.vikritiHypothesis.primaryImbalance
    ? `${ayvInterp.vikritiHypothesis.primaryImbalance} (como seu corpo tem respondido no momento)`
    : 'Expressão atual em observação'
  const agniHumanText = mapData.ayurvedaConcise.hasData
    ? mapData.ayurvedaConcise.agniReading.title
    : 'Em observação'
  const amaHumanText = mapData.ayurvedaConcise.hasData
    ? mapData.ayurvedaConcise.amaReading.presence === 'Não evidenciada'
      ? 'Digestão limpa e sem sinais de sobrecarga metabólica'
      : `${mapData.ayurvedaConcise.amaReading.presence}: ${mapData.ayurvedaConcise.amaReading.rationale}`
    : 'Em observação'

  // Dimensão 2: Mente & Emoções
  const lens3Protection =
    menteInterp.fourLenses[2]?.evidences[0]?.replace(/^[^:]+:\s*/, '') ||
    'Antecipar cenários e prevenir riscos'
  const lens4Regulation =
    menteInterp.fourLenses[3]?.evidences[1]?.replace(/^[^:]+:\s*"?/, '').replace(/"?$/, '') ||
    'Pausas conscientes em quietude'

  // Dimensão 3: Regulação & Padrões
  // Apenas com termos canônicos reais quando evidenciados
  const regGatilho = regInterp.observedEvidences
    .find((e) => e.startsWith('Gatilho'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const regSinais = regInterp.observedEvidences
    .find((e) => e.startsWith('Sinais'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const regResposta = regInterp.observedEvidences
    .find((e) => e.startsWith('Resposta'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const regCusto = regInterp.observedEvidences
    .find((e) => e.startsWith('Custo'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const regRecurso =
    regInterp.perceivedResources
      .find((r) => r.includes('Recurso'))
      ?.replace(/^[^:]+:\s*"?/, '')
      .replace(/"?$/, '') || regInterp.perceivedResources[0]

  // Dimensão 4: Relações
  const relProximidade = relInterp.observedEvidences
    .find((e) => e.includes('proximidade'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const relConfianca = relInterp.observedEvidences
    .find((e) => e.includes('confiança'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const relLimites = relInterp.observedEvidences
    .find((e) => e.includes('limites'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')

  // Dimensão 5: Sexualidade
  const sexCorpo = sexInterp.observedEvidences
    .find((e) => e.includes('corpo erótico'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const sexVitalidade = sexInterp.observedEvidences
    .find((e) => e.includes('vitalidade'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const sexLimites = sexInterp.observedEvidences
    .find((e) => e.includes('comunicação'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')

  // Dimensão 6: Sentido & Conexão
  const senBussola = senInterp.observedEvidences
    .find((e) => e.includes('Bússola'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const senValores = senInterp.observedEvidences
    .find((e) => e.includes('Valores'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')
  const senConexao = senInterp.observedEvidences
    .find((e) => e.includes('Portais'))
    ?.replace(/^[^:]+:\s*"?/, '')
    .replace(/"?$/, '')

  return (
    <div className="space-y-6" data-testid="participant-integrative-map-complete">
      {/* ── CABEÇALHO DO MAPA COM CONTROLE SEGMENTADO DE PROFUNDIDADES ───────── */}
      <Card className="border-border/70 shadow-none bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-serif">Meu Mapa CER</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Uma síntese viva e acolhedora de como você funciona e se cuida.
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
              <Badge variant="secondary" className="text-[10px]">
                Espaço da Interagente
              </Badge>
            </div>
          </div>

          {/* Controle Segmentado de Profundidade */}
          <div className="pt-3 border-t border-border/40 mt-3 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              value={readingDepth}
              onValueChange={(val) => setReadingDepth(val as 'essencial' | 'profundidade')}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-2 w-full sm:w-80 h-9">
                <TabsTrigger
                  value="essencial"
                  className="text-xs gap-1.5"
                  data-testid="tab-trigger-essencial"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Meu mapa essencial</span>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                    Padrão
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="profundidade"
                  className="text-xs gap-1.5"
                  data-testid="tab-trigger-profundidade"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Compreender em profundidade</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {readingDepth === 'essencial'
                  ? 'Leitura rápida e acolhedora dos seus eixos e recursos principais.'
                  : 'Exploração cuidadosa em quatro eixos para cada dimensão.'}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          PROFUNDIDADE 1: "MEU MAPA ESSENCIAL" (PADRÃO AO ABRIR)
         ═══════════════════════════════════════════════════════════════════════ */}
      {readingDepth === 'essencial' && (
        <div className="space-y-4" data-testid="participant-map-essencial-view">
          {/* FAIXA SUPERIOR INTEGRADA */}
          <Card className="border-primary/30 shadow-none bg-gradient-to-r from-primary/5 via-card to-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs font-mono">
                    Cobertura: {mapData.activeDimensionsCount}/6 dimensões
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {humanEvidenceNotice(mapData.essentialSynthesis.confidence)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">História de vida:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {hasLifeHistoryEvents ? 'Há marcos disponíveis' : 'Ainda não integrada'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary gap-1"
                    onClick={() => setReadingDepth('profundidade')}
                    data-testid="btn-aprofundar-essencial"
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Até 3 Recursos Pessoais */}
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-semibold text-emerald-800 dark:text-emerald-300 block">
                    Recursos Pessoais ({topPersonalResources.length})
                  </span>
                  {topPersonalResources.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {topPersonalResources.map((res) => (
                        <li key={res.id} className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium text-foreground">{res.title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Em observação cuidadosa
                    </p>
                  )}
                </div>

                {/* Até 3 Pontos de Atenção (Gentis) */}
                <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-semibold text-blue-800 dark:text-blue-300 block">
                    Pontos de Atenção ({topActiveAttentions.length})
                  </span>
                  {topActiveAttentions.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {topActiveAttentions.map((att, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                          <span className="text-foreground">{att}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Ritmos equilibrados no momento
                    </p>
                  )}
                </div>

                {/* Até 3 Formas de Proteção Ativas */}
                <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-semibold text-amber-800 dark:text-amber-300 block">
                    Formas de Proteção ({topProtections.length})
                  </span>
                  {topProtections.length > 0 ? (
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {topProtections.map((prot) => (
                        <li key={prot.id} className="flex items-start gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <span className="font-medium text-foreground">{prot.patternName}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      Nenhuma forma com evidência destacada
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRADE DOS 6 CARDS DIMENSIONAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* CARD 1: CORPO & FISIOLOGIA / AYURVEDA */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-corpo"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Corpo & Fisiologia / Ayurveda
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {humanEvidenceNotice(mapData.ayurvedaConcise.prakritiConfidence)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {mapData.ayurvedaConcise.hasData ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Base constitucional (Prakriti):</strong>{' '}
                      {prakritiText}
                    </div>
                    <div>
                      <strong className="text-foreground">Expressão atual (Vikriti):</strong>{' '}
                      {vikritiText}
                    </div>
                    <div>
                      <strong className="text-foreground">Agni (fogo digestivo e ritmo):</strong>{' '}
                      {agniHumanText}
                    </div>
                    <div>
                      <strong className="text-foreground">Ama (limpeza metabólica):</strong>{' '}
                      {amaHumanText}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo aguardando suas respostas para revelar suas tendências corporais.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('corpo')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: MENTE & EMOÇÕES */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-mente"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Mente & Emoções
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {menteInterp.hasResponses ? 'Ativo' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {menteInterp.hasResponses ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Como costumam funcionar:</strong>{' '}
                      Sensibilidade e capacidade reflexiva atentas ao alinhamento com seus valores.
                    </div>
                    <div>
                      <strong className="text-foreground">Diálogo interno:</strong> Cobrança por
                      fazer certo sob estresse ou imprevistos.
                    </div>
                    <div>
                      <strong className="text-foreground">Forma de proteção:</strong>{' '}
                      {lens3Protection}
                    </div>
                    <div>
                      <strong className="text-foreground">Recurso de regulação:</strong>{' '}
                      {lens4Regulation}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo aguardando suas respostas sobre emoções e pensamentos.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('mente')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: REGULAÇÃO & PADRÕES */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-regulacao"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Regulação & Padrões
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {regInterp.hasResponses ? 'Ativo' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {regInterp.hasResponses ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Gatilhos / Primeiros sinais:</strong>{' '}
                      {regGatilho || 'Sobrecarga de demandas'} ·{' '}
                      {regSinais || 'Tensão somática ou ritmo acelerado'}
                    </div>
                    <div>
                      <strong className="text-foreground">Padrão ativo (canônico):</strong>{' '}
                      {regResposta ? (
                        <span className="font-medium text-foreground">{regResposta}</span>
                      ) : (
                        <span className="italic">Sem evidência para nomear padrão ativo</span>
                      )}
                    </div>
                    <div>
                      <strong className="text-foreground">Custo percebido:</strong>{' '}
                      {regCusto || 'Cansaço acumulado ou necessidade de silêncio'}
                    </div>
                    <div>
                      <strong className="text-foreground">Caminho de retorno:</strong>{' '}
                      {regRecurso || 'Pausas conscientes, respiração e espaço próprio'}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo aguardando suas respostas para mapear sua curva de regulação.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('regulacao')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 4: RELAÇÕES */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-relacoes"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Relações & Vínculos
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {relInterp.hasResponses ? 'Ativo' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {relInterp.hasResponses ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Proximidade e afeto:</strong>{' '}
                      {relProximidade || 'Profundidade seletiva com pessoas de confiança'}
                    </div>
                    <div>
                      <strong className="text-foreground">Confiança:</strong>{' '}
                      {relConfianca || 'Abertura gradual da vulnerabilidade'}
                    </div>
                    <div>
                      <strong className="text-foreground">Manejo de limites:</strong>{' '}
                      {relLimites || 'Atenção para não tolerar além da conta'}
                    </div>
                    <div>
                      <strong className="text-foreground">Recursos nos vínculos:</strong> Lealdade,
                      escuta atenta e cuidado mútuo.
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo aguardando suas reflexões sobre vínculos e limites.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('relacoes')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 5: SEXUALIDADE */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-sexualidade"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Sexualidade & Intimidade
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {sexInterp.hasResponses ? 'Ativo' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {sexInterp.hasResponses ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Presença no corpo:</strong>{' '}
                      {sexCorpo || 'Conexão corporal ligada à tranquilidade e relaxamento'}
                    </div>
                    <div>
                      <strong className="text-foreground">Vitalidade e prazer:</strong>{' '}
                      {sexVitalidade || 'Desejo modulado pela segurança relacional'}
                    </div>
                    <div>
                      <strong className="text-foreground">Comunicação e voz:</strong>{' '}
                      {sexLimites || 'Expressão gradual e cuidadosa de preferências'}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo reservado e acolhedor aguardando suas respostas no seu tempo.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('sexualidade')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CARD 6: SENTIDO & CONEXÃO */}
            <Card
              className="border-border/70 shadow-none flex flex-col justify-between"
              data-testid="participant-card-sentido"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs sm:text-sm font-semibold font-serif">
                      Sentido & Conexão
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {senInterp.hasResponses ? 'Ativo' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2 text-[11px]">
                {senInterp.hasResponses ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Bússola interna:</strong>{' '}
                      {senBussola || 'Coerência ética e fidelidade à própria verdade'}
                    </div>
                    <div>
                      <strong className="text-foreground">Valores essenciais:</strong>{' '}
                      {senValores || 'Verdade, generosidade e respeito mútuo'}
                    </div>
                    <div>
                      <strong className="text-foreground">Portais de nutrição:</strong>{' '}
                      {senConexao || 'Natureza, silêncio e transcendência'}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Capítulo aguardando suas reflexões sobre propósito e valores.
                  </p>
                )}
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-primary p-0 gap-1"
                    onClick={() => openDeepDimension('sentido')}
                  >
                    <span>Compreender em profundidade</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NOTA CONCEITUAL: QUEM SOU HOJE NÃO É DESTINO FIXO */}
          <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2.5">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-foreground block">
                Nota sobre como olhar para o seu mapa
              </span>
              <p className="leading-relaxed">
                Quem você é hoje combina a sua <strong>base constitucional</strong>, as{' '}
                <strong>adaptações inteligentes</strong> construídas na sua história e o seu{' '}
                <strong>contexto presente</strong>. Nenhuma leitura é um rótulo ou um destino fixo:
                trata-se de um retrato vivo para apoiar o seu reconhecimento e a sua liberdade de
                escolha.
              </p>
            </div>
          </div>

          {/* ACESSO AO MAPA EDITORIAL SE DISPONÍVEL */}
          {currentMap && (
            <div className="pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditorialMap((v) => !v)}
                className="w-full text-xs justify-between"
              >
                <span>Ver síntese compartilhada pela profissional (Mapa CER editorial)</span>
                {showEditorialMap ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              {showEditorialMap && (
                <div className="mt-3">
                  <ParticipantMapDisplay map={currentMap} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PROFUNDIDADE 2: "COMPREENDER EM PROFUNDIDADE" (4 EIXOS POR DIMENSÃO)
         ═══════════════════════════════════════════════════════════════════════ */}
      {readingDepth === 'profundidade' && (
        <div className="space-y-6" data-testid="participant-map-profundidade-view">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/25 border border-border/40">
            <span className="text-xs text-muted-foreground">
              Compreensão em quatro eixos: Como aparece · O que tenta proteger · Recurso existente ·
              O que experimentar.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setReadingDepth('essencial')}
              data-testid="btn-voltar-essencial"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Voltar ao mapa essencial</span>
            </Button>
          </div>

          {/* NOTA CONCEITUAL EM DESTAQUE NA PROFUNDIDADE */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Linguagem provisória e convite à escuta:</strong> As
            leituras abaixo são convites para você reconhecer ou não o que faz sentido na sua
            experiência. Essa forma de funcionar pode ter sido uma adaptação muito útil no seu
            caminho. A história de vida está atualmente{' '}
            <strong>
              {hasLifeHistoryEvents ? 'com marcos disponíveis' : 'ainda não integrada'}
            </strong>
            , e nenhuma hipótese assume relações causais automáticas com o passado.
          </div>

          {/* SELETOR DE DIMENSÕES PARA PROFUNDIDADE */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/50">
            {[
              { id: 'corpo', label: 'Corpo & Fisiologia', icon: Activity },
              { id: 'mente', label: 'Mente & Emoções', icon: Heart },
              { id: 'regulacao', label: 'Regulação & Padrões', icon: Shield },
              { id: 'relacoes', label: 'Relações & Vínculos', icon: Users },
              { id: 'sexualidade', label: 'Sexualidade & Intimidade', icon: Flame },
              { id: 'sentido', label: 'Sentido & Conexão', icon: Sparkles },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeDimensionTab === tab.id
              return (
                <Button
                  key={tab.id}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveDimensionTab(tab.id)}
                  className="text-xs h-8 gap-1.5"
                  data-testid={`deep-dim-tab-${tab.id}`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Button>
              )
            })}
          </div>

          {/* CONTEÚDO DOS 4 EIXOS DA DIMENSÃO SELECIONADA */}

          {/* 1. CORPO & FISIOLOGIA */}
          {activeDimensionTab === 'corpo' && (
            <div className="space-y-4" data-testid="deep-content-corpo">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Corpo & Fisiologia / Ayurveda — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(mapData.ayurvedaConcise.prakritiConfidence)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        {mapData.ayurvedaConcise.hasData
                          ? `Sua base constitucional habitual manifesta tendência para ${prakritiText}, expressando no momento presente ${vikritiText}. O ritmo do fogo digestivo (Agni) opera como ${agniHumanText}, e a limpeza celular (Ama) indica ${amaHumanText}.`
                          : 'Aguardando o preenchimento dos capítulos de Corpo & Fisiologia para mapear seus ritmos biológicos.'}
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Essa resposta corporal pode ter sido uma adaptação inteligente para
                        economizar energia, proteger você de sobrecargas ambientais ou garantir
                        sustentação diante de períodos de alta exigência física ou sensorial.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Sensibilidade aguçada aos sinais do corpo, capacidade de identificar quando
                        a rotina está pesada e disposição para acolher pausas nutritivas e descanso
                        restaurador.
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Observar sem cobrança a regularidade dos horários de refeição e do sono.
                        Experimentar pequenos intervalos quentes de respiração e hidratação suave ao
                        longo do dia.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. MENTE & EMOÇÕES */}
          {activeDimensionTab === 'mente' && (
            <div className="space-y-4" data-testid="deep-content-mente">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Mente & Emoções — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(menteInterp.hasResponses ? 'Alta' : 'Em observação')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        A mente processa situações com rapidez e olhar antecipatório. Diante de
                        imprevistos ou falhas, o diálogo interno pode se tornar exigente, buscando
                        soluções rápidas para retomar a estabilidade.
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Essa prontidão pode ter sido construída para proteger sua dignidade, evitar
                        críticas externas ou garantir que tudo continuasse funcionando mesmo em
                        circunstâncias instáveis.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Capacidade de reflexão profunda, generosidade com os sentimentos alheios e
                        momentos já conhecidos em que a calma e a clareza se restabelecem em
                        silêncio.
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Observar quando a voz interna está usando um tom de cobrança. Experimentar
                        falar consigo mesma com a mesma gentileza que você dedicaria a uma amiga
                        querida.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. REGULAÇÃO & PADRÕES */}
          {activeDimensionTab === 'regulacao' && (
            <div className="space-y-4" data-testid="deep-content-regulacao">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Regulação & Padrões — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(regInterp.hasResponses ? 'Alta' : 'Em observação')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Sob estímulos de sobrecarga ({regGatilho || 'pressão de demandas'}), o corpo
                        sinaliza com {regSinais || 'tensão física ou aceleração'}. A tendência de
                        resposta envolve {regResposta || 'mobilização rápida para resolver'},
                        deixando um custo de {regCusto || 'cansaço após o pico'}.
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Essa resposta visa impedir a sensação de desamparo, sustentar a eficiência e
                        proteger seu espaço pessoal antes que o desgaste externo se torne
                        incontrolável.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Você já reconhece os caminhos de retorno ao eixo:{' '}
                        {regRecurso ||
                          'pausas conscientes, contato com a natureza e respiração lenta'}
                        .
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Notar a distância entre o primeiro sinal no corpo e a vontade de agir.
                        Experimentar fazer uma pausa de 3 respirações antes de assumir uma nova
                        tarefa sob estresse.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 4. RELAÇÕES */}
          {activeDimensionTab === 'relacoes' && (
            <div className="space-y-4" data-testid="deep-content-relacoes">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Relações & Vínculos — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(relInterp.hasResponses ? 'Alta' : 'Em observação')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        A busca por vínculos verdadeiros e profundos convive com cautela para abrir
                        a intimidade. Há tendência a apoiar bastante os outros antes de pedir ajuda
                        para si.
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Essa reserva pode ter sido uma defesa essencial para evitar desilusões,
                        manter sua autonomia e não se sentir em débito emocional com terceiros.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Lealdade profunda, empatia ativa e grande capacidade de reparação pacífica
                        de conflitos quando há confiança mútua construída.
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Observar quando a vontade de dizer "não" surge no peito. Experimentar pedir
                        uma ajuda simples e pontual a alguém próximo para sentir como o corpo reage
                        ao acolhimento.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 5. SEXUALIDADE */}
          {activeDimensionTab === 'sexualidade' && (
            <div className="space-y-4" data-testid="deep-content-sexualidade">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Sexualidade & Intimidade — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(sexInterp.hasResponses ? 'Alta' : 'Em observação')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        A vitalidade íntima é profundamente ligada à segurança emocional e à
                        presença tranquila no corpo, sendo desacelerada quando há sobrecarga mental
                        de pendências cotidianas.
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Essa contenção pode ter protegido sua vulnerabilidade corporal, evitando
                        invasões de limites ou exigências de performance quando a energia já estava
                        escassa.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Visão respeitosa e integrada da intimidade, consciência das condições
                        afetivas que permitem o prazer e valorização do toque com carinho e sem
                        pressa.
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Experimentar criar momentos de desaceleração corporal (como um banho calmo
                        ou repouso confortável) sem nenhuma obrigação de entrega, apenas para
                        reconectar-se com a própria pele.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 6. SENTIDO & CONEXÃO */}
          {activeDimensionTab === 'sentido' && (
            <div className="space-y-4" data-testid="deep-content-sentido">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="p-4 pb-2 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm sm:text-base font-serif">
                        Sentido & Conexão — Compreender em Profundidade
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {humanEvidenceNotice(senInterp.hasResponses ? 'Alta' : 'Em observação')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Eixo 1 */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/15 space-y-1.5">
                      <span className="font-semibold text-foreground text-xs font-serif flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        1. Como isso aparece no seu cotidiano
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        A vida é guiada por uma bússola de coerência ética, verdade e conexão com
                        algo maior, seja através da natureza, da espiritualidade ou do silêncio
                        contemplativo.
                      </p>
                    </div>

                    {/* Eixo 2 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs font-serif flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        2. O que essa forma de funcionar tenta proteger
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Esse rigor ético protege contra a desorientação e impede a conivência com
                        ambientes que desrespeitem seus valores mais caros e sua integridade
                        essencial.
                      </p>
                    </div>

                    {/* Eixo 3 */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs font-serif flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        3. Qual recurso já existe em você
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Firmeza moral, coragem para manter a autenticidade e refúgios internos de
                        paz aos quais você sempre pode retornar para se reabastecer.
                      </p>
                    </div>

                    {/* Eixo 4 */}
                    <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-300 text-xs font-serif flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        4. O que pode ser observado ou experimentado
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] sm:text-xs">
                        Observar quando a busca por sentido se transforma em peso ou urgência de
                        acerto. Experimentar celebrar a beleza dos pequenos instantes ordinários e
                        sem compromisso.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ParticipantIntegrativeMapView
