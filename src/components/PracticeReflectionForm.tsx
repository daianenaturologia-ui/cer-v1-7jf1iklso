import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FreeReflection } from '@/components/experience/FreeReflection'
import {
  CANONICAL_REFLECTION_PROMPTS,
  type ReflectionTarget,
  type ReflectionVisibility,
} from '@/types/cer'
import { Check, Lock, ShieldCheck, Sparkles } from 'lucide-react'

export interface ReflectionFormData {
  text?: string
  preferNotToAnswer?: boolean
  visibility: ReflectionVisibility
}

export interface PracticeReflectionFormProps {
  onSave: (data: {
    corpo?: ReflectionFormData
    mente?: ReflectionFormData
    emocao?: ReflectionFormData
  }) => Promise<void>
  onSkipAll?: () => void
  submitting?: boolean
}

export const PracticeReflectionForm: React.FC<PracticeReflectionFormProps> = ({
  onSave,
  onSkipAll,
  submitting = false,
}) => {
  const [corpoText, setCorpoText] = useState('')
  const [corpoPreferNot, setCorpoPreferNot] = useState(false)
  const [corpoVisibility, setCorpoVisibility] =
    useState<ReflectionVisibility>('participant_private')

  const [menteText, setMenteText] = useState('')
  const [mentePreferNot, setMentePreferNot] = useState(false)
  const [menteVisibility, setMenteVisibility] =
    useState<ReflectionVisibility>('participant_private')

  const [emocaoText, setEmocaoText] = useState('')
  const [emocaoPreferNot, setEmocaoPreferNot] = useState(false)
  const [emocaoVisibility, setEmocaoVisibility] =
    useState<ReflectionVisibility>('participant_private')

  const handleSubmit = async () => {
    const payload: {
      corpo?: ReflectionFormData
      mente?: ReflectionFormData
      emocao?: ReflectionFormData
    } = {}

    if (corpoText.trim() || corpoPreferNot) {
      payload.corpo = {
        text: corpoText.trim() || undefined,
        preferNotToAnswer: corpoPreferNot,
        visibility: corpoVisibility,
      }
    }

    if (menteText.trim() || mentePreferNot) {
      payload.mente = {
        text: menteText.trim() || undefined,
        preferNotToAnswer: mentePreferNot,
        visibility: menteVisibility,
      }
    }

    if (emocaoText.trim() || emocaoPreferNot) {
      payload.emocao = {
        text: emocaoText.trim() || undefined,
        preferNotToAnswer: emocaoPreferNot,
        visibility: emocaoVisibility,
      }
    }

    await onSave(payload)
  }

  const renderReflectionBlock = (
    target: ReflectionTarget,
    title: string,
    prompt: string,
    text: string,
    setText: (val: string) => void,
    preferNot: boolean,
    setPreferNot: (val: boolean) => void,
    visibility: ReflectionVisibility,
    setVisibility: (val: ReflectionVisibility) => void,
  ) => {
    return (
      <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary/80" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              {title}
            </h4>
          </div>

          {/* Controle de privacidade por padrão */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded">
            {visibility === 'participant_private' ? (
              <>
                <Lock className="w-3 h-3 text-primary" />
                <span>Privado por padrão</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Compartilhado no cuidado</span>
              </>
            )}
          </div>
        </div>

        <p className="text-sm font-medium text-foreground">{prompt}</p>

        {!preferNot && (
          <FreeReflection
            config={{
              placeholder: 'Descreva livremente o que você percebe agora...',
            }}
            value={text}
            onChange={setText}
          />
        )}

        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
            <Checkbox
              checked={preferNot}
              onCheckedChange={(checked) => {
                setPreferNot(Boolean(checked))
                if (checked) setText('')
              }}
            />
            <span className="text-[11px]">Prefiro não responder sobre este aspecto</span>
          </label>

          {!preferNot && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setVisibility(
                  visibility === 'participant_private' ? 'shared_care' : 'participant_private',
                )
              }
              className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              {visibility === 'participant_private'
                ? 'Tornar visível à profissional'
                : 'Tornar apenas pessoal'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-lg font-serif">Integração e Percepção Presente</CardTitle>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          Três perguntas independentes e opcionais para notar o seu estado ao concluir a prática.
          Suas percepções são privadas por padrão, não geram notas de desempenho e orientam seu
          próprio ritmo.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-5">
        {/* Pergunta 1: Corpo */}
        {renderReflectionBlock(
          'corpo',
          'Corpo',
          CANONICAL_REFLECTION_PROMPTS.corpo,
          corpoText,
          setCorpoText,
          corpoPreferNot,
          setCorpoPreferNot,
          corpoVisibility,
          setCorpoVisibility,
        )}

        {/* Pergunta 2: Mente */}
        {renderReflectionBlock(
          'mente',
          'Mente',
          CANONICAL_REFLECTION_PROMPTS.mente,
          menteText,
          setMenteText,
          mentePreferNot,
          setMentePreferNot,
          menteVisibility,
          setMenteVisibility,
        )}

        {/* Pergunta 3: Emoções */}
        {renderReflectionBlock(
          'emocao',
          'Emoções',
          CANONICAL_REFLECTION_PROMPTS.emocao,
          emocaoText,
          setEmocaoText,
          emocaoPreferNot,
          setEmocaoPreferNot,
          emocaoVisibility,
          setEmocaoVisibility,
        )}

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkipAll}
            className="text-xs h-8 text-muted-foreground"
          >
            Pular reflexão
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            size="sm"
            className="text-xs h-8 gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{submitting ? 'Salvando...' : 'Concluir Prática'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
