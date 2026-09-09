import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService, productService } from '@/services/cer'
import type { EnrollmentRecord, CerProductRecord } from '@/types/cer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  LogOut,
  UserPlus,
  Users,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Pause,
  Play,
  Check,
} from 'lucide-react'
import { AuditSecurityPanel } from '@/components/AuditSecurityPanel'
import { ProfessionalKnowledgeBuilding } from '@/components/ProfessionalKnowledgeBuilding'
import { ProfessionalExperienceManager } from '@/components/experience'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const ProfissionalHome: React.FC = () => {
  const { user, person, logout } = useAuth()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [products, setProducts] = useState<CerProductRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Estado do Modal de Criação / Vinculação
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Provisório */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight">CER</span>
            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
              Profissional
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
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
              Painel de Acompanhamento
            </h1>
            <p className="text-xs text-muted-foreground">
              Acompanhamento Individual CER e gestão de vínculos de interagentes
            </p>
          </div>

          <Button onClick={handleOpenModal} size="sm" className="gap-1.5 text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Vincular Nova Interagente</span>
          </Button>
        </div>

        {/* Resumo Institucional e Separação Metodológica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Interagentes Acompanhadas</span>
              </div>
              <CardTitle className="text-2xl font-semibold">{enrollments.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Acessos concedidos via{' '}
              <code className="text-[10px]">PROFESSIONAL_ENROLLMENT_ACCESS</code>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Produto Metodológico</span>
              </div>
              <CardTitle className="text-base font-medium">Acompanhamento Individual CER</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Relação genérica de desenvolvimento humano (não clínica).
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Isolamento e Privacidade</span>
              </div>
              <CardTitle className="text-base font-medium">Privacy by Design</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Regras no banco garantem que cada profissional só veja seus vínculos.
            </CardContent>
          </Card>
        </div>

        {/* Lista Real de Enrollments */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">
                  Interagentes em Acompanhamento (ENROLLMENT)
                </CardTitle>
                <CardDescription className="text-xs">
                  Entidades reais vinculadas à sua credencial profissional
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {enrollments.length} {enrollments.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Carregando acompanhamentos...
              </p>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Nenhum acompanhamento vinculado até o momento.
                </p>
                <Button onClick={handleOpenModal} variant="outline" size="sm" className="text-xs">
                  Criar primeiro acompanhamento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {enrollments.map((enr) => {
                  const personData = enr.expand?.person_id
                  const productData = enr.expand?.product_id
                  const journeyData = enr.expand?.journey_states_via_enrollment_id?.[0]

                  return (
                    <div
                      key={enr.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {personData?.full_name || 'Interagente'}
                          </span>
                          {personData?.preferred_name && (
                            <span className="text-xs text-muted-foreground">
                              ({personData.preferred_name})
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[10px] capitalize font-normal">
                            {enr.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{personData?.email || 'Sem e-mail'}</span>
                          <span>•</span>
                          <span>{productData?.name || 'Acompanhamento Individual CER'}</span>
                          <span>•</span>
                          <span className="capitalize">
                            Jornada: {journeyData?.current_stage || 'onboarding'} (
                            {journeyData?.stage_status || 'em andamento'})
                          </span>
                        </div>
                        {enr.notes && (
                          <p className="text-[11px] text-muted-foreground/80 italic pt-0.5">
                            Nota: {enr.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="text-right text-[10px] text-muted-foreground font-mono">
                          ID: {enr.id.slice(0, 7)}
                        </div>
                        {enr.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={async () => {
                              await enrollmentService.updateStatus(enr.id, 'paused')
                              await loadData()
                            }}
                          >
                            <Pause className="w-3 h-3" />
                            <span>Pausar</span>
                          </Button>
                        ) : enr.status === 'paused' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={async () => {
                              await enrollmentService.updateStatus(enr.id, 'active')
                              await loadData()
                            }}
                          >
                            <Play className="w-3 h-3" />
                            <span>Reativar</span>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BUILD 02: Gestão de Experiências por Interagente Acompanhada */}
        {enrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              Acompanhamento de Experiências (Build 02)
            </h2>
            {enrollments.map((enr) => (
              <div key={`exp-mgr-${enr.id}`} className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground block">
                  Interagente: {enr.expand?.person_id?.full_name || 'Interagente'} (
                  {enr.expand?.person_id?.email || '—'})
                </span>
                <ProfessionalExperienceManager enrollment={enr} />
              </div>
            ))}
          </div>
        )}

        {/* BUILD 03B: Conhecimento em Construção (Visualização Profissional Longitudinal) */}
        {enrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              Conhecimento em Construção (Build 03B)
            </h2>
            {enrollments.map((enr) => (
              <ProfessionalKnowledgeBuilding
                key={`kb-${enr.id}`}
                enrollmentId={enr.id}
                participantName={enr.expand?.person_id?.full_name || 'Interagente'}
              />
            ))}
          </div>
        )}

        {/* Painel Integrado de Auditoria e Testes RLS (Build 01 + Build 02 + Build 03A + Build 03B) */}
        <AuditSecurityPanel />
      </main>

      {/* Dialog Modal: Vincular Nova Interagente (Entrada sob convite da profissional) */}
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
