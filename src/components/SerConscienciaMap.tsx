import React from 'react'
import {
  Activity,
  Heart,
  Shield,
  Users,
  Flame,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EnrollmentExperienceRecord } from '@/types/cer'

export interface DimensionNodeInfo {
  id: string
  experienceId: string
  name: string
  shortLabel: string
  description: string
  icon: React.ReactNode
  color: string
}

export const CANONICAL_DIMENSIONS: DimensionNodeInfo[] = [
  {
    id: 'corpo_fisiologia',
    experienceId: 'exp-corpo-fisiologia-07b',
    name: 'Corpo & Fisiologia',
    shortLabel: 'Corpo',
    description: 'Ritmo, digestão, sono, vitalidade e sinais físicos',
    icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60',
  },
  {
    id: 'mente_emocoes',
    experienceId: 'exp-mente-emocoes-07c',
    name: 'Mente & Emoções',
    shortLabel: 'Mente',
    description: 'Pensamentos, estados de ânimo, clareza e ruminações',
    icon: <Heart className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
    color: 'from-sky-500/15 to-sky-500/5 border-sky-500/30 hover:border-sky-500/60',
  },
  {
    id: 'regulacao_respostas',
    experienceId: 'exp-regulacao-respostas-07c',
    name: 'Regulação & Padrões de Resposta',
    shortLabel: 'Regulação',
    description: 'Como você responde à sobrecarga, estresse e limites',
    icon: <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    color: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 hover:border-amber-500/60',
  },
  {
    id: 'relacoes',
    experienceId: 'exp-relacoes-07d',
    name: 'Relações',
    shortLabel: 'Relações',
    description: 'Vínculos, trocas, pertencimento e convivência',
    icon: <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
    color: 'from-violet-500/15 to-violet-500/5 border-violet-500/30 hover:border-violet-500/60',
  },
  {
    id: 'sexualidade',
    experienceId: 'exp-sexualidade-07e',
    name: 'Sexualidade & Intimidade',
    shortLabel: 'Sexualidade',
    description: 'Desejo, intimidade, prazer e presença no corpo',
    icon: <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
    color: 'from-rose-500/15 to-rose-500/5 border-rose-500/30 hover:border-rose-500/60',
  },
  {
    id: 'sentido_conexao',
    experienceId: 'exp-sentido-conexao-07f',
    name: 'Sentido & Conexão',
    shortLabel: 'Sentido',
    description: 'Propósito, espiritualidade, valores e pertencimento maior',
    icon: <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
    color: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/60',
  },
]

interface SerConscienciaMapProps {
  availableExperiences: EnrollmentExperienceRecord[]
  hasPublishedMap: boolean
  onSelectExperience: (experienceId: string) => void
  onOpenMap: () => void
}

export const SerConscienciaMap: React.FC<SerConscienciaMapProps> = ({
  availableExperiences,
  hasPublishedMap,
  onSelectExperience,
  onOpenMap,
}) => {
  // Encontrar estado de release de cada dimensão
  const getReleaseStatus = (experienceId: string) => {
    const found = availableExperiences.find(
      (e) =>
        e.experience_id === experienceId ||
        (e.expand?.experience_id && (e.expand.experience_id as any).id === experienceId),
    )
    return found?.release_status || 'available'
  }

  // Integração 07G não é uma 7ª dimensão, mas uma experiência integrativa
  const integracaoExp = availableExperiences.find(
    (e) =>
      e.experience_id === 'exp-integracao-consciencia-07g' ||
      (e.expand?.experience_id &&
        (e.expand.experience_id as any).id === 'exp-integracao-consciencia-07g'),
  )

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 gap-1 font-normal"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Concluída
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 gap-1 font-normal"
          >
            <Clock className="w-3 h-3 text-amber-600" />
            Em andamento
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-primary/10 text-primary border-primary/30 font-normal"
          >
            Disponível
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Representação visual do Ser Integral Navegável */}
      <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-card/95 via-card/60 to-muted/20 p-5 sm:p-7 shadow-sm">
        {/* Cabeçalho descritivo */}
        <div className="text-center max-w-xl mx-auto space-y-1.5 pb-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            O Ser em Seis Dimensões
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            Sua Consciência Viva
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O ser humano não funciona em partes isoladas: a energia é transversal, a consciência
            integra e sua identidade emerge desse todo. Escolha qualquer uma das seis esferas para
            começar na ordem que fizer mais sentido.
          </p>
        </div>

        {/* FIGURA HUMANA CENTRAL COM ENTRADA ÚNICA DO MAPA CER */}
        <div className="max-w-md mx-auto mb-6">
          <button
            type="button"
            onClick={onOpenMap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpenMap()
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Abrir Meu Mapa CER no centro da figura humana"
            className={`w-full text-left rounded-xl transition-all duration-200 border-2 p-4 sm:p-5 outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
              hasPublishedMap
                ? 'border-primary/60 bg-gradient-to-br from-primary/15 via-card to-card hover:border-primary shadow-md'
                : 'border-dashed border-primary/30 bg-card/70 hover:border-primary/50'
            }`}
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 text-primary mb-0.5 border border-primary/30 shadow-xs">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-serif font-semibold text-base text-foreground flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Meu Mapa CER</span>
                  </h3>
                  {hasPublishedMap ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 font-normal"
                    >
                      Publicado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 font-normal"
                    >
                      Em construção
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {hasPublishedMap
                    ? 'Síntese integrativa com devolutiva revisada e apresentada por Daiane.'
                    : 'Centro integrativo da pessoa humana. Toque para ver o andamento do seu Mapa.'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* GRADE DAS 6 ESFERAS AO REDOR — NENHUMA HIERARQUIA, SEM NOTA OU RANKING */}
        <div
          role="region"
          aria-label="As seis esferas da Consciência"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {CANONICAL_DIMENSIONS.map((dim) => {
            const status = getReleaseStatus(dim.experienceId)

            return (
              <button
                key={dim.id}
                type="button"
                onClick={() => onSelectExperience(dim.experienceId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectExperience(dim.experienceId)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Dimensão ${dim.name}, estado: ${
                  status === 'completed'
                    ? 'Concluída'
                    : status === 'in_progress'
                      ? 'Em andamento'
                      : 'Disponível'
                }`}
                className={`text-left rounded-xl border p-4 transition-all duration-200 bg-gradient-to-br ${dim.color} cursor-pointer hover:shadow-md hover:-translate-y-0.5 outline-hidden focus-visible:ring-2 focus-visible:ring-primary`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-background/80 shadow-xs shrink-0">
                        {dim.icon}
                      </div>
                      <span className="font-serif font-semibold text-sm text-foreground truncate">
                        {dim.name}
                      </span>
                    </div>
                    <div className="shrink-0">{renderStatusBadge(status)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    {dim.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* EXPERIÊNCIA DE INTEGRAÇÃO (07G) — Sem nó próprio no ser, apresentada como ponte integrativa */}
        {integracaoExp && (
          <div className="mt-6 pt-5 border-t border-border/40">
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Integração da Consciência
                    </Badge>
                    {renderStatusBadge(integracaoExp.release_status)}
                  </div>
                  <h4 className="font-serif font-medium text-foreground text-sm">
                    {integracaoExp.expand?.experience_id?.title ||
                      'Integração e Síntese da Consciência'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    Momento de pausar e reconhecer os fios que ligam todas as seis dimensões antes
                    do desenho conjunto das prioridades.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectExperience('exp-integracao-consciencia-07g')}
                  className="text-xs h-8 px-4 shrink-0 gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {integracaoExp.release_status === 'completed'
                      ? 'Revisitar Integração'
                      : 'Abrir Integração'}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
export default SerConscienciaMap
