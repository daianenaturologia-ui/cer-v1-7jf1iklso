import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    include: [
      'src/services/weeklyAgenda.test.ts',
      'src/services/plannerNotesServer.test.ts',
      'src/services/plannerNotes.test.ts',
      'src/components/WeeklyAgenda.test.tsx',
      'src/components/SelfDevelopmentJourney.test.tsx',
      'src/components/SelfDevelopmentPlannerPage.test.tsx',
    ],
  },
})
