import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ update: vi.fn(), getOne: vi.fn() }))
vi.mock('@/lib/pocketbase/client', () => ({
  default: { collection: () => mocks },
}))
vi.mock('./demoAdapter', () => ({ demoAdapter: { isEnabled: () => false } }))
import { cerCycleInvitationService as service } from './cerCycleInvitationService'

beforeEach(() => vi.resetAllMocks())
describe('Confirmação da percepção compartilhada', () => {
  it('retorna o envio confirmado sem leitura adicional', async () => {
    const saved = { id: 'i', completed_at: '2026-10-26', participant_reflection: 'Meu relato' }
    mocks.update.mockResolvedValue(saved)
    expect(await service.respond('i', ' Meu relato ')).toEqual(saved)
    expect(mocks.getOne).not.toHaveBeenCalled()
  })
  it('recupera confirmação quando o envio retorna erro mas o mesmo texto está salvo', async () => {
    const saved = { id: 'i', completed_at: '2026-10-26', participant_reflection: 'Meu relato' }
    mocks.update.mockRejectedValue(new Error('Something went wrong'))
    mocks.getOne.mockResolvedValue(saved)
    expect(await service.respond('i', ' Meu relato ')).toEqual(saved)
    expect(mocks.getOne).toHaveBeenCalledWith('i', { requestKey: null })
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })
  it.each([
    { completed_at: '', participant_reflection: 'Meu relato' },
    { completed_at: '2026-10-26', participant_reflection: 'Outro relato' },
  ])('não confirma um registro incompleto ou diferente: %j', async (saved) => {
    mocks.update.mockRejectedValue(new Error('Something went wrong'))
    mocks.getOne.mockResolvedValue(saved)
    await expect(service.respond('i', 'Meu relato')).rejects.toThrow('Não foi possível confirmar')
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })
  it('informa resultado incerto quando também não consegue consultar', async () => {
    mocks.update.mockRejectedValue(new Error('Something went wrong'))
    mocks.getOne.mockRejectedValue(new Error('offline'))
    await expect(service.respond('i', 'Meu relato')).rejects.toThrow('Seu texto continua aqui')
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })
})
