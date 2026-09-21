/**
 * Build 06: Professional Map Editor (Item 24)
 *
 * Fluxo completo do editor profissional:
 * 1. Knowledge elegível carregado via deterministic candidate service (sem IA)
 * 2. Visualização de candidatos agrupados por seção com contexto profissional e alertas
 * 3. Seleção de candidato e redação da formulação humana participante-facing
 * 4. Adição ao draft com posição automática e vinculação segura de fontes
 * 5. Reordenação e edição de itens em draft
 * 6. Preview fiel da experiência participante
 * 7. Recursos balance warning (item 21): alerta profissional não bloqueante se houver desafios sem recursos
 * 8. Publicação segura (gate completo + supersede atômico)
 * 9. Ação "Criar nova versão" a partir do published (item 26)
 * 10. Ação "Descartar rascunho" (item 27) com confirmação
 */

import React, { useState, useEffect } from 'react'
import {
  CerMapRecord,
  CerMapItemRecord,
  CerMapItemSourceRecord,
  CerMapSection,
  CER_MAP_SECTIONS,
  CER_MAP_SECTION_LABELS,
  CER_MAP_SECTION_DESCRIPTIONS,
} from '@/types/cer'
import { cerMapService } from '@/services/cerMapService'
import { cerMapCandidateService, MapCandidateItem } from '@/services/cerMapCandidateService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Compass,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  FilePlus,
  ArrowUp,
  ArrowDown,
  Info,
  BookOpen,
} from 'lucide-react'
import { ParticipantMapDisplay } from './ParticipantMapDisplay'

interface ProfessionalMapEditorProps {
  enrollmentId: string
  participantName: string
  professionalUserId: string
}

export const ProfessionalMapEditor: React.FC<ProfessionalMapEditorProps> = ({
  enrollmentId,
  participantName,
  professionalUserId,
}) => {
  const [loading, setLoading] = useState(true)
  const [activeDraft, setActiveDraft] = useState<
    | (CerMapRecord & {
        items: (CerMapItemRecord & { sources?: CerMapItemSourceRecord[] })[]
      })
    | null
  >(null)
  const [publishedMap, setPublishedMap] = useState<
    (CerMapRecord & { items: CerMapItemRecord[] }) | null
  >(null)
  const [candidates, setCandidates] = useState<MapCandidateItem[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<MapCandidateItem | null>(null)

  // Formulário de adição / redação
  const [targetSection, setTargetSection] = useState<CerMapSection>('minha_natureza')
  const [formulatedText, setFormulatedText] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Trava real de publicação: primeiro encontro registrado
  const [publishEligibility, setPublishEligibility] = useState<{
    allowed: boolean
    reason?: string
    sessionCount: number
    hasError?: boolean
  }>({
    allowed: false,
    reason: 'O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.',
    sessionCount: 0,
  })

  const loadAll = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [draft, pub, cands, eligibility] = await Promise.all([
        cerMapService.getDraftMap(enrollmentId),
        cerMapService.getCurrentPublishedMap(enrollmentId),
        cerMapCandidateService.listCandidatesForEnrollment(enrollmentId),
        cerMapService.canPublishMap(enrollmentId),
      ])
      setActiveDraft(draft)
      setPublishedMap(pub)
      setCandidates(cands)
      setPublishEligibility(eligibility)
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao carregar Mapa CER.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [enrollmentId])

  // Iniciar novo draft inicial se não houver draft nem publicado
  const handleCreateDraft = async () => {
    try {
      setLoading(true)
      await cerMapService.createInitialDraft(enrollmentId, professionalUserId)
      await loadAll()
      setSuccessMessage('Rascunho V1 criado com sucesso.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar rascunho.')
      setLoading(false)
    }
  }

  // Criar próxima versão a partir do publicado atual (Item 26)
  const handleCreateNextDraft = async () => {
    if (!publishedMap) return
    try {
      setLoading(true)
      await cerMapService.createNextDraftFromPublished(publishedMap.id, professionalUserId)
      await loadAll()
      setSuccessMessage(
        `Rascunho v${publishedMap.version_number + 1} criado com base na versão publicada.`,
      )
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar nova versão.')
      setLoading(false)
    }
  }

  // Descartar rascunho (Item 27)
  const handleDiscardDraft = async () => {
    if (!activeDraft) return
    try {
      setLoading(true)
      await cerMapService.discardDraft(activeDraft.id)
      setDiscardDialogOpen(false)
      await loadAll()
      setSuccessMessage('Rascunho descartado com sucesso.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao descartar rascunho.')
      setLoading(false)
    }
  }

  // Selecionar candidato para redigir
  const handleSelectCandidate = (cand: MapCandidateItem) => {
    setSelectedCandidate(cand)
    const recSec = cand.evaluation.recommendedSections[0] || 'minha_natureza'
    setTargetSection(recSec)

    // Sugestão de texto acolhedora respeitando distância epistemológica
    let initialText = cand.knowledgeItem.statement
    if (cand.evaluation.attributionSuggestion) {
      initialText = `[${cand.framework?.name || 'Referencial'}]: ${initialText}`
    }
    setFormulatedText(initialText)

    if (cand.evaluation.editorialWarning) {
      setWarningMessage(cand.evaluation.editorialWarning)
    } else {
      setWarningMessage(null)
    }
  }

  // Adicionar item redigido ao draft
  const handleAddItem = async () => {
    if (!activeDraft || !formulatedText.trim()) return

    setSavingItem(true)
    setErrorMessage(null)
    try {
      const sectionItems = activeDraft.items.filter((it) => it.section === targetSection)
      const nextPos = sectionItems.length + 1

      // 1. Criar o item no draft
      const newItem = await cerMapService.addMapItem(
        {
          map_id: activeDraft.id,
          section: targetSection,
          item_text: formulatedText.trim(),
          position: nextPos,
        },
        professionalUserId,
      )

      // 2. Se derivou de um candidato selecionado, vincular a fonte compatível
      if (selectedCandidate) {
        // Linkar o KI com version anchor estrito
        await cerMapService.linkSource({
          map_item_id: newItem.id,
          source_type: 'knowledge_item',
          knowledge_item_id: selectedCandidate.knowledgeItem.id,
          knowledge_version_number: selectedCandidate.knowledgeItem.version,
        })

        // Se houver recognition associada, linkar também
        if (selectedCandidate.latestRecognition) {
          await cerMapService.linkSource({
            map_item_id: newItem.id,
            source_type: 'participant_recognition',
            recognition_id: selectedCandidate.latestRecognition.id,
          })
        }

        // Se houver presentation context
        if (selectedCandidate.presentationContext) {
          await cerMapService.linkSource({
            map_item_id: newItem.id,
            source_type: 'presentation_context',
            presentation_id: selectedCandidate.presentationContext.id,
          })
        }
      }

      setFormulatedText('')
      setSelectedCandidate(null)
      setWarningMessage(null)
      await loadAll()
      setSuccessMessage('Item adicionado ao rascunho com sucesso.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao adicionar item ao rascunho.')
    } finally {
      setSavingItem(false)
    }
  }

  // Reordenar item para cima/baixo na seção
  const handleMovePosition = async (item: CerMapItemRecord, direction: 'up' | 'down') => {
    if (!activeDraft) return
    const sectionItems = activeDraft.items
      .filter((it) => it.section === item.section)
      .sort((a, b) => a.position - b.position)

    const currentIndex = sectionItems.findIndex((it) => it.id === item.id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sectionItems.length) return

    const otherItem = sectionItems[targetIndex]
    const curPos = item.position
    const otherPos = otherItem.position

    try {
      await cerMapService.reorderItems([
        { id: item.id, position: otherPos },
        { id: otherItem.id, position: curPos },
      ])
      await loadAll()
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao reordenar itens.')
    }
  }

  // Validação de recursos antes do publish (Item 21)
  const checkResourcesBalance = (): boolean => {
    if (!activeDraft) return true
    const hasChallenges = activeDraft.items.some(
      (it) => it.section === 'quando_saio_do_meu_eixo' || it.section === 'meus_padroes',
    )
    const hasResources = activeDraft.items.some(
      (it) => it.section === 'meus_recursos' || it.section === 'quando_estou_no_meu_eixo',
    )

    if (hasChallenges && !hasResources) {
      setWarningMessage(
        'Atenção ao equilíbrio de recursos: Este mapa traz desafios ou desvios de eixo, mas ainda não apresenta recursos ou apoios reconhecidos. Vale revisar antes de publicar!',
      )
      return false
    }
    return true
  }

  // Publicar o draft
  const handlePublish = async (forceAfterWarning = false) => {
    if (!activeDraft) return

    if (!forceAfterWarning) {
      const balanced = checkResourcesBalance()
      if (!balanced) {
        // Alerta não-bloqueante exibido, aguardar decisão do profissional
        return
      }
    }

    setPublishing(true)
    setErrorMessage(null)
    try {
      await cerMapService.publishDraft(activeDraft.id, enrollmentId)
      setWarningMessage(null)
      await loadAll()
      setSuccessMessage('Mapa CER publicado com sucesso! Já disponível para a participante.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao publicar Mapa CER.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold font-serif">
                Mapa CER — Síntese Viva de Compreensão
              </CardTitle>
              {publishedMap && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 border-emerald-300"
                >
                  Publicado v{publishedMap.version_number}
                </Badge>
              )}
              {activeDraft && (
                <Badge variant="secondary" className="text-[10px]">
                  Rascunho v{activeDraft.version_number} em edição
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Acompanhamento de {participantName}. Princípio: Backend Preciso. Frontend Humano.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {publishedMap && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Publicado</span>
              </Button>
            )}

            {!activeDraft && publishedMap && (
              <Button size="sm" onClick={handleCreateNextDraft} className="text-xs h-8 gap-1.5">
                <FilePlus className="w-3.5 h-3.5" />
                <span>Criar Nova Versão (v{publishedMap.version_number + 1})</span>
              </Button>
            )}

            {!activeDraft && !publishedMap && (
              <Button size="sm" onClick={handleCreateDraft} className="text-xs h-8 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Iniciar Mapa CER (V1)</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alertas e Mensagens */}
        {errorMessage && (
          <Alert variant="destructive" className="py-2.5 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle className="text-xs font-semibold">Aviso</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="py-2.5 text-xs border-emerald-500/50 bg-emerald-500/10 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {warningMessage && (
          <Alert className="py-2.5 text-xs border-amber-500/50 bg-amber-500/10 text-amber-900">
            <Info className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-xs font-semibold">Revisão Editorial Sugerida</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{warningMessage}</p>
              {activeDraft && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePublish(true)}
                    className="text-[11px] h-7 px-2.5 bg-card text-foreground"
                  >
                    Prosseguir e Publicar Mesmo Assim
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ÁREA DE TRABALHO DO RASCUNHO ATIVO */}
        {activeDraft ? (
          <div className="space-y-6">
            <div className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>Rascunho Ativo (Versão {activeDraft.version_number})</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {activeDraft.items.length} {activeDraft.items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione elementos de conhecimento elegíveis ou redija diretamente novas
                    formulações.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDiscardDialogOpen(true)}
                    className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Descartar Rascunho</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePublish(false)}
                    disabled={publishing || !publishEligibility.allowed}
                    className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!publishEligibility.allowed ? publishEligibility.reason : undefined}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{publishing ? 'Publicando...' : 'Publicar Mapa'}</span>
                  </Button>
                </div>
              </div>

              {/* Banner informativo da Trava do Primeiro Encontro */}
              {!publishEligibility.allowed && (
                <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium">
                      O Mapa CER poderá ser compartilhado após o registro do primeiro encontro.
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono shrink-0 border-amber-400"
                  >
                    {publishEligibility.sessionCount} encontro(s)
                  </Badge>
                </div>
              )}

              {/* CANDIDATOS DETERMINÍSTICOS (Item 25) */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-xs font-semibold text-foreground block">
                  Possíveis Elementos para o Mapa (Candidatos Determinísticos sem IA)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Conhecimentos consolidados e relatos da participante aptos para sustentação.
                </p>

                {candidates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Nenhum elemento de conhecimento elegível encontrado para este enrollment.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {candidates.map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => handleSelectCandidate(cand)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedCandidate?.id === cand.id
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1">
                          <span className="font-mono uppercase">
                            {cand.knowledgeItem.concept_key}
                          </span>
                          <span className="capitalize">{cand.knowledgeItem.temporality}</span>
                        </div>
                        <p className="text-xs text-foreground font-medium line-clamp-2">
                          {cand.knowledgeItem.statement}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                            {cand.sourceContextSummary}
                          </Badge>
                          {cand.knowledgeItem.status === 'observing' && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-800"
                            >
                              Em observação
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FORMULÁRIO DE REDAÇÃO HUMANA (Item 24) */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/3 space-y-1">
                    <Label className="text-xs font-medium">Seção de Destino (11 Seções)</Label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value as CerMapSection)}
                      className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs"
                    >
                      {Object.values(CER_MAP_SECTIONS).map((sec) => (
                        <option key={sec} value={sec}>
                          {CER_MAP_SECTION_LABELS[sec]}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      {CER_MAP_SECTION_DESCRIPTIONS[targetSection]}
                    </p>
                  </div>

                  <div className="w-full sm:w-2/3 space-y-1">
                    <Label className="text-xs font-medium">
                      Formulação Participante-Facing (Síntese Humana)
                    </Label>
                    <Textarea
                      placeholder="Redija como a pessoa se reconhece ou vivencia este traço..."
                      value={formulatedText}
                      onChange={(e) => setFormulatedText(e.target.value)}
                      className="text-xs min-h-[72px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-muted-foreground">
                    {selectedCandidate ? (
                      <span>
                        Fonte vinculada:{' '}
                        <code className="font-mono text-[10px]">
                          {selectedCandidate.knowledgeItem.concept_key}
                        </code>
                      </span>
                    ) : (
                      <span>Redação livre profissional para o rascunho</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    disabled={savingItem || !formulatedText.trim()}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{savingItem ? 'Adicionando...' : 'Adicionar ao Rascunho'}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* LISTA DE ITENS ATUAIS NO RASCUNHO */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Estrutura Atual do Rascunho v{activeDraft.version_number}
              </h4>

              {activeDraft.items.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-lg text-xs text-muted-foreground space-y-1">
                  <p>Rascunho vazio. Adicione itens acima para compor o Mapa CER.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.values(CER_MAP_SECTIONS).map((sec) => {
                    const secItems = activeDraft.items
                      .filter((it) => it.section === sec)
                      .sort((a, b) => a.position - b.position)

                    if (secItems.length === 0) return null

                    return (
                      <div key={sec} className="p-3 border rounded-lg bg-card space-y-2">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="text-xs font-semibold text-foreground font-serif">
                            {CER_MAP_SECTION_LABELS[sec]}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {secItems.length} {secItems.length === 1 ? 'item' : 'itens'}
                          </Badge>
                        </div>

                        <div className="space-y-1.5">
                          {secItems.map((it, idx) => (
                            <div
                              key={it.id}
                              className="flex items-center justify-between gap-3 p-2 bg-muted/20 rounded border border-border/40 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="text-foreground leading-relaxed">
                                  {it.item_text}
                                </span>
                                {it.sources && it.sources.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground flex gap-1.5">
                                    <span>
                                      Fontes: {it.sources.map((s) => s.source_type).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePosition(it, 'up')}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === secItems.length - 1}
                                  onClick={() => handleMovePosition(it, 'down')}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : publishedMap ? (
          /* QUANDO NÃO HÁ DRAFT, MAS HÁ MAPA PUBLICADO */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-foreground">
                    Mapa CER Versão {publishedMap.version_number} Ativo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mapa está publicado e visível para a participante. O histórico é imutável.
                  Para novas alterações, inicie uma nova versão.
                </p>
              </div>

              <Button size="sm" onClick={handleCreateNextDraft} className="text-xs h-8 gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Criar Próxima Versão (v{publishedMap.version_number + 1})</span>
              </Button>
            </div>

            <ParticipantMapDisplay map={publishedMap} />
          </div>
        ) : (
          /* NENHUM MAPA CRIADO AINDA */
          <div className="text-center py-12 space-y-3 border border-dashed rounded-xl">
            <Compass className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h3 className="text-sm font-medium text-foreground">
              Nenhum Mapa CER iniciado para {participantName}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              O Mapa CER é uma síntese participante-facing, viva e versionada da compreensão atual.
              Inicie um rascunho V1 para começar a selecionar elementos.
            </p>
            <Button size="sm" onClick={handleCreateDraft} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Iniciar Rascunho V1</span>
            </Button>
          </div>
        )}
      </CardContent>

      {/* DIALOG DE PREVIEW PARTICIPANTE */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-serif">
              Preview da Experiência da Participante
            </DialogTitle>
            <DialogDescription className="text-xs">
              Como a participante visualiza o mapa no seu próprio portal (zero termos técnicos ou
              IDs).
            </DialogDescription>
          </DialogHeader>

          {publishedMap ? (
            <ParticipantMapDisplay map={publishedMap} />
          ) : activeDraft ? (
            <ParticipantMapDisplay
              map={{
                ...activeDraft,
                status: 'published',
                published_at: new Date().toISOString(),
              }}
            />
          ) : null}

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              className="text-xs"
            >
              Fechar Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMAÇÃO DE DESCARTE (Item 27) */}
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Descartar Rascunho de Mapa?</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              O rascunho atual será arquivado como &ldquo;discarded&rdquo; e não poderá mais ser
              editado nem publicado. O histórico permanecerá auditado e nenhum dado é deletado
              fisicamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiscardDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDiscardDraft}
              className="text-xs"
            >
              Confirmar Descarte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
export default ProfessionalMapEditor
