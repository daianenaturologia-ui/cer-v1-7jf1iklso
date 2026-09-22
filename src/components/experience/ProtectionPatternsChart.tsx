import React from 'react'
import {
  CER_PROTECTION_PATTERNS,
  CerProtectionPatternDefinition,
  patternLabel,
} from '../../services/cerProtectionPatterns'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { X, Sparkles, HelpCircle, Shield } from 'lucide-react'

export type QualitativeIntensity =
  | 'Quase nunca'
  | 'Em algumas situações'
  | 'Frequentemente'
  | 'Com força sob pressão'
  | 'Não sei identificar'

export interface ProtectionPatternsChartProps {
  /**
   * Respostas da Pergunta 7 mapeadas por ID do padrão de proteção
   * (ex.: { insistente: 'Frequentemente', critico: 'Com força sob pressão', ... })
   * ou pelo formato salvo na resposta do motor.
   */
  p7Responses?: Record<string, string | QualitativeIntensity>
  /**
   * Padrões selecionados na Pergunta 8 como mais interferentes (IDs dos padrões).
   */
  p8InterferingIds?: string[]
  /**
   * Variante de tratamento do nome dos padrões ('formal' | 'afetivo' | etc., conforme suportado por patternLabel).
   */
  treatmentVariant?: Parameters<typeof patternLabel>[1]
  /**
   * Callback ao fechar o gráfico (caso exibido em modal/drawer ou painel retrátil).
   */
  onClose?: () => void
  /**
   * Título customizado opcional.
   */
  title?: string
  /**
   * Subtítulo customizado opcional.
   */
  description?: string
}

interface IntensityConfig {
  label: QualitativeIntensity
  widthPercent: number // Apenas para renderização do preenchimento visual relativo
  barColor: string
  badgeBg: string
  badgeText: string
  isUnknown?: boolean
}

const INTENSITY_CONFIGS: Record<QualitativeIntensity, IntensityConfig> = {
  'Quase nunca': {
    label: 'Quase nunca',
    widthPercent: 25,
    barColor: 'bg-emerald-500/70 dark:bg-emerald-400/60',
    badgeBg:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeText: 'Quase nunca',
  },
  'Em algumas situações': {
    label: 'Em algumas situações',
    widthPercent: 50,
    barColor: 'bg-teal-500/80 dark:bg-teal-400/70',
    badgeBg:
      'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    badgeText: 'Em algumas situações',
  },
  Frequentemente: {
    label: 'Frequentemente',
    widthPercent: 75,
    barColor: 'bg-amber-500/85 dark:bg-amber-400/75',
    badgeBg:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    badgeText: 'Frequentemente',
  },
  'Com força sob pressão': {
    label: 'Com força sob pressão',
    widthPercent: 100,
    barColor: 'bg-rose-500/85 dark:bg-rose-400/80',
    badgeBg:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    badgeText: 'Com força sob pressão',
  },
  'Não sei identificar': {
    label: 'Não sei identificar',
    widthPercent: 15,
    barColor: 'bg-stone-300 dark:bg-stone-600',
    badgeBg:
      'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    badgeText: 'Informação ainda não disponível',
    isUnknown: true,
  },
}

const DEFAULT_TITLE = 'Seus padrões de funcionamento'
const DEFAULT_DESCRIPTION =
  'Este gráfico representa como você percebe a presença desses padrões em seu funcionamento atual. Eles não definem sua personalidade e podem aparecer com intensidades diferentes conforme o contexto, a fase da vida e o nível de segurança ou sobrecarga.'

export const ProtectionPatternsChart: React.FC<ProtectionPatternsChartProps> = ({
  p7Responses = {},
  p8InterferingIds = [],
  treatmentVariant = 'formal',
  onClose,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) => {
  // 10 padrões canônicos na ordem de CER_PROTECTION_PATTERNS
  const patterns: CerProtectionPatternDefinition[] = CER_PROTECTION_PATTERNS

  const normalizedP8Set = React.useMemo(() => {
    return new Set((p8InterferingIds || []).map((id) => String(id).trim().toLowerCase()))
  }, [p8InterferingIds])

  // Função para recuperar a resposta qualitativa de um padrão
  const getPatternIntensity = (pattern: CerProtectionPatternDefinition): QualitativeIntensity => {
    const rawValue =
      p7Responses[pattern.id] ||
      p7Responses[pattern.id.toLowerCase()] ||
      p7Responses[pattern.nome.toLowerCase()] ||
      p7Responses[pattern.nome]

    if (!rawValue || typeof rawValue !== 'string') {
      return 'Não sei identificar'
    }

    const trimmed = rawValue.trim()
    if (trimmed in INTENSITY_CONFIGS) {
      return trimmed as QualitativeIntensity
    }

    // Normalizações tolerantes sem inventar dados
    const lower = trimmed.toLowerCase()
    if (lower.includes('quase nunca')) return 'Quase nunca'
    if (lower.includes('algumas')) return 'Em algumas situações'
    if (lower.includes('frequentemente') || lower.includes('frequente')) return 'Frequentemente'
    if (lower.includes('pressão') || lower.includes('pressao')) return 'Com força sob pressão'
    if (lower.includes('não sei') || lower.includes('nao sei') || lower.includes('desconhecido')) {
      return 'Não sei identificar'
    }

    return 'Não sei identificar'
  }

  const patternData = React.useMemo(() => {
    return patterns.map((p) => {
      const intensity = getPatternIntensity(p)
      const config = INTENSITY_CONFIGS[intensity]
      const isInterfering = normalizedP8Set.has(p.id.toLowerCase())
      const label = patternLabel(p, treatmentVariant)

      return {
        definition: p,
        label,
        intensity,
        config,
        isInterfering,
      }
    })
  }, [patterns, p7Responses, normalizedP8Set, treatmentVariant])

  return (
    <Card
      className="w-full max-w-4xl mx-auto border-stone-200 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900"
      role="region"
      aria-label={title}
    >
      <CardHeader className="pb-4 relative">
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar gráfico de padrões de funcionamento"
            className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-stone-700 dark:text-stone-300" aria-hidden="true" />
          <CardTitle className="text-xl sm:text-2xl font-serif text-stone-900 dark:text-stone-100 font-semibold tracking-tight">
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mt-2 text-justify sm:text-left">
          {description}
        </CardDescription>

        {/* Legenda Qualitativa das 5 Categorias */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            Legenda qualitativa
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {Object.values(INTENSITY_CONFIGS).map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-stone-50/80 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${item.barColor}`} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-xs text-stone-600 dark:text-stone-400">
            <Badge
              variant="outline"
              className="border-amber-300 dark:border-amber-600/70 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] font-medium inline-flex items-center gap-1 py-0 px-1.5"
            >
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              Percebido como mais interferente
            </Badge>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              (destaque indicado por você na Pergunta 8)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Lista visual de barras comparáveis */}
        <div
          className="space-y-3"
          role="list"
          aria-label="Lista de padrões de funcionamento e suas percepções atuais"
        >
          {patternData.map((item) => {
            const { definition, label, intensity, config, isInterfering } = item
            const altText = `${label} (${definition.nome}): percepção declarada como ${
              config.isUnknown ? 'informação ainda não disponível (não sei identificar)' : intensity
            }.${isInterfering ? ' Indicado por você como mais interferente.' : ''}`

            return (
              <div
                key={definition.id}
                role="listitem"
                tabIndex={0}
                aria-label={altText}
                className={`p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 ${
                  isInterfering
                    ? 'border-amber-300 dark:border-amber-600/70 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-850/40 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                }`}
              >
                {/* Linha de cabeçalho do padrão */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                      {label}
                    </span>
                    {label !== definition.nome && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        ({definition.nome})
                      </span>
                    )}
                    {isInterfering && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700 text-[11px] font-medium inline-flex items-center gap-1 py-0 px-2"
                      >
                        <Sparkles
                          className="w-3 h-3 text-amber-600 dark:text-amber-400"
                          aria-hidden="true"
                        />
                        Mais interferente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeBg}`}
                    >
                      {config.badgeText}
                    </span>
                  </div>
                </div>

                {/* Descrição resumida do padrão */}
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-2 leading-relaxed">
                  {definition.descricao}
                </p>

                {/* Barra visual comparável qualitativa */}
                <div
                  className="w-full bg-stone-200/80 dark:bg-stone-700/60 rounded-full h-3 overflow-hidden relative"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${config.barColor} ${
                      config.isUnknown
                        ? 'border-dashed border-2 border-stone-400 dark:border-stone-500'
                        : ''
                    }`}
                    style={{ width: `${config.widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Alternativa Textual Acessível abaixo do gráfico */}
        <div
          className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800"
          aria-label="Alternativa textual acessível aos dados do gráfico"
        >
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Resumo descritivo dos seus padrões (Alternativa Acessível)
            </h3>
          </div>
          <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed bg-stone-50 dark:bg-stone-850 p-3.5 rounded-md border border-stone-200/70 dark:border-stone-800">
            <p className="mb-2">
              A seguir, a listagem textual dos 10 padrões de proteção avaliados e a intensidade
              percebida por você:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {patternData.map((item) => (
                <li key={`accessible-${item.definition.id}`}>
                  <strong className="text-stone-800 dark:text-stone-200">{item.label}</strong>:
                  categoria declarada como{' '}
                  <span className="italic">
                    {item.config.isUnknown
                      ? 'Informação ainda não disponível (Não sei identificar)'
                      : item.intensity}
                  </span>
                  .
                  {item.isInterfering && (
                    <span className="text-amber-800 dark:text-amber-300 font-medium">
                      {' '}
                      (Identificado por você na Pergunta 8 como padrão que mais interfere na sua
                      vida atual).
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-200/60 dark:border-stone-700/60 pt-2">
              Observação ética: Esses dados refletem exclusivamente a sua autoavaliação percebida e
              não representam diagnóstico, nota de desempenho, classificação psicológica nem escala
              quantitativa.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProtectionPatternsChart
