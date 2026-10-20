import React, { useEffect, useState } from 'react'
import type { ExperienceResponseRecord } from '@/types/cer'
import type { CerMapReadingSnapshot } from '@/types/cerMapReadings'
import {
  buildCerMapReadings,
  CER_READING_DIMENSIONS,
  isCerMapReadingSnapshot,
} from '@/services/cerMapReadings'
import { cerMapService } from '@/services/cerMapService'
import { experienceResponseService } from '@/services/experienceEngine'
import { cerEvolutionBrief } from '@/services/cerEvolutionBrief'
import { LifeTimeline } from './LifeTimeline'
import { Button } from '@/components/ui/button'

export function EvolutionMapConversation({
  enrollmentId,
  participantName = 'Você',
  responses,
  readOnly = false,
}: {
  enrollmentId: string
  participantName?: string
  responses?: ExperienceResponseRecord[]
  readOnly?: boolean
}) {
  const [state, setState] = useState<{
    id: string
    snapshot: CerMapReadingSnapshot | null
    published: boolean
    error: boolean
  }>({ id: '', snapshot: null, published: false, error: false })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setState({ id: '', snapshot: null, published: false, error: false })
    const load = async () => {
      try {
        const map = await cerMapService.getCurrentPublishedMap(enrollmentId)
        if (map && map.enrollment_id !== enrollmentId) throw new Error('Mapa de outra pessoa')
        let snapshot: CerMapReadingSnapshot
        const published =
          map?.status === 'published' && isCerMapReadingSnapshot(map.reading_snapshot)
        if (published) snapshot = map.reading_snapshot as CerMapReadingSnapshot
        else {
          const records =
            responses ??
            (
              await Promise.all(
                CER_READING_DIMENSIONS.map((d) =>
                  experienceResponseService.listResponsesByExperience(enrollmentId, d.experienceId),
                ),
              )
            ).flat()
          snapshot = buildCerMapReadings(records, enrollmentId, participantName)
        }
        if (active) setState({ id: enrollmentId, snapshot, published: !!published, error: false })
      } catch {
        if (active) setState({ id: enrollmentId, snapshot: null, published: false, error: true })
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [enrollmentId, participantName, responses, retry])
  const brief =
    state.id === enrollmentId && state.snapshot ? cerEvolutionBrief(state.snapshot) : null
  return (
    <section className="space-y-5" aria-label="História no Mapa CER">
      <p className="text-sm leading-relaxed">
        Este retrato breve e os marcos abaixo apoiam a conversa com Daiane. Juntas, vocês podem
        explorar como as experiências podem ter participado dos modos de proteção, dos vínculos, da
        intimidade e do sentido da vida. As relações serão compreendidas na conversa.
      </p>
      {state.id !== enrollmentId ? (
        <p role="status">Organizando o resumo do Mapa CER…</p>
      ) : state.error ? (
        <p role="alert">
          Não foi possível carregar o resumo.{' '}
          <Button variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </Button>
        </p>
      ) : (
        brief && (
          <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <h3 className="font-serif text-xl">Meu Mapa CER em poucas palavras</h3>
              <span className="text-xs text-muted-foreground">
                {state.published ? 'Versão publicada' : 'Leitura atual das dimensões'}
              </span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-primary/5 p-3">
                <dt className="text-xs font-semibold">Dosha</dt>
                <dd className="mt-1 text-sm">
                  {brief.dosha}
                  {brief.currentDosha && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Momento atual: {brief.currentDosha}
                    </span>
                  )}
                </dd>
              </div>
              <div className="rounded-xl bg-primary/5 p-3">
                <dt className="text-xs font-semibold">Agni</dt>
                <dd className="mt-1 text-sm">
                  {brief.agni}
                  {brief.agniDetail && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {brief.agniDetail}
                    </span>
                  )}
                </dd>
              </div>
              <div className="rounded-xl bg-primary/5 p-3">
                <dt className="text-xs font-semibold">Ama</dt>
                <dd className="mt-1 text-sm">{brief.ama}</dd>
              </div>
            </dl>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm">Padrões de proteção · até 3 em destaque</h4>
                <p className="text-sm mt-1">
                  {brief.protection.join(' · ') || 'Ainda sem padrões destacados nas respostas.'}
                </p>
                {brief.protectionTie && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Há outros padrões com a mesma intensidade. Estes três são um ponto de partida
                    para a conversa.
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  Padrões de sobrevivência · até 2 em destaque
                </h4>
                <p className="text-sm mt-1">
                  {brief.survival.join(' · ') || 'Ainda sem reações identificadas nas respostas.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  São as reações que você destacou; o questionário não mede a intensidade entre
                  elas.
                </p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Forma de se relacionar</dt>
                <dd className="mt-1">{brief.relationships}</dd>
              </div>
              <div>
                <dt className="font-semibold">Sexualidade</dt>
                <dd className="mt-1">{brief.sexuality}</dd>
              </div>
              <div>
                <dt className="font-semibold">Conexão</dt>
                <dd className="mt-1">{brief.connection}</dd>
              </div>
            </dl>
          </div>
        )
      )}
      <LifeTimeline key={enrollmentId} enrollmentId={enrollmentId} readOnly={readOnly} />
    </section>
  )
}
