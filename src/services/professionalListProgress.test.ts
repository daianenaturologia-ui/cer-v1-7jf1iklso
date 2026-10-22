import { beforeEach, expect, it, vi } from 'vitest'
const fixtures = vi.hoisted(() => ({ progress: vi.fn(), versions: vi.fn() }))
vi.mock('./experienceEngine', () => ({
  enrollmentExperienceService: { listByEnrollment: fixtures.progress },
  resolveExperienceId: (id: string) => id,
}))
vi.mock('./developmentPlanService', () => ({ developmentPlanService: { versions: fixtures.versions } }))
import { professionalListProgress } from './professionalListProgress'
import { CER_READING_DIMENSIONS } from './cerMapReadings'
import type { JourneyStateRecord } from '@/types/cer'

const oldState = { current_stage: 'consciousness', stage_status: 'em_andamento' } as JourneyStateRecord
beforeEach(() => {
  fixtures.progress.mockResolvedValue([])
  fixtures.versions.mockResolvedValue([])
})
it('seis dimensões concluídas superam o estado antigo da jornada', async () => {
  fixtures.progress.mockResolvedValue(CER_READING_DIMENSIONS.map((d) => ({
    enrollment_id: 'person', experience_id: d.experienceId, progress_status: 'completed',
  })))
  const result = await professionalListProgress('person', oldState)
  expect(result.currentStage).toBe('evolution')
  expect(result.nextStep).toContain('Linha da Vida')
})
it.each(['agreed', 'building'])('plano %s orienta a lista mesmo com jornada antiga', async (stage) => {
  fixtures.versions.mockResolvedValue([{ enrollment_id: 'person', stage, created: '2026-10-22', revision: 1 }])
  const result = await professionalListProgress('person', oldState)
  expect(result.currentStage).toBe('equilibrium_realization')
  expect(result.nextStep).toBe(stage === 'agreed'
    ? 'Acompanhar ações combinadas e revisar o ciclo de cuidado'
    : 'Construir o Plano de Desenvolvimento nos encontros')
})
it('uma revisão compartilhada mais recente em construção não usa o acordo antigo', async () => {
  fixtures.versions.mockResolvedValue([
    { enrollment_id: 'person', stage: 'agreed', created: '2026-10-21', revision: 1 },
    { enrollment_id: 'person', stage: 'building', created: '2026-10-22', revision: 2 },
  ])
  expect((await professionalListProgress('person', oldState)).nextStep).toContain('Construir')
})
it('não atribui conclusão nem plano de outra matrícula à pessoa', async () => {
  fixtures.progress.mockResolvedValue(CER_READING_DIMENSIONS.map((d) => ({
    enrollment_id: 'other', experience_id: d.experienceId, progress_status: 'completed',
  })))
  fixtures.versions.mockResolvedValue([{ enrollment_id: 'other', stage: 'agreed', created: '', revision: 1 }])
  expect((await professionalListProgress('person', oldState)).currentStage).toBe('consciousness')
})
it('falha de leitura não apresenta o estado antigo como atualizado', async () => {
  fixtures.progress.mockRejectedValue(new Error('offline'))
  expect(await professionalListProgress('person', oldState)).toMatchObject({
    currentStage: 'unavailable', stageStatus: 'unknown',
  })
})
it('uma dimensão iniciada mantém a consciência em andamento', async () => {
  fixtures.progress.mockResolvedValue([{
    enrollment_id: 'person', experience_id: CER_READING_DIMENSIONS[0].experienceId, progress_status: 'in_progress',
  }])
  expect((await professionalListProgress('person')).currentStage).toBe('consciousness')
})
