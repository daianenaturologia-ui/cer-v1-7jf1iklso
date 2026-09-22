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
  CerSignalRecord,
} from '@/types/cer'
import { deriveEvidenceCurrency, EvidenceCurrencyResult } from '@/services/orchestrationResolver'

/**
 * Mapeamento de chaves de dimensões, slugs e identificadores sintéticos
 * para os IDs canônicos das experiências correspondentes.
 */
export const DIMENSION_TO_EXPERIENCE_ID: Record<string, string> = {
  // Chaves de dimensão do Ser Integral
  mente_emocoes: 'exp-mente-emocoes-07c',
  corpo_fisiologia: 'exp-corpo-fisiologia-07b',
  regulacao_respostas: 'exp-regulacao-respostas-07c',
  relacoes: 'exp-relacoes-07d',
  sexualidade: 'exp-sexualidade-07e',
  sentido_conexao: 'exp-sentido-conexao-07f',
  integracao_consciencia: 'exp-integracao-consciencia-07g',

  // Slugs e códigos de schema
  mente_emocoes_cer: 'exp-mente-emocoes-07c',
  corpo_fisiologia_ayurveda: 'exp-corpo-fisiologia-07b',
  regulacao_respostas_cer: 'exp-regulacao-respostas-07c',
  relacoes_cer: 'exp-relacoes-07d',
  sexualidade_cer: 'exp-sexualidade-07e',
  sentido_conexao_cer: 'exp-sentido-conexao-07f',
  integracao_consciencia_cer: 'exp-integracao-consciencia-07g',

  // IDs canônicos já mapeados diretamente
  'exp-corpo-fisiologia-07b': 'exp-corpo-fisiologia-07b',
  'exp-mente-emocoes-07c': 'exp-mente-emocoes-07c',
  'exp-regulacao-respostas-07c': 'exp-regulacao-respostas-07c',
  'exp-relacoes-07d': 'exp-relacoes-07d',
  'exp-sexualidade-07e': 'exp-sexualidade-07e',
  'exp-sentido-conexao-07f': 'exp-sentido-conexao-07f',
  'exp-integracao-consciencia-07g': 'exp-integracao-consciencia-07g',
}

/**
 * Normaliza qualquer identificador de experiência:
 * suporta chave de dimensão ('mente_emocoes'), prefixos ('dim-mente_emocoes', 'demo-enr-exp-exp-mente-emocoes-07c'),
 * códigos do schema ('mente_emocoes_cer') ou IDs canônicos ('exp-mente-emocoes-07c').
 */
export function resolveExperienceId(raw: string): string {
  if (!raw) return raw
  const trimmed = raw.trim()

  // 1. Verificação direta no mapa
  if (DIMENSION_TO_EXPERIENCE_ID[trimmed]) {
    return DIMENSION_TO_EXPERIENCE_ID[trimmed]
  }

  // 2. Prefixo de registro sintético demo: 'demo-enr-exp-*'
  if (trimmed.startsWith('demo-enr-exp-')) {
    const stripped = trimmed.replace(/^demo-enr-exp-/, '')
    return resolveExperienceId(stripped)
  }

  // 3. Prefixo de dimensão: 'dim-*'
  if (trimmed.startsWith('dim-')) {
    const stripped = trimmed.replace(/^dim-/, '')
    if (DIMENSION_TO_EXPERIENCE_ID[stripped]) {
      return DIMENSION_TO_EXPERIENCE_ID[stripped]
    }
  }

  return trimmed
}

/**
 * Serviço de Feature Flags
 */
export const featureFlagService = {
  async isEnabled(key: string): Promise<boolean> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return false
    }
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
  async listExperiences(): Promise<CerExperienceRecord[]> {
    try {
      const list = await pb.collection('cer_experiences').getFullList<CerExperienceRecord>({
        sort: 'order_index',
        expand: 'dimension_id',
      })
      if (
        !list.some(
          (e) => e.id === 'exp-corpo-fisiologia-07b' || e.code === 'corpo_fisiologia_ayurveda',
        )
      ) {
        const { CORPO_FISIOLOGIA_EXPERIENCE } = await import('./build07bPrompts')
        list.push(CORPO_FISIOLOGIA_EXPERIENCE)
      }
      if (!list.some((e) => e.id === 'exp-mente-emocoes-07c' || e.code === 'mente_emocoes_cer')) {
        const { MENTE_EMOCOES_EXPERIENCE } = await import('./build07cPrompts')
        list.push(MENTE_EMOCOES_EXPERIENCE)
      }
      if (
        !list.some(
          (e) => e.id === 'exp-regulacao-respostas-07c' || e.code === 'regulacao_respostas_cer',
        )
      ) {
        const { REGULACAO_RESPOSTAS_EXPERIENCE } = await import('./build07cPrompts')
        list.push(REGULACAO_RESPOSTAS_EXPERIENCE)
      }
      if (!list.some((e) => e.id === 'exp-relacoes-07d' || e.code === 'relacoes_cer')) {
        const { RELACOES_EXPERIENCE } = await import('./build07dPrompts')
        list.push(RELACOES_EXPERIENCE)
      }
      if (!list.some((e) => e.id === 'exp-sexualidade-07e' || e.code === 'sexualidade_cer')) {
        const { SEXUALIDADE_EXPERIENCE } = await import('./build07ePrompts')
        list.push(SEXUALIDADE_EXPERIENCE)
      }
      if (
        !list.some((e) => e.id === 'exp-sentido-conexao-07f' || e.code === 'sentido_conexao_cer')
      ) {
        const { SENTIDO_CONEXAO_EXPERIENCE } = await import('./build07fPrompts')
        list.push(SENTIDO_CONEXAO_EXPERIENCE)
      }
      if (
        !list.some(
          (e) =>
            e.id === 'exp-integracao-consciencia-07g' || e.code === 'integracao_consciencia_cer',
        )
      ) {
        const { INTEGRACAO_CONSCIENCIA_EXPERIENCE } = await import('./build07gPrompts')
        list.push(INTEGRACAO_CONSCIENCIA_EXPERIENCE)
      }
      return list
    } catch {
      const { CORPO_FISIOLOGIA_EXPERIENCE } = await import('./build07bPrompts')
      const { MENTE_EMOCOES_EXPERIENCE, REGULACAO_RESPOSTAS_EXPERIENCE } =
        await import('./build07cPrompts')
      const { RELACOES_EXPERIENCE } = await import('./build07dPrompts')
      const { SEXUALIDADE_EXPERIENCE } = await import('./build07ePrompts')
      const { SENTIDO_CONEXAO_EXPERIENCE } = await import('./build07fPrompts')
      const { INTEGRACAO_CONSCIENCIA_EXPERIENCE } = await import('./build07gPrompts')
      return [
        CORPO_FISIOLOGIA_EXPERIENCE,
        MENTE_EMOCOES_EXPERIENCE,
        REGULACAO_RESPOSTAS_EXPERIENCE,
        RELACOES_EXPERIENCE,
        SEXUALIDADE_EXPERIENCE,
        SENTIDO_CONEXAO_EXPERIENCE,
        INTEGRACAO_CONSCIENCIA_EXPERIENCE,
      ]
    }
  },

  async listDimensions(): Promise<CerDimensionRecord[]> {
    return await pb.collection('cer_dimensions').getFullList<CerDimensionRecord>({
      filter: 'is_active = true',
      sort: 'order_index',
    })
  },

  async getExperienceByCode(code: string): Promise<CerExperienceRecord | null> {
    if (code === 'corpo_fisiologia_ayurveda' || code === 'exp-corpo-fisiologia-07b') {
      const { CORPO_FISIOLOGIA_EXPERIENCE } = await import('./build07bPrompts')
      return CORPO_FISIOLOGIA_EXPERIENCE
    }
    if (code === 'mente_emocoes_cer' || code === 'exp-mente-emocoes-07c') {
      const { MENTE_EMOCOES_EXPERIENCE } = await import('./build07cPrompts')
      return MENTE_EMOCOES_EXPERIENCE
    }
    if (code === 'regulacao_respostas_cer' || code === 'exp-regulacao-respostas-07c') {
      const { REGULACAO_RESPOSTAS_EXPERIENCE } = await import('./build07cPrompts')
      return REGULACAO_RESPOSTAS_EXPERIENCE
    }
    if (code === 'relacoes_cer' || code === 'exp-relacoes-07d') {
      const { RELACOES_EXPERIENCE } = await import('./build07dPrompts')
      return RELACOES_EXPERIENCE
    }
    if (code === 'sexualidade_cer' || code === 'exp-sexualidade-07e') {
      const { SEXUALIDADE_EXPERIENCE } = await import('./build07ePrompts')
      return SEXUALIDADE_EXPERIENCE
    }
    if (code === 'sentido_conexao_cer' || code === 'exp-sentido-conexao-07f') {
      const { SENTIDO_CONEXAO_EXPERIENCE } = await import('./build07fPrompts')
      return SENTIDO_CONEXAO_EXPERIENCE
    }
    if (code === 'integracao_consciencia_cer' || code === 'exp-integracao-consciencia-07g') {
      const { INTEGRACAO_CONSCIENCIA_EXPERIENCE } = await import('./build07gPrompts')
      return INTEGRACAO_CONSCIENCIA_EXPERIENCE
    }
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
    const canonicalId = resolveExperienceId(id)
    if (canonicalId === 'exp-corpo-fisiologia-07b') {
      const { CORPO_FISIOLOGIA_EXPERIENCE } = await import('./build07bPrompts')
      return CORPO_FISIOLOGIA_EXPERIENCE
    }
    if (canonicalId === 'exp-mente-emocoes-07c') {
      const { MENTE_EMOCOES_EXPERIENCE } = await import('./build07cPrompts')
      return MENTE_EMOCOES_EXPERIENCE
    }
    if (canonicalId === 'exp-regulacao-respostas-07c') {
      const { REGULACAO_RESPOSTAS_EXPERIENCE } = await import('./build07cPrompts')
      return REGULACAO_RESPOSTAS_EXPERIENCE
    }
    if (canonicalId === 'exp-relacoes-07d') {
      const { RELACOES_EXPERIENCE } = await import('./build07dPrompts')
      return RELACOES_EXPERIENCE
    }
    if (canonicalId === 'exp-sexualidade-07e') {
      const { SEXUALIDADE_EXPERIENCE } = await import('./build07ePrompts')
      return SEXUALIDADE_EXPERIENCE
    }
    if (canonicalId === 'exp-sentido-conexao-07f') {
      const { SENTIDO_CONEXAO_EXPERIENCE } = await import('./build07fPrompts')
      return SENTIDO_CONEXAO_EXPERIENCE
    }
    if (canonicalId === 'exp-integracao-consciencia-07g') {
      const { INTEGRACAO_CONSCIENCIA_EXPERIENCE } = await import('./build07gPrompts')
      return INTEGRACAO_CONSCIENCIA_EXPERIENCE
    }
    return await pb.collection('cer_experiences').getOne<CerExperienceRecord>(canonicalId, {
      expand: 'dimension_id',
    })
  },

  async listMomentsByExperience(experienceId: string): Promise<CerExperienceMomentRecord[]> {
    const canonicalId = resolveExperienceId(experienceId)
    if (canonicalId === 'exp-corpo-fisiologia-07b') {
      const { CORPO_FISIOLOGIA_MOMENTS } = await import('./build07bPrompts')
      return CORPO_FISIOLOGIA_MOMENTS
    }
    if (canonicalId === 'exp-mente-emocoes-07c') {
      const { MENTE_EMOCOES_MOMENTS } = await import('./build07cPrompts')
      return MENTE_EMOCOES_MOMENTS
    }
    if (canonicalId === 'exp-regulacao-respostas-07c') {
      const { REGULACAO_RESPOSTAS_MOMENTS } = await import('./build07cPrompts')
      return REGULACAO_RESPOSTAS_MOMENTS
    }
    if (canonicalId === 'exp-relacoes-07d') {
      const { RELACOES_MOMENTS } = await import('./build07dPrompts')
      return RELACOES_MOMENTS
    }
    if (canonicalId === 'exp-sexualidade-07e') {
      const { SEXUALIDADE_MOMENTS } = await import('./build07ePrompts')
      return SEXUALIDADE_MOMENTS
    }
    if (canonicalId === 'exp-sentido-conexao-07f') {
      const { SENTIDO_CONEXAO_MOMENTS } = await import('./build07fPrompts')
      return SENTIDO_CONEXAO_MOMENTS
    }
    if (canonicalId === 'exp-integracao-consciencia-07g') {
      const { INTEGRACAO_CONSCIENCIA_MOMENTS } = await import('./build07gPrompts')
      return INTEGRACAO_CONSCIENCIA_MOMENTS
    }
    return await pb.collection('cer_experience_moments').getFullList<CerExperienceMomentRecord>({
      filter: `experience_id = "${canonicalId}" && is_active = true`,
      sort: 'order_index',
    })
  },

  async listPromptsByExperience(experienceId: string): Promise<CerPromptRecord[]> {
    const canonicalId = resolveExperienceId(experienceId)
    if (canonicalId === 'exp-corpo-fisiologia-07b') {
      const { BUILD_07B_PROMPTS } = await import('./build07bPrompts')
      return BUILD_07B_PROMPTS
    }
    if (canonicalId === 'exp-mente-emocoes-07c') {
      const { BUILD_07C_MENTE_PROMPTS } = await import('./build07cPrompts')
      return BUILD_07C_MENTE_PROMPTS
    }
    if (canonicalId === 'exp-regulacao-respostas-07c') {
      const { BUILD_07C_REGULACAO_PROMPTS } = await import('./build07cPrompts')
      return BUILD_07C_REGULACAO_PROMPTS
    }
    if (canonicalId === 'exp-relacoes-07d') {
      const { BUILD_07D_RELACOES_PROMPTS } = await import('./build07dPrompts')
      return BUILD_07D_RELACOES_PROMPTS
    }
    if (canonicalId === 'exp-sexualidade-07e') {
      const { BUILD_07E_SEXUALIDADE_PROMPTS } = await import('./build07ePrompts')
      return BUILD_07E_SEXUALIDADE_PROMPTS
    }
    if (canonicalId === 'exp-sentido-conexao-07f') {
      const { BUILD_07F_SENTIDO_PROMPTS } = await import('./build07fPrompts')
      return BUILD_07F_SENTIDO_PROMPTS
    }
    if (canonicalId === 'exp-integracao-consciencia-07g') {
      const { BUILD_07G_INTEGRACAO_PROMPTS } = await import('./build07gPrompts')
      return BUILD_07G_INTEGRACAO_PROMPTS
    }
    return await pb.collection('cer_prompts').getFullList<CerPromptRecord>({
      filter: `experience_id = "${canonicalId}"`,
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
    const canonicalExpId = resolveExperienceId(experienceId)
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      const list = await this.listByEnrollment(enrollmentId)
      return (
        list.find(
          (e) =>
            e.experience_id === canonicalExpId ||
            e.id === `demo-enr-exp-${canonicalExpId}` ||
            (e.expand?.experience_id && (e.expand.experience_id as any).id === canonicalExpId),
        ) || null
      )
    }

    try {
      return await pb
        .collection('enrollment_experiences')
        .getFirstListItem<EnrollmentExperienceRecord>(
          `enrollment_id = "${enrollmentId}" && (experience_id = "${canonicalExpId}" || experience_id = "${experienceId}")`,
          {
            expand: 'experience_id,enrollment_id',
          },
        )
    } catch {
      return null
    }
  },

  async listByEnrollment(enrollmentId: string): Promise<EnrollmentExperienceRecord[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      // No modo demo, experiências canônicas das dimensões ficam disponíveis para abertura
      // MAS sem respostas prévias ou autoria falsa. Progresso e step persistem localmente via demoAdapter.
      const { CORPO_FISIOLOGIA_EXPERIENCE } = await import('./build07bPrompts')
      const { MENTE_EMOCOES_EXPERIENCE, REGULACAO_RESPOSTAS_EXPERIENCE } =
        await import('./build07cPrompts')
      const { RELACOES_EXPERIENCE } = await import('./build07dPrompts')
      const { SEXUALIDADE_EXPERIENCE } = await import('./build07ePrompts')
      const { SENTIDO_CONEXAO_EXPERIENCE } = await import('./build07fPrompts')
      const { INTEGRACAO_CONSCIENCIA_EXPERIENCE } = await import('./build07gPrompts')

      const exps = [
        CORPO_FISIOLOGIA_EXPERIENCE,
        MENTE_EMOCOES_EXPERIENCE,
        REGULACAO_RESPOSTAS_EXPERIENCE,
        RELACOES_EXPERIENCE,
        SEXUALIDADE_EXPERIENCE,
        SENTIDO_CONEXAO_EXPERIENCE,
        INTEGRACAO_CONSCIENCIA_EXPERIENCE,
      ]

      return exps.map((exp) => {
        const prog = demoAdapter.getEnrollmentExperienceProgress(enrollmentId, exp.id)
        return {
          id: `demo-enr-exp-${exp.id}`,
          enrollment_id: enrollmentId,
          experience_id: exp.id,
          release_status: prog?.release_status || 'available',
          progress_status: prog?.progress_status || 'not_started',
          current_step_order: prog?.current_step_order || 1,
          version: 1,
          started_at: prog?.started_at,
          completed_at: prog?.completed_at,
          last_interaction_at: prog?.last_interaction_at || '2025-01-10T10:00:00.000Z',
          created: '2025-01-10T10:00:00.000Z',
          updated: prog?.last_interaction_at || '2025-01-10T10:00:00.000Z',
          expand: {
            experience_id: exp,
          },
        }
      }) as unknown as EnrollmentExperienceRecord[]
    }
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
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      const expId = resolveExperienceId(id)
      const prog = demoAdapter.updateEnrollmentExperienceProgress(
        'demo-enrollment-mariana',
        expId,
        { releaseStatus },
      )
      const exp = await experienceCatalogService.getExperienceById(expId)
      return {
        id: `demo-enr-exp-${expId}`,
        enrollment_id: 'demo-enrollment-mariana',
        experience_id: expId,
        release_status: prog.release_status,
        progress_status: prog.progress_status,
        current_step_order: prog.current_step_order,
        version: 1,
        started_at: prog.started_at,
        completed_at: prog.completed_at,
        last_interaction_at: prog.last_interaction_at,
        created: '2025-01-10T10:00:00.000Z',
        updated: prog.last_interaction_at,
        expand: {
          experience_id: exp,
        },
      } as unknown as EnrollmentExperienceRecord
    }

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
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      const expId = resolveExperienceId(id)
      const prog = demoAdapter.updateEnrollmentExperienceProgress(
        'demo-enrollment-mariana',
        expId,
        {
          stepOrder: params.stepOrder,
          progressStatus: params.progressStatus,
          completed: params.completed,
        },
      )
      const exp = await experienceCatalogService.getExperienceById(expId)
      return {
        id: `demo-enr-exp-${expId}`,
        enrollment_id: 'demo-enrollment-mariana',
        experience_id: expId,
        release_status: prog.release_status,
        progress_status: prog.progress_status,
        current_step_order: prog.current_step_order,
        version: 1,
        started_at: prog.started_at,
        completed_at: prog.completed_at,
        last_interaction_at: prog.last_interaction_at,
        created: '2025-01-10T10:00:00.000Z',
        updated: prog.last_interaction_at,
        expand: {
          experience_id: exp,
        },
      } as unknown as EnrollmentExperienceRecord
    }

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

    // Se for mock local / offline
    if (experienceId === 'exp-corpo-fisiologia-07b' && enrollmentId.startsWith('enr-b07b')) {
      return {
        id: `enr-exp-${experienceId}`,
        enrollment_id: enrollmentId,
        experience_id: experienceId,
        release_status: 'available',
        progress_status: 'not_started',
        current_step_order: 1,
        version: 1,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      } as any
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
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.listExperienceResponses(enrollmentId, experienceId)
    }
    return await pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
      filter: `enrollment_id = "${enrollmentId}" && experience_id = "${experienceId}"`,
      expand: 'prompt_id',
      sort: 'prompt_id.step_order',
    })
  },

  /**
   * Deriva deterministicamente a Evidence Currency Layer para um enrollment
   * separando respostas e signals correntes vs históricos.
   */
  async getEnrollmentEvidenceCurrency(enrollmentId: string): Promise<EvidenceCurrencyResult> {
    const [responses, prompts, signals] = await Promise.all([
      pb.collection('experience_responses').getFullList<ExperienceResponseRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
      }),
      pb.collection('cer_prompts').getFullList<CerPromptRecord>({
        sort: 'step_order',
      }),
      pb.collection('cer_signals').getFullList<CerSignalRecord>({
        filter: `enrollment_id = "${enrollmentId}"`,
      }),
    ])

    return deriveEvidenceCurrency({
      prompts,
      responses,
      signals,
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
    const canonicalExpId = resolveExperienceId(params.experienceId)
    const effectiveParams = { ...params, experienceId: canonicalExpId }

    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return demoAdapter.saveExperienceResponse(effectiveParams)
    }

    const existing = await this.getResponse(effectiveParams.enrollmentId, effectiveParams.promptId)

    // Fallback gracioso para ambiente local sintético de teste
    if (
      params.experienceId === 'exp-corpo-fisiologia-07b' &&
      params.enrollmentId.startsWith('enr-b07b')
    ) {
      return {
        id: `mock-resp-${params.promptId}`,
        enrollment_id: params.enrollmentId,
        experience_id: params.experienceId,
        prompt_id: params.promptId,
        respondent_user_id: params.respondentUserId,
        response_type: params.responseType,
        access_class: params.accessClass || 'shared_care',
        structured_value: params.structuredValue,
        free_text: params.freeText || '',
        prompt_version: params.promptVersion,
        version: existing ? existing.version + 1 : 1,
        status: existing ? 'revised' : 'saved',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      } as any
    }

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
