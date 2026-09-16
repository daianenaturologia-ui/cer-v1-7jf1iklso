import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Lock,
  Share2,
  CheckCircle2,
  Clock,
  History,
  Send,
  PlusCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
  Undo2,
  Edit2,
  Archive,
  Mic,
  Volume2,
} from 'lucide-react'
import { VoiceInputCapture } from '@/components/VoiceInputCapture'
import { cerJournalService } from '@/services/cerJournalService'
import type {
  CerJournalEntryRecord,
  CerJournalEntryVersionRecord,
  CerNextSessionMessageRecord,
} from '@/types/cer'
import { useToast } from '@/hooks/use-toast'

interface CadernoSectionProps {
  enrollmentId: string
  interagenteName?: string
}

export const CadernoSection: React.FC<CadernoSectionProps> = ({
  enrollmentId,
  interagenteName,
}) => {
  const { toast } = useToast()
  const [entries, setEntries] = useState<CerJournalEntryRecord[]>([])
  const [messages, setMessages] = useState<CerNextSessionMessageRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Formulário de Nova Anotação
  const [isWritingEntry, setIsWritingEntry] = useState(false)
  const [entryTitle, setEntryTitle] = useState('')
  const [entryContent, setEntryContent] = useState('')
  const [savingEntry, setSavingEntry] = useState(false)
  const [showVoiceEntry, setShowVoiceEntry] = useState(false)

  // Edição de Anotação existente
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Histórico de versões
  const [viewingVersionsEntryId, setViewingVersionsEntryId] = useState<string | null>(null)
  const [versionsList, setVersionsList] = useState<CerJournalEntryVersionRecord[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Modal de Recado para a Terapeuta ("Quero compartilhar isso com minha terapeuta")
  // REGRA DE OURO: Abre um campo NOVO e VAZIO. NUNCA copia ou resume o Caderno nele!
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [stepShare, setStepShare] = useState<'write' | 'review'>('write')
  const [submittingMessage, setSubmittingMessage] = useState(false)
  const [showVoiceShare, setShowVoiceShare] = useState(false)

  // Ação de retirada de recado
  const [withdrawingMessageId, setWithdrawingMessageId] = useState<string | null>(null)

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [eList, mList] = await Promise.all([
        cerJournalService.listEntries(enrollmentId),
        cerJournalService.listParticipantMessages(enrollmentId),
      ])
      setEntries(eList)
      setMessages(mList)
    } catch (err) {
      console.error('Erro ao carregar dados do Caderno:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [enrollmentId])

  // Salvar Nova Anotação do Caderno
  const handleSaveEntry = async () => {
    if (!entryContent.trim()) return
    try {
      setSavingEntry(true)
      await cerJournalService.createEntry({
        enrollment_id: enrollmentId,
        title: entryTitle.trim() || undefined,
        content: entryContent.trim(),
      })
      setEntryTitle('')
      setEntryContent('')
      setIsWritingEntry(false)
      toast({
        title: 'Anotação guardada no seu Caderno',
        description: 'Seu registro é privado. Ninguém além de você pode lê-lo.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao guardar anotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingEntry(false)
    }
  }

  // Atualizar anotação do Caderno
  const handleUpdateEntry = async () => {
    if (!editingEntryId || !editContent.trim()) return
    try {
      setSavingEdit(true)
      await cerJournalService.updateEntry(editingEntryId, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
        change_reason: 'Edição de anotação',
      })
      setEditingEntryId(null)
      toast({
        title: 'Anotação atualizada',
        description: 'A versão anterior foi arquivada no seu histórico com segurança.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao atualizar anotação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingEdit(false)
    }
  }

  // Arquivar anotação
  const handleArchiveEntry = async (id: string) => {
    try {
      await cerJournalService.archiveEntry(id)
      toast({
        title: 'Anotação arquivada',
        description: 'A anotação foi guardada no seu arquivo pessoal.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao arquivar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // Ver histórico de versões
  const handleOpenVersions = async (entryId: string) => {
    setViewingVersionsEntryId(entryId)
    setLoadingVersions(true)
    try {
      const v = await cerJournalService.listEntryVersions(entryId)
      setVersionsList(v)
    } catch (err) {
      console.error('Erro ao listar versões:', err)
      setVersionsList([])
    } finally {
      setLoadingVersions(false)
    }
  }

  // Abrir Modal de Compartilhar: CAMPO NOVO E TOTALMENTE VAZIO
  const handleOpenShareDialog = () => {
    setMessageText('')
    setSummaryText('')
    setShowVoiceShare(false)
    setStepShare('write')
    setShareDialogOpen(true)
  }

  // Avançar para revisão do recado e conferência do resumo breve
  const handleProceedToReview = () => {
    if (!messageText.trim()) return
    // Resumo gerado EXCLUSIVAMENTE a partir do recado digitado
    const autoSummary = cerJournalService.generateMessageSummary(messageText)
    setSummaryText(autoSummary)
    setStepShare('review')
  }

  // Enviar como Rascunho
  const handleSaveDraftMessage = async () => {
    if (!messageText.trim()) return
    try {
      setSubmittingMessage(true)
      await cerJournalService.createNextSessionMessage({
        enrollment_id: enrollmentId,
        message_text: messageText.trim(),
        summary_text: summaryText.trim(),
        as_draft: true,
      })
      setShareDialogOpen(false)
      toast({
        title: 'Rascunho salvo',
        description: 'Seu rascunho fica guardado com você e não aparece para a terapeuta.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingMessage(false)
    }
  }

  // Aprovar e Enviar Recado para a Próxima Sessão
  const handleApproveAndSendMessage = async () => {
    if (!messageText.trim()) return
    try {
      setSubmittingMessage(true)
      await cerJournalService.createNextSessionMessage({
        enrollment_id: enrollmentId,
        message_text: messageText.trim(),
        summary_text: summaryText.trim(),
        as_draft: false,
      })
      setShareDialogOpen(false)
      toast({
        title: 'Recado enviado para a próxima sessão',
        description: 'Sua terapeuta poderá ler este recado na preparação do próximo encontro.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao enviar recado',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingMessage(false)
    }
  }

  // Aprovar um rascunho existente
  const handleApproveDraft = async (msgId: string) => {
    try {
      await cerJournalService.approveNextSessionMessage(msgId)
      toast({
        title: 'Recado aprovado e enviado',
        description: 'O recado agora está visível para a terapeuta na preparação do encontro.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao aprovar recado',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // Retirar recado (withdrawn)
  const handleWithdrawMessage = async (msgId: string) => {
    try {
      setWithdrawingMessageId(msgId)
      await cerJournalService.withdrawNextSessionMessage(msgId)
      toast({
        title: 'Recado retirado',
        description: 'O recado não aparecerá mais na área de preparação do próximo encontro.',
      })
      await loadAllData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao retirar recado',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setWithdrawingMessageId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner de Acolhimento e Garantia de Privacidade P0 */}
      <Card className="border-border/60 bg-muted/15 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <CardTitle className="text-base font-semibold font-serif">
                  Caderno Pessoal & Recados
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 font-mono uppercase bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                >
                  <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>100% Privado</span>
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Suas anotações espontâneas são estritamente privadas: ninguém além de você tem
                acesso a elas, nem mesmo sua terapeuta ou a inteligência artificial. Se desejar
                levar algo para o próximo encontro, escreva um recado separado.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenShareDialog}
                className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Quero compartilhar algo</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsWritingEntry(!isWritingEntry)}
                className="text-xs h-8 gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nova anotação</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Formulário de Nova Anotação */}
      {isWritingEntry && (
        <Card className="border-primary/40 bg-card shadow-sm animate-in fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Escrever no seu Caderno
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3 text-muted-foreground" />
                Privado para {interagenteName || 'você'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Título ou tema da anotação (opcional)..."
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              className="text-xs"
            />

            {/* Captura de Voz no Caderno */}
            {showVoiceEntry ? (
              <VoiceInputCapture
                targetLabel="anotação do Caderno"
                onConfirmText={(confirmedText) => {
                  setEntryContent((prev) =>
                    prev ? `${prev.trim()}\n\n${confirmedText}` : confirmedText,
                  )
                  setShowVoiceEntry(false)
                  toast({
                    title: 'Fala inserida na anotação',
                    description:
                      'O texto foi incluído. Você pode editá-lo antes de guardar no seu Caderno.',
                  })
                }}
                onCancel={() => setShowVoiceEntry(false)}
              />
            ) : (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceEntry(true)}
                  className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Mic className="w-3.5 h-3.5 text-primary" />
                  <span>Falar anotação por voz</span>
                </Button>
              </div>
            )}

            <Textarea
              placeholder="Escreva livremente o que vier à mente, sentimentos, percepções do dia a dia..."
              value={entryContent}
              onChange={(e) => setEntryContent(e.target.value)}
              rows={5}
              className="text-xs leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground italic">
                Nenhum profissional pode ler esta anotação.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsWritingEntry(false)
                    setShowVoiceEntry(false)
                  }}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEntry}
                  disabled={savingEntry || !entryContent.trim()}
                  className="text-xs h-8 gap-1.5"
                >
                  {savingEntry ? 'Guardando...' : 'Guardar no Caderno'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid: Anotações do Caderno (Esquerda) e Recados para a Próxima Sessão (Direita) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUNA 1: ANOTAÇÕES PRIVADAS DO CADERNO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Suas Anotações Privadas</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {entries.length} anotaç{entries.length === 1 ? 'ão' : 'ões'}
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Carregando seu caderno...
            </p>
          ) : entries.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed border-border/60 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Seu caderno está vazio no momento.</p>
              <p className="text-[11px] text-muted-foreground">
                Use este espaço íntimo para registrar o que você sente, pensa ou nota durante a
                semana.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWritingEntry(true)}
                className="text-xs h-7 mt-2"
              >
                Escrever primeira anotação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const isEditing = editingEntryId === entry.id
                return (
                  <Card key={entry.id} className="border-border/60 shadow-none">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                          <h4 className="text-xs font-semibold text-foreground truncate">
                            {entry.title || 'Anotação sem título'}
                          </h4>
                          {entry.version_number > 1 && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4 font-mono"
                            >
                              v{entry.version_number}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {new Date(entry.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-xs"
                            placeholder="Título..."
                          />
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="text-xs"
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEntryId(null)}
                              className="text-xs h-7 px-2"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateEntry}
                              disabled={savingEdit || !editContent.trim()}
                              className="text-xs h-7 px-3"
                            >
                              {savingEdit ? 'Salvando...' : 'Salvar edição'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingEntryId(entry.id)
                                  setEditTitle(entry.title || '')
                                  setEditContent(entry.content)
                                }}
                                className="text-[11px] h-6 px-1.5 text-muted-foreground gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveEntry(entry.id)}
                                className="text-[11px] h-6 px-1.5 text-muted-foreground gap-1 hover:text-amber-600"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Arquivar</span>
                              </Button>
                            </div>

                            {entry.version_number > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenVersions(entry.id)}
                                className="text-[10px] h-6 px-1.5 text-muted-foreground gap-1"
                              >
                                <History className="w-3 h-3" />
                                <span>Histórico</span>
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* COLUNA 2: RECADOS PARA A PRÓXIMA SESSÃO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Recados para o Próximo Encontro
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {messages.filter((m) => m.status === 'approved').length} enviado
              {messages.filter((m) => m.status === 'approved').length === 1 ? '' : 's'}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Mensagens intencionais que você decide enviar para a sua terapeuta ler antes da sessão.
            Rascunhos não são visíveis para ela.
          </p>

          {loading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Carregando recados...</p>
          ) : messages.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed border-border/60 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Nenhum recado preparado ainda.</p>
              <p className="text-[11px] text-muted-foreground">
                Deseja avisar algo antes da próxima sessão? Você pode escrever um recado curto e
                conferir antes de enviar.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenShareDialog}
                className="text-xs h-7 mt-2"
              >
                Escrever recado
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isApproved = msg.status === 'approved'
                const isDraft = msg.status === 'draft'
                const isWithdrawn = msg.status === 'withdrawn'

                return (
                  <Card
                    key={msg.id}
                    className={`border shadow-none ${
                      isApproved
                        ? 'border-emerald-300 bg-emerald-500/5'
                        : isDraft
                          ? 'border-amber-300 bg-amber-500/5'
                          : 'border-border/40 bg-muted/20 opacity-70'
                    }`}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={isApproved ? 'default' : isDraft ? 'secondary' : 'outline'}
                            className="text-[9px] uppercase font-mono px-1.5 py-0"
                          >
                            {isApproved ? 'Enviado' : isDraft ? 'Rascunho' : 'Retirado'}
                          </Badge>
                          {isApproved && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Visível na preparação
                            </span>
                          )}
                          {isDraft && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              Apenas você pode ver
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(msg.approved_at || msg.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      {msg.summary_text && (
                        <div className="p-2 rounded bg-background/80 border border-border/40 space-y-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Resumo conferido:
                          </span>
                          <p className="text-xs text-foreground font-medium leading-snug">
                            {msg.summary_text}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {msg.message_text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        {isDraft && (
                          <div className="flex items-center gap-2 w-full justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              Não compartilhado ainda.
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleApproveDraft(msg.id)}
                              className="text-xs h-7 px-3 bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Enviar para terapeuta</span>
                            </Button>
                          </div>
                        )}

                        {isApproved && (
                          <div className="flex items-center justify-between w-full">
                            <p className="text-[10px] text-muted-foreground italic">
                              Compartilhado com sua profissional.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWithdrawMessage(msg.id)}
                              disabled={withdrawingMessageId === msg.id}
                              className="text-xs h-7 px-2.5 text-muted-foreground hover:text-destructive gap-1"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>
                                {withdrawingMessageId === msg.id
                                  ? 'Retirando...'
                                  : 'Retirar recado'}
                              </span>
                            </Button>
                          </div>
                        )}

                        {isWithdrawn && (
                          <p className="text-[10px] text-muted-foreground italic">
                            Retirado em{' '}
                            {msg.withdrawn_at
                              ? new Date(msg.withdrawn_at).toLocaleDateString('pt-BR')
                              : 'data recente'}
                            . Não aparece mais na área de preparação do próximo encontro.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* DIALOG DE COMPARTILHAMENTO (RECADO PARA A PRÓXIMA SESSÃO) */}
      {/* REGRA P0: Abre um campo NOVO e VAZIO. NUNCA copia ou resume o Caderno nele! */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold font-serif flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Recado para a Próxima Sessão
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Escreva o que você deseja avisar ou levar para o seu próximo encontro. Este campo é
              completamente separado do seu Caderno particular.
            </DialogDescription>
          </DialogHeader>

          {stepShare === 'write' && (
            <div className="space-y-3 py-2">
              <div className="p-2.5 bg-muted/20 border border-border/40 rounded-md text-xs space-y-1">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Privacidade preservada
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Suas anotações do Caderno permanecem intactas e confidenciais. Apenas o texto
                  abaixo será compartilhado com a profissional.
                </p>
              </div>

              {/* Voz no Recado */}
              {showVoiceShare ? (
                <VoiceInputCapture
                  targetLabel="recado para a terapeuta"
                  onConfirmText={(confirmedText) => {
                    setMessageText((prev) =>
                      prev ? `${prev.trim()}\n\n${confirmedText}` : confirmedText,
                    )
                    setShowVoiceShare(false)
                    toast({
                      title: 'Fala inserida no recado',
                      description:
                        'O texto foi adicionado. Confira antes de gerar o resumo e enviar.',
                    })
                  }}
                  onCancel={() => setShowVoiceShare(false)}
                />
              ) : (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceShare(true)}
                    className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span>Falar recado por voz</span>
                  </Button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Sua mensagem para a terapeuta:
                </label>
                <Textarea
                  placeholder="Exemplo: Gostaria de conversar sobre uma dificuldade que tive na respiração ontem, ou sobre como me senti..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {stepShare === 'review' && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-emerald-500/10 border border-emerald-300 rounded-md text-xs space-y-1">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Conferência antes de enviar
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Confira o texto do seu recado e o resumo breve que a profissional verá na
                  preparação. Você pode editar o resumo livremente.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Resumo breve conferido:
                </span>
                <Input
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="Resumo breve do recado..."
                  className="text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Mensagem completa:
                </span>
                <div className="p-2.5 rounded bg-muted/20 border border-border/40 text-xs text-foreground/90 whitespace-pre-wrap">
                  {messageText}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-between items-center sm:justify-between gap-2 pt-2">
            {stepShare === 'write' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareDialogOpen(false)}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraftMessage}
                    disabled={submittingMessage || !messageText.trim()}
                    className="text-xs h-8"
                  >
                    Salvar Rascunho
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleProceedToReview}
                    disabled={!messageText.trim()}
                    className="text-xs h-8 gap-1.5"
                  >
                    <span>Conferir Resumo</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStepShare('write')}
                  className="text-xs h-8"
                >
                  Voltar e Editar
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraftMessage}
                    disabled={submittingMessage}
                    className="text-xs h-8"
                  >
                    Salvar Rascunho
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApproveAndSendMessage}
                    disabled={submittingMessage || !messageText.trim()}
                    className="text-xs h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Aprovar e Enviar</span>
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE HISTÓRICO DE VERSÕES DO CADERNO */}
      <Dialog
        open={viewingVersionsEntryId !== null}
        onOpenChange={(open) => !open && setViewingVersionsEntryId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold font-serif flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Histórico de Versões da Anotação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Todas as versões anteriores da sua anotação continuam guardadas e privadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {loadingVersions ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Carregando versões anteriores...
              </p>
            ) : versionsList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma versão anterior arquivada ainda.
              </p>
            ) : (
              versionsList.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/15 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Versão {ver.version_number}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(ver.created).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {ver.title && <p className="font-semibold text-foreground">{ver.title}</p>}
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {ver.content}
                  </p>
                  {ver.change_reason && (
                    <p className="text-[10px] text-muted-foreground italic">
                      Motivo: {ver.change_reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingVersionsEntryId(null)}
              className="text-xs h-8"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
