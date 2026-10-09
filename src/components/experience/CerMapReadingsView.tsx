import React, { useState, useRef } from 'react'
import { AyurvedaPersonalReading } from './AyurvedaPersonalReading'
import { AyurvedaCareReasoning } from './AyurvedaCareReasoning'
import { IntegratedResourceGame } from './IntegratedResourceGame'
import { useOptionalAuth } from '@/contexts/AuthContext'
import { patternResources } from '@/services/cerPersonalReadings'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type {
  CerMapReadingSnapshot,
  CerMapReference,
  CerMapElementReading,
} from '@/types/cerMapReadings'
import { LIFE_HORIZONS } from '@/services/lifeDirections'
import { lifeTimeLabel } from '@/services/lifeTimeline'
import { CerArtStrip } from '@/components/CerArtwork'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sparkles,
  Info,
  Flame,
  Droplets,
  Heart,
  Compass,
  ArrowRight,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { CER_PROTECTION_PATTERNS } from '@/services/cerProtectionPatterns'
import { getCerProtectionPatternContent } from '@/services/cerProtectionPatternContent'
import { cn } from '@/lib/utils'

export interface CerMapReadingsViewProps {
  snapshot: CerMapReadingSnapshot
  initial?: boolean
}

interface DialogState {
  title: string
  subtitle?: string
  tag?: string
  content: React.ReactNode
  dialogClassName?: string
}

/**
 * 10 padrões canônicos mapeados para a nova nomenclatura narrativa,
 * preservando IDs canônicos.
 */
const BEHAVIOR_PATTERNS = [
  {
    canonicalKey: 'insistente',
    narrativeLabel: 'Insistente',
    shortConcept: 'Buscar fazer tudo do jeito certo',
  },
  {
    canonicalKey: 'prestativo',
    narrativeLabel: 'Prestativo',
    shortConcept: 'Cuidar das pessoas e deixar as próprias necessidades para depois',
  },
  {
    canonicalKey: 'hiper_realizador',
    narrativeLabel: 'Realizador incansável',
    shortConcept: 'Buscar valor por meio da produtividade e das conquistas',
  },
  {
    canonicalKey: 'vitima',
    narrativeLabel: 'Desencorajado',
    shortConcept: 'Perder o senso de escolha ou potência diante das dificuldades',
  },
  {
    canonicalKey: 'hiper_racional',
    narrativeLabel: 'Analítico',
    shortConcept: 'Compreender e resolver tudo principalmente pela razão',
  },
  {
    canonicalKey: 'hipervigilante',
    narrativeLabel: 'Hipervigilante',
    shortConcept: 'Antecipar constantemente o que pode dar errado',
  },
  {
    canonicalKey: 'inquieto',
    narrativeLabel: 'Inquieto',
    shortConcept: 'Manter-se ocupado, mudar de foco ou buscar estímulos',
  },
  {
    canonicalKey: 'comandante',
    narrativeLabel: 'Comandante',
    shortConcept: 'Assumir o controle para reduzir incerteza ou vulnerabilidade',
  },
  {
    canonicalKey: 'evitativo',
    narrativeLabel: 'Esquivo',
    shortConcept: 'Evitar desconfortos, conflitos, decisões ou emoções difíceis',
  },
  {
    canonicalKey: 'critico',
    narrativeLabel: 'Crítico',
    shortConcept: 'Perceber falhas e cobrar correções de si, dos outros ou das situações',
  },
] as const

/**
 * Escala categórica ordinal canônica
 */
type CategoricalFrequency =
  | 'quase_nunca'
  | 'algumas_situacoes'
  | 'com_frequencia'
  | 'sob_pressao'
  | 'desconhecido'
  | 'ausente'

const CATEGORY_SCALE_MAP: Record<
  CategoricalFrequency,
  {
    label: string
    shortLabel: string
    heightPercent: number
    color: string
    badge: string
    isUnknown?: boolean
  }
> = {
  quase_nunca: {
    label: 'Quase nunca acontece comigo',
    shortLabel: 'Quase nunca',
    heightPercent: 25,
    color: 'bg-emerald-500/80',
    badge:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  algumas_situacoes: {
    label: 'Aparece em algumas situações',
    shortLabel: 'Algumas situações',
    heightPercent: 50,
    color: 'bg-teal-500/80',
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  },
  com_frequencia: {
    label: 'Repete-se com frequência',
    shortLabel: 'Frequente',
    heightPercent: 75,
    color: 'bg-amber-500/85',
    badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200',
  },
  sob_pressao: {
    label: 'Aparece com muita força quando estou sob pressão',
    shortLabel: 'Sob pressão',
    heightPercent: 100,
    color: 'bg-rose-500/85',
    badge: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200',
  },
  desconhecido: {
    label: 'Ainda não sei dizer',
    shortLabel: 'Ainda não sei',
    heightPercent: 15,
    color: 'bg-stone-300 dark:bg-stone-600',
    badge: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300',
    isUnknown: true,
  },
  ausente: {
    label: 'Não informado',
    shortLabel: 'Não informado',
    heightPercent: 0,
    color: 'bg-transparent',
    badge:
      'bg-stone-50 text-stone-400 border-dashed border-stone-200 dark:bg-stone-900 dark:text-stone-500',
    isUnknown: true,
  },
}

function resolveCategoricalFrequency(text: string | undefined): CategoricalFrequency {
  if (!text) return 'ausente'
  const lower = text.toLowerCase()
  if (lower.includes('pressão') || lower.includes('pressao') || lower.includes('muita força'))
    return 'sob_pressao'
  if (
    lower.includes('frequência') ||
    lower.includes('frequencia') ||
    lower.includes('frequentemente')
  )
    return 'com_frequencia'
  if (lower.includes('algumas')) return 'algumas_situacoes'
  if (lower.includes('quase nunca')) return 'quase_nunca'
  if (
    lower.includes('ainda não sei') ||
    lower.includes('não sei') ||
    lower.includes('nao sei') ||
    lower.includes('identificar')
  )
    return 'desconhecido'
  return 'ausente'
}

/**
 * 4 reações canônicas de Regulação
 */
const REGULATION_REACTIONS = [
  {
    id: 'luta',
    key: 'resolver_imediatamente',
    title: 'Luta',
    subtitle: 'Resolver e intervir',
    description: 'Tentar resolver e controlar imediatamente; falar firme, agir rápido.',
    concept:
      'A resposta de Luta (mobilização ativa) é uma tentativa de restabelecer a segurança e o controle através da ação afirmativa e direta. Esse movimento reúne recursos de defesa, iniciativa e resolução, que podem ser ajustados conforme a situação.',
  },
  {
    id: 'fuga',
    key: 'afastar_recolher',
    title: 'Fuga',
    subtitle: 'Afastamento e recolhimento',
    description: 'Me afastar, calar ou buscar distância física para respirar.',
    concept:
      'A resposta de Fuga (afastamento protetivo) busca colocar espaço ou silêncio diante de sobrecarga ou tensão excessiva. Representa uma necessidade legítima de reorganização interna e respiração, não covardia nem desinteresse afetivo.',
  },
  {
    id: 'paralisacao',
    key: 'travar_congelar',
    title: 'Paralisação',
    subtitle: 'Pausa ou suspensão',
    description: 'Ficar em dúvida, paralisada ou sem saber o que falar.',
    concept:
      'Em momentos intensos, pode ficar difícil falar, decidir ou agir. A leitura da Paralisação ajuda a reconhecer esse intervalo e as condições de tempo, apoio e recuperação que favorecem retomar a resposta.',
  },
  {
    id: 'submissao',
    key: 'ceder_agradar',
    title: 'Submissão',
    subtitle: 'Apaziguar e ceder',
    description: 'Ceder, concordar ou tentar acalmar os outros para evitar atrito.',
    concept:
      'A resposta de Submissão ou apaziguamento é uma estratégia relacional inteligente de preservação do vínculo e contenção do conflito imediato. A pessoa busca proteger a conexão em momentos de alta sensibilidade; reconhecer esse recurso ajuda a equilibrar vínculo e expressão das próprias necessidades.',
  },
] as const

export function CerMapReadingsView({ snapshot, initial = false }: CerMapReadingsViewProps) {
  const auth = useOptionalAuth()
  const [activeDialog, setActiveDialog] = useState<DialogState | null>(null)
  const triggerRef = useRef<HTMLElement | SVGElement | null>(null)

  const openDialog = (state: DialogState, trigger?: HTMLElement | SVGElement | null) => {
    if (trigger) {
      triggerRef.current = trigger
    } else if (
      typeof document !== 'undefined' &&
      (document.activeElement instanceof HTMLElement ||
        document.activeElement instanceof SVGElement)
    ) {
      triggerRef.current = document.activeElement
    }
    setActiveDialog(state)
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  // Dimensões do snapshot
  const dimCorpo = snapshot.dimensions?.find((d) => d?.id === 'corpo')
  const dimMente = snapshot.dimensions?.find((d) => d?.id === 'mente')
  const dimRegulacao = snapshot.dimensions?.find((d) => d?.id === 'regulacao')

  // Verificação estrita de percentuais de dosha no snapshot publicado
  const doshaPercents = (() => {
    // Procura por números explícitos nos summaryRows ou detailedRows
    const allCorpoRows = [...(dimCorpo?.detailedRows || []), ...(dimCorpo?.summaryRows || [])]
    const vataRow = allCorpoRows.find(
      (r) => /vata.*(percentual|%|\d+)/i.test(r.label) || /vata.*:\s*\d+%/i.test(r.text),
    )
    const pittaRow = allCorpoRows.find(
      (r) => /pitta.*(percentual|%|\d+)/i.test(r.label) || /pitta.*:\s*\d+%/i.test(r.text),
    )
    const kaphaRow = allCorpoRows.find(
      (r) => /kapha.*(percentual|%|\d+)/i.test(r.label) || /kapha.*:\s*\d+%/i.test(r.text),
    )
    if (!vataRow || !pittaRow || !kaphaRow) return null

    const extractNum = (str: string) => {
      const match = str.match(/(\d+(?:\.\d+)?)\s*%?/)
      return match ? parseFloat(match[1]) : NaN
    }
    const v = extractNum(vataRow.text)
    const p = extractNum(pittaRow.text)
    const k = extractNum(kaphaRow.text)
    if (
      Number.isFinite(v) &&
      Number.isFinite(p) &&
      Number.isFinite(k) &&
      v >= 0 &&
      p >= 0 &&
      k >= 0 &&
      Math.abs(v + p + k - 100) < 0.5
    ) {
      return { vata: v, pitta: p, kapha: k }
    }
    return null
  })()

  // Extração de leituras de Agni e Ama do snapshot
  const agniRow =
    dimCorpo?.summaryRows.find((r) => /agni/i.test(r.label)) ||
    dimCorpo?.detailedRows.find((r) => /agni/i.test(r.label))
  const amaRow =
    dimCorpo?.summaryRows.find((r) => /ama/i.test(r.label)) ||
    dimCorpo?.detailedRows.find((r) => /ama/i.test(r.label))

  // Extração das respostas dos 10 padrões no snapshot
  const getPatternRow = (canonicalKey: string) => {
    const patternDef = CER_PROTECTION_PATTERNS[canonicalKey]
    const targetDesc = patternDef?.movementDescription?.toLowerCase() || ''
    const row = dimMente?.detailedRows.find((r) => {
      const lbl = r.label.toLowerCase()
      if (lbl === canonicalKey || lbl.includes(canonicalKey)) return true
      if (patternDef && lbl.includes(patternDef.baseName.toLowerCase())) return true
      if (targetDesc && lbl.includes(targetDesc.slice(0, 20))) return true
      return false
    })
    return row
  }

  // Extração das respostas de Regulação
  const getRegulationStatus = (item: (typeof REGULATION_REACTIONS)[number]) => {
    const row = dimRegulacao?.detailedRows.find(
      (r) =>
        r.sourcePromptKey === 'resposta_tendencia' ||
        /resposta.*tendência|resposta.*tendencia/i.test(r.label),
    )
    if (!row) return { reported: false, detail: undefined }
    const phrases: Record<string, string[]> = {
      luta: ['Tentar resolver e controlar imediatamente', 'Luta:'],
      fuga: ['Me afastar, calar ou buscar distância física', 'Fuga:'],
      paralisacao: ['Ficar em dúvida, paralisada', 'Paralisação:'],
      submissao: ['Ceder, concordar ou tentar acalmar', 'Submissão:'],
    }
    return {
      reported: phrases[item.id].some((phrase) =>
        row.text.toLowerCase().includes(phrase.toLowerCase()),
      ),
      detail: row.text,
    }
  }

  const isDemoSnapshot =
    snapshot.overview?.toLowerCase().includes('dados fictícios') ||
    snapshot.overview?.toLowerCase().includes('fictício') ||
    snapshot.overview?.toLowerCase().includes('ficticio')

  const renderElementReadingSections = (reading: CerMapElementReading, _showDemoNote = true) => (
    <div className="space-y-3.5 pt-2 border-t border-border/50 text-xs">
      {reading.summary && (
        <div className="rounded-lg bg-muted/40 p-3 space-y-1">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-primary">
            Síntese do elemento
          </h4>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {reading.summary}
          </p>
        </div>
      )}

      {reading.observations?.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
            O que aparece nas suas respostas
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {reading.observations.map((obs, idx) => (
              <li key={idx} className="leading-relaxed">
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reading.interpretation && (
        <div className="space-y-1.5">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
            Como suas respostas se conectam
          </h4>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {reading.interpretation}
          </p>
        </div>
      )}

      {(reading.resources?.length > 0 || reading.costs?.length > 0) && (
        <div className="space-y-2 pt-1">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
            Recursos e pontos de atenção
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {reading.resources?.length > 0 && (
              <div className="border rounded-lg p-2.5 bg-card space-y-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Forças e potencialidades
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground text-[11px]">
                  {reading.resources.map((res, idx) => (
                    <li key={idx}>{res}</li>
                  ))}
                </ul>
              </div>
            )}
            {reading.costs?.length > 0 && (
              <div className="border rounded-lg p-2.5 bg-card space-y-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  Pontos de atenção e custos
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground text-[11px]">
                  {reading.costs.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {reading.connections?.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
            Como se conecta ao conjunto
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {reading.connections.map((conn, idx) => (
              <li key={idx} className="leading-relaxed">
                {conn}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  // Referências para modal
  const renderReferencesList = (refs: CerMapReference[]) => (
    <div className="space-y-3 pt-3 border-t text-xs">
      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
        Referências e fontes de consulta
      </h4>
      <ul className="space-y-2">
        {refs.map((ref) => (
          <li key={ref.id} className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{ref.citation}</span>
            <span className="block text-[11px] text-muted-foreground/80">
              {ref.kind} · {ref.scope}
            </span>
            {ref.url && /^https:\/\//.test(ref.url) && (
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline text-[11px] mt-0.5"
              >
                Consultar fonte original <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )

  const openHowMapHelps = (e?: React.MouseEvent<HTMLElement>) => {
    openDialog(
      {
        title: 'Como este mapa ajuda você',
        subtitle: 'O caminho do Método CER',
        tag: 'Método CER',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            <p>
              O autodesenvolvimento precisa de uma boa porção de autoconhecimento. Conhecer suas
              forças, vulnerabilidades e condições de vida ajuda você e a Daiane a escolher
              ferramentas e construir uma estratégia que faça sentido. Corpo, pensamentos, emoções,
              ações e relações influenciam-se mutuamente. O mapa apoia suas escolhas e será ajustado
              com sua experiência.
            </p>
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <h4 className="font-serif font-semibold">Como compreender esta leitura</h4>
              <p>
                O Mapa CER reúne suas respostas, leituras iniciais e referências de cuidado para
                apoiar o autoconhecimento. Ele não estabelece diagnósticos, define uma personalidade
                fixa nem substitui uma avaliação clínica. Os conceitos ayurvédicos são uma lente
                tradicional: doshas não são medidas genéticas, Agni não é um exame de metabolismo e
                Ama não significa toxinas detectadas no organismo. As descrições de proteção e
                sobrevivência ajudam a compreender respostas, sem comprovar trauma, estado do
                sistema nervoso ou causa histórica. As fontes fundamentam os conceitos utilizados;
                não constituem validação clínica ou psicométrica deste questionário. A leitura ganha
                precisão quando é conversada com você e integrada à sua história, saúde e cotidiano.
              </p>
            </div>
            <div className="grid gap-3 pt-2">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h4 className="font-serif font-semibold text-foreground text-sm">1. Consciência</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Questionários cuidadosos, Linha da Vida, identificação de forças essenciais e
                  necessidades reais da sua rotina.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h4 className="font-serif font-semibold text-foreground text-sm">2. Equilíbrio</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Plano de cuidado construído com a Daiane: práticas integrativas, ajustes de
                  hábitos e encaminhamentos individualizados.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h4 className="font-serif font-semibold text-foreground text-sm">3. Realização</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Pequenos passos possíveis no Planner, experimentos de cuidado no cotidiano e
                  anotações no Caderno.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <h4 className="font-serif font-semibold text-foreground text-sm">4. Evolução</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Observar, reconhecer conquistas, ajustar rotas e renovar os ciclos de cuidado com
                  autonomia.
                </p>
              </div>
            </div>
            {!!snapshot.lifeDirections?.length && (
              <div className="mt-4 pt-3 border-t">
                <h4 className="font-serif font-semibold text-xs uppercase tracking-wider text-primary mb-2">
                  Objetivos e Horizontes Compartilhados
                </h4>
                <div className="space-y-2">
                  {snapshot.lifeDirections.map((dir) => (
                    <div key={dir.id} className="text-xs border rounded p-2.5 bg-card">
                      <span className="font-medium text-foreground block">
                        {dir.title} ({LIFE_HORIZONS[dir.horizon]})
                      </span>
                      {dir.first_step && (
                        <span className="text-muted-foreground block mt-1">
                          Pequeno passo: {dir.first_step}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openDoshaDialog = (
    doshaName: 'Vata' | 'Pitta' | 'Kapha',
    e?: React.MouseEvent<HTMLElement | SVGElement>,
  ) => {
    const elementKey = doshaName.toLowerCase()
    const elementReading = snapshot.elementReadings?.[elementKey]

    const concepts = {
      Vata: {
        principle: 'Movimento e variabilidade',
        desc: 'Princípio tradicional ligado ao fluxo, criatividade, rapidez de percepção e adaptação. Quando instável, manifesta-se em secura, ritmo imprevisível e dispersão.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Vata representa movimento e variabilidade. Prakriti é a constituição de referência; Vikriti é o estado atual ou mudanças temporárias.',
      },
      Pitta: {
        principle: 'Transformação e calor',
        desc: 'Princípio tradicional ligado à digestão, foco, discernimento e metabolismo. Quando elevado, manifesta-se em calor corporal, sensibilidade térmica e agudeza.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Pitta representa transformação e calor. Prakriti é a constituição de referência; Vikriti é o estado atual.',
      },
      Kapha: {
        principle: 'Sustentação e estabilidade',
        desc: 'Princípio tradicional ligado à resistência tecidual, lubricidade, estabilidade emocional e calma. Quando acumulado, manifesta-se em lentidão ou retenção.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Kapha representa sustentação e estabilidade. Prakriti é a constituição de referência; Vikriti é o estado atual.',
      },
    }

    const info = concepts[doshaName]
    const relevantRows = (dimCorpo?.detailedRows || []).filter((r) =>
      r.label.toLowerCase().includes(doshaName.toLowerCase()),
    )

    openDialog(
      {
        title: `Dosha ${doshaName}`,
        subtitle: info.principle,
        tag: 'Corpo & Fisiologia',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading, false)
            ) : (
              <>
                <p>{info.desc}</p>
                <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-xs">
                  <span className="font-semibold text-foreground block">
                    Referencial tradicional
                  </span>
                  <p className="text-muted-foreground">{info.ayurvedaContext}</p>
                  <p className="text-muted-foreground mt-1">
                    A psique também é influenciada por história, educação, cultura, saúde, sono e
                    vínculos. Para aprofundar, converse com a Daiane sobre a avaliação ayurvédica
                    específica.
                  </p>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                    Leitura publicada relevante
                  </h4>
                  {relevantRows.length > 0 ? (
                    <div className="space-y-2">
                      {relevantRows.map((row, idx) => (
                        <div key={idx} className="border-l-2 border-primary/40 pl-3 py-1">
                          <span className="font-medium text-xs text-foreground block">
                            {row.label}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {row.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Conteúdo psicoeducativo geral. A leitura específica para esta dimensão será
                      aprofundada com a Daiane ao longo das sessões.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openAgniDialog = (e?: React.MouseEvent<HTMLElement>) => {
    const elementReading = snapshot.elementReadings?.['agni']
    openDialog(
      {
        title: 'Agni · Fogo Digestivo',
        subtitle: 'Capacidade de digestão e transformação',
        tag: 'Ayurveda',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading, false)
            ) : (
              <>
                <p>
                  Na tradição ayurvédica, Agni é a capacidade de digerir, assimilar e transformar
                  tanto alimentos quanto estímulos do mundo. É um aspecto central da nutrição e da
                  saúde integrativa: investigamos a fome, o conforto após comer, a eliminação e a
                  regularidade.
                </p>
                {agniRow && (
                  <div className="border-t pt-3 space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Sua leitura de Agni
                    </h4>
                    <p className="text-xs text-foreground font-medium">{agniRow.label}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {agniRow.text}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openAmaDialog = (e?: React.MouseEvent<HTMLElement>) => {
    const elementReading = snapshot.elementReadings?.['ama']
    openDialog(
      {
        title: 'Ama · Digestão Incompleta',
        subtitle: 'Conceito tradicional de sobrecarga e acúmulo',
        tag: 'Ayurveda',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading, false)
            ) : (
              <>
                <p>
                  Ama descreve sinais de processamento incompleto na tradição ayurvédica. A sensação
                  de peso após comer e a eliminação pegajosa ou incompleta ajudam a observar como
                  esse processo está terminando. Junto com Agni, essa leitura explica o ritmo da
                  digestão e o conforto que permanece depois da refeição.
                </p>
                {amaRow && (
                  <div className="border-t pt-3 space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Sua leitura de Ama
                    </h4>
                    <p className="text-xs text-foreground font-medium">{amaRow.label}</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {amaRow.text}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openPatternDialog = (
    patternKey: string,
    narrativeLabel: string,
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    const canonical = CER_PROTECTION_PATTERNS[patternKey]
    const content = getCerProtectionPatternContent(patternKey)
    const row = getPatternRow(patternKey)
    const profile = patternResources[patternKey]
    const active =
      row &&
      ['algumas_situacoes', 'com_frequencia', 'sob_pressao'].includes(
        resolveCategoricalFrequency(row.text),
      )
    const elementReading =
      snapshot.reviewedAt && snapshot.reviewedBy
        ? snapshot.elementReadings?.[patternKey]
        : row && profile
          ? {
              summary: `Você marcou: ${row.text}.`,
              observations: [],
              interpretation: active
                ? profile.text
                : 'Sua resposta registra este movimento sem destacá-lo como uma dificuldade frequente. Você pode conhecer o conceito sem acrescentá-lo à sua lista pessoal.',
              resources: active ? [profile.strength.join(': ')] : [],
              costs: active ? [profile.difficulty.join(': ')] : [],
              connections: [],
              questions: [],
            }
          : snapshot.elementReadings?.[patternKey]

    openDialog(
      {
        title: narrativeLabel,
        subtitle: canonical?.movementDescription || 'Padrão de Proteção CER',
        tag: 'Mente & Emoções',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading)
            ) : (
              <>
                {content?.shortDescription && <p>{content.shortDescription}</p>}

                {content?.commonThoughts?.length ? (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Pensamentos comuns quando ativo
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                      {content.commonThoughts.slice(0, 3).map((thought, i) => (
                        <li key={i}>{thought}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {content?.associatedFeelings?.length ? (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Sentimentos associados
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {content.associatedFeelings.slice(0, 4).join(' · ')}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-lg bg-muted/20 p-3 space-y-2 text-xs">
                  <h4 className="font-semibold text-foreground">O que este padrão pode proteger</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {content?.possibleProtectiveFunctions ||
                      'Em sua história de vida, esse movimento pode ter surgido para preservar vínculos, conter sobrecargas ou buscar segurança em momentos desafiadores.'}
                  </p>
                  {content?.clarificationNote && (
                    <p className="text-primary/90 font-medium pt-1 border-t border-border/50">
                      {content.clarificationNote}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="border rounded p-2.5 bg-card">
                    <span className="font-semibold text-foreground block mb-1">
                      Forças e potencialidades
                    </span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                      {(content?.strengths || ['Sensibilidade', 'Responsabilidade', 'Capacidade'])
                        .slice(0, 3)
                        .map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                    </ul>
                  </div>
                  <div className="border rounded p-2.5 bg-card">
                    <span className="font-semibold text-foreground block mb-1">
                      Custos possíveis
                    </span>
                    <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                      {(content?.costToSelf || ['Cansaço', 'Sobrecarga', 'Autoexigência'])
                        .slice(0, 3)
                        .map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                    </ul>
                  </div>
                </div>

                {content?.wakeUpCalls?.length ? (
                  <div className="space-y-1 pt-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Direção de cuidado e aprendizagem
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-primary/90 space-y-1">
                      {content.wakeUpCalls.slice(0, 2).map((call, i) => (
                        <li key={i}>{call}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="border-t pt-3 space-y-1 text-xs">
                  <h4 className="font-semibold uppercase tracking-wider text-foreground text-[11px]">
                    Sua resposta declarada
                  </h4>
                  {row ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{row.label}: </span>
                      {row.text}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Ainda não há resposta detalhada registrada para este padrão específico no
                      snapshot.
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground/80 pt-2 border-t">
                  Referência: Modelo dos Padrões de Proteção CER, adaptado a partir do trabalho de
                  Shirzad Chamine (Positive Intelligence).
                </p>
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openRegulationDialog = (
    item: (typeof REGULATION_REACTIONS)[number],
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    const status = getRegulationStatus(item)
    const elementReading = snapshot.elementReadings?.[item.id]

    openDialog(
      {
        title: `${item.title} (${item.subtitle})`,
        subtitle: item.description,
        tag: 'Regulação & Padrões de Resposta',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading)
            ) : (
              <>
                <p>{item.concept}</p>
                <div className="rounded-lg bg-muted/20 p-3 space-y-2 text-xs">
                  <h4 className="font-semibold text-foreground">
                    Compreensão integrativa e desenvolvimento
                  </h4>
                  <p className="text-muted-foreground">
                    A resposta a situações difíceis não se forma definitivamente até os 3 anos de
                    idade: a aprendizagem emocional e relacional continua ao longo de toda a vida. A
                    combinação de respostas é uma hipótese contextual e relacional, nunca um subtipo
                    neurológico rígido.
                  </p>
                </div>
                <div className="border-t pt-3 space-y-1">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                    Presença no seu mapa
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {status.reported ? (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Relatada por você no percurso:
                        </span>{' '}
                        {status.detail}
                      </>
                    ) : (
                      'Esta reação não foi marcada como sua tendência espontânea principal neste momento.'
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const formatFriendlyRowLabel = (label: string): string => {
    let clean = label
    for (const [key, pat] of Object.entries(CER_PROTECTION_PATTERNS)) {
      if (clean.includes(key)) {
        clean = clean.split(key).join(pat.baseName)
      }
    }
    return clean
  }

  const openDimensionDialog = (dimId: string, e?: React.MouseEvent<HTMLElement>) => {
    const dim = snapshot.dimensions.find((d) => d.id === dimId)
    if (!dim) return
    const refs = snapshot.references.filter((r) => dim.referenceIds.includes(r.id))
    const isReviewed = Boolean(snapshot.reviewedAt && snapshot.reviewedBy)
    const interpretationTitle = isReviewed
      ? 'Interpretação revisada em conversa'
      : 'Como suas respostas se conectam'
    const elementReading = snapshot.elementReadings?.[dimId]
    const hasCustomDemoReading = Boolean(
      isDemoSnapshot &&
      (dim.summary ||
        dim.interpretation ||
        elementReading?.summary ||
        elementReading?.interpretation),
    )

    openDialog(
      {
        title: dim.title,
        subtitle: 'Conceito, leitura pessoal e recursos',
        tag: 'Dimensão CER',
        dialogClassName:
          dimId === 'corpo'
            ? 'w-[95vw] max-w-3xl sm:max-w-3xl p-5 sm:p-7 max-h-[85vh] overflow-y-auto'
            : undefined,
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {dimId === 'corpo' ? (
              <AyurvedaPersonalReading
                dimension={dim}
                participantName={snapshot.participantName}
                interpretationTitle={interpretationTitle}
              />
            ) : dim.personalSections?.length ? (
              <div className="space-y-4">
                <p className="leading-relaxed">{dim.explanation}</p>
                <p className="leading-relaxed">{dim.summary}</p>
                <Accordion type="multiple" className="rounded-xl border px-4">
                  {dim.personalSections.map((section, i) => (
                    <AccordionItem key={`${i}-${section.title}`} value={`section-${i}`}>
                      <AccordionTrigger className="text-left font-serif">
                        {section.title}
                      </AccordionTrigger>
                      <AccordionContent className="whitespace-pre-wrap text-sm leading-relaxed">
                        {section.text}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {!!dim.insights?.length && (
                    <AccordionItem value="resources">
                      <AccordionTrigger className="text-left font-serif">
                        Suas forças e o que pede cuidado
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {(['strength', 'difficulty'] as const).map((kind) => (
                            <div key={kind}>
                              <h4 className="font-semibold mb-2">
                                {kind === 'strength'
                                  ? 'Forças e potencialidades'
                                  : 'Pontos de atenção'}
                              </h4>
                              <ul className="space-y-2">
                                {dim.insights
                                  ?.filter((i) => i.kind === kind)
                                  .map((i) => (
                                    <li key={i.id}>
                                      <span className="font-medium">{i.label}</span>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {i.description}
                                      </p>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                    Como compreender esta dimensão
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dim.explanation}</p>
                </div>

                {dim.summary && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Síntese da leitura
                    </h4>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{dim.summary}</p>
                  </div>
                )}

                {dim.interpretation && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      {interpretationTitle}
                    </h4>
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {dim.interpretation}
                    </p>
                  </div>
                )}
              </>
            )}

            {!hasCustomDemoReading && !dim.personalSections?.length && dimId !== 'corpo' && (
              <div className="space-y-2 pt-1 border-t">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                  Respostas compartilhadas nesta versão
                </h4>
                {dim.detailedRows.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {dim.detailedRows.map((r, i) => (
                      <div key={i} className="text-xs border-b pb-1.5 last:border-b-0">
                        <span className="font-medium text-foreground block">
                          {formatFriendlyRowLabel(r.label)}
                        </span>
                        <span className="text-muted-foreground whitespace-pre-wrap">{r.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Ainda não há respostas compartilhadas suficientes para esta dimensão.
                  </p>
                )}
              </div>
            )}

            {renderReferencesList(refs)}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  const openEmotionalWorldDialog = (e?: React.MouseEvent<HTMLElement>) => {
    if (dimMente?.personalSections?.length) {
      openDimensionDialog('mente', e)
      return
    }
    const elementReading =
      snapshot.elementReadings?.['emocoes'] ||
      snapshot.elementReadings?.['mundo_emocional'] ||
      snapshot.elementReadings?.['mente']

    if (elementReading) {
      openDialog(
        {
          title: 'Meu mundo emocional',
          subtitle: 'Sensibilidade afetiva sentida no corpo, ansiedade e entusiasmo',
          tag: 'Mente e Emoções',
          content: (
            <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
              {renderElementReadingSections(elementReading)}
            </div>
          ),
        },
        e?.currentTarget,
      )
      return
    }

    openDimensionDialog('mente', e)
  }

  const openIntegratedNodeDialog = (nodeKey: string, e?: React.MouseEvent<HTMLElement>) => {
    if (nodeKey === 'centro') {
      openDialog(
        {
          title: 'Meu funcionamento em conjunto',
          subtitle: 'Seus recursos a serviço do que importa',
          tag: 'Método CER',
          dialogClassName:
            'w-[95vw] max-w-5xl sm:max-w-5xl p-5 sm:p-7 max-h-[85vh] overflow-y-auto',
          content: (
            <div className="space-y-5">
              {!!snapshot.integration && (
                <details className="rounded-xl border p-3">
                  <summary className="font-serif cursor-pointer">Sua síntese integrada</summary>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mt-3">
                    {snapshot.integration}
                  </p>
                </details>
              )}
              {!!snapshot.lifeDirections?.length && (
                <div className="space-y-2">
                  <h3 className="font-serif">O que você deseja construir</h3>
                  {snapshot.lifeDirections.map((d) => (
                    <p key={d.id} className="text-sm">
                      {d.title}
                    </p>
                  ))}
                </div>
              )}
              <IntegratedResourceGame
                key={snapshot.enrollmentId}
                snapshot={snapshot}
                readOnly={!auth?.isInteragente || !!auth?.isProfissional}
              />
            </div>
          ),
        },
        e?.currentTarget,
      )
      return
    }
    const elementReading = snapshot.elementReadings?.[nodeKey]

    // Se temos leitura própria no snapshot para o nó, exibimos seu modal específico com título e conteúdo dedicados
    if (elementReading) {
      const titles: Record<string, { title: string; subtitle: string; tag: string }> = {
        centro: {
          title: 'Meu funcionamento em conjunto',
          subtitle: 'Integração das dimensões do seu ser',
          tag: 'Método CER',
        },
        corpo: {
          title: 'Nó Corpo & Ritmo',
          subtitle: 'Sinais biológicos, digestão, sono e sobrecarga cotidiana',
          tag: 'Funcionamento em Conjunto',
        },
        pensamentos: {
          title: 'Nó Pensamentos',
          subtitle: 'Antecipação preventiva, planejamento e diálogo interno',
          tag: 'Funcionamento em Conjunto',
        },
        emocoes: {
          title: 'Nó Emoções',
          subtitle: 'Sensibilidade afetiva sentida no corpo, ansiedade e entusiasmo',
          tag: 'Funcionamento em Conjunto',
        },
        protecao: {
          title: 'Nó Padrões de Proteção',
          subtitle: 'Estratégias adaptativas de defesa e função protetiva',
          tag: 'Funcionamento em Conjunto',
        },
        relacoes: {
          title: 'Nó Relações & Vínculos',
          subtitle: 'Limites, reciprocidade, pedido de ajuda e cuidado',
          tag: 'Funcionamento em Conjunto',
        },
        vida_cotidiana: {
          title: 'Nó Vida Cotidiana & Sentido',
          subtitle: 'Valores, presença, descanso, intimidade e ritmo de vida',
          tag: 'Funcionamento em Conjunto',
        },
      }

      const meta = titles[nodeKey] || {
        title: `Nó ${nodeKey}`,
        subtitle: 'Leitura individual no funcionamento conjunto',
        tag: 'Funcionamento em Conjunto',
      }

      openDialog(
        {
          title: meta.title,
          subtitle: meta.subtitle,
          tag: meta.tag,
          content: (
            <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
              {renderElementReadingSections(elementReading)}
            </div>
          ),
        },
        e?.currentTarget,
      )
      return
    }

    // Fallback estrito para snapshots legados sem elementReadings
    switch (nodeKey) {
      case 'centro':
        openDialog(
          {
            title: 'Meu funcionamento em conjunto',
            subtitle: 'Integração das dimensões do seu ser',
            tag: 'Método CER',
            content: (
              <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
                <p>
                  {snapshot.integration ||
                    'As conexões serão aprofundadas com sua história. Corpo, mente, regulação, relações, sexualidade e sentido formam uma teia interligada, onde nenhuma dimensão atua isoladamente.'}
                </p>
                {snapshot.lifeDirections?.length ? (
                  <div className="border-t pt-3 space-y-2">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Seus objetivos no centro do mapa
                    </h4>
                    {snapshot.lifeDirections.map((dir) => (
                      <div key={dir.id} className="text-xs border rounded p-2.5">
                        <span className="font-medium block">{dir.title}</span>
                        {dir.meaning && (
                          <span className="text-muted-foreground block text-[11px] mt-0.5">
                            Sentido: {dir.meaning}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          },
          e?.currentTarget,
        )
        break
      case 'corpo':
        openDimensionDialog('corpo', e)
        break
      case 'pensamentos':
      case 'emocoes':
      case 'protecao':
        openDimensionDialog('mente', e)
        break
      case 'relacoes':
        openDimensionDialog('relacoes', e)
        break
      case 'vida_cotidiana':
        openDimensionDialog('sentido', e)
        break
      default:
        break
    }
  }

  const openHistoryDialog = (e?: React.MouseEvent<HTMLElement>) => {
    const elementReading = snapshot.elementReadings?.['historia']

    openDialog(
      {
        title: 'Sua história e seu funcionamento hoje',
        subtitle: 'Conexões exploradas com sua profissional',
        tag: 'Linha da Vida',
        content: (
          <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
            {elementReading ? (
              renderElementReadingSections(elementReading)
            ) : (
              <>
                <p>
                  {snapshot.history ||
                    'A relação entre sua história e seu funcionamento ainda será aprofundada em conversa e na Linha da Vida. As respostas das dimensões não permitem afirmar como um padrão se formou.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tendências pessoais, experiências e contexto atual podem participar desse retrato.
                  Prakriti e Vikriti acrescentam a perspectiva ayurvédica à compreensão do corpo; a
                  Linha da Vida acrescenta os acontecimentos e aprendizados do seu percurso.
                </p>
                {!!snapshot.lifeConnections?.length && (
                  <div className="border-t pt-3 space-y-2">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Relações exploradas em conversa
                    </h4>
                    {snapshot.lifeConnections.map((conn, idx) => (
                      <div key={idx} className="border rounded p-2.5 text-xs space-y-1">
                        <p className="font-medium text-foreground">{conn.text}</p>
                        {conn.question && (
                          <p className="text-primary italic">Para investigar: {conn.question}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!!snapshot.lifeEvents?.length && (
                  <div className="border-t pt-3 space-y-2">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                      Acontecimentos da sua história compartilhados
                    </h4>
                    {snapshot.lifeEvents.map((evt) => (
                      <div key={evt.id} className="border rounded p-2 text-xs">
                        <span className="font-medium block">
                          {evt.title} ({lifeTimeLabel(evt)})
                        </span>
                        <span className="text-muted-foreground text-[11px] block">
                          {evt.narrative}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ),
      },
      e?.currentTarget,
    )
  }

  return (
    <div
      className="space-y-8 max-w-4xl mx-auto cer-reading-panel p-4 sm:p-6 rounded-2xl border bg-card/60"
      data-testid="cer-map-readings"
    >
      {/* 1. TOPO: Meu Mapa CER + Nome + Convite */}
      <header className="space-y-3 border-b border-border/60 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" aria-hidden="true" />
              <Badge
                variant="outline"
                className="text-[11px] uppercase tracking-wider text-primary border-primary/40 font-normal"
              >
                {initial ? 'Mapa Inicial · A partir das suas respostas' : 'Mapa Integrativo CER'}
              </Badge>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Meu Mapa CER {snapshot.participantName ? `· ${snapshot.participantName}` : ''}
            </h2>
            <p className="text-sm text-muted-foreground italic font-serif">
              &ldquo;Conheça seus movimentos, sem precisar se definir por eles.&rdquo;
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => openHowMapHelps(e)}
            className="self-start sm:self-center text-xs h-10 px-3 min-h-[44px] border-primary/30 hover:bg-primary/5 text-foreground"
            aria-label="Abrir explicação: Como este mapa ajuda você"
          >
            <Info className="w-4 h-4 mr-1.5 text-primary" aria-hidden="true" />
            Como este mapa ajuda você
          </Button>
        </div>
        <CerArtStrip variant="path" compact />
      </header>

      {/* 2. CORPO PELA LENTE DO AYURVEDA */}
      <section
        className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="corpo-section-title"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h3
              id="corpo-section-title"
              className="font-serif text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2"
            >
              Corpo pela lente do Ayurveda
            </h3>
            <p className="text-xs text-muted-foreground">
              Toque em cada dosha ou indicador para compreender conceitos e hipóteses.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => openDimensionDialog('corpo', e)}
            className="text-xs text-primary min-h-[44px] self-start sm:self-auto"
            aria-label="Ver leitura completa da dimensão Corpo"
          >
            Ver leitura completa da dimensão <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {dimCorpo && (dimCorpo.summary || dimCorpo.ayurvedaReading) && (
          <div
            className="space-y-2 text-sm leading-relaxed"
            aria-label="Síntese de Corpo e Fisiologia"
          >
            {dimCorpo.summary && <p>{dimCorpo.summary}</p>}
            {dimCorpo.ayurvedaReading && (
              <>
                <p>
                  <strong>Agni:</strong> {dimCorpo.ayurvedaReading.agniType}.
                </p>
                <p>
                  <strong>Ama:</strong> {dimCorpo.ayurvedaReading.amaPresence}.
                </p>
              </>
            )}
          </div>
        )}

        {auth?.isProfissional && dimCorpo && (
          <AyurvedaCareReasoning
            constitution={dimCorpo.ayurvedaConstitution}
            reading={dimCorpo.ayurvedaReading}
          />
        )}
        {/* Doshas: pizza ou composição circular neutra */}
        <div className="space-y-4 pt-1">
          {doshaPercents ? (
            <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-foreground">
                Distribuição Constitucional Registrada
              </span>

              {/* Gráfico circular / pizza SVG de 180-200px com segmentos táteis e acessíveis */}
              {(() => {
                const total = doshaPercents.vata + doshaPercents.pitta + doshaPercents.kapha
                const vNorm = total > 0 ? (doshaPercents.vata / total) * 100 : 33.33
                const pNorm = total > 0 ? (doshaPercents.pitta / total) * 100 : 33.33
                const kNorm = total > 0 ? (doshaPercents.kapha / total) * 100 : 33.34

                // Centro (100, 100), raio externo 82, raio interno (donut sutil) 36
                const cx = 100
                const cy = 100
                const rOut = 82
                const rIn = 36

                const toRad = (deg: number) => (deg * Math.PI) / 180
                const polarToCartesian = (
                  centerX: number,
                  centerY: number,
                  radius: number,
                  angleInDegrees: number,
                ) => {
                  const rad = toRad(angleInDegrees)
                  return {
                    x: centerX + radius * Math.cos(rad),
                    y: centerY + radius * Math.sin(rad),
                  }
                }

                const createDonutSlicePath = (startAngle: number, endAngle: number) => {
                  // Ajusta ângulo se fatia for quase círculo completo
                  const angleDiff = Math.min(endAngle - startAngle, 359.999)
                  const actualEnd = startAngle + angleDiff
                  const largeArcFlag = angleDiff > 180 ? 1 : 0

                  const p1 = polarToCartesian(cx, cy, rOut, startAngle)
                  const p2 = polarToCartesian(cx, cy, rOut, actualEnd)
                  const p3 = polarToCartesian(cx, cy, rIn, actualEnd)
                  const p4 = polarToCartesian(cx, cy, rIn, startAngle)

                  return [
                    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
                    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
                    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
                    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
                    'Z',
                  ].join(' ')
                }

                // Inicia no topo (-90 graus)
                const a0 = -90
                const a1 = a0 + (vNorm / 100) * 360
                const a2 = a1 + (pNorm / 100) * 360
                const a3 = a0 + 360

                const slices = [
                  {
                    name: 'Vata' as const,
                    percent: doshaPercents.vata,
                    startAngle: a0,
                    endAngle: a1,
                    fill: '#7ba4b5', // tom botânico suave para Vata (ar/éter)
                    stroke: '#668f9f',
                    textColor: '#1f3e4d',
                    label: `Dosha Vata: ${doshaPercents.vata}%`,
                  },
                  {
                    name: 'Pitta' as const,
                    percent: doshaPercents.pitta,
                    startAngle: a1,
                    endAngle: a2,
                    fill: '#e09867', // tom botânico terracota/âmbar suave para Pitta (fogo/transformação)
                    stroke: '#c87f50',
                    textColor: '#4d260f',
                    label: `Dosha Pitta: ${doshaPercents.pitta}%`,
                  },
                  {
                    name: 'Kapha' as const,
                    percent: doshaPercents.kapha,
                    startAngle: a2,
                    endAngle: a3,
                    fill: '#88a878', // tom botânico sálvia/musgo suave para Kapha (terra/água)
                    stroke: '#729262',
                    textColor: '#213c19',
                    label: `Dosha Kapha: ${doshaPercents.kapha}%`,
                  },
                ]

                return (
                  <div className="relative flex items-center justify-center my-1">
                    <svg
                      width="190"
                      height="190"
                      viewBox="0 0 200 200"
                      className="overflow-visible select-none drop-shadow-xs"
                      role="img"
                      aria-label={`Distribuição dos doshas: Vata ${doshaPercents.vata}%, Pitta ${doshaPercents.pitta}%, Kapha ${doshaPercents.kapha}%`}
                      data-testid="cer-dosha-donut"
                    >
                      <g role="group">
                        {slices.map((slice) => {
                          const pathD = createDonutSlicePath(slice.startAngle, slice.endAngle)
                          const midAngle = (slice.startAngle + slice.endAngle) / 2
                          const labelPos = polarToCartesian(cx, cy, (rOut + rIn) / 2, midAngle)
                          return (
                            <g key={slice.name}>
                              <path
                                d={pathD}
                                fill={slice.fill}
                                stroke="hsl(var(--card))"
                                strokeWidth="2.5"
                                className="cursor-pointer transition-all duration-200 hover:opacity-90 hover:brightness-105 focus:outline-none focus:stroke-primary focus:stroke-[3.5]"
                                tabIndex={0}
                                role="button"
                                aria-label={`Dosha ${slice.name} (${slice.percent}%). Toque para abrir detalhes.`}
                                data-testid={`dosha-slice-${slice.name.toLowerCase()}`}
                                onClick={(e) => openDoshaDialog(slice.name, e)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    openDoshaDialog(
                                      slice.name,
                                      e as unknown as React.MouseEvent<SVGElement>,
                                    )
                                  }
                                }}
                              />
                              {/* Percentual no miolo do segmento quando couber */}
                              <text
                                x={labelPos.x}
                                y={labelPos.y + 3.5}
                                textAnchor="middle"
                                className="text-[10px] font-sans font-semibold pointer-events-none fill-stone-900 select-none"
                                aria-hidden="true"
                              >
                                {slice.percent}%
                              </text>
                            </g>
                          )
                        })}
                      </g>
                      {/* Círculo central estético com ícone sutil */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={rIn - 2}
                        className="fill-card stroke-border/60"
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={cy + 3}
                        textAnchor="middle"
                        className="text-[9px] font-serif uppercase tracking-widest fill-muted-foreground select-none pointer-events-none"
                        aria-hidden="true"
                      >
                        CER
                      </text>
                    </svg>
                  </div>
                )
              })()}

              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <span className="font-medium inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#7ba4b5' }}
                  />
                  Vata: {doshaPercents.vata}%
                </span>
                <span className="font-medium inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#e09867' }}
                  />
                  Pitta: {doshaPercents.pitta}%
                </span>
                <span className="font-medium inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#88a878' }}
                  />
                  Kapha: {doshaPercents.kapha}%
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-muted/20 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                A distribuição percentual ainda não está disponível no snapshot publicado.
              </p>
            </div>
          )}

          {/* 3 alvos doshas em botões táteis (>=44px) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={(e) => openDoshaDialog('Vata', e)}
              className="min-h-[48px] p-3 rounded-lg border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/10 transition-colors text-left flex flex-col justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir detalhes do Dosha Vata"
            >
              <span className="font-serif font-semibold text-sm text-foreground flex items-center justify-between">
                Dosha Vata <Sparkles className="w-3.5 h-3.5 text-primary" />
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Movimento · Variabilidade
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => openDoshaDialog('Pitta', e)}
              className="min-h-[48px] p-3 rounded-lg border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/10 transition-colors text-left flex flex-col justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir detalhes do Dosha Pitta"
            >
              <span className="font-serif font-semibold text-sm text-foreground flex items-center justify-between">
                Dosha Pitta <Flame className="w-3.5 h-3.5 text-amber-500" />
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Transformação · Calor
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => openDoshaDialog('Kapha', e)}
              className="min-h-[48px] p-3 rounded-lg border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/10 transition-colors text-left flex flex-col justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir detalhes do Dosha Kapha"
            >
              <span className="font-serif font-semibold text-sm text-foreground flex items-center justify-between">
                Dosha Kapha <Droplets className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Sustentação · Estabilidade
              </span>
            </button>
          </div>

          {/* Agni e Ama com alvos táteis separados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => openAgniDialog(e)}
              className="min-h-[48px] p-3 rounded-lg border border-border/60 hover:border-primary/60 bg-card hover:bg-muted/10 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir detalhes sobre Agni"
            >
              <div>
                <span className="font-serif font-semibold text-xs text-foreground block">
                  Agni (Digestão e Transformação)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {agniRow ? agniRow.text.slice(0, 45) + '…' : 'Toque para abrir conceito'}
                </span>
              </div>
              <Info className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={(e) => openAmaDialog(e)}
              className="min-h-[48px] p-3 rounded-lg border border-border/60 hover:border-primary/60 bg-card hover:bg-muted/10 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir detalhes sobre Ama"
            >
              <div>
                <span className="font-serif font-semibold text-xs text-foreground block">
                  Ama (Processamento Incompleto)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {amaRow ? amaRow.text.slice(0, 45) + '…' : 'Toque para abrir conceito'}
                </span>
              </div>
              <Info className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. MENTE E EMOÇÕES */}
      <section
        className="space-y-5 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="mente-section-title"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h3
              id="mente-section-title"
              className="font-serif text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2"
            >
              Mente e Emoções
            </h3>
            <p className="text-xs text-muted-foreground">
              Toque em um comportamento para abrir sua leitura individual acolhedora.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => openEmotionalWorldDialog(e)}
            className="text-xs min-h-[44px] self-start sm:self-auto border-primary/30 text-foreground"
            aria-label="Abrir: Meu mundo emocional"
          >
            Meu mundo emocional <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Legenda categórica */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Escala Categórica das Respostas Declaradas
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {Object.entries(CATEGORY_SCALE_MAP).map(([key, item]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-muted/20 text-muted-foreground"
              >
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Gráfico vertical dos dez comportamentos: 2 grupos de 5 no mobile sem overflow */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-52 sm:h-56 p-2 rounded-xl bg-muted/15 border border-border/40">
            {BEHAVIOR_PATTERNS.slice(0, 5).map((p) => {
              const row = getPatternRow(p.canonicalKey)
              const freq = resolveCategoricalFrequency(row?.text)
              const config = CATEGORY_SCALE_MAP[freq]
              return (
                <button
                  key={p.canonicalKey}
                  type="button"
                  onClick={(e) => openPatternDialog(p.canonicalKey, p.narrativeLabel, e)}
                  className="group flex flex-col items-center justify-end h-full focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-all"
                  aria-label={`${p.narrativeLabel}: categoria ${config.label}. Toque para abrir detalhes.`}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 text-center line-clamp-1 group-hover:text-foreground">
                    {config.shortLabel}
                  </span>
                  <div className="w-full max-w-[28px] sm:max-w-[40px] bg-muted/40 rounded-t-md h-32 relative overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${config.color} ${
                        config.isUnknown ? 'border-dashed border-2 border-stone-400' : ''
                      }`}
                      style={{ height: `${Math.max(config.heightPercent, 8)}%` }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-serif font-medium text-foreground mt-2 text-center line-clamp-2 leading-tight">
                    {p.narrativeLabel}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-52 sm:h-56 p-2 rounded-xl bg-muted/15 border border-border/40">
            {BEHAVIOR_PATTERNS.slice(5, 10).map((p) => {
              const row = getPatternRow(p.canonicalKey)
              const freq = resolveCategoricalFrequency(row?.text)
              const config = CATEGORY_SCALE_MAP[freq]
              return (
                <button
                  key={p.canonicalKey}
                  type="button"
                  onClick={(e) => openPatternDialog(p.canonicalKey, p.narrativeLabel, e)}
                  className="group flex flex-col items-center justify-end h-full focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-all"
                  aria-label={`${p.narrativeLabel}: categoria ${config.label}. Toque para abrir detalhes.`}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 text-center line-clamp-1 group-hover:text-foreground">
                    {config.shortLabel}
                  </span>
                  <div className="w-full max-w-[28px] sm:max-w-[40px] bg-muted/40 rounded-t-md h-32 relative overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${config.color} ${
                        config.isUnknown ? 'border-dashed border-2 border-stone-400' : ''
                      }`}
                      style={{ height: `${Math.max(config.heightPercent, 8)}%` }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-serif font-medium text-foreground mt-2 text-center line-clamp-2 leading-tight">
                    {p.narrativeLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. REGULAÇÃO: Quatro alvos em quatro colunas */}
      <section
        className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="regulacao-section-title"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h3
              id="regulacao-section-title"
              className="font-serif text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2"
            >
              Regulação e Padrões de Resposta
            </h3>
            <p className="text-xs text-muted-foreground">
              Toque em uma reação para compreender seu contexto e função adaptativa.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => openDimensionDialog('regulacao', e)}
            className="text-xs text-primary min-h-[44px] self-start sm:self-auto"
            aria-label="Ver leitura completa da dimensão Regulação"
          >
            Ver dimensão completa <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {REGULATION_REACTIONS.map((item) => {
            const status = getRegulationStatus(item)
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => openRegulationDialog(item, e)}
                className={`min-h-[52px] p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  status.reported
                    ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                    : 'border-border/60 bg-card hover:bg-muted/15'
                }`}
                aria-label={`Reação ${item.title}: ${item.subtitle}. ${status.reported ? 'Relatada por você.' : ''} Toque para abrir explicação.`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-semibold text-sm text-foreground">
                      {item.title}
                    </span>
                    <Shield className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block line-clamp-2">
                    {item.subtitle}
                  </span>
                </div>
                <div className="mt-2 pt-1 border-t border-border/30">
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      status.reported
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {status.reported ? 'Relatada no percurso' : 'Não destacada'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 5. RELAÇÕES, SEXUALIDADE E SENTIDO: Alvos curtos clicáveis */}
      <section
        className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="outras-dimensoes-title"
      >
        <h3
          id="outras-dimensoes-title"
          className="font-serif text-lg sm:text-xl font-semibold text-foreground"
        >
          Relações, Sexualidade e Sentido
        </h3>
        <p className="text-xs text-muted-foreground">
          Toque em uma dimensão para abrir seus conceitos, leituras compartilhadas e recursos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={(e) => openDimensionDialog('relacoes', e)}
            className="min-h-[48px] p-3.5 rounded-xl border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/15 transition-colors text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Abrir dimensão: Relações & Vínculos"
          >
            <div>
              <span className="font-serif font-semibold text-sm text-foreground block">
                Relações & Vínculos
              </span>
              <span className="text-[11px] text-muted-foreground">
                Proximidade, limites e confiança
              </span>
            </div>
            <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(e) => openDimensionDialog('sexualidade', e)}
            className="min-h-[48px] p-3.5 rounded-xl border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/15 transition-colors text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Abrir dimensão: Sexualidade & Intimidade"
          >
            <div>
              <span className="font-serif font-semibold text-sm text-foreground block">
                Sexualidade & Intimidade
              </span>
              <span className="text-[11px] text-muted-foreground">
                Bem-estar, corpo e segurança
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(e) => openDimensionDialog('sentido', e)}
            className="min-h-[48px] p-3.5 rounded-xl border border-border/70 hover:border-primary/60 bg-card hover:bg-muted/15 transition-colors text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Abrir dimensão: Sentido & Conexão"
          >
            <div>
              <span className="font-serif font-semibold text-sm text-foreground block">
                Sentido & Conexão
              </span>
              <span className="text-[11px] text-muted-foreground">
                Valores e presença no cotidiano
              </span>
            </div>
            <Compass className="w-4 h-4 text-primary" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 6. MEU FUNCIONAMENTO EM CONJUNTO: Pessoa no centro e 6 nós responsivos */}
      <section
        className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
        aria-labelledby="conjunto-title"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h3
              id="conjunto-title"
              className="font-serif text-lg sm:text-xl font-semibold text-foreground"
            >
              Meu funcionamento em conjunto
            </h3>
            <p className="text-xs text-muted-foreground">
              Dimensões interligadas ao seu centro. Toque nos nós para investigar as partes.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => openHistoryDialog(e)}
            className="text-xs text-primary min-h-[44px] self-start sm:self-auto"
            aria-label="Abrir histórico e conexões da Linha da Vida"
          >
            Sua história e conexões <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Nós em disposição circular/responsiva com setas tracejadas conectando os nós ao centro */}
        <div className="py-4 flex flex-col items-center justify-center relative">
          {/* Botão Central */}
          <button
            type="button"
            onClick={(e) => openIntegratedNodeDialog('centro', e)}
            className="w-full sm:max-w-xs min-h-[56px] p-4 rounded-2xl border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-sm mb-4 relative z-10"
            aria-label="Centro integrador: Pessoa e Objetivos. Toque para abrir leitura integrada."
          >
            <span className="font-serif font-bold text-sm sm:text-base text-foreground block">
              {snapshot.participantName || 'Seu Centro Integrador'}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              {snapshot.lifeDirections?.[0]?.title
                ? `Objetivo: ${snapshot.lifeDirections[0].title}`
                : 'Toque para abrir a visão integrada'}
            </span>
          </button>

          {/* Diagrama decorativo com setas tracejadas entre os nós e o centro */}
          <div
            className="w-full max-w-md hidden sm:flex justify-around items-center py-1 text-muted-foreground/60 select-none pointer-events-none"
            aria-hidden="true"
          >
            <svg className="w-full h-6" viewBox="0 0 320 24" fill="none">
              <line
                x1="20"
                y1="20"
                x2="160"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="160"
                y1="4"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle cx="20" cy="20" r="3" fill="currentColor" />
              <circle cx="160" cy="4" r="3" fill="currentColor" />
              <circle cx="300" cy="20" r="3" fill="currentColor" />
            </svg>
          </div>

          {/* 6 Nós ao redor */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
            {[
              { id: 'corpo', label: 'Corpo & Ritmo', icon: Flame },
              { id: 'pensamentos', label: 'Pensamentos', icon: Info },
              { id: 'emocoes', label: 'Emoções', icon: Heart },
              { id: 'protecao', label: 'Padrões de Proteção', icon: Shield },
              { id: 'relacoes', label: 'Relações & Vínculos', icon: Sparkles },
              { id: 'vida_cotidiana', label: 'Vida Cotidiana & Sentido', icon: Compass },
            ].map((node) => {
              const Icon = node.icon
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={(e) => openIntegratedNodeDialog(node.id, e)}
                  className="min-h-[48px] p-3 rounded-xl border border-dashed border-border/80 hover:border-primary/60 bg-card hover:bg-muted/20 text-left flex items-center gap-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                  aria-label={`Nó ${node.label}. Toque para abrir leitura individual.`}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-xs font-serif font-medium text-foreground line-clamp-1">
                    {node.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Encontros construídos */}
        {!!snapshot.sessionUpdates?.length && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-foreground">
              O que construímos nos encontros
            </h4>
            <div className="space-y-2">
              {snapshot.sessionUpdates.map((update) => (
                <div key={update.sessionId} className="text-xs border rounded-lg p-2.5 bg-muted/10">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">
                    Encontro de {new Date(update.sessionDate).toLocaleDateString('pt-BR')}
                  </span>
                  <p className="text-foreground whitespace-pre-wrap">{update.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Referências globais e fundamentos */}
      <footer className="pt-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            Você pode reconhecer, discordar ou trazer outra experiência para a conversa. Sua
            experiência ajuda a aprofundar e atualizar este mapa.
          </span>
          <span className="font-mono text-[10px] shrink-0">CER • Cuidado em Relação</span>
        </div>
      </footer>

      {/* DIÁLOGO CONTROLADO ÚNICO */}
      <Dialog open={Boolean(activeDialog)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent
          className={cn('max-w-xl max-h-[85vh] overflow-y-auto', activeDialog?.dialogClassName)}
          onCloseAutoFocus={(e) => {
            if (triggerRef.current) {
              e.preventDefault()
              triggerRef.current.focus()
            }
          }}
        >
          <DialogHeader>
            {activeDialog?.tag && (
              <Badge
                variant="outline"
                className="self-start text-[10px] uppercase tracking-wider text-primary border-primary/30"
              >
                {activeDialog.tag}
              </Badge>
            )}
            <DialogTitle className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
              {activeDialog?.title}
            </DialogTitle>
            {activeDialog?.subtitle && (
              <DialogDescription className="text-xs text-muted-foreground">
                {activeDialog.subtitle}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="pt-2">{activeDialog?.content}</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CerMapReadingsView
