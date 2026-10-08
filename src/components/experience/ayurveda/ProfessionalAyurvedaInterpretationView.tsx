import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Compass,
  CheckCircle2,
  Scale,
  Brain,
} from 'lucide-react'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  buildAyurvedaInterpretation,
  type DoshaEvidence,
} from '@/services/ayurvedaInterpretationEngine'

export interface ProfessionalAyurvedaInterpretationViewProps {
  responses: ExperienceResponseRecord[]
  participantName: string
}

export const ProfessionalAyurvedaInterpretationView: React.FC<
  ProfessionalAyurvedaInterpretationViewProps
> = ({ responses, participantName }) => {
  const interp = buildAyurvedaInterpretation(responses)

  const renderEvidenceList = (evidences: DoshaEvidence[], doshaName: string) => {
    if (evidences.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic">
          Nenhuma evidência convergente observada para {doshaName}.
        </p>
      )
    }

    return (
      <ul className="space-y-2 text-xs">
        {evidences.map((ev, idx) => (
          <li
            key={idx}
            className="p-2.5 rounded-lg border border-border/50 bg-background/60 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground">{ev.category}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {ev.sourceQuestionTitle}
              </Badge>
            </div>
            <p className="text-muted-foreground italic">
              Registro literal: &ldquo;{ev.literalText}&rdquo;
            </p>
            <p className="text-xs text-foreground/90">{ev.observation}</p>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-5" data-testid="ayurveda-interpretative-section">
      {/* Visão Geral da Confiança Epistêmica */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block">
            Nível de Confiança Geral
          </span>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{interp.generalConfidence}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Baseado na convergência cruzada de características habituais e ritmos biológicos.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block">
            Leitura de Agni (Fogo Digestivo)
          </span>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold">{interp.agniReading.title}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{interp.agniReading.description}</p>
        </div>

        <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block">
            Leitura de Ama (Sobrecarga)
          </span>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold">{interp.amaReading.presence}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{interp.amaReading.rationale}</p>
        </div>
      </div>

      {/* Hipótese de Prakriti (Constituição de Base) */}
      <Card className="border-border/70 shadow-none overflow-hidden">
        <CardHeader className="p-4 bg-muted/20 border-b border-border/40 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                Hipótese de Prakriti (Constituição Habitual de Base)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Confiança: {interp.prakritiHypothesis.confidence}
            </Badge>
          </div>
          <CardDescription className="text-xs">{interp.prakritiHypothesis.summary}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Evidências de Vata</span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.prakritiHypothesis.evidencesVata.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.prakritiHypothesis.evidencesVata, 'Vata')}
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Evidências de Pitta</span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.prakritiHypothesis.evidencesPitta.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.prakritiHypothesis.evidencesPitta, 'Pitta')}
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Evidências de Kapha</span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.prakritiHypothesis.evidencesKapha.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.prakritiHypothesis.evidencesKapha, 'Kapha')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hipótese de Vikriti (Oscilações e Desvios do Ritmo Atual) */}
      <Card className="border-border/70 shadow-none overflow-hidden">
        <CardHeader className="p-4 bg-muted/20 border-b border-border/40 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                Hipótese de Vikriti (Desvios e Oscilações no Ritmo Biológico)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Confiança: {interp.vikritiHypothesis.confidence}
            </Badge>
          </div>
          <CardDescription className="text-xs">{interp.vikritiHypothesis.summary}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Sinais Ativos de Vata</span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.vikritiHypothesis.evidencesVata.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.vikritiHypothesis.evidencesVata, 'Vata')}
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Sinais Ativos de Pitta
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.vikritiHypothesis.evidencesPitta.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.vikritiHypothesis.evidencesPitta, 'Pitta')}
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-muted/15 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">
                  Sinais Ativos de Kapha
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {interp.vikritiHypothesis.evidencesKapha.length}
                </Badge>
              </div>
              {renderEvidenceList(interp.vikritiHypothesis.evidencesKapha, 'Kapha')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recursos, Atenção e Perguntas para a Sessão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recursos Percebidos */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-xs font-semibold">Recursos Percebidos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
            {interp.perceivedResources.length === 0 ? (
              <p className="text-muted-foreground italic">Em observação clínica.</p>
            ) : (
              interp.perceivedResources.map((res, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{res}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pontos de Atenção */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-xs font-semibold">Pontos de Atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
            {interp.attentionPoints.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhum ponto crítico destacado.</p>
            ) : (
              interp.attentionPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                  <span className="text-foreground/90">{pt}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Perguntas para a Sessão */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-semibold">Perguntas para a Sessão</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
            {interp.sessionQuestions.map((q, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-foreground/90 italic"
              >
                &ldquo;{q}&rdquo;
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfessionalAyurvedaInterpretationView
