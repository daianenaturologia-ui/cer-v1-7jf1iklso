import { CerArtStrip } from '@/components/CerArtwork'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mic,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import { experienceResponseService } from '@/services/experienceEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C3_CONTEXT_OPTIONS,
  chapter3DirectionOptions,
  AYV_C3_DOMAIN_OPTIONS,
  AYV_C3_SKIN_HAIR_HELP,
  AYV_C3_MEDICATION_STATUS_OPTIONS,
  AYV_C3_MEDICATION_TIMING_OPTIONS,
  AYV_C3_PROMPTS,
  AYV_C3_STARTED_OPTIONS,
  AYURVEDA_CHAPTER_3_ID,
  AYURVEDA_CHAPTER_3_VERSION,
  AyurvedaChapter3State,
  AyurvedaMedicationItem,
  AyurvedaMedicationStatus,
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
  const [isCorrectionMode, setIsCorrectionMode] = useState(false)
  const [showCorrectionConfirmation, setShowCorrectionConfirmation] = useState(false)
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const medicationItemsRef = useRef<AyurvedaMedicationItem[]>([])
  const revisionNumberRef = useRef(1)

  useEffect(() => {
    let active = true
    experienceResponseService
      .listResponsesByExperience(enrollmentId, experienceId)
      .then((loaded) => {
        if (!active) return
        setResponses(loaded)
        const loadedState = loadChapter3State(loaded)
        medicationItemsRef.current = loadedState.medication_items || []
        setState(loadedState)
        const derived = deriveChapter3Status(loaded)
        const completion = loaded.find((response) => {
          const key =
            (response as any).prompt_key ||
            (response.structured_value as any)?.metadata?.prompt_key ||
            response.prompt_id
          return key === AYV_C3_PROMPTS.COMPLETION.key
        })
        revisionNumberRef.current =
          (completion?.structured_value as any)?.metadata?.chapter_revision_number || 1
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

  const savePrompt = async (
    prompt: (typeof AYV_C3_PROMPTS)[keyof typeof AYV_C3_PROMPTS],
    value: unknown,
    optionIds: string[],
    freeText = '',
    changeReason = 'Resposta da interagente ao Capítulo 3 de Corpo & Fisiologia',
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
      changeReason,
      structuredValue: {
        value,
        selectedOptionIds: optionIds,
        chapter_id: AYURVEDA_CHAPTER_3_ID,
        experience_version: AYURVEDA_CHAPTER_3_VERSION,
        chapter_revision_number: revisionNumberRef.current,
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
          chapter_revision_number: revisionNumberRef.current,
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

  const persist = async (
    prompt: (typeof AYV_C3_PROMPTS)[keyof typeof AYV_C3_PROMPTS],
    value: unknown,
    optionIds: string[],
    freeText = '',
  ) => {
    // Durante uma correção, as mudanças permanecem apenas no rascunho local.
    // A versão compartilhada só é substituída depois da nova conclusão explícita.
    if (isCorrectionMode) return
    await savePrompt(prompt, value, optionIds, freeText)
  }

  const toggleDomain = async (id: string) => {
    const option = AYV_C3_DOMAIN_OPTIONS.find((item) => item.id === id)
    const isExclusive = Boolean(option && 'exclusive' in option && option.exclusive)
    const current = state.changed_domains || []
    const next = isExclusive
      ? current.includes(id)
        ? []
        : [id]
      : current.includes(id)
        ? current.filter((item) => item !== id)
        : [
            ...current.filter((item) => {
              const o = AYV_C3_DOMAIN_OPTIONS.find((opt) => opt.id === item)
              return !(o && 'exclusive' in o && o.exclusive)
            }),
            id,
          ]
    setState((previous) => ({ ...previous, changed_domains: next, change_directions: {} }))
    await persist(AYV_C3_PROMPTS.DOMAINS, next, next)
  }

  const toggleContext = async (id: string) => {
    const option = AYV_C3_CONTEXT_OPTIONS.find((item) => item.id === id)
    const isExclusive = Boolean(option && 'exclusive' in option && option.exclusive)
    const current = state.change_contexts || []
    const next = isExclusive
      ? current.includes(id)
        ? []
        : [id]
      : current.includes(id)
        ? current.filter((item) => item !== id)
        : [
            ...current.filter((item) => {
              const o = AYV_C3_CONTEXT_OPTIONS.find((opt) => opt.id === item)
              return !(o && 'exclusive' in o && o.exclusive)
            }),
            id,
          ]
    setState((previous) => ({ ...previous, change_contexts: next }))
    await persist(AYV_C3_PROMPTS.CONTEXTS, next, next)
  }

  const persistMedicationItems = async (items: AyurvedaMedicationItem[]) => {
    medicationItemsRef.current = items
    setState((previous) => ({ ...previous, medication_items: items }))
    await persist(
      AYV_C3_PROMPTS.MEDICATION_DETAILS,
      items,
      items.map((item) => item.id),
    )
  }

  const selectMedicationStatus = async (status: AyurvedaMedicationStatus) => {
    const keepItems = status === 'current_use' || status === 'recent_change'
    const items = keepItems
      ? state.medication_items?.length
        ? state.medication_items
        : [
            {
              id: `medication-${Date.now()}`,
              kind: 'medication' as const,
              name: '',
              timing: status === 'recent_change' ? 'started_recently' : 'ongoing_stable',
            },
          ]
      : []
    setState((previous) => ({
      ...previous,
      medication_status: status,
      medication_items: items,
    }))
    medicationItemsRef.current = items
    await persist(AYV_C3_PROMPTS.MEDICATION_STATUS, status, [status])
    if (!keepItems && state.medication_items?.length) await persistMedicationItems([])
  }

  const updateMedicationItem = (id: string, patch: Partial<AyurvedaMedicationItem>) => {
    const items = medicationItemsRef.current.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    )
    medicationItemsRef.current = items
    setState((previous) => ({ ...previous, medication_items: items }))
    return items
  }

  const medicationDetailsRequired =
    state.medication_status === 'current_use' || state.medication_status === 'recent_change'
  const medicationDetailsReady =
    !medicationDetailsRequired ||
    Boolean(
      state.medication_items?.length && state.medication_items.every((item) => item.name.trim()),
    )

  const complete = async () => {
    setSaving(true)
    setCorrectionError(null)
    try {
      if (isCorrectionMode) {
        const reason = 'Correção concluída pela interagente no Capítulo 3 de Corpo & Fisiologia'
        await savePrompt(
          AYV_C3_PROMPTS.DOMAINS,
          state.changed_domains || [],
          state.changed_domains || [],
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.DIRECTIONS,
          state.change_directions || {},
          Object.values(state.change_directions || {}),
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.STARTED_AT,
          state.started_change_at || '',
          state.started_change_at ? [state.started_change_at] : [],
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.CONTEXTS,
          state.change_contexts || [],
          state.change_contexts || [],
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.MEDICATION_STATUS,
          state.medication_status || '',
          state.medication_status ? [state.medication_status] : [],
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.MEDICATION_DETAILS,
          state.medication_items || [],
          (state.medication_items || []).map((item) => item.id),
          '',
          reason,
        )
        await savePrompt(
          AYV_C3_PROMPTS.NOTE,
          state.optional_note || '',
          [],
          state.optional_note || '',
          reason,
        )
      }
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
        changeReason: isCorrectionMode
          ? 'Conclusão explícita da correção do Capítulo 3 de Corpo & Fisiologia'
          : 'Conclusão explícita do Capítulo 3 de Corpo & Fisiologia',
        structuredValue: {
          completed: true,
          completed_at: now,
          chapter_id: AYURVEDA_CHAPTER_3_ID,
          experience_version: AYURVEDA_CHAPTER_3_VERSION,
          metadata: {
            prompt_key: AYV_C3_PROMPTS.COMPLETION.key,
            answered_at: now,
            chapter_revision_number: revisionNumberRef.current,
          },
        },
      })
      ;(saved as any).prompt_key = AYV_C3_PROMPTS.COMPLETION.key
      setResponses((current) => [...current, saved])
      setIsCorrectionMode(false)
      onCompleted?.()
      if (isCorrectionMode) onBackToHub()
    } catch (error) {
      console.error('Erro ao concluir correção do Capítulo 3:', error)
      setCorrectionError(
        'Não foi possível concluir a correção agora. Seu rascunho continua nesta tela para você tentar novamente.',
      )
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
                      {chapter3Label(
                        chapter3DirectionOptions(domain),
                        state.change_directions?.[domain],
                      )}
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
            {state.medication_status && (
              <div className="space-y-1">
                <p>
                  <strong>Medicamentos e suplementos:</strong>{' '}
                  {chapter3Label(AYV_C3_MEDICATION_STATUS_OPTIONS, state.medication_status)}
                </p>
                {(state.medication_items || []).map((item) => (
                  <p key={item.id} className="text-muted-foreground">
                    {item.name}
                    {item.dose ? ` • ${item.dose}` : ''}
                    {item.frequency ? ` • ${item.frequency}` : ''}
                    {item.timing
                      ? ` • ${chapter3Label(AYV_C3_MEDICATION_TIMING_OPTIONS, item.timing)}`
                      : ''}
                  </p>
                ))}
              </div>
            )}
            {state.optional_note && (
              <p>
                <strong>Registro livre:</strong> “{state.optional_note}”
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-wrap justify-between gap-2">
          {derived.status === 'completed' && !isCorrectionMode ? (
            <Button variant="outline" onClick={() => setShowCorrectionConfirmation(true)}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Corrigir minhas respostas
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(1)}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Rever respostas
            </Button>
          )}
          {derived.status === 'completed' ? (
            isCorrectionMode ? (
              <Button disabled={saving} onClick={complete}>
                Concluir correção
              </Button>
            ) : (
              <Button onClick={onBackToHub}>Voltar aos capítulos</Button>
            )
          ) : (
            <Button disabled={saving || derived.status !== 'ready_to_complete'} onClick={complete}>
              Concluir este capítulo
            </Button>
          )}
        </div>
        {correctionError && (
          <p role="alert" className="text-xs text-destructive">
            {correctionError}
          </p>
        )}
        {showCorrectionConfirmation && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="c3-correction-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          >
            <div className="cer-dialog w-full max-w-md space-y-4 rounded-2xl bg-background p-5 shadow-xl">
              <CerArtStrip variant="seed" />
              <h3 id="c3-correction-dialog-title" className="font-serif text-lg font-semibold">
                Corrigir respostas do Capítulo 3?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Suas respostas atuais serão carregadas para correção. A versão já concluída
                continuará preservada até você revisar e concluir novamente este capítulo.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCorrectionConfirmation(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCorrectionConfirmation(false)
                    revisionNumberRef.current += 1
                    setIsCorrectionMode(true)
                    setStep(1)
                  }}
                >
                  Começar correção
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="space-y-2">
        <Badge variant="outline">Capítulo 3 • Etapa {step} de 5</Badge>
        {isCorrectionMode && (
          <Badge variant="secondary">Correção em andamento — versão anterior preservada</Badge>
        )}
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
              {domain === 'skin_hair' && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {AYV_C3_SKIN_HAIR_HELP}
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {chapter3DirectionOptions(domain).map((option) => (
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
          <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Medicamentos e suplementos</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Você usa algum medicamento ou suplemento atualmente, ou começou, parou ou alterou
                algum recentemente?
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {AYV_C3_MEDICATION_STATUS_OPTIONS.map((option) => (
                <React.Fragment key={option.id}>
                  {optionButton(
                    state.medication_status === option.id,
                    () => void selectMedicationStatus(option.id),
                    option.label,
                  )}
                </React.Fragment>
              ))}
            </div>

            {medicationDetailsRequired && (
              <div className="space-y-3 border-t border-primary/15 pt-3">
                <p className="text-xs text-muted-foreground">
                  Registre o que souber. Dose e datas podem ficar em branco.
                </p>
                {(state.medication_items || []).map((item, index) => (
                  <div key={item.id} className="space-y-3 rounded-xl border bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">Item {index + 1}</span>
                      {(state.medication_items || []).length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remover item ${index + 1}`}
                          onClick={() =>
                            void persistMedicationItems(
                              (state.medication_items || []).filter(
                                (candidate) => candidate.id !== item.id,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-xs">
                        <span>Tipo</span>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3"
                          value={item.kind}
                          onChange={(event) =>
                            updateMedicationItem(item.id, {
                              kind: event.target.value as AyurvedaMedicationItem['kind'],
                            })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                        >
                          <option value="medication">Medicamento</option>
                          <option value="supplement">Suplemento</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>Nome *</span>
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            updateMedicationItem(item.id, { name: event.target.value })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Nome do medicamento ou suplemento"
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>Dose, se souber</span>
                        <Input
                          value={item.dose || ''}
                          onChange={(event) =>
                            updateMedicationItem(item.id, { dose: event.target.value })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Ex.: 75 mcg"
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>Frequência</span>
                        <Input
                          value={item.frequency || ''}
                          onChange={(event) =>
                            updateMedicationItem(item.id, { frequency: event.target.value })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Ex.: uma vez ao dia"
                        />
                      </label>
                      <label className="space-y-1 text-xs sm:col-span-2">
                        <span>Como está esse uso?</span>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3"
                          value={item.timing || 'dont_know'}
                          onChange={(event) =>
                            void persistMedicationItems(
                              updateMedicationItem(item.id, { timing: event.target.value }),
                            )
                          }
                        >
                          {AYV_C3_MEDICATION_TIMING_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>Quando começou ou mudou?</span>
                        <Input
                          value={item.started_or_changed_at || ''}
                          onChange={(event) =>
                            updateMedicationItem(item.id, {
                              started_or_changed_at: event.target.value,
                            })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Ex.: há cerca de 2 meses"
                        />
                      </label>
                      <label className="space-y-1 text-xs">
                        <span>Para quê utiliza?</span>
                        <Input
                          value={item.purpose || ''}
                          onChange={(event) =>
                            updateMedicationItem(item.id, { purpose: event.target.value })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Se souber ou quiser informar"
                        />
                      </label>
                      <label className="space-y-1 text-xs sm:col-span-2">
                        <span>O que percebeu depois de começar, parar ou alterar?</span>
                        <Textarea
                          value={item.perceived_changes || ''}
                          onChange={(event) =>
                            updateMedicationItem(item.id, {
                              perceived_changes: event.target.value,
                            })
                          }
                          onBlur={() => void persistMedicationItems(medicationItemsRef.current)}
                          placeholder="Opcional. Registre apenas o que você percebeu, sem precisar concluir a causa."
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void persistMedicationItems([
                      ...(state.medication_items || []),
                      {
                        id: `medication-${Date.now()}`,
                        kind: 'medication',
                        name: '',
                        timing: 'ongoing_stable',
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar outro
                </Button>
              </div>
            )}
          </div>
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
          disabled={
            (step === 1 && !state.changed_domains?.length) ||
            (step === 5 && (!state.medication_status || !medicationDetailsReady))
          }
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
