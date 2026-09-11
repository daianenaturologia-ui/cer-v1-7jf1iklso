/**
 * Build 05: Authorized Context Resolver & Recursive Provenance Traversal
 *
 * PRINCÍPIOS CONGELADOS:
 * - AI NEVER HAS BROADER DATA AUTHORITY THAN THE HUMAN WHO INVOKED IT.
 * - AI reads AUTHORIZED CONTEXT, never arbitrary database access.
 * - Session Note is excluded from AI V1 (100% prohibited).
 * - participant_private is excluded from professional AI V1.
 * - KI professional_private is excluded from AI V1.
 * - Traversal semântica allowlisted (não graph crawling arbitrário).
 * - Visited set + cycle detection + max depth sã + fail closed.
 * - Audit metadata (sem cópia de texto bruto).
 */

import pb from '@/lib/pocketbase/client'
import { VisibilityClass, AiProposalSourceType } from '@/types/cer'

export interface ResolvedSourceItem {
  source_type: AiProposalSourceType
  source_id: string
  source_version?: number
  concept_key?: string
  access_class: VisibilityClass
  statement?: string
  text?: string
  free_text?: string
  structured_value?: unknown
  provenance_path?: string[]
}

export interface ContextResolverResult {
  isAuthorized: boolean
  failureReason?: string
  sources: ResolvedSourceItem[]
  unresolvedBranches: string[]
  hasConflicting: boolean
  conflictDescription?: string
}

export interface ResolveContextParams {
  humanUserId: string
  enrollmentId: string
  purpose: 'brief' | 'ask_cer' | 'proposal_engine'
  requestedCategories?: Array<
    | 'experience_responses'
    | 'cer_signals'
    | 'cer_associations'
    | 'cer_knowledge_items'
    | 'cer_participant_recognitions'
    | 'cer_session_observations'
    | 'cer_knowledge_presentations'
  >
  rootEntity?: {
    type: 'knowledge_item' | 'association' | 'signal'
    id: string
  }
}

const ALLOWED_CATEGORIES = [
  'experience_responses',
  'cer_signals',
  'cer_associations',
  'cer_knowledge_items',
  'cer_participant_recognitions',
  'cer_session_observations',
  'cer_knowledge_presentations',
]

/**
 * Validates that the invoking human user has active professional access to the enrollment
 */
export async function validateProfessionalAccess(
  humanUserId: string,
  enrollmentId: string,
): Promise<boolean> {
  if (!humanUserId || !enrollmentId) return false

  try {
    const accessRecords = await pb.collection('professional_enrollment_access').getFullList({
      filter: `enrollment_id = "${enrollmentId}" && professional_user_id = "${humanUserId}" && is_active = true`,
    })

    return accessRecords.length > 0
  } catch {
    return false
  }
}

/**
 * Server-side audit helper with minimal technical metadata
 */
export async function auditAiEvent(params: {
  action:
    | 'AI_REQUESTED'
    | 'AI_CONTEXT_RESOLVED'
    | 'AI_PROPOSAL_CREATED'
    | 'AI_PROPOSAL_REVIEWED'
    | 'AI_REQUEST_REFUSED'
  actorUserId: string
  enrollmentId: string
  purpose: string
  result: 'success' | 'failure' | 'denied'
  metadata: {
    source_count?: number
    source_types?: string[]
    proposal_id?: string
    proposal_type?: string
    model?: string
    status?: string
    reason?: string
  }
}) {
  try {
    await pb.collection('audit_events').create({
      actor_user_id: params.actorUserId,
      action: params.action,
      resource_type: 'cer_ai_core',
      resource_id: params.metadata.proposal_id || params.purpose,
      enrollment_id: params.enrollmentId,
      timestamp: new Date().toISOString(),
      result: params.result,
      request_context: 'server_ai_core',
      metadata: params.metadata, // Pure technical metadata! No raw prompts, no notes, no personal data.
    })
  } catch {
    // Fail-safe: audit errors should not crash the flow silently
  }
}

/**
 * Traverses authorized epistemic provenance recursively with visited-set & cycle detection
 * Max depth: 6
 * Terminal paths:
 * - KI -> Association -> Signal -> Response (terminal)
 * - KI -> Signal -> Response (terminal)
 * - KI -> Response (terminal)
 * - KI -> Session Observation (terminal)
 * - KI -> Recognition (terminal, presentation_id retains as metadata without recursing back to KI)
 */
export async function traverseEpistemicProvenance(
  startType: 'knowledge_item' | 'association' | 'signal',
  startId: string,
  enrollmentId: string,
  humanUserId: string,
  visited: Set<string> = new Set(),
  depth: number = 0,
): Promise<{ sources: ResolvedSourceItem[]; unresolved: string[] }> {
  const MAX_DEPTH = 6
  const key = `${startType}:${startId}`

  if (depth > MAX_DEPTH) {
    return { sources: [], unresolved: [`max_depth_exceeded:${key}`] }
  }

  if (visited.has(key)) {
    // Cycle detected — break immediately with safe failure
    return { sources: [], unresolved: [`cycle_detected:${key}`] }
  }

  visited.add(key)
  const sources: ResolvedSourceItem[] = []
  const unresolved: string[] = []

  try {
    if (startType === 'knowledge_item') {
      const ki = await pb.collection('cer_knowledge_items').getOne(startId)
      // Check cross-enrollment & privacy
      if (ki.enrollment_id !== enrollmentId) {
        return { sources: [], unresolved: [`cross_enrollment:${key}`] }
      }
      if (ki.access_class === 'participant_private') {
        return { sources: [], unresolved: [`participant_private_denied:${key}`] }
      }
      if (ki.access_class === 'professional_private') {
        // KI professional_private is EXCLUDED from AI V1!
        return { sources: [], unresolved: [`ki_professional_private_excluded:${key}`] }
      }

      sources.push({
        source_type: 'knowledge_item',
        source_id: ki.id,
        source_version: ki.version,
        concept_key: ki.concept_key,
        access_class: ki.access_class as VisibilityClass,
        statement: ki.statement,
      })

      // Fetch evidences linked to this KI
      const evidences = await pb.collection('cer_knowledge_evidence').getFullList({
        filter: `knowledge_item_id = "${ki.id}"`,
      })

      for (const ev of evidences) {
        const evType = ev.evidence_type
        const evId = ev.evidence_id

        if (evType === 'signal') {
          const res = await traverseEpistemicProvenance(
            'signal',
            evId,
            enrollmentId,
            humanUserId,
            new Set(visited),
            depth + 1,
          )
          sources.push(...res.sources)
          unresolved.push(...res.unresolved)
        } else if (evType === 'association') {
          const res = await traverseEpistemicProvenance(
            'association',
            evId,
            enrollmentId,
            humanUserId,
            new Set(visited),
            depth + 1,
          )
          sources.push(...res.sources)
          unresolved.push(...res.unresolved)
        } else if (evType === 'response') {
          const respRes = await resolveSingleSource(
            'experience_response',
            evId,
            enrollmentId,
            humanUserId,
          )
          if (respRes) sources.push(respRes)
          else unresolved.push(`unresolved_response:${evId}`)
        } else if (
          evType === 'professional_observation' ||
          evType === 'participant_report_in_session'
        ) {
          const obsRes = await resolveSingleSource(
            'session_observation',
            evId,
            enrollmentId,
            humanUserId,
          )
          if (obsRes) sources.push(obsRes)
          else unresolved.push(`unresolved_observation:${evId}`)
        } else if (evType === 'participant_recognition') {
          const recogRes = await resolveSingleSource(
            'participant_recognition',
            evId,
            enrollmentId,
            humanUserId,
          )
          if (recogRes) {
            sources.push(recogRes)
            // STOP! Terminal node — do NOT traverse back to Presentation -> KI!
          } else {
            unresolved.push(`unresolved_recognition:${evId}`)
          }
        } else {
          // Unknown / unlisted evidence type -> fail closed
          unresolved.push(`unknown_evidence_type:${evType}`)
        }
      }
    } else if (startType === 'association') {
      const assoc = await pb.collection('cer_associations').getOne(startId)
      if (assoc.enrollment_id !== enrollmentId) {
        return { sources: [], unresolved: [`cross_enrollment:${key}`] }
      }
      if (assoc.access_class === 'participant_private') {
        return { sources: [], unresolved: [`participant_private_denied:${key}`] }
      }

      sources.push({
        source_type: 'association',
        source_id: assoc.id,
        concept_key: assoc.concept_key,
        access_class: assoc.access_class as VisibilityClass,
      })

      // Fetch association evidence (signals)
      const assocEvs = await pb.collection('cer_association_evidence').getFullList({
        filter: `association_id = "${assoc.id}"`,
      })

      for (const aEv of assocEvs) {
        const res = await traverseEpistemicProvenance(
          'signal',
          aEv.signal_id,
          enrollmentId,
          humanUserId,
          new Set(visited),
          depth + 1,
        )
        sources.push(...res.sources)
        unresolved.push(...res.unresolved)
      }
    } else if (startType === 'signal') {
      const sig = await pb.collection('cer_signals').getOne(startId)
      if (sig.enrollment_id !== enrollmentId) {
        return { sources: [], unresolved: [`cross_enrollment:${key}`] }
      }
      if (sig.access_class === 'participant_private') {
        return { sources: [], unresolved: [`participant_private_denied:${key}`] }
      }

      sources.push({
        source_type: 'signal',
        source_id: sig.id,
        concept_key: sig.concept_key,
        access_class: sig.access_class as VisibilityClass,
      })

      // If derived from experience response -> terminal response
      if (sig.source_response_id) {
        const respRes = await resolveSingleSource(
          'experience_response',
          sig.source_response_id,
          enrollmentId,
          humanUserId,
        )
        if (respRes) sources.push(respRes)
        else unresolved.push(`unresolved_response:${sig.source_response_id}`)
      }
    }
  } catch (err: any) {
    unresolved.push(`error_resolving:${key}:${err.message || 'not_found'}`)
  }

  // Deduplicate sources by type + id
  const seenMap = new Map<string, ResolvedSourceItem>()
  for (const s of sources) {
    const sKey = `${s.source_type}:${s.source_id}`
    if (!seenMap.has(sKey)) {
      seenMap.set(sKey, s)
    }
  }

  return { sources: Array.from(seenMap.values()), unresolved }
}

/**
 * Resolves a single terminal or discrete source enforcing strict authorization and privacy
 */
async function resolveSingleSource(
  type: AiProposalSourceType,
  id: string,
  enrollmentId: string,
  humanUserId: string,
): Promise<ResolvedSourceItem | null> {
  // SESSION NOTE IS HARD DENIED!
  if ((type as string) === 'cer_session_notes' || (type as string) === 'session_note') {
    return null
  }

  try {
    if (type === 'experience_response') {
      const rec = await pb.collection('experience_responses').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      if (rec.access_class === 'participant_private') return null
      return {
        source_type: 'experience_response',
        source_id: rec.id,
        source_version: rec.version,
        access_class: rec.access_class as VisibilityClass,
        free_text: rec.free_text,
        structured_value: rec.structured_value,
      }
    }

    if (type === 'session_observation') {
      const rec = await pb.collection('cer_session_observations').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      // ONLY observation recorded by the invoking professional!
      if (rec.recorded_by_user_id !== humanUserId) return null
      return {
        source_type: 'session_observation',
        source_id: rec.id,
        access_class: rec.access_class as VisibilityClass,
        text: rec.text,
      }
    }

    if (type === 'participant_recognition') {
      const rec = await pb.collection('cer_participant_recognitions').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      if (rec.access_class === 'participant_private') return null
      return {
        source_type: 'participant_recognition',
        source_id: rec.id,
        access_class: rec.access_class as VisibilityClass,
      }
    }

    if (type === 'signal') {
      const rec = await pb.collection('cer_signals').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      if (rec.access_class === 'participant_private') return null
      return {
        source_type: 'signal',
        source_id: rec.id,
        concept_key: rec.concept_key,
        access_class: rec.access_class as VisibilityClass,
      }
    }

    if (type === 'association') {
      const rec = await pb.collection('cer_associations').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      if (rec.access_class === 'participant_private') return null
      return {
        source_type: 'association',
        source_id: rec.id,
        concept_key: rec.concept_key,
        access_class: rec.access_class as VisibilityClass,
      }
    }

    if (type === 'knowledge_item') {
      const rec = await pb.collection('cer_knowledge_items').getOne(id)
      if (rec.enrollment_id !== enrollmentId) return null
      if (rec.access_class === 'participant_private') return null
      if (rec.access_class === 'professional_private') return null // Excluded from AI V1
      return {
        source_type: 'knowledge_item',
        source_id: rec.id,
        source_version: rec.version,
        concept_key: rec.concept_key,
        access_class: rec.access_class as VisibilityClass,
        statement: rec.statement,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Main Authorized Context Resolver for AI Core V1
 */
export async function resolveAuthorizedContext(
  params: ResolveContextParams,
): Promise<ContextResolverResult> {
  const { humanUserId, enrollmentId, purpose, requestedCategories, rootEntity } = params

  // 1. Audit request
  await auditAiEvent({
    action: 'AI_REQUESTED',
    actorUserId: humanUserId,
    enrollmentId,
    purpose,
    result: 'success',
    metadata: {
      proposal_type: purpose,
    },
  })

  // 2. Validate active professional relationship with enrollment
  const isAuthorized = await validateProfessionalAccess(humanUserId, enrollmentId)
  if (!isAuthorized) {
    await auditAiEvent({
      action: 'AI_REQUEST_REFUSED',
      actorUserId: humanUserId,
      enrollmentId,
      purpose,
      result: 'denied',
      metadata: {
        reason: 'professional_access_not_active_or_cross_enrollment',
      },
    })
    return {
      isAuthorized: false,
      failureReason: 'Profissional não possui vínculo ativo com este enrollment.',
      sources: [],
      unresolvedBranches: ['enrollment_access_denied'],
      hasConflicting: false,
    }
  }

  // 3. Resolve context
  const sources: ResolvedSourceItem[] = []
  const unresolvedBranches: string[] = []

  // If a root entity was provided, do targeted epistemic traversal
  if (rootEntity) {
    const trav = await traverseEpistemicProvenance(
      rootEntity.type,
      rootEntity.id,
      enrollmentId,
      humanUserId,
    )
    sources.push(...trav.sources)
    unresolvedBranches.push(...trav.unresolved)
  } else {
    // Broad authorized enrollment scan for brief/ask_cer
    const cats = requestedCategories || ALLOWED_CATEGORIES

    // Evidence Currency Layer (Build 07A): obter conjunto corrente antes de adicionar fontes
    let currency: any = null
    try {
      const [allResps, allPrompts, allSigs] = await Promise.all([
        pb.collection('experience_responses').getFullList({
          filter: `enrollment_id = "${enrollmentId}"`,
        }),
        pb.collection('cer_prompts').getFullList({
          sort: 'step_order',
        }),
        pb.collection('cer_signals').getFullList({
          filter: `enrollment_id = "${enrollmentId}"`,
        }),
      ])
      const { deriveEvidenceCurrency } = await import('@/services/orchestrationResolver')
      currency = deriveEvidenceCurrency({
        prompts: allPrompts as any,
        responses: allResps as any,
        signals: allSigs as any,
      })
    } catch {
      currency = null
    }

    // a) experience_responses (shared_care, participant_shared)
    if (cats.includes('experience_responses')) {
      try {
        const resps = await pb.collection('experience_responses').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && (access_class = "shared_care" || access_class = "participant_shared")`,
        })
        for (const r of resps) {
          // Filtrar por Evidence Currency: excluir respostas de branches históricos inativos
          if (currency && currency.historicalResponseIds.has(r.id)) {
            continue
          }
          sources.push({
            source_type: 'experience_response',
            source_id: r.id,
            source_version: r.version,
            access_class: r.access_class as VisibilityClass,
            free_text: r.free_text,
            structured_value: r.structured_value,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`experience_responses_fetch_error:${err.message}`)
      }
    }

    // b) cer_signals (shared_care, participant_shared)
    if (cats.includes('cer_signals')) {
      try {
        const sigs = await pb.collection('cer_signals').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && (access_class = "shared_care" || access_class = "participant_shared")`,
        })
        for (const s of sigs) {
          // Filtrar por Evidence Currency: excluir signals originados de respostas inativas
          if (currency && currency.historicalSignalIds.has(s.id)) {
            continue
          }
          sources.push({
            source_type: 'signal',
            source_id: s.id,
            concept_key: s.concept_key,
            access_class: s.access_class as VisibilityClass,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`signals_fetch_error:${err.message}`)
      }
    }

    // c) cer_associations (shared_care, participant_shared)
    if (cats.includes('cer_associations')) {
      try {
        const assocs = await pb.collection('cer_associations').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && (access_class = "shared_care" || access_class = "participant_shared")`,
        })
        for (const a of assocs) {
          sources.push({
            source_type: 'association',
            source_id: a.id,
            concept_key: a.concept_key,
            access_class: a.access_class as VisibilityClass,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`associations_fetch_error:${err.message}`)
      }
    }

    // d) cer_knowledge_items (shared_care, participant_shared — NO professional_private in AI V1)
    if (cats.includes('cer_knowledge_items')) {
      try {
        const kis = await pb.collection('cer_knowledge_items').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && (access_class = "shared_care" || access_class = "participant_shared")`,
        })
        for (const k of kis) {
          sources.push({
            source_type: 'knowledge_item',
            source_id: k.id,
            source_version: k.version,
            concept_key: k.concept_key,
            access_class: k.access_class as VisibilityClass,
            statement: k.statement,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`knowledge_items_fetch_error:${err.message}`)
      }
    }

    // e) cer_participant_recognitions (shared_care, participant_shared)
    if (cats.includes('cer_participant_recognitions')) {
      try {
        const recogs = await pb.collection('cer_participant_recognitions').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && (access_class = "shared_care" || access_class = "participant_shared")`,
        })
        for (const r of recogs) {
          sources.push({
            source_type: 'participant_recognition',
            source_id: r.id,
            access_class: r.access_class as VisibilityClass,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`recognitions_fetch_error:${err.message}`)
      }
    }

    // f) cer_session_observations (ONLY recorded_by_user_id = humanUserId)
    if (cats.includes('cer_session_observations')) {
      try {
        const obsList = await pb.collection('cer_session_observations').getFullList({
          filter: `enrollment_id = "${enrollmentId}" && recorded_by_user_id = "${humanUserId}"`,
        })
        for (const o of obsList) {
          sources.push({
            source_type: 'session_observation',
            source_id: o.id,
            access_class: o.access_class as VisibilityClass,
            text: o.text,
          })
        }
      } catch (err: any) {
        unresolvedBranches.push(`session_observations_fetch_error:${err.message}`)
      }
    }
  }

  // Deduplicate sources
  const seenMap = new Map<string, ResolvedSourceItem>()
  for (const s of sources) {
    const sKey = `${s.source_type}:${s.source_id}`
    if (!seenMap.has(sKey)) {
      seenMap.set(sKey, s)
    }
  }
  const uniqueSources = Array.from(seenMap.values())

  // Audit context resolved
  await auditAiEvent({
    action: 'AI_CONTEXT_RESOLVED',
    actorUserId: humanUserId,
    enrollmentId,
    purpose,
    result: 'success',
    metadata: {
      source_count: uniqueSources.length,
      source_types: Array.from(new Set(uniqueSources.map((s) => s.source_type))),
      status: uniqueSources.length > 0 ? 'resolved' : 'empty',
    },
  })

  return {
    isAuthorized: true,
    sources: uniqueSources,
    unresolvedBranches,
    hasConflicting: false,
  }
}
