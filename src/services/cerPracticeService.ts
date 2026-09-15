import pb from '@/lib/pocketbase/client'
import {
  CerPracticeRecord,
  CerPracticeVersionRecord,
  CerPracticeVariantRecord,
  CerPracticeFrameworkRecord,
  CerPracticeEvidenceRecord,
  CerPracticeEvidenceSourceRecord,
  CerPracticeSafetyProfileRecord,
  CerPracticeSafetyRuleRecord,
  CerPracticeSafetyCheckRecord,
  CerPracticeSafetyCheckSourceRecord,
  CerPracticeConsentRecord,
  CerPracticeConsentPrivateNoteRecord,
  PracticeItemNature,
  PracticeStatus,
  PracticeGovernanceMode,
  PracticeIntensity,
  PracticeConsentRequirement,
  PracticeContextTag,
  PracticeVariantType,
  PracticeFrameworkUsageRole,
  EvidenceBasisType,
  EvidenceConfidence,
  EvidenceMaturity,
  RegulatoryProfile,
  SafetyRuleType,
  SafetyRuleSource,
  SafetyCheckOutcome,
  SafetyCheckSourceType,
  ConsentUnderstandingResponse,
  ConsentDecision,
  ConsentRecordStatus,
  VisibilityClass,
} from '@/types/cer'

// Allowlist oficial de 6 tipos para Safety Check Sources
export const ALLOWED_SAFETY_CHECK_SOURCE_TYPES: readonly SafetyCheckSourceType[] = [
  'experience_response',
  'signal',
  'association',
  'knowledge_item',
  'participant_recognition',
  'session_observation',
] as const

/**
 * Validador canônico de consistência temporal e vigência de review_due_at.
 * Regra: para uma versão active estar disponível/vigente:
 * 1. review_due_at deve ser obrigatório (não nulo, não indefinido, não string vazia)
 * 2. Deve ser uma data válida em formato parseável (UTC/ISO)
 * 3. Deve ser estritamente posterior ao instante de referência (review_due_at > nowMs).
 * review_due_at <= nowMs é considerado VENCIDO/INDISPONÍVEL.
 */
export function isPracticeVersionReviewDueValid(
  reviewDueAt?: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!reviewDueAt || typeof reviewDueAt !== 'string' || !reviewDueAt.trim()) {
    return false
  }
  const dueDate = new Date(reviewDueAt)
  const dueTime = dueDate.getTime()
  if (isNaN(dueTime)) {
    return false
  }
  return dueTime > nowMs
}

// Termos proibidos pelo Claim Guard
export const CLAIM_GUARD_FORBIDDEN_TERMS = [
  'cura',
  'garantia',
  'curar',
  'diagnóstico definitivo',
  'comprovação definitiva',
  'promessa de cura',
  'cura milagrosa',
  'elimina completamente a doença',
] as const

/**
 * Validador client-side de Claim Guard
 */
export function validateClaimGuard(claimText: string): { valid: boolean; violation?: string } {
  if (!claimText) return { valid: true }
  const lower = claimText.toLowerCase()
  for (const term of CLAIM_GUARD_FORBIDDEN_TERMS) {
    if (lower.includes(term)) {
      return {
        valid: false,
        violation: `Termo proibido detectado no claim: "${term}". A eficácia de práticas deve ser comunicada com rigor ético ou linguagem experimental.`,
      }
    }
  }
  return { valid: true }
}

/**
 * Gerador de linguagem participant-facing coerente derivada dos 3 eixos de evidência
 */
export function getParticipantFacingEvidenceDescriptor(evidence: {
  basis: EvidenceBasisType
  confidence: EvidenceConfidence
  maturity: EvidenceMaturity
}): string {
  if (evidence.basis === 'scientific_research') {
    if (evidence.confidence === 'high' && evidence.maturity === 'established') {
      return 'Prática amplamente estudada e com sólida base de evidência científica'
    }
    if (evidence.confidence === 'moderate' || evidence.maturity === 'developing') {
      return 'Prática com evidência científica emergente e benefícios observados'
    }
    return 'Prática sob investigação científica preliminar com hipótese fundamentada'
  }

  if (evidence.basis === 'traditional_knowledge') {
    if (evidence.confidence === 'high' || evidence.maturity === 'established') {
      return 'Prática consagrada por tradições consolidadas de cuidado'
    }
    return 'Prática de origem tradicional, adaptada com respeito às suas raízes'
  }

  if (evidence.basis === 'clinical_practice_framework') {
    return 'Recurso derivado de consensos e experiência clínica estruturada'
  }

  if (evidence.basis === 'experiential_support') {
    return 'Abordagem apoiada em relatos consistentes de experiência de bem-estar'
  }

  // cer_professional_hypothesis
  return 'Experimento reflexivo individual: vamos experimentar com atenção e observar sua resposta pessoal'
}

/**
 * Filtro determinístico de biblioteca de práticas (Candidatos)
 * Prioridade -> deterministic query -> professional selection
 * ZERO auto-selection, ZERO auto-prescription
 */
export interface PracticeCandidateQuery {
  targetConceptKeys?: string[]
  contextTag?: PracticeContextTag
  governanceMode?: PracticeGovernanceMode
  maxIntensity?: PracticeIntensity
}

export const cerPracticeService = {
  // 1. Practices
  async createPractice(data: {
    internal_name: string
    participant_facing_name_base: string
    family: string
    item_nature?: PracticeItemNature
    target_concept_keys?: string[]
    governance_modes: PracticeGovernanceMode[]
    is_system_curated?: boolean
    provenance_editorial?: Record<string, unknown>
    status: PracticeStatus
    created_by_user_id: string
  }): Promise<CerPracticeRecord> {
    return await pb.collection('cer_practices').create<CerPracticeRecord>({
      ...data,
      item_nature: data.item_nature ?? 'practice',
      is_system_curated: data.is_system_curated ?? true,
    })
  },

  async listPractices(filter = ''): Promise<CerPracticeRecord[]> {
    return await pb.collection('cer_practices').getFullList<CerPracticeRecord>({
      filter,
      sort: 'internal_name',
    })
  },

  async getPractice(id: string): Promise<CerPracticeRecord> {
    return await pb.collection('cer_practices').getOne<CerPracticeRecord>(id, {
      expand: 'cer_practice_versions_via_practice_id',
    })
  },

  // 2. Practice Versions
  async createPracticeVersion(data: {
    practice_id: string
    version_number: number
    previous_version_id?: string
    participant_title: string
    participant_summary?: string
    description?: string
    instructions?: string
    preparation?: string
    stop_conditions?: string
    grounding?: string
    integration?: string
    intent_goal?: string
    context_tags?: PracticeContextTag[]
    other_context_text?: string
    duration?: string
    frequency?: string
    repetitions?: string
    quantity?: string
    time_window?: string
    progression?: string
    rest?: string
    max_exposure?: string
    guidance_requirements?: string
    intensity: PracticeIntensity
    consent_required: PracticeConsentRequirement
    author_user_id: string
    reviewer_user_id?: string
    reviewed_at?: string
    safety_reviewed_at?: string
    review_due_at?: string
    status?: PracticeStatus
  }): Promise<CerPracticeVersionRecord> {
    return await pb.collection('cer_practice_versions').create<CerPracticeVersionRecord>({
      ...data,
      status: data.status || 'draft',
    })
  },

  async updatePracticeVersion(
    id: string,
    data: Partial<CerPracticeVersionRecord>,
  ): Promise<CerPracticeVersionRecord> {
    return await pb.collection('cer_practice_versions').update<CerPracticeVersionRecord>(id, data)
  },

  async getPracticeVersion(id: string): Promise<CerPracticeVersionRecord> {
    return await pb.collection('cer_practice_versions').getOne<CerPracticeVersionRecord>(id, {
      expand:
        'practice_id,author_user_id,reviewer_user_id,cer_practice_variants_via_practice_version_id,cer_practice_frameworks_via_practice_version_id,cer_practice_evidence_via_practice_version_id,cer_practice_safety_profiles_via_practice_version_id,cer_practice_safety_rules_via_practice_version_id',
    })
  },

  // 3. Variants
  async createVariant(data: {
    practice_version_id: string
    variant_type: PracticeVariantType
    title: string
    description?: string
    duration?: string
    frequency?: string
    repetitions?: string
    quantity?: string
    notes?: string
    created_by_user_id: string
  }): Promise<CerPracticeVariantRecord> {
    return await pb.collection('cer_practice_variants').create<CerPracticeVariantRecord>(data)
  },

  async listVariantsForVersion(versionId: string): Promise<CerPracticeVariantRecord[]> {
    return await pb.collection('cer_practice_variants').getFullList<CerPracticeVariantRecord>({
      filter: `practice_version_id = "${versionId}"`,
    })
  },

  // 4. Frameworks Link
  async linkFramework(data: {
    practice_version_id: string
    framework_id: string
    usage_role: PracticeFrameworkUsageRole
    notes?: string
    created_by_user_id: string
  }): Promise<CerPracticeFrameworkRecord> {
    return await pb.collection('cer_practice_frameworks').create<CerPracticeFrameworkRecord>(data)
  },

  // 5. Evidence
  async createEvidence(data: {
    practice_version_id: string
    evidence_basis_type: EvidenceBasisType
    confidence: EvidenceConfidence
    maturity: EvidenceMaturity
    population_context_applicability?: string
    safety_evidence_note?: string
    supported_claim_text?: string
    author_user_id: string
    reviewer_user_id?: string
    reviewed_at?: string
  }): Promise<CerPracticeEvidenceRecord> {
    if (data.supported_claim_text) {
      const guard = validateClaimGuard(data.supported_claim_text)
      if (!guard.valid) {
        throw new Error(guard.violation)
      }
    }
    return await pb.collection('cer_practice_evidence').create<CerPracticeEvidenceRecord>(data)
  },

  async reviewEvidence(
    id: string,
    reviewerUserId: string,
    reviewedAt = new Date().toISOString(),
  ): Promise<CerPracticeEvidenceRecord> {
    return await pb.collection('cer_practice_evidence').update<CerPracticeEvidenceRecord>(id, {
      reviewer_user_id: reviewerUserId,
      reviewed_at: reviewedAt,
    })
  },

  // 6. Evidence Sources
  async createEvidenceSource(data: {
    evidence_id: string
    citation_title: string
    author_source: string
    publication_year?: number
    url_identifier?: string
    evidence_type?: string
    notes?: string
    created_by_user_id: string
  }): Promise<CerPracticeEvidenceSourceRecord> {
    return await pb
      .collection('cer_practice_evidence_sources')
      .create<CerPracticeEvidenceSourceRecord>(data)
  },

  // 7. Safety Profiles
  async createSafetyProfile(data: {
    practice_version_id: string
    intensity_implications?: string
    consent_required: PracticeConsentRequirement
    supervision_requirements?: string
    monitoring?: string
    aftercare?: string
    regulatory_profile: RegulatoryProfile
    safety_requirements?: string
    required_dynamic_inputs?: string[]
    informed_choice?: string
    orientation?: string
    body_contact_policy?: string
    capacity_to_stop?: string
    return_grounding?: string
    integration?: string
    daily_life_reorientation?: string
    escalation_pathway?: string
    reviewed_by_user_id?: string
    reviewed_at?: string
  }): Promise<CerPracticeSafetyProfileRecord> {
    return await pb
      .collection('cer_practice_safety_profiles')
      .create<CerPracticeSafetyProfileRecord>(data)
  },

  // 8. Safety Rules
  async createSafetyRule(data: {
    practice_version_id: string
    rule_type: SafetyRuleType
    description: string
    participant_facing_text?: string
    source_of_rule: SafetyRuleSource
    source_ref?: string
    created_by_user_id: string
  }): Promise<CerPracticeSafetyRuleRecord> {
    return await pb
      .collection('cer_practice_safety_rules')
      .create<CerPracticeSafetyRuleRecord>(data)
  },

  // 9. Safety Checks
  async recordSafetyCheck(data: {
    practice_version_id: string
    enrollment_id: string
    outcome: SafetyCheckOutcome
    reviewed_by_user_id: string
    professional_rationale?: string
    reviewed_at?: string
    record_status?: 'current' | 'superseded'
    metadata?: {
      evaluated_safety_inputs?: string[]
      is_professional_clearance?: boolean
      [key: string]: unknown
    }
  }): Promise<CerPracticeSafetyCheckRecord> {
    if (
      data.outcome !== 'eligible' &&
      (!data.professional_rationale || !data.professional_rationale.trim())
    ) {
      throw new Error('professional_rationale é obrigatório quando outcome ≠ "eligible"')
    }
    return await pb.collection('cer_practice_safety_checks').create<CerPracticeSafetyCheckRecord>({
      ...data,
      reviewed_at: data.reviewed_at || new Date().toISOString(),
      record_status: data.record_status || 'current',
    })
  },

  // 10. Safety Check Sources
  async linkSafetyCheckSource(data: {
    safety_check_id: string
    source_type: SafetyCheckSourceType
    source_id: string
    source_version_anchor?: string
    enrollment_id: string
    access_class: VisibilityClass
  }): Promise<CerPracticeSafetyCheckSourceRecord> {
    if (!ALLOWED_SAFETY_CHECK_SOURCE_TYPES.includes(data.source_type)) {
      throw new Error(
        `Tipo de fonte "${data.source_type}" não permitido. Deve ser um dos 6 permitidos: ${ALLOWED_SAFETY_CHECK_SOURCE_TYPES.join(', ')}`,
      )
    }
    return await pb
      .collection('cer_practice_safety_check_sources')
      .create<CerPracticeSafetyCheckSourceRecord>(data)
  },

  // 11. Practice Consents
  async recordConsent(data: {
    practice_version_id: string
    participant_user_id: string
    enrollment_id: string
    consent_text_version_ref?: string
    risks_cautions_shown?: string[]
    understanding_response: ConsentUnderstandingResponse
    decision: ConsentDecision
    questions_opportunity?: boolean
    context_notes?: string
    record_status?: ConsentRecordStatus
  }): Promise<CerPracticeConsentRecord> {
    return await pb.collection('cer_practice_consents').create<CerPracticeConsentRecord>({
      ...data,
      record_status: data.record_status || 'current',
    })
  },

  async withdrawConsent(
    consentId: string,
    withdrawalReason?: string,
  ): Promise<CerPracticeConsentRecord> {
    return await pb
      .collection('cer_practice_consents')
      .update<CerPracticeConsentRecord>(consentId, {
        record_status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: withdrawalReason,
      })
  },

  // 12. Practice Consent Private Notes (Participant-Only)
  async addConsentPrivateNote(data: {
    consent_id: string
    participant_user_id: string
    enrollment_id: string
    note_text: string
  }): Promise<CerPracticeConsentPrivateNoteRecord> {
    return await pb
      .collection('cer_practice_consent_private_notes')
      .create<CerPracticeConsentPrivateNoteRecord>({
        ...data,
        status: 'current',
      })
  },

  // Determinação determinística de candidatos de práticas da biblioteca
  async findPracticeCandidates(query: PracticeCandidateQuery): Promise<CerPracticeRecord[]> {
    const practices = await this.listPractices("status = 'active'")
    return practices.filter((p) => {
      if (query.targetConceptKeys && query.targetConceptKeys.length > 0) {
        const pConcepts = p.target_concept_keys || []
        const hasMatch = query.targetConceptKeys.some((ck) => pConcepts.includes(ck))
        if (!hasMatch) return false
      }
      if (query.governanceMode) {
        if (!p.governance_modes.includes(query.governanceMode)) return false
      }
      return true
    })
  },

  /**
   * Obtém a versão ativa e com revisão vigente de uma prática para uso clínico / indicação.
   * Retorna null caso não haja versão ativa ou se a revisão estiver ausente, vazia, inválida ou expirada (review_due_at <= now).
   */
  async getAvailableActiveVersionForPractice(
    practiceId: string,
    nowMs: number = Date.now(),
  ): Promise<CerPracticeVersionRecord | null> {
    try {
      const versions = await pb
        .collection('cer_practice_versions')
        .getFullList<CerPracticeVersionRecord>({
          filter: `practice_id = "${practiceId}" && status = "active"`,
          sort: '-version_number',
        })

      for (const ver of versions) {
        if (isPracticeVersionReviewDueValid(ver.review_due_at, nowMs)) {
          return ver
        }
      }
      return null
    } catch (_) {
      return null
    }
  },
}
