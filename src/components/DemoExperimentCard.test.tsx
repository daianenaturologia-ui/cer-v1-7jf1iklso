import React, { useState } from 'react'
import { describe, beforeEach, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoExperimentCard } from './DemoExperimentCard'
import { demoAdapter, DEMO_ENROLLMENT_ID as enrollment } from '@/services/demoAdapter'
import { demoPracticeFlow as flow, DEMO_PRACTICE_CATALOG } from '@/services/demoPracticeFlow'
import { cerCareCycleService } from '@/services/cerCareCycleService'
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: vi.fn(() => {
      throw new Error('No demo network')
    }),
  },
}))
let assignmentId: string
beforeEach(async () => {
  demoAdapter.resetToDefaultState()
  demoAdapter.enableDemo('daiane')
  const plan = demoAdapter.createDraftPlan({
    enrollment_id: enrollment,
    direction_mode: 'authored',
  })
  demoAdapter.activatePlan(plan.id)
  const priority = demoAdapter.addPriority({ plan_id: plan.id, title: 'Foco' })
  demoAdapter.updateDemoPriorityStatus(priority.id, 'active')
  const p = demoAdapter.createPresentation({
    plan_id: plan.id,
    priority_id: priority.id,
    participant_title: 'Foco conferido',
  })
  demoAdapter.presentPresentation(p.id)
  demoAdapter.setActivePersona('mariana')
  demoAdapter.recordAcceptance({ presentation_id: p.id, response_type: 'accepted' })
  demoAdapter.setActivePersona('daiane')
  const cycle = await cerCareCycleService.create({ plan_id: plan.id })
  await cerCareCycleService.act(cycle.id, 'start')
  assignmentId = flow.prepare({
    enrollmentId: enrollment,
    priorityId: priority.id,
    cycleId: cycle.id,
    versionId: DEMO_PRACTICE_CATALOG[0].id,
    safeTitle: 'Um pequeno passo',
    safeSummary: 'Orientações conferidas',
    frequency: 'daily',
    duration: '',
    safetyOutcome: 'eligible',
    rationale: 'Nota profissional privada',
  }).id
  demoAdapter.setActivePersona('mariana')
})
function Harness() {
  const [revision, setRevision] = useState(0)
  const item = flow.list(enrollment).find((a) => a.id === assignmentId)!
  return (
    <div data-revision={revision}>
      <DemoExperimentCard assignment={item} onUpdated={() => setRevision((v) => v + 1)} />
    </div>
  )
}
describe('Proposta compartilhada na visão da interagente', () => {
  it('não presume compreensão nem oferece execução antes da ativação profissional', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByLabelText('As orientações estão claras?')).toHaveValue('want_to_ask')
    expect(screen.queryByText('Nota profissional privada')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Como foi isso para você?' }),
    ).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('As orientações estão claras?'), 'understood')
    await user.click(screen.getByRole('button', { name: 'Aceitar este convite' }))
    await user.click(screen.getByRole('button', { name: /^Cabe bem$/ }))
    expect(
      screen.getByText('Seu consentimento foi registrado para esta versão.'),
    ).toBeInTheDocument()
    expect(flow.get(assignmentId).status).toBe('draft')
    expect(demoAdapter.readCareStore().plannerItems).toHaveLength(0)
  })
  it('retirar consentimento remove a ação de registrar a prática e cancela somente momentos futuros', async () => {
    demoAdapter.setActivePersona('mariana')
    flow.consent(assignmentId, 'accepted', 'understood')
    flow.confirm(assignmentId, 'cabe_bem')
    demoAdapter.setActivePersona('daiane')
    flow.activate(assignmentId)
    demoAdapter.setActivePersona('mariana')
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Como foi isso para você?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retirar consentimento' }))
    expect(
      screen.queryByRole('button', { name: 'Como foi isso para você?' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Pausado')).toBeInTheDocument()
    expect(
      demoAdapter.readCareStore().plannerItems.filter((i) => i.status === 'planned'),
    ).toHaveLength(0)
  })
  it('pedido de esclarecimento não fabrica uma decisão de consentimento', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Compartilhar minha dúvida' }))
    expect(flow.pendingQuestion(assignmentId)).toBe('want_to_ask')
    expect(flow.latestConsent(assignmentId)).toBeNull()
  })
})
