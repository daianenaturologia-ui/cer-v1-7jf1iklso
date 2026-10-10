import { useQuestionnaireSaving } from '@/hooks/useQuestionnaireSaving'
import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MessageCircleQuestion } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { experienceResponseService } from '@/services/experienceEngine'
import type { ExperienceResponseRecord } from '@/types/cer'
import {
  AYV_C4_COMPLETION,
  AYURVEDA_CHAPTER_4_ID,
  AYURVEDA_CHAPTER_4_VERSION,
  buildChapter4Synthesis,
  isChapter4Completed,
} from '@/services/ayurvedaChapter4'

interface Props {
  enrollmentId: string
  experienceId: string
  respondentUserId: string
  onBackToHub: () => void
  onCompleted?: () => void
}

export const AyurvedaChapter4Flow: React.FC<Props> = ({
  enrollmentId,
  experienceId,
  respondentUserId,
  onBackToHub,
  onCompleted,
}) => {
  const [responses, setResponses] = useState<ExperienceResponseRecord[]>([])
  const saver = useQuestionnaireSaving()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setLoadError(false)
    setLoading(true)
    experienceResponseService
      .listResponsesByExperience(enrollmentId, experienceId)
      .then(setResponses).catch(() => setLoadError(true)).finally(() => setLoading(false))
  }, [enrollmentId, experienceId, loadAttempt])
  const synthesis = useMemo(() => buildChapter4Synthesis(responses), [responses])
  const completed = isChapter4Completed(responses)

  const complete = async () => {
    setSaving(true)
    try {
      await saver.flush()
      saver.enqueue('completion', async () => {
      const now = new Date().toISOString()
      const saved = await experienceResponseService.saveResponse({
        enrollmentId,
        experienceId,
        promptId: AYV_C4_COMPLETION.id,
        respondentUserId,
        responseType: 'ChapterCompletion' as any,
        promptVersion: 1,
        promptKey: AYV_C4_COMPLETION.key,
        canonicalPromptId: AYV_C4_COMPLETION.id,
        stepOrder: 1,
        accessClass: 'shared_care',
        changeReason: 'Leitura e conclusão explícita do Capítulo 4 de Corpo & Fisiologia',
        structuredValue: {
          completed: true,
          completed_at: now,
          chapter_id: AYURVEDA_CHAPTER_4_ID,
          experience_version: AYURVEDA_CHAPTER_4_VERSION,
          metadata: { prompt_key: AYV_C4_COMPLETION.key, answered_at: now },
        },
      })
      ;(saved as any).prompt_key = AYV_C4_COMPLETION.key
      setResponses((current) => [...current, saved])
      onCompleted?.()
      })
      await saver.flush()
    } catch {
      saver.reportError()
    } finally {
      setSaving(false)
    }
  }

  const section = (title: string, items: { title: string; value: string }[]) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-lg border border-border/60 p-3 text-xs"
            >
              <span className="block font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-xs italic text-muted-foreground">
            Nenhuma informação registrada nesta parte.
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (loading) return <p role="status" className="p-4 text-sm text-muted-foreground">Carregando suas respostas…</p>

  if (loadError) return <div role="alert" className="p-4 space-y-3">
    <p>Não foi possível recuperar suas respostas. Vamos carregá-las novamente antes de continuar.</p>
    <Button onClick={() => setLoadAttempt(value => value + 1)}>Tentar carregar novamente</Button>
  </div>

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-4">
      {saver.status}
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="outline">Capítulo 4 • Síntese</Badge>
        <h2 className="font-serif text-2xl">Meu corpo em síntese</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Este é um espelho descritivo do que você registrou. Ele não é diagnóstico, resultado
          automático nem prescrição.
        </p>
      </div>
      {section('Características que você reconhece há mais tempo', synthesis.historical)}
      {section('Seus ritmos habituais', synthesis.habitual)}
      {section('O que está diferente agora', synthesis.current)}

      {/* Bloco separado factual: Como meu corpo está agora (últimos 14 dias) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="space-y-0.5">
            <CardTitle className="font-serif text-base text-foreground">
              {synthesis.currentBody?.title || 'Como meu corpo está agora'}
            </CardTitle>
            <span className="block text-[11px] text-muted-foreground">
              Referência temporal: {synthesis.currentBody?.referenceText || 'últimos 14 dias'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {synthesis.currentBody && synthesis.currentBody.hasAnyData ? (
            synthesis.currentBody.items.map((item) => (
              <div
                key={item.areaId}
                className="space-y-1 rounded-lg border border-border/60 bg-background/80 p-3 text-xs"
              >
                <span className="block font-semibold text-foreground">{item.title}</span>
                {item.summaryLines.map((line, lIdx) => (
                  <p key={lIdx} className="text-muted-foreground">
                    <strong className="text-foreground/90">{line.label}:</strong> {line.value}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Nenhuma informação registrada nesta parte.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-serif text-base">
            <MessageCircleQuestion className="h-4 w-4" />
            Pontos para compreender com Daiane
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {synthesis.questionsForSession.length ? (
            synthesis.questionsForSession.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-lg border border-amber-500/20 bg-background/70 p-3 text-xs"
              >
                <span className="block font-medium capitalize">{item.title}</span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhuma dúvida ou contradição explícita foi registrada. Daiane ainda poderá
              contextualizar estas informações com você.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        As informações acima continuam sendo suas respostas. A interpretação profissional será
        construída separadamente e conversada com você.
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={onBackToHub}>
          Voltar aos capítulos
        </Button>
        {completed ? (
          <Button onClick={onBackToHub}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Síntese lida
          </Button>
        ) : (
          <Button disabled={saving} onClick={complete}>
            Concluir Corpo & Fisiologia
          </Button>
        )}
      </div>
    </div>
  )
}

export default AyurvedaChapter4Flow
