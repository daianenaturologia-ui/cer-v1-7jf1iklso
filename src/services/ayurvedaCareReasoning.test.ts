import { describe, it, expect } from 'vitest'
import { buildIntegratedAyurvedaQaFixture } from './conscienciaQaFixture'
import { buildCerMapReadings } from './cerMapReadings'
import { ayurvedaCareDirections, ayurvedaReviewWindow } from './ayurvedaCareReasoning'
import { completedCurrentResponses } from './ayurvedaCurrentInterpretation'
const data = () => buildIntegratedAyurvedaQaFixture().responses
const body = () =>
  buildCerMapReadings(data(), 'demo-enr-01', 'Mariana', { literalOnly: true }).dimensions[0]
describe('Raciocínio de cuidado Ayurveda', () => {
  it('relaciona base Pitta e Kapha agravado com lentidão sem declarar deficiência ou prescrever', () => {
    const b = body()
    const rows = ayurvedaCareDirections(b.ayurvedaConstitution!, b.ayurvedaReading)
    expect(rows.find((r) => r.label === 'Kapha')?.symbol).toBe('↓')
    expect(rows.find((r) => r.label === 'Pitta')?.symbol).toBe('↑')
    expect(rows.find((r) => r.label === 'Ama')?.symbol).toBe('↓')
    expect(rows.find((r) => r.label === 'Pitta')?.reason).toContain('Hipótese de cuidado')
  })
  it('não aumenta Pitta diante de calor, nem por ausência de dados atuais ou digestão confortável', () => {
    const b = body().ayurvedaReading!
    for (const reading of [
      { ...b, currentDigestive: false },
      { ...b, agniEvidence: ['Após comer: Com calor, queimação, azia ou acidez.'] },
      {
        ...b,
        agniType: 'Sama Agni',
        agniEvidence: ['Após comer: Sensação leve, confortável e com satisfação.'],
      },
    ])
      expect(
        ayurvedaCareDirections(['Vata', 'Pitta'], reading).find((r) => r.label === 'Pitta')?.symbol,
      ).not.toBe('↑')
    expect(ayurvedaCareDirections([], undefined)).toEqual([])
  })
  it('conta 35 dias desde a conclusão, sem renovar a data por um rascunho', () => {
    const records = data()
    const window = ayurvedaReviewWindow(records)!
    expect(Date.parse(window.dueAt) - Date.parse(window.assessedAt)).toBe(35 * 86400000)
    expect(ayurvedaReviewWindow(records, new Date(Date.parse(window.dueAt) - 1))?.due).toBe(false)
    expect(ayurvedaReviewWindow(records, new Date(window.dueAt))?.due).toBe(true)
    const completion = records.find((r) => r.prompt_id === 'ayv_c3_chapter_completion')!
    expect(
      ayurvedaReviewWindow([
        ...records,
        { ...completion, id: 'draft', status: 'draft', updated: '2026-12-01T10:00:00Z' },
      ])?.dueAt,
    ).toBe(window.dueAt)
  })
  it('a conclusão da nova revisão isola respostas anteriores e reinicia o ciclo', () => {
    const first = data().map((r) => ({
      ...r,
      structured_value: {
        ...(r.structured_value as any),
        metadata: { ...(r.structured_value as any)?.metadata, chapter_revision_number: 1 },
      },
    }))
    const second = data()
      .filter((r) => r.prompt_id.startsWith('ayv_c3_'))
      .map((r) => ({
        ...r,
        id: `new:${r.id}`,
        updated: '2026-11-01T10:00:00Z',
        structured_value: {
          ...(r.structured_value as any),
          completed_at: '2026-11-01T10:00:00Z',
          metadata: {
            ...(r.structured_value as any)?.metadata,
            answered_at: '2026-11-01T10:00:00Z',
            chapter_revision_number: 2,
          },
        },
      }))
    expect(
      completedCurrentResponses([...first, ...second]).every((r) => r.id.startsWith('new:')),
    ).toBe(true)
    expect(ayurvedaReviewWindow([...first, ...second])?.assessedAt).toBe('2026-11-01T10:00:00Z')
  })
})
