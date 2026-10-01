import type { CerPromptRecord, ExperienceResponseRecord } from '@/types/cer'
import { ORBIT_RINGS } from './RelationalOrbitMap'

export function readOrbitItems(value: unknown): any[] {
  const source = value as any
  const items = Array.isArray(source)
    ? source
    : (source?.value ?? source?.selectedOptionIds ?? source?.items)
  return Array.isArray(items)
    ? items.filter((item) => item && typeof item === 'object' && typeof item.label === 'string')
    : []
}

/** Render authored labels and participant words, never raw objects or storage metadata. */
export function formatPromptResponse(
  prompt: CerPromptRecord | undefined,
  response: ExperienceResponseRecord | null | undefined,
): string {
  if (!response) return 'Não registrado'
  const source = response.structured_value as any
  if (source?.is_legitimate_skip) {
    return source.skip_reason === 'prefiro_nao_responder'
      ? 'Prefiro não responder'
      : 'Não sei dizer agora'
  }
  if (prompt?.component_type === 'RelationalOrbitMap') {
    const items = readOrbitItems(source)
    return items.length
      ? items
          .map((item) => {
            const ring = ORBIT_RINGS.find((r) => r.id === item.ring)
            return ring ? `${item.label} — ${ring.label}` : item.label
          })
          .join('; ')
      : 'Nenhum vínculo registrado'
  }
  const config = prompt?.schema_config as any
  const value =
    source?.choice ??
    source?.value ??
    source?.selectedOptionId ??
    source?.selectedOptionIds ??
    source
  const labelFor = (item: unknown): string => {
    if (typeof item !== 'string' && typeof item !== 'number' && typeof item !== 'boolean') return ''
    const option = config?.options?.find((option: any) => option.id === item)
    return option?.title || option?.label || String(item)
  }
  const choice = Array.isArray(value)
    ? value.map(labelFor).filter(Boolean).join('; ')
    : labelFor(value)
  const text = typeof response.free_text === 'string' ? response.free_text.trim() : ''
  const normalize = (text: string) => text.normalize('NFKC').replace(/\s+/g, ' ').trim()
  return (
    [choice, text && normalize(text) !== normalize(choice) ? text : '']
      .filter(Boolean)
      .join(' — ') || 'Resposta registrada'
  )
}
