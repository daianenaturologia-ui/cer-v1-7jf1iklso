import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    include: [
      'src/services/selfDevelopment.test.ts',
      'src/services/selfDevelopmentServer.test.ts',
      'src/components/SelfDevelopmentJourney.test.tsx',
      'src/components/SelfDevelopmentPlannerPage.test.tsx',
      'src/services/developmentEnrollment.test.ts',
    ],
  },
})
