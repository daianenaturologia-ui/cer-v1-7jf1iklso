import { enrollmentExperienceService } from './experienceEngine'
import { developmentPlanService } from './developmentPlanService'
import { consciousnessCoverage } from './cerMapReadings'
import type { JourneyStateRecord } from '@/types/cer'

export interface ProfessionalListProgress {
  currentStage: string
  stageStatus: string
  nextStep: string
}

/** Read progress metadata and shared plan versions; never questionnaire answers. */
export async function professionalListProgress(
  enrollmentId: string,
  legacy?: JourneyStateRecord,
): Promise<ProfessionalListProgress> {
  try {
    const [progress, versions] = await Promise.all([
      enrollmentExperienceService.listByEnrollment(enrollmentId),
      developmentPlanService.versions(enrollmentId),
    ])
    const plan = versions
      .filter((v) => v.enrollment_id === enrollmentId)
      .sort((a, b) => b.created.localeCompare(a.created) || b.revision - a.revision)[0]
    if (plan) {
      return {
        currentStage: 'equilibrium_realization',
        stageStatus: 'em_andamento',
        nextStep:
          plan.stage === 'agreed'
            ? 'Acompanhar ações combinadas e revisar o ciclo de cuidado'
            : 'Construir o Plano de Desenvolvimento nos encontros',
      }
    }
    const coverage = consciousnessCoverage(
      [],
      progress.filter((p) => p.enrollment_id === enrollmentId),
    )
    if (coverage.every((d) => d.completed)) {
      return {
        currentStage: 'evolution',
        stageStatus: 'em_andamento',
        nextStep: 'Conversar sobre a Linha da Vida e preparar o Plano de Desenvolvimento',
      }
    }
    if (coverage.some((d) => d.started)) {
      return {
        currentStage: 'consciousness',
        stageStatus: 'em_andamento',
        nextStep: 'Acompanhar o preenchimento das seis dimensões',
      }
    }
    const currentStage = legacy?.current_stage || 'onboarding'
    return {
      currentStage,
      stageStatus: legacy?.stage_status || 'nao_iniciado',
      nextStep:
        currentStage === 'equilibrium_realization'
          ? 'Acompanhar práticas e revisar o ciclo de cuidado'
          : currentStage === 'consciousness'
            ? 'Conferir o preenchimento das seis dimensões'
            : 'Acompanhar o acolhimento inicial',
    }
  } catch {
    return {
      currentStage: 'unavailable',
      stageStatus: 'unknown',
      nextStep: 'Abra a visão geral para atualizar o acompanhamento',
    }
  }
}
