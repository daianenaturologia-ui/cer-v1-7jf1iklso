import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertTriangle, HelpCircle, CheckCircle2, BookOpen, Compass } from 'lucide-react'
import type { ExperienceResponseRecord } from '@/types/cer'
import type { StandardDimensionInterpretation } from '@/services/universalDimensionInterpretationEngine'

export interface ProfessionalDimensionReportViewProps {
  interpretation: StandardDimensionInterpretation
  responses: ExperienceResponseRecord[]
  participantName: string
  icon?: React.ComponentType<{ className?: string }>
  loadError?: boolean
  onRetryLoad?: () => void
}

export const ProfessionalDimensionReportView: React.FC<ProfessionalDimensionReportViewProps> = ({
  interpretation,
  responses,
  participantName,
  icon: Icon = Compass,
  loadError,
  onRetryLoad,
}) => {
  const [showFactual, setShowFactual] = useState(false)

  if (loadError) {
    return (
      <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-xs space-y-2">
        <p className="font-semibold text-destructive">
          Não foi possível carregar as respostas agora.
        </p>
        <p className="text-muted-foreground">
          Tente recarregar a visualização para atualizar os dados.
        </p>
        {onRetryLoad && (
          <Button variant="outline" size="sm" onClick={onRetryLoad} className="text-xs">
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  if (!interpretation.hasResponses) {
    return (
      <div className="py-8 text-center text-muted-foreground italic text-xs">
        Esta interagente ainda não iniciou este capítulo.
      </div>
    )
  }

  return (
    <div className="space-y-5" data-testid={`relatorio-dimensao-${interpretation.dimensionId}`}>
      {/* Síntese Simples e Síntese Profunda */}
      <Card className="border-border/70 shadow-none bg-gradient-to-br from-card to-muted/15">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                Relatório Profissional — {interpretation.dimensionName}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Leitura Interpretativa CER
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Síntese simples e profunda dos padrões identificados na experiência de {participantName}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3.5 text-xs">
          {/* Síntese Simples */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-primary block">
              Síntese Simples
            </span>
            <p className="text-foreground leading-relaxed text-xs sm:text-sm">
              {interpretation.simpleSynthesis}
            </p>
          </div>

          {/* Síntese Profunda */}
          <div className="p-3.5 rounded-lg bg-card border border-border/50 space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground block">
              Síntese Profunda & Convergências
            </span>
            <p className="text-foreground leading-relaxed">{interpretation.deepSynthesis}</p>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Evidências, Recursos, Atenção e Perguntas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evidências Observadas */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-semibold">Evidências Observadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
            {interpretation.observedEvidences.length === 0 ? (
              <p className="text-muted-foreground italic">Em observação.</p>
            ) : (
              <ul className="space-y-1.5 text-muted-foreground">
                {interpretation.observedEvidences.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recursos Percebidos */}
        <Card className="border-border/70 shadow-none">
          <CardHeader className="p-3.5 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-xs font-semibold">Recursos Percebidos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0 space-y-1.5 text-xs">
            {interpretation.perceivedResources.length === 0 ? (
              <p className="text-muted-foreground italic">Em observação clínica.</p>
            ) : (
              <ul className="space-y-1.5 text-foreground/90">
                {interpretation.perceivedResources.map((res, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
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
            {interpretation.attentionPoints.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhum ponto crítico destacado.</p>
            ) : (
              <ul className="space-y-1.5 text-foreground/90">
                {interpretation.attentionPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
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
            {interpretation.sessionQuestions.length === 0 ? (
              <p className="text-muted-foreground italic">Perguntas em formulação.</p>
            ) : (
              <ul className="space-y-1.5 text-foreground/90 italic">
                {interpretation.sessionQuestions.map((q, i) => (
                  <li key={i} className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visão Factual Opcional (sem JSON bruto) */}
      <div className="pt-2 border-t border-border/40">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setShowFactual((v) => !v)}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {showFactual
            ? 'Ocultar respostas literais registradas'
            : 'Ver respostas literais registradas pela interagente'}
        </Button>

        {showFactual && (
          <div className="mt-3 space-y-2.5">
            {responses.map((resp, idx) => {
              const promptTitle =
                (resp.expand?.prompt_id as any)?.prompt_text ||
                (resp as any).prompt_title ||
                `Pergunta do momento ${idx + 1}`

              return (
                <div
                  key={resp.id || idx}
                  className="p-3 rounded-lg border border-border/50 bg-card text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span className="font-medium">{promptTitle}</span>
                    <span>Versão {resp.version || 1}</span>
                  </div>
                  {resp.free_text && (
                    <p className="text-foreground italic bg-muted/20 p-2 rounded border border-border/30">
                      &ldquo;{resp.free_text}&rdquo;
                    </p>
                  )}
                  {resp.structured_value !== undefined && resp.structured_value !== null && (
                    <p className="text-foreground text-[11px]">
                      <strong>Escolha registrada:</strong>{' '}
                      {typeof resp.structured_value === 'object'
                        ? (resp.structured_value as any)?.title ||
                          (resp.structured_value as any)?.label ||
                          (resp.structured_value as any)?.value ||
                          'Opção selecionada no instrumento'
                        : String(resp.structured_value)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfessionalDimensionReportView
