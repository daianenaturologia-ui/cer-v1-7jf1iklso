import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Mic,
  MicOff,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Check,
  RotateCcw,
  Volume2,
  Download,
  Loader2,
  FileEdit,
} from 'lucide-react'
import {
  LocalSpeechRecognitionService,
  LocalVoiceSupportStatus,
  SpeechRecognitionInstanceLike,
  SpeechRecognitionEventLike,
  SpeechRecognitionErrorEventLike,
} from '@/services/localSpeechService'

export interface VoiceInputCaptureProps {
  onConfirmText: (confirmedText: string) => void
  onCancel?: () => void
  placeholder?: string
  className?: string
  targetLabel?: string
}

export type VoiceCaptureState =
  | 'checking' // Diagnosticando garantias locais antes de permitir qualquer ação
  | 'idle_ready' // Suporte local estrito comprovado; aguardando início voluntário
  | 'need_download' // Suporte local existe, mas pacote pt-BR precisa de download prévio
  | 'downloading' // Baixando pacote pt-BR on-device
  | 'requesting_permission' // Solicitando acesso ao microfone (após garantia local)
  | 'listening' // Captura ativa / transcrevendo com processamento local estrito
  | 'reviewing' // Áudio finalizado; interagente revisa/edita antes de confirmar
  | 'unsupported_local' // Navegador sem suporte a processamento local comprovado
  | 'lang_unavailable' // Pacote pt-BR não disponível localmente
  | 'permission_denied' // Microfone negado
  | 'error' // Erro de hardware ou de captura com bloqueio

/**
 * COMPONENTE DE CAPTURA E TRANSCRIÇÃO POR VOZ — CADERNO PRIVADO (CER V1)
 *
 * POLÍTICA DE PRIVACIDADE E PROCESSAMENTO LOCAL (P0 — REVISÃO ESTRITA):
 *
 * 1. A Web Speech API padrão (SpeechRecognition / webkitSpeechRecognition) NÃO processa localmente
 *    por padrão na maioria dos navegadores: ela comumente delega a transcrição para servidores
 *    remotos do provedor do navegador (Google, Apple, etc.), sem qualquer garantia de privacidade
 *    ou retenção zero.
 * 2. Portanto, o CER V1 EXIGE comprovação explícita de processamento local (on-device) ANTES de
 *    abrir o microfone. Se o navegador não oferecer essa garantia auditável (`processLocally`),
 *    o microfone NUNCA é aberto e NENHUM fallback remoto é realizado.
 * 3. Erros em tempo de execução como 'service-not-allowed' ou 'network' (que evidenciam dependência
 *    de nuvem) encerram imediatamente a sessão com recusa e bloqueio total.
 * 4. NENHUM áudio, transcrição bruta ou trecho é logado no console, telemetria ou persistido em backend.
 * 5. Revisão Soberana e Confirmação Prévia:
 *    - Todo texto resultante da fala precisa ser expressamente aprovado e confirmado pela interagente
 *      antes de ser inserido no Caderno ou Recado.
 */
export const VoiceInputCapture: React.FC<VoiceInputCaptureProps> = ({
  onConfirmText,
  onCancel,
  targetLabel = 'anotação',
}) => {
  const [state, setState] = useState<VoiceCaptureState>('checking')
  const [supportStatus, setSupportStatus] = useState<LocalVoiceSupportStatus>('checking')
  const [diagnosticDetail, setDiagnosticDetail] = useState<string>('')
  const [transcript, setTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null)

  // Executa diagnóstico prévio estrito de processamento local ao montar o componente
  useEffect(() => {
    let isCancelled = false

    const runDiagnostic = async () => {
      setState('checking')
      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport()
      if (isCancelled) return

      setSupportStatus(diag.status)
      setDiagnosticDetail(diag.detailMessage)

      if (diag.status === 'supported_ready') {
        setState('idle_ready')
      } else if (diag.status === 'supported_downloadable') {
        setState('need_download')
      } else if (diag.status === 'supported_downloading') {
        setState('downloading')
      } else if (diag.status === 'lang_not_supported') {
        setState('lang_unavailable')
      } else {
        // no_speech_api ou no_local_guarantee
        setState('unsupported_local')
      }
    }

    runDiagnostic()

    return () => {
      isCancelled = true
    }
  }, [])

  // Limpeza de recursos e abort ao desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* intentionally ignored — sem logs de áudio */
        }
      }
    }
  }, [])

  // Instalação do pacote pt-BR on-device
  const handleInstallLanguagePack = async () => {
    setState('downloading')
    setErrorMessage(null)
    const success = await LocalSpeechRecognitionService.requestInstallLanguagePack()
    if (success) {
      // Re-diagnostica após instalação
      const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport()
      if (diag.status === 'supported_ready') {
        setSupportStatus('supported_ready')
        setState('idle_ready')
        setDiagnosticDetail('Pacote pt-BR instalado. Reconhecimento local pronto.')
      } else {
        setState('need_download')
        setErrorMessage(
          'O pacote ainda não está pronto para uso local. Verifique se o download foi concluído.',
        )
      }
    } else {
      setState('need_download')
      setErrorMessage(
        'A instalação do pacote de voz local foi recusada ou falhou. Somente a escrita manual está disponível.',
      )
    }
  }

  // Iniciar captura com validação local estrita (zero fallback remoto)
  const startListening = useCallback(async () => {
    setErrorMessage(null)

    // Revalidação prévia: se não comprovado suporte local, BLOQUEIA sem abrir microfone
    const diag = await LocalSpeechRecognitionService.diagnoseLocalSupport()
    if (diag.status !== 'supported_ready') {
      if (diag.status === 'supported_downloadable') {
        setState('need_download')
      } else if (diag.status === 'lang_not_supported') {
        setState('lang_unavailable')
      } else {
        setState('unsupported_local')
      }
      setDiagnosticDetail(diag.detailMessage)
      return
    }

    // Solicitar permissão de microfone previamente
    setState('requesting_permission')
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Libera a stream imediatamente — a API local gerenciará o microfone
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setState('permission_denied')
        setErrorMessage('Permissão para uso do microfone foi recusada no navegador.')
        return
      }
    }

    try {
      // Cria instância estritamente local (processLocally = true forçado)
      const recognition = LocalSpeechRecognitionService.createLocalRecognitionSession()

      let accumulated = transcript ? transcript.trim() + ' ' : ''

      recognition.onstart = () => {
        setState('listening')
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentInterim = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i]
          if (res.isFinal) {
            accumulated += res[0].transcript + ' '
          } else {
            currentInterim += res[0].transcript
          }
        }
        // NÃO logar o conteúdo no console nem persistir em telemetria
        setTranscript(accumulated + currentInterim)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        // NÃO logar áudio nem detalhes sensíveis
        if (event.error === 'not-allowed') {
          setState('permission_denied')
          setErrorMessage('Permissão para acesso ao microfone foi negada.')
          return
        }

        if (event.error === 'no-speech') {
          // Apenas silêncio momentâneo — manter escutando
          return
        }

        // Erro de rede ou de serviço não permitido indica tentativa de delegação remota não suportada:
        // BLOQUEIO TERMINAL, sem degradar para nuvem
        if (LocalSpeechRecognitionService.isRemoteOrBlockedError(event.error)) {
          setState('unsupported_local')
          setErrorMessage(
            'O navegador tentou contatar serviço remoto ou recusou o processamento local. A gravação foi cancelada para assegurar sua privacidade. Utilize a escrita manual.',
          )
          try {
            recognition.abort()
          } catch {
            /* intentionally ignored */
          }
          return
        }

        setState('error')
        setErrorMessage(`Falha na captura de áudio local (${event.error || 'erro desconhecido'}).`)
      }

      recognition.onend = () => {
        // Se ainda estava ouvindo, transita para revisão honesta
        setState((prev) => (prev === 'listening' ? 'reviewing' : prev))
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: unknown) {
      setState('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível iniciar a captura local de fala.',
      )
    }
  }, [transcript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* intentionally ignored */
      }
    }
    setState('reviewing')
  }, [])

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        /* intentionally ignored */
      }
    }
    setTranscript('')
    setState(supportStatus === 'supported_ready' ? 'idle_ready' : 'unsupported_local')
    if (onCancel) onCancel()
  }, [onCancel, supportStatus])

  const handleConfirm = useCallback(() => {
    const clean = transcript.trim()
    if (!clean) {
      cancelListening()
      return
    }
    // NENHUM log de áudio ou transcrição no console
    onConfirmText(clean)
    setTranscript('')
    setState('idle_ready')
  }, [transcript, onConfirmText, cancelListening])

  const handleRestart = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        /* intentionally ignored */
      }
    }
    setTranscript('')
    startListening()
  }, [startListening])

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-3">
      {/* Topo informativo com linguagem honesta e precisa */}
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            Entrada por Voz para {targetLabel}
          </span>
        </div>
        {state === 'idle_ready' || state === 'listening' || state === 'reviewing' ? (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-mono uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Processamento local on-device</span>
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-mono uppercase bg-muted text-muted-foreground border-border/60"
          >
            <ShieldAlert className="w-3 h-3 text-muted-foreground shrink-0" />
            <span>Processamento local obrigatório</span>
          </Badge>
        )}
      </div>

      {/* Mensagem honesta sobre a exigência de processamento local */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        O CER V1 exige que o reconhecimento de voz seja executado{' '}
        <strong>exclusivamente no seu próprio dispositivo</strong>. Se o seu navegador não comprovar
        capacidade on-device, a captura de fala não é iniciada e nenhum áudio é enviado a servidores
        de terceiros. Todo texto transcrito passa pela sua conferência e confirmação antes de ser
        guardado.
      </p>

      {/* Estado: Verificando capacidades do navegador */}
      {state === 'checking' && (
        <div className="p-3 rounded bg-muted/30 border border-border/40 text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          <span>Verificando suporte a processamento local on-device...</span>
        </div>
      )}

      {/* Estado: Sem suporte a processamento local comprovado — NÃO inicia microfone */}
      {state === 'unsupported_local' && (
        <div className="p-3 rounded bg-amber-500/10 border border-amber-300 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Processamento local não garantido neste navegador</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {errorMessage ||
              diagnosticDetail ||
              'A Web Speech API deste navegador não assegura execução estritamente local (on-device) e pode transmitir áudio para servidores em nuvem do fornecedor do navegador. Para garantir total privacidade e retenção zero, a gravação de voz não foi iniciada.'}
          </p>
          <div className="p-2 rounded bg-background/60 border border-border/30 text-[11px] text-foreground flex items-center gap-2">
            <FileEdit className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Por favor, utilize a digitação ou escrita manual logo abaixo.</span>
          </div>
          <div className="pt-1 flex justify-end">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-7">
              Continuar escrevendo manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Pacote pt-BR não disponível no dispositivo */}
      {state === 'lang_unavailable' && (
        <div className="p-3 rounded bg-amber-500/10 border border-amber-300 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Pacote Português (pt-BR) local indisponível</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            O reconhecimento local on-device está suportado, mas o modelo em Português do Brasil não
            está instalado no seu sistema. Como não fazemos fallback remoto para proteger sua
            privacidade, sugerimos utilizar a escrita manual.
          </p>
          <div className="pt-1 flex justify-end">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-7">
              Continuar escrevendo manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Pacote pt-BR disponível para download */}
      {state === 'need_download' && (
        <div className="p-3 rounded bg-blue-500/10 border border-blue-300 text-xs text-blue-900 dark:text-blue-200 space-y-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Download className="w-4 h-4 shrink-0 text-blue-600" />
            <span>Instalação do pacote de voz local (pt-BR)</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Seu navegador suporta reconhecimento local, mas o pacote de voz em Português precisa ser
            baixado para funcionar inteiramente no seu dispositivo.
          </p>
          {errorMessage && (
            <p className="text-[11px] text-destructive font-medium">{errorMessage}</p>
          )}
          <div className="pt-1 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-7">
              Usar escrita manual
            </Button>
            <Button
              size="sm"
              onClick={handleInstallLanguagePack}
              className="text-xs h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-3 h-3" />
              <span>Baixar pacote local</span>
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Baixando pacote */}
      {state === 'downloading' && (
        <div className="p-3 rounded bg-muted/40 border border-border/40 text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            Baixando e configurando o pacote de fala local (pt-BR)...
          </span>
          <Button variant="ghost" size="sm" onClick={cancelListening} className="text-xs h-7">
            Cancelar
          </Button>
        </div>
      )}

      {/* Estado: Permissão de microfone negada */}
      {state === 'permission_denied' && (
        <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <MicOff className="w-4 h-4 shrink-0" />
            <span>Microfone não autorizado</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {errorMessage ||
              'O acesso ao microfone foi recusado no navegador. Verifique as configurações de permissão se desejar falar, ou continue por escrita manual.'}
          </p>
          <div className="pt-1 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelListening} className="text-xs h-7">
              Usar escrita manual
            </Button>
            <Button size="sm" onClick={startListening} className="text-xs h-7">
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Erro de hardware ou de captura */}
      {state === 'error' && (
        <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Falha na captura local</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{errorMessage}</p>
          <div className="pt-1 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelListening} className="text-xs h-7">
              Usar escrita manual
            </Button>
            <Button size="sm" onClick={startListening} className="text-xs h-7">
              Reiniciar fala local
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Pronto para captura local (idle_ready) */}
      {state === 'idle_ready' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground">
            Reconhecimento local pronto em português (pt-BR). Nenhum áudio será enviado para a
            nuvem.
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs h-8">
                Cancelar
              </Button>
            )}
            <Button
              size="sm"
              onClick={startListening}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Iniciar captura local</span>
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Solicitando Permissão de microfone */}
      {state === 'requesting_permission' && (
        <div className="flex items-center justify-between p-3 rounded bg-muted/40 text-xs">
          <span className="text-muted-foreground flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary animate-pulse" />
            Solicitando permissão de microfone para captura local...
          </span>
          <Button variant="ghost" size="sm" onClick={cancelListening} className="text-xs h-7">
            Cancelar
          </Button>
        </div>
      )}

      {/* Estado: Escutando e transcrevendo localmente */}
      {state === 'listening' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-foreground">
                Gravando e transcrevendo localmente...
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Processamento exclusivo no aparelho
            </span>
          </div>

          <div className="min-h-[70px] p-2.5 rounded bg-background border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {transcript || (
              <span className="text-muted-foreground italic">
                Aguardando sua voz... Fale próximo ao microfone.
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelListening}
              className="text-xs h-8 text-muted-foreground"
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="text-xs h-8 gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Recomeçar</span>
              </Button>
              <Button
                size="sm"
                onClick={stopListening}
                className="text-xs h-8 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Parar e revisar texto</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estado: Revisando texto antes de guardar */}
      {state === 'reviewing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Fala transcrita localmente — Revise antes de guardar
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Você pode editar livremente</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-foreground">
              Texto transcrito (edite o que for necessário):
            </label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Nenhum texto transcrito."
              className="text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelListening}
                className="text-xs h-8 text-muted-foreground"
              >
                Descartar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="text-xs h-8 gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Falar novamente</span>
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!transcript.trim()}
              className="text-xs h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Inserir na {targetLabel}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
