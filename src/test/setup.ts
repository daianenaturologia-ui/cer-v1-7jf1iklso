import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)

// Testes unitários não devem sair do processo para serviços externos.
// Cada integração que precisa de respostas deve fornecer seu próprio mock.
vi.stubGlobal(
  'fetch',
  vi.fn(async () => {
    throw new Error('Requisição externa desabilitada nos testes')
  }),
)
