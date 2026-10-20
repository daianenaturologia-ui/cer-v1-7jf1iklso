import React, { useState } from 'react'
import { CerPracticeLibrary } from './CerPracticeLibrary'
import { SelfDevelopmentJourney } from './SelfDevelopmentJourney'
import { libraryCareResource } from '@/services/carePlanFlow'
import type { DevelopmentResource } from '@/services/developmentCatalog'
export function PersonalPracticeLibrary({ enrollmentId }: { enrollmentId: string }) {
  const [choice, setChoice] = useState<DevelopmentResource | null>(null)
  return (
    <div className="space-y-6">
      <CerPracticeLibrary
        addLabel="Quero experimentar esta prática"
        onAddToPlan={(r) => setChoice(libraryCareResource(r))}
      />
      <section className="rounded-2xl border p-4 space-y-3">
        <h3 className="font-serif text-xl">Meu repertório de cuidado</h3>
        <p className="text-sm">
          Você pode escolher uma ideia da Biblioteca ou registrar um cuidado que já criou e sabe que
          ajuda. Suas práticas pessoais ficam identificadas como escolhas suas; as orientações de
          tratamento são combinadas com Daiane.
        </p>
        <SelfDevelopmentJourney
          key={enrollmentId}
          enrollmentId={enrollmentId}
          carePlan
          initialCareResource={choice}
          onCareResourceOpened={() => setChoice(null)}
        />
      </section>
    </div>
  )
}
