import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Compass,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { EnrollmentRecord } from '@/types/cer'
import type { AttentionItem } from '@/services/attentionService'

export type ParticipantFilter = 'all' | 'active' | 'waiting' | 'attention' | 'paused'

export interface ParticipantListItemData {
  enrollment: EnrollmentRecord
  fullName: string
  preferredName?: string
  email: string
  status: string // active, paused, etc.
  currentStage: string // onboarding, consciousness, equilibrium_realization
  stageStatus: string // nao_iniciado, em_andamento, integrado
  nextStep: string
  nextSessionDate?: string
  attentionCount: {
    security: number
    review: number
  }
}

interface ParticipantListProps {
  participants: ParticipantListItemData[]
  loading?: boolean
  onNewParticipantClick?: () => void
  className?: string
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  loading = false,
  onNewParticipantClick,
  className = '',
}) => {
  const [filter, setFilter] = useState<ParticipantFilter>('all')
  const [search, setSearch] = useState('')

  const stageLabels: Record<string, string> = {
    onboarding: 'Acolhimento',
    consciousness: 'Consciência',
    equilibrium_realization: 'Realização & Equilíbrio',
  }

  const stageStatusLabels: Record<string, string> = {
    nao_iniciado: 'A iniciar',
    em_andamento: 'Em andamento',
    integrado: 'Integrado',
  }

  // Filtragem
  const filtered = participants.filter((p) => {
    // Busca por texto
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = p.fullName.toLowerCase().includes(q)
      const matchPref = p.preferredName?.toLowerCase().includes(q)
      const matchEmail = p.email.toLowerCase().includes(q)
      if (!matchName && !matchPref && !matchEmail) return false
    }

    // Filtros de status
    if (filter === 'active') {
      return (
        p.status === 'active' && p.attentionCount.security === 0 && p.attentionCount.review === 0
      )
    }
    if (filter === 'waiting') {
      return p.stageStatus === 'nao_iniciado' || p.currentStage === 'onboarding'
    }
    if (filter === 'attention') {
      return p.attentionCount.security > 0 || p.attentionCount.review > 0
    }
    if (filter === 'paused') {
      return p.status === 'paused'
    }

    return true
  })

  return (
    <Card className={`border-border/70 ${className}`}>
      <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Participantes em Acompanhamento
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {participants.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Visão clínica centrada na pessoa: etapa atual, próximo passo e atenção necessária
            </CardDescription>
          </div>

          {onNewParticipantClick && (
            <Button
              size="sm"
              onClick={onNewParticipantClick}
              className="h-8 text-xs gap-1.5 self-start sm:self-auto"
            >
              <span>Vincular Nova Participante</span>
            </Button>
          )}
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setFilter('all')}
            >
              Todos ({participants.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'attention' ? 'secondary' : 'ghost'}
              className={`h-7 text-xs px-2.5 gap-1 ${
                participants.some(
                  (p) => p.attentionCount.security > 0 || p.attentionCount.review > 0,
                )
                  ? 'text-amber-800 dark:text-amber-300 font-semibold'
                  : ''
              }`}
              onClick={() => setFilter('attention')}
            >
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Precisam de atenção (
              {
                participants.filter(
                  (p) => p.attentionCount.security > 0 || p.attentionCount.review > 0,
                ).length
              }
              )
            </Button>
            <Button
              size="sm"
              variant={filter === 'active' ? 'secondary' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setFilter('active')}
            >
              Ativos
            </Button>
            <Button
              size="sm"
              variant={filter === 'waiting' ? 'secondary' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setFilter('waiting')}
            >
              Em espera
            </Button>
            <Button
              size="sm"
              variant={filter === 'paused' ? 'secondary' : 'ghost'}
              className="h-7 text-xs px-2.5"
              onClick={() => setFilter('paused')}
            >
              Pausados
            </Button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10">
            Carregando participantes...
          </p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {participants.length === 0
                ? 'Nenhuma participante vinculada ao seu perfil profissional.'
                : 'Nenhuma participante atende aos filtros selecionados.'}
            </p>
            {participants.length === 0 && onNewParticipantClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onNewParticipantClick}
                className="text-xs h-8"
              >
                Iniciar primeiro vínculo
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((item) => {
              const hasSecurity = item.attentionCount.security > 0
              const hasReview = item.attentionCount.review > 0

              return (
                <div
                  key={item.enrollment.id}
                  className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{item.fullName}</span>
                      {item.preferredName && item.preferredName !== item.fullName && (
                        <span className="text-xs text-muted-foreground">
                          ({item.preferredName})
                        </span>
                      )}

                      <Badge
                        variant={item.status === 'active' ? 'default' : 'outline'}
                        className="text-[10px] capitalize font-normal"
                      >
                        {item.status === 'active'
                          ? 'Ativo'
                          : item.status === 'paused'
                            ? 'Pausado'
                            : item.status}
                      </Badge>

                      {hasSecurity && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] gap-1 font-bold bg-red-600"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          Segurança
                        </Badge>
                      )}

                      {hasReview && !hasSecurity && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 font-medium"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Revisar Devolutiva
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-foreground/90 font-medium">
                        <Compass className="w-3.5 h-3.5 text-primary" />
                        {stageLabels[item.currentStage] || item.currentStage} (
                        {stageStatusLabels[item.stageStatus] || item.stageStatus})
                      </span>
                      <span>•</span>
                      <span>{item.email}</span>
                      {item.nextSessionDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-primary">
                            <Calendar className="w-3 h-3" />
                            Próxima sessão:{' '}
                            {new Date(item.nextSessionDate).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground pt-0.5">
                      <span className="font-medium text-foreground/80">Próximo passo: </span>
                      <span>{item.nextStep}</span>
                    </div>
                  </div>

                  <div className="shrink-0 self-end md:self-center">
                    <Link to={`/profissional/participantes/${item.enrollment.id}`}>
                      <Button size="sm" className="h-8 text-xs px-3 gap-1.5">
                        <span>Abrir Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
