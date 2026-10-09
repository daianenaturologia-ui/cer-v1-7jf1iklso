import { describe, expect, it } from 'vitest'
import { buildProtectionPatternReading } from './cerProtectionPatternReading'
import { patternResources } from './cerPersonalReadings'
import { createDemoCerMapReading } from './demoCerMapReading'

describe('Leitura aprofundada dos comportamentos', () => {
  it('mantém os dez movimentos e explica funcionamento, emoções, vínculos, proteção e forças', () => {
    for (const key of Object.keys(patternResources)) {
      const reading = buildProtectionPatternReading(key, true)!
      expect(reading.sections).toHaveLength(5)
      expect(reading.sections!.every((s) => s.text.length > 200)).toBe(true)
      expect(reading.resources).not.toHaveLength(0)
      expect(reading.costs).not.toHaveLength(0)
      expect(reading.questions).toEqual([])
      expect(reading.observations).toEqual([])
      expect(JSON.stringify(reading)).not.toMatch(/seus pais|você sofreu|mentiras|manipuladora|\?/i)
    }
  })
  it('não transforma um movimento pouco presente em uma força ou dificuldade pessoal', () => {
    const reading = buildProtectionPatternReading('insistente', false)!
    expect(reading.interpretation).toContain('explicação do movimento')
    expect(reading.resources).toEqual([])
    expect(reading.costs).toEqual([])
    expect(reading.connections).toEqual([])
  })
  it('preserva conexões válidas sem incorporar perguntas ou respostas literais', () => {
    const s = createDemoCerMapReading()
    const reading = s.elementReadings!.prestativo
    expect(reading.sections).toHaveLength(5)
    expect(reading.connections.join(' ')).toContain('necessidades e riscos cedo')
    expect(reading.sections![2].text).toContain('reciprocidade')
    expect(reading.observations).toEqual([])
    expect(reading.questions).toEqual([])
  })
})
