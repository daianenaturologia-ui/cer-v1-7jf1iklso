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
import { Layers, History, Eye, GitBranch, FileText } from 'lucide-react'
import {
  cerKnowledgeItemService,
  cerAssociationService,
  cerSignalService,
} from '@/services/cerKnowledge'
import {
  CerKnowledgeItemRecord,
  CerAssociationRecord,
  CerSignalRecord,
  CerKnowledgeEvidenceRecord,
  CerKnowledgeItemVersionRecord,
} from '@/types/cer'

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
  const [selectedKI, setSelectedKI] = useState<CerKnowledgeItemRecord | null>(null)
  const [evidenceList, setEvidenceList] = useState<CerKnowledgeEvidenceRecord[]>([])
  const [versionsList, setVersionsList] = useState<CerKnowledgeItemVersionRecord[]>([])
  const [provenanceOpen, setProvenanceOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadKnowledge = async () => {
    setLoading(true)
    try {
      const [kiData, assocData, sigData] = await Promise.all([
        cerKnowledgeItemService.listByEnrollment(enrollmentId),
        cerAssociationService.listByEnrollment(enrollmentId),
        cerSignalService.listSignalsByEnrollment(enrollmentId),
      ])
      setItems(kiData)
      setAssociations(assocData)
      setSignals(sigData)
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

                <p className="text-foreground text-xs leading-relaxed font-serif italic pl-2 border-l-2 border-primary/40">
                  &ldquo;{item.statement}&rdquo;
                </p>

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
