import pb from '@/lib/pocketbase/client'
import type {
  CerDimensionRecord,
  CerExperienceRecord,
  CerExperienceMomentRecord,
  CerPromptRecord,
  CerPromptVersionRecord,
  EnrollmentExperienceRecord,
  ExperienceResponseRecord,
  ExperienceResponseVersionRecord,
  FeatureFlagRecord,
  ExperienceReleaseStatus,
  ExperienceProgressStatus,
  ComponentType,
  VisibilityClass,
} from '@/types/cer'

/**
 * Serviço de Feature Flags
 */
export const featureFlagService = {
  async isEnabled(key: string): Promise<boolean> {
    try {
      const record = await pb
        .collection('feature_flags')
        .getFirstListItem<FeatureFlagRecord>(`key = "${key}"`)
      return !!record.is_enabled
    } catch {
      return false
    }
  },

  async getByKey(key: string): Promise<FeatureFlagRecord | null> {
    try {
      return await pb
        .collection('feature_flags')
        .getFirstListItem<FeatureFlagRecord>(`key = "${key}"`)
    } catch {
      return null
    }
  },

  async setEnabled(key: string, enabled: boolean): Promise<FeatureFlagRecord | null> {
    try {
      const record = await pb
        .collection('feature_flags')
        .getFirstListItem<FeatureFlagRecord>(`key = "${key}"`)
      return await pb.collection('feature_flags').update<FeatureFlagRecord>(record.id, {
        is_enabled: enabled,
      })
    } catch {
      return null
    }
  },
}

/**
 * Serviço de Dimensões e Catálogo de Experiências (Metadados do Schema)
 */
export const experienceCatalogService = {
  async listDimensions(): Promise<CerDimensionRecord[]> {
    return await pb.collection('cer_dimensions').getFullList<CerDimensionRecord>({
      filter: 'is_active = true',
      sort: 'order_index',
    })
  },

  async getExperienceByCode(code: string): Promise<CerExperienceRecord | null> {
    try {
      return await pb
        .collection('cer_experiences')
        .getFirstListItem<CerExperienceRecord>(`code = "${code}"`, {
          expand: 'dimension_id',
        })
    } catch {
      return null
    }
  },

  async getExperienceById(id: string): Promise<CerExperienceRecord> {
    return await pb.collection('cer_experiences').getOne<CerExperienceRecord>(id, {
      expand: 'dimension_id',
    })
  },

  async listMomentsByExperience(experienceId: string): Promise<CerExperienceMomentRecord[]> {
    return await pb.collection('cer_experience_moments').getFullList<CerExperienceMomentRecord>({
      filter: `experience_id = "${experienceId}" && is_active = true`,
      sort: 'order_index',
    })
  },

  async listPromptsByExperience(experienceId: string): Promise<CerPromptRecord[]> {
    return await pb.collection('cer_prompts').getFullList<CerPromptRecord>({
      filter: `experience_id = "${experienceId}"`,
      sort: 'step_order',
      expand: 'moment_id',
    })
  },

  async listPromptsByMoment(momentId: string): Promise<CerPromptRecord[]> {
    return await pb.collection('cer_prompts').getFullList<CerPromptRecord>({
      filter: `moment_id = "${momentId}"`,
      sort: 'prompt_order',
    })
  },

  async listPromptVersions(promptId: string): Promise<CerPromptVersionRecord[]> {
    return await pb.collection('cer_prompt_versions').getFullList<CerPromptVersionRecord>({
      filter: `prompt_id = "${promptId}"`,
      sort: '-version_number',
    })
  },
}

/**
 * Serviço de Gerenciamento do Ciclo de Vida da Experiência em um Enrollment (Progressive Release)
 */
export const enrollmentExperienceService = {
  async getByEnrollmentAndExperience(
    enrollmentId: string,
    experienceId: string,
  ): Promise<EnrollmentExperienceRecord | null> {
    try {
      return await pb
        .collection('enrollment_experiences')
        .getFirstListItem<EnrollmentExperienceRecord>(
          `enrollment_id = "${enrollmentId}" && experience_id = "${experienceId}"`,
          {
            expand: 'experience_id,enrollment_id',
          },
        )
    } catch {
      return null
    }
  },

  async listByEnrollment(enrollmentId: string): Promise<EnrollmentExperienceRecord[]> {
    return await pb.collection('enrollment_experiences').getFullList<EnrollmentExperienceRecord>({
      filter: `enrollment_id = "${enrollmentId}"`,
      expand: 'experience_id.dimension_id',
      sort: 'created',
    })
  },

  /**
   * Atualizar status de liberação progressiva (locked, available, paused, completed)
   */
  async updateReleaseStatus(
    id: string,
    releaseStatus: ExperienceReleaseStatus,
  ): Promise<EnrollmentExperienceRecord> {
    return await pb.collection('enrollment_experiences').update<EnrollmentExperienceRecord>(id, {
      release_status: releaseStatus,
      last_interaction_at: new Date().toISOString(),
    })
  },

  /**
   * Iniciar ou Retomar Experiência (salva progresso interno e step atual)
   */
  async updateProgress(
    id: string,
    params: {
      stepOrder?: number
      progressStatus?: ExperienceProgressStatus
      completed?: boolean
    },
  ): Promise<EnrollmentExperienceRecord> {
    const updateData: Record<string, unknown> = {
      last_interaction_at: new Date().toISOString(),
    }

    if (typeof params.stepOrder === 'number') {
      updateData.current_step_order = params.stepOrder
    }

    if (params.progressStatus) {
      updateData.progress_status = params.progressStatus
      if (params.progressStatus === 'in_progress') {
        updateData.release_status = 'in_progress'
        updateData.started_at = new Date().toISOString()
      }
    }

    if (params.completed) {
      updateData.progress_status = 'completed'
      updateData.release_status = 'completed'
      updateData.completed_at = new Date().toISOString()
    }

    return await pb
      .collection('enrollment_experiences')
      .update<EnrollmentExperienceRecord>(id, updateData)
  },

  /**
   * Liberar uma experiência para o enrollment
   */
  async releaseExperience(
    enrollmentId: string,
    experienceId: string,
    releasedByUserId?: string,
  ): Promise<EnrollmentExperienceRecord> {
    const existing = await this.getByEnrollmentAndExperience(enrollmentId, experienceId)
    if (existing) {
      return await this.updateReleaseStatus(existing.id, 'available')
    }

    return await pb.collection('enrollment_experiences').create<EnrollmentExperienceRecord>({
      enrollment_id: enrollmentId,
      experience_id: experienceId,
      release_status: 'available',
      progress_status: 'not_started',
      current_step_order: 1,
      released_by_user_id: releasedByUserId || pb.authStore.record?.id,
    })
  },
}

/**
 * Serviço de Respostas Canônicas e Histórico Versionado (RESPONSE MODEL)
 */
export const experienceResponseService = {
  /**
   * Obter a resposta canônica de um prompt em um enrollment
   */
  async getResponse(
    enrollmentId: string,
    promptId: string,
  ): Promise<ExperienceResponseRecord | null> {
    try {
      return await pb
        .collection('experience_responses')
        .getFirstListItem<ExperienceResponseRecord>(
          `enrollment_id = "${enrollmentId}" && prompt_id = "${promptId}"`,
          {
            expand: 'prompt_id',
          },
        )
    } catch {
      return null
    }
  },

  /**
   * Listar todas as respostas de uma experiência para um enrollment
   */
  async listResponsesByExperience(
    enrollmentId: string,
    experienceId: string,
  ): Promise<ExperienceResponseRecord[]> {
    return await pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
      filter: `enrollment_id = "${enrollmentId}" && experience_id = "${experienceId}"`,
      expand: 'prompt_id',
      sort: 'prompt_id.step_order',
    })
  },

  /**
   * Listar histórico de versões de uma resposta
   */
  async listResponseVersions(responseId: string): Promise<ExperienceResponseVersionRecord[]> {
    return await pb
      .collection('experience_response_versions')
      .getFullList<ExperienceResponseVersionRecord>({
        filter: `response_id = "${responseId}"`,
        sort: '-version_number',
      })
  },

  /**
   * Salvar ou Atualizar Resposta de Forma Canônica com Versionamento Imutável:
   * 1. Se não existir resposta: cria v1 e cria o snapshot em experience_response_versions (v1).
   * 2. Se já existir resposta:
   *    - Grava o snapshot da versão anterior em experience_response_versions.
   *    - Incrementa o número da versão (version + 1).
   *    - Atualiza a resposta canônica com status 'revised'.
   * Nenhuma alteração silenciosa ou perda da resposta original ocorre.
   */
  async saveResponse(params: {
    enrollmentId: string
    experienceId: string
    promptId: string
    respondentUserId: string
    responseType: ComponentType
    promptVersion: number
    structuredValue?: unknown
    freeText?: string
    accessClass?: VisibilityClass
    changeReason?: string
  }): Promise<ExperienceResponseRecord> {
    const existing = await this.getResponse(params.enrollmentId, params.promptId)

    // O versionamento e snapshot temporal são garantidos 100% SERVER-SIDE via hook PocketBase
    // (onRecordAfterCreateSuccess e onRecordUpdate em experience_responses).
    // O cliente envia a criação ou atualização diretamente, sem duplicar lógica de histórico no frontend.
    if (!existing) {
      return await pb.collection('experience_responses').create<ExperienceResponseRecord>({
        enrollment_id: params.enrollmentId,
        experience_id: params.experienceId,
        prompt_id: params.promptId,
        respondent_user_id: params.respondentUserId,
        response_type: params.responseType,
        access_class: params.accessClass || 'shared_care',
        structured_value: params.structuredValue,
        free_text: params.freeText || '',
        prompt_version: params.promptVersion,
        version: 1,
        status: 'saved',
      })
    } else {
      return await pb
        .collection('experience_responses')
        .update<ExperienceResponseRecord>(existing.id, {
          structured_value: params.structuredValue,
          free_text: params.freeText !== undefined ? params.freeText : existing.free_text,
          ...(params.accessClass ? { access_class: params.accessClass } : {}),
        })
    }
  },
}
