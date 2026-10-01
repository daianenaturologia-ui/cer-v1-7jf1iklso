import pb from '@/lib/pocketbase/client'
import { demoAdapter, DEMO_ENROLLMENT_ID, DEMO_USER_DAIANE, DEMO_USER_MARIANA } from './demoAdapter'

/** Deliberately separate from clinical reviews: every field here is shared with the participant. */
export interface CycleInvitation {
  id: string
  enrollment_id: string
  care_cycle_id: string
  participant_user_id: string
  invited_by_user_id: string
  shared_prompt: string
  participant_reflection: string
  completed_at: string
  created: string
  updated: string
}
const collection = 'cer_cycle_invitations'
export const cerCycleInvitationService = {
  async list(enrollmentId: string): Promise<CycleInvitation[]> {
    if (demoAdapter.isEnabled()) {
      if (enrollmentId !== DEMO_ENROLLMENT_ID)
        throw new Error('Matrícula não disponível na demonstração.')
      return demoAdapter.readCareStore().invitations.filter((i) => i.enrollment_id === enrollmentId)
    }
    return pb.collection(collection).getFullList({
      filter: pb.filter('enrollment_id = {:id}', { id: enrollmentId }),
      sort: '-created',
    })
  },
  async invite(
    enrollmentId: string,
    cycleId: string,
    sharedPrompt: string,
  ): Promise<CycleInvitation> {
    if (demoAdapter.isEnabled()) {
      if (demoAdapter.getActivePersona() !== 'daiane' || enrollmentId !== DEMO_ENROLLMENT_ID)
        throw new Error('Convite disponível somente para a profissional responsável.')
      const store = demoAdapter.readCareStore()
      const cycle = store.cycles.find((c) => c.id === cycleId && c.enrollment_id === enrollmentId)
      if (!cycle || cycle.status === 'planned')
        throw new Error('Inicie o ciclo antes de convidar para revisão.')
      const existing = store.invitations.find((i) => i.care_cycle_id === cycleId)
      if (existing) return existing
      const now = new Date().toISOString()
      const invitation: CycleInvitation = {
        id: `demo-invite-${crypto.randomUUID()}`,
        enrollment_id: enrollmentId,
        care_cycle_id: cycleId,
        participant_user_id: DEMO_USER_MARIANA.id,
        invited_by_user_id: DEMO_USER_DAIANE.id,
        shared_prompt: sharedPrompt.trim(),
        participant_reflection: '',
        completed_at: '',
        created: now,
        updated: now,
      }
      store.invitations.push(invitation)
      demoAdapter.writeCareStore(store)
      return invitation
    }
    return pb.collection(collection).create({
      enrollment_id: enrollmentId,
      care_cycle_id: cycleId,
      invited_by_user_id: pb.authStore.record?.id,
      shared_prompt: sharedPrompt.trim(),
    })
  },
  async respond(invitationId: string, reflection: string): Promise<CycleInvitation> {
    if (!reflection.trim()) throw new Error('Escreva sua percepção antes de compartilhar.')
    if (demoAdapter.isEnabled()) {
      if (demoAdapter.getActivePersona() !== 'mariana')
        throw new Error('Somente a interagente pode registrar sua resposta.')
      const store = demoAdapter.readCareStore()
      const invitation = store.invitations.find(
        (i) => i.id === invitationId && i.participant_user_id === DEMO_USER_MARIANA.id,
      )
      if (!invitation || invitation.completed_at)
        throw new Error('Convite não encontrado ou já respondido.')
      invitation.participant_reflection = reflection.trim()
      invitation.completed_at = invitation.updated = new Date().toISOString()
      demoAdapter.writeCareStore(store)
      return invitation
    }
    return pb.collection(collection).update(invitationId, {
      participant_reflection: reflection.trim(),
      completed_at: new Date().toISOString(),
    })
  },
}
