import { cerMapService } from './cerMapService'
import { cerSessionService } from './cerSession'
import {
  buildCerMapReadings,
  isCerMapReadingSnapshot,
  unreviewedMapReadings,
} from './cerMapReadings'

/** Explicit professional formulation; never reads or copies the private note. */
export const sessionMapUpdateService = {
  async read(enrollmentId: string, sessionId: string) {
    const maps = await cerMapService.listAllMaps(enrollmentId)
    const map = maps
      .filter((m) => m.enrollment_id === enrollmentId && ['draft', 'published'].includes(m.status))
      .sort((a, b) =>
        a.status === 'draft' ? -1 : b.status === 'draft' ? 1 : b.version_number - a.version_number,
      )[0]
    return isCerMapReadingSnapshot(map?.reading_snapshot)
      ? map.reading_snapshot.sessionUpdates?.find((u) => u.sessionId === sessionId)?.summary || ''
      : ''
  },
  async save(params: {
    enrollmentId: string
    sessionId: string
    participantName: string
    professionalUserId: string
    summary: string
  }) {
    const { enrollmentId, sessionId, professionalUserId, participantName } = params
    const summary = params.summary.trim()
    if (!summary || summary.length > 8000)
      throw new Error('Escreva uma síntese de até 8.000 caracteres.')
    const session = await cerSessionService.getById(sessionId)
    if (
      session.enrollment_id !== enrollmentId ||
      session.professional_user_id !== professionalUserId ||
      session.status === 'cancelled'
    )
      throw new Error('O encontro não pertence a este acompanhamento ou profissional.')
    const maps = (await cerMapService.listAllMaps(enrollmentId)).filter(
      (m) => m.enrollment_id === enrollmentId,
    )
    let draft = maps.find((m) => m.status === 'draft')
    if (!draft) {
      const published = maps
        .filter((m) => m.status === 'published')
        .sort((a, b) => b.version_number - a.version_number)[0]
      draft = published
        ? await cerMapService.createNextDraftFromPublished(published.id, professionalUserId)
        : await cerMapService.createInitialDraft(enrollmentId, professionalUserId)
    }
    const snapshot = isCerMapReadingSnapshot(draft.reading_snapshot)
      ? draft.reading_snapshot
      : buildCerMapReadings([], enrollmentId, participantName, { literalOnly: true })
    const update = {
      sessionId,
      sessionDate:
        session.completed_at || session.started_at || session.scheduled_at || session.created,
      summary,
      preparedBy: professionalUserId,
      preparedAt: new Date().toISOString(),
    }
    const sessionUpdates = [
      ...(snapshot.sessionUpdates || []).filter((u) => u.sessionId !== sessionId),
      update,
    ]
    const result = await cerMapService.saveReadingSnapshot(
      draft.id,
      enrollmentId,
      unreviewedMapReadings({ ...snapshot, sessionUpdates }),
      false,
    )
    window.dispatchEvent(new CustomEvent('cer-map-draft-changed', { detail: { enrollmentId } }))
    return result
  },
}
