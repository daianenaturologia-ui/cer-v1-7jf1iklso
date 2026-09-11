import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Info } from 'lucide-react'

export interface FreeReflectionConfig {
  placeholder?: string
  voiceTranscriptionSupported?: boolean
  minChars?: number
}

export interface FreeReflectionProps {
  config: FreeReflectionConfig
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  openFirstConfig?: {
    enabled: boolean
    helpLabel: string
    optionSetRef?: string
  }
  onHelpRequested?: () => void
  showSuggestions?: boolean
  namingOrigin?: 'spontaneous' | 'selected_after_prompting' | 'not_applicable'
  isReadOnly?: boolean
}

export const FreeReflection: React.FC<FreeReflectionProps> = ({
  config,
  value = '',
  onChange,
  disabled = false,
  openFirstConfig,
  onHelpRequested,
  showSuggestions = false,
  namingOrigin,
  isReadOnly = false,
}) => {
  const placeholder =
    config?.placeholder || 'Escreva livremente o que você percebe ou deseja registrar...'

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <div className="relative space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isReadOnly}
          placeholder={placeholder}
          rows={5}
          className="w-full text-sm leading-relaxed p-4 rounded-xl border border-border/70 bg-card/60 resize-y focus-visible:ring-1 focus-visible:ring-primary font-normal"
        />

        {/* Indicador de arquitetura futura para voz/transcrição (sem IA neste build) */}
        {config?.voiceTranscriptionSupported && (
          <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <Mic className="w-3.5 h-3.5 opacity-60" />
              <span>Gravação de áudio preparada para builds futuros (desativada no Build 02)</span>
            </div>
            <span className="font-mono text-[11px]">{value.length} caracteres</span>
          </div>
        )}
      </div>

      {/* OPEN-FIRST Pattern (Build 07A) */}
      {openFirstConfig?.enabled && (
        <div className="pt-2 border-t border-border/40 space-y-2">
          {!showSuggestions ? (
            <button
              type="button"
              onClick={onHelpRequested}
              className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              <span>
                {openFirstConfig.helpLabel || 'Precisa de ajuda para nomear? Ver sugestões'}
              </span>
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Sugestões de apoio:</span>
                <button
                  type="button"
                  onClick={onHelpRequested}
                  className="text-muted-foreground hover:text-foreground text-[11px]"
                >
                  Ocultar
                </button>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Escolha uma opção se ajudar a expressar o que você sente, ou continue com suas
                próprias palavras acima.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
