import pb from '@/lib/pocketbase/client'
import type {
  PersonRecord,
  UserRoleRecord,
  CerProductRecord,
  EnrollmentRecord,
  ProfessionalEnrollmentAccessRecord,
  JourneyStateRecord,
  AuditEventRecord,
  EnrollmentStatus,
  AuditAction,
} from '@/types/cer'

/**
 * Serviço de Auditoria de Segurança (AUDIT_EVENT)
 */
export const auditService = {
  async log(params: {
    actor_user_id?: string
    action: AuditAction | string
    resource_type: string
    resource_id?: string
    enrollment_id?: string
    result: 'success' | 'failure' | 'denied'
    request_context?: string
    metadata?: Record<string, unknown>
  }): Promise<AuditEventRecord | null> {
    try {
      return await pb.collection('audit_events').create<AuditEventRecord>({
        actor_user_id: params.actor_user_id || pb.authStore.record?.id || undefined,
        action: params.action,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        enrollment_id: params.enrollment_id,
        timestamp: new Date().toISOString(),
        result: params.result,
        request_context: params.request_context || 'frontend_action',
        metadata: params.metadata || {},
      })
    } catch {
      // Auditoria não quebra a UX em caso de falha de gravação secundária
      return null
    }
  },

  async list(page = 1, perPage = 30): Promise<{ items: AuditEventRecord[]; totalItems: number }> {
    return await pb.collection('audit_events').getList<AuditEventRecord>(page, perPage, {
      sort: '-created',
    })
  },
}

/**
 * Serviço de Gerenciamento de Identidade Humana (PERSON)
 */
export const personService = {
  async getById(id: string): Promise<PersonRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.getPersonById(id) || demoAdapter.getCurrentPerson()
    }
    return await pb.collection('persons').getOne<PersonRecord>(id)
  },

  async create(data: {
    full_name: string
    preferred_name?: string
    treatment_preference?: PersonRecord['treatment_preference']
    treatment_preference_custom?: string
    email?: string
    phone?: string
    notes?: string
  }): Promise<PersonRecord> {
    return await pb.collection('persons').create<PersonRecord>(data)
  },

  async updateTreatmentPreference(
    id: string,
    data: {
      treatment_preference?: PersonRecord['treatment_preference']
      treatment_preference_custom?: string
      preferred_name?: string
    },
  ): Promise<PersonRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.updatePerson(id, data)
    }
    return await pb.collection('persons').update<PersonRecord>(id, data)
  },

  async updateAvatarCustomization(
    id: string,
    data: {
      avatar_presentation?: PersonRecord['avatar_presentation']
      avatar_skin_tone?: PersonRecord['avatar_skin_tone']
      avatar_hair_color?: PersonRecord['avatar_hair_color']
      avatar_customization_status: PersonRecord['avatar_customization_status']
    },
  ): Promise<PersonRecord> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.updatePerson(id, {
        ...data,
        avatar_version: 1,
        avatar_updated_at: new Date().toISOString(),
      })
    }
    return await pb.collection('persons').update<PersonRecord>(id, {
      ...data,
      avatar_version: 1,
      avatar_updated_at: new Date().toISOString(),
    })
  },

  async list(page = 1, perPage = 50): Promise<{ items: PersonRecord[]; totalItems: number }> {
    return await pb.collection('persons').getList<PersonRecord>(page, perPage, {
      sort: 'full_name',
    })
  },
}

/**
 * Serviço de Catálogo de Produtos CER (CER_PRODUCT)
 */
export const productService = {
  async listActive(): Promise<CerProductRecord[]> {
    const { demoAdapter, DEMO_PRODUCT } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return [DEMO_PRODUCT]
    }
    return await pb.collection('cer_products').getFullList<CerProductRecord>({
      filter: 'is_active = true',
      sort: 'name',
    })
  },

  async getByCode(code: string): Promise<CerProductRecord | null> {
    try {
      return await pb
        .collection('cer_products')
        .getFirstListItem<CerProductRecord>(`code = "${code}"`)
    } catch {
      return null
    }
  },
}

/**
 * Serviço de Matrículas e Vínculos (ENROLLMENT, ACCESS & JOURNEY_STATE)
 */
export const enrollmentService = {
  /**
   * Lista enrollments visíveis para o usuário autenticado (conforme API rules do PB)
   */
  async listAccessible(): Promise<EnrollmentRecord[]> {
    const { demoAdapter, DEMO_ENROLLMENT } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return [DEMO_ENROLLMENT]
    }
    return await pb.collection('enrollments').getFullList<EnrollmentRecord>({
      expand:
        'person_id,product_id,professional_enrollment_access_via_enrollment_id.professional_user_id,journey_states_via_enrollment_id',
      sort: '-created',
    })
  },

  /**
   * Obtém o enrollment de uma interagente por sua person_id
   */
  async getByPersonId(personId: string): Promise<EnrollmentRecord | null> {
    const { demoAdapter, DEMO_ENROLLMENT } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return DEMO_ENROLLMENT
    }
    try {
      const records = await pb.collection('enrollments').getList<EnrollmentRecord>(1, 1, {
        filter: `person_id = "${personId}"`,
        expand:
          'person_id,product_id,journey_states_via_enrollment_id,professional_enrollment_access_via_enrollment_id',
        sort: '-created',
      })
      return records.items[0] || null
    } catch {
      return null
    }
  },

  /**
   * Atualizar status do enrollment com auditoria
   */
  async updateStatus(enrollmentId: string, newStatus: EnrollmentStatus): Promise<EnrollmentRecord> {
    const updated = await pb.collection('enrollments').update<EnrollmentRecord>(enrollmentId, {
      status: newStatus,
    })

    let auditAction: AuditAction = 'ENROLLMENT_PAUSED'
    if (newStatus === 'active') auditAction = 'ENROLLMENT_RESUMED'
    else if (newStatus === 'completed') auditAction = 'ENROLLMENT_COMPLETED'
    else if (newStatus === 'cancelled') auditAction = 'ENROLLMENT_CANCELLED'

    await auditService.log({
      action: auditAction,
      resource_type: 'enrollment',
      resource_id: enrollmentId,
      enrollment_id: enrollmentId,
      result: 'success',
      metadata: { newStatus },
    })

    return updated
  },

  /**
   * Fluxo da profissional para criar um acompanhamento/enrollment e convidar/vincular uma interagente:
   * 1. Cria a PERSON (identidade humana)
   * 2. Cria a conta USER_ACCOUNT (com credencial temporária ou e-mail de acesso, status 'invited' ou 'active')
   * 3. Atribui USER_ROLE 'interagente'
   * 4. Cria ENROLLMENT vinculado à PERSON e ao CER_PRODUCT (status 'active')
   * 5. Cria PROFESSIONAL_ENROLLMENT_ACCESS para a profissional autenticada
   * 6. Cria JOURNEY_STATE inicial em 'onboarding'
   */
  async createEnrollmentWithInteragente(params: {
    fullName: string
    preferredName?: string
    email: string
    temporaryPassword?: string
    productId: string
    professionalUserId: string
    notes?: string
  }): Promise<{
    person: PersonRecord
    enrollment: EnrollmentRecord
    tempPasswordGenerated?: string
  }> {
    return pb.send<{
      person: PersonRecord
      enrollment: EnrollmentRecord
      tempPasswordGenerated?: string
    }>('/backend/v1/cer/invite-participant', {
      method: 'POST',
      body: params,
    })
  },

  async getActiveForUser(userId: string): Promise<EnrollmentRecord | null> {
    const { demoAdapter, DEMO_ENROLLMENT, DEMO_USER_MARIANA } =
      await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.getActivePersona() === 'mariana' && userId === DEMO_USER_MARIANA.id
        ? DEMO_ENROLLMENT
        : null
    }
    if (!userId || pb.authStore.record?.id !== userId)
      throw new Error('Entre na sua conta para abrir seu acompanhamento.')
    const account = await pb.collection('users').getOne(userId)
    if (!account.person_id || account.status !== 'active') return null
    const records = await pb.collection('enrollments').getList<EnrollmentRecord>(1, 1, {
      filter: pb.filter('person_id = {:person} && (status = "active" || status = "onboarding")', {
        person: account.person_id,
      }),
      sort: '-created',
      expand: 'product_id,person_id',
      requestKey: null,
    })
    return records.items[0] || null
  },

  /**
   * Mecanismo server-side profissional "Redefinir acesso" (Build 09B P0).
   * Somente profissional autorizado no escopo real. Gera credencial temporária,
   * altera status para 'invited' e registra auditoria.
   */
  async resetParticipantAccess(targetUserId: string): Promise<{
    success: boolean
    message: string
    targetUserId: string
    temporaryCredential?: string
  }> {
    return await pb.send<{
      success: boolean
      message: string
      targetUserId: string
      temporaryCredential?: string
    }>('/backend/v1/cer/reset-participant-access', {
      method: 'POST',
      body: { target_user_id: targetUserId },
    })
  },
}
