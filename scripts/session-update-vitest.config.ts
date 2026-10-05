import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/services/sessionMapUpdate.test.ts',
      'src/services/sessionMapUpdateBackend.test.ts',
      'src/services/cerSessionPersistence.test.ts',
      'src/components/SessionMapUpdate.test.tsx',
      'src/components/ProfessionalSessionManager.test.tsx',
      'src/services/cerMapReadings.test.ts',
      'src/components/experience/ParticipantIntegrativeMapView.test.tsx',
    ],
  },
})
