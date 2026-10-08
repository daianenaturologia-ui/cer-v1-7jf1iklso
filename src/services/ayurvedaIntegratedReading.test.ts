import { describe, it, expect } from 'vitest'
import { buildIntegratedAyurvedaQaFixture, buildConscienciaQaFixture } from './conscienciaQaFixture'
import { buildAyurvedaInterpretation } from './ayurvedaInterpretationEngine'
import { buildCerMapReadings, isCerMapReadingSnapshot } from './cerMapReadings'
import { interpretCurrentBody } from './ayurvedaCurrentInterpretation'
import { createDemoCerMapReading } from './demoCerMapReading'
const records = () => buildIntegratedAyurvedaQaFixture().responses
const key = (r: any) => r.prompt_id

describe('Leitura integrada de Corpo', () => {
  it('sustenta Vata–Pitta e Vikriti Vata–Kapha nas respostas de demonstração compartilhadas', () => {
    const data = records()
    const result = buildAyurvedaInterpretation(data)
    expect(result.prakritiHypothesis.primaryTendency).toBe('Vata')
    expect(result.prakritiHypothesis.secondaryTendency).toBe('Pitta')
    expect(result.vikritiHypothesis.doshas).toEqual(['Vata', 'Kapha'])
    expect(result.vikritiHypothesis.confidence).toBe('Moderada')
    const body = createDemoCerMapReading().dimensions[0]
    expect(body.ayurvedaConstitution).toEqual(['Vata', 'Pitta'])
    expect(body.ayurvedaReading?.currentDoshas).toEqual(['Vata', 'Kapha'])
    expect(body.ayurvedaReading?.agniSummary).toMatch(/mistos.*irregularidade.*lentidão/)
    expect(body.ayurvedaReading?.amaSummary).toMatch(/sinalizam Ama/)
    expect(body.summary).toMatch(/Vata–Pitta.*Vata–Kapha/)
    expect(body.interpretation).not.toContain('Pitta baixo')
  })
  it('C2 habitual e C3 incompleto não se tornam desequilíbrio atual', () => {
    expect(interpretCurrentBody(buildConscienciaQaFixture().responses).doshas).toEqual([])
    expect(
      interpretCurrentBody(records().filter((r) => key(r) !== 'ayv_c3_chapter_completion')).doshas,
    ).toEqual([])
  })
  it.each(['same_as_usual', 'hard_to_compare', 'dont_know', 'refusal'])(
    'comparação %s não sustenta Vikriti',
    (comparison) => {
      const data = records()
      for (const r of data)
        if (key(r).startsWith('ayv_c3_current_'))
          (r.structured_value as any).value.comparison = comparison
      expect(interpretCurrentBody(data).doshas).toEqual([])
    },
  )
  it('uma área e duas seleções nela não produzem convergência', () => {
    const data = records().filter(
      (r) => !key(r).startsWith('ayv_c3_current_') || key(r) === 'ayv_c3_current_post_meal',
    )
    expect(interpretCurrentBody(data).doshas).toEqual([])
  })
  it('duração ou frequência desconhecida não sustenta hipótese, embora os fatos sejam preservados', () => {
    const data = records()
    for (const r of data)
      if (key(r).startsWith('ayv_c3_current_'))
        (r.structured_value as any).value.duration = 'dont_know'
    const reading = interpretCurrentBody(data)
    expect(reading.doshas).toEqual([])
    expect(reading.facts.length).toBe(4)
  })
  it('rascunho posterior e respostas depois da conclusão não contaminam a leitura anterior', () => {
    const data = records()
    const record = data.find((r) => key(r) === 'ayv_c3_current_sleep')!
    const before = interpretCurrentBody(data)
    const changed = {
      ...record,
      id: 'later',
      updated: '2025-05-19T10:00:00.000Z',
      structured_value: {
        value: { area_key: 'sleep', current_states: ['easy_deep'], comparison: 'same_as_usual' },
        metadata: { prompt_key: key(record) },
      },
    }
    expect(interpretCurrentBody([...data, changed]).doshas).toEqual(before.doshas)
    expect(interpretCurrentBody([...data, { ...changed, status: 'draft' }]).facts).toEqual(
      before.facts,
    )
  })
  it('mudança explícita conflitante com ausência geral não se torna normalidade ou hipótese', () => {
    const data = records()
    ;(data.find((r) => key(r) === 'ayv_c3_changed_domains')!.structured_value as any).value = [
      'no_current_changes',
    ]
    const reading = interpretCurrentBody(data)
    expect(reading.doshas).toEqual([])
    expect(reading.summary).toContain('não concordam')
  })
  it('gera interpretação inicial nas duas visões e valida a estrutura nova do snapshot', () => {
    const data = records()
    const snapshot = buildCerMapReadings(data, 'demo-enr-01', 'Mariana', { literalOnly: true })
    expect(snapshot.dimensions[0].ayurvedaReading?.currentDoshas).toEqual(['Vata', 'Kapha'])
    expect(isCerMapReadingSnapshot(snapshot)).toBe(true)
    const broken = structuredClone(snapshot)
    ;(broken.dimensions[0] as any).ayurvedaReading = { currentDoshas: 'Vata' }
    expect(isCerMapReadingSnapshot(broken)).toBe(false)
  })
})
