import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Eye,
} from 'lucide-react'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  buildMindEmotionsInterpretation,
  type InterpretiveLens,
} from '@/services/universalDimensionInterpretationEngine'

export interface ProfessionalMindEmotionsViewProps {
  responses: ExperienceResponseRecord[]
  participantName: string
  loadError?: boolean
  onRetryLoad?: () => void
}

export const ProfessionalMindEmotionsView: React.FC<ProfessionalMindEmotionsViewProps> = ({
  responses,
  participantName,
  loadError,
  onRetryLoad,
}) => {
  const [showFactual, setShowFactual] = useState(false)
  const [expandedLenses, setExpandedLenses] = useState<Record<string, boolean>>({
    lens_1_paisagem_emocional: true,
  })

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

  const interp = buildMindEmotionsInterpretation(responses, participantName)

  if (!interp.hasResponses) {
    return (
      <div className="py-8 text-center text-muted-foreground italic text-xs">
        Esta interagente ainda não iniciou este capítulo.
      </div>
    )
  }

  const toggleLens = (id: string) => {
    setExpandedLenses((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6" data-testid="mente-emocoes-report-view">
      {/* ═══════════════════════════════════════════════════════════════════
          RESUMO ESSENCIAL (SUBSTITUI RESPOSTA BRUTA / JSON)
         ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/70 shadow-none bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif">
                Resumo Essencial — Mente & Emoções
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Leitura Transversal Integrada
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Síntese do perfil afetivo, padrões cognitivos e estratégias de preservação.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3 text-xs">
          <p className="text-foreground leading-relaxed text-xs sm:text-sm">
            {interp.essentialSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> Recursos em Destaque
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {interp.generalResources.map((res, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" /> Pontos de Atenção na Escuta
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {interp.generalAttentionPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════
          AS 4 LENTES INTERPRETATIVAS OBRIGATÓRIAS
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            4 Lentes Interpretativas Especializadas
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Convergência entre sentimentos, pensamentos e defesas
          </span>
        </div>

        <div className="space-y-3">
          {interp.fourLenses.map((lens: InterpretiveLens) => {
            const isExpanded = Boolean(expandedLenses[lens.id])
            return (
              <Card key={lens.id} className="border-border/70 shadow-none overflow-hidden">
                <div
                  onClick={() => toggleLens(lens.id)}
                  className="p-3.5 bg-muted/15 hover:bg-muted/25 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors border-b border-border/20"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground font-serif">
                      {lens.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{lens.subtitle}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <CardContent className="p-4 space-y-4 text-xs">
                    {/* Síntese da Lente */}
                    <div className="p-3 rounded-lg bg-card border border-border/50 text-foreground leading-relaxed">
                      <strong>Interpretação clínica da lente:</strong> {lens.synthesis}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Evidências Observadas */}
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                        <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider">
                          Evidências e Convergências Observadas
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {lens.evidences.map((ev, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary font-bold">•</span>
                              <span>{ev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recursos Identificados */}
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                        <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider">
                          Recursos & Potenciais Identificados
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {lens.resources.map((res, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{res}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Pontos de Atenção */}
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1.5">
                        <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider">
                          Pontos de Atenção na Condução
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {lens.attentionPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Perguntas para a Sessão */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
                        <span className="font-semibold text-primary block text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Perguntas para aprofundar na sessão
                        </span>
                        <ul className="space-y-1.5 text-foreground/90 italic">
                          {lens.sessionQuestions.map((q, i) => (
                            <li key={i}>&ldquo;{q}&rdquo;</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          VISÃO FACTUAL (OPCIONAL, SEPARADA E SEM EXIBIR JSON BRUTO)
         ═══════════════════════════════════════════════════════════════════ */}
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

export default ProfessionalMindEmotionsView
