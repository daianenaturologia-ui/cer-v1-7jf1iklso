import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { ChoiceCards } from '@/components/experience/ChoiceCards'
import { SimpleScale } from '@/components/experience/SimpleScale'
import { FreeReflection } from '@/components/experience/FreeReflection'
import { MultiSelectCards } from '@/components/experience/MultiSelectCards'
import { cerPracticeResponseService } from '@/services/cerPracticeResponseService'
import type {
  CerPracticeAssignmentRecord,
  PracticeResponseType,
  PracticeResponseSafetyFlag,
} from '@/types/cer'
import { Shield, Sparkles, Lock, ArrowLeft, ArrowRight, Check } from 'lucide-react'

interface QuickResponseFlowProps {
  assignment: CerPracticeAssignmentRecord
  plannerItemId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialExecutionSummary?: {
    completed_repetitions?: number
    completed_cycles?: number
    completed_series?: number
    actual_duration_seconds?: number
    ended_early?: boolean
    stop_reason?: string
    completed_step_ids?: string[]
  }
}

export const QuickResponseFlow: React.FC<QuickResponseFlowProps> = ({
  assignment,
  plannerItemId,
  isOpen,
  onClose,
  onSuccess,
  initialExecutionSummary,
}) => {
  const { user } = useAuth()
  const { toast } = useToast()

  // Estado do fluxo
  const [step, setStep] = useState<'quick' | 'deeper'>('quick')
  const [responseType, setResponseType] = useState<PracticeResponseType | null>(null)
  const [perceivedHelpfulness, setPerceivedHelpfulness] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [barrierOptions, setBarrierOptions] = useState<string[]>([])
  const [sharedReflection, setSharedReflection] = useState('')
  const [privateNoteText, setPrivateNoteText] = useState('')
  const [wantsToContinue, setWantsToContinue] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Opções do Quick Response (1 toque, enum fechado do Build 08E)
  const quickChoiceOptions = [
    { id: 'helped', title: 'Ajudou', description: 'Senti um efeito favorável no meu estado.' },
    {
      id: 'helped_a_bit',
      title: 'Ajudou um pouco',
      description: 'Percebi uma leve diferença positiva.',
    },
    {
      id: 'no_perceived_difference',
      title: 'Não percebi diferença',
      description: 'Nem melhora nem desconforto evidente.',
    },
    {
      id: 'was_difficult',
      title: 'Foi difícil',
      description: 'Encontrei barreiras ou exigiu muito esforço.',
    },
    {
      id: 'was_too_much',
      title: 'Foi demais',
      description: 'Gerou sobrecarga ou desconforto desproporcional.',
    },
    {
      id: 'could_not_do',
      title: 'Não consegui fazer',
      description: 'Houve impedimentos de tempo, energia ou contexto.',
    },
    {
      id: 'chose_not_to_do',
      title: 'Escolhi não fazer',
      description: 'Decisão consciente e válida de priorizar outro ritmo.',
    },
    {
      id: 'adapted',
      title: 'Adaptei à minha maneira',
      description: 'Ajustei tempo, postura ou forma de realização.',
    },
    {
      id: 'did_not_make_sense',
      title: 'Não fez sentido',
      description: 'Não conversei com a prática neste momento.',
    },
    {
      id: 'wants_to_tell',
      title: 'Quero contar com calma',
      description: 'Gostaria de detalhar com minhas próprias palavras.',
    },
  ]

  // Se could_not_do: opções leves de barreiras
  const barrierChoices = [
    { id: 'tempo', title: 'Tempo curto' },
    { id: 'energia', title: 'Baixa energia / cansaço' },
    { id: 'esqueci', title: 'Esqueci no momento' },
    { id: 'conforto', title: 'Falta de conforto / espaço adequado' },
    { id: 'prioridade', title: 'Outras prioridades do dia' },
    { id: 'foi_demais', title: 'Pareceu exigente demais antes de começar' },
    { id: 'nao_entendi', title: 'Dúvida sobre como executar' },
    { id: 'contexto', title: 'Contexto imprevisível / imprevistos' },
  ]

  // Critérios para sugerir reflexão aprofundada
  const triggersDeeperReflection = (type: PracticeResponseType) => {
    return (
      type === 'was_too_much' ||
      type === 'was_difficult' ||
      type === 'could_not_do' ||
      type === 'wants_to_tell' ||
      type === 'adapted'
    )
  }

  const handleSelectQuickChoice = (selected: string) => {
    const chosenType = selected as PracticeResponseType
    setResponseType(chosenType)

    // Se o tipo demanda ou sugere aprofundamento, avança para step 2
    if (triggersDeeperReflection(chosenType)) {
      setStep('deeper')
    }
  }

  const handleSaveResponse = async () => {
    if (!responseType || !user?.id) return

    setSubmitting(true)
    try {
      // Determinar safety_flag: was_too_much -> needs_review automaticamente
      let safetyFlag: PracticeResponseSafetyFlag = 'none'
      if (responseType === 'was_too_much') {
        safetyFlag = 'needs_review'
      }

      const adaptationText =
        barrierOptions.length > 0 ? `Barreiras percebidas: ${barrierOptions.join(', ')}` : undefined

      await cerPracticeResponseService.recordResponse({
        assignment_id: assignment.id,
        planner_item_id: plannerItemId,
        participant_user_id: user.id,
        enrollment_id: assignment.enrollment_id,
        care_cycle_id: assignment.care_cycle_id,
        practice_version_id: assignment.practice_version_id,
        response_type: responseType,
        perceived_helpfulness: perceivedHelpfulness || undefined,
        difficulty: difficulty || undefined,
        adaptation_used: adaptationText,
        wants_to_continue: wantsToContinue !== null ? wantsToContinue : undefined,
        safety_flag: safetyFlag,
        shared_reflection: sharedReflection.trim() ? sharedReflection.trim() : undefined,
        private_note_text: privateNoteText.trim() ? privateNoteText.trim() : undefined,
        completed_repetitions: initialExecutionSummary?.completed_repetitions,
        completed_cycles: initialExecutionSummary?.completed_cycles,
        completed_series: initialExecutionSummary?.completed_series,
        actual_duration_seconds: initialExecutionSummary?.actual_duration_seconds,
        ended_early: initialExecutionSummary?.ended_early,
        stop_reason: initialExecutionSummary?.stop_reason,
        completed_step_ids: initialExecutionSummary?.completed_step_ids,
      })

      toast({
        title: 'Resposta registrada com acolhimento',
        description:
          responseType === 'was_too_much'
            ? 'Notamos que foi demais. Sinalizamos para revisão com a profissional.'
            : 'Sua percepção foi acolhida e orienta o cuidado compartilhado.',
      })

      onSuccess()
    } catch (err: unknown) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              {assignment.participant_safe_title}
            </span>
          </div>
          <DialogTitle className="text-xl font-serif font-semibold">
            {step === 'quick' ? 'Como isso foi para você?' : 'Quer nos contar mais um pouco?'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'quick'
              ? 'Sua resposta ajuda a calibrar a intensidade e a adequação do cuidado. Não existe certo ou errado.'
              : 'Espaço aberto para aprofundar suas percepções com calma e sem cobranças.'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Quick Response (1 toque) */}
        {step === 'quick' && (
          <div className="py-2 space-y-4">
            <ChoiceCards
              config={{ options: quickChoiceOptions }}
              value={responseType}
              onChange={handleSelectQuickChoice}
            />

            <div className="flex justify-between items-center pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <span>Você pode detalhar ou salvar diretamente após escolher.</span>
              {responseType && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStep('deeper')}
                  className="text-xs h-8 text-primary"
                >
                  <span>Deseja detalhar mais?</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Deeper Reflection (Condicional ou Opcional) */}
        {step === 'deeper' && (
          <div className="py-2 space-y-5">
            {/* Aviso se for was_too_much */}
            {responseType === 'was_too_much' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold block">Acolhemos o seu limite</span>
                  <span>
                    Sentir que "foi demais" é um sinal precioso. Avisamos sua profissional para
                    revisar o ritmo e propor variantes mais leves.
                  </span>
                </div>
              </div>
            )}

            {/* Se could_not_do: Barreiras sem rótulo */}
            {responseType === 'could_not_do' && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-foreground block">
                  O que parece ter tornado isso difícil? (Opcional — nenhuma opção vira rótulo)
                </span>
                <MultiSelectCards
                  config={{ options: barrierChoices }}
                  value={barrierOptions}
                  onChange={setBarrierOptions}
                />
              </div>
            )}

            {/* Escala de Ajudou / Dificuldade */}
            {(responseType === 'helped' || responseType === 'helped_a_bit') && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-foreground block">
                  Quanto você sentiu que ajudou no momento? (1 = Pouco, 5 = Muito)
                </span>
                <SimpleScale
                  config={{
                    min: 1,
                    max: 5,
                    leftAnchor: 'Apenas uma nuance',
                    centerAnchor: 'Bom apoio',
                    rightAnchor: 'Mudança nítida',
                  }}
                  value={perceivedHelpfulness}
                  onChange={setPerceivedHelpfulness}
                />
              </div>
            )}

            {responseType === 'was_difficult' && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-foreground block">
                  Grau de esforço ou barreira percebido (1 = Leve atrito, 5 = Muito pesado)
                </span>
                <SimpleScale
                  config={{
                    min: 1,
                    max: 5,
                    leftAnchor: 'Pequeno atrito',
                    centerAnchor: 'Exigiu foco',
                    rightAnchor: 'Muito pesado',
                  }}
                  value={difficulty}
                  onChange={setDifficulty}
                />
              </div>
            )}

            {/* Reflexão Compartilhada com a Profissional */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Reflexão compartilhada com a sua profissional (Opcional)</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                Apenas o que você escrever aqui será visível no prontuário compartilhado de cuidado.
              </p>
              <FreeReflection
                config={{
                  placeholder: 'Quer contar com suas palavras como você se sentiu?',
                }}
                value={sharedReflection}
                onChange={setSharedReflection}
              />
            </div>

            {/* Bloco de Privacidade Estrita: Nota Privada do Interagente */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Nota íntima privada (Só você vê — Zero acesso profissional ou IA)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Espaço 100% reservado. Nada aqui entra em relatórios, resumos de IA, Mandalas ou
                visualização profissional.
              </p>
              <FreeReflection
                config={{
                  placeholder:
                    'Seus sentimentos íntimos, desabafos ou anotações pessoais sobre este momento...',
                }}
                value={privateNoteText}
                onChange={setPrivateNoteText}
              />
            </div>

            {/* Continuidade opcional */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">Quer continuar com este experimento?</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={wantsToContinue === true ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setWantsToContinue(true)}
                >
                  Sim
                </Button>
                <Button
                  size="sm"
                  variant={wantsToContinue === false ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setWantsToContinue(false)}
                >
                  Prefiro pausar
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between pt-2 border-t border-border/40">
          <div>
            {step === 'deeper' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('quick')}
                className="text-xs h-8"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Voltar à escolha</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
                Pular / Fechar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              disabled={!responseType || submitting}
              onClick={handleSaveResponse}
              size="sm"
              className="text-xs h-8 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Salvando...' : 'Concluir Registro'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
