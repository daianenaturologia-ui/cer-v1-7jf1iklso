import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LifeMapTrail } from './LifeMapTrail'
it('apresenta emoção e idade ao lado do título sem exigir abrir a narrativa', () => {
  render(
    <LifeMapTrail
      directions={[]}
      events={[
        {
          id: 'event',
          enrollment_id: 'enr',
          title: 'Mudança',
          time_kind: 'age',
          time_value: '8',
          emotions: ['Medo'],
          narrative: 'Minha história',
          access_class: 'participant_private',
        },
      ]}
    />,
  )
  const summary = screen.getByText('Mudança').closest('summary')!
  expect(summary).toHaveTextContent('Por volta dos 8 anos')
  expect(summary).toHaveTextContent('Medo')
  expect(summary.closest('details')).not.toHaveAttribute('open')
})
