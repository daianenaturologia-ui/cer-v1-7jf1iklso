import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import type { CerPracticeAssignmentRecord, CapacityResponseValue } from '@/types/cer'
import { QuickResponseFlow } from './QuickResponseFlow'

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
  const isActive = assignment.status === 'active'
  const isPaused = assignment.status === 'paused'
  const isStopped = assignment.status === 'stopped'

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
