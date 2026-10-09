import { describe, expect, it } from 'vitest'
import { createDemoCerMapReading } from './demoCerMapReading'
import { buildCerMapReadings } from './cerMapReadings'
import { applyFunctionalReading } from './cerFunctionalReading'
import { BUILD_07C_MENTE_PROMPTS, BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'

const prompts = [...BUILD_07C_MENTE_PROMPTS, ...BUILD_07C_REGULACAO_PROMPTS]
const response = (key: string, value: unknown, overrides = {}) => {
  const p = prompts.find((p) => (p.schema_config as any).prompt_key === key)!
  return {
    id: key,
    enrollment_id: 'enr',
    experience_id: p.experience_id,
    prompt_id: p.id,
    access_class: 'participant_shared',
    status: 'saved',
    created: '2026-10-09',
    updated: '2026-10-09',
    structured_value: { value },
    ...overrides,
  } as any
}
describe('CER: funcionamento e conexões', () => {
  it('conecta base, momento, digestão, proteção, ansiedade e luta no cenário Mariana', () => {
    const s = createDemoCerMapReading()
    expect(s.integration).toContain('base Vata–Pitta')
    expect(s.integration).toContain('momento Vata–Kapha')
    expect(s.integration).toContain('Agni irregular ou lento')
    expect(s.integration).toContain('sinais de Ama')
    expect(s.integration).toContain('necessidades e riscos cedo')
    expect(s.integration).toContain('ansiedade')
    expect(s.integration).toContain('resposta de luta')
    expect(s.integration).not.toContain('Medo e ansiedade juntos')
    const body = s.dimensions.find((d) => d.id === 'corpo')!.ayurvedaReading!
    expect(s.elementReadings!.agni.interpretation).toBe(body.agniSummary)
    expect(s.elementReadings!.agni.interpretation).not.toContain('leitura permanece em observação')
    expect(s.elementReadings!.pitta.interpretation).toContain('Na sua hipótese constitucional')
    expect(s.elementReadings!.ama.observations).toEqual([])
    for (const d of s.dimensions.slice(1)) {
      expect(d.personalSections).toHaveLength(1)
      expect(d.personalSections![0].title).toBe('Como você funciona nesta dimensão')
      expect(d.personalSections![0].text).not.toMatch(/Você registrou:|acrescenta uma parte|\?|“/)
    }
  })
  it('não atribui padrões, constituição ou emoções de Mariana a outra pessoa', () => {
    const s = buildCerMapReadings([response('emocoes_recorrentes', ['medo'])], 'enr', 'Lia')
    expect(s.integration).toContain('O medo tende')
    expect(s.integration).not.toMatch(/Vata|Kapha|resposta de luta|ansiedade|dedicação às pessoas/)
  })
  it('usa a revisão compartilhada mais recente e ignora rascunhos, privados e outras pessoas', () => {
    const s = buildCerMapReadings(
      [
        response('emocoes_recorrentes', ['medo'], { id: 'old', updated: '2026-10-01' }),
        response('emocoes_recorrentes', ['ansiedade_apreensao'], { id: 'new' }),
        response('emocoes_recorrentes', ['medo'], {
          id: 'draft',
          status: 'draft',
          updated: '2026-10-10',
        }),
        response('resposta_tendencia', ['resolver_imediatamente'], {
          access_class: 'participant_private',
        }),
        response('resposta_tendencia', ['resolver_imediatamente'], { enrollment_id: 'other' }),
      ],
      'enr',
      'Lia',
    )
    expect(s.integration).toContain('A ansiedade')
    expect(s.integration).not.toMatch(/O medo tende|resposta de luta/)
  })
  it('não classifica narrativa livre nem usa a negativa como evidência de padrão', () => {
    const s = buildCerMapReadings(
      [response('self_dialogue_erro', '', { free_text: 'Não sou hipervigilante nem prestativa.' })],
      'enr',
      'Lia',
    )
    expect(s.integration).toBe('')
    expect(s.dimensions[1].detailedRows.length).toBeGreaterThan(0)
  })
  it('preserva a ordem constitucional e não reduz uma base tridosha a um par', () => {
    const s = createDemoCerMapReading()
    const body = s.dimensions.find((d) => d.id === 'corpo')!
    body.ayurvedaConstitution = ['Pitta', 'Vata']
    expect(applyFunctionalReading(s, []).integration).toContain('base Pitta–Vata')
    body.ayurvedaConstitution = ['Vata', 'Pitta', 'Kapha']
    expect(applyFunctionalReading(s, []).integration).not.toContain('sua base Vata–Pitta reúne')
    body.ayurvedaConstitution = ['Vata', 'Pitta']
    body.ayurvedaReading!.currentDoshas = ['Vata', 'Pitta', 'Kapha']
    expect(applyFunctionalReading(s, []).integration).not.toContain('momento Vata–Kapha combina')
  })
  it('não altera o snapshot ou os registros de origem', () => {
    const s = createDemoCerMapReading()
    const before = JSON.stringify(s)
    applyFunctionalReading(s, [])
    expect(JSON.stringify(s)).toBe(before)
  })
})
