import { beforeEach, expect, it, vi } from 'vitest'
import { buildIntegratedAyurvedaQaFixture } from './conscienciaQaFixture'
const storeKey = 'cer_demo_mode_state_v3'
async function reload() {
  vi.resetModules()
  return (await import('./demoAdapter')).demoAdapter
}
beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})
it('mantém respostas das seis dimensões, versões, saída e troca de persona após recarga', async () => {
  let demo = await reload()
  demo.enableDemo('mariana')
  const fixture = buildIntegratedAyurvedaQaFixture()
  for (const r of fixture.responses)
    demo.saveExperienceResponse({
      enrollmentId: r.enrollment_id,
      experienceId: r.experience_id,
      promptId: r.prompt_id,
      respondentUserId: r.respondent_user_id,
      responseType: r.response_type,
      promptVersion: r.prompt_version,
      structuredValue: r.structured_value,
      freeText: r.free_text,
      accessClass: r.access_class,
      promptKey: (r as any).prompt_key,
      canonicalPromptId: (r as any).canonical_prompt_id,
    })
  const before = demo.listExperienceResponses('demo-enr-01')
  expect(new Set(before.map((r) => r.experience_id)).size).toBeGreaterThanOrEqual(6)
  demo.setActivePersona('daiane')
  demo.setActivePersona('mariana')
  demo.disableDemo()
  demo = await reload()
  demo.enableDemo('mariana')
  const restored = demo.listExperienceResponses('demo-enr-01')
  expect(restored.map((r) => r.id)).toEqual(before.map((r) => r.id))
  for (const r of before) {
    const saved = restored.find((x) => x.id === r.id)!
    expect(saved.free_text).toBe(r.free_text)
    expect((saved.structured_value as any)?.value).toEqual((r.structured_value as any)?.value)
    expect((saved.structured_value as any)?.selectedOptionIds).toEqual(
      (r.structured_value as any)?.selectedOptionIds,
    )
  }
  demo = await reload()
  demo.enableDemo('mariana')
  expect(demo.listExperienceResponses('demo-enr-01')).toEqual(restored)
})
it('importa v1 e v2 sem apagar os originais nem perder os registros que existem em v3', async () => {
  const records = buildIntegratedAyurvedaQaFixture().responses
  const state = (rows: any[]) => ({
    experienceResponses: rows,
    enrollmentExperienceProgress: {},
    activePersona: 'mariana',
  })
  const v1 = JSON.stringify(state(records.slice(0, 2)))
  const v2 = JSON.stringify(state(records.slice(2, 4)))
  localStorage.setItem('cer_demo_mode_state_v1', v1)
  localStorage.setItem('cer_demo_mode_state_v2', v2)
  localStorage.setItem(storeKey, JSON.stringify(state(records.slice(4, 6))))
  let demo = await reload()
  demo.enableDemo('mariana')
  expect(
    demo
      .listExperienceResponses('demo-enr-01')
      .map((r) => r.id)
      .sort(),
  ).toEqual(
    records
      .slice(0, 6)
      .map((r) => r.id)
      .sort(),
  )
  expect(localStorage.getItem('cer_demo_mode_state_v1')).toBe(v1)
  expect(localStorage.getItem('cer_demo_mode_state_v2')).toBe(v2)
  demo = await reload()
  demo.enableDemo('mariana')
  expect(demo.listExperienceResponses('demo-enr-01')).toHaveLength(6)
})
it('cache ilegível é preservado e nunca substituído por uma jornada vazia', async () => {
  localStorage.setItem(storeKey, 'original ilegível')
  const demo = await reload()
  expect(() => demo.enableDemo('mariana')).toThrow(/recuperar os registros/)
  expect(localStorage.getItem(storeKey)).toBe('original ilegível')
})
it('falha de gravação não informa sucesso nem altera a versão em memória', async () => {
  const demo = await reload()
  demo.enableDemo('mariana')
  const input = {
    enrollmentId: 'demo-enr-01',
    experienceId: 'exp-relacoes-07d',
    promptId: 'test',
    respondentUserId: 'demo-user-mariana',
    responseType: 'FreeReflection',
    promptVersion: 1,
    freeText: 'Original',
  }
  demo.saveExperienceResponse(input)
  const original = localStorage.getItem(storeKey)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage unavailable')
  })
  expect(() => demo.saveExperienceResponse({ ...input, freeText: 'Nova' })).toThrow(
    'Storage unavailable',
  )
  expect(demo.listExperienceResponses('demo-enr-01')[0].free_text).toBe('Original')
  expect(localStorage.getItem(storeKey)).toBe(original)
})

it('cria revisão do mapa QA sem alterar o publicado e preserva a hipótese na recarga', async () => {
  let demo = await reload()
  demo.enableDemo('daiane')
  demo.setActiveScenario('qa_consciencia_completa')
  const published = demo.getCurrentPublishedMap('demo-enr-01')!
  const draft = demo.createNextDraftFromPublished(published.id, 'demo-user-daiane')
  const original = structuredClone(demo.getCurrentPublishedMap('demo-enr-01')!)
  expect(draft.status).toBe('draft')
  expect(draft.version_number).toBe(2)
  const loaded = demo.getDraftMap('demo-enr-01')!
  expect(loaded.items.every((item) => item.map_id === draft.id)).toBe(true)
  expect(loaded.reading_snapshot?.reviewedAt).toBeUndefined()
  expect(demo.createNextDraftFromPublished(published.id, 'demo-user-daiane').id).toBe(draft.id)
  const snapshot = structuredClone(loaded.reading_snapshot!)
  snapshot.lifeConnections = [
    {
      eventId: 'fictional',
      responseId: snapshot.sourceResponseIds[0],
      text: 'Simulação: hipótese para conversar',
      question: 'Faz sentido?',
      recognition: 'Ainda não sabe',
      resources: 'Apoio fictício',
      priority: 'Pedir apoio',
    },
  ]
  demo.saveMapReadingSnapshot(draft.id, snapshot)
  demo = await reload()
  demo.enableDemo('daiane')
  expect(demo.getDraftMap('demo-enr-01')?.reading_snapshot?.lifeConnections).toEqual(
    snapshot.lifeConnections,
  )
  expect(demo.getCurrentPublishedMap('demo-enr-01')).toEqual(original)
  expect(() => demo.createNextDraftFromPublished('unknown', 'demo-user-daiane')).toThrow()
})
it('falha ao gravar a revisão não deixa um rascunho fantasma', async () => {
  const demo = await reload()
  demo.enableDemo('daiane')
  demo.setActiveScenario('qa_consciencia_completa')
  const published = demo.getCurrentPublishedMap('demo-enr-01')!
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  expect(() => demo.createNextDraftFromPublished(published.id, 'demo-user-daiane')).toThrow('quota')
  expect(demo.getDraftMap('demo-enr-01')).toBeNull()
})
