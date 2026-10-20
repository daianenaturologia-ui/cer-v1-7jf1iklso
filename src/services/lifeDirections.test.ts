import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  lifeDirectionsService,
  sharedLifeDirections,
  validateLifeDirection,
  type LifeDirectionInput,
} from './lifeDirections'
import { lifeTimelineService, demoLifeEvents } from './lifeTimeline'
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => true } }))
const input: LifeDirectionInput = {
  enrollment_id: 'mariana',
  kind: 'future',
  horizon: 'open',
  title: 'Mais espaço para mim',
  narrative: '',
  meaning: '',
  resources: 'Rede de apoio',
  limits: '',
  first_step: '',
  access_class: 'participant_private',
}
beforeEach(() => {
  localStorage.clear()
  demoLifeEvents.clear()
  vi.restoreAllMocks()
})
describe('Linha da Vida: novas etapas e persistência', () => {
  it('preserva registro, identidade e data inicial após releitura e edição', async () => {
    const saved = await lifeDirectionsService.save(input)
    expect(await lifeDirectionsService.list('mariana')).toEqual([saved])
    const edited = await lifeDirectionsService.save({ ...input, horizon: 'short' }, saved.id)
    expect(edited.id).toBe(saved.id)
    expect(edited.created).toBe(saved.created)
    expect((await lifeDirectionsService.list('mariana'))[0].horizon).toBe('short')
    expect(await lifeDirectionsService.list('outra')).toEqual([])
  })
  it('não oferece registros privados ou de outra pessoa como fontes do mapa', async () => {
    const privateRecord = await lifeDirectionsService.save(input)
    const shared = { ...privateRecord, access_class: 'participant_shared' as const }
    expect(
      sharedLifeDirections(
        [privateRecord, shared, { ...shared, enrollment_id: 'outra' }],
        'mariana',
      ),
    ).toEqual([shared])
  })
  it('permite futuro sem prazo e impede horizontes incompatíveis com o presente', () => {
    expect(() => validateLifeDirection(input)).not.toThrow()
    expect(() => validateLifeDirection({ ...input, kind: 'present' })).toThrow()
    expect(() => validateLifeDirection({ ...input, kind: 'present', horizon: 'now' })).not.toThrow()
    expect(() => validateLifeDirection({ ...input, title: '  ' })).toThrow()
  })
  it('falha de armazenamento não informa sucesso nem substitui o registro anterior', async () => {
    const saved = await lifeDirectionsService.save(input)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    await expect(
      lifeDirectionsService.save({ ...input, title: 'Alterado' }, saved.id),
    ).rejects.toThrow('quota')
    spy.mockRestore()
    expect((await lifeDirectionsService.list('mariana'))[0].title).toBe(input.title)
  })
  it('preserva também acontecimentos do passado depois de limpar o cache em memória', async () => {
    const saved = await lifeTimelineService.save({
      enrollment_id: 'mariana',
      title: 'Encontro',
      time_kind: 'unknown',
      time_value: '',
      emotions: ['Alegria'],
      narrative: 'Um apoio importante',
      access_class: 'participant_private',
    })
    demoLifeEvents.clear()
    expect(await lifeTimelineService.list('mariana')).toEqual([saved])
  })
})

it('exclui a meta de forma recuperável sem perder outras metas ou misturar pessoas', async () => {
  const first = await lifeDirectionsService.save(input)
  const second = await lifeDirectionsService.save({ ...input, title: 'Outra meta' })
  await lifeDirectionsService.archive('mariana', first.id)
  expect((await lifeDirectionsService.list('mariana')).map((v) => v.id)).toEqual([second.id])
  expect(
    (await lifeDirectionsService.list('mariana', true)).find((v) => v.id === first.id)?.archived,
  ).toBe(true)
  await expect(lifeDirectionsService.archive('outra', second.id)).rejects.toThrow(
    'Meta não encontrada',
  )
  await lifeDirectionsService.archive('mariana', first.id, false)
  expect((await lifeDirectionsService.list('mariana')).map((v) => v.id)).toContain(first.id)
  const present = await lifeDirectionsService.save({ ...input, kind: 'present', horizon: 'now' })
  await expect(lifeDirectionsService.archive('mariana', present.id)).rejects.toThrow(
    'Meta não encontrada',
  )
})
