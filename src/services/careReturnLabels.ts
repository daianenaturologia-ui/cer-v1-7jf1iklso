import type { OperationalAcceptanceResponseType } from '@/types/cer'

export const CARE_RETURN_LABELS: Record<OperationalAcceptanceResponseType, string> = {
  accepted: 'Faz sentido para mim',
  wants_to_try: 'Quero tentar',
  too_much: 'Está demais para mim',
  wants_to_adapt: 'Quero adaptar',
  not_now: 'Agora não',
  alternative_requested: 'Quero outra possibilidade',
  wants_to_talk: 'Prefiro conversar',
}

export function careReturnLabel(value: string): string {
  return CARE_RETURN_LABELS[value as OperationalAcceptanceResponseType] || 'Retorno compartilhado'
}
