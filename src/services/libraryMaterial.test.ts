import { expect, it } from 'vitest'
import { EMPTY_MATERIAL, filterLibrary, materialUrl, validateMaterial } from './libraryMaterial'
it('filtra por termos sem acento, tema e formato mantendo recursos de texto antigos', () => {
  const old = { title: 'Respiração', theme: 'Presença', lesson: 'Pausa possível' }
  const pdf = {
    ...old,
    title: 'Alimentação',
    material: { ...EMPTY_MATERIAL, format: 'pdf' as const },
  }
  expect(filterLibrary([old, pdf], 'respiracao presenca')).toEqual([old])
  expect(filterLibrary([old, pdf], '', 'pdf', 'Presença')).toEqual([pdf])
  expect(filterLibrary([old, pdf], '', 'video')).toEqual([])
})
it('recusa endereços executáveis ou com credenciais e publicação sem material', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,x',
    'http://example.org/x',
    'https://user:secret@example.org',
  ]) {
    expect(materialUrl(url)).toBeNull()
    expect(() => validateMaterial({ ...EMPTY_MATERIAL, url })).toThrow()
  }
  expect(() => validateMaterial({ ...EMPTY_MATERIAL, format: 'audio' }, false)).not.toThrow()
  expect(() => validateMaterial({ ...EMPTY_MATERIAL, format: 'audio' }, true)).toThrow('endereço')
  expect(() => validateMaterial(undefined, true)).not.toThrow()
})
