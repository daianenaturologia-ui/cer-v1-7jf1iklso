import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  CheckCircle,
  Play,
  XCircle,
  FileText,
  Sparkles,
  HeartHandshake,
  History,
  Lock,
  PlusCircle,
  AlertCircle,
} from 'lucide-react'
import {
  cerSessionService,
  cerSessionNoteService,
  computeSessionPreparation,
} from '@/services/cerSession'
import type { CerSessionRecord, CerSessionNoteRecord, SessionPreparationData } from '@/types/cer'

interface ProfessionalSessionManagerProps {
  enrollmentId: string
  participantName: string
}

export const ProfessionalSessionManager: React.FC<ProfessionalSessionManagerProps> = ({
  enrollmentId,
  participantName,
}) => {
  const [sessions, setSessions] = useState<CerSessionRecord[]>([])
  const [activeSession, setActiveSession] = useState<CerSessionRecord | null>(null)
  const [activeNote, setActiveNote] = useState<CerSessionNoteRecord | null>(null)
  const [preparation, setPreparation] = useState<SessionPreparationData | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'preparacao' | 'encontro' | 'historico'>('preparacao')
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  )

  const loadAll = async () => {
    try {
      setLoading(true)
      const [sessList, prepData] = await Promise.all([
        cerSessionService.listByEnrollment(enrollmentId),
        computeSessionPreparation(enrollmentId),
      ])
      setSessions(sessList)
      setPreparation(prepData)

      // Sessão prioritária: em andamento ou primeira agendada
      const inProgress = sessList.find((s) => s.status === 'in_progress')
      const scheduled = sessList.find((s) => s.status === 'scheduled')
      const target = inProgress || scheduled || sessList[0] || null

      if (target) {
        selectSession(target)
      } else {
        setActiveSession(null)
        setActiveNote(null)
        setNoteDraft('')
      }
    } catch (err) {
      console.error('Erro ao carregar sessões:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectSession = async (sess: CerSessionRecord) => {
    setActiveSession(sess)
    try {
      const note = await cerSessionNoteService.getBySessionId(sess.id)
      setActiveNote(note)
      setNoteDraft(note?.text || '')
    } catch {
      setActiveNote(null)
      setNoteDraft('')
    }
  }

  useEffect(() => {
    loadAll()
  }, [enrollmentId])

  const handleCreateSession = async () => {
    try {
      setActionLoading(true)
      const newSess = await cerSessionService.createScheduled(enrollmentId)
      await loadAll()
      await selectSession(newSess)
      setActiveTab('encontro')
      setFeedback({ message: 'Novo encontro agendado com sucesso.', type: 'success' })
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Falha ao agendar encontro.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartSession = async (sessId: string) => {
    try {
      setActionLoading(true)
      const updated = await cerSessionService.startSession(sessId)
      await selectSession(updated)
      await loadAll()
      setActiveTab('encontro')
      setFeedback({ message: 'Encontro iniciado.', type: 'success' })
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Falha ao iniciar encontro.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteSession = async (sessId: string) => {
    try {
      setActionLoading(true)
      // Se houver rascunho de nota modificado, salvar antes de completar
      if (noteDraft.trim()) {
        if (activeNote) {
          if (activeNote.text !== noteDraft) {
            await cerSessionNoteService.update(activeNote.id, noteDraft)
          }
        } else {
          await cerSessionNoteService.create(sessId, noteDraft)
        }
      }

      const completed = await cerSessionService.completeSession(sessId)
      await selectSession(completed)
      await loadAll()
      setFeedback({
        message: 'Encontro concluído e registro preservado com segurança.',
        type: 'success',
      })
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Falha ao concluir encontro.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSession = async (sessId: string) => {
    try {
      setActionLoading(true)
      const cancelled = await cerSessionService.cancelSession(sessId)
      await selectSession(cancelled)
      await loadAll()
      setFeedback({ message: 'Encontro cancelado.', type: 'success' })
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Falha ao cancelar encontro.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!activeSession) return
    try {
      setSavingNote(true)
      if (activeNote) {
        const updated = await cerSessionNoteService.update(activeNote.id, noteDraft)
        setActiveNote(updated)
      } else {
        const created = await cerSessionNoteService.create(activeSession.id, noteDraft)
        setActiveNote(created)
      }
      setFeedback({ message: 'Nota profissional salva com sucesso.', type: 'success' })
    } catch (err: unknown) {
      setFeedback({
        message: err instanceof Error ? err.message : 'Falha ao salvar nota.',
        type: 'error',
      })
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          Carregando informações do acompanhamento...
        </CardContent>
      </Card>
    )
  }

  const isCompleted = activeSession?.status === 'completed'
  const isCancelled = activeSession?.status === 'cancelled'
  const isInProgress = activeSession?.status === 'in_progress'
  const isScheduled = activeSession?.status === 'scheduled'
  const isReadOnly = isCompleted || isCancelled

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Encontros & Espaço de Presença — {participantName}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Contexto longitudinal dos encontros individuais e anotações profissionais privadas
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSession}
              disabled={actionLoading}
              className="text-xs h-8 gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Encontro</span>
            </Button>
          </div>
        </div>

        {/* Abas humanizadas: Para nosso encontro / No Encontro / Histórico */}
        <div className="flex items-center gap-1.5 pt-3">
          <Button
            variant={activeTab === 'preparacao' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('preparacao')}
            className="text-xs h-7 px-3"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>Para nosso encontro</span>
          </Button>
          <Button
            variant={activeTab === 'encontro' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('encontro')}
            className="text-xs h-7 px-3"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            <span>Encontro Atual</span>
            {activeSession && (
              <Badge
                variant="secondary"
                className="ml-1.5 text-[10px] px-1.5 py-0 h-4 uppercase font-mono"
              >
                {activeSession.status === 'in_progress'
                  ? 'Em andamento'
                  : activeSession.status === 'scheduled'
                    ? 'Agendado'
                    : activeSession.status === 'completed'
                      ? 'Concluído'
                      : 'Cancelado'}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'historico' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('historico')}
            className="text-xs h-7 px-3"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            <span>Histórico ({sessions.length})</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {feedback && (
          <div
            className={`p-2.5 rounded-md text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs underline hover:opacity-80"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ABA 1: PREPARAÇÃO DETERMINÍSTICA ("Para nosso encontro") */}
        {activeTab === 'preparacao' && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1">
              <p className="font-medium text-foreground">
                Preparação calculada para o encontro com {participantName}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Visão determinística em tempo real reunindo o último encontro, percepções recentes e
                movimentos de consciência da interagente. Sem síntese de inteligência artificial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bloco 1: Último Encontro */}
              <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Último Encontro</span>
                </div>
                {preparation?.lastCompletedSession ? (
                  <div className="space-y-1.5 text-xs">
                    <p className="text-muted-foreground text-[11px]">
                      Concluído em:{' '}
                      <span className="text-foreground font-medium">
                        {new Date(
                          preparation.lastCompletedSession.completed_at ||
                            preparation.lastCompletedSession.created,
                        ).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                    {preparation.lastSessionNote ? (
                      <div className="p-2 bg-muted/30 rounded text-[11px] text-foreground/90 italic">
                        "{preparation.lastSessionNote.text?.slice(0, 160)}
                        {(preparation.lastSessionNote.text?.length || 0) > 160 ? '...' : ''}"
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        Nenhuma anotação registrada no encontro anterior.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Primeiro acompanhamento ou nenhum encontro anterior concluído ainda.
                  </p>
                )}
              </div>

              {/* Bloco 2: O que merece atenção / Percepções Recentes */}
              <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>O que merece atenção</span>
                </div>
                {preparation?.recentKnowledgeItems &&
                preparation.recentKnowledgeItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {preparation.recentKnowledgeItems.slice(0, 3).map((ki) => (
                      <div
                        key={ki.id}
                        className="text-[11px] p-1.5 rounded bg-muted/30 border border-border/30 space-y-0.5"
                      >
                        <p className="text-foreground font-medium leading-snug">{ki.statement}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ki.expand?.primary_dimension_id?.title || 'Dimensão Integrativa'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Nenhuma percepção ou elemento registrado no momento.
                  </p>
                )}
              </div>

              {/* Bloco 3: Desde o último encontro / Reconhecimentos e Experiências */}
              <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <History className="w-3.5 h-3.5 text-primary" />
                  <span>Desde o último encontro</span>
                </div>
                {preparation?.recentRecognitions && preparation.recentRecognitions.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">
                      Reconhecimentos da Interagente:
                    </p>
                    {preparation.recentRecognitions.slice(0, 2).map((rec) => (
                      <div
                        key={rec.id}
                        className="text-[11px] p-1.5 rounded bg-muted/30 border border-border/30"
                      >
                        <span className="font-medium text-primary capitalize">
                          {rec.recognition_type.replace(/_/g, ' ')}
                        </span>
                        {rec.comment && (
                          <p className="text-muted-foreground italic text-[10px] mt-0.5">
                            "{rec.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : preparation?.recentCompletedExperiences &&
                  preparation.recentCompletedExperiences.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">
                      Experiências realizadas:
                    </p>
                    {preparation.recentCompletedExperiences.slice(0, 2).map((exp) => (
                      <p key={exp.id} className="text-[11px] text-foreground">
                        • {exp.expand?.experience_id?.title || 'Experiência Integrativa'}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Sem novas atividades ou respostas desde o último encontro.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {activeSession ? (
                <Button size="sm" onClick={() => setActiveTab('encontro')} className="text-xs h-8">
                  Abrir Encontro Atual
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCreateSession}
                  disabled={actionLoading}
                  className="text-xs h-8"
                >
                  Agendar Primeiro Encontro
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: ENCONTRO ATUAL & NOTA PROFISSIONAL PRIVADA */}
        {activeTab === 'encontro' && (
          <div className="space-y-4">
            {activeSession ? (
              <div className="space-y-4">
                {/* Cabeçalho da Sessão */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/60 bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        Encontro com {participantName}
                      </span>
                      <Badge
                        variant={
                          isInProgress
                            ? 'default'
                            : isCompleted
                              ? 'secondary'
                              : isCancelled
                                ? 'outline'
                                : 'outline'
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {isInProgress
                          ? 'Em andamento'
                          : isScheduled
                            ? 'Agendado'
                            : isCompleted
                              ? 'Concluído'
                              : 'Cancelado'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Criado:{' '}
                        {new Date(activeSession.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {activeSession.started_at && (
                        <span>
                          Iniciado às:{' '}
                          {new Date(activeSession.started_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {activeSession.completed_at && (
                        <span>
                          Concluído às:{' '}
                          {new Date(activeSession.completed_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações de Ciclo de Vida */}
                  <div className="flex items-center gap-2">
                    {isScheduled && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStartSession(activeSession.id)}
                          disabled={actionLoading}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Iniciar Encontro</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelSession(activeSession.id)}
                          disabled={actionLoading}
                          className="text-xs h-8 text-muted-foreground hover:text-destructive"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Cancelar</span>
                        </Button>
                      </>
                    )}

                    {isInProgress && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCompleteSession(activeSession.id)}
                        disabled={actionLoading}
                        className="text-xs h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Concluir Encontro</span>
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Registro Congelado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Área de Anotação Privada da Profissional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        Nota Profissional Privada
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        (Privacidade restrita ao autor; invisível para a interagente)
                      </span>
                    </div>

                    {!isReadOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="text-xs h-7"
                      >
                        {savingNote ? 'Salvando...' : 'Salvar Anotação'}
                      </Button>
                    )}
                  </div>

                  <Textarea
                    placeholder={
                      isReadOnly
                        ? 'Nenhuma anotação adicional pode ser feita neste encontro concluído.'
                        : 'Espaço livre para reflexões, impressões subjetivas e registros do encontro...'
                    }
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    disabled={isReadOnly}
                    rows={6}
                    className="text-xs font-normal leading-relaxed resize-y"
                  />

                  {isCompleted && (
                    <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      Encontro concluído: anotações não podem mais ser sobrescritas ou alteradas.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Nenhum encontro agendado para {participantName}.
                </p>
                <Button
                  size="sm"
                  onClick={handleCreateSession}
                  disabled={actionLoading}
                  className="text-xs h-8"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Agendar Primeiro Encontro</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ABA 3: HISTÓRICO DE ENCONTROS */}
        {activeTab === 'historico' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Nenhum encontro registrado ainda.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md transition-colors ${
                      activeSession?.id === sess.id
                        ? 'bg-muted/40 font-medium'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground font-medium">
                          Encontro de{' '}
                          {new Date(sess.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-mono px-1.5 py-0"
                        >
                          {sess.status === 'in_progress'
                            ? 'Em andamento'
                            : sess.status === 'scheduled'
                              ? 'Agendado'
                              : sess.status === 'completed'
                                ? 'Concluído'
                                : 'Cancelado'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Profissional responsável:{' '}
                        {sess.expand?.professional_user_id?.name || 'Profissional'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          selectSession(sess)
                          setActiveTab('encontro')
                        }}
                        className="text-xs h-7 px-2.5"
                      >
                        Visualizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProfessionalSessionManager
