import { beforeEach, expect, it, vi } from 'vitest'
import { selfDevelopmentService, type DevelopmentInput } from './selfDevelopment'
import { DEVELOPMENT_CATALOG } from './developmentCatalog'
import { demoAdapter, DEMO_ENROLLMENT_ID } from './demoAdapter'
import { lifeDirectionsService } from './lifeDirections'
const backend = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Unexpected backend call')
  }),
)
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: backend, authStore: {} } }))
const input: DevelopmentInput = {
  enrollment_id: DEMO_ENROLLMENT_ID,
  direction_id: '',
  resource_snapshot: DEVELOPMENT_CATALOG[0],
  goal: 'Ter espaço',
  action: 'Observar meu melhor horário',
  context: 'Depois do almoço',
  fallback: 'Observar um momento',
  signal: '',
  scheduled_at: '',
  reflection: '',
  next_step: '',
  status: 'planned',
  access_class: 'participant_private',
}
beforeEach(() => {
  localStorage.clear()
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('mariana')
  vi.restoreAllMocks()
  backend.mockClear()
})
it('percorre planejar, executar, pausar, retomar e revisar sem plano clínico ou convite', async () => {
  let record = await selfDevelopmentService.save(input)
  for (const status of ['experimenting', 'paused', 'planned', 'completed'] as const)
    record = await selfDevelopmentService.save({ ...record, status }, record.id)
  record = await selfDevelopmentService.save(
    {
      ...record,
      status: 'reviewed',
      reflection: 'Preciso de um bloco menor',
      next_step: 'Preparar o material',
    },
    record.id,
  )
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0]).toEqual(record)
  expect(record.created).toBeTruthy()
  expect(backend).not.toHaveBeenCalled()
  expect(demoAdapter.listPlans(DEMO_ENROLLMENT_ID)).toHaveLength(0)
})
it('privado não aparece à profissional; compartilhar e revogar são escolhas da pessoa', async () => {
  const record = await selfDevelopmentService.save(input)
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
  await expect(
    selfDevelopmentService.save({ ...record, status: 'completed' }, record.id),
  ).rejects.toThrow('interagente')
  demoAdapter.setActivePersona('mariana')
  const shared = await selfDevelopmentService.save(
    { ...record, access_class: 'participant_shared' },
    record.id,
  )
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([shared])
  demoAdapter.setActivePersona('mariana')
  await selfDevelopmentService.save({ ...shared, access_class: 'participant_private' }, record.id)
  demoAdapter.setActivePersona('daiane')
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
})
it('recusa outra matrícula e futura origem de outra pessoa sem escrita', async () => {
  await expect(selfDevelopmentService.save({ ...input, enrollment_id: 'other' })).rejects.toThrow()
  vi.spyOn(lifeDirectionsService, 'list').mockResolvedValue([
    { id: 'f', enrollment_id: 'other', kind: 'future' } as any,
  ])
  await expect(selfDevelopmentService.save({ ...input, direction_id: 'f' })).rejects.toThrow(
    'futuro',
  )
  expect(await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).toEqual([])
})
it('preserva aprendizado concluído e conteúdo da tentativa, inclusive após publicação nova', async () => {
  const old = await selfDevelopmentService.save(input)
  await expect(
    selfDevelopmentService.save({ ...old, resource_snapshot: DEVELOPMENT_CATALOG[1] }, old.id),
  ).rejects.toThrow('preservados')
  const reviewed = await selfDevelopmentService.save(
    { ...old, status: 'reviewed', reflection: 'Uma pista importante' },
    old.id,
  )
  await expect(
    selfDevelopmentService.save({ ...reviewed, action: 'Outra ação' }, old.id),
  ).rejects.toThrow('preservada')
  const next = await selfDevelopmentService.save({ ...input, action: 'Uma nova tentativa' })
  expect(next.id).not.toBe(old.id)
  expect(
    (await selfDevelopmentService.list(DEMO_ENROLLMENT_ID)).find((r) => r.id === old.id)
      ?.reflection,
  ).toBe(reviewed.reflection)
})
it('falha ao salvar mantém registro anterior e não permite revisão vazia', async () => {
  const saved = await selfDevelopmentService.save(input)
  await expect(
    selfDevelopmentService.save({ ...saved, status: 'reviewed' }, saved.id),
  ).rejects.toThrow('aprendeu')
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota')
  })
  await expect(
    selfDevelopmentService.save({ ...saved, action: 'Alterado' }, saved.id),
  ).rejects.toThrow('quota')
  spy.mockRestore()
  expect((await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].action).toBe(input.action)
})
it('acervo inicial funciona sem backend; publicação educativa é única e rascunho não aparece', async () => {
  expect((await selfDevelopmentService.catalog()).resources).toHaveLength(
    DEVELOPMENT_CATALOG.length,
  )
  demoAdapter.setActivePersona('daiane')
  const { id, ...resource } = DEVELOPMENT_CATALOG[0]
  const draft = await selfDevelopmentService.saveResource({
    ...resource,
    title: 'Recurso autoral',
    status: 'draft',
  })
  expect((await selfDevelopmentService.catalog()).resources).toHaveLength(
    DEVELOPMENT_CATALOG.length,
  )
  const published = await selfDevelopmentService.saveResource(
    { ...resource, title: 'Recurso autoral', status: 'published' },
    draft.id,
  )
  demoAdapter.setActivePersona('mariana')
  expect(
    (await selfDevelopmentService.catalog()).resources.some((r) => r.id === published.id),
  ).toBe(true)
  await expect(
    selfDevelopmentService.saveResource({ ...resource, status: 'published' }),
  ).rejects.toThrow('profissional')
  demoAdapter.setActivePersona('daiane')
  await expect(
    selfDevelopmentService.saveResource({ ...resource, status: 'draft' }, published.id),
  ).rejects.toThrow('versão')
  await selfDevelopmentService.archiveResource(published.id)
  demoAdapter.setActivePersona('mariana')
  expect((await selfDevelopmentService.catalog()).resources).toHaveLength(
    DEVELOPMENT_CATALOG.length,
  )
  expect(backend).not.toHaveBeenCalled()
})
it('rascunho incompleto não entra no catálogo e metadados ficam preservados na tentativa', async () => {
  demoAdapter.setActivePersona('daiane')
  const draft = await selfDevelopmentService.saveResource({
    title: 'Áudio futuro',
    theme: 'Pausa',
    duration: '',
    lesson: '',
    instructions: [],
    fallback: '',
    reflection: '',
    status: 'draft',
    material: { format: 'audio', url: '', author: 'Teste', references: '', conditions: '' },
  })
  await expect(
    selfDevelopmentService.saveResource({ ...draft, status: 'published' }, draft.id),
  ).rejects.toThrow()
  const published = await selfDevelopmentService.saveResource(
    {
      ...draft,
      lesson: 'Aprender a pausar',
      instructions: ['Ouça se desejar'],
      material: { ...draft.material!, url: 'https://example.org/ficcao.mp3' },
      status: 'published',
    },
    draft.id,
  )
  demoAdapter.setActivePersona('mariana')
  const resource = (await selfDevelopmentService.catalog()).resources.find(
    (r) => r.id === published.id,
  )!
  const attempt = await selfDevelopmentService.save({ ...input, resource_snapshot: resource })
  demoAdapter.setActivePersona('daiane')
  await selfDevelopmentService.archiveResource(published.id)
  demoAdapter.setActivePersona('mariana')
  expect(
    (await selfDevelopmentService.catalog()).resources.some((r) => r.id === published.id),
  ).toBe(false)
  expect(
    (await selfDevelopmentService.list(DEMO_ENROLLMENT_ID))[0].resource_snapshot.material,
  ).toEqual(resource.material)
  await expect(
    selfDevelopmentService.save(
      {
        ...attempt,
        resource_snapshot: {
          ...resource,
          material: { ...resource.material!, url: 'https://example.org/outro.mp3' },
        },
      },
      attempt.id,
    ),
  ).rejects.toThrow('preservados')
})
