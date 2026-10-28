import { describe, it, expect } from 'vitest'
import { parseInitialIntake } from './initialIntake'
describe('Retomar respostas do relato inicial', () => {
  it('preserva respostas multilinha e campos omitidos', () => {
    expect(parseInitialIntake('O que a traz:\nPrimeira linha\nSegunda linha\n\nO que deseja cuidar:\nSono')).toEqual({ brings: 'Primeira linha\nSegunda linha', helps: '', cares: 'Sono' })
  })
  it('aceita mensagens legadas sem estrutura e quebras Windows', () => {
    expect(parseInitialIntake('Relato livre')).toEqual({ brings: 'Relato livre', helps: '', cares: '' })
    expect(parseInitialIntake('O que já a ajuda:\r\nCaminhar')).toEqual({ brings: '', helps: 'Caminhar', cares: '' })
  })
})
