import pb from '@/lib/pocketbase/client'
import { demoAdapter } from './demoAdapter'

export type FeedbackCategory = 'app' | 'process'
export type FeedbackStatus = 'new' | 'reviewing' | 'resolved'
export type IncidentCode = 'ui_exception' | 'unhandled_rejection' | 'onboarding_save' | 'feedback_save' | 'quality_load'
export type IncidentArea = 'journey' | 'professional' | 'feedback' | 'other'
export interface FeedbackRecord { id: string; category: FeedbackCategory; message: string; status: FeedbackStatus; created: string; enrollment_id?: string; review_note?: string }
export interface FeedbackContext { id: string; professional: string; product: string }
export interface WeeklyAudit { id: string; week_start: string; week_end: string; reviewed_at: string; summary: { app_feedback: number; process_feedback: number; incidents: number; pending_review_at_generation: number; by_code: Partial<Record<IncidentCode, number>> } }
const endpoint = '/backend/v1/cer/quality'
const send = <T>(body: object) => pb.send<T>(endpoint, { method: 'POST', body, requestKey: null })

// Only read actions recover automatically, at most once. Never retry writes here.
export async function readQuality<T>(action: 'context' | 'mine' | 'inbox' | 'audits', extra = {}): Promise<T> {
  if (demoAdapter.isEnabled()) throw new Error('Este espaço usa uma conta real para manter o feedback privado.')
  try { return await send<T>({ action, ...extra }) } catch (error) {
    const status = (error as { status?: number; isAbort?: boolean }).status
    if ((error as { isAbort?: boolean }).isAbort || (status !== 0 && !(status && status >= 500))) throw error
    return send<T>({ action, ...extra })
  }
}
export async function submitFeedback(body: { enrollment_id: string; category: FeedbackCategory; message: string; request_id: string }) {
  if (demoAdapter.isEnabled()) throw new Error('Envio disponível na conta real.')
  return send<FeedbackRecord>({ ...body, action: 'submit' })
}
export const reviewFeedback = (id: string, status: FeedbackStatus, note: string) => send<FeedbackRecord>({ action: 'review', id, status, note })
export const acknowledgeAudit = (id: string) => send<{ reviewed: boolean }>({ action: 'acknowledge', id })

const sent = new Set<string>()
let enrollmentId = ''
export function setQualityEnrollment(id: string) { enrollmentId = id }
// No exception object, email, free text, query, URL, token or clinical response.
export function reportIncident(code: IncidentCode, area: IncidentArea) {
  if (demoAdapter.isEnabled() || !pb.authStore.isValid || !pb.authStore.record?.id) return
  const key = `${pb.authStore.record.id}:${code}:${area}`
  if (sent.has(key) || sent.size >= 20) return
  sent.add(key)
  void send({ action: 'incident', code, area, enrollment_id: enrollmentId, release: 'pilot-quality-v1' }).catch(() => { /* Monitoring must never cause another rejection. */ })
}
