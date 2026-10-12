import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/components/experience/ayurveda/AyurvedaChapter4Progress.test.tsx',
      'src/services/pilotSimulation.test.ts',
      'src/components/ProfessionalJourneySummary.test.tsx',
      'src/services/cerMindConversation.test.ts',
      'src/services/cerFunctionalReading.test.ts',
      'src/services/cerPersonalReadings.test.ts',
      'src/services/cerMapReadings.test.ts',
      'src/components/experience/LifeTimeline.test.tsx',
      'src/components/experience/LifeDirections.test.tsx',
      'src/services/lifeTimeline.test.ts',
      'src/services/lifeDirections.test.ts',
      'src/services/demoPracticeFlow.test.ts',
      'src/components/DemoExperimentCard.test.tsx',
      'src/components/ProfessionalConscienciaNavigation.test.tsx',
      'src/components/experience/ProfessionalExperienceManager.test.tsx',
    ],
  },
})
