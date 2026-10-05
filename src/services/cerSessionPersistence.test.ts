import { describe, expect, it, vi } from 'vitest'
import { demoAdapter } from './demoAdapter'
import { cerSessionService, cerSessionNoteService, cerSessionObservationService } from './cerSession'
import pb from '@/lib/pocketbase/client'
import { sessionMapUpdateService } from './sessionMapUpdate'
import { cerMapCandidateService } from './cerMapCandidateService'
describe('Sessões na demonstração', () => {
  it('edita a nota por ID preservando encontro e matrícula, congela ao concluir e não consulta backend', async () => {
    demoAdapter.enableDemo('daiane')
    const backend = vi.spyOn(pb, 'collection')
    const session = await cerSessionService.createScheduled('other-enrollment', '2026-10-06T13:00:00.000Z')
    const note = await cerSessionNoteService.create(session.id, 'Primeira anotação')
    const edited = await cerSessionNoteService.update(note.id, 'Anotação corrigida')
    expect(edited.id).toBe(note.id)
    expect(edited.session_id).toBe(session.id)
    expect(edited.enrollment_id).toBe('other-enrollment')
    expect((await cerSessionNoteService.getBySessionId(session.id))?.text).toBe('Anotação corrigida')
    expect(await cerMapCandidateService.listCandidatesForEnrollment('other-enrollment')).toEqual([])
    await sessionMapUpdateService.save({enrollmentId:'other-enrollment',sessionId:session.id,participantName:'Pessoa fictícia',professionalUserId:session.professional_user_id,summary:'Uma formulação humana para o mapa'})
    const draft = demoAdapter.getDraftMap('other-enrollment')!
    expect(draft.reading_snapshot?.sessionUpdates?.[0].summary).toBe('Uma formulação humana para o mapa')
    expect(JSON.stringify(draft)).not.toContain('Anotação corrigida')
    expect(draft.items).toEqual([])
    await cerSessionService.startSession(session.id)
    const obs = await cerSessionObservationService.create({session_id:session.id, observation_type:'participant_report', text:'Relato preservado'})
    expect(await cerSessionObservationService.listBySession(session.id)).toContainEqual(obs)
    await cerSessionService.completeSession(session.id)
    await expect(cerSessionService.startSession(session.id)).rejects.toThrow()
    await expect(cerSessionNoteService.update(note.id, 'Sobrescrita')).rejects.toThrow()
    await expect(cerSessionService.getById('missing')).rejects.toThrow()
    expect(backend).not.toHaveBeenCalled()
    backend.mockRestore()
    demoAdapter.enableDemo('mariana')
    await expect(cerSessionNoteService.getBySessionId(session.id)).rejects.toThrow(/privada/)
    await expect(cerSessionObservationService.listBySession(session.id)).rejects.toThrow(/restritas/)
    demoAdapter.enableDemo('daiane')
  })
  it('agenda sem inventar horário e remarca apenas sessão agendada', async () => {
    demoAdapter.enableDemo('daiane')
    const session = await cerSessionService.createScheduled('mine')
    expect(session.scheduled_at).toBeUndefined()
    const updated = await cerSessionService.updateScheduledDate(session.id, '2026-10-06T13:00:00.000Z')
    expect(updated.scheduled_at).toBe('2026-10-06T13:00:00.000Z')
    await cerSessionService.startSession(session.id)
    await expect(cerSessionService.updateScheduledDate(session.id, '2026-10-07T13:00:00.000Z')).rejects.toThrow()
  })
})
