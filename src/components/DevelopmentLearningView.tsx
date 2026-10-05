import React, { useEffect, useState } from 'react'
import { selfDevelopmentService, type DevelopmentExperiment } from '@/services/selfDevelopment'
import { Button } from '@/components/ui/button'
export function DevelopmentLearningView({ enrollmentId }: { enrollmentId: string }) {
  const [records, setRecords] = useState<DevelopmentExperiment[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    setRecords([])
    setError(false)
    setLoading(true)
    selfDevelopmentService
      .list(enrollmentId)
      .then((values) => {
        if (active) setRecords(values.filter((r) => r.reflection.trim()).slice(0, 5))
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [enrollmentId, revision])
  return (
    <section
      className="rounded-xl border p-4 space-y-3"
      aria-label="Aprendizados do desenvolvimento"
    >
      <h2 className="font-serif text-lg">Aprendizados que a experiência trouxe</h2>
      <p className="text-sm text-muted-foreground">
        Leitura dos registros feitos na Evolução. As palavras de quem viveu a experiência permanecem
        como foram escritas.
      </p>
      {loading ? (
        <p role="status">Carregando aprendizados…</p>
      ) : error ? (
        <p role="alert">
          Não foi possível carregar estes registros.{' '}
          <Button size="sm" variant="outline" onClick={() => setRevision((v) => v + 1)}>
            Tentar novamente
          </Button>
        </p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Os aprendizados aparecem depois de uma revisão na Evolução.
        </p>
      ) : (
        records.map((r) => (
          <article key={r.id} className="rounded-lg border p-3 text-sm space-y-1">
            <h3 className="font-semibold">{r.action}</h3>
            <p className="whitespace-pre-wrap">{r.reflection}</p>
            {r.next_step && <p className="whitespace-pre-wrap">Próximo ajuste: {r.next_step}</p>}
            <span className="text-xs text-muted-foreground">
              Origem: revisão do recurso “{r.resource_snapshot.title}” ·{' '}
              {r.access_class === 'participant_shared' ? 'Compartilhado' : 'Só meu'}
            </span>
          </article>
        ))
      )}
    </section>
  )
}
