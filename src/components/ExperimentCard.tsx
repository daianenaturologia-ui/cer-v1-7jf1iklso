import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react'
import type {
  CerPracticeAssignmentRecord,
  CapacityResponseValue,
  CerPracticeConsentRecord,
} from '@/types/cer'
import { QuickResponseFlow } from './QuickResponseFlow'
import pb from '@/lib/pocketbase/client'

interface ExperimentCardProps {
  assignment: CerPracticeAssignmentRecord
  onConfirm?: (assignmentId: string, capacity: CapacityResponseValue) => Promise<void>
  onResponseRecorded?: () => void
  readOnly?: boolean
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  assignment,
  onConfirm,
  onResponseRecorded,
  readOnly = false,
}) => {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [consentModalOpen, setConsentModalOpen] = useState(false)
  const [consentRecord, setConsentRecord] = useState<CerPracticeConsentRecord | null>(null)
  const [consentUnderstanding, setConsentUnderstanding] = useState<
    'understood' | 'want_to_ask' | 'did_not_understand'
  >('understood')
  const [consentSubmitting, setConsentSubmitting] = useState(false)

  const isActive = assignment.status === 'active'
  const isPaused = assignment.status === 'paused'
  const isStopped = assignment.status === 'stopped'

  // Checar se a prática exige consentimento formal
  React.useEffect(() => {
    const checkConsent = async () => {
      if (!assignment.practice_version_id || !assignment.enrollment_id) return
      try {
        const list = await pb
          .collection('cer_practice_consents')
          .getFullList<CerPracticeConsentRecord>({
            filter: `enrollment_id = "${assignment.enrollment_id}" && practice_version_id = "${assignment.practice_version_id}" && record_status = "current"`,
            sort: '-created',
          })
        if (list.length > 0) {
          setConsentRecord(list[0])
        }
      } catch (err) {
        // silencioso
      }
    }
    checkConsent()
  }, [assignment.id])

  const handleRecordConsent = async (decision: 'accepted' | 'declined') => {
    if (!assignment.practice_version_id || !assignment.enrollment_id) return
    setConsentSubmitting(true)
    try {
      const created = await pb
        .collection('cer_practice_consents')
        .create<CerPracticeConsentRecord>({
          enrollment_id: assignment.enrollment_id,
          practice_version_id: assignment.practice_version_id,
          consent_policy: 'formal_written_consent',
          consent_text_version: '1.0',
          presented_summary: assignment.participant_safe_summary || 'Orientações do experimento.',
          understanding_response: consentUnderstanding,
          decision,
          record_status: 'current',
        })
      setConsentRecord(created)
      setConsentModalOpen(false)
    } catch (err) {
      console.error('Erro ao registrar consentimento:', err)
    } finally {
      setConsentSubmitting(false)
    }
  }

  const handleWithdrawConsent = async () => {
    if (!consentRecord) return
    setConsentSubmitting(true)
    try {
      await pb.collection('cer_practice_consents').update(consentRecord.id, {
        record_status: 'withdrawn',
        withdrawn_at: new Date().toISOString(),
      })
      // Pausar o assignment associado
      await pb.collection('cer_practice_assignments').update(assignment.id, {
        status: 'paused',
        lifecycle_stage: 'paused_by_participant',
      })
      setConsentRecord((prev) => (prev ? { ...prev, record_status: 'withdrawn' } : null))
    } catch (err) {
      console.error('Erro ao revogar consentimento:', err)
    } finally {
      setConsentSubmitting(false)
    }
  }

  return (
    <>
      <Card className="border-border/70 hover:border-border transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary" />
                <Badge variant="outline" className="text-[10px] uppercase font-normal">
                  Experimento de Cuidado
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold text-foreground mt-1">
                {assignment.participant_safe_title}
              </CardTitle>
              {assignment.participant_safe_summary && (
                <CardDescription className="text-xs mt-1 text-muted-foreground">
                  {assignment.participant_safe_summary}
                </CardDescription>
              )}
            </div>
            <Badge
              variant={isActive ? 'default' : isPaused ? 'secondary' : 'outline'}
              className="text-[11px] capitalize shrink-0"
            >
              {isActive
                ? 'Em experimento'
                : isPaused
                  ? 'Em pausa'
                  : isStopped
                    ? 'Interrompido'
                    : assignment.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Seção "Antes de Começar": Safety Consent Participante */}
          {(!consentRecord || consentRecord.record_status === 'superseded') && !readOnly && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Antes de começar: Cuidados & Esclarecimentos</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Este experimento requer que você compreenda seus objetivos, cuidados e saiba que
                pode perguntar ou pausar quando quiser.
              </p>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs px-3"
                onClick={() => setConsentModalOpen(true)}
              >
                Ler Cuidados & Consentir
              </Button>
            </div>
          )}

          {consentRecord && consentRecord.record_status === 'current' && (
            <div className="p-2 rounded bg-muted/40 border border-border/40 text-[11px] flex items-center justify-between text-muted-foreground">
              <span>
                ✓ Cuidados revisados e aceitos (
                {consentRecord.understanding_response === 'understood'
                  ? 'Compreendido'
                  : consentRecord.understanding_response}
                )
              </span>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleWithdrawConsent}
                  disabled={consentSubmitting}
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
                >
                  Retirar consentimento
                </Button>
              )}
            </div>
          )}

          {consentRecord && consentRecord.record_status === 'withdrawn' && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs">
              <span className="font-semibold block">Consentimento retirado</span>
              <p className="text-[11px]">
                Você pausou este experimento. A profissional foi notificada para acolhimento seguro.
              </p>
            </div>
          )}

          <div className="bg-muted/30 p-2.5 rounded-lg text-xs space-y-1.5 border border-border/40">
            {assignment.assigned_frequency && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Ritmo sugerido:
                </span>
                <span className="font-medium text-foreground">{assignment.assigned_frequency}</span>
              </div>
            )}
            {assignment.assigned_duration && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Duração:
                </span>
                <span className="font-medium text-foreground">{assignment.assigned_duration}</span>
              </div>
            )}
            {assignment.capacity_response && (
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <span className="text-muted-foreground">Como cabe no seu momento:</span>
                <span className="font-medium text-foreground capitalize">
                  {assignment.capacity_response.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Confirmação do participante se não confirmou ainda */}
          {isActive && !assignment.confirmed_at && onConfirm && !readOnly && (
            <div className="space-y-2 pt-1 border-t border-border/40">
              <span className="text-xs text-muted-foreground block">
                Como essa proposta conversa com o seu momento atual?
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => onConfirm(assignment.id, 'cabe_bem')}
                >
                  Cabe bem
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => onConfirm(assignment.id, 'cabe_se_adaptar')}
                >
                  Cabe se adaptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => onConfirm(assignment.id, 'parece_demais')}
                >
                  Parece demais
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => onConfirm(assignment.id, 'nao_cabe_agora')}
                >
                  Não cabe agora
                </Button>
              </div>
            </div>
          )}

          {/* Ação de Quick Response (Build 08E) */}
          {isActive && !readOnly && (
            <div className="pt-2 border-t border-border/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Praticou ou tentou recentemente?
              </span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                onClick={() => setShowResponseModal(true)}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Como foi isso para você?</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal / Dialog de Safety Consent do Participante */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl max-w-md w-full p-5 border border-border shadow-lg space-y-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                Antes de começar: {assignment.participant_safe_title}
              </h3>
              <p className="text-muted-foreground text-[11px]">
                Leia com atenção as instruções e cuidados para uma experiência segura.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
              <span className="font-semibold text-foreground block text-[11px]">
                O que é esta prática e como realizá-la:
              </span>
              <p className="text-foreground leading-relaxed">
                {assignment.participant_safe_summary ||
                  'Prática orientada pela profissional no seu plano de cuidado.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-semibold block text-[11px]">Seus direitos e cuidados:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Você é livre para interromper a qualquer instante se sentir desconforto.</li>
                <li>Você pode conversar e pedir adaptações para a sua profissional.</li>
                <li>Suas anotações privadas permanecem sob seu estrito controle.</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-foreground block">
                Sobre as orientações acima:
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="understanding"
                    checked={consentUnderstanding === 'understood'}
                    onChange={() => setConsentUnderstanding('understood')}
                  />
                  <span>Compreendi e me sinto segura para experimentar.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="understanding"
                    checked={consentUnderstanding === 'want_to_ask'}
                    onChange={() => setConsentUnderstanding('want_to_ask')}
                  />
                  <span>Tenho dúvidas e prefiro perguntar antes à profissional.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="understanding"
                    checked={consentUnderstanding === 'did_not_understand'}
                    onChange={() => setConsentUnderstanding('did_not_understand')}
                  />
                  <span>Não compreendi bem as instruções.</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConsentModalOpen(false)}
                className="text-xs h-8"
              >
                Voltar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRecordConsent('declined')}
                disabled={consentSubmitting}
                className="text-xs h-8 text-muted-foreground"
              >
                Prefiro Não Fazer
              </Button>
              <Button
                size="sm"
                onClick={() => handleRecordConsent('accepted')}
                disabled={consentSubmitting}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Quero Experimentar Assim
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog de Quick Response Flow */}
      {showResponseModal && (
        <QuickResponseFlow
          assignment={assignment}
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          onSuccess={() => {
            setShowResponseModal(false)
            if (onResponseRecorded) onResponseRecorded()
          }}
        />
      )}
    </>
  )
}
