import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/components/MandalaStructuredView.test.tsx',
      'src/components/WeeklyAgenda.test.tsx',
      'src/components/SelfDevelopmentPlannerPage.test.tsx',
    ],
  },
})
