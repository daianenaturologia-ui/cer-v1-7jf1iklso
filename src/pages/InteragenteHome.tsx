import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { enrollmentService } from '@/services/cer'
import type { EnrollmentRecord } from '@/types/cer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogOut, User, Compass, Calendar, Layers, ShieldCheck, HeartHandshake } from 'lucide-react'

export const InteragenteHome: React.FC = () => {
  const { user, person, logout } = useAuth()
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEnrollment = async () => {
      if (person?.id) {
        const active = await enrollmentService.getByPersonId(person.id)
        setEnrollment(active)
      }
      setLoading(false)
    }
    loadEnrollment()
  }, [person])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Provisório */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg tracking-tight">CER</span>
            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
              Interagente
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {person?.preferred_name || person?.full_name || user?.name || user?.email}
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
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Identidade e Acolhimento */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-serif">
            Olá, {person?.preferred_name || person?.full_name || 'Interagente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Este é o seu espaço de acompanhamento contínuo no CER.
          </p>
        </div>

        {/* Informações da Identidade Humana (PERSON) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Identidade (PERSON)</span>
              </div>
              <CardTitle className="text-base font-medium">
                {person?.full_name || 'Registro em estruturação'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>E-mail: {person?.email || user?.email}</p>
              <p>
                ID Humano: <span className="font-mono text-[10px]">{person?.id || '—'}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Produto & Modalidade</span>
              </div>
              <CardTitle className="text-base font-medium">
                {enrollment?.expand?.product_id?.name || 'Acompanhamento Individual CER'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant="secondary" className="text-[10px] capitalize font-normal">
                  {enrollment?.status || 'invited'}
                </Badge>
              </div>
              <p>
                Início:{' '}
                {enrollment?.created
                  ? new Date(enrollment.created).toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Estado da Jornada</span>
              </div>
              <CardTitle className="text-base font-medium capitalize">
                {enrollment?.expand?.journey_states_via_enrollment_id?.[0]?.current_stage?.replace(
                  '_',
                  ' ',
                ) || 'onboarding'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>
                Etapa:{' '}
                <span className="capitalize">
                  {enrollment?.expand?.journey_states_via_enrollment_id?.[0]?.stage_status?.replace(
                    '_',
                    ' ',
                  ) || 'Em andamento'}
                </span>
              </p>
              <p className="text-[11px] italic">“O ser humano não funciona em partes.”</p>
            </CardContent>
          </Card>
        </div>

        {/* Estado Real do Vínculo e Acompanhamento */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span>Vínculo de Acompanhamento</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Dados reais sincronizados da sua matrícula (ENROLLMENT)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {enrollment?.id ? `ID: ${enrollment.id.slice(0, 8)}...` : 'Sem matrícula'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-xs text-muted-foreground">Carregando dados do vínculo...</p>
            ) : enrollment ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Produto CER</span>
                      <span className="font-medium text-foreground">
                        {enrollment.expand?.product_id?.name || 'Acompanhamento Individual CER'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Status do Acompanhamento
                      </span>
                      <span className="font-medium text-foreground capitalize">
                        {enrollment.status}
                      </span>
                    </div>
                  </div>

                  {enrollment.notes && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-muted-foreground block text-[11px]">
                        Anotação inicial
                      </span>
                      <p className="text-foreground text-xs">{enrollment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/15">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Privacy by Design: suas informações preservam autoria, contexto e visibilidade
                    estrita por perfil.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nenhum acompanhamento ativo encontrado para este perfil.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Entre em contato com sua profissional para receber o convite de vinculação.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
export default InteragenteHome
