import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({resolve:{alias:{'@':path.resolve(process.cwd(),'src')}},test:{environment:'jsdom',setupFiles:['src/test/setup.ts'],include:['src/components/experience/ParticipantIntegrativeMapView.test.tsx','src/services/cerMapReadings.test.ts','src/components/SerConscienciaMap.test.tsx']}})
