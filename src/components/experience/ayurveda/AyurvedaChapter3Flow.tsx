import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Mic, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import { experienceResponseService } from '@/services/experienceEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C3_CONTEXT_OPTIONS,
  AYV_C3_DIRECTION_OPTIONS,
  AYV_C3_DOMAIN_OPTIONS,
  AYV_C3_PROMPTS,
  AYV_C3_STARTED_OPTIONS,
  AYURVEDA_CHAPTER_3_ID,
  AYURVEDA_CHAPTER_3_VERSION,
  AyurvedaChapter3State,
  chapter3Label,
  deriveChapter3Status,
  loadChapter3State,
} from '@/services/ayurvedaChapter3'

interface Props {
  enrollmentId: string
  experienceId: string
  respondentUserId: string
  initialStep?: number
  onBackToHub: () => void
  onCompleted?: () => void
}

export const AyurvedaChapter3Flow: React.FC<Props> = ({
  enrollmentId,
  experienceId,
  respondentUserId,
  initialStep = 1,
  onBackToHub,
  onCompleted,
}) => {
  const [step, setStep] = useState(initialStep)
  const [state, setState] = useState<AyurvedaChapter3State>({})
  const [responses, setResponses] = useState<ExperienceResponseRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [showVoice, setShowVoice] = useState(false)

  useEffect(() => {
    let active = true
    experienceResponseService
      .listResponsesByExperience(enrollmentId, experienceId)
      .then((loaded) => {
        if (!active) return
        setResponses(loaded)
        setState(loadChapter3State(loaded))
        const derived = deriveChapter3Status(loaded)
        if (derived.status === 'completed' || derived.status === 'ready_to_complete') setStep(6)
        else setStep(initialStep || derived.firstUnansweredStep)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, experienceId, initialStep])

  const derived = useMemo(() => deriveChapter3Status(responses), [responses])
  const shortPath = (state.changed_domains || []).some((id) =>
    ['no_current_changes', 'dont_know', 'refusal'].includes(id),
  )

  const persist = async (
    prompt: (typeof AYV_C3_PROMPTS)[keyof typeof AYV_C3_PROMPTS],
    value: unknown,
    optionIds: string[],
    freeText = '',
  ) => {
    const now = new Date().toISOString()
    const saved = await experienceResponseService.saveResponse({
      enrollmentId,
      experienceId,
      promptId: prompt.id,
      respondentUserId,
      responseType: 'ChoiceCards' as any,
      promptVersion: 1,
      promptKey: prompt.key,
      canonicalPromptId: prompt.id,
      stepOrder: prompt.step_order,
      accessClass: 'shared_care',
      changeReason: 'Resposta da interagente ao Capítulo 3 de Corpo & Fisiologia',
      structuredValue: {
        value,
        selectedOptionIds: optionIds,
        chapter_id: AYURVEDA_CHAPTER_3_ID,
        experience_version: AYURVEDA_CHAPTER_3_VERSION,
        metadata: {
          prompt_key: prompt.key,
          canonical_prompt_id: prompt.id,
          domain: 'corpo_fisiologia',
          option_ids: optionIds,
          time_layer: 'current',
          stability: 'changed',
          source: 'participant_self_report',
          explicit_unsure: optionIds.includes('dont_know'),
          explicit_refusal: optionIds.includes('refusal'),
          answered_at: now,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          chapter_id: AYURVEDA_CHAPTER_3_ID,
        },
      },
      freeText,
    })
    ;(saved as any).prompt_key = prompt.key
    ;(saved as any).canonical_prompt_id = prompt.id
    setResponses((current) => [
      ...current.filter((response) => {
        const key =
          (response as any).prompt_key || (response.structured_value as any)?.metadata?.prompt_key
        return key !== prompt.key
      }),
      saved,
    ])
  }

  const toggleDomain = async (id: string) => {
    const option = AYV_C3_DOMAIN_OPTIONS.find((item) => item.id === id)
    const current = state.changed_domains || []
    const next = option?.exclusive
      ? current.includes(id)
        ? []
        : [id]
      : current.includes(id)
        ? current.filter((item) => item !== id)
        : [
            ...current.filter(
              (item) => !AYV_C3_DOMAIN_OPTIONS.find((o) => o.id === item)?.exclusive,
            ),
            id,
          ]
    setState((previous) => ({ ...previous, changed_domains: next, change_directions: {} }))
    await persist(AYV_C3_PROMPTS.DOMAINS, next, next)
  }

  const toggleContext = async (id: string) => {
    const option = AYV_C3_CONTEXT_OPTIONS.find((item) => item.id === id)
    const current = state.change_contexts || []
    const next = option?.exclusive
      ? current.includes(id)
        ? []
        : [id]
      : current.includes(id)
        ? current.filter((item) => item !== id)
        : [
            ...current.filter(
              (item) => !AYV_C3_CONTEXT_OPTIONS.find((o) => o.id === item)?.exclusive,
            ),
            id,
          ]
    setState((previous) => ({ ...previous, change_contexts: next }))
    await persist(AYV_C3_PROMPTS.CONTEXTS, next, next)
  }

  const complete = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C3_PROMPTS.COMPLETION.id,
        respondentUserId,
        responseType: 'ChapterCompletion' as any,
        promptVersion: 1,
        promptKey: AYV_C3_PROMPTS.COMPLETION.key,
        canonicalPromptId: AYV_C3_PROMPTS.COMPLETION.id,
        stepOrder: 5,
        accessClass: 'shared_care',
        changeReason: 'Conclusão explícita do Capítulo 3 de Corpo & Fisiologia',
        structuredValue: {
          completed: true,
          completed_at: now,
          chapter_id: AYURVEDA_CHAPTER_3_ID,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          metadata: { prompt_key: AYV_C3_PROMPTS.COMPLETION.key, answered_at: now },
        },
      })
      ;(saved as any).prompt_key = AYV_C3_PROMPTS.COMPLETION.key
      setResponses((current) => [...current, saved])
      onCompleted?.()
    } finally {
      setSaving(false)
    }
  }

  const optionButton = (selected: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl border p-3 text-left text-xs transition-colors ${
        selected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border/70 bg-card text-muted-foreground hover:bg-muted/30'
      }`}
    >
      {label}
    </button>
  )

  if (step === 6) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-4">
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center space-y-2">
          {derived.status === 'completed' ? (
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
          ) : (
            <Clock className="mx-auto h-7 w-7 text-amber-600" />
          )}
          <h2 className="font-serif text-2xl">
            {derived.status === 'completed'
              ? 'Capítulo 3 concluído'
              : 'Revise suas mudanças atuais'}
          </h2>
          <p className="text-xs text-muted-foreground">
            O habitual dos capítulos anteriores permanece separado do que está diferente agora.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">O que você registrou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p>
              <strong>Áreas:</strong>{' '}
              {(state.changed_domains || [])
                .map((id) => chapter3Label(AYV_C3_DOMAIN_OPTIONS, id))
                .join('; ')}
            </p>
            {!shortPath && (
              <>
                <div>
                  <strong>Direção das mudanças:</strong>
                  {(state.changed_domains || []).map((domain) => (
                    <p key={domain} className="mt-1 text-muted-foreground">
                      {chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain)}:{' '}
                      {chapter3Label(AYV_C3_DIRECTION_OPTIONS, state.change_directions?.[domain])}
                    </p>
                  ))}
                </div>
                <p>
                  <strong>Quando começou:</strong>{' '}
                  {chapter3Label(AYV_C3_STARTED_OPTIONS, state.started_change_at)}
                </p>
                <p>
                  <strong>Contextos percebidos:</strong>{' '}
                  {(state.change_contexts || [])
                    .map((id) => chapter3Label(AYV_C3_CONTEXT_OPTIONS, id))
                    .join('; ')}
                </p>
              </>
            )}
            {state.optional_note && (
              <p>
                <strong>Registro livre:</strong> “{state.optional_note}”
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={() => setStep(1)}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Rever respostas
          </Button>
          {derived.status === 'completed' ? (
            <Button onClick={onBackToHub}>Voltar aos capítulos</Button>
          ) : (
            <Button disabled={saving || derived.status !== 'ready_to_complete'} onClick={complete}>
              Concluir este capítulo
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="space-y-2">
        <Badge variant="outline">Capítulo 3 • Etapa {step} de 5</Badge>
        <h2 className="font-serif text-2xl">O que está diferente agora</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Aqui olhamos somente para mudanças do momento atual. Suas características antigas e seus
          ritmos habituais continuam preservados.
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Em quais áreas você percebe alguma mudança atualmente?
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {AYV_C3_DOMAIN_OPTIONS.map((option) => (
              <React.Fragment key={option.id}>
                {optionButton(
                  Boolean(state.changed_domains?.includes(option.id)),
                  () => void toggleDomain(option.id),
                  option.label,
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold">Como cada área mudou?</h3>
          {(state.changed_domains || []).map((domain) => (
            <div key={domain} className="space-y-2 rounded-xl border p-3">
              <p className="text-xs font-medium">{chapter3Label(AYV_C3_DOMAIN_OPTIONS, domain)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {AYV_C3_DIRECTION_OPTIONS.map((option) => (
                  <React.Fragment key={option.id}>
                    {optionButton(
                      state.change_directions?.[domain] === option.id,
                      () => {
                        const next = { ...(state.change_directions || {}), [domain]: option.id }
                        setState((previous) => ({ ...previous, change_directions: next }))
                        void persist(AYV_C3_PROMPTS.DIRECTIONS, next, Object.values(next))
                      },
                      option.label,
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Quando você começou a perceber essas mudanças?</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {AYV_C3_STARTED_OPTIONS.map((option) => (
              <React.Fragment key={option.id}>
                {optionButton(
                  state.started_change_at === option.id,
                  () => {
                    setState((previous) => ({ ...previous, started_change_at: option.id }))
                    void persist(AYV_C3_PROMPTS.STARTED_AT, option.id, [option.id])
                  },
                  option.label,
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Você relaciona essas mudanças a algum contexto?</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {AYV_C3_CONTEXT_OPTIONS.map((option) => (
              <React.Fragment key={option.id}>
                {optionButton(
                  Boolean(state.change_contexts?.includes(option.id)),
                  () => void toggleContext(option.id),
                  option.label,
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              Se quiser, conte algo que ajude Daiane a compreender melhor.
            </h3>
            <Textarea
              value={state.optional_note || ''}
              onChange={(event) =>
                setState((previous) => ({ ...previous, optional_note: event.target.value }))
              }
              onBlur={() =>
                void persist(
                  AYV_C3_PROMPTS.NOTE,
                  state.optional_note || '',
                  [],
                  state.optional_note || '',
                )
              }
              placeholder="Este registro é opcional."
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVoice((value) => !value)}
          >
            <Mic className="mr-1 h-4 w-4" />
            Falar em vez de escrever
          </Button>
          {showVoice && (
            <VoiceInputCapture
              targetLabel="registro sobre as mudanças atuais"
              onConfirmText={(text) => {
                setState((previous) => ({ ...previous, optional_note: text }))
                void persist(AYV_C3_PROMPTS.NOTE, text, [], text)
                setShowVoice(false)
              }}
              onCancel={() => setShowVoice(false)}
            />
          )}
        </div>
      )}

      <div className="flex justify-between gap-2 border-t pt-4">
        <Button
          variant="outline"
          onClick={step === 1 ? onBackToHub : () => setStep((current) => current - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {step === 1 ? 'Capítulos' : 'Voltar'}
        </Button>
        <Button
          disabled={step === 1 && !state.changed_domains?.length}
          onClick={() => {
            if (step === 1 && shortPath) setStep(5)
            else if (step === 5) {
              void persist(
                AYV_C3_PROMPTS.NOTE,
                state.optional_note || '',
                [],
                state.optional_note || '',
              )
              setStep(6)
            } else setStep((current) => current + 1)
          }}
        >
          {step === 5 ? 'Revisar' : 'Continuar'}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default AyurvedaChapter3Flow
