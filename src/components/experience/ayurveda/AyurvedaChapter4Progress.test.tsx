import React from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AyurvedaChapter4Flow } from './AyurvedaChapter4Flow'
const mocks = vi.hoisted(() => ({ save: vi.fn(), update: vi.fn() }))
vi.mock('@/services/experienceEngine', () => ({
  experienceResponseService: {
    listResponsesByExperience: vi.fn(async () => []),
    saveResponse: mocks.save,
  },
  enrollmentExperienceService: {
    getByEnrollmentAndExperience: vi.fn(async () => ({ id: 'progress' })),
    updateProgress: mocks.update,
  },
}))
it('records dimension completion only after C4 is saved and awaits its progress update', async () => {
  mocks.save.mockResolvedValue({ id: 'final', structured_value: { completed: true } })
  mocks.update.mockResolvedValue({ id: 'progress' })
  const completed = vi.fn()
  render(
    <AyurvedaChapter4Flow
      enrollmentId="enrollment"
      experienceId="exp-corpo-fisiologia-07b"
      respondentUserId="participant"
      onBackToHub={vi.fn()}
      onCompleted={completed}
    />,
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Concluir Corpo & Fisiologia' }))
  await waitFor(() => expect(completed).toHaveBeenCalledOnce())
  expect(mocks.update).toHaveBeenCalledWith('progress', {
    completed: true,
    enrollmentId: 'enrollment',
  })
  expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.update.mock.invocationCallOrder[0],
  )
})
