import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C1_PROMPTS,
  AYV_TELA1_STRUCTURE_OPTIONS,
  AYV_TELA1_DURATION_OPTIONS,
  AYV_TELA2_SKIN_OPTIONS,
  AYV_TELA3_HAIR_OPTIONS,
  AYV_TELA4_TEMPERATURE_OPTIONS,
  AYV_TELA5_THIRST_OPTIONS,
  AYV_TELA5_DRINK_TEMP_OPTIONS,
  AYV_TELA5_SWEAT_OPTIONS,
} from '@/services/ayurvedaChapter1'

export interface ProfessionalAyurvedaChapter1ViewProps {
  responses: ExperienceResponseRecord[]
  participantName: string
}

export const ProfessionalAyurvedaChapter1View: React.FC<ProfessionalAyurvedaChapter1ViewProps> = ({
  responses,
  participantName,
}) => {
  // Encontrar respostas do Capítulo 1 canônico
  const findResp = (promptKeyOrId: string) => {
    return responses.find((r) => {
      const sVal = r.structured_value as any
      const metaKey = sVal?.prompt_key || sVal?.metadata?.prompt_key
      return (
        r.prompt_id === promptKeyOrId ||
        (r as any).prompt_key === promptKeyOrId ||
        metaKey === promptKeyOrId ||
        (r as any).canonical_prompt_id === promptKeyOrId
      )
    })
  }

  const p1StructureResp =
    findResp(AYV_C1_PROMPTS.P1_STRUCTURE.id) || findResp(AYV_C1_PROMPTS.P1_STRUCTURE.key)
  const p1DurationResp =
    findResp(AYV_C1_PROMPTS.P1_DURATION.id) || findResp(AYV_C1_PROMPTS.P1_DURATION.key)
  const p2SkinResp = findResp(AYV_C1_PROMPTS.P2_SKIN.id) || findResp(AYV_C1_PROMPTS.P2_SKIN.key)
  const p3HairResp = findResp(AYV_C1_PROMPTS.P3_HAIR.id) || findResp(AYV_C1_PROMPTS.P3_HAIR.key)
  const p4TempResp =
    findResp(AYV_C1_PROMPTS.P4_TEMPERATURE.id) || findResp(AYV_C1_PROMPTS.P4_TEMPERATURE.key)
  const p5ThirstResp =
    findResp(AYV_C1_PROMPTS.P5_THIRST.id) || findResp(AYV_C1_PROMPTS.P5_THIRST.key)
  const p5DrinkResp =
    findResp(AYV_C1_PROMPTS.P5_DRINK_TEMP.id) || findResp(AYV_C1_PROMPTS.P5_DRINK_TEMP.key)
  const p5SweatResp = findResp(AYV_C1_PROMPTS.P5_SWEAT.id) || findResp(AYV_C1_PROMPTS.P5_SWEAT.key)

  // Extração de dados estruturados e metadados
  const extractValAndMeta = (
    resp: ExperienceResponseRecord | undefined,
    optionsList: { id: string; label: string }[],
  ) => {
    if (!resp) {
      return {
        valueStr: 'Não respondido',
        metadata: null,
        isUnsure: false,
        isRefusal: false,
        isLowConfidence: false,
      }
    }
    const sVal = resp.structured_value as any
    const rawVal = sVal?.value || sVal?.choice || sVal?.selectedOptionIds
    const meta = sVal?.metadata || {}

    let labels: string[] = []
    if (Array.isArray(rawVal)) {
      labels = rawVal.map((v) => optionsList.find((o) => o.id === v)?.label || String(v))
    } else if (rawVal) {
      const match = optionsList.find((o) => o.id === rawVal)
      labels = [match ? match.label : String(rawVal)]
    }

    if (sVal?.secondary_choice) {
      const secMatch = optionsList.find((o) => o.id === sVal.secondary_choice)
      labels.push(secMatch ? secMatch.label : String(sVal.secondary_choice))
    }

    return {
      valueStr: labels.length > 0 ? labels.join('; ') : 'Vazio',
      metadata: meta,
      isUnsure: Boolean(meta.explicit_unsure),
      isRefusal: Boolean(meta.explicit_refusal),
      isLowConfidence: meta.historical_confidence === 'low' || Boolean(meta.contradiction_flag),
    }
  }

  const structInfo = extractValAndMeta(p1StructureResp, AYV_TELA1_STRUCTURE_OPTIONS)
  const durInfo = extractValAndMeta(p1DurationResp, AYV_TELA1_DURATION_OPTIONS)
  const skinInfo = extractValAndMeta(p2SkinResp, AYV_TELA2_SKIN_OPTIONS)
  const hairInfo = extractValAndMeta(p3HairResp, AYV_TELA3_HAIR_OPTIONS)
  const tempInfo = extractValAndMeta(p4TempResp, AYV_TELA4_TEMPERATURE_OPTIONS)
  const thirstInfo = extractValAndMeta(p5ThirstResp, AYV_TELA5_THIRST_OPTIONS)
  const drinkInfo = extractValAndMeta(p5DrinkResp, AYV_TELA5_DRINK_TEMP_OPTIONS)
  const sweatInfo = extractValAndMeta(p5SweatResp, AYV_TELA5_SWEAT_OPTIONS)

  // Agrupamento de dúvidas, recusas e ausências
  const doubtItems = [
    { label: 'Estrutura corporal', ...structInfo },
    { label: 'Duração da estrutura', ...durInfo },
    { label: 'Pele habitual', ...skinInfo },
    { label: 'Cabelo habitual', ...hairInfo },
    { label: 'Temperatura habitual', ...tempInfo },
    { label: 'Sede habitual', ...thirstInfo },
    { label: 'Temperatura de bebida', ...drinkInfo },
    { label: 'Transpiração habitual', ...sweatInfo },
  ].filter((i) => i.isUnsure || i.isRefusal || i.valueStr === 'Não respondido')

  // Agrupamento de baixa confiança ou contradição
  const lowConfidenceItems = [
    { label: 'Estrutura corporal', ...structInfo },
    { label: 'Duração da estrutura', ...durInfo },
    { label: 'Pele habitual', ...skinInfo },
    { label: 'Cabelo habitual', ...hairInfo },
    { label: 'Temperatura habitual', ...tempInfo },
    { label: 'Sede habitual', ...thirstInfo },
    { label: 'Temperatura de bebida', ...drinkInfo },
    { label: 'Transpiração habitual', ...sweatInfo },
  ].filter((i) => i.isLowConfidence)

  return (
    <div className="space-y-5">
      {/* Banner de Garantia Epistêmica e Clínica */}
      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Fundação Canônica da Avaliação Ayurveda — Capítulo 1
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Exibição estritamente literal dos relatos basais de {participantName}. Nenhum dosha,
            diagnóstico, pontuação ou Prakriti/Vikriti automática é inferido sem a escuta clínica de
            Daiane.
          </p>
        </div>
      </div>

      {/* Grid com os 8 registros clínicos canônicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* 1. Estrutura Corporal Declarada */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">
              Estrutura Corporal Declarada
            </span>
            <Badge variant="outline" className="text-[9px] font-mono">
              histórico estável
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {structInfo.valueStr}
          </p>
          {structInfo.metadata?.historical_confidence && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Confiança histórica: {structInfo.metadata.historical_confidence}</span>
              <span>Estabilidade: {structInfo.metadata.stability}</span>
            </div>
          )}
        </div>

        {/* 2. Duração e Referência Histórica */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Estabilidade e Duração</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              tempo de vida
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {durInfo.valueStr}
          </p>
          {durInfo.metadata?.historical_confidence && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Confiança: {durInfo.metadata.historical_confidence}</span>
              <span>Camada: {durInfo.metadata.time_layer}</span>
            </div>
          )}
        </div>

        {/* 3. Pele */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Pele Habitual (até 2)</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              habitual
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {skinInfo.valueStr}
          </p>
        </div>

        {/* 4. Cabelo */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Cabelo Habitual (até 2)</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              habitual
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {hairInfo.valueStr}
          </p>
        </div>

        {/* 5. Temperatura */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Temperatura Corporal</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              reação térmica
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {tempInfo.valueStr}
          </p>
        </div>

        {/* 6. Sede */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Sede Habitual</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              bloco A
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {thirstInfo.valueStr}
          </p>
        </div>

        {/* 7. Bebida */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">
              Conforto Térmico da Bebida
            </span>
            <Badge variant="outline" className="text-[9px] font-mono">
              bloco B
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {drinkInfo.valueStr}
          </p>
        </div>

        {/* 8. Transpiração */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground font-serif">Transpiração Habitual</span>
            <Badge variant="outline" className="text-[9px] font-mono">
              bloco C
            </Badge>
          </div>
          <p className="text-foreground leading-relaxed font-mono text-[11px] bg-muted/20 p-2 rounded border border-border/40">
            {sweatInfo.valueStr}
          </p>
        </div>
      </div>

      {/* Dúvidas, recusas ou ausência de dados */}
      {doubtItems.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Dúvidas, Recusas e Ausências Registradas:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            {doubtItems.map((item, idx) => (
              <li key={idx}>
                <span className="font-medium">{item.label}: </span>
                <span>{item.valueStr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contradições ou baixa confiança histórica */}
      {lowConfidenceItems.length > 0 && (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span>Pontos de Atenção para Diálogo Clínico (Baixa Confiança Histórica):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
            {lowConfidenceItems.map((item, idx) => (
              <li key={idx}>
                <span className="font-medium text-foreground">{item.label}: </span>
                <span>
                  Relatou variação acentuada, ausência de marco estável ou dificuldade de
                  comparação.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
export default ProfessionalAyurvedaChapter1View
