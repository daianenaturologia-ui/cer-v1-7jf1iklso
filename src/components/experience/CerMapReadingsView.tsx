import React, { useState } from 'react'
import type {
  CerMapReadingSnapshot,
  CerMapReadingRow,
  CerMapReference,
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
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { CER_PROTECTION_PATTERNS } from '@/services/cerProtectionPatterns'
import { getCerProtectionPatternContent } from '@/services/cerProtectionPatternContent'

export interface CerMapReadingsViewProps {
  snapshot: CerMapReadingSnapshot
  initial?: boolean
}

interface DialogState {
  title: string
  subtitle?: string
  tag?: string
  content: React.ReactNode
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
  { label: string; heightPercent: number; color: string; badge: string; isUnknown?: boolean }
> = {
  quase_nunca: {
    label: 'Quase nunca acontece comigo',
    heightPercent: 25,
    color: 'bg-emerald-500/80',
    badge:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  algumas_situacoes: {
    label: 'Aparece em algumas situações',
    heightPercent: 50,
    color: 'bg-teal-500/80',
    badge: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  },
  com_frequencia: {
    label: 'Repete-se com frequência',
    heightPercent: 75,
    color: 'bg-amber-500/85',
    badge: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200',
  },
  sob_pressao: {
    label: 'Aparece com muita força quando estou sob pressão',
    heightPercent: 100,
    color: 'bg-rose-500/85',
    badge: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200',
  },
  desconhecido: {
    label: 'Ainda não sei dizer',
    heightPercent: 15,
    color: 'bg-stone-300 dark:bg-stone-600',
    badge: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300',
    isUnknown: true,
  },
  ausente: {
    label: 'Não informado',
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
      'A resposta de Luta (mobilização ativa) é uma tentativa de restabelecer a segurança e o controle através da ação afirmativa e direta. Não indica agressividade patológica nem descontrole neurológico; trata-se de um movimento relacional e adaptativo de defesa e resolução.',
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
      'A resposta de Paralisação (compasso de espera) ocorre quando o ambiente traz imprevisibilidade ou intensidade tamanha que suspender a ação torna-se a proteção mais segura. Não indica fraqueza moral nem déficit de caráter.',
  },
  {
    id: 'submissao',
    key: 'ceder_agradar',
    title: 'Submissão',
    subtitle: 'Apaziguar e ceder',
    description: 'Ceder, concordar ou tentar acalmar os outros para evitar atrito.',
    concept:
      'A resposta de Submissão ou apaziguamento é uma estratégia relacional inteligente de preservação do vínculo e contenção do conflito imediato. Não é diagnóstico fisiológico nem submissão definitiva: a pessoa busca proteger a conexão em momentos de alta sensibilidade.',
  },
] as const

export function CerMapReadingsView({ snapshot, initial = false }: CerMapReadingsViewProps) {
  const [activeDialog, setActiveDialog] = useState<DialogState | null>(null)

  const openDialog = (state: DialogState) => {
    setActiveDialog(state)
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  // Dimensões do snapshot
  const dimCorpo = snapshot.dimensions?.find((d) => d?.id === 'corpo')
  const dimMente = snapshot.dimensions?.find((d) => d?.id === 'mente')
  const dimRegulacao = snapshot.dimensions?.find((d) => d?.id === 'regulacao')
  const dimRelacoes = snapshot.dimensions?.find((d) => d?.id === 'relacoes')
  const dimSexualidade = snapshot.dimensions?.find((d) => d?.id === 'sexualidade')
  const dimSentido = snapshot.dimensions?.find((d) => d?.id === 'sentido')

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
    const row = dimRegulacao?.detailedRows.find((r) => {
      const lbl = (r.label || '').toLowerCase()
      const key = r.sourcePromptKey || ''
      const text = (r.text || '').toLowerCase()
      return (
        lbl.includes('resposta') ||
        lbl.includes('tende') ||
        lbl.includes(item.id) ||
        lbl.includes(item.title.toLowerCase()) ||
        key === 'resposta_tendencia' ||
        text.includes(item.title.toLowerCase())
      )
    })
    if (!row) return { reported: false, detail: undefined }
    const text = (row.text || '').toLowerCase()
    const isPresent =
      text.includes(item.id) ||
      text.includes(item.title.toLowerCase()) ||
      text.includes(item.subtitle.toLowerCase()) ||
      text.includes(item.description.slice(0, 15).toLowerCase()) ||
      (row.label || '').toLowerCase().includes(item.title.toLowerCase())
    return { reported: isPresent, detail: row.text }
  }

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

  const openHowMapHelps = () => {
    openDialog({
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
                Plano de cuidado construído com a Daiane: práticas integrativas, ajustes de hábitos
                e encaminhamentos individualizados.
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
    })
  }

  const openDoshaDialog = (doshaName: 'Vata' | 'Pitta' | 'Kapha') => {
    const concepts = {
      Vata: {
        principle: 'Movimento e variabilidade',
        desc: 'Princípio tradicional ligado ao fluxo, criatividade, rapidez de percepção e adaptação. Quando instável, manifesta-se em secura, ritmo imprevisível e dispersão.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Vata representa movimento e variabilidade. Prakriti é a constituição de referência; Vikriti é o estado atual ou mudanças temporárias. Não são genética medida nem exames laboratoriais.',
      },
      Pitta: {
        principle: 'Transformação e calor',
        desc: 'Princípio tradicional ligado à digestão, foco, discernimento e metabolismo. Quando elevado, manifesta-se em calor corporal, sensibilidade térmica e agudeza.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Pitta representa transformação e calor. Prakriti é a constituição de referência; Vikriti é o estado atual. Não são marcadores inflamatórios químicos nem exames laboratoriais.',
      },
      Kapha: {
        principle: 'Sustentação e estabilidade',
        desc: 'Princípio tradicional ligado à resistência tecidual, lubricidade, estabilidade emocional e calma. Quando acumulado, manifesta-se em lentidão ou retenção.',
        ayurvedaContext:
          'Daiane escolheu esta tradição de cuidado originada na Índia como lente integrativa do biotipo. Doshas são princípios tradicionais: Kapha representa sustentação e estabilidade. Prakriti é a constituição de referência; Vikriti é o estado atual. Não equivale a peso medido nem exames.',
      },
    }

    const info = concepts[doshaName]
    const relevantRows = (dimCorpo?.detailedRows || []).filter((r) =>
      r.label.toLowerCase().includes(doshaName.toLowerCase()),
    )

    openDialog({
      title: `Dosha ${doshaName}`,
      subtitle: info.principle,
      tag: 'Corpo & Fisiologia',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>{info.desc}</p>
          <div className="rounded-lg bg-muted/30 p-3 space-y-1 text-xs">
            <span className="font-semibold text-foreground block">Referencial tradicional</span>
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
                    <span className="font-medium text-xs text-foreground block">{row.label}</span>
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
        </div>
      ),
    })
  }

  const openAgniDialog = () => {
    openDialog({
      title: 'Agni · Fogo Digestivo',
      subtitle: 'Capacidade de digestão e transformação',
      tag: 'Ayurveda',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>
            Na tradição ayurvédica, Agni é a capacidade de digerir, assimilar e transformar tanto
            alimentos quanto estímulos do mundo. É um aspecto central da nutrição e da saúde
            integrativa: investigamos a fome, o conforto após comer, a eliminação e a regularidade.
          </p>
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">Limites da leitura</span>
            <p>
              Agni não é uma enzima específica nem um resultado de exame laboratorial de sangue. As
              consequências e o resultado específico provêm exclusivamente da leitura disponível no
              seu percurso de cuidado.
            </p>
          </div>
          {agniRow && (
            <div className="border-t pt-3 space-y-1">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                Sua leitura de Agni
              </h4>
              <p className="text-xs text-foreground font-medium">{agniRow.label}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{agniRow.text}</p>
            </div>
          )}
        </div>
      ),
    })
  }

  const openAmaDialog = () => {
    openDialog({
      title: 'Ama · Digestão Incompleta',
      subtitle: 'Conceito tradicional de sobrecarga e acúmulo',
      tag: 'Ayurveda',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>
            Ama descreve produtos ou estados de processamento incompleto na tradição ayurvédica. A
            palavra &ldquo;toxinas&rdquo; é uma tradução aproximada e coloquial: a toxicologia
            biomédica investiga substâncias identificáveis em dose e exposição concretas; já Ama é
            uma categoria tradicional ampla de peso ou lentidão no sistema digestivo, não
            equivalendo a uma substância detectada no sangue.
          </p>
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">Cuidado com mitos</span>
            <p>
              Algumas propostas ayurvédicas incluem práticas de purificação após avaliação
              cuidadosa, não um detox obrigatório nem com eficácia presumida. A
              &ldquo;desintoxicação mental ou emocional&rdquo; é uma metáfora para elaborar
              experiências e reduzir a sobrecarga; emoções não são toxinas. Não se conclui doença
              nem acúmulo patológico pela pontuação.
            </p>
          </div>
          {amaRow && (
            <div className="border-t pt-3 space-y-1">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
                Sua leitura de Ama
              </h4>
              <p className="text-xs text-foreground font-medium">{amaRow.label}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{amaRow.text}</p>
            </div>
          )}
        </div>
      ),
    })
  }

  const openPatternDialog = (patternKey: string, narrativeLabel: string) => {
    const canonical = CER_PROTECTION_PATTERNS[patternKey]
    const content = getCerProtectionPatternContent(patternKey)
    const row = getPatternRow(patternKey)

    openDialog({
      title: narrativeLabel,
      subtitle: canonical?.movementDescription || 'Padrão de Proteção CER',
      tag: 'Mente & Emoções',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
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
              <span className="font-semibold text-foreground block mb-1">Recursos essenciais</span>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                {(content?.strengths || ['Sensibilidade', 'Responsabilidade', 'Capacidade'])
                  .slice(0, 3)
                  .map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
              </ul>
            </div>
            <div className="border rounded p-2.5 bg-card">
              <span className="font-semibold text-foreground block mb-1">Custos possíveis</span>
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
                Ainda não há resposta detalhada registrada para este padrão específico no snapshot.
              </p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/80 pt-2 border-t">
            Referência: Modelo dos Padrões de Proteção CER, adaptado a partir do trabalho de Shirzad
            Chamine (Positive Intelligence). Não constitui psicometria formal nem diagnóstico
            clínico individual.
          </p>
        </div>
      ),
    })
  }

  const openRegulationDialog = (item: (typeof REGULATION_REACTIONS)[number]) => {
    const status = getRegulationStatus(item)
    openDialog({
      title: `${item.title} (${item.subtitle})`,
      subtitle: item.description,
      tag: 'Regulação & Padrões de Resposta',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>{item.concept}</p>
          <div className="rounded-lg bg-muted/20 p-3 space-y-2 text-xs">
            <h4 className="font-semibold text-foreground">
              Compreensão integrativa e desenvolvimento
            </h4>
            <p className="text-muted-foreground">
              A resposta a situações difíceis não se forma definitivamente até os 3 anos de idade: a
              aprendizagem emocional e relacional continua ao longo de toda a vida. A combinação de
              respostas é uma hipótese contextual e relacional, nunca um subtipo neurológico rígido.
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
        </div>
      ),
    })
  }

  const openDimensionDialog = (dimId: string) => {
    const dim = snapshot.dimensions.find((d) => d.id === dimId)
    if (!dim) return
    const refs = snapshot.references.filter((r) => dim.referenceIds.includes(r.id))

    openDialog({
      title: dim.title,
      subtitle: 'Conceito, leitura pessoal e recursos',
      tag: 'Dimensão CER',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
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
                Interpretação revisada em conversa
              </h4>
              <p className="text-xs text-foreground whitespace-pre-wrap">{dim.interpretation}</p>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground">
              Respostas compartilhadas nesta versão
            </h4>
            {dim.detailedRows.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {dim.detailedRows.map((r, i) => (
                  <div key={i} className="text-xs border-b pb-1.5 last:border-b-0">
                    <span className="font-medium text-foreground block">{r.label}</span>
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

          {renderReferencesList(refs)}
        </div>
      ),
    })
  }

  const openIntegratedNodeDialog = (nodeKey: string) => {
    switch (nodeKey) {
      case 'centro':
        openDialog({
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
        })
        break
      case 'corpo':
        openDimensionDialog('corpo')
        break
      case 'pensamentos':
      case 'emocoes':
      case 'protecao':
        openDimensionDialog('mente')
        break
      case 'relacoes':
        openDimensionDialog('relacoes')
        break
      case 'vida_cotidiana':
        openDimensionDialog('sentido')
        break
      default:
        break
    }
  }

  const openHistoryDialog = () => {
    openDialog({
      title: 'Sua história e seu funcionamento hoje',
      subtitle: 'Conexões exploradas com sua profissional',
      tag: 'Linha da Vida',
      content: (
        <div className="cer-prose space-y-4 text-sm leading-relaxed text-foreground/90">
          <p>
            {snapshot.history ||
              'A relação entre sua história e seu funcionamento ainda será aprofundada em conversa e na Linha da Vida. As respostas das dimensões não permitem afirmar como um padrão se formou.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tendências pessoais, experiências e contexto atual podem participar desse retrato.
            Prakriti e Vikriti são leituras ayurvédicas, e não equivalências diretas entre genética
            e história de vida.
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
                  <span className="text-muted-foreground text-[11px] block">{evt.narrative}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    })
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
            onClick={openHowMapHelps}
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
            onClick={() => openDimensionDialog('corpo')}
            className="text-xs text-primary min-h-[44px] self-start sm:self-auto"
            aria-label="Ver leitura completa da dimensão Corpo"
          >
            Ver leitura completa da dimensão <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Doshas: pizza ou composição circular neutra */}
        <div className="space-y-4 pt-1">
          {doshaPercents ? (
            <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
              <span className="text-xs font-semibold text-foreground mb-2">
                Distribuição Constitucional Registrada
              </span>
              <div className="flex gap-4">
                <span className="text-xs font-medium">Vata: {doshaPercents.vata}%</span>
                <span className="text-xs font-medium">Pitta: {doshaPercents.pitta}%</span>
                <span className="text-xs font-medium">Kapha: {doshaPercents.kapha}%</span>
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
              onClick={() => openDoshaDialog('Vata')}
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
              onClick={() => openDoshaDialog('Pitta')}
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
              onClick={() => openDoshaDialog('Kapha')}
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
              onClick={openAgniDialog}
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
              onClick={openAmaDialog}
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
            onClick={() => openDimensionDialog('mente')}
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
                  onClick={() => openPatternDialog(p.canonicalKey, p.narrativeLabel)}
                  className="group flex flex-col items-center justify-end h-full focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-all"
                  aria-label={`${p.narrativeLabel}: categoria ${config.label}. Toque para abrir detalhes.`}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 text-center line-clamp-1 group-hover:text-foreground">
                    {freq === 'ausente'
                      ? '—'
                      : freq === 'desconhecido'
                        ? '?'
                        : config.heightPercent + '%'}
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
                  onClick={() => openPatternDialog(p.canonicalKey, p.narrativeLabel)}
                  className="group flex flex-col items-center justify-end h-full focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-all"
                  aria-label={`${p.narrativeLabel}: categoria ${config.label}. Toque para abrir detalhes.`}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 text-center line-clamp-1 group-hover:text-foreground">
                    {freq === 'ausente'
                      ? '—'
                      : freq === 'desconhecido'
                        ? '?'
                        : config.heightPercent + '%'}
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
            onClick={() => openDimensionDialog('regulacao')}
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
                onClick={() => openRegulationDialog(item)}
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
            onClick={() => openDimensionDialog('relacoes')}
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
            onClick={() => openDimensionDialog('sexualidade')}
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
            onClick={() => openDimensionDialog('sentido')}
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
            onClick={openHistoryDialog}
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
            onClick={() => openIntegratedNodeDialog('centro')}
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
                  onClick={() => openIntegratedNodeDialog(node.id)}
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
            Você pode reconhecer, discordar ou trazer outra experiência para a conversa. Este mapa
            não é um diagnóstico nem um destino fixo.
          </span>
          <span className="font-mono text-[10px] shrink-0">CER • Cuidado em Relação</span>
        </div>
      </footer>

      {/* DIÁLOGO CONTROLADO ÚNICO */}
      <Dialog open={Boolean(activeDialog)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
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
