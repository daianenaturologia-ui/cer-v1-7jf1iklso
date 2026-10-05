import pb from '@/lib/pocketbase/client'
import { demoAdapter } from './demoAdapter'

export interface SessionAiProposal {
  sessionId: string
  enrollmentId: string
  status: 'pending_review'
  summary: string
  changes: { dimension: string; proposal: string; basis: ('session_note' | 'published_map')[]; uncertainty: 'medium' | 'high' }[]
  questions: string[]
  sources: { noteId: string; noteUpdated: string; mapId: string | null }
  modelMetadata: { provider: 'openai'; model: string; promptVersion: string }
}

/** No raw note sent from the browser; server resolves the authenticated scope. */
export async function requestSessionAiProposal(sessionId: string, enrollmentId: string): Promise<SessionAiProposal> {
  if (demoAdapter.isEnabled()) throw new Error('A demonstração não envia notas para IA. A integração precisa ser ativada no servidor.')
  if (!/^[a-zA-Z0-9]{15}$/.test(sessionId)) throw new Error('Encontro inválido.')
  try {
    const result = await pb.send<SessionAiProposal>('/backend/v1/cer/session-map-proposal', { method: 'POST', body: { sessionId } })
    if (result.sessionId !== sessionId || result.enrollmentId !== enrollmentId || result.status !== 'pending_review' || typeof result.summary !== 'string' || !Array.isArray(result.changes) || !Array.isArray(result.questions)) throw new Error('Resposta de outro acompanhamento ou proposta inválida.')
    return result
  } catch (error) {
    const failure = error as { status?: number; response?: { code?: string } }
    if (failure.status === 404 || failure.response?.code === 'ai_not_configured') throw new Error('A análise por IA ainda não foi configurada no servidor.')
    if (failure.response?.code === 'ai_source_changed') throw new Error('A nota ou o mapa mudou durante a análise. Solicite uma nova proposta.')
    if (failure.status === 429) throw new Error('Aguarde um minuto antes de solicitar outra análise.')
    // Never display the provider body or credentials via a generic server error.
    throw new Error('Não foi possível obter uma proposta válida. A nota e o mapa foram preservados.')
  }
}
