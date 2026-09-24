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
    const randomSuffix = Math.random().toString(36).slice(-8)
    const tempPassword = params.temporaryPassword || `Tmp-${randomSuffix}`

    // 1. Criar ou reutilizar PERSON
    let person: PersonRecord
    try {
      person = await pb
        .collection('persons')
        .getFirstListItem<PersonRecord>(`email = "${params.email}"`)
    } catch {
      person = await pb.collection('persons').create<PersonRecord>({
        full_name: params.fullName,
        preferred_name: params.preferredName || params.fullName.split(' ')[0],
        email: params.email,
        notes: params.notes || '',
      })
    }

    // 2. Criar ou associar USER_ACCOUNT (conta do usuário)
    let userRecordId: string | null = null
    try {
      const existingUser = await pb
        .collection('users')
        .getFirstListItem(`email = "${params.email}"`)
      userRecordId = existingUser.id
      if (!existingUser.person_id) {
        await pb.collection('users').update(existingUser.id, { person_id: person.id })
      }
    } catch {
      // Criar nova conta com senha temporária e status 'invited' (Item 3 & 8: First Login P0)
      const newUser = await pb.collection('users').create({
        email: params.email,
        password: tempPassword,
        passwordConfirm: tempPassword,
        name: params.preferredName || params.fullName,
        verified: true,
        status: 'invited',
        person_id: person.id,
      })
      userRecordId = newUser.id

      await auditService.log({
        action: 'ACCOUNT_INVITED',
        resource_type: 'user_account',
        resource_id: newUser.id,
        result: 'success',
        metadata: { email: params.email, initial_status: 'invited' },
      })
    }

    // 3. Garantir USER_ROLE 'interagente'
    if (userRecordId) {
      try {
        await pb
          .collection('user_roles')
          .getFirstListItem(`user_id = "${userRecordId}" && role = "interagente"`)
      } catch {
        await pb.collection('user_roles').create<UserRoleRecord>({
          user_id: userRecordId,
          role: 'interagente',
          is_active: true,
        })
      }
    }

    // 4. Criar ENROLLMENT (com status oficial 'active', sem campos legados)
    const enrollment = await pb.collection('enrollments').create<EnrollmentRecord>({
      person_id: person.id,
      product_id: params.productId,
      status: 'active',
      notes: params.notes || '',
    })

    // 5. Criar PROFESSIONAL_ENROLLMENT_ACCESS de forma autorizada
    // O hook server-side on_enrollment_created cria a concessão automaticamente quando o profissional cria o enrollment.
    // Como garantia defensiva, se o registro ainda não existir (ex: execução por platform_admin), cria se autorizado.
    try {
      let existing = null
      try {
        existing = await pb
          .collection('professional_enrollment_access')
          .getFirstListItem(`enrollment_id = "${enrollment.id}"`)
      } catch {
        /* intentionally ignored */
      }

      if (!existing) {
        const createdAccess = await pb
          .collection('professional_enrollment_access')
          .create<ProfessionalEnrollmentAccessRecord>({
            enrollment_id: enrollment.id,
            professional_user_id: params.professionalUserId,
            access_role: 'primary',
            is_active: true,
          })

        await auditService.log({
          action: 'PROFESSIONAL_ACCESS_GRANTED',
          resource_type: 'professional_enrollment_access',
          resource_id: createdAccess.id,
          enrollment_id: enrollment.id,
          result: 'success',
          metadata: {
            professional_user_id: params.professionalUserId,
            access_role: 'primary',
          },
        })
      }
    } catch {
      // Ignora se já gerado pelo hook server-side ou se regra RLS direta não permitir
    }

    // 6. Criar JOURNEY_STATE inicial em 'onboarding'
    await pb.collection('journey_states').create<JourneyStateRecord>({
      enrollment_id: enrollment.id,
      current_stage: 'onboarding',
      stage_status: 'nao_iniciado',
      metadata: {
        created_by_professional: params.professionalUserId,
        initialized_at: new Date().toISOString(),
      },
    })

    return {
      person,
      enrollment,
      tempPasswordGenerated: tempPassword,
    }
  },

  async getActiveForUser(userId: string): Promise<EnrollmentRecord | null> {
    try {
      const records = await pb.collection('enrollments').getList<EnrollmentRecord>(1, 1, {
        filter: `person_id.user_account_id = "${userId}"`,
        sort: '-created',
        expand: 'product_id,person_id',
      })
      return records.items[0] || null
    } catch {
      return null
    }
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
