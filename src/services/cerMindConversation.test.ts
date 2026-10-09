import { expect, it } from 'vitest'
import { mindConversation, strongestMindPatterns } from './cerMindConversation'
import { createDemoCerMapReading } from './demoCerMapReading'
const dim = (ratings: Record<string, string>) =>
  ({ detailedRows: Object.entries(ratings).map(([label, text]) => ({ label, text })) }) as any
it('seleciona só três padrões pela intensidade ordinal e sinaliza empate no limite', () => {
  const d = dim({
    insistente: 'Repete-se com frequência',
    prestativo: 'Aparece com muita força quando estou sob pressão',
    hipervigilante: 'Aparece com muita força quando estou sob pressão',
    hiper_racional: 'Repete-se com frequência',
    critico: 'Repete-se com frequência',
  })
  expect(strongestMindPatterns(d)).toMatchObject({
    keys: ['prestativo', 'hipervigilante', 'hiper_racional'],
    tied: true,
    allStrong: false,
  })
  const text = mindConversation('Mariana', d, ['medo', 'ansiedade_apreensao'], {}, true)
  expect(text).toContain('Mariana, vamos olhar com carinho')
  expect(text).toContain('você destacou medo e ansiedade')
  expect(text).toContain('Prestativo, Hipervigilante e Analítico')
  expect(text).toContain('mesma intensidade')
  expect(text).toContain('seu lado analítico'.replace('seu', 'Seu'))
  expect(text).not.toMatch(/Insistente|Crítico|Você registrou:|exemplo fictício/)
})
it('não inventa intensidade para respostas desconhecidas, negativas ou seleção antiga', () => {
  expect(
    strongestMindPatterns(
      dim({
        prestativo: 'Ainda não sei dizer',
        hipervigilante: 'Quase nunca acontece comigo',
        hiper_racional: 'Informação ainda não disponível',
      }),
    ).keys,
  ).toEqual([])
  expect(mindConversation('Lia', dim({}), [], {}, false)).toBe('')
})
it('apresenta uma conversa sobre sobrecarga somente quando todos os padrões aparecem fortes', () => {
  const keys = [
    'prestativo',
    'hipervigilante',
    'hiper_racional',
    'insistente',
    'hiper_realizador',
    'vitima',
    'inquieto',
    'comandante',
    'evitativo',
    'critico',
  ]
  const text = mindConversation(
    'Lia',
    dim(Object.fromEntries(keys.map((k) => [k, 'Repete-se com frequência']))),
    [],
    {},
    false,
  )
  expect(text).toContain('se fizerem parte da sua história, experiências traumáticas')
  expect(text).not.toMatch(/você tem trauma|isso comprova|estresse elevado detectado/i)
  expect(
    mindConversation('Lia', dim({ prestativo: 'Repete-se com frequência' }), [], {}, false),
  ).not.toContain('traumáticas')
})
it('a demonstração menciona somente emoções reais e três padrões; gráficos continuam com todos', () => {
  const s = createDemoCerMapReading()
  const mind = s.dimensions.find((d) => d.id === 'mente')!
  expect(mind.interpretation).toContain('você destacou ansiedade e alegria e entusiasmo')
  expect(mind.interpretation).not.toContain('você destacou medo')
  expect(mind.interpretation).toContain('Prestativo, Hipervigilante e Analítico')
  expect(mind.interpretation).not.toContain('Insistente')
  expect(s.elementReadings!.insistente.sections).toHaveLength(5)
})
