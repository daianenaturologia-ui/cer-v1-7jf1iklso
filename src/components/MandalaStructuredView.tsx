import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cerMandalaReadModelService } from '@/services/cerMandalaService'
import type { MandalaReadModel } from '@/types/cer'
import {
  Compass,
  Target,
  Sparkles,
  Shield,
  Activity,
  History,
  TrendingUp,
  RefreshCw,
  Layers,
} from 'lucide-react'

interface MandalaStructuredViewProps {
  enrollmentId: string
  onRefreshRequested?: () => void
}

export const MandalaStructuredView: React.FC<MandalaStructuredViewProps> = ({
  enrollmentId,
  onRefreshRequested,
}) => {
  const [mandala, setMandala] = useState<MandalaReadModel | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMandala = async () => {
    setLoading(true)
    try {
      const data = await cerMandalaReadModelService.getMandalaProjection(enrollmentId)
      setMandala(data)
    } catch (err) {
      console.error('Erro ao projetar Mandala:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMandala()
  }, [enrollmentId])

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Organizando a projeção da Mandala de Cuidado...</span>
      </div>
    )
  }

  if (!mandala) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Nenhum dado disponível para organizar a Mandala neste momento.
      </div>
    )
  }

  return (
    <div
      className="space-y-6 max-w-4xl mx-auto"
      role="region"
      aria-label="Mandala Estruturada de Cuidado"
    >
      {/* Header com propósito e declaração de Read-Model */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
              Mandala V1 (Read-Model)
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-normal">
              Zero Score • Projeção Viva
            </Badge>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mt-1 flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            <span>Como o meu cuidado está se organizando e mudando</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estrutura descritiva integrada. A Mandala deriva de prioridades, experimentos, recursos
            e movimento recente — sem rankings ou notas de eficácia.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadMandala()
            if (onRefreshRequested) onRefreshRequested()
          }}
          className="text-xs h-8 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Visão</span>
        </Button>
      </div>

      {/* Grid com as 6 seções obrigatórias da Mandala Estruturada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SEÇÃO 1: O que estamos cuidando (Active Priorities) */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span>1. O que estamos cuidando</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Prioridades ativas acordadas no plano de cuidado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {mandala.active_priorities.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhuma prioridade ativa registrada.</p>
            ) : (
              mandala.active_priorities.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{p.title}</span>
                    {p.is_possible_now && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-primary border-primary/30"
                      >
                        Possível agora
                      </Badge>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 2: Experimentos em andamento (Active Assignments) */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>2. Experimentos em andamento</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Práticas propostas para vivência e observação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {mandala.active_experiments.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhum experimento ativo no momento.</p>
            ) : (
              mandala.active_experiments.map((exp) => (
                <div
                  key={exp.assignment_id}
                  className="p-2.5 rounded-lg border border-border/40 bg-muted/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{exp.safe_title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {exp.status === 'active' ? 'Ativo' : exp.status}
                    </Badge>
                  </div>
                  {exp.safe_summary && (
                    <p className="text-[11px] text-muted-foreground">{exp.safe_summary}</p>
                  )}
                  {(exp.frequency || exp.duration) && (
                    <p className="text-[10px] text-muted-foreground/80 font-mono">
                      {[exp.frequency, exp.duration].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3: Recursos disponíveis (Recognized Resources) */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>3. Recursos disponíveis</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Âncoras, apoios e recursos próprios já reconhecidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {mandala.recognized_resources.length === 0 ? (
              <p className="text-muted-foreground italic">
                Recursos em processo de mapeamento e reconhecimento.
              </p>
            ) : (
              mandala.recognized_resources.map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-foreground"
                >
                  <p className="leading-relaxed">"{res.statement}"</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 4: Como está minha capacidade (Current Capacity) */}
        <Card className="border-border/70 bg-card/60">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>4. Como está minha capacidade</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Percepção contínua de espaço e ritmo no momento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <span className="font-semibold text-foreground block">Síntese de Espaço:</span>
              <p className="text-muted-foreground leading-relaxed">
                {mandala.current_capacity.summary}
              </p>
            </div>
            {mandala.current_capacity.last_response && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Último registro de capacidade:</span>
                <Badge variant="outline" className="capitalize font-normal">
                  {mandala.current_capacity.last_response.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 5: Movimento recente (Recent Movement / Descriptive Digest) */}
        <Card className="border-border/70 bg-card/60 md:col-span-2">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>5. Movimento recente</span>
            </CardTitle>
            <CardDescription className="text-xs">
              O que você experimentou e registrou nas últimas semanas (sem percentuais de eficácia)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <p className="font-medium text-foreground">
                {mandala.recent_movement.descriptive_digest}
              </p>
            </div>

            {mandala.recent_movement.recent_responses.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Registros Recentes:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {mandala.recent_movement.recent_responses.map((resp) => (
                    <div
                      key={resp.id}
                      className="p-2 rounded-lg border border-border/40 bg-card text-[11px] space-y-0.5"
                    >
                      <span className="font-medium text-foreground block truncate">
                        {resp.safe_title}
                      </span>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <Badge variant="secondary" className="text-[9px] capitalize py-0">
                          {resp.response_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[9px] font-mono">
                          {new Date(resp.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 6: Direção atual & Ciclo (Direction) */}
        <Card className="border-border/70 bg-card/60 md:col-span-2">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>6. Direção atual do cuidado</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Intenção compartilhada e momento do ciclo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              {mandala.care_cycle && (
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 flex-1 space-y-1">
                  <span className="font-semibold text-foreground block">
                    Ciclo #{mandala.care_cycle.cycle_number} ({mandala.care_cycle.status})
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    {mandala.care_cycle.focus_summary || 'Ciclo de experimentação e acolhimento.'}
                  </p>
                </div>
              )}
              {mandala.direction && (
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 flex-1 space-y-1">
                  <span className="font-semibold text-foreground block">
                    Modo de Direção: {mandala.direction.mode}
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    {mandala.direction.statement ||
                      'Desenvolvimento contínuo de recursos integrados.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
