import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/components/experience/ParticipantIntegrativeMapView.test.tsx',
      'src/services/cerMapReadings.test.ts',
      'src/components/SerConscienciaMap.test.tsx',
      'src/components/experience/LifeTimeline.test.tsx',
      'src/components/experience/LifeDirections.test.tsx',
      'src/components/experience/LifeJourney.test.tsx',
      'src/services/lifeTimeline.test.ts',
      'src/services/lifeDirections.test.ts',
      'src/services/lifeDirectionsSources.test.ts',
      'src/services/lifeTimelineBackend.test.ts',
      'src/pages/InteragenteMapProgress.test.tsx',
    ],
  },
})
