import React, { useEffect, useState } from 'react'
import { BookOpen, Leaf, Heart, Moon, Sun, Compass, Flower2, Wind } from 'lucide-react'
import { selfDevelopmentService } from '@/services/selfDevelopment'
import type { DevelopmentResource } from '@/services/developmentCatalog'
import { filterLibrary } from '@/services/libraryMaterial'
import { ResourceMaterial } from './ResourceMaterial'
import { LibraryCommunity } from './LibraryCommunity'
import { LibraryComments } from './LibraryComments'
import { Button } from './ui/button'
import { Input } from './ui/input'
const areas = [
  { id: 'all', label: 'Explorar tudo', icon: BookOpen, words: [] },
  {
    id: 'body',
    label: 'Corpo e Ayurveda',
    icon: Leaf,
    words: ['corpo', 'ayurveda', 'aliment', 'digest', 'fito'],
  },
  {
    id: 'emotion',
    label: 'Mente e emoções',
    icon: Heart,
    words: ['emoc', 'mente', 'eft', 'pnl', 'floral', 'limite', 'apoio', 'rela'],
  },
  {
    id: 'rest',
    label: 'Sono e descanso',
    icon: Moon,
    words: ['sono', 'descanso', 'recuper', 'pausa'],
  },
  {
    id: 'movement',
    label: 'Yoga e movimento',
    icon: Sun,
    words: ['yoga', 'movimento', 'atividade', 'kriya'],
  },
  {
    id: 'breath',
    label: 'Respiração e presença',
    icon: Wind,
    words: ['respira', 'presen', 'mindful', 'medita'],
  },
  { id: 'aroma', label: 'Aromaterapia', icon: Flower2, words: ['aroma', 'oleo', 'óleo'] },
  {
    id: 'meaning',
    label: 'Sentido e trajetória',
    icon: Compass,
    words: ['sentido', 'conex', 'historia', 'história', 'autoconhec', 'valor', 'propósito'],
  },
]
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export function CerPracticeLibrary({
  onAddToPlan,
  addLabel = 'Acrescentar ao plano de cuidado',
}: {
  onAddToPlan?: (r: DevelopmentResource) => void
  addLabel?: string
}) {
  const [curator, setCurator] = useState(false)
  const [resources, setResources] = useState<DevelopmentResource[]>([]),
    [area, setArea] = useState('all'),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('')
  useEffect(() => {
    let active = true
    selfDevelopmentService
      .catalog()
      .then((r) => {
        if (active) {
          setResources(r.resources)
          setError(r.warning || '')
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar os materiais da Biblioteca.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  const selected = areas.find((a) => a.id === area)!
  const visible = filterLibrary(resources, query).filter(
    (r) =>
      area === 'all' || selected.words.some((w) => norm(`${r.theme} ${r.title}`).includes(norm(w))),
  )
  return (
    <section aria-label="Biblioteca CER · práticas e materiais" className="space-y-5">
      <header className="rounded-2xl border bg-primary/5 p-5 space-y-2">
        <p className="text-xs uppercase tracking-widest text-primary">
          Aprender · cuidar · experimentar
        </p>
        <h2 className="font-serif text-2xl">Biblioteca CER</h2>
        <p className="text-sm leading-relaxed">
          A Biblioteca CER está em construção e recebe novos materiais aos poucos. Encontre
          inspiração para cuidar de si e dar vida ao seu plano. Explore as áreas, conheça as
          práticas e converse com Daiane sobre o que faz sentido para seu momento. Este é um acervo
          para consultar os conteúdos que apoiam seu desenvolvimento. O plano de cuidado e a rotina
          são construídos em seus próprios espaços, nos encontros.
        </p>
      </header>
      <div className="rounded-2xl border p-5 space-y-3 text-sm leading-relaxed">
        <h3 className="font-serif text-lg">Da consciência à experiência</h3>
        <p>
          Compreender abre caminho. É ao experimentar, perceber a resposta do corpo e repetir o que
          ajuda que novos modos de viver podem ganhar espaço. Praticar nem sempre é fácil: comece
          pequeno, adapte e retome com gentileza.
        </p>
        <details>
          <summary className="cursor-pointer text-primary min-h-10">
            Um repertório para conversar com seu corpo e suas emoções
          </summary>
          <div className="space-y-3 mt-2">
            <p>
              Em momentos diferentes, você pode precisar de recursos diferentes. Antes de escolher,
              perceba seu corpo e suas emoções; depois, observe se houve mais conforto, presença ou
              espaço para escolher. Use essa resposta para adaptar, repetir ou trocar a prática.
            </p>
            <p>
              Estas são ideias para apoiar sua jornada. Seus próprios hábitos, gestos e descobertas
              também contam: caminhar, cantar, cuidar de uma planta ou outro cuidado que faça
              sentido para você. Leve suas descobertas para os encontros.
            </p>
            <p>
              Consulte os materiais quando precisar. Nos encontros, vocês combinam quais práticas
              integrar ao plano de cuidado e, depois, à rotina no Planner.
            </p>
          </div>
        </details>
      </div>
      <LibraryCommunity onAccess={setCurator} onAddToPlan={onAddToPlan} />
      <div
        role="tablist"
        aria-label="Áreas da Biblioteca CER"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {areas.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.id}
              role="tab"
              type="button"
              tabIndex={a.id === area ? 0 : -1}
              onKeyDown={(e) => {
                const i = areas.findIndex((item) => item.id === area)
                const next =
                  e.key === 'ArrowRight'
                    ? (i + 1) % areas.length
                    : e.key === 'ArrowLeft'
                      ? (i + areas.length - 1) % areas.length
                      : e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? areas.length - 1
                          : -1
                if (next >= 0) {
                  e.preventDefault()
                  setArea(areas[next].id)
                  const tabs =
                    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]',
                    )
                  tabs?.item(next)?.focus()
                }
              }}
              aria-selected={a.id === area}
              aria-controls="cer-library-materials"
              id={`cer-library-${a.id}`}
              onClick={() => setArea(a.id)}
              className={`rounded-2xl border p-4 text-left space-y-2 min-h-24 focus-visible:ring-2 focus-visible:ring-primary ${area === a.id ? 'border-primary bg-primary/10' : 'bg-card hover:bg-primary/5'}`}
            >
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="block text-sm font-medium">{a.label}</span>
            </button>
          )
        })}
      </div>
      <label className="block text-sm space-y-2">
        Buscar uma prática ou material
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Respiração, sono, limites…"
        />
      </label>
      {error && (
        <p role="status" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}
      <div
        role="tabpanel"
        id="cer-library-materials"
        aria-labelledby={`cer-library-${area}`}
        className="grid sm:grid-cols-2 gap-4"
      >
        {loading ? (
          <p role="status">Abrindo a Biblioteca…</p>
        ) : visible.length ? (
          visible.map((r) => (
            <article key={r.id} className="rounded-2xl border overflow-hidden bg-card">
              <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-amber-50 p-5 flex items-center gap-3">
                <selected.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-xs text-primary">
                    {r.theme} · {r.duration}
                  </p>
                  <h3 className="font-serif text-lg">{r.title}</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm leading-relaxed">{r.lesson}</p>
                <details className="text-sm">
                  <summary className="cursor-pointer text-primary min-h-10">
                    Conhecer a prática
                  </summary>
                  <ol className="list-decimal pl-5 space-y-2 mt-3">
                    {r.instructions.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ol>
                  <ResourceMaterial material={r.material} />
                  {r.fallback && <p className="mt-3">Para adaptar: {r.fallback}</p>}
                </details>
                <LibraryComments targetKey={`catalog:${r.id}`} curator={curator} />
                {onAddToPlan && (
                  <Button variant="outline" onClick={() => onAddToPlan(r)}>
                    {addLabel}
                  </Button>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm rounded-xl border p-5">
            {query
              ? 'Nenhum material encontrado para esta busca.'
              : 'Os materiais desta área serão disponibilizados conforme a curadoria de Daiane. Você já pode explorar as outras áreas.'}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground rounded-xl border p-4">
        Em preparação: e-book Linha da Vida — passado, presente e escolhas para o futuro.
      </p>
    </section>
  )
}
