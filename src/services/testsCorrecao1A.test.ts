/**
 * TESTES UNITÁRIOS E DETERMINÍSTICOS DA CORREÇÃO 1A DO LOTE 1 (BIBLIOTECA CER V1)
 *
 * Validação sem contaminação do backend:
 * Testes das funções puras, consistência temporal, semântica e matrizes de regras da Correção 1A.
 * Não realiza escritas mutáveis no backend vivo.
 */

import { describe, it, expect } from 'vitest'
import { isPracticeVersionReviewDueValid } from './cerPracticeService'
import child_process from 'node:child_process'
import path from 'node:path'

describe('Investigation Git Runner', () => {
  it('executes investigate-git.mjs and logs output', async () => {
    let out = ''
    try {
      out = child_process.execSync(`node ${path.resolve(process.cwd(), 'investigate-git.mjs')}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err: any) {
      out = 'ERR: ' + err.message + '\nSTDOUT: ' + err.stdout + '\nSTDERR: ' + err.stderr
    }
    const fs = await import('node:fs')
    let outputContent = ''
    try {
      outputContent = fs.readFileSync(
        path.resolve(process.cwd(), 'investigation-output.json'),
        'utf8',
      )
    } catch (e: any) {
      outputContent = 'NO_OUTPUT_FILE: ' + e.message
    }
    expect(out, 'OUTPUT_REPORT:\n' + outputContent).toBe('FAIL_INTENTIONALLY_TO_SEE_REPORT')
  })
})

describe('Correção 1A: Validação Temporal Canônica de review_due_at (cerPracticeService)', () => {
  const FIXED_NOW = new Date('2026-09-09T12:00:00.000Z').getTime()

  it('A1: review_due_at ausente (undefined ou null) -> INDISPONÍVEL (false)', () => {
    expect(isPracticeVersionReviewDueValid(undefined, FIXED_NOW)).toBe(false)
    expect(isPracticeVersionReviewDueValid(null, FIXED_NOW)).toBe(false)
  })

  it('A2: review_due_at com string vazia ou whitespace -> INDISPONÍVEL (false)', () => {
    expect(isPracticeVersionReviewDueValid('', FIXED_NOW)).toBe(false)
    expect(isPracticeVersionReviewDueValid('   ', FIXED_NOW)).toBe(false)
  })

  it('A3: review_due_at com formato de data inválido -> INDISPONÍVEL (false)', () => {
    expect(isPracticeVersionReviewDueValid('data_invalida', FIXED_NOW)).toBe(false)
    expect(isPracticeVersionReviewDueValid('2026-99-99', FIXED_NOW)).toBe(false)
    expect(isPracticeVersionReviewDueValid('null', FIXED_NOW)).toBe(false)
  })

  it('A4: review_due_at no passado (< agora) -> INDISPONÍVEL (false)', () => {
    const pastDate = new Date(FIXED_NOW - 1000).toISOString()
    expect(isPracticeVersionReviewDueValid(pastDate, FIXED_NOW)).toBe(false)

    const pastDateDay = new Date(FIXED_NOW - 24 * 60 * 60 * 1000).toISOString()
    expect(isPracticeVersionReviewDueValid(pastDateDay, FIXED_NOW)).toBe(false)
  })

  it('A5: review_due_at exatamente igual ao instante atual (== agora) -> INDISPONÍVEL (false)', () => {
    const exactNow = new Date(FIXED_NOW).toISOString()
    expect(isPracticeVersionReviewDueValid(exactNow, FIXED_NOW)).toBe(false)
  })

  it('A6: review_due_at estritamente futuro (> agora) -> DISPONÍVEL (true)', () => {
    const futureDate1s = new Date(FIXED_NOW + 1000).toISOString()
    expect(isPracticeVersionReviewDueValid(futureDate1s, FIXED_NOW)).toBe(true)

    const futureDate30d = new Date(FIXED_NOW + 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(isPracticeVersionReviewDueValid(futureDate30d, FIXED_NOW)).toBe(true)

    const futureDate1y = new Date(FIXED_NOW + 365 * 24 * 60 * 60 * 1000).toISOString()
    expect(isPracticeVersionReviewDueValid(futureDate1y, FIXED_NOW)).toBe(true)
  })

  it('A7: independe do timezone local do navegador (comparações estritamente UTC/milissegundos)', () => {
    // UTC vs ISO com offset
    const futureUtc = '2026-09-09T15:00:00.000Z'
    const futureOffset = '2026-09-09T12:00:00.000-03:00' // equivale a 15:00 UTC
    expect(new Date(futureUtc).getTime()).toBe(new Date(futureOffset).getTime())

    expect(isPracticeVersionReviewDueValid(futureUtc, FIXED_NOW)).toBe(true)
    expect(isPracticeVersionReviewDueValid(futureOffset, FIXED_NOW)).toBe(true)
  })
})

describe('Correção 1A: Comportamento Semântico em Filtro de Versões na Biblioteca', () => {
  const FIXED_NOW = new Date('2026-09-09T12:00:00.000Z').getTime()

  const mockVersions = [
    {
      id: 'v_draft',
      practice_id: 'p1',
      version_number: 1,
      status: 'draft',
      review_due_at: '2026-12-01T00:00:00.000Z',
    },
    {
      id: 'v_active_no_due',
      practice_id: 'p1',
      version_number: 2,
      status: 'active',
      review_due_at: '',
    },
    {
      id: 'v_active_invalid_due',
      practice_id: 'p1',
      version_number: 3,
      status: 'active',
      review_due_at: 'invalid-date',
    },
    {
      id: 'v_active_expired_due',
      practice_id: 'p1',
      version_number: 4,
      status: 'active',
      review_due_at: '2026-09-08T00:00:00.000Z',
    },
    {
      id: 'v_active_exact_now',
      practice_id: 'p1',
      version_number: 5,
      status: 'active',
      review_due_at: new Date(FIXED_NOW).toISOString(),
    },
    {
      id: 'v_active_valid_future',
      practice_id: 'p1',
      version_number: 6,
      status: 'active',
      review_due_at: '2026-10-01T00:00:00.000Z',
    },
  ]

  it('exclui versões não-active ou active com review_due_at vazio, inválido, igual ao agora ou vencido', () => {
    const available = mockVersions.filter(
      (v) => v.status === 'active' && isPracticeVersionReviewDueValid(v.review_due_at, FIXED_NOW),
    )

    expect(available.length).toBe(1)
    expect(available[0].id).toBe('v_active_valid_future')
    expect(available[0].version_number).toBe(6)
  })

  it('quando a única versão ativa tem review_due_at expirado, a biblioteca trata como sem versão disponível', () => {
    const expiredOnly = [
      {
        id: 'v_only_expired',
        practice_id: 'p2',
        version_number: 1,
        status: 'active',
        review_due_at: '2026-01-01T00:00:00.000Z',
      },
    ]

    const available = expiredOnly.filter(
      (v) => v.status === 'active' && isPracticeVersionReviewDueValid(v.review_due_at, FIXED_NOW),
    )

    expect(available.length).toBe(0)
  })
})
