import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/services/onboardingCompletion.test.ts',
      'src/components/OnboardingFlow.test.tsx',
      'src/services/liveQuestionnaire.test.ts',
      'src/components/ProfessionalJourneySummary.test.tsx',
      'src/components/ProfessionalConscienciaNavigation.test.tsx',
    ],
  },
})
