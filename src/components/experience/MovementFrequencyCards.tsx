import React from 'react'
import {
  readMovementRatings,
  readSelectedIds,
  movementFrequencyComplete,
} from '@/services/movementFrequency'
import type { MultiSelectOption } from './MultiSelectCards'

interface Props {
  config: { options: MultiSelectOption[]; movement_scale_options: string[] }
  value: unknown
  onChange: (value: {
    ratings: Record<string, string>
    legacy_selected_ids: string[]
    frequency_complete: boolean
  }) => void
  disabled?: boolean
}

export function MovementFrequencyCards({ config, value, onChange, disabled = false }: Props) {
  const ratings = readMovementRatings(value)
  const legacy = readSelectedIds(value)
  return (
    <div className="space-y-4">
      {legacy.some((id) => !ratings[id]) && (
        <p role="status" className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          Suas escolhas anteriores estão preservadas. A frequência ainda não foi informada; escolha
          como cada movimento aparece em você.
        </p>
      )}
      {config.options.map((option) => (
        <div
          key={option.id}
          className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">{option.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
            {legacy.includes(option.id) && !ratings[option.id] && (
              <p className="text-xs text-primary">
                Marcado anteriormente • frequência não informada
              </p>
            )}
          </div>
          <label className="block space-y-1 text-xs">
            <span>Como esse movimento aparece em você?</span>
            <select
              aria-label={`Frequência: ${option.title}`}
              disabled={disabled}
              value={ratings[option.id] || ''}
              className="min-h-10 w-full rounded-md border border-input bg-background px-2 text-xs"
              onChange={(event) => {
                const next = { ...ratings, [option.id]: event.target.value }
                onChange({
                  ratings: next,
                  legacy_selected_ids: legacy,
                  frequency_complete: movementFrequencyComplete(
                    { ratings: next },
                    config.options,
                    config.movement_scale_options,
                  ),
                })
              }}
            >
              <option value="" disabled>
                Escolha uma opção
              </option>
              {config.movement_scale_options.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </div>
  )
}
