import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

function run(kind: string, horizon: string, title = 'Meu próximo passo') {
  const handlers: ((event: unknown) => void)[] = []
  vm.runInNewContext(readFileSync('pocketbase/hooks/on_cer_life_direction.js', 'utf8'), {
    onRecordCreateRequest: (handler: (event: unknown) => void) => handlers.push(handler),
    onRecordUpdateRequest: () => {},
    BadRequestError: Error,
  })
  let next = false
  let queries = 0
  handlers[0]({
    record: { getString: (key: string) => ({ kind, horizon, title })[key] || '' },
    app: {
      findRecordsByFilter: () => {
        queries++
        return []
      },
    },
    next: () => {
      next = true
    },
  })
  return { next, queries }
}
it('permite direção futura provisória antes das seis dimensões sem consultar conclusão', () => {
  expect(run('future', 'open')).toEqual({ next: true, queries: 0 })
})
it('mantém validação de horizonte e tamanho, e requisito para leitura do presente', () => {
  expect(() => run('present', 'now')).toThrow(/seis dimensões/)
  expect(() => run('future', 'now')).toThrow(/horizonte/)
  expect(() => run('future', 'open', '')).toThrow(/título/)
  expect(() => run('future', 'open', 'a'.repeat(161))).toThrow(/160/)
})
