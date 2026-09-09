import React, { useState, useEffect } from 'react'
import { runBuild01IsolationTests, type TestResult } from '@/services/tests'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Play, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export const AuditSecurityPanel: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const handleRunTests = async () => {
    setRunning(true)
    try {
      const res = await runBuild01IsolationTests()
      setResults(res)
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

  const passedCount = results.filter((r) => r.status === 'PASSOU').length
  const totalCount = results.length

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Auditoria de Segurança & Testes de Isolamento (Build 01)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Execução real contra o backend PocketBase validando RLS, privacidade e segregação
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {hasRun && (
              <Badge
                variant={passedCount === totalCount ? 'default' : 'destructive'}
                className="text-xs font-mono"
              >
                {passedCount}/{totalCount} PASSOU
              </Badge>
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
              <span>{running ? 'Testando...' : 'Reexecutar Testes'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {running && results.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>Executando testes reais contra o backend...</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {results.map((t) => (
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
                    variant={t.status === 'PASSOU' ? 'secondary' : 'destructive'}
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
        )}
      </CardContent>
    </Card>
  )
}
export default AuditSecurityPanel
