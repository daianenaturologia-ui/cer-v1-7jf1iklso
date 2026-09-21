import { describe, it, expect } from 'vitest'
import {
  SIX_CANONICAL_DIMENSIONS,
  INTEGRACAO_EXPERIENCE_ID,
} from '../components/ProfessionalConscienciaSection'

describe('Organização da Consciência Profissional em Três Níveis', () => {
  it('apresenta exatamente as seis dimensões canônicas no Nível 1 e Nível 3', () => {
    expect(SIX_CANONICAL_DIMENSIONS.length).toBe(6)

    const ids = SIX_CANONICAL_DIMENSIONS.map((d) => d.id)
    expect(ids).toEqual([
      'corpo_fisiologia',
      'mente_emocoes',
      'regulacao_respostas',
      'relacoes',
      'sexualidade',
      'sentido_conexao',
    ])

    const names = SIX_CANONICAL_DIMENSIONS.map((d) => d.name)
    expect(names).toEqual([
      'Corpo & Fisiologia',
      'Mente & Emoções',
      'Regulação & Padrões de Resposta',
      'Relações & Vínculos',
      'Sexualidade & Intimidade',
      'Sentido & Conexão',
    ])
  })

  it('integração 07g não é sétima dimensão, mas síntese complementar separada', () => {
    const isSeven = SIX_CANONICAL_DIMENSIONS.some((d) => d.id === 'integracao')
    expect(isSeven).toBe(false)
    expect(INTEGRACAO_EXPERIENCE_ID).toBe('exp-integracao-consciencia-07g')
  })
})
