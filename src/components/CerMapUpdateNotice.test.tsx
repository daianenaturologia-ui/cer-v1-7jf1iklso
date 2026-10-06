import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CerMapUpdateNotice } from './CerMapUpdateNotice'
import { buildCerMapReadings } from '@/services/cerMapReadings'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
const report = (version = 2, enrollment = 'a') =>
  ({
    id: `map-${version}`,
    status: 'published',
    version_number: version,
    enrollment_id: enrollment,
    items: [],
    reading_snapshot: buildCerMapReadings([], enrollment, 'Teste'),
  }) as any
describe('Aviso somente de versões disponíveis do Mapa CER', () => {
  it('não anuncia rascunho, mapa de outra pessoa nem relato da Linha da Vida sem publicação', () => {
    const { rerender } = render(
      <CerMapUpdateNotice map={null} enrollmentId="a" onOpen={() => {}} />,
    )
    rerender(
      <CerMapUpdateNotice
        map={{ ...report(), status: 'draft' }}
        enrollmentId="a"
        onOpen={() => {}}
      />,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    rerender(<CerMapUpdateNotice map={report(2, 'b')} enrollmentId="a" onOpen={() => {}} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
  it('reconhece a versão aberta, mas anuncia uma versão posterior e não suprime outra pessoa', async () => {
    let opened = 0
    const { rerender } = render(
      <CerMapUpdateNotice
        map={report()}
        enrollmentId="a"
        onOpen={() => {
          opened++
        }}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Ver meu Mapa CER' }))
    expect(opened).toBe(1)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    rerender(<CerMapUpdateNotice map={report(3)} enrollmentId="a" onOpen={() => {}} />)
    expect(screen.getByText('Seu Mapa CER foi atualizado')).toBeInTheDocument()
    rerender(<CerMapUpdateNotice map={report(2, 'b')} enrollmentId="b" onOpen={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
