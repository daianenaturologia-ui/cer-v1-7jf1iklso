import { beforeEach, describe, expect, it, vi } from 'vitest'
import { questionnaireRecordId } from './liveQuestionnaire'
import { experienceResponseService } from './experienceEngine'
import { blendTintOnImageData, SKIN_TONES, renderAvatarToCanvas } from './avatarCompositor'

const mocks = vi.hoisted(() => ({ send: vi.fn(), getFirstListItem: vi.fn(), create: vi.fn(), update: vi.fn(), getFullList: vi.fn() }))
vi.mock('@/lib/pocketbase/client', () => ({ default: { ...mocks, collection: () => mocks, filter: (query: string, args: unknown) => JSON.stringify({ query, args }), authStore: { record: { id: 'realuser1234567' } } } }))
vi.mock('@/services/demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))

const logicalExperience = 'exp-corpo-fisiologia-07b'
const logicalPrompt = 'ayv_c1_p1_estrutura_corporal'
const experience = questionnaireRecordId('experience', logicalExperience)
const prompt = questionnaireRecordId('prompt', logicalPrompt)
const params = { enrollmentId: 'realenroll12345', experienceId: logicalExperience, promptId: logicalPrompt, respondentUserId: 'realuser1234567', responseType: 'ChoiceCards' as const, promptVersion: 1, structuredValue: { choice: 'intermediate' } }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.send.mockResolvedValue({ experience_id: experience, prompt_id: prompt })
  mocks.getFirstListItem.mockRejectedValue({ status: 404 })
  mocks.create.mockImplementation(async (data: any) => ({ ...data, id: 'response1234567', expand: { prompt_id: { schema_config: { cer_logical_prompt_id: logicalPrompt } } } }))
})

describe('Non-demo questionnaire persistence', () => {
  it('writes valid backend relations and returns the original logical question for resume', async () => {
    const saved = await experienceResponseService.saveResponse(params)
    expect(mocks.send).toHaveBeenCalledWith('/backend/v1/cer/questionnaires/prepare', expect.objectContaining({ body: expect.objectContaining({ prompt_id: logicalPrompt }) }))
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ experience_id: experience, prompt_id: prompt, enrollment_id: params.enrollmentId }), expect.anything())
    expect(experience).toMatch(/^[a-z0-9]{15}$/)
    expect(saved.prompt_id).toBe(logicalPrompt)
    expect(saved.experience_id).toBe(logicalExperience)
  })
  it('reads the real experience and restores revision question identifiers', async () => {
    const revised = logicalPrompt + '_rev2'
    mocks.getFullList.mockResolvedValue([{ experience_id: experience, prompt_id: questionnaireRecordId('prompt', revised), expand: { prompt_id: { schema_config: { cer_logical_prompt_id: revised } } }, structured_value: { revision_number: 2 } }])
    const records = await experienceResponseService.listResponsesByExperience(params.enrollmentId, logicalExperience)
    expect(mocks.getFullList.mock.calls[0][0].filter).toContain(experience)
    expect(records[0].prompt_id).toBe(revised)
  })
  it('never treats an unavailable server as an empty answer set', async () => {
    mocks.getFirstListItem.mockRejectedValue({ status: 503 })
    await expect(experienceResponseService.saveResponse(params)).rejects.toMatchObject({ status: 503 })
    expect(mocks.create).not.toHaveBeenCalled()
    mocks.getFullList.mockRejectedValue({ status: 503 })
    await expect(experienceResponseService.listResponsesByExperience(params.enrollmentId, logicalExperience)).rejects.toMatchObject({ status: 503 })
  })
  it('supports unbound recovery save callbacks used by chapter revisions', async () => {
    const save = experienceResponseService.saveResponse
    await expect(save(params)).resolves.toMatchObject({ prompt_id: logicalPrompt })
  })
})

describe('Dark skin remains chromatic', () => {
  it('a late old render cannot overwrite the latest selected tone', async () => {
    const images: any[] = []
    const ctx = { clearRect: vi.fn(), drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([239, 169, 113, 255]) })), putImageData: vi.fn() }
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(ctx as any)
    vi.spyOn(document, 'createElement').mockImplementation(() => ({ getContext: () => ctx } as any))
    vi.stubGlobal('Image', class { onload?: () => void; set src(_value: string) { images.push(this) } })
    try {
      const first = renderAvatarToCanvas({ presentation: 'feminine', structure: 'intermediate', skinTone: 'skin_01', hairColor: 'hair_dark_brown' }, canvas)
      const latest = renderAvatarToCanvas({ presentation: 'feminine', structure: 'intermediate', skinTone: 'skin_06', hairColor: 'hair_dark_brown' }, canvas)
      images.slice(3).forEach(image => image.onload())
      await latest
      images.slice(0, 3).forEach(image => image.onload())
      await first
      expect(ctx.putImageData).toHaveBeenCalledOnce()
    } finally { vi.unstubAllGlobals(); vi.restoreAllMocks() }
  })

  it('preserves the brown hue even at highlights and leaves clothes unchanged', () => {
    for (const tone of SKIN_TONES) {
      const image = { data: new Uint8ClampedArray([239, 169, 113, 255, 250, 250, 250, 255, 250, 250, 250, 255]) } as ImageData
      const mask = { data: new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0]) } as ImageData
      blendTintOnImageData(image, mask, tone.hex)
      expect(image.data[0]).toBeGreaterThan(image.data[1])
      expect(image.data[1]).toBeGreaterThan(image.data[2])
      expect([...image.data.slice(8)]).toEqual([250, 250, 250, 255])
      if (tone.id === 'skin_06') {
        expect(image.data[0] / image.data[2]).toBeGreaterThan(2)
        expect(image.data[4]).toBeLessThan(100)
      }
    }
  })
})
