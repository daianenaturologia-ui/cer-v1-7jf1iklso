import { describe, it, expect } from 'vitest'
import { cycleHistory } from './cycleHistory'
import { addDays, emptyCycleEntry, defaultCycleProfile, validateCycleEntry } from './cycleJournal'
const profile = { ...defaultCycleProfile('enr'), context: 'natural' as const }
const starts = (dates: string[]) =>
  dates.map((day) => ({ ...emptyCycleEntry('enr', day), period_start: true, bleeding: 'Leve' }))
describe('Histórico de calendário menstrual', () => {
  it('calcula intervalos reais e uma referência pela mediana de três ciclos completos', () => {
    const result = cycleHistory(
      starts(['2026-01-01', '2026-01-29', '2026-02-28', '2026-03-28']),
      profile,
      '2026-04-01',
    )
    expect(result.intervals).toEqual([28, 30, 28])
    expect(result.next).toBe('2026-04-25')
    expect(result.basis).toBe('history')
    expect(result.min).toBe(28)
    expect(result.max).toBe(30)
  })
  it('não inventa duração com poucos dados e identifica duração informada como provisória', () => {
    expect(cycleHistory(starts(['2026-01-01']), profile, '2026-01-15').next).toBeUndefined()
    expect(
      cycleHistory(starts(['2026-01-01']), { ...profile, cycle_length: 30 }, '2026-01-15'),
    ).toMatchObject({ next: '2026-01-31', basis: 'reported' })
  })
  it('preserva os intervalos diferentes e suspende a previsão em vez de descartar dados', () => {
    const result = cycleHistory(
      starts(['2026-01-01', '2026-01-29', '2026-03-15', '2026-04-12']),
      profile,
      '2026-04-20',
    )
    expect(result.intervals).toEqual([28, 45, 28])
    expect(result.next).toBeUndefined()
    expect(result.reason).toMatch(/variam/)
  })
  it('não cria previsão em contracepção hormonal, gestação, pós-parto, menopausa ou contexto incerto', () => {
    for (const context of [
      'hormonal',
      'pregnancy',
      'postpartum',
      'menopause',
      'perimenopause',
      'irregular',
    ] as const)
      expect(
        cycleHistory(
          starts(['2026-01-01']),
          { ...profile, context, cycle_length: 28 },
          '2026-01-15',
        ).next,
      ).toBeUndefined()
  })
  it('não rola uma data vencida para frente sem nova menstruação registrada', () => {
    const result = cycleHistory(
      starts(['2026-01-01']),
      { ...profile, cycle_length: 28 },
      '2026-03-01',
    )
    expect(result.next).toBe('2026-01-29')
    expect(result.pastReference).toBe(true)
  })
  it('isola pessoa, datas futuras, duplicidades e sangramentos que não indicam início menstrual', () => {
    const own = starts(['2026-01-01'])
    const list = [
      ...own,
      ...own,
      ...starts(['2026-02-01']).map((e) => ({ ...e, enrollment_id: 'other' })),
      ...starts(['2026-03-01']),
      ...starts(['2026-01-20']).map((e) => ({ ...e, bleeding: 'Escape' })),
    ]
    expect(cycleHistory(list, profile, '2026-02-15').starts).toEqual(['2026-01-01'])
  })
  it('recalcula ao corrigir ou retirar o primeiro dia e valida os sinais como percepções', () => {
    const events = starts(['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26'])
    expect(cycleHistory(events, profile, '2026-04-01').next).toBe('2026-04-23')
    expect(cycleHistory(events.slice(0, 3), profile, '2026-04-01').next).toBeUndefined()
    const entry = {
      ...emptyCycleEntry('enr', addDays(new Date().toISOString().slice(0, 10), -1)),
      thoughts: 'Um pensamento',
      cycle_signs: ['TPM percebida'],
    }
    expect(() => validateCycleEntry(entry)).not.toThrow()
    expect(() =>
      validateCycleEntry({ ...entry, cycle_signs: ['TPM percebida', 'Não sei identificar'] }),
    ).toThrow()
    expect(() => validateCycleEntry({ ...entry, thoughts: 'x'.repeat(5001) })).toThrow()
  })
})
