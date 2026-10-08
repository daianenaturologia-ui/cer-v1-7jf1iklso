import { describe, expect, it } from 'vitest'
import {
  buildCerMapReadings,
  consciousnessCoverage,
  isCerMapReadingSnapshot,
  unreviewedMapReadings,
} from './cerMapReadings'
import { BUILD_07C_REGULACAO_PROMPTS } from './build07cPrompts'
import { formatPromptResponse } from '@/components/experience/formatPromptResponse'
const prompt = BUILD_07C_REGULACAO_PROMPTS.find(
  (p) => (p.schema_config as any).prompt_key === 'resposta_tendencia',
)!
function response(overrides: any = {}) {
  return {
    id: 'resp',
    enrollment_id: 'enr',
    experience_id: prompt.experience_id,
    prompt_id: prompt.id,
    access_class: 'shared_care',
    status: 'saved',
    created: '2026-10-01',
    updated: '2026-10-01',
    structured_value: {
      value: (prompt.schema_config as any).options.slice(0, 2).map((o: any) => o.id),
    },
    ...overrides,
  } as any
}
describe('Documento das duas versões: respostas literais, privacidade e revisão', () => {
  it('mantém as duas reações escolhidas com seus nomes', () => {
    const document = buildCerMapReadings([response()], 'enr', 'Teste')
    const reading = document.dimensions.find((d) => d.id === 'regulacao')!
    for (const option of (prompt.schema_config as any).options.slice(0, 2))
      expect(reading.detailedRows.map((r) => r.text).join()).toContain(option.title)
    expect(reading.detailedRows[0].sourceResponseId).toBe('resp')
    expect(reading.personalSections?.[0].text).toContain('Você reconhece o movimento')
  })
  it('exclui registros privados, rascunhos e de outra interagente', () => {
    const document = buildCerMapReadings(
      [
        response({ access_class: 'participant_private', free_text: 'PRIVADO' }),
        response({ enrollment_id: 'outra', free_text: 'OUTRA' }),
        response({ status: 'draft', free_text: 'RASCUNHO' }),
      ],
      'enr',
      'Teste',
    )
    expect(JSON.stringify(document)).not.toMatch(/PRIVADO|OUTRA|RASCUNHO/)
    expect(document.dimensions.every((d) => !d.summaryRows.length && !d.detailedRows.length)).toBe(
      true,
    )
  })
  it('não transforma ausência de respostas em achados individuais', () => {
    const document = buildCerMapReadings([], 'enr', 'Teste')
    expect(document.integration).toBe('')
    expect(document.history).toBe('')
    expect(document.dimensions.every((d) => d.summary === '' && d.interpretation === '')).toBe(true)
    expect(document.dimensions[0].ayurvedaConstitution).toBeUndefined()
    expect(isCerMapReadingSnapshot(document)).toBe(true)
    const malformed = structuredClone(document)
    ;(malformed.dimensions[0] as any).ayurvedaConstitution = 'Vata'
    expect(isCerMapReadingSnapshot(malformed)).toBe(false)
    ;(malformed.dimensions[0] as any).ayurvedaConstitution = ['unknown']
    expect(isCerMapReadingSnapshot(malformed)).toBe(false)
    expect(isCerMapReadingSnapshot({ ...document, references: [{}] })).toBe(false)
    expect(
      isCerMapReadingSnapshot({ ...document, dimensions: Array(6).fill(document.dimensions[0]) }),
    ).toBe(false)
  })
  it('nova versão remove revisão sem mudar o documento anterior', () => {
    const original = {
      ...buildCerMapReadings([], 'enr', 'Teste'),
      reviewedBy: 'prof',
      reviewedAt: '2026-10-01',
    }
    const next = unreviewedMapReadings(original)
    next.dimensions[0].summary = 'Novo texto'
    expect(next.reviewedBy).toBeUndefined()
    expect(original.reviewedBy).toBe('prof')
    expect(original.dimensions[0].summary).toBe('')
  })
  it('contabiliza aliases do percurso e progresso concluído', () => {
    expect(
      consciousnessCoverage([response({ experience_id: 'regulacao_respostas' })])[2].started,
    ).toBe(true)
  })
  it('não repete texto livre equivalente com espaços e quebras de linha', () => {
    expect(
      formatPromptResponse(
        undefined,
        response({ structured_value: { value: 'Texto\n de teste' }, free_text: 'Texto de teste' }),
      ),
    ).toBe('Texto\n de teste')
  })
})

it('preserva o texto de relatos antigos e seus nomes salvos sem expor IDs', () => {
  expect(
    formatPromptResponse(
      undefined,
      response({
        structured_value: { title: 'Texto salvo anteriormente', prompt_key: 'chave_interna' },
      }),
    ),
  ).toBe('Texto salvo anteriormente')
  expect(
    formatPromptResponse(
      prompt,
      response({
        structured_value: {
          selectedOptionIds: ['opcao_antiga'],
          selected: ['Nome salvo da resposta'],
        },
      }),
    ),
  ).toBe('Nome salvo da resposta')
})
