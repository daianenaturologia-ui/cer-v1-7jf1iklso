import React from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import {
  CARE_AREAS,
  addCareAction,
  isCareChapter,
  updateCareAction,
} from '@/services/integrativePlan'
import type { PlanDocument } from '@/services/developmentPlanDocument'
import type { DevelopmentResource } from '@/services/developmentCatalog'

export function IntegrativeCareComposer({
  document,
  onChange,
  resources,
  onLoadResources,
}: {
  document: PlanDocument
  onChange: (doc: PlanDocument) => void
  resources: DevelopmentResource[]
  onLoadResources: () => void
}) {
  const care = document.goals.find(isCareChapter)
  return (
    <section
      aria-label="Plano de cuidado integrativo"
      className="rounded-2xl bg-primary/5 border border-primary/20 p-4 sm:p-6 space-y-4"
    >
      <h3 className="font-serif text-xl">1. Cuidar do equilíbrio para sustentar a vida e a meta</h3>
      <p className="text-sm leading-relaxed">
        Prepare as orientações a partir do Mapa CER, das seis dimensões e da avaliação individual. O
        cuidado é parte do caminho: a pessoa pode avançar enquanto recupera recursos, sem precisar
        esperar um equilíbrio perfeito. Acrescente somente o que fizer sentido para este caso;
        depois, combinem o que cabe na rotina.
      </p>
      <div className="flex flex-wrap gap-2">
        {CARE_AREAS.map((area) => (
          <Button
            key={area.title}
            variant="outline"
            size="sm"
            disabled={(care?.actions.length || 0) >= 12}
            onClick={() => onChange(addCareAction(document, area.title))}
          >
            {area.title}
          </Button>
        ))}
      </div>
      {!care?.actions.length && (
        <p className="text-sm text-muted-foreground">
          Escolha uma área acima para escrever sua orientação. Nada é prescrito automaticamente.
        </p>
      )}
      {care?.actions.map((action) => (
        <div key={action.id} className="rounded-xl bg-card border p-4 space-y-3">
          <label className="block space-y-1 text-sm">
            Cuidado proposto
            <Input
              maxLength={5000}
              value={action.title}
              onChange={(e) =>
                onChange(updateCareAction(document, action.id, { title: e.target.value }))
              }
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span>Orientação individual · como, quanto e por quanto tempo</span>
            <Textarea
              rows={5}
              maxLength={5000}
              value={action.context}
              onChange={(e) =>
                onChange(updateCareAction(document, action.id, { context: e.target.value }))
              }
              placeholder={
                CARE_AREAS.find((a) => a.title === action.title)?.hint ||
                'Descreva o cuidado individual e como acompanhar sua resposta.'
              }
            />
          </label>
          <label className="block space-y-1 text-sm">
            Adaptações e cuidados para praticar com segurança
            <Textarea
              maxLength={5000}
              value={action.fallback}
              onChange={(e) =>
                onChange(updateCareAction(document, action.id, { fallback: e.target.value }))
              }
            />
          </label>
          <details>
            <summary className="cursor-pointer text-sm text-primary" onClick={onLoadResources}>
              Vincular prática ou material da Biblioteca
            </summary>
            <label className="block mt-2 text-sm">
              Recurso para este cuidado
              <select
                className="w-full block p-2 rounded border bg-background"
                value={action.resource?.id || ''}
                onChange={(e) =>
                  onChange(
                    updateCareAction(document, action.id, {
                      resource: resources.find((r) => r.id === e.target.value),
                    }),
                  )
                }
              >
                <option value="">Sem material vinculado</option>
                {action.resource && !resources.some((r) => r.id === action.resource!.id) && (
                  <option value={action.resource.id}>{action.resource.title}</option>
                )}
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
          </details>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...document,
                goals: document.goals
                  .map((g) =>
                    isCareChapter(g)
                      ? { ...g, actions: g.actions.filter((a) => a.id !== action.id) }
                      : g,
                  )
                  .filter((g) => !isCareChapter(g) || g.actions.length > 0),
              })
            }
          >
            Retirar este cuidado do rascunho
          </Button>
        </div>
      ))}
    </section>
  )
}
