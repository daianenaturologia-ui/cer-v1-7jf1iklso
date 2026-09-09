/**
 * Build 06: Participant Display — Visualização do Mapa CER da Participante
 *
 * Princípios Congelados:
 * - Participante vê somente o current published Map do próprio enrollment.
 * - BACKEND PRECISO. FRONTEND HUMANO.
 * - item_text é exibido com organização humana e acolhedora das seções.
 * - ZERO IDs técnicos, ZERO status epistemológicos, ZERO terminologia de Knowledge,
 *   ZERO referências a Evidências / Associações / Sinais, ZERO scores ou números de teste.
 * - Não obrigar UI a mostrar as 11 seções vazias: priorizar seções com conteúdo;
 *   placeholder com microcopy centralizado ("Ainda estou descobrindo isso.") onde aplicável.
 */

import React from 'react'
import {
  CerMapRecord,
  CerMapItemRecord,
  CerMapSection,
  CER_MAP_SECTIONS,
  CER_MAP_SECTION_LABELS,
  CER_MAP_SECTION_DESCRIPTIONS,
  MAP_EMPTY_MICROCOPY,
} from '@/types/cer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Compass, Heart, Feather, Sun, Moon } from 'lucide-react'

interface ParticipantMapDisplayProps {
  map: CerMapRecord & { items: CerMapItemRecord[] }
}

const SECTION_ICONS: Partial<Record<CerMapSection, React.ReactNode>> = {
  minha_natureza: <Feather className="w-4 h-4 text-primary" />,
  meu_momento: <Sun className="w-4 h-4 text-amber-500" />,
  quando_estou_no_meu_eixo: <Sparkles className="w-4 h-4 text-emerald-500" />,
  quando_saio_do_meu_eixo: <Moon className="w-4 h-4 text-indigo-400" />,
  meus_recursos: <Heart className="w-4 h-4 text-rose-500" />,
}

export const ParticipantMapDisplay: React.FC<ParticipantMapDisplayProps> = ({ map }) => {
  // Agrupar items por seção
  const itemsBySection = new Map<CerMapSection, CerMapItemRecord[]>()
  for (const it of map.items) {
    if (!itemsBySection.has(it.section)) {
      itemsBySection.set(it.section, [])
    }
    itemsBySection.get(it.section)!.push(it)
  }

  // Ordenar as seções na ordem canônica
  const canonicalSections = Object.values(CER_MAP_SECTIONS)
  // Filtrar seções que têm conteúdo OU exibir as principais se houver poucas
  const sectionsWithContent = canonicalSections.filter(
    (sec) => (itemsBySection.get(sec) || []).length > 0,
  )

  const formattedDate = map.published_at
    ? new Date(map.published_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Recentemente'

  return (
    <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card via-card to-muted/10 overflow-hidden">
      <CardHeader className="p-6 border-b border-border/50 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <Badge
                variant="outline"
                className="text-[11px] font-normal uppercase tracking-wider text-primary border-primary/40"
              >
                Seu Mapa de Compreensão
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                v{map.version_number}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-serif font-semibold text-foreground tracking-tight pt-1">
              Meu Mapa CER
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Uma síntese viva e cuidadosa de como você se percebe e é acolhida na sua caminhada.
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-muted-foreground block">Atualizado em</span>
            <span className="text-xs font-medium text-foreground">{formattedDate}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {sectionsWithContent.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Feather className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-medium text-foreground">{MAP_EMPTY_MICROCOPY}</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Seu mapa está sendo elaborado em diálogo contínuo com sua profissional. Em breve, os
              primeiros traços da sua jornada estarão aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionsWithContent.map((sec) => {
              const secItems = itemsBySection.get(sec) || []
              const icon = SECTION_ICONS[sec] || <Compass className="w-4 h-4 text-primary" />
              const title = CER_MAP_SECTION_LABELS[sec]
              const desc = CER_MAP_SECTION_DESCRIPTIONS[sec]

              return (
                <div
                  key={sec}
                  className="rounded-xl border border-border/70 bg-card/80 p-4 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1 border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      {icon}
                      <h3 className="font-serif font-semibold text-sm text-foreground">{title}</h3>
                    </div>
                    {desc && (
                      <p className="text-[11px] text-muted-foreground leading-normal">{desc}</p>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-1">
                    {secItems.map((item) => (
                      <li
                        key={item.id}
                        className="text-xs text-foreground/90 leading-relaxed font-sans pl-3 border-l-2 border-primary/30 py-0.5"
                      >
                        {item.item_text}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>“O ser humano não funciona em partes. Cada percepção integra o todo.”</span>
          <span className="font-mono text-[10px]">CER • Cuidado em Relação</span>
        </div>
      </CardContent>
    </Card>
  )
}
export default ParticipantMapDisplay
