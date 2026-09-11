import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Search,
  Filter,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { cerPracticeService } from '@/services/cerPracticeService'
import type {
  CerPracticeRecord,
  CerPracticeVersionRecord,
  CerPracticeEvidenceRecord,
  CerPracticeSafetyProfileRecord,
  CerPracticeVariantRecord,
} from '@/types/cer'

interface PracticeSelectorProps {
  onSelectPractice?: (practice: CerPracticeRecord, version: CerPracticeVersionRecord) => void
  selectedPracticeId?: string
  className?: string
}

export const PracticeSelector: React.FC<PracticeSelectorProps> = ({
  onSelectPractice,
  selectedPracticeId,
  className = '',
}) => {
  const [practices, setPractices] = useState<CerPracticeRecord[]>([])
  const [selectedPractice, setSelectedPractice] = useState<CerPracticeRecord | null>(null)
  const [practiceVersions, setPracticeVersions] = useState<
    Record<string, CerPracticeVersionRecord>
  >({})
  const [evidenceMap, setEvidenceMap] = useState<Record<string, CerPracticeEvidenceRecord[]>>({})
  const [safetyMap, setSafetyMap] = useState<Record<string, CerPracticeSafetyProfileRecord | null>>(
    {},
  )
  const [variantsMap, setVariantsMap] = useState<Record<string, CerPracticeVariantRecord[]>>({})
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [intensityFilter, setIntensityFilter] = useState<string>('ALL')

  // Drawer de Detalhes (EvidenceSafetyDrawer Composto)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPractice, setDrawerPractice] = useState<CerPracticeRecord | null>(null)
  const [drawerVersion, setDrawerVersion] = useState<CerPracticeVersionRecord | null>(null)
  const [drawerTab, setDrawerTab] = useState<'EVIDENCE' | 'SAFETY' | 'VARIANTS'>('EVIDENCE')

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const candidates = await cerPracticeService.findPracticeCandidates({})
      setPractices(candidates)

      // Carregar versões, evidências, perfis de segurança e variantes
      const versMap: Record<string, CerPracticeVersionRecord> = {}
      const evMap: Record<string, CerPracticeEvidenceRecord[]> = {}
      const sfMap: Record<string, CerPracticeSafetyProfileRecord | null> = {}
      const vrMap: Record<string, CerPracticeVariantRecord[]> = {}

      const [allVersions, allEvidence, allSafety, allVariants] = await Promise.all([
        pb.collection('cer_practice_versions').getFullList<CerPracticeVersionRecord>({
          sort: '-version_number',
        }),
        pb.collection('cer_practice_evidence').getFullList<CerPracticeEvidenceRecord>(),
        pb.collection('cer_practice_safety_profiles').getFullList<CerPracticeSafetyProfileRecord>(),
        pb.collection('cer_practice_variants').getFullList<CerPracticeVariantRecord>(),
      ])

      for (const p of candidates) {
        const pVersions = allVersions.filter((v) => v.practice_id === p.id)
        const published = pVersions.find((v) => v.status === 'active') || pVersions[0]
        if (published) {
          versMap[p.id] = published
          evMap[p.id] = allEvidence.filter((e) => e.practice_version_id === published.id)
          sfMap[p.id] = allSafety.find((s) => s.practice_version_id === published.id) || null
          vrMap[p.id] = allVariants.filter((v) => v.practice_version_id === published.id)
        }
      }

      setPracticeVersions(versMap)
      setEvidenceMap(evMap)
      setSafetyMap(sfMap)
      setVariantsMap(vrMap)
    } catch (err) {
      console.error('Erro ao carregar biblioteca de práticas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLibrary()
  }, [])

  const handleOpenDrawer = (practice: CerPracticeRecord) => {
    const ver = practiceVersions[practice.id] || null
    setDrawerPractice(practice)
    setDrawerVersion(ver)
    setDrawerTab('EVIDENCE')
    setDrawerOpen(true)
  }

  // Filtragem
  const filtered = practices.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchTitle = (p.participant_facing_name_base || p.internal_name)
        .toLowerCase()
        .includes(q)
      const matchFam = p.family?.toLowerCase().includes(q)
      if (!matchTitle && !matchFam) return false
    }

    if (intensityFilter !== 'ALL') {
      const ver = practiceVersions[p.id]
      if (ver && ver.intensity !== intensityFilter) return false
    }

    return true
  })

  return (
    <Card className={`border-border/70 ${className}`}>
      <CardHeader className="pb-3 pt-4 px-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-serif text-foreground">
                Biblioteca de Práticas Clínicas (Build 08C)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {practices.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Catálogo formal com governança, evidência, perfis de segurança e dosagem modular
            </CardDescription>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar práticas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 text-xs"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={intensityFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setIntensityFilter('ALL')}
                className="h-7 text-xs px-2"
              >
                Todas
              </Button>
              <Button
                size="sm"
                variant={intensityFilter === 'minimal' ? 'secondary' : 'outline'}
                onClick={() => setIntensityFilter('minimal')}
                className="h-7 text-xs px-2"
              >
                Mínima
              </Button>
              <Button
                size="sm"
                variant={intensityFilter === 'moderate' ? 'secondary' : 'outline'}
                onClick={() => setIntensityFilter('moderate')}
                className="h-7 text-xs px-2"
              >
                Moderada
              </Button>
              <Button
                size="sm"
                variant={intensityFilter === 'intensive' ? 'secondary' : 'outline'}
                onClick={() => setIntensityFilter('intensive')}
                className="h-7 text-xs px-2"
              >
                Intensiva
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10">
            Carregando biblioteca de práticas...
          </p>
        ) : filtered.length === 0 ? (
          /* Empty state seguro e orientado */
          <div className="text-center py-12 px-4 space-y-3 border border-dashed rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Nenhuma prática foi publicada ainda.
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                As práticas clínicas com evidências formais e perfis de segurança revisados serão
                disponibilizadas nas próximas etapas ou via curadoria editorial autorizada.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Próximo passo: aguardar liberação de práticas curadas ou atribuir formulações
              personalizadas na sessão.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((practice) => {
              const version = practiceVersions[practice.id]
              const evidence = evidenceMap[practice.id] || []
              const safety = safetyMap[practice.id]
              const variants = variantsMap[practice.id] || []
              const isSelected = selectedPracticeId === practice.id

              return (
                <div
                  key={practice.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/70 bg-card hover:bg-muted/15'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {practice.participant_facing_name_base || practice.internal_name}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {practice.family}
                          </Badge>
                        </div>
                        {version?.participant_title && (
                          <p className="text-[11px] text-muted-foreground">
                            Para o participante: &ldquo;{version.participant_title}&rdquo;
                          </p>
                        )}
                      </div>

                      {version && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] capitalize shrink-0 font-medium"
                        >
                          {version.intensity}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {version?.participant_summary || practice.internal_name}
                    </p>

                    {/* Resumo de Evidência e Segurança */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <FileCheck className="w-3.5 h-3.5" />
                        {evidence.length} base(s) de evidência
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {safety ? 'Perfil de segurança ativo' : 'Sem perfil estático'}
                      </span>
                      {variants.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{variants.length} variante(s)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDrawer(practice)}
                      className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Ver Evidência e Segurança</span>
                    </Button>

                    {onSelectPractice && version && (
                      <Button
                        size="sm"
                        variant={isSelected ? 'secondary' : 'default'}
                        onClick={() => onSelectPractice(practice, version)}
                        className="h-7 text-xs px-3 gap-1"
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selecionada</span>
                          </>
                        ) : (
                          <span>Selecionar Prática</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* MODAL / DRAWER COMPOSTO: EvidenceSafetyDrawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {drawerPractice && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <DialogTitle className="text-base font-semibold">
                    {drawerPractice.participant_facing_name_base || drawerPractice.internal_name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  {drawerVersion?.participant_summary || drawerPractice.internal_name}
                </DialogDescription>
              </DialogHeader>

              {/* Abas do Drawer */}
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Button
                  size="sm"
                  variant={drawerTab === 'EVIDENCE' ? 'default' : 'outline'}
                  onClick={() => setDrawerTab('EVIDENCE')}
                  className="h-7 text-xs px-3 gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Base de Evidência</span>
                </Button>
                <Button
                  size="sm"
                  variant={drawerTab === 'SAFETY' ? 'secondary' : 'outline'}
                  onClick={() => setDrawerTab('SAFETY')}
                  className="h-7 text-xs px-3 gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Perfil de Segurança</span>
                </Button>
                <Button
                  size="sm"
                  variant={drawerTab === 'VARIANTS' ? 'secondary' : 'outline'}
                  onClick={() => setDrawerTab('VARIANTS')}
                  className="h-7 text-xs px-3"
                >
                  Variantes ({variantsMap[drawerPractice.id]?.length || 0})
                </Button>
              </div>

              {/* Conteúdo da Aba */}
              <div className="py-2 space-y-3 text-xs">
                {drawerTab === 'EVIDENCE' && (
                  <div className="space-y-2.5">
                    {!evidenceMap[drawerPractice.id] ||
                    evidenceMap[drawerPractice.id].length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        Nenhuma evidência formal cadastrada para esta prática.
                      </p>
                    ) : (
                      evidenceMap[drawerPractice.id].map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              Confiança: {ev.confidence} • Maturidade: {ev.maturity}
                            </Badge>
                            {ev.reviewed_at && (
                              <span className="text-[10px] text-muted-foreground">
                                Revisado em: {new Date(ev.reviewed_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-foreground text-xs">
                            {ev.supported_claim_text || ev.evidence_basis_type}
                          </p>
                          {ev.safety_evidence_note && (
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-300 text-amber-900 dark:text-amber-200 text-[11px]">
                              <span className="font-medium">Nota de Segurança: </span>
                              {ev.safety_evidence_note}
                            </div>
                          )}
                          {ev.population_context_applicability && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              População: {ev.population_context_applicability}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {drawerTab === 'SAFETY' && (
                  <div className="space-y-3">
                    {safetyMap[drawerPractice.id] ? (
                      (() => {
                        const sf = safetyMap[drawerPractice.id]!
                        return (
                          <div className="space-y-2.5">
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                              <span className="text-[10px] uppercase font-semibold text-primary block">
                                Política de Consentimento
                              </span>
                              <Badge variant="outline" className="text-xs uppercase font-mono">
                                {sf.consent_required}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {sf.consent_required === 'required'
                                  ? 'Exige etapa formal de esclarecimento e aceite antes de qualquer atividade.'
                                  : sf.consent_required === 'conditional'
                                    ? 'Assentimento condicional no fluxo de início.'
                                    : 'Adesão tácita combinada em sessão.'}
                              </p>
                            </div>

                            {sf.required_dynamic_inputs &&
                              sf.required_dynamic_inputs.length > 0 && (
                                <div className="p-3 rounded-lg border border-amber-300 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-1">
                                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                                    <Info className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Inputs de Checagem Obrigatórios:</span>
                                  </div>
                                  <p className="text-xs">{sf.required_dynamic_inputs.join(', ')}</p>
                                </div>
                              )}

                            {sf.regulatory_profile && (
                              <div className="p-2.5 rounded bg-muted/30 border border-border/40 text-xs">
                                <span className="font-medium text-foreground">
                                  Perfil Regulatório:{' '}
                                </span>
                                <span className="text-muted-foreground">
                                  {sf.regulatory_profile}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })()
                    ) : (
                      <p className="text-muted-foreground text-center py-6">
                        Sem perfil estático específico. Segue precauções clínicas universais.
                      </p>
                    )}
                  </div>
                )}
                {drawerTab === 'VARIANTS' && (
                  <div className="space-y-2">
                    {!variantsMap[drawerPractice.id] ||
                    variantsMap[drawerPractice.id].length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        Nenhuma variante modular cadastrada para esta versão.
                      </p>
                    ) : (
                      variantsMap[drawerPractice.id].map((vr) => (
                        <div
                          key={vr.id}
                          className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-xs">
                              {vr.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {vr.variant_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {vr.description || vr.notes || 'Sem descrição específica.'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
