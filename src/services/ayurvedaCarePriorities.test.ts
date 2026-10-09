import { describe, it, expect } from 'vitest'
import { buildIntegratedAyurvedaQaFixture } from './conscienciaQaFixture'
import { buildAyurvedaCarePriorities } from './ayurvedaCarePriorities'

describe('Do mapa ao plano Ayurveda', () => {
  it('prepara três prioridades com sinais reais, direções e acompanhamento, mantendo fundamento privado separado', () => {
    const result = buildAyurvedaCarePriorities(
      buildIntegratedAyurvedaQaFixture().responses,
      'demo-enr-01',
      'Mariana',
    )
    expect(result.priorities.map((p) => p.id)).toEqual([
      'ayurveda-ritmo',
      'ayurveda-agni',
      'ayurveda-ama',
    ])
    const rhythm = result.priorities[0]
    expect(rhythm.directions.some((d) => d.includes('Kapha ↓'))).toBe(true)
    expect(rhythm.directions.some((d) => d.includes('Pitta ↑'))).toBe(true)
    for (const priority of result.priorities) {
      expect(priority.evidence.length).toBeGreaterThan(0)
      expect(priority.monitoring.length).toBeGreaterThan(0)
      expect(priority.professionalRationale).toContain('Respostas de origem do mapa:')
      expect(priority.description).not.toContain('Respostas de origem')
    }
    expect(result.review).toBeDefined()
  })
  it('não usa outra participante, nem inventa prioridades ou datas na ausência de respostas', () => {
    expect(
      buildAyurvedaCarePriorities(
        buildIntegratedAyurvedaQaFixture().responses,
        'outro-enrollment',
        'Outra',
      ),
    ).toEqual({ priorities: [], review: undefined })
    expect(buildAyurvedaCarePriorities([], 'demo-enr-01', 'Mariana')).toEqual({
      priorities: [],
      review: undefined,
    })
  })
  it('uma avaliação em rascunho não altera prioridades, data ou fonte concluída', () => {
    const records = buildIntegratedAyurvedaQaFixture().responses
    const before = buildAyurvedaCarePriorities(records, 'demo-enr-01', 'Mariana')
    const draft = records
      .filter((r) => r.prompt_id.startsWith('ayv_c3_'))
      .map((r) => ({
        ...r,
        id: `draft:${r.id}`,
        status: 'draft' as const,
        updated: '2026-12-01T10:00:00Z',
        structured_value: { value: 'calor', metadata: { chapter_revision_number: 99 } },
      }))
    const after = buildAyurvedaCarePriorities([...records, ...draft], 'demo-enr-01', 'Mariana')
    expect(after.priorities.map((p) => [p.title, p.directions, p.evidence])).toEqual(
      before.priorities.map((p) => [p.title, p.directions, p.evidence]),
    )
    expect(after.review).toEqual(before.review)
  })
})
