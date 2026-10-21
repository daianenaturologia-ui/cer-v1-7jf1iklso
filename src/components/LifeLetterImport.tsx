import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
import { isLifeLetter } from '@/services/lifeLetter'
export function LifeLetterImport({
  enrollmentId,
  onChoose,
}: {
  enrollmentId: string
  onChoose: (letter: LifeDirection) => void
}) {
  const [values, setValues] = useState<LifeDirection[]>([])
  const [opened, setOpened] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    setOpened(false)
    setValues([])
    setError('')
  }, [enrollmentId])
  async function load() {
    setOpened(true)
    setLoading(true)
    setError('')
    try {
      const records = await lifeDirectionsService.list(enrollmentId)
      setValues(
        records
          .filter(
            (v) =>
              v.enrollment_id === enrollmentId &&
              v.access_class === 'participant_shared' &&
              isLifeLetter(v),
          )
          .sort((a, b) => (b.updated || '').localeCompare(a.updated || '')),
      )
    } catch {
      setError('Não foi possível carregar as cartas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <section
      aria-label="Cartas compartilhadas para o plano"
      className="rounded-xl border p-4 space-y-3"
    >
      <p className="text-sm">
        A carta expressa o que a pessoa deseja cuidar no presente sobre sua história. A meta
        expressa o que deseja construir no futuro. Ambas orientam os objetivos terapêuticos, os
        cuidados e as ações deste plano. Confirmem juntas o que trabalhar agora.
      </p>
      <Button variant="outline" onClick={() => void load()}>
        Trazer carta do meu presente
      </Button>
      {opened &&
        (loading ? (
          <p role="status">Carregando cartas compartilhadas…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : values.length ? (
          values.map((v) => (
            <article key={v.id} className="rounded-xl border p-3 space-y-2">
              <h4 className="font-medium">{v.title}</h4>
              <p className="text-sm whitespace-pre-wrap">{v.narrative}</p>
              <Button
                size="sm"
                onClick={() => {
                  onChoose(v)
                  setOpened(false)
                }}
              >
                Usar esta carta nos objetivos terapêuticos
              </Button>
            </article>
          ))
        ) : (
          <p className="text-sm">
            Ainda não há cartas compartilhadas. A pessoa pode compartilhar sua carta em Meu
            presente; vocês também podem escrever os objetivos juntas no encontro.
          </p>
        ))}
    </section>
  )
}
