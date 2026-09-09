/**
 * Build 05: Professional AI Core Workspace Component
 * Permite ao profissional:
 * 1. Gerar Professional Brief (Efêmero)
 * 2. Realizar Ask CER com estados explícitos (Efêmero)
 * 3. Gerar e Revisar Proposals Inferenciais (cer_ai_proposals + cer_ai_proposal_sources)
 * 4. Conversão para rascunho canônico profissional (preservando o Registro Único sob ação humana)
 */

import React, { useState, useEffect } from 'react'
import { AiOutputContract, CerAiProposalRecord, AiProposalType, AiReviewAction } from '@/types/cer'
import { cerAiCoreService } from '@/services/aiCoreService'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  HelpCircle,
  FileText,
  Lightbulb,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Send,
  RefreshCw,
  Edit3,
} from 'lucide-react'

interface ProfessionalAiWorkspaceProps {
  humanUserId: string
  enrollmentId: string
  onPreFillCanonicalKnowledge?: (statement: string, conceptKey?: string) => void
}

export const ProfessionalAiWorkspace: React.FC<ProfessionalAiWorkspaceProps> = ({
  humanUserId,
  enrollmentId,
  onPreFillCanonicalKnowledge,
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'ask_cer' | 'proposals'>('proposals')

  // Estado do Professional Brief
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefResult, setBriefResult] = useState<AiOutputContract | null>(null)
  const [briefFocus, setBriefFocus] = useState('')

  // Estado do Ask CER
  const [askLoading, setAskLoading] = useState(false)
  const [askQuestion, setAskQuestion] = useState('')
  const [askResult, setAskResult] = useState<AiOutputContract | null>(null)

  // Estado do Proposal Engine
  const [proposals, setProposals] = useState<CerAiProposalRecord[]>([])
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [selectedProposalType, setSelectedProposalType] =
    useState<AiProposalType>('integrative_hypothesis')
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const loadProposals = async () => {
    setLoadingProposals(true)
    try {
      const list = await cerAiCoreService.listProposals(enrollmentId)
      setProposals(list)
    } catch (err) {
      console.error('Erro ao carregar proposals:', err)
    } finally {
      setLoadingProposals(false)
    }
  }

  useEffect(() => {
    if (enrollmentId) {
      loadProposals()
    }
  }, [enrollmentId])

  // Handler do Brief
  const handleGenerateBrief = async () => {
    setBriefLoading(true)
    try {
      const res = await cerAiCoreService.generateBrief({
        humanUserId,
        enrollmentId,
        focusArea: briefFocus || undefined,
      })
      setBriefResult(res)
    } catch (err) {
      console.error('Erro no Brief:', err)
    } finally {
      setBriefLoading(false)
    }
  }

  // Handler do Ask CER
  const handleAskCer = async () => {
    if (!askQuestion.trim()) return
    setAskLoading(true)
    try {
      const res = await cerAiCoreService.askCer({
        humanUserId,
        enrollmentId,
        question: askQuestion,
      })
      setAskResult(res)
    } catch (err) {
      console.error('Erro no Ask CER:', err)
    } finally {
      setAskLoading(false)
    }
  }

  // Handler da geração de Proposal
  const handleGenerateProposal = async () => {
    setGeneratingProposal(true)
    try {
      const res = await cerAiCoreService.generateProposal({
        humanUserId,
        enrollmentId,
        proposalType: selectedProposalType,
      })
      if (res.proposal) {
        await loadProposals()
      }
    } catch (err) {
      console.error('Erro ao gerar proposal:', err)
    } finally {
      setGeneratingProposal(false)
    }
  }

  // Handler de revisão de Proposal
  const handleReviewProposal = async (proposalId: string, action: AiReviewAction) => {
    setReviewingId(proposalId)
    try {
      await cerAiCoreService.reviewProposal({
        humanUserId,
        proposalId,
        action,
        editedText: action === 'edited_and_approved' ? editingText : undefined,
      })
      setEditingProposalId(null)
      setEditingText('')
      await loadProposals()
    } catch (err) {
      console.error('Erro na revisão da proposal:', err)
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              AI Core V1 — Assistência Profissional
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            100% Profissional & Interno
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Três capacidades estritamente controladas: Briefing Efêmero, Consulta Rastreável (Ask CER)
          e Motor de Hipóteses com Revisão Humana Obrigatória.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="proposals" className="text-xs gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Proposal Engine</span>
            </TabsTrigger>
            <TabsTrigger value="brief" className="text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Professional Brief</span>
            </TabsTrigger>
            <TabsTrigger value="ask_cer" className="text-xs gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask CER</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROPOSALS */}
          <TabsContent value="proposals" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/40">
              <div className="space-y-1">
                <p className="text-xs font-medium">Gerar Nova Proposta Inferencial</p>
                <p className="text-[11px] text-muted-foreground">
                  A IA analisa o contexto autorizado e submete uma proposta com fontes rastreáveis
                  para sua revisão.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProposalType}
                  onChange={(e) => setSelectedProposalType(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 bg-background"
                  disabled={generatingProposal}
                >
                  <option value="integrative_hypothesis">Hipótese Integrativa</option>
                  <option value="knowledge_suggestion">Sugestão de Conhecimento</option>
                  <option value="association_suggestion">Sugestão de Associação</option>
                </select>
                <Button
                  size="sm"
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal}
                  className="text-xs gap-1.5"
                >
                  {generatingProposal ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Gerar Proposta</span>
                </Button>
              </div>
            </div>

            {loadingProposals ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Carregando propostas do enrollment...
              </div>
            ) : proposals.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                Nenhuma AI Proposal registrada para este enrollment.
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((prop) => {
                  const isEditing = editingProposalId === prop.id
                  const sources = prop.expand?.cer_ai_proposal_sources_via_proposal_id || []

                  return (
                    <div
                      key={prop.id}
                      className="p-3.5 rounded-lg border border-border/60 bg-card space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {prop.proposal_type}
                          </Badge>
                          <Badge
                            variant={
                              prop.status === 'approved'
                                ? 'default'
                                : prop.status === 'discarded'
                                  ? 'destructive'
                                  : prop.status === 'observing'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            className="text-[10px] uppercase font-mono"
                          >
                            {prop.status}
                          </Badge>
                          {prop.review_action && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({prop.review_action})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(prop.created).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* Texto original da IA (imutável) */}
                      <div className="p-2.5 rounded bg-muted/40 border border-border/30 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                          Texto Original da IA (Imutável):
                        </span>
                        <p className="text-foreground leading-relaxed">{prop.proposal_text}</p>
                      </div>

                      {/* Texto editado pelo profissional se houver */}
                      {prop.edited_text && (
                        <div className="p-2.5 rounded bg-primary/5 border border-primary/20 space-y-1">
                          <span className="text-[10px] uppercase font-mono text-primary font-semibold">
                            Texto Calibrado pelo Profissional:
                          </span>
                          <p className="text-foreground leading-relaxed">{prop.edited_text}</p>
                        </div>
                      )}

                      {/* Modo de edição */}
                      {isEditing && (
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-medium text-foreground">
                            Refinar texto antes de aprovar (o texto original da IA permanece
                            intacto):
                          </p>
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-xs"
                            rows={3}
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setEditingProposalId(null)
                                setEditingText('')
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs gap-1"
                              disabled={reviewingId === prop.id}
                              onClick={() => handleReviewProposal(prop.id, 'edited_and_approved')}
                            >
                              Salvar e Aprovar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Fontes rastreáveis */}
                      {sources.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono text-muted-foreground">
                            Fontes Autorizadas ({sources.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {sources.map((s) => (
                              <Badge
                                key={s.id}
                                variant="secondary"
                                className="text-[10px] font-mono"
                              >
                                {s.source_type}: {s.source_id.slice(0, 8)}...
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ações de revisão se pending */}
                      {prop.status === 'pending_review' && !isEditing && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 text-emerald-600 hover:text-emerald-700"
                              disabled={reviewingId === prop.id}
                              onClick={() => handleReviewProposal(prop.id, 'approved')}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1"
                              disabled={reviewingId === prop.id}
                              onClick={() => {
                                setEditingProposalId(prop.id)
                                setEditingText(prop.proposal_text)
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar & Aprovar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 text-amber-600 hover:text-amber-700"
                              disabled={reviewingId === prop.id}
                              onClick={() => handleReviewProposal(prop.id, 'observing')}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Observar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 text-destructive hover:text-destructive"
                              disabled={reviewingId === prop.id}
                              onClick={() => handleReviewProposal(prop.id, 'discarded')}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Descartar</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Conversão para criação canônica após aprovação */}
                      {prop.status === 'approved' && onPreFillCanonicalKnowledge && (
                        <div className="flex items-center justify-end pt-2 border-t border-border/40">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs h-7 gap-1"
                            onClick={() =>
                              onPreFillCanonicalKnowledge(
                                prop.edited_text || prop.proposal_text,
                                prop.purpose || 'integrative_hypothesis',
                              )
                            }
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Pré-preencher Formulário Canônico</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PROFESSIONAL BRIEF */}
          <TabsContent value="brief" className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/40 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium">Gerar Professional Brief (Efêmero)</p>
                <p className="text-[11px] text-muted-foreground">
                  Síntese de apoio à preparação profissional. O briefing não é persistido no banco;
                  apenas metadados técnicos de auditoria são registrados.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Foco opcional do brief (ex: padrões de sono, transições)..."
                  value={briefFocus}
                  onChange={(e) => setBriefFocus(e.target.value)}
                  className="text-xs"
                  disabled={briefLoading}
                />
                <Button
                  size="sm"
                  onClick={handleGenerateBrief}
                  disabled={briefLoading}
                  className="text-xs gap-1.5 shrink-0"
                >
                  {briefLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Gerar Brief</span>
                </Button>
              </div>
            </div>

            {briefResult && (
              <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Status: {briefResult.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Incerteza: {briefResult.uncertainty}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed">{briefResult.proposal_or_answer}</p>
                {briefResult.basis.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border/40">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">
                      Fontes Autorizadas Analisadas ({briefResult.basis.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {briefResult.basis.map((b, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                          {b.source_type}: {b.source_id.slice(0, 8)}...
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: ASK CER */}
          <TabsContent value="ask_cer" className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/40 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium">Ask CER — Consulta Contextual Autorizada</p>
                <p className="text-[11px] text-muted-foreground">
                  Faça perguntas específicas sobre a jornada autorizada do interagente. A resposta é
                  efêmera e sempre acompanhada de referências rastreáveis.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Quais sinais sensoriais foram observados no início do ciclo?..."
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskCer()
                  }}
                  className="text-xs"
                  disabled={askLoading}
                />
                <Button
                  size="sm"
                  onClick={handleAskCer}
                  disabled={askLoading || !askQuestion.trim()}
                  className="text-xs gap-1.5 shrink-0"
                >
                  {askLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Consultar</span>
                </Button>
              </div>
            </div>

            {askResult && (
              <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      askResult.status === 'answered'
                        ? 'default'
                        : askResult.status === 'refused'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-[10px] uppercase font-mono"
                  >
                    {askResult.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Incerteza: {askResult.uncertainty}
                  </span>
                </div>

                <p className="text-foreground leading-relaxed">{askResult.proposal_or_answer}</p>

                {askResult.missing_information.length > 0 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Ramos não resolvidos: {askResult.missing_information.join(', ')}</span>
                  </div>
                )}

                {askResult.basis.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border/40">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">
                      Fontes que Fundamentam a Resposta ({askResult.basis.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {askResult.basis.map((b, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                          {b.source_type}: {b.source_id.slice(0, 8)}...
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
