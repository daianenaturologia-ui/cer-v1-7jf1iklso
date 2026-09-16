import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, AlertCircle, ShieldCheck, Check, RotateCcw, Volume2 } from 'lucide-react'

// Declaração de tipos para SpeechRecognition do navegador (Web Speech API)
interface SpeechRecognitionEventLike {
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

interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface VoiceInputCaptureProps {
  onConfirmText: (confirmedText: string) => void
  onCancel?: () => void
  placeholder?: string
  className?: string
  targetLabel?: string
}

export type VoiceCaptureState =
  | 'idle' // Aguardando início
  | 'requesting_permission' // Solicitando acesso ao microfone
  | 'listening' // Captura ativa / transcrevendo em streaming local
  | 'reviewing' // Áudio finalizado; interagente revisa/edita antes de confirmar
  | 'unsupported' // Navegador sem suporte à Web Speech API
  | 'permission_denied' // Microfone negado
  | 'error' // Erro de hardware ou captura

/**
 * COMPONENTE DE CAPTURA E TRANSCRIÇÃO POR VOZ — CADERNO PRIVADO (CER V1)
 *
 * POLÍTICA DE PRIVACIDADE E RETENÇÃO DE ÁUDIO (P0):
 * 1. Processamento e Retenção:
 *    - O áudio capturado pelo microfone é convertido diretamente em fluxo de texto via Web Speech API do navegador.
 *    - NENHUM arquivo de áudio bruto (WAV, MP3, WebM) é gerado, persistido em disco, gravado em bucket S3 ou enviado a servidor PocketBase.
 *    - Zero persistência de áudio no backend CER.
 * 2. Transcrição Transparente:
 *    - A interagente enxerga o texto sendo transcrito em tempo real na tela.
 * 3. Revisão Soberana e Confirmação Prévia:
 *    - Ao parar a escuta, a interagente entra na etapa 'reviewing', onde pode ler, corrigir digitações, adicionar pontuações ou descartar totalmente.
 *    - Somente o texto aprovado explicitamente pela interagente é inserido no campo do Caderno.
 */
export const VoiceInputCapture: React.FC<VoiceInputCaptureProps> = ({
  onConfirmText,
  onCancel,
  targetLabel = 'anotação',
}) => {
  const [state, setState] = useState<VoiceCaptureState>('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Verificar suporte do navegador
  useEffect(() => {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechConstructor) {
      setState('unsupported')
    }
  }, [])

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* intentionally ignored */
        }
      }
    }
  }, [])

  const startListening = useCallback(async () => {
    setErrorMessage(null)
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechConstructor) {
      setState('unsupported')
      return
    }

    // Solicitar permissão de microfone previamente para UX acolhedora
    setState('requesting_permission')
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Liberar a stream imediatamente — a Web Speech API gerenciará o microfone
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setState('permission_denied')
        setErrorMessage('Permissão para uso do microfone foi recusada no navegador.')
        return
      }
      // Se não der pelo getUserMedia (ex.: ambiente com restrições), tenta instanciar SpeechRecognition diretamente
    }

    try {
      const recognition = new SpeechConstructor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'pt-BR'

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
        setTranscript(accumulated + currentInterim)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (event.error === 'not-allowed') {
          setState('permission_denied')
          setErrorMessage('Permissão para acesso ao microfone foi negada.')
        } else if (event.error === 'no-speech') {
          // Apenas silêncio — manter escutando
        } else {
          setState('error')
          setErrorMessage(`Erro na transcrição de voz: ${event.error}`)
        }
      }

      recognition.onend = () => {
        // Se ainda estava ouvindo, transita para revisão
        setState((prev) => (prev === 'listening' ? 'reviewing' : prev))
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: unknown) {
      setState('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Não foi possível iniciar a captura de voz.',
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
    setState('idle')
    if (onCancel) onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    const clean = transcript.trim()
    if (!clean) {
      cancelListening()
      return
    }
    onConfirmText(clean)
    setTranscript('')
    setState('idle')
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
      {/* Topo informativo sobre privacidade e retenção de áudio */}
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            Transcrição por Voz para {targetLabel}
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] gap-1 font-mono uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Áudio não persistido</span>
        </Badge>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Sua fala é transcrita pelo próprio navegador e convertida em texto. Nenhum arquivo de áudio
        é gravado ou guardado em servidores. Você poderá revisar e editar todo o texto antes de
        confirmar.
      </p>

      {/* Estados não-suportados ou de erro */}
      {state === 'unsupported' && (
        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-300 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Navegador sem suporte a Web Speech API</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Seu navegador atual não disponibiliza transcrição de voz local (Web Speech API). Para
            garantir privacidade e não enviar seu áudio a serviços externos de terceiros,
            recomendamos digitar ou utilizar o Google Chrome, Edge ou Safari atualizados.
          </p>
          <div className="pt-1 flex justify-end">
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-7">
              Fechar
            </Button>
          </div>
        </div>
      )}

      {state === 'permission_denied' && (
        <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <MicOff className="w-4 h-4 shrink-0" />
            <span>Microfone não autorizado</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {errorMessage ||
              'O acesso ao microfone foi negado. Verifique as permissões do seu navegador para usar a fala.'}
          </p>
          <div className="pt-1 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelListening} className="text-xs h-7">
              Cancelar
            </Button>
            <Button size="sm" onClick={startListening} className="text-xs h-7">
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="p-2.5 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Erro na captura</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{errorMessage}</p>
          <div className="pt-1 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelListening} className="text-xs h-7">
              Cancelar
            </Button>
            <Button size="sm" onClick={startListening} className="text-xs h-7">
              Reiniciar fala
            </Button>
          </div>
        </div>
      )}

      {/* Estado Idle */}
      {state === 'idle' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground">
            Clique para começar a falar em português (pt-BR).
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
              <span>Iniciar captura de fala</span>
            </Button>
          </div>
        </div>
      )}

      {/* Estado Solicitando Permissão */}
      {state === 'requesting_permission' && (
        <div className="flex items-center justify-between p-3 rounded bg-muted/40 text-xs">
          <span className="text-muted-foreground flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary animate-pulse" />
            Solicitando permissão de microfone ao navegador...
          </span>
          <Button variant="ghost" size="sm" onClick={cancelListening} className="text-xs h-7">
            Cancelar
          </Button>
        </div>
      )}

      {/* Estado Escutando / Transcrevendo em tempo real */}
      {state === 'listening' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-foreground">
                Gravando e transcrevendo...
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Fale livremente em português
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

      {/* Estado Revisando / Editando antes de guardar */}
      {state === 'reviewing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 rounded bg-emerald-500/10 border border-emerald-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Fala transcrita — Revise antes de guardar
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
