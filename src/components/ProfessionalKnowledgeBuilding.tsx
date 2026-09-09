import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Layers,
  History,
  Eye,
  GitBranch,
  FileText,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react'
import {
  cerKnowledgeItemService,
  cerAssociationService,
  cerSignalService,
  cerKnowledgePresentationService,
  cerParticipantRecognitionService,
} from '@/services/cerKnowledge'
import {
  CerKnowledgeItemRecord,
  CerAssociationRecord,
  CerSignalRecord,
  CerKnowledgeEvidenceRecord,
  CerKnowledgeItemVersionRecord,
  CerKnowledgePresentationRecord,
  PresentationChannel,
  RecognitionType,
} from '@/types/cer'
import { Textarea } from '@/components/ui/textarea'

interface ComponentProps {
  enrollmentId: string
  participantName: string
}

export const ProfessionalKnowledgeBuilding: React.FC<ComponentProps> = ({
  enrollmentId,
  participantName,
}) => {
  const [items, setItems] = useState<CerKnowledgeItemRecord[]>([])
  const [, setAssociations] = useState<CerAssociationRecord[]>([])
  const [, setSignals] = useState<CerSignalRecord[]>([])
  const [presentations, setPresentations] = useState<CerKnowledgePresentationRecord[]>([])
  const [selectedKI, setSelectedKI] = useState<CerKnowledgeItemRecord | null>(null)
  const [evidenceList, setEvidenceList] = useState<CerKnowledgeEvidenceRecord[]>([])
  const [versionsList, setVersionsList] = useState<CerKnowledgeItemVersionRecord[]>([])
  const [provenanceOpen, setProvenanceOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Estado do diálogo de Presentation ("Quero conversar sobre isso")
  const [presentationDialogOpen, setPresentationDialogOpen] = useState(false)
  const [presentationKI, setPresentationKI] = useState<CerKnowledgeItemRecord | null>(null)
  const [presentationText, setPresentationText] = useState('')
  const [presentationChannel, setPresentationChannel] = useState<PresentationChannel>('session')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Estado para registro de resposta verbal em sessão (channel=session)
  const [recordResponseDialogOpen, setRecordResponseDialogOpen] = useState(false)
  const [activePresForRecord, setActivePresForRecord] =
    useState<CerKnowledgePresentationRecord | null>(null)
  const [recordedRecogType, setRecordedRecogType] = useState<RecognitionType>('makes_sense')
  const [recordedComment, setRecordedComment] = useState('')

  const loadKnowledge = async () => {
    setLoading(true)
    try {
      const [kiData, assocData, sigData, presData] = await Promise.all([
        cerKnowledgeItemService.listByEnrollment(enrollmentId),
        cerAssociationService.listByEnrollment(enrollmentId),
        cerSignalService.listSignalsByEnrollment(enrollmentId),
        cerKnowledgePresentationService.listByEnrollment(enrollmentId),
      ])
      setItems(kiData)
      setAssociations(assocData)
      setSignals(sigData)
      setPresentations(presData)
    } catch {
      // Falhas silenciosas tratadas pela segurança RLS
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKnowledge()
  }, [enrollmentId])

  const handleOpenProvenance = async (item: CerKnowledgeItemRecord) => {
    setSelectedKI(item)
    try {
      const [evs, vers] = await Promise.all([
        cerKnowledgeItemService.listEvidenceByKnowledgeItem(item.id),
        cerKnowledgeItemService.listVersions(item.id),
      ])
      setEvidenceList(evs)
      setVersionsList(vers)
      setProvenanceOpen(true)
    } catch (e) {
      console.error('Erro ao buscar provenance autorizada:', e)
    }
  }

  // Abrir fluxo "Quero conversar sobre isso"
  const handleOpenPresentationFlow = (item: CerKnowledgeItemRecord) => {
    setPresentationKI(item)
    // Formulação inicial participante-facing (sem copiar os jargões ou statement estrito)
    setPresentationText('')
    setPresentationChannel('session')
    setFeedback(null)
    setPresentationDialogOpen(true)
  }

  // Salvar como Rascunho (Draft)
  const handleSaveDraftPresentation = async () => {
    if (!presentationKI || !presentationText.trim()) return
    setActionLoading(true)
    try {
      await cerKnowledgePresentationService.createDraft({
        knowledge_item_id: presentationKI.id,
        knowledge_version_number: presentationKI.version,
        enrollment_id: enrollmentId,
        presentation_text: presentationText.trim(),
        channel: presentationChannel,
      })
      setFeedback({ type: 'success', message: 'Rascunho de formulação guardado com sucesso.' })
      setPresentationDialogOpen(false)
      loadKnowledge()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao guardar rascunho.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Apresentar para a participante (Ato explícito de Disclosure -> status = 'presented')
  const handlePresentImmediately = async () => {
    if (!presentationKI || !presentationText.trim()) return
    setActionLoading(true)
    try {
      await cerKnowledgePresentationService.createAndPresent({
        knowledge_item_id: presentationKI.id,
        knowledge_version_number: presentationKI.version,
        enrollment_id: enrollmentId,
        presentation_text: presentationText.trim(),
        channel: presentationChannel,
      })
      setFeedback({
        type: 'success',
        message: 'Formulação apresentada com sucesso. Disponível para diálogo.',
      })
      setPresentationDialogOpen(false)
      loadKnowledge()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao apresentar formulação.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Transitar Draft existente para Presented
  const handlePresentDraft = async (presId: string) => {
    setActionLoading(true)
    try {
      await cerKnowledgePresentationService.markAsPresented(presId)
      setFeedback({ type: 'success', message: 'Rascunho apresentado com sucesso.' })
      loadKnowledge()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao apresentar.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Retirar Presentation (withdrawn)
  const handleWithdrawPresentation = async (presId: string) => {
    setActionLoading(true)
    try {
      await cerKnowledgePresentationService.withdraw(presId)
      setFeedback({ type: 'success', message: 'Formulação retirada com preservação histórica.' })
      loadKnowledge()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao retirar formulação.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Abrir diálogo para registrar resposta da participante dada em sessão
  const handleOpenRecordResponse = (pres: CerKnowledgePresentationRecord) => {
    setActivePresForRecord(pres)
    setRecordedRecogType('makes_sense')
    setRecordedComment('')
    setRecordResponseDialogOpen(true)
  }

  // Gravar resposta dada em sessão pela participante
  const handleSaveSessionResponse = async () => {
    if (!activePresForRecord) return
    setActionLoading(true)
    try {
      await cerParticipantRecognitionService.createRecognition({
        enrollment_id: enrollmentId,
        knowledge_item_id: activePresForRecord.knowledge_item_id,
        presentation_id: activePresForRecord.id,
        recognition_type: recordedRecogType,
        comment: recordedComment.trim() || undefined,
        record_mode: 'professional_recorded_participant_response',
      })
      setFeedback({
        type: 'success',
        message: 'Resposta da participante registrada com fidelidade à sessão.',
      })
      setRecordResponseDialogOpen(false)
      loadKnowledge()
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao registrar resposta da participante.',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Conhecimento em Construção: {participantName}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadKnowledge}
            disabled={loading}
            className="h-7 text-xs px-2"
          >
            <History className="w-3.5 h-3.5 mr-1" />
            Atualizar
          </Button>
        </div>
        <CardDescription className="text-xs">
          Compreensões e hipóteses epistemológicas situadas e revisáveis. Sem scores ou conclusões
          automáticas.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Nenhuma formulação epistemológica registrada ainda para esta participante.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border/60 bg-card space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.concept_key}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.knowledge_type}
                    </Badge>
                    <Badge variant="default" className="text-[10px]">
                      status: {item.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      V{item.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleOpenPresentationFlow(item)}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Quero conversar sobre isso
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] gap-1 px-2 border-primary/40 hover:bg-primary/10"
                      onClick={() => handleOpenProvenance(item)}
                    >
                      <Eye className="w-3 h-3 text-primary" />
                      Ver por que isso está aqui
                    </Button>
                  </div>
                </div>

                <p className="text-foreground text-xs leading-relaxed font-serif italic pl-2 border-l-2 border-primary/40">
                  &ldquo;{item.statement}&rdquo;
                </p>

                {/* Histórico de Apresentações Deste Item */}
                {(() => {
                  const itemPres = presentations.filter((p) => p.knowledge_item_id === item.id)
                  if (itemPres.length === 0) return null
                  return (
                    <div className="pt-2 border-t border-border/30 space-y-1.5">
                      <span className="text-[10px] font-medium text-foreground uppercase tracking-wider block">
                        Conversas propostas para a interagente ({itemPres.length}):
                      </span>
                      <div className="space-y-1">
                        {itemPres.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded bg-muted/20 border border-border/40 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={
                                    p.status === 'presented'
                                      ? 'default'
                                      : p.status === 'draft'
                                        ? 'outline'
                                        : 'secondary'
                                  }
                                  className="text-[9px] uppercase font-mono px-1.5 py-0"
                                >
                                  {p.status === 'presented'
                                    ? 'Apresentada'
                                    : p.status === 'draft'
                                      ? 'Rascunho'
                                      : 'Retirada'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  via {p.channel === 'app' ? 'aplicativo' : 'sessão presencial'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {p.status === 'draft' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePresentDraft(p.id)}
                                    disabled={actionLoading}
                                    className="h-5 text-[10px] px-2 text-primary border-primary/40"
                                  >
                                    <Send className="w-2.5 h-2.5 mr-1" />
                                    Apresentar
                                  </Button>
                                )}
                                {p.status === 'presented' && p.channel === 'session' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenRecordResponse(p)}
                                    disabled={actionLoading}
                                    className="h-5 text-[10px] px-2"
                                  >
                                    Registrar resposta na sessão
                                  </Button>
                                )}
                                {p.status !== 'withdrawn' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleWithdrawPresentation(p.id)}
                                    disabled={actionLoading}
                                    className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-destructive"
                                  >
                                    <Archive className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-foreground italic font-sans pl-1">
                              &ldquo;{p.presentation_text}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 flex-wrap">
                  <span>Origem metodológica: {item.epistemic_source}</span>
                  <span>•</span>
                  <span>Janela: {item.temporality}</span>
                  <span>•</span>
                  <span>Visibilidade: {item.access_class}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback visual */}
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
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs underline">
              Fechar
            </button>
          </div>
        )}

        {/* Modal "Quero conversar sobre isso" (Presentation Builder participante-facing) */}
        <Dialog open={presentationDialogOpen} onOpenChange={setPresentationDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Quero conversar sobre isso
              </DialogTitle>
              <DialogDescription className="text-xs">
                Crie uma formulação sensível e participante-facing para apresentar este olhar. O
                conteúdo técnico e observações privadas permanecem estritamente preservados.
              </DialogDescription>
            </DialogHeader>

            {presentationKI && (
              <div className="space-y-3.5 py-2 text-xs">
                {/* Referência da Formulação Interna (apenas para inspiração do profissional) */}
                <div className="p-2.5 rounded bg-muted/30 border border-border/50 space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Ponto de partida do olhar profissional (não será exposto à interagente):
                  </span>
                  <p className="text-foreground text-xs italic font-serif">
                    &ldquo;{presentationKI.statement}&rdquo;
                  </p>
                </div>

                {/* Canal de Compartilhamento */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Onde pretende ter esta conversa?
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={presentationChannel === 'session' ? 'default' : 'outline'}
                      onClick={() => setPresentationChannel('session')}
                      className="text-xs h-7 px-3"
                    >
                      No encontro presencial/sessão
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={presentationChannel === 'app' ? 'default' : 'outline'}
                      onClick={() => setPresentationChannel('app')}
                      className="text-xs h-7 px-3"
                    >
                      Pelo aplicativo (direto à interagente)
                    </Button>
                  </div>
                </div>

                {/* Texto da Presentation Participante-Facing */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Como você quer formular isso para ela?
                  </label>
                  <Textarea
                    placeholder="Escreva como você falaria ou perguntaria para a interagente, de forma calorosa e investigativa..."
                    value={presentationText}
                    onChange={(e) => setPresentationText(e.target.value)}
                    rows={4}
                    className="text-xs resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Esta formulação será o texto que a interagente verá. Ela não terá acesso ao
                    statement técnico, evidências ou notas confidenciais.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraftPresentation}
                    disabled={actionLoading || !presentationText.trim()}
                    className="text-xs h-8"
                  >
                    Salvar Rascunho
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePresentImmediately}
                    disabled={actionLoading || !presentationText.trim()}
                    className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apresentar para Interagente</span>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal para Profissional Registrar Resposta Verbal em Sessão (channel=session) */}
        <Dialog open={recordResponseDialogOpen} onOpenChange={setRecordResponseDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Registrar resposta da participante na sessão
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registre fielmente a resposta que a interagente verbalizou sobre a formulação
                apresentada.
              </DialogDescription>
            </DialogHeader>

            {activePresForRecord && (
              <div className="space-y-3.5 py-2 text-xs">
                <div className="p-2.5 rounded bg-muted/30 border border-border/40 space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Formulação apresentada:
                  </span>
                  <p className="text-foreground text-xs italic">
                    &ldquo;{activePresForRecord.presentation_text}&rdquo;
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-foreground">
                    Como a interagente reagiu ao diálogo?
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { value: 'makes_sense', label: 'Sim, se reconheceu nisso.' },
                      {
                        value: 'partially_makes_sense',
                        label: 'Em parte. Disse ter mais coisa aí.',
                      },
                      { value: 'does_not_recognize', label: 'Não é bem assim para ela.' },
                      {
                        value: 'depends_on_context',
                        label: 'Depende muito da situação.',
                      },
                      { value: 'wants_to_add', label: 'Quis contar um pouco mais.' },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={recordedRecogType === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRecordedRecogType(opt.value as RecognitionType)}
                        className="justify-start text-xs h-7 px-2.5 text-left font-normal"
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Anotação das palavras dela (opcional):
                  </label>
                  <Textarea
                    placeholder="Palavras ou contexto que ela acrescentou..."
                    value={recordedComment}
                    onChange={(e) => setRecordedComment(e.target.value)}
                    rows={2}
                    className="text-xs resize-y"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecordResponseDialogOpen(false)}
                    className="text-xs h-8"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveSessionResponse}
                    disabled={actionLoading}
                    className="text-xs h-8"
                  >
                    Guardar Resposta
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal "Ver por que isso está aqui" (Provenance Autorizada sem vazamento de fontes privadas) */}
        <Dialog open={provenanceOpen} onOpenChange={setProvenanceOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                Rastreabilidade e Fontes Autorizadas
              </DialogTitle>
              <DialogDescription className="text-xs">
                Linha de cuidado e evidências que apoiam esta formulação, respeitando a privacidade
                dos envolvidos.
              </DialogDescription>
            </DialogHeader>

            {selectedKI && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-2.5 rounded bg-muted/30 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Formulação Atual:</span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      V{selectedKI.version}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground italic">
                    &ldquo;{selectedKI.statement}&rdquo;
                  </p>
                </div>

                {/* Evidências Vinculadas Autorizadas */}
                <div className="space-y-2">
                  <div className="font-medium text-foreground flex items-center gap-1.5 border-b border-border/40 pb-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Fontes que sustentam este olhar ({evidenceList.length})</span>
                  </div>
                  {evidenceList.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Nenhuma fonte vinculada disponível para sua visualização.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {evidenceList.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2 rounded bg-muted/20 border border-border/40 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] uppercase">
                              {ev.evidence_type}
                            </Badge>
                            <span className="text-muted-foreground font-mono">
                              Ref: {ev.evidence_id.slice(0, 10)}...
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            papel: {ev.relation_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Histórico de Versões Server-Side */}
                <div className="space-y-2">
                  <div className="font-medium text-foreground flex items-center gap-1.5 border-b border-border/40 pb-1">
                    <History className="w-3.5 h-3.5 text-primary" />
                    <span>Evolução da Formulação no Tempo ({versionsList.length})</span>
                  </div>
                  {versionsList.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Esta é a formulação inicial registrada.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {versionsList.map((ver) => (
                        <div
                          key={ver.id}
                          className="p-2 rounded bg-muted/20 border border-border/40 space-y-1 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              Versão {ver.version_number}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(ver.created).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-muted-foreground italic">
                            &ldquo;{ver.statement}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Status: {ver.status}</span>
                            <span>•</span>
                            <span>Acesso: {ver.access_class}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
export default ProfessionalKnowledgeBuilding
