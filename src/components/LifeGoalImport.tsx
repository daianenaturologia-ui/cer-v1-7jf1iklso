import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { lifeDirectionsService, type LifeDirection } from '@/services/lifeDirections'
export function LifeGoalImport({
  enrollmentId,
  onChoose,
}: {
  enrollmentId: string
  onChoose: (goal: LifeDirection) => void
}) {
  const [values, setValues] = useState<LifeDirection[]>([]),
    [opened, setOpened] = useState(false),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false)
  useEffect(() => {
    setValues([])
    setOpened(false)
    setError('')
  }, [enrollmentId])
  async function load() {
    setLoading(true)
    setError('')
    setOpened(true)
    try {
      const records = await lifeDirectionsService.list(enrollmentId)
      setValues(
        records
          .filter(
            (v) =>
              v.enrollment_id === enrollmentId &&
              v.kind === 'future' &&
              v.access_class === 'participant_shared',
          )
          .sort((a, b) => (b.updated || '').localeCompare(a.updated || '')),
      )
    } catch {
      setError(
        'Não foi possível carregar as metas. Você pode escrever o que combinaram no encontro.',
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm">
        A meta pertence à interagente. Traga o que ela compartilhou na Linha da Vida e confirmem
        juntas qual será o foco; as ações abaixo serão ajustadas na conversa.
      </p>
      <Button variant="outline" onClick={() => void load()}>
        Trazer meta da Linha da Vida
      </Button>
      {opened && (
        <>
          {loading ? (
            <p role="status">Carregando metas compartilhadas…</p>
          ) : values.length ? (
            values.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">{v.title}</p>
                {v.meaning && <p className="text-sm">{v.meaning}</p>}
                {v.first_step && <p className="text-sm">Primeira ação imaginada: {v.first_step}</p>}
                <Button
                  size="sm"
                  onClick={() => {
                    onChoose(v)
                    setOpened(false)
                  }}
                >
                  Usar esta meta no plano
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm">
              Ainda não há metas futuras compartilhadas. A interagente pode compartilhar sua escolha
              ou vocês podem registrá-la no encontro.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
