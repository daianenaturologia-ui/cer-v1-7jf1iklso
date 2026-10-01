import { describe, it, expect, vi } from 'vitest'
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
import { validateLifeEvent, sharedLifeEvents, lifeTimeLabel, type LifeEvent } from './lifeTimeline'
import { buildCerMapReadings, isCerMapReadingSnapshot } from './cerMapReadings'
const event: LifeEvent = {
  id: 'event1',
  enrollment_id: 'enr',
  title: 'Um encontro importante',
  time_kind: 'age',
  time_value: '10',
  emotions: ['Alegria', 'Gratidão'],
  narrative: 'Encontrei apoio.',
  access_class: 'participant_shared',
  updated: '2026-10-01',
}
describe('Linha da Vida', () => {
  it('aceita idade aproximada, várias emoções e época desconhecida', () => {
    expect(() => validateLifeEvent(event)).not.toThrow()
    expect(() =>
      validateLifeEvent({ ...event, time_kind: 'unknown', time_value: '' }),
    ).not.toThrow()
    expect(lifeTimeLabel(event)).toBe('Por volta dos 10 anos')
  })
  it('rejeita datas inexistentes e futuras sem inventar precisão', () => {
    for (const time_value of ['2026-02-30', '2027-01-01', 'ontem'])
      expect(() =>
        validateLifeEvent(
          { ...event, time_kind: 'date', time_value },
          new Date('2026-10-01T12:00:00Z'),
        ),
      ).toThrow()
  })
  it('não deixa histórias privadas ou de outra pessoa entrarem nas fontes', () => {
    const shared = sharedLifeEvents(
      [
        event,
        { ...event, id: 'private', access_class: 'participant_private' },
        { ...event, id: 'other', enrollment_id: 'other' },
      ],
      'enr',
    )
    expect(shared.map((e) => e.id)).toEqual(['event1'])
    shared[0].emotions.push('Medo')
    expect(event.emotions).toEqual(['Alegria', 'Gratidão'])
  })
  it('valida snapshots antigos e recusa história privada no novo formato', () => {
    const map = buildCerMapReadings([], 'enr', 'Teste')
    expect(isCerMapReadingSnapshot(map)).toBe(true)
    expect(isCerMapReadingSnapshot({ ...map, lifeEvents: [event] })).toBe(true)
    expect(
      isCerMapReadingSnapshot({
        ...map,
        lifeEvents: [{ ...event, access_class: 'participant_private' }],
      }),
    ).toBe(false)
  })
})
