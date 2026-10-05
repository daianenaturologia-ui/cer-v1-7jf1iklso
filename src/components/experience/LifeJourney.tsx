import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LifeTimeline } from './LifeTimeline'
import { LifeDirections } from './LifeDirections'

/** One trajectory, three perspectives. Existing records and permissions remain the source. */
export function LifeJourney({ enrollmentId, unlocked, objective }: {
  enrollmentId: string
  unlocked: boolean
  objective?: { title: string; summary: string }
}) {
  return (
    <section className="space-y-5" aria-label="Minha trajetória">
      <div className="cer-reading-panel border bg-card px-5 py-6 sm:px-8">
        <p className="text-xs tracking-widest uppercase text-primary">Minha trajetória</p>
        <h2 className="font-serif text-2xl sm:text-3xl mt-2">Uma história que continua</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">Do nascimento aos caminhos que você deseja construir. Cada marco tem seu lugar; você escolhe por onde contar.</p>
        <svg aria-hidden="true" viewBox="0 0 600 90" className="w-full max-w-2xl h-20 mt-4" fill="none">
          <path d="M25 53C130 36 180 67 285 48S440 39 570 49" stroke="currentColor" className="text-primary" strokeWidth="2" />
          <path d="m556 37 18 12-18 12" stroke="currentColor" className="text-primary" strokeWidth="2" />
          <g stroke="currentColor" className="text-primary" strokeWidth="2"><circle cx="25" cy="53" r="7" fill="var(--timeline-paper, #faf7f2)"/><circle cx="112" cy="46" r="5"/><circle cx="205" cy="54" r="5"/><path d="M308 49c0-12-20-12-20 0 0 19 32 19 32 0 0-29-46-29-46 0 0 39 60 39 60 0"/><circle cx="402" cy="42" r="5"/><circle cx="480" cy="44" r="5"/></g>
          <g fill="currentColor" className="text-muted-foreground" fontSize="12"><text x="5" y="85">Nascimento</text><text x="90" y="20">Passado</text><text x="270" y="85">Presente</text><text x="451" y="20">Futuro</text></g>
        </svg>
      </div>
      <Tabs defaultValue="past">
        <TabsList className="grid grid-cols-3 w-full" aria-label="Momentos da Linha da Vida">
          <TabsTrigger value="past">Passado</TabsTrigger>
          <TabsTrigger value="present">Presente</TabsTrigger>
          <TabsTrigger value="future">Futuro</TabsTrigger>
        </TabsList>
        <TabsContent value="past" className="space-y-4 mt-5">
          <p className="font-serif text-primary text-lg italic">O que passou faz parte da sua história. A forma de se relacionar com essa história pode mudar.</p>
          <LifeTimeline enrollmentId={enrollmentId} unlocked={unlocked} />
        </TabsContent>
        <TabsContent value="present" className="space-y-4 mt-5">
          <p className="font-serif text-primary text-lg italic">É no presente que suas escolhas encontram os caminhos que você deseja construir.</p>
          <details className="rounded-xl border bg-card p-5">
            <summary className="cursor-pointer font-medium text-primary">Objetivo terapêutico combinado</summary>
            <div className="mt-3 space-y-2 text-sm">
              {objective ? <><h3 className="font-semibold">{objective.title}</h3><p className="whitespace-pre-wrap">{objective.summary}</p></> : <p>Seu objetivo terapêutico será construído com sua profissional e aparecerá aqui depois de compartilhado.</p>}
              <p className="text-muted-foreground">Esse objetivo é definido e alterado junto com sua profissional. Se suas necessidades mudarem, leve isso ao próximo encontro. Suas percepções, desejos e pequenos passos podem ser registrados no seu ritmo.</p>
            </div>
          </details>
          <LifeDirections key={`present-${enrollmentId}`} enrollmentId={enrollmentId} unlocked={unlocked} perspective="present" />
        </TabsContent>
        <TabsContent value="future" className="space-y-4 mt-5">
          <p className="font-serif text-primary text-lg italic">O futuro oferece direções; o presente dá espaço ao próximo passo.</p>
          <LifeDirections key={`future-${enrollmentId}`} enrollmentId={enrollmentId} unlocked={unlocked} perspective="future" />
        </TabsContent>
      </Tabs>
    </section>
  )
}
