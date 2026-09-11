import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Compass,
  FileText,
  Sparkles,
  RotateCcw,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import type {
  EnrollmentRecord,
  PersonRecord,
  JourneyStateRecord,
  CerPracticeRecord,
  CerPracticeVersionRecord,
} from '@/types/cer'
import { attentionService, AttentionItem } from '@/services/attentionService'
import { AttentionPanel } from '@/components/AttentionPanel'
import { CarePlanEditor } from '@/components/CarePlanEditor'
import { PracticeSelector } from '@/components/PracticeSelector'
import { AssignmentEditor } from '@/components/AssignmentEditor'
import { ResponseDigest } from '@/components/ResponseDigest'
import { ProfessionalMapEditor } from '@/components/ProfessionalMapEditor'
import { ProfessionalExperienceManager } from '@/components/experience/ProfessionalExperienceManager'
import { ProfessionalKnowledgeBuilding } from '@/components/ProfessionalKnowledgeBuilding'
import { ProfessionalSessionManager } from '@/components/ProfessionalSessionManager'

export type WorkspaceTab = 'resumo' | 'consciencia' | 'plano' | 'experimentos' | 'revisao'

export const ParticipantWorkspace: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const currentTab = (searchParams.get('tab') as WorkspaceTab) || 'resumo'

  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [person, setPerson] = useState<PersonRecord | null>(null)
  const [journeyState, setJourneyState] = useState<JourneyStateRecord | null>(null)
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estado compartilhado entre Library e Assignment
  const [selectedPractice, setSelectedPractice] = useState<CerPracticeRecord | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<CerPracticeVersionRecord | null>(null)

  const loadWorkspaceData = async () => {
    if (!enrollmentId) return
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Validar e carregar enrollment com RLS
      const enr = await pb.collection('enrollments').getOne<EnrollmentRecord>(enrollmentId, {
        expand: 'person_id,product_id',
      })
      setEnrollment(enr)

      const p = (enr.expand as any)?.person_id as PersonRecord
      setPerson(p || null)

      // 2. Journey State
      try {
        const jsList = await pb.collection('journey_states').getFullList<JourneyStateRecord>({
          filter: `enrollment_id = "${enrollmentId}"`,
        })
        setJourneyState(jsList[0] || null)
      } catch {
        setJourneyState(null)
      }

      // 3. Atenção específica da participante
      const attn = await attentionService.computeAttentionItems(enrollmentId)
      setAttentionItems(attn)
    } catch (err: any) {
      console.error('Erro ao carregar Workspace:', err)
      setErrorMsg(
        'Participante não encontrada ou acesso profissional não autorizado para este prontuário.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaceData()
  }, [enrollmentId])

  const setTab = (tab: WorkspaceTab) => {
    setSearchParams({ tab })
  }

  const participantName =
    person?.preferred_name || person?.full_name || 'Participante em Acompanhamento'

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 text-center">
        <p className="text-sm text-muted-foreground">Carregando prontuário e dados de cuidado...</p>
      </div>
    )
  }

  if (errorMsg || !enrollment) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 space-y-4">
        <div className="p-4 rounded-xl border border-red-300 bg-red-500/10 text-red-900 dark:text-red-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg || 'Não foi possível acessar o prontuário.'}</span>
        </div>
        <Link to="/profissional">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Lista de Participantes</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-5">
      {/* Barra de Cabeçalho Superior com Navegação Humanizada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/profissional">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Participantes</span>
              </Button>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Workspace Clínico</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold font-serif text-foreground">{participantName}</h1>
            <Badge
              variant={enrollment.status === 'active' ? 'default' : 'outline'}
              className="text-[10px] capitalize font-normal"
            >
              {enrollment.status === 'active' ? 'Ativo' : enrollment.status}
            </Badge>

            {journeyState && (
              <Badge variant="secondary" className="text-[10px] capitalize">
                Etapa: {journeyState.current_stage} ({journeyState.stage_status})
              </Badge>
            )}
          </div>
        </div>

        {/* Alertas Rápidos no Topo */}
        <div className="flex items-center gap-2">
          {attentionItems.some((i) => i.category === 'SEGURANÇA') && (
            <Badge variant="destructive" className="text-xs gap-1 py-1 px-2.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Segurança Ativa</span>
            </Badge>
          )}

          {attentionItems.some((i) => i.category === 'REVISAR') && (
            <Badge
              variant="secondary"
              className="text-xs gap-1 py-1 px-2.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Devolutiva / Revisão Aberta</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Navegação por 5 Áreas Clínicas — UMA por vez (carregamento progressivo e modular) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40">
        <Button
          size="sm"
          variant={currentTab === 'resumo' ? 'default' : 'ghost'}
          onClick={() => setTab('resumo')}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Resumo & Atenção</span>
        </Button>

        <Button
          size="sm"
          variant={currentTab === 'consciencia' ? 'default' : 'ghost'}
          onClick={() => setTab('consciencia')}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>2. Consciência & Mapa</span>
        </Button>

        <Button
          size="sm"
          variant={currentTab === 'plano' ? 'default' : 'ghost'}
          onClick={() => setTab('plano')}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Plano de Cuidado</span>
        </Button>

        <Button
          size="sm"
          variant={currentTab === 'experimentos' ? 'default' : 'ghost'}
          onClick={() => setTab('experimentos')}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>4. Experimentos & Práticas</span>
        </Button>

        <Button
          size="sm"
          variant={currentTab === 'revisao' ? 'default' : 'ghost'}
          onClick={() => setTab('revisao')}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>5. Revisão & Ciclo</span>
        </Button>
      </div>

      {/* ÁREA 1: RESUMO & ATENÇÃO */}
      {currentTab === 'resumo' && (
        <div className="space-y-5">
          <AttentionPanel items={attentionItems} showParticipantName={false} />

          {/* Preparação de Sessão (Reutilizando cerSession) */}
          <ProfessionalSessionManager
            enrollmentId={enrollment.id}
            participantName={participantName}
          />
        </div>
      )}

      {/* ÁREA 2: CONSCIÊNCIA & MAPA */}
      {currentTab === 'consciencia' && (
        <div className="space-y-5">
          {/* Fim da Consciência: aviso consolidado se integrado */}
          {journeyState?.current_stage === 'consciousness' &&
            journeyState?.stage_status === 'integrado' && (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-semibold block text-sm">
                    Consciência concluída — revisar integração
                  </span>
                  <p className="text-xs">
                    As experiências canônicas da participante foram concluídas. A síntese
                    integrativa, o Mapa e os desafios identificados estão prontos para fundamentar o
                    Plano de Cuidado.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setTab('plano')}
                  className="h-8 text-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Ir para Plano de Cuidado
                </Button>
              </div>
            )}

          {/* Gestão das Experiências da Consciência */}
          <ProfessionalExperienceManager enrollment={enrollment} />

          {/* Mapa Estruturado / Mandala */}
          <ProfessionalMapEditor enrollmentId={enrollment.id} participantName={participantName} />

          {/* Conhecimento em Construção */}
          <ProfessionalKnowledgeBuilding
            enrollmentId={enrollment.id}
            participantName={participantName}
          />
        </div>
      )}

      {/* ÁREA 3: PLANO DE CUIDADO */}
      {currentTab === 'plano' && (
        <div className="space-y-5">
          <CarePlanEditor enrollmentId={enrollment.id} participantName={participantName} />
        </div>
      )}

      {/* ÁREA 4: EXPERIMENTOS & PRÁTICAS */}
      {currentTab === 'experimentos' && (
        <div className="space-y-5">
          {/* Atribuidor de Práticas */}
          <AssignmentEditor
            enrollmentId={enrollment.id}
            participantName={participantName}
            selectedPractice={selectedPractice}
            selectedVersion={selectedVersion}
            onAssignmentCreated={() => {
              setSelectedPractice(null)
              setSelectedVersion(null)
            }}
          />

          {/* Seletor da Biblioteca (reutilizado progressivamente) */}
          <PracticeSelector
            selectedPracticeId={selectedPractice?.id}
            onSelectPractice={(pr, ver) => {
              setSelectedPractice(pr)
              setSelectedVersion(ver)
            }}
          />
        </div>
      )}

      {/* ÁREA 5: REVISÃO & CICLO */}
      {currentTab === 'revisao' && (
        <div className="space-y-5">
          <ResponseDigest enrollmentId={enrollment.id} participantName={participantName} />
        </div>
      )}
    </div>
  )
}
