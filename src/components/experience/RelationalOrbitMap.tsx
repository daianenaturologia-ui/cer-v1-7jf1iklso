import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ArrowUp, ArrowDown, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OrbitRingId = 'muito_proxima' | 'proxima' | 'distancia_media' | 'mais_distante'

export interface OrbitRingDefinition {
  id: OrbitRingId
  label: string
  description: string
  radius: number
}

export const ORBIT_RINGS: OrbitRingDefinition[] = [
  {
    id: 'muito_proxima',
    label: 'Muito próxima',
    description: 'Vínculos muito presentes no seu cotidiano ou no seu sentir hoje',
    radius: 55,
  },
  {
    id: 'proxima',
    label: 'Próxima',
    description: 'Vínculos próximos com quem você mantém contato frequente',
    radius: 95,
  },
  {
    id: 'distancia_media',
    label: 'Distância média',
    description: 'Vínculos presentes mas com certa distância física ou de ritmo',
    radius: 135,
  },
  {
    id: 'mais_distante',
    label: 'Mais distante',
    description: 'Vínculos que hoje ocupam uma órbita mais periférica ou esparsa',
    radius: 175,
  },
]

export const RELATIONAL_CATEGORY_PRESETS = [
  { id: 'parceria_amorosa', label: 'Parceria / Relação afetiva' },
  { id: 'amizade_proxima', label: 'Amizade próxima' },
  { id: 'familia_origem', label: 'Família / Pessoas de origem' },
  { id: 'filhos_dependentes', label: 'Filhos ou dependentes' },
  { id: 'trabalho_projetos', label: 'Trabalho / Colegas' },
  { id: 'comunidade_grupo', label: 'Comunidade / Grupo' },
  { id: 'outro_vinculo', label: 'Outro vínculo' },
  { id: 'prefiro_nao_identificar', label: 'Prefiro não identificar categoria' },
]

export interface OrbitItem {
  id: string
  label: string // Apelido, categoria ou "prefiro não identificar"
  category?: string
  ring: OrbitRingId
}

export interface RelationalOrbitMapConfig {
  maxItems?: number
  defaultRings?: OrbitRingDefinition[]
  allowCustomLabel?: boolean
}

export interface RelationalOrbitMapProps {
  config?: RelationalOrbitMapConfig
  value?: OrbitItem[]
  onChange: (value: OrbitItem[]) => void
  disabled?: boolean
}

export const RelationalOrbitMap: React.FC<RelationalOrbitMapProps> = ({
  config,
  value = [],
  onChange,
  disabled = false,
}) => {
  const maxItems = config?.maxItems || 10
  const items: OrbitItem[] = Array.isArray(value) ? value : []

  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState<string>('amizade_proxima')
  const [newRing, setNewRing] = useState<OrbitRingId>('proxima')
  const [liveMessage, setLiveMessage] = useState('')

  const rings = config?.defaultRings || ORBIT_RINGS

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (disabled || items.length >= maxItems) return

    const trimmed = newLabel.trim()
    const resolvedLabel =
      trimmed ||
      RELATIONAL_CATEGORY_PRESETS.find((c) => c.id === newCategory)?.label ||
      'Vínculo não identificado'

    const newItem: OrbitItem = {
      id: `vinculo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: resolvedLabel,
      category: newCategory,
      ring: newRing,
    }

    const nextItems = [...items, newItem]
    onChange(nextItems)
    setNewLabel('')
    const ringName = rings.find((r) => r.id === newRing)?.label || newRing
    setLiveMessage(
      `Vínculo "${resolvedLabel}" adicionado na órbita ${ringName}. Total de vínculos: ${nextItems.length}.`,
    )
  }

  const handleRemoveItem = (id: string) => {
    if (disabled) return
    const target = items.find((it) => it.id === id)
    const nextItems = items.filter((it) => it.id !== id)
    onChange(nextItems)
    setLiveMessage(
      `Vínculo "${target?.label || ''}" removido. Total de vínculos: ${nextItems.length}.`,
    )
  }

  const handleMoveRing = (id: string, targetRing: OrbitRingId) => {
    if (disabled) return
    const nextItems = items.map((it) => (it.id === id ? { ...it, ring: targetRing } : it))
    onChange(nextItems)
    const item = items.find((it) => it.id === id)
    const ringLabel = rings.find((r) => r.id === targetRing)?.label || targetRing
    setLiveMessage(`Vínculo "${item?.label || ''}" movido para a órbita ${ringLabel}.`)
  }

  const handleShiftRing = (id: string, direction: 'closer' | 'further') => {
    const item = items.find((it) => it.id === id)
    if (!item) return
    const currentIdx = rings.findIndex((r) => r.id === item.ring)
    if (currentIdx === -1) return

    const newIdx = direction === 'closer' ? currentIdx - 1 : currentIdx + 1
    if (newIdx >= 0 && newIdx < rings.length) {
      handleMoveRing(id, rings[newIdx].id)
    }
  }

  return (
    <div
      className="flex flex-col space-y-6 max-w-2xl mx-auto py-2 motion-reduce:transition-none"
      role="group"
      aria-label="Mapa de Órbitas Relacionais"
    >
      {/* Live Region Acessível para Leitores de Tela */}
      <div className="sr-only" aria-live="polite" role="status">
        {liveMessage || `${items.length} de ${maxItems} vínculos posicionados no mapa.`}
      </div>

      {/* Microcopy Obrigatória Constitucional */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground leading-relaxed">
        <p className="font-medium text-foreground mb-0.5">
          Não existe distância certa. Estamos olhando apenas para como esses vínculos parecem estar
          na sua vida hoje.
        </p>
        <p className="text-[11px] text-muted-foreground/90">
          Você pode usar apelidos, categorias gerais ou &quot;prefiro não identificar&quot;. A
          posição no mapa não representa qualidade, afeto ou segurança — apenas a proximidade
          percebida neste momento.
        </p>
      </div>

      {/* SVG Interativo & Responsivo das Órbitas */}
      <div
        className="relative w-full aspect-square max-w-[360px] mx-auto flex items-center justify-center p-2 bg-gradient-to-b from-muted/20 to-muted/5 border border-border/60 rounded-3xl shrink-0 overflow-hidden"
        aria-hidden="true"
      >
        <svg viewBox="-200 -200 400 400" className="w-full h-full motion-reduce:transition-none">
          {/* Anéis de Órbita Concêntricos */}
          {rings.map((ring) => (
            <g key={ring.id}>
              <circle
                cx="0"
                cy="0"
                r={ring.radius}
                className="fill-none stroke-border/70"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x="0"
                y={-ring.radius + 12}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px] font-sans select-none tracking-wider opacity-60"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Centro: A Participante */}
          <circle cx="0" cy="0" r="20" className="fill-primary/20 stroke-primary" strokeWidth="2" />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="fill-primary text-[10px] font-medium font-sans select-none"
          >
            Você
          </text>

          {/* Vínculos posicionados ao redor de suas respectivas órbitas */}
          {rings.map((ring) => {
            const ringItems = items.filter((it) => it.ring === ring.id)
            const count = ringItems.length
            return ringItems.map((item, idx) => {
              // Distribuição angular equitativa na órbita com defasagem suave
              const angle = (2 * Math.PI * idx) / (count || 1) - Math.PI / 2 + 0.35
              const x = ring.radius * Math.cos(angle)
              const y = ring.radius * Math.sin(angle)
              const shortLabel =
                item.label.length > 14 ? `${item.label.substring(0, 12)}…` : item.label

              return (
                <g key={item.id} className="cursor-default">
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    className="fill-card stroke-primary/70 shadow-sm"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    className="fill-foreground text-[8px] font-medium font-sans select-none pointer-events-none"
                  >
                    {shortLabel}
                  </text>
                </g>
              )
            })
          })}
        </svg>

        {/* Resumo visual do topo do mapa */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] text-muted-foreground pointer-events-none">
          <span className="bg-background/90 px-2 py-0.5 rounded-full border border-border/40 font-mono">
            {items.length} {items.length === 1 ? 'vínculo' : 'vínculos'}
          </span>
          <span className="bg-background/90 px-2 py-0.5 rounded-full border border-border/40">
            Proximidade HOJE
          </span>
        </div>
      </div>

      {/* Formulário para Adicionar Vínculo (Privacy-Safe) */}
      {!disabled && items.length < maxItems && (
        <form
          onSubmit={handleAddItem}
          className="p-4 rounded-2xl bg-card border border-border/70 space-y-3"
          aria-label="Adicionar vínculo ao mapa"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              Adicionar pessoa, grupo ou vínculo
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {items.length}/{maxItems}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1 space-y-1">
              <label htmlFor="orbit-item-label" className="text-[11px] text-muted-foreground block">
                Como quer chamar (apelido ou inicial)
              </label>
              <Input
                id="orbit-item-label"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Mãe, A., Amiga, Colega"
                maxLength={28}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="orbit-item-category"
                className="text-[11px] text-muted-foreground block"
              >
                Tipo ou contexto
              </label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger id="orbit-item-category" className="text-xs h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONAL_CATEGORY_PRESETS.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label htmlFor="orbit-item-ring" className="text-[11px] text-muted-foreground block">
                Órbita hoje
              </label>
              <Select value={newRing} onValueChange={(val) => setNewRing(val as OrbitRingId)}>
                <SelectTrigger id="orbit-item-ring" className="text-xs h-9">
                  <SelectValue placeholder="Órbita" />
                </SelectTrigger>
                <SelectContent>
                  {rings.map((ring) => (
                    <SelectItem key={ring.id} value={ring.id} className="text-xs">
                      {ring.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={disabled || items.length >= maxItems}
              className="text-xs h-8 px-3 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Posicionar no mapa</span>
            </Button>
          </div>
        </form>
      )}

      {/* Lista Estruturada Sincronizada 100% Acessível por Teclado */}
      <div className="space-y-2" role="region" aria-label="Lista detalhada dos vínculos no mapa">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs text-muted-foreground font-medium">
            Vínculos posicionados (gerenciáveis por teclado):
          </span>
          <span className="text-[11px] text-muted-foreground">
            {items.length === 0 ? 'Nenhum vínculo adicionado ainda' : `${items.length} no mapa`}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
            Adicione pelo menos um vínculo, categoria ou grupo significativo para compor seu mundo
            de relações.
          </div>
        ) : (
          <div className="space-y-2" role="list">
            {items.map((item, index) => {
              const currentRingIdx = rings.findIndex((r) => r.id === item.ring)
              const canMoveCloser = currentRingIdx > 0
              const canMoveFurther = currentRingIdx < rings.length - 1
              const ringDef = rings.find((r) => r.id === item.ring)

              return (
                <div
                  key={item.id}
                  role="listitem"
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/70 bg-card/80 gap-2.5 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {item.category === 'comunidade_grupo' ? (
                        <Users className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.label}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-normal py-0">
                          {ringDef?.label || item.ring}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {RELATIONAL_CATEGORY_PRESETS.find((c) => c.id === item.category)?.label ||
                          item.category ||
                          'Vínculo'}
                      </p>
                    </div>
                  </div>

                  {/* Controles por Teclado: Seleção direta de anel ou botões Aproximar/Afastar */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Select
                      value={item.ring}
                      onValueChange={(val) => handleMoveRing(item.id, val as OrbitRingId)}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        aria-label={`Mudar órbita de ${item.label}`}
                        className="text-xs h-7 w-[120px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rings.map((r) => (
                          <SelectItem key={r.id} value={r.id} className="text-xs">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled || !canMoveCloser}
                      onClick={() => handleShiftRing(item.id, 'closer')}
                      aria-label={`Aproximar ${item.label} para órbita mais interna`}
                      className="h-7 w-7 p-0"
                      title="Aproximar órbita"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled || !canMoveFurther}
                      onClick={() => handleShiftRing(item.id, 'further')}
                      aria-label={`Afastar ${item.label} para órbita mais externa`}
                      className="h-7 w-7 p-0"
                      title="Afastar órbita"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remover ${item.label} do mapa`}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
