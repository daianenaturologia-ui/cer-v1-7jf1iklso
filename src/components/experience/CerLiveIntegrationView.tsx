import React from 'react'
import type { CerLiveIntegration } from '@/services/cerLiveIntegration'

export function CerLiveIntegrationView({
  reading,
  loading = false,
  error = false,
}: {
  reading: CerLiveIntegration
  loading?: boolean
  error?: boolean
}) {
  const cross = reading.sections.filter((s) => s.dimensionIds.length > 1)
  const history = reading.sections.filter((s) => s.id.startsWith('history-'))
  return (
    <section
      aria-label="Sua leitura integrada"
      className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-6 space-y-4"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-primary">Dimensões e Linha da Vida em conjunto</p>
        <h3 className="font-serif text-xl sm:text-2xl">Sua leitura integrada</h3>
        <p className="text-xs text-muted-foreground">
          Leitura automática em construção · acompanha seus registros e pode ser aprofundada nos
          encontros.
        </p>
        {reading.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Registros considerados até{' '}
            {new Date(reading.updatedAt).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
            .
          </p>
        )}
      </div>
      {reading.summary ? (
        <div className="text-sm leading-relaxed space-y-3">
          <h4 className="font-semibold">O fio que conecta suas experiências</h4>
          <p>{reading.summary}</p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">
          As informações disponíveis ainda não sustentam uma conexão interpretativa entre dimensões.
          As leituras individuais abaixo ajudam a compreender o que já foi possível reconhecer; a
          integração se amplia conforme surgem relações sustentadas pelos seus registros.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {reading.availableDimensions.length} de 6 dimensões com leitura disponível.
        {reading.missingDimensions.length > 0 &&
          ` Ainda em construção: ${reading.missingDimensions.join(', ')}.`}
      </p>
      {loading ? (
        <p role="status" className="text-sm">
          Atualizando a conexão com a Linha da Vida…
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível atualizar a Linha da Vida. A conexão com sua história pode estar
          incompleta. Reabra o mapa para tentar novamente.
        </p>
      ) : (
        !reading.historyAvailable && (
          <p className="text-sm text-muted-foreground">
            Sua Linha da Vida ainda não acrescentou marcos a esta leitura. A integração das
            dimensões já pode ser consultada e incorporará a história quando houver registros
            disponíveis.
          </p>
        )
      )}
      {(cross.length > 0 || history.length > 0 || reading.priorities.length > 0) && (
        <details className="group border-t border-primary/20 pt-3">
          <summary className="cursor-pointer min-h-[44px] flex items-center font-medium text-sm text-primary">
            Aprofundar minha leitura integrada
          </summary>
          <div className="space-y-5 pt-3 text-sm leading-relaxed">
            {[...cross, ...history].map((section) => (
              <div key={section.id} className="space-y-2">
                <h4 className="font-semibold">{section.title}</h4>
                <p>{section.text}</p>
              </div>
            ))}
            {reading.priorities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Prioridades de cuidado que emergem do conjunto</h4>
                <p>
                  São possibilidades para escolher conforme seu momento e aprofundar com sua
                  profissional.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  {reading.priorities.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  )
}
