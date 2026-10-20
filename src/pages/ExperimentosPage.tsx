import React from 'react'
import { JourneyNavigation } from '@/components/JourneyNavigation'
import { CerPracticeLibrary } from '@/components/CerPracticeLibrary'

export const ExperimentosPage: React.FC = () => (
  <main className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <h1 className="text-xl font-serif font-bold">Biblioteca CER · Acervo</h1>
        <JourneyNavigation />
      </header>
      <CerPracticeLibrary />
    </div>
  </main>
)
export default ExperimentosPage
