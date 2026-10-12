import { beforeEach, expect, it, vi } from 'vitest'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_MARIANA } from './demoAdapter'
import { professionalQuestionnaireResponses } from './professionalQuestionnaireRead'
import { currentProfessionalInterpretation } from './currentProfessionalInterpretation'
import { BUILD_07E_SEXUALIDADE_PROMPTS } from './build07ePrompts'
import { strongestMindPatterns } from './cerMindConversation'
import { consciousnessCoverage } from './cerMapReadings'
import { AYV_C4_COMPLETION } from './ayurvedaChapter4'
vi.mock('@/lib/pocketbase/client', () => ({ default: { collection: vi.fn(() => { throw new Error('No live calls') }) } }))
beforeEach(() => { localStorage.clear(); demoAdapter.resetToDefaultState(); demoAdapter.enableDemo('mariana') })
const save = (prompt: string, accessClass = 'shared_care', structuredValue: any = {value:'test'}) => demoAdapter.saveExperienceResponse({
  enrollmentId: DEMO_ENROLLMENT_ID, experienceId: 'exp-sexualidade-07e', promptId: prompt,
  respondentUserId: DEMO_USER_MARIANA.id, responseType: 'FreeReflection', promptVersion: 1,
  accessClass, structuredValue, freeText: 'FICTITIOUS_PRIVATE_CONTROL' })
it('leaving demonstration preserves answers, versions and professional work across reentry', () => {
  const original = save('test'); save('test', 'shared_care', {value:'changed'})
  const snapshot = localStorage.getItem('cer_demo_mode_state_v3')
  demoAdapter.disableDemo()
  expect(demoAdapter.isEnabled()).toBe(false)
  expect(localStorage.getItem('cer_demo_mode_state_v3')).toBe(snapshot)
  demoAdapter.enableDemo('mariana')
  expect(demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID)).toContainEqual(expect.objectContaining({id:original.id,version:2}))
  expect(demoAdapter.listExperienceResponseVersions(DEMO_ENROLLMENT_ID)).toHaveLength(1)
})
it('professional demo reads exclude private, drafts and private historical snapshots', () => {
  const privateRecord = save('private', 'participant_private')
  save('private', 'participant_private', {value:'another'})
  const shared = save('shared')
  save('mixed', 'shared_care', {private_text:'secret',share_private_text_with_professional:false})
  demoAdapter.setActivePersona('daiane')
  expect(demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID).map(r => r.id)).toEqual([shared.id])
  expect(demoAdapter.listExperienceResponseVersions(DEMO_ENROLLMENT_ID)).toEqual([])
  demoAdapter.setActivePersona('mariana')
  expect(demoAdapter.listExperienceResponses(DEMO_ENROLLMENT_ID).map(r => r.id)).toContain(privateRecord.id)
})
it('literal professional reports restore canonical prompt labels and reject unshared text', () => {
  const prompt = BUILD_07E_SEXUALIDADE_PROMPTS.find(p => (p.schema_config as any).access_destination !== 'participant_private' && (p.schema_config as any).options?.length)!
  const option = (prompt.schema_config as any).options[0]
  const response = save(prompt.id, 'shared_care', {value:option.id,prompt_key:(prompt.schema_config as any).prompt_key})
  const privateRecord = save('other', 'participant_private')
  const records = professionalQuestionnaireResponses([response,privateRecord],DEMO_ENROLLMENT_ID)
  expect(records).toHaveLength(1)
  expect(records[0].expand?.prompt_id?.prompt_text).toBe(prompt.prompt_text)
  const report = currentProfessionalInterpretation('sexualidade',records,'Lia')
  expect(report.observedEvidences.join(' ')).toContain(option.title)
  expect(report.deepSynthesis).not.toContain('Comunicação sutil de preferências e limites')
})
it('the first body chapter cannot count as a completed dimension', () => {
  const progress = [{experience_id:'exp-corpo-fisiologia-07b',progress_status:'completed'}] as any
  expect(consciousnessCoverage([{ ...save('c1'), experience_id:'exp-corpo-fisiologia-07b', structured_value:{completed:true,chapter_id:'c1'} }],progress)[0].completed).toBe(false)
  const completion = { ...save('c4'), experience_id:'exp-corpo-fisiologia-07b',prompt_key:AYV_C4_COMPLETION.key,structured_value:{completed:true} }
  expect(consciousnessCoverage([completion],progress)[0].completed).toBe(true)
})
it('participant selected interference takes precedence over arbitrary intensity ties', () => {
  const dimension = { detailedRows: ['insistente','prestativo','hipervigilante','hiper_realizador'].map(label=>({label,text:'Repete-se com frequência'})) } as any
  expect(strongestMindPatterns(dimension,['prestativo','hiper_realizador','hipervigilante']).keys).toEqual(['prestativo','hipervigilante','hiper_realizador'])
})

it('distinct priorities created in the same millisecond never inherit each others acceptance', () => {
  demoAdapter.setActivePersona('daiane')
  vi.spyOn(Date, 'now').mockReturnValue(123456789)
  const plan = demoAdapter.createDraftPlan({enrollment_id:DEMO_ENROLLMENT_ID,direction_mode:'authored',direction_statement:'Test'})
  const first = demoAdapter.addPriority({plan_id:plan.id,title:'First'})
  const second = demoAdapter.addPriority({plan_id:plan.id,title:'Second'})
  expect(first.id).not.toBe(second.id)
  vi.restoreAllMocks()
})
