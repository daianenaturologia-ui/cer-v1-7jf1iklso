import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/services/developmentPlanDocument.test.ts',
      'src/components/DevelopmentPlanWorkspace.test.tsx',
      'src/components/DevelopmentPlanWorkflow.test.tsx',
      'src/services/selfDevelopment.test.ts',
      'src/services/libraryMaterial.test.ts',
      'src/components/DevelopmentResourceEditor.test.tsx',
      'src/services/selfDevelopmentServer.test.ts',
      'src/components/SelfDevelopmentJourney.test.tsx',
      'src/components/SelfDevelopmentPlannerPage.test.tsx',
      'src/services/developmentEnrollment.test.ts',
    ],
  },
})
