import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService, productService } from '@/services/cer'
import { attentionService, AttentionItem } from '@/services/attentionService'
import type { EnrollmentRecord, CerProductRecord } from '@/types/cer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  Compass,
  ShieldCheck,
  UserPlus,
  LogOut,
  Copy,
  CheckCircle2,
  Calendar,
  BookOpen,
  Bot,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { AuditSecurityPanel } from '@/components/AuditSecurityPanel'
import { ParticipantList, ParticipantListItemData } from '@/components/ParticipantList'
import { AttentionPanel } from '@/components/AttentionPanel'
import { PracticeSelector } from '@/components/PracticeSelector'
import { ProfessionalSessionManager } from '@/components/ProfessionalSessionManager'
import { ProfessionalAiWorkspace } from '@/components/ProfessionalAiWorkspace'
import pb from '@/lib/pocketbase/client'

export const ProfissionalHome: React.FC = () => {
  const { user, person, logout } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [products, setProducts] = useState<CerProductRecord[]>([])
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Navegação Principal Profissional (Build 09C):
  // Participantes · Sessões · Biblioteca · IA · Auditoria
  const [activeMainTab, setActiveMainTab] = useState<
    'participantes' | 'sessoes' | 'biblioteca' | 'ai' | 'auditoria'
  >('participantes')

  // Modal de vincular nova interagente
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [createdResult, setCreatedResult] = useState<{
    email: string
    tempPasswordGenerated?: string
    enrollmentId: string
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [list, prods] = await Promise.all([
        enrollmentService.listAccessible(),
        productService.listActive(),
      ])
      setEnrollments(list)
      setProducts(prods)
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id)
      }

      // Carregar read-model de atenção
      const attn = await attentionService.computeAttentionItems()
      setAttentionItems(attn)
    } catch (err) {
      console.error('Erro ao carregar dados profissionais:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenModal = () => {
    setCreatedResult(null)
    setErrorMsg(null)
    setFullName('')
    setPreferredName('')
    setEmail('')
    setNotes('')
    if (products.length > 0) {
      setSelectedProductId(products[0].id)
    }
    setIsDialogOpen(true)
  }

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !selectedProductId) return

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await enrollmentService.createEnrollmentWithInteragente({
        fullName: fullName.trim(),
        preferredName: preferredName.trim() || undefined,
        email: email.trim().toLowerCase(),
        productId: selectedProductId,
        professionalUserId: user.id,
        notes: notes.trim() || undefined,
      })

      setCreatedResult({
        email: email.trim().toLowerCase(),
        tempPasswordGenerated: res.tempPasswordGenerated,
        enrollmentId: res.enrollment.id,
      })
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao vincular interagente.'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const copyCreds = () => {
    if (!createdResult?.tempPasswordGenerated) return
    const text = `Acesso CER V1\nE-mail: ${createdResult.email}\nSenha Provisória: ${createdResult.tempPasswordGenerated}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Montagem dos dados de ParticipantList com atenção acoplada
  const participantListItems: ParticipantListItemData[] = enrollments.map((enr) => {
    const personData = enr.expand?.person_id
    const journeyData = enr.expand?.journey_states_via_enrollment_id?.[0]
    const pAttn = attentionItems.filter((i) => i.enrollmentId === enr.id)

    const secCount = pAttn.filter((i) => i.category === 'SEGURANÇA').length
    const revCount = pAttn.filter((i) => i.category === 'REVISAR').length

    let nextStep = 'Aguardando início de acolhimento'
    if (journeyData?.current_stage === 'consciousness') {
      nextStep =
        journeyData.stage_status === 'integrado'
          ? 'Consciência concluída — formular Plano de Cuidado'
          : 'Acompanhar respostas das experiências e Mandala'
    } else if (journeyData?.current_stage === 'equilibrium_realization') {
      nextStep = 'Acompanhar experimentos ativos e Cycle Review'
    }

    return {
      enrollment: enr,
      fullName: personData?.full_name || 'Participante',
      preferredName: personData?.preferred_name,
      email: personData?.email || '—',
      status: enr.status,
      currentStage: journeyData?.current_stage || 'onboarding',
      stageStatus: journeyData?.stage_status || 'nao_iniciado',
      nextStep,
      attentionCount: {
        security: secCount,
        review: revCount,
      },
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Limpo */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight text-foreground">CER</span>
            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
              Profissional de Cuidado
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {person?.full_name || user?.name || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Navegação Principal Profissional (Build 09C): Participantes · Sessões · Biblioteca · Auditoria */}
        <div className="flex border-b border-border/60 pb-2 space-x-2 overflow-x-auto">
          <Button
            variant={activeMainTab === 'participantes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('participantes')}
            className="text-xs gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participantes</span>
          </Button>

          <Button
            variant={activeMainTab === 'sessoes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('sessoes')}
            className="text-xs gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Sessões</span>
          </Button>

          <Button
            variant={activeMainTab === 'biblioteca' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('biblioteca')}
            className="text-xs gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Biblioteca de Práticas</span>
          </Button>

          <Button
            variant={activeMainTab === 'ai' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('ai')}
            className="text-xs gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Assistência IA</span>
          </Button>

          <Button
            variant={activeMainTab === 'auditoria' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveMainTab('auditoria')}
            className="text-xs gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria & Segurança</span>
          </Button>
        </div>

        {/* ABA 1: PARTICIPANTES & HOME COTIDIANA */}
        {activeMainTab === 'participantes' && (
          <div className="space-y-6">
            {/* Bloco B: Hoje / Painel de Atenção e Cuidado */}
            <AttentionPanel items={attentionItems} loading={loading} />

            {/* Bloco A: Participantes Centrados na Pessoa */}
            <ParticipantList
              participants={participantListItems}
              loading={loading}
              onNewParticipantClick={handleOpenModal}
            />
          </div>
        )}

        {/* ABA 2: SESSÕES */}
        {activeMainTab === 'sessoes' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Espaço de Presença & Preparação de Sessões
              </h2>
              <p className="text-xs text-muted-foreground">
                Acompanhe o que mudou, notas privadas, o Mapa atual e os temas trazidos pelos
                participantes
              </p>
            </div>

            {enrollments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Nenhum participante vinculado para preparar sessão.
              </p>
            ) : (
              enrollments.map((enr) => (
                <ProfessionalSessionManager
                  key={`sess-page-${enr.id}`}
                  enrollmentId={enr.id}
                  participantName={
                    enr.expand?.person_id?.preferred_name ||
                    enr.expand?.person_id?.full_name ||
                    'Participante'
                  }
                />
              ))
            )}
          </div>
        )}

        {/* ABA 3: BIBLIOTECA */}
        {activeMainTab === 'biblioteca' && (
          <div className="space-y-4">
            <PracticeSelector />
          </div>
        )}

        {/* ABA 4: ASSISTÊNCIA IA */}
        {activeMainTab === 'ai' && (
          <div className="space-y-4">
            {enrollments.length === 0 || !user ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Nenhum participante vinculado para briefing assistido.
              </p>
            ) : (
              enrollments.map((enr) => (
                <div key={`ai-ws-page-${enr.id}`} className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">
                    Participante:{' '}
                    {enr.expand?.person_id?.preferred_name ||
                      enr.expand?.person_id?.full_name ||
                      'Participante'}
                  </span>
                  <ProfessionalAiWorkspace humanUserId={user.id} enrollmentId={enr.id} />
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA 5: AUDITORIA & ADMIN (Fora da Superfície Clínica Cotidiana) */}
        {activeMainTab === 'auditoria' && (
          <div className="space-y-4">
            <AuditSecurityPanel />
          </div>
        )}
      </main>

      {/* Dialog Modal: Vincular Nova Interagente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Vincular Nova Interagente</DialogTitle>
            <DialogDescription className="text-xs">
              Conforme a Constituição do CER, a entrada da interagente ocorre sob convite/vinculação
              pela profissional.
            </DialogDescription>
          </DialogHeader>

          {createdResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Interagente vinculada com sucesso!</span>
              </div>

              <div className="p-3.5 bg-muted/40 rounded-lg border border-border/60 text-xs space-y-2">
                <p className="font-medium text-foreground">Credenciais Geradas de Acesso:</p>
                <div className="space-y-1 font-mono text-[11px]">
                  <p>
                    E-mail: <span className="text-foreground">{createdResult.email}</span>
                  </p>
                  <p>
                    Senha Provisória:{' '}
                    <span className="text-primary font-bold">
                      {createdResult.tempPasswordGenerated}
                    </span>
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
                  Compartilhe estas credenciais temporárias com a pessoa para seu primeiro acesso.
                </p>
              </div>

              <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyCreds}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiado!' : 'Copiar Credenciais'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-xs"
                >
                  Concluir
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateEnrollment} className="space-y-4 py-2">
              {errorMsg && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  Nome Completo (Identidade Humana - PERSON) *
                </Label>
                <Input
                  id="fullName"
                  placeholder="Ex: Mariana Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferredName" className="text-xs font-medium">
                  Como prefere ser chamada (Opcional)
                </Label>
                <Input
                  id="preferredName"
                  placeholder="Ex: Mari"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-mail da Interagente (USER_ACCOUNT) *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mariana@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product" className="text-xs font-medium">
                  Produto CER (CER_PRODUCT) *
                </Label>
                <select
                  id="product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">
                  Anotações Iniciais do Vínculo (Opcional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Ex: Acolhimento inicial focado em rotina e vitalidade."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="text-xs">
                  {submitting ? 'Vinculando...' : 'Criar Vínculo & Gerar Acesso'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ProfissionalHome
