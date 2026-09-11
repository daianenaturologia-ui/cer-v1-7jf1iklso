import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AttentionItem, AttentionCategory } from '@/services/attentionService'

interface AttentionPanelProps {
  items: AttentionItem[]
  loading?: boolean
  selectedCategory?: AttentionCategory | 'ALL'
  onSelectCategory?: (category: AttentionCategory | 'ALL') => void
  showParticipantName?: boolean
  compact?: boolean
  className?: string
}

export const AttentionPanel: React.FC<AttentionPanelProps> = ({
  items,
  loading = false,
  selectedCategory = 'ALL',
  onSelectCategory,
  showParticipantName = true,
  compact = false,
  className = '',
}) => {
  const securityItems = items.filter((i) => i.category === 'SEGURANÇA')
  const reviewItems = items.filter((i) => i.category === 'REVISAR')
  const informativeItems = items.filter((i) => i.category === 'INFORMATIVO')

  const filteredItems = items.filter((i) => {
    if (selectedCategory === 'ALL') return true
    return i.category === selectedCategory
  })

  const getCategoryConfig = (cat: AttentionCategory) => {
    switch (cat) {
      case 'SEGURANÇA':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />,
          badgeVariant: 'destructive' as const,
          badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-300',
          titleColor: 'text-red-700 dark:text-red-300',
          borderClass: 'border-l-4 border-l-red-500 bg-red-500/5',
        }
      case 'REVISAR':
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
          badgeVariant: 'secondary' as const,
          badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300',
          titleColor: 'text-amber-900 dark:text-amber-300',
          borderClass: 'border-l-4 border-l-amber-500 bg-amber-500/5',
        }
      case 'INFORMATIVO':
        return {
          icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
          badgeVariant: 'outline' as const,
          badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200',
          titleColor: 'text-blue-800 dark:text-blue-300',
          borderClass: 'border-l-4 border-l-blue-400 bg-blue-500/5',
        }
    }
  }

  return (
    <Card className={`border-border/70 ${className}`}>
      <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Painel de Atenção e Cuidado
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sinalizações operacionais ativas: Segurança, Revisão e Informação (sem scores de
              risco)
            </p>
          </div>

          {onSelectCategory && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                size="sm"
                variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
                className="h-7 text-[11px] px-2.5"
                onClick={() => onSelectCategory('ALL')}
              >
                Todos ({items.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'SEGURANÇA' ? 'destructive' : 'outline'}
                className="h-7 text-[11px] px-2.5 gap-1"
                onClick={() => onSelectCategory('SEGURANÇA')}
              >
                <ShieldAlert className="w-3 h-3" />
                Segurança ({securityItems.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'REVISAR' ? 'secondary' : 'outline'}
                className="h-7 text-[11px] px-2.5 gap-1"
                onClick={() => onSelectCategory('REVISAR')}
              >
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Revisar ({reviewItems.length})
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'INFORMATIVO' ? 'secondary' : 'outline'}
                className="h-7 text-[11px] px-2.5"
                onClick={() => onSelectCategory('INFORMATIVO')}
              >
                Informativo ({informativeItems.length})
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Avaliando estados de cuidado e atenção...
          </p>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-6 space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
              ✓
            </div>
            <p className="text-xs font-medium text-foreground">
              {selectedCategory === 'ALL'
                ? 'Nenhuma pendência prioritária no momento'
                : `Nenhum item na categoria "${selectedCategory}"`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              O fluxo de cuidado segue estável. As respostas e devolutivas dos participantes
              aparecerão aqui quando demandarem seu olhar.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const cfg = getCategoryConfig(item.category)
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border border-border/50 text-xs transition-colors ${cfg.borderClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        {cfg.icon}
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold tracking-wider ${cfg.badgeClass}`}
                        >
                          {item.category}
                        </Badge>
                      </div>

                      {showParticipantName && item.participantName && (
                        <span className="text-xs font-semibold text-foreground">
                          {item.participantName}
                        </span>
                      )}

                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className={`text-xs font-semibold ${cfg.titleColor}`}>{item.title}</h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.actionTarget && (
                    <div className="shrink-0 self-end sm:self-center">
                      <Link to={item.actionTarget}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 gap-1.5 border-border/80 hover:bg-muted"
                        >
                          <span>{item.actionLabel || 'Ver Detalhes'}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
