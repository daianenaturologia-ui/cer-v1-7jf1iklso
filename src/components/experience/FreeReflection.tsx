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
}

export const FreeReflection: React.FC<FreeReflectionProps> = ({
  config,
  value = '',
  onChange,
  disabled = false,
}) => {
  const placeholder =
    config?.placeholder || 'Escreva livremente o que você percebe ou deseja registrar...'

  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
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
    </div>
  )
}
