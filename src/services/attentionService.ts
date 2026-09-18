/**
 * attentionService — Read-model client-side determinístico (Build 09C)
 * ZERO collections novas.
 * ZERO persistência ou mutação de dados.
 * ZERO score de risco numérico.
 *
 * Semântica FINAL congelada:
 * - SEGURANÇA = escalation_required e somente estados semanticamente equivalentes JÁ EXISTENTES no backend.
 * - REVISAR = needs_review, was_too_much, consent withdrawn, safety unresolved,
 *             assignment pedindo adaptação (participant_response_type in ['wants_adaptation', 'too_much_right_now']),
 *             Cycle Review pendente, participante aguardando devolutiva/revisão profissional,
 *             wants_to_talk, wants_to_adapt, demais operacionais não críticos.
 * - INFORMATIVO = mudanças sem ação imediata (ex: novo registro sem alerta, confirmação simples cabe_bem, etc).
 *
 * REGRA DURA DE ATENÇÃO:
 * was_too_much NUNCA aparece como SEGURANÇA automaticamente
 * (o Build 08E já converte was_too_much -> needs_review; o painel exibe o par "relatou que foi demais -> revisão aberta").
 */

import pb from '@/lib/pocketbase/client'
import type {
  CerPracticeResponseRecord,
  CerPracticeConsentRecord,
  CerPracticeAssignmentRecord,
  CerOperationalAcceptanceRecord,
  CerCareCycleRecord,
  CerCycleReviewRecord,
  CerPracticeSafetyCheckRecord,
} from '@/types/cer'

export type AttentionCategory = 'SEGURANÇA' | 'REVISAR' | 'INFORMATIVO'

export interface AttentionItem {
  id: string
  enrollmentId: string
  participantName?: string
  category: AttentionCategory
  title: string
  description: string
  sourceType:
    | 'response'
    | 'consent'
    | 'assignment'
    | 'acceptance'
    | 'cycle_review'
    | 'safety_check'
    | 'consciousness'
  sourceId?: string
  actionLabel?: string
  actionTarget?: string
  timestamp: string
}

export interface AttentionFilter {
  category?: AttentionCategory
  enrollmentId?: string
}

export const attentionService = {
  /**
   * Deriva os itens de atenção para um conjunto de enrollments ou para um único enrollment.
   * Totalmente em memória, consultando as coleções já existentes com RLS nativo.
   */
  async computeAttentionItems(enrollmentId?: string): Promise<AttentionItem[]> {
    const { demoAdapter } = await import('@/services/demoAdapter')
    if (demoAdapter.isEnabled()) {
      return []
    }

    const items: AttentionItem[] = []

    try {
      const enrFilter = enrollmentId ? `enrollment_id = "${enrollmentId}"` : ''

      // 1. Practice Responses com safety_flag ou reações de limite
      const responseFilter = enrFilter
        ? `${enrFilter} && record_status = "current"`
        : `record_status = "current"`

      const responses = await pb
        .collection('cer_practice_responses')
        .getFullList<CerPracticeResponseRecord>({
          filter: responseFilter,
          sort: '-created',
          expand: 'assignment_id,practice_version_id,enrollment_id.person_id',
        })

      for (const r of responses) {
        const participantName =
          (r.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (r.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        const safeTitle = (r.expand as any)?.assignment_id?.participant_safe_title || 'Experimento'

        // SEGURANÇA estrita: escalation_required
        if (r.safety_flag === 'escalation_required') {
          items.push({
            id: `resp-esc-${r.id}`,
            enrollmentId: r.enrollment_id,
            participantName,
            category: 'SEGURANÇA',
            title: 'Protocolo de segurança acionado em resposta',
            description: `${participantName} registrou resposta com sinalização de segurança no experimento "${safeTitle}". Requer atenção profissional prioritária.`,
            sourceType: 'response',
            sourceId: r.id,
            actionLabel: 'Revisar Segurança',
            actionTarget: `/profissional/participantes/${r.enrollment_id}?tab=experimentos`,
            timestamp: r.created,
          })
        }
        // REVISAR: was_too_much ou needs_review
        else if (r.response_type === 'was_too_much' || r.safety_flag === 'needs_review') {
          const desc =
            r.response_type === 'was_too_much'
              ? `${participantName} relatou que a prática "${safeTitle}" foi demais no momento -> revisão aberta para acolhimento e eventual adaptação.`
              : `${participantName} registrou resposta que pede revisão profissional no experimento "${safeTitle}".`

          items.push({
            id: `resp-rev-${r.id}`,
            enrollmentId: r.enrollment_id,
            participantName,
            category: 'REVISAR',
            title:
              r.response_type === 'was_too_much'
                ? 'Prática sentida como excessiva (was too much)'
                : 'Resposta aguardando revisão profissional',
            description: desc,
            sourceType: 'response',
            sourceId: r.id,
            actionLabel: 'Avaliar Adaptação',
            actionTarget: `/profissional/participantes/${r.enrollment_id}?tab=experimentos`,
            timestamp: r.created,
          })
        }
      }

      // 2. Consents: withdrawn ou respostas de dúvida/ajuda (want_to_ask, did_not_understand)
      const consentFilter = enrFilter || ''
      const consents = await pb
        .collection('cer_practice_consents')
        .getFullList<CerPracticeConsentRecord>({
          filter: consentFilter,
          sort: '-created',
          expand: 'practice_version_id,enrollment_id.person_id',
        })

      for (const c of consents) {
        const participantName =
          (c.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (c.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        if (c.record_status === 'withdrawn') {
          items.push({
            id: `cons-wdr-${c.id}`,
            enrollmentId: c.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Consentimento revogado pelo participante',
            description: `${participantName} retirou o consentimento para a prática. O experimento foi pausado automaticamente para acolhimento seguro.`,
            sourceType: 'consent',
            sourceId: c.id,
            actionLabel: 'Ver Detalhes',
            actionTarget: `/profissional/participantes/${c.enrollment_id}?tab=experimentos`,
            timestamp: c.withdrawn_at || c.updated,
          })
        } else if (
          c.understanding_response === 'want_to_ask' ||
          c.understanding_response === 'did_not_understand'
        ) {
          items.push({
            id: `cons-ask-${c.id}`,
            enrollmentId: c.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Participante tem dúvidas antes de consentir',
            description: `${participantName} indicou "${c.understanding_response === 'want_to_ask' ? 'Quero perguntar antes' : 'Não compreendi bem'}" na etapa de esclarecimento.`,
            sourceType: 'consent',
            sourceId: c.id,
            actionLabel: 'Conversar em Sessão',
            actionTarget: `/profissional/participantes/${c.enrollment_id}?tab=experimentos`,
            timestamp: c.created,
          })
        }
      }

      // 3. Operational Acceptances: wants_to_talk, wants_to_adapt, alternative_requested, too_much
      const accFilter = enrFilter
        ? `${enrFilter} && record_status = "current"`
        : `record_status = "current"`

      const acceptances = await pb
        .collection('cer_operational_acceptances')
        .getFullList<CerOperationalAcceptanceRecord>({
          filter: accFilter,
          sort: '-created',
          expand: 'presentation_id,priority_id,enrollment_id.person_id',
        })

      for (const a of acceptances) {
        const participantName =
          (a.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (a.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        if (
          [
            'wants_to_talk',
            'wants_to_adapt',
            'too_much',
            'alternative_requested',
            'not_now',
          ].includes(a.response_type)
        ) {
          const labels: Record<string, string> = {
            wants_to_talk: 'deseja conversar a respeito em sessão',
            wants_to_adapt: 'pediu para adaptar a proposta',
            too_much: 'sinalizou que a proposta parece demais agora',
            alternative_requested: 'pediu outra alternativa',
            not_now: 'prefere deixar para outro momento',
          }

          items.push({
            id: `acc-rev-${a.id}`,
            enrollmentId: a.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Devolutiva sobre direção de cuidado',
            description: `${participantName} recebeu a apresentação e ${labels[a.response_type] || 'enviou uma devolutiva'}.`,
            sourceType: 'acceptance',
            sourceId: a.id,
            actionLabel: 'Revisar Plano',
            actionTarget: `/profissional/participantes/${a.enrollment_id}?tab=plano`,
            timestamp: a.created,
          })
        }
      }

      // 4. Assignments com solicitação de adaptação ou capacidade delicada
      const asgnFilter = enrFilter || ''
      const assignments = await pb
        .collection('cer_practice_assignments')
        .getFullList<CerPracticeAssignmentRecord>({
          filter: asgnFilter,
          sort: '-created',
          expand: 'enrollment_id.person_id',
        })

      for (const asgn of assignments) {
        const participantName =
          (asgn.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (asgn.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        if (
          asgn.participant_response_type === 'wants_adaptation' ||
          asgn.participant_response_type === 'too_much_right_now' ||
          asgn.capacity_response === 'parece_demais' ||
          asgn.capacity_response === 'cabe_se_adaptar'
        ) {
          items.push({
            id: `asgn-adapt-${asgn.id}`,
            enrollmentId: asgn.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Ajuste de dose ou ritmo solicitado no experimento',
            description: `${participantName} sinalizou ${asgn.participant_response_type === 'too_much_right_now' || asgn.capacity_response === 'parece_demais' ? 'que o ritmo parece excessivo' : 'que prefere adaptar a dose/frequência'} em "${asgn.participant_safe_title}".`,
            sourceType: 'assignment',
            sourceId: asgn.id,
            actionLabel: 'Ajustar Experimento',
            actionTarget: `/profissional/participantes/${asgn.enrollment_id}?tab=experimentos`,
            timestamp: asgn.updated,
          })
        }
      }

      // 5. Safety Checks com outcome pendente ou que requer revisão/supervisão
      const scFilter = enrFilter
        ? `${enrFilter} && record_status = "current"`
        : `record_status = "current"`

      const safetyChecks = await pb
        .collection('cer_practice_safety_checks')
        .getFullList<CerPracticeSafetyCheckRecord>({
          filter: scFilter,
          sort: '-created',
          expand: 'practice_version_id,enrollment_id.person_id',
        })

      for (const sc of safetyChecks) {
        const participantName =
          (sc.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (sc.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        if (
          sc.outcome === 'requires_professional_review' ||
          sc.outcome === 'requires_supervision' ||
          sc.outcome === 'insufficient_information'
        ) {
          items.push({
            id: `sc-chk-${sc.id}`,
            enrollmentId: sc.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Checagem de segurança requer avaliação',
            description: `A checagem de segurança para "${(sc.expand as any)?.practice_version_id?.participant_title || 'prática'}" resultou em "${sc.outcome.replace(/_/g, ' ')}". O experimento fica bloqueado até decisão deliberada.`,
            sourceType: 'safety_check',
            sourceId: sc.id,
            actionLabel: 'Revisar Checagem',
            actionTarget: `/profissional/participantes/${sc.enrollment_id}?tab=experimentos`,
            timestamp: sc.created,
          })
        }
      }

      // 6. Cycle Reviews pendentes
      const cycleFilter = enrFilter ? `${enrFilter} && status = "active"` : `status = "active"`
      const activeCycles = await pb.collection('cer_care_cycles').getFullList<CerCareCycleRecord>({
        filter: cycleFilter,
        sort: '-created',
        expand: 'enrollment_id.person_id',
      })

      for (const cy of activeCycles) {
        const participantName =
          (cy.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
          (cy.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
          'Participante'

        // Verificar se tem review draft
        const reviews = await pb.collection('cer_cycle_reviews').getFullList<CerCycleReviewRecord>({
          filter: `care_cycle_id = "${cy.id}" && status = "draft"`,
        })

        if (reviews.length > 0) {
          items.push({
            id: `cy-rev-${cy.id}`,
            enrollmentId: cy.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: `Revisão do Ciclo #${cy.cycle_number} em rascunho`,
            description: `Ciclo ativo com revisão em andamento. Decisão deliberada sobre continuação, adaptação ou fechamento disponível.`,
            sourceType: 'cycle_review',
            sourceId: reviews[0].id,
            actionLabel: 'Concluir Revisão',
            actionTarget: `/profissional/participantes/${cy.enrollment_id}?tab=revisao`,
            timestamp: reviews[0].updated,
          })
        }
      }

      // 7. Consciência concluída aguardando revisão de integração (Requisito 7 do 09C)
      const jsFilter = enrFilter || ''
      const journeyStates = await pb.collection('journey_states').getFullList<{
        id: string
        enrollment_id: string
        current_stage: string
        stage_status: string
        expand?: {
          enrollment_id?: {
            expand?: { person_id?: { preferred_name?: string; full_name?: string } }
          }
        }
      }>({
        filter: jsFilter,
        expand: 'enrollment_id.person_id',
      })

      for (const js of journeyStates) {
        if (js.current_stage === 'consciousness' && js.stage_status === 'integrado') {
          const participantName =
            (js.expand as any)?.enrollment_id?.expand?.person_id?.preferred_name ||
            (js.expand as any)?.enrollment_id?.expand?.person_id?.full_name ||
            'Participante'

          items.push({
            id: `js-integ-${js.id}`,
            enrollmentId: js.enrollment_id,
            participantName,
            category: 'REVISAR',
            title: 'Consciência concluída — revisar integração',
            description: `${participantName} concluiu as experiências da Consciência. O Mapa e a síntese integrativa estão prontos para elaboração do primeiro Plano de Cuidado.`,
            sourceType: 'consciousness',
            sourceId: js.id,
            actionLabel: 'Revisar Integração',
            actionTarget: `/profissional/participantes/${js.enrollment_id}?tab=consciencia`,
            timestamp: new Date().toISOString(),
          })
        }
      }
    } catch (err) {
      console.error('Erro ao derivar attentionService:', err)
    }

    // Ordenação estrita: SEGURANÇA primeiro, depois REVISAR, depois INFORMATIVO
    const order: Record<AttentionCategory, number> = {
      SEGURANÇA: 1,
      REVISAR: 2,
      INFORMATIVO: 3,
    }

    return items.sort((a, b) => {
      if (order[a.category] !== order[b.category]) {
        return order[a.category] - order[b.category]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  },
}
