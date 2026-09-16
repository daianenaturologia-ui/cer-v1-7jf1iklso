/**
 * SERVIÇO DE VERIFICAÇÃO E CONTROLE DE RECONHECIMENTO DE FALA LOCAL (CER V1)
 *
 * POLÍTICA DE PRIVACIDADE E RETENÇÃO DE ÁUDIO (P0 — REVISÃO ESTRITA):
 * 1. A Web Speech API padrão (SpeechRecognition / webkitSpeechRecognition) NÃO processa
 *    localmente por padrão na maioria dos navegadores: ela comumente delega o processamento
 *    e transmite os fluxos de áudio para servidores em nuvem do provedor do navegador (Google, Apple, etc.),
 *    sem garantia auditável de privacidade, soberania ou retenção zero.
 * 2. Em navegadores modernos com suporte explícito a on-device recognition (ex.: Chrome/Edge com
 *    `processLocally: true`, `SpeechRecognition.available()`, `SpeechRecognition.install()`),
 *    é possível solicitar e garantir reconhecimento local estrito.
 * 3. Se o processamento local estrito NÃO puder ser comprovado/garantido antes de abrir o microfone,
 *    a captura de áudio é TERMINANTEMENTE BLOQUEADA:
 *    - Microfone NÃO é aberto (zero chamadas a getUserMedia ou recognition.start).
 *    - Fallback remoto é PROIBIDO (fail-closed).
 *    - Apenas digitação/escrita manual é oferecida, com comunicação transparente e honesta.
 * 4. NENHUM áudio, transcrição bruta ou trecho falado pode ser logado (nem console.log, nem telemetria,
 *    nem persistência backend).
 */

export type LocalVoiceSupportStatus =
  | 'checking' // Verificando capacidades do dispositivo/navegador
  | 'supported_ready' // Reconhecimento local estrito disponível e pronto (pacote pt-BR pronto)
  | 'supported_downloadable' // Reconhecimento local suportado, mas pacote pt-BR precisa ser baixado
  | 'supported_downloading' // Pacote de linguagem pt-BR em download/instalação
  | 'no_speech_api' // Navegador sem nenhuma SpeechRecognition API
  | 'no_local_guarantee' // Navegador possui Web Speech API, mas NÃO oferece garantia auditável de processamento local (processLocally ausente)
  | 'lang_not_supported' // Processamento local suportado, mas pacote pt-BR indisponível no dispositivo
  | 'install_failed' // Instalação do pacote pt-BR falhou ou foi recusada pelo sistema/usuário
  | 'runtime_remote_detected' // Erro em tempo de execução indicando tentativa/exigência de rede remota (bloqueado)
  | 'permission_denied' // Permissão de microfone negada
  | 'hardware_error' // Falha de hardware ou microfone indisponível

export interface SpeechRecognitionOptionsLike {
  langs: string[]
  processLocally?: boolean
  quality?: 'command' | 'dictation' | 'conversation'
}

export type AvailabilityStatusLike = 'unavailable' | 'downloadable' | 'downloading' | 'available'

export interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionInstanceLike
  available?: (options: SpeechRecognitionOptionsLike) => Promise<AvailabilityStatusLike>
  install?: (options: SpeechRecognitionOptionsLike) => Promise<boolean>
}

export interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
        confidence: number
      }
    }
  }
}

export interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}

export interface SpeechRecognitionInstanceLike {
  continuous?: boolean
  interimResults?: boolean
  lang?: string
  processLocally?: boolean
  options?: SpeechRecognitionOptionsLike
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

export interface LocalVoiceDiagnostic {
  hasSpeechApi: boolean
  apiName: 'SpeechRecognition' | 'webkitSpeechRecognition' | null
  hasProcessLocallyProperty: boolean
  hasAvailableMethod: boolean
  hasInstallMethod: boolean
  status: LocalVoiceSupportStatus
  detailMessage: string
}

export class LocalSpeechRecognitionService {
  private static readonly TARGET_LANG = 'pt-BR'

  /**
   * Obtém o construtor da Web Speech API se presente na janela.
   */
  static getSpeechConstructor(
    win: Window = typeof window !== 'undefined' ? window : ({} as Window),
  ): {
    ctor: SpeechRecognitionConstructorLike | null
    name: 'SpeechRecognition' | 'webkitSpeechRecognition' | null
  } {
    const winRecord = win as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructorLike
      webkitSpeechRecognition?: SpeechRecognitionConstructorLike
    }

    if (typeof winRecord.SpeechRecognition === 'function') {
      return { ctor: winRecord.SpeechRecognition, name: 'SpeechRecognition' }
    }
    if (typeof winRecord.webkitSpeechRecognition === 'function') {
      return { ctor: winRecord.webkitSpeechRecognition, name: 'webkitSpeechRecognition' }
    }
    return { ctor: null, name: null }
  }

  /**
   * Avalia com precisão se a API do navegador oferece garantia real de processamento local (on-device).
   *
   * Critérios estritos:
   * 1. Deve existir SpeechRecognition ou webkitSpeechRecognition.
   * 2. Uma instância da classe DEVE expor a propriedade `processLocally` (ou o construtor expor o método estático `available`).
   *    - Web Speech API legada sem `processLocally` delega para servidores remotos (Google, Apple) sem comprovação: NÃO É PERMITIDA.
   * 3. Se `available()` existir, verificar se pt-BR está 'available', 'downloadable' ou 'downloading' com `processLocally: true`.
   */
  static async diagnoseLocalSupport(
    win: Window = typeof window !== 'undefined' ? window : ({} as Window),
  ): Promise<LocalVoiceDiagnostic> {
    const { ctor, name } = this.getSpeechConstructor(win)

    if (!ctor || !name) {
      return {
        hasSpeechApi: false,
        apiName: null,
        hasProcessLocallyProperty: false,
        hasAvailableMethod: false,
        hasInstallMethod: false,
        status: 'no_speech_api',
        detailMessage:
          'Seu navegador não possui suporte à API de fala (SpeechRecognition). Utilize a escrita manual.',
      }
    }

    let instance: SpeechRecognitionInstanceLike | null = null
    let hasProcessLocallyProperty = false
    try {
      instance = new ctor()
      hasProcessLocallyProperty =
        'processLocally' in instance ||
        Object.prototype.hasOwnProperty.call(instance, 'processLocally') ||
        instance.processLocally !== undefined
    } catch {
      // Instanciação falhou
    }

    const hasAvailableMethod = typeof ctor.available === 'function'
    const hasInstallMethod = typeof ctor.install === 'function'

    // Se NÃO tiver suporte a processLocally nem a SpeechRecognition.available({ processLocally: true }),
    // trata-se da implementação padrão da Web Speech API que pode enviar áudio à nuvem sem controle:
    // PROIBIDO abrir microfone!
    if (!hasProcessLocallyProperty && !hasAvailableMethod) {
      return {
        hasSpeechApi: true,
        apiName: name,
        hasProcessLocallyProperty: false,
        hasAvailableMethod: false,
        hasInstallMethod: false,
        status: 'no_local_guarantee',
        detailMessage:
          'Este navegador possui transcrição de fala, mas não garante processamento local exclusivo no seu dispositivo. Para assegurar sua privacidade e não transmitir áudio a servidores externos, a gravação por voz está desativada. Por favor, utilize a escrita manual.',
      }
    }

    // Se possui available estático, consulta a disponibilidade de pt-BR em modo on-device
    if (hasAvailableMethod && ctor.available) {
      try {
        const availStatus = await ctor.available({
          langs: [this.TARGET_LANG],
          processLocally: true,
          quality: 'dictation',
        })

        if (availStatus === 'available') {
          return {
            hasSpeechApi: true,
            apiName: name,
            hasProcessLocallyProperty,
            hasAvailableMethod: true,
            hasInstallMethod,
            status: 'supported_ready',
            detailMessage: 'Reconhecimento de fala local disponível no seu dispositivo.',
          }
        }

        if (availStatus === 'downloadable') {
          return {
            hasSpeechApi: true,
            apiName: name,
            hasProcessLocallyProperty,
            hasAvailableMethod: true,
            hasInstallMethod,
            status: 'supported_downloadable',
            detailMessage:
              'O pacote de voz local para Português (Brasil) pode ser baixado no seu dispositivo.',
          }
        }

        if (availStatus === 'downloading') {
          return {
            hasSpeechApi: true,
            apiName: name,
            hasProcessLocallyProperty,
            hasAvailableMethod: true,
            hasInstallMethod,
            status: 'supported_downloading',
            detailMessage:
              'O pacote de voz local para Português (Brasil) está sendo baixado pelo navegador.',
          }
        }

        // Caso contrário: 'unavailable'
        return {
          hasSpeechApi: true,
          apiName: name,
          hasProcessLocallyProperty,
          hasAvailableMethod: true,
          hasInstallMethod,
          status: 'lang_not_supported',
          detailMessage:
            'O modelo de reconhecimento de fala local em Português (pt-BR) não está disponível no seu dispositivo. Utilize a escrita manual.',
        }
      } catch {
        // Se a chamada available({ processLocally: true }) lançar exceção, indica falta de suporte local
        return {
          hasSpeechApi: true,
          apiName: name,
          hasProcessLocallyProperty,
          hasAvailableMethod: true,
          hasInstallMethod,
          status: 'no_local_guarantee',
          detailMessage:
            'Não foi possível comprovar a disponibilidade do processamento local no navegador. A captura permanece desativada.',
        }
      }
    }

    // Se tem a propriedade processLocally na instância mas não tem API estática available,
    // consideramos preliminarmente compatível desde que processLocally seja travado como true
    return {
      hasSpeechApi: true,
      apiName: name,
      hasProcessLocallyProperty: true,
      hasAvailableMethod: false,
      hasInstallMethod,
      status: 'supported_ready',
      detailMessage:
        'Processamento local configurável via processLocally=true. O áudio não será delegado para a nuvem.',
    }
  }

  /**
   * Tenta instalar/baixar o pacote on-device de pt-BR, se suportado pelo navegador.
   */
  static async requestInstallLanguagePack(
    win: Window = typeof window !== 'undefined' ? window : ({} as Window),
  ): Promise<boolean> {
    const { ctor } = this.getSpeechConstructor(win)
    if (!ctor || typeof ctor.install !== 'function') {
      return false
    }

    try {
      const ok = await ctor.install({
        langs: [this.TARGET_LANG],
        processLocally: true,
        quality: 'dictation',
      })
      return Boolean(ok)
    } catch {
      return false
    }
  }

  /**
   * Instancia uma sessão estritamente local de SpeechRecognition.
   * Lança erro se processLocally não puder ser ativado.
   * NUNCA faz fallback para reconhecimento remoto.
   */
  static createLocalRecognitionSession(
    win: Window = typeof window !== 'undefined' ? window : ({} as Window),
  ): SpeechRecognitionInstanceLike {
    const { ctor } = this.getSpeechConstructor(win)
    if (!ctor) {
      throw new Error('Nenhum construtor de SpeechRecognition disponível.')
    }

    const instance = new ctor()

    // Forçar obrigatoriamente processLocally = true
    try {
      instance.processLocally = true
      if (!instance.options) {
        instance.options = { langs: [this.TARGET_LANG], processLocally: true }
      } else {
        instance.options.processLocally = true
      }
    } catch {
      // Se não puder fixar processLocally, recusa criar
      throw new Error('Impossível garantir processLocally = true na instância de reconhecimento.')
    }

    instance.continuous = true
    instance.interimResults = true
    instance.lang = this.TARGET_LANG

    return instance
  }

  /**
   * Avalia se um erro reportado pela Web Speech API evidencia tentativa de processamento remoto
   * ou recusa de serviço que deve abortar imediatamente sem qualquer degradação para a nuvem.
   */
  static isRemoteOrBlockedError(errorCode: string): boolean {
    const normalized = (errorCode || '').toLowerCase()
    return (
      normalized === 'service-not-allowed' ||
      normalized === 'network' ||
      normalized === 'language-not-supported'
    )
  }
}
