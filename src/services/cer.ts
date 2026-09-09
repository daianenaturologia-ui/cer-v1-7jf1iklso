import pb from '@/lib/pocketbase/client'
import type {
  PersonRecord,
  UserRoleRecord,
  CerProductRecord,
  EnrollmentRecord,
  ProfessionalEnrollmentAccessRecord,
  JourneyStateRecord,
} from '@/types/cer'

/**
 * Serviço de Gerenciamento de Identidade Humana (PERSON)
 */
export const personService = {
  async getById(id: string): Promise<PersonRecord> {
    return await pb.collection('persons').getOne<PersonRecord>(id)
  },

  async create(data: {
    full_name: string
    preferred_name?: string
    email?: string
    phone?: string
    notes?: string
  }): Promise<PersonRecord> {
    return await pb.collection('persons').create<PersonRecord>(data)
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
   * Fluxo da profissional para criar um acompanhamento/enrollment e convidar/vincular uma interagente:
   * 1. Cria a PERSON (identidade humana)
   * 2. Cria a conta USER_ACCOUNT (com credencial temporária ou e-mail de acesso)
   * 3. Atribui USER_ROLE 'interagente'
   * 4. Cria ENROLLMENT vinculado à PERSON e ao CER_PRODUCT
   * 5. Cria PROFESSIONAL_ENROLLMENT_ACCESS para a profissional autenticada
   * 6. Cria JOURNEY_STATE inicial em 'acolhimento'
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
    const tempPassword = params.temporaryPassword || 'CER@' + Math.random().toString(36).slice(-8)

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
      // Criar nova conta com senha temporária
      const newUser = await pb.collection('users').create({
        email: params.email,
        password: tempPassword,
        passwordConfirm: tempPassword,
        name: params.preferredName || params.fullName,
        verified: true,
        person_id: person.id,
      })
      userRecordId = newUser.id
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

    // 4. Criar ENROLLMENT
    const enrollment = await pb.collection('enrollments').create<EnrollmentRecord>({
      person_id: person.id,
      interagente: userRecordId || undefined,
      profissional: params.professionalUserId,
      product_id: params.productId,
      product: 'acompanhamento_individual_cer',
      status: 'ativa',
      notes: params.notes || '',
    })

    // 5. Criar PROFESSIONAL_ENROLLMENT_ACCESS
    await pb
      .collection('professional_enrollment_access')
      .create<ProfessionalEnrollmentAccessRecord>({
        enrollment_id: enrollment.id,
        professional_user_id: params.professionalUserId,
        access_role: 'primary',
        is_active: true,
      })

    // 6. Criar JOURNEY_STATE inicial
    await pb.collection('journey_states').create<JourneyStateRecord>({
      enrollment_id: enrollment.id,
      current_stage: 'acolhimento',
      stage_status: 'em_andamento',
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
}
