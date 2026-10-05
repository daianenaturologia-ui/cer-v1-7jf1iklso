import { LIFE_HORIZONS } from '@/services/lifeDirections'
import { lifeTimeLabel } from '@/services/lifeTimeline'
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CerMapReadingSnapshot, CerMapReadingRow } from '@/types/cerMapReadings'

function Rows({ rows }: { rows: CerMapReadingRow[] }) {
  return rows.length ? (
    <dl className="space-y-3">
      {rows.map((row, index) => (
        <div key={index}>
          <dt className="text-sm font-medium">{row.label}</dt>
          <dd className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {row.text}
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className="text-sm text-muted-foreground">
      Ainda não há respostas compartilhadas suficientes para esta leitura.
    </p>
  )
}

export function CerMapReadingsView({ snapshot }: { snapshot: CerMapReadingSnapshot }) {
  const [depth, setDepth] = useState('resumida')
  const deep = depth === 'aprofundada'
  return (
    <div className="space-y-5" data-testid="cer-map-readings">
      <div className="space-y-3">
        <h2 className="font-serif text-xl">Meu Mapa CER</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {snapshot.overview}
        </p>
        <Tabs value={depth} onValueChange={setDepth}>
          <TabsList className="grid grid-cols-2 w-full sm:max-w-md">
            <TabsTrigger value="resumida">Versão resumida</TabsTrigger>
            <TabsTrigger value="aprofundada">Versão aprofundada</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {deep
            ? 'Suas respostas em detalhe, explicações e a leitura construída em conversa.'
            : 'Um panorama das seis dimensões, com explicações para compreender cada leitura.'}
        </p>
      </div>
      <div className={deep ? 'space-y-4' : 'grid gap-4 md:grid-cols-2'}>
        {snapshot.dimensions.map((dimension) => (
          <Card
            key={dimension.id}
            className="shadow-none"
            data-testid={`cer-reading-${dimension.id}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base">{dimension.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dimension.summary && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{dimension.summary}</p>
              )}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {dimension.id === 'corpo'
                    ? 'Respostas e hipóteses do percurso'
                    : 'O que você compartilhou'}
                </h3>
                <Rows rows={deep ? dimension.detailedRows : dimension.summaryRows} />
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                <h3 className="text-sm font-semibold">Como compreender esta dimensão</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dimension.explanation}
                </p>
              </div>
              {deep && dimension.interpretation && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Leitura revisada com a profissional</h3>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {dimension.interpretation}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Referências:{' '}
                {dimension.referenceIds
                  .map(
                    (id) =>
                      snapshot.references
                        .find((reference) => reference.id === id)
                        ?.citation.split('. ')[0],
                  )
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {snapshot.integration && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">Leitura integrada do meu funcionamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{snapshot.integration}</p>
            <p className="text-xs text-muted-foreground mt-3">Esta compreensão apoia suas escolhas. Na Evolução, você e sua profissional definem o futuro e constroem o plano de ação juntos.</p>
          </CardContent>
        </Card>
      )}
      {!!snapshot.lifeDirections?.length && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">Presente e direções futuras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Registros compartilhados para esta versão. Desejos e horizontes podem mudar ao longo
              do cuidado.
            </p>
            {snapshot.lifeDirections.map((value) => (
              <div key={value.id} className="space-y-1">
                <p className="text-sm font-medium">
                  {value.title} · {LIFE_HORIZONS[value.horizon]}
                </p>
                {!deep && value.first_step && (
                  <p className="text-sm whitespace-pre-wrap">
                    Pequeno passo possível: {value.first_step}
                  </p>
                )}
                {deep && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Registro de{' '}
                      {value.created
                        ? new Date(value.created).toLocaleDateString('pt-BR')
                        : 'data não informada'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{value.narrative}</p>
                    {(
                      [
                        ['meaning', 'Sentido e propósito'],
                        ['resources', 'Recursos e apoios'],
                        ['limits', 'Limites e necessidades'],
                        ['first_step', 'Pequeno passo possível'],
                      ] as const
                    ).map(
                      ([field, label]) =>
                        value[field] && (
                          <p key={field} className="text-sm whitespace-pre-wrap">
                            <strong>{label}: </strong>
                            {value[field]}
                          </p>
                        ),
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {!!snapshot.lifeEvents?.length && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">Acontecimentos da sua história</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              São os relatos que você compartilhou para esta versão. Uma experiência pode participar
              do seu funcionamento sem ser sua única causa.
            </p>
            {snapshot.lifeEvents.map((event) => (
              <div key={event.id}>
                <p className="text-sm font-medium">
                  {event.title} · {lifeTimeLabel(event)}
                </p>
                {deep && (
                  <>
                    <p className="text-sm text-muted-foreground">{event.emotions.join(' · ')}</p>
                    <p className="text-sm whitespace-pre-wrap">{event.narrative}</p>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {!!snapshot.lifeConnections?.length && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">
              Relações exploradas com sua profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              São hipóteses revisadas para compreender sua experiência, sem afirmar uma causa única
              ou definir quem você é.
            </p>
            {snapshot.lifeConnections.map((connection, index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm whitespace-pre-wrap">{connection.text}</p>
                {deep && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      História:{' '}
                      {snapshot.lifeEvents?.find((e) => e.id === connection.eventId)?.title} ·
                      Resposta:{' '}
                      {
                        snapshot.dimensions
                          .flatMap((d) => d.detailedRows)
                          .find((row) => row.sourceResponseId === connection.responseId)?.label
                      }
                    </p>
                    {connection.question && (
                      <p className="text-sm">Para investigar em conversa: {connection.question}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {(deep || snapshot.history) && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-serif">
              Sua história e seu funcionamento hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed">
            <p>
              {snapshot.history ||
                'A relação entre sua história e seu funcionamento ainda será aprofundada em conversa e na Linha da Vida. As respostas das dimensões não permitem afirmar como um padrão se formou.'}
            </p>
            <p className="text-muted-foreground">
              Tendências pessoais, experiências e contexto atual podem participar desse retrato.
              Prakriti e Vikriti são leituras ayurvédicas, e não equivalências diretas entre
              genética e história de vida.
            </p>
          </CardContent>
        </Card>
      )}
      <details className="rounded-xl border p-4" open={deep}>
        <summary className="cursor-pointer text-sm font-semibold">
          Referências e fundamentos desta leitura
        </summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Estas fontes explicam os conceitos utilizados. As respostas são suas; a interpretação
          individual foi revisada pela profissional. Pesquisa, tradição e conteúdo autoral têm
          alcances diferentes.
        </p>
        <ol className="mt-4 space-y-4 list-decimal pl-5">
          {snapshot.references.map((reference) => (
            <li key={reference.id} className="text-sm space-y-1">
              <p>
                {reference.url && /^https:\/\//.test(reference.url) ? (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {reference.citation}
                  </a>
                ) : (
                  reference.citation
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {reference.kind} · {reference.scope}
              </p>
            </li>
          ))}
        </ol>
      </details>
      <p className="text-xs text-muted-foreground">
        Você pode reconhecer, discordar ou trazer outra experiência para a conversa. Este mapa não é
        um diagnóstico nem um destino fixo.
      </p>
    </div>
  )
}
