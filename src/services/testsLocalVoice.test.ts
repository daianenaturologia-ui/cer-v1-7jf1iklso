/**
 * TESTES DETERMINÍSTICOS — VOZ LOCAL NO CADERNO (CER V1)
 *
 * Cenários determinísticos exigidos pela rodada prioritária de correção:
 * 1. Suporte local disponível:
 *    - Navegador com API de reconhecimento e suporte explícito on-device (`processLocally: true` ou `available()` retornando 'available').
 *    - Pacote pt-BR pronto.
 * 2. API local ausente:
 *    - Navegador sem SpeechRecognition / webkitSpeechRecognition.
 *    - Ou navegador com Web Speech API genérica/legada sem garantia on-device (sem `processLocally` e sem `available`).
 *    - Microfone não pode ser iniciado; oferece exclusivamente escrita manual.
 * 3. pt-BR indisponível:
 *    - Reconhecimento local suportado, porém `available()` indica que pt-BR não está disponível ('unavailable').
 *    - Microfone não pode ser iniciado; oferece exclusivamente escrita manual.
 * 4. Instalação / download de pacote recusada:
 *    - Modelo downloadable, porém chamada de instalação retorna false ou é recusada.
 *    - Microfone não pode ser aberto; oferece escrita manual.
 * 5. Erro durante o reconhecimento contornando exigência local:
 *    - Erro 'service-not-allowed', 'network' ou 'language-not-supported' durante execução.
 *    - Tratar como violação/falha terminal e abortar imediatamente; nunca degradar para remoto.
 * 6. Ausência de fallback remoto (zero chamadas a serviços externos):
 *    - Nenhum fetch/HTTP para nuvem, nenhum áudio enviado, nenhum log de transcrição/áudio em console ou backend.
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  LocalSpeechRecognitionService,
  SpeechRecognitionOptionsLike,
  AvailabilityStatusLike,
  SpeechRecognitionInstanceLike,
} from './localSpeechService'

describe('CER V1: Voz Local no Caderno (Processamento Estritamente On-Device)', () => {
  // Helper para criar mock de SpeechRecognition constructor
  function createMockSpeechRecognition(options?: {
    hasProcessLocally?: boolean
    availableStatus?: AvailabilityStatusLike
    installSuccess?: boolean
    throwOnAvailable?: boolean
    throwOnInstall?: boolean
  }) {
    const {
      hasProcessLocally = true,
      availableStatus = 'available',
      installSuccess = true,
      throwOnAvailable = false,
      throwOnInstall = false,
    } = options || {}

    class MockInstance implements SpeechRecognitionInstanceLike {
      continuous = true
      interimResults = true
      lang = 'pt-BR'
      processLocally?: boolean
      startCalled = false
      stopCalled = false
      abortCalled = false

      onstart: (() => void) | null = null
      onresult: ((event: unknown) => void) | null = null
      onerror: ((event: unknown) => void) | null = null
      onend: (() => void) | null = null

      constructor() {
        if (hasProcessLocally) {
          this.processLocally = false
        }
      }

      start() {
        this.startCalled = true
        if (this.onstart) this.onstart()
      }

      stop() {
        this.stopCalled = true
        if (this.onend) this.onend()
      }

      abort() {
        this.abortCalled = true
        if (this.onend) this.onend()
      }
    }

    class MockSpeechRecognitionConstructor {
      static async available(opts: SpeechRecognitionOptionsLike): Promise<AvailabilityStatusLike> {
        if (throwOnAvailable) throw new Error('Not supported')
        if (opts.processLocally) {
          return availableStatus
        }
        return 'available'
      }

      static async install(_opts: SpeechRecognitionOptionsLike): Promise<boolean> {
        if (throwOnInstall) throw new Error('Download failed')
        return installSuccess
      }

      constructor() {
        return new MockInstance()
      }
    }

    return { MockSpeechRecognitionConstructor, MockInstance }
  }

  // --------------------------------------------------------------------------
  // CENÁRIO 1: SUPORTE LOCAL DISPONÍVEL
  // --------------------------------------------------------------------------
  describe('Cenário 1: Suporte local disponível e pacote pt-BR pronto', () => {
    it('1.1 Detecta suporte on-device comprovado com pt-BR pronto', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        availableStatus: 'available',
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.hasSpeechApi).toBe(true)
      expect(diag.apiName).toBe('SpeechRecognition')
      expect(diag.status).toBe('supported_ready')
      expect(diag.hasAvailableMethod).toBe(true)
    })

    it('1.2 Funciona com prefixo webkitSpeechRecognition quando implementa garantias locais', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        availableStatus: 'available',
      })

      const mockWin = {
        webkitSpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.hasSpeechApi).toBe(true)
      expect(diag.apiName).toBe('webkitSpeechRecognition')
      expect(diag.status).toBe('supported_ready')
    })

    it('1.3 createLocalRecognitionSession força processLocally = true e lang = pt-BR', () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const session = LocalSpeechRecognitionService.createLocalRecognitionSession(mockWin)
      expect(session.processLocally).toBe(true)
      expect(session.lang).toBe('pt-BR')
      expect(session.continuous).toBe(true)
      expect(session.interimResults).toBe(true)
    })
  })

  // --------------------------------------------------------------------------
  // CENÁRIO 2: API LOCAL AUSENTE (OU SEM GARANTIA ON-DEVICE)
  // --------------------------------------------------------------------------
  describe('Cenário 2: API local ausente ou sem garantia on-device comprovada', () => {
    it('2.1 Retorna status no_speech_api quando nenhuma API de fala existe', async () => {
      const mockWin = {} as unknown as Window
      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.hasSpeechApi).toBe(false)
      expect(diag.status).toBe('no_speech_api')
      expect(diag.detailMessage).toContain('não possui suporte')
    })

    it('2.2 Bloqueia API genérica/legada que não possui propriedade processLocally nem available()', async () => {
      // Cria construtor clássico da Web Speech API (como Chrome antigo/Safari legado que delegam para a nuvem)
      class LegacySpeechRecognition {
        continuous = true
        interimResults = true
        lang = 'pt-BR'
        // SEM processLocally e SEM static available()
        start() {}
        stop() {}
        abort() {}
      }

      const mockWin = {
        SpeechRecognition: LegacySpeechRecognition,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      // A API existe mas NÃO tem garantia local -> BLOQUEADO (fail-closed)
      expect(diag.hasSpeechApi).toBe(true)
      expect(diag.hasProcessLocallyProperty).toBe(false)
      expect(diag.hasAvailableMethod).toBe(false)
      expect(diag.status).toBe('no_local_guarantee')
      expect(diag.detailMessage).toContain('não garante processamento local exclusivo')
    })

    it('2.3 createLocalRecognitionSession lança erro se não houver construtor disponível', () => {
      const mockWin = {} as unknown as Window
      expect(() => {
        LocalSpeechRecognitionService.createLocalRecognitionSession(mockWin)
      }).toThrow(/Nenhum construtor de SpeechRecognition disponível/)
    })
  })

  // --------------------------------------------------------------------------
  // CENÁRIO 3: PT-BR INDISPONÍVEL
  // --------------------------------------------------------------------------
  describe('Cenário 3: pt-BR indisponível no dispositivo', () => {
    it('3.1 available() retornando unavailable resulta em status lang_not_supported', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        availableStatus: 'unavailable',
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.hasSpeechApi).toBe(true)
      expect(diag.status).toBe('lang_not_supported')
      expect(diag.detailMessage).toContain('Português (pt-BR) não está disponível')
    })
  })

  // --------------------------------------------------------------------------
  // CENÁRIO 4: INSTALAÇÃO / DOWNLOAD DE PACOTE RECUSADA OU NECESSÁRIA
  // --------------------------------------------------------------------------
  describe('Cenário 4: Download e instalação do pacote pt-BR', () => {
    it('4.1 availableStatus downloadable identifica necessidade de download prévio', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        availableStatus: 'downloadable',
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.status).toBe('supported_downloadable')
      expect(diag.hasInstallMethod).toBe(true)
    })

    it('4.2 availableStatus downloading identifica pacote em andamento de download', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        availableStatus: 'downloading',
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport(mockWin)

      expect(diag.status).toBe('supported_downloading')
    })

    it('4.3 requestInstallLanguagePack retorna false quando o download é recusado pelo usuário/SO', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        installSuccess: false,
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const result = await LocalSpeechRecognitionService.requestInstallLanguagePack(mockWin)
      expect(result).toBe(false)
    })

    it('4.4 requestInstallLanguagePack retorna false quando a chamada lança exceção', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        throwOnInstall: true,
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const result = await LocalSpeechRecognitionService.requestInstallLanguagePack(mockWin)
      expect(result).toBe(false)
    })

    it('4.5 requestInstallLanguagePack retorna true quando o pacote é baixado com sucesso', async () => {
      const { MockSpeechRecognitionConstructor } = createMockSpeechRecognition({
        hasProcessLocally: true,
        installSuccess: true,
      })

      const mockWin = {
        SpeechRecognition: MockSpeechRecognitionConstructor,
      } as unknown as Window

      const result = await LocalSpeechRecognitionService.requestInstallLanguagePack(mockWin)
      expect(result).toBe(true)
    })
  })

  // --------------------------------------------------------------------------
  // CENÁRIO 5: ERRO DURANTE RECONHECIMENTO (BLOQUEIO CONTRA DEGRADAÇÃO REMOTA)
  // --------------------------------------------------------------------------
  describe('Cenário 5: Erro durante reconhecimento bloqueia contorno para serviço remoto', () => {
    it('5.1 Identifica service-not-allowed como indício de recusa de serviço local ou tentativa remota', () => {
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('service-not-allowed')).toBe(true)
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('SERVICE-NOT-ALLOWED')).toBe(true)
    })

    it('5.2 Identifica network como indício indevido de chamada externa (deve ser abortado)', () => {
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('network')).toBe(true)
    })

    it('5.3 Identifica language-not-supported como indício de ausência de modelo local', () => {
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('language-not-supported')).toBe(
        true,
      )
    })

    it('5.4 Não trata no-speech ou audio-capture como tentativa remota', () => {
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('no-speech')).toBe(false)
      expect(LocalSpeechRecognitionService.isRemoteOrBlockedError('audio-capture')).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // CENÁRIO 6: AUSÊNCIA DE FALLBACK REMOTO E SEGURANÇA NO CÓDIGO
  // --------------------------------------------------------------------------
  describe('Cenário 6: Ausência total de fallback remoto e garantia de não-persistência', () => {
    const voiceCompPath = path.resolve(process.cwd(), 'src/components/VoiceInputCapture.tsx')
    const voiceCompContent = fs.readFileSync(voiceCompPath, 'utf-8')

    const localServicePath = path.resolve(process.cwd(), 'src/services/localSpeechService.ts')
    const localServiceContent = fs.readFileSync(localServicePath, 'utf-8')

    it('6.1 VoiceInputCapture não realiza chamadas fetch, axios, nem upload de áudio (FormData)', () => {
      expect(voiceCompContent).not.toMatch(/fetch\s*\(\s*['"`]http/i)
      expect(voiceCompContent).not.toMatch(/axios/i)
      expect(voiceCompContent).not.toMatch(/new\s+FormData/i)
      expect(voiceCompContent).not.toMatch(/audio\/wav/i)
      expect(voiceCompContent).not.toMatch(/audio\/mp3/i)
      expect(voiceCompContent).not.toMatch(/audio\/webm/i)
    })

    it('6.2 Nenhum áudio ou transcrição é logado via console.log em VoiceInputCapture ou localSpeechService', () => {
      expect(voiceCompContent).not.toMatch(/console\.log/i)
      expect(voiceCompContent).not.toMatch(/console\.info/i)
      expect(voiceCompContent).not.toMatch(/console\.debug/i)
      expect(localServiceContent).not.toMatch(/console\.log/i)
      expect(localServiceContent).not.toMatch(/console\.info/i)
    })

    it('6.3 Linguagem na interface é honesta e não promete "retenção zero" sem comprovação de processamento local', () => {
      // Não faz alegações genéricas irrealistas sobre a Web Speech API clássica
      expect(voiceCompContent).toContain('Processamento local obrigatório')
      expect(voiceCompContent).toContain('Processamento local on-device')
      expect(voiceCompContent).toContain('não garante processamento local exclusivo')
      // Oferece explicitamente a escrita manual quando não comprovado
      expect(voiceCompContent).toContain('escrita manual')
      // Exige confirmação expressa antes de guardar
      expect(voiceCompContent).toContain('handleConfirm')
      expect(voiceCompContent).toContain('onConfirmText(clean)')
    })
  })
})
