import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/components/experience/MyNextStepWizard.test.tsx',
      'src/components/experience/LifeDirections.test.tsx',
      'src/services/lifeDirections.test.ts',
      'src/services/developmentPlanning.test.ts',
      'src/components/experience/GoalRoadmapPlanner.test.tsx',
      'src/services/goalRoadmap.test.ts',
    ],
  },
})
