import React, { useState, useEffect } from 'react'
import { runBuild01IsolationTests, runBuild02EngineTests, type TestResult } from '@/services/tests'
import { runBuild03AKnowledgeTests, runBuild03BLongitudinalTests } from '@/services/testsKnowledge'
import { runBuild03CPostAuditTests } from '@/services/testsKnowledge03c'
import { runBuild04ASessionTests } from '@/services/testsSession'
import { runBuild04BSessionKnowledgeTests } from '@/services/testsSession04b'
import { runBuild04CPresentationTests } from '@/services/testsPresentation04c'
import { runBuild05AiCoreTests } from '@/services/testsAi05'
import { runBuild06MapTests } from '@/services/testsMap06'
import { runBuild07AOrchestrationTests } from '@/services/testsOrchestration07a'
import { runBuild07BOrchestrationTests } from '@/services/testsBuild07b'
import { runBuild07COrchestrationTests } from '@/services/testsBuild07c'
import { runBuild07DOrchestrationTests } from '@/services/testsBuild07d'
import { runBuild07EOrchestrationTests } from '@/services/testsBuild07e'
import { runBuild07FOrchestrationTests } from '@/services/testsBuild07f'
import { runBuild07GOrchestrationTests } from '@/services/testsBuild07g'
import { runBuild08BCarePlanTests } from '@/services/testsCarePlan08b'
import { runBuild08CPracticeTests } from '@/services/testsPractice08c'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Database,
} from 'lucide-react'

export const AuditSecurityPanel: React.FC = () => {
  const [b01Results, setB01Results] = useState<TestResult[]>([])
  const [b02Results, setB02Results] = useState<TestResult[]>([])
  const [b03aResults, setB03aResults] = useState<TestResult[]>([])
  const [b03bResults, setB03bResults] = useState<TestResult[]>([])
  const [b03cResults, setB03cResults] = useState<TestResult[]>([])
  const [b04aResults, setB04aResults] = useState<TestResult[]>([])
  const [b04bResults, setB04bResults] = useState<TestResult[]>([])
  const [b04cResults, setB04cResults] = useState<TestResult[]>([])
  const [b05Results, setB05Results] = useState<TestResult[]>([])
  const [b06Results, setB06Results] = useState<TestResult[]>([])
  const [b07aResults, setB07aResults] = useState<TestResult[]>([])
  const [b07bResults, setB07bResults] = useState<TestResult[]>([])
  const [b07cResults, setB07cResults] = useState<TestResult[]>([])
  const [b07dResults, setB07dResults] = useState<TestResult[]>([])
  const [b07eResults, setB07eResults] = useState<TestResult[]>([])
  const [b07fResults, setB07fResults] = useState<TestResult[]>([])
  const [b07gResults, setB07gResults] = useState<TestResult[]>([])
  const [b08bResults, setB08bResults] = useState<TestResult[]>([])
  const [b08cResults, setB08cResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const handleRunTests = async () => {
    setRunning(true)
    try {
      const [
        res01,
        res02,
        res03a,
        res03b,
        res03c,
        res04a,
        res04b,
        res04c,
        res05,
        res06,
        res07a,
        res07b,
        res07c,
        res07d,
        res07e,
        res07f,
        res07g,
        res08b,
        res08c,
      ] = await Promise.all([
        runBuild01IsolationTests(),
        runBuild02EngineTests(),
        runBuild03AKnowledgeTests(),
        runBuild03BLongitudinalTests(),
        runBuild03CPostAuditTests(),
        runBuild04ASessionTests(),
        runBuild04BSessionKnowledgeTests(),
        runBuild04CPresentationTests(),
        runBuild05AiCoreTests(),
        runBuild06MapTests(),
        runBuild07AOrchestrationTests(),
        runBuild07BOrchestrationTests(),
        runBuild07COrchestrationTests(),
        runBuild07DOrchestrationTests(),
        runBuild07EOrchestrationTests(),
        runBuild07FOrchestrationTests(),
        runBuild07GOrchestrationTests(),
        runBuild08BCarePlanTests(),
        runBuild08CPracticeTests(),
      ])
      setB01Results(res01)
      setB02Results(res02)
      setB03aResults(res03a)
      setB03bResults(res03b)
      setB03cResults(res03c)
      setB04aResults(res04a)
      setB04bResults(res04b)
      setB04cResults(res04c)
      setB05Results(res05)
      setB06Results(res06)
      setB07aResults(res07a)
      setB07bResults(res07b)
      setB07cResults(res07c)
      setB07dResults(res07d)
      setB07eResults(res07e)
      setB07fResults(res07f)
      setB07gResults(res07g)
      setB08bResults(res08b)
      setB08cResults(res08c)
      setHasRun(true)
    } catch (err) {
      console.error('Falha ao executar suíte de testes:', err)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    // Executa uma vez no carregamento para auditar status real
    handleRunTests()
  }, [])

  const allResults = [
    ...b01Results,
    ...b02Results,
    ...b03aResults,
    ...b03bResults,
    ...b03cResults,
    ...b04aResults,
    ...b04bResults,
    ...b04cResults,
    ...b05Results,
    ...b06Results,
    ...b07aResults,
    ...b07bResults,
    ...b07cResults,
    ...b07dResults,
    ...b07eResults,
    ...b07fResults,
    ...b07gResults,
    ...b08bResults,
    ...b08cResults,
  ]
  const passedCount = allResults.filter((r) => r.status === 'PASSOU').length

  return (
    <Card className="border-border/80 shadow-none space-y-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Auditoria de Segurança, Engine, Conhecimento, Sessões, Presentation, AI Core & Mapa
                CER (Builds 01–06)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Testes reais obrigatórios executados diretamente contra as regras de API/RLS, hooks e
              integridade do backend Skip Cloud
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {hasRun && (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={
                    allResults.some((r) => r.status === 'NÃO PASSOU') ? 'destructive' : 'default'
                  }
                  className="text-xs font-mono"
                >
                  {passedCount} PASSOU{' '}
                  {allResults.some((r) => r.status === 'NÃO IMPLEMENTADO') &&
                    '• MFA NÃO IMPLEMENTADO'}
                </Badge>
              </div>
            )}
            <Button
              onClick={handleRunTests}
              disabled={running}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8"
            >
              {running ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{running ? 'Testando...' : 'Reexecutar Todos'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {running && allResults.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>Executando testes reais contra o backend Skip Cloud...</span>
          </div>
        ) : (
          <>
            {/* Bloco de Testes do Build 08C — PRACTICE LIBRARY & SAFETY GATES */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 08C — Practice Library & Safety Gates (PRACT, VER,
                  EVD, SAFE, CONS, VAR, AI-C, PR-C, RU-C, REG-C, UX-C, AUD-C, DEL, E2E-08C-1–10,
                  Personas A–H) ({b08cResults.length} testes)
                </span>
              </div>
              {b08cResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 08B — CARE PLANNING & OPERATIONAL CYCLES */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 08B — Care Planning & Priority Management (Provas
                  P0-1–P0-8, PLAN, PRI, CAP, ACCPT, CYCLE, RU-B, PR-B, AI-B, MAP-B, UX-B, AUD-B,
                  E2E-08B) ({b08bResults.length} testes)
                </span>
              </div>
              {b08bResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07G — INTEGRAÇÃO DA CONSCIÊNCIA */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07G — Integração Final da Consciência (INT1–INT20,
                  REC1–REC15, RES1–RES12, CHA1–CHA12, PRO1–PRO17, DIR1–DIR12, AI-G1–AI-G18,
                  PR-G1–PR-G15, RU-G1–RU-G17, EC-G1–EC-G12, MAP-G1–MAP-G12, UX-G1–UX-G12,
                  ACC-G1–ACC-G10, E2E-07G-1–11, Personas A–G) ({b07gResults.length} testes)
                </span>
              </div>
              {b07gResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07F — SENTIDO & CONEXÃO */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07F — Sentido & Conexão (SEN1–SEN15, SPI1–SPI20,
                  EXP1–EXP20, IND1–IND12, RU-F1–RU-F15, PR-F1–PR-F15, EPI1–EPI15, EC-F1–EC-F10,
                  UX-F1–UX-F10, ACC-F1–ACC-F10, SC5-P0, E2E-07F-1–11, Personas A–G) (
                  {b07fResults.length} testes)
                </span>
              </div>
              {b07fResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07E — SEXUALIDADE & INTIMIDADE */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07E — Sexualidade & Intimidade (SEX1–SEX20,
                  DRD1–DRD15, CON1–CON15, RU-E1–RU-E15, PR-E1–PR-E15, HEA1–HEA10, EC-E1–EC-E10,
                  UX-E1–UX-E10, ACC-E1–ACC-E10, E2E-07E-1–8, Personas A–F) ({b07eResults.length}{' '}
                  testes)
                </span>
              </div>
              {b07eResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07D — RELAÇÕES & VÍNCULOS */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07D — Relações & Vínculos (REL1–REL20, APE1–APE15,
                  RU-D1–RU-D15, PR-D1–PR-D15, REP1–REP12, EC-D1–EC-D10, UX-D1–UX-D10,
                  ACC-D1–ACC-D10, E2E-07D-1–8, Personas A–E) ({b07dResults.length} testes)
                </span>
              </div>
              {b07dResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07C — MENTE & EMOÇÕES + REGULAÇÃO & PADRÕES DE RESPOSTA */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07C — Mente & Emoções + Regulação & Respostas
                  (ME1–ME15, RG1–RG18, RU1–RU15, PT1–PT10, RC1–RC10, PR1–PR12, T1–T10, EC1–EC10,
                  E2E-07C-1–6) ({b07cResults.length} testes)
                </span>
              </div>
              {b07cResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07B — CORPO & FISIOLOGIA / AYURVEDA */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07B — Corpo & Fisiologia / Ayurveda (PV1–PV12,
                  AG1–AG12, AM1–AM10, BM1–BM10, RU1–RU10, PR1–PR10, BR1–BR12, EC1–EC8, E2E-07B-1–5)
                  ({b07bResults.length} testes)
                </span>
              </div>
              {b07bResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 07A — EXPERIENCE ORCHESTRATION */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 07A — Experience Orchestration (B1–B12, P1–P10,
                  R1–R16, O1–O10, V1–V16, T1–T8, A1–A10, E2E) ({b07aResults.length} testes)
                </span>
              </div>
              {b07aResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 06 — MAPA CER V1 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 06 — Mapa CER V1 (F1–F20, E1–E20, V1–V10) (
                  {b06Results.length} testes)
                </span>
              </div>
              {b06Results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 05 — AI Core V1 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 05 — AI Core V1 (T1–T20, R1–R15, A1–A14, H1–H7) (
                  {b05Results.length} testes)
                </span>
              </div>
              {b05Results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 04C — Presentation & Continuity */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 04C — Presentation & Continuity (F1–F20, P1–P10,
                  M1–M7) ({b04cResults.length} testes)
                </span>
              </div>
              {b04cResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 04B */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Testes Obrigatórios do Build 04B — Knowledge from Session & Correção CER-03C-10 (
                  {b04bResults.length} testes)
                </span>
              </div>
              {b04bResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 04A */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Testes Obrigatórios do Build 04A — Session Core & Nota Canônica Privada (
                  {b04aResults.length} testes)
                </span>
              </div>
              {b04aResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 03C */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Testes Obrigatórios do Checkpoint 03C — Pós-Auditoria Adversarial (
                  {b03cResults.length} testes)
                </span>
              </div>
              {b03cResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 03B */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Testes Obrigatórios do Build 03B — Conhecimento Longitudinal (S1–S12, F1–F18,
                  P1–P18, E2E) ({b03bResults.length} testes)
                </span>
              </div>
              {b03bResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 03A */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 03A — Knowledge & Provenance Layer (
                  {b03aResults.length} testes)
                </span>
              </div>
              {b03aResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 02 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes Obrigatórios do Build 02 — Experience Engine ({b02Results.length} testes)
                </span>
              </div>
              {b02Results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Bloco de Testes do Build 01 */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground pb-1 border-b border-border/40">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  Testes de Concessão, Isolamento e Governança do Build 01 ({b01Results.length}{' '}
                  testes)
                </span>
              </div>
              {b01Results.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {t.status === 'PASSOU' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'PASSOU'
                          ? 'secondary'
                          : t.status === 'NÃO IMPLEMENTADO'
                            ? 'outline'
                            : 'destructive'
                      }
                      className="text-[10px] uppercase font-mono tracking-wider shrink-0"
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-6 leading-relaxed">
                    {t.details}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
export default AuditSecurityPanel
