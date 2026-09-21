import React, { useState } from 'react'
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
  AlertCircle,
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
  colorName: string
  textColor: string
  ringColor: string
  bgAccent: string
  xPercent: number // Centro percentual X na imagem
  yPercent: number // Centro percentual Y na imagem
  icon: React.ReactNode
}

/**
 * Mapeamento canônico das seis esferas conforme especificação exata:
 * - verde, superior esquerda: Corpo & Fisiologia (x: 24%, y: 16%)
 * - azul, superior direita: Mente & Emoções (x: 76%, y: 16%)
 * - amarela, centro esquerda: Regulação & Padrões de Resposta (x: 17%, y: 43%)
 * - coral, centro direita: Relações & Vínculos (x: 84%, y: 43%)
 * - lilás, inferior esquerda: Sexualidade & Intimidade (x: 22%, y: 72%)
 * - turquesa, inferior direita: Sentido & Conexão (x: 79%, y: 72%)
 * - centro luminoso: Meu Mapa CER (x: 50%, y: 39%)
 */
export const CANONICAL_DIMENSIONS: DimensionNodeInfo[] = [
  {
    id: 'corpo_fisiologia',
    experienceId: 'exp-corpo-fisiologia-07b',
    name: 'Corpo & Fisiologia',
    shortLabel: 'Corpo',
    description: 'Ritmo, digestão, sono, vitalidade e sinais físicos',
    colorName: 'verde',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    ringColor: 'ring-emerald-500/60 hover:ring-emerald-500 border-emerald-500/40 bg-emerald-500/15',
    bgAccent:
      'from-emerald-500/20 via-card to-card border-emerald-400/30 hover:border-emerald-500/60',
    xPercent: 24,
    yPercent: 16,
    icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    id: 'mente_emocoes',
    experienceId: 'exp-mente-emocoes-07c',
    name: 'Mente & Emoções',
    shortLabel: 'Mente',
    description: 'Pensamentos, estados de ânimo, clareza e ruminações',
    colorName: 'azul',
    textColor: 'text-sky-700 dark:text-sky-300',
    ringColor: 'ring-sky-500/60 hover:ring-sky-500 border-sky-500/40 bg-sky-500/15',
    bgAccent: 'from-sky-500/20 via-card to-card border-sky-400/30 hover:border-sky-500/60',
    xPercent: 76,
    yPercent: 16,
    icon: <Heart className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  },
  {
    id: 'regulacao_respostas',
    experienceId: 'exp-regulacao-respostas-07c',
    name: 'Regulação & Padrões de Resposta',
    shortLabel: 'Regulação',
    description: 'Como você responde à sobrecarga, estresse e limites',
    colorName: 'amarela',
    textColor: 'text-amber-800 dark:text-amber-200',
    ringColor: 'ring-amber-500/60 hover:ring-amber-500 border-amber-500/40 bg-amber-500/15',
    bgAccent: 'from-amber-500/20 via-card to-card border-amber-400/30 hover:border-amber-500/60',
    xPercent: 17,
    yPercent: 43,
    icon: <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  },
  {
    id: 'relacoes',
    experienceId: 'exp-relacoes-07d',
    name: 'Relações & Vínculos',
    shortLabel: 'Relações',
    description: 'Vínculos, trocas, pertencimento e convivência',
    colorName: 'coral',
    textColor: 'text-rose-700 dark:text-rose-300',
    ringColor: 'ring-rose-500/60 hover:ring-rose-500 border-rose-500/40 bg-rose-500/15',
    bgAccent: 'from-rose-500/20 via-card to-card border-rose-400/30 hover:border-rose-500/60',
    xPercent: 84,
    yPercent: 43,
    icon: <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
  },
  {
    id: 'sexualidade',
    experienceId: 'exp-sexualidade-07e',
    name: 'Sexualidade & Intimidade',
    shortLabel: 'Sexualidade',
    description: 'Desejo, intimidade, prazer e presença no corpo',
    colorName: 'lilás',
    textColor: 'text-purple-700 dark:text-purple-300',
    ringColor: 'ring-purple-500/60 hover:ring-purple-500 border-purple-500/40 bg-purple-500/15',
    bgAccent: 'from-purple-500/20 via-card to-card border-purple-400/30 hover:border-purple-500/60',
    xPercent: 22,
    yPercent: 72,
    icon: <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
  },
  {
    id: 'sentido_conexao',
    experienceId: 'exp-sentido-conexao-07f',
    name: 'Sentido & Conexão',
    shortLabel: 'Sentido',
    description: 'Propósito, espiritualidade, valores e pertencimento maior',
    colorName: 'turquesa',
    textColor: 'text-teal-700 dark:text-teal-300',
    ringColor: 'ring-teal-500/60 hover:ring-teal-500 border-teal-500/40 bg-teal-500/15',
    bgAccent: 'from-teal-500/20 via-card to-card border-teal-400/30 hover:border-teal-500/60',
    xPercent: 79,
    yPercent: 72,
    icon: <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
  },
]

export const SER_INTEGRAL_IMAGE_SRC = '/ser-integral-cer.png'
export const SER_INTEGRAL_ALT_TEXT =
  'Representação do Ser Integral conectado às seis dimensões da Consciência no Método CER.'

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
  const [imageError, setImageError] = useState(false)
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)

  // Encontrar estado de release de cada dimensão
  const getReleaseStatus = (experienceId: string): 'available' | 'in_progress' | 'completed' => {
    const found = availableExperiences.find(
      (e) =>
        e.experience_id === experienceId ||
        (e.expand?.experience_id && (e.expand.experience_id as any).id === experienceId),
    )
    if (found?.release_status === 'completed') return 'completed'
    if (found?.release_status === 'in_progress') return 'in_progress'
    return 'available'
  }

  // Label amigável do estado da dimensão
  const getStatusLabel = (status: 'available' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'in_progress':
        return 'Em andamento'
      default:
        return 'Disponível'
    }
  }

  const renderStatusBadge = (status: 'available' | 'in_progress' | 'completed') => {
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

  // Integração 07G não é uma 7ª dimensão, mas uma experiência integrativa
  const integracaoExp = availableExperiences.find(
    (e) =>
      e.experience_id === 'exp-integracao-consciencia-07g' ||
      (e.expand?.experience_id &&
        (e.expand.experience_id as any).id === 'exp-integracao-consciencia-07g'),
  )

  return (
    <div className="space-y-6">
      {/* Contêiner principal sobre o fundo creme institucional do aplicativo (#faf7f2 / warm cream) */}
      <div className="relative rounded-2xl border border-primary/20 bg-[#faf7f2] dark:bg-[#1f1d1a] p-4 sm:p-6 shadow-sm overflow-hidden">
        {/* Cabeçalho descritivo com foco no ser inteiro */}
        <div className="text-center max-w-xl mx-auto space-y-1.5 pb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            O Ser em Seis Dimensões
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            Sua Consciência Viva
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O ser humano não funciona em partes isoladas: a energia é transversal, a consciência
            integra e sua identidade emerge desse todo. Toque em qualquer uma das seis esferas ou no
            centro para acessar seu percurso.
          </p>
        </div>

        {/* ÁREA DA IMAGEM RESPONSIVA DO SER INTEGRAL COM CAMADA DE INTERAÇÃO ACESSÍVEL */}
        <div className="relative max-w-2xl mx-auto my-2 aspect-4/3 w-full rounded-2xl overflow-hidden bg-[#faf7f2] dark:bg-[#1a1916] flex items-center justify-center border border-amber-200/40 shadow-inner">
          {/* Imagem aprovada ou Fallback Neutro (sem simular ilustração própria) */}
          {!imageError ? (
            <img
              src={SER_INTEGRAL_IMAGE_SRC}
              alt={SER_INTEGRAL_ALT_TEXT}
              onError={() => setImageError(true)}
              className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300"
            />
          ) : (
            /* Fallback visual neutro: contêiner creme limpo com texto alternativo conforme especificação */
            <div
              data-testid="ser-integral-fallback"
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#faf7f2] dark:bg-[#1f1d1a] border border-dashed border-amber-300/60 rounded-xl"
            >
              <AlertCircle className="w-8 h-8 text-amber-600 mb-2 opacity-70" />
              <p className="font-serif font-medium text-sm text-foreground max-w-md">
                Representação do Ser Integral
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                {SER_INTEGRAL_ALT_TEXT}
              </p>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-2 font-mono">
                Asset oficial aprovado aguardando fornecimento do arquivo
                &ldquo;ser-integral-cer.png&rdquo;.
              </span>
            </div>
          )}

          {/* CAMADA DE SOBREPOSIÇÃO: 6 BOTÕES INTERATIVOS NAS ESFERAS + 1 CENTRO LUMINOSO */}
          <div
            role="region"
            aria-label="Mapa interativo do Ser Integral com seis esferas e Mapa CER central"
            className="absolute inset-0 pointer-events-auto"
          >
            {/* 1. AS SEIS ESFERAS */}
            {CANONICAL_DIMENSIONS.map((dim) => {
              const status = getReleaseStatus(dim.experienceId)
              const statusLabel = getStatusLabel(status)
              const isHovered = hoveredDimension === dim.id

              return (
                <div
                  key={dim.id}
                  style={{
                    left: `${dim.xPercent}%`,
                    top: `${dim.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-10 flex flex-col items-center"
                >
                  <button
                    type="button"
                    onClick={() => onSelectExperience(dim.experienceId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectExperience(dim.experienceId)
                      }
                    }}
                    onMouseEnter={() => setHoveredDimension(dim.id)}
                    onMouseLeave={() => setHoveredDimension(null)}
                    tabIndex={0}
                    role="button"
                    data-testid={`dimension-sphere-${dim.id}`}
                    aria-label={`${dim.name} (${dim.colorName}) — ${statusLabel}. Pressione para abrir a experiência.`}
                    className={`group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 backdrop-blur-xs transition-all duration-200 cursor-pointer shadow-md hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${dim.ringColor}`}
                  >
                    {/* Efeito de pulso suave na esfera */}
                    <span className="sr-only">
                      {dim.name} — {statusLabel}
                    </span>
                    <div className="p-1 rounded-full bg-background/80 shadow-xs">{dim.icon}</div>
                  </button>

                  {/* Nome e estado visíveis no computador próximos à esfera (sem cobrir o centro) */}
                  <div
                    className={`hidden sm:flex flex-col items-center mt-1 pointer-events-none transition-all duration-200 ${
                      isHovered ? 'scale-105 opacity-100' : 'opacity-90'
                    }`}
                  >
                    <span className="text-[11px] md:text-xs font-serif font-semibold text-foreground bg-background/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs border border-border/40 whitespace-nowrap">
                      {dim.name}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5 bg-background/70 px-1.5 rounded">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* 2. CENTRO LUMINOSO: MEU MAPA CER (ÚNICA ENTRADA DO MAPA) */}
            <div
              style={{
                left: '50%',
                top: '39%',
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20 flex flex-col items-center"
            >
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
                data-testid="ser-integral-map-center"
                aria-label={
                  hasPublishedMap
                    ? 'Abrir Meu Mapa CER — Devolutiva publicada por Daiane'
                    : 'Meu Mapa CER — em construção'
                }
                className={`group relative flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                  hasPublishedMap
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-emerald-500/20 hover:border-emerald-600'
                    : 'border-amber-400/80 bg-amber-400/20 shadow-amber-400/20 hover:border-amber-500 border-dashed'
                }`}
              >
                <div className="p-1.5 rounded-full bg-background/90 shadow-xs mb-0.5">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <span className="text-[9px] sm:text-[10px] md:text-[11px] font-serif font-bold text-foreground text-center leading-tight px-1">
                  Meu Mapa CER
                </span>
                <span className="sr-only">
                  {hasPublishedMap ? 'Abrir Meu Mapa CER' : 'Meu Mapa CER — em construção'}
                </span>
              </button>

              {/* Rótulo textual oficial sob o centro no computador */}
              <div className="hidden sm:block mt-1 text-center pointer-events-none">
                <span
                  className={`text-[10px] md:text-[11px] font-serif font-semibold px-2 py-0.5 rounded-full border shadow-xs ${
                    hasPublishedMap
                      ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-300'
                  }`}
                >
                  {hasPublishedMap ? 'Abrir Meu Mapa CER' : 'Meu Mapa CER — em construção'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA OU BOTÃO CENTRAL EXPLÍCITO NO CELULAR (Item 5 da especificação: Centro é a única entrada) */}
        <div className="sm:hidden pt-2 flex justify-center">
          <Button
            type="button"
            onClick={onOpenMap}
            variant={hasPublishedMap ? 'default' : 'outline'}
            size="sm"
            className="w-full text-xs h-9 gap-1.5 font-serif font-semibold"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{hasPublishedMap ? 'Abrir Meu Mapa CER' : 'Meu Mapa CER — em construção'}</span>
          </Button>
        </div>

        {/* ÁREA COMPLEMENTAR RESPONSIVA: 6 BOTÕES COMPACTOS NO CELULAR (Especificação Item 6)
            Abaixo da imagem, apresenta seis botões compactos com as mesmas cores, nomes e estados,
            para garantir legibilidade perfeita em qualquer tamanho de tela sem reduzir os textos. */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Dimensões do Ser Integral
            </span>
            <span className="text-[11px] text-muted-foreground">
              6 dimensões disponíveis simultaneamente
            </span>
          </div>

          <div
            role="region"
            aria-label="Lista de dimensões da Consciência"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          >
            {CANONICAL_DIMENSIONS.map((dim) => {
              const status = getReleaseStatus(dim.experienceId)
              const statusLabel = getStatusLabel(status)

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
                  data-testid={`dimension-card-${dim.id}`}
                  aria-label={`Dimensão ${dim.name} (${dim.colorName}), estado: ${statusLabel}`}
                  className={`text-left rounded-xl border p-3 sm:p-3.5 transition-all duration-200 bg-gradient-to-br ${dim.bgAccent} cursor-pointer hover:shadow-md hover:-translate-y-0.5 outline-hidden focus-visible:ring-2 focus-visible:ring-primary`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-background/80 shadow-xs shrink-0">
                        {dim.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="font-serif font-semibold text-xs sm:text-sm text-foreground block truncate">
                          {dim.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground block capitalize">
                          Esfera {dim.colorName}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">{renderStatusBadge(status)}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* EXPERIÊNCIA DE INTEGRAÇÃO (07G) — Ponte integrativa pós-dimensões */}
        {integracaoExp && (
          <div className="mt-5 pt-4 border-t border-border/40">
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card">
              <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Integração da Consciência
                    </Badge>
                    {renderStatusBadge(
                      integracaoExp.release_status === 'completed'
                        ? 'completed'
                        : integracaoExp.release_status === 'in_progress'
                          ? 'in_progress'
                          : 'available',
                    )}
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
