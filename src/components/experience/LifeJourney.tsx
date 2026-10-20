import React from 'react'
import { LIFE_JOURNEY_COPY } from '@/services/lifeJourneyCopy'
import { LifeIntegrationGame } from './LifeIntegrationGame'
import { Button } from '@/components/ui/button'
import { LifeTimeline } from './LifeTimeline'
import { LifeDirections } from './LifeDirections'
import { CerArtStrip } from '@/components/CerArtwork'
import { JOURNEY_MOMENTS, type JourneyMoment } from '@/services/participantJourney'

const labels: Record<JourneyMoment, string> = {
  past: 'Minha história',
  map: 'História no Mapa CER',
  present: 'Meu presente',
  future: 'Direções para o futuro',
  care: 'Equilíbrio & Realização',
}
export function LifeJourney({
  enrollmentId,
  unlocked,
  objective,
  moment = 'past',
  onMomentChange,
  onOpenMap,
  onOpenCare,
}: {
  enrollmentId: string
  unlocked: boolean
  objective?: { title: string; summary: string }
  moment?: JourneyMoment
  onMomentChange?: (moment: JourneyMoment) => void
  onOpenMap?: () => void
  onOpenCare?: () => void
}) {
  const index = JOURNEY_MOMENTS.indexOf(moment)
  const reflection =
    moment === 'past'
      ? LIFE_JOURNEY_COPY.past
      : moment === 'present'
        ? LIFE_JOURNEY_COPY.present
        : moment === 'future'
          ? LIFE_JOURNEY_COPY.future
          : undefined
  return (
    <section className="space-y-5" aria-label="Minha trajetória">
      <div className="cer-reading-panel border bg-card px-5 py-6 sm:px-8">
        <CerArtStrip variant="path" compact />
        <p className="text-xs tracking-widest uppercase text-primary">3. Evolução</p>
        <h2 className="font-serif text-2xl mt-2">Uma história que continua</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Conheça sua história, aproxime-a do seu funcionamento e, depois, olhe para a vida que
          deseja construir.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5" aria-label="Percurso da Evolução">
          {JOURNEY_MOMENTS.map((item, i) => (
            <li key={item}>
              <Button
                variant={item === moment ? 'default' : 'outline'}
                className="h-auto min-h-12 w-full whitespace-normal text-left justify-start rounded-xl p-3 text-xs"
                aria-current={item === moment ? 'step' : undefined}
                disabled={!unlocked}
                onClick={() => {
                  onMomentChange?.(item)
                  if (item === 'map') onOpenMap?.()
                  if (item === 'care') onOpenCare?.()
                }}
              >
                {i + 1}. {labels[item]}
              </Button>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-3">
          Seu ponto de retomada fica salvo neste navegador. Seus relatos continuam nos respectivos
          registros.
        </p>
      </div>
      {reflection && unlocked && (
        <div className="rounded-2xl border bg-primary/5 p-5 space-y-3">
          <h3 className="font-serif text-xl">{reflection.title}</h3>
          <p className="text-sm leading-relaxed">{reflection.text}</p>
          {moment === 'past' && (
            <details className="text-sm">
              <summary className="cursor-pointer text-primary">
                A infância como terreno da vida · inspiração em Lya Luft
              </summary>
              <p className="mt-3 leading-relaxed">{LIFE_JOURNEY_COPY.past.inspiration}</p>
            </details>
          )}
          {moment === 'future' && (
            <p className="text-sm leading-relaxed">{LIFE_JOURNEY_COPY.future.focus}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Para aprofundar: e-book Linha da Vida · em preparação para a Biblioteca CER.
          </p>
        </div>
      )}
      {!unlocked ? (
        <p className="rounded-xl border p-4 text-sm">
          Conclua as seis dimensões da Consciência antes de iniciar este percurso.
        </p>
      ) : (
        <>
          <h3 className="font-serif text-xl">{labels[moment]}</h3>
          {moment === 'past' && (
            <>
              <p className="text-sm">
                Conte os marcos que ajudam a compreender sua história, começando pela infância se
                fizer sentido. Como você se sentia? Do que precisava? Que apoios encontrou e como
                aprendeu a se proteger? Você pode pausar e conversar com Daiane.
              </p>
              <LifeTimeline enrollmentId={enrollmentId} unlocked={unlocked} />
              <p className="text-xs text-muted-foreground">
                Não precisa recordar tudo. Você pode voltar e acrescentar outros acontecimentos
                depois.
              </p>
              <Button onClick={() => onMomentChange?.('map')}>
                Concluir o passado por agora e voltar ao Mapa CER
              </Button>
            </>
          )}
          {moment === 'map' && (
            <>
              <p className="text-sm">
                Vamos aproximar os acontecimentos e sentimentos da sua história dos padrões que você
                reconheceu na Consciência. Essas conexões serão compreendidas e revistas com Daiane,
                sem concluir automaticamente que um acontecimento causou um padrão.
              </p>
              <Button onClick={onOpenMap}>Integrar minha história ao Mapa CER</Button>
              <p className="text-xs text-muted-foreground">
                Abra o mapa antes de seguir para o presente. Sua história permanece disponível para
                revisão.
              </p>
            </>
          )}
          {moment === 'present' && (
            <>
              <p className="text-sm">
                À luz do que compreendeu sobre si, como está sua vida hoje? O que está pesando, o
                que sustenta você e o que pede cuidado?
              </p>
              <LifeDirections
                key={`present-${enrollmentId}`}
                enrollmentId={enrollmentId}
                unlocked={unlocked}
                perspective="present"
              />
              <Button onClick={() => onMomentChange?.('future')}>
                Continuar para minhas direções futuras
              </Button>
            </>
          )}
          {moment === 'future' && (
            <>
              <p className="text-sm">
                Liste seus desejos, escolha uma meta principal e imagine as ações que podem
                aproximar você dela. Os cuidados e a rotina serão combinados com Daiane nas sessões.
              </p>
              <LifeDirections
                key={`future-${enrollmentId}`}
                enrollmentId={enrollmentId}
                unlocked={unlocked}
                perspective="future"
                planning
                enableActions={false}
              />
              <Button onClick={() => onMomentChange?.('care')}>
                Levar minhas direções para Equilíbrio & Realização
              </Button>
            </>
          )}
          {moment === 'care' && (
            <>
              <p className="text-sm">
                Você já percorreu a história, o mapa, o presente e as direções futuras. Agora,
                Daiane prepara um plano de cuidado para sustentar seu equilíbrio e sua meta. Nas
                sessões, vocês ajustam a proposta, combinam as ações e distribuem o que faz sentido
                na rotina do Planner.
              </p>
              {objective && (
                <details className="rounded-xl border p-4">
                  <summary>Objetivo terapêutico combinado</summary>
                  <h4 className="mt-3 font-medium">{objective.title}</h4>
                  <p>{objective.summary}</p>
                </details>
              )}
              <LifeIntegrationGame enrollmentId={enrollmentId} />
              <Button onClick={onOpenCare}>Ir para Equilíbrio & Realização</Button>
            </>
          )}
          {index > 0 && (
            <Button variant="outline" onClick={() => onMomentChange?.(JOURNEY_MOMENTS[index - 1])}>
              Voltar: {labels[JOURNEY_MOMENTS[index - 1]]}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
