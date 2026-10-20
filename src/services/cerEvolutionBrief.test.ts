import { expect, it } from 'vitest'
import { createDemoCerMapReading } from './demoCerMapReading'
import { buildCerMapReadings } from './cerMapReadings'
import { cerEvolutionBrief } from './cerEvolutionBrief'
it('reúne o retrato existente sem inferir conexões com os marcos', () => {
  const snapshot = createDemoCerMapReading()
  snapshot.history = 'HISTÓRIA QUE NÃO DEVE SER INTERPRETADA'
  const before = JSON.stringify(snapshot)
  const brief = cerEvolutionBrief(snapshot)
  expect(brief.protection).toHaveLength(3)
  expect(brief.protection).toEqual(['Prestativo', 'Hipervigilante', 'Analítico'])
  expect(brief.survival).toContain('Luta')
  expect(brief.dosha).toBe('Vata–Pitta')
  for (const field of ['relationships', 'sexuality', 'connection'] as const) {
    expect(brief[field].length).toBeGreaterThan(0)
    expect(brief[field].length).toBeLessThanOrEqual(240)
  }
  expect(JSON.stringify(brief)).not.toContain('HISTÓRIA QUE NÃO DEVE SER INTERPRETADA')
  expect(JSON.stringify(snapshot)).toBe(before)
})
it('não preenche padrões nem leituras quando faltam dados', () => {
  const brief = cerEvolutionBrief(buildCerMapReadings([], 'empty', 'Pessoa'))
  expect(brief.protection).toEqual([])
  expect(brief.survival).toEqual([])
  expect(brief.relationships).toBe('Ainda sem leitura disponível.')
})
it('mantém empate de proteção explícito e não inventa intensidade para reações', () => {
  const snapshot = createDemoCerMapReading()
  snapshot.dimensions[1].detailedRows = [
    'prestativo',
    'hipervigilante',
    'hiper_racional',
    'insistente',
  ].map((label) => ({ label, text: 'Repete-se com frequência' }))
  snapshot.dimensions[2].detailedRows = [
    {
      label: 'Reações',
      sourcePromptKey: 'resposta_tendencia',
      text: 'Me afastar, calar ou buscar distância física; Ceder, concordar ou tentar acalmar os outros',
    },
  ]
  const brief = cerEvolutionBrief(snapshot)
  expect(brief.protectionTie).toBe(true)
  expect(brief.survival).toEqual(['Fuga / recolhimento', 'Ceder / agradar'])
})
